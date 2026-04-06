import OpenAI from "openai";
import { Worker, type Job } from "bullmq";
import { prisma } from "@ids/db";
import {
  AI_QUEUE_IMAGE_ANALYSIS,
  AI_QUEUE_VECTOR_EMBEDDING,
  type ImageAnalysisJobData,
  type VectorEmbeddingJobData,
} from "@ids/types";
import { env } from "../config.js";
import { connection } from "../lib/redis.js";
import { trackCost } from "../lib/costTracker.js";
import { vectorEmbeddingQueue } from "../queues/index.js";

const MODEL = "gpt-4o";

const SYSTEM_PROMPT =
  "You are an interior design image analyzer. Analyze this image and return JSON: " +
  '{ "tags": string[], "primaryStyle": string, "colors": string[], "mood": string, "materials": string[] }. ' +
  "Return only valid JSON with no markdown or additional commentary.";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

async function processImageAnalysis(
  job: Job<ImageAnalysisJobData>,
): Promise<void> {
  const { tenantId, projectId, assetId, imageUrl, filename } = job.data;

  let rawContent: string;
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: imageUrl, detail: "auto" },
            },
            {
              type: "text",
              text: `Analyze this interior design image. Filename: ${filename}`,
            },
          ],
        },
      ],
    });

    rawContent = response.choices[0]?.message?.content ?? "";
    inputTokens = response.usage?.prompt_tokens ?? 0;
    outputTokens = response.usage?.completion_tokens ?? 0;
  } catch (err) {
    console.error(`[imageAnalysis] OpenAI API error on job ${job.id}:`, err);
    throw err; // allow BullMQ to retry
  }

  // Parse JSON — fall back to raw text if parsing fails
  let parsed: {
    tags?: string[];
    primaryStyle?: string;
    colors?: string[];
    mood?: string;
    materials?: string[];
    raw?: string;
  };
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    console.warn(
      `[imageAnalysis] JSON parse failed for job ${job.id}, storing raw text`,
    );
    parsed = { raw: rawContent };
  }

  const insight = await prisma.aIInsight.create({
    data: {
      tenantId,
      projectId,
      assetId,
      type: "style_match",
      body: JSON.stringify({
        tags: parsed.tags ?? [],
        primaryStyle: parsed.primaryStyle ?? "",
        colors: parsed.colors ?? [],
        mood: parsed.mood ?? "",
        materials: parsed.materials ?? [],
      }),
      metadata: {
        model: MODEL,
        filename,
      },
    },
  });

  // Build a rich text description for vector embedding
  const embeddingText = [
    parsed.primaryStyle ? `Style: ${parsed.primaryStyle}` : null,
    parsed.mood ? `Mood: ${parsed.mood}` : null,
    parsed.tags?.length ? `Tags: ${parsed.tags.join(", ")}` : null,
    parsed.colors?.length ? `Colors: ${parsed.colors.join(", ")}` : null,
    parsed.materials?.length ? `Materials: ${parsed.materials.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join(". ");

  if (embeddingText.length > 0) {
    const embeddingJobData: VectorEmbeddingJobData = {
      tenantId,
      projectId,
      assetId,
      text: embeddingText,
    };
    await vectorEmbeddingQueue.add("embed-asset", embeddingJobData);
  }

  await trackCost({
    tenantId,
    projectId,
    jobType: AI_QUEUE_IMAGE_ANALYSIS,
    model: MODEL,
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
  });

  console.info(
    `[imageAnalysis] job ${job.id} completed, insight ${insight.id} created`,
  );
}

export const imageAnalysisWorker = new Worker<ImageAnalysisJobData>(
  AI_QUEUE_IMAGE_ANALYSIS,
  processImageAnalysis,
  {
    connection,
    concurrency: env.WORKER_CONCURRENCY,
  },
);

imageAnalysisWorker.on("completed", (job) => {
  console.info(`[imageAnalysis] job ${job.id} completed`);
});

imageAnalysisWorker.on("failed", (job, err) => {
  console.error(`[imageAnalysis] job ${job?.id} failed:`, err.message);
});
