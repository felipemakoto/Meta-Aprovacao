# Etapa 14 — proposta de cadastro

Iniciada em 27/09/2026. Etapa 13 confirmada pelo usuário; checkpoint anterior aa0561f. Status: três mockups apresentados, aguardando escolha. Não há implementação de cadastro nesta etapa parcial.

## Objetivo e referência

Permitir criar conta opcional com e-mail e senha, sem bloquear o quiz. Formulário com e-mail, senha, confirmação, controle de visibilidade e CTA Criar conta. Confirmação de e-mail prevista. Sem login social, promessa de salvar o diagnóstico, dashboard ou funcionalidades de etapas futuras.

Referência visual inspecionada e anexada às três gerações: resultado-opcao-3.png. Design system existente: fundo #F7F6F0, texto #172B25, secundário #53645D, ação #174D38, divisória #D8DED7, destaque #E6EC88; DM Serif Display e Geist. Alvo móvel 390 × 844 CSS, com imagens geradas em resolução maior. Ícones serão os Heroicons existentes; fundo sólido e tokens prevalecem sobre aproximações raster.

## Ordem exibida no chat

1. [cadastro-opcao-1.png](cadastro-opcao-1.png): formulário editorial sem card, título Crie sua conta.
2. [cadastro-opcao-2.png](cadastro-opcao-2.png): campos agrupados em um painel com borda, título Criar conta.
3. [cadastro-opcao-3.png](cadastro-opcao-3.png): separação entre e-mail e definição de senha, título Sua conta.

Números correspondem à ordem em que as imagens foram exibidas, não apenas à ordem planejada. Nenhuma opção selecionada ainda. Imagens não são interfaces funcionais.

## Implementação após escolha

- Reutilizar aplicação Next.js e clientes Supabase existentes, sem novas dependências desnecessárias.
- Criar formulário responsivo, rótulos persistentes, validações, mostrar/ocultar senha, estados de carregamento e mensagens acessíveis; bloquear envio duplicado.
- Validar política de senha e configuração Auth antes de concretizar a regra ilustrada de oito caracteres.
- Integrar cadastro e confirmação por e-mail, tratar link inválido/expirado e configurar destinos permitidos. Consultar documentação oficial atual e guias Next instalados antes de escrever código.
- Não incluir credenciais em logs, respostas ou Git. Não usar cliente administrativo para cadastro comum.
- Conferir configuração de confirmação de e-mail, limites e entrega de e-mail de desenvolvimento; SMTP para produção exige avaliação própria. Nenhum e-mail foi enviado nesta retomada.
- Testar comportamento, segurança e visual; atualizar documentação e criar checkpoint. Solicitar teste humano do recebimento/confirmação sem pedir senha ou tokens no chat.
- Login/logout na etapa 15, recuperação na 16, associação de tentativa à conta na 17.

Pausa segue as seções 55–56 do pedido original: apresentar mockup, parar e esperar aprovação antes de implementar React/CSS. Aplicação, banco, dependências e configuração remota permanecem inalterados.
