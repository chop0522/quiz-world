import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { requireEnv } from "@/lib/env";

let adminClient: SupabaseClient | null = null;
const nodeWebSocket = WebSocket as unknown as typeof globalThis.WebSocket;

export function getSupabaseAdminClient(): SupabaseClient {
  if (!adminClient) {
    adminClient = createClient(
      requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
      requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
      {
        realtime: {
          transport: nodeWebSocket
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }

  return adminClient;
}
