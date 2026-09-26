# Etapa 12 — correção segura

Backend concluído. A aprovação do teste da etapa 11 autorizou esta etapa. A tela atual permanece igual: o envio pelo quiz e a apresentação do feedback serão conectados ao resultado na etapa 13, após o mockup aprovado. A prévia não envia respostas e não produz notas fictícias.

## Contrato

`POST /api/quiz/result`, JSON de até 4096 bytes, leitura do corpo limitada a dez segundos:

```json
{"answers":[{"questionId":"UUID da questão recebida","answer":"A"}]}
```

O exemplo mostra a forma de um item; a requisição válida exige exatamente dez itens, únicos, UUIDs em minúsculas e alternativas A–E. Campos extras são recusados, inclusive ID da tentativa e pontuação. Identidade vem exclusivamente do cookie HttpOnly da etapa 10. Exige Origin exata e rejeita Sec-Fetch-Site cross-site. Produção exige APP_ORIGIN HTTPS. Não renova o cookie nem o prazo.

O servidor passa somente o hash do token e as respostas à RPC privilegiada. A função bloqueia a linha da tentativa, verifica a expiração após obter o bloqueio e confere que cada questão pertence ao snapshot. Toda a correção usa o snapshot privado, mesmo se o banco editorial mudar. Salva escolhas, feedback e completed_at em uma transação; somente então retorna o feedback.

Uma tentativa admite uma finalização. Reenvio das mesmas escolhas, inclusive em outra ordem, devolve exatamente o resultado salvo. Escolhas diferentes após concluir recebem 409, sem revelar novo feedback. Nenhuma correção parcial. Resultado com id, completedAt, total, score e dez questões contendo conteúdo, escolha, alternativa correta, indicador de acerto e explicação. DTO usa lista explícita de campos.

`GET /api/quiz/result` recupera o resultado pelo mesmo cookie, somente após conclusão e antes do prazo original de 30 minutos. Não recebe parâmetros. Ambos os métodos usam private/no-store e não expõem erros internos, hash ou token no JSON.

| Status | Significado |
| --- | --- |
| 200 | Resultado concluído ou repetição idêntica |
| 400 | Respostas inválidas ou query inesperada |
| 401 | Token ausente, inválido, desconhecido ou expirado; GET também antes da conclusão |
| 403 | Origem rejeitada |
| 408 | Prazo de leitura do corpo esgotado |
| 409 | Tentativa já enviada com outras escolhas |
| 413 | Corpo acima do limite |
| 415 | Content-Type diferente de application/json |
| 503 | Indisponibilidade interna sem detalhes privados |

## Banco e segurança

Migration `20260926022707_submit_guest_quiz_securely.sql` aplicada após dry-run. Quatro migrations locais/remotas sincronizadas. Tabela private.guest_quiz_results com RLS, sem acesso direto para anon, authenticated ou service_role. RPCs submit_guest_quiz e read_guest_quiz_result executáveis somente por service_role; SECURITY DEFINER com search_path vazio, SQL estático e nomes qualificados. Snapshot e resultado ficam restritos ao servidor.

O bloqueio FOR UPDATE serializa finalizações concorrentes da mesma tentativa. Não foi realizado teste simultâneo com duas conexões; foram testados reenvio idêntico e conflitante sequenciais no banco. Base: [PostgreSQL 17 — bloqueios](https://www.postgresql.org/docs/17/explicit-locking.html) e [Supabase — funções e permissões](https://supabase.com/docs/guides/database/functions).

## Testar no PowerShell

Com o site rodando em outro terminal (`npm.cmd run dev`), execute na pasta do projeto:

```powershell
npm.cmd run test:correction
npm.cmd run test:correction:http
npx.cmd --no-install supabase db query --linked --file supabase/tests/test_quiz_correction.sql
npx.cmd --no-install supabase db query --linked --file supabase/tests/verify_quiz_correction.sql
git log -1 --oneline
git status
```

Esperado: oito testes isolados, quatro HTTP, 35 verificações SQL e cinco linhas passed=true. O SQL publica exemplos exclusivamente dentro de uma transação invisível às demais conexões, testa e termina com rollback. Não publica questões de verdade, não mantém tentativas de teste nem altera o conteúdo editorial.

Resultados: todos aprovados, além de lint/build, nove testes isolados e cinco HTTP da etapa 10 e suas 26 verificações SQL. As primeiras chamadas HTTP falharam porque o servidor local estava parado; reiniciado, passaram sem alterações adicionais no código. Seed conferido: dez questões draft, versão 1. Nenhuma credencial registrada ou nova dependência.

Cobertura: payload forjado/duplicado/incompleto, IDs externos, alternativas inválidas, pontuação no cliente, CSRF, cookies, limite de corpo, snapshot após edição, pontuação integral/parcial, idempotência, conflito, expiração, isolamento por token e restrições por papel. Timeout de leitura implementado, mas não provocado nos testes. Caminho positivo HTTP completo com banco publicado e integração visual aguardam revisão editorial e etapa 13; caminhos positivos foram verificados no PostgreSQL e com dependências isoladas.

Não há publicação do site, controles de produção completos, retenção automática de resultados ou rate limiting nesta etapa. O término do prazo bloqueia a leitura, mas não apaga registros. Próximo passo após teste do usuário: mockup da tela de resultado.
