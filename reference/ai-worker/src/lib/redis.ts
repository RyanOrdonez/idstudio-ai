import IORedis from "ioredis";
import { env } from "../config.js";

/**
 * Single IORedis connection for BullMQ workers and queues.
 * maxRetriesPerRequest must be null for BullMQ blocking commands.
 */
export const connection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

connection.on("error", (err) => {
  console.error("[redis] connection error:", err);
});
