"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardMetrics } from "@/lib/admin/data/dashboard";
import { ErrorState, TableSkeleton } from "./FeedbackBanner";

export function DashboardView() {
  const [range, setRange] = useState<7 | 30 | 90>(30);
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (selectedRange: 7 | 30 | 90) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/dashboard?range=${selectedRange}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao carregar visão geral.");
      setData(json as DashboardMetrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/dashboard?range=${range}`);
        const json = await res.json();
        if (!ignore) {
          if (!res.ok) throw new Error(json.error ?? "Erro ao carregar visão geral.");
          setData(json as DashboardMetrics);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Erro inesperado.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    fetchData();
    return () => { ignore = true; };
  }, [range]);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif-display text-[32px] md:text-[36px] leading-tight">
          Visão geral
        </h1>
        <TableSkeleton rows={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif-display text-[32px] md:text-[36px] leading-tight">
          Visão geral
        </h1>
        <ErrorState message={error} onRetry={() => load(range)} />
      </div>
    );
  }

  if (!data) return null;

  const kpis = [
    { label: "Total de usuários", value: data.totalUsers.toLocaleString("pt-BR") },
    { label: "Cadastros hoje", value: data.signupsToday.toLocaleString("pt-BR") },
    { label: "Cadastros na semana", value: data.signupsWeek.toLocaleString("pt-BR") },
    { label: "Cadastros no mês", value: data.signupsMonth.toLocaleString("pt-BR") },
    { label: "Premium ativos", value: data.activePremium.toLocaleString("pt-BR") },
    { label: "Expirando em 7 dias", value: data.expiringIn7Days.toLocaleString("pt-BR") },
    { label: "Simulados realizados", value: data.totalSimulados.toLocaleString("pt-BR") },
    { label: "Taxa média de acerto", value: `${data.averageAccuracyPercent}%` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif-display text-[32px] md:text-[36px] leading-tight">
          Visão geral
        </h1>
        <p className="text-[var(--text-secondary)] text-base mt-1">
          Acompanhamento de cadastros, assinaturas e desempenho nos simulados ETEC e IFSP.
        </p>
      </div>

      {/* Cards KPI */}
      <section aria-label="Indicadores principais" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5"
          >
            <p className="text-sm text-[var(--text-secondary)]">{kpi.label}</p>
            <p className="font-serif-display text-[32px] text-[var(--text)] mt-1 leading-none">
              {kpi.value}
            </p>
          </div>
        ))}
      </section>

      {/* Gráfico de linha: Cadastros */}
      <section className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-semibold text-lg text-[var(--text)]">
              Novos cadastros
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Evolução diária no período selecionado
            </p>
          </div>
          <div className="flex gap-2" role="group" aria-label="Filtro de período">
            {([7, 30, 90] as const).map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setRange(days)}
                className={`min-h-[44px] px-3.5 rounded-xl text-sm font-medium border transition-colors cursor-pointer ${
                  range === days
                    ? "bg-[var(--primary)] text-[var(--primary-text)] border-[var(--primary)]"
                    : "bg-[var(--bg)] text-[var(--text)] border-[var(--border)] hover:bg-[var(--primary-subtle)]"
                }`}
              >
                {days} dias
              </button>
            ))}
          </div>
        </div>

        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.signupSeries} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--text-secondary)" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--text-secondary)" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border)",
                  borderRadius: "12px",
                  color: "var(--text)",
                }}
              />
              <Line
                type="monotone"
                dataKey="cadastros"
                name="Cadastros"
                stroke="var(--primary)"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Gráfico de barras: Erros por matéria */}
      <section className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-lg text-[var(--text)]">
              Erros dos alunos por matéria
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-500/20">
              Dados reais do Supabase
            </span>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Total de erros registrados dos estudantes em testes, simulados e questões práticas
          </p>
        </div>

        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.errorsByTopic.map((item) => ({
                ...item,
                nomeCurto: item.assunto,
              }))}
              layout="vertical"
              margin={{ top: 8, right: 24, left: 12, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fontSize: 12, fill: "var(--text-secondary)" }} />
              <YAxis
                type="category"
                dataKey="nomeCurto"
                width={160}
                tick={{ fontSize: 12, fill: "var(--text-secondary)" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border)",
                  borderRadius: "12px",
                  color: "var(--text)",
                }}
                formatter={(value, _name, item) => {
                  const topic = item.payload as DashboardMetrics["errorsByTopic"][number] | undefined;
                  if (!topic) return [value, "Erros registrados"];
                  return [
                    `${value} erros (${topic.taxaErroPercent}% de taxa de erro em ${topic.totalRespondidas ?? value} respostas)`,
                    "Erros registrados",
                  ];
                }}
              />
              <Bar dataKey="erros" name="Erros registrados" fill="var(--primary)" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
