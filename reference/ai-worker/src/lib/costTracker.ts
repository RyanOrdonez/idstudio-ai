import { prisma } from "@ids/db";

// ---------------------------------------------------------------------------
// Pricing constants (USD per 1 million tokens)
// ---------------------------------------------------------------------------

const PRICING: Record<string, { inputPer1M: number; outputPer1M: number }> = {
  // Claude Sonnet
  "claude-sonnet-4-6": { inputPer1M: 3.0, outputPer1M: 15.0 },
  "claude-3-5-sonnet-20241022": { inputPer1M: 3.0, outputPer1M: 15.0 },
  "claude-3-sonnet-20240229": { inputPer1M: 3.0, outputPer1M: 15.0 },
  // GPT-4o
  "gpt-4o": { inputPer1M: 5.0, outputPer1M: 15.0 },
  "gpt-4o-mini": { inputPer1M: 0.15, outputPer1M: 0.6 },
  // Embeddings
  "text-embedding-3-small": { inputPer1M: 0.02, outputPer1M: 0.0 },
  "text-embedding-3-large": { inputPer1M: 0.13, outputPer1M: 0.0 },
  // Gemini image generation (token-based prompt cost; image generation billed per image)
  "gemini-nano-banana-2": { inputPer1M: 0.075, outputPer1M: 0.0 },
};

/** USD cost per generated image for models that charge per image. */
const IMAGE_PRICING_PER_IMAGE: Record<string, number> = {
  "gemini-nano-banana-2": 0.04, // $0.04 per generated image
};

const DEFAULT_PRICING = { inputPer1M: 3.0, outputPer1M: 15.0 };

function estimateCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number,
  imageCount = 0,
): number {
  const { inputPer1M, outputPer1M } = PRICING[model] ?? DEFAULT_PRICING;
  const tokenCost =
    (inputTokens / 1_000_000) * inputPer1M +
    (outputTokens / 1_000_000) * outputPer1M;
  const imageCost = imageCount * (IMAGE_PRICING_PER_IMAGE[model] ?? 0);
  return tokenCost + imageCost;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface TrackCostParams {
  tenantId: string;
  projectId: string;
  jobType: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  /** Number of images generated (for per-image billing models). */
  imageCount?: number;
}

/**
 * Write an AuditLog row recording AI token usage for cost tracking and
 * observability. Errors are logged but never re-thrown — cost tracking must
 * not affect the primary job outcome.
 */
export async function trackCost(params: TrackCostParams): Promise<void> {
  const {
    tenantId,
    projectId,
    jobType,
    model,
    inputTokens,
    outputTokens,
    totalTokens,
    imageCount = 0,
  } = params;

  const estimatedCostUsd = estimateCostUsd(model, inputTokens, outputTokens, imageCount);

  try {
    await prisma.auditLog.create({
      data: {
        tenantId,
        action: "ai.tokens_used",
        entityType: "project",
        entityId: projectId,
        metadata: {
          jobType,
          model,
          inputTokens,
          outputTokens,
          totalTokens,
          imageCount: imageCount > 0 ? imageCount : undefined,
          estimatedCostUsd,
        },
      },
    });
  } catch (err) {
    console.error("[costTracker] failed to write AuditLog:", err);
  }
}
