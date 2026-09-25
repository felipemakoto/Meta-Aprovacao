# Supabase — etapa 5

Status: etapa 5 concluída. Projeto remoto criado e verificado no painel em 24/09/2026, com status Healthy. O pedido para continuar confirmou o teste da etapa 5; a base da etapa 6 está em AUTH-BASE.md.

## Projeto criado

| Campo | Valor confirmado |
| --- | --- |
| Organização | meta aprovação |
| Plano selecionado na criação | Free |
| Nome escolhido pelo usuário | estudos-etec/if |
| Referência | clxnqrkdalimrqcnhegr |
| Região | South America (São Paulo), sa-east-1 |
| Compute | Nano (t4g.nano) |
| Estado no painel | Healthy |
| URL pública | https://clxnqrkdalimrqcnhegr.supabase.co |

[Abrir projeto no painel](https://supabase.com/dashboard/project/clxnqrkdalimrqcnhegr).

Na criação, mantivemos Enable Data API ativado, desativamos Automatically expose new tables e ativamos Enable automatic RLS. As opções foram conferidas antes do envio. Isso prepara padrões mais restritivos; as permissões e políticas de cada tabela ainda serão definidas e testadas nas migrations. Nenhuma senha ou chave foi copiada para o repositório.

O painel confirma ausência de migrations, backups e repositório GitHub conectado. Não criamos tabelas de negócio ou usuários de teste. Nenhum upgrade foi realizado. A infraestrutura de clientes e verificação de sessão foi implementada na etapa 6; detalhes em [AUTH-BASE.md](AUTH-BASE.md).

## Escopo

Criar o projeto Supabase de desenvolvimento e verificar seu estado no painel. Clientes de navegador/servidor e autenticação base pertencem à etapa 6; tabelas, políticas RLS e migrations à etapa 7. A entrada aprovada continua independente do Supabase.

Supabase fornece PostgreSQL (banco de dados), Auth (autenticação) e APIs. Nesta etapa, preparar o serviço não significa que o site já esteja conectado a ele.

## Custo consultado em 23/09/2026

O plano Free custa US$ 0/mês. Inclui banco de 500 MB por projeto, 1 GB de arquivos, 5 GB de tráfego de saída e 5 GB de saída em cache, além de 50 mil usuários ativos mensais. Há limite de dois projetos ativos gratuitos e pausa após uma semana de inatividade. Backups automáticos não estão incluídos.

Para este início, usar uma organização Free. Se já houver projetos ocupando o limite, não excluir nenhum para liberar espaço. Reavaliar quando o uso se aproximar das cotas ou exigir operação sem pausa e backups gerenciados. Pro começa em US$ 25/mês; recursos adicionais podem aumentar o custo. Nenhum upgrade, cartão ou adicional pago faz parte desta etapa.

Fonte: [preços oficiais](https://supabase.com/pricing). Conferir novamente antes de mudar plano, pois os valores e limites podem mudar.

## Passo a passo no painel

1. Abrir [Supabase Dashboard](https://supabase.com/dashboard) e entrar na conta. Se ainda não houver conta, usar Sign up. Senha, código de verificação e aceite dos termos devem ser feitos pelo usuário na página; não enviar pelo chat.
2. Conferir a organização e seu plano antes de criar o projeto. Usar uma organização Free destinada a este projeto. Se já existir um projeto adequado, verificar antes de duplicar.
3. Em New project, usamos o nome `estudos-etec/if`, preenchido pelo usuário, substituindo a sugestão inicial `projeto-etec-if-dev`.
4. Preencher a senha do banco diretamente no painel e guardá-la em um gerenciador de senhas. Não colocar no código ou na documentação. Essa senha é diferente da senha da conta Supabase.
5. Preferir a região específica South America (São Paulo), `sa-east-1`, se disponível, pela proximidade do público brasileiro. Se indisponível, registrar e decidir a alternativa antes de criar. A opção geral Americas não garante São Paulo.
6. Conferir organização, plano Free, nome e região; criar o projeto e aguardar o provisionamento.
7. Verificar que o projeto está ativo/saudável e registrar apenas nome, região e identificação não secreta. Não criar tabelas de exemplo do quickstart: o esquema será feito pelas migrations do projeto na etapa 7.

O procedimento acima está registrado como histórico; não criar um segundo projeto ao retomar. Usar o link do projeto já criado.

## Preparação para a etapa 6

O diálogo Connect fornece a URL e a chave pública. As configurações futuras serão colocadas localmente em `.env.local`, na raiz do projeto:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_SUBSTITUIR_LOCALMENTE
```

Este bloco contém somente placeholders. Na etapa 6, .env.local foi criado e preenchido localmente com a URL e a chave pública do painel; os helpers já consomem essas variáveis. Usar a chave publishable atual; nunca colocar secret key ou service_role em variável NEXT_PUBLIC_. A chave pública não substitui autenticação nem políticas RLS. Nenhuma chave administrativa é necessária nesta etapa.

Mantido o projeto Next.js existente. Na etapa 6 foram adicionados supabase-js, ssr e server-only; não foram instalados template, Docker ou CLI.

## Como verificar

- Painel mostra organização Free, nome correto, região escolhida e projeto ativo.
- Nenhuma tabela de negócio, migration ou usuário de teste criado nesta etapa.
- A etapa 5 não alterou a aplicação. Na etapa 6, a conexão com o serviço Auth foi testada; consultas ao banco aguardam as tabelas da etapa 7.
- `git check-ignore .env.local .env.production` lista os dois nomes.
- `git ls-files '.env*'` não lista arquivos.

Se o login falhar, recuperar o acesso pelo próprio Supabase. Se o provisionamento falhar, registrar a mensagem sem senhas e verificar o projeto existente antes de tentar novamente, evitando duplicatas.

## Fontes oficiais

- [Criação do projeto](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Regiões](https://supabase.com/docs/guides/platform/regions)
- [Chaves de API](https://supabase.com/docs/guides/getting-started/api-keys)

## Critério de conclusão

Critério atendido: projeto remoto criado no plano Free e painel exibindo Healthy, nome e região corretos. Dados não secretos documentados. Teste confirmado pelo pedido para continuar. Implementação e verificações da etapa 6 registradas em AUTH-BASE.md.
