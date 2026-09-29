export type DashboardSummary = { answered: number; correct: number; latest: null | { id: string; completedAt: string; score: number; total: 10 } };
export function parseDashboard(value: unknown): DashboardSummary {
  if (!value || typeof value !== "object") throw new Error("invalid_dashboard");
  const r = value as Record<string, unknown>;
  if (!Number.isSafeInteger(r.answered) || !Number.isSafeInteger(r.correct) || Number(r.answered) < 0 || Number(r.correct) < 0 || Number(r.correct) > Number(r.answered) || Number(r.answered) % 10 !== 0) throw new Error("invalid_dashboard");
  let latest: DashboardSummary["latest"] = null;
  if (r.latest !== null) {
    if (!r.latest || typeof r.latest !== "object") throw new Error("invalid_dashboard");
    const l = r.latest as Record<string, unknown>;
    if (typeof l.id !== "string" || !/^[0-9a-f-]{36}$/i.test(l.id) || typeof l.completedAt !== "string" || !Number.isFinite(Date.parse(l.completedAt)) || l.total !== 10 || !Number.isInteger(l.score) || Number(l.score) < 0 || Number(l.score) > 10 || Number(r.answered) < 10 || Number(r.correct) < Number(l.score) || Number(r.answered) - Number(r.correct) < 10 - Number(l.score)) throw new Error("invalid_dashboard");
    latest = { id: l.id, completedAt: l.completedAt, score: Number(l.score), total: 10 };
  } else if (r.answered !== 0 || r.correct !== 0) throw new Error("invalid_dashboard");
  return { answered: Number(r.answered), correct: Number(r.correct), latest };
}

// Mantém erros operacionais distintos da conta vazia e verifica identidade antes dos dados.
export async function loadDashboard(deps: { user: () => Promise<string | null>; read: (user: string) => Promise<unknown> }) {
  try {
    const user = await deps.user();
    if (!user) return { kind: "login" } as const;
    return { kind: "ready", summary: parseDashboard(await deps.read(user)) } as const;
  } catch { return { kind: "error" } as const; }
}
