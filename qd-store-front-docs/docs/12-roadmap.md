# 12 · Roadmap e checklist

## Fase 0 — Fundação

- [ ] Perguntar caminho do front antigo e gerar inventário (`11`)
- [ ] Tailwind configurado em `styles.css`; tokens extraídos do antigo (`03`)
- [ ] Prettier (+ ESLint do Angular se aprovado); `strict`/`strictTemplates`
- [x] `environments` + token `API_URL` (produção pendente de URL aprovada)
- [ ] Tema claro/escuro + script anti-FOUC (`04`)
- [ ] Transloco + `pt.json` + scopes (`05`)
- [ ] Core HTTP: interceptors (auth, erros), `ApiError`, toasts
- [ ] Layouts public/account/admin; navbar e footer (`09`)
- [ ] UI kit mínimo (`03`)
- [ ] SSR híbrido configurado (`10`); `SeoService`
- [ ] CORS do back-end com `http://localhost:4200`

## Fase 1 — Autenticação

- [ ] Criar conta · Login · Logout
- [ ] AuthStore, TokenStorage, refresh single-flight, restauro no arranque
- [ ] Guards (auth, guest, role); `returnUrl`
- [ ] Tratamento de 429/422/409

## Fase 2 — Área pública

- [ ] Home · Catálogo (paginação, filtros categoria/estado) · Detalhe (galeria, especificações)
- [ ] Páginas institucionais · 404
- [ ] SEO por página + JSON-LD de produto

## Fase 3 — Conta

- [ ] Perfil (dados da sessão; edição só quando o back-end permitir)
- [ ] Moradas (CRUD, padrão, cascata província→município)
- [ ] Empresas (criar, ver, editar, desativar, utilizadores associados)

## Fase 4 — Back office

- [ ] Dashboard simples
- [ ] Categorias · Produtos (+ imagens + especificações) · Tipos de entrega · Empresas (admin)

## Fase 5 — Endurecimento

- [ ] Acessibilidade (auditoria) · Performance (budgets, LCP) · Testes · Sitemap/robots
- [ ] Corrida entre abas no refresh · CI/CD e deploy

## Futuro (depende do back-end)

Carrinho · Encomendas · Pagamentos (Multicaixa Express, Referência, Transferência) · Wishlist · Notificações · Perfil editável · Registo empresarial · Inglês (`en`) · Refresh em cookie httpOnly.
