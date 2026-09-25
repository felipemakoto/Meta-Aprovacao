# Design system — etapa 4

Status: mockup v4 aprovado e entrada implementada. Referência: [entrada-mobile-v4.png](design/entrada-mobile-v4.png). As versões anteriores são histórico.

## Direção e conteúdo

Entrada editorial para estudantes interessados em ETEC e Institutos Federais. ETEC / IF é identificação provisória; nome de marca ainda indefinido. Fundo claro, verde profundo, título serifado e marca-texto amarelo. Tema claro apenas, sem métricas inventadas ou promessas de aprovação.

O card “10 questões” foi removido por solicitação do usuário. Preservado o espaço antes do botão conforme a imagem aprovada. Também removidos “Seu próximo passo”, “UM PONTO DE PARTIDA” e “UM PASSO DE CADA VEZ”.

## Tokens implementados

| Papel | Valor |
| --- | --- |
| Fundo | #F7F6F0 |
| Texto principal | #172B25 |
| Texto secundário | #53645D |
| Ação | #174D38 |
| Hover | #113B2B |
| Marca-texto | #E6EC88 |
| Divisória | #D8DED7 |
| Texto do botão | #FFFFFF |
| Foco | contorno #174D38 de 3px, afastamento 4px |

Títulos: DM Serif Display 400, fallback Georgia. Corpo, marca e botão: Geist, fallback Arial. Fontes obtidas por next/font/google e servidas pela aplicação. O build precisa obter os arquivos quando não estão em cache. DM Serif Display substitui a aproximação Lora proposta na v3 por corresponder melhor à referência.

## Composição

- Largura máxima 560px; margens móveis 23px e 20px abaixo de 360px.
- Título 36–46px no mobile e 58px a partir de 600px. Quebras naturais, sem imagem de texto.
- Introdução 22px/28px; em telas estreitas 18px/26px.
- Botão de largura total, altura mínima 56px e raio 6px. Espaço anterior de 116px no mobile, 88px em telas estreitas e 96px no desktop.
- Fundo sólido; textura leve da imagem gerada não reproduzida.
- Ícones oficiais Heroicons v2.2.0 em public/icons, licença MIT preservada. Nenhuma biblioteca npm adicionada.

## Interação e acessibilidade

“Começar teste grátis” revela “O teste está em preparação e ainda não pode ser iniciado.” em região role=status. Cliques repetidos não duplicam o aviso. Sem JavaScript, noscript exibe o aviso. O quiz ainda não existe.

HTML semântico, idioma pt-BR, um h1, ícones decorativos com alt vazio, foco visível, Tab/Enter e redução de movimento. Texto legível em 320px e 390px; conteúdo centralizado no desktop.

## Componentes futuros (não implementados)

Inputs com label persistente, mensagens de erro associadas, cards somente para agrupamento necessário e progresso com rótulos textuais. Erros e sucesso nunca dependerão apenas de cor. Concretizar e verificar nas etapas correspondentes.

## Verificação

Comparação e evidências em [design-qa.md](../design-qa.md). Pesquisa em [PESQUISA-VISUAL.md](design/PESQUISA-VISUAL.md). A exploração Visualize v1 não é referência atual. Nenhuma publicação feita.

## Quiz implementado — etapa 11

CTA da entrada agora é link para /quiz. Quiz com enunciado DM Serif Display (26px mobile, 36px desktop), opções nativas com altura mínima 56px, seleção com borda verde e fundo suave, foco visível e progresso textual. Coluna de até 640px. A prévia aprovada é docs/design/quiz-mobile-v1.png; QA no relatório raiz.
