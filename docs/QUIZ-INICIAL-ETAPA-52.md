# Entrada, diagnóstico e planos — etapa 52

Pedido do responsável: facilitar o primeiro quiz, reduzir texto e distrações, indicar somente os erros/assuntos de estudo nesse resultado e conduzir a cadastro, planos e simulado do banco real. Manter identidade visual sóbria, com botões claros e carregamento ao corrigir.

## Fluxo implementado

1. Entrada apresenta dez perguntas introdutórias, sem cadastro ou cartão. O quiz é identificado como aquecimento.
2. Dez perguntas fáceis e fixas, duas por matéria, em ordem igual para visitantes. Não é uma estimativa completa do desempenho na prova.
3. Ao finalizar, a barra indica correção em andamento. O resultado inicial mostra somente assuntos das questões erradas, com suas posições. Não oferece revisão individual, gabarito ou explicações nessa tela. Com acerto integral, não inventa pontos fracos e convida a subir o nível.
4. **Fazer meu simulado** abre o cadastro gratuito; para quem já está autenticado, segue à tela de planos. Cadastro mantém confirmação de e-mail obrigatória, sem alterar proteções, SMTP ou callback.
5. Após confirmação, **Gratuito e Premium** aparecem juntos, com benefícios e preços. Há somente esses dois planos no sistema: nenhum plano pago adicional foi inventado. O total Premium inclui R$0,99 de taxa, com renovação e cupom explícitos. Contratação continua desativada até a validação financeira pendente.
6. **Fazer meu simulado grátis** salva o resultado inicial, se a tentativa ainda puder ser associada, e abre o catálogo de simulados. Cookie ausente/expirado não impede continuar; falha operacional permite tentar novamente ou continuar sem salvar. Nenhum ID ou nota é fornecido para a associação. O aluno escolhe iniciar o rápido, gerado com o banco publicado ETEC/IFSP.
7. Simulados mantêm conferência final e correção detalhada, com botão para fazer outro. Quiz, simulados e correção de questão avulsa compartilham a barra de espera. Ela é indeterminada, não inventa porcentagens, não atrasa a resposta e respeita preferência por movimento reduzido.

## Conteúdo e banco

`content/quiz-inicial.json` reúne as dez perguntas introdutórias e a revisão dos gabaritos. O gerador `scripts/build-intro-quiz.mjs` constrói a migration `20261015010000_intro_quiz_catalog.sql`; `content:intro:check` confere correspondência exata.

Foram adicionados dez registros com status **reviewed**, dificuldade **easy**, e um catálogo privado que fixa sua ordem. O status é deliberado: eles estão disponíveis somente ao quiz introdutório pela RPC, sem entrar na prática ou nos simulados que selecionam conteúdo **published**. Permanecem **500 questões publicadas e seis modelos publicados**, além dos dez itens introdutórios revisados. Não houve rebaixamento de dificuldade ou edição dos 500 registros anteriores.

Snapshots continuam usando IDs e versões reais, com referência válida ao catálogo de questões. Tentativas antigas não são reescritas. Novas tentativas usam o catálogo fixo; sessão já aberta conserva suas perguntas até finalizar/expirar. Conteúdo e respostas permanecem separados; gabaritos não chegam na criação/retomada. A RPC de correção mantém validação de dez escolhas, idempotência e bloqueio de alterações depois de concluir.

A nova tabela tem RLS e nenhuma permissão direta para anon, authenticated ou service_role. Apenas a RPC de servidor consulta o catálogo. Migration ensaiada com rollback, conferida em dry-run, aplicada e novamente testada com rollback.

## Verificações

- **50 testes Node** aprovados: foco de estudo, quiz, correção, associação, simulados, cadastro, cotas e privacidade. Casos sem erros e com dez erros conferidos. As contas e limites não foram afrouxados.
- **9 testes HTTP** aprovados: planos, renovação/taxa, gratuidade, Premium indisponível, acesso privado, dashboard/revisão histórica e cadastro/CSRF/callback sem envio de e-mail.
- Ensaio SQL antes/depois da aplicação: dois visitantes com as mesmas perguntas, gabarito ausente do início, repetição idempotente, correção integral, submissão alterada recusada, snapshots preservados, banco publicado preservado e permissões conferidas. Toda mutação dos ensaios ficou em rollback.
- **32 combinações** de oito telas/estados em 320, 390, 768 e 1280 px, sem rolagem horizontal ou erro de navegador. Links para cadastro e simulado grátis e botão pago desativado conferidos.
- Falha 503 simulada na correção: barra visível, sem percentual fictício, movimento reduzido respeitado, retry com corpo idêntico e resultado inicial sem ações de explicação. Essa simulação não altera o banco.
- Percurso com site local e banco reais, navegador isolado: quiz introdutório 7/10, diagnóstico, formulário de cadastro, conta descartável confirmada pela API administrativa, planos, associação única do resultado, simulado com dez questões do banco publicado, barra, resultado 10/10 e próxima ação. **O envio do formulário de cadastro foi interceptado; não enviou e-mail.** O teste não certifica uma nova entrega de confirmação ou troca a evidência do teste de recuperação do responsável. Conta, tentativa anônima e dados vinculados removidos com escopo por identificador/hash/marcador aleatórios, com conferência de limpeza.
- Lint, TypeScript e build aprovados. Capturas em `out/onboarding52/`, incluindo resultado e planos reais em 390 px e comparação de desktop.

## Prévias locais

- `/quiz/preview`: perguntas introdutórias reais, projetadas sem gabarito.
- `/quiz/result/preview`: novo diagnóstico, incluindo `?score=0` e `?score=10`. Parâmetro explícito de revisão continua demonstrando a revisão histórica, que não é oferecida no final do quiz de entrada.
- `/cadastro/confirmado/preview`: comparação dos planos sem criar conta.
- `/premium/preview`: gratuito/Premium, erro, assinatura ativa e fim da promoção.

Prévias continuam limitadas a desenvolvimento e retornam 404 em produção. Nenhuma cobrança ou concessão Premium foi feita. As pendências de validação financeira Cakto da etapa 51 continuam.

## Publicação e ajuste solicitado na conferência

Publicação do fluxo confirmada em `https://meta-aprovacao.vercel.app`, commit inicial `7ca0df7`. O percurso de sete verificações também passou no domínio público, com quiz real, planos, associação, simulado e correção; fixture removida, sem envio de e-mail ou cobrança. Os dez grupos integrados de estudo em produção passaram, incluindo cotas, histórico, estatísticas, bloqueio Premium e logout. Prévias novas retornam 404 em produção.

Na conferência, o responsável pediu menos texto no Gratuito e mais no Premium. O Gratuito ficou com dois itens: dez questões por dia e um rápido por dia. O Premium passou a sete itens, detalhando também correção, histórico e estatísticas; uma nota comum esclarece que esses três recursos também existem no gratuito. Cartões têm alturas naturais para evitar espaço vazio no Gratuito. Nenhum benefício, limite, preço ou disponibilidade foi alterado.
