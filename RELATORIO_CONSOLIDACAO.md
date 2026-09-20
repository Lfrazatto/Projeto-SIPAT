# Relatório de consolidação — Cummins SIPATMA 2026

## Resumo executivo

Os projetos `sipat-ms120-explorer` e `cummins-sipatma-challenge` foram comparados em experiência, conteúdo, jogos, acessibilidade, administração, segurança, banco de dados e testes. A versão final usa como base a experiência mais completa do **Cummins SIPATMA Challenge**, preservando seus quatro desafios, identidade industrial e painel administrativo, e incorpora os pontos tecnicamente superiores do **MS-120 Explorer**, incluindo regras de backend mais seguras, edição administrativa de cenários, testes adicionais e catálogo 3D ampliado.

O resultado é uma única aplicação full-stack denominada **Cummins SIPATMA — Desafio MS-120 2026**, com navegação pública consistente, banco de dados funcional, jogos integrados, ranking, consulta individual de progresso, administração e uma camada abrangente de inclusão.

## Decisões de consolidação

| Área | Escolha preservada | Motivo |
|---|---|---|
| Experiência visual | Linguagem industrial escura, hierarquia editorial e cartões do projeto Challenge | Experiência mais coesa, completa e adequada ao contexto fabril |
| Jogos | Quatro desafios do projeto Challenge | Cobertura funcional superior: segurança, ergonomia, inspeção visual e 5S |
| Backend | Regras mais seguras e testes complementares do Explorer | Melhor proteção administrativa, validação e manutenção |
| Projeto 3D | Catálogo e visualizador detalhado do Explorer | Maior riqueza técnica e melhor exploração dos componentes MS-120 |
| Administração | Painel completo do Challenge com melhorias do Explorer | Preserva gestão de perguntas, cenários e configurações sem perder segurança |
| Conteúdo | Padronização para Cummins SIPATMA 2026 | Remove inconsistências de nomenclatura entre as duas fontes |

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
