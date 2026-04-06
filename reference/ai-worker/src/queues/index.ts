import { Queue } from "bullmq";
import {
  AI_QUEUE_DESIGN_SUGGESTION,
  AI_QUEUE_IMAGE_ANALYSIS,
  AI_QUEUE_SMART_SCHEDULING,
  AI_QUEUE_BUDGET_FORECASTING,
  AI_QUEUE_VECTOR_EMBEDDING,
  AI_QUEUE_GEMINI_IMAGE_GENERATION,
  type DesignSuggestionJobData,
  type ImageAnalysisJobData,
  type SmartSchedulingJobData,
  type BudgetForecastingJobData,
  type VectorEmbeddingJobData,
  type GeminiImageGenerationJobData,
} from "@ids/types";
import { connection } from "../lib/redis.js";

// ---------------------------------------------------------------------------
// Default job options applied to all queues
// ---------------------------------------------------------------------------

const defaultJobOptions = {
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 200 },
  attempts: 3,
  backoff: {
    type: "exponential" as const,
    delay: 5_000,
  },
};

// ---------------------------------------------------------------------------
// Queue instances
// ---------------------------------------------------------------------------

export const designSuggestionQueue = new Queue<DesignSuggestionJobData>(
  AI_QUEUE_DESIGN_SUGGESTION,
  { connection, defaultJobOptions },
);

export const imageAnalysisQueue = new Queue<ImageAnalysisJobData>(
  AI_QUEUE_IMAGE_ANALYSIS,
  { connection, defaultJobOptions },
);

export const smartSchedulingQueue = new Queue<SmartSchedulingJobData>(
  AI_QUEUE_SMART_SCHEDULING,
  { connection, defaultJobOptions },
);

export const budgetForecastingQueue = new Queue<BudgetForecastingJobData>(
  AI_QUEUE_BUDGET_FORECASTING,
  { connection, defaultJobOptions },
);

export const vectorEmbeddingQueue = new Queue<VectorEmbeddingJobData>(
  AI_QUEUE_VECTOR_EMBEDDING,
  { connection, defaultJobOptions },
);

export const geminiImageGenerationQueue = new Queue<GeminiImageGenerationJobData>(
  AI_QUEUE_GEMINI_IMAGE_GENERATION,
  { connection, defaultJobOptions },
);

/** All queues, for bulk operations such as graceful shutdown. */
export const allQueues = [
  designSuggestionQueue,
  imageAnalysisQueue,
  smartSchedulingQueue,
  budgetForecastingQueue,
  vectorEmbeddingQueue,
  geminiImageGenerationQueue,
] as const;
