import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  ANTHROPIC_API_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  GOOGLE_AI_API_KEY: z.string().min(1),
  SENTRY_DSN: z.string().optional(),
  /** BullMQ concurrency per worker */
  WORKER_CONCURRENCY: z.coerce.number().default(5),
  // AWS S3 — used by ai-worker to store generated images
  S3_BUCKET: z.string().default("ids-assets"),
  S3_REGION: z.string().default("us-east-1"),
  S3_ACCESS_KEY_ID: z.string().default(""),
  S3_SECRET_ACCESS_KEY: z.string().default(""),
  S3_CDN_URL: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

function loadEnv(): Env {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error("Invalid environment configuration:");
    for (const [field, issues] of Object.entries(
      result.error.flatten().fieldErrors,
    )) {
      console.error(`  ${field}: ${issues?.join(", ")}`);
    }
    process.exit(1);
  }
  return result.data;
}

export const env = loadEnv();
