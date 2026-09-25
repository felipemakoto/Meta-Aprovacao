# Decisões técnicas

Este documento registra escolhas, razões e consequências. O estado operacional e as versões verificadas ficam em ESTADO-DO-PROJETO.md. As decisões abaixo não significam que funcionalidades futuras já estejam implementadas.

## Base adotada na etapa 1

- Node.js 24 LTS já instalado, versão 24.20.0, compatível com Node >=20.9 exigido pelo Next.js escolhido.
- Next.js 16.3.6 estável, verificado na documentação oficial e no registro npm. Gerador create-next-app 16.3.6.
- React 19.2.8, TypeScript, Tailwind, ESLint, App Router, src e alias @/*. Sem React Compiler.
- Somente npm; package-lock.json registra versões exatas para npm ci.
- Uma aplicação Next.js para páginas e futuros endpoints HTTP. Camada de dados e regras sensíveis em src/lib/data quando a etapa correspondente chegar.
- Manter o exemplo oficial. Design system e mockup na etapa 4, com aprovação antes da interface final.
- Nenhum serviço externo, banco, autenticação ou pagamento configurado nesta etapa. Sem contratação ou variáveis de ambiente.
- Git básico desde o início; fluxo documentado na etapa 2 e documentação consolidada na etapa 3.
- Parar após cada etapa e aguardar teste do usuário.

## Razões e consequências — consolidação da etapa 3

### Aplicação única e organização

Adotado: Next.js App Router com React e TypeScript, em uma aplicação única. Isso mantém páginas e futuros endpoints no mesmo projeto e reduz a quantidade de serviços que um iniciante precisa operar. Tailwind já está instalado; nenhuma biblioteca visual adicional foi acrescentada. A página atual continua sendo o exemplo oficial.

Planejado: endpoints HTTP usarão Route Handlers; Server Actions serão usados quando apropriados. Consultas e regras importantes serão centralizadas em src/lib/data, evitando regras críticas apenas nos componentes visuais. Essa camada ainda não existe.

### Instalação reproduzível

Adotado: Node 24 LTS e somente npm. O package-lock.json registra as versões resolvidas; npm ci reproduz essa instalação. As dependências principais não serão atualizadas sem necessidade e verificação de compatibilidade. Isso reduz diferenças entre instalações e facilita investigar erros.

Pendência conhecida: o gerador trouxe ESLint 9 com aviso de fim de suporte e aviso do npm sobre o script do unrs-resolver. Os checks da etapa 1 passaram. Esta etapa documental não resolveu esses avisos nem alterou dependências; a revisão continua registrada no estado.

### Git e recuperação

Adotado na etapa 2: preservar identidade existente e branch master, revisar diferenças antes de preparar arquivos e criar commits pequenos por etapa. Nenhum remoto Git foi configurado. O histórico local permite consultar versões, mas não substitui backup externo.

Adotado: .env* e pastas geradas ficam ignorados. Segredos não entram no código, documentação, logs ou commits. A documentação futura de configuração conterá somente nomes de variáveis e placeholders.

### Integrações futuras

Planejado no pedido: Supabase para banco e autenticação, Vercel para hospedagem e Kiwify para pagamentos. Nenhum desses serviços está configurado ou contratado. APIs, permissões, custos e limites serão conferidos na documentação oficial quando cada etapa chegar; nenhum plano gratuito é garantido por este registro.

Diretrizes para essas etapas: separar clientes Supabase de navegador, servidor do usuário e administrativo; validar identidade e autorização no servidor; registrar estrutura do banco em migrations; proteger gabaritos, assinaturas e operações administrativas. Não há tabelas, migrations ou endpoints implementados nesta fase.

### Processo visual e etapas

Adotado: trabalho em uma etapa testável por vez, seguido de pausa para o usuário. Etapa 4 começa por objetivo, hierarquia, design system e mockup mobile. Implementação visual definitiva somente após aprovação. O nome de produto e a identidade visual ainda não foram definidos; projeto_etec-if é o nome técnico da pasta.

### Responsabilidade de cada documento

- README: descrição, instalação, execução, comandos e configuração necessária.
- DECISIONS: escolhas arquiteturais, justificativas e implicações.
- ESTADO-DO-PROJETO: etapas, versões verificadas, rotas, testes, pendências e checkpoint.

Atualizar documentos afetados ao concluir cada etapa. Não marcar funcionalidades planejadas como concluídas nem reproduzir resultados antigos como se tivessem sido verificados novamente.

## Fontes consultadas na etapa 1
- https://nodejs.org/en/about/previous-releases
- https://nextjs.org/docs/app/getting-started/installation
- https://nextjs.org/docs/app/api-reference/cli/create-next-app

## Etapa 4 — proposta ainda não aprovada

Direção proposta: editorial de estudos, fundo claro, verde profundo e marca-texto amarelo. Manter Geist já disponível no projeto e usar ETEC / IF como identificação descritiva provisória. Tokens, componentes e hierarquia estão em DESIGN-SYSTEM.md; referência raster e prompt em design/. Não incorporar a proposta ao CSS da aplicação antes da aprovação. Nenhuma publicação pelo Sites foi feita nesta etapa.

## Revisão visual v2 — feedback do usuário

Remover Seu próximo passo, UM PONTO DE PARTIDA e UM PASSO DE CADA VEZ. Substituir os três indicadores por uma faixa editorial inspirada em caderno de questões, com texto descritivo único. Trocar o fecho motivacional por informação concreta sobre a revisão das respostas. Botão da entrada com raio 6px. Motivo: reduzir repetição de composição e frases genéricas, fortalecendo relação com estudo. Referência atual: design/entrada-mobile-v2.png; v1 preservada somente como histórico. Pesquisa em design/PESQUISA-VISUAL.md. A revisão continua aguardando aprovação antes de React/CSS.

## Revisão visual v3 — card e tipografia

Por pedido do usuário, substituir toda a faixa de diagnóstico por um card compacto com apenas 10 questões, sem explicação. Títulos passam a serifada editorial com referência Lora 600; corpo e botões permanecem em Geist Sans. A imagem é uma aproximação visual da fonte; conferir a correspondência na implementação. Referência ativa: design/entrada-mobile-v3.png. Versões anteriores preservadas como histórico. Aprovação visual continua pendente; aplicação e dependências não foram alteradas.

## Etapa 4 — aprovação v4 e implementação

Os registros anteriores descrevem a sequência histórica. A referência vigente é design/entrada-mobile-v4.png, aprovada pelo usuário. Removido o card 10 questões, preservando o espaço anterior ao CTA. Página de exemplo substituída pela entrada em React/CSS no projeto Next.js existente.

DM Serif Display 400 aproxima o título da imagem; Geist permanece no corpo. next/font serve as fontes no próprio site. CSS Modules organiza os estilos da tela e globals.css concentra tokens e foco. Apenas o botão usa componente cliente para revelar o aviso; a página continua como componente servidor.

O CTA mantém o texto aprovado, mas informa ao clique que o teste está em preparação. Sem tentativas ou diagnóstico nesta etapa. Heroicons oficiais locais com licença preservada fornecem as setas, sem dependência npm adicional.

Verificação visual em design-qa.md; lint e build aprovados. Nenhuma integração ou publicação. Pausar para teste do usuário antes da etapa 5.

## Etapa 5 — preparação do Supabase

Usuário autorizou avançar após a etapa 4. Escopo: criar e verificar projeto Supabase de desenvolvimento em organização Free. Nome proposto projeto-etec-if-dev; região preferida São Paulo (sa-east-1), sujeita à disponibilidade no painel. Custos e limites conferidos na documentação oficial e registrados em SUPABASE.md.

O painel exige login; o projeto remoto ainda não foi criado ou verificado. Senhas e aceite de termos ficam com o usuário diretamente no painel. Sem chaves administrativas, serviço pago ou descarte de projetos existentes. A etapa 6 implementará clientes e autenticação; a etapa 7 criará tabelas via migrations. Nenhum pacote ou código de integração adicionado agora.

## Etapa 5 — criação concluída em 24/09/2026

Após o usuário criar a conta e preencher o formulário, preservamos o nome estudos-etec/if e a região São Paulo. Organização meta aprovação no plano Free; referência do projeto clxnqrkdalimrqcnhegr. O painel confirmou Healthy e compute Nano após o provisionamento. A sugestão anterior de nome não foi aplicada, respeitando a escolha preenchida pelo usuário.

Mantida a Data API, desativada a exposição automática de novas tabelas e ativado RLS automático no formulário de criação. Isso exige concessões explícitas de acesso e políticas nas próximas migrations; não substitui os testes de autorização. Nenhuma tabela de exemplo criada e nenhuma chave administrativa obtida. A etapa 6 fará a integração ao Next.js existente; não adicionamos pacotes ou arquivos de ambiente na etapa 5.

## Etapa 6 — clientes e autenticação base (24/09/2026)

Mantido o Next.js 16.3.6. Instalados com versões fixas @supabase/supabase-js 2.117.1, @supabase/ssr 0.12.7 e server-only 0.0.1. Compatibilidade conferida no registro npm e instruções SSR oficiais. Cookies assíncronos e src/proxy.ts seguem os guias da versão local do Next.

Separados cliente de navegador e cliente de servidor do usuário, ambos com chave publishable. Nenhum cliente administrativo criado sem necessidade. URL e chave pública configuradas apenas em .env.local ignorado pelo Git; não foram obtidas chaves privadas.

Proxy renova cookies com getClaims e preserva cabeçalhos contra cache; o matcher cobre apenas /api/auth por enquanto. A rota /api/auth/status verifica novamente a identidade por getUser, retorna apenas authenticated, rejeita ausência/sessão inválida com 401 e falha operacional com 503. Ela não concede acesso a recursos. Novas operações deverão validar identidade, autorização e entradas individualmente.

Cadastro, login/logout e recuperação pertencem às etapas 14–16; não foram criadas telas nem contas de teste nesta fase. Testes de configuração e integração exercitam acesso anônimo, cookie corrompido, sessão forjada, homepage pública e conexão real ao Auth. Renovação de sessão válida e fluxos completos ainda precisam de teste nas etapas de conta. Instruções em AUTH-BASE.md.

## Etapa 7 — fluxo de migrations concluído

CLI oficial Supabase 2.117.0 instalada via npm como devDependency fixa. Arquivos SQL em supabase/migrations são a fonte oficial da estrutura. A migration inicial prepara schema private e defaults de privilégio restritivos para objetos futuros criados por postgres; não antecipa tabelas de questões da etapa 8. Defaults globais e por schema tratados separadamente conforme PostgreSQL.

Aplicação remota via db push, com dry-run e migration list, depois de conferir o projeto existente. Não executar DDL avulso pelo painel nem editar histórico para simular aplicação. A CLI requer login próprio; sessão do painel e chave pública não substituem essa autorização. Usuário concluiu login; projeto vinculado e PostgreSQL 17.6 confirmado. Migration 20260925015139 aplicada; histórico sincronizado e quatro verificações SQL aprovadas. Sem Docker detectado, a stack local não foi iniciada. Configuração local não enviada ao remoto. Etapa 8 aguarda teste do usuário.

## Etapa 8 — questões e gabarito protegido

Teste da etapa 7 confirmado ao continuar. Migration 20260925085403 cria public.questions e public.question_answers conforme o modelo solicitado. Cinco alternativas obrigatórias no formato inicial, campos editoriais validados por CHECK e gabarito único vinculado por chave estrangeira com exclusão restrita. Defaults draft/versão 1; timestamps automáticos por trigger SECURITY INVOKER no schema private.

As duas tabelas têm RLS sem políticas de liberação e nenhum GRANT para PUBLIC, anon ou authenticated. Nem questões publicadas são baixadas diretamente pelo navegador. service_role mantém somente SELECT nessas tabelas; nenhuma chave administrativa adicionada ao aplicativo. Escrita futura requer nova migration. Rotas de tentativa e correção implementarão sua própria autorização antes de retornar dados.

Não antecipar aprovação administrativa ou imutabilidade de questões usadas: ainda não há tentativas. Antes da etapa 10, definir preservação de id/versão e conteúdo, conforme QUESTOES.md. Status draft por padrão não comprova revisão humana; publicação automatizada de conteúdo gerado por IA permanece proibida.

Verificação no banco remoto de desenvolvimento: 51 asserções SQL com rollback de fixtures e GRANTs temporários, seis checagens de catálogo, teste HTTP da chave pública e lint aprovados. Histórico sincronizado e tabelas vazias após rollback. Papel authenticated testado no PostgreSQL; sessão real ficará para etapas de conta. Pausa para teste do usuário antes do seed da etapa 9.

## Etapa 9 — seed de desenvolvimento

Lote de 10 questões originais de exemplo geradas com auxílio de IA, duas por matéria, em draft e com gabaritos explicados. Revisão humana separada em REVISAO-SEED.md; confirmar testes não autoriza publicação. Não copiar provas oficiais nem usar dados pessoais ou segredos.

Seed somente de dados em supabase/seed.sql, separado das migrations e habilitado na configuração local. Carga remota explícita via CLI no projeto de desenvolvimento, sem reset nem config push. IDs estáveis; inserção atômica com ON CONFLICT DO NOTHING. Gabaritos inseridos apenas junto a questões novas, sem reparar ou sobrescrever registros existentes silenciosamente. Nenhuma nova migration.

Teste de idempotência via Node invoca a CLI instalada, sem shell intermediário. Duas reexecuções comparam todas as linhas e timestamps depois de uma edição simulada; tudo revertido por ROLLBACK. Isso preserva revisões futuras. Cinco checagens do lote, teste de preservação, teste da API e lint aprovados. Seed automático local não testado por ausência de Docker.

## Etapa 10 — tentativa anônima

Token aleatório de 256 bits criado no servidor e transportado apenas em cookie HttpOnly/SameSite=Strict; Secure e prefixo __Host- em produção. Banco recebe somente SHA-256. Prazo fixo de 30 minutos e retomada sem renovação. ID público não autoriza acesso. POST não aceita corpo, IDs ou parâmetros e valida a origem; APP_ORIGIN HTTPS obrigatório em produção.

Migration 20260925091427 cria tentativas e snapshots privados contendo também gabarito/explicação. Seleção atômica de duas questões publicadas por matéria; indisponibilidade reverte a tentativa. Snapshots preservam conteúdo apesar de edições posteriores. Correção futura deverá usar essa cópia.

Novas tabelas sem acesso direto inclusive de service_role; somente duas RPCs SECURITY DEFINER com search_path vazio e EXECUTE para service_role. DAL server-only usa cliente administrativo sem sessão de usuário. SUPABASE_SECRET_KEY passa a ser necessária somente no servidor, ainda pendente no ambiente local. Lote não publicado automaticamente.

Oito testes isolados, 26 verificações SQL, cinco checagens de catálogo, build/lint e quatro testes HTTP passaram. Um teste de integração real ignorado por chave ausente. Testes positivos no banco usam publicação transitória revertida, não uma aprovação editorial. Taxa de requisições, retenção e fluxo visual ficam para etapas posteriores; não publicar o endpoint antes dos controles de produção.

Pausa solicitada pelo usuário na etapa 10: configurar a Secret key futuramente e retomar o teste HTTP. Checkpoint parcial salvo; não considerar a etapa encerrada.

## Conclusão da etapa 10 após retomada

SUPABASE_SECRET_KEY configurada pelo usuário e verificada sem exibição. O teste HTTP detectou rejeição indevida de POST vazio: Next pode fornecer um stream não nulo sem bytes. Validar os bytes e interromper na primeira ocorrência de conteúdo, sem acumular corpo, preserva a recusa de payloads e aceita o POST legítimo. Regressão adicionada: nove testes isolados e cinco HTTP aprovados sem ignorados. Não houve publicação do lote nem alteração de banco. Pausa anterior encerrada; aguardar teste antes do mockup da etapa 11.
