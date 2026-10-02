# Etapa 22 — proposta visual das estatísticas

Usuário aprovou a versão v2 em 02/10/2026: “está bom pode continuar”. Implementação e verificações disponíveis concluídas; detalhes e roteiro em ../ESTATISTICAS.md. O restante registra a proposta anterior.

Revisão em 02/10/2026: a pedido do usuário, removido Meus estudos do canto superior direito do cabeçalho. Referência atual: [estatisticas-mobile-v2.png](estatisticas-mobile-v2.png). Edição inspecionada visualmente; restante do mockup preservado. Prompt de edição em estatisticas-header-edit-prompt.txt. A página ainda não foi implementada; solicitação limitada ao ajuste da proposta.

Iniciada em 30/09/2026 após aprovação da demonstração dos simulados: “está bom, pode continuar”. Checkpoint de implementação da etapa 21: 1f8a0f7. Essa aprovação é manual e refere-se à demonstração; persistência real pelo usuário continua dependendo de conteúdo revisado/publicado. Implementação da etapa 22 aguardará aprovação do mockup, conforme seção 73 do pedido original.

## Objetivo da página

Mostrar a atividade concluída da própria conta e orientar a revisão: quantas respostas foram registradas, quantas corretas/incorretas e os resultados por matéria. Rota proposta /estatisticas, acessível pelo dashboard. Não prever aprovação, domínio ou força/fraqueza de uma matéria.

## Hierarquia

1. Cabeçalho somente com ETEC / IF.
2. Título Estatísticas e seletor Período, com Todo o período e Últimos 30 dias.
3. Resumo compacto de acertos sobre respostas, erros e simulados concluídos.
4. Por matéria: fração de acertos/respostas; porcentagem somente com pelo menos cinco respostas naquela matéria no período.
5. Simulados recentes: título, data e fração do resultado, com acesso ao detalhe autorizado.
6. Ver histórico, à esquerda com seta antes do texto.

## Design system aplicado

Mesmos tokens de marfim/verde, título DM Serif Display, corpo Geist, divisórias finas, controles nativos acessíveis e coluna única. Referência visual: simulados-mobile-v1.png. Sem novos gráficos, decoração ou grade de cards. Fundo sólido na aplicação, sem reproduzir textura rasterizada que possa aparecer na imagem. Alvos de toque de pelo menos 44px e layout sem transbordamento em 320px.

## Estrutura e explicação do mockup

Imagem gerada em [estatisticas-mobile-v1.png](estatisticas-mobile-v1.png) e prompt integral em estatisticas-prompt.txt. Dados exclusivamente ilustrativos: 60 respostas, 42 acertos, 18 erros e dois simulados. Matemática 18/30, Português 9/12, Ciências 5/6, História 4/6 e Geografia 6/6 somam 42/60. Porcentagens arredondadas são descritivas dessas respostas; não indicam domínio.

Os simulados recentes de Matemática (12/20) e rápido (7/10) são apenas parte da atividade agregada. Um conjunto coerente de exemplo pode conter esses dois simulados, dois diagnósticos salvos (20 respostas no total) e dez práticas individuais. Não comparar provas de quantidades/dificuldades diferentes como uma curva de evolução. Datas reais deverão incluir ano quando necessário para evitar ambiguidade.

## O que será implementado depois da aprovação

- Agregar no servidor três fontes da conta: diagnósticos concluídos associados a ela, práticas individuais corrigidas e simulados finalizados. Usar correções e snapshots preservados, sem recalcular a partir de questões editáveis.
- Cada resposta de uma tentativa concluída conta uma vez; uma nova tentativa da mesma questão é outra resposta. Revisitar o resultado ou reenviar a mesma finalização não aumenta os totais. Não chamar o indicador de quantidade de questões únicas.
- Aplicar período à data de conclusão, inclusive para diagnóstico salvo depois de concluído. Últimos 30 dias será janela móvel calculada pelo relógio do banco; datas apresentadas em America/Sao_Paulo. Todo o período considera todas as conclusões vinculadas à conta.
- Atualizar contagens do dashboard para a mesma atividade consolidada, ajustando seu texto de apoio; manter último diagnóstico e simulados identificados corretamente.
- RPC de agregação restrita ao servidor, com conta/e-mail confirmado e propriedade verificadas. Não enviar snapshots, gabaritos, explicações, dados de outras contas ou todas as tentativas para calcular no navegador.
- Entregar totais, contagens por matéria e no máximo cinco simulados recentes. Lista recente só leva a detalhes privados já existentes. Estatística não abre revisão de tentativa incompleta.
- Estados de conta vazia, período vazio, carregamento, erro e pouca amostra. Com menos de cinco respostas, mostrar a fração sem porcentagem; não substituir erro por zero nem exemplos por dados reais.
- Testar soma entre fontes/matérias, períodos, repetição, registros não concluídos, associação tardia de diagnóstico, isolamento de contas, arredondamento e dados insuficientes. Preservar migrations aplicadas e dependências.
- Prévia de desenvolvimento e demonstração portátil para teste pelo celular. Conteúdo real permanece em rascunho até revisão editorial.

## Encerramento desta proposta

Mockup gerado pela ferramenta integrada image_gen, usando a imagem aprovada dos simulados como referência de estilo. Imagem aberta e inspecionada: hierarquia, textos, contagens e porcentagens coerentes. Não é captura da aplicação nem dados reais de uma conta.

Somente documentação e mockup; nenhuma mudança de React/CSS, banco ou dependências nesta entrega. Testes de código não se aplicam. Aguardar aprovação do visual antes de implementar; etapa 23 não iniciada.
