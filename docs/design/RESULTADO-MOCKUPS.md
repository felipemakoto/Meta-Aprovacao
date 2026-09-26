# Etapa 13 — propostas de resultado

Teste da etapa 12 confirmado pelo usuário. Aguardando escolha visual antes de implementar, conforme plano de etapas. Nenhuma mudança na aplicação ou no banco neste checkpoint.

Ordem exata de apresentação no chat:

1. resultado-opcao-1.png — resumo editorial, acertos e lista por matéria.
2. resultado-opcao-2.png — revisão explicada em primeiro plano, resumo compacto.
3. resultado-opcao-3.png — conteúdos das questões erradas como entrada da revisão.

Geradas separadamente com image_gen, usando quiz-mobile-v1.png como referência visual anexada. Inspecionadas no retorno. Brief: website mobile, proporção 390 × 844, ETEC / IF, fundo #F7F6F0, verde #172B25/#174D38, DM Serif Display/Geist, margens 24px. Sem promoções, contas, paywall, confete ou previsão de aprovação. Dados ilustrativos: sete acertos; Português e Geografia 2/2, outras três matérias 1/2. Nenhum resultado real do usuário.

## Direção de cada geração

Resumo editorial: Seu resultado; 7 de 10; acertos; lista plana por matéria; ação Revisar respostas e retorno ao início. Sem gráficos circulares ou grade de cards.

Revisão em primeiro plano: score compacto, questão de porcentagem, resposta D de R$72 versus correta B de R$68; explicação 15% de 80 = 12 e 80 − 12 = 68; ação Próxima explicação e Ver resumo.

Roteiro de revisão: O que revisar; score compacto; três linhas numeradas com Porcentagem, Ecologia e Brasil Colônia; ações Revisar os 3 erros e Ver todas as respostas. Conteúdos ilustrativos, a implementação deverá derivar tópicos do feedback real.

## Ajustes e contrato para a implementação aprovada

- As imagens são aproximações: usar fontes locais, fundo sólido e medidas responsivas reais. Não reproduzir textura raster ou efeitos nos botões.
- Opção 2 incluiu texto não solicitado chamando o diagnóstico de simulado: remover esse texto na implementação e manter a terminologia teste/diagnóstico. Evitar introduções redundantes.
- Usar somente resultado confirmado pelo servidor. Enviar dez escolhas ao concluir, bloquear envio duplo e permitir retry idempotente sem alterar respostas após conclusão. Recuperar resultado pelo cookie em GET /api/quiz/result.
- Tratar envio pendente, falha, conflito, tentativa expirada e ausência de resultado. Não exibir dados de exemplo como fallback de produção.
- Resultado 0/10 e 10/10 devem funcionar. Para 10/10, retirar convite de revisão de erros e permitir revisão das dez explicações. Não alegar domínio de matéria com duas questões.
- Escolhas corretas/incorretas têm rótulos textuais, nunca apenas cor. Mostrar alternativa escolhida, correta e explicação do snapshot; preservar texto integral e permitir rolagem.
- Todos os controles visíveis deverão funcionar, com foco e teclado. Rever 320/390/1280px e comparar com a opção escolhida.
- Prévia local ilustrativa poderá ser usada para validar interface; manter bloqueio em produção. O seed continua draft até revisão editorial explícita.

Sem testes de código repetidos: apenas imagens e documentação foram adicionadas. Etapa 13 ainda não concluída; aguarda seleção visual.
