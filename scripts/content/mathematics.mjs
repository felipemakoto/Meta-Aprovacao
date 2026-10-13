// Problemas autorais; cenários fictícios. Parâmetros e gabaritos calculados.
import { numeric, number, wrongNumbers } from "./bank-utils.mjs";
const q = (topic, statement, result, wrong, explanation, unit = "", audit = {}) => ({ ...numeric(topic, statement, result, wrongNumbers(result, wrong), explanation, unit), audit: { result, ...audit } });
const families = [
  i => {
    const reserve = [120, 150, 180, 210, 240][i], rest = [840, 1080, 1320, 1560, 1800][i], answer = reserve + rest * 3;
    return q("Frações e reconstrução do total", `Uma associação separou R$ ${reserve} de sua arrecadação para manutenção. Aplicou 2/3 do dinheiro restante em materiais; depois dessa aplicação, ainda tinha R$ ${rest}. Um tesoureiro calculou a arrecadação somando a reserva ao triplo da sobra. Qual foi a arrecadação inicial que justifica esse procedimento?`, answer, [reserve + rest, 3 * (reserve + rest), reserve + rest * 1.5, rest * 3], `A sobra corresponde a 1/3 do valor após a reserva. Esse valor era 3 × ${rest} = ${rest * 3}. Somando a parcela inicialmente separada, obtém-se ${number(answer)} reais.`, " reais", { kind: "fraction", reserve, rest });
  },
  i => {
    const start = 200 + i * 100, after = start * 1.2 * 0.8;
    return q("Porcentagens sucessivas", `Um equipamento custava R$ ${start}. Após aumento de 20%, uma campanha aplicou desconto de 20% sobre o preço já aumentado. Uma cliente afirma que as porcentagens se anulam. Qual valor final mostra se essa conclusão é correta?`, after, [start, start * 0.8, start * 1.04, start * 1.4], `O aumento multiplica o preço por 1,20; o desconto, por 0,80. O produto é 0,96, portanto o valor final é ${number(after)} reais, 4% inferior ao inicial. As bases das duas porcentagens são diferentes.`, " reais", { kind: "successive", start });
  },
  i => {
    const price = 180 + i * 40, initial = price * 0.75, discount = 25;
    return q("Porcentagem inversa e comparação", `Uma loja vende um produto por R$ ${initial} após desconto de 25%. Outra anuncia o mesmo preço de tabela, mas oferece abatimento fixo de R$ ${discount}. Sem frete ou outras cobranças, quanto o comprador economiza escolhendo a primeira loja em vez da segunda?`, price - discount - initial, [discount, price - initial, initial - discount, (price - initial) * 0.25], `O preço de tabela é ${initial} ÷ 0,75 = ${price}. Na segunda loja custa ${price - discount}. A diferença para ${initial} é ${number(price - discount - initial)} reais.`, " reais", { kind: "inverseDiscount", price, initial, discount });
  },
  i => {
    const workers = 6 + i * 2, days = 12, newWorkers = workers * 2, hours = 6, newHours = 4;
    return q("Proporcionalidade composta", `${workers} trabalhadores, mantendo a mesma produtividade individual, concluem uma tarefa em ${days} dias de ${hours} horas. Uma segunda equipe tem ${newWorkers} trabalhadores e trabalha ${newHours} horas por dia. Não há interferência entre trabalhadores e a tarefa é idêntica. Quantos dias essa equipe necessita?`, 9, [6, 8, 12, 18], `O trabalho exige ${workers * days * hours} trabalhador-horas. A nova equipe produz ${newWorkers * newHours} trabalhador-horas por dia. A divisão resulta em 9 dias; aumentar trabalhadores reduz o tempo, mas reduzir a jornada o aumenta.`, " dias", { kind: "work", workers, days, newWorkers, hours, newHours });
  },
  i => {
    const fixedA = 24 + i * 4, rateA = 3, fixedB = 8 + i * 2, rateB = 5, equality = (fixedA - fixedB) / 2;
    return q("Equações e escolha de tarifa", `Para percorrer x quilômetros, o serviço A cobra R$ ${fixedA} fixos mais R$ ${rateA} por quilômetro. O B cobra R$ ${fixedB} fixos mais R$ ${rateB} por quilômetro. Uma pessoa quer determinar a distância na qual o A passa a ser mais barato que o B. Qual é a distância de igualdade das duas cobranças?`, equality, [fixedA - fixedB, (fixedA + fixedB) / 2, equality + 2, equality / 2], `Igualando ${fixedA} + 3x = ${fixedB} + 5x, obtém-se 2x = ${fixedA - fixedB}, portanto x = ${equality}. Acima desse valor, a menor taxa por quilômetro torna A mais econômico.`, " km", { kind: "tariff", fixedA, fixedB });
  },
  i => {
    const total = 24 + i * 4, full = 18, reduced = 10, countFull = 8 + i, income = countFull * full + (total - countFull) * reduced;
    return q("Sistemas de equações", `Uma atividade vendeu ${total} ingressos, alguns inteiros de R$ ${full} e outros reduzidos de R$ ${reduced}, arrecadando R$ ${income}. Todos os ingressos foram pagos e não houve cortesias. Qual quantidade de ingressos inteiros satisfaz simultaneamente o total vendido e a arrecadação?`, countFull, [total - countFull, countFull + 2, income / full, (income - total * reduced) / full], `Se todos fossem reduzidos, a arrecadação seria ${total * reduced}. Cada inteiro acrescenta ${full - reduced} reais. Logo (${income} − ${total * reduced}) ÷ ${full - reduced} = ${countFull} inteiros; os demais são reduzidos.`, " ingressos", { kind: "tickets", total, full, reduced, income });
  },
  i => {
    const old = 12 + i * 2, added = 3, average = 7, newAverage = 7.4, score = ((old + added) * newAverage - old * average) / added;
    return q("Média e reconstrução de dados", `A média de ${old} avaliações de um projeto era 7,0. Foram acrescentadas três avaliações iguais entre si, e a nova média passou a 7,4. As avaliações têm o mesmo peso. Qual nota foi atribuída em cada uma das três novas avaliações?`, score, [7.4, 8.2, score + 1, score - 1], `A soma antiga é ${old} × 7 = ${old * 7}; a nova soma é ${old + added} × 7,4 = ${number((old + added) * newAverage)}. A diferença, dividida por três, resulta em ${number(score)}. Não se calcula a nova nota pela média simples de 7 e 7,4.`, " pontos", { kind: "average", old, added, average, newAverage });
  },
  i => {
    const n1 = 20 + i * 5, n2 = 30 + i * 5, p1 = 60, p2 = 80, answer = (n1 * p1 + n2 * p2) / (n1 + n2);
    return q("Média ponderada e percentuais", `Uma turma de ${n1} estudantes teve 60% de presença em uma oficina; outra de ${n2} teve 80%. Um relatório somou os presentes e dividiu pelo total de estudantes das duas turmas, em vez de simplesmente tirar a média dos percentuais. Qual percentual conjunto obteve, aproximadamente, com até quatro casas decimais?`, answer, [70, p1, p2, answer - 5], `Os presentes são ${number(n1 * 0.6)} e ${number(n2 * 0.8)}. A taxa conjunta é (${number(n1 * 0.6)} + ${number(n2 * 0.8)}) ÷ ${n1 + n2} × 100 = ${number(answer)}%. As turmas têm tamanhos diferentes.`, "%", { kind: "weighted", n1, n2, p1, p2 });
  },
  i => {
    const red = 3 + i, blue = 5, total = red + blue, probability = red * (red - 1) / (total * (total - 1)) * 100;
    return q("Probabilidade sem reposição", `Uma caixa contém ${red} fichas vermelhas e ${blue} azuis, indistinguíveis pelo tato. Duas são retiradas ao acaso, sem recolocar a primeira. Para dimensionar uma premiação, calcula-se a chance de ambas serem vermelhas. Qual é essa probabilidade, em porcentagem, aproximadamente?`, probability, [red / total * 100, red * red / (total * total) * 100, (red - 1) / (total - 1) * 100, probability + 10], `A primeira chance é ${red}/${total}; após uma vermelha, restam ${red - 1} vermelhas entre ${total - 1} fichas. Multiplicando as duas probabilidades e convertendo para porcentagem, obtém-se ${number(probability)}%. A retirada modifica a composição da caixa.`, "%", { kind: "probability", red, blue });
  },
  i => {
    const both = 8 + i * 2, a = 28 + i * 3, b = 24 + i * 2, neither = 10 + i, total = a + b - both + neither;
    return q("Conjuntos e interpretação de pesquisa", `Entre ${total} estudantes entrevistados, ${a} participam de robótica e ${b} de teatro. ${both} participam das duas atividades; os demais não participam de nenhuma. A coordenação deseja ofertar uma atividade nova apenas aos que estão fora de ambos os grupos. Quantos estudantes formam esse público?`, neither, [total - a - b, both, a + b - both, neither + both], `Ao somar os grupos, os ${both} participantes de ambos foram contados duas vezes. A união tem ${a} + ${b} − ${both} = ${a + b - both}. Subtraindo esse total dos ${total} entrevistados, restam ${neither}.`, " estudantes", { kind: "sets", total, a, b, both });
  },
  i => {
    const scale = 25000 + i * 5000, cm = 6, factor = 1.25, distance = cm * scale / 100000 * factor;
    return q("Escala e percurso real", `Em um mapa de escala 1:${scale}, dois pontos estão separados por 6 cm em linha reta. O percurso disponível tem comprimento 25% maior que essa distância real em linha reta. Sem alterar a escala, qual distância em quilômetros será percorrida?`, distance, [cm * scale / 100000, distance * 10, distance / 10, (cm + 0.25) * scale / 100000], `Seis centímetros representam ${cm * scale} cm, ou ${number(cm * scale / 100000)} km. O percurso aumenta esse valor em 25%: multiplica-se por 1,25, chegando a ${number(distance)} km. A escala converte distância linear, não área.`, " km", { kind: "scale", scale, cm, factor });
  },
  i => {
    const length = 18 + i * 2, width = 12 + i, path = 1, inner = (length - 2) * (width - 2), answer = length * width - inner;
    return q("Área composta e faixa interna", `Um jardim retangular mede ${length} m por ${width} m. Uma faixa de 1 m de largura contorna todo o jardim pelo lado de dentro, deixando um retângulo central para cultivo. Para comprar revestimento apenas para a faixa, qual área deve ser considerada?`, answer, [2 * (length + width), length * width - (length - 1) * (width - 1), inner, length * width], `A largura é retirada nas duas extremidades de cada dimensão. A área interna é (${length} − 2) × (${width} − 2) = ${inner}. A faixa ocupa ${length * width} − ${inner} = ${answer} m². O perímetro, sozinho, não é a área da faixa.`, " m²", { kind: "border", length, width, path });
  },
  i => {
    const rise = [3, 6, 9, 12, 15][i], run = rise / 3 * 4, hyp = rise / 3 * 5;
    return q("Teorema de Pitágoras e material", `Uma rampa reta liga o piso a uma plataforma ${rise} m acima dele. Sua projeção horizontal mede ${run} m, formando ângulo reto com a altura. Serão instaladas duas barras laterais, cada uma acompanhando todo o comprimento inclinado da rampa. Quantos metros de barra são necessários, sem sobras?`, 2 * hyp, [rise + run, 2 * (rise + run), hyp, 2 * run], `O comprimento inclinado é √(${rise}² + ${run}²) = ${hyp} m pelo teorema de Pitágoras. Como há duas laterais, são necessários 2 × ${hyp} = ${2 * hyp} m. Somar altura e projeção não fornece a hipotenusa.`, " m", { kind: "ramp", rise, run });
  },
  i => {
    const smallHeight = 1.5 + i * 0.25, smallShadow = 2, bigShadow = 12, height = smallHeight * bigShadow / smallShadow;
    return q("Semelhança e medição indireta", `No mesmo instante e sobre terreno plano, uma haste vertical de ${number(smallHeight)} m projeta sombra de 2 m. Uma torre vertical projeta sombra de 12 m. Um técnico considera os raios solares paralelos e calcula a altura da torre por proporcionalidade. Qual altura encontra?`, height, [smallHeight * 12, bigShadow / smallHeight, height - smallHeight, height + smallHeight], `Os triângulos de altura e sombra são semelhantes. A razão altura/sombra é ${number(smallHeight)}/2; assim h/12 = ${number(smallHeight)}/2 e h = ${number(height)} m. As medições precisam ocorrer sob a mesma inclinação solar.`, " m", { kind: "shadow", smallHeight, smallShadow, bigShadow });
  },
  i => {
    const length = 80 + i * 20, width = 50, height = 40, frac = 0.75, liters = length * width * height / 1000 * frac;
    return q("Volume, capacidade e fração", `Um reservatório retangular tem medidas internas de ${length} cm × ${width} cm × ${height} cm. Uma bomba deve enchê-lo até 3/4 de sua capacidade, partindo de vazio. Sabendo que 1 litro equivale a 1.000 cm³, quantos litros a bomba deve transferir?`, liters, [length * width * height / 1000, liters * 1000, liters / 10, liters + 20], `A capacidade é ${length} × ${width} × ${height} = ${length * width * height} cm³, ou ${length * width * height / 1000} litros. Multiplicando por 3/4, resulta em ${liters} litros; a conversão é de volume.`, " L", { kind: "volume", length, width, height, frac });
  },
  i => {
    const d = 24 + i * 6, v1 = 12, v2 = 18, average = 2 * d / (d / v1 + d / v2);
    return q("Velocidade média em trechos iguais", `Uma ciclista percorre ${d} km a 12 km/h e retorna pelo mesmo trajeto, de ${d} km, a 18 km/h. Não há paradas. Um observador usa a média aritmética de 12 e 18, mas a ciclista usa distância total dividida pelo tempo total. Qual velocidade média obtém no percurso completo?`, average, [15, 16, 13.5, 30], `O tempo da ida é ${number(d / v1)} h; o da volta é ${number(d / v2)} h. A velocidade média é ${2 * d} ÷ (${number(d / v1)} + ${number(d / v2)}) = ${number(average)} km/h. Os tempos dos dois trechos não são iguais.`, " km/h", { kind: "speed", d, v1, v2 });
  },
  i => {
    const sides = 6 + i, sum = (sides - 2) * 180, angle = sum / sides;
    return q("Ângulos de polígonos e giro", `Uma praça tem contorno de polígono regular com ${sides} lados. Um desenhista precisa do ângulo interno em cada vértice para produzir o desenho. Ele parte da soma dos ângulos internos, (n − 2) × 180°, e distribui essa soma igualmente. Qual ângulo interno obtém, aproximadamente?`, angle, [360 / sides, sum, 180 / sides, 180 - angle], `A soma vale (${sides} − 2) × 180° = ${sum}°. Como o polígono é regular, cada ângulo interno mede ${sum}/${sides} = ${number(angle)}°. O valor 360°/n é o ângulo externo, não o interno.`, "°", { kind: "polygon", sides });
  },
  i => {
    const n = 4 + i, available = n + 3, combos = available * (available - 1) / 2;
    return q("Contagem e distinção de funções", `Um grupo tem ${available} participantes e precisa escolher duas pessoas para uma comissão sem cargos diferentes. Um aluno contou cada dupla nas duas ordens possíveis. Qual total corrige essa dupla contagem e dá o número de comissões distintas?`, combos, [available * (available - 1), available ** 2, available * 2, available * (available - 1) / 2 + available], `Há ${available} escolhas para a primeira pessoa e ${available - 1} para a segunda. Cada par foi contado duas vezes, pois não existem cargos. Portanto ${available} × ${available - 1} ÷ 2 = ${combos} comissões.`, " comissões", { kind: "combinations", available });
  },
  i => {
    const initial = 8 + i * 2, growth = 3, days = 10 + i, total = days * (2 * initial + (days - 1) * growth) / 2;
    return q("Sequências e soma acumulada", `Uma campanha recolhe ${initial} kg de material no primeiro dia e aumenta o recolhimento em 3 kg a cada dia seguinte. Esse padrão continua por ${days} dias. Para avaliar a campanha, interessa o total acumulado, não apenas o último dia. Quantos quilogramas são recolhidos nesse período?`, total, [initial + (days - 1) * growth, days * initial, days * (initial + days * growth), total + growth * days], `Os valores formam uma progressão aritmética: primeiro ${initial}, último ${initial + (days - 1) * growth}. A soma é ${days} × (${initial} + ${initial + (days - 1) * growth}) ÷ 2 = ${total} kg, obtida pelo pareamento de termos extremos.`, " kg", { kind: "sequence", initial, growth, days });
  },
  i => {
    const samples = [8, 9, 10, 11, 12][i], current = 6, target = 7, added = 4, required = ((samples + added) * target - samples * current) / added;
    return q("Planejamento por média-alvo", `Um sensor registrou ${samples} medições com média de 6 unidades. Para que a média de todas as medições seja 7, serão feitas mais quatro medições iguais entre si. Que valor cada uma das quatro novas medições precisa ter, sem modificar os registros anteriores?`, required, [7, 6, required + 1, (samples + 4) * 7 / 4], `A soma já registrada é ${samples * current}; a soma-alvo é (${samples} + 4) × 7 = ${(samples + added) * target}. A diferença deve ser distribuída pelas quatro novas medições: ${number(required)} unidades em cada uma.`, " unidades", { kind: "targetAverage", samples, current, target, added });
  },
];
export function mathematics() {
  return Array.from({ length: 5 }, (_, variant) => families.map((make, index) => ({ ...make(variant), family: `M${index + 1}`, variant: variant + 1 }))).flat();
}
