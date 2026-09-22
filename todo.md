# Checklist — redesign interativo concluído

- [x] Auditar Home, navegação, jogos, ranking, história e página do projeto
- [x] Adicionar parallax suave, cursor glow, linhas de energia e entrada sequencial na hero
- [x] Tornar a missão clicável com estado ativo e próxima ação contextual
- [x] Criar sequência Red Flag PARE → COMUNIQUE → AJA COM SEGURANÇA
- [x] Adicionar contadores animados sem alterar valores do ranking
- [x] Criar timeline interativa da história da Cummins
- [x] Criar timeline interativa do processo do projeto Formare
- [x] Garantir foco visível, teclado, toque e prefers-reduced-motion
- [x] Validar TypeScript, 42 testes e build de produção
- [x] Validar Home, História e Nosso projeto em desktop e mobile
- [x] Salvar checkpoint final e atualizar pacote ZIP

## Correção do Organize a Fábrica — 21/09/2026

- [x] Substituir o classificador de categorias por organização física do posto
- [x] Criar encaixes padronizados por estação: ferramentas, EPIs, resíduos, almoxarifado, descarte e produção
- [x] Permitir arrastar e soltar, toque e seleção por teclado
- [x] Criar feedback de encaixe correto, erro de posicionamento e slot travado
- [x] Criar segunda etapa com sequência Lean/5S: Separar, Definir, Limpar, Padronizar e Manter
- [x] Exibir progresso, cronômetro, pontuação e resultado pós-desafio sem contagem genérica de quiz
- [x] Validar no navegador: encaixe real, transição para Lean e sequência correta
- [x] Passar typecheck, 42 testes automatizados e build de produção
- [x] Salvar checkpoint e atualizar pacote ZIP

## Melhoria de jogabilidade e mobile — 21/09/2026

- [x] Adicionar barra de progresso percentual do desafio
- [x] Mostrar etapa atual e próximo foco da sequência 5S
- [x] Exibir orientação persistente quando um item estiver selecionado no toque
- [x] Mostrar a estação de destino de cada item sem revelar o encaixe exato
- [x] Melhorar alvos de toque e densidade dos cartões em telas pequenas
- [x] Validar seleção e encaixe correto no navegador
- [x] Passar typecheck, 42 testes e build
- [x] Salvar checkpoint e atualizar pacote ZIP

## Melhorias de Legibilidade para Pessoas Mais Velhas — 21/09/2026

- [x] Auditar requisitos de visualização, escala e facilidade de localização nos quatro jogos
- [x] Aumentar a escala tipográfica dos enunciados, opções, timers e resultados nos Quizzes de Segurança e Ergonomia
- [x] Reforçar contraste, bordas (2px) e alvos de toque/clique (>= 44px a 56px) nas alternativas e controles
- [x] Adaptar o Ache o Erro para manter cenas com tamanho grande e detalhado em tablets e celulares via alternância de abas até 1023px
- [x] Aumentar os rótulos de cena ("Inspeção" / "Referência segura"), marcadores de acerto e anel de dicas
- [x] Otimizar o Organize a Fábrica com fontes legíveis (1rem), cartões de itens mais altos (>= 6.25rem) e bancadas de encaixe claras
- [x] Executar testes de tipo (`pnpm check`), testes unitários/integração (`pnpm test` - 42 testes) e build de produção (`pnpm build`)
- [x] Auditar capturas de tela em 375x812 e 768x1024 para validar legibilidade real
- [x] Salvar novo checkpoint versionado
- [x] Gerar pacote ZIP atualizado da aplicação


## Melhorias de Navegação Mobile e Equilíbrio de Jogos — 22/09/2026

- [x] Implementar os 8 links oficiais do menu mobile na ordem estrita solicitada
- [x] Garantir alvos de toque >= 48px, botão de menu 44x44px e contenção de foco com Escape e Tab
- [x] Reequilibrar catálogo com 36 perguntas reais (6 fáceis, 6 médias, 6 difíceis para cada quiz)
- [x] Eliminar perguntas repetidas ou sem objetivo educativo claro no banco de dados
- [x] Calibrar pontuações proporcionais à dificuldade (100, 200 e 300 pontos base)
- [x] Preservar 100% o jogo Ache o Erro e validar estabilidade do Organize a Fábrica
- [x] Validar suíte automatizada: TypeScript, 42 testes no Vitest e build de produção


## Checklist Oficial de Lançamento — Cummins SIPAT 2026 (22/09/2026)

- [x] Bloqueio de consulta pública de progresso por chapa/WWID em `/meu-progresso`.
- [x] Sessão de participante assinada via cookie HttpOnly (`sipat_participant_session`).
- [x] Mascaramento de dados corporativos no ranking, cabeçalho e componentes públicos.
- [x] Sessão administrativa HttpOnly sem persistência nem retransmissão da chave no cliente.
- [x] Remoção de envio da chave administrativa na prévia do jogo Ache o Erro.
- [x] Validação autoritativa das perguntas e respostas dos quizzes no servidor.
- [x] Limites estritos de pontuação e tempo por desafio no backend.
- [x] Acessibilidade: correção de `aria-controls`, `id="accessibility-panel"` e foco na barra flutuante.
- [x] Atalho do rodapé integrado para abrir a barra de acessibilidade nativa.
- [x] Módulo 3D: suporte a teclado (setas, zoom, reset, medição), foco visível e tela cheia estável.
- [x] Ajuste didático da bitola entre flanges para `1,688 mm`.
- [x] TypeScript sem erros (`pnpm check`).
- [x] 10 arquivos e 48 testes automatizados aprovados no Vitest (`pnpm test`).
- [x] Build de produção concluído com sucesso (`pnpm build`).
- [x] Auditoria visual confirmada em mobile (375x812) e desktop (1280x720).
- [x] Checkpoint oficial salvo no WebDev.
- [x] Pacote ZIP consolidado atualizado na raiz home.
