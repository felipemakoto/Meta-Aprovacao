# Quiz inicial contextualizado — etapa 53

O responsável pediu aumento moderado de dificuldade e enunciados mais desenvolvidos, mantendo questões relativamente fáceis. O quiz continua com dez perguntas fixas, duas por matéria. A revisão combina **cinco fáceis e cinco intermediárias**, uma de cada por matéria; os rótulos são estimativas editoriais, sem calibração estatística com alunos. Nenhuma questão foi classificada como difícil.

## Conteúdo

| Posição | Assunto | Nível estimado | Raciocínio |
| --- | --- | --- | --- |
| 1 | Porcentagem | Fácil | Desconto e preço final de uma mochila. |
| 2 | Equação do primeiro grau | Intermediário | Separar custo fixo do ônibus e ingressos por aluno. |
| 3 | Interpretação | Fácil | Finalidade explícita de um aviso sobre a biblioteca. |
| 4 | Relações de sentido | Intermediário | Interpretar concessão com “embora” em texto próprio. |
| 5 | Evaporação | Fácil | Relacionar ventilação e secagem em comparação controlada. |
| 6 | Cadeia alimentar | Intermediário | Interpretar duas relações entre predador e presa. |
| 7 | Fontes históricas | Fácil | Distinguir evidência visível de generalização. |
| 8 | Economia colonial | Intermediário | Relacionar propriedade da terra e produção para exportação. |
| 9 | Escala cartográfica | Fácil | Converter dois centímetros de mapa em quilômetros reais. |
| 10 | Urbanização | Intermediário | Relacionar impermeabilização, infiltração e escoamento. |

Enunciados autorais e situações fictícias. Não são transcrições de provas nem recebem gabarito atribuído às bancas. Os cadernos oficiais foram consultados como referência de contextualização, interpretação e operações em etapas: [ETEC 1º semestre de 2026](https://bkpsitecpsnew.blob.core.windows.net/uploadsitecps/sites/1/2025/12/A-CADERNO-VESTIBULINHO-1-SEM2026.pdf) e [IFSP integrado, caderno tipo 2](https://concurso1.fundacaocefetminas.org.br/documentos/CadernodeProvaTIPO2Integrado122639008143044863492.pdf). No IFSP consultado, a referência é Matemática/Português; Ciências, História e Geografia seguem a referência ETEC. Isso não torna a distribuição de cinco matérias uma réplica da prova IFSP.

## Preservação e publicação

O catálogo anterior está arquivado em `content/quiz-inicial-v1.json`; a migration inicial não foi reescrita. O gerador histórico usa esse arquivo e continua produzindo exatamente a migration aplicada da etapa 52. O catálogo corrente tem revisão 2 e dez **IDs novos**. A migration `20261015020000_intro_quiz_contextualized.sql` insere as perguntas e gabaritos novos, confirma os dez vínculos anteriores e troca somente o catálogo de futuras tentativas.

Questões anteriores e snapshots não são atualizados ou apagados. Tentativas já abertas continuam com as perguntas originais. Os dez itens novos continuam `reviewed`, fora das 500 questões `published` usadas por prática e simulados. Os dez introdutórios da primeira versão permanecem para conservar referências históricas. A RPC aceita fácil/intermediário no catálogo fixo, mantendo a contagem, duas questões por matéria, cookies, prazo, sigilo dos gabaritos, correção e idempotência.

A transação de implantação é explícita para tornar a troca atômica. A primeira aplicação parou no comando de lock por falta de transação explícita, antes de inserir novas perguntas ou trocar o catálogo. O gerador foi corrigido para envolver a implantação em BEGIN/COMMIT. O ensaio remove apenas esse invólucro e usa sua própria transação terminada em **ROLLBACK**, sem confirmar conteúdo de teste. Não há troca de critérios financeiros, planos ou permissões.

## Verificações

- 26 testes Node aprovados: mistura de níveis, IDs novos, enunciados desenvolvidos, cálculos, conceitos, foco de estudo, cookies/CSRF, projeção sem gabarito, correção e retry.
- Ensaio SQL com rollback antes da implantação: uma tentativa da versão anterior permanece idêntica após a troca; hashes dos 500 conteúdos publicados e respectivos gabaritos permanecem iguais. O catálogo novo inicia tentativas iguais, aceita dez respostas e mantém correção, idempotência e permissões.
- Interface conferida nas dez perguntas em 320, 390 e 1280 px: 30 combinações, cinco alternativas por pergunta, sem overflow ou erro de navegador. Parágrafos dos textos agora preservam suas quebras de linha. Capturas em `out/intro53/`, incluindo Matemática e Português, inspecionadas visualmente.
- Lint, TypeScript e build aprovados. O fluxo de resultado por assuntos, cadastro, planos e carregamento da etapa 52 foi preservado.

Migration aplicada e ensaio pós-aplicação aprovado. A API publicada também passou: dez IDs/enunciados novos, retomada idêntica, gabarito oculto antes do envio, correção 10/10 e reenvio idempotente. Tentativa descartável removida; nenhum e-mail, conta ou pagamento criado. A primeira conferência de limpeza procurava JSON sem espaços e informou falso; o verificador foi corrigido para aceitar a formatação e a execução repetida confirmou a remoção.

Para visualizar as novas questões, usar uma tentativa nova ou a prévia local `/quiz/preview`. Reabrir uma tentativa antiga não substitui suas perguntas.
