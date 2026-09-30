# Etapa 18 — dashboard

Implementação após aprovação explícita de design/dashboard-mobile-v1.png. Código e verificações funcionais concluídos. Em 30/09/2026, o usuário conferiu /dashboard/preview e afirmou: “Está bom pode continuar”. Aprovação manual do visual registrada. Comparação automatizada por captura continua bloqueada; esta confirmação não comprova gravação/leitura de resultado real nem todos os estados e interações.

## Entrega

- /dashboard exige usuário com e-mail confirmado, verificado por getUser. Sem sessão, redireciona para /login. Falha operacional produz mensagem de erro, nunca totais zerados fictícios.
- Layout reutiliza fontes DM Serif Display/Geist, paleta, marca e ícones existentes. Último teste, nota, dez segmentos, ação de revisão, resumo e atividade seguem o mockup. Fundo sólido dos tokens, sem imitar textura rasterizada.
- RPC read_quiz_dashboard retorna totais das tentativas salvas e último resultado em um único snapshot. Vínculo primário por tentativa impede dupla contagem. Nenhum dado anônimo não salvo entra no agregado.
- RPC restrita a service_role. A página obtém o ID da sessão verificada, não de URL ou formulário; nenhuma credencial administrativa ou gabarito entra no dashboard.
- Último teste usa a mesma ordem de salvamento da etapa 17. Data formatada em português e fuso America/Sao_Paulo. Revisar meus erros abre diretamente a primeira questão errada do último resultado; nota perfeita oferece revisão de todas as respostas. Resumo continua disponível separadamente.
- Conta vazia oferece iniciar teste ou voltar ao resultado já concluído. Simulados permanece Em breve. Footer real explica que os totais são dos testes salvos.
- Minha conta e confirmação de cadastro oferecem Ver meus estudos. Resultado salvo tem retorno para Meus estudos.
- Prévia /dashboard/preview exclusiva de desenvolvimento, sem gravação ou chamada ao banco. Estados opcionais: ?state=empty, ?state=error, ?score=10 e ?score=0. Seus links de revisão abrem somente resultado ilustrativo.

## Verificações

- 18 testes Node aprovados: dashboard (4), HTTP dashboard (3), cliente de resultado (5), associação (6).
- SQL test_dashboard.sql aprovado no banco vinculado: duas tentativas da mesma conta somam 20 respostas/17 acertos, último resultado ordenado corretamente, outra conta e identidade nula não veem dados; anon/authenticated sem EXECUTE. Fixtures revertidas por rollback.
- Migration 20260929140000 aplicada após dry-run; seis migrations locais/remotas sincronizadas. Nenhuma questão publicada.
- lint e build aprovados. Testes HTTP conferiram redirect, estados renderizados e revisão direta. Em desenvolvimento, Next devolve no-cache, must-revalidate; em produção, confirmado private/no-store.
- Servidor de produção temporário na porta 3001 confirmou proteção do dashboard e 404 das prévias, depois foi encerrado. Desenvolvimento permanece na porta 3000.
- Inspeção por navegador continua bloqueada pela recusa de política registrada na etapa 17. Não houve tentativa de contorno. HTML, testes HTTP e build não substituem comparação visual, medição de overflow nem interação real por teclado.

## Teste do usuário

1. Abra http://localhost:3000/dashboard/preview para conferir a composição aprovada. Clique em Revisar meus erros; deve abrir a primeira questão errada. Ver resultado completo deve abrir o resumo.
2. Em Minha conta, clique em Ver meus estudos. A conta sem resultado salvo deve mostrar o estado vazio, com totais zero, e não os números do mockup.
3. Após haver questões revisadas/publicadas e um resultado real salvo, confira nota, totais e revisão no dashboard. Esse teste real segue pendente; a prévia não prova persistência.

Não foi implementado histórico, banco de questões, simulados ou estatísticas detalhadas de etapas posteriores.
