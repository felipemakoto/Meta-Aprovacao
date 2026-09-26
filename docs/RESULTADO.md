# Etapa 13 — resultado e revisão

Escolha explícita do usuário: imagem 3 após finalizar; imagem 2 ao abrir Revisar os N erros, uma questão errada por vez. Não é uma nova exploração visual. Aplicação implementada, conferência no navegador pendente por indisponibilidade da ferramenta. Etapa não encerrada.

## Comportamento implementado

- Finalizar teste envia dez escolhas à API da etapa 12. Bloqueia duplicação e troca de escolhas após iniciar o envio. Retry usa exatamente o mesmo payload. Não calcula nota no navegador.
- Sucesso abre /quiz/result. Conflito também recupera o resultado definitivo. Expiração e indisponibilidade têm estados próprios.
- Ao reabrir /quiz com tentativa concluída, consulta o resultado antes de criar outra tentativa, preservando o cookie existente.
- /quiz/result consulta o feedback persistido via GET. Resumo com quantidade de acertos e lista dos erros por matéria/tópico; número de erros e botões dinâmicos.
- Revisar os N erros filtra exclusivamente questões incorretas. Cada linha abre o respectivo erro. Próxima explicação e Explicação anterior percorrem a lista; Concluir revisão e Ver resumo retornam ao resumo.
- Ver todas as respostas percorre as dez questões. Exibe escolha, alternativa correta e explicação, com texto de acerto/erro além da cor. O número original da questão permanece visível.
- 10/10 mostra Seu resultado e Revisar respostas, sem lista de erros. 0/10 lista as dez. Textos longos podem ocupar várias linhas e rolar.

DTO extraído para result-contract.ts, compartilhado pelo servidor e cliente sem dependências de Next/server ou credenciais. Importação explícita .ts habilitada no TypeScript com noEmit para execução dos testes nativos do Node. Nenhuma dependência nova.

## Prévia e teste manual pendente

Com `npm.cmd run dev`, abra http://127.0.0.1:3000/quiz/result/preview. Dados ilustrativos 7/10, três erros em Porcentagem, Ecologia e Brasil Colônia. As outras posições repetem exemplos apenas para exercitar navegação. Não corresponde às escolhas da prévia do quiz.

1. Clique Revisar os 3 erros: primeiro erro de Matemática, resposta D, correta B, explicação do desconto.
2. Avance: Ciências; depois História; conclua e confira retorno ao resumo.
3. Abra diretamente a segunda linha e teste Explicação anterior e Ver resumo.
4. Abra Ver todas as respostas: confira dez posições e os rótulos de acerto/erro.
5. Teste /quiz/result/preview?score=0 e ?score=10.
6. No /quiz/preview, responda dez posições e finalize: abre resultado ilustrativo, sem requisição de correção.
7. Teste Tab/Enter, foco, rolagem e larguras 320, 390 e 1280; compare capturas com opções 3 e 2.

As duas prévias são bloqueadas em produção. /quiz/result real sem cookie/resultado exibe indisponibilidade. Questões reais permanecem em draft; fluxo positivo real depende da revisão editorial. Nenhum dado de exemplo é fallback de produção.

## Evidência e limites

Lint/build passaram. Oito testes de correção, quatro HTTP de correção, nove da tentativa, cinco HTTP da tentativa e quatro do transporte do resultado passaram (30). O teste inicial do transporte identificou sintaxe de parâmetro TypeScript incompatível com Node strip-only; corrigida para propriedade explícita e revalidada. HTTP da prévia 200 em desenvolvimento, 404 em produção; rota real 200 em produção, com leitura posterior por cookie. Sem mudanças de banco, publicação ou dependências.

Navegador automatizado falhou antes de iniciar, inclusive após reset: `failed to write kernel assets`, caminho não encontrado. Não foi possível capturar as telas ou testar as interações reais. design-qa.md: final result blocked. Abrir pela ferramenta do Codex foi solicitado e enfileirado; isso não comprova inspeção visual. Retomar essa validação após restabelecer a ferramenta. Não avançar etapa enquanto a verificação estiver pendente.
