# Etapa 26 — proposta da página Premium

Proposta criada em **02/10/2026**, após o checkpoint 2b524d2 da etapa 25. O usuário definiu R$20 por mês e promoção de 50% em outubro, confirmou os benefícios propostos e autorizou incrementar o plano. **Aguardando escolha visual antes de implementar a página.**

## Condições exibidas nas propostas

- Assinatura mensal: R$20.
- Interpretação comunicada da campanha: novas assinaturas em outubro de 2026 pagam R$10 na primeira mensalidade; as seguintes custam R$20. Não é desconto permanente.
- Campanha de 01/10/2026 até o fim de 31/10/2026, no fuso America/Sao_Paulo. A seleção visual pode incluir ajustes nessas condições.
- Cancelamento interrompe novas cobranças, preservando período já pago válido conforme o modelo de assinaturas, salvo revogação confirmada por reembolso/contestação.

Ainda é necessário confirmar/configurar na Kiwify a oferta que cobra primeira mensalidade de R$10 e renova por R$20. O mockup não prova suporte técnico a essa modalidade; não ativar checkout se as condições não puderem ser cumpridas. Após outubro, a página deve exibir o preço regular, usando data do servidor. A oferta do provedor também precisa expirar corretamente; mudar só o texto não encerra um desconto comercial.

## Benefícios do plano

| Benefício | Escopo proposto |
| --- | --- |
| Questões sem limite diário | Retirar a cota comercial de 10 novas práticas para assinante validado; limites técnicos de abuso permanecem |
| Simulados sem limite diário | Retirar a cota comercial de um simulado rápido por dia para assinante validado |
| Simulados por matéria | Acesso às opções Premium do catálogo que tenham conteúdo revisado e publicado |
| Catálogo Premium | Resume o acesso aos demais simulados publicados; não é outra funcionalidade independente |

As duas últimas possibilidades incrementam o plano sem inventar tutoria, IA, cronograma ou análises que o produto ainda não possui. Histórico, estatísticas básicas, diagnóstico e revisão permanecem no gratuito. Não transformar funcionalidades gratuitas existentes em exclusividade Premium.

O banco ainda tem questões e simulados em rascunho. As cotas e o catálogo atuais não foram alterados; os benefícios só estarão disponíveis após conectar o acesso validado aos serviços e publicar conteúdo revisado. Não aceitar pagamento enquanto o produto anunciado não puder ser entregue. Explicações passo a passo, caderno personalizado de erros e outros novos fluxos não foram incluídos como benefícios entregues nem implementados nesta etapa.

## Referências e ordem das opções

Referência visual inspecionada e enviada às três gerações: design/estatisticas-mobile-v2.png. Manter marfim #F7F6F0, texto verde #172B25, ação #174D38, divisórias #D8DED7, títulos DM Serif Display e corpo Geist. Sem texto Meus estudos no cabeçalho. Retorno alinhado à esquerda, com seta antes do texto. Uma ação principal e poucos textos.

Ordem confirmada pela exibição das imagens nesta conversa, não apenas pela ordem planejada:

1. design/premium-opcao-1.png — preço antes dos benefícios, superfície contínua.
2. design/premium-opcao-2.png — benefícios antes do preço, bloco de oferta discreto.
3. design/premium-opcao-3.png — comparação essencial Gratuito/Premium, cotas corretas de 10 práticas e um simulado rápido.

Prompts preservados em design/premium-opcao-N-prompt.txt. Três imagens independentes geradas pela ferramenta integrada, copiadas para o projeto sem apagar originais. Inspeção visual das imagens: preço, duração da promoção, benefícios, renovação, retorno e continuidade do gratuito legíveis. Pequenas texturas/variações raster serão substituídas por cores sólidas ao implementar; imagens não são capturas de uma página funcional.

## Implementação após a escolha

Página /premium e prévia de desenvolvimento usando a opção escolhida; adaptação responsiva mantendo os componentes/fontes existentes. Tratar estados gratuito/Premium/erro a partir de sessão verificada e da leitura privada da etapa 25, sem inventar acesso por campo do navegador. Sem transformar falha de leitura em conta gratuita.

Antes do checkout real, a página deverá identificar a indisponibilidade de contratação e manter a ação de pagamento indisponível; demonstrações serão explicitamente ilustrativas. Não colocar link fictício, credencial ou um botão que concede Premium. A integração de checkout fica na etapa 27 e validação/cotas pagas nas etapas próprias. A aprovação do visual não libera pagamentos automaticamente.

A pausa segue a seção 73 do pedido original: “Espere minha aprovação. Somente após aprovação: crie React/Tailwind/CSS.” Não foi escrito código de aplicação, alterado banco, configurada oferta nem repetido lint/build para imagens/documentação. Esta é a proposta da etapa 26, não a implementação concluída.
