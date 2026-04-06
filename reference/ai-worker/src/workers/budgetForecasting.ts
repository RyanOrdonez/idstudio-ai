import Anthropic from "@anthropic-ai/sdk";
import { Worker, type Job } from "bullmq";
import { prisma } from "@ids/db";
import {
  AI_QUEUE_BUDGET_FORECASTING,
  type BudgetForecastingJobData,
} from "@ids/types";
import { env } from "../config.js";
import { connection } from "../lib/redis.js";
import { trackCost } from "../lib/costTracker.js";
import { publishRealtime } from "../lib/publishRealtime.js";
import {
  BUDGET_FORECASTING_SYSTEM_PROMPT,
  PROMPT_VERSION,
} from "../prompts/v1/budgetForecasting.js";

const MODEL = "claude-sonnet-4-6";
const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

async function processBudgetForecasting(
  job: Job<BudgetForecastingJobData>,
): Promise<void> {
  const { tenantId, projectId, projectTitle } = job.data;

  // Fetch budget + line items + recent insights from DB
  const [budget, recentInsights] = await Promise.all([
    prisma.budget.findUnique({
      where: { projectId },
      include: {
        lineItems: {
          orderBy: { category: "asc" },
        },
      },
    }),
    prisma.aIInsight.findMany({
      where: { projectId, type: "budget_alert" },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  // Build a rich prompt including the financial data
  const budgetSummaryLines: string[] = [];

  if (budget) {
    budgetSummaryLines.push(`Total budget: ${budget.total.toString()}`);
    const totalEstimate = budget.lineItems.reduce(
      (sum, li) => sum + Number(li.estimate),
      0,
    );
    const totalActual = budget.lineItems.reduce(
      (sum, li) => sum + Number(li.actual),
      0,
    );
    budgetSummaryLines.push(`Sum of estimates: ${totalEstimate.toFixed(2)}`);
    budgetSummaryLines.push(`Sum of actuals: ${totalActual.toFixed(2)}`);
    budgetSummaryLines.push("");
    budgetSummaryLines.push("Line items:");
    for (const li of budget.lineItems) {
      budgetSummaryLines.push(
        `  - [${li.category}] ${li.description}: estimate=${li.estimate}, actual=${li.actual}`,
      );
    }
  } else {
    budgetSummaryLines.push("No budget data available for this project.");
  }

  if (recentInsights.length > 0) {
    budgetSummaryLines.push("");
    budgetSummaryLines.push("Recent AI budget insights:");
    for (const insight of recentInsights) {
      budgetSummaryLines.push(`  - ${insight.body.slice(0, 200)}`);
    }
  }

  const userPrompt = [
    `Project title: ${projectTitle}`,
    "",
    budgetSummaryLines.join("\n"),
  ].join("\n");

  let rawContent: string;
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: BUDGET_FORECASTING_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    rawContent =
      response.content[0]?.type === "text" ? response.content[0].text : "";
    inputTokens = response.usage.input_tokens;
    outputTokens = response.usage.output_tokens;
  } catch (err) {
    console.error(`[budgetForecasting] Anthropic API error on job ${job.id}:`, err);
    throw err; // allow BullMQ to retry
  }

  // Parse JSON — fall back to raw text if parsing fails
  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawContent);
  } catch {
    console.warn(
      `[budgetForecasting] JSON parse failed for job ${job.id}, storing raw text`,
    );
    parsedBody = { raw: rawContent };
  }

  const insight = await prisma.aIInsight.create({
    data: {
      tenantId,
      projectId,
      assetId: null,
      type: "budget_alert",
      body: JSON.stringify(parsedBody),
      metadata: {
        promptVersion: PROMPT_VERSION,
        model: MODEL,
        budgetId: budget?.id ?? null,
      },
    },
  });

  await trackCost({
    tenantId,
    projectId,
    jobType: AI_QUEUE_BUDGET_FORECASTING,
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
        type: "budget_alert",
        content: JSON.stringify(parsedBody),
        relatedTaskId: null,
        createdAt: insight.createdAt.toISOString(),
      },
    },
    tenantId,
    projectId,
  );
}

export const budgetForecastingWorker = new Worker<BudgetForecastingJobData>(
  AI_QUEUE_BUDGET_FORECASTING,
  processBudgetForecasting,
  {
    connection,
    concurrency: env.WORKER_CONCURRENCY,
  },
);

budgetForecastingWorker.on("completed", (job) => {
  console.info(`[budgetForecasting] job ${job.id} completed`);
});

budgetForecastingWorker.on("failed", (job, err) => {
  console.error(`[budgetForecasting] job ${job?.id} failed:`, err.message);
});
