# 08 · Contrato da API (estado atual)

Base URL: `environment.apiUrl` (dev: `http://localhost:3000`). Documentação interativa do back-end: `/api-docs`, spec em `/openapi.json` (fora de produção). **Adicionar `http://localhost:4200` ao `CORS_ORIGIN` do back-end** em desenvolvimento.

## Envelopes
```ts
interface ApiResponse<T> { status: 'success'; data: T; count?: number }
interface PaginatedResponse<T> { status: 'success'; data: T[]; pagination: Pagination }
interface Pagination { page: number; limit: number; total: number; totalPages: number }
interface ApiErrorBody { status: 'error'; message: string; details?: { field: string; message: string }[] }
```
Estados: 400 JSON inválido · 401 sem/ token inválido · 403 sem permissão · 404 · 409 conflito · 422 validação (`details`) · 429 rate limit · 500.

## Endpoints
**Auth** (`/api/auth`): `POST /register`, `POST /login`, `POST /refresh`, `POST /logout`.

**Categorias** (`/api/categories`): `GET /` e `GET /:id` públicos; `POST`, `PATCH /:id`, `DELETE /:id` admin (409 se tiver produtos).

**Produtos** (`/api/products`): `GET /?page&limit(≤100)&categoryId&status` público (inclui `categoryName`); `GET /:id`; `POST`, `PATCH /:id`, `DELETE /:id` admin (409 se referenciado).
- Imagens `/api/products/:productId/images`: `GET` público; `POST`, `PATCH /:id`, `DELETE /:id` admin. Só URL (sem upload).
- Especificações `/api/products/:productId/specifications`: idem; `displayOrder` obrigatório.

**Tipos de entrega** (`/api/delivery-types`): `GET /` (só ativos) e `GET /:id` públicos; `POST`, `PATCH`, `DELETE` (=desativar) admin.

**Localizações** (`/api/locations`): `GET /` (21 províncias + municípios), `GET /provinces`, `GET /provinces/:slug/municipalities`. Públicos; carregar uma vez e cachear.

**Moradas** (`/api/addresses`, auth, sempre do utilizador do token): `GET /`, `POST /`, `GET /:id`, `PATCH /:id` (province+municipality **juntos**), `DELETE /:id`, `PATCH /:id/default`. A primeira morada fica padrão automaticamente.

**Empresas** (`/api/companies`, auth): `POST /` (qualquer utilizador autenticado; fica proprietário), `GET /` **admin**, `GET /:id`, `PATCH /:id` e `DELETE /:id` (proprietário ou admin; `DELETE` = soft delete). `nif` imutável (enviar → 422).
- Utilizadores `/api/companies/:companyId/users`: `POST` (owner/admin), `GET` (admin ou membro), `PATCH /:userId` (cargo), `DELETE /:userId`.

**Admin** (`/api/admin`): `GET /companies` → empresas com `users[]`.

**Saúde:** `GET /health`.

## Modelos TypeScript (espelham o JSON)
```ts
type UserRole = 'customer' | 'admin';
type AccountType = 'personal' | 'business';
interface User { id: string; fullName: string; email: string; phone: string; nif: string | null;
  accountType: AccountType; role: UserRole; status: 'active'|'inactive'|'banned';
  deactivatedAt: string | null; createdAt: string; updatedAt: string }
interface AuthResult { user: User; accessToken: string; refreshToken: string }
interface Category { id: string; slug: string; label: string; icon: string | null; createdAt: string; updatedAt: string }
interface Product { id: string; categoryId: string; categoryName?: string; name: string; description: string | null;
  price: number; originalPrice: number | null; badge: string | null;
  status: 'active'|'inactive'|'out_of_stock'; createdAt: string; updatedAt: string }
interface ProductImage { id: string; productId: string; url: string; displayOrder: number;
  width: number|null; height: number|null; format: string|null; sizeBytes: number|null }
interface ProductSpecification { id: string; productId: string; specKey: string; specValue: string; displayOrder: number }
interface DeliveryType { id: string; name: string; description: string|null; price: number;
  type: 'standard'|'express'|'corporate'|'pickup'; isActive: boolean; createdAt: string; updatedAt: string }
interface Address { id: string; userId: string; label: string|null; province: string; municipality: string;
  neighborhood: string; address: string; reference: string|null; latitude: number|null; longitude: number|null;
  isDefault: boolean; createdAt: string; updatedAt: string }
interface Province { slug: string; name: string }
interface ProvinceWithMunicipalities extends Province { municipalities: string[] }
interface Company { id: string; ownerId: string; name: string; nif: string; sector: string|null;
  status: 'active'|'inactive'|'banned'; createdAt: string; updatedAt: string }
interface CompanyUser { id: string; fullName: string; email: string; companyRole: string|null }
interface CompanyWithUsers extends Company { users: CompanyUser[] }
interface UserCompany { userId: string; companyId: string; role: string|null; createdAt: string }
```
Preços em **Kz (AOA)**, inteiros/decimais como `number`. Estes modelos vivem em `shared/models` ou `features/*/models`; não duplicar.

## Convenções de consumo
- Um `*-api.service.ts` por recurso em `data-access/`, devolvendo `Observable<T>` desembrulhado.
- `PATCH` só envia campos alterados; `null` explícito = limpar (ex.: `icon`, `sector`, `originalPrice`).
- Formulários de edição respeitam `.strict()` do back-end: **não enviar campos extra** (422).
