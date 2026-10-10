# Ampliação de Português — etapa 38

Em 10/10/2026, preparado e carregado um lote de 18 questões originais com gabaritos e explicações, além de um modelo de simulado de Português com vinte questões. Todos em rascunho, com revisão humana pendente. Banco com 46 questões: vinte de Matemática, vinte de Português e duas em Ciências, História e Geografia. Três modelos de simulado em rascunho; nenhum conteúdo publicado ou contratação liberada.

## Revisão editorial

As novas questões estão no [documento de revisão de Português](REVISAO-PORTUGUES.md), identificadas de P03 a P20. As duas anteriores correspondem a P01/P02 e estão no [lote inicial](REVISAO-SEED.md), entradas 3 e 4. Para indicar uma correção, use o número da questão e descreva o ajuste desejado.

O lote aborda informação explícita, inferência, tema, finalidade, relações de sentido, referências, substituições, linguagem figurada, fato/opinião, pontuação, ambiguidade, concordância, tempo verbal, ordenação e vocabulário. Os textos foram escritos para este lote com auxílio de IA, sem reproduzir provas oficiais. Gabaritos e explicações foram conferidos na leitura dos exemplos; essa conferência do assistente não constitui aprovação humana nem validação pedagógica. Dificuldades são estimativas, sem calibração com estudantes ou análise de cobertura de edital.

O modelo de Português usa vinte questões da matéria e `free_access=false`, seguindo o catálogo Premium existente. Está `published=false`: não aparece para estudantes. A revisão e publicação explícitas das questões e do modelo serão necessárias antes de disponibilizá-lo. Quantidade não comprova variedade suficiente para comercializar estudo ilimitado.

## Fonte e geração

Fonte editável: `content/portugues-lote-1.json`. O gerador produz o documento de revisão e `supabase/content/portugues-lote-1.sql`, validando campos, alternativas distintas, dificuldade e letra do gabarito. Os artefatos não são colocados em `public` nem importados pela aplicação.

```powershell
npm.cmd run content:portuguese:build
npm.cmd run content:portuguese:check
```

O SQL é uma única instrução atômica com inserção de modelo, questões e gabaritos. As questões novas recebem `draft`, versão 1, destino `both`; o modelo recebe vinte questões, matéria Português, publicação e acesso gratuito desativados. IDs estáveis dos novos registros têm prefixos `d1380000` e `d1381000`.

Reexecução com conflito de ID não sobrescreve questão, gabarito ou modelo. Não repara silenciosamente gabaritos ausentes. Alterar o JSON e regenerar não atualiza linhas já carregadas: correções do banco exigem ação editorial separada e preservação de versões/snapshots usados. A carga foi feita explicitamente no banco vinculado; não é migration, não altera o esquema e não é executada automaticamente no deploy/reset.

## Verificação realizada

Ensaio antes/depois da carga com rollback confirmou dezoito questões, gabaritos, metadados, alternativas distintas e modelo em rascunho. Simulou revisão de questão/gabarito/modelo e ausência de outro gabarito, repetiu a carga duas vezes e comparou o hash de todas as questões, gabaritos e modelos. Nenhuma alteração existente foi sobrescrita; todas as fixtures revertidas. Esse teste pressupõe o lote em rascunho; depois da publicação, usar banco isolado.

```powershell
npm.cmd run test:content:portuguese
```

Carga real atômica aprovada, preservando o hash de todas as questões/gabaritos/modelos anteriores. Sincronização dos artefatos, lint dos scripts e checagem de lançamento conferidos. A checagem permanece pendente por falta de publicação/revisão e comprovação comercial. A aplicação, limites, permissões e pagamentos não foram alterados; build não repetido por ausência de mudança na aplicação. Nenhuma revisão humana foi atribuída ao usuário.

Próxima ampliação: Ciências, História e Geografia. Revisões de [Matemática](REVISAO-MATEMATICA.md) e do [lote inicial](REVISAO-SEED.md) continuam pendentes. Demais condições de lançamento em [PRONTIDAO-LANCAMENTO.md](PRONTIDAO-LANCAMENTO.md).
