import assert from 'node:assert/strict';
// Julgamento editorial explícito por tarefa; não é uma medida psicométrica.
// Ordem de cada linha: variantes 1, 2, 3, 4 e 5. E=fácil, M=média, H=difícil.
const profiles = {
 M: ['MMMMM','EMEEM','MMMMM','MMMMM','EMEEM','MEMMM','MMMMM','MEMMM','MMMMH','MMMMM','MMMMM','MHMMM','MHMMM','MMMMM','MMMME','HMHHM','MEMMM','MMMMM','HMMHM','MMMMM'],
 P: ['MEMMM','HMMMM','HMMMM','HMMMM','MMMEM','EMMMM','HMMMM','MMMMM','HMHMH','HMMMM','MEMMM','MMMMM','MEMMM','MEMMM','MMMMM','MEMMM','MEMMM','MMMMM','HMMMM','EEEMM'],
 C: ['MMEMM','MEEMM','HMMMM','MEMMM','MEMMM','MMMEM','MMM EM'.replace(' ',''),'EHMME','MEMMM','MMMMH','EMMMM','MEEMM','MMEEM','MEMME','MEMMM','MMMMM','MEMMM','MEMMM','MMMMM','MMMME'],
 H: ['EMMMM','MMMMM','MMMMM','MMMMM','MMMMM','MMMMM','MMMMM','MMMMM','MMMME','MMMMM','MMMMM','MMMMM','MMMMM','MMMME','MMMMM','MMMMM','MMMMM','MMMMM','MMMMM','MMMMM'],
 G: ['EMMEH','EMMMM','MMMMM','MEMMM','MEMMM','MEEMH','EMMMM','EMMMM','MMMMM','MMMMM','EMMMM','MEMMM','EEMEM','EMMMM','MMMMM','MMEME','EEMMM','EMMMM','MMMMM','EMEMM'],
};
const level = {E:'easy', M:'medium', H:'hard'};
const reasons = {
 easy: 'Leitura de informação explícita ou cálculo direto, sem integrar várias condições independentes.',
 medium: 'Exige aplicar um conceito, relacionar informações, distinguir bases ou etapas, ou avaliar uma condição do modelo.',
 hard: 'Exige coordenar etapas dependentes, comparação não imediata, probabilidade condicionada ou análise de limites e hipóteses.',
};
const mathSkills = [
 ['reconstrução do total','identificação da reserva','reconstrução do total','reconstrução do total','identificação da base fracionária'],
 ['porcentagens sucessivas','recuperação do preço inicial','porcentagens sucessivas','porcentagens sucessivas','reversão de aumento percentual'],
 ['comparação de descontos','determinação de taxa','comparação de descontos','comparação de descontos','comparação por desigualdade'],
 ['proporcionalidade composta','dimensionamento de equipe','proporcionalidade composta','proporcionalidade composta','compensação entre fatores'],
 ['igualdade de tarifas','restrição de orçamento','igualdade de tarifas','igualdade de tarifas','comparação de custos por distância'],
 ['sistema de contagem e arrecadação','composição da arrecadação','sistema de contagem e arrecadação','sistema de contagem e arrecadação','verificação de consistência dos dados'],
 ['recuperação de nota pela média','média de grupos com pesos diferentes','recuperação de nota pela média','recuperação de nota pela média','viabilidade de uma meta na escala de notas'],
 ['percentual ponderado','contagem de presentes','percentual ponderado','percentual ponderado','condição de igualdade dos pesos'],
 ['probabilidade sem reposição','probabilidade condicionada','probabilidade sem reposição','probabilidade sem reposição','comparação com e sem reposição'],
 ['complemento da união','reconstrução da interseção','complemento da união','complemento da união','correção de dupla contagem'],
 ['escala e acréscimo de percurso','acréscimo percentual sobre distância','escala e acréscimo de percurso','escala e acréscimo de percurso','efeito de ampliação sobre a escala'],
 ['área de faixa interna','área e custo','área de faixa interna','área de faixa interna','verificação das dimensões centrais'],
 ['comprimento inclinado e duas laterais','comprimento e quantidade de peças','comprimento inclinado e duas laterais','comprimento inclinado e duas laterais','avaliação de erro na hipotenusa'],
 ['altura por semelhança','sombra por semelhança','altura por semelhança','altura por semelhança','hipóteses da semelhança'],
 ['volume e fração da capacidade','reposição até uma meta de volume','volume e fração da capacidade','volume e fração da capacidade','efeito de mudar uma dimensão'],
 ['velocidade média com tempos diferentes','duração em minutos','velocidade média com tempos iguais','velocidade média incluindo parada','ponderação pelo tempo'],
 ['ângulo interno','número de lados pelo giro externo','ângulo interno','ângulo interno','distinção entre ângulo interno e externo'],
 ['comissões sem cargos','escolhas com cargos distintos','comissões sem cargos','comissões sem cargos','justificativa da divisão por dois'],
 ['soma de sequência','determinação do dia de uma meta','soma com crescimento multiplicativo','reconstrução do primeiro termo','número de aumentos entre dois dias'],
 ['média-alvo','média de duas séries','média-alvo','média-alvo','pesos na combinação de médias'],
];
const otherSkills = {
 P: ['interpretação e inferência','relação linguística no contexto','síntese sem extrapolação','reescrita e análise gramatical','procedimento de verificação ou revisão'],
 C: ['aplicação de conceito e dados','relação quantitativa ou controle','mudança de condição ou interpretação','análise de mecanismo e hipótese','aplicação e limites do modelo'],
 H: ['relações históricas','instituições e contexto','interpretação de fontes e processos','mudança e continuidade','aplicação a outro caso ou cronologia'],
 G: ['indicador ou relação espacial','cálculo e componentes','comparação de dados','limites de interpretação','aplicação ou planejamento'],
};
export function classify45(q) {
 const prefix = q.family[0], index = Number(q.family.slice(1)) - 1;
 const profile = profiles[prefix]?.[index];
 assert.ok(profile && profile.length === 5, q.family);
 const difficulty = level[profile[q.variant - 1]];
 assert.ok(difficulty);
 const specific = {
 C2:['planejamento de separação','partição de solução homogênea','massa de água destilada','arraste mecânico de gotículas','recuperação e conservação de massa'],
 C11:['concentração após diluição','massa em uma alíquota','invariância da concentração na retirada','segunda diluição','concentração por evaporação'],
 G1:['distância em escala','área em escala','representação no papel','comparação entre escalas','ampliação de área e comprimento'],
 G16:['chegada com mudança de data e fuso','conexão e conversão de fuso','soma de durações','duração a partir de horários locais','efeito de atraso'],
 };
 const skill = prefix === 'M' ? mathSkills[index][q.variant - 1] : (specific[q.family] ?? otherSkills[prefix])[q.variant - 1];
 return {...q, difficulty, difficultyReview: {
  method: 'Classificação editorial por tarefa; referência ETEC 2026 e IFSP integrado edital 211/2025, sem dados de desempenho.',
  skill, rationale: reasons[difficulty], reviewedOn: '2026-10-13', scope: prefix === 'M' || prefix === 'P' ? 'ETEC/IFSP' : 'ETEC',
 }};
}
