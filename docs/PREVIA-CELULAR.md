# Prévia demonstrativa para celular fora da rede

Simplificação aprovada: out/site-demonstracao.html reúne seis telas com seletor e navegação local (entrada, estudos, histórico, questões, teste e resultado). Compila scripts/mobile-site-preview.tsx com os componentes reais em modo demonstrativo; nenhuma sessão ou servidor incluído. Link/router adaptados enviam eventos locais somente para rotas de estudo. Conta e salvamento desabilitados. Resultado do teste ilustrativo é fixture, não correção das escolhas. Prévia HTML individual de histórico/questões também atualizada. Arquivo e instruções em SIMPLIFICACAO-IMPLEMENTADA.md; conferência visual pelo celular pendente.

Etapa 20: gerada demonstração portátil adicional out/historico-demonstracao.html a partir do componente History real com preview=true. Script aceita historico como terceiro argumento e adapta next/navigation, além de links e imagens. Troca de listas, carregar mais e revisão usam dados locais ilustrativos; navegação para páginas da aplicação completa desabilitada. Aguardando conferência do usuário; não houve nova tentativa de túnel.

Confirmação posterior em 30/09/2026: após as instruções sobre JavaScript, o usuário informou “está certinho, pode continuar”. Demonstração aprovada manualmente no contexto do acesso pelo celular. Isso não comprova persistência no Supabase ou cada passo do roteiro funcional, nem remove o bloqueio da inspeção automatizada por navegador.

Preparada em 30/09/2026 após o usuário informar que usa Codex Remote no celular fora da rede do computador. localhost não é acessível nesse cenário.

A demonstração compila o componente real Practice com preview=true. Adapta next/link e next/image para elementos HTML simples, mantendo os estilos e fontes locais. Links de navegação da aplicação ficam desabilitados; filtros e correção ilustrativa usam a lógica do componente. Nenhuma API, credencial, sessão, configuração Supabase ou arquivo de servidor é incluído.

scripts/build-mobile-preview.mjs gera arquivos estáticos em uma pasta externa usando esbuild instalado somente nessa pasta, sem alterar dependências do projeto. scripts/serve-mobile-preview.mjs carrega uma lista restrita de assets em memória e escuta apenas em 127.0.0.1:4175. Sem cookies, POST, diretório público genérico ou proxy de rotas. CSP bloqueia conexões externas e formulários. Servidor encerra após 12 horas.

Assets gerados em C:/Users/felip/.codex/previews/etec-if-stage19/public. Binário cloudflared obtido da release oficial cloudflare/cloudflared no GitHub e hash conferido contra o digest da release. Dois testes locais de assets/fontes/isolamento passaram. Não há inspeção visual por navegador nesta rodada.

Publicação externa ainda não realizada: a revisão automática rejeitou o comando combinado que iniciaria servidor e túnel, com mensagem blocked by policy e sem motivo adicional. Servidor estático local foi iniciado separadamente, como alternativa sem exposição externa. Solicitada autorização explícita para disponibilizar apenas esta demonstração em link público temporário pelo Cloudflare. Não publicar a aplicação Next, APIs ou conteúdo de conta por meio desse túnel.

Não afirmar que o usuário acessou a prévia ou que existe link externo antes da verificação. Túnel e assets são uma demonstração temporária, não deploy do produto.

O usuário autorizou explicitamente o link temporário. Mesmo assim, nova tentativa isolada de iniciar cloudflared foi rejeitada pela revisão automática com blocked by policy. A autorização não removeu a restrição do ambiente; nenhum túnel público foi iniciado.

Alternativa preparada: out/questoes-demonstracao.html, arquivo único com React, componente Practice em modo preview, estilos, fontes e ícones incorporados. Não depende de localhost, APIs ou login. Gerado também na pasta externa da prévia. Pasta out ignorada pelo Git. Sintaxe JavaScript e inclusão dos assets verificadas; abertura/renderização no navegador do celular ainda não conferida. A possibilidade de baixar o arquivo pelo Codex Remote e abri-lo como HTML depende do cliente/navegador do usuário; não afirmar que foi acessível antes da confirmação.
