# Oficina de questões — página inicial

Direção 2 aprovada em 20/10/2026: azul cobalto, amarelo de folha de exercícios e tipografia Barlow. Nesta etapa, o sistema se aplica somente à página inicial e ao seu rodapé compartilhado. As demais páginas mantêm o visual anterior até aprovação.

## Tokens

Fonte dos tokens: `src/app/oficina.module.css`. Classe de ativação: `oficina`.

- Papel: `#FFFFFF`; tinta: `#272B2F`; texto secundário: `#4F5864`.
- Azul: `#254DB5`; azul em interação: `#1C3B8C`; amarelo: `#F3D25B`.
- Superfície: `#ECEFF1`; divisórias: `#D5DBE1`.
- Barlow 400/600 para leitura; Barlow Condensed 600/700 para títulos e ações.
- Espaçamentos: 8, 16, 24, 32, 48 e 64px; raio de controles: 6px; conteúdo: até 1248px.

## Composição e comportamento

Cabeçalho azul com marca Meta Aprovação; abertura amarela com o diagnóstico como ação principal; folha de respostas vetorial decorativa no desktop; sequência real em três passos; orientação e suporte em uma faixa cinza; rodapé grafite. No celular, a ilustração sai e a sequência se torna vertical.

Foco visível, link de salto, controles com pelo menos 44px e cores sólidas. Conteúdo, destinos, autenticação, preços, permissões e integrações permanecem preservados.

As quatro fontes são hospedadas localmente, sob SIL Open Font License; licenças em `public/fonts/oficina/`. A folha de respostas é um SVG original do projeto, sem ativos pagos.

Os estilos da página estão em `src/app/home.module.css`. O seletor do rodapé exige a presença da classe `oficina`, evitando alterar outras rotas ou o retorno por navegação interna. `entry.module.css` continua servindo à página 404.
