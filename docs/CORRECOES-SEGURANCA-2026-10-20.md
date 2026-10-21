# Correções da auditoria e do pentest — 20/10/2026

Escopo: achados confirmados sobre o snapshot `c1f0c56`. Sem compra real, mudança de preço/plano, nova contratação, exclusão de contas ou alteração do agendamento existente.

| Achado | Correção / situação |
| --- | --- |
| Cancelar renovação impedia reconhecer pagamento anterior | A prova aceita assinatura cancelada depois do pagamento, com datas válidas. Pedido precisa continuar pago, sem cancelamento, estorno ou chargeback; valores, moeda e vínculo continuam obrigatórios. |
| Eventos chegavam antes da primeira prova ou de períodos anteriores | Contexto mínimo fica na fila privada; nova prova/período acorda dependências para outra consulta autenticada. Isso nunca aprova pagamento nem concede acesso por si só. Filas em execução não são bloqueadas pelo gatilho. |
| Lote V2 misturava produto próprio e adicional estrangeiro | Adicionais estrangeiros são ignorados; registros próprios válidos persistem. Registro próprio malformado ainda rejeita atomicamente o lote aplicável. |
| Criação anônima sem limite | Limites transacionais: 20 novas tentativas por rede/10 minutos e 120 globais/minuto. Retomada não consome vaga. Só o ingresso confiável da Vercel informa a rede; ausência dele usa um grupo compartilhado, sem confiar em cabeçalhos arbitrários. Contadores privados usam HMAC e vencem em 24 horas; limpeza gradual limitada a esses contadores. Política de privacidade atualizada. |
| Corpo pendente segurava início do quiz | Prazo de três segundos para leitura; cancelamento de stream não segura a resposta. Limite retorna 429 e Retry-After. |
| Prática perdida ao atualizar | GET autenticado recupera a última questão aberta e não vencida, sem gabarito e sem novo consumo. UI aguarda retomada, oferece retry e limita a espera. |
| Dependências de produção vulneráveis | Next.js/eslint-config-next 16.3.8; sharp/source-map-js atualizados no lockfile. Auditoria de produção: zero alertas conhecidos no momento da verificação. |
| Cabeçalhos de proteção ausentes | CSP para origens necessárias, frame-ancestors none, X-Frame-Options DENY, nosniff e no-referrer. Scripts de hidratação inline continuam necessários às páginas estáticas; a CSP não é uma defesa estrita contra todo XSS. |
| Política mínima de senha divergente | Supabase hospedado e configuração local agora exigem oito caracteres. Conferido novamente no painel após salvar. |

## Limitações que continuam explícitas

- **Senhas vazadas:** proteção nativa do Supabase exige Pro; painel confirmou indisponibilidade no plano Free. Nenhum upgrade contratado. O mínimo de oito caracteres não substitui essa proteção.
- **Ferramenta de desenvolvimento:** `braces@3.0.3`, transitiva de ESLint, ainda aparece em cinco entradas de gravidade alta da mesma cadeia. Não há versão corrigida publicada na consulta realizada. O downgrade sugerido pelo npm para eslint-config-next 14 não é uma correção compatível com Next 16. Não foi aplicado nem houve desativação do lint. Referência: https://github.com/advisories/GHSA-vfj7-8cjw-p6xm . Isso não aparece na auditoria de dependências de produção.
- Os 94 avisos de lint preexistentes vêm dos scripts locais da skill Impeccable; zero erros de lint na execução.
- Limites reduzem abuso; não constituem teste de carga nem garantia de escala ilimitada. Não houve ataque de sobrecarga, compra real ou nova certificação comercial de ponta a ponta.

## Validação e implantação

- 246 testes Node aprovados; build de produção e TypeScript aprovados.
- `node scripts/test-security-remediation.mjs`: ensaio das duas migrations mais regressões existentes, em transação encerrada com ROLLBACK. Repetido com `--applied` depois da implantação: aprovado. Fixtures não permanecem no banco.
- Ensaio cobre limite por rede/global, retry sem cobrança, retomada sem consumo e sem exposição de resposta, isolamento entre duas identidades, expiração, cancelamento, estorno, replay, fila fora de ordem e privilégios restritos.
- Migrations `20261021003013` e `20261021003016` aplicadas. Worker `cakto-reconcile` versão 6 ativo. Consulta operacional retornou estado saudável e fila vazia.
- Navegador no build de produção: página inicial, login conectado e prática carregaram sem erros de console. Retomada sem questão aberta não criou tentativa nem consumiu saldo.
- O site é publicado pelo commit que contém este registro; conferir status Vercel e domínio público antes de declarar publicação concluída.

## Reversão

As migrations preservam RPCs e dados anteriores. Para recuar o aplicativo, reimplantar o commit anterior e o worker correspondente antes de remover funções novas. Para a fila, restaurar as definições públicas anteriores das migrations `20261006200000` e `20261009180000`, remover apenas gatilho/funções novos se necessário; colunas opcionais podem permanecer. Não excluir pagamentos, períodos de acesso, evidências, usuários ou histórico. Novos contadores e índice são independentes; não exigem limpeza destrutiva para recuo.
