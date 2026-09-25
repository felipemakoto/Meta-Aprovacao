-- Etapa 9: exemplos originais gerados com auxílio de IA; revisão humana pendente.
-- Apenas dados fictícios, sem usuários, credenciais ou cópias de provas oficiais.
-- Inserção atômica. IDs estáveis: reexecutar não altera questões ou gabaritos existentes.
-- O gabarito só é inserido para questões criadas NESTA execução, evitando pares divergentes.
with source_data (id, statement, option_a, option_b, option_c, option_d, option_e,
                  subject, topic, difficulty, correct_answer, explanation) as (
  values
  ('d1090000-0000-4000-8000-000000000001', 'Uma mochila custa R$ 80,00. Em uma promoção, a loja oferece 15% de desconto sobre esse preço. Qual é o preço da mochila com o desconto?', 'R$ 12,00', 'R$ 68,00', 'R$ 65,00', 'R$ 72,00', 'R$ 92,00', 'matematica', 'Porcentagem', 'medium', 'B', '15% de 80 é 0,15 × 80 = 12. Subtraindo o desconto do preço original, temos 80 − 12 = R$ 68,00.'),
  ('d1090000-0000-4000-8000-000000000002', 'Três cadernos de mesmo preço custam, juntos, R$ 18,00. Sem descontos, quanto custam cinco desses cadernos?', 'R$ 20,00', 'R$ 24,00', 'R$ 27,00', 'R$ 30,00', 'R$ 36,00', 'matematica', 'Proporcionalidade', 'easy', 'D', 'Cada caderno custa 18 ÷ 3 = R$ 6,00. Portanto, cinco cadernos custam 5 × 6 = R$ 30,00.'),
  ('d1090000-0000-4000-8000-000000000003', 'Leia: “Queria jogar bola, mas precisava terminar a tarefa.” Nesse período, a palavra “mas” introduz uma ideia de:', 'conclusão', 'explicação', 'oposição', 'adição', 'condição', 'portugues', 'Relações de sentido', 'easy', 'C', 'A conjunção “mas” estabelece oposição entre a vontade de jogar bola e a necessidade de terminar a tarefa.'),
  ('d1090000-0000-4000-8000-000000000004', 'Leia: “Lia pegou um livro na biblioteca. Ela o leu em casa.” A palavra “Ela” retoma:', 'Lia', 'um livro', 'a biblioteca', 'a casa', 'a leitura', 'portugues', 'Coesão referencial', 'easy', 'A', 'O pronome “Ela” retoma Lia, a pessoa mencionada na primeira frase. O pronome “o” retoma o livro.'),
  ('d1090000-0000-4000-8000-000000000005', 'Considere a cadeia alimentar: capim → gafanhoto → sapo → cobra. As setas indicam o alimento sendo consumido pelo próximo ser vivo. Qual componente é produtor?', 'gafanhoto', 'sapo', 'cobra', 'todos os consumidores', 'capim', 'ciencias', 'Cadeias alimentares', 'easy', 'E', 'O capim é uma planta que produz matéria orgânica por fotossíntese. Por isso ocupa o nível dos produtores; os animais indicados são consumidores.'),
  ('d1090000-0000-4000-8000-000000000006', 'Uma porção de água líquida é colocada no congelador e se transforma em gelo. Como se chama essa mudança de estado físico?', 'fusão', 'solidificação', 'vaporização', 'condensação', 'sublimação', 'ciencias', 'Estados físicos da matéria', 'easy', 'B', 'A passagem do estado líquido para o sólido é chamada solidificação. A fusão é a transformação inversa, de sólido para líquido.'),
  ('d1090000-0000-4000-8000-000000000007', 'Uma pesquisadora analisa o diário escrito por uma trabalhadora em 1910 para estudar como ela descrevia seu cotidiano. Nesse estudo, o diário é principalmente uma:', 'fonte oral, pois registra experiências', 'fonte material sem linguagem escrita', 'fonte histórica escrita da época estudada', 'prova de que todas as trabalhadoras viviam da mesma forma', 'narrativa sem utilidade para a pesquisa histórica', 'historia', 'Fontes históricas', 'easy', 'C', 'O diário é uma fonte escrita produzida na época estudada. Ele registra uma perspectiva individual e precisa ser contextualizado e comparado com outras fontes; não representa automaticamente todas as trabalhadoras.'),
  ('d1090000-0000-4000-8000-000000000008', 'Na primeira Revolução Industrial, iniciada na Grã-Bretanha no século XVIII, qual transformação caracterizou a produção de muitos bens?', 'Ampliação do uso de máquinas e concentração do trabalho em fábricas.', 'Abandono de todas as máquinas em favor do trabalho exclusivamente manual.', 'Substituição imediata de toda a agricultura por serviços digitais.', 'Fim da divisão de tarefas na produção.', 'Desaparecimento das cidades industriais.', 'historia', 'Revolução Industrial', 'easy', 'A', 'A industrialização ampliou o uso de máquinas e a organização do trabalho em fábricas. A mudança foi gradual e não eliminou imediatamente outras formas de produção.'),
  ('d1090000-0000-4000-8000-000000000009', 'Em um mapa de escala 1:100.000, a distância em linha reta entre dois pontos mede 3 cm. Qual é a distância real correspondente?', '30 m', '300 m', '1 km', '3 km', '30 km', 'geografia', 'Escala cartográfica', 'medium', 'D', 'Cada centímetro no mapa representa 100.000 cm na realidade, equivalentes a 1 km. Assim, 3 cm representam 3 km.'),
  ('d1090000-0000-4000-8000-000000000010', 'Em um mapa com o norte voltado para a parte superior da página, qual direção fica à esquerda de quem observa a página?', 'norte', 'sul', 'leste', 'nordeste', 'oeste', 'geografia', 'Orientação cartográfica', 'easy', 'E', 'Com o norte na parte superior do mapa, o sul fica abaixo, o leste à direita e o oeste à esquerda.')
), inserted_questions as (
  insert into public.questions (
    id, statement, option_a, option_b, option_c, option_d, option_e,
    subject, topic, difficulty, target_exam, status, version
  )
  select id::uuid, statement, option_a, option_b, option_c, option_d, option_e,
         subject, topic, difficulty, 'both', 'draft', 1
  from source_data
  on conflict (id) do nothing
  returning id
)
insert into public.question_answers (question_id, correct_answer, explanation)
select q.id, s.correct_answer, s.explanation
from inserted_questions q join source_data s on s.id::uuid = q.id;
