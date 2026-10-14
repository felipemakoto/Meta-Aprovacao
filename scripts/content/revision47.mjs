// Conferência final de precisão e resposta única, antes de distribuir as letras.
// A alternativa correta continua na posição zero; não se alteram os resultados.
export function revise47(original) {
  const q = { ...original, options: [...original.options] };

  if (q.family === 'C13' && q.variant === 2) {
    q.statement = q.statement.replace(
      'Que área seria necessária para limitar a pressão média a 5.000 Pa?',
      'Qual é a área mínima necessária para manter a pressão média em no máximo 5.000 Pa?',
    );
    q.explanation = 'Para manter F/A ≤ 5.000 Pa, a área deve satisfazer A ≥ 600/5.000 = 0,12 m². Essa é a área mínima, quatro vezes a do primeiro apoio. Uma área maior também reduz a pressão abaixo do limite, mas não é a mínima pedida.';
  }

  if (q.family === 'M10' && q.variant === 3) {
    q.options = q.options.map(option => option.replace('1 estudantes', '1 estudante'));
  }

  if (q.family === 'C6' && q.variant === 1) {
    q.explanation = 'A e B diferem na intensidade luminosa e mantêm comparáveis as outras condições descritas. A/C varia a disponibilidade de gás carbônico; B/C e C/D variam gás carbônico e luz. D sozinho não oferece uma comparação. Entre as alternativas, apenas A/B permite avaliar a intensidade luminosa mantendo as demais condições comparáveis.';
  }

  if (q.family === 'C18' && q.variant === 5) {
    q.explanation = 'Medir alimento disponível por indivíduo e taxas de nascimento e morte em cada intervalo permite investigar como os recursos e o balanço demográfico se relacionam com a desaceleração. As demais alternativas descrevem situações de nascimento e mortalidade, sem propor essas medições adicionais; não devem ser presumidas apenas a partir do total de indivíduos.';
  }

  if (q.family === 'M4' && q.variant === 5) {
    q.statement = q.statement.replace(
      'Duas equipes realizam a mesma tarefa com produtividade individual constante.',
      'Duas equipes realizam a mesma tarefa, mantendo a mesma produtividade por trabalhador e por hora nas duas equipes.',
    );
    q.explanation = 'Com a mesma produtividade por trabalhador e por hora, dobrar N e dividir h por dois mantém N × h e a produção diária. Para a mesma tarefa, o número de dias permanece igual. Os efeitos do número de trabalhadores e da jornada precisam ser considerados simultaneamente.';
  }

  if (q.family === 'M16') {
    const scalar = text => text
      .replaceAll('Velocidade média', 'Velocidade escalar média')
      .replaceAll('velocidade média', 'velocidade escalar média');
    q.topic = 'Velocidade escalar média e tempo de percurso';
    q.statement = scalar(q.statement);
    q.explanation = scalar(q.explanation);
    q.options = q.options.map(scalar);
    if (q.difficultyReview) {
      q.difficultyReview = { ...q.difficultyReview, skill: scalar(q.difficultyReview.skill) };
    }
  }

  if (q.family === 'P12' && q.variant === 4) {
    q.options[0] = 'Somente os moradores que solicitaram vistoria receberão resposta.';
    q.explanation = 'Somente explicita que a resposta se destina exclusivamente ao grupo de moradores solicitantes, preservando a restrição indicada. A oração relativa sem vírgulas identifica esse grupo. As demais alternativas abrangem todos os moradores ou alteram a condição para receber resposta.';
  }

  if (q.family === 'G19' && q.variant === 3) {
    q.explanation = 'A duração média das viagens periféricas cai de 50 para 35 minutos, uma redução de 15 minutos na média. Mantidas as 400 viagens, a soma de seus tempos diminui 400 × 15 = 6.000 minutos. Isso não significa que cada viagem individual tenha economizado exatamente 15 minutos.';
  }

  if (q.family === 'G7' && q.variant === 4) {
    q.explanation = 'A perda líquida de 150 km² de floresta e o aumento líquido de 100 km² impermeabilizados são saldos agregados. Eles não identificam as transições de cada área: ganhos e perdas locais podem se compensar dentro desses saldos. Mapas de transição são necessários para verificar os destinos e as origens das mudanças.';
  }

  return q;
}
