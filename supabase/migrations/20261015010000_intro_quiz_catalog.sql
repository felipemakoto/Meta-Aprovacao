-- Ten fixed introductory questions. Reviewed by AI under the owner's editorial policy.
-- Status reviewed keeps them OUT of published practice/simulations; only this catalog exposes them.
create table private.intro_quiz_catalog (
 position smallint primary key check(position between 1 and 10),
 question_id uuid not null unique references public.questions(id) on delete restrict
);
alter table private.intro_quiz_catalog enable row level security;
revoke all on private.intro_quiz_catalog from public,anon,authenticated,service_role;
create temporary table intro_content(position smallint,id uuid,subject text,topic text,statement text,options jsonb,correct_answer text,explanation text) on commit drop;
insert into intro_content values
(1,'aa520000-0000-4000-8000-000000000001','matematica','Porcentagem','Um caderno custa R$ 30,00. Quanto é 10% desse valor?','["R$ 0,30","R$ 3,00","R$ 10,00","R$ 20,00","R$ 33,00"]'::jsonb,'B','10% correspondem a um décimo. Assim, 30 ÷ 10 = 3 reais.'),
(2,'aa520000-0000-4000-8000-000000000002','matematica','Equação do primeiro grau','Qual número deve substituir x para que x + 5 = 12?','["5","6","7","12","17"]'::jsonb,'C','Subtraindo 5 dos dois lados, x = 12 − 5 = 7.'),
(3,'aa520000-0000-4000-8000-000000000003','portugues','Interpretação de texto','Leia o aviso: “A biblioteca ficará fechada na sexta-feira para manutenção.” Qual é a finalidade principal desse aviso?','["Convidar para uma festa na biblioteca.","Ensinar como consertar um livro.","Contar uma história sobre a escola.","Informar quando a biblioteca não abrirá.","Pedir a devolução de livros emprestados."]'::jsonb,'D','O aviso informa que a biblioteca não abrirá na sexta-feira e explica o motivo.'),
(4,'aa520000-0000-4000-8000-000000000004','portugues','Sentido das palavras','Na frase “A turma ficou contente com o resultado”, qual palavra pode substituir “contente” sem mudar o sentido?','["Feliz","Cansada","Preocupada","Indiferente","Confusa"]'::jsonb,'A','Nesse contexto, contente e feliz indicam satisfação com o resultado.'),
(5,'aa520000-0000-4000-8000-000000000005','ciencias','Estados físicos da água','Uma roupa molhada seca no varal. A água líquida passa para o ar na forma de vapor. Essa mudança é chamada de:','["Fusão","Solidificação","Condensação","Precipitação","Evaporação"]'::jsonb,'E','A evaporação é a passagem lenta do estado líquido para o gasoso, como acontece com a água da roupa no varal.'),
(6,'aa520000-0000-4000-8000-000000000006','ciencias','Cadeia alimentar','Na cadeia alimentar capim → gafanhoto → sapo, qual ser vivo produz seu próprio alimento pela fotossíntese?','["O gafanhoto","O capim","O sapo","O gafanhoto e o sapo","Os três seres vivos"]'::jsonb,'B','O capim é o produtor dessa cadeia: usa luz, água e gás carbônico na fotossíntese.'),
(7,'aa520000-0000-4000-8000-000000000007','historia','Fontes históricas','Uma turma encontrou uma fotografia antiga da escola. Para estudar como a escola mudou ao longo do tempo, essa fotografia pode ser usada como:','["Uma previsão do futuro.","Uma regra de convivência.","Uma fonte histórica visual.","Um mapa de localização.","Uma tabela de notas."]'::jsonb,'C','A fotografia registra elementos de uma época e pode servir como fonte visual para a pesquisa histórica.'),
(8,'aa520000-0000-4000-8000-000000000008','historia','Brasil Colônia','Nos séculos XVI e XVII, muitos engenhos do litoral do Nordeste brasileiro produziam açúcar. Qual era a principal matéria-prima dessa produção?','["O café","O algodão","O cacau","A cana-de-açúcar","A borracha"]'::jsonb,'D','Os engenhos produziam açúcar a partir da cana-de-açúcar, cultivada em grandes propriedades.'),
(9,'aa520000-0000-4000-8000-000000000009','geografia','Leitura de mapas','Em um mapa, rios aparecem em azul e estradas aparecem em vermelho. Onde o leitor encontra a explicação dessas cores?','["Na legenda","Na escala numérica","Na rosa dos ventos","No título do mapa","Na indicação do ano"]'::jsonb,'A','A legenda explica o significado das cores e dos símbolos utilizados no mapa.'),
(10,'aa520000-0000-4000-8000-000000000010','geografia','Orientação','Um mapa tem o norte indicado para cima. Nesse mapa, a direção leste fica:','["Acima do norte.","Abaixo do sul.","No lado esquerdo.","Na mesma direção do oeste.","No lado direito."]'::jsonb,'E','Quando o norte está para cima, o sul fica embaixo, o leste à direita e o oeste à esquerda.');
insert into public.questions(id,subject,topic,statement,option_a,option_b,option_c,option_d,option_e,difficulty,target_exam,status,version)
select id,subject,topic,statement,options->>0,options->>1,options->>2,options->>3,options->>4,'easy','both','reviewed',1 from intro_content;
insert into public.question_answers(question_id,correct_answer,explanation) select id,correct_answer,explanation from intro_content;
insert into private.intro_quiz_catalog(position,question_id) select position,id from intro_content;
comment on table private.intro_quiz_catalog is 'Fixed introductory quiz only. Reviewed questions are not eligible for published practice or simulations. Server snapshot and answer separation preserved.';

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
 where q.status='reviewed' and q.difficulty='easy' order by c.position;
 get diagnostics inserted_count=row_count;
 if inserted_count<>10 or (select count(distinct subject) from private.guest_quiz_questions where attempt_id=attempt_uuid)<>5 then
  raise exception 'quiz_not_ready' using errcode='P0001';
 end if;
 return public.read_guest_quiz(p_token_hash);
end;
$$;
revoke all on function public.start_guest_quiz(text) from public,anon,authenticated,service_role;
grant execute on function public.start_guest_quiz(text) to service_role;
