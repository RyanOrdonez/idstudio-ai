import { GoogleGenerativeAI } from "@google/generative-ai";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Worker, type Job } from "bullmq";
import { prisma } from "@ids/db";
import {
  AI_QUEUE_GEMINI_IMAGE_GENERATION,
  type GeminiImageGenerationJobData,
} from "@ids/types";
import { env } from "../config.js";
import { connection } from "../lib/redis.js";
import { trackCost } from "../lib/costTracker.js";
import { publishRealtime } from "../lib/publishRealtime.js";
import {
  buildConceptRenderPrompt,
  buildStyleTransferPrompt,
  buildMoodBoardPrompt,
  PROMPT_VERSION,
} from "../prompts/v1/geminiImageGeneration.js";

// ---------------------------------------------------------------------------
// Model config
// ---------------------------------------------------------------------------

const MODEL = "gemini-nano-banana-2";
// Gemini image generation uses responseModalities to request image output.
// Token counts for image generation are billed per image, not per token.
const IMAGE_GENERATION_CONFIG = {
  responseModalities: ["image", "text"],
} as Record<string, unknown>;

// ---------------------------------------------------------------------------
// Clients (lazy-initialised)
// ---------------------------------------------------------------------------

let genAI: GoogleGenerativeAI | null = null;
function getGenAI(): GoogleGenerativeAI {
  if (!genAI) genAI = new GoogleGenerativeAI(env.GOOGLE_AI_API_KEY);
  return genAI;
}

let s3: S3Client | null = null;
function getS3(): S3Client {
  if (!s3) {
    s3 = new S3Client({
      region: env.S3_REGION,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Upload a base64-encoded image to S3 and return its public URL.
 */
async function uploadImageToS3(params: {
  tenantId: string;
  projectId: string;
  imageBase64: string;
  mimeType: string;
  filename: string;
}): Promise<{ url: string; s3Key: string; sizeBytes: number }> {
  const { tenantId, projectId, imageBase64, mimeType, filename } = params;
  const buffer = Buffer.from(imageBase64, "base64");
  const s3Key = `${tenantId}/${projectId}/generated/${Date.now()}-${filename}`;

  await getS3().send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: s3Key,
      Body: buffer,
      ContentType: mimeType,
      ContentLength: buffer.length,
    }),
  );

  const url = env.S3_CDN_URL
    ? `${env.S3_CDN_URL}/${s3Key}`
    : `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com/${s3Key}`;

  return { url, s3Key, sizeBytes: buffer.length };
}

/**
 * Select the appropriate prompt builder for the job type.
 */
function buildPrompt(data: GeminiImageGenerationJobData, styleHints?: string): string {
  const params = {
    projectBrief: data.projectBrief,
    roomType: data.roomType,
    styleHints,
  };
  switch (data.jobType) {
    case "concept_render":
      return buildConceptRenderPrompt(params);
    case "style_transfer":
      return buildStyleTransferPrompt(params);
    case "mood_board_generate":
      return buildMoodBoardPrompt(params);
  }
}

// ---------------------------------------------------------------------------
// Job processor
// ---------------------------------------------------------------------------

async function processGeminiImageGeneration(
  job: Job<GeminiImageGenerationJobData>,
): Promise<void> {
  const { tenantId, projectId, jobType, styleReferenceAssetIds } = job.data;

  // Fetch style reference asset URLs to build style hints text
  let styleHints: string | undefined;
  if (styleReferenceAssetIds.length > 0) {
    const assets = await prisma.asset.findMany({
      where: {
        id: { in: styleReferenceAssetIds },
        tenantId,
        projectId,
        deletedAt: null,
      },
      select: { id: true, filename: true, url: true },
    });
    if (assets.length > 0) {
      styleHints = assets
        .map((a) => `- ${a.filename} (${a.url})`)
        .join("\n");
    }
  }

  const prompt = buildPrompt(job.data, styleHints);

  // ---------------------------------------------------------------------------
  // Call Gemini Nano Banana 2
  // ---------------------------------------------------------------------------
  let imageBase64: string;
  let imageMimeType: string;
  let inputTokens = 0;

  try {
    const model = getGenAI().getGenerativeModel({ model: MODEL });

    const result = await (model as any).generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: IMAGE_GENERATION_CONFIG,
    });

    const candidate = result.response.candidates?.[0];
    if (!candidate) {
      throw new Error("No candidates returned from Gemini image generation");
    }

    // Extract the image part from the response
    const imagePart = candidate.content?.parts?.find(
      (p: any) => p.inlineData?.mimeType?.startsWith("image/"),
    );

    if (!imagePart?.inlineData) {
      throw new Error("Gemini response contained no image data");
    }

    imageBase64 = imagePart.inlineData.data as string;
    imageMimeType = imagePart.inlineData.mimeType as string;
    inputTokens = result.response.usageMetadata?.promptTokenCount ?? 0;
  } catch (err) {
    console.error(
      `[geminiImageGeneration] Gemini API error on job ${job.id}:`,
      err,
    );
    throw err; // allow BullMQ to retry
  }

  // ---------------------------------------------------------------------------
  // Store generated image in S3 and create Asset record
  // ---------------------------------------------------------------------------
  const ext = imageMimeType.split("/")[1] ?? "png";
  const filename = `${jobType}-${Date.now()}.${ext}`;

  const { url, sizeBytes } = await uploadImageToS3({
    tenantId,
    projectId,
    imageBase64,
    mimeType: imageMimeType,
    filename,
  });

  const asset = await prisma.asset.create({
    data: {
      tenantId,
      projectId,
      type: "render",
      filename,
      mimeType: imageMimeType,
      url,
      sizeBytes,
    },
  });

  // ---------------------------------------------------------------------------
  // Create AIInsight record for the generated image
  // ---------------------------------------------------------------------------
  const insight = await prisma.aIInsight.create({
    data: {
      tenantId,
      projectId,
      assetId: asset.id,
      type: "style_match",
      body: JSON.stringify({
        jobType,
        roomType: job.data.roomType,
        generatedAssetId: asset.id,
        generatedAssetUrl: url,
        promptVersion: PROMPT_VERSION,
      }),
      metadata: {
        model: MODEL,
        jobType,
        styleReferenceAssetIds,
      },
    },
  });

  // ---------------------------------------------------------------------------
  // Cost tracking — image generation is billed per image
  // ---------------------------------------------------------------------------
  await trackCost({
    tenantId,
    projectId,
    jobType: AI_QUEUE_GEMINI_IMAGE_GENERATION,
    model: MODEL,
    inputTokens,
    outputTokens: 0,
    totalTokens: inputTokens,
    imageCount: 1,
  });

  // ---------------------------------------------------------------------------
  // Publish real-time event
  // ---------------------------------------------------------------------------
  await publishRealtime(
    {
      event: "ai:generation_complete",
      payload: {
        tenantId,
        projectId,
        jobType,
        assetId: asset.id,
        insightId: insight.id,
        assetUrl: url,
        createdAt: asset.createdAt.toISOString(),
      },
    },
    tenantId,
    projectId,
  );

  console.info(
    `[geminiImageGeneration] job ${job.id} completed — asset ${asset.id}, insight ${insight.id}`,
  );
}

// ---------------------------------------------------------------------------
// Worker registration
// ---------------------------------------------------------------------------

export const geminiImageGenerationWorker = new Worker<GeminiImageGenerationJobData>(
  AI_QUEUE_GEMINI_IMAGE_GENERATION,
  processGeminiImageGeneration,
  {
    connection,
    concurrency: env.WORKER_CONCURRENCY,
  },
);

geminiImageGenerationWorker.on("completed", (job) => {
  console.info(`[geminiImageGeneration] job ${job.id} completed`);
});

geminiImageGenerationWorker.on("failed", (job, err) => {
  console.error(
    `[geminiImageGeneration] job ${job?.id} failed:`,
    err.message,
  );
});
