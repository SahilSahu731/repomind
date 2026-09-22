import type {
  ConnectionOptions,
} from "bullmq";

import {
  env,
} from "@/lib/env";

export const ANALYSIS_QUEUE_NAME =
  "repo-analysis";

export const ANALYSIS_WORKER_HEARTBEAT_KEY =
  "repomind:analysis-worker:heartbeat";

export function getBullMqConnectionOptions(
  options: {
    worker?: boolean;
  } = {},
): ConnectionOptions {
  if (env.REDIS_URL) {
    const url =
      new URL(
        env.REDIS_URL,
      );

    const database =
      url.pathname.replace(
        /^\//,
        "",
      );

    return {
      host:
        url.hostname,

      port:
        Number(
          url.port ||
            6379,
        ),

      ...(url.username
        ? {
            username:
              decodeURIComponent(
                url.username,
              ),
          }
        : {}),

      ...(url.password
        ? {
            password:
              decodeURIComponent(
                url.password,
              ),
          }
        : {}),

      ...(database
        ? {
            db:
              Number(
                database,
              ) || 0,
          }
        : {}),

      ...(url.protocol ===
      "rediss:"
        ? {
            tls: {},
          }
        : {}),

      ...(options.worker
        ? {
            maxRetriesPerRequest:
              null,
          }
        : {}),
    };
  }

  return {
    host:
      env.REDIS_HOST,

    port:
      env.REDIS_PORT,

    ...(env.REDIS_PASSWORD
      ? {
          password:
            env.REDIS_PASSWORD,
        }
      : {}),

    ...(options.worker
      ? {
          maxRetriesPerRequest:
            null,
        }
      : {}),
  };
}
