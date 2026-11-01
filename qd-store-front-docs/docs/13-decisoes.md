# 13 · Decisões, perguntas em aberto e lacunas

## Decisões (ADR)
| ID | Decisão | Data | Notas |
|---|---|---|---|
| D-001 | Angular + Tailwind CSS puro; sem bibliotecas de UI | 2026-11-01 | Só `styles.css` global |
| D-002 | `.ts` e `.html` separados; sem CSS por componente | 2026-11-01 | |
| D-003 | **SSR híbrido**: servidor nas páginas públicas, cliente em auth/conta/admin | 2026-11-01 | Melhor equilíbrio SEO/complexidade com tokens em `localStorage` |
| D-004 | i18n com **Transloco** (runtime) | 2026-11-01 | Única biblioteca extra aprovada |
| D-005 | Access em memória; refresh em `localStorage` (provisório) → migrar para cookie httpOnly | 2026-11-01 | Isolado em `TokenStorage` |
| D-006 | Tema claro/escuro por classe `dark`, tokens semânticos | 2026-11-01 | |
| D-007 | Âmbito v1 = só o que o back-end já implementa | 2026-11-01 | |
| D-008 | Home v1 usa hero editorial neutro; produtos apresentados apenas a partir de listas da API | 2026-11-01 | Não inventar critério de destaque nem banners/slides sem suporte no contrato. Escolha do Elizandro. |
| D-009 | Usar apenas as rotas canónicas Angular, sem aliases React | 2026-11-01 | Actualizar links internos para as rotas de `07`; escolha do Elizandro. |
| D-010 | Navbar v1 mantém categorias/mega-menus, pesquisa e estilo antigo; área de conta segue `09` | 2026-11-01 | Categorias/produtos vêm da API; visitantes têm Entrar/Criar conta; autenticados têm menu de utilizador; remover carrinho e atalho público de Empresas. Escolha do Elizandro. |
| D-011 | Paleta escura semântica para o tema v1 | 2026-11-01 | `surface #1c1c1e`, `surface-muted #111111`, `fg #f2f2f2`, `fg-muted #aeaeb2`, `line #6e6e73`, `brand #66b2ff`, `brand-fg #111111`, `danger #ff6961`, `success #4ade80`, `warning #fbbf24`. Contraste calculado ≥ 4,5:1 para texto e ≥ 3:1 para linhas. Aprovada pelo Elizandro. |

## Perguntas em aberto (o agente deve perguntar em escolha múltipla)
- Q-01 Caminho/repo do front antigo React — respondida: `../../../qd_store` (relativo a este documento); registado em `docs/11-migracao-do-react.md`.
- Q-02 Versão do Angular no repo e uso de zoneless/Vitest vs runner por defeito.
- Q-03 Onde será o deploy (Vercel com SSR, VPS/Docker…)?
- Q-04 ESLint (angular-eslint) e `prettier-plugin-tailwindcss` aprovados como dev-tools?
- Q-05 "As minhas empresas": como listar, sem endpoint próprio (ver L-05)?
- Q-06 Prefixo de idioma na URL (`/en/...`) quando existir inglês?

## Lacunas do back-end (reportar, não contornar)
| ID | Lacuna | Impacto no front |
|---|---|---|
| L-01 | Não existe `GET /api/auth/me` nem `PATCH` do utilizador | Perfil só mostra dados da sessão; sem edição |
| L-02 | `register` só aceita `personal` | Sem registo empresarial |
| L-03 | Carrinho, encomendas, pagamentos, wishlist, notificações sem rotas | Fora do âmbito v1 |
| L-04 | Erros sem código estável (só `message` em pt-PT) | i18n de erros por status/campo |
| L-05 | Sem endpoint "as minhas empresas"; `GET /companies` é admin; `GET /companies/:id` não valida pertença | Lista de empresas do cliente limitada |
| L-06 | Refresh em corpo JSON (não cookie) | Risco XSS aceite temporariamente (D-005) |
| L-07 | Swagger `User` sem campo `role` e com `accountType: admin` desatualizado | Usar os modelos de `08` |
| L-08 | Cache/ETag em listas públicas inexistente | Cache no cliente (localizações) |
