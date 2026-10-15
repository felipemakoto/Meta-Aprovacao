# Carregamento ao finalizar — etapa 54

O responsável pediu que a barra se complete em cerca de dez segundos e exiba a mensagem **“Estamos conferindo as respostas.”**. O comportamento vale para o quiz inicial e os simulados, incluindo as prévias locais.

## Comportamento

- Ao finalizar, a página volta ao topo e mostra a barra preenchendo de 0 a 99% ao longo de dez segundos. O envio para correção começa imediatamente, em paralelo.
- O percentual representa a transição visual solicitada, não uma medição do trabalho de correção no servidor. Se a resposta demorar mais de dez segundos, a barra aguarda em 99% até o retorno; não reinicia o prazo.
- Com o resultado disponível e o prazo completo, a barra chega a 100% e permanece por 120 ms antes de mostrar o resultado.
- Prévias usam a mesma transição; a correção dos simulados só substitui a tela após a espera. Na navegação para fora da tela, o resultado tardio não redireciona o visitante de volta.
- Erros continuam permitindo nova tentativa com as respostas preservadas. Bloqueio de envio duplicado, cookies, origem, prazo da requisição e regras de correção permanecem iguais.
- A preferência por movimento reduzido remove a interpolação da largura. Os carregamentos breves de consulta e de prática individual mantêm a indicação indeterminada anterior.

O mínimo de dez segundos foi solicitado expressamente nesta etapa e substitui a decisão de não adicionar atraso registrada na etapa 52. Nenhuma mudança em conteúdo, banco, planos ou contratação.

## Verificação

- 21 testes Node aprovados, cobrindo transição, início imediato da operação, resposta lenta sem espera adicional, identidade dos erros e regressões dos contratos de resultado/correção/simulado. `npm run test:result` inclui os três novos testes.
- Lint, TypeScript e build aprovados.
- Navegador em 390 px: quiz e simulado de prévia com barra próxima de 40% após quatro segundos, 100% observado antes do resultado e conclusão em aproximadamente 10,35 s e 10,23 s. Sem rolagem escondendo a barra.
- Resposta simulada de doze segundos: barra em 99% após 10,5 s, conclusão em 12,45 s, somente um envio e movimento reduzido respeitado. Saída durante a espera não causa redirecionamento posterior.
- Percurso local completo com Supabase real: quiz inicial 7/10 com resumo apenas dos erros, cadastro sem entrega de e-mail, conta descartável confirmada administrativamente, planos, salvamento único e simulado real do banco com resultado 10/10. Sem erros de navegador; conta e tentativa descartáveis removidas com identificação exata. Nenhum e-mail ou pagamento criado.

Capturas de conferência local em `out/loading54/`, ignoradas pelo Git. Prévia do quiz em `/quiz/preview`.
