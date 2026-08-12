export type HealthState = "operational" | "degraded" | "outage";
export type ServiceHealthState = HealthState | "disabled";

export interface ServiceHealth {
  name: string;
  state: ServiceHealthState;
  detail: string;
  latencyMs: number | null;
}

export interface HealthSnapshot {
  status: HealthState;
  timestamp: string;
  uptimeSeconds: number;
  environment: "development" | "test" | "production";
  runtime: {
    storage: "local-file" | "supabase";
    analysis: "inline" | "bullmq";
    rateLimit: "memory" | "upstash";
  };
  services: ServiceHealth[];
}

export interface HealthApiResponse {
  success: boolean;
  data: HealthSnapshot;
}
