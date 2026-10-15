import {createServer} from 'node:http';
import {randomBytes, timingSafeEqual} from 'node:crypto';

// Ephemeral loopback form. Passwords never enter command arguments, logs or chat.
export function promptRecoveryPassword(confirm = false, {onReady, timeout = 10 * 60000} = {}) {
  return new Promise((resolve, reject) => {
    const token = randomBytes(32).toString('hex');
    const route = '/recuperacao/' + token;
    let origin, settled = false, timer;
    const server = createServer(async (request, response) => {
      response.setHeader('Cache-Control', 'no-store');
      response.setHeader('Referrer-Policy', 'no-referrer');
      response.setHeader('X-Content-Type-Options', 'nosniff');
      response.setHeader('Content-Security-Policy', `default-src 'none'; style-src 'nonce-${token}'; script-src 'nonce-${token}'; connect-src 'self'; form-action 'none'; frame-ancestors 'none'; base-uri 'none'`);
      const address = request.headers.host;
      if (address !== new URL(origin).host || request.url !== route || settled) {response.writeHead(404).end(); return;}
      if (request.method === 'GET') {
        response.setHeader('Content-Type', 'text/html; charset=utf-8');
        response.end(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Recuperação do backup | Meta Aprovação</title>
<style nonce="${token}">*{box-sizing:border-box}body{margin:0;background:#f7f6ee;color:#173d32;font:17px/1.5 system-ui,sans-serif}main{max-width:500px;margin:8vh auto;padding:28px}h1{font-size:30px;line-height:1.2}label{display:block;font-weight:650;margin-top:22px}input{width:100%;font:inherit;min-height:52px;border:1px solid #52695d;border-radius:8px;background:white;padding:10px;margin-top:6px}button{margin-top:26px;width:100%;min-height:54px;font:700 17px system-ui;background:#19583f;color:white;border:2px solid #164632;border-radius:9px;cursor:pointer}button:disabled{opacity:.7}input:focus-visible,button:focus-visible{outline:3px solid #ca8d21;outline-offset:3px}small{display:block;margin-top:16px}#message{min-height:50px}a{color:#164f3b}</style>
<main><p>Meta Aprovação</p><h1>${confirm ? 'Proteja a recuperação do backup' : 'Confira a recuperação'}</h1><p>${confirm ? 'Crie uma senha exclusiva com pelo menos 16 caracteres e guarde-a no seu gerenciador de senhas.' : 'Digite a senha de recuperação que você guardou.'}</p><form><label for="password">Senha de recuperação</label><input id="password" type="password" autocomplete="${confirm ? 'new-password' : 'current-password'}" minlength="16" maxlength="256" required>${confirm ? '<label for="confirmation">Repita a senha</label><input id="confirmation" type="password" autocomplete="new-password" minlength="16" maxlength="256" required>' : ''}<button>Conferir e continuar</button></form><p id="message" role="status" aria-live="polite"></p><small>Este formulário funciona somente neste computador. Não envie sua senha pelo chat. Esquecer a senha pode impedir a recuperação em outro computador.</small></main>
<script nonce="${token}">document.querySelector('form').addEventListener('submit',async event=>{event.preventDefault();const button=document.querySelector('button'),message=document.querySelector('#message'),password=document.querySelector('#password');if(${confirm}&&password.value!==document.querySelector('#confirmation').value){message.textContent='As duas senhas precisam ser iguais.';return}button.disabled=true;message.textContent='Recebendo a senha neste computador…';try{const response=await fetch(location.pathname,{method:'POST',headers:{'Content-Type':'application/json','X-Recovery-Token':'${token}'},body:JSON.stringify({password:password.value})});password.value='';const confirmation=document.querySelector('#confirmation');if(confirmation)confirmation.value='';if(!response.ok)throw Error();message.textContent='Senha recebida. Volte à conversa para acompanhar a conferência.';document.querySelector('form').hidden=true}catch{message.textContent='Não foi possível concluir. Volte à conversa para abrir um novo formulário.';button.disabled=false}});</script></html>`);
        return;
      }
      const received = request.headers['x-recovery-token'];
      if (request.method !== 'POST' || request.headers.origin !== origin || request.headers['content-type'] !== 'application/json' || typeof received !== 'string' || received.length !== token.length || !timingSafeEqual(Buffer.from(received), Buffer.from(token))) {response.writeHead(403).end(); return;}
      try {
        const chunks = []; let bytes = 0;
        const bodyTimer = setTimeout(() => request.destroy(), 5000);
        try {for await (const chunk of request) {bytes += chunk.length; if (bytes > 4096) throw Error(); chunks.push(chunk);}}
        finally {clearTimeout(bodyTimer);}
        const {password} = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (typeof password !== 'string' || password.length < 16 || password.length > 256) throw Error();
        settled = true;
        clearTimeout(timer);
        response.setHeader('Connection', 'close');
        response.setHeader('Content-Type', 'application/json');
        response.end('{"received":true}');
        server.close(() => resolve(password));
        server.closeIdleConnections();
      } catch {response.writeHead(400).end();}
    });
    server.requestTimeout = 6000;
    server.headersTimeout = 6000;
    server.on('error', () => {clearTimeout(timer); reject(Error('password_form_unavailable'));});
    server.listen(0, '127.0.0.1', () => {
      origin = 'http://127.0.0.1:' + server.address().port;
      const url = origin + route;
      if (onReady) onReady(url);
      else console.log(JSON.stringify({passwordFormUrl: url}));
      timer = setTimeout(() => {settled = true; server.closeAllConnections(); server.close(); reject(Error('password_not_provided'));}, timeout);
    });
  });
}
