# Decisões técnicas

## Etapa 40 — revisão local, separada de publicação

Reunir as cem questões em HTML interno gerado, fora de public e sem imports na aplicação, a partir das fontes existentes. Consulta vinculada somente leitura verifica correspondência com os rascunhos do banco. Marcação de conferência exige revisor, usa armazenamento do navegador e é desfeita ao editar a nota; exportação/importação validam IDs, versões e hash do catálogo, recusando arquivos incompatíveis sem sobrescrever notas. Não atribuir revisão humana ao usuário, mudar status editorial ou disponibilizar gabaritos por essas marcações. Conteúdo/limites comerciais mantidos em rascunho; apontamentos sobre padrões de letras e qualidade dos distratores exigem correção separada. Guia CONFERENCIA-EDITORIAL.md.

## Etapa 39 — lotes de Ciências, História e Geografia

Completar vinte rascunhos por matéria com dezoito questões adicionais e um modelo Premium privado para cada uma das três matérias. Questões originais auxiliadas por IA, apoiadas por referências institucionais com tipo de acesso documentado; exemplos fictícios identificados. Quantidade e conferência do assistente não aprovam conteúdo, dificuldade ou cobertura de edital. JSONs geram SQL/revisões internas; IDs estáveis e conflitos preservados, sem reparo silencioso de gabaritos. Cada lote é uma instrução atômica; carga conjunta aplicada dentro de BEGIN/COMMIT, com hash dos registros anteriores preservado. Ensaio transacional com rollback verifica completude e preservação de alterações editoriais/modelos e ausências na reexecução. Cem questões e seis modelos permanecem não publicados. Próxima etapa é revisão humana identificada; configuração/contrato comercial continuam pendentes. Guia CONTEUDO-ETAPA-39.md.

## Etapa 38 — lote original e modelo de Português

Dezoito questões adicionais e modelo de vinte questões em rascunho para Português, sem publicação editorial ou liberação comercial. JSON fonte única gera revisão interna e SQL; instrução atômica insere modelo privado, questões e gabaritos, preservando conflitos por ID. Teste transacional com rollback verifica completude e preservação de revisões do modelo/conteúdo e de gabarito ausente em reexecução. Carga real preservou hash dos registros anteriores. Modelos por matéria continuam Premium e indisponíveis enquanto não publicados/com cobertura publicada suficiente. Conteúdo original auxiliado por IA; revisão do assistente não substitui humano nem calibra dificuldade. Guia CONTEUDO-PORTUGUES.md.

## Etapa 37 — lote original de Matemática

Preparar dezoito questões adicionais para completar a quantidade de vinte do modelo de Matemática existente, sem converter quantidade em aprovação pedagógica/comercial. Dados separados de migrations/seed inicial, JSON fonte única e revisão interna gerados em conjunto; nenhuma exposição de gabaritos na aplicação. Inserção atômica em draft e IDs estáveis preservam revisões, timestamps e gabaritos existentes, incluindo ausência que exige correção explícita. Ensaio com rollback antes/depois e hash de preservação da carga real aprovados. Nenhum modelo/conteúdo publicado; aprovação humana por questão continua necessária. O comando de teste pressupõe rascunhos; usar banco isolado depois da publicação. Guia CONTEUDO-MATEMATICA.md.

## Prontidão de lançamento — 10/10/2026

Consolidar verificações em uma leitura administrativa, sem endpoint público ou botão de liberar vendas. Contar somente questões publicadas com gabarito e modelos publicados com cobertura suficiente; status de revisão não equivale a publicação. Separar configuração local, indicadores técnicos e evidência comercial/humana não verificada. Centralizar a trava false do checkout no código usado pela API e pela checagem; nunca inferir uma compra comercial a partir de prova sintética ou aprovar publicação editorial por um “continue”. Inventário de retenção somente agregado, sem excluir registros. Guia PRONTIDAO-LANCAMENTO.md.

## Monitoramento Cakto — 10/10/2026

Diagnóstico e registro de condições separados do worker de pagamentos: Cron interno consulta o banco a cada minuto, sem credenciais no comando, sem invocações HTTP e sem alterar direitos ou reprocessar pagamentos. Agregados restritos ao servidor; script administrativo valida a resposta e mostra texto em português. No máximo seis condições persistidas com resolução/recorrência, sem histórico crescente a cada tick. Atraso usa elegibilidade real da fila, preservando backoff e pausas intencionais. Retenção financeira e notificações externas não foram presumidas nem ativadas; detalhes em MONITORAMENTO-CAKTO.md.

## Troca para Cakto — 03/10/2026

Usuário escolheu Cakto, já tem cadastro e ainda precisa criar produto/oferta. Adaptar preparação da etapa 27; preservar visual/preços e histórico das decisões Kiwify abaixo. Schema incremental aceita identidades antigas sem relabeling e novas assinaturas Cakto; checkout cria somente Cakto. Sem fallback de host/variáveis/provedor Kiwify. Usar oferta documentada, não pressupor plano Kiwify. Cupom oficial Cakto somente da primeira cobrança atende R$10 inicial/R$20 recorrente; conferir taxa repassada, validade/fuso e retorno de sck. Documentação de API/webhook Kiwify não vale para Cakto: reavaliar contratos completos antes das etapas 28–31. enabled:false preservado; não cobrar antes de garantir verificação e entrega.

## Etapa 27 — checkout preparado, contratação bloqueada

Conta confirmada e verificada no servidor; POST sem payload nem parâmetros. Oferta/URL/produto/plano vêm apenas da configuração do servidor. Destino HTTPS exato pay.kiwify.com.br, cupom opcional e referência aleatória de 32 bytes em sck. Intenção privada imutável antes do redirect 303; lock por conta, reutilização de 15 minutos, expiração em uma hora/fim da campanha e limite de quatro criações/hora. RPC service_role sem acesso direto à tabela, sem concessão de assinatura.

Usuário ainda não criou produto/oferta. Trava literal enabled:false na rota, sem flag de ambiente que permita ativação acidental. Não habilitar botão nem aceitar pagamentos antes de confirmar preço/renovação, vínculo sck, verificação e entrega. Documentação oficial de cupom recorrente não prova desconto apenas da primeira mensalidade; não improvisar plano permanente de R$10. Valores em centavos e campanha também conferidos pelo relógio do banco. Sem alteração de visual, cotas ou dependências. Etapa preparada não equivale a checkout comercial pronto.

## Etapa 26 — implementação do visual aprovado

Alvo selecionado premium-opcao-1-v6.png. Server Component protegido por getUser e confirmação do e-mail; RPC apenas de leitura da etapa 25, contrato allowlist sem IDs comerciais. Falha operacional é estado distinto do gratuito. Campanha pelo servidor com America/Sao_Paulo e ano/mês explícitos, sem parâmetros do cliente na rota real. Prévia dev isolada com estados ilustrativos e guard de produção.

CTA desabilitado preserva visual verde e comunica contratação/benefícios indisponíveis até a integração. Não conceder acesso, remover quota ou publicar conteúdo por aprovação de um mockup. Sem nova API HTTP, migration ou dependência; somente proxy ampliado para renovar sessão na rota /premium. Fontes/ícones/tokens existentes, CSS da página isolado. Navegador integrado funcionou nesta etapa, permitindo QA próprio do Premium; limites anteriores permanecem históricos.

## Etapa 26 — oferta mensal e proposta visual

Preço definido pelo usuário: R$20/mês, promoção de 50% em outubro. Mockups adotam primeira mensalidade de R$10 para novas assinaturas entre 01 e 31/10/2026 (America/Sao_Paulo), depois R$20; interpretação explicitada, sujeita a ajuste na aprovação. Oferta real da Kiwify precisa cumprir primeiro pagamento, renovação e término da campanha; não basta trocar texto da página. Não aplicar desconto permanente por engano.

Plano proposto: questões/simulados sem limite diário comercial e simulados por matéria do catálogo publicado. Limites técnicos mantidos; histórico, estatísticas e revisão seguem gratuitos. Não vender conteúdo em rascunho nem prometer novos fluxos inexistentes. Três mockups preservam o visual clean aprovado. Implementação aguarda escolha do usuário conforme o fluxo original; pagamento segue reservado às etapas de integração/validação. Detalhes em PREMIUM.md.

## Etapa 25 — Kiwify mantida e assinaturas privadas

Usuário escolheu manter a Kiwify após comparar alternativas, pois já tem cadastro. Schema privado sem escrita pela API; serviço tem somente EXECUTE de leitura, jamais acesso direto à tabela. RPC exige conta confirmada e o servidor futuro deverá fornecer o UUID da sessão verificada. Interface e quotas não consomem esse direito nesta etapa.

Separar provider_status observado de access_state local e intervalo verificado. Acesso negado por padrão; granted/revoked exigem ordem, datas e intervalo finito. Expiração pelo relógio do banco, sem status active isolado nem tolerância inventada. Cancelamento não descarta automaticamente período pago. Produto/proprietário/identidade imutáveis, assinatura externa única e última ordem única; histórico completo de eventos/idempotência e validação oficial ficam para as próximas etapas. Múltiplas assinaturas da mesma conta permitidas, sem somar duração por entrega. Plano externo opcional até contrato real confirmado. Detalhes e testes em ASSINATURAS.md.

## Etapa 24 — contrato Kiwify antes do modelo de assinaturas

Pesquisa oficial em KIWIFY.md. Usar API Pública de vendas, OAuth no servidor e consulta de ordem como evidência independente. Referência aleatória opaca em sck é candidata ao vínculo com checkout, com teste real obrigatório; não enviar dados pessoais/UUID interno na URL nem associar compra automaticamente pelo e-mail. Nomes de triggers configurados e campos de evento recebido não serão confundidos.

Token de webhook existe na configuração documentada, mas o contrato de assinatura da entrega ainda precisa de confirmação oficial. Não inventar protocolo criptográfico. Não conceder Premium a partir de retorno de checkout, payload não validado ou campo premium do cliente. Modelar assinatura privada e direito local separado do estado do provedor na etapa 25, sem ativação paga antecipada. Consulta de período recorrente/access_until, fuso e política de atraso seguem pendentes. Documento atual de Pix Automático de agosto/2026 impede generalizar o artigo antigo de Pix manual. Cancelamento conserva período pago aplicável; idempotência e reconciliação serão implementadas nas etapas específicas.

## Etapa 23 — limites diários confirmados

Usuário escolheu 10 novas práticas e 1 simulado rápido de dez questões por dia, com virada de data em São Paulo. Criação bem-sucedida de tentativa representa consumo, inclusive abandono/repetição; diagnóstico e revisão ficam disponíveis. Contar tentativas existentes do dia, sem reset artificial na implantação. Não depender de parâmetros de plano ou relógio do navegador.

Conferir e criar sob o mesmo lock transacional no banco. Implementadores anteriores ficam privados e sem EXECUTE da API; wrappers novos restringem todos os pontos de início. UUID de busca mantém uma única criação no retry de conexão da prática, ligado à conta e aos filtros. Simulado retoma tentativa ativa da mesma opção antes de aplicar a cota; snapshots e resultados antigos permanecem legíveis. Novos simulados gratuitos exigem catálogo free_access e formato rápido equilibrado de dez questões. Sem assinatura Premium antecipada. Saldo é informativo no cliente; tentativas reais sempre passam pela verificação do servidor. Detalhes em LIMITES-GRATUITOS.md.

## Etapa 22 — estatísticas de respostas concluídas

Agregar no servidor diagnósticos associados, práticas corrigidas e simulados finalizados. Unidade é resposta em uma tentativa, não questão única. Preservar snapshots; não recalcular por conteúdo editável. Períodos all/30d usam conclusão e relógio do banco, incluindo limite inicial da janela e excluindo datas futuras. Associação tardia não altera a data de conclusão.

RPC restrita ao servidor, conta confirmada e propriedade em cada fonte. API retorna apenas agregados e cinco metadados recentes; valida somas/contagens e nunca transforma falha em zero. Porcentagem exige cinco respostas por matéria, sem rótulo de domínio ou previsão de aprovação. Dashboard consolida a mesma atividade e mantém último diagnóstico com identidade própria. Mockup v2 aprovado sem retorno Meus estudos no cabeçalho; retorno ao histórico preservado com seta e alinhamento esquerdo. Detalhes em ESTATISTICAS.md.

## Etapa 21 — simulados privados

Catálogo editorial em private com publicação explícita e verificação de quantidade de conteúdo publicado; exemplos em rascunho não viram fallback. Tentativas preservam snapshots e título, pertencem à conta confirmada e duram até 24 horas antes de finalizar. É prazo técnico, sem tempo oficial de prova. Criação serializada por usuário retoma a tentativa ativa da mesma opção e limita criação a cinco por minuto.

Correção apenas após conferir e enviar todas as escolhas; lock de linha, normalização de respostas, resultado imutável e conflito em reenvio diferente. Histórico ampliado com categoria e metadados, mantendo leitura anterior em função auxiliar sem EXECUTE público/service_role; wrapper restrito ao servidor. Dashboard conta simulados à parte para preservar o significado dos agregados anteriores. Por matéria exige cinco questões no resultado; estatísticas consolidadas ficam para etapa 22.

Rascunho de respostas em sessionStorage na aba, sem cookies de gabarito ou persistência na conta antes de finalizar. Servidor continua responsável por prazo, conteúdo, identidade, nota e duração. Demonstração portátil usa correção de fixture local com aviso explícito. Detalhes e limites em SIMULADOS.md.

## Simplificação visual aprovada — 30/09/2026

Aplicar historico-mobile-v2-clean.png e a direção aprovada às telas existentes. Serifada para títulos principais, sans para notas e detalhes; retirar frases redundantes, ornamentos e recursos futuros não disponíveis. Preservar informação necessária para agir (labels, estados, confirmação, recuperação e explicações). Filtros adicionais nativos em details conservam contratos/IDs. Feedback da prática fica após as alternativas, com foco e região de status. Datas do histórico incluem ano para distinguir registros. Demonstração combinada é ferramenta local, não rota ou publicação; exemplos nunca são fallback de produção. Documentação em SIMPLIFICACAO-IMPLEMENTADA.md.

## Etapa 20 — histórico privado por conclusão

Histórico separa testes diagnósticos associados à conta de questões individuais respondidas. Reutiliza snapshots existentes, sem copiar dados para tabela pública ou consultar gabarito vivo. Duas RPCs de leitura restritas ao servidor verificam conta confirmada e propriedade; service_role continua sem SELECT direto nas tabelas privadas. Paginação por completed_at e UUID desc preserva microssegundos, com 20 registros por página; consulta adicional decide a próxima página. Lista não inclui gabaritos ou explicações. Detalhe só retorna resposta concluída da própria conta. Migração nova preserva todas as anteriores.

Página de resultado aceita initialResult validado no servidor para revisar qualquer teste salvo, mantendo o fluxo anterior de último resultado. Demo portátil usa o componente real com dados ilustrativos locais, sem Supabase ou publicação externa. Limites de verificação em HISTORICO.md: QA visual e execução HTTP de produção bloqueados; aguardando teste manual antes de simulados.

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

## Etapa 11 — proposta visual do quiz

Mantida identidade aprovada: fundo claro, verde profundo, enunciado serifado e interface sem slogans. Uma questão por tela, progresso de posição e cinco alternativas. Seleção não revela correção. Mockup e especificação em design/QUIZ-MOCKUP.md; prompt integral registrado. Aprovação visual obrigatória antes de React/CSS, conforme instrução do usuário. Conteúdo ilustrativo não publicado e nenhuma regra de backend alterada.

## Etapa 11 — implementação aprovada

Aprovação “pode ser esse visual” autoriza implementar o mockup. /quiz consome a API existente; /quiz/preview é exclusiva de desenvolvimento e repete uma fixture sem gabarito para testar navegação. Nenhuma publicação de questões. Escolhas apenas em memória, sem envio ou resultado até etapa 12. Sem dependências ou mudanças de banco. Testes e limites em QUIZ-INTERFACE.md.

## Etapa 12 — finalização atômica

Correção no banco dentro de RPC restrita, usando apenas o snapshot da tentativa. Bloqueio de linha serializa finalizações; respostas canônicas permitem repetição idempotente e recusam alterações após o feedback. Nenhuma pontuação do cliente. Resultado privado, disponível pelo cookie até o prazo original. Nova migration aplicada, nenhuma alteração das migrations antigas.

Backend separado da interface: preservado mockup aprovado do quiz; integração de envio/resultado fica na etapa 13, que requer nova aprovação visual. Questões continuam em draft. Testes positivos no banco em transação com rollback; nenhuma publicação editorial implícita. Contrato e evidências em CORRECAO-SEGURA.md.

## Etapa 13 — seleção e implementação

Escolha explícita: opção 3 é o resumo após concluir; opção 2 revisa somente erros, um a um. Ver todas as respostas também disponível. Não requer gerar outro layout: são dois alvos aprovados para estados distintos. Filtros e contagens derivados do resultado confirmado, sem recalcular gabaritos. Escolhas congeladas após primeira tentativa de envio; retry mantém payload. Consulta de resultado antes de criar tentativa evita sobrescrever cookie concluído.

Novo contrato público compartilhado para não importar Next/server no cliente. Prévia segue exclusiva de desenvolvimento. Build/lint e testes passaram; QA visual bloqueado porque ferramenta de navegador não iniciou. Não encerrar a etapa nem alegar comparação visual até restabelecer a ferramenta.
