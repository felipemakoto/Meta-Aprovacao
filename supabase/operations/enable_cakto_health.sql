-- Executar após aplicar a migration e aprovar test_cakto_operational_health.sql.
-- Somente monitoramento: não ativa checkout nem altera a fila/períodos.
do $$declare j bigint;begin
 j:=cron.schedule('meta-cakto-health','* * * * *','select private.capture_cakto_health();');
 perform cron.alter_job(j,active:=true);
 perform private.capture_cakto_health();
end$$;
select public.cakto_operational_health();
