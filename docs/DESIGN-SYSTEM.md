# Proposta visual — etapa 4

Status: proposta v2 revisada a partir das marcações do usuário, aguardando aprovação. A v1 foi substituída como referência ativa. Não é a interface implementada.

## Objetivo e público

Entrada mobile para estudantes vindos do link da bio, interessados em ETEC e Institutos Federais. Levar ao diagnóstico gratuito sem cadastro, com linguagem acolhedora e sem prometer aprovação. Nome de marca ainda não definido; ETEC / IF é apenas identificação descritiva provisória, sem vínculo oficial declarado.

Direção: página editorial de estudos, com fundo de papel e detalhe de marca-texto. Verde profundo comunica foco; tipografia e espaços organizam o conteúdo. Sem gradientes, ilustrações de preenchimento, dashboards ou métricas inventadas. Tema claro apenas.

## Tokens propostos

| Papel | Valor |
| --- | --- |
| Fundo | #F7F6F0 |
| Superfície de cards e inputs | #FFFFFF |
| Texto principal | #172B25 |
| Texto secundário | #53645D |
| Ação principal e sucesso | #174D38 |
| Hover principal | #113B2B |
| Marca-texto | #E6EC88, sempre com texto #172B25 |
| Divisória e fundo desabilitado | #D8DED7 |
| Erro | #B42318 |
| Fundo de erro | #FEF3F2 |
| Foco | #174D38, contorno 3px e afastamento 3px |

Não usar marca-texto para texto claro. Validar contraste do código implementado e não apenas da imagem gerada. Estados de erro e sucesso terão ícone ou texto além da cor.

## Tipografia e medidas

- Fonte proposta: Geist Sans, já usada no layout padrão. Fallback: Arial, sans-serif. Sem nova biblioteca de fontes.
- Título principal mobile: 38px/42px, peso 700; em 320px, 32px/36px. Desktop futuro: máximo 56px/60px.
- Título de seção: 24px/30px, peso 600. Texto: 16px/24px, peso 400. Rótulos: 14px/20px, peso 600. Apoio: 13px/19px, peso 400.
- Espaçamento: 4, 8, 12, 16, 24, 32, 48 e 64px. Margem mobile 24px (20px em 320px). Conteúdo da entrada limitado a 480px; adaptação desktop será conferida após aprovação.
- Cantos: botão principal da entrada 6px; inputs 12px, cards 16px, badges 6px. Sombras ausentes na entrada; elevação futura só quando funcional: 0 4px 16px com tinta a 8%.
- Tela de referência: 390 x 844 pixels lógicos. A imagem gerada tem resolução própria e serve de referência de proporções, não de medidas exatas.

## Componentes para reutilização posterior

- Botão principal: verde, texto branco, mínimo 56px de altura na entrada, largura total no celular. Hover verde mais escuro; foco visível; desabilitado em cinza com texto secundário e atributo disabled.
- Botão secundário: superfície branca, texto verde e borda verde; mesmo alvo mínimo de 44px.
- Inputs: label persistente acima, texto 16px, altura mínima 48px, borda #53645D; placeholder não substitui label. Erro com borda vermelha e mensagem associada.
- Cards: fundo branco, sem sombra por padrão; usar somente para conteúdo que realmente precise ser agrupado. A entrada não usa cards.
- Badges: compactos, fundo de marca-texto e texto principal; estados terão rótulos explícitos.
- Progresso futuro: trilho #D8DED7 e preenchimento verde, rótulo de questões respondidas e total; não comunicar domínio de matéria.
- Gráficos futuros: barras verdes sobre fundo claro, valores e legendas textuais. Cores de sucesso/erro acompanhadas de rótulos; sem gráficos decorativos na entrada.
- Acessibilidade: HTML semântico, teclado, foco visível, alvos mínimos de 44px, texto legível, redução de movimento e nenhum significado dependente só da cor.

## Hierarquia e conteúdo da entrada

1. Identificação ETEC / IF, sem assinatura adicional.
2. Pergunta Como está sua preparação para a ETEC e os IFs?, sem frase introdutória decorativa.
3. Faça um teste rápido e descubra quais conteúdos você precisa revisar.
4. Faixa editorial única, entre duas linhas finas, com rótulo monoespaçado CADERNO DE DIAGNÓSTICO; título 10 questões. No seu ritmo.; apoio Um teste curto, com resultado ao terminar. Sem três colunas de indicadores. Usar Geist Mono já disponível no projeto para o rótulo.
5. CTA Começar teste grátis e apoio Sem cadastro. Sem cartão.
6. Texto concreto Ao final, veja seus acertos e a explicação de cada questão. e aviso Diagnóstico inicial, sem promessa de aprovação. Removido UM PASSO DE CADA VEZ.

O botão é o único destino de destaque. Sem menu, login, checkout ou pop-up. A quantidade de 10 questões é o alvo planejado para o diagnóstico, ainda não implementado.

## Referências e aprovação

- Imagem: design/entrada-mobile-v2.png, gerada pela ferramenta integrada de imagens.
- Prompt completo: design/entrada-mobile-v2-prompt.txt.
- A amostra interativa do Visualize pertence à exploração v1 e não é referência de aprovação da v2. A imagem v2 e esta especificação são as referências atuais.
- A imagem apresenta leve textura de raster e variações de quebras de linha. No código, a intenção é fundo liso e cores sólidas; confirmar isso com a aprovação. Quebras de texto precisam adaptar-se à largura real.
- Sites foi mencionado nesta etapa, mas nenhuma publicação ou migração de hospedagem foi solicitada. Projeto Next.js existente permanece a base; Vercel segue sendo a hospedagem planejada, a confirmar na etapa de publicação.

Após aprovação: implementar apenas a entrada com os tokens aceitos e comparar com o mockup em celular e desktop. Como o quiz ainda não existe, não simular um fluxo funcional nem criar tentativas sem a base das etapas seguintes. Se houver mudanças visuais pedidas, revisar primeiro a referência.
