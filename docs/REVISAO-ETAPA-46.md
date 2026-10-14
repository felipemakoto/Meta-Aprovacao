# Segunda revisão das questões — etapa 46

Em 14/10/2026, nova leitura das 500 questões, com atenção a comandos ambíguos, suficiência dos dados, plausibilidade das alternativas e coerência das explicações. Corrigidos 67 registros: 7 Matemática, 2 Português, 22 Ciências, 11 História e 25 Geografia. Os 433 restantes preservam integralmente seus campos editoriais e versões. Mantidos os 500 IDs e sua ordem. Todas continuam em rascunho, sem aprovação humana atribuída.

## Correções concretas

- **P77:** o comando genérico aceitava reescritas gramaticais que mantinham a ambiguidade. Agora exige explicitar que a inscrição pertence à aluna. A resposta nomeia a aluna; as outras preservam ou alteram a referência.
- **P75:** o contexto informa que houve debate do documentário. O comando pede uma oração relativa com a regência de assistir, em vez de sugerir equivalência entre frases com informações diferentes.
- **M98:** corrigida a contradição entre escolher oito pessoas e formar uma comissão de duas. São duas escolhidas entre oito.
- **M82/M83:** separados o desconto necessário para desfazer um aumento e uma sequência já executada; preço de tabela superior ao abatimento fixo explicitado.
- **M44/M64:** duas tarefas repetiam o mesmo resultado por proporcionalidade. Substituídas por carga em duas etapas e comparação com produtividade individual menor. Resultados independentes: vinte trabalhadores e dez dias. Ambos classificados como difíceis pela combinação de etapas; classificação editorial, sem dados de desempenho.
- **M95/M97/G86/C51:** retiradas expressões que anunciavam o erro do próprio distrator. Mantidas alternativas incorretas com raciocínios identificáveis.
- **C06 e variantes:** ramos com área foliar equivalente e saúde comparável, além dos controles já existentes. **C16:** volume de ar e umidade controlados. **C18:** cultivo explicitamente fechado, evitando confundir estabilidade com fluxos migratórios. **C20:** caixas comparáveis exceto o revestimento. **C72:** novas substâncias identificadas no contexto, distinguindo reação de simples vaporização. Melhorados distratores sobre estabilidade populacional.
- **História:** dez novas situações usam evidências concretas, como instrumentos e grãos, terras e serviço militar, imagem e legenda, fontes de autoridade religiosa, produção e coerção, preço de alimentos, produtividade e jornada, projetos de cidadania, contratos e petições, expectativas e experiência posterior na guerra. São atividades autorais, não transcrições de documentos históricos. H96 fornece a cronologia usada nas alternativas, diferenciando os marcos legais dos efeitos sociais que eles não demonstram.
- **Geografia:** corrigidas iniciais minúsculas após ponto em cinco famílias. Nos problemas de geração solar/eólica, o período dos fatores médios agora é explicitamente o mesmo intervalo de dez horas usado na energia total.

Não foram encontradas outras mudanças de gabarito necessárias nesta leitura. Isso não certifica ausência absoluta de erros: revisão humana e observação de desempenho continuam pendentes.

## Fontes e método

Mantidas as referências de competências e estilo das etapas 43–45, com ETEC para as cinco matérias e IFSP para Matemática/Português. Nenhuma questão foi apresentada como transcrição oficial. Conferidos novamente o [Manual do Senado — Assistir](https://www12.senado.leg.br/manualdecomunicacao/estilos/assistir), o [Manual — Concordância verbal](https://www12.senado.leg.br/manualdecomunicacao/estilos/concordancia-verbal) e o capítulo de [reações dependentes de luz da fotossíntese — OpenStax](https://openstax.org/books/biology-2e/pages/8-2-the-light-dependent-reactions-of-photosynthesis). A escolha das condições experimentais explicitadas é uma decisão editorial para a comparação proposta, não uma citação desses materiais.

80 tarefas numéricas de Matemática conferidas por equações e enumeração independentes; duas novas verificações de carga de trabalho, e verificação de cinco valores distintos em cada uma das oitenta questões. Mantidos setenta recálculos escalares de Ciências/Geografia/História, balanços físicos, probabilidades e fusos. H51 tem conferência separada de produção (+50%), jornada (+20%) e produção por trabalhador-hora (1 para 1,25). A leitura de alternativas e conceitos não numéricos foi assistida por IA. Os [500 gabaritos e fundamentos](AUDITORIA-GABARITOS-ETAPA-46.md) permanecem disponíveis para conferência humana.

Distribuição atual: **67 fáceis, 409 médias e 24 difíceis**. As duas mudanças de nível são M44/M64; os demais níveis foram mantidos.

## Validação e aplicação

26 testes Node aprovados; sincronização dos geradores e lint aprovados. Ensaio transacional com nove rejeições: divergência editorial, registro revisado, publicado, gabarito ausente, gabarito modificado, uso em prática, em simulado, em diagnóstico e versão divergente. Fixtures revertidas; reexecuções idênticas preservam registros e timestamps. Hashes protegem as questões não modificadas, modelos e tentativas.

Antes da carga, SHA-256 das 500 projeções no banco correspondeu ao snapshot 45. Carga 46 aplicada em uma transação, apenas aos 67 rascunhos não utilizados, conferindo toda a projeção editorial antes/depois, inclusive campos omitidos do transporte compacto. Depois, hashes e comparação integral das 500 questões/gabaritos corresponderam à fonte atual. Nenhuma alteração de schema, autorização, seleção de alunos, tentativas, limites ou pagamento.

Ferramenta offline v6 validada em navegador isolado: 500 itens, filtros, gabaritos ocultos inicialmente, persistência, exportação/importação, recusa de catálogo anterior, texto recebido sem execução, tratamento de falha do armazenamento, nenhuma chamada externa e ausência de overflow em 320/360/1100 px. A v5, pasta do amigo e anotações anteriores foram preservadas. Exportar as anotações no arquivo original antes de mudar de versão; sua transferência não equivale a aprovação da questão corrigida.

## Continuação preparada

Consulta somente leitura confirmou seis modelos não publicados: rápido com dez questões e cinco modelos por matéria com vinte cada. Criado [roteiro dos seis modelos](CONFERENCIA-MODELOS-ETAPA-46.md), com amostras estáticas para resolver e registrar avaliação de conteúdo, variedade, nível e tempo. Essas amostras não são tentativas reais nem alteram o sorteio da aplicação. O modelo rápido mistura as cinco matérias; não é réplica do formato específico do IFSP.

Próxima ação editorial: revisão humana identificada das questões e dos modelos, seguida do recebimento do JSON de anotações. Não houve publicação de conteúdo ou liberação comercial.

Fonte reproduzível: `scripts/content/revision46.mjs`, sobre os módulos preservados das etapas anteriores. Snapshot anterior: `content/catalogo-etapa-45.json`. Manifesto antes/depois: `content/revisao-etapa-46.json`. Carga: `supabase/content/revisao-etapa-46.sql`. Configuração observada dos modelos: `content/modelos-etapa-46.json`. Ferramenta e pacote local: `out/revisao-editorial-meta-aprovacao-v6/` e `.zip`.
