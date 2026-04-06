import IORedis from "ioredis";
import { type RealtimeMessage, redisChannel } from "@ids/types";
import { env } from "../config.js";

/**
 * Dedicated IORedis connection used only for Redis pub/sub publishing.
 * BullMQ requires its own connection; this one is purely for PUBLISH calls.
 */
const publisher = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

publisher.on("error", (err) => {
  console.error("[redis:publisher] connection error:", err);
});

/**
 * Publish a typed realtime message to the Redis pub/sub channel for the given
 * tenant+project combination. The API server's Socket.io adapter will relay it
 * to connected clients in the matching room.
 */
export async function publishRealtime(
  message: RealtimeMessage,
  tenantId: string,
  projectId: string,
): Promise<void> {
  const channel = redisChannel(tenantId, projectId);
  const payload = JSON.stringify(message);
  await publisher.publish(channel, payload);
}
