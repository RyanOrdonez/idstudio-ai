import fs from "node:fs";
import {
  AI_QUEUE_DESIGN_SUGGESTION,
  AI_QUEUE_IMAGE_ANALYSIS,
  AI_QUEUE_SMART_SCHEDULING,
  AI_QUEUE_BUDGET_FORECASTING,
  AI_QUEUE_VECTOR_EMBEDDING,
  AI_QUEUE_GEMINI_IMAGE_GENERATION,
  AI_QUEUE_PROPOSAL_GENERATION,
} from "@ids/types";
import { connection } from "./lib/redis.js";
import { designSuggestionWorker } from "./workers/designSuggestion.js";
import { imageAnalysisWorker } from "./workers/imageAnalysis.js";
import { smartSchedulingWorker } from "./workers/smartScheduling.js";
import { budgetForecastingWorker } from "./workers/budgetForecasting.js";
import { vectorEmbeddingWorker } from "./workers/vectorEmbedding.js";
import { geminiImageGenerationWorker } from "./workers/geminiImageGeneration.js";
import { proposalGenerationWorker } from "./workers/proposalGeneration.js";

const LIVENESS_FILE = "/tmp/worker-alive";
const LIVENESS_INTERVAL_MS = 10_000;

// ---------------------------------------------------------------------------
// Workers
// ---------------------------------------------------------------------------

const workers = [
  designSuggestionWorker,
  imageAnalysisWorker,
  smartSchedulingWorker,
  budgetForecastingWorker,
  vectorEmbeddingWorker,
  geminiImageGenerationWorker,
  proposalGenerationWorker,
];

const queueNames = [
  AI_QUEUE_DESIGN_SUGGESTION,
  AI_QUEUE_IMAGE_ANALYSIS,
  AI_QUEUE_SMART_SCHEDULING,
  AI_QUEUE_BUDGET_FORECASTING,
  AI_QUEUE_VECTOR_EMBEDDING,
  AI_QUEUE_GEMINI_IMAGE_GENERATION,
  AI_QUEUE_PROPOSAL_GENERATION,
];

// ---------------------------------------------------------------------------
// Liveness heartbeat for Docker health check
// ---------------------------------------------------------------------------

function touchLiveness(): void {
  try {
    fs.writeFileSync(LIVENESS_FILE, new Date().toISOString(), "utf8");
  } catch (err) {
    console.warn("[liveness] failed to touch heartbeat file:", err);
  }
}

const livenessTimer = setInterval(touchLiveness, LIVENESS_INTERVAL_MS);
touchLiveness(); // write immediately on start

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

async function shutdown(signal: string): Promise<void> {
  console.info(`\n[ai-worker] received ${signal}, shutting down gracefully…`);

  clearInterval(livenessTimer);

  await Promise.all(workers.map((w) => w.close()));
  await connection.quit();

  console.info("[ai-worker] all workers closed, exiting");
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

// ---------------------------------------------------------------------------
// Startup log
// ---------------------------------------------------------------------------

console.info("[ai-worker] starting up, listening on queues:");
for (const name of queueNames) {
  console.info(`  • ${name}`);
}
console.info("[ai-worker] ready");
