# Etapa 21 — proposta visual dos simulados

Proposta criada em 30/09/2026 após confirmação do ajuste de Voltar ao histórico: “está certo agora, pode continuar”. Essa confirmação refere-se ao ajuste visual; não substitui testes de persistência real. Mockup: [simulados-mobile-v1.png](simulados-mobile-v1.png). Implementação ainda não iniciada.

## Tela e visual

Rota prevista /simulados, com cabeçalho ETEC / IF, retorno Meus estudos, título Simulados, seleção de uma opção e botão Iniciar simulado. Informação curta: a correção aparece ao finalizar. Link Ver meu histórico abaixo da ação principal.

Simulado rápido (10 questões, 5 matérias) e Matemática (20 questões) são exemplos visuais. Não representam um catálogo disponível: as questões reais permanecem em rascunho. Produção deverá mostrar apenas simulados publicados com conteúdo revisado; ausência de conteúdo terá estado vazio, sem substituir dados reais por exemplos.

Manter o estilo clean aprovado: fundo marfim sólido, texto verde profundo, títulos DM Serif Display, corpo Geist, divisórias finas e coluna única. A imagem gerada apresenta textura sutil; a implementação usará os tokens sólidos existentes. Seleção deve usar controle nativo acessível, com foco visível, teclado e toque de pelo menos 44px. Layout deve caber em 320px sem transbordar.

## Fluxo previsto após aprovação

1. Conta autenticada com e-mail confirmado escolhe um simulado disponível.
2. Servidor cria tentativa privada com versões das questões preservadas. Navegador não recebe gabaritos ou explicações antes da finalização.
3. Aluno responde uma questão por vez e pode revisar suas escolhas antes de enviar. Simulado não corrige cada questão imediatamente.
4. Finalização corrige no servidor e salva resultado, duração medida no servidor e respostas. Reenvio do mesmo conteúdo não duplica resultados; alteração após finalizar não é permitida.
5. Resultado reutiliza o resumo aprovado e a revisão dos erros um por um. Histórico recebe categoria Simulados; dashboard apresenta dados reais correspondentes.

Definir migrations e contratos depois da aprovação, preservando as migrations existentes e o isolamento entre contas. Revisões usam snapshots para não mudar com edições posteriores das questões. Testar propriedade, conteúdo não publicado, gabarito protegido, finalização concorrente, repetição de envio e histórico.

Não estabelecer tempo oficial de prova, publicar conteúdo em rascunho ou prometer aprovação. Estatísticas detalhadas pertencem à etapa 22; política Premium, à etapa 23. Preparar prévia ilustrativa de desenvolvimento e demonstração portátil para o celular durante a implementação.

## Verificação e pausa

Imagem gerada pela ferramenta integrada image_gen, seguindo o histórico clean como referência de estilo. Prompt integral em simulados-prompt.txt. Imagem inspecionada quanto a textos, hierarquia, opções e ação principal; é proposta visual, não captura da aplicação.

Somente imagem e documentação alteradas nesta etapa. Nenhuma alteração de aplicação, dependências ou banco; testes de código não se aplicam. Aguardar aprovação do mockup antes de implementar React/CSS, conforme a seção 73 do pedido original.
