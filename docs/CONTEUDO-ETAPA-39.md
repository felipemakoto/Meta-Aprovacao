# Conteúdo de Ciências, História e Geografia — etapa 39

Registro histórico. As correções e versões atuais desses lotes estão em [Etapa 41](CORRECOES-ETAPA-41.md); os documentos de revisão e SQLs gerados acompanham a fonte atualizada.

Em 10/10/2026, preparados e carregados 54 exercícios originais com cinco alternativas, gabaritos e explicações: dezoito novos por matéria. Foram acrescentados três modelos de simulado com vinte questões cada. O banco agora contém cem questões em rascunho e seis modelos não publicados. Nenhuma revisão humana ou publicação foi registrada nesta etapa.

## Revisão das cinco matérias

| Matéria | Total em rascunho | Novas questões para revisão | Duas iniciais |
| --- | ---: | --- | --- |
| Matemática | 20 | [M03–M20](REVISAO-MATEMATICA.md) | Lote inicial, entradas 1/2 |
| Português | 20 | [P03–P20](REVISAO-PORTUGUES.md) | Lote inicial, entradas 3/4 |
| Ciências | 20 | [C03–C20](REVISAO-CIENCIAS.md) | Lote inicial, entradas 5/6 |
| História | 20 | [H03–H20](REVISAO-HISTORIA.md) | Lote inicial, entradas 7/8 |
| Geografia | 20 | [G03–G20](REVISAO-GEOGRAFIA.md) | Lote inicial, entradas 9/10 |

As dez iniciais estão em [REVISAO-SEED.md](REVISAO-SEED.md). Para solicitar correção, indique o número da questão e o ajuste. Os documentos são internos e incluem respostas: não colocar em `public` ou servir na interface do estudante.

Ciências aborda células, ecologia, transformações da água, misturas, densidade, movimento, calor, circuitos, astronomia e experimento controlado. História aborda análise de fontes, cronologia, Brasil do século XIX, direitos, escrita, trabalho, culturas indígenas e patrimônio. Geografia aborda coordenadas, mapas, escalas, população, urbanização, atividades econômicas, água, clima e biomas.

Os exercícios foram formulados com auxílio de IA, sem copiar provas oficiais. As referências institucionais apoiam a conferência de conceitos, com links e tipo de acesso por questão; algumas consultas foram limitadas a trechos indexados ou tiveram acesso direto indisponível. Exemplos históricos fictícios são identificados. A conferência do assistente não substitui revisão pedagógica humana: avaliar clareza, única resposta correta, alternativas, explicação e adequação ao estudante, identificando revisor/data antes de aprovar. Dificuldades são estimativas, sem calibração com estudantes; quantidade não certifica cobertura de edital ou variedade suficiente para comercializar estudo ilimitado.

Os seis modelos são o rápido gratuito de dez questões e cinco modelos por matéria de vinte questões, estes com `free_access=false`. Todos estão `published=false`. Questões/modelos exigem revisão e publicação explícitas antes de aparecerem para estudantes; o catálogo atual continua indisponível.

## Fonte, geração e carga

Fontes editáveis: `content/ciencias-lote-1.json`, `content/historia-lote-1.json`, `content/geografia-lote-1.json` e catálogo `content/referencias-etapa-39.json`.

```powershell
npm.cmd run content:subjects:build
npm.cmd run content:subjects:check
```

O gerador valida campos, cinco alternativas distintas, dificuldade, letra de gabarito, referências e duplicação exata de enunciados entre os lotes adicionais das cinco matérias. Produz os três documentos de revisão, três SQLs individuais e `supabase/content/etapa-39.sql` combinado. Nenhum artefato é importado pela aplicação.

Cada SQL individual é uma instrução atômica; para carregar os três juntos, envolver o arquivo combinado em `BEGIN`/`COMMIT`. A carga real foi executada assim no banco vinculado, com cem questões resultantes em `draft`, versão 1 e destino `both`. IDs das novas questões usam os prefixos `d1390000`, `d1392000`, `d1394000`; modelos usam `d1391000`, `d1393000`, `d1395000`.

Conflitos por ID preservam questões, gabaritos e modelos existentes, inclusive gabarito ausente que precisa de correção editorial explícita. Regenerar os arquivos não atualiza registros já carregados: corrigir o banco em ação separada, preservando versões/snapshots usados. Esses arquivos são cargas de conteúdo, não migrations; não alteram esquema nem são executados automaticamente no deploy/reset.

## Verificação realizada

Artefatos sincronizados e lint dos dois scripts aprovados. Sete cálculos numéricos conferidos separadamente; numeração dos 54 exercícios verificada nos documentos. Ensaio SQL antes e depois da carga, com rollback, conferiu questões/gabaritos/metadados/modelos, simulou revisão editorial e ausência de gabarito, repetiu a carga duas vezes e confirmou o hash de todas as questões/gabaritos/modelos. Fixtures revertidas. Na carga real, o hash de todos os registros anteriores permaneceu igual.

```powershell
npm.cmd run test:content:subjects
```

Esse teste exige os lotes em rascunho; depois da publicação, executá-lo em banco isolado. A checagem de lançamento confirmou cem rascunhos, zero questões revisadas/publicadas, automação/monitoramento normal e configuração local válida. Seu resultado continua pendente por falta de conteúdo aprovado/publicado e das evidências comerciais descritas em [PRONTIDAO-LANCAMENTO.md](PRONTIDAO-LANCAMENTO.md). A aplicação não mudou, por isso o build não foi repetido.

Próximo passo: revisão editorial humana das cem questões e dos modelos. A contratação continua bloqueada; esta ampliação não libera vendas nem altera cotas, páginas ou pagamentos.
