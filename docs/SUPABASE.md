# Supabase — etapa 5

Status: preparação concluída; criação do projeto remoto pendente de login do usuário. O painel foi aberto, mas redirecionou para a tela de autenticação. Nenhum projeto foi criado ou verificado ainda.

## Escopo

Criar o projeto Supabase de desenvolvimento e verificar seu estado no painel. Clientes de navegador/servidor e autenticação base pertencem à etapa 6; tabelas, RLS e migrations à etapa 7. A entrada aprovada continua funcionando sem Supabase.

Supabase fornece PostgreSQL (banco de dados), Auth (autenticação) e APIs. Nesta etapa, preparar o serviço não significa que o site já esteja conectado a ele.

## Custo consultado em 23/09/2026

O plano Free custa US$ 0/mês. Inclui banco de 500 MB por projeto, 1 GB de arquivos, 5 GB de tráfego de saída e 5 GB de saída em cache, além de 50 mil usuários ativos mensais. Há limite de dois projetos ativos gratuitos e pausa após uma semana de inatividade. Backups automáticos não estão incluídos.

Para este início, usar uma organização Free. Se já houver projetos ocupando o limite, não excluir nenhum para liberar espaço. Reavaliar quando o uso se aproximar das cotas ou exigir operação sem pausa e backups gerenciados. Pro começa em US$ 25/mês; recursos adicionais podem aumentar o custo. Nenhum upgrade, cartão ou adicional pago faz parte desta etapa.

Fonte: [preços oficiais](https://supabase.com/pricing). Conferir novamente antes de mudar plano, pois os valores e limites podem mudar.

## Passo a passo no painel

1. Abrir [Supabase Dashboard](https://supabase.com/dashboard) e entrar na conta. Se ainda não houver conta, usar Sign up. Senha, código de verificação e aceite dos termos devem ser feitos pelo usuário na página; não enviar pelo chat.
2. Conferir a organização e seu plano antes de criar o projeto. Usar uma organização Free destinada a este projeto. Se já existir um projeto adequado, verificar antes de duplicar.
3. Em New project, usar o nome `projeto-etec-if-dev`.
4. Preencher a senha do banco diretamente no painel e guardá-la em um gerenciador de senhas. Não colocar no código ou na documentação. Essa senha é diferente da senha da conta Supabase.
5. Preferir a região específica South America (São Paulo), `sa-east-1`, se disponível, pela proximidade do público brasileiro. Se indisponível, registrar e decidir a alternativa antes de criar. A opção geral Americas não garante São Paulo.
6. Conferir organização, plano Free, nome e região; criar o projeto e aguardar o provisionamento.
7. Verificar que o projeto está ativo/saudável e registrar apenas nome, região e identificação não secreta. Não criar tabelas de exemplo do quickstart: o esquema será feito pelas migrations do projeto na etapa 7.

A aparência e os rótulos exatos do painel serão conferidos ao acessar a sessão autenticada.

## Preparação para a etapa 6

O diálogo Connect fornece a URL e a chave pública. As configurações futuras serão colocadas localmente em `.env.local`, na raiz do projeto:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_SUBSTITUIR_LOCALMENTE
```

Este bloco contém somente placeholders. O arquivo ainda não foi criado e essas configurações ainda não são consumidas pela aplicação. Usar a chave publishable atual; nunca colocar secret key ou service_role em variável NEXT_PUBLIC_. A chave pública não substitui autenticação nem políticas RLS. Nenhuma chave administrativa é necessária nesta etapa.

Continuaremos no projeto Next.js existente, sem instalar template, Docker, CLI ou pacotes de autenticação antecipadamente.

## Como verificar

- Painel mostra organização Free, nome correto, região escolhida e projeto ativo.
- Nenhuma tabela de negócio, migration ou usuário de teste criado nesta etapa.
- Site local continua abrindo normalmente.
- `git check-ignore .env.local .env.production` lista os dois nomes.
- `git ls-files '.env*'` não lista arquivos.

Se o login falhar, recuperar o acesso pelo próprio Supabase. Se o provisionamento falhar, registrar a mensagem sem senhas e verificar o projeto existente antes de tentar novamente, evitando duplicatas.

## Fontes oficiais

- [Criação do projeto](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Regiões](https://supabase.com/docs/guides/platform/regions)
- [Chaves de API](https://supabase.com/docs/guides/getting-started/api-keys)

## Critério de conclusão

A etapa 5 só estará concluída após confirmar o projeto remoto ativo no plano escolhido e documentar os dados não secretos. Neste registro, isso continua pendente. Depois, pausar para o teste do usuário antes de implementar a etapa 6.
