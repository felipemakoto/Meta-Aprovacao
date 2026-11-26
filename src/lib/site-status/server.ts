import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type SiteStatus = {
  announcement: string | null;
  maintenance: boolean;
  maintenance_message: string | null;
};
export type SiteStatusUpdate =
  | Pick<SiteStatus, "announcement">
  | Pick<SiteStatus, "maintenance">
  | Pick<SiteStatus, "maintenance_message">;

const cacheMs = 10_000;
const initialStatus: SiteStatus = { announcement: null, maintenance: false, maintenance_message: null };
const columns = "announcement, maintenance, maintenance_message";
let cached = { status: initialStatus, expiresAt: 0 };
let pending: Promise<SiteStatus> | undefined;

export async function readSiteStatus(): Promise<SiteStatus> {
  const { data, error } = await createAdminClient()
    .from("site_status").select(columns).eq("id", 1)
    .abortSignal(AbortSignal.timeout(2000)).single();
  if (error || !data) throw new Error("Status do site indisponível.");
  return data;
}

export function readPublicSiteStatus(): Promise<SiteStatus> {
  if (cached.expiresAt > Date.now()) return Promise.resolve(cached.status);
  if (pending) return pending;

  const snapshot = cached;
  pending = readSiteStatus().then(status => {
    if (cached === snapshot) cached = { status, expiresAt: Date.now() + cacheMs };
    return cached.status;
  }).catch(() => {
    if (cached === snapshot) cached = { ...snapshot, expiresAt: Date.now() + cacheMs };
    return cached.status;
  }).finally(() => { pending = undefined; });
  return pending;
}

export async function updateSiteStatus(change: SiteStatusUpdate): Promise<SiteStatus> {
  const { data, error } = await createAdminClient()
    .from("site_status").update(change).eq("id", 1).select(columns)
    .abortSignal(AbortSignal.timeout(5000)).single();
  if (error || !data) throw new Error("Não foi possível atualizar o status do site.");
  cached = { status: data, expiresAt: Date.now() + cacheMs };
  return data;
}
