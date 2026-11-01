# 10 · SSR híbrido e SEO

Decisão D-003: **SSR só nas páginas públicas** (catálogo, produto, institucionais); SPA no resto.

## Porquê
- Catálogo e produto precisam de HTML indexável e de partilha social (Open Graph).
- Auth/conta/admin não têm benefício de SEO e dependem de `localStorage` (inexistente no servidor); renderizá-las no cliente evita guards e tokens em SSR.

## Implementação
- `ng add @angular/ssr` (ou equivalente da versão instalada); hidratação com `withEventReplay`.
- `app.routes.server.ts`: `RenderMode.Server` (ou `Prerender` para estáticas: sobre/contactos) nas rotas públicas; `RenderMode.Client` em `/entrar`, `/criar-conta`, `/conta/**`, `/admin/**`.
- `HttpClient` com `withFetch()`; a cache de transferência evita pedir duas vezes os mesmos dados.
- **Proibido** tocar em `window`, `document`, `localStorage` fora de `isPlatformBrowser` (ou serviços que o encapsulem: `TokenStorage`, `ThemeService`).
- `API_URL` no servidor pode diferir do do browser (ex.: rede interna); suportar via token.

## SeoService (`core/seo`)
Define por página: `<title>`, `description`, `canonical`, `og:title/description/image/type/url`, `twitter:card`, `robots`. Páginas privadas: `noindex`.
- Produto: **JSON-LD `Product`** (nome, imagem, descrição, `offers` com preço em AOA e disponibilidade a partir de `status`).
- Catálogo: títulos/descrições por categoria e paginação (`rel=prev/next` opcional; `canonical` sem parâmetros irrelevantes).
- `sitemap.xml` e `robots.txt`: gerados na Fase 5 a partir de `GET /api/products` e `GET /api/categories`.
- Preparado para `hreflang` quando existir `en`.

## Performance
Imagens com `NgOptimizedImage` quando o domínio de origem for fixo (URLs externas: avaliar), `width/height`, `loading="lazy"`, LCP prioritário; lazy routes; budgets do Angular ativos.

## Risco
Hidratação e Transloco/tema exigem cuidado para não haver *mismatch* (tema inicial por script inline; idioma por URL/cookie, não por `localStorage` no servidor).
