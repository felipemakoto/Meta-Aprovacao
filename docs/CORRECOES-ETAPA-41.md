# Correções editoriais — etapa 41

Aplicadas em 10/10/2026 aos noventa rascunhos adicionais. O banco contém cem questões: vinte por matéria, noventa na versão 2 e dez do lote inicial preservadas na versão 1. Todas continuam `draft`, sem revisão humana atribuída. Os seis modelos de simulado continuam não publicados.

## Conteúdo corrigido

- Reorganizada a ordem das alternativas das noventa questões por permutação independente e reproduzível por ID. As letras corretas foram atualizadas; o significado da resposta correta foi preservado, exceto na reformulação explícita de P04. As matérias agora têm sequências distintas, sem o ciclo repetido de cinco letras anterior.
- P04: inferência provável apoiada em pistas de um guarda-chuva molhado, sem transformar hipótese em certeza.
- C16 e C19: alternativas incorretas relacionadas aos conceitos científicos cobrados, evitando opções excessivamente distantes do tema.
- H09: alternativas relacionadas a acontecimentos históricos e explicação cronológica, com referências institucionais registradas no catálogo.

O [manifesto antes/depois](../content/revisao-etapa-41.json) conserva o conteúdo anterior e o corrigido de cada ID. O [relatório da etapa 40](CONFERENCIA-EDITORIAL-ETAPA-40.md) preserva a conferência anterior; o [relatório atual](CONFERENCIA-EDITORIAL.md) identifica o novo catálogo. Dificuldade, variedade, cobertura de edital e qualidade pedagógica continuam sujeitos à revisão humana. A mudança da ordem das alternativas não certifica equilíbrio psicométrico.

## Aplicação controlada

O [SQL de correção](../supabase/content/revisao-etapa-41.sql) é separado das migrations e dos arquivos de inserção. Confere todos os noventa registros e seus gabaritos antes de alterar qualquer um, com bloqueios ordenados e execução atômica. Exige correspondência exata com a versão anterior ou com a versão corrigida; rejeita alteração editorial divergente, status revisado/publicado, gabarito ausente e uso em diagnóstico, prática ou simulado.

Reexecutar sobre a versão corrigida não altera timestamps. A carga real preservou os dez registros iniciais, todos os modelos e registros de tentativas, conferidos por hashes antes/depois. Nenhuma página da aplicação, schema, permissão, cota, assinatura ou cobrança foi alterada. A contratação permanece bloqueada.

Os geradores de Matemática, Português e demais matérias agora produzem inserções da versão 2 para os IDs adicionais. Esses SQLs preservam conflitos existentes; portanto, não substituem o SQL explícito de correção. Não usar inserção para tentar atualizar conteúdo já existente. A implantação da aplicação não executa esta correção automaticamente.

## Verificações realizadas

Ensaio SQL com rollback antes e depois da carga: oito casos de rejeição, aplicação positiva e repetição sem alteração de registros/timestamps. Casos cobertos: enunciado divergente, questão revisada, publicada, gabarito ausente, explicação divergente e uso nas três modalidades de tentativa. Testes transacionais anteriores dos três geradores também passaram.

Consulta somente leitura confirmou a correspondência exata de conteúdo, alternativas, gabaritos e versões das cem questões no banco. Sincronização dos artefatos e lint dos scripts aprovados. Navegador isolado: filtros, persistência, identificação do revisor, exportação/importação, recusa de catálogo antigo, preservação/exportação das anotações anteriores quando disponíveis, texto seguro, falha de armazenamento e layout sem rolagem horizontal em 320, 360 e 1100 px. Sem chamadas externas ou erros de JavaScript. Build da aplicação não repetido por ausência de alterações nela.

Comandos de manutenção:

```powershell
npm.cmd run content:correction:build
npm.cmd run content:correction:check
npm.cmd run test:content:correction
npm.cmd run content:review:build
npm.cmd run content:review:check
npm.cmd run content:review:verify
```

Os comandos `content:math:build/check`, `content:portuguese:build/check` e `content:subjects:build/check` mantêm os respectivos SQLs e documentos sincronizados. O teste da correção pressupõe o estado de rascunhos acima e realiza rollback; depois de revisão/publicação, usar ambiente isolado. Os comandos de geração/conferência não aplicam a carga real.

## Ferramenta e compartilhamento

Pacote atualizado: `out/revisao-editorial-meta-aprovacao-v2.zip`, com HTML atual, HTML anterior e instruções. Extrair antes de abrir. O ZIP anterior foi preservado. Os arquivos de revisão ficam fora de `public` e não fazem parte das páginas do site.

Anotações ficam no navegador e devem ser exportadas como JSON para envio ou cópia durável. Não estão embutidas no ZIP. Cada revisão pertence ao hash e às versões daquele catálogo: anotações antigas não são transferidas nem tratadas como aprovação das questões corrigidas. Se a ferramenta encontrar anotações do catálogo anterior nesse navegador/origem, oferece exportação separada; caso contrário, use o HTML anterior e o JSON que já foi exportado. Mover arquivos ou trocar de navegador pode mudar o acesso ao armazenamento local.

Próximo passo: revisão humana identificada das questões e dos modelos, usando o novo catálogo. As pendências comerciais e de produção permanecem registradas em [Prontidão de lançamento](PRONTIDAO-LANCAMENTO.md); nenhuma venda ou publicação editorial foi liberada.
