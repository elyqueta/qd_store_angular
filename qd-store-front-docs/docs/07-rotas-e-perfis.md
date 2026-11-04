# 07 · Rotas e níveis de utilizador

## Perfis

| Perfil                  | Como se determina                                | Pode                                                                   |
| ----------------------- | ------------------------------------------------ | ---------------------------------------------------------------------- |
| Visitante               | sem sessão                                       | catálogo, detalhe, tipos de entrega, localizações, entrar/criar conta  |
| Cliente                 | `role = customer`                                | tudo o anterior + moradas + criar empresa + ver/gerir as suas empresas |
| Admin                   | `role = admin`                                   | tudo + back office completo                                            |
| Proprietário de empresa | `company.ownerId === user.id` (não vem no token) | editar/desativar a empresa, gerir utilizadores dela                    |
| Membro de empresa       | existe em `user_company`                         | listar utilizadores da própria empresa                                 |

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
| `/conta/empresas`, `/conta/empresas/:id`                  | account | auth       | Client       |
| `/admin` (dashboard)                                      | admin   | auth+admin | Client       |
| `/admin/categorias`                                       | admin   | auth+admin | Client       |
| `/admin/produtos`, `/admin/produtos/:id` (imagens, specs) | admin   | auth+admin | Client       |
| `/admin/tipos-entrega`                                    | admin   | auth+admin | Client       |
| `/admin/empresas`                                         | admin   | auth+admin | Client       |
| `**`                                                      | public  | —          | Server (404) |

Slugs de rota em pt (URLs para o público angolano). Quando existir `en`, avaliar prefixo de idioma (`/en/...`) — ver `10`.

Na Fase 3, `/conta/perfil` e `/conta/moradas` estão implementadas sob `authGuard` e renderização client-side. O perfil lê os dados da sessão; moradas consome os endpoints autenticados de endereços e o catálogo público de províncias/municípios. As rotas de empresas continuam pendentes, sem contornar a lacuna L-05.

## Regras de UI por perfil

- Botões de ação só aparecem se o perfil permitir; mesmo assim tratar 403.
- Para ações de empresa, comparar `company.ownerId` com `authStore.user().id`; `GET /api/companies/:id` não valida pertença (lacuna L-05), por isso a listagem de "as minhas empresas" depende de decisão (ver `13`).
