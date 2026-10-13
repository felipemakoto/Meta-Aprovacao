# Conteúdo para ETEC e IFSP — etapa 43

Aplicado em 12/10/2026 após o usuário pedir aumento do nível de todas as questões e ampliação do banco. Foco confirmado: IFSP de São Paulo. Orientação posterior do usuário permite repetir sem aviso específico; portanto não há bloqueio de esgotamento ou promessa de questões sempre inéditas.

## Resultado

Quinhentos rascunhos, cem por matéria. Os cem existentes foram reformulados, preservando IDs e elevando as versões: dez agora na versão 2 e noventa na versão 3. Quatrocentos registros novos estão na versão 1. Cinco alternativas e explicação em todos. Zero revisadas/publicadas; seis modelos continuam não publicados. A carga preservou hashes dos modelos e das tentativas, inclusive snapshots de diagnósticos.

Enunciados incluem problemas em etapas, leitura de dados, controle experimental, comparação de hipóteses, análise de argumentos e fontes. Não se alterou apenas o rótulo de dificuldade: todos os cem enunciados anteriores foram substituídos. Níveis medium/hard são estimativas editoriais, sem calibração por resultados de estudantes; a revisão deve verificar se a exigência efetiva atende ao público, não inferir dificuldade apenas do tamanho do texto.

Há vinte famílias/temas por matéria, cinco tarefas ou variações por família. Estímulos compartilhados geram perguntas diferentes em Português, Ciências, História e Geografia; Matemática inclui variações parametrizadas. Isso oferece 500 questões com enunciados distintos, não 500 temas ou estímulos independentes. Repetições de tema e semelhanças entre variações são esperadas e devem ser avaliadas pelo revisor. [Relatório atual](CONFERENCIA-EDITORIAL.md) e revisões completas em [Matemática](revisao-atual/REVISAO-MATEMATICA.md), [Português](revisao-atual/REVISAO-PORTUGUES.md), [Ciências](revisao-atual/REVISAO-CIENCIAS.md), [História](revisao-atual/REVISAO-HISTORIA.md) e [Geografia](revisao-atual/REVISAO-GEOGRAFIA.md).

## Provas oficiais consultadas

- [CPS — provas e gabaritos anteriores da ETEC](https://www.cps.sp.gov.br/etec/vestibulinho/).
- [ETEC — caderno do 1º semestre de 2026](https://bkpsitecpsnew.blob.core.windows.net/uploadsitecps/sites/1/2025/12/A-CADERNO-VESTIBULINHO-1-SEM2026.pdf).
- [ETEC — caderno do 1º semestre de 2025](https://bkpsitecpsnew.blob.core.windows.net/uploadsitecps/sites/1/2024/12/A-CADERNO-VESTIBULINHO.pdf).
- [IFSP Integrado — edital 211/2025, caderno tipo 2](https://concurso1.fundacaocefetminas.org.br/documentos/CadernodeProvaTIPO2Integrado122639008143044863492.pdf).

Os cadernos foram acessados como referência de estilo e competências, incluindo contextualização, raciocínio quantitativo e interpretação textual. O IFSP integrado consultado contém quinze questões de Matemática e quinze de Português; por isso esses registros têm destino `both`, enquanto Ciências/História/Geografia têm destino `etec`. Isso não transforma os modelos existentes de vinte questões em simulados oficiais completos de cada instituição.

Os 500 exercícios são autorais elaborados com auxílio de IA; não são transcrições de provas nem recebem atribuição de gabarito da banca. Cenários, dados experimentais, indicadores e textos de atividade são fictícios. Links de referência indicam sua função, sem criar aparência de questão oficial copiada. Não foi identificada autorização geral para redistribuir integralmente os cadernos e seus textos/imagens de terceiros em um produto pago; os PDFs oficiais permanecem como links para consulta, sem reprodução integral no banco. Referências históricas adicionais conferidas: [Lei 3.353/1888](https://www.planalto.gov.br/ccivil_03/leis/lim/lim3353.htm) e [Constituição do Império de 1824](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao24.htm).

## Fontes e carga

Fonte ativa: `content/banco-etec-if.json`, gerada pelos cinco módulos em `scripts/content/`. Snapshot anterior: `content/catalogo-etapa-42.json`; manifesto antes/depois e adições: `content/revisao-etapa-43.json`. O snapshot contém conteúdo editorial, sem anotações do navegador ou identificação de pessoas.

SQL explícito em `supabase/content/revisao-etapa-43.sql`, separado da migration e do seed. Bloqueia e confere todos os registros antes de aplicar; rejeita divergência, revisão/publicação, falta de gabarito, uso prévio das questões a alterar e conflitos nos IDs novos. Correção/admissão são atômicas. Reexecução de conteúdo idêntico não muda timestamps; nenhum status é promovido. Nenhuma tentativa antiga é apagada ou recorreta. Fonte atual verificada por leitura administrativa contra os 500 registros e gabaritos do banco.

Os arquivos das etapas 37–41 são históricos e preservados. Os geradores antigos continuam reproduzindo esses lotes; não são a fonte atual. Os aliases genéricos `content:correction:*` e `test:content:correction` agora apontam à carga/teste atuais. Não aplicar o SQL antigo como atualização do catálogo novo.

## Seleção conforme a orientação mais recente

Migration `20261012220000_study_selection_priority.sql` aplicada após ensaio e dry-run. Implementadores privados priorizam menor número de apresentações na conta, depois a apresentação mais antiga e sorteio para desempate. Prática também evita a anterior quando há alternativa com prioridade equivalente. O histórico cruza prática, snapshots de simulados e diagnósticos salvos na conta; considera apresentações mesmo abandonadas. Diagnóstico anônimo ainda não associado não permite identificar a conta.

Repetir é permitido quando os filtros ou o uso do banco tornam necessário. Não há campo, selo ou aviso novo dizendo que a questão já apareceu. Uma questão repetida não é anunciada como inédita. Não se altera sua redação aleatoriamente nem seu gabarito para disfarçar. Um mesmo simulado continua sem IDs duplicados. Tentativas abertas são retomadas; retries não consomem outra questão. Revisão do histórico continua disponível.

As duas modalidades usam a mesma trava por conta, preservando serialização entre escolhas. Nenhum cliente recebe acesso ao cálculo privado de exposição. Limites gratuitos, Premium, prazo das tentativas, filtros, correção por snapshot e direitos pagos permanecem. A seleção age somente sobre conteúdo publicado, não disponibiliza os rascunhos.

## Validação

- Dez testes Node: estrutura e reformulação de todas, relações dos cem gabaritos matemáticos (incluindo enumeração de probabilidades/combinações), medidas críticas de Ciências/Geografia e recebimento de anotações com catálogo/versões, identificação e texto seguro.
- Carga SQL ensaiada com rollback antes e depois da aplicação: nove rejeições, integridade de 500 rascunhos, preservação de modelos/tentativas e reexecução sem alteração de timestamps.
- Seleção SQL com rollback antes e depois da migration: prioridade entre prática e simulado, repetição após percorrer o pool, evitar a anterior, isolamento entre contas, retry/retomada, filtros, snapshot, conta não confirmada e privilégios. Mesma trava conferida; não é alegada uma nova prova de concorrência real entre sessões nesta etapa.
- Regressão de benefícios Premium aprovada após a migration: cotas/acesso, catálogo, expiração, reversão, retomada e privacidade. Testes de preservação dos três lotes antigos também atualizados para as versões/destinos ativos.
- Ferramenta em Chrome isolado: 500 questões, filtros, respostas ocultas, identificação/persistência, exportação/importação, recusa do JSON v2, exportação separada das anotações v2, texto seguro, falha de armazenamento e layout sem rolagem horizontal em 320/360/1100 px. Zero chamadas externas espontâneas e erros de JavaScript.
- Sincronização dos artefatos e lint aprovados. Sem mudanças no código/páginas Next.js; build da aplicação não repetido. Nenhuma cobrança, publicação editorial ou liberação de contratação.

Comandos atuais:

```powershell
npm.cmd run content:exam:build
npm.cmd run content:exam:check
npm.cmd run test:content:exam
npm.cmd run test:content:exam:sql
npm.cmd run test:study:selection
npm.cmd run content:review:verify
```

Testes SQL pressupõem rascunhos sem uso e fazem rollback; depois de revisão/publicação, executar em ambiente isolado. Geração e conferência não aplicam a carga real automaticamente.

## Pacote para a nova revisão

`out/revisao-editorial-meta-aprovacao-v3.zip`, também extraído em `out/revisao-editorial-meta-aprovacao-v3/`. Abrir `revisao-editorial.html`. Inclui HTML v2 para consulta do trabalho anterior e instruções. ZIP/pasta v2 usados pelo amigo preservados; não contêm nem perdem suas anotações locais.

JSONs da revisão atual exigem o novo hash e versões. Anotações anteriores continuam separadas, exportáveis quando encontradas no navegador/origem, sem aprovação automática dos enunciados reformulados. Limite de importação/recebimento aumentado para 16 MB, mantendo notas de até 8.000 caracteres. Exportação é a cópia durável; o armazenamento do navegador pode ser insuficiente e a ferramenta informa falha quando ela ocorre.

Próximo passo: avaliação humana do nível, enunciados, distratores e respostas, usando a ferramenta nova. Os seis modelos e as pendências comerciais continuam sujeitos a revisão separada em [Prontidão de lançamento](PRONTIDAO-LANCAMENTO.md).
