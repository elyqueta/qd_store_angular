# 07 · Rotas e níveis de utilizador

## Perfis

| Perfil                  | Como se determina                                | Pode                                                                                        |
| ----------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Visitante               | sem sessão                                       | catálogo, detalhe, tipos de entrega, localizações, entrar/criar conta                       |
| Cliente                 | `role = customer`                                | tudo o anterior + moradas + listar empresas associadas e respectivos membros; criar empresa |
| Admin                   | `role = admin`                                   | tudo + dashboard e gestão administrativa de catálogo, entregas, empresas e utilizadores     |
| Proprietário de empresa | `company.ownerId === user.id` (não vem no token) | editar/desativar a empresa, gerir utilizadores dela                                         |
| Membro de empresa       | existe em `user_company`                         | listar utilizadores da própria empresa                                                      |

> `user_company.role` (cargo: "Gerente"…) é texto livre e **não** é permissão. Ignorar para autorização.

## Mapa de rotas (v1)

| Rota                                                      | Layout  | Guard      | Render       |
| --------------------------------------------------------- | ------- | ---------- | ------------ |
| `/`                                                       | public  | —          | Server       |
| `/produtos`, `/produtos/:id`                              | public  | —          | Server       |
| `/sobre`, `/contactos`, `/tipos-entrega`                  | public  | —          | Server       |
| `/empresas`                                               | public  | —          | Server       |
| `/carrinho`, `/favoritos`                                 | public  | auth       | Client       |
| `/entrar`, `/criar-conta`                                 | public  | guest      | Client       |
| `/conta/perfil`                                           | account | auth       | Client       |
| `/conta/moradas`                                          | account | auth       | Client       |
| `/conta/empresas`                                         | account | auth       | Client       |
| `/conta/empresas/nova`                                    | account | auth       | Client       |
| `/conta/encomendas`, `/conta/encomendas/:id`              | account | auth       | Client       |
| `/conta/checkout`                                         | account | auth       | Client       |
| `/admin` (dashboard)                                      | admin   | auth+admin | Client       |
| `/admin/categorias`                                       | admin   | auth+admin | Client       |
| `/admin/produtos`, `/admin/produtos/:id` (imagens, specs) | admin   | auth+admin | Client       |
| `/admin/tipos-entrega`                                    | admin   | auth+admin | Client       |
| `/admin/servicos`                                         | admin   | auth+admin | Client       |
| `/admin/empresas`                                         | admin   | auth+admin | Client       |
| `/admin/utilizadores`                                     | admin   | auth+admin | Client       |
| `**`                                                      | public  | —          | Server (404) |

Slugs de rota em pt (URLs para o público angolano). Quando existir `en`, avaliar prefixo de idioma (`/en/...`) — ver `10`.

Na Fase 3, `/conta/perfil`, `/conta/moradas` e `/conta/empresas` estão implementadas sob `authGuard` e renderização client-side. O perfil lê os dados da sessão; moradas consome os endpoints autenticados de endereços e o catálogo público de províncias/municípios. A listagem de empresas consome `GET /api/v1/companies/mine`, que limita os resultados às relações do utilizador autenticado e inclui os membros associados; `/conta/empresas/nova` cria uma empresa pela API. Não usar a listagem administrativa nem IDs arbitrários para descobrir empresas.

O dashboard `/admin` está implementado com `adminGuard`, layout próprio e renderização client-side. A navegação administrativa usa uma barra lateral à esquerda em desktop e um menu hamburger em telemóveis; o menu móvel fecha ao navegar, carregar no fundo ou premir Escape. Apresenta contagens dos endpoints de produtos, categorias, tipos de entrega activos e empresas administrativas. As gestões CRUD de categorias (`/admin/categorias`) e produtos (`/admin/produtos`, `/admin/produtos/novo`, `/admin/produtos/:id`) também estão implementadas, incluindo upload de imagens e especificações. A gestão de tipos de entrega em `/admin/tipos-entrega` permite criar, editar e desactivar os tipos activos. A API não lista tipos inactivos nem permite reactivá-los. A gestão de serviços em `/admin/servicos` lista também inactivos e permite criar, editar, activar/desactivar e carregar imagem; os ícones são escolhidos no catálogo público. A gestão administrativa de empresas em `/admin/empresas` lista empresas e membros, permite editar nome/sector e desactivar; não permite alterar NIF nem reactivar empresas. A gestão M4 em `/admin/utilizadores` consulta a listagem paginada e filtrável, permite ver detalhe e empresas associadas e alterar estado/papel com confirmação. A interface impede alterações à própria conta e informa que tokens de acesso já emitidos podem continuar válidos até 15 minutos; a API mantém a autoridade e protege o último administrador activo. Em `/conta/empresas`, proprietários e administradores podem associar membros por e-mail no endpoint contextual da empresa, sem pesquisa ou lookup de contas. O catálogo público integra pesquisa e ordenação com os parâmetros suportados pela API.

A Home consulta `GET /api/v1/services` e apresenta apenas serviços activos como conteúdo informativo, sem carrinho ou checkout de serviços.

A página pública `/tipos-entrega` consulta `GET /api/v1/delivery-types`, apresenta as opções activas devolvidas pela API e inclui estados de carregamento, vazio, erro e repetição. A rota é renderizada no servidor e está ligada no rodapé público.

Carrinho, favoritos e checkout usam as rotas autenticadas existentes da API; visitantes são encaminhados para autenticação antes de operações privadas. A área de conta mantém as rotas actuais e apresenta uma navegação lateral partilhada; a entrada do conteúdo entre rotas tem uma transição discreta, desactivada quando `prefers-reduced-motion` está activo. `/conta/perfil` mantém os dados pessoais da sessão em modo de leitura e replica a composição visual do perfil React, sem usar os pedidos/favoritos fictícios do protótipo. Histórico/detalhe de encomendas e notificações usam os endpoints próprios do utilizador. Não existem métodos de pagamento guardados, preferências de notificação nem operações de alteração de palavra-passe no perfil; essas secções não são simuladas. Não há endpoint de pedido de orçamento nem pesquisa pública de utilizadores; a associação M5 mantém a resolução do e-mail dentro do fluxo autenticado e contextual da empresa. A UI antiga não contém back-office; por isso as páginas administrativas existentes não são reestilizadas por inferência.

## Regras de UI por perfil

- Botões de ação só aparecem se o perfil permitir; mesmo assim tratar 403.
- Para acções de empresa, a API valida o proprietário nas rotas por ID. A listagem de “as minhas empresas” continua dependente de endpoint próprio (ver `13`).
