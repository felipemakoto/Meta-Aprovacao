import { assertCan } from "../rbac";
import type { AdminRole, SubjectArea } from "../types";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStore } from "./store";

export interface DashboardMetrics {
  totalUsers: number;
  signupsToday: number;
  signupsWeek: number;
  signupsMonth: number;
  activePremium: number;
  expiringIn7Days: number;
  totalSimulados: number;
  averageAccuracyPercent: number;
  signupSeries: { date: string; label: string; cadastros: number }[];
  errorsByTopic: {
    materia: SubjectArea;
    assunto: string;
    erros: number;
    taxaErroPercent: number;
    totalRespondidas?: number;
    acertos?: number;
  }[];
}

export async function getDashboardMetrics(
  actorRole: AdminRole,
  rangeDays: 7 | 30 | 90 = 30
): Promise<DashboardMetrics> {
  assertCan(actorRole, "dashboard:view");

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const monthAgo = new Date(now.getTime() - 30 * 86400000);
  const in7Days = new Date(now.getTime() + 7 * 86400000);

  // Tentar buscar usuários reais do Supabase Auth
  try {
    const adminClient = createAdminClient();
    const { data: authList, error: authError } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (!authError && authList?.users && authList.users.length > 0) {
      const realUsers = authList.users;
      const totalUsers = realUsers.length;
      let signupsToday = 0;
      let signupsWeek = 0;
      let signupsMonth = 0;

      // Mapa para a série temporal
      const daysCount = rangeDays;
      const seriesMap = new Map<string, number>();
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const isoDate = d.toISOString().split("T")[0];
        seriesMap.set(isoDate, 0);
      }

      for (const u of realUsers) {
        const cDate = new Date(u.created_at);
        if (cDate >= startOfToday) signupsToday++;
        if (cDate >= weekAgo) signupsWeek++;
        if (cDate >= monthAgo) signupsMonth++;

        const iso = u.created_at.split("T")[0];
        if (seriesMap.has(iso)) {
          seriesMap.set(iso, (seriesMap.get(iso) ?? 0) + 1);
        }
      }

      const signupSeries = Array.from(seriesMap.entries()).map(([dateStr, cadastros]) => {
        const [, m, d] = dateStr.split("-");
        return {
          date: dateStr,
          label: `${d}/${m}`,
          cadastros,
        };
      });

      // Consultar assinaturas e métricas de estudo dos alunos reais via RPCs
      let activePremium = 0;
      let expiringIn7Days = 0;
      let totalSimulados = 0;
      let sumAcertos = 0;
      let sumQuestoes = 0;

      const subjectStats: Record<string, { answered: number; correct: number }> = {
        matematica: { answered: 0, correct: 0 },
        portugues: { answered: 0, correct: 0 },
        ciencias: { answered: 0, correct: 0 },
        historia: { answered: 0, correct: 0 },
        geografia: { answered: 0, correct: 0 },
      };

      // Carregar estatísticas e assinaturas em paralelo para os alunos reais
      await Promise.all(
        realUsers.map(async (u) => {
          try {
            const [subRes, statsRes] = await Promise.all([
              adminClient.rpc("read_subscription_access", { p_user_id: u.id }),
              adminClient.rpc("read_study_statistics", { p_user_id: u.id, p_period: "all" }),
            ]);

            let isUserPremium = false;
            let userAccessUntil: string | null = null;

            if (subRes.data?.hasPremium) {
              isUserPremium = true;
              userAccessUntil = subRes.data.accessUntil ?? null;
            } else if (u.user_metadata?.manual_premium) {
              const exp = u.user_metadata.premium_access_until;
              if (!exp || new Date(exp) > now) {
                isUserPremium = true;
                userAccessUntil = exp ?? null;
              }
            }

            if (isUserPremium) {
              activePremium++;
              if (userAccessUntil) {
                const exp = new Date(userAccessUntil);
                if (exp >= now && exp <= in7Days) expiringIn7Days++;
              }
            }

            if (statsRes.data) {
              const s = statsRes.data;
              totalSimulados += s.simulations ?? 0;
              sumAcertos += s.correct ?? 0;
              sumQuestoes += s.answered ?? 0;

              if (Array.isArray(s.subjects)) {
                for (const sub of s.subjects) {
                  if (subjectStats[sub.subject]) {
                    subjectStats[sub.subject].answered += sub.answered ?? 0;
                    subjectStats[sub.subject].correct += sub.correct ?? 0;
                  }
                }
              }
            }
          } catch {
            // Silencioso por aluno
          }
        })
      );

      const averageAccuracyPercent =
        sumQuestoes > 0 ? Math.round((sumAcertos / sumQuestoes) * 100) : 0;

      const subjectLabels: Record<string, { area: SubjectArea; label: string }> = {
        matematica: { area: "Matemática", label: "Matemática" },
        ciencias: { area: "Ciências da Natureza", label: "Ciências da Natureza" },
        geografia: { area: "Ciências Humanas", label: "Geografia" },
        portugues: { area: "Português", label: "Português" },
        historia: { area: "Ciências Humanas", label: "História" },
      };

      const errorsByTopic = Object.entries(subjectStats)
        .map(([key, stat]) => {
          const erros = stat.answered - stat.correct;
          const taxa = stat.answered > 0 ? Math.round((erros / stat.answered) * 100) : 0;
          const meta = subjectLabels[key] ?? { area: "Outros" as SubjectArea, label: key };
          return {
            materia: meta.area,
            assunto: meta.label,
            erros,
            taxaErroPercent: taxa,
            totalRespondidas: stat.answered,
            acertos: stat.correct,
          };
        })
        .sort((a, b) => b.erros - a.erros);

      return {
        totalUsers,
        signupsToday,
        signupsWeek,
        signupsMonth,
        activePremium,
        expiringIn7Days,
        totalSimulados,
        averageAccuracyPercent,
        signupSeries,
        errorsByTopic,
      };
    }
  } catch {
// Se a leitura ao vivo do Supabase falhar, propagamos o erro para que o chamador possa tratar.
    // Não utilizamos mais o fallback de mock/store, pois a exigência atual é usar sempre dados reais.
    throw new Error("Failed to fetch dashboard metrics from Supabase");
  }

  // Fallback para store
  const store = getStore();
  let signupsToday = 0;
  let signupsWeek = 0;
  let signupsMonth = 0;
  let activePremium = 0;
  let expiringIn7Days = 0;
  let totalSimulados = 0;
  let sumAcertos = 0;
  let sumQuestoes = 0;

  const topicAgg = new Map<
    string,
    { materia: SubjectArea; assunto: string; erros: number; total: number }
  >();

  for (const user of store.users) {
    const created = new Date(user.criadoEm);
    if (created >= startOfToday) signupsToday++;
    if (created >= weekAgo) signupsWeek++;
    if (created >= monthAgo) signupsMonth++;

    if (user.plano === "premium" && user.status === "ativo") {
      activePremium++;
      if (!user.premiumVitalicio && user.premiumExpiraEm) {
        const exp = new Date(user.premiumExpiraEm);
        if (exp >= now && exp <= in7Days) {
          expiringIn7Days++;
        }
      }
    }

    for (const sim of user.simulados) {
      totalSimulados++;
      sumAcertos += sim.acertos;
      sumQuestoes += sim.totalQuestoes;
    }

    for (const perf of user.desempenhoPorAssunto) {
      const key = `${perf.materia}::${perf.assunto}`;
      const current = topicAgg.get(key) ?? {
        materia: perf.materia,
        assunto: perf.assunto,
        erros: 0,
        total: 0,
      };
      current.erros += perf.erros;
      current.total += perf.totalRespondidas;
      topicAgg.set(key, current);
    }
  }

  const averageAccuracyPercent =
    sumQuestoes > 0 ? Math.round((sumAcertos / sumQuestoes) * 100) : 0;

  const daysCount = rangeDays;
  const seriesMap = new Map<string, number>();
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const isoDate = d.toISOString().split("T")[0];
    seriesMap.set(isoDate, 0);
  }

  for (const user of store.users) {
    const iso = user.criadoEm.split("T")[0];
    if (seriesMap.has(iso)) {
      seriesMap.set(iso, (seriesMap.get(iso) ?? 0) + 1);
    }
  }

  const signupSeries = Array.from(seriesMap.entries()).map(([dateStr, cadastros]) => {
    const [, m, d] = dateStr.split("-");
    return {
      date: dateStr,
      label: `${d}/${m}`,
      cadastros,
    };
  });

  const errorsByTopic = Array.from(topicAgg.values())
    .map((item) => ({
      materia: item.materia,
      assunto: item.assunto,
      erros: item.erros,
      taxaErroPercent:
        item.total > 0 ? Math.round((item.erros / item.total) * 100) : 0,
    }))
    .sort((a, b) => b.erros - a.erros)
    .slice(0, 8);

  return {
    totalUsers: store.users.length,
    signupsToday,
    signupsWeek,
    signupsMonth,
    activePremium,
    expiringIn7Days,
    totalSimulados,
    averageAccuracyPercent,
    signupSeries,
    errorsByTopic,
  };
}
