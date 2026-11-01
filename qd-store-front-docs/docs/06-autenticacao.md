# 06 · Autenticação e sessão

## Contrato do back-end

- `POST /api/v1/auth/login` → `{ status: 'success', data: { user, accessToken, refreshToken } }`.
- **Access token:** JWT, vida curta (padrão 15 min), stateless. Payload: `sub`, `email`, `accountType`, `role`.
- **Refresh token:** opaco, 7 dias, guardado como hash na tabela `session`. **Rotação em cada refresh: o token antigo é apagado** (uso único). Reutilizar um refresh já usado devolve 401.
- `POST /api/v1/auth/logout` (204) invalida o refresh enviado. Idempotente.
- `POST /api/v1/auth/register` cria apenas utilizadores pessoais e devolve `User` (sem tokens); após o registo, a pessoa inicia sessão separadamente.
- Login tem rate limit (10 tentativas/15 min por IP → 429).

## Armazenamento (decisão D-005)

| Token   | Onde (agora)                        | Futuro                                           |
| ------- | ----------------------------------- | ------------------------------------------------ |
| Access  | **memória** (signal no `AuthStore`) | igual                                            |
| Refresh | `localStorage` (`qd.refresh`)       | cookie `httpOnly` (requer alteração no back-end) |

Tudo o que toca no armazenamento passa pela interface `TokenStorage` (`core/auth/token-storage.ts`). Migrar para cookies = trocar **uma** implementação + remover leitura/escrita do refresh no cliente. O CORS do back-end já tem `credentials: true`.

## Peças (`core/auth`)

- `AuthStore`: signals `user`, `accessToken`, `status` (`unknown | anonymous | authenticated`), `isAdmin`.
- `AuthService`: `register`, `login`, `refresh`, `logout`; a API usa o prefixo `/api/v1`.
- `provideAppInitializer`: no browser, se existir refresh token → `refresh()` para restaurar a sessão (o access é perdido ao recarregar a página). Em SSR, não lê armazenamento nem bloqueia páginas públicas.
- `authInterceptor`: anexa `Authorization: Bearer` **apenas** a pedidos para `API_URL/api/v1` e não aos endpoints `/auth/*`.
- **Refresh single-flight:** ao receber 401, se já houver refresh em curso, os restantes pedidos **esperam** o mesmo `Observable` (`shareReplay`) e depois repetem. Obrigatório por causa da rotação de uso único; sem isto, pedidos paralelos fazem logout indevido.
- Se o refresh falhar (401): limpar sessão e redirecionar para `/entrar?returnUrl=…`; a notificação toast fica a cargo do serviço de notificações, ainda por implementar.
- **Duas abas:** o refresh de uso único pode dar corrida entre separadores. Mitigação: `BroadcastChannel`/evento `storage` para propagar o novo par de tokens. Risco conhecido, tratar na Fase 5.

## Guards

- `authGuard` (exige sessão), `guestGuard` (impede `/entrar` e `/criar-conta` se já autenticado), `adminGuard` para rotas de administração.
- Em SSR, rotas protegidas são `RenderMode.Client`; os guards só correm no browser.
- **Guards são UX.** A autorização real é da API (403). O front trata 401/403/404/422/429 de forma uniforme (`core/http`).

## Registo

Só `accountType: 'personal'` (a API recusa `business`). Campos: `fullName` (3–150), `email`, `password` (8–72, 1 minúscula, 1 maiúscula, 1 número), `phone` (9–20), `nif?` (≤20). O registo cria a conta sem iniciar sessão; erros 409 (email existente) e 422 (`details[]`) são apresentados ao utilizador.
