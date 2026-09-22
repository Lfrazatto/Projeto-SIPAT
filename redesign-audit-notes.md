# Auditoria do redesign interativo — 21/09/2026

## Verificações concluídas

A Home foi revisada em 1280 × 900 e 375 × 812. A primeira dobra agora apresenta uma composição industrial com foto real, grid técnico, CTA de participação, CTA de ranking e central de missão. Em 1280 px, a navegação desktop exibe Início, Jogos, Ranking, Meu progresso, Nosso projeto, Institucional, identificação e Participar agora. Em 375 px, o cabeçalho permanece compacto e o acesso ao menu mobile é preservado.

As rotas Home, Jogos, Ranking, Nosso projeto, Formare, História da Cummins e Galeria foram capturadas em desktop e mobile. Não foi observado overflow horizontal visual, textos principais cortados ou botões fora da tela. A central de jogos apresenta cards distintos e CTAs JOGAR AGORA. O ranking apresenta pódio e estados de participação; quando não identificado, orienta o usuário a participar.

## Correções aplicadas nesta rodada

A barra de navegação foi alterada de `2xl` para `xl`, corrigindo o caso em que a largura de 1280 px ainda mostrava somente o menu hamburger. Foram adicionados indicador compacto de pontuação, barra de progresso da página, dropdown institucional, estado ativo, microanimação do CTA e menu mobile com Escape, clique fora e contenção de foco.

A Home foi reorganizada como centro de missão, com hero, etapas de missão, cards de jogos, seção Red Flag em três passos, pilares de prevenção e CTA final. As animações utilizam IntersectionObserver, propriedades eficientes e fallback imediato para `prefers-reduced-motion`.

O Ranking recebeu leitura do participante identificado, posição, distância em pontos para a próxima posição e acesso direto a Meu progresso. O rodapé recebeu atalhos, status do evento, versão, acessibilidade e chamada final.

## Console e layout

A inspeção do console do navegador não registrou mensagens de erro. A avaliação DOM não encontrou interações sem nome acessível nem overflow horizontal; o único elemento que excedeu o viewport foi o fundo decorativo intencionalmente ampliado e contido por `overflow-x-hidden`. O alvo do skip link é o container global `#conteudo-principal`, que envolve as rotas.

## Próxima validação

Executar novamente `pnpm check`, `pnpm test`, `pnpm build`, capturas nos viewports definidos e salvar checkpoint somente após a reverificação final.


## Testes responsivos concluídos

- **320px**: título escala limpo, botões ocupam largura total, sem overflow horizontal.
- **375px**: cabeçalho compacto com botão acessível de menu mobile; cards empilhados confortavelmente.
- **414px**: proporção equilibrada para smartphones maiores.
- **768px**: layout tablet adaptado, sem cortes em textos.
- **1024px**: transição para tablet paisagem/desktop pequeno com leitura confortável.
- **1280px**: barra de navegação desktop ativa e legível; hero em duas colunas.
- **1440px**: layout contido no limite máximo com alinhamento visual equilibrado.
- **1920px**: espaçamento amplo preservado sem distorcer o painel de missão.


## Rodada interativa — 21/09/2026

- Home revisada em desktop e 375px: hero com camadas industriais, CTA, central de missão, cards dos quatro desafios, Red Flag interativo, chamada final e rodapé sem overflow horizontal.
- Red Flag validado no navegador: três botões de etapa e avanço por “Próxima etapa” aparecem com labels acessíveis e feedback contextual.
- História da Cummins revisada em desktop e mobile: timeline com seis marcos, painel expansível, fonte oficial e cards institucionais.
- Nosso projeto revisado em desktop e mobile: foto da equipe, processo do Formare, timeline “Da ideia à entrega”, galeria e cartões de criadores.
- Console do navegador sem mensagens de erro durante a navegação da Home.
- `pnpm check`, `pnpm test` e `pnpm build` concluídos com sucesso; 42 testes passaram.


## Auditoria Mobile — melhoria dedicada — 21/09/2026

Foram capturadas as rotas Home, Jogos, Organize a Fábrica, Ranking, Meu progresso, Formare e Galeria em viewport de **375 × 812 px**. O cabeçalho permanece compacto, a barra fixa **Começar desafio / Ranking** aparece sem cobrir o conteúdo principal, os cards de jogos ficam empilhados e os botões principais ocupam largura adequada. Ranking, Meu progresso e Formare mantêm hierarquia legível sem overflow horizontal visível.

As correções desta rodada incluem: CTA móvel persistente fora das partidas; safe area inferior para dispositivos com gesto; formulário de identificação com `inputMode`, autocomplete semântico e campos maiores; ranking com filtros roláveis horizontalmente e controles de no mínimo 44px; modal da galeria com foco, Escape, setas e foco cíclico; resultados do quiz em fluxo vertical no celular; alvos touch ampliados no Ache o Erro; e ajustes de densidade para a Home, central de jogos e telas em orientação paisagem.

A verificação automatizada executou `pnpm check`, `pnpm test` e `pnpm build`: **42 testes passaram**, typecheck sem erros e build concluído. A medição DOM disponível no navegador confirmou **overflow horizontal zero** e a barra móvel ativa; a captura dedicada é a fonte principal para os breakpoints móveis, pois o navegador persistente permaneceu em viewport desktop durante a avaliação DOM.

## Auditoria de Legibilidade e Visualização para Pessoas Mais Velhas (Rodada v4.1)
- **Quiz de Segurança & Quiz de Ergonomia**:
  - Enunciados das perguntas receberam `older-question` (clamp 1.3rem a 1.8rem, line-height 1.4), garantindo leitura sem esforço mesmo com celulares menores (375px/390px).
  - Cronômetro e pontuação em caixas pretas semitransparentes com bordas nítidas de 2px e números ampliados (1.45rem+).
  - Letras das alternativas em blocos circulares/quadrados de 2.5rem (40px) com contraste branco sobre fundo escuro.
  - Alternativas com altura mínima de 5.25rem a 5.5rem, texto aumentado (1.05rem) e foco/hover em amarelo ouro Cummins (#ffc72c) com fundo clareado.
  - Explicações pós-resposta aumentadas para 1rem com entrelinha 1.65 e contraste reforçado.
- **Ache o Erro**:
  - Título e instruções de cena aumentados e com marcadores numerados contrastantes.
  - No celular e no tablet (até 1023px), as cenas usam modo de alternância com abas grandes (min-height 3.5rem) e rótulos fixos de alto contraste ("Inspeção", "Referência segura"), evitando que duas imagens fiquem pequenas demais lado a lado.
  - A comparação lado a lado agora é reservada exclusivamente para telas desktop (>= 1024px).
  - Controles de zoom (- / 100% / + / tela cheia), Dica (com quantidade nítida), Pausar e Modo Textual com áreas de toque ampliadas (>= 44px).
  - Selos de acerto com diâmetro ampliado de 3.5rem e anel de dica com borda de 3px para localização imediata após o clique correto.
- **Organize a Fábrica**:
  - Título, subetapas e instruções de fluxo 5S aumentadas com tipografia limpa.
  - Cartões de itens arrastáveis/tocáveis com altura mínima de 6.25rem a 7rem, ícone descritivo e texto de instrução em contraste reforçado.
  - Slots de destino e esteira Lean com bordas de 2px e tipografia de 1rem para leitura instantânea de cada etapa da oficina.
- **Validação Técnica**:
  - Suíte de testes: 42 testes aprovados em 9 arquivos vitest.
  - TypeScript: 0 erros (`tsc --noEmit`).
  - Build de produção: Vite + esbuild finalizado sem falhas.
