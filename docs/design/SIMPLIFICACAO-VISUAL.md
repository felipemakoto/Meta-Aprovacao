# Simplificação visual — proposta

Pedido: “deixe o site mais clean, facil de entender rapidamente”. Proposta criada em 30/09/2026. Usuário aprovou: “está bom assim, pode continua”. Direção aplicada; mudanças e limites em ../SIMPLIFICACAO-IMPLEMENTADA.md. Checkpoint da proposta: 9df6856.

## Direção

Manter marfim, verde, Geist e títulos DM Serif Display. Reduzir texto repetido e decoração; títulos menores; uma ação principal bem identificada; informações relacionadas próximas; notas, datas e navegação com tamanhos proporcionais. Preservar labels, foco, áreas de toque e mensagens essenciais.

Primeiro alvo: histórico, por ser a tela que o usuário acaba de testar. Referência historico-mobile-v2-clean.png, substituindo a v1 somente após aprovação. Não é uma captura da aplicação. Dois testes ilustrativos, notas e erros coerentes. Imagem gerada pela ferramenta integrada image_gen com v1 como referência; prompt integral em clean-prompt.txt.

## Histórico proposto

- Título Histórico, sem frase de introdução redundante.
- Abas Testes e Questões em controle compacto.
- Data curta ao lado do nome do teste; apresentar ano quando necessário na implementação.
- Nota em sans semibold moderada, sem títulos serifados enormes para cada registro.
- Número de erros e Ver resultado na mesma faixa.
- Divisórias leves; Carregar mais como ação secundária.
- Praticar questões como ação principal após a lista.
- Dados ilustrativos permanece somente na demonstração.
- Em telas muito estreitas, permitir quebra de título/data e ação, preservando toque mínimo de 44px.

## Aplicação da direção nas demais telas, após aprovação

| Tela | Simplificação prevista |
| --- | --- |
| Entrada | Encurtar introdução e texto de apoio, aproximar botão da proposta; preservar título, marca e ausência do card de 10 questões conforme decisões anteriores. |
| Dashboard | Deixar os caminhos de estudo claros; reduzir links repetidos e ornamentos; manter último resultado e revisão; retirar item Simulados em breve enquanto o recurso não existe. |
| Questões | Destacar escolha de matéria e ação de buscar questão; rótulos diretos; opções adicionais de filtro agrupadas; reduzir instruções óbvias; preservar estados de erro e feedback. |
| Histórico | Implementar a proposta v2, incluindo a opção Questões e detalhes já existentes. |
| Resultado | Dar prioridade à nota e revisão dos erros; reduzir textos repetidos e tamanho de títulos secundários, preservando explicações. |
| Conta | Revisar texto e espaçamento; preservar labels, requisitos de senha, confirmação e recuperação. |

Não criar funcionalidades, novas rotas, dependências ou migrations nesta simplificação. Não mudar autenticação, regras de correção, snapshots ou publicação de questões.

## Verificação e pausa

Imagem inspecionada: cabeçalho, título, duas opções, dois registros, notas/erros, datas e ações legíveis. Fundo e botão possuem pequenas variações raster; implementação manterá cores sólidas dos tokens. Nenhuma alteração de código; testes não repetidos para imagens/documentação. Após aprovação: implementar, verificar lint/build e fluxos afetados, regenerar demonstrações portáteis e aguardar teste manual. QA por captura continua com o bloqueio já registrado; não alegar comparação visual automática.

A aprovação prévia é exigida pela seção 73 do pedido original: “Espere minha aprovação. Somente após aprovação: crie React/Tailwind/CSS.”
