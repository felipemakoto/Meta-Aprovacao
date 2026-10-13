# Qualidade das questões — etapa 44

Revisão em 13/10/2026, autorizada pelo pedido de melhorar a qualidade do banco. Mantidas 500 questões e seus IDs. Houve alteração de conteúdo em 186; 314 ficaram iguais, inclusive versões e registros no banco. Sem expansão, mudança de página, aplicação, seleção, limite ou cobrança. Todas permanecem draft; seis modelos não publicados.

## Alterações

| Matéria | Questões alteradas | Intervenção principal |
| --- | ---: | --- |
| Matemática | 30 | Retirada de soluções antecipadas em cinco famílias; médias corrigidas para escala de 0 a 10. |
| Português | 100 | Estímulos sem explicação pronta; vinte reescritas distintas; alternativas de manchete coerentes com o gênero. |
| Ciências | 40 | Hipóteses experimentais coerentes, pistas retiradas e oito tarefas com distratores conceituais. |
| História | 8 | Aplicação dos conceitos a situações concretas; distinção entre instituições, relações e mudanças históricas. |
| Geografia | 8 | Área e escala, concentração espacial, migração, produtividade, emissões, paralelos e denominadores. |

A condição necessária de inscrição ficou explícita: só será aceita se os dois requisitos forem cumpridos. No experimento de fotossíntese, A/B/D compartilham concentração inicial de gás carbônico; C é a exceção. A pergunta sobre terremotos agora avalia qual conclusão as evidências permitem, sem alternativas hipotéticas que também poderiam ser informações insuficientes.

## Evidências e limites

Treze testes Node passaram: estrutura/IDs/versões, cem cálculos de Matemática por relações independentes (incluindo enumeração de pares e probabilidades), medidas críticas, escala de notas, presença dos conectivos e distinção das tarefas de Português, seis novos cálculos e sete testes do receptor de anotações. Lint e sincronização dos arquivos aprovados. Testes não substituem julgamento humano de resposta única ou calibração da dificuldade. A classificação medium/hard foi mantida; não mede desempenho real de candidatos.

Ensaio SQL com rollback aprovado antes da carga: nove rejeições (conteúdo divergente, revisada, publicada, gabarito ausente, gabarito modificado, prática, simulado, diagnóstico e versão divergente). Reexecução idêntica não altera registros/timestamps. Preservadas por hash as questões/gabaritos fora da revisão, seis modelos e todos os registros de prática, simulados e diagnósticos. Carga real aplicada em transação com as mesmas proteções; consulta posterior comparou as 500 questões e seus gabaritos com a fonte.

Ferramenta v4 verificada em navegador isolado: 500 registros, filtros, gabaritos, persistência, exportação/importação, recusa de anotações incompatíveis, texto recebido sem executar HTML, falha de armazenamento e layout de 320/360/1100 px sem transbordamento. Zero chamadas externas. ZIP com três arquivos, sem credenciais; versão v3 e pasta do amigo preservadas.

## Revisão humana

Abrir out/revisao-editorial-meta-aprovacao-v4/revisao-editorial.html. Conferir resposta única, precisão conceitual, clareza, pertinência das alternativas e exigência real de raciocínio. Anotar ajustes e exportar JSON. v3 serve à consulta e exportação das anotações antigas; elas não aprovam esta versão automaticamente. Nenhuma revisão humana atribuída, nenhum conteúdo publicado ou contratação liberada.

## Referências adicionais conferidas

Regras de Português: [concordância verbal](https://www12.senado.leg.br/manualdecomunicacao/estilos/concordancia-verbal), [crase](https://www12.senado.leg.br/manualdecomunicacao/estilos/crase), [vírgula](https://www12.senado.leg.br/manualdecomunicacao/estilos/virgula) e [assistir](https://www12.senado.leg.br/manualdecomunicacao/estilos/assistir), no Manual de Comunicação do Senado. Contexto histórico da abertura dos portos: [Carta Régia de 28/01/1808, Câmara dos Deputados](https://www2.camara.leg.br/legin/fed/carreg_sn/anterioresa1824/cartaregia-35757-28-janeiro-1808-539177-publicacaooriginal-37144-pe.html). Exercícios autorais; referências não atribuem sua autoria ou gabaritos à banca.

## Rastreamento

Snapshot integral anterior: content/catalogo-etapa-43.json. Manifesto antes/depois: content/revisao-etapa-44.json. Atual: content/banco-etec-if.json. Carga explícita: supabase/content/revisao-etapa-44.sql. O gerador histórico de SQL 43 agora lê o snapshot 43, sem misturar versões.

Hash anterior: 12587da77ff0ee159b176f5e81431d7b5260ef475920fb7eb6075e9bb16981a4. Hash atual: 22e6bcd78f5b3f7b22373a9968196e30c12e6094d0189a2b3250964e96485df9.

### Matemática

M01 (v2 → v3), M07 (v3 → v4), M08 (v3 → v4), M16 (v3 → v4), M17 (v3 → v4), M18 (v3 → v4), M21 (v1 → v2), M27 (v1 → v2), M28 (v1 → v2), M36 (v1 → v2), M37 (v1 → v2), M38 (v1 → v2), M41 (v1 → v2), M47 (v1 → v2), M48 (v1 → v2), M56 (v1 → v2), M57 (v1 → v2), M58 (v1 → v2), M61 (v1 → v2), M67 (v1 → v2), M68 (v1 → v2), M76 (v1 → v2), M77 (v1 → v2), M78 (v1 → v2), M81 (v1 → v2), M87 (v1 → v2), M88 (v1 → v2), M96 (v1 → v2), M97 (v1 → v2), M98 (v1 → v2).

### Português

P01 (v2 → v3), P02 (v2 → v3), P03 (v3 → v4), P04 (v3 → v4), P05 (v3 → v4), P06 (v3 → v4), P07 (v3 → v4), P08 (v3 → v4), P09 (v3 → v4), P10 (v3 → v4), P11 (v3 → v4), P12 (v3 → v4), P13 (v3 → v4), P14 (v3 → v4), P15 (v3 → v4), P16 (v3 → v4), P17 (v3 → v4), P18 (v3 → v4), P19 (v3 → v4), P20 (v3 → v4), P21 (v1 → v2), P22 (v1 → v2), P23 (v1 → v2), P24 (v1 → v2), P25 (v1 → v2), P26 (v1 → v2), P27 (v1 → v2), P28 (v1 → v2), P29 (v1 → v2), P30 (v1 → v2), P31 (v1 → v2), P32 (v1 → v2), P33 (v1 → v2), P34 (v1 → v2), P35 (v1 → v2), P36 (v1 → v2), P37 (v1 → v2), P38 (v1 → v2), P39 (v1 → v2), P40 (v1 → v2), P41 (v1 → v2), P42 (v1 → v2), P43 (v1 → v2), P44 (v1 → v2), P45 (v1 → v2), P46 (v1 → v2), P47 (v1 → v2), P48 (v1 → v2), P49 (v1 → v2), P50 (v1 → v2), P51 (v1 → v2), P52 (v1 → v2), P53 (v1 → v2), P54 (v1 → v2), P55 (v1 → v2), P56 (v1 → v2), P57 (v1 → v2), P58 (v1 → v2), P59 (v1 → v2), P60 (v1 → v2), P61 (v1 → v2), P62 (v1 → v2), P63 (v1 → v2), P64 (v1 → v2), P65 (v1 → v2), P66 (v1 → v2), P67 (v1 → v2), P68 (v1 → v2), P69 (v1 → v2), P70 (v1 → v2), P71 (v1 → v2), P72 (v1 → v2), P73 (v1 → v2), P74 (v1 → v2), P75 (v1 → v2), P76 (v1 → v2), P77 (v1 → v2), P78 (v1 → v2), P79 (v1 → v2), P80 (v1 → v2), P81 (v1 → v2), P82 (v1 → v2), P83 (v1 → v2), P84 (v1 → v2), P85 (v1 → v2), P86 (v1 → v2), P87 (v1 → v2), P88 (v1 → v2), P89 (v1 → v2), P90 (v1 → v2), P91 (v1 → v2), P92 (v1 → v2), P93 (v1 → v2), P94 (v1 → v2), P95 (v1 → v2), P96 (v1 → v2), P97 (v1 → v2), P98 (v1 → v2), P99 (v1 → v2), P100 (v1 → v2).

### Ciências

C01 (v2 → v3), C02 (v2 → v3), C03 (v3 → v4), C05 (v3 → v4), C06 (v3 → v4), C07 (v3 → v4), C09 (v3 → v4), C12 (v3 → v4), C15 (v3 → v4), C17 (v3 → v4), C20 (v3 → v4), C21 (v1 → v2), C25 (v1 → v2), C26 (v1 → v2), C27 (v1 → v2), C29 (v1 → v2), C35 (v1 → v2), C40 (v1 → v2), C41 (v1 → v2), C45 (v1 → v2), C46 (v1 → v2), C47 (v1 → v2), C49 (v1 → v2), C55 (v1 → v2), C60 (v1 → v2), C61 (v1 → v2), C65 (v1 → v2), C66 (v1 → v2), C67 (v1 → v2), C69 (v1 → v2), C75 (v1 → v2), C80 (v1 → v2), C81 (v1 → v2), C85 (v1 → v2), C86 (v1 → v2), C87 (v1 → v2), C89 (v1 → v2), C95 (v1 → v2), C99 (v1 → v2), C100 (v1 → v2).

### História

H02 (v2 → v3), H04 (v3 → v4), H05 (v3 → v4), H07 (v3 → v4), H08 (v3 → v4), H14 (v3 → v4), H16 (v3 → v4), H18 (v3 → v4).

### Geografia

G63 (v1 → v2), G77 (v1 → v2), G81 (v1 → v2), G82 (v1 → v2), G86 (v1 → v2), G89 (v1 → v2), G98 (v1 → v2), G100 (v1 → v2).
