# 07 · Rotas e níveis de utilizador

## Perfis

| Perfil                  | Como se determina                                | Pode                                                                                        |
| ----------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Visitante               | sem sessão                                       | catálogo, detalhe, tipos de entrega, localizações, entrar/criar conta                       |
| Cliente                 | `role = customer`                                | tudo o anterior + moradas + listar empresas associadas e respectivos membros; criar empresa |
| Admin                   | `role = admin`                                   | tudo + dashboard e gestão administrativa de catálogo, entregas e empresas                   |
| Proprietário de empresa | `company.ownerId === user.id` (não vem no token) | editar/desativar a empresa, gerir utilizadores dela                                         |
| Membro de empresa       | existe em `user_company`                         | listar utilizadores da própria empresa                                                      |

> `user_company.role` (cargo: "Gerente"…) é texto livre e **não** é permissão. Ignorar para autorização.

## Mapa de rotas (v1)

| Rota                                                      | Layout  | Guard      | Render       |
| --------------------------------------------------------- | ------- | ---------- | ------------ |
| `/`                                                       | public  | —          | Server       |
| `/produtos`, `/produtos/:id`                              | public  | —          | Server       |
| `/sobre`, `/contactos`                                    | public  | —          | Server       |
| `/entrar`, `/criar-conta`                                 | public  | guest      | Client       |
| `/conta/perfil`                                           | account | auth       | Client       |
| `/conta/moradas`                                          | account | auth       | Client       |
| `/conta/empresas`                                         | account | auth       | Client       |
| `/conta/empresas/nova`                                    | account | auth       | Client       |
| `/admin` (dashboard)                                      | admin   | auth+admin | Client       |
| `/admin/categorias`                                       | admin   | auth+admin | Client       |
| `/admin/produtos`, `/admin/produtos/:id` (imagens, specs) | admin   | auth+admin | Client       |
| `/admin/tipos-entrega`                                    | admin   | auth+admin | Client       |
| `/admin/empresas`                                         | admin   | auth+admin | Client       |
| `**`                                                      | public  | —          | Server (404) |

Slugs de rota em pt (URLs para o público angolano). Quando existir `en`, avaliar prefixo de idioma (`/en/...`) — ver `10`.

Na Fase 3, `/conta/perfil`, `/conta/moradas` e `/conta/empresas` estão implementadas sob `authGuard` e renderização client-side. O perfil lê os dados da sessão; moradas consome os endpoints autenticados de endereços e o catálogo público de províncias/municípios. A listagem de empresas consome `GET /api/v1/companies/mine`, que limita os resultados às relações do utilizador autenticado e inclui os membros associados; `/conta/empresas/nova` cria uma empresa pela API. Não usar a listagem administrativa nem IDs arbitrários para descobrir empresas.

O dashboard `/admin` está implementado com `adminGuard`, layout próprio e renderização client-side. Apresenta contagens dos endpoints de produtos, categorias, tipos de entrega activos e empresas administrativas. As gestões CRUD de categorias (`/admin/categorias`) e produtos (`/admin/produtos`, `/admin/produtos/novo`, `/admin/produtos/:id`) também estão implementadas, incluindo upload de imagens e especificações. A gestão de tipos de entrega em `/admin/tipos-entrega` permite criar, editar e desactivar os tipos activos. A API não lista tipos inactivos nem permite reactivá-los. A gestão administrativa de empresas em `/admin/empresas` lista empresas e membros, permite editar nome/sector e desactivar; não permite alterar NIF nem reactivar empresas. O catálogo público integra pesquisa e ordenação com os parâmetros suportados pela API.

## Regras de UI por perfil

- Botões de ação só aparecem se o perfil permitir; mesmo assim tratar 403.
- Para acções de empresa, a API valida o proprietário nas rotas por ID. A listagem de “as minhas empresas” continua dependente de endpoint próprio (ver `13`).
