# Botões para telas móveis — etapa 55

O responsável pediu botões mais perceptíveis em todo o projeto, com prioridade para celulares e preservação da estética. Foi mantida a identidade em verde e fundo claro.

## Padrão visual

- Ações principais: fundo verde, texto claro, peso maior e sombra curta na base. Ações secundárias: superfície clara, borda verde, cantos de 10 px e separação entre os controles.
- Ações comuns têm pelo menos 48–56 px de altura; navegação compacta e ações auxiliares, pelo menos 44 px. Opções de resposta continuam com toda a linha clicável, foco visível e seleção destacada.
- Dashboard organizado em quatro botões grandes, em duas colunas. Histórico, resultados, filtros de questões, seleção e revisão de simulados, estatísticas, cadastro, login, recuperação de senha e planos usam os mesmos tokens visuais.
- Estados selecionado, desabilitado, foco, hover e pressão preservados. Movimento reduzido desativa as transições. Botões indisponíveis continuam desabilitados.
- Na conta autenticada: “Meus estudos” abre `/dashboard`; “Fazer um simulado” abre diretamente `/simulados`; “Desbloquear Premium” substitui o retorno ao início e abre `/premium`, com gradiente verde/azul-petróleo. O gradiente não anima. Saída da conta permanece separada.

Por pedido posterior, a oferta só aparece quando o servidor verifica uma conta confirmada e o contrato de acesso informa `hasPremium:false`. Quem já tem Premium não vê o botão. Falha de consulta ou contrato inválido mantém o botão oculto e preserva estudos, simulado e saída, sem presumir plano gratuito. O componente recebe apenas a decisão booleana; não recebe dados privados de assinatura.

Links de navegação continuam semanticamente links; formulários e comandos continuam botões. Nenhuma mudança de autenticação, correção, conteúdo, banco, preços, cotas ou ativação de contratação.

## Conferência

- 60 combinações de telas/larguras em 320, 390 e 1280 px, com captura visual e sem overflow ou erros de navegador. Controles visíveis conferidos com área mínima de 44 × 44 px, exceto links de texto sem aparência de botão e a marca.
- Navegação de abas e detalhe no histórico, período e detalhe nas estatísticas, filtros e correção na prática, retorno à questão anterior preservando respostas e confirmação de simulado conferidos nas três larguras.
- 32 controles conferidos em hover e foco: texto com contraste mínimo 4,5:1 e contorno de foco de 3 px. Bordas compartilhadas têm contraste mínimo 3:1 contra as superfícies claras. As três cores do gradiente têm contraste mínimo 4,5:1 com branco.
- Conta autenticada conferida por renderização do componente em três larguras: rótulos, destinos, área de toque e foco. Login público conferido no aplicativo real, sem autenticar ou enviar e-mail. Contratação Premium permanece desabilitada.
- Lint e build/TypeScript aprovados. Capturas e scripts de conferência local em `out/buttons-mobile/` e `out/account-buttons/`, ignorados pelo Git.

Regra de visibilidade: sete testes novos renderizam a página e o componente reais com autenticação/consulta de plano substituídas por serviços controlados, cobrindo gratuito, Premium, visitante, conta não confirmada, falhas e dados inválidos. Dez regressões de login/contrato Premium e três HTTP aprovadas; botão atualizado conferido em três larguras. Nenhuma assinatura ou concessão de Premium criada para os testes.
