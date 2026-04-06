import OpenAI from "openai";
import { Worker, type Job } from "bullmq";
import { prisma, Prisma } from "@ids/db";
import {
  AI_QUEUE_VECTOR_EMBEDDING,
  type VectorEmbeddingJobData,
} from "@ids/types";
import { env } from "../config.js";
import { connection } from "../lib/redis.js";
import { trackCost } from "../lib/costTracker.js";

const MODEL = "text-embedding-3-small";
const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

async function processVectorEmbedding(
  job: Job<VectorEmbeddingJobData>,
): Promise<void> {
  const { tenantId, projectId, assetId, text } = job.data;

  let embedding: number[];
  let totalTokens = 0;

  try {
    const response = await openai.embeddings.create({
      model: MODEL,
      input: text,
    });

    embedding = response.data[0]?.embedding ?? [];
    totalTokens = response.usage.total_tokens;
  } catch (err) {
    console.error(`[vectorEmbedding] OpenAI API error on job ${job.id}:`, err);
    throw err; // allow BullMQ to retry
  }

  if (embedding.length === 0) {
    throw new Error(`[vectorEmbedding] Empty embedding returned for job ${job.id}`);
  }

  // pgvector expects the embedding formatted as a Postgres vector literal: "[0.1,0.2,...]"
  const vectorLiteral = "[" + embedding.join(",") + "]";

  try {
    await prisma.$executeRaw(
      Prisma.sql`UPDATE assets SET embedding = ${vectorLiteral}::vector WHERE id = ${assetId}`,
    );
  } catch (err) {
    console.error(
      `[vectorEmbedding] DB update failed for asset ${assetId} on job ${job.id}:`,
      err,
    );
    throw err; // allow BullMQ to retry
  }

  // Embeddings billing: $0.02 / 1M tokens (input only, no output)
  await trackCost({
    tenantId,
    projectId,
    jobType: AI_QUEUE_VECTOR_EMBEDDING,
    model: MODEL,
    inputTokens: totalTokens,
    outputTokens: 0,
    totalTokens,
  });
}

export const vectorEmbeddingWorker = new Worker<VectorEmbeddingJobData>(
  AI_QUEUE_VECTOR_EMBEDDING,
  processVectorEmbedding,
  {
    connection,
    concurrency: env.WORKER_CONCURRENCY,
  },
);

vectorEmbeddingWorker.on("completed", (job) => {
  console.info(`[vectorEmbedding] job ${job.id} completed`);
});

vectorEmbeddingWorker.on("failed", (job, err) => {
  console.error(`[vectorEmbedding] job ${job?.id} failed:`, err.message);
});
