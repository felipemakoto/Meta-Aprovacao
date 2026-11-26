function escapeText(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

// Lucide CircleAlert, inlined so the maintenance response needs no client JavaScript.
const noticeIcon = `<svg class="notice-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <circle cx="12" cy="12" r="10"></circle>
  <line x1="12" x2="12" y1="8" y2="12"></line>
  <line x1="12" x2="12.01" y1="16" y2="16"></line>
</svg>`;
const description = "Estamos fazendo ajustes na plataforma. Tente acessar novamente daqui a pouco.";

function renderPage(message: string | null | undefined): string {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>Site em manutenção | Meta Aprovação</title>
  <link rel="icon" href="/icon.svg" type="image/svg+xml">
  <style>
    @font-face { font-family: Manrope; src: url("/fonts/meta/manrope-latin.woff2") format("woff2"); font-weight: 400 800; font-display: swap; }
    :root { color-scheme: light; --canvas: #f5f4f1; --ink: #20251f; --muted: #545b52; --action: #237b38; --action-hover: #185d29; --button-text: #fff; }
    * { box-sizing: border-box; }
    body { min-height: 100svh; margin: 0; background: var(--canvas); color: var(--ink); font: 1rem/1.6 Manrope, Arial, sans-serif; }
    header { width: min(calc(100% - 64px), 1280px); margin-inline: auto; padding-block: 28px; }
    .brand { display: flex; align-items: center; gap: 10px; min-height: 44px; font-size: 22px; font-weight: 800; letter-spacing: -.035em; }
    .brand img { display: block; }
    main { width: min(calc(100% - 64px), 640px); margin-inline: auto; padding-block: 48px 64px; }
    h1 { margin: 0 0 20px; font-size: clamp(30px, 6vw, 44px); font-weight: 750; line-height: 1.2; text-wrap: balance; }
    p { margin: 0; }
    .description { font-size: 19px; line-height: 1.7; color: var(--muted); text-wrap: pretty; }
    .notice, .description-with-icon { display: grid; grid-template-columns: 20px minmax(0, 1fr); align-items: start; column-gap: 10px; }
    .notice { margin-top: 24px; }
    .notice-icon { display: block; margin-top: 4px; color: var(--action); }
    .description-with-icon .notice-icon { margin-top: 6px; }
    .notice h2 { margin: 0 0 4px; color: var(--action); font-size: 18px; font-weight: 750; }
    .notice p { color: var(--muted); white-space: pre-wrap; overflow-wrap: anywhere; }
    .retry { display: flex; align-items: center; justify-content: center; min-height: 56px; margin-top: 32px; padding: 14px 20px; border: 1px solid var(--action); border-radius: 12px; background: var(--action); color: var(--button-text); font-size: 18px; font-weight: 650; text-align: center; text-decoration: none; }
    .retry:hover { background: var(--action-hover); }
    .retry:focus-visible { outline: 3px solid var(--action); outline-offset: 4px; }
    @media (max-width: 599px) {
      header, main { width: calc(100% - 32px); }
      header { padding-block: 20px; }
      .brand { font-size: 18px; }
      .brand img { width: 30px; height: 30px; }
      main { padding-block: 32px 48px; }
    }
    @media (prefers-color-scheme: dark) {
      :root { color-scheme: dark; --canvas: #111813; --ink: #eff4ed; --muted: #b6c4b7; --action: #afdaa4; --action-hover: #c5e9bd; --button-text: #15291d; }
    }
  </style>
</head>
<body>
  <header>
    <p class="brand"><img src="/icon.svg" width="36" height="36" alt="">Meta Aprovação</p>
  </header>
  <main>
    <h1>Site em manutenção</h1>
    ${message
      ? `<p class="description">${description}</p>
    <section class="notice" aria-labelledby="maintenance-notice">
      ${noticeIcon}
      <div><h2 id="maintenance-notice">Aviso da equipe</h2><p>${escapeText(message)}</p></div>
    </section>`
      : `<div class="description-with-icon">${noticeIcon}<p class="description">${description}</p></div>`}
    <a class="retry" href="">Tentar novamente</a>
  </main>
</body>
</html>`;
}

export function maintenanceResponse(request: Request, path: string, message?: string | null): Response {
  const headers = { "Cache-Control": "no-store", "Retry-After": "60" };
  if (path.startsWith("/api/") || !["GET", "HEAD"].includes(request.method)) {
    return Response.json({ error: "site_in_maintenance" }, { status: 503, headers });
  }
  return new Response(request.method === "HEAD" ? null : renderPage(message), {
    status: 503,
    headers: { ...headers, "Content-Type": "text/html; charset=utf-8" },
  });
}
