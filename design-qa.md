# Verificação visual — etapa 4

Resultado: **passed**, dentro do escopo da entrada aprovada. Não representa aprovação de um quiz funcional. Teste do usuário ainda pendente.

## Referência e evidências

- Alvo: [mockup v4](docs/design/entrada-mobile-v4.png), 854 × 1844 pixels, aprovado pelo usuário.
- Página: http://localhost:3000/, código em src/app.
- [Comparação final lado a lado](docs/design/qa/comparacao-mobile.png): alvo à esquerda, implementação à direita.
- [Mobile final](docs/design/qa/mobile-after.png), [320px](docs/design/qa/mobile-320.png), [desktop](docs/design/qa/desktop.png).
- [Primeira passagem](docs/design/qa/mobile-before.png), antes de ajustar tamanho do título, introdução e espaçamento.

## Dimensões e normalização

Viewport alvo de 390 × 844 pixels CSS. O mockup foi reduzido a essa dimensão. Nesta captura do navegador no Windows, o conteúdo aparece com fator de 0,8 dentro do PNG apesar do DOM reportar viewport 390 × 844 e devicePixelRatio próximo de 1. A margem CSS de 23px aparece com aproximadamente 18px; o topo de 50px aparece com 40px.

Para comparar as mesmas proporções, a região superior esquerda de 312 × 675px da captura foi ampliada para 390 × 844px e colocada ao lado da referência, em imagem única de 780 × 844px. As capturas originais foram preservadas. Essa normalização reduz a nitidez da evidência e não é uma alteração da página. As medidas do DOM complementaram a inspeção. Telas adicionais: 320 × 740 e 1280 × 900 pixels CSS.

## Histórico de revisão

1. Primeira passagem: título com quebra diferente e introdução em duas linhas; posição do CTA antecipada. Classificação P2 por diferença visível da referência.
2. Ajustados título de 44 para 46px, introdução de 21 para 22px e espaço antes do botão de 126 para 116px. Título e introdução passaram a três linhas na largura alvo. CTA medido no DOM em y=518px, próximo dos 519px da referência normalizada.
3. Nova comparação conjunta inspecionada após build. Sem pendências P0/P1/P2. Pequenas diferenças de fonte, textura raster, desenho do destaque e alguns pixels no rodapé são P3 aceitas nesta implementação responsiva; não alegamos equivalência pixel a pixel.

## Conferência visual

| Área | Resultado |
| --- | --- |
| Composição | Marca, pergunta, introdução, espaço vazio, CTA e rodapé na ordem aprovada; card removido |
| Tipografia | DM Serif Display carregada no título; Geist no corpo; quebras conferidas em 390px |
| Cores | Tokens de fundo, texto, ação e marca-texto aplicados; fundo sólido |
| Ícones | Heroicons oficiais locais, carregados; licença MIT preservada |
| Texto | Conteúdo aprovado preservado; frases decorativas removidas |
| Responsividade | Sem overflow horizontal nas três larguras; coluna de até 560px no desktop |

## Verificação de interação e código

- Tab alcança o botão com foco visível; Enter exibe aviso em região de status.
- Clique repetido mantém uma mensagem; não cria quiz, tentativa ou resultado.
- Clique conferido também no build de produção, em 320px.
- Fontes carregadas e dois ícones com dimensões naturais válidas.
- Contraste calculado pela luminância relativa sRGB: texto principal/fundo 13,77:1, secundário/fundo 5,79:1, branco/botão 9,74:1 e título/marca-texto 11,87:1. Todos acima de 4,5:1.
- Console consultado sem erros ou avisos durante a verificação.
- npm run lint e npm run build aprovados após os ajustes finais. Build inclui checagem TypeScript.
- Viewport temporário restaurado; navegador deixado na entrada, sem aviso aberto.

Limites: testes no navegador integrado deste computador; sem auditoria completa por leitor de tela nem teste em dispositivo físico. O fallback noscript está implementado, mas não foi exercitado com JavaScript desativado. Quiz e integrações fora desta etapa.
