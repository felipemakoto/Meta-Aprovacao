import {question, numeric} from './bank-utils.mjs';

// Segunda leitura: condições suficientes, resposta única e distratores sem dicas.
const histories = {
 H1: ['Em uma escavação fictícia, um recipiente isolado contém grãos. Em outra área do mesmo sítio e período, encontram-se instrumentos com marcas de corte de cereais e restos de estruturas de armazenamento.',
  'Que diferença existe entre as duas bases de evidência para estudar o cultivo?',
  'O conjunto de vestígios fortalece a hipótese de produção e armazenamento locais, que o recipiente isolado não demonstrava.',
  ['O recipiente isolado permite datar o início do cultivo com mais precisão que o conjunto contextualizado.', 'As marcas de corte permitem concluir que todos os habitantes trabalhavam exclusivamente no cultivo.', 'A presença de armazenamento exclui a circulação de grãos por troca entre grupos.', 'Os dois conjuntos demonstram a mesma organização social, pois ambos contêm grãos.'],
  'Restos associados no espaço e no período permitem relacionar processamento e armazenamento, fortalecendo uma hipótese que um objeto isolado não demonstra. Isso não estabelece exclusividade agrícola, igualdade social nem ausência de trocas.'],
 H3: ['Em um exercício sobre a República romana, dois registros descrevem o mesmo território após conquistas: grandes proprietários ampliam suas terras e empregam mais pessoas escravizadas; pequenos produtores endividados perdem lotes durante ausências militares prolongadas.',
  'Como os registros ajudam a explicar tensões internas ligadas à expansão?',
  'Os recursos das conquistas e as condições do serviço militar podiam beneficiar e prejudicar grupos diferentes.',
  ['O aumento de terras controladas por grandes proprietários demonstra que todos os pequenos produtores receberam lotes equivalentes.', 'O emprego de pessoas escravizadas indica que os proprietários deixaram de disputar terras.', 'As perdas dos pequenos produtores significam que não houve ampliação territorial romana.', 'A participação em campanhas militares garantia a conservação da propriedade dos combatentes.'],
  'A expansão territorial e a distribuição interna de seus efeitos são dimensões diferentes. Os registros combinam concentração de terras com vulnerabilidade dos pequenos produtores; não indicam divisão igual dos ganhos nem segurança automática da propriedade de soldados.'],
 H5: ['Uma atividade apresenta duas edições fictícias de uma gravura do século XVI. Ambas usam a mesma imagem, mas as legendas atribuem sentidos opostos à cena. O impressor e o público de destino também mudaram entre as edições.',
  'Qual interpretação considera a relação entre técnica de reprodução e circulação de ideias?',
  'Reproduzir a mesma imagem não assegura a mesma mensagem, pois legenda e contexto de circulação orientam sua leitura.',
  ['O emprego da mesma imagem comprova que as duas edições se destinavam ao mesmo público.', 'As legendas opostas demonstram que as imagens não podiam ser reproduzidas por impressão.', 'A mudança de impressor basta para concluir que uma das edições foi produzida antes da invenção da imprensa.', 'O significado da gravura depende apenas do desenho, tornando as legendas dispensáveis à análise.'],
  'A reprodução permite reutilizar uma imagem em contextos distintos. Legendas, autoria editorial e destinatários integram o material analisado e podem alterar a mensagem. Identidade visual não comprova identidade de público ou intenção.'],
 H6: ['Em uma atividade sobre as reformas religiosas do século XVI, dois textos didáticos fictícios defendem posições diferentes. O texto A apresenta as Escrituras como autoridade suficiente para a doutrina; o B também reconhece a tradição e a autoridade da Igreja.',
  'Qual aspecto do conflito os textos permitem comparar diretamente?',
  'Os critérios usados para reconhecer a autoridade religiosa e fundamentar a doutrina.',
  ['A identidade de posição entre os autores quanto ao papel da tradição.', 'A ausência de divergências doutrinárias, pois ambos mencionam as Escrituras.', 'A decisão de ambos os autores de abandonar qualquer texto religioso.', 'O apoio dos dois autores ao mesmo governante, deduzido apenas das referências às Escrituras.'],
  'Os textos diferem nas fontes de autoridade que reconhecem. Compartilhar uma referência não elimina a divergência sobre a tradição e a Igreja. Não foram apresentados dados que identifiquem alianças políticas ou permitam atribuir essas posições a todas as correntes reformadoras.'],
 H8: ['Para estudar um engenho colonial, uma atividade cruza dois registros fictícios do mesmo ano: a contabilidade aponta aumento das vendas de açúcar; uma ordem administrativa restringe deslocamentos de trabalhadores escravizados e prevê punições.',
  'Que leitura articula os registros sem confundir produção com condições de trabalho?',
  'O crescimento das vendas podia coexistir com coerção, e a contabilidade sozinha não descreve a experiência dos trabalhadores.',
  ['O aumento das vendas demonstra que as restrições aos trabalhadores deixaram de ser aplicadas.', 'A presença de uma ordem escrita transforma o trabalho escravizado em contrato livre.', 'A ordem de punição permite calcular o valor exportado sem consultar a contabilidade.', 'As vendas elevadas comprovam que os trabalhadores recebiam a receita na mesma proporção que o proprietário.'],
  'Os registros tratam de aspectos diferentes e compatíveis: circulação de mercadorias e controle do trabalho. Receita não mede liberdade, remuneração ou distribuição. A ordem pode informar práticas de coerção, mas não substitui os dados de vendas.'],
 H9: ['Em uma atividade sobre uma zona mineradora colonial, um registro fictício mostra aumento do ouro extraído e outro registra aumento do preço da farinha no mesmo período. Não há dados de salários, estoques ou número de moradores.',
  'Qual conclusão respeita o alcance das duas informações?',
  'A expansão da extração coexistiu com encarecimento do abastecimento, sem comprovar melhoria de vida de todos os grupos.',
  ['A alta do ouro demonstra que a renda de todos cresceu mais que o preço da farinha.', 'A alta da farinha comprova que a região deixou de produzir qualquer alimento.', 'Os dois aumentos permitem calcular exatamente o salário real dos trabalhadores.', 'A coincidência temporal demonstra que os tributos foram a única causa do encarecimento da farinha.'],
  'As duas séries descrevem mudanças de extração e de preço. Sem renda, oferta e demanda, não se calcula poder de compra nem se isola uma causa do encarecimento. Expansão econômica agregada não demonstra benefício uniforme.'],
 H11: ['Uma fábrica fictícia do período de industrialização tem cem trabalhadores. Antes, produzia mil peças por dia em jornadas de dez horas; depois, passou a produzir mil e quinhentas em jornadas de doze horas. O quadro de trabalhadores ficou igual e não há dados de salários.',
  'Que comparação distingue aumento de produção e condições de trabalho?',
  'A produção diária cresceu 50% e a jornada, 20%; esses dados não demonstram aumento de salário ou de tempo livre.',
  ['A produção diária e a jornada cresceram na mesma proporção, de 50%.', 'A produção maior demonstra que a jornada individual foi reduzida pela metade.', 'A manutenção do número de trabalhadores comprova que o salário de cada um cresceu 50%.', 'O aumento da jornada explica integralmente a alta de produção, mantendo a produção por hora exatamente igual.'],
  'A produção passou de 1.000 a 1.500: aumento de 50%. A jornada passou de 10 a 12 horas: aumento de 20%. Com o mesmo quadro, a produção por trabalhador-hora também cresceu, de 1 para 1,25 peça. Nenhum desses resultados informa salário ou redução da jornada.'],
 H13: ['Dois projetos fictícios de um movimento de independência defendem romper com a metrópole. O projeto A mantém a exigência de renda para votar; o B propõe ampliar a participação para homens livres sem essa exigência. Ambos preservam a concentração de terras.',
  'Qual comparação distingue consenso pela ruptura e divergências sobre o novo Estado?',
  'A defesa comum da independência coexistia com projetos distintos de participação política e uma continuidade na propriedade.',
  ['A mesma posição sobre a metrópole implica propostas idênticas de cidadania.', 'A proposta B estabelece participação política de todos os habitantes, sem qualquer exclusão.', 'A manutenção das grandes propriedades significa que nenhum dos projetos defendia ruptura política.', 'A proposta A prevê distribuição de terras porque exige renda para votar.'],
  'O ponto comum é romper o vínculo metropolitano, não adotar a mesma cidadania. B amplia o grupo proposto em relação a A, mas ainda o limita a homens livres. Ambos mantêm a concentração de terras, permitindo distinguir dimensões da mudança.'],
 H16: ['Uma atividade sobre o Brasil após 1888 compara dois registros fictícios de 1890: um contrato prevê salário para uma pessoa emancipada; uma petição de trabalhadores reclama de barreiras ao acesso à escola e à moradia. Não há informação sobre distribuição de terras.',
  'Que análise considera conjuntamente os registros?',
  'A mudança jurídica e o trabalho remunerado podiam coexistir com desigualdades no acesso a direitos e condições de vida.',
  ['O contrato assalariado demonstra que todos os emancipados receberam terras.', 'A petição comprova que a lei de abolição manteve juridicamente a escravidão.', 'O contrato permite concluir que não existiam barreiras sociais para quem recebia salário.', 'A referência a direitos na petição demonstra que as reivindicações já haviam sido integralmente atendidas.'],
  'O contrato indica uma relação remunerada, enquanto a petição registra reivindicações sociais não resolvidas. Liberdade jurídica não implica acesso igual a escola e moradia. Os documentos não demonstram distribuição de terras nem manutenção legal da escravidão.'],
 H18: ['Uma atividade reúne duas cartas fictícias do mesmo soldado na Primeira Guerra: em 1914, ele espera voltar para casa em poucas semanas; em 1916, descreve o prolongamento do combate e dificuldades de abastecimento.',
  'Como interpretar a diferença entre os dois relatos?',
  'Ela permite comparar uma expectativa inicial com uma experiência posterior, sem transformar a primeira expectativa em descrição do desfecho.',
  ['A expectativa de retorno rápido comprova que a guerra terminou em 1914 para todos os países.', 'A carta de 1916 invalida a de 1914 como fonte, porque expectativas não podem ser estudadas historicamente.', 'As dificuldades relatadas em 1916 demonstram que já eram conhecidas com a mesma intensidade em 1914.', 'A autoria comum garante que os relatos descrevem todas as frentes da guerra e todas as experiências civis.'],
  'Uma fonte pode registrar expectativas que não se concretizam. A passagem do tempo e o prolongamento do combate ajudam a interpretar a mudança de perspectiva. A autoria comum não torna o testemunho universal nem permite ler o futuro como se fosse conhecido em 1914.'],
};

export function revise46(original) {
 let q = {...original, options:[...original.options]};
 const replace = task => {q = {...q, ...question(q.topic, `${task[0]}\n\n${task[1]}`,task[2],task[3],task[4],q.difficulty)};};
 if(q.family.startsWith('H') && q.variant===3 && histories[q.family]) {
  replace(histories[q.family]);
  q.difficulty='medium';
  q.difficultyReview={...q.difficultyReview,skill:'interpretação comparada de evidências históricas',rationale:'Exige articular dois registros ou perspectivas e distinguir conclusões sustentadas de extrapolações.',reviewedOn:'2026-10-14'};
 }
 if(q.family==='H16'&&q.variant===5){
  q.statement='Uma linha do tempo indica a independência brasileira em 1822, a abolição legal da escravidão em 1888 e a proclamação da República em 1889.\n\nQual afirmação NÃO é sustentada por esses marcos?';
  q.explanation='A cronologia situa 1888 após a independência e antes da República, ainda no Império. A abolição extinguiu a condição legal de escravidão, mas esses marcos não demonstram distribuição de terras nem igualdade de renda. Para estudar essas condições, são necessárias outras evidências.';
 }
 if(q.family==='C6') q.statement=q.statement.replace('Quatro ramos da mesma espécie aquática são mantidos em frascos com igual volume de água e temperatura.', 'Quatro ramos da mesma espécie aquática, com áreas foliares equivalentes e em condições semelhantes de saúde, são mantidos em frascos com igual volume de água e temperatura.');
 if(q.family==='C16') q.statement=q.statement.replace('no escuro e na mesma temperatura.', 'no escuro, com iguais volumes de ar, umidade e temperatura.');
 if(q.family==='C18') q.statement=q.statement.replace('Não houve entrada deliberada de indivíduos.', 'O cultivo permaneceu fechado, sem entrada ou saída de indivíduos.');
 if(q.family==='C20') q.statement=q.statement.replace('Duas caixas idênticas,', 'Duas caixas de mesma geometria, diferentes apenas no material de revestimento,');
 if(q.family==='C12'&&q.variant===4){
  q.statement='Ao misturar bicarbonato de sódio e solução ácida, uma análise identifica consumo de reagentes e formação de substâncias diferentes, incluindo gás carbônico. Em outro teste, apenas a água de uma solução evapora, sendo recuperada por condensação.\n\nQue critério distingue a reação química da mudança de estado nesses testes?';
  q.explanation='A identificação de substâncias diferentes, associada ao consumo dos reagentes, caracteriza a transformação química. Na evaporação e condensação, a água muda de estado, preservando sua identidade química. Bolhas ou mudanças de massa isoladas não bastam para distinguir os processos.';
 }
 if(q.family==='C18'&&q.variant===4) q.options=[q.options[0], 'Aumento do alimento, que reduziria o patamar por diminuir a competição.', 'Redução do espaço, que elevaria o patamar por aproximar os indivíduos.', 'Mudança do intervalo de registro, sem alterar recursos nem interações.', 'Aumento apenas do número inicial, que tornaria ilimitados os recursos disponíveis.'];
 if(q.family==='C18'&&q.variant===5) q.options=[q.options[0], 'Nascimentos persistentemente maiores que as mortes, sem outra mudança.', 'Mortes persistentemente maiores que os nascimentos, sem outra mudança.', 'Ausência de mortes, com manutenção contínua dos nascimentos.', 'Interrupção de todos os nascimentos, com manutenção da mortalidade.'];
 if(q.family==='C11'&&q.variant===3) q.options=q.options.map(s=>s.replace('pois a porção retirada é confundida com a solução restante.', 'pois passa a um quarto da concentração inicial.'));
 if(q.family==='P17'&&q.variant===4){
  q.statement='A frase “A professora informou à aluna que sua inscrição estava incompleta” permite leituras diferentes do possessivo. O redator sabe que a inscrição pertence à aluna.\n\nQual reescrita explicita esse referente, preservando a informação sobre o estado da inscrição?';
  q.explanation='A expressão “a inscrição da aluna” identifica explicitamente a pessoa a quem a inscrição pertence. Trocar informou por comunicou mantém o possessivo ambíguo; dela e aquela não nomeiam a proprietária. Sua própria também não explicita, nessa construção, que a inscrição é da aluna.';
 }
 if(q.family==='P15'&&q.variant===4){
  q.statement='A turma viu um documentário e depois o debateu. Uma revisora quer retomar “o documentário” por uma oração relativa com o verbo assistir no sentido de ver.\n\nQual frase respeita a regência desse verbo na norma-padrão adotada pelo Manual de Comunicação do Senado?';
  q.explanation='No sentido de ver ou presenciar, assistir exige a preposição a na norma-padrão adotada. Ao usar que para retomar documentário, a preposição vem antes do relativo: “o documentário a que os estudantes assistiram”. As demais opções substituem essa preposição ou empregam cujo sem relação de posse.';
 }
 if(q.family==='M18'&&q.variant===5) q.statement=q.statement.replace('Oito pessoas serão escolhidas para uma comissão de duas pessoas sem cargos.', 'Entre oito pessoas, duas serão escolhidas para uma comissão sem cargos distintos.');
 if(q.family==='M2'&&q.variant===5) q.statement='Um produto recebeu aumento de 20%. A loja pretende devolver o preço ao valor inicial, aplicando um desconto sobre o preço reajustado. Qual análise determina o desconto necessário?';
 if(q.family==='M3'&&q.variant===5) q.statement=q.statement.replace('preço de tabela P.', 'preço de tabela P, superior a R$ 25.');
 if(q.family==='M15'&&q.variant===5) q.options=q.options.map(s=>s.replace('Fica quatro vezes maior, confundindo volume com área de duas dimensões.', 'Fica quatro vezes maior, pois a capacidade varia com o quadrado do comprimento.'));
 if(q.family==='M17'&&q.variant===5) q.options=q.options.map(s=>s.replace('O interno mede 180°/9 = 20°, sem considerar o número de triângulos.', 'O interno mede 180°/9 = 20°, pois os nove ângulos internos somam 180°.'));
 if(q.family==='M4'&&q.variant===3){
  const statement='Dez trabalhadores realizariam uma tarefa em doze dias de seis horas. Após quatro dias nesse ritmo, a tarefa precisa ser concluída nos seis dias seguintes, com jornadas de quatro horas. A produtividade individual é constante e não há interferência entre trabalhadores. Quantos trabalhadores deve ter a equipe nessa segunda etapa?';
  q={...q,...numeric(q.topic,statement,20,[10,15,18,30], 'A tarefa exige 10 × 12 × 6 = 720 trabalhador-horas. A primeira etapa realiza 10 × 4 × 6 = 240, restando 480. Cada trabalhador da segunda etapa fornece 6 × 4 = 24 horas; são necessários 480/24 = 20 trabalhadores.', ' trabalhadores', 'hard'),audit:{kind:'workStages46',result:20,total:720,done:240,days:6,hours:4}};
 }
 if(q.family==='M4'&&q.variant===4){
  const statement='Doze trabalhadores realizam uma tarefa em doze dias de seis horas. Em tarefa idêntica, uma equipe de dezoito trabalha seis horas por dia, mas cada trabalhador produz 20% menos por hora. Não há interferência entre trabalhadores e a produtividade fica constante em cada equipe. Em quantos dias a segunda equipe termina a tarefa?';
  q={...q,...numeric(q.topic,statement,10,[8,9,12,15], 'A carga equivalente é 12 × 12 × 6 = 864 horas da produtividade inicial. A segunda equipe realiza por dia 18 × 6 × 0,8 = 86,4 horas equivalentes. Logo, precisa de 864/86,4 = 10 dias. Considerar somente o aumento de trabalhadores daria oito dias e ignoraria a produtividade menor.', ' dias', 'hard'),audit:{kind:'workRate46',result:10,total:864,workers:18,hours:6,rate:.8}};
 }
 if(q.family.startsWith('G')){
  for(const [a,b] of [['. a razão','. A razão'],['. potência','. Potência'],['. saldo','. Saldo'],['. considere','. Considere'],['. força','. Força']])q.statement=q.statement.replaceAll(a,b);
  if(q.family==='G8'){
   q.statement=q.statement.replace('No período observado,','Nas dez horas do período observado,');
   if(q.variant===2)q.statement=q.statement.replace('Qual energia conjunta média seria produzida em 10 horas sob esses valores médios?', 'Qual energia total as duas fontes produziram nas dez horas observadas?');
  }
  if(q.family==='G6'&&q.variant===5)q.options=q.options.map(s=>s.replace('confundindo custo com lucro.', 'pois seu lucro é o total de toneladas multiplicado pelo custo por tonelada.'));
 }
 // Atualizar apenas o fundamento das duas tarefas com raciocínio novo e o nível.
 if(q.audit?.kind==='workStages46'||q.audit?.kind==='workRate46')q.difficultyReview={...q.difficultyReview,skill:q.audit.kind==='workStages46'?'trabalho em duas etapas':'produtividade individual e tamanho da equipe',rationale:'Exige integrar carga de trabalho, jornada, equipe e uma mudança de condição, sem aplicar proporcionalidade isolada.',reviewedOn:'2026-10-14'};
 return q;
}
