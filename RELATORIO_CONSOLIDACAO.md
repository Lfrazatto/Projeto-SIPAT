# Relatório de consolidação — Cummins SIPAT 2026

## Resumo executivo

Os projetos `sipat-ms120-explorer` e `cummins-sipat-challenge` foram comparados em experiência, conteúdo, jogos, acessibilidade, administração, segurança, banco de dados e testes. A versão final usa como base a experiência mais completa do **Cummins SIPAT Challenge**, preservando seus quatro desafios, identidade industrial e painel administrativo, e incorpora os pontos tecnicamente superiores do **MS-120 Explorer**, incluindo regras de backend mais seguras, edição administrativa de cenários, testes adicionais e catálogo 3D ampliado.

O resultado é uma única aplicação full-stack denominada **Cummins SIPAT — Desafio MS-120 2026**, com navegação pública consistente, banco de dados funcional, jogos integrados, ranking, consulta individual de progresso, administração e uma camada abrangente de inclusão.

## Decisões de consolidação

| Área | Escolha preservada | Motivo |
|---|---|---|
| Experiência visual | Linguagem industrial escura, hierarquia editorial e cartões do projeto Challenge | Experiência mais coesa, completa e adequada ao contexto fabril |
| Jogos | Quatro desafios do projeto Challenge | Cobertura funcional superior: segurança, ergonomia, inspeção visual e 5S |
| Backend | Regras mais seguras e testes complementares do Explorer | Melhor proteção administrativa, validação e manutenção |
| Projeto 3D | Catálogo e visualizador detalhado do Explorer | Maior riqueza técnica e melhor exploração dos componentes MS-120 |
| Administração | Painel completo do Challenge com melhorias do Explorer | Preserva gestão de perguntas, cenários e configurações sem perder segurança |
| Conteúdo | Padronização para Cummins SIPAT 2026 | Remove inconsistências de nomenclatura entre as duas fontes |

## Melhorias inclusivas

A aplicação agora oferece **atalho para o conteúdo principal**, títulos específicos por rota, foco visível, navegação por teclado, alvos de toque adequados, zoom do navegador e estados anunciados por leitores de tela. Um painel global permite ativar **alto contraste**, **texto ampliado**, **movimento reduzido** e **tempo dobrado nos jogos**; as preferências ficam armazenadas localmente no navegador.

Os desafios cronometrados podem ser pausados. O diálogo de pausa recebe foco automaticamente e bloqueia respostas ao fundo. O jogo **Organize a Fábrica** pode ser operado por clique, toque, teclado ou arrastar e soltar. O jogo **Ache o Erro** possui um modo textual equivalente, evitando que a participação dependa exclusivamente de visão, precisão do ponteiro ou comparação de imagens.

Links que continham botões foram corrigidos para expor apenas um elemento interativo às tecnologias assistivas. Formulários, filtros, feedbacks, carregamentos, falhas e estados vazios possuem rótulos e semântica explícitos.

## Privacidade e segurança

A identificação do participante permanece apenas durante a sessão do navegador. O ranking público mascara chapa e WWID. Visitantes podem participar informando somente o nome. A credencial administrativa fixa foi removida de produção e a comparação do segredo administrativo foi endurecida. Uploads e URLs de cenários continuam validados no backend, e os jogos evitam submissões duplicadas de resultados.

O participante fictício usado no teste funcional foi excluído do banco ao final da auditoria.

## Qualidade visual e conteúdo

Ativos externos quebrados foram substituídos por ilustrações locais, responsivas e acessíveis. A marca do cabeçalho passou a ser tipográfica e resiliente. A página 404 foi refeita em português e integrada ao tema. Foi adicionado o alias `/projeto`, evitando um endereço intuitivo sem saída. O rodapé duplicado da página inicial foi removido e a navegação global foi uniformizada.

As oito rotas principais foram verificadas em desktop e celular: Início, Sobre, Nosso projeto, Projeto 3D, Jogos, Ranking, Meu progresso e Admin. Foram realizadas 16 capturas finais em **1280 × 900** e **375 × 812**.

## Validação técnica

| Verificação | Resultado |
|---|---|
| TypeScript (`pnpm check`) | Aprovado, sem erros |
| Testes (`pnpm test`) | **42 de 42 aprovados**, em 9 arquivos |
| Build de produção (`pnpm build`) | Aprovado |
| Migração do banco | Gerada e aplicada no banco gerenciado |
| Fluxo real de participante | Identificação, redirecionamento, seleção de dificuldade, início e pausa do quiz aprovados |
| Auditoria responsiva | 8 rotas em desktop e 8 rotas em celular aprovadas |
| Dependências | Three.js e tipos declarados corretamente |

O build emite somente um aviso não bloqueante sobre o tamanho do bundle JavaScript. Como evolução futura, o visualizador 3D pode ser carregado sob demanda com divisão de código, reduzindo o download inicial sem alterar a funcionalidade.

## Resultado entregue

A versão final combina o melhor dos dois projetos sem manter duplicações de interface ou inconsistências de dados. O preview gerenciado está disponível em:

<https://3000-ine5x8lszvhu4xyfuk0x1-50afdd21.us1.manus.computer>


## Integração de fotos reais de Osasco

Atendendo à solicitação, foram pesquisadas e selecionadas imagens editoriais públicas reais ligadas diretamente à unidade Cummins/Meritor em Osasco:

1. **Linha automatizada de produção em Osasco** (`/manus-storage/cummins-osasco-linha-producao_72e7e8d9.jpg`), originada de cobertura jornalística da *Transporte Moderno* sobre a modernização e nova geração de eixos.
2. **Operação e montagem na planta de Osasco** (`/manus-storage/cummins-meritor-osasco-montagem_642e64a0.jpg`), divulgada por veículos do setor (*Portal da Autopeça*) sobre a modernização industrial da unidade.
3. **Eixo MS-18X HD** (`/manus-storage/eixo-ms18x-cummins_1bf791f6.jpg`), divulgado pela *Revista M&T* em notícia sobre a produção local na planta de Osasco.

As imagens foram incorporadas por meio do componente `RealFactoryPhoto`, que inclui texto alternativo detalhado, legenda contextual, link para a publicação de referência e conformidade com alto contraste e navegação por teclado. As fotos foram distribuídas nas páginas **Início**, **Sobre** e **Projeto 3D**, substituindo ilustrações genéricas nos pontos de maior destaque institucional e técnico.


## Atualizações de identidade e comunidade

Em atendimento às solicitações mais recentes:
1. **Red Flag:** o texto da seção na página inicial foi atualizado para:
   > **RED FLAG | ATENÇÃO MÁXIMA À SEGURANÇA**  
   > Na Cummins, a segurança das pessoas vem em primeiro lugar.  
   > O Red Flag reforça a necessidade de atenção máxima em nossas atividades, com foco na identificação de riscos, prevenção de incidentes e cuidado com todos ao nosso redor.
2. **Logo oficial da Cummins:** o símbolo anterior foi substituído pela marca oficial vetorial com a letra `C` e o wordmark `Cummins`, aplicada tanto no cabeçalho global quanto no destaque do painel Red Flag.
3. **Foto da equipe em "Nosso projeto":** a fotografia real enviada dos integrantes do projeto foi inserida na seção "Quem criou esta ideia", acompanhada de legenda descritiva e texto alternativo acessível.


## Atualização Geral — Auditoria e Implementação do Prompt Mestre

Em conformidade com todas as diretrizes do prompt mestre de excelência (18 seções):
1. **Página Inicial Reestruturada**: novo cabeçalho limpo com CTA *Começar agora*, seção *Como funciona* em 3 passos com indicador de progresso 0/4, vitrine detalhada dos 4 jogos com selo de recomendação e dados de interação/tempo/dificuldade, pilares claros da SIPAT e chamada final para ação.
2. **Quatro Jogos Padronizados e Educativos**: quizzes com banco rotativo dinâmico de perguntas e alternativas equilibradas; Ache o Erro com pares reais e hotspots calibrados; Organize a Fábrica acessível por teclado; telas de encerramento padronizadas com navegação para ranking e progresso.
3. **Ranking e Progresso**: ranking com visualização em tabela no desktop e cards adaptativos no celular; anonimização e mascaramento de identificadores; exibição de horário de atualização e explicação do cálculo; página Meu Progresso com dicas personalizadas de segurança.
4. **Projeto 3D Otimizado**: assembly enriquecida com elementos mecânicos volumétricos; animação coordenada de componentes internos; modos normal e curva; foto real da fábrica ao fundo; carregamento sob demanda (lazy loading) via Suspense.
5. **Segurança e Higienização**: todos os participantes de teste foram removidos do banco de produção; testes automatizados agora possuem limpeza automática; credencial administrativa isolada via secret de ambiente com tempo constante de validação; rate limiting ativo em endpoints críticos.
6. **Acessibilidade Completa**: toolbar flutuante com alto contraste, redução de movimento, tempo estendido e escala de fontes; foco visível e navegação por teclado em 100% dos fluxos.


## Conteúdo Educativo Permanente, Formare e História da Cummins

Em atendimento ao novo briefing institucional:

1. **Posicionamento do Formare antes da equipe:** a página `/nosso-projeto` abre com a declaração destacada *"Somos alunos do Formare e desenvolvemos este projeto para a SIPAT Cummins Osasco."*, explica o programa, a transformação que ele promove e só depois apresenta a foto oficial da turma com legenda e créditos.
2. **Página dedicada do Formare (`/formare`):** criada para explicar a combinação de aprendizagem técnica, desenvolvimento pessoal e responsabilidade social, distinguindo a Fundação Iochpe da filantropia independente da Cummins Foundation e alertando sobre dados que dependem de validação oficial.
3. **História da Cummins com fontes verificáveis (`/historia-cummins`):** linha do tempo cronológica com marcos de 1919 (fundação por Clessie Cummins e William G. Irwin), expansão de motores, fábrica na Escócia em 1956, constituição no Brasil em 1971, aquisição da Meritor em 2022 e a presença em Osasco (CDBS Fábrica 1 e 2).
4. **Galeria institucional acessível (`/galeria`):** reúne as fotos reais com filtros por categoria, visualização ampliada em modal com navegação por teclado (`Escape`, setas esquerda/direita), alt text descritivo e indicação clara de crédito e autorização.
5. **Navegação atualizada:** o menu superior e o rodapé agora incluem acessos diretos a Formare, História e Galeria, sem esconder nenhum conteúdo essencial e sem criar missões ou notificações recorrentes.


## Redesign Completo e Interatividade (Prompt Mestre)

Em atendimento ao prompt mestre de reorganização e redesenho interativo:

| Área | Alterações Realizadas |
|---|---|
| **Barra de Navegação** | Criada estrutura com dois níveis: links principais (`Início`, `Jogos`, `Ranking`, `Meu progresso`, `Nosso projeto`) e menu institucional (`Formare`, `História da Cummins`, `Galeria de fotos`, `Sobre a SIPAT`, `Projeto 3D`). Adicionados botão destacado `Participar agora`, indicador de página ativa, indicador compacto de pontuação para participantes identificados e barra sutil de progresso de leitura ao rolar. No mobile, implementado painel acessível com fechamento por Escape, foco restrito e clique externo. |
| **Primeira Dobra da Home** | Criada hero com atmosfera industrial moderna: foto real da produção de Osasco em baixa opacidade, grid técnico, gradiente dinâmico com brilho controlado e painel de comando lateral com os quatro desafios. Títulos: `CUMMINS SIPAT — DESAFIO 2026` e `Segurança começa com uma escolha`. |
| **Missão e Progresso** | Adicionada seção `Sua missão começa agora` com as três etapas (`Identifique-se`, `Desafie seus conhecimentos`, `Suba no ranking`). Se o usuário estiver identificado, a chamada é atualizada para `Continue sua missão`, exibindo o total de desafios já concluídos e a pontuação somada. |
| **Central de Jogos** | A Home agora apresenta cards com personalidade visual própria: Quiz de Segurança (vermelho de atenção), Quiz de Ergonomia (ciano/verde de saúde), Ache o Erro (âmbar de inspeção) e Organize a Fábrica (azul de fluxo 5S). Cada card exibe tempo, mecânica de interação, melhor pontuação do participante e botão de ação imediata. Na página `/jogos`, os botões foram padronizados para `JOGAR AGORA`. |
| **Ranking Competitivo** | O pódio do Top 3 recebeu animação de entrada e hierarquia marcante para o líder. Participantes identificados visualizam uma faixa personalizada informando sua colocação e quantos pontos faltam para alcançar o próximo colocado. |
| **Red Flag** | A seção foi organizada nas três etapas fundamentais (`PARE`, `COMUNIQUE`, `AJA COM SEGURANÇA`), acompanhada da frase institucional `Atenção identifica. Atitude protege.` e do botão direto para praticar nos jogos. |
| **Rodapé Útil** | Reestruturado com logotipo oficial da Cummins, atalhos de navegação, status do evento, versão, chamada final e indicação clara de que a identificação permanece apenas durante a sessão do navegador. |
| **Movimento e Acessibilidade** | Transições de página rápidas (.18s), revelação de elementos ao rolar sem atraso perceptível e respeito estrito a `prefers-reduced-motion`, no qual as animações são substituídas por exibições imediatas. |
| **Validação Responsiva** | Verificação visual realizada em 320px, 375px, 414px, 768px, 1024px, 1280px, 1440px e 1920px, sem detecção de overflow horizontal ou elementos cortados. |


## Atualização — Interatividade, feedback e conteúdo institucional

Nesta rodada, a experiência foi refinada para funcionar como uma central de missão contínua, não apenas como uma sequência de páginas. A Home recebeu parallax suave controlado pelo ponteiro, brilho de cursor, linhas de energia, entrada sequencial do conteúdo e cards de missão clicáveis. A preferência de movimento reduzido continua desligando as animações não essenciais.

O bloco Red Flag passou a ter uma sequência interativa em três etapas — **PARE**, **COMUNIQUE** e **AJA COM SEGURANÇA** — com estado ativo, avanço progressivo, feedback final e CTA para praticar nos jogos. O Ranking recebeu contadores animados para as pontuações do pódio, sem modificar os valores reais calculados pelo servidor.

A página História da Cummins agora usa uma timeline expansível com marcos selecionáveis, fonte oficial e painel de conteúdo contextual. A página Nosso projeto recebeu uma timeline do processo do Formare, de “Aprendemos” a “Entregamos”, também operável por teclado e toque. Os componentes novos foram implementados com estados persistentes enquanto o usuário navega na seção, foco visível e suporte a telas estreitas.

A validação final desta rodada foi concluída com **TypeScript sem erros**, **42 testes passando em 9 arquivos** e **build de produção concluído**. A auditoria visual confirmou Home, História da Cummins e Nosso projeto em desktop e mobile; o console do navegador não apresentou erros durante a navegação.


## Correção do Organize a Fábrica — 21/09/2026

A mecânica do quarto desafio foi redesenhada para corresponder ao objetivo de organização física e melhoria contínua. O fluxo deixou de ser um classificador de categorias e passou a ter duas etapas: primeiro, o participante encaixa itens em locais padronizados do posto de trabalho; depois, organiza a sequência 5S/Lean em cinco posições de fluxo. O jogo mantém arrastar e soltar, toque, seleção por teclado, feedback educativo, slots travados após acerto, cronômetro, pausa, pontuação e envio do resultado ao ranking.

A validação funcional foi feita no navegador com um encaixe individual, os cinco encaixes restantes, a transição para a etapa Lean e a sequência correta de cinco etapas. O modal de resultado também foi ajustado para exibir “tarefas” e a quantidade real do desafio, sem a indicação genérica de “12 perguntas”.


## Melhoria de jogabilidade e mobile — 21/09/2026

O Organize a Fábrica recebeu uma camada adicional de clareza e ritmo. O cabeçalho agora exibe a porcentagem concluída com barra de progresso, identifica visualmente a etapa atual e mantém o contador de tarefas. Quando um item é selecionado por toque, uma orientação persistente informa qual ação deve ser feita em seguida, enquanto cada cartão mostra a estação de destino sem entregar o encaixe exato. Na etapa Lean, o próximo foco do ciclo 5S fica destacado para reduzir dúvidas sem eliminar a necessidade de ordenar o processo.

Em telas pequenas, foram ajustados espaçamentos, alturas mínimas, áreas de toque, densidade de cartões, cabeçalho com timer e grade da sequência Lean. A validação no navegador confirmou seleção, orientação contextual e encaixe correto; `pnpm check`, `pnpm test` com 42 testes e `pnpm build` foram aprovados.


## Melhoria Mobile Abrangente — 21/09/2026

A experiência móvel foi revisada de forma transversal, com foco em uso real por toque, teclado virtual, leitores de tela e dispositivos com safe area. Foi criado um CTA móvel persistente para iniciar os desafios e acessar o ranking, ocultado durante partidas para não cobrir controles. O menu móvel passou a restaurar foco, anunciar corretamente o diálogo e fechar por toque externo usando Pointer Events.

O formulário de identificação ganhou `inputMode`, autocomplete semântico, modal com altura baseada em `dvh`, campos maiores e ações de confirmação/cancelamento com alvos confortáveis. O Ranking passou a usar filtros horizontais roláveis, busca e ordenação empilhadas no celular e botões com altura mínima adequada. O quiz recebeu cabeçalho refluído, alternativas maiores, resultado vertical e modal rolável; a galeria passou a conter o foco, restaurá-lo ao fechar e suportar Escape, setas e Tab sem fuga de foco.

O Ache o Erro amplia alvos de toque em dispositivos touch sem alterar a função geométrica usada pelos testes de precisão. A página da equipe mantém dimensões explícitas e carregamento preguiçoso abaixo da primeira dobra. CSS adicional trata safe areas, orientação paisagem curta, viewport dinâmica, prevenção de zoom involuntário em inputs e redução de densidade visual em telas estreitas.

A auditoria visual cobriu 375 × 812 px nas rotas Home, Jogos, Organize a Fábrica, Ranking, Meu progresso, Formare e Galeria. A avaliação DOM confirmou overflow horizontal zero na sessão disponível. `pnpm check`, `pnpm test` e `pnpm build` foram executados com sucesso; **42 testes passaram**.

## Atualização - Rodada de Legibilidade e Visualização para Pessoas Mais Velhas
- Implementadas melhorias visuais abrangentes sem alterar as regras e sem revelar antecipadamente os riscos/respostas:
  - Escala de tipografia aumentada em perguntas, opções, timers, instruções e painéis de jogo.
  - Alternativas de quiz agora ocupam blocos generosos de pelo menos 5.25rem de altura com destaque de foco e hover em amarelo ouro industrial.
  - No jogo Ache o Erro, imagens em smartphones e tablets de até 1023px são apresentadas em tamanho expandido por abas alternadas com rótulos contrastantes ("Inspeção" e "Referência segura"), impedindo o encolhimento de detalhes visuais que ocorria no modo lado a lado simultâneo.
  - No jogo Organize a Fábrica, cartões de ferramentas e bancadas de 5S/Lean ganharam tipografia de 1rem, altura ampliada para toque confortável (6.25rem a 7rem) e alto contraste.
  - Todos os 42 testes automatizados continuam passando e o build de produção Vite + esbuild foi concluído sem inconsistências.

## Atualização — Navegação Mobile Oficial e Equilíbrio Pedagógico dos Jogos (22/09/2026)

Nesta etapa, a navegação mobile e os três jogos editáveis da SIPAT Cummins 2026 foram consolidados com os seguintes resultados:

1. **Navegação Mobile Padronizada com os 8 Links Oficiais**:
   O menu retrátil em telas móveis passou a exibir rigorosamente os oito links oficiais na ordem de prioridade solicitada: *Começar desafio*, *Jogos*, *Ranking*, *Meu progresso*, *Nosso projeto*, *Formare*, *História da Cummins* e *Galeria de fotos*.
   A experiência móvel cumpre as diretrizes de acessibilidade WCAG AA: alvos de toque com altura mínima entre 48px e 50px, botão disparador de 44x44px, contenção de foco com tecla Tab, fechamento com Escape ou clique no fundo escurecido e travamento da rolagem da página quando o menu estiver aberto.

2. **Quizzes de Segurança e Ergonomia**:
   O catálogo de perguntas foi reformulado e balanceado com 36 perguntas técnicas reais (18 para Segurança e 18 para Ergonomia), estruturadas em 6 fáceis, 6 médias e 6 difíceis para cada jogo. Foram eliminadas todas as perguntas duplicadas ou genéricas.
   O backend tRPC filtra perguntas pela dificuldade selecionada pelo usuário e calcula a pontuação proporcional ao tempo restante com base na complexidade do nível (100, 200 e 300 pontos base). Cada resposta conta com justificativa técnica aprofundada orientada ao chão de fábrica da unidade de Osasco.

3. **Organize a Fábrica (5S & Lean)**:
   A mecânica bifásica oficial (encaixe físico por estação fabril + ordenação da esteira Lean em cinco sensos) foi mantida com estabilidade. O jogo possui suporte a múltiplos métodos de entrada (arrastar e soltar, toque móvel e teclado acessível com Tab e Enter) e pontuação calibrada.

4. **Jogo Ache o Erro (Intacto)**:
   Conforme instrução expressa, o jogo *Ache o Erro* não sofreu qualquer alteração em sua lógica, preservando seus 5 cenários reais, hotspots de risco calibrados em banco de dados e modo de acessibilidade textual.

5. **Validação Técnica e Build**:
   TypeScript 100% aprovado sem erros (`pnpm check`), Vitest com 42 testes passando em 9 arquivos (`pnpm test`) e build de produção compilado com sucesso (`pnpm build`).


## Atualização — Mural “Voltar Seguro para Casa” e Limpeza de Mensagens Demonstrativas (22/09/2026)

Implementamos dentro da aplicação da SIPAT Cummins Osasco o espaço emocional, acolhedor e seguro solicitado no briefing:

1. **Localização e Integração**:
   - **Página Inicial**: A seção do mural foi posicionada estrategicamente imediatamente após a seção de **Red Flag** e antes da **Central de Jogos** (`#central-jogos`), estabelecendo uma transição natural de consciência: *"Depois de identificar o risco, lembre-se do motivo para se cuidar"*.
   - **Página Dedicada (`/mural`)**: Ambiente tranquilo para leitura de todas as mensagens aprovadas, pesquisa por palavras-chave, contadores em tempo real, visualização do motivo em destaque e paginação com "Carregar mais".
   - **Menu e Navegação**: O link oficial *Mural* foi adicionado ao menu principal no desktop e no mobile (posicionado logo após *Jogos* e *Ranking*).

2. **Fluxo de Publicação e Experiência do Usuário**:
   - Botão de destaque **"Deixar minha mensagem"** presente na Home, na página `/mural` e em chamadas contextuais após a finalização de cada jogo.
   - Formulário acessível (`MuralSubmitModal`) com seleção de 6 perguntas orientadoras oficiais:
     - *“Eu me cuido porque...”*
     - *“Quero voltar para casa para...”*
     - *“Minha maior motivação é...”*
     - *“Deixo esta mensagem para...”*
     - *“Segurança, para mim, significa...”*
     - *“Eu escolho voltar seguro porque...”*
   - Limite de 280 caracteres com contador dinâmico e aviso colorido.
   - Opção de identificação pública por primeiro nome/apelido ou publicação anônima.
   - Checkbox de consentimento obrigatório para publicação pública.
   - Sanitização de texto contra injeção de HTML/scripts e prevenção de duplo clique.

3. **Moderação e Proteção de Dados (Privacidade por Padrão)**:
   - Nenhuma mensagem enviada por participante aparece imediatamente na área pública. Todas entram com o status inicial `pendente`.
   - **Todas as frases demonstrativas e de teste geradas durante o desenvolvimento foram excluídas definitivamente do banco de dados e do código de inicialização.**
   - Os exemplos de frases foram mantidos exclusivamente como **guia de inspiração dentro da caixa de envio do participante**, sem qualquer publicação no mural.
   - Algoritmo de filtragem automática (`analyzeMuralSafety`) que analisa números de telefone, endereços de e-mail, links externos, documentos (CPF/CNPJ) e termos inadequados, sinalizando para o moderador.
   - Nunca são divulgados publicamente dados confidenciais como chapa, WWID ou e-mail.

4. **Painel de Moderação no `/admin`**:
   - Nova aba dedicada **"Moderação Mural"** no Painel de Controle protegido por secret.
   - Listagem com busca, filtros de status (`pendente`, `aprovada`, `rejeitada`, `arquivada`), alerta visual de moderação (`flagged`), botão de **Aprovar**, **Rejeitar**, **Tornar Destaque** (ou remover), **Editar texto** (para correção gramatical/formatação) e **Excluir**.
   - Mensagem em destaque configurada pelo gestor para exibição proeminente no topo do mural.

5. **Testes Automatizados e Build**:
   - Criada a suíte `server/mural.test.ts` com 5 testes de integração cobrindo sanitização, submissão pendente, consulta pública restrita a aprovadas e proteção da rota admin.
   - **47 testes automatizados aprovados** no Vitest (`10/10 test files`).
   - TypeScript verificado sem erros (`pnpm check`) e build de produção compilado com sucesso (`pnpm build`).


## Atualização — Saída obrigatória no último desafio do Ache o Erro (22/09/2026)

O último cenário do Ache o Erro agora encerra obrigatoriamente a experiência do jogo. Ao finalizar essa fase, o resultado exibe a mensagem **“Último desafio do Ache o Erro concluído”** e um único botão de ação: **“Sair do Ache o Erro e escolher outro jogo”**. Nesse estado, os comandos “Repetir”, “Próxima” e “Ranking” não são exibidos, evitando que o participante permaneça ou avance circularmente dentro do Ache o Erro. O catálogo mantém a navegação entre os cenários anteriores, mas o último cenário direciona a pessoa de volta à Central de Desafios para continuar a SIPAT em outro jogo.

A regra foi extraída para a função testável `isLastScenarioInCatalog`. A suíte passou com **48 testes**, `pnpm check` sem erros e build de produção concluído com sucesso.


## Atualização — Projeto 3D em Destaque na Primeira Dobra da SIPAT (22/09/2026)

O projeto 3D do eixo MS-120 e do ambiente industrial de Osasco foi promovido a elemento central e interativo da plataforma:

1. **Posicionamento na primeira dobra da Home**:
   - No **desktop (1280px+)**, o visualizador ocupa a área direita da Hero (~52% da largura útil), formando uma composição de duas colunas balanceada com o título, os botões principais de ação e o painel de missão.
   - Foram adicionados os botões **“Explorar em 3D”** e **“Ver ranking”** com contraste e alinhamento visual de fácil leitura.
   - No **celular (320px–430px)**, a altura do visualizador foi otimizada para 280–310px, permitindo rolar a página normalmente sem bloqueio por gestos de rotação.

2. **Hotspots educativos e conexões diretas com os jogos**:
   - Foram criados 8 pontos interativos distribuídos sobre o ambiente e peças reais do conjunto mecânico:
     1. **EPI e proteção** → Atalho para o Quiz de Segurança;
     2. **Red Flag** → Atalho para o Quiz de Segurança;
     3. **Área de circulação** → Atalho para o Ache o Erro;
     4. **Organização 5S** → Atalho para o Organize a Fábrica;
     5. **Ergonomia** → Atalho para o Quiz de Ergonomia;
     6. **Sinalização** → Atalho para o Ache o Erro;
     7. **Comunicação de riscos** → Atalho para o Quiz de Segurança;
     8. **Projeto Formare** → Conhecer autoria dos alunos e página institucional.
   - Contador de exploração: “X de 8 explorados” com barra de progresso visual (sem alterar pontuação competitiva).
   - Ao concluir todos os pontos, surge uma mensagem de conclusão orientando a testar os conhecimentos nos desafios.

3. **Controles, acessibilidade e performance**:
   - Suporte completo a **arrastar para orbitar**, **toque em tela**, **duplo toque/pinça para aproximação** e **botões táteis de Reset e Pausa**.
   - **Rotação automática suave** que pausa imediatamente ao toque ou clique manual do participante e respeita `prefers-reduced-motion`.
   - **Versão acessível sem 3D** disponível via botão com ícone e texto, exibindo todos os textos educativos e links para pessoas com leitor de tela ou dispositivos incompatíveis.
   - **Fallback automático para WebGL**: detecta ausência de suporte gráfico e exibe fotografia industrial com os mesmos conteúdos educativos.
   - **Botão de Tela Cheia** integrado com saída acessível no desktop e celular.
   - Menção obrigatória preservada: **“Projeto desenvolvido por alunos do Formare”** dentro do ambiente e no rodapé técnico.

4. **Validação**:
   - `pnpm check`: 0 erros de TypeScript.
   - `pnpm test`: 48 testes aprovados em 10 arquivos.
   - `pnpm build`: compilação e empacotamento Vite/esbuild concluídos com sucesso.


## Atualização — Imagem Limpa e Reorganização do Projeto 3D (22/09/2026)

Conforme a solicitação do usuário, a apresentação do modelo 3D foi completamente despoluída:

1. **Remoção total dos tópicos sobre a imagem**:
   - Foram eliminados os 8 marcadores flutuantes numerados ("EPI", "Red Flag", "Organização 5S", etc.) que ficavam sobrepostos ao modelo.
   - Foram retirados também os rótulos técnicos flutuantes, legendas sobre a cena e mensagens automáticas que concorriam com a visualização do eixo.
   - A imagem agora exibe apenas a geometria mecânica limpa do eixo MS-120 com a linha de montagem de Osasco como plano de fundo.

2. **Reorganização dos controles fora do palco**:
   - No modo compacto da Home, os botões de controle (**Pausar/Rotacionar**, **Vista inicial** e **Resetar**) foram posicionados em uma barra externa organizada, acima da viewport, sem cobrir nenhuma parte do modelo.
   - O botão de **Tela cheia** e o botão de **Acessibilidade (Sem 3D)** permanecem alinhados no topo do card.
   - Os conteúdos educativos sobre segurança, 5S e ergonomia foram preservados em um painel estruturado acessível via botão, permitindo leitura completa sem poluir o canvas visual.

3. **Validação**:
   - `pnpm check`: 0 erros de TypeScript.
   - `pnpm test`: 48 testes aprovados em 10 arquivos.
   - `pnpm build`: compilação e empacotamento concluídos com sucesso.


## Atualização — Destaque dos Principais Criadores e Inclusão de Kauã Gonçalves (22/09/2026)

Atendendo à solicitação do usuário, a seção de criadores do projeto na página `/nosso-projeto` foi atualizada:

1. **Inclusão do criador**:
   - Adicionado **Kauã Gonçalves** com o cargo *Idealização e desenvolvimento* e o e-mail de contato `kauagc20@gmail.com`.
   - A equipe principal agora conta com quatro membros: **Ryan Neiva**, **Leonardo Frazatto**, **Matheus Felipe** e **Kauã Gonçalves**.

2. **Destaque visual aprimorado**:
   - Título impactante em tipografia industrial: *"QUEM CRIOU ESTE PROJETO?"*.
   - Cards ampliados com bordas temáticas Cummins (`#da291c`), gradiente de destaque no topo, selo de *Núcleo principal* e numeração destacada (`CRIADOR 01` a `04`).
   - Botões de contato por e-mail e LinkedIn padronizados e com contraste elevado, alinhados com foco acessível e sem quebras de layout em telas móveis e desktop.
   - Espaçamento inferior ampliado para garantir que a barra persistente de acessibilidade/CTA não sobreponha as informações de contato.

3. **Validação**:
   - `pnpm check`: sem erros de TypeScript.
   - `pnpm test`: 48 testes passando em 10 arquivos.
   - `pnpm build`: compilação e empacotamento concluídos com sucesso.
