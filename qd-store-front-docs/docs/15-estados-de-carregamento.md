# 15 · Estados de carregamento do MVP

## Objectivo e estado

Este documento inventaria os carregamentos do MVP e define como escolher o respectivo indicador. Deve ser actualizado quando forem adicionadas telas, operações ou medições.

**Estado desta revisão:** inventário estático do código concluído; os tempos reais ainda não foram medidos. A estimativa de 60 segundos para carregar produtos foi indicada pelo Elizandro como expectativa para a API de produção no Render; não é uma medição recolhida pela aplicação.

Nesta etapa, o relatório é documental. Os indicadores existentes não foram alterados para priorizar a integração do MVP.

## Critérios de decisão

| Duração observada                            | Âmbito                           | Indicador recomendado                                                 |
| -------------------------------------------- | -------------------------------- | --------------------------------------------------------------------- |
| Menos de 1 s                                 | Qualquer                         | Nenhum indicador.                                                     |
| De 2 a 10 s                                  | Uma secção da tela               | Spinner junto à secção, com texto curto e acessível.                  |
| Menos de 10 s                                | Página inteira                   | Skeleton com a forma aproximada do conteúdo que vai aparecer.         |
| Mais de 10 s                                 | Carregamento, upload ou download | Barra de progresso, estimativa de tempo restante e acção de cancelar. |
| Entre 1 e 2 s, ou duração ainda desconhecida | Qualquer                         | Medir antes de decidir; não assumir um indicador nem o tempo.         |

Uma barra ligada a pedidos HTTP da API não representa percentagem real se a API não expuser progresso. Nesse caso, usar progresso indeterminado e uma estimativa claramente identificada, baseada em medições; nunca simular uma percentagem concluída. A acção de cancelar deve interromper o pedido quando tecnicamente possível e limpar o estado de carregamento.

## Inventário do MVP

| Área / tela                                       | Acção e âmbito                                           | Tempo disponível                                                  | Indicador recomendado                                                                                                                              | Texto/acção de apoio                                                                       | Estado actual observado                                                                                 |
| ------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Início                                            | Carregar produtos e conteúdo da página inteira           | 60 s indicados para dados de produtos; por medir na aplicação     | Barra indeterminada enquanto a API não fornecer progresso real; estimar o tempo restante com medições, sem percentagem fictícia                    | “A carregar produtos…”; mostrar a estimativa restante e “Cancelar”                         | Mensagem estática de carregamento; sem skeleton, progresso ou cancelamento                              |
| Catálogo público                                  | Carregar/filtrar página de produtos                      | 60 s indicados para dados de produtos; por medir na aplicação     | Barra indeterminada enquanto a API não fornecer progresso real; estimativa baseada em medições                                                     | “A carregar produtos…”; “Cancelar”                                                         | Mensagem estática de carregamento; sem skeleton, progresso ou cancelamento                              |
| Detalhe público                                   | Obter produto, imagens e especificações                  | 60 s indicados para dados de produtos; por medir na aplicação     | Barra indeterminada enquanto a API não fornecer progresso real; estimativa baseada em medições                                                     | “A carregar produto…”; “Cancelar”                                                          | Mensagem estática de carregamento; sem skeleton, progresso ou cancelamento                              |
| Administração de produtos                         | Listar, pesquisar e filtrar produtos                     | 60 s indicados para dados de produtos; por medir na aplicação     | Barra indeterminada enquanto a API não fornecer progresso real; estimativa baseada em medições                                                     | “A carregar produtos…”; “Cancelar”                                                         | Mensagem estática de carregamento; sem skeleton, progresso ou cancelamento                              |
| Formulário administrativo de produto              | Carregar produto existente, imagens e especificações     | 60 s indicados para dados de produtos; por medir na aplicação     | Barra indeterminada enquanto a API não fornecer progresso real; estimativa baseada em medições                                                     | “A carregar produto…”; “Cancelar”                                                          | Mensagem estática de carregamento; sem skeleton, progresso ou cancelamento                              |
| Dashboard administrativo                          | Carregar resumo, incluindo contagem de produtos          | Dependência de produtos; duração própria por medir                | Se o carregamento exceder 10 s, barra indeterminada com estimativa medida e cancelamento; caso contrário, escolher pelo âmbito e duração medidos   | “A carregar o painel…”; “Cancelar” se for carregamento longo                               | Mensagem estática de carregamento; sem skeleton, progresso ou cancelamento                              |
| Categorias (filtros e formulários)                | Carregar opções de categoria                             | Desconhecido                                                      | Por decidir após medição: spinner para secção (2–10 s) ou skeleton para página inteira (<10 s); acima de 10 s, barra com estimativa e cancelamento | Texto contextual, por exemplo, “A carregar categorias…”                                    | Algumas telas usam texto de carregamento; os restantes estados devem ser confirmados                    |
| Login e registo                                   | Submeter credenciais ou registo                          | Desconhecido                                                      | Por decidir após medição conforme duração e âmbito; não aplicar spinner prolongado sem medir                                                       | Texto contextual no botão/área de submissão; cancelamento a avaliar conforme o pedido      | Estado textual “a carregar” durante submissão e botão desactivado                                       |
| Perfil e moradas                                  | Ler ou guardar dados da conta; carregar localizações     | Desconhecido                                                      | Por decidir após medição para cada operação e âmbito                                                                                               | Texto contextual, por exemplo, “A carregar moradas…” / “A carregar localizações…”          | Moradas têm mensagem de carregamento; perfil e estados de submissão requerem medição                    |
| Empresas da conta                                 | Listar empresas próprias e associar membro por email     | Desconhecido                                                      | Skeleton para a listagem; indicar o estado no botão durante a associação, conforme duração medida                                                  | “A carregar empresas…” / “A associar…”; apresentar erros junto ao formulário               | Listagem usa skeleton; formulário de associação apresenta validação, estado de submissão e erros da API |
| Gestão de categorias, tipos de entrega e empresas | Listar e guardar alterações administrativas              | Desconhecido                                                      | Por decidir após medição para cada lista/ação e âmbito                                                                                             | Texto contextual com o recurso/ação                                                        | Listas usam mensagem estática; formulários mudam o rótulo do botão durante gravação                     |
| Upload de imagem de produto                       | Criar produto com imagem, adicionar ou substituir imagem | Desconhecido; limite de ficheiro é 8 MB                           | Se exceder 10 s, barra de progresso de transferência real quando disponível, estimativa restante e cancelar. Caso contrário, decidir após medir    | Quando houver vários ficheiros, indicar o item e total; neste MVP, uma imagem por operação | Botão indica gravação; sem progresso de transferência nem cancelamento                                  |
| Navbar e menu do utilizador                       | Obter dados da sessão necessários para o menu            | Desconhecido                                                      | Por decidir após medir a duração e o âmbito                                                                                                        | Texto curto junto ao menu, se necessário                                                   | Foi encontrada mensagem estática de carregamento                                                        |
| Páginas institucionais e 404                      | Renderizar conteúdo local                                | Não há pedido de carregamento identificado no inventário estático | Nenhum indicador se o conteúdo aparecer em menos de 1 s; medir antes de adicionar                                                                  | Não aplicável                                                                              | Sem estado de carregamento identificado nesta pesquisa                                                  |

## Diagnóstico desta revisão

- As telas públicas de produtos e várias listas administrativas mostram texto estático, mesmo que o pedido demore muito. Para a expectativa de 60 s dada para os produtos, o padrão futuro é barra indeterminada, estimativa honesta e cancelamento; o texto actual não comunica duração nem permite cancelar.
- Não foram encontrados skeletons ou barras de progresso no código pesquisado.
- Não há dados de telemetria suficientes para afirmar as durações das outras áreas. Mantêm-se como **por medir**, sem substituir um indicador por outro por suposição.
- O botão desactivado durante uma gravação não deve ser acompanhado por avisos genéricos como “não clique de novo”; deve comunicar o estado da própria acção. A revisão estática encontrou rótulos de gravação em botões, não um aviso genérico desse tipo.
- Não foi identificado um indicador estático de percentagem. Ao introduzir progresso para pedidos da API, não inventar percentagens.
- A intensidade de animação não pôde ser validada só pela pesquisa textual; qualquer novo indicador deve respeitar `prefers-reduced-motion` e usar animação discreta.

## Plano de medição e revisão

Antes de implementar indicadores nas áreas marcadas “por medir”:

1. Medir a duração real entre início e conclusão/falha/cancelamento, por tela e operação, em produção ou ambiente representativo, incluindo chamadas frias e repetidas.
2. Registar o âmbito afectado (secção ou página inteira), a duração média e, idealmente, a dispersão/percentis para evitar desenhar com base apenas numa média.
3. Aplicar os critérios da tabela; para operações acima de 10 s, confirmar se a API/navegador oferece progresso real e se a operação pode ser cancelada.
4. Verificar acessibilidade, teclado, tema claro/escuro, mobile e `prefers-reduced-motion`.
5. Actualizar o inventário e validar com testes, build e revisão visual.

Quando houver operações com vários itens, o texto deve identificar o progresso contável — por exemplo, “Imagem 3 de 50” — apenas se a operação realmente tiver essa contagem. O upload unitário de imagem do MVP não deve apresentar um contador fictício.

## Histórico

| Data       | Actualização                                                                                                                                              |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-06 | Inventário inicial do MVP. Expectativa de 60 s para carregamentos de dados de produtos fornecida pelo utilizador; restantes tempos marcados para medição. |
