# Ampliação de Matemática — etapa 37

Em 10/10/2026, preparado e carregado um lote de 18 questões originais em rascunho, complementando as duas questões de Matemática já existentes. O banco tem agora 28 questões: vinte de Matemática e duas em cada uma das outras quatro matérias. Nenhuma questão revisada ou publicada; os dois modelos de simulado continuam em rascunho. Contratação bloqueada.

## Conferência editorial

Abra a [revisão das 18 questões novas](REVISAO-MATEMATICA.md) e a [revisão das dez questões iniciais](REVISAO-SEED.md). As novas estão identificadas de M03 a M20; as duas iniciais de Matemática correspondem a M01 e M02. Cada entrada traz enunciado, alternativas, resposta, explicação e espaço para registrar revisor/data/correções.

O lote inclui frações, inteiros, operações, equações, porcentagens, proporcionalidade, geometria, média, mediana, probabilidade, função afim e velocidade média. Não são questões oficiais da ETEC/IF; dificuldade e adequação ao público ainda exigem revisão. Não foi feita análise de cobertura de edital nem calibração com estudantes. Os gabaritos foram conferidos por cálculos independentes; isso não substitui revisão humana.

Para pedir uma correção, use, por exemplo, “M08: simplificar o enunciado”. A aprovação editorial precisa identificar quais questões foram conferidas. Aprovar o visual ou pedir para continuar não muda o status. Uma publicação posterior requer aprovação explícita das questões e do modelo; não acontece ao executar os comandos abaixo.

Vinte questões atendem somente a quantidade do modelo atual de Matemática. O banco continua sem conteúdo disponível aos alunos e sem variedade suficiente demonstrada para comercializar estudo ilimitado. As outras matérias ainda não têm lotes ampliados ou modelos publicados por matéria.

## Fonte e carga

Fonte única editável: `content/matematica-lote-1.json`. O gerador valida tamanho do lote, campos, alternativas distintas, dificuldade e letra do gabarito, e produz a revisão e o SQL. Os artefatos são internos e não entram em `public` nem nas respostas de APIs do aluno.

```powershell
npm.cmd run content:math:build
npm.cmd run content:math:check
```

O SQL gerado fica em `supabase/content/matematica-lote-1.sql`, separado das migrations e do seed inicial. Não altera o esquema nem é executado automaticamente no deploy/reset. A carga administrativa foi feita explicitamente no banco vinculado. A instrução insere questão e gabarito de forma atômica; todos os novos registros recebem `draft`, versão 1, matéria Matemática e destino `both`.

IDs estáveis com prefixo `d1370000`: repetir a carga não sobrescreve conteúdo, status, gabarito ou timestamps. Um gabarito ausente em uma questão existente exige correção editorial separada, sem reparo silencioso. Alterar o JSON e regenerar o SQL não altera uma linha já carregada; uma revisão do banco deve ser feita de forma explícita, preservando versões e snapshots.

## Verificação realizada

O ensaio com rollback inseriu as 18 questões, confirmou metadados, gabaritos e alternativas distintas, simulou uma revisão e um gabarito ausente e repetiu a carga duas vezes. O hash de todas as questões/gabaritos permaneceu igual após as repetições. A revisão simulada e a ausência foram revertidas. O teste é para esta fase de rascunho; depois da publicação, usar um banco isolado, pois ele exige lote em `draft`.

```powershell
npm.cmd run test:content:math
```

Ensaio aprovado antes da carga e repetido depois. A carga real confirmou os 18 novos rascunhos e preservou o hash de todas as questões/gabaritos anteriores. Conferência por cálculos das 18 respostas, sincronização dos artefatos e lint dos scripts aprovados. Não houve mudança na aplicação, nas permissões, nos limites, em pagamentos ou na publicação editorial. Build da aplicação não repetido, pois esta etapa altera conteúdo e ferramentas administrativas.

A [checagem de lançamento](PRONTIDAO-LANCAMENTO.md) continua distinguindo rascunhos de conteúdo disponível. Os resultados documentados na etapa 36 são históricos: o total de rascunhos foi ampliado, mas diagnóstico, prática e catálogo publicados continuam indisponíveis.
