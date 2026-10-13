import { numeric, question, wrongNumbers } from "./bank-utils.mjs";

const replace = (q, text, prompt, answer, wrong, explanation) => ({
 ...q, ...question(q.topic, `${text}\n\n${prompt}`, answer, wrong, explanation, q.difficulty),
});
const cases = {
 C2: [
  ['Uma amostra contém areia e sal dissolvido em água. A areia é insolúvel e o sal não evapora nas condições usadas. O objetivo é recolher separadamente os três componentes, em procedimentos ideais sem perdas.',
   'Qual sequência de procedimentos atende ao objetivo?',
   'Filtrar a areia e destilar o filtrado, recolhendo a água condensada e o sal residual.',
   ['Filtrar a areia e evaporar o filtrado em recipiente aberto, recolhendo apenas o resíduo sólido.', 'Filtrar a amostra, considerando que o papel retém também o sal dissolvido.', 'Decantar a areia e recolher o restante como se fosse água pura.', 'Destilar a amostra sem filtrar, considerando o resíduo de areia e sal como dois componentes já separados.'],
   'A filtração separa a areia insolúvel. O filtrado ainda contém água e sal; a destilação permite recolher a água e deixar o sal. Evaporação aberta não recupera a água, e destilar sem filtrar deixa areia e sal juntos no resíduo.'],
  ['Após separar 20 g de areia por filtração sem perdas, obtém-se uma solução homogênea de 30 g de sal em 150 g de água. A solução é dividida em duas partes de mesma massa. Uma delas é evaporada em recipiente aberto até secar, sem decomposição nem perda de sal.',
   'Qual massa de sal fica nesse recipiente?', '15 g', ['30 g', '10 g', '75 g', '90 g'],
   'Cada metade homogênea contém metade do sal: 30/2 = 15 g. A evaporação remove a água dessa metade, mas não o sal, que fica no recipiente.'],
  ['Uma solução homogênea de 30 g de sal em 150 g de água é dividida em duas partes de mesma massa. Uma metade é destilada com coleta completa do vapor condensado. O sal não é volátil nas condições do processo.',
   'Qual massa de água é recolhida na destilação dessa metade?', '75 g', ['150 g', '90 g', '15 g', '60 g'],
   'A divisão da solução homogênea reparte também a água: 150/2 = 75 g em cada metade. O destilado recolhido é a água; os 15 g de sal da metade permanecem no recipiente aquecido.'],
  ['Uma solução de sal não volátil é destilada. Durante o aquecimento intenso, observa-se projeção de pequenas gotas da solução para o tubo ligado ao condensador. O líquido recolhido apresenta sal.',
   'Qual mecanismo explica a contaminação do destilado?', 'Arraste de gotículas da solução para o condensador.',
   ['Evaporação do sal junto com a água, apesar de o sal ser não volátil nessas condições.', 'Retenção da água pelo sal, seguida de passagem apenas do sal pelo tubo.', 'Transformação do sal em água durante a condensação.', 'Separação completa do sal no recipiente aquecido, sem nenhum transporte de solução.'],
   'As gotas carregam sal dissolvido por transporte mecânico. Isso contamina o líquido recolhido sem exigir que o sal vaporize. O problema é o arraste de solução, não uma mudança da volatilidade do sal.'],
  ['Uma amostra de 20 g de areia, 30 g de sal e 150 g de água é filtrada sem perdas. O filtrado homogêneo é dividido ao meio. Uma metade é evaporada até secar, liberando sua água para o ambiente; a outra é destilada, recolhendo toda a sua água. A areia e os dois resíduos de sal são recolhidos secos.',
   'Qual massa total de materiais é efetivamente recolhida ao final?', '125 g', ['200 g', '180 g', '110 g', '95 g'],
   'Recolhem-se 20 g de areia, 15 + 15 = 30 g de sal e 150/2 = 75 g de água: total de 125 g. Os outros 75 g de água foram liberados na evaporação aberta. A conservação da massa inclui essa água no ambiente; não significa recuperação integral.'],
 ],
 C11: [
  ['Uma solução contém 12 g de soluto. Acrescenta-se água até o volume total chegar a 600 mL, sem perda ou adição de soluto.',
   'Qual é a concentração final, em g/L?', '20 g/L', ['60 g/L', '30 g/L', '6 g/L', '80 g/L'],
   'A massa de soluto continua em 12 g e o volume final é 0,600 L. Logo, a concentração é 12/0,600 = 20 g/L. Deve-se usar o volume final em litros, sem alterar a massa de soluto.'],
  ['Uma solução homogênea contém 12 g de soluto em 600 mL. Retiram-se 150 mL dessa solução.',
   'Qual massa de soluto foi retirada?', '3 g', ['12 g', '9 g', '6 g', '1,5 g'],
   'A porção retirada corresponde a 150/600 = 1/4 do volume. Por ser homogênea, ela contém 1/4 da massa de soluto: 12/4 = 3 g.'],
  ['Uma solução homogênea contém 12 g de soluto em 600 mL. Retiram-se 150 mL, sem acrescentar água ou alterar o soluto.',
   'Como fica a concentração da solução que permanece no frasco?',
   'Permanece em 20 g/L, pois restam 9 g em 450 mL.',
   ['Cai para 15 g/L, pois sai um quarto do soluto e o volume é considerado constante.', 'Sobe para 26,7 g/L, pois sai água, mas se considera que todo o soluto permanece.', 'Cai para 5 g/L, pois a porção retirada é confundida com a solução restante.', 'Sobe para 60 g/L, pois a retirada reverte a diluição anterior.'],
   'Retirar 1/4 de uma solução homogênea retira a mesma fração de soluto e de volume. Restam 9 g em 0,450 L: 9/0,450 = 20 g/L. Transferir uma porção não concentra nem dilui a parte restante.'],
  ['Uma porção de 150 mL de solução tem concentração de 20 g/L. Acrescenta-se água até o volume total dessa porção chegar a 300 mL, mantendo todo o soluto.',
   'Qual concentração resulta dessa nova diluição?', '10 g/L', ['20 g/L', '40 g/L', '5 g/L', '15 g/L'],
   'A porção contém 20 × 0,150 = 3 g de soluto. No volume final de 0,300 L, a concentração é 3/0,300 = 10 g/L. Dobrar o volume sem mudar a massa reduz a concentração à metade.'],
  ['Uma solução aquosa contém um soluto não volátil e estável durante o aquecimento. Pretende-se aumentar sua concentração sem acrescentar soluto.',
   'Qual procedimento atende ao objetivo?', 'Evaporar parte da água, mantendo o soluto no recipiente.',
   ['Retirar uma porção homogênea e manter o restante sem alterações.', 'Transferir toda a solução para um recipiente de menor capacidade, sem alterar o volume.', 'Acrescentar água até dobrar o volume.', 'Dividir a solução em frascos iguais e considerar cada porção mais concentrada.'],
   'Ao evaporar parte da água sem perder soluto, diminui-se o volume da solução e aumenta-se a razão massa/volume. Retirada homogênea, transferência ou divisão não mudam essa razão; acrescentar água a diminui.'],
 ],
 G1: [
  ['Em um mapa de escala 1:50.000, uma trilha mede 8 cm. Despreze distorções da projeção.', 'Qual é o comprimento real da trilha?', '4 km', ['0,4 km', '40 km', '2 km', '8 km'], 'O comprimento real é 8 × 50.000 = 400.000 cm. Como 100.000 cm correspondem a 1 km, a trilha tem 4 km.'],
  ['Um terreno quadrado tem lado de 2 cm em um mapa de escala 1:50.000. Despreze distorções da projeção.', 'Qual área real corresponde ao terreno?', '1 km²', ['2 km²', '4 km²', '0,5 km²', '0,25 km²'], 'Cada lado corresponde a 2 × 50.000 = 100.000 cm, ou 1 km. A área é 1 × 1 = 1 km²; o fator de conversão linear deve ser aplicado aos dois lados.'],
  ['Uma trilha de 4 km será desenhada em um mapa de escala 1:25.000. Despreze distorções da projeção.', 'Qual será seu comprimento no papel?', '16 cm', ['8 cm', '4 cm', '32 cm', '1,6 cm'], 'Quatro quilômetros correspondem a 400.000 cm. Dividindo pelo denominador da escala: 400.000/25.000 = 16 cm no papel.'],
  ['Dois mapas representam a mesma região nas escalas 1:50.000 e 1:25.000.', 'Qual comparação entre as escalas está correta?',
   'A escala 1:25.000 é maior e permite mais detalhes, usando maior espaço no papel para a mesma região.',
   ['A escala 1:50.000 é maior porque seu denominador é maior.', 'A escala 1:25.000 reduz pela metade as distâncias no papel para a mesma região.', 'As duas escalas mostram a mesma distância no papel, pois ambas começam por 1.', 'A escala 1:50.000 permite mais detalhes porque representa mais território em cada centímetro.'],
   'Escala é uma razão: 1/25.000 é maior que 1/50.000. Para a mesma distância real, o primeiro mapa usa o dobro do comprimento no papel, permitindo representar mais detalhes.'],
  ['Um mapa de escala 1:60.000 é ampliado proporcionalmente. Após a ampliação, a área no papel de um mesmo terreno quadrado fica quatro vezes maior.', 'Qual é a escala da cópia ampliada?', '1:30.000', ['1:15.000', '1:120.000', '1:240.000', '1:60.000'], 'Se a área no papel quadruplica, cada comprimento dobra. A distância real permanece igual, então o denominador da escala é dividido por dois: 60.000/2 = 30.000. Dividir por quatro confundiria área com comprimento.'],
 ],
 G16: [
  ['A cidade A usa UTC−3 e B, UTC+1. Um voo sai de A às 22h de segunda-feira e dura oito horas. Não há mudança sazonal de fuso.', 'Em que horário local chega a B?', '10h de terça-feira.', ['6h de terça-feira.', '2h de terça-feira.', '10h de segunda-feira.', '18h de terça-feira.'], 'A partida equivale a 1h UTC de terça-feira. Oito horas depois são 9h UTC, ou 10h no fuso UTC+1. A diferença de fuso se soma à duração ao converter os horários locais.'],
  ['Um voo chega a B (UTC+1) às 10h de terça-feira. Após duas horas de conexão, outro voo de quatro horas segue para C (UTC+5). Os fusos não mudam.', 'Em que horário local chega a C?', '20h de terça-feira.', ['16h de terça-feira.', '12h de terça-feira.', '0h de quarta-feira.', '18h de terça-feira.'], 'A saída de B é às 12h locais e a chegada seria às 16h no relógio de B. C está quatro horas adiante: 16 + 4 = 20h de terça-feira.'],
  ['Uma viagem tem um voo de oito horas, conexão de duas horas e outro voo de quatro horas.', 'Qual é a duração da viagem, incluindo a conexão?', '14 horas', ['12 horas', '10 horas', '16 horas', '18 horas'], 'Somam-se as durações: 8 + 2 + 4 = 14 horas. Não é necessário saber os fusos, pois os três valores já expressam intervalos de tempo, não leituras de relógios locais.'],
  ['Uma pessoa sai de A (UTC−3) às 22h de segunda-feira e chega a C (UTC+5) às 20h de terça-feira. Os fusos permanecem constantes.', 'Qual foi a duração real entre saída e chegada?', '14 horas', ['22 horas', '30 horas', '6 horas', '8 horas'], 'Os horários locais aparentam um intervalo de 22 horas, mas C está oito horas adiante de A. Ao converter para uma referência comum, a duração é 22 − 8 = 14 horas. É necessário considerar também a mudança de data.'],
  ['Uma viagem tem chegada prevista a C às 20h de terça-feira. A conexão sofre um atraso adicional de três horas e o voo seguinte mantém sua duração.', 'Qual é o novo horário previsto de chegada a C?', '23h de terça-feira.', ['17h de terça-feira.', '20h de terça-feira.', '1h de quarta-feira.', '3h de quarta-feira.'], 'O atraso adicional desloca a chegada em três horas: 20 + 3 = 23h de terça-feira. Os dois horários já se referem à mesma cidade, então não é preciso aplicar diferença de fuso.'],
 ],
};

export function revise45(rows) {
 return rows.map(original => {
  let q = {...original};
  const task = cases[q.family]?.[q.variant - 1];
  if (task) q = replace(q, ...task);
  if (q.family === 'G2' && q.variant === 5) q = replace(q,
   'A região A tem 600.000 habitantes em 3.000 km². Uma parcela que ocupa 20% da área reúne 80% dos habitantes.',
   'Qual é a densidade demográfica na área restante?', '50 hab./km²', ['200 hab./km²', '800 hab./km²', '250 hab./km²', '40 hab./km²'],
   'Na parte restante vivem 20% de 600.000 = 120.000 habitantes, em 80% de 3.000 = 2.400 km². A densidade é 120.000/2.400 = 50 hab./km². A concentração de um grupo não descreve a ocupação do território restante.');
  if (q.family === 'G6' && q.variant === 5) q = replace(q,
   'A propriedade A produz 12.000 t em 3.000 ha; B produz 10.000 t em 2.000 ha. Ambas vendem a R$ 700/t. Os custos totais por tonelada são R$ 500 em A e R$ 650 em B.',
   'Qual comparação distingue produtividade e lucro total nesse período?',
   'B tem maior produtividade, mas A tem maior lucro total: R$ 2,4 milhões contra R$ 0,5 milhão.',
   ['B tem maior produtividade e maior lucro total, pois produz mais por hectare.', 'A tem maior produtividade e maior lucro total, pois produz mais toneladas.', 'As duas têm o mesmo lucro por tonelada, pois o preço de venda é igual.', 'A tem maior lucro total, mas B tem lucro de R$ 6,5 milhões, confundindo custo com lucro.'],
   'A produtividade é 4 t/ha em A e 5 t/ha em B. O lucro é receita menos custo: A = 12.000 × (700 − 500) = 2.400.000; B = 10.000 × (700 − 650) = 500.000. Maior rendimento por área não garante maior lucro.');
  if (q.family === 'G18' && q.variant === 5) q = replace(q,
   'Uma região tem 12.000 ocupados e 3.000 desocupados. Pessoas desocupadas conseguirão trabalho, sem entradas ou saídas da força de trabalho.',
   'Quantas precisam conseguir trabalho para a taxa de desocupação cair para 10%?', '1.500 pessoas', ['300 pessoas', '1.200 pessoas', '2.000 pessoas', '2.700 pessoas'],
   'A força de trabalho continua em 15.000. Para uma taxa de 10%, devem restar 1.500 desocupados. Assim, 3.000 − 1.500 = 1.500 precisam conseguir trabalho; mudar de desocupado para ocupado não altera o denominador.');
  if (q.family === 'C6') q.explanation = q.explanation.replace('outras comparações alteram mais de uma variável.', 'Entre as alternativas, as demais comparações não isolam a intensidade: A/C varia gás carbônico; B/C e C/D variam gás carbônico e luz; D sozinho não oferece comparação.');
  if (q.family === 'C12' && q.variant === 3) q = replace(q,
   'Após reagirem 5 g de bicarbonato de sódio com 25 g de solução ácida, um frasco aberto tem 28 g de conteúdo. Em seguida, saem mais 0,5 g de gás, sem outras trocas de matéria.',
   'Qual massa de conteúdo será medida após essa saída adicional?', '27,5 g', ['28,5 g', '27 g', '29,5 g', '26,5 g'],
   'A saída adicional reduz a massa de 28 para 27,5 g: 28 − 0,5 = 27,5. A perda total é de 2,5 g de gás, compatível com a quantidade de bicarbonato informada; o gás que saiu continua existindo fora do frasco.');
  if (q.family === 'C5' && q.variant === 5) q.statement = q.statement.replace('recipiente inicialmente frio', 'recipiente inicialmente a 15 °C');
  if (q.family === 'C10') q.statement = q.statement.replace('Considere a parede celular íntegra e despreze transporte ativo no período.', 'Considere a parede celular íntegra, pressões hidrostáticas inicialmente iguais e ausência de transporte ativo no período.');
  if (q.family === 'C8') q.statement = q.statement.replace('com segregação independente dos gametas e sem diferença de viabilidade entre genótipos. O modelo não pretende explicar toda a herança humana.', 'com segregação dos alelos, fecundações independentes e igual viabilidade dos genótipos.');
  if (q.family === 'C14') q.statement = q.statement.replace(' Não há informação suficiente para calcular amplitudes ou energias transmitidas.', '');
  if (q.family === 'C18') q.statement = q.statement.replace('uma população passa de', 'em intervalos de mesma duração, uma população passa de').replace(' O ambiente continua sendo monitorado, pois sua capacidade não é considerada imutável.', '');
  if (q.family === 'C20') q.statement = q.statement.replace('mesma temperatura inicial, são colocadas no mesmo ambiente.', 'temperatura inicial de 0 °C, são colocadas em um ambiente a 25 °C.');
  q.statement = q.statement.replace(/^(?:Situação experimental fictícia:|Dados fictícios elaborados para interpretação geográfica:|Texto autoral para esta atividade:|Síntese didática autoral; não é transcrição de documento histórico:)\n/, '');
  q.statement = q.statement.replaceAll('Para este exercício, ', '').replaceAll('Neste exercício, ', '').replaceAll('As perdas úteis', 'As perdas para a finalidade considerada');
  q.statement = q.statement.replace('Para avaliar a campanha, interessa o total acumulado, não apenas o último dia. ', '');
  q.explanation = q.explanation.replaceAll('As perdas úteis', 'As perdas para a finalidade considerada').replaceAll('A síntese destaca', 'O contexto apresenta');
  q.options = q.options.map(option => option.replace('função de desumanização e legitimidade da violência', 'função de desumanização e legitimação da violência'));
  return q;
 });
}

export function plausibleMath(q) {
 if (q.family === 'M6') {
  const {total,full,reduced,income} = q.audit;
  const result = (income - total * reduced) / (full - reduced);
  const wrong = [total - result, result + 2, result - 2, Math.floor((income - total * reduced) / full)];
  const row = numeric(q.topic, q.statement, result, wrong, q.explanation, ' ingressos', q.difficulty);
  return {...q, ...row};
 }
 if (q.family === 'M7') {
  const {result,old,added,average,newAverage} = q.audit;
  const wrong = [newAverage, (average + newAverage) / 2, average + (newAverage - average) * old / added, result - 0.6];
  return {...q, ...numeric(q.topic, q.statement, result, wrong, q.explanation, ' pontos', q.difficulty)};
 }
 if (q.audit?.kind === 'sets') {
  const a=q.audit, candidates=[a.total-a.a-a.b,a.both,a.a+a.b-a.both,a.result+a.both,0,1].filter(n=>n>=0&&n<=a.total);
  return {...q,...numeric(q.topic,q.statement,a.result,wrongNumbers(a.result,candidates),q.explanation,' estudantes',q.difficulty)};
 }
 if (q.audit?.kind === 'volume') {
  const a=q.audit, capacity=a.length*a.width*a.height/1000;
  return {...q,...numeric(q.topic,q.statement,a.result,[capacity,capacity/2,capacity/4,a.result+20],q.explanation,' L',q.difficulty)};
 }
 return q;
}
