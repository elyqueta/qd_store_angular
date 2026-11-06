# 12 · Roadmap e checklist

## Fase 0 — Fundação

- [ ] Perguntar caminho do front antigo e gerar inventário (`11`)
- [ ] Tailwind configurado em `styles.css`; tokens extraídos do antigo (`03`)
- [ ] Prettier (+ ESLint do Angular se aprovado); `strict`/`strictTemplates`
- [x] `environments` + token `API_URL` (produção pendente de URL aprovada)
- [ ] Tema claro/escuro + script anti-FOUC (`04`)
- [ ] Transloco + `pt.json` + scopes (`05`)
- [x] Core HTTP: interceptor de erros e `ApiError`
- [ ] Interceptor de autenticação, tratamento de erros 429/422/409 e toasts acessíveis
- [ ] Layouts public/account/admin; navbar e footer (`09`)
- [ ] UI kit mínimo (`03`)
- [ ] SSR híbrido configurado (`10`); `SeoService`
- [ ] CORS do back-end com `http://localhost:4200`

## Fase 1 — Autenticação

- [x] Criar conta pessoal · Login · Logout
- [x] AuthStore, TokenStorage, refresh single-flight, restauro no arranque
- [x] Guards (auth, guest, admin); `returnUrl`
- [x] Apresentação dos erros de login/registo (inclui 409/422/429 devolvidos pela API)
- [x] Toasts acessíveis para erros de sessão e notificações transitórias

## Fase 2 — Área pública

- [x] Home · Catálogo (paginação, filtros categoria/estado) · Detalhe (galeria, especificações)
- [x] Páginas institucionais · 404
- [x] SEO por página + JSON-LD de produto

Nota: a listagem de produtos não inclui imagens no contrato actual; os cartões usam um elemento visual neutro e a página de detalhe carrega as imagens pelo endpoint próprio.

## Fase 3 — Conta

- [x] Perfil (dados da sessão; sem edição enquanto o back-end não permitir)
- [x] Moradas (CRUD, padrão, cascata província→município)
- [ ] Empresas (criar, ver, editar, desativar, utilizadores associados)

## Fase 4 — Back office

- [x] Dashboard simples (contagens fornecidas pela API)
- [x] Categorias (admin)
- [x] Produtos, imagens por URL e especificações (admin)
- [x] Tipos de entrega (admin; reactivação depende de endpoint no back-end)
- [x] Empresas (admin: listagem com membros, edição de nome/sector e desactivação)

## Fase 5 — Endurecimento

- [ ] Acessibilidade (auditoria) · Performance (budgets, LCP) · Testes · Sitemap/robots
- [ ] Corrida entre abas no refresh · CI/CD e deploy

## Futuro (depende do back-end)

Carrinho · Encomendas · Pagamentos (Multicaixa Express, Referência, Transferência) · Wishlist · Notificações · Perfil editável · Registo empresarial · Inglês (`en`) · Refresh em cookie httpOnly.
