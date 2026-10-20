# Meta Aprovação — estudo visual

Direção aprovada em 20/10/2026: homepage educacional clara, verde e orientada a demonstrações visuais, a partir do mockup inspirado no Brilliant. A composição, a marca e os recursos representam a Meta Aprovação; nenhum conteúdo ou identidade do Brilliant foi copiado.

## Sistema visual

- Tokens: `src/app/home-theme.module.css`; ativação: classe `homeTheme`.
- Papel `#FCFDFB`; tinta `#19241F`; texto secundário `#515E55`.
- Ação `#237B38`; ação em interação `#185D29`; sálvia `#F0F4EC`; menta `#E0EFDF`.
- Divisória `#D9E3D7`; violeta `#6653AD`; amarelo `#F3CF69` nos diagramas.
- Manrope variável 400–800, hospedada localmente sob SIL OFL. Arquivo e licença em `public/fonts/meta/`.
- Conteúdo até 1200px, controles com pelo menos 44px, cantos de 10–16px, divisórias e cores sólidas.

## Página inicial

Abertura com exemplo matemático; benefícios; três etapas reais; cinco matérias; acesso a questões e simulados; cadastro gratuito; suporte e informações legais. O exemplo de desconto é uma demonstração estática, não uma tentativa do usuário nem uma consulta ao banco.

Os estilos responsivos estão em `src/app/home.module.css`. `StartTestButton` conserva `/quiz`; os demais destinos reutilizam as rotas existentes. No celular, a navegação usa `details` nativo e as seções se organizam em coluna, sem nova biblioteca ou JavaScript de estado.

O tema também estiliza o rodapé compartilhado somente enquanto a inicial está presente. Login, cadastro, quiz e demais rotas mantêm o visual anterior. Backend, autenticação, banco, planos, permissões e pagamentos permanecem fora desta alteração.

## Ativos

`home-art.tsx` contém a marca M e diagramas geométricos originais. `public/images/meta-study-path.png` é a ilustração original gerada para a chamada final: caminho branco entre colinas sálvia, árvores, bandeira verde e sol amarelo, com fundo transparente. O Next otimiza essa imagem e carrega-a sob demanda. Nenhum ativo depende de serviço pago em tempo de execução.

## Validação

Compilação de produção e lint dos arquivos alterados aprovados; 22 testes de regressão passaram. Navegador conferido em 280, 320, 390, 768, 1024 e 1440px: sem rolagem horizontal, fontes carregadas e controles com altura mínima de 44px. Contraste: botões 5,30:1; texto secundário 6,68:1 sobre papel e 6,12:1 sobre sálvia. Console sem erros; o Next mantém avisos de pré-carregamento de CSS legado.