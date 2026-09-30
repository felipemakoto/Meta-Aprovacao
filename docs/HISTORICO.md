# Etapa 20 — histórico

Visual atualizado após aprovação de historico-mobile-v2-clean.png: abas agora Testes e Questões, registros compactos com data curta e ano, nota em sans e ação de revisão junto ao número de erros. Para testar todas as telas simplificadas em um único arquivo, use out/site-demonstracao.html. Detalhes em SIMPLIFICACAO-IMPLEMENTADA.md; roteiro abaixo usa os nomes anteriores das abas.

Implementação autorizada em 30/09/2026 após aprovação de design/historico-mobile-v1.png. Testes técnicos concluídos; conferência visual e interação manual aguardam o usuário.

## Objetivo e resultado

Voltar a testes diagnósticos salvos e questões individuais já respondidas, em listas separadas. Página /historico, API de leitura /api/history, detalhes /historico/tests/ID e /historico/practice/ID. Dashboard inclui Ver meu histórico. Nenhuma questão publicada; não inclui simulados nem estatísticas novas.

A lista ordena por conclusão e identificador em ordem decrescente. Cada página contém até 20 registros, com consulta de um registro adicional para decidir se há outra página. Cursor preserva microssegundos e desempate por UUID; não usa offset. Tentativas individuais sem resposta não aparecem.

## Segurança e revisão

Identidade obtida exclusivamente por getUser no servidor, com e-mail confirmado. Cliente nunca fornece user_id. RPCs read_study_history e read_history_detail executáveis somente por service_role; tabelas privadas continuam sem grants diretos e com RLS. SECURITY DEFINER usa search_path vazio. Referência oficial consultada: https://supabase.com/docs/guides/database/functions.

Lista envia apenas data, identificador e resumo, sem enunciado/gabarito/explicação. Detalhe confere dono e conclusão. Testes usam o feedback original já salvo; questões individuais usam o snapshot privado, inclusive após edição do conteúdo ou fim do prazo de resposta. Outra conta recebe detalhe indisponível, sem indicar o proprietário.

Respostas da API privadas/no-store. Proxy inclui histórico e API para renovação de sessão e proteção de cache. Falha operacional é distinta de histórico vazio. Navegação, carregamento, nova tentativa, fim da lista, validação de cursor e cancelamento de consultas ao trocar a lista implementados. Nenhuma mutação adicionada nesta etapa.

## Como testar no celular

Baixe e abra out/historico-demonstracao.html no mesmo navegador usado na etapa 19, com JavaScript habilitado. Arquivo único com fontes, CSS, React e ícones locais incorporados. Dados ilustrativos; nenhuma API, conta ou credencial. Links externos à demonstração ficam desabilitados.

1. Em Testes salvos, confira 7/10 e 6/10.
2. Abra Ver resultado; use Revisar os erros e avance nas explicações. Voltar ao histórico retorna à lista.
3. Clique Carregar mais: surge um terceiro teste (8/10) e a mensagem de fim.
4. Selecione Questões praticadas; abra Ver explicação para ver a resposta D, correta B e cálculo 80 − 12 = 68.
5. Volte e troque novamente para Testes salvos.

Na aplicação completa, faça login e abra Ver meu histórico no dashboard. Registros reais dependem de testes associados à conta ou prática com conteúdo revisado/publicado. Sem esses registros, a lista fica vazia; nunca usa exemplos como fallback. A demonstração não comprova persistência real pelo usuário.

## Comandos no PowerShell

Abra o terminal na pasta do projeto:

```powershell
Set-Location 'C:\Users\felip\OneDrive\Documentos\projeto_etec-if'
npm.cmd run test:history
npm.cmd run test:history:http
npx.cmd --no-install supabase db query --linked --file supabase/tests/test_history.sql
git log -3 --oneline
git status
```

Prévia local /historico/preview disponível apenas em desenvolvimento; produção usa notFound. Gerar arquivo portátil, com as ferramentas externas já preparadas:

```powershell
node scripts/build-mobile-preview.mjs 'C:/Users/felip/.codex/previews/etec-if-stage19' historico
Copy-Item -LiteralPath 'C:\Users\felip\.codex\previews\etec-if-stage19\historico-demonstracao.html' -Destination 'out/historico-demonstracao.html'
```

## Verificação e limites

- 6 testes novos de contrato/handler, 16 testes de regressão de dashboard/resultado/prática: 22 aprovados.
- 4 testes HTTP/arquivo aprovados em desenvolvimento: API 401 sem sessão válida, POST 405, páginas protegidas redirecionam, prévia 200, HTML com JS válido e ativos incorporados.
- SQL no Supabase aprovado: 23 práticas com timestamp idêntico paginadas em 20+3 sem duplicação, isolamento de lista e detalhe, tentativa sem resposta excluída, usuário não confirmado recusado, filtros/cursor inválidos, testes salvos privados, revisão de snapshot depois de edição e expiração, privilégios. Todas as fixtures revertidas por rollback; nenhuma publicação.
- Migration 20260930160000 aplicada após conferência do histórico e dry-run. Oito migrations locais/remotas sincronizadas.
- Lint e build finais aprovados. Não houve alteração de dependências.
- Teste HTTP de produção não executado: revisão automática bloqueou o comando do servidor temporário local com blocked by policy, sem detalhe adicional. Build de produção não comprova headers de produção ou 404 efetivo da prévia.
- Captura/comparação visual, teclado e console não verificados pelo navegador, bloqueio anterior preservado. design-qa.md registra final result: blocked para esta etapa. Não alegar fidelidade visual verificada antes da conferência do usuário.

## Estado e próximo passo

Implementação e verificações disponíveis concluídas. Pausa para teste do usuário da etapa 20. Etapa 21 (simulados) não iniciada. Não publicar conteúdo, abrir túnel ou avançar antes desse teste.
