# Simplificação visual implementada

Usuário aprovou historico-mobile-v2-clean.png: “está bom assim, pode continua”. Implementação aplicada em 30/09/2026 à entrada, dashboard, histórico, prática, resultado, login/cadastro e recuperação. Estilo mantém cores marfim/verde, fonte Geist e títulos DM Serif Display.

## Mudanças

- Histórico: título curto, abas Testes/Questões, data junto ao nome, nota em sans de 23–28px, erros e revisão na mesma faixa, ação Praticar questões em destaque. Datas sempre incluem ano para não confundir registros de anos diferentes; pequena diferença intencional em relação à imagem ilustrativa.
- Dashboard: caminhos Praticar questões e Histórico agrupados, último resultado preservado, revisão como ação contextual. Removidas barras decorativas e Simulados em breve. Resumo continua sendo de testes salvos.
- Entrada: título preservado; descrição e apoio mais curtos, botão próximo ao conteúdo. Espaço antes do botão reduzido a 28–32px. Sem novo card de 10 questões ou marca-texto.
- Questões: matéria/assunto visíveis; dificuldade/prova em Mais filtros, sinalizado quando há filtros adicionais ativos. Buscar questão e Conferir resposta permanecem ações distintas. Explicação exibida abaixo das alternativas após responder; gabarito não aparece antes.
- Resultado: Seu resultado como título, conteúdos e botão de revisão sem repetir contagens em parágrafos. Números e subtítulos menores, explicações preservadas.
- Conta: formulários sem moldura adicional e introduções óbvias removidas. Campos, requisitos de senha, ajuda de recuperação, estados de erro e instruções de confirmação preservados. Área autenticada oferece Meus estudos e Salvar teste concluído; último resultado acessível no dashboard.

Nenhuma mudança de banco, dependências, autenticação, correção ou publicação de questões. Nenhuma nova rota da aplicação. IDs e contratos de filtros preservados. Página não usa exemplos como fallback de produção.

## Teste pelo celular

Abra out/site-demonstracao.html no navegador com JavaScript habilitado, como na demonstração anterior. Use o seletor no topo para alternar entre Início, Meus estudos, Histórico, Questões, Teste e Resultado.

O arquivo usa os componentes reais com dados locais ilustrativos. Navegação entre telas de estudo ocorre dentro do HTML. Conta, cadastro e salvamento exigem a aplicação completa e ficam desabilitados neste arquivo. O resultado demonstrativo não calcula a nota das escolhas do teste ilustrativo: usa o exemplo de 7/10; a aplicação real continua corrigindo no servidor.

1. Histórico: alternar Testes/Questões, carregar mais, abrir resultado ou explicação e voltar.
2. Questões: abrir Mais filtros, escolher dificuldade/prova, buscar, selecionar alternativa e conferir. Após responder, explicação deve aparecer abaixo das alternativas.
3. Meus estudos: abrir prática, histórico e revisão dos erros.
4. Início: conferir a distância menor até o botão e acessar o teste demonstrativo.
5. Resultado: revisar erros um por um, voltar ao resumo e abrir todas as respostas.

Também regenerados out/historico-demonstracao.html e out/questoes-demonstracao.html. Todos são ignorados pelo Git e reproduzíveis pelas ferramentas externas já preparadas:

```powershell
Set-Location 'C:/Users/felip/OneDrive/Documentos/projeto_etec-if'
node scripts/build-mobile-preview.mjs 'C:/Users/felip/.codex/previews/etec-if-stage19' site
Copy-Item -LiteralPath 'C:/Users/felip/.codex/previews/etec-if-stage19/site-demonstracao.html' -Destination 'out/site-demonstracao.html'
```

Na aplicação, acessar /login, /cadastro e /recuperar-senha para conferir também os formulários. Nenhuma tentativa automática de cadastro ou envio de e-mail realizada nesta revisão.

## Verificação

Lint, build e TypeScript aprovados. 46 testes de regressão de histórico/dashboard/prática/resultado/login/cadastro/recuperação passaram. Quatro testes HTTP/arquivo do histórico e três HTTP de prática passaram em desenvolvimento. Expectativas de texto atualizadas para os rótulos aprovados, preservando verificações de sessão, origem, cinco alternativas e ausência de correção antecipada. HTML combinado conferido quanto a sintaxe JavaScript, fontes/ícones incorporados e ausência de scripts/estilos externos ou chave secreta.

QA visual automatizado segue bloqueado pela política de navegador já registrada; não houve contorno, captura nova ou alegação de equivalência visual. Teclado/interações e dimensões no aparelho aguardam teste manual. Execução HTTP de produção permanece pendente pelo bloqueio anterior do servidor temporário; não foi repetida nesta revisão. Build não substitui essas verificações. Nenhum túnel ou deploy.

Pausa para teste desta simplificação. Etapa 21 não iniciada.

