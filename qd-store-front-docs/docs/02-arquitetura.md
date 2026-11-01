# 02 · Arquitetura

## Camadas

```
Página (rota) → Componentes de feature → Store/estado (signals) → data-access (HTTP) → API
                         ↓
                  shared/ui (apresentação pura)
```

- **pages/**: ligam rota, SEO e dados; pouca lógica.
- **components/**: apresentação da feature; recebem `input()`/emitem `output()`.
- **data-access/**: um service por recurso da API; só HTTP e mapeamento.
- **core/**: tudo o que é singleton e transversal.

## Estrutura alvo

```
src/
  main.ts / main.server.ts / server.ts
  styles.css                      # único CSS (Tailwind)
  environments/                   # apiUrl por ambiente
  assets/i18n/pt.json (en.json no futuro)
  app/
    app.ts / app.html / app.config.ts / app.config.server.ts
    app.routes.ts / app.routes.server.ts
    core/
      config/        # tokens de injeção (API_URL), constantes
      auth/          # auth.store, auth.service, token-storage, guards
      http/          # interceptors (auth, error, loading), api-error.model
      i18n/          # transloco config + loader
      theme/         # theme.service
      seo/           # seo.service
      notifications/ # toast.service
    shared/
      ui/            # button, input, select, textarea, modal, dropdown, toast, spinner, pagination, empty-state, badge, card, skeleton, confirm-dialog
      pipes/         # currency-kz, ...
      directives/
      models/        # api-response, pagination, api-error
      utils/
    layouts/
      public-layout/ account-layout/ admin-layout/
    features/
      auth/        (entrar, criar-conta)
      catalog/     (home, produtos, produto-detalhe)
      account/     (perfil, moradas, empresas)
      admin/       (categorias, produtos, tipos-entrega, empresas)
      static-pages/(sobre, contactos, 404)
```

## Padrões

- **Standalone + lazy:** cada `features/<x>/<x>.routes.ts` é carregado sob demanda.
- **Estado:** signals em stores de feature (`providedIn: 'root'` só se for realmente global). Sem NgRx.
- **Contratos:** interfaces TS espelham o JSON da API (`docs/08-api.md`); datas chegam como ISO string.
- **Erros:** `apiErrorInterceptor` converte respostas HTTP em `ApiError`, preservando status, corpo e `details[].field`; falhas não HTTP mantêm o erro original. Os erros de formulário são apresentados junto dos campos; a falha 401 de refresh gera toast acessível através de `ToastService` e `ToastRegionComponent`.
- **Config por ambiente:** `API_URL` injetado por token, nunca hardcoded.
- **Dependência entre features:** proibida; partilhar via `shared/` ou `core/`.
- **Escalabilidade:** nova feature = nova pasta com o mesmo esqueleto + entrada lazy em `app.routes.ts` + chaves i18n + item de navegação em `NAV_ITEMS`.
