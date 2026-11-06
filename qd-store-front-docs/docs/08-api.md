# 08 · Contrato da API (estado atual)

Base URL: token de injecção `API_URL` (ambiente local actual: `http://localhost:1914` para Docker Compose; serviço local directo: `http://localhost:3000`; produção: `https://qd-store-back-end.onrender.com`); os endpoints de domínio usam o prefixo `${API_URL}/api/v1`. O cliente HTTP usa `withFetch()` para compatibilidade com SSR. A URL de produção é incluída no build Angular através de `environment.production.ts`; não é um segredo nem uma variável runtime do Vercel. A configuração pode ser substituída no servidor se a API usar uma URL interna.

Documentação interactiva do back-end: `/api-docs`, spec em `/openapi.json` (fora de produção). **Adicionar `http://localhost:4200` ao `CORS_ORIGIN` do back-end** em desenvolvimento.

## Envelopes

```ts
interface ApiResponse<T> {
  status: 'success';
  data: T;
  count?: number;
}
interface PaginatedResponse<T> {
  status: 'success';
  data: T[];
  pagination: Pagination;
}
interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
interface ApiErrorBody {
  status: 'error';
  message: string;
  details?: { field: string; message: string }[];
}
```

Estados: 400 JSON inválido · 401 sem/ token inválido · 403 sem permissão · 404 · 409 conflito · 422 validação (`details`) · 429 rate limit · 500.

## Endpoints

**Auth** (`/api/v1/auth`): `POST /register` (cria conta pessoal e devolve `User`), `POST /login` e `POST /refresh` (devolvem `AuthResult`), `POST /logout` (204). Login envia `{ email, password }`; registo envia `{ fullName, email, password, phone, accountType: 'personal', nif? }`; refresh/logout enviam `{ refreshToken }`.

**Categorias** (`/api/v1/categories`): `GET /` e `GET /:id` públicos; `POST { label, icon? }`, `PATCH /:id { label?, icon? }` e `DELETE /:id` admin (409 se tiver produtos). `label` tem entre 1 e 100 caracteres; `icon` é opcional e pode ser `null` num PATCH para o remover (máximo de 10 caracteres).

**Produtos** (`/api/v1/products`): `GET /?page&limit(≤100)&categoryId&status&search&sort&priceMin&priceMax&availableOnly&excludeId` público (inclui `categoryName` e `mainImage`); `GET /:id?include=images,specifications` público; `POST`, `PATCH /:id`, `DELETE /:id` admin (409 se referenciado por carrinhos ou pedidos).

- `name` é obrigatório (máximo 200); `description` opcional (máximo 5000); `price` positivo; `originalPrice` opcional e, quando informado, deve ser superior a `price`; `badge` opcional (máximo 50). O PATCH é parcial e aceita `null` para limpar `description`, `originalPrice` e `badge`. O contrato actual não permite alterar directamente o estado do produto.
- O detalhe do produto pede `include=images,specifications` para receber os dados relacionados numa única chamada, em vez de fazer três leituras separadas.

- `mainImage` é a imagem associada com menor `displayOrder`, ou `null` quando o produto ainda não tem imagens. Durante a transição, o front também tolera respostas antigas sem esta propriedade.
- `POST /` pode receber `mainImage` opcional para criar a imagem principal na mesma operação; continua compatível criar primeiro o produto e depois usar `POST /:productId/images`.
- Exemplo de body para criar um produto com imagem principal:

```json
{
  "categoryId": "c1b2a3d4-e5f6-4789-a012-3456789abcde",
  "name": "Portátil Dell Inspiron 15",
  "price": 450000,
  "description": "Portátil para trabalho e estudo",
  "originalPrice": 520000,
  "badge": "Promoção",
  "mainImage": {
    "url": "https://cdn.exemplo.co.ao/produtos/dell-inspiron-15.jpg",
    "width": 1200,
    "height": 900,
    "format": "jpg",
    "sizeBytes": 204800
  }
}
```

- Imagens `/api/v1/products/:productId/images`: `GET` público; `POST { url, displayOrder?, width?, height?, format?, sizeBytes? }`, `PATCH /:id` parcial, `DELETE /:id` admin. Só URL (sem upload); `displayOrder` é inteiro ≥ 0.
- Especificações `/api/v1/products/:productId/specifications`: `GET` público; `POST { specKey, specValue, displayOrder }`, `PATCH /:id` parcial e `DELETE /:id` admin. Chave e valor têm até 255 caracteres; `displayOrder` inteiro ≥ 0 e obrigatório na criação.

**Tipos de entrega** (`/api/v1/delivery-types`): `GET /` (só ativos) e `GET /:id` públicos; `POST`, `PATCH`, `DELETE` (=desactivar) admin.

**Localizações** (`/api/v1/locations`): `GET /` (21 províncias + municípios), `GET /provinces`, `GET /provinces/:slug/municipalities`. Públicos; carregar uma vez e cachear.

**Moradas** (`/api/v1/addresses`, auth, sempre do utilizador do token): `GET /`, `POST /`, `GET /:id`, `PATCH /:id` (province+municipality **juntos**), `DELETE /:id`, `PATCH /:id/default`. A primeira morada fica padrão automaticamente.

**Empresas** (`/api/v1/companies`, auth): `POST /` (qualquer utilizador autenticado; fica proprietário), `GET /` **admin**, `GET /:id`, `PATCH /:id` e `DELETE /:id` (proprietário ou admin; `DELETE` = soft delete). `nif` imutável (enviar → 422).

- Utilizadores `/api/v1/companies/:companyId/users`: `POST` (owner/admin), `GET` (admin ou membro), `PATCH /:userId` (cargo), `DELETE /:userId`.

**Admin** (`/api/v1/admin`): `GET /companies` → empresas com `users[]`.

**Saúde:** `GET /health`.

## Modelos TypeScript (espelham o JSON)

```ts
type UserRole = 'customer' | 'admin';
type AccountType = 'personal' | 'business';
interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  nif: string | null;
  accountType: AccountType;
  role: UserRole;
  status: 'active' | 'inactive' | 'banned';
  deactivatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}
interface Category {
  id: string;
  slug: string;
  label: string;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
}
interface Product {
  id: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  badge: string | null;
  status: 'active' | 'inactive' | 'out_of_stock';
  mainImage?: ProductImage | null;
  createdAt: string;
  updatedAt: string;
}
interface ProductImage {
  id: string;
  productId: string;
  url: string;
  displayOrder: number;
  width: number | null;
  height: number | null;
  format: string | null;
  sizeBytes: number | null;
}
interface ProductSpecification {
  id: string;
  productId: string;
  specKey: string;
  specValue: string;
  displayOrder: number;
}
interface DeliveryType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  type: 'standard' | 'express' | 'corporate' | 'pickup';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
interface Address {
  id: string;
  userId: string;
  label: string | null;
  province: string;
  municipality: string;
  neighborhood: string;
  address: string;
  reference: string | null;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}
interface Province {
  slug: string;
  name: string;
}
interface ProvinceWithMunicipalities extends Province {
  municipalities: string[];
}
interface Company {
  id: string;
  ownerId: string;
  name: string;
  nif: string;
  sector: string | null;
  status: 'active' | 'inactive' | 'banned';
  createdAt: string;
  updatedAt: string;
}
interface CompanyUser {
  id: string;
  fullName: string;
  email: string;
  companyRole: string | null;
}
interface CompanyWithUsers extends Company {
  users: CompanyUser[];
}
interface UserCompany {
  userId: string;
  companyId: string;
  role: string | null;
  createdAt: string;
}
```

Preços em **Kz (AOA)**, inteiros/decimais como `number`. Estes modelos vivem em `shared/models` ou `features/*/models`; não duplicar.

## Convenções de consumo

- Um `*-api.service.ts` por recurso em `data-access/`, devolvendo `Observable<T>` desembrulhado.
- `PATCH` só envia campos alterados; `null` explícito = limpar (ex.: `icon`, `sector`, `originalPrice`).
- Formulários de edição respeitam `.strict()` do back-end: **não enviar campos extra** (422).
