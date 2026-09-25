# Tentativa anônima — etapa 10

Etapa 10 concluída e aguardando teste do usuário. SUPABASE_SECRET_KEY configurada localmente e integração privilegiada verificada: cinco testes HTTP aprovados, nenhum ignorado. Nenhum valor de credencial exibido ou versionado.

## Fluxo implementado

POST /api/quiz/attempt inicia uma tentativa, sem corpo ou parâmetros. O servidor gera 32 bytes aleatórios (256 bits) e guarda o token em cookie HttpOnly, SameSite=Strict, com duração máxima de 30 minutos. Em produção, cookie __Host-guest_quiz, Secure, sem Domain e Path=/; em desenvolvimento HTTP local, guest_quiz. Somente SHA-256 do token é enviado ao banco. O token não aparece no JSON nem em URLs e não contém dados pessoais.

GET /api/quiz/attempt retoma exclusivamente a tentativa do cookie. Ausência de token, token inválido/desconhecido, expiração ou conclusão não concedem acesso. Repetir POST com cookie válido retoma a tentativa sem aumentar seu prazo; token expirado não é reativado. Requisições iniciais simultâneas sem cookie podem criar tentativas distintas; a interface futura deverá impedir cliques concorrentes. Chamadas ao banco com o mesmo hash são serializadas e idempotentes.

O servidor seleciona duas questões publicadas com gabarito por matéria, totalizando dez. O cliente não escolhe questões, IDs, pontuação, prazo ou gabarito. Se não houver conteúdo suficiente, a criação falha atomicamente com quiz_not_ready; não fica tentativa parcial no banco.

Todas as questões do seed permanecem em draft, sem aprovação humana. Logo, o comportamento esperado após configurar a chave é HTTP 503 com quiz_not_ready. Isso não é falha de conexão. Aprovar testes técnicos não publica conteúdo. A publicação do lote continua dependendo de revisão humana explícita.

## Banco e preservação do conteúdo

Migration 20260925091427_create_guest_quiz_attempts.sql aplicada e sincronizada:

- public.guest_quiz_attempts: ID, hash único, início, expiração e conclusão opcional.
- private.guest_quiz_questions: dez posições por tentativa, ID/versão da questão, enunciado, alternativas, matéria, tópico, gabarito e explicação copiados no início.
- public.start_guest_quiz(text) e public.read_guest_quiz(text): funções de banco (RPCs) executáveis apenas por service_role. SECURITY DEFINER com search_path vazio, objetos qualificados e sem SQL dinâmico.

RLS habilitado nas duas tabelas, sem políticas de liberação. PUBLIC, anon, authenticated e service_role não têm acesso direto às novas tabelas. O servidor usa somente as RPCs, que retornam campos explícitos sem gabarito, explicação ou hash. O schema private não é exposto pela Data API.

Os snapshots preservam também a resposta e explicação para a correção futura, mesmo se a questão original mudar. Nenhuma operação da aplicação permite editar essas cópias. A correção da etapa 12 deve usar o snapshot da tentativa, nunca o gabarito atual da questão. Não confundir preservação histórica com revisão editorial: o admin futuro ainda precisa criar novas versões para alterações relevantes.

## Código

- src/lib/supabase/admin.ts: cliente privilegiado server-only, sem sessão/cookies de usuário e sem persistência de sessão.
- src/lib/data/quizzes.ts: acesso centralizado ao banco, token aleatório, hash e retomada.
- src/lib/quiz/contract.ts: validação e lista explícita dos campos de resposta pública.
- src/lib/quiz/http.ts: handlers testáveis, política de origem e cookies.
- src/app/api/quiz/attempt/route.ts: entrada HTTP, execução Node e conteúdo dinâmico.

Todas as respostas dos handlers usam Cache-Control: private, no-store. POST exige origem permitida e rejeita Sec-Fetch-Site=cross-site, corpo e parâmetros. Não há CORS permissivo. GET também recusa indicação de chamada cross-site. Erros do banco não são enviados ao cliente nem registrados com credenciais.

## Configuração local (concluída; referência para reinstalação)

1. Abra o projeto estudos-etec/if no painel Supabase.
2. Entre em Settings → API Keys → Secret keys. Copie uma chave que começa com sb_secret_.
3. Abra C:\Users\felip\OneDrive\Documentos\projeto_etec-if\.env.local no seu editor.
4. Preserve as duas linhas públicas existentes e acrescente SUPABASE_SECRET_KEY= seguido do valor real, somente nesse arquivo local.
5. Salve e reinicie o servidor. Não envie essa chave pelo chat. .env.local continua ignorado pelo Git.

O nome não pode começar com NEXT_PUBLIC_. A chave pública não substitui a chave privada. Essa credencial é necessária porque usuários comuns não podem executar as RPCs. O cliente administrativo está restrito à DAL do quiz; o cliente server-side do usuário continua separado.

No desenvolvimento local, execute:

```powershell
Set-Location 'C:\Users\felip\OneDrive\Documentos\projeto_etec-if'
npm.cmd run dev -- --hostname 127.0.0.1
```

Se a porta 3000 estiver ocupada pelo servidor existente, pare-o com Ctrl+C no terminal onde está rodando antes de reiniciar. Abra http://127.0.0.1:3000. O botão da entrada ainda mostra o aviso de preparação; a interface do quiz pertence à etapa 11.

Em produção, APP_ORIGIN deve conter a origem HTTPS exata do site. Sem essa configuração, POST é recusado. npm run start usa modo de produção, portanto não é o modo indicado para testar este cookie em HTTP local. Nenhum deploy realizado.

## Testes e resultados

Em outro PowerShell, na pasta do projeto, execute um comando por vez:

```powershell
npm.cmd run test:guest
npx.cmd --no-install supabase db query --linked --file supabase/tests/verify_guest_quiz.sql
npx.cmd --no-install supabase db query --linked --file supabase/tests/test_guest_quiz.sql
npm.cmd run test:guest:http
```

Resultados já obtidos:

- Nove testes isolados passaram (incluindo regressão de POST com stream vazio): cookies seguros, retomada, rejeição de token, CSRF, origem de produção, payload indevido, erros sem detalhes e exclusão de campos privados. Usam DAL simulada; não provam conexão administrativa real.
- Cinco verificações de catálogo passaram: RLS, ausência de acesso direto, RPCs restritas, ausência de policies de liberação e chaves estrangeiras dos snapshots.
- 26 verificações de comportamento passaram no PostgreSQL remoto: criação, distribuição por matéria, retomada, isolamento, expiração, conclusão, rejeição de hashes inválidos, falha sem conteúdo e preservação de questões/gabaritos.
- Teste SQL usa uma transação, simula publicação somente dentro dela e termina com ROLLBACK. Não publica o seed para outras conexões nem mantém tentativas de teste.
- HTTP real: cinco testes passaram, nenhum ignorado, incluindo quiz_not_ready vindo do Supabase. Na retomada, o teste revelou que Next representa POST vazio como stream não nulo. A validação passou a inspecionar os bytes, sem acumular o corpo; conteúdo não vazio continua rejeitado.
- Build e lint aprovados. Node emite aviso MODULE_TYPELESS_PACKAGE_JSON ao testar módulos TypeScript diretamente; testes passam sem alterar o tipo de módulo do projeto.

O teste HTTP atual pressupõe lote em rascunho. Depois de publicação autorizada, adaptar esse teste ao novo estado. Criação positiva com cookie foi testada isoladamente e no banco; o percurso positivo completo aplicação → Supabase → navegador aguarda conteúdo aprovado. A configuração privada e a comunicação real com as RPCs foram verificadas.

## Limites e próximo passo

Nenhum recebimento de respostas ou cálculo de nota nesta etapa; correção na etapa 12. Não há associação à conta, limpeza agendada de tentativas ou limitação de frequência para produção ainda. Rate limiting e retenção precisam ser definidos antes de publicar o endpoint. Não liberar este serviço publicamente como está.

Critérios atendidos: estrutura versionada, seleção no servidor, token opaco, expiração, histórico preservado, RLS/GRANTs e testes de permitir/negar. Teste da aplicação com credencial privada concluído. Após confirmação do usuário, etapa 11 — mockup do quiz antes da implementação visual.

Referências: [Supabase Functions](https://supabase.com/docs/guides/database/functions), [chaves de API](https://supabase.com/docs/guides/getting-started/api-keys) e guias locais do Next.js 16.3.6 sobre Route Handlers e cookies.
