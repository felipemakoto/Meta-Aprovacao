# Recuperação após a regra da primeira compra — etapa 64

Em 17/10/2026, a continuação operacional atualizou a cópia do banco após a migration da promoção. Nenhum pagamento, contratação, mudança de cron ou restauração sobre produção foi realizado.

## Cópia atualizada e externa

- Backup criado às **18:15:06 de São Paulo**, criptografado e autenticado: **583 objetos e 502.098 bytes**, com permissões incluídas.
- Novo arquivo e manifesto enviados à pasta privada do Google Drive já autorizada; chave protegida existente reutilizada. Não houve substituição ou exclusão de versões anteriores.
- Metadados dos três arquivos conferidos: pasta esperada, tamanhos e acesso somente do proprietário. Os três arquivos foram baixados para um conjunto separado com ACL privada no Windows. Tamanhos e SHA-256 coincidiram com as origens; recibo externo confirmado.
- Arquivo do banco, manifesto e envelope da chave permanecem criptografados/protegidos no conjunto separado. Não foram copiados `.env`, chave DPAPI ou chave aberta para o Drive/conjunto.

IDs, caminhos privados e recibos continuam somente no diretório operacional local, fora do Git/OneDrive. A cópia não inclui Storage, Vault e configurações dos serviços gerenciados.

## Ensaio local concluído

Restauração em banco temporário concluída às **18:18:38 de São Paulo**, usando a chave do perfil Windows:

- 50 tabelas com quantidades e hashes idênticos; 500 questões publicadas, 520 gabaritos, dez itens iniciais e seis modelos.
- 22 tabelas com RLS e permissões críticas conferidas.
- Cenários SQL da primeira compra executados no banco restaurado, dentro de `BEGIN/ROLLBACK`: nova conta, conta não confirmada, tentativa sem pagamento, revisão sem prova, histórico pago/expirado, isolamento de contas, intenção regular, cupom recusado após pagamento, reembolso sem retorno do desconto e permissões privadas.
- Banco temporário encerrado e removido; nenhum acesso a produção pelo processo de restauração.

O ensaio passou antes de iniciar a conferência pela senha. Isso mantém evidências distintas: funcionamento com a chave do Windows e recuperação do conjunto externo sem essa chave.

## Conferência do conjunto externo pela senha

O comando agora aceita `--recovery-set UUID`, sempre como **origem**, nunca destino. Lê exclusivamente um conjunto em `operations/recovery-input/UUID`, exige a chave protegida por senha e mantém o destino em novo banco temporário local. Não aceita URL, caminho livre, porta, banco existente ou opção de servidor externo. A CLI não carrega `.env` de produção.

Exemplo para operadores: `npm run backup:drill -- --recovery-set UUID_DO_CONJUNTO_IMPORTADO`.

O conjunto desta etapa contém os três arquivos realmente baixados do Drive e conferidos. O responsável forneceu a senha guardada exclusivamente pelo formulário temporário em loopback. **O percurso completo foi aprovado às18:22:51 de São Paulo em17/10/2026**, com `keySource:password-protected-recovery` e `inputSource:imported-recovery-set`:50tabelas idênticas, permissões e cenários SQL da primeira compra aprovados, banco temporário removido. Não foi usado DPAPI como substituto nem redefinida a senha. O formulário encerrou após receber a senha, que não foi enviada ao chat ou gravada em arquivo.

O relatório distingue `inputSource:imported-recovery-set` de `local-backup`, e `keySource:password-protected-recovery` de `windows-profile`. O campo `offsite:false` foi preservado: o script não acessa ou certifica o Drive por si próprio; a proveniência externa vem das leituras/downloads e hashes acima. Ensaio neste computador não certifica outro equipamento ou serviços gerenciados do Supabase.

## Validação e pendências

13 testes de operação, criptografia, guardas de origem/destino e recuperação aprovados. Lint dos arquivos modificados, TypeScript e conferência do diff aprovados. Código de aplicação/contratação e banco remoto não alterados; sem repetição do build do site.

Cadastro por e-mail foi concluído na [etapa 63](CADASTRO-EMAIL-ETAPA-63.md). Continuam independentes a validação comercial Cakto, a retomada de estudos em conta Google preexistente, a restauração em outro equipamento/projeto Supabase separado e a política de retenção financeira detalhada. Contratação permanece desativada.
