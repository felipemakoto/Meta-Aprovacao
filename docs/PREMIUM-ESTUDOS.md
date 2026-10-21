# Estudos Premium — entrega de 21/10/2026

## Entrada e reaproveitamento

`/premium/estudos` reúne nove áreas, acessíveis também pela navegação de estudos, painel e plano ativo. O tema verde, fontes locais, StudyShell, banco validado, tentativas, correção, histórico e estatísticas existentes foram reutilizados. Nenhuma dependência nova ou API paga.

1. **Plano:** instituição, prova, dias, horário, minutos, metas e lembrete. Horizonte móvel de 28 dias, limitado à data da prova. Distribuição ponderada pelo desempenho, revisões vencidas, flashcards e simulados. Adapta ao abrir o espaço Premium, após salvar preferências/revisões ou por atualização manual. Preserva sessões editadas e concluídas. Calendário permite editar todas as atividades.
2. **Realista:** ETEC e IFSP integrado cadastrados com formato e fonte. ETEC: 50 questões/240 minutos, cobertura equilibrada sem alegar cotas oficiais de matéria. IFSP: 30 questões, 15 de Português e 15 de Matemática, 180 minutos. São treinos com questões da plataforma, não cópias de provas oficiais. Novas instituições dependem de cadastro administrativo com edital verificado.
3. **Revisão:** erros reais e dificuldades recorrentes, fila individual e repetição espaçada conforme classificação. Revisão básica do histórico continua gratuita.
4. **Diagnóstico:** matérias, assuntos e dificuldade. Última resposta por questão distinta no período, evitando inflar a amostra com repetições. Classificação somente a partir de oito questões distintas; não prevê aprovação.
5. **Personalizados:** instituição, matérias, assuntos, dificuldade, 5–100 questões e 10–360 minutos. Prioriza questões nunca vistas ou menos recentes, sem duplicar dentro da tentativa; informa reutilizações. Seleção insuficiente é recusada, sem inventar conteúdo.
6. **Radar:** mesmos cálculos do diagnóstico, filtros de período e assunto; pontos sem amostra suficiente ficam ausentes. Tabela acessível acompanha a visualização.
7. **Flashcards:** somente questões publicadas com gabarito e explicação validados, giro frente/verso, quatro classificações, histórico e intervalo adaptativo de 1–180 dias. Não há geração de conteúdo por IA.
8. **Calendário:** mensal/semanal, fontes oficiais separadas das sessões pessoais, criação/edição/remoção lógica, conclusão, metas e lembretes. Horários de Brasília. Avisos do navegador funcionam com a aba aberta; exportação `.ics` permite lembretes no calendário do dispositivo com o site fechado. É uma cópia, não sincronização bidirecional; reexportar após alterações.
9. **Biblioteca:** três pares iniciais de prova/gabarito de 2026 (ETEC 1º/2º semestres e IFSP integrado Tipo 1). O gabarito IFSP está identificado como preliminar. Filtros, visualizador nativo e links de download oficial. Cadastro privado verifica domínio, página com ambos os links, tipo PDF e assinatura do arquivo. Não copia/republica documentos nem inclui resoluções interativas. Bloqueios da fonte ou ausência de suporte a PDF no navegador exigem abrir o link oficial; não são contornados.

## Segurança e persistência

- Endpoint `/api/premium/study` verifica identidade e Premium no servidor a cada operação; funções SQL verificam novamente o direito vigente e o proprietário. Não confia em `userId`, preço ou permissão enviados pelo cliente.
- Novas tabelas em `private`, RLS habilitada, sem acesso direto de `anon`, `authenticated` ou `service_role`. RPCs públicas novas somente para `service_role`, com `search_path` vazio e consultas limitadas ao usuário verificado.
- Origem/CSRF, corpo limitado, validação de campos, limites e deduplicação. Links oficiais HTTPS restritos, sem redirecionamento de busca; respostas limitadas e com prazo.
- Tentativas Premium reutilizam `simulation_attempts`; snapshots/rascunho/marcações/revisão ficam persistidos. Rascunhos antigos de outra aba são recusados. Correção é transacional e idempotente; prazo é definido pelo servidor e respostas tardias não substituem o último rascunho salvo.
- Job separado `meta-grade-study-exams`, a cada minuto, corrige até 100 tentativas vencidas com Premium vigente. Abrir uma tentativa vencida também recupera sua correção. Cron financeiro da Cakto não foi modificado.
- Migrações aditivas: `20261021090102_premium_study_workspace.sql` e `20261021090105_remove_first_purchase_promotion.sql`. Não há reescrita de assinaturas, comprovantes ou tentativas anteriores.
- Em eventual rollback do frontend, preservar tabelas e dados. Não remover colunas/funções enquanto existirem tentativas novas; as rotas antigas foram protegidas para também exigir Premium nessas tentativas.

## Preço e Cakto

Novos checkouts usam exclusivamente a oferta regular: **R$ 22,99/mês desde a primeira cobrança**. Taxa atual Cakto: R$ 0,99; total mostrado no checkout: **R$ 23,98/mês**. Cupom automático removido do site e da criação de novas intenções. Cupom `primeiracompra` excluído no painel com autorização explícita; base, recorrência e oferta preservadas.

Referências promocionais no verificador financeiro e em migrações/testes históricos são intencionais: validam comprovantes antigos e preservam renovações e direitos existentes; não habilitam a promoção para novas vendas. Não apagar variáveis históricas de oferta enquanto esses eventos puderem chegar. Nenhuma compra real foi realizada.

## Fontes oficiais conferidas

- ETEC: https://vestibulinho.etec.sp.gov.br/duvidas-frequentes/ e https://vestibulinho.etec.sp.gov.br/calendario/
- PDFs ETEC: https://vestibulinho.etec.sp.gov.br/provas-gabaritos/
- IFSP 2027 integrado: https://vtp.ifsp.edu.br/index.php/processo-seletivo-tecnico/4475-psi-2027.html
- PDFs IFSP: https://www.ifsp.edu.br/index.php/conict11/17-ultimas-noticias/5551-confira-os-gabaritos-preliminares-das-provas-de-selecao-dos-cursos-tecnicos

As datas e formatos não são descobertos automaticamente. Retificações, novos processos, instituições e documentos exigem nova verificação oficial antes de cadastrar. Nunca extrapolar uma data/estrutura de um IF para todos os IFs.

## Verificação reproduzível

- `npm run test:premium:study`: contratos, autorização, origem, amostra, planejamento, calendário, fontes PDF e resultados em branco.
- `npm run test:premium:study:sql -- --applied`: regressões SQL antigas e novas, isolamento, expiração, rascunho, revisões, histórico e preço regular. Fixtures e regressões dentro de transação com rollback.
- `npm run test:premium:study:http`: servidor local de desenvolvimento em `127.0.0.1:3085`, com `APP_ORIGIN` correspondente. Testa conta descartável identificada, antes/depois do direito Premium, as nove páginas, plano, sessões, cartões e simulados. Não chama a Cakto. Limpeza específica da conta no bloco final.
- Para repetir no publicado: `STUDY_TEST_ORIGIN=https://meta-aprovacao.vercel.app` no ambiente do mesmo script. Não usa contas de alunos nem compra real.
- `test:promotion:sql` permanece como alias de compatibilidade para os testes atuais; `test:promotion:production` agora valida o preço regular e preservação dos comprovantes promocionais antigos.

Não há promessa de suporte nativo a notificações com o site fechado, atualização automática de editais ou PDFs e sincronização com Google Calendar. Essas limitações estão informadas na interface correspondente.
