# Recebimento da revisão — etapa 42

Preparado em 12/10/2026 enquanto o amigo do usuário continua revisando. Nenhum arquivo real de revisão foi recebido ou aprovação humana registrada nesta etapa. A ferramenta extraída e o ZIP v2 permanecem válidos e não foram modificados.

## Quando a revisão chegar

O revisor deve usar **Exportar anotações** e enviar o JSON, mantendo uma cópia. O HTML e o ZIP não contêm os comentários salvos no navegador. Para conferência administrativa na pasta do projeto:

```powershell
npm.cmd run content:review:report -- 'C:\caminho\revisao-meta-aprovacao.json'
```

O comando lê o arquivo, confere sua compatibilidade com o catálogo atual e cria um relatório Markdown separado em `out/revisoes-recebidas/`, com nome único. Não substitui o JSON original nem relatórios anteriores. Não acessa o banco, a rede, o armazenamento do navegador ou arquivos de credenciais.

O relatório mostra quantidade e números das questões pendentes, com ajustes ou conferidas, totais por matéria, comentários e identificação/data declaradas. Questões ausentes no arquivo contam como pendentes. Comentários em questões marcadas como conferidas continuam visíveis e precisam ser considerados antes de uma decisão.

Arquivos de catálogo anterior, versões incorretas, IDs desconhecidos/duplicados, marcações inválidas e conferências sem nome/data são recusados antes de gerar o relatório. Limite de 1,2 MB; nomes de até 120 caracteres e notas de até 8.000 caracteres. Campos extras são descartados. Texto recebido é apresentado literalmente, sem interpretar HTML, links ou instruções embutidas. O relatório contém nomes e comentários: permanece fora de `public` e ignorado pelo Git, assim como os JSONs de revisão guardados em `out`.

A compatibilidade de formato não autentica o revisor nem certifica qualidade pedagógica. Não unir silenciosamente arquivos de pessoas ou versões diferentes; cada retorno gera um relatório próprio. Nenhuma marcação é enviada ao banco. Mesmo cem conferidas não publicam conteúdo nem liberam vendas. Correções posteriores exigem nova conferência da versão alterada.

## Modelos de simulado

A ferramenta e o JSON cobrem questões. Os seis modelos exigem conferência separada: rápido gratuito com dez questões mistas e cinco modelos Premium de vinte questões por matéria. Para cada modelo, registrar responsável e data, conferir nome/matéria/quantidade, adequação dos temas, critérios de seleção e cobertura com questões efetivamente revisadas. Rascunhos e quantidade técnica não constituem aprovação editorial do modelo.

## Situação consultada em 12/10/2026

Checagem administrativa somente leitura: cem questões draft, vinte por matéria, zero revisadas/publicadas; seis modelos draft e zero publicados. Contratação desativada. Automação e monitor ativos, fila vazia e última execução bem-sucedida no instante da consulta. O monitor registra recorrências históricas de falha da automação, resolvidas na amostra atual; normalidade momentânea não comprova disponibilidade contínua ou sua causa. Nenhum sinal/prova/período pago comercial registrado. Histórico técnico do agendador com 8.094 execuções, sem exclusão.

Pendências externas mantidas em [Prontidão de lançamento](PRONTIDAO-LANCAMENTO.md): contrato real da API, pagamento/entrega comerciais, revisão/publicação explícitas, horário/fuso do cupom, retenção e configuração/disponibilidade de produção. Esta etapa não altera questões, modelos, páginas, banco, pagamentos ou trava de contratação.

## Validação técnica

Sete testes Node aprovados: retorno parcial, cem conferidas sem aprovação automática, comentários em conferidas, incompatibilidade de catálogo/versão, duplicação e IDs desconhecidos, identificação/data e formatos inválidos, limites em bytes, texto com HTML/links/cercas, BOM e comando preservando o arquivo original/recusando retorno antigo sem produzir relatório. Lint dos novos arquivos aprovado. Testes usam fixtures identificadas e não constituem revisão real. Build da aplicação não repetido, pois ela não foi alterada.

```powershell
npm.cmd run test:editorial:notes
```

Próximo passo: receber o JSON do revisor, ler os comentários e tratar ajustes concretos. Guia do catálogo corrigido: [Etapa 41](CORRECOES-ETAPA-41.md).
