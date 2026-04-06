import Anthropic from "@anthropic-ai/sdk";
import { Worker, type Job } from "bullmq";
import { prisma } from "@ids/db";
import {
  AI_QUEUE_SMART_SCHEDULING,
  type SmartSchedulingJobData,
} from "@ids/types";
import { env } from "../config.js";
import { connection } from "../lib/redis.js";
import { trackCost } from "../lib/costTracker.js";
import { publishRealtime } from "../lib/publishRealtime.js";
import {
  SMART_SCHEDULING_SYSTEM_PROMPT,
  PROMPT_VERSION,
} from "../prompts/v1/smartScheduling.js";

const MODEL = "claude-sonnet-4-6";
const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

async function processSmartScheduling(
  job: Job<SmartSchedulingJobData>,
): Promise<void> {
  const { tenantId, projectId, milestoneNotes, projectTitle } = job.data;

  const userPrompt = `Project title: ${projectTitle}\n\nMilestone notes:\n${milestoneNotes}`;

  let rawContent: string;
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: SMART_SCHEDULING_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    rawContent =
      response.content[0]?.type === "text" ? response.content[0].text : "";
    inputTokens = response.usage.input_tokens;
    outputTokens = response.usage.output_tokens;
  } catch (err) {
    console.error(`[smartScheduling] Anthropic API error on job ${job.id}:`, err);
    throw err; // allow BullMQ to retry
  }

  // Parse JSON — fall back to raw text if parsing fails
  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawContent);
  } catch {
    console.warn(
      `[smartScheduling] JSON parse failed for job ${job.id}, storing raw text`,
    );
    parsedBody = { raw: rawContent };
  }

  const insight = await prisma.aIInsight.create({
    data: {
      tenantId,
      projectId,
      assetId: null,
      type: "schedule_risk",
      body: JSON.stringify(parsedBody),
      metadata: {
        promptVersion: PROMPT_VERSION,
        model: MODEL,
      },
    },
  });

  await trackCost({
    tenantId,
    projectId,
    jobType: AI_QUEUE_SMART_SCHEDULING,
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
        type: "schedule_risk",
        content: JSON.stringify(parsedBody),
        relatedTaskId: null,
        createdAt: insight.createdAt.toISOString(),
      },
    },
    tenantId,
    projectId,
  );
}

export const smartSchedulingWorker = new Worker<SmartSchedulingJobData>(
  AI_QUEUE_SMART_SCHEDULING,
  processSmartScheduling,
  {
    connection,
    concurrency: env.WORKER_CONCURRENCY,
  },
);

smartSchedulingWorker.on("completed", (job) => {
  console.info(`[smartScheduling] job ${job.id} completed`);
});

smartSchedulingWorker.on("failed", (job, err) => {
  console.error(`[smartScheduling] job ${job?.id} failed:`, err.message);
});
