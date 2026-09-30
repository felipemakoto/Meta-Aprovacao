# Etapa 19 — banco de questões

Proposta visual criada em 30/09/2026, após aprovação manual do dashboard. Imagem: questoes-mobile-v1.png. Aguardando aprovação para implementação; nenhuma alteração na aplicação ou no banco nesta preparação.

## Objetivo e hierarquia

Página /questoes para escolher um conteúdo e praticar uma questão por vez. Filtros por matéria, assunto, dificuldade e prova alvo; depois, enunciado, cinco alternativas e Conferir resposta. A explicação aparece após o envio. Link Meus estudos retorna ao dashboard. A proposta usa as fontes serifada/sans, marfim e verde já aprovados, sem catálogo de cards repetidos.

Questão ilustrativa: mochila de R$ 80,00 com desconto de 15%; alternativa B selecionada, ainda sem feedback. Na futura correção, R$ 68,00 será a resposta correta, com explicação. A seleção no mockup não indica correção antecipada.

## Preparação da implementação após aprovação

- Reutilizar o modelo existente de questions e question_answers, com acesso mediado pelo servidor e apenas conteúdo publicado.
- Validar filtros no servidor; retornar somente a questão necessária, sem permitir download completo das tabelas ou envio antecipado de gabaritos.
- Autenticar prática na conta; criar contexto autorizado de questão com versão/snapshot e prazo para corrigir a resposta no servidor.
- Tratar filtros sem resultados, carregamento, falha, seleção obrigatória, correção e próxima questão. Depois da correção, exibir alternativa correta e explicação.
- Manter questões em rascunho até revisão editorial; usar prévia ilustrativa somente em desenvolvimento. Não inventar contagem de catálogo ou disponibilidade.
- Deixar limites comerciais parametrizáveis no servidor; política comercial definitiva pertence à etapa 23. Não acrescentar cobrança nem prometer acesso ilimitado.
- Verificar isolamento por usuário, resposta forjada, tentativa expirada, CSRF e ausência de gabarito na leitura; testar filtros, revisão, estados e responsividade.

## Arquivo e geração

Ferramenta integrada de geração de imagens, usando dashboard-mobile-v1.png como referência de estilo. Prompt integral em questoes-prompt.txt. Imagem inspecionada: quatro filtros, cinco alternativas, textos e valores coerentes; botão e footer legíveis. Textura do mockup não altera o fundo sólido dos tokens reais.

A pausa para aprovação segue as seções 55–56 do pedido original: criar mockup, mostrar, esperar aprovação e só então implementar React/CSS.
