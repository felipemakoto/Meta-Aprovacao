-- pg_net concede SELECT ao público por padrão. A fila contém o cabeçalho privado do worker.
-- Extensão criada nesta etapa; operações são exclusivas do despachante privado/postgres.
revoke all on net.http_request_queue,net._http_response from public,anon,authenticated,service_role;
revoke execute on function net.http_post(text,jsonb,jsonb,jsonb,integer) from public,anon,authenticated,service_role;
