// Recebe marcações locais, sem aprovar conteúdo nem consultar/gravar o banco.
import { Buffer } from "node:buffer";

export const maxNotesBytes = 16_000_000;
const states = ["pending", "correction", "checked"];
const validDate = value => typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));
const bounded = (value, limit) => typeof value === "string" && value.length <= limit;

export function parseEditorialNotes(text, catalog) {
  if (typeof text !== "string" || Buffer.byteLength(text, "utf8") > maxNotesBytes) throw Error("Arquivo de anotações muito grande ou inválido.");
  let data;
  try { data = JSON.parse(text.replace(/^\uFEFF/, "")); }
  catch { throw Error("Arquivo JSON inválido; nenhuma anotação recebida."); }
  if (!data || data.schema !== 1 || data.catalogHash !== catalog.catalogHash) throw Error("Catálogo incompatível. Use a exportação da revisão atual; a versão anterior continua separada.");
  if (!bounded(data.reviewer, 120) || !Array.isArray(data.entries) || data.entries.length > catalog.questions.length ||
      (Object.hasOwn(data, "exportedAt") && !validDate(data.exportedAt))) throw Error("Formato de anotações inválido.");
  const byId = new Map(catalog.questions.map(q => [q.id, q]));
  const seen = new Set();
  const entries = data.entries.map(e => {
    const q = e && byId.get(e.id);
    if (!q || seen.has(e.id) || e.version !== q.version || !states.includes(e.status) ||
        !bounded(e.note, 8000) || !bounded(e.by, 120) || !bounded(e.at, 120) ||
        (e.status === "checked" && (!e.by.trim() || !validDate(e.at)))) throw Error("Anotações com ID, versão, marcação ou identificação inválidos.");
    seen.add(e.id);
    return { id: e.id, version: e.version, status: e.status, note: e.note, by: e.by, at: e.at };
  });
  return { schema: 1, catalogHash: data.catalogHash, reviewer: data.reviewer, exportedAt: data.exportedAt ?? null, entries };
}

// Conteúdo recebido é texto; não interpretar links, HTML ou instruções do revisor.
function inline(value) {
  let safe = Array.from(value).map(c => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127 ? " " : c).join("")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  for (const c of ["\\", "`", "*", "_", "[", "]", "(", ")", "#", "!", "|"]) safe = safe.replaceAll(c, "\\" + c);
  return safe;
}
function literal(value) {
  const text = value.replaceAll("\r\n", "\n");
  const longest = Math.max(0, ...Array.from(text.matchAll(/`+/g), m => m[0].length));
  const fence = "`".repeat(Math.max(3, longest + 1));
  return `${fence}text\n${text}\n${fence}`;
}

export function editorialNotesReport(notes, catalog) {
  const byId = new Map(notes.entries.map(e => [e.id, e]));
  const rows = catalog.questions.map(q => ({ q, e: byId.get(q.id), status: byId.get(q.id)?.status ?? "pending" }));
  const counts = Object.fromEntries(states.map(s => [s, rows.filter(r => r.status === s).length]));
  const descriptions = { pending: "Pendente", correction: "Precisa de ajustes", checked: "Conferida no arquivo" };
  const checkedWithNotes = rows.filter(r => r.status === "checked" && r.e.note.trim()).length;
  const subjects = [...new Set(catalog.questions.map(q => q.subject))].map(subject => {
    const group = rows.filter(r => r.q.subject === subject);
    return `| ${inline(group[0].q.subjectName)} | ${group.length} | ${group.filter(r => r.status === "pending").length} | ${group.filter(r => r.status === "correction").length} | ${group.filter(r => r.status === "checked").length} |`;
  });
  const detail = rows.filter(r => r.e && (r.e.note.trim() || r.status !== "pending")).map(({ q, e, status }) => {
    const signature = status === "checked" ? `\nDeclarada por ${inline(e.by)} em ${inline(e.at)}.\n` : "";
    return `### ${q.label} · v${q.version} · ${inline(q.topic)}\n\n${descriptions[status]}.${signature}\n${e.note.trim() ? literal(e.note) : "Sem comentário."}\n`;
  }).join("\n");
  return `# Anotações recebidas — revisão editorial\n\nCatálogo: \`${notes.catalogHash}\`.\n\nRevisor declarado no arquivo: ${inline(notes.reviewer.trim()) || "não informado"}. Exportação declarada: ${notes.exportedAt ? inline(notes.exportedAt) : "não informada"}.\n\nArquivo compatível com o catálogo atual. Esta validação confere formato e versões; não autentica o revisor nem comprova qualidade pedagógica. Nenhuma questão, modelo ou marcação no banco foi alterada.\n\n${notes.entries.length} entradas recebidas para ${rows.length} questões. Ausências contam como pendentes. ${counts.pending} pendentes, ${counts.correction} com ajustes e ${counts.checked} conferidas no arquivo.\n\n${checkedWithNotes} conferidas também contêm comentários: esses comentários precisam ser lidos antes de qualquer decisão. Mesmo um arquivo com todas as questões conferidas não aprova automaticamente o conteúdo, os modelos ou a publicação.\n\n## Por matéria\n\n| Matéria | Total | Pendentes | Com ajustes | Conferidas no arquivo |\n| --- | ---: | ---: | ---: | ---: |\n${subjects.join("\n")}\n\n## Questões pendentes\n\n${rows.filter(r => r.status === "pending").map(r => r.q.label).join(", ") || "Nenhuma marcada como pendente neste arquivo."}\n\n## Questões com ajustes\n\n${rows.filter(r => r.status === "correction").map(r => r.q.label).join(", ") || "Nenhuma marcada com ajustes neste arquivo."}\n\n## Comentários e marcações\n\n${detail || "Nenhum comentário ou conferência recebido."}\n\n## Próximo passo\n\nLer os comentários e decidir as correções necessárias. Conteúdo alterado exige nova conferência da versão corrigida. A ferramenta cobre questões; revisão dos seis modelos de simulado continua separada. Publicação e lançamento comercial exigem decisão explícita e as demais evidências do projeto.\n`;
}
