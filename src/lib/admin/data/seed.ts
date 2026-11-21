import type {
  AdminAccount,
  AuditLogEntry,
  PlatformSettings,
  PlatformUser,
  SubjectArea,
  SubscriptionOrigin,
  SubscriptionRecord,
  SubscriptionStatus,
  UserSimulado,
  UserTopicPerformance,
  UserWrongQuestion,
} from "../types";

const FIRST_NAMES = [
  "Ana", "Bruno", "Camila", "Daniel", "Eduarda", "Felipe", "Gabriela", "Henrique",
  "Isabela", "João", "Karina", "Lucas", "Mariana", "Nathan", "Olívia", "Pedro",
  "Rafael", "Sofia", "Thiago", "Vitória", "Beatriz", "Caio", "Larissa", "Mateus",
  "Gustavo", "Juliana", "Leonardo", "Fernanda", "Rodrigo", "Letícia",
];

const LAST_NAMES = [
  "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves",
  "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho",
  "Almeida", "Lopes", "Soares", "Fernandes", "Vieira", "Barbosa",
];

const TOPICS_BY_SUBJECT: Record<SubjectArea, string[]> = {
  Matemática: [
    "Regra de Três e Porcentagem",
    "Equações de 1º e 2º Grau",
    "Geometria Plana e Áreas",
    "Funções Afim e Quadrática",
    "Probabilidade e Estatística",
  ],
  Português: [
    "Interpretação de Texto",
    "Concordância Verbal e Nominal",
    "Pontuação e Coesão",
    "Figuras de Linguagem",
    "Regência e Crase",
  ],
  "Ciências Humanas": [
    "Brasil República e Era Vargas",
    "Geopolítica Contemporânea",
    "Urbanização e Meio Ambiente",
    "Revolução Industrial",
    "Constituição e Cidadania",
  ],
  "Ciências da Natureza": [
    "Cinemática e Leis de Newton",
    "Ecologia e Cadeias Alimentares",
    "Estequiometria e Soluções",
    "Eletrodinâmica Básica",
    "Genética e Citologia",
  ],
};

function createRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export interface SeededDatabase {
  users: PlatformUser[];
  subscriptions: SubscriptionRecord[];
  admins: AdminAccount[];
  auditLogs: AuditLogEntry[];
  settings: PlatformSettings;
}

export function buildSeededDatabase(referenceNow: Date = new Date()): SeededDatabase {
  const rand = createRng(20261117);
  const nowMs = referenceNow.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  const users: PlatformUser[] = [];
  const subscriptions: SubscriptionRecord[] = [];
  let subCounter = 1;

  for (let i = 1; i <= 220; i++) {
    const first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
    const last1 = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
    const last2 = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
    const nome = `${first} ${last1} ${last2}`;
    const email = `${slugify(first)}.${slugify(last1)}${i}@estudante.meta.br`;

    const cpfStart = 100 + Math.floor(rand() * 899);
    const cpfEnd = pad2(Math.floor(rand() * 99));
    const cpfMascarado = `${cpfStart}.***.***-${cpfEnd}`;
    const telefone = `(11) 9${1000 + Math.floor(rand() * 8999)}-${1000 + Math.floor(rand() * 8999)}`;

    // Distribuição de datas de cadastro nos últimos 90 dias (alguns hoje, na semana, no mês)
    let daysAgo: number;
    if (i <= 10) daysAgo = 0; // hoje
    else if (i <= 34) daysAgo = Math.floor(rand() * 6) + 1; // semana
    else if (i <= 95) daysAgo = Math.floor(rand() * 23) + 7; // mês
    else daysAgo = Math.floor(rand() * 60) + 30; // 30-90 dias

    const createdAt = new Date(nowMs - daysAgo * dayMs - Math.floor(rand() * 3600000));
    const lastActiveDaysAgo = Math.min(daysAgo, Math.floor(rand() * 14));
    const ultimaAtividade = new Date(nowMs - lastActiveDaysAgo * dayMs);

    const statusRoll = rand();
    const status =
      statusRoll < 0.89 ? "ativo" : statusRoll < 0.96 ? "suspenso" : "excluido";

    const isPremium = status !== "excluido" && rand() < 0.44;
    const origemPremium = isPremium ? (rand() < 0.72 ? "cakto" : "manual") : null;
    const vitalicio = isPremium && origemPremium === "manual" && rand() < 0.12;

    let premiumInicioEm: string | null = null;
    let premiumExpiraEm: string | null = null;

    if (isPremium) {
      const startDaysAgo = Math.min(daysAgo, Math.floor(rand() * 45) + 1);
      const startDate = new Date(nowMs - startDaysAgo * dayMs);
      premiumInicioEm = startDate.toISOString();

      if (!vitalicio) {
        // Garante alguns expirando em 7 dias
        const remainingDays =
          i % 11 === 0 ? Math.floor(rand() * 6) + 1 : Math.floor(rand() * 120) + 8;
        premiumExpiraEm = new Date(nowMs + remainingDays * dayMs).toISOString();
      }

      const extId =
        origemPremium === "cakto"
          ? `cak_${(100000 + i * 73).toString(16)}`
          : `man_${(100000 + i * 31).toString(16)}`;

      subscriptions.push({
        id: `SUB-${String(subCounter++).padStart(4, "0")}`,
        userId: `USR-${String(i).padStart(4, "0")}`,
        userNome: nome,
        userEmail: email,
        planoNome: vitalicio
          ? "Premium Vitalício (Cortesia)"
          : origemPremium === "cakto"
            ? rand() < 0.65
              ? "Mensal ETEC/IFSP"
              : "Anual Completo"
            : "Premium Manual",
        valorCentavos: origemPremium === "cakto" ? (rand() < 0.65 ? 3990 : 29900) : 0,
        status: "ativa",
        origem: origemPremium as SubscriptionOrigin,
        externalId: extId,
        gatewayUrl:
          origemPremium === "cakto"
            ? `https://app.cakto.com.br/vendas/${extId}`
            : null,
        inicioEm: premiumInicioEm,
        expiraEm: premiumExpiraEm,
        vitalicio,
      });
    }

    // Assinaturas históricas (para ultrapassar 300 assinaturas no total)
    const extraSubs = i <= 140 ? (rand() < 0.6 ? 2 : 1) : 0;
    for (let s = 0; s < extraSubs; s++) {
      const histStartDays = Math.min(daysAgo + 30, 180) + s * 35;
      const histStart = new Date(nowMs - histStartDays * dayMs);
      const histEnd = new Date(histStart.getTime() + 30 * dayMs);
      const histStatusRoll = rand();
      const histStatus: SubscriptionStatus =
        histStatusRoll < 0.45
          ? "expirada"
          : histStatusRoll < 0.8
            ? "cancelada"
            : "em_atraso";
      const orig: SubscriptionOrigin = rand() < 0.8 ? "cakto" : "manual";
      const extId =
        orig === "cakto"
          ? `cak_${(500000 + subCounter * 17).toString(16)}`
          : `man_${(500000 + subCounter * 19).toString(16)}`;

      subscriptions.push({
        id: `SUB-${String(subCounter++).padStart(4, "0")}`,
        userId: `USR-${String(i).padStart(4, "0")}`,
        userNome: nome,
        userEmail: email,
        planoNome: orig === "cakto" ? "Mensal ETEC/IFSP" : "Cortesia 7 dias",
        valorCentavos: orig === "cakto" ? 3990 : 0,
        status: histStatus,
        origem: orig,
        externalId: extId,
        gatewayUrl: orig === "cakto" ? `https://app.cakto.com.br/vendas/${extId}` : null,
        inicioEm: histStart.toISOString(),
        expiraEm: histEnd.toISOString(),
        vitalicio: false,
      });
    }

    // Simulados coerentes
    const simCount = status === "excluido" ? 1 : 2 + Math.floor(rand() * 4);
    const simulados: UserSimulado[] = [];
    const questoesErradas: UserWrongQuestion[] = [];
    const topicMap = new Map<string, UserTopicPerformance>();

    for (let k = 0; k < simCount; k++) {
      const totalQuestoes = 40;
      const acertos = 14 + Math.floor(rand() * 24);
      const nota = Number(((acertos / totalQuestoes) * 10).toFixed(1));
      const simDate = new Date(nowMs - Math.floor(rand() * Math.max(1, daysAgo)) * dayMs);
      const simId = `SIM-${i}-${k + 1}`;

      simulados.push({
        id: simId,
        titulo: k % 2 === 0 ? `Simulado Geral ETEC #${k + 1}` : `Simulado IFSP #${k + 1}`,
        data: simDate.toISOString(),
        tempoGastoMinutos: 65 + Math.floor(rand() * 75),
        totalQuestoes,
        acertos,
        nota,
      });

      // Distribui tópicos e erros coerentes
      const subjects = Object.keys(TOPICS_BY_SUBJECT) as SubjectArea[];
      for (const subj of subjects) {
        const topics = TOPICS_BY_SUBJECT[subj];
        const topic = topics[Math.floor(rand() * topics.length)];
        const key = `${subj}::${topic}`;
        const respondidas = 10;
        const tAcertos = Math.max(2, Math.min(10, Math.round((acertos / totalQuestoes) * 10 + (rand() * 2 - 1))));
        const tErros = respondidas - tAcertos;
        const prev = topicMap.get(key) ?? {
          materia: subj,
          assunto: topic,
          totalRespondidas: 0,
          acertos: 0,
          erros: 0,
        };
        prev.totalRespondidas += respondidas;
        prev.acertos += tAcertos;
        prev.erros += tErros;
        topicMap.set(key, prev);

        if (tErros > 0 && questoesErradas.length < 8) {
          questoesErradas.push({
            id: `Q-${i}-${k}-${subj.slice(0, 3).toUpperCase()}`,
            simuladoId: simId,
            materia: subj,
            assunto: topic,
            enunciadoResumo: `Questão sobre ${topic} (${subj}) aplicada no ${k % 2 === 0 ? "ETEC" : "IFSP"}.`,
            data: simDate.toISOString(),
          });
        }
      }
    }

    const userId = `USR-${String(i).padStart(4, "0")}`;
    users.push({
      id: userId,
      nome: status === "excluido" ? `Usuário Anonimizado #${userId}` : nome,
      email: status === "excluido" ? `anon-${userId.toLowerCase()}@lgpd.local` : email,
      cpfMascarado: status === "excluido" ? "***.***.***-**" : cpfMascarado,
      telefone: status === "excluido" ? "(00) 00000-0000" : telefone,
      plano: isPremium ? "premium" : "gratis",
      status,
      origemPremium,
      premiumInicioEm,
      premiumExpiraEm,
      premiumVitalicio: vitalicio,
      criadoEm: createdAt.toISOString(),
      ultimaAtividadeEm: ultimaAtividade.toISOString(),
      simulados,
      desempenhoPorAssunto: Array.from(topicMap.values()),
      questoesErradas,
      historicoLogins: [
        {
          id: `LGN-${i}-1`,
          data: ultimaAtividade.toISOString(),
          ip: `187.${10 + (i % 80)}.${20 + (i % 100)}.${1 + (i % 200)}`,
          dispositivo: i % 3 === 0 ? "Android · Chrome Mobile" : "Windows 11 · Chrome",
        },
      ],
      notasInternas:
        i % 15 === 0
          ? [
              {
                id: `NOTE-${i}-1`,
                adminId: "ADM-002",
                adminNome: "Mariana Costa",
                conteudo: "Estudante solicitou revisão de prazo de acesso via suporte.",
                criadoEm: new Date(nowMs - 3 * dayMs).toISOString(),
              },
            ]
          : [],
    });
  }

  const admins: AdminAccount[] = [
    {
      id: "e04df4c6-1e12-445a-b59c-b488401f08af",
      nome: "Makoto",
      email: "felipiasmak@gmail.com",
      papel: "super_admin",
      ativo: true,
      ultimoAcessoEm: new Date().toISOString(),
      criadoEm: "2026-11-17T18:54:56.193762+00:00",
    },
  ];

  const auditLogs: AuditLogEntry[] = [
    {
      id: "AUD-0001",
      adminId: admins[0].id,
      adminNome: admins[0].nome,
      adminEmail: admins[0].email,
      acao: "login_success",
      descricao: "Login realizado com sucesso no painel interno.",
      ipSimulado: "177.92.14.88",
      usuarioAfetadoId: null,
      usuarioAfetadoNome: null,
      criadoEm: new Date(nowMs - 2 * 3600000).toISOString(),
    },
    {
      id: "AUD-0002",
      adminId: admins[0].id,
      adminNome: admins[0].nome,
      adminEmail: admins[0].email,
      acao: "grant_premium",
      descricao: "Premium manual de 30 dias concedido.",
      motivo: "Compensação por instabilidade no boleto Cakto.",
      ipSimulado: "189.40.211.12",
      usuarioAfetadoId: users[4].id,
      usuarioAfetadoNome: users[4].nome,
      criadoEm: new Date(nowMs - 6 * 3600000).toISOString(),
    },
    {
      id: "AUD-0003",
      adminId: null,
      adminNome: "Tentativa não autenticada",
      adminEmail: "desconhecido@externo.br",
      acao: "login_failed",
      descricao: "Falha de autenticação (credenciais inválidas).",
      ipSimulado: "45.162.88.19",
      usuarioAfetadoId: null,
      usuarioAfetadoNome: null,
      criadoEm: new Date(nowMs - 14 * 3600000).toISOString(),
    },
    {
      id: "AUD-0004",
      adminId: admins[0].id,
      adminNome: admins[0].nome,
      adminEmail: admins[0].email,
      acao: "settings_updated",
      descricao: "Preços dos planos atualizados.",
      ipSimulado: "177.92.14.88",
      usuarioAfetadoId: null,
      usuarioAfetadoNome: null,
      criadoEm: new Date(nowMs - 2 * dayMs).toISOString(),
    },
  ];

  const settings: PlatformSettings = {
    planos: [
      { id: "mensal", nome: "Mensal ETEC/IFSP", valorCentavos: 3990, duracaoDias: 30, ativo: true },
      { id: "trimestral", nome: "Trimestral Intensivo", valorCentavos: 9990, duracaoDias: 90, ativo: true },
      { id: "anual", nome: "Anual Completo", valorCentavos: 29900, duracaoDias: 365, ativo: true },
    ],
    featureFlags: [
      {
        chave: "simulados_ia_explicacao",
        nome: "Explicação passo a passo nos simulados",
        descricao: "Exibe comentários detalhados após a entrega do simulado.",
        ativo: true,
      },
      {
        chave: "ranking_semanal",
        nome: "Ranking semanal de estudantes",
        descricao: "Mostra classificação anônima por unidade ETEC/IFSP.",
        ativo: true,
      },
      {
        chave: "novo_banco_ifsp_2027",
        nome: "Banco de questões IFSP 2027 (Beta)",
        descricao: "Libera cadernos inéditos para assinantes Premium.",
        ativo: false,
      },
    ],
    modoManutencao: false,
    mensagemManutencao:
      "Estamos realizando uma manutenção programada nos simulados. Voltamos em breve.",
    atualizadoEm: new Date(nowMs - 2 * dayMs).toISOString(),
    atualizadoPor: "Lucas Andrade",
  };

  return { users, subscriptions, admins, auditLogs, settings };
}
