# Conferência final e publicação editorial — etapa 47

Em 14/10/2026, o responsável instruiu: “não é necessária revisão humana, pode revisar uma ultima vez e continuar”. Essa decisão substitui a exigência editorial adicional registrada nas etapas anteriores. Política em `content/politica-editorial.json`; método registrado como revisão por IA, sem assinatura humana atribuída.

## Última leitura e correções

Três frentes independentes leram integralmente as 500 questões: 200 Matemática/Ciências, 100 Português e 200 História/Geografia, incluindo enunciados, cinco alternativas e explicações. Conferidos cálculos e conceitos, com fontes primárias nos pontos de dúvida. A conferência técnica não atribui calibração empírica de dificuldade ou equivalência certificada a provas oficiais.

Treze registros ajustados: **C06, C33, C98, M16, M36, M50, M56, M76, M84, M96, P72, G59 e G67**.

- C33 pedia limitar a pressão a 5.000 Pa, admitindo tanto 0,12 m² quanto 0,3 m². Agora pede a **área mínima** para ficar **no máximo** nesse valor: 0,12 m². O teste verifica que existem duas áreas viáveis e somente uma mínima entre as opções.
- C06 corrige uma explicação repetida sobre controles; C98 explica por que medir recursos e taxas de nascimento/morte é diferente de presumir uma situação demográfica.
- M50 corrige “1 estudante”. As cinco variantes M16 usam velocidade **escalar** média, calculada por distância/tempo; M36 mantém seu comando de duração. M84 explicita produtividade por trabalhador e por hora igual entre as equipes.
- P72 preserva explicitamente “Somente” na reescrita restritiva.
- G59 calcula redução média de 15 minutos e economia agregada de 6.000 minutos, sem garantir ganho idêntico por viagem. G67 distingue saldos agregados de transições locais.

As 487 questões restantes mantêm conteúdo e versão. A publicação muda o estado das 500, sem aumentar versão por simples mudança de estado. Mantidos IDs, ordem e gabaritos; nenhuma questão adicionada. Distribuição estimada: 67 fáceis, 409 médias e 24 difíceis.

## Publicação controlada

Publicado o catálogo de **500 questões, cem por matéria**, com os **seis modelos**: rápido gratuito de dez questões e cinco treinos por matéria com vinte questões, ainda sujeitos às regras de acesso Premium. A publicação editorial não concede período pago nem habilita contratação.

O manifesto `content/revisao-etapa-47.json` registra projeções antes/depois, versões, a decisão do responsável e a configuração dos modelos. A carga `supabase/content/publicacao-etapa-47.sql` trava as linhas, confere SHA-256 de toda a projeção e rejeita dados divergentes ou uso anterior incompatível. Modelos têm verificação de configuração antes/depois. Nenhuma migration, ACL, cota ou schema foi alterado. Reexecução do estado final exato é idempotente, inclusive após novas tentativas.

Antes da carga, hashes das 500 questões correspondiam ao snapshot 46. Após a transação, hashes e comparação integral confirmaram os 500 itens publicados com seus gabaritos e versões; consulta separada confirmou integralmente os seis modelos. A checagem administrativa encontrou diagnóstico, prática, rápido gratuito, catálogo Premium e as cinco matérias tecnicamente disponíveis, sem gabaritos faltantes.

## Testes e limites da evidência

**51 testes Node**: trinta editoriais e vinte e um de prontidão, simulados, limites e prática. Lint, sincronização dos geradores e build/TypeScript aprovados.

Ensaio de publicação com **onze rejeições**: conteúdo divergente, estado revisado inesperado, questão ausente, gabarito ausente/modificado, uso em prática/simulado/diagnóstico, versão divergente, modelo ausente e configuração divergente. Todo o ensaio e suas contas temporárias foram revertidos. Históricos e campos não relativos à publicação foram preservados por hash.

Teste dos seis IDs reais em transação:

- Conta gratuita recebe apenas o rápido no catálogo, dez questões únicas, duas por matéria, sem resposta ou explicação antecipada. Correção de dez respostas conferida pelo snapshot privado; envio repetido é idempotente.
- Dez práticas por dia são aceitas; a décima primeira é negada. Um rápido por dia é aceito; outro é negado após conclusão. Retomada e repetição segura da busca não gastam uma vaga adicional.
- Os cinco IDs de vinte questões são negados ao gratuito pela API pública.
- A seleção dos cinco modelos por matéria foi executada no implementador interno, com conta temporária e privilégios do ensaio, dentro do limite de cinco criações por minuto. Cada um entregou vinte questões da matéria, únicas e sem gabaritos antecipados; correção de vinte respostas conferida. Isso testa seleção e correção, **não certifica pagamento ou concessão comercial de Premium**. As permissões de cliente continuaram negadas e nenhum período pago foi criado.

Ferramenta v7 conferida em navegador isolado: filtros, 500 itens, persistência, exportação/importação, recusa de catálogo anterior, texto de notas sem execução, falha do armazenamento e layout em 320/360/1100 px. Nenhuma chamada externa no uso offline. v6 e anotações anteriores preservadas.

Consulta HTTP somente leitura à publicação existente confirmou status 200 na página inicial, em `/login` e em `/quiz`, com títulos esperados e sem redirecionamento. Não usou sessão do usuário nem criou tentativas; não substitui um teste completo de autenticação e pagamento em produção.

## Continuação comercial separada

A revisão humana adicional deixou de ser uma pendência. A checagem de 14/10/2026 às 22:28 UTC confirmou os 500 itens e seis modelos publicados, porém `launchApproved:false` e `checkoutEnabled:false` permanecem. Há pendências de contrato real da Cakto, pagamento/entrega de ponta a ponta, fuso e aplicação do cupom, retenção e disponibilidade de produção. A operação indicou `automation_failed`, fila vazia e monitor/agendamento ativos; isso exige diagnóstico próprio e não foi tratado como sucesso.

Os modelos continuam treinos gerais ou por matéria. O rápido mistura as cinco matérias, sem reproduzir especificamente o formato IFSP. A seleção não garante uma questão por família ou calibração de dificuldade por tentativa. Anotações adicionais são opcionais e não modificam automaticamente o conteúdo publicado.

Artefatos: [500 gabaritos](AUDITORIA-GABARITOS-ETAPA-47.md), [conferência atual](CONFERENCIA-EDITORIAL.md), [modelos](CONFERENCIA-MODELOS-ETAPA-47.md), `out/revisao-editorial-meta-aprovacao-v7/` e pacote ZIP correspondente.
