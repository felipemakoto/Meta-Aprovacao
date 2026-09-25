# Quiz — mockup v1, etapa 11

Status: aprovado pelo usuário (“pode ser esse visual”) e implementado na etapa 11. Evidências em ../../design-qa.md.

## Objetivo e hierarquia

Uma questão por tela, sem cadastro, com leitura confortável e escolha clara. Ordem: marca e saída; posição no quiz e matéria; progresso; enunciado; cinco alternativas; ação Continuar.

Referência: [quiz-mobile-v1.png](quiz-mobile-v1.png). Imagem gerada com a ferramenta integrada image_gen, inspecionada visualmente: cinco alternativas na ordem, nenhum gabarito exposto e botão desabilitado no estado inicial.

## Design system aplicado

Fundo #F7F6F0, texto #172B25, verde #174D38 e divisórias #D8DED7. Título serifado seguindo DM Serif Display e demais textos em Geist. As fontes e a textura na imagem são aproximações; a implementação deverá usar as fontes já instaladas e fundo sólido. Sem slogans, métricas promocionais, cronômetro ou novos elementos decorativos.

No celular, margens de cerca de 24px, enunciado de aproximadamente 28–32px adaptável e opções com área mínima de 56px. Não forçar altura fixa: textos longos podem rolar. No desktop, coluna central de até 640px, sem inventar barras laterais. Conferir 320px, 390px e desktop na implementação.

## Interações previstas após aprovação

- “Questão 1 de 10” indica posição, não quantidade de acertos ou respostas concluídas. Barra correspondente a 10% da sequência.
- Uma escolha por questão, com radio group semântico. Letras A–E são rótulos, não controles independentes.
- Estado selecionado: borda verde e fundo amarelo muito suave; marca de seleção e estado acessível, sem comunicar acerto.
- Continuar desabilitado até selecionar; depois, botão verde com texto branco. Não avançar automaticamente ao tocar numa alternativa.
- Tab/setas/espaço para navegação e seleção; foco visível. Ao avançar, foco no enunciado seguinte e anúncio da nova posição.
- Sair retorna à entrada e preserva a tentativa até a expiração; não confundir sair da tela com logout ou conclusão.
- Carregamento, falha de rede, falta de conteúdo publicado e tentativa expirada precisam de mensagens específicas. Não mostrar o questionário fictício como fallback de produção.
- Não exibir correção ou explicação antes da etapa apropriada. A implementação deverá coordenar a última questão com a correção segura da etapa 12, sem simular resultado.
- Respostas não serão colocadas em URL. Armazenamento/envio e recuperação das escolhas precisam seguir o contrato da etapa de correção, sem prometer persistência ainda inexistente.

## Conteúdo e limites

A imagem usa uma versão abreviada do enunciado da primeira questão de exemplo, somente para avaliar a composição. Na implementação, apresentar o texto retornado pelo servidor sem alterações silenciosas. A aprovação visual não aprova nem publica questões: o lote continua em draft.

Etapa 11 implementada. A especificação acima registra a intenção aprovada; instruções e limites atuais em ../QUIZ-INTERFACE.md. Pausa para teste antes da correção segura.

## Prompt utilizado

Modo: ferramenta integrada, geração de imagem nova, sem CLI ou chave de API adicional.

```text
Use case: ui-mockup. Create one high fidelity mobile web UI mockup for a Brazilian ETEC / IF study quiz. Flat front-facing screenshot, 900 x 1600 portrait approximately, no device frame, no browser chrome, no surrounding presentation board. This is the first question screen, not a landing page. Faithfully use established design system: solid warm ivory #F7F6F0, deep green ink #172B25, forest green #174D38, muted text #53645D, fine lines #D8DED7, tiny restrained pale yellow #E6EC88 accents. Headings in elegant DM Serif Display-like regular serif, all controls and text Geist-like sans serif. Quiet editorial design, generous but practical whitespace, excellent legibility, no gradients, shadows, glass, decorative blobs, illustrations, badges or marketing slogans.
Layout: horizontal header with small square forest-green arrow-up-right brand icon and bold "ETEC / IF" left, understated "Sair" text right. Fine bottom divider. Next progress row "Questão 1 de 10" left, "Matemática" right in subdued text, then a thin progress track filled exactly 10 percent in green. Do not use circular progress or timers.
A readable medium-large serif question, exact Brazilian Portuguese copy: "Uma mochila custa R$ 80,00. Com 15% de desconto, qual é o preço final?" Use natural line breaks across 3-4 lines, generous leading, not gigantic landing-page text.
Below it five full-width answer rows, aligned flat rectangles with 6px subtle corner radius and thin borders, minimum generous touch height, spaced evenly. Each row has a small letter at left in a square outline and its answer. EXACT options in order:
"A" "R$ 12,00"
"B" "R$ 68,00"
"C" "R$ 65,00"
"D" "R$ 72,00"
"E" "R$ 92,00"
All options are unselected, no correct answer exposed, no green checkmark or red cross. Borders muted green-gray, letters and amounts deep green. Under the answers, a wide DISABLED button labeled "Continuar" with a right arrow, a light gray-green background and darker muted label, clearly visually disabled but legible. No bottom explanation, no help slogan, no card of statistics, no promotional footer, no explanatory captions. Fit the entire question, all five options, and button on one coherent vertical screen with about 48px side margins. The final result must look like a carefully typeset real product, visually consistent with an understated Brazilian academic editorial brand.
```

