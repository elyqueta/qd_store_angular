# AGENTS.md — QD Store Front-end (Angular + Tailwind CSS)

> Ficheiro principal de instruções para o agente (GitHub Copilot). Lê-o **inteiro** antes de qualquer tarefa.
> Idioma de comunicação com o utilizador e de toda a documentação: **português (pt-PT)**.

## 1. Missão

Migrar o front-end da QD · ItSOLUTIONS (e-commerce de tecnologia para Angola), hoje em **React + JavaScript puro**, para **Angular + Tailwind CSS**, mantendo o **layout aprovado** do front antigo (que serve de clone visual) e consumindo a API real já existente (`qd_store_back-end`).

A v1 cobre **apenas o que o back-end já implementa**. Tudo o resto fica registado em `docs/12-roadmap.md` como "futuro".

## 2. Regras inegociáveis

1. **Só Angular + Tailwind CSS.** Sem Angular Material, CDK, PrimeNG, Bootstrap, Font Awesome, etc. Componentes de UI (dropdown, modal, toast, tabs…) são escritos à mão em `shared/ui`, com acessibilidade.
2. **Bibliotecas permitidas:** `@angular/*`, `rxjs`, `tailwindcss` (+ plugin PostCSS oficial) e `@jsverse/transloco` (decisão D-004). Qualquer outra exige aprovação explícita (ver §4).
3. **Ficheiros separados:** cada componente tem `.ts` + `.html` (`templateUrl`). **Proibido** `template:` inline, `styles:`, `styleUrl(s)` e ficheiros `.css/.scss` por componente.
4. **CSS global único:** `src/styles.css`. Só contém `@import "tailwindcss"`, `@theme` (tokens), `@custom-variant dark`, `@layer base` mínimo. Nada de classes CSS próprias; usar utilitários Tailwind no HTML.
5. **TypeScript estrito:** sem `any`, sem `as` desnecessário, `strict` + `strictTemplates` ativos.
6. **Nenhum texto visível hardcoded** nos templates: tudo passa pelo Transloco (`docs/05-i18n.md`).
7. **Tema claro/escuro** em todos os componentes desde o primeiro (`dark:` variants). Ver `docs/04-tema.md`.
8. **Não inventar endpoints.** O contrato está em `docs/08-api.md`. Se faltar algo, registar como lacuna do back-end (§9), nunca mockar silenciosamente.
9. **Não alterar o back-end** nem o esquema de BD a partir deste repositório.
10. **Uma tarefa de cada vez**, com plano aprovado antes de escrever código (§3).

## 3. Protocolo de trabalho

Para cada tarefa:

1. **Ler** `AGENTS.md` e os docs relevantes em `docs/`.
2. **Planear:** listar ficheiros a criar/alterar, impacto e riscos. **Esperar confirmação** do Elizandro.
3. **Implementar** só o que foi aprovado, ficheiros **completos** (nunca fragmentos soltos).
4. **Verificar:** `ng build`, `ng test`, lint/format, e revisão visual claro/escuro e mobile.
5. **Reportar** (pt-PT): o que foi feito, porquê, como funciona, alternativas consideradas, ficheiros alterados.
6. **Atualizar a documentação** (`docs/`) se algo mudou: roadmap, decisões, API, inventário.

### Decisões críticas
Quando houver uma decisão com impacto estrutural (nova biblioteca, mudança de rota/arquitetura, regra de negócio ambígua), **parar** e fazer **perguntas de escolha múltipla** (2–4 opções, com a tua recomendação marcada). Registar a resposta em `docs/13-decisoes.md`.

### Dados em falta
- **Caminho do front-end antigo (React):** se `docs/11-migracao-do-react.md` ainda não tiver o caminho preenchido, **perguntar ao Elizandro antes de qualquer outra coisa**.
- Nunca presumir telas, textos ou estilos do front antigo: extraí-los do código real.

## 4. Stack e versões

- Angular (versão instalada no repo; usar APIs estáveis dessa versão), **standalone components**, sem NgModules.
- Tailwind CSS v4 (CSS-first). Confirmar a sintaxe contra a documentação da versão instalada antes de configurar.
- Transloco para i18n em runtime.
- SSR híbrido com `@angular/ssr` (D-003).
- Prettier com a mesma configuração do back-end (`singleQuote`, `printWidth: 100`, `trailingComma: es5`, `semi`, `tabWidth: 2`).

## 5. Estrutura de pastas (resumo; detalhe em `docs/02-arquitetura.md`)

```
src/app/
  core/        # singletons: config, auth, http, guards, i18n, theme, seo, error handling
  shared/      # ui/ (componentes genéricos), pipes/, directives/, models/, utils/
  layouts/     # public, account, admin
  features/    # auth, catalog, account, admin, static-pages ... (uma pasta por domínio)
    <feature>/
      pages/        # componentes de rota (*.page.ts/.html)
      components/   # componentes da feature
      data-access/  # services HTTP da feature
      models/       # interfaces da feature
      <feature>.routes.ts
```

## 6. Convenções de código

- Nomes de ficheiro em kebab-case: `product-list.page.ts` + `product-list.page.html`; services `*.service.ts`; guards `*.guard.ts`; interceptors `*.interceptor.ts`.
- Prefixo de seletor: `qd`.
- `ChangeDetectionStrategy.OnPush` em todos os componentes.
- `inject()` em vez de injeção por construtor; **signals** para estado local; `computed`/`effect` com moderação.
- Control flow novo (`@if`, `@for` com `track`, `@switch`); nunca `*ngIf/*ngFor`.
- Formulários **reativos tipados**. Mensagens de validação via Transloco.
- Rotas com `loadComponent`/`loadChildren` (lazy). Uma `*.routes.ts` por feature.
- Services HTTP devolvem `Observable<T>` já desembrulhado do envelope da API.
- Sem lógica de negócio nos componentes de apresentação; sem `subscribe` manual quando `async`/`toSignal` resolver.
- Comentários explicam o **porquê**, não o quê.

## 7. UI e Tailwind

- Tokens de cor/tipografia/espaçamento definidos em `@theme` (`src/styles.css`); componentes usam tokens semânticos (`bg-surface`, `text-fg`, `border-line`, `bg-brand`), **não** cores cruas, para o tema funcionar.
- Mobile-first. Estados `hover`, `focus-visible`, `disabled`, `aria-*` sempre tratados.
- Acessibilidade: semântica HTML, labels, foco visível, navegação por teclado em dropdown/modal, `prefers-reduced-motion`.
- Paridade visual com o front antigo é critério de aceitação (comparar capturas lado a lado).

## 8. Segurança no front

- Tokens: ver `docs/06-autenticacao.md`. Nunca registar tokens em logs. Nunca colocar segredos no bundle.
- Nunca usar `innerHTML`/`bypassSecurityTrust*` sem aprovação.
- A autorização real é do back-end; guards e esconder botões são apenas UX.

## 9. Lacunas conhecidas do back-end (não contornar no front)

Ver `docs/13-decisoes.md` §"Lacunas do back-end". Resumo: não existe `GET /me` nem edição de perfil do utilizador; registo só aceita contas `personal`; mensagens de erro vêm em pt-PT sem códigos; carrinho, encomendas, pagamentos, wishlist e notificações **não têm rotas ainda**.

## 10. Definition of Done

- [ ] Funciona em claro e escuro, mobile e desktop
- [ ] Sem texto hardcoded; chaves em `pt.json`
- [ ] Sem `any`; `ng build` sem avisos novos
- [ ] Estados de loading, vazio e erro tratados
- [ ] Acessível por teclado
- [ ] Rota protegida pelo guard correto (se aplicável)
- [ ] Documentação atualizada
- [ ] Relatório pt-PT entregue

## 11. Índice da documentação

| Ficheiro | Conteúdo |
|---|---|
| `docs/01-visao-e-escopo.md` | Objetivo, âmbito v1, fora de âmbito |
| `docs/02-arquitetura.md` | Camadas, pastas, padrões |
| `docs/03-tailwind-design-system.md` | Config Tailwind, tokens, UI kit |
| `docs/04-tema.md` | Claro/escuro |
| `docs/05-i18n.md` | Transloco e preparação para inglês |
| `docs/06-autenticacao.md` | Tokens, interceptor, guards |
| `docs/07-rotas-e-perfis.md` | Mapa de rotas e níveis de utilizador |
| `docs/08-api.md` | Contrato da API e modelos TypeScript |
| `docs/09-navbar.md` | Navbar e menu do utilizador |
| `docs/10-ssr-e-seo.md` | SSR híbrido e SEO |
| `docs/11-migracao-do-react.md` | Processo de clonagem do front antigo |
| `docs/12-roadmap.md` | Fases e checklist |
| `docs/13-decisoes.md` | ADRs, perguntas em aberto, lacunas |
| `docs/14-prompts-copilot.md` | Prompts prontos por fase |
| `docs/15-estados-de-carregamento.md` | Inventário, critérios e medições dos estados de carregamento |
