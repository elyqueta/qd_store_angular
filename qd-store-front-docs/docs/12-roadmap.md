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

- [x] Home · Catálogo (paginação, filtros categoria/estado, pesquisa e ordenação via API) · Detalhe (galeria, especificações)
- [x] M1 — Catálogo público de ícones Font Awesome e escolha de ícones nas categorias
- [x] Páginas institucionais · 404
- [x] Consulta pública dos tipos de entrega activos
- [x] Página pública de empresas informativa (benefícios; pedidos encaminhados por WhatsApp, sem formulário simulado)
- [ ] Destaques/serviços dinâmicos (bloqueado: não há contrato de API)
- [x] SEO por página + JSON-LD de produto

Nota: listagem e detalhe incluem `mainImage: ProductImage | null`; os cartões, o menu de categorias e as páginas de compra usam `mainImage.url` ou um ícone neutro.

## Fase 3 — Conta

- [x] Perfil (dados da sessão; sem edição enquanto o back-end não permitir)
- [x] Moradas (CRUD, padrão, cascata província→município)
- [x] Criar empresa autenticada · listar empresas próprias e membros associados
- [ ] Perfil com apresentação visual alinhada ao React (dados da sessão apenas; sem edição)
- [x] Wishlist e notificações próprias (listagem, leitura e estados vazios)
- [x] Carrinho, checkout, encomendas próprias: histórico, detalhe, cancelamento e tentativa de pagamento
- [ ] Rever perfil em paralelo com a referência React; os dados continuam só de leitura

## Fase 4 — Back office

- [x] Dashboard simples (contagens fornecidas pela API)
- [x] Categorias (admin)
- [x] Produtos, imagens por URL e especificações (admin)
- [x] Tipos de entrega (admin; reactivação depende de endpoint no back-end)
- [x] Empresas (admin: listagem com membros, edição de nome/sector e desactivação)
- [ ] Métodos de pagamento (admin CRUD disponível; interface depende do âmbito administrativo aprovado)

## Fase 5 — Endurecimento

- [x] Melhorias base de acessibilidade e auditoria estática (`17`)
- [ ] Validação manual de acessibilidade com teclado, leitores de ecrã e temas (`17`)
- [ ] Performance (budgets, LCP) · Sitemap/robots
- [ ] Testes de integração e E2E
- [ ] Corrida entre abas no refresh · CI/CD e deploy

## Futuro (depende do back-end)

Perfil editável · Gestão de membros por pesquisa de utilizadores · Pedidos de orçamento por formulário · Destaques e serviços dinâmicos (dependem de endpoints) · Gestão de utilizadores (dependem de endpoints) · Registo empresarial · Inglês (`en`) · Refresh em cookie httpOnly.
