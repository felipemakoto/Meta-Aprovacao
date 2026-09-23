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
