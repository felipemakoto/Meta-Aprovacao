# Clientes Supabase e autenticação base — etapa 6

Implementado em 24/09/2026 no Next.js existente. Esta etapa prepara a infraestrutura; cadastro, login/logout e recuperação de senha continuam nas etapas 14–16 do roteiro. Não criamos usuários, tabelas ou migrations.

## Dependências e configuração

- @supabase/supabase-js 2.117.1 (requer Node >=22; ambiente usa Node 24).
- @supabase/ssr 0.12.7 (compatível com supabase-js >=2.114.0 na linha 2).
- server-only 0.0.1, para impedir importação dos helpers de servidor no navegador.
- Next.js e React preservados. Usar npm e manter package-lock.json.

A URL e a chave publishable foram obtidas do diálogo Connect do projeto estudos-etec/if. `.env.local` foi criado na raiz, ignorado pelo Git. Não há senha de banco, secret key ou service_role na configuração.

Em outra instalação, criar `C:\Users\felip\OneDrive\Documentos\projeto_etec-if\.env.local` com os valores públicos do painel, substituindo os placeholders:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_SUBSTITUIR_LOCALMENTE
```

Reiniciar o servidor depois de alterar o arquivo. As variáveis NEXT_PUBLIC_ podem integrar o bundle público; nunca colocar chaves administrativas nelas. Após mudar valores para produção, gerar novo build. O helper valida presença, URL HTTPS sem credenciais e prefixo publishable. A configuração real não é versionada.

## Arquivos e responsabilidades

| Arquivo relativo à raiz | Responsabilidade |
| --- | --- |
| src/lib/supabase/config.ts | Validar configuração pública, sem imprimir valores |
| src/lib/supabase/client.ts | Cliente para componentes do navegador, com cookies |
| src/lib/supabase/server.ts | Novo cliente por requisição, usando cookies do usuário e chave pública |
| src/lib/supabase/proxy.ts | Renovar sessão e propagar cookies para a requisição e a resposta, preservando cabeçalhos contra cache |
| src/proxy.ts | Convenção Next.js 16, aplicada por enquanto a /api/auth/:path* |
| src/lib/auth/user.ts | Verificar usuário com getUser no serviço Auth; retornar null para ausência/sessão rejeitada e falhar em erros operacionais |
| src/app/api/auth/status/route.ts | Consultar estado autenticado sem retornar identidade, tokens ou chaves |
| tests/supabase-config.test.mjs | Rejeitar configuração ausente, chave elevada e URL insegura |
| tests/auth-base.test.mjs | Testar conexão real e rejeição de acesso anônimo/forjado |

O cliente de servidor executa em nome do usuário, respeitando suas permissões e RLS. Ele não é um cliente administrativo. Não implementamos cliente administrativo sem uma operação que precise dele.

## Sessão, identidade e cache

O Proxy chama getClaims para renovar a sessão. Ele não concede acesso a dados e não redireciona visitantes da entrada. Cada operação deve verificar identidade novamente no servidor e depois validar autorização e dados. Nunca usar getSession sozinho como prova de identidade.

O helper getVerifiedUser usa getUser para validar a sessão com o serviço Auth. Não interpreta metadados enviados pelo navegador como privilégios. Autorização de recursos será acrescentada nas etapas que criarem os recursos.

A rota GET /api/auth/status responde:

| Situação | HTTP | Corpo |
| --- | --- | --- |
| Sem sessão válida | 401 | {"authenticated":false} |
| Usuário validado | 200 | {"authenticated":true} |
| Erro operacional/configuração | 503 | {"error":"auth_unavailable"} |

Respostas de sessão usam Cache-Control privado e no-store. Nenhuma rota personalizada deve usar cache compartilhado. Ao criar páginas que usem a sessão, ampliar o matcher do Proxy e garantir a política de cache dessas respostas. Server Components não podem gravar cookies; a renovação deve ocorrer no Proxy. Route Handlers e Server Actions podem gravá-los.

## Executar e testar no PowerShell

Com o site já rodando, abrir uma segunda janela:

```powershell
Set-Location 'C:\Users\felip\OneDrive\Documentos\projeto_etec-if'
npm.cmd run test:config
npm.cmd run test:auth
curl.exe -i http://localhost:3000/api/auth/status
```

Resultado esperado: um teste de configuração e cinco testes de integração aprovados. O comando curl mostra HTTP 401, authenticated false e Cache-Control com no-store, pois ainda não há login no aplicativo. O 401 é o resultado correto para visitante sem sessão; não é falha de conexão.

test:auth depende da aplicação rodando em 3000 e de internet para consultar o projeto Supabase. Para outra porta, definir AUTH_TEST_BASE_URL na sessão PowerShell. Os testes usam apenas leituras e tokens sintéticos inválidos, sem criar contas nem enviar emails.

Para iniciar o site caso esteja parado:

```powershell
npm.cmd run dev -- --hostname 127.0.0.1
```

Para checar código e produção, parar dev com Ctrl+C antes do build:

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd start -- --hostname 127.0.0.1
```

## Evidências e limites

- Build e lint passaram; homepage permaneceu estática e /api/auth/status é dinâmica.
- Healthcheck oficial /auth/v1/health respondeu 200 com a chave pública.
- Sem sessão, cookie corrompido e sessão forjada receberam 401, sem dados de usuário e com cache desabilitado.
- Homepage respondeu 200 e foi conferida no navegador, com conteúdo aprovado preservado.
- Na conferência final do build, o navegador integrado teve falha ao reabrir localhost após a reinicialização. A entrada foi aberta com sucesso em http://127.0.0.1:3000/; ambos os endereços responderam 200 por HTTP. Servidor de produção deixado ativo para o teste do usuário.
- O navegador integrado bloqueou a navegação direta ao endpoint que responde 401; a resposta foi verificada por HTTP nos testes e pode ser consultada com curl.
- O SDK emite avisos durante o teste deliberado de cookie corrompido. O teste de configuração pode emitir aviso de inferência de módulo do Node ao importar TypeScript; ambos passaram. Não alteramos o modo de módulos de todo o projeto para ocultar esse aviso.
- Ainda não testamos login de usuário real, expiração/renovação de sessão válida, confirmação por email ou recuperação de senha. Esses cenários dependem das etapas de conta. Não afirmar que o fluxo de login está concluído.
- A instalação npm informou zero vulnerabilidades; o aviso herdado do script unrs-resolver continua sem aprovação adicional.

Se ocorrer 503, conferir os nomes das variáveis, o projeto no painel e a conectividade. Não enviar credenciais ou cookies pelo chat. Se test:auth não conectar ao localhost, iniciar o site e conferir a porta. Guardar o texto do erro sem valores sensíveis.

## Referências consultadas

- [Clientes e Proxy do Supabase](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Sessão e cache no SSR](https://supabase.com/docs/guides/auth/server-side/advanced-guide)
- [Chaves públicas e privadas](https://supabase.com/docs/guides/getting-started/api-keys)
- [API oficial Auth, incluindo healthcheck](https://github.com/supabase/auth/blob/master/openapi.yaml)
- Guias da versão instalada em node_modules/next/dist/docs: Proxy, cookies, variáveis de ambiente, Route Handlers e server-only.

Próxima etapa: 7 — migrations, somente após o teste do usuário desta base.
