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
