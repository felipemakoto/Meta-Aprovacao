import { buildSeededDatabase, type SeededDatabase } from "./seed";

const globalForStore = globalThis as unknown as {
  __metaAprovacaoStore?: SeededDatabase;
};

/**
 * Store em memória para prototipação local.
 * Em produção, substituir as chamadas deste store por queries ao cliente Supabase
 * (server-side com service_role ou RLS autenticado via @supabase/ssr).
 */
export function getStore(): SeededDatabase {
  if (!globalForStore.__metaAprovacaoStore) {
    globalForStore.__metaAprovacaoStore = buildSeededDatabase();
  }
  return globalForStore.__metaAprovacaoStore;
}
