# Etapa 11 — interface do quiz

Visual aprovado em docs/design/quiz-mobile-v1.png. Implementação em src/app/quiz: página, Client Component e CSS Module. Tipografia DM Serif Display/Geist e ícones locais existentes; nenhuma dependência nova.

## Testar

1. Execute `npm.cmd run dev` e abra http://127.0.0.1:3000/quiz/preview.
2. Confira Continuar desabilitado. Selecione com clique ou espaço/setas: somente uma opção fica marcada e o botão é habilitado.
3. Avance, confira o progresso e use Questão anterior: a escolha permanece enquanto a tela está aberta.
4. Passe pelas dez posições e use Revisar escolhas. O final informa que não houve envio nem correção.
5. Use Sair e Começar teste grátis: /quiz exibe indisponibilidade enquanto as questões estiverem em draft.

A prévia repete uma questão ilustrativa em dez posições; não constitui um simulado e não consulta a API. Em produção retorna 404. Não há link público para ela.

## Contrato e limites

/quiz retoma via GET e inicia via POST sem payload somente após 401. Usa cookie HttpOnly do servidor; valida o DTO público sem receber gabaritos. Carregamento e falhas têm mensagens próprias, e uma requisição em andamento é compartilhada para evitar duplicação no Strict Mode. Expiração é verificada por timer e antes das ações.

As escolhas ficam somente na memória do componente. Sair/recarregar perde escolhas; a tentativa do servidor pode continuar válida até a expiração original. Nenhuma resposta é enviada ou persistida, nenhum resultado é calculado. Etapa 12 definirá o envio e a correção segura. Não publicar questões automaticamente para liberar o teste.

## Verificação realizada

Lint e build aprovados; nove testes de tentativa e cinco HTTP aprovados, sem ignorados. Prévia HTTP 404 em next start, porta temporária 3001. No navegador: estados inicial/selecionado, teclado espaço/setas, foco no enunciado, avanço pelas dez posições, retorno, revisão e saída. Larguras 320, 390 e 1280 sem overflow horizontal. Fluxo real confirmou falta de questões publicadas. Sem erros/avisos capturados no console.

Falha de rede e expiração têm tratamento implementado, mas não foram provocadas no teste manual. O caminho positivo com banco publicado continua dependendo da revisão editorial. Comparação visual e capturas em design-qa.md. Pausa para teste do usuário.

## Atualização da etapa 12

Backend de correção pronto em /api/quiz/result (CORRECAO-SEGURA.md). Esta interface ainda não envia escolhas: a integração será feita junto ao resultado da etapa 13, após aprovação visual. A prévia permanece ilustrativa e sem correção.

## Atualização da etapa 13

A interface agora envia as escolhas ao finalizar o quiz real e abre /quiz/result após confirmação. Os layouts de resumo/revisão foram aprovados. O /quiz/preview abre um resultado fixo claramente ilustrativo, sem envio. Detalhes e pendência de QA visual em RESULTADO.md; orientações anteriores de ausência de envio são históricas.
