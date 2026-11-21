# Meta Aprovação — estudo visual

Revisão de 20/10/2026: a inicial aproxima a linguagem visual do Brilliant observado nesta data, preservando a marca e as funções da Meta Aprovação. Referência: https://brilliant.org/. Títulos serifados amplos, superfícies neutras, cabeçalho arredondado, demonstração visual e fotografia de estudo.

## Sistema visual

- Tokens em `src/app/home-theme.module.css`, ativos somente com `homeTheme`.
- Branco `#FFFFFF`, fundo da abertura `#F5F4F1`, tinta `#20251F`, texto secundário `#545B52`, ação `#237B38`, interação `#185D29`, sálvia `#EDF4E8` e menta `#D8EFC6`.
- Títulos em Lora variável 400–600, alternativa gratuita às fontes proprietárias da referência. Texto e controles em Manrope 400–800. Fontes hospedadas localmente; licenças SIL OFL em `public/fonts/meta/`.
- Conteúdo até 1200px; cabeçalho até 1280px. Textos explicativos de 20–21px, navegação e informações legais de pelo menos 16px. Controles de pelo menos 44px e foco visível.

## Composição e comportamento

Abertura com o destino ETEC/IF; demonstração de porcentagem acima das ações de diagnóstico gratuito e cadastro; acesso a questões e simulados; bloco de correção e revisão com fotografia; etapas de estudo com outra fotografia; recursos do gratuito e cadastro final. A lista de matérias foi removida. Sem depoimentos, credenciais ou resultados inventados.

O cabeçalho usa `position: sticky` com `top: 0`. Somente a barra branca tem fundo e recebe interações; a área externa é transparente e permite clicar no conteúdo abaixo. Margens de rolagem preservam destinos e controles focados. O rodapé da inicial usa fundo preto e texto, links e foco brancos, com o acesso ao suporte dentro dele. Esse acesso adicional permanece oculto nas demais páginas.

A chamada do gratuito tem título e recursos à esquerda, limites diários e cadastro à direita, separados por uma divisória simples. No celular, os dois grupos ficam em sequência e alinhados à esquerda, sem texto pequeno ou cards adicionais.

`home-demo.tsx` contém um exemplo isolado: 25% de 80. Escolher 10, 20 ou 40 mostra feedback textual e seleção acessível com `aria-pressed`. O estado vive apenas na página, sem API, conta, pontuação, consumo de limite ou gravação. A demonstração não substitui o diagnóstico em `/quiz`.

Rotas e regras existentes foram preservadas. O gratuito continua informado como 10 questões por dia e 1 simulado rápido por dia, com correção, histórico e estatísticas. Backend, autenticação, banco, planos, permissões e pagamentos não foram alterados. A tela de conta foi alinhada ao novo tema na revisão abaixo; as demais páginas não abrangidas mantêm seu tema anterior.

## Marca, imagem e movimento

O símbolo em `src/app/icon.svg` permanece um único traço verde assimétrico, usado no cabeçalho e na aba do navegador.

Fotos de Julio Lopez e Yen Vu no Unsplash: `public/images/study-julio-lopez.jpg` e `public/images/study-yen-vu.jpg`. Origem e licença em `public/images/STUDY-PHOTO-SOURCE.md`. Uso ilustrativo; não representam depoimento. São servidas localmente e otimizadas pelo Next. Não há imagens, fontes ou serviços pagos necessários em tempo de execução.

A entrada compartilhada dura 360ms, com interações de 160–220ms. Sem animação contínua ou conteúdo inicialmente invisível. `prefers-reduced-motion` desativa movimento. O menu móvel usa `details` nativo.

## Validação

Compilação de produção e lint dos componentes alterados aprovados. Os 22 testes de regressão passaram. Layout conferido no navegador em 280, 320, 390, 768, 1024 e 1440px, com fonte carregada, controles de pelo menos 44px e sem rolagem horizontal. Demonstração, navegação móvel, teclado e movimento reduzido conferidos. Os avisos anteriores de pré-carregamento de CSS legado do Next permanecem; sem erros de execução na inicial. Nenhuma publicação realizada.

## Área de estudo — 20/10/2026

O mesmo sistema de cores, fontes locais e marca agora atende painel, questões, simulados, teste inicial, correções, histórico e estatísticas. `study-shell.tsx` concentra cabeçalho, navegação, acesso ao conteúdo e modo de foco; `study-shell.module.css` adapta os tokens existentes apenas enquanto essa estrutura está presente. Cadastro e entrada usam o tema atual na revisão abaixo; as páginas legais mantêm seu tema anterior.

Referências: organização de materiais e atividade do Brilliant (https://brilliant.org/), recuperação ativa e modos de estudo/teste descritos pelo Quizlet (https://help.quizlet.com/hc/en-us/articles/360030841732-Studying-on-Quizlet). O acesso direto à página pública do Quizlet retornou 403; esta é uma adaptação de padrões, sem alegar reprodução de telas privadas.

- Painel: último teste, progresso real de acertos, atividade registrada e acesso às coleções existentes de questões e simulados. Sem sequências, conquistas ou domínio de matérias inventados.
- Questões: filtros reunidos, opções avançadas recolhidas e uma questão em destaque; alternativas em duas colunas quando há espaço, uma no celular. Correção textual e próxima questão preservadas.
- Simulados e teste: modo de foco, progresso visível, alternativas grandes e navegação anterior. Conferência das escolhas e envio continuam usando os componentes e ações existentes.
- Histórico, estatísticas e correções seguem a mesma navegação e hierarquia. As coleções organizam recursos existentes; não introduzem uploads, pastas ou flashcards.
- Navegação lateral a partir de 960px; menu nativo no celular; barra branca fixa durante a rolagem. Rodapé preto com suporte também na área de estudo. Textos de apoio de 16–20px, controles de pelo menos 44px e foco visível.

Alterações restritas à apresentação. Nenhuma mudança em contratos de API, carregamento de dados, persistência, autenticação, limites, Premium ou pagamentos. As prévias existentes continuam exclusivas do desenvolvimento.

Validação desta etapa: 40 testes de regressão aprovados; lint e TypeScript aprovados; detector Impeccable sem ocorrências nos novos componentes e telas principais. Conferência visual de sete telas em 390 e 1440px, mais painel, questões, simulados e teste em 280, 320, 768 e 1024px, sem rolagem horizontal. Fluxos locais de resposta correta/incorreta, filtros, limites, conclusão, revisão, histórico, estatísticas e menu por teclado aprovados, sem erros de execução ou chamadas de escrita à API. As prévias usam dados ilustrativos e não substituem uma validação autenticada em produção. Nenhuma publicação realizada.

## Tela de conta — 20/10/2026

`/login` agora reutiliza a marca, o cabeçalho branco, os tokens e o rodapé da área de estudo. Formulário central de até 520px, tipografia Manrope legível e ações hierarquizadas: estudos em verde, simulado em sálvia e Premium com gradiente apenas em tons de verde, solicitado pelo responsável. Sem sombras ou painel adicional ao redor de sair da conta. Estados autenticado e visitante preservam seus conteúdos, links, condições de oferta e ações; nenhum código de autenticação ou consulta de plano foi modificado.

Validação: lint e 13 testes existentes de login e oferta aprovados. Estados com e sem sessão conferidos em 320, 390, 768 e 1440px, sem overflow ou erros de execução; mostrar/ocultar senha e links de cadastro/recuperação conferidos. A prévia autenticada usou uma composição temporária sem interações, removida após a conferência, sem entrar ou sair de contas reais.

O cabeçalho de conta usa Menu em todas as larguras, com Minha conta e os acessos de estudo existentes. A página atual é indicada no menu. Abertura e fechamento por teclado e ponteiro conferidos em 320, 390 e 1440px; sem overflow. O modo de foco do teste e a navegação das demais telas permanecem iguais.

Na área de estudos, Minha conta é o destino do logo e o menu não oferece a página institucional Início. O teste inicial público mantém sua saída anterior. Navegação conferida em celular e desktop e nas cinco telas de estudo; lint e TypeScript aprovados.

## Cadastro e entrada — revisão final de 20/10/2026

Cadastro reutiliza o cabeçalho com marca Meta Aprovação, menu, formulário branco e rodapé do sistema. Formulários de entrada e cadastro usam Manrope, campos de 54px, labels de 17px e ajuda/consentimento de pelo menos 16px. O botão Google e seu diálogo seguem a mesma tipografia e superfícies. Os textos Histórico salvo e Progresso por matéria foram removidos do cadastro a pedido do responsável. O gradiente Premium usa somente verdes (#14532D, #237B38, #3B7A28), com texto branco e hover mais escuro.

O layout compartilhado também mantém recuperação de senha e confirmação coerentes; regras e conteúdos de planos continuam intactos. Não foram alterados handlers, campos enviados, consentimento obrigatório, termos, validações ou autenticação. Conferidos cadastro, entrada e confirmação em 320/390/768/1440px, sem overflow; validação, senha visível/oculta, consentimento, confirmação de envio e erro de login conferidos com respostas interceptadas, sem criar contas nem enviar e-mails. Lint, TypeScript, build e 38 testes existentes aprovados.

## Movimento compartilhado — 20/10/2026

`page-motion.tsx` acompanha mudanças de caminho no layout raiz, com uma entrada do conteúdo principal em 360ms: opacidade 0,88→1 e deslocamento vertical de 8px→0. Usa Web Animations API nativa, sem biblioteca, wrappers, chaves de remontagem, estado de formulário, alterações de rota ou bloqueio de interação. A animação não mantém transformações ao concluir. A entrada anterior da hero foi substituída para evitar sobreposição.

Tokens de movimento ficam em `globals.css`: interações de 160ms, menus/diálogos/feedback de 220ms e curva cubic-bezier(.22,1,.36,1). Botões têm resposta discreta ao hover em ponteiro preciso e ao pressionar; campos e alternativas transitam entre cores. Textos e links comuns permanecem estáveis. Não há cascata de cards, scroll listener, atraso artificial de formulário ou animação decorativa contínua.

`prefers-reduced-motion` desativa movimentos e transições; a troca da preferência cancela uma entrada em execução. Sem JavaScript o conteúdo continua visível. Cabeçalhos fixos e rodapé não entram na transição de página. As animações existentes de correção mantêm seu contrato e também respeitam movimento reduzido.

Conferidas as telas públicas (incluindo erro/404), cadastro, entrada, recuperação, confirmação e prévias de Premium, painel, questões, teste, resultado, simulados, histórico e estatísticas. Navegação pelo cliente, abertura de menu/consentimento, manutenção de campo preenchido, validação, retorno à questão anterior e conclusão de simulado preservados; nenhuma chamada de escrita à API nos percursos. Sem overflow em celular/desktop ou erros de execução. Cancelamento de animação em andamento, conteúdo sem JavaScript e cabeçalho fixo também conferidos. Lint, TypeScript e compilação de produção aprovados.

## Planos, suporte, documentos e erro — 20/10/2026

Premium, suporte, termos, privacidade e página 404 reutilizam StudyShell em modo de foco: marca Meta Aprovação, menu branco fixo, fontes locais Manrope, superfícies claras e rodapé preto com suporte. Documentos têm coluna de leitura de até 70ch; textos legais, versão, consentimentos e contatos permanecem intactos. FAQs continuam usando details/summary nativos.

PlanOptions mantém os mesmos conteúdos e condições, com texto de apoio de pelo menos 16px, preços em numerais tabulares, bordas discretas e fundo sálvia no plano Premium. A confirmação de cadastro herda esse componente compartilhado. Não há gradiente novo, sombra, biblioteca ou alteração em preços, histórico de compras, permissões, autenticação, API ou checkout.

Validação local: 20 testes de planos/promoção, teste HTTP de contratação indisponível, ESLint dos arquivos alterados e build/TypeScript aprovados. Nove telas/estados em 320, 390, 768 e 1440px: 36 combinações sem overflow ou imagens ausentes. Menu por teclado, FAQ, contato mailto, planos promocional/recorrente/ativo/erro e retorno da página 404 conferidos; nenhum erro de execução ou escrita à API. Capturas de Premium, suporte e 404 inspecionadas visualmente. Testes de renderização de preços isolam somente o shell compartilhado, preservando a avaliação real do conteúdo de PlanOptions.
