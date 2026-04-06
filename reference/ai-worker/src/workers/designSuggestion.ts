import Anthropic from "@anthropic-ai/sdk";
import { Worker, type Job } from "bullmq";
import { prisma } from "@ids/db";
import {
  AI_QUEUE_DESIGN_SUGGESTION,
  type DesignSuggestionJobData,
} from "@ids/types";
import { env } from "../config.js";
import { connection } from "../lib/redis.js";
import { trackCost } from "../lib/costTracker.js";
import { publishRealtime } from "../lib/publishRealtime.js";
import {
  DESIGN_SUGGESTION_SYSTEM_PROMPT,
  PROMPT_VERSION,
} from "../prompts/v1/designSuggestion.js";

const MODEL = "claude-sonnet-4-6";
const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

async function processDesignSuggestion(
  job: Job<DesignSuggestionJobData>,
): Promise<void> {
  const { tenantId, projectId, phaseId, projectTitle, projectDescription, phaseKind } =
    job.data;

  const userPrompt = [
    `Project title: ${projectTitle}`,
    projectDescription ? `Project description: ${projectDescription}` : null,
    phaseKind ? `Current phase: ${phaseKind}` : null,
    phaseId ? `Phase ID: ${phaseId}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  let rawContent: string;
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: DESIGN_SUGGESTION_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    rawContent =
      response.content[0]?.type === "text" ? response.content[0].text : "";
    inputTokens = response.usage.input_tokens;
    outputTokens = response.usage.output_tokens;
  } catch (err) {
    console.error(`[designSuggestion] Anthropic API error on job ${job.id}:`, err);
    throw err; // allow BullMQ to retry
  }

  // Parse JSON — fall back to storing raw text if parsing fails
  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawContent);
  } catch {
    console.warn(
      `[designSuggestion] JSON parse failed for job ${job.id}, storing raw text`,
    );
    parsedBody = { raw: rawContent };
  }

  const insight = await prisma.aIInsight.create({
    data: {
      tenantId,
      projectId,
      assetId: null,
      type: "design_suggestion",
      body: JSON.stringify(parsedBody),
      metadata: {
        promptVersion: PROMPT_VERSION,
        model: MODEL,
        phaseId: phaseId ?? null,
        phaseKind: phaseKind ?? null,
      },
    },
  });

  await trackCost({
    tenantId,
    projectId,
    jobType: AI_QUEUE_DESIGN_SUGGESTION,
    model: MODEL,
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
  });

  await publishRealtime(
    {
      event: "ai:insight",
      payload: {
        tenantId,
        projectId,
        insightId: insight.id,
        type: "design_suggestion",
        content: JSON.stringify(parsedBody),
        relatedTaskId: null,
        createdAt: insight.createdAt.toISOString(),
      },
    },
    tenantId,
    projectId,
  );
}

export const designSuggestionWorker = new Worker<DesignSuggestionJobData>(
  AI_QUEUE_DESIGN_SUGGESTION,
  processDesignSuggestion,
  {
    connection,
    concurrency: env.WORKER_CONCURRENCY,
  },
);

designSuggestionWorker.on("completed", (job) => {
  console.info(`[designSuggestion] job ${job.id} completed`);
});

designSuggestionWorker.on("failed", (job, err) => {
  console.error(`[designSuggestion] job ${job?.id} failed:`, err.message);
});
