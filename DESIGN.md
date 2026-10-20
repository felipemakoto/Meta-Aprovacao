# Meta Aprovação — estudo visual

Direção da inicial: educacional, clara e verde, com Manrope local. Revisão de 20/10/2026: menos elementos e textos de apoio, mantendo uma apresentação completa dos estudos. A identidade não reproduz a marca do Brilliant.

## Sistema visual

- Tokens em `src/app/home-theme.module.css`, ativados pela classe `homeTheme`.
- Papel `#FCFDFB`, tinta `#19241F`, texto secundário `#515E55`, verde `#237B38`, interação `#185D29`, sálvia `#F0F4EC` e menta `#E0EFDF`.
- Manrope variável 400–800, hospedada localmente sob SIL OFL em `public/fonts/meta/`.
- Conteúdo até 1200px, controles de pelo menos 44px. Textos explicativos de 20px; navegação e informações legais de pelo menos 16px.

## Página inicial

Abertura com uma única ação principal, acesso a questões e simulados, cinco matérias, três etapas de estudo e cadastro gratuito. Sem legendas, rótulos pequenos, descrições duplicadas ou cards repetitivos. O gratuito continua informado como 10 questões por dia e 1 simulado rápido por dia, com correção, histórico e estatísticas incluídos.

`StartTestButton` mantém `/quiz`. Links de cadastro, login, questões, simulados, suporte e informações legais usam as rotas existentes. No celular, a navegação usa `details` nativo. O tema e as mudanças do rodapé ficam restritos à inicial; outras páginas mantêm seu visual anterior.

Backend, autenticação, banco, planos, permissões e pagamentos não foram alterados.

## Marca e movimento

O símbolo original em `src/app/icon.svg` é um traço verde contínuo: uma dobra assimétrica que sugere M e um percurso ascendente. Sem moldura, preenchimentos adicionais ou detalhes amarelos. O mesmo SVG serve ao cabeçalho e à aba do navegador, substituindo o favicon padrão. `home-art.tsx` contém a ilustração vetorial de estudo e três ícones de navegação.

Uma entrada coordenada do título e do livro dura 600–800ms. Interações usam 180ms. Sem animação contínua, biblioteca adicional ou conteúdo escondido aguardando JavaScript. `prefers-reduced-motion` desativa o movimento. Ativos da versão anterior permanecem disponíveis, mas não são carregados nesta inicial.

## Validação

Compilação de produção e lint dos componentes alterados aprovados; 22 testes de regressão passaram. Verificação no navegador em 280, 320, 390, 768, 1024 e 1440px, incluindo navegação móvel, teclado e movimento reduzido. Console sem erros; persistem avisos anteriores do Next sobre pré-carregamento de CSS legado. Nenhuma publicação foi realizada.
