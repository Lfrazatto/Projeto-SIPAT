# Calibração do Ache o Erro

## Fase 4 — Usinagem e Metalurgia

A inspeção dos quatro quadrantes revelou que as coordenadas que haviam sido estimadas pelo prompt não correspondiam aos objetos gerados. A cena real mostra: óculos no trabalhador na região superior esquerda, proteção vermelha aberta no torno superior esquerdo, cavacos transbordando e espalhados no centro-esquerda, ferramentas na bancada inferior-direita, fluido azul derramado na rota amarela inferior, trabalhadora com cabelo solto no corredor central-direita e mangueira amarela cruzando a rota no lado direito. As coordenadas atuais precisam ser substituídas por centros medidos visualmente na imagem completa.

Também foi confirmado no navegador que os dois arquivos carregam com `naturalWidth=2752`, `naturalHeight=1536` e que um clique no centro calculado do capô aberto foi reconhecido. Um clique aproximado dos óculos gerou o aviso de proximidade; após usar o retângulo DOM atual e o centro corrigido, o clique nos óculos foi reconhecido.

## Fase 1 — Montagem, quadrantes superiores

A cena real não corresponde à estimativa anterior: no quadrante superior esquerdo aparecem o trabalhador de azul com óculos visíveis, a célula amarela e seu portão aberto, a caixa sobre a bancada e o cabo preto pendurado na parede; no superior direito aparecem as caixas instáveis na faixa inferior e o trabalhador com colete. As coordenadas de portão, caixas e demais riscos devem ser medidas na imagem completa; o ponto estimado para óculos na testa não pode ser mantido sem confirmar a diferença na imagem segura.

## Fase 1 — Montagem, cena completa

Os sete elementos visíveis estão concentrados assim: cabo preto serpenteando sobre a faixa amarela no quadrante inferior esquerdo (aprox. centro x=53%, y=72%); grande poça marrom junto ao carrinho no inferior esquerdo/direito (aprox. x=79%, y=82%); portão amarelo da célula aberto no superior esquerdo (aprox. x=38%, y=26%); caixa sobre a mesa e empilhamento de caixas instável no carrinho no lado direito inferior (aprox. x=61%, y=57%); chave inglesa grande na borda da bancada no inferior direito (aprox. x=86%, y=72%); peça sendo segurada sem luvas no trabalhador do lado direito (aprox. x=82%, y=35%); trabalhador de azul com EPI incompleto/sem luvas no lado esquerdo (aprox. x=29%, y=38%). Essas regiões substituem os valores anteriores, que estavam deslocados.

## Fase 2 — Logística, quadrantes superiores

A imagem real mostra a empilhadeira e sua carga alta na borda inferior esquerda; no lado superior direito há uma pilha de pallets inclinada no rack (aprox. x=65%, y=14% na imagem completa) e a porta de emergência/EXIT aparece no lado esquerdo desse quadrante, relativamente livre. Os riscos estimados anteriormente para celular, escada e fitas ainda precisam ser conferidos nos quadrantes inferiores.

## Fase 2 — Logística, cena completa

Os elementos reais aparecem assim: empilhadeira/carga alta no inferior esquerdo (aprox. x=25%, y=48%); colaborador olhando celular no inferior direito/superior da faixa (aprox. x=86%, y=43%); poça azul/marrom no lado direito da faixa (aprox. x=84%, y=65%); fitas brancas e pretas espalhadas no inferior direito (aprox. x=61%, y=79%); trabalhador escalando a estante no lado direito (aprox. x=85%, y=25%); pilha de pallets inclinada no topo central-direito (aprox. x=67%, y=17%). O sétimo alvo deve ser uma área de bloqueio/armazenagem na rota, não o ponto anterior estimado para a porta EXIT, que está visualmente livre.

## Fase 3 — Manutenção, quadrantes superiores

A cena real mostra a estação LOTO aberta no topo-esquerda, a etiqueta amarela/vermelha caída no chão abaixo dela, uma chave grande apoiada na borda da máquina CNC à direita da estação, vazamento marrom sob a máquina e o técnico sem luvas diante do painel elétrico no topo-direita. As coordenadas anteriores estavam muito deslocadas; faltam os quadrantes inferiores para confirmar porta aberta e cabo.

## Fase 3 — Manutenção, cena completa

Os riscos reais podem ser centralizados em: estação LOTO aberta (x≈25%, y≈23%); etiqueta LOCKOUT caída (x≈31%, y≈42%); chave inglesa na borda da CNC no quadrante inferior esquerdo (x≈43%, y≈52%); cabo preto cruzando o corredor na parte inferior (x≈45%, y≈76%); porta de vidro da CNC aberta no inferior-direito (x≈59%, y≈48%); óleo amarelo sob a CNC à direita (x≈74%, y≈67%); técnico sem luvas no painel elétrico no superior-direito (x≈61%, y≈39%).

## Fase 5 — Produção, quadrantes superiores

A cena real mostra a porta de vidro da célula robótica aberta no alto-centro/esquerda (aprox. x=47%, y=34%); a operadora de vermelho com óculos levantados na borda inferior esquerda (aprox. x=7%, y=47%); uma peça de motor sobre a esteira no quadrante superior direito; e pilha de caixas junto à botoeira vermelha de emergência no topo-direita (aprox. x=72%, y=38%). Os demais riscos dependem dos quadrantes inferiores.

## Fase 5 — Produção, cena completa

Os atos inseguros aparecem em: porta de vidro da célula aberta (x≈47%, y≈34%); óculos levantados da operadora (x≈7%, y≈47%); carrinho azul invadindo a faixa no quadrante inferior-esquerdo/direito (x≈54%, y≈64%); engrenagem pesada solta na rota (x≈66%, y≈72%); caixas junto/bloqueando o botão de emergência (x≈73%, y≈37%); operador debruçado sobre a esteira no inferior-direito (x≈78%, y≈57%); carenagem amarela da corrente retirada e exposta no chão (x≈75%, y≈85%).
