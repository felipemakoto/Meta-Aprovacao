# Etapa 26 — página Premium

Provedor atual em 03/10/2026: [Cakto](CAKTO.md), por escolha do usuário. Visual e preços aprovados preservados. Checkout preparado e indisponível enquanto faltarem produto/oferta, integração de validação e entrega dos benefícios.

Atualização 03/10/2026: visual confirmado pelo usuário. Infraestrutura do checkout preparada na [etapa 27](CHECKOUT.md), com configuração comercial ainda pendente e contratação bloqueada. A página, seu visual e benefícios permanecem como aprovados; nenhum pagamento ou acesso foi ativado.

## Implementação após aprovação

Usuário aprovou premium-opcao-1-v6.png com “pode ser assim”. Página implementada em 02/10/2026 a partir desse alvo (checkpoint visual 1043e5f). /premium exige conta confirmada; identidade vem de getUser no servidor, nunca da URL. RPC da etapa 25 consultada no servidor com contrato mínimo hasPremium/accessUntil. Erros de sessão, banco ou contrato exibem falha de consulta, sem transformar falha em plano gratuito. Estado ativo mostra prazo e retorno aos estudos; nenhuma assinatura real foi criada.

/premium/preview existe somente em desenvolvimento: padrão mostra a oferta, ?state=active mostra plano ativo ilustrativo, ?state=error mostra falha e ?offer=regular simula o término da promoção. Parâmetros de prévia não alteram o plano na rota real. Campanha calculada pelo servidor no fuso de São Paulo, limitada a outubro de 2026: R$10 na primeira mensalidade, depois R$20. Fora do período aparece somente R$20/mês. Não altera ofertas da Kiwify.

CTA mantém o botão verde aprovado, porém desabilitado e acompanhado de informação de contratação em breve. Benefícios ainda indisponíveis são explicitados. Checkout permanece na etapa 27, sem link fictício nem simulação de cobrança. Não há remoção de cotas ou catálogo novo nesta etapa. Links de marca e retorno funcionam; não foram alterados os visuais das demais páginas.

Verificações: quatro testes Node de campanha/contrato/identidade/falhas e três HTTP de proteção/prévia/estados aprovados; lint, TypeScript e build aprovados. Primeira execução HTTP ocorreu sem servidor e falhou por conexão recusada; após iniciar dev, foram corrigidas duas expectativas do teste (comentários SSR no preço e cache-control de desenvolvimento) e as sete verificações passaram. Build confirma rotas dinâmicas; teste HTTP de servidor de produção não repetido devido ao bloqueio anterior registrado. Guard de prévia em produção verificado no código/build, sem afirmar teste HTTP de produção.

Navegador integrado acessível nesta etapa: capturas e comparação visual conjunta realizadas, sem reutilizar o bloqueio anterior como resultado atual. Larguras 320, 360, 390 e 1280px sem overflow, promoção em uma linha, coluna desktop de 520px centralizada. Foco de teclado visível, retorno ao dashboard verificado e nenhum warn/error capturado. Evidências locais em out/premium-320.png, premium-360.png, premium-390.png e premium-comparison.png. Relatório em ../design-qa.md. Alterações finais reduziram espaçamento dos benefícios e tipografia da comparação para aproximar o alvo.

Para testar no PC, abra http://127.0.0.1:3000/premium/preview. Confira promoção, preço, comparação e retorno em 320–390px. Para testar a leitura real, entre em sua conta no mesmo host e abra /premium; sem assinatura deve exibir contratação em breve. Dados reais autenticados ainda aguardam teste manual do usuário. Não usar a prévia como comprovação de acesso pago.

```powershell
Set-Location 'C:\Users\felip\OneDrive\Documentos\projeto_etec-if'
node --test tests/premium.test.mjs tests/premium-http.test.mjs
```

Servidor dev precisa estar rodando na porta 3000 para os testes HTTP. Checkpoint anterior 1043e5f; checkpoint de implementação consultar git log -1 --oneline. Pausa para teste do usuário antes da etapa 27.

## Registro da proposta inicial

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
