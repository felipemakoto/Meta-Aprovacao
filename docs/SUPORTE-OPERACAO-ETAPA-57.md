# Suporte, informações públicas e operação — etapa 57

Implementado em 15/10/2026 após o responsável autorizar o nome público **Meta Aprovação**, o contato **metaaprovacao720@gmail.com** e um destinatário distinto para alertas técnicos. O destinatário privado fica somente no arquivo local ignorado e na automação autorizada, sem integração com os dados públicos da aplicação.

## Páginas públicas

- `/suporte`: contato por e-mail e dúvidas sobre entrada, limites, plano, questões e solicitações de dados. O botão abre o aplicativo de e-mail; não foi criado um formulário que armazena mensagens.
- `/privacidade`: conta, estudos, armazenamento de sessão, cookies, fornecedores, conservação, direitos, contato e informação sobre estudantes menores de idade. Descreve o que o código faz, sem afirmar verificação automática de idade ou consentimento que não existe.
- `/termos`: serviço independente, uso da conta, limites, repetição de questões, condição atual do Premium, cobranças, cancelamento, reembolso, conteúdo e direitos preservados.
- Rodapé comum com acesso às três páginas em todas as rotas.

Fontes consultadas: [LGPD, especialmente arts. 7, 9, 14 e 18](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm) e [Código de Defesa do Consumidor, especialmente art. 49](https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm). Os textos não certificam conformidade integral. A identificação jurídica completa para vendas, regras adequadas ao atendimento de menores e prazos específicos de conservação precisam ser definidos conforme a operação. Não foi inventado CNPJ, endereço, prazo de resposta ou garantia comercial.

## Cópia criptografada real

Comandos na pasta do projeto:

```powershell
npm.cmd run backup:create
npm.cmd run backup:verify
```

Cliente PostgreSQL 18.6 obtido dos binários da EDB, disponibilizados no [site oficial PostgreSQL](https://www.postgresql.org/download/windows/). Somente três executáveis de cliente e suas bibliotecas foram extraídos, com verificação de CRC das entradas ZIP; nenhum servidor PostgreSQL ou serviço do Windows foi instalado. O instalador completo não foi executado. Binários locais em `%LOCALAPPDATA%\MetaAprovacao\tools\postgresql-18.6\bin`.

O script usa a CLI Supabase já autenticada para obter uma conexão temporária, em memória, e confirma o projeto ligado contra o ambiente da aplicação. Assume o papel de banco utilizado pelo dump oficial da CLI. Não coloca senha na linha de comando, não executa o script de shell retornado pela CLI e não imprime seus valores. O dump consistente inclui os schemas `public`, `private`, `auth` e `supabase_migrations`.

O fluxo de dados é criptografado em AES-256-GCM antes de escrever em disco; não há arquivo SQL ou dump aberto em texto simples. A chave fica protegida pelo Windows DPAPI para o usuário atual. Cópias e manifesto ficam em `%LOCALAPPDATA%\MetaAprovacao\operations`, fora do repositório e do OneDrive. A chave existente não é sobrescrita; se desaparecer enquanto há manifesto, a rotina falha em vez de criar uma substituta silenciosamente.

Foram criadas duas cópias, a segunda após reforçar a confirmação de projeto. A mais recente foi criada em **15/10/2026 às 17:57:37 de São Paulo**, com **460.518 bytes e 474 objetos**. Autenticação criptográfica, hash SHA-256 e leitura do catálogo com `pg_restore --list` passaram. O encerramento antecipado do stdin pelo comando de listagem é aceito apenas se o processo terminou com sucesso e a autenticação completa da cópia já passou.

Limites explícitos:

- A cópia é **local**. Não foi certificada uma segunda cópia em outro equipamento ou serviço de armazenamento.
- DPAPI depende do perfil Windows atual. A proteção e recuperação dessa chave fora deste computador precisam ser preparadas antes de considerar o backup como recuperação de desastre.
- Não foi feita restauração em outro banco. Catálogo legível e criptografia íntegra não substituem um ensaio de restauração.
- Não inclui arquivos do Supabase Storage, configurações de infraestrutura, segredos do Vault nem senhas de funções customizadas. Serviços gerenciados, extensões e segredos exigem preparação específica ao restaurar.
- Não existe comando automático de restauração ou remoção de dados. **Não execute restauração sobre produção.** Um ensaio deve usar projeto separado compatível e reconciliar serviços gerenciados, permissões, Vault e Cron.

A [documentação de backups do Supabase](https://supabase.com/docs/guides/platform/backups) diferencia backups gerenciados de exportações locais e informa que arquivos do Storage não fazem parte do backup de banco. Não foi contratado plano pago nem presumida a existência de backups gerenciados na conta.

## Verificação e alertas

```powershell
npm.cmd run ops:check
npm.cmd run ops:notice
```

O verificador consulta as páginas públicas, a RPC administrativa de saúde e o manifesto/arquivo/chave da cópia. Informa códigos fixos e mensagens próprias; falhas não expõem respostas brutas, segredos ou dados de alunos. Detecta indisponibilidade, monitor atrasado, condições operacionais, ausência/atraso de backup e tentativa de cópia ou verificação que falhou. Mais de 48 horas sem cópia válida gera aviso de atraso.

O preparador exige duas amostras consecutivas para um incidente, fica silencioso enquanto não há mudança e prepara uma recuperação após incidente confirmado. O envio é confirmado separadamente por identificador somente depois do sucesso no Gmail; sem confirmação, não marca como entregue.

Criada automação heartbeat no Codex **“Monitorar Meta Aprovação e backups”**, ativa, a cada quinze minutos, nesta conversa. Se a cópia verificada tiver mais de 24 horas, tenta criar outra uma vez por rodada. Confere a cópia e prepara o aviso; apenas incidentes ou recuperações são enviados pelo Gmail conectado ao destinatário autorizado. Não foram enviados e-mails de teste nem novas mensagens ao suporte. A amostra real inicial retornou `action:silent`, sem avisos.

**Essa rotina depende do Codex e deste computador disponíveis, do perfil Windows e das conexões configuradas.** Não é um serviço independente de monitoramento contínuo em servidor. Se houver migração da pasta, deve-se atualizar a automação. Um monitor em infraestrutura sempre disponível e uma estratégia externa de cópias/chave continuam melhorias necessárias para recuperação robusta.

Os comandos não alteram pagamentos, assinaturas, cotas, agendamentos do Supabase ou contratação. Nenhuma limpeza automática de logs ou evidências foi ativada; prazos e exclusão financeira não foram presumidos.

## Conferências

- Seis testes: criptografia/autenticação, corrupção, chave errada, códigos sem vazamento, monitor/backup atrasados, falha de cópia recente, pausa intencional, confirmação de incidente, ausência de repetição e recuperação.
- Cópia do banco real criada e verificada; retorno posterior de verificação confirmou 474 objetos. Duas falhas iniciais de preparação, por papel de conexão e encerramento do pipe de catálogo, foram corrigidas; não foram relatadas como cópias aprovadas.
- Navegador em quinze combinações de páginas/larguras: suporte, privacidade, termos, início e login em 320/390/1280px. Sem overflow ou erro; botões do rodapé com 44px, foco visível, FAQ funcional e endereço privado ausente do HTML. Capturas em `out/information57/`, ignoradas pelo Git.
- Lint, build e TypeScript aprovados. `npm run test:operations` repete os seis testes.

Pendências preservadas: pagamento comercial/contrato Cakto e confirmação por e-mail de um cadastro novo. Contratação continua desabilitada.
