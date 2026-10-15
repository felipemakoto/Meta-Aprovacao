# Backup externo e ensaio de recuperação — etapa 58

Implementado em 15/10/2026. O responsável escolheu **Google Drive** para a cópia externa e definiu uma senha exclusivamente pelo formulário temporário em loopback. A senha não foi recebida pelo chat, registrada em configuração ou enviada ao Drive. O formulário não contém recursos externos e encerra após receber a senha.

## Resultado real

- Nova cópia criptografada criada às **18:13:24 de São Paulo**, com **498.158 bytes e 579 objetos**, incluindo permissões de acesso. As duas cópias anteriores continuam preservadas. Não foi alterado dado de produção.
- Restauração transacional em PostgreSQL 18.6 temporário, escutando somente em `127.0.0.1`, autenticado por senha aleatória. Nenhuma credencial de produção é passada aos processos do ensaio.
- **50 tabelas comparadas** entre o arquivo original e o banco restaurado. Quantidades e SHA-256 de todas as linhas coincidiram; ordenação física não interfere e duplicatas são preservadas. Inclui 500 questões publicadas, 520 gabaritos, dez entradas do quiz inicial e seis modelos de simulado.
- Restauradas as permissões presentes no arquivo, com conferência de negação de tabelas/gabaritos e da RPC de início para os papéis comuns, e acesso administrativo esperado. Há 22 tabelas da aplicação com RLS habilitada. Isso não é certificação de todos os privilégios nem de equivalência dos papéis gerenciados.
- O banco temporário foi encerrado e removido após cada tentativa. Nenhuma restauração foi direcionada ao Supabase ou a banco existente.
- Arquivo criptografado, manifesto e chave protegida pela senha enviados a uma pasta privada do Drive. Os três arquivos foram lidos de volta e seus tamanhos e SHA-256 coincidiram. Metadados indicaram somente proprietário e nenhum compartilhamento público.
- A chave protegida foi aberta com a senha durante sua criação, comparada com a chave local e utilizada para autenticar o backup real. Esse teste comprova o material de recuperação sem depender de desembrulhar DPAPI; não equivale a ter repetido a restauração inteira em outro computador.

Não colocar no repositório os IDs do Drive, os recibos privados, o arquivo de recuperação, cópias do banco, senhas ou `.env`. Configuração e arquivos ficam em `%LOCALAPPDATA%\MetaAprovacao\operations`, fora do OneDrive.

## Comandos

```powershell
npm.cmd run backup:tools          # clientes e servidor portátil para o ensaio local
npm.cmd run backup:create         # leitura do banco vinculado; usa .env.local e CLI autenticada
npm.cmd run backup:verify         # autenticação e catálogo da cópia local
npm.cmd run backup:drill          # restaura somente em novo banco local temporário
npm.cmd run backup:recovery       # cria ou confere chave protegida; formulário local
npm.cmd run backup:offsite        # prepara conjunto, sem enviar por conta própria
```

`backup:tools` usa o pacote Windows 18.6 da EDB referenciado pelo [PostgreSQL oficial](https://www.postgresql.org/download/windows/). Seleciona executáveis/bibliotecas/arquivos de suporte, confere entradas ZIP por CRC e baixa por HTTPS com ETag. Não instala serviço, modifica PATH ou mantém servidor ligado. O pacote e o CRC não substituem uma assinatura independente do fornecedor.

`backup:drill` não aceita URL, porta ou diretório de destino. Gera diretório único, aplica ACL do Windows antes de gravar dados, escolhe porta efêmera, confirma o `data_directory` e limpa somente o diretório desta execução. O dump é autenticado antes de ser utilizado e passado em memória ao cliente. Não há dump aberto em disco. Durante o ensaio, o PostgreSQL necessariamente armazena dados restaurados em disco local; esses arquivos temporários são removidos ao final, sem promessa de apagamento forense.

As cópias novas incluem ACLs; arquivos antigos da etapa 57 ainda podem ser ensaiados, mas o relatório informa que privilégios não foram testados. A diferença não é ignorada. A chave de recuperação usa scrypt com custo fixo e AES-256-GCM; senha incorreta, parâmetros alterados ou arquivo adulterado são recusados. Não existe recuperação da senha esquecida pelo sistema.

## Recuperar em outro computador Windows

1. Obter o código do projeto e suas dependências, com Node.js 24, sem copiar `.env` de produção para fazer o ensaio.
2. Baixar os três arquivos do conjunto privado do Drive. Manter uma cópia dos arquivos baixados.
3. Criar `%LOCALAPPDATA%\MetaAprovacao\operations\backups` e colocar ali o arquivo `.mapbackup` com o nome original.
4. Copiar o manifesto correspondente para `%LOCALAPPDATA%\MetaAprovacao\operations\latest-backup.json` e a chave protegida para `recovery-key-v1.json` na mesma pasta. Os nomes do Drive incluem identificação imutável para não substituir conjuntos antigos; esses dois nomes locais são os que o script lê.
5. Executar `npm.cmd run backup:tools` e depois `npm.cmd run backup:drill:recovery`. Abrir o endereço local apresentado e digitar a senha guardada no gerenciador. Esse modo usa a chave protegida por senha e não chama DPAPI.
6. Só considerar o ensaio concluído se o relatório disser `passed:true`, `dataIdentical:true` e `temporaryDatabaseRemoved:true`. Conferir também `accessPrivilegesTested`. Não usar esse script para restaurar sobre produção.

Para reconstituir a plataforma completa, preparar primeiro um projeto Supabase separado e seguir a [documentação oficial de backup e restauração](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore). Infraestrutura, extensões, proprietários/atributos de papéis, concessões fora dos quatro schemas, Storage, Vault, SMTP, configuração de autenticação, Edge Functions e agendamentos não são restaurados por este ensaio. Não foi criado projeto externo nem contratado plano.

## Rotina e confirmação externa

O heartbeat existente foi atualizado para a cópia privada no Drive e sua configuração persistida foi corrigida e conferida para verificações a cada quinze minutos. A configuração anterior encontrada no arquivo estava diária; não foi presumida execução automática a cada quinze minutos antes dessa correção.

- Cópia local nova quando a última tem mais de 24 horas, desde que computador/Codex estejam disponíveis.
- `backup:offsite` prepara somente três arquivos permitidos, com nome, tamanho e hash. Não envia `.env`, chave aberta ou DPAPI. Conjunto já confirmado retorna `unchanged`.
- O conector Drive envia/reutiliza os arquivos apenas na pasta autorizada. É preciso confirmar pasta pai, privacidade, tamanho e hash dos bytes baixados antes de gravar o recibo e executar `backup:offsite -- acknowledge`.
- Falha externa é registrada por `backup:offsite -- failed`; o monitor inclui ausência, atraso superior a 48 horas ou falha, depois que a cópia externa foi configurada. Não há exclusão automática de versões.
- Alertas preservam duas amostras consecutivas, deduplicação, destinatário privado já autorizado e confirmação somente após envio real pelo Gmail. Nenhum e-mail de teste foi enviado nesta etapa.

O recibo registra a conferência realizada, não garante que um arquivo nunca será apagado no Drive. O monitor não consulta o armazenamento remoto a cada checagem de saúde. A disponibilidade da rotina continua dependente do computador, Codex, perfil Windows e conectores.

## Validação e limites

Testes automatizados cobrem comparação de dados/duplicatas, recusa de destino indevido, integridade da chave, senha incorreta, custo de KDF adulterado, proteção de origem/token do formulário, cópia externa ausente/atrasada/com falha e regressões do monitor. Lint, TypeScript e build conferidos. O ensaio real de restauração e a leitura de volta do Drive são evidências separadas dos testes isolados.

Uma primeira tentativa do ensaio restaurou dados, mas a consulta de contagem usou nome de coluna incorreto; foi corrigida antes de declarar sucesso. Ao incluir ACLs, o ambiente local precisou também do papel `dashboard_user` sem login. A listagem de um arquivo maior expôs o código Windows `EOF` no encerramento antecipado do pipe; ele passou a ser aceito somente após autenticação completa do arquivo e saída bem-sucedida do cliente. Nenhuma dessas falhas alterou produção ou foi relatada como ensaio aprovado.

Permanecem pendentes a validação dos serviços gerenciados em outro projeto Supabase, o ensaio completo em outro equipamento, a confirmação de cadastro novo por e-mail e a prova comercial/contrato Cakto. **Checkout permanece desativado.**
