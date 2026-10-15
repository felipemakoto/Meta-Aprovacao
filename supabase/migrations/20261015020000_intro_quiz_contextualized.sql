begin;
-- Retire the former introductory catalog without editing its questions or snapshots.
create temporary table intro_previous(position smallint,id uuid) on commit drop;
insert into intro_previous values (1,'aa520000-0000-4000-8000-000000000001'::uuid),(2,'aa520000-0000-4000-8000-000000000002'::uuid),(3,'aa520000-0000-4000-8000-000000000003'::uuid),(4,'aa520000-0000-4000-8000-000000000004'::uuid),(5,'aa520000-0000-4000-8000-000000000005'::uuid),(6,'aa520000-0000-4000-8000-000000000006'::uuid),(7,'aa520000-0000-4000-8000-000000000007'::uuid),(8,'aa520000-0000-4000-8000-000000000008'::uuid),(9,'aa520000-0000-4000-8000-000000000009'::uuid),(10,'aa520000-0000-4000-8000-000000000010'::uuid);
lock table private.intro_quiz_catalog in share row exclusive mode;
do $$begin
 if (select count(*) from private.intro_quiz_catalog)<>10 or exists(
 select 1 from intro_previous p full join private.intro_quiz_catalog c on c.position=p.position
 where c.question_id is distinct from p.id) then raise exception 'intro_catalog_conflict';end if;
end$$;
create temporary table intro_content_v2(position smallint,id uuid,subject text,topic text,difficulty text,target_exam text,statement text,options jsonb,correct_answer text,explanation text) on commit drop;
insert into intro_content_v2 values
(1,'aa530000-0000-4000-8000-000000000001','matematica','Porcentagem','easy','both','Uma papelaria vende uma mochila por R$ 80,00. Durante uma promoção, quem paga à vista recebe 15% de desconto sobre esse preço. Marina escolheu pagar à vista. Quanto ela deverá pagar pela mochila?','["R$ 12,00","R$ 68,00","R$ 65,00","R$ 72,00","R$ 92,00"]'::jsonb,'B','O desconto é 15/100 × 80 = R$ 12,00. Esse é o valor abatido, não o preço final. Portanto, Marina paga 80 − 12 = R$ 68,00.'),
(2,'aa530000-0000-4000-8000-000000000002','matematica','Equação do primeiro grau','medium','both','Uma turma organiza uma visita técnica. O aluguel do ônibus custa R$ 240,00, independentemente do número de participantes, e o ingresso custa R$ 12,00 por aluno. O custo total, incluindo apenas ônibus e ingressos, será de R$ 720,00. Quantos alunos participarão da visita?','["20 alunos","30 alunos","40 alunos","60 alunos","80 alunos"]'::jsonb,'C','Se n é o número de alunos, 240 + 12n = 720. Subtraindo o custo fixo, restam R$ 480,00 para ingressos. Assim, n = 480 ÷ 12 = 40 alunos. Conferindo: 240 + 12 × 40 = 720.'),
(3,'aa530000-0000-4000-8000-000000000003','portugues','Interpretação de texto','easy','both','Leia o aviso da escola:

“A partir deste mês, às quartas-feiras, a biblioteca fechará às 19h, duas horas mais tarde que nos outros dias. A mudança atende ao pedido de alunos que têm aulas à tarde e querem consultar livros depois das aulas.”

Segundo o aviso, qual é a principal finalidade da mudança?','["Concentrar os empréstimos de livros nos outros dias da semana.","Substituir as aulas da tarde por atividades na biblioteca.","Abrir a biblioteca duas horas mais cedo nas quartas-feiras.","Permitir a consulta de livros após as aulas da tarde.","Reservar o atendimento das quartas-feiras aos professores."]'::jsonb,'D','O aviso relaciona a ampliação do horário ao pedido dos alunos que têm aulas à tarde. O objetivo é permitir que eles consultem livros depois das aulas. Não há informação de mudança nas aulas ou de atendimento exclusivo.'),
(4,'aa530000-0000-4000-8000-000000000004','portugues','Relações de sentido','medium','both','Leia o trecho:

“Embora a viagem de ônibus fosse curta, Júlia sempre levava um livro. Entre uma parada e outra, lia algumas páginas. No fim do mês, percebeu que aquelas leituras breves já somavam uma história inteira.”

Na primeira frase, a palavra “embora” introduz uma ideia de:','["Concessão: a curta duração da viagem não impedia a leitura.","Causa: a viagem era curta porque Júlia levava um livro.","Condição: Júlia só viajava quando podia levar um livro.","Consequência: levar um livro tornava a viagem mais curta.","Finalidade: a viagem era feita para que Júlia pudesse ler."]'::jsonb,'A','“Embora” introduz uma concessão: um fato que poderia dificultar outro não o impede. Apesar de a viagem ser curta, Júlia mantinha o hábito de levar um livro e ler. A duração da viagem não é causa, finalidade ou consequência da leitura.'),
(5,'aa530000-0000-4000-8000-000000000005','ciencias','Evaporação e investigação','easy','etec','Dois panos iguais, molhados com a mesma quantidade de água, foram colocados no mesmo ambiente. Um ficou diante de um ventilador; o outro, afastado dele. A temperatura era a mesma nos dois locais. Após uma hora, o primeiro estava mais seco. Esse resultado indica que a circulação de ar:','["Aumenta a quantidade de água absorvida pelo tecido.","Favorece a condensação do vapor de água no tecido.","Reduz a evaporação ao manter o ar úmido perto do pano.","É indispensável para que ocorra qualquer evaporação.","Favorece a evaporação ao renovar o ar próximo ao tecido."]'::jsonb,'E','O movimento do ar remove parte do vapor acumulado próximo ao tecido e favorece a evaporação. Panos, quantidade inicial de água e temperatura foram mantidos iguais para comparar o efeito da ventilação. Água também evapora sem ventilador; ele não é uma condição indispensável.'),
(6,'aa530000-0000-4000-8000-000000000006','ciencias','Equilíbrio da cadeia alimentar','medium','etec','Em uma área de campo, foi registrada a cadeia alimentar capim → gafanhoto → sapo → cobra. As setas indicam a passagem de alimento para o consumidor. Após uma queda na população de cobras, qual tendência é esperada em uma primeira resposta das populações, considerando apenas as relações alimentares representadas?','["Redução dos sapos e dos gafanhotos.","Aumento dos sapos e redução dos gafanhotos.","Aumento dos sapos e dos gafanhotos.","Redução dos sapos e aumento dos gafanhotos.","Manutenção dos sapos e aumento dos gafanhotos."]'::jsonb,'B','Com menos cobras, a pressão de predação sobre os sapos diminui. O aumento dos sapos pode intensificar o consumo de gafanhotos e reduzir essa população. Trata-se de uma tendência inicial no modelo simplificado apresentado, não de uma previsão que ignore outros fatores de um ecossistema real.'),
(7,'aa530000-0000-4000-8000-000000000007','historia','Análise de fontes históricas','easy','etec','Para estudar uma praça, uma turma comparou duas fotografias do mesmo local. Na imagem de 1920, aparecem uma via de terra e charretes. Na imagem atual, aparecem pavimentação e ônibus. Qual conclusão pode ser sustentada apenas pelos elementos visíveis nessas fotografias?','["Todos os moradores da cidade usavam charretes em 1920.","A chegada dos ônibus foi a única causa do crescimento da cidade.","O espaço registrado apresenta mudanças no transporte e na pavimentação.","Toda a população passou a ter renda maior no período entre as imagens.","Nenhuma rua da cidade era pavimentada quando a primeira foto foi feita."]'::jsonb,'C','As duas imagens permitem observar mudanças no transporte e na pavimentação daquele espaço. Elas não bastam para concluir como vivia toda a população, determinar sua renda ou estabelecer uma causa única para o crescimento da cidade.'),
(8,'aa530000-0000-4000-8000-000000000008','historia','Economia açucareira colonial','medium','etec','Em muitos engenhos do Nordeste colonial, a cana-de-açúcar era cultivada em grandes propriedades. A produção utilizava amplamente trabalho de pessoas escravizadas e parte importante do açúcar era vendida para a Europa. A organização econômica descrita favorecia:','["A distribuição da terra em pequenas propriedades de trabalhadores livres.","A produção de alimentos diversificados destinada principalmente aos moradores locais.","A remuneração salarial como principal forma de trabalho nos engenhos.","A concentração da terra e a produção voltada ao mercado externo.","A independência da produção açucareira em relação ao comércio com a Europa."]'::jsonb,'D','Grandes propriedades favoreciam a concentração da terra. A exportação de açúcar vinculava a produção ao mercado externo. O trabalho escravizado era parte central dessa estrutura, que não se baseava na distribuição da terra, no predomínio do salário ou na independência do comércio europeu.'),
(9,'aa530000-0000-4000-8000-000000000009','geografia','Escala cartográfica','easy','etec','Em um mapa de escala 1:50.000, a escola e o posto de saúde estão separados por 2 cm. Uma turma usará essa informação para estimar a distância em linha reta entre os dois locais. Considerando a escala indicada, essa distância real corresponde a:','["1 km","100 m","500 m","2 km","10 km"]'::jsonb,'A','Na escala 1:50.000, 1 cm no mapa corresponde a 50.000 cm na realidade. Para 2 cm: 2 × 50.000 = 100.000 cm. Dividindo por 100, são 1.000 m, equivalentes a 1 km. A medida é em linha reta, não a distância de um trajeto pelas ruas.'),
(10,'aa530000-0000-4000-8000-000000000010','geografia','Urbanização e escoamento','medium','etec','Dois bairros com declividade semelhante receberam a mesma quantidade de chuva. O bairro A possui praças e áreas de solo exposto. No bairro B, predominam asfalto e construções, e foi observado maior escoamento de água pela superfície. Qual relação entre ocupação do solo e água explica melhor essa diferença?','["A vegetação do bairro A impede qualquer escoamento superficial.","O asfalto do bairro B permite maior infiltração que o solo exposto.","A impermeabilização do bairro B reduz a água que escoa pela superfície.","O maior escoamento prova que a quantidade de chuva foi maior no bairro B.","A menor infiltração no bairro B favorece o escoamento superficial."]'::jsonb,'E','Asfalto e construções impermeabilizam parte do solo, reduzindo a infiltração e favorecendo o escoamento superficial. A comparação informa chuva igual e declividade semelhante. Vegetação e solo exposto podem favorecer a infiltração, mas não eliminam todo escoamento.');
insert into public.questions(id,subject,topic,difficulty,target_exam,statement,option_a,option_b,option_c,option_d,option_e,status,version)
select id,subject,topic,difficulty,target_exam,statement,options->>0,options->>1,options->>2,options->>3,options->>4,'reviewed',1 from intro_content_v2;
insert into public.question_answers(question_id,correct_answer,explanation) select id,correct_answer,explanation from intro_content_v2;
update private.intro_quiz_catalog c set question_id=n.id from intro_content_v2 n where n.position=c.position;

create or replace function public.start_guest_quiz(p_token_hash text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare attempt_uuid uuid; inserted_count integer;
begin
 if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$' then raise exception 'invalid_token_hash' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_token_hash,0));
 if exists(select 1 from public.guest_quiz_attempts where token_hash=p_token_hash) then return public.read_guest_quiz(p_token_hash);end if;
 insert into public.guest_quiz_attempts(token_hash) values(p_token_hash) returning id into attempt_uuid;
 insert into private.guest_quiz_questions(attempt_id,position,question_id,question_version,subject,topic,statement,options,correct_answer,explanation)
 select attempt_uuid,c.position,q.id,q.version,q.subject,q.topic,q.statement,
 jsonb_build_array(q.option_a,q.option_b,q.option_c,q.option_d,q.option_e),a.correct_answer,a.explanation
 from private.intro_quiz_catalog c join public.questions q on q.id=c.question_id
 join public.question_answers a on a.question_id=q.id
 where q.status='reviewed' and q.difficulty in('easy','medium') order by c.position;
 get diagnostics inserted_count=row_count;
 if inserted_count<>10 or (select count(distinct subject) from private.guest_quiz_questions where attempt_id=attempt_uuid)<>5
 or exists(select 1 from private.guest_quiz_questions where attempt_id=attempt_uuid group by subject having count(*)<>2) then
  raise exception 'quiz_not_ready' using errcode='P0001';
 end if;
 return public.read_guest_quiz(p_token_hash);
end;
$$;
revoke all on function public.start_guest_quiz(text) from public,anon,authenticated,service_role;
grant execute on function public.start_guest_quiz(text) to service_role;
commit;
