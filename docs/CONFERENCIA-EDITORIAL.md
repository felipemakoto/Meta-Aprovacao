# Conferência preliminar de conteúdo — etapa 40

Catálogo local de cem questões conferido em 10/10/2026. Originais auxiliadas por IA; esta análise do assistente não registra revisão pedagógica humana nem publica conteúdo. A versão desta conferência tem SHA-256 `fe1470d05e2094af84776fd8825b3012913348a871c886e0214f2b65cbfa098f`.

## Conferência estrutural

Cem IDs e enunciados distintos; cinco alternativas distintas, uma letra de gabarito válida e explicação em cada questão. Vinte questões por matéria. A conferência de sincronização com o banco é separada, somente leitura, pelo comando `content:review:verify`.

| Matéria | Questões | Fácil estimada | Média estimada | Difícil estimada | Letras do lote 03–20 | Repetição do bloco inicial de 5 |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| Matemática | 20 | 6 | 14 | 0 | CEADBCEADBCEADBCEB | CEADB: 17/18 |
| Português | 20 | 11 | 9 | 0 | CEADBCEADBCEADBCEB | CEADB: 17/18 |
| Ciências | 20 | 10 | 10 | 0 | ADBECADBECADBECADB | ADBEC: 18/18 |
| História | 20 | 9 | 11 | 0 | BDCAEBDCAEBDCAEBDC | BDCAE: 18/18 |
| Geografia | 20 | 11 | 9 | 0 | CEADBCEADBCEADBCEA | CEADB: 18/18 |

As letras estão na ordem editorial dos documentos, não na ordem aleatória de uma tentativa do estudante. A análise de repetição compara cada posição ao bloco inicial de cinco letras; não certifica nem reprova um gabarito.

## Ajustes recomendados antes de publicar

1. **Variar a posição da resposta correta.** Os cinco lotes adicionais seguem, integralmente ou quase, um ciclo de cinco letras. Matemática e Português têm a mesma sequência de dezoito letras. Isso merece ajuste editorial preservando a relação entre alternativa correta e explicação; distribuição equilibrada sozinha não comprova qualidade. Não foi aplicada uma troca automática ao banco.
2. **Reavaliar P04.** A alternativa correta informa apenas que o guarda-chuva está molhado, algo praticamente explícito nas gotas e na ação de secar. A classificação como inferência/dificuldade média merece revisão: pode ser leitura de pistas simples ou exigir reformulação para uma inferência menos direta.
3. **Melhorar alternativas incorretas pouco plausíveis.** Exemplos C16 (fotossíntese/condução na colher), C19 (Sol apagado) e H09 (Brasília/Segunda Guerra no contexto de 1808). São fáceis de eliminar sem dominar o conceito. Ajustar ao nível pretendido sem criar uma segunda resposta correta.
4. **Conferir referência e público.** História/Geografia/Ciências incluem referências com acesso limitado a trechos indexados. Conferir os documentos primários, a contextualização histórica e os conceitos. Estimativas de dificuldade ainda não foram calibradas; não há questão classificada como difícil no catálogo atual.
5. **Avaliar os seis modelos.** O simulado rápido prevê dez questões; cada modelo Premium por matéria prevê vinte. Os vinte registros disponíveis por matéria apenas atendem essa quantidade após aprovação/publicação e deixam pouca variedade. Esta contagem não valida edital, experiência de estudo ilimitado ou promessa comercial.

A leitura preliminar não apontou um gabarito numérico divergente nos exercícios de cálculo; isso não substitui revisão humana das cem questões, dos distratores e das explicações. As contas já conferidas nas etapas 37/39 permanecem documentadas nos respectivos guias. Demais questões exigem conferência contextual; ausência de erro apontado não é aprovação.

## Verificação da ferramenta em 10/10/2026

Consulta somente leitura confirmou correspondência de IDs, versões, matérias, enunciados, alternativas, gabaritos e explicações das cem questões com o banco, todas em draft. Lint dos scripts aprovado. Teste em navegador isolado aprovou filtros, respostas inicialmente ocultas, nome obrigatório na marcação de conferência, persistência ao recarregar, exportação/importação, recusa de catálogo antigo e texto tratado como texto. Edição da nota desfaz a marcação de conferida; falha do armazenamento avisa e mantém a exportação disponível. Sem chamadas externas durante o teste; layout sem transbordamento em 320, 360 e 1100 pixels.

## Revisão prática

Gerar com `npm.cmd run content:review:build` e abrir `out/revisao-editorial.html`. Funciona localmente, sem login ou comunicação com o site. Filtre por matéria/status, leia a questão, abra o gabarito e registre uma nota. “Conferida neste arquivo” exige nome do revisor e registra a data da marcação, mas não altera o estado editorial do banco.

As anotações ficam no armazenamento desse navegador, quando disponível. Exporte o JSON para manter uma cópia; é possível importá-lo no mesmo catálogo. Arquivos de versões diferentes são recusados. Mudanças de origem/navegador ou limpeza de dados podem remover o armazenamento local; a exportação é a cópia durável. Anotações/revisor não devem ser adicionados ao GitHub. Não colocar esse HTML em `public`, pois contém gabaritos.

Próximo passo: corrigir os pontos editoriais e obter revisão humana identificada. Publicação das questões/modelos e ativação comercial continuam etapas separadas, com as pendências em [PRONTIDAO-LANCAMENTO.md](PRONTIDAO-LANCAMENTO.md).
