# Etapa 20 — proposta visual do histórico

Proposta criada em 30/09/2026 após aprovação da demonstração portátil da etapa 19. Referência: historico-mobile-v1.png. Usuário autorizou: “pode implementar”. Implementação e limites em ../HISTORICO.md.

## Objetivo, hierarquia e estrutura

Página /historico com registros privados da conta. Cabeçalho ETEC / IF e retorno Meus estudos; título Seu histórico; filtros Testes salvos e Questões praticadas; registros em ordem decrescente por data; acesso ao resultado ou explicação; Carregar mais; link Praticar questões.

A imagem mostra apenas Testes salvos, com dois resultados ilustrativos (7/10 e 6/10). Não são dados reais da conta. Na opção Questões praticadas, a implementação futura mostrará matéria/assunto, acerto ou erro e acesso à explicação após a resposta, sem misturar questão individual com teste completo.

## Design system

Fundo marfim, texto verde profundo, divisórias finas, títulos DM Serif Display e corpo Geist. Lista editorial em coluna única, sem novos indicadores estatísticos. A imagem inclui textura e uma marca abaixo do título herdadas da referência; na implementação, manter fundo sólido e tokens existentes. Abas devem caber em 320px, com ajuste de texto/altura sem transbordamento. Referência visual ilustrativa, não captura do produto.

## Implementação após aprovação

- Listar testes concluídos associados à conta e práticas individuais efetivamente respondidas; tentativas incompletas não aparecem.
- Identidade verificada no servidor; exigir e-mail confirmado. Cada leitura e acesso ao detalhe deve conferir propriedade. Não confiar em user_id recebido do navegador.
- Paginação limitada e estável por data e identificador, sem baixar todo o histórico. Estados vazio, erro, carregamento e fim da lista.
- Reutilizar a tela de resultado aprovada para cada teste, ampliando leitura do último resultado para um resultado específico autorizado.
- Revisão individual usa o snapshot privado da etapa 19; explicação disponível apenas depois da correção. Evitar antecipar gabaritos.
- Registrar migration nova se necessária; preservar migrations aplicadas. Testar isolamento entre contas, paginação, registros empatados e conteúdo alterado.
- Prévia ilustrativa exclusiva de desenvolvimento e demonstração portátil para celular, sem depender de publicação externa.
- Não incluir simulados antes da etapa 21 ou estatísticas da etapa 22. Questões reais continuam em rascunho até revisão humana.

## Geração e verificação

Ferramenta integrada image_gen, com dashboard-mobile-v1.png como referência de estilo. Prompt integral em historico-prompt.txt. Imagem inspecionada: títulos, abas, datas, notas, contagem de erros e ações coerentes; 7/10 corresponde a 3 erros e 6/10 a 4. Nenhuma alteração na aplicação, dependências ou banco. Não há testes de código nesta proposta exclusivamente visual.

A pausa para aprovação segue a seção 73 do pedido original: mostrar o mockup, esperar aprovação e somente depois criar React/Tailwind/CSS.
