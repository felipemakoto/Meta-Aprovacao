# Meta Aprovação — estudo visual

Revisão de 20/10/2026: a inicial aproxima a linguagem visual do Brilliant observado nesta data, preservando a marca e as funções da Meta Aprovação. Referência: https://brilliant.org/. Títulos serifados amplos, superfícies neutras, cabeçalho arredondado, demonstração visual e fotografia de estudo.

## Sistema visual

- Tokens em `src/app/home-theme.module.css`, ativos somente com `homeTheme`.
- Branco `#FFFFFF`, fundo da abertura `#F5F4F1`, tinta `#20251F`, texto secundário `#545B52`, ação `#237B38`, interação `#185D29`, sálvia `#EDF4E8` e menta `#D8EFC6`.
- Títulos em Lora variável 400–600, alternativa gratuita às fontes proprietárias da referência. Texto e controles em Manrope 400–800. Fontes hospedadas localmente; licenças SIL OFL em `public/fonts/meta/`.
- Conteúdo até 1200px; cabeçalho até 1280px. Textos explicativos de 20–21px, navegação e informações legais de pelo menos 16px. Controles de pelo menos 44px e foco visível.

## Composição e comportamento

Abertura com o destino ETEC/IF, diagnóstico gratuito e cadastro; demonstração de porcentagem; questões, simulados e cinco matérias; fotografia junto às etapas de estudo; recursos do gratuito e cadastro final. Sem depoimentos, credenciais ou resultados inventados.

`home-demo.tsx` contém um exemplo isolado: 25% de 80. Escolher 10, 20 ou 40 mostra feedback textual e seleção acessível com `aria-pressed`. O estado vive apenas na página, sem API, conta, pontuação, consumo de limite ou gravação. A demonstração não substitui o diagnóstico em `/quiz`.

Rotas e regras existentes foram preservadas. O gratuito continua informado como 10 questões por dia e 1 simulado rápido por dia, com correção, histórico e estatísticas. Backend, autenticação, banco, planos, permissões e pagamentos não foram alterados. Login e outras páginas mantêm seu tema anterior.

## Marca, imagem e movimento

O símbolo em `src/app/icon.svg` permanece um único traço verde assimétrico, usado no cabeçalho e na aba do navegador.

Foto de Julio Lopez no Unsplash: `public/images/study-julio-lopez.jpg`. Origem e licença em `public/images/STUDY-PHOTO-SOURCE.md`. Uso ilustrativo; não representa depoimento. A foto é servida localmente e otimizada pelo Next. Não há imagens, fontes ou serviços pagos necessários em tempo de execução.

Uma entrada coordenada dura 600–800ms, com interações de 180ms. Sem animação contínua ou conteúdo inicialmente invisível. `prefers-reduced-motion` desativa movimento. O menu móvel usa `details` nativo.

## Validação

Compilação de produção e lint dos componentes alterados aprovados. Os 22 testes de regressão passaram. Layout conferido no navegador em 280, 320, 390, 768, 1024 e 1440px, com fonte carregada, controles de pelo menos 44px e sem rolagem horizontal. Demonstração, navegação móvel, teclado e movimento reduzido conferidos. Os avisos anteriores de pré-carregamento de CSS legado do Next permanecem; sem erros de execução na inicial. Nenhuma publicação realizada.
