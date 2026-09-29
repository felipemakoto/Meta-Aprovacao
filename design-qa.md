# Etapa 15 — login e logout

final result: passed

Alvo: docs/design/login-mobile-v1.png, aprovado pelo usuário antes da implementação. Rota: /login. Verificação em 28/09/2026. Aprovação visual e interações verificadas; usuário confirmou em 28/09/2026 que o teste real solicitado de logout, login e recarga funcionou.

Evidências: [comparação conjunta](docs/design/login-comparacao.png), [390px](docs/design/login-390.png), [320px](docs/design/login-320.png), [desktop](docs/design/login-desktop.png), [erro](docs/design/login-erro.png), [autenticado](docs/design/login-autenticado.png). Referência de 854 × 1844 normalizada para 390 × 844 à esquerda; captura 390 × 844 à direita, viewport CSS 390 × 844. Sem recorte da interface. Conteúdo legível integralmente, sem necessidade de recortes adicionais.

Primeira comparação: links sem sublinhado (P2, indicação de interação inferior ao mockup). Corrigidos Criar conta e Continuar sem conta; reduzido o intervalo do link inferior. Captura renovada e segunda comparação conjunta inspecionada: sem pendências P0/P1/P2.

| Superfície | Resultado |
| --- | --- |
| Tipografia | DM Serif Display no título e Geist no corpo, mesmas fontes do cadastro; hierarquia e conteúdo preservados |
| Espaçamento | Painel único com dois campos, CTA e links na ordem aprovada; coluna limitada a 560px no desktop |
| Cores | Tokens marfim e verde, painel claro e bordas discretas; fundo sólido sem textura gerada |
| Ativos | Marca existente e ícones oficiais Heroicons (olho e seta); nenhum ativo novo necessário |
| Conteúdo | Entrar, e-mail, senha e links idênticos ao alvo; estado autenticado simples no mesmo sistema visual |

Diferenças P3 aceitas: campos reais de 48px e texto de 16px tornam painel cerca de 28px mais alto; diferenças de rasterização, espessura de ícones e fundo sólido. O indicador Next aparece apenas em desenvolvimento. Layout sem overflow em 320/390/1280px; entrada pública também conferida em 320px após adicionar Minha conta.

Interações: validação nativa foca e-mail vazio, mostrar/ocultar senha alterna estado acessível, envio desabilita campos/botão, credenciais fictícias recebem mensagem genérica com foco, links cadastro/login/início funcionam. Sessão real existente reconhecida e preservada ao recarregar 127.0.0.1. Console final sem erros/avisos. Logout com sessão e novo login positivo confirmados pelo usuário após teste manual; testes automatizados cobrem handlers, falhas, origem, payload e logout sem sessão.

Checklist: alvo aprovado; comparação conjunta refeita; links corrigidos; responsividade e estados conferidos; evidências salvas; preview mantido aberto.

# Etapa 14 — cadastro

final result: passed

Alvo: [opção 2 aprovada](docs/design/cadastro-opcao-2.png). Implementação: /cadastro. Conferência iniciada em 27/09 e encerrada em 28/09/2026. Este resultado aprova o escopo visual e as interações verificadas; o usuário confirmou em 28/09/2026 que o fluxo real chegou à tela E-mail confirmado.

Evidências: [comparação conjunta](docs/design/cadastro-comparacao.png), [390px](docs/design/cadastro-390.png), [320px](docs/design/cadastro-320.png), [desktop](docs/design/cadastro-desktop.png) e [retomada](docs/design/cadastro-retomada.png). Referência à esquerda, aplicação à direita na comparação. Viewport alvo 390 × 844 CSS, captura de 390 × 844 com escala interna aproximada de 0,8 no navegador. Região superior esquerda de 312 × 675 ampliada proporcionalmente a 390px; referência reduzida proporcionalmente. Medidas de DOM complementam a comparação, sem alegação de precisão pixel a pixel. Imagens completas preservadas.

Primeira passagem: título menor e formulário excessivamente alto (P2). Ajustados título móvel até 54px, campos a 48px, labels a 15px, espaçamento e largura do painel. Segunda comparação inspecionada: hierarquia, proporções e conteúdo recuperados. Sem pendências P0/P1/P2 no escopo conferido. Diferenças P3: formulário ligeiramente mais alto para campos legíveis de 16px, fontes reais, fundo sólido e renderização dos ícones. Ícone Next de desenvolvimento não integra o produto final.

| Superfície | Conferência |
| --- | --- |
| Tipografia | DM Serif Display regular no título; Geist no corpo; título e labels legíveis nas três larguras |
| Espaçamento | Cabeçalho, introdução, painel único, campos e CTA na ordem escolhida; coluna central no desktop |
| Cores | Tokens marfim/verde existentes, fundo do painel claro, borda discreta; sem gradientes |
| Ativos | Marca existente e ícones Heroicons oficiais; não foi necessário gerar outros ativos |
| Conteúdo | E-mail, senha, confirmação, orientação, Criar conta e Continuar sem conta preservados |

Comparação integral permite ler todos os campos e controles; nenhum recorte adicional foi necessário. Navegador conferiu formulário vazio/inválido, foco no primeiro erro, revelar senha, navegação por teclado, saída sem conta, callback inválido e acesso pelo resumo do quiz. Sem overflow horizontal em 320/390/1280px e na retomada de 448px. Console sem erros/avisos capturados na verificação inicial. A retomada exigiu reiniciar o servidor e recarregar a aba para eliminar estilos antigos; aparência corrigida após recarga, sem alteração de código.

Build/lint e 21 testes passaram na implementação; 12 testes específicos de cadastro foram repetidos e passaram na retomada. Dados positivos unitários são simulados. Não foram testados no navegador envio real, entrega, sucesso real de confirmação ou falhas de rede. Limites e roteiro em [CADASTRO.md](docs/CADASTRO.md). Checklist concluído: comparação, correção visual, responsividade, estados inválidos, navegação, documentação. Pausa para teste real do usuário; não avançar etapa 15 automaticamente.

---

# Etapa 13 — resultado e revisão

final result: passed

Alvos explicitamente escolhidos: docs/design/resultado-opcao-3.png como resumo após conclusão; docs/design/resultado-opcao-2.png para revisão de erros um a um. Código implementado preservando fontes, tokens, ícones e aplicação existentes. Não há novos ativos raster necessários.

Verificação concluída em 26/09/2026 após restabelecer o servidor e o navegador. As falhas de inicialização da ferramenta e de conexão da sessão anterior deixaram o checkpoint 189e13d parcial; não persistiram nesta conferência.

Comparações inspecionadas: [resumo com imagem 3](docs/design/resultado-comparacao.png) e [revisão com imagem 2](docs/design/revisao-comparacao.png). Capturas originais: [resumo 390](docs/design/resultado-final-390.png), [revisão 390](docs/design/revisao-final-390.png), [320](docs/design/resultado-320.png) e [desktop](docs/design/resultado-desktop.png).

Viewport alvo 390 × 844 CSS; capturas de página inteira em 375 × 860 e 375 × 964. O navegador apresenta escala interna aproximada de 5/6. Para comparação, a região superior esquerda de 312px de largura e 5/6 da altura foi ampliada proporcionalmente para 390px; as referências também foram reduzidas proporcionalmente para 390px. Originais preservados; medidas do DOM complementaram a inspeção. Normalização aproximada, sem alegação de equivalência pixel a pixel.

Composição, cores, ordem dos conteúdos e hierarquia correspondem às escolhas. Diferenças P3: título e números menores que no raster, fontes reais, fundo sólido, destaque verde-lima e revisão mais alta com número original da questão e rótulo textual de erro. Rolagem natural, sem sobreposição ou corte de conteúdo. Sem pendências P0/P1/P2 identificadas no escopo conferido. Ícone de ferramentas Next exclusivo de desenvolvimento.

Verificados no navegador: três erros um a um, anterior/próximo/concluir, retorno ao resumo, abertura direta do segundo erro, dez respostas, cenários 0/10 e 10/10, ativação por Enter e foco no título. Dez posições de /quiz/preview respondidas por teclado e Finalizar teste abriu o resumo ilustrativo. O clique automatizado de seleção sofreu desalinhamento de coordenadas nesta sessão; seleção confirmada por Espaço. Sem overflow horizontal em 320, 390 e 1280px. Console sem erros/avisos capturados.

Lint/build, 30 testes automatizados e bloqueio HTTP da prévia em produção passaram no checkpoint de implementação; não repetidos, pois esta retomada altera somente documentação e evidências. Questões continuam draft: percurso positivo real com conteúdo publicado ainda depende da revisão editorial. A prévia não corrige as escolhas e não substitui esse teste. Falhas de rede/expiração não foram provocadas na interface. Roteiro para o usuário em docs/RESULTADO.md. Relatórios abaixo são históricos.

---

# Verificação visual — etapa 11

Resultado: **passed** para a interface aprovada. Não representa aprovação editorial ou implementação da correção.

[Comparação conjunta](docs/design/quiz-comparison.png): mockup à esquerda e aplicação à direita, ambos normalizados para 390px de largura sem deformação. Referência original: 941 × 1672; captura: 375 × 749; viewport CSS: 390 × 780. A escala do navegador integrado reduz a nitidez da evidência. Aviso de prévia exclusivo de desenvolvimento, fora do questionário.

Evidências: [inicial](docs/design/quiz-implemented-390.png), [seleção](docs/design/quiz-selected-390.png), [320px](docs/design/quiz-320.png), [desktop](docs/design/quiz-desktop.png). Comparação e capturas inspecionadas.

Primeira passagem: título em quatro linhas e margens excessivas deslocavam opções (P2). Ajustados título para 26px, margens de 24px e espaçamento do cabeçalho. Segunda passagem: três linhas, hierarquia e sequência fiéis à referência. Diferenças P3 aceitas: fontes reais, fundo sólido, opções ligeiramente mais altas e barra de rolagem nativa. Nenhuma pendência P0/P1/P2 no escopo visual. Desktop em coluna central de 640px.

Verificados: CTA desabilitado, seleção única por espaço/setas, foco no enunciado, dez posições, retorno preservando escolha, revisão e saída. Sem overflow em 320/390/1280px. Fluxo real mostra falta de questões publicadas; prévia retorna 404 em produção. Console sem erros/avisos capturados. Lint/build e 14 testes aprovados. Rede indisponível e expiração não provocadas manualmente. Pausa para teste do usuário.

---

# Verificação visual — etapa 4

Resultado: **passed**, dentro do escopo da entrada aprovada. Não representa aprovação de um quiz funcional. Teste do usuário ainda pendente.

## Referência e evidências

- Alvo: [mockup v4](docs/design/entrada-mobile-v4.png), 854 × 1844 pixels, aprovado pelo usuário.
- Página: http://localhost:3000/, código em src/app.
- [Comparação final lado a lado](docs/design/qa/comparacao-mobile.png): alvo à esquerda, implementação à direita.
- [Mobile final](docs/design/qa/mobile-after.png), [320px](docs/design/qa/mobile-320.png), [desktop](docs/design/qa/desktop.png).
- [Primeira passagem](docs/design/qa/mobile-before.png), antes de ajustar tamanho do título, introdução e espaçamento.

## Dimensões e normalização

Viewport alvo de 390 × 844 pixels CSS. O mockup foi reduzido a essa dimensão. Nesta captura do navegador no Windows, o conteúdo aparece com fator de 0,8 dentro do PNG apesar do DOM reportar viewport 390 × 844 e devicePixelRatio próximo de 1. A margem CSS de 23px aparece com aproximadamente 18px; o topo de 50px aparece com 40px.

Para comparar as mesmas proporções, a região superior esquerda de 312 × 675px da captura foi ampliada para 390 × 844px e colocada ao lado da referência, em imagem única de 780 × 844px. As capturas originais foram preservadas. Essa normalização reduz a nitidez da evidência e não é uma alteração da página. As medidas do DOM complementaram a inspeção. Telas adicionais: 320 × 740 e 1280 × 900 pixels CSS.

## Histórico de revisão

1. Primeira passagem: título com quebra diferente e introdução em duas linhas; posição do CTA antecipada. Classificação P2 por diferença visível da referência.
2. Ajustados título de 44 para 46px, introdução de 21 para 22px e espaço antes do botão de 126 para 116px. Título e introdução passaram a três linhas na largura alvo. CTA medido no DOM em y=518px, próximo dos 519px da referência normalizada.
3. Nova comparação conjunta inspecionada após build. Sem pendências P0/P1/P2. Pequenas diferenças de fonte, textura raster, desenho do destaque e alguns pixels no rodapé são P3 aceitas nesta implementação responsiva; não alegamos equivalência pixel a pixel.

## Conferência visual

| Área | Resultado |
| --- | --- |
| Composição | Marca, pergunta, introdução, espaço vazio, CTA e rodapé na ordem aprovada; card removido |
| Tipografia | DM Serif Display carregada no título; Geist no corpo; quebras conferidas em 390px |
| Cores | Tokens de fundo, texto, ação e marca-texto aplicados; fundo sólido |
| Ícones | Heroicons oficiais locais, carregados; licença MIT preservada |
| Texto | Conteúdo aprovado preservado; frases decorativas removidas |
| Responsividade | Sem overflow horizontal nas três larguras; coluna de até 560px no desktop |

## Verificação de interação e código

- Tab alcança o botão com foco visível; Enter exibe aviso em região de status.
- Clique repetido mantém uma mensagem; não cria quiz, tentativa ou resultado.
- Clique conferido também no build de produção, em 320px.
- Fontes carregadas e dois ícones com dimensões naturais válidas.
- Contraste calculado pela luminância relativa sRGB: texto principal/fundo 13,77:1, secundário/fundo 5,79:1, branco/botão 9,74:1 e título/marca-texto 11,87:1. Todos acima de 4,5:1.
- Console consultado sem erros ou avisos durante a verificação.
- npm run lint e npm run build aprovados após os ajustes finais. Build inclui checagem TypeScript.
- Viewport temporário restaurado; navegador deixado na entrada, sem aviso aberto.

Limites: testes no navegador integrado deste computador; sem auditoria completa por leitor de tela nem teste em dispositivo físico. O fallback noscript está implementado, mas não foi exercitado com JavaScript desativado. Quiz e integrações fora desta etapa.
