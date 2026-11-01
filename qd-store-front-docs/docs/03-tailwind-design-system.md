# 03 · Tailwind e design system

## Regras
- Tailwind **puro**, configurado em `src/styles.css` (CSS-first, v4). Sem `tailwind.config.js` salvo necessidade comprovada.
- Sem CSS por componente. Sem classes personalizadas além de `@layer base` mínimo.
- Confirmar a sintaxe de instalação para Angular na documentação oficial da versão instalada (normalmente `tailwindcss` + `@tailwindcss/postcss` + `.postcssrc.json`).

## Esqueleto de `src/styles.css`
```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@theme inline {
  --color-surface: var(--surface);
  --color-surface-muted: var(--surface-muted);
  --color-fg: var(--fg);
  --color-fg-muted: var(--fg-muted);
  --color-line: var(--line);
  --color-brand: var(--brand);
  --color-brand-fg: var(--brand-fg);
  --color-danger: var(--danger);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --font-sans: "DM Sans", sans-serif;
  --font-display: "Playfair Display", serif;
  --font-mono: "DM Mono", monospace;
}

@layer base {
  :root {
    --surface: #ffffff;
    --surface-muted: #f2f2f2;
    --fg: #1c1c1e;
    --fg-muted: #6e6e73;
    --line: #d2d2d7;
    --brand: #0071e3;
    --brand-fg: #ffffff;
    --danger: #ff3b30;
    --success: #16a34a;
    --warning: #92400e;
  }
  .dark {
    --surface: #1c1c1e;
    --surface-muted: #111111;
    --fg: #f2f2f2;
    --fg-muted: #aeaeb2;
    --line: #6e6e73;
    --brand: #66b2ff;
    --brand-fg: #111111;
    --danger: #ff6961;
    --success: #4ade80;
    --warning: #fbbf24;
  }
  html { color-scheme: light; }
  html.dark { color-scheme: dark; }
  body {
    background-color: var(--surface-muted);
    color: var(--fg);
    font-family: var(--font-sans);
  }
}
```
Os tokens semânticos (`surface`, `surface-muted`, `fg`, `fg-muted`, `line`, `brand`, `brand-fg`, `danger`, `success`, `warning`) são expostos via `@theme inline` apontando para as variáveis acima, de modo que `bg-surface` muda sozinho entre claro e escuro. Estes valores estão aplicados em `src/styles.css` (D-011).

## Fonte dos valores
Cores, fontes, raios e sombras **não se inventam**: extraem-se do front antigo (ver `11` e o inventário). Os valores claros abaixo vêm do React; os valores escuros não existiam no legado e foram aprovados como decisão D-011. Não inferir outros valores por inversão automática.

| Token | Claro | Escuro | Origem no React antigo |
|---|---|---|---|
| `surface` | `#ffffff` | `#1c1c1e` | Claro: `--qd-surface`; escuro: D-011, tom `--qd-dark` reutilizado |
| `surface-muted` | `#f2f2f2` | `#111111` | Claro: `--qd-bg`; escuro: D-011, tom `--qd-darker` reutilizado |
| `fg` | `#1c1c1e` | `#f2f2f2` | Claro: `--qd-dark`; escuro: D-011 |
| `fg-muted` | `#6e6e73` | `#aeaeb2` | Claro: `--qd-gray`; escuro: D-011, tom `--qd-light` reutilizado |
| `line` | `#d2d2d7` | `#6e6e73` | Claro: `--qd-border`; escuro: D-011, contraste de 3,36:1 sobre `surface` |
| `brand` | `#0071e3` | `#66b2ff` | Claro: `qd.accent`; escuro: D-011, tom mais claro aprovado |
| `brand-fg` | `#ffffff` | `#111111` | Claro: texto de botões de marca no React; escuro: D-011 |
| `danger` | `#ff3b30` | `#ff6961` | Claro: `qd.red`; escuro: D-011 |
| `success` | `#16a34a` | `#4ade80` | Claro: estados de sucesso/poupança; escuro: D-011 |
| `warning` | `#92400e` | `#fbbf24` | Claro: `text-amber-800` usado no aviso do checkout React; escuro: D-011 |
| `font-sans` | `DM Sans, sans-serif` | Não aplicável | `index.html`, `src/index.css` e `tailwind.config.js` |
| `font-display` | `Playfair Display, serif` | Não aplicável | `index.html` e `tailwind.config.js` |
| `font-mono` | `DM Mono, monospace` | Não aplicável | `index.html` e `tailwind.config.js` |
| `radius-card` | `rounded-2xl` (16 px) | Não aplicável | Classes Tailwind em cartões React |
| `radius-control` | `rounded-lg` (8 px); `rounded-xl` (12 px) em painéis | Não aplicável | Classes Tailwind em formulários e painéis React |
| `radius-pill` | `rounded-full` | Não aplicável | Botões e badges React |
| `shadow-card` | `shadow-sm`; `shadow-xl` no hover | Não aplicável | Cartões React |
| `shadow-overlay` | `shadow-2xl` | Não aplicável | Drawer e painel WhatsApp React |
| `layout-content` | `max-width: 1200px` (algumas páginas: 1100 px) | Não aplicável | Contentores React |
| `layout-gutter` | `px-6` (24 px) | Não aplicável | Contentores React |
| `section-space` | `py-20` (80 px) | Não aplicável | Secções da Home React |
| `nav-height` | `70px` | Não aplicável | `--nav-height` em `src/index.css` |

### Observações da extração

- `#f2f2f2` é o fundo global em `src/index.css`; o anti-flash de `index.html` usa `#f2f2f7`. Registar a diferença e não a resolver silenciosamente.
- A fonte `Playfair Display` está configurada como display, mas a maior parte do conteúdo observado usa DM Sans.
- Sombras e raios acima identificam utilitários usados, não valores CSS próprios. Não assumir que os valores de utilitários do Tailwind 3.4 são tokens de marca independentes.
- A paleta escura não vem do React; foi aprovada em D-011. Os rácios verificados são ≥ 4,5:1 para texto e ≥ 3:1 para linhas nos fundos indicados.
- Os tokens de aviso claros preservam o tom `amber-800` usado no legado; a sua aplicação a novas telas deve usar o token semântico (`text-warning`).

## UI kit mínimo (Fase 0)
`button` (variants/sizes), `input`, `select`, `textarea`, `checkbox`, `form-field` (label+erro), `card`, `badge`, `modal`, `confirm-dialog`, `dropdown` (menu), `toast`, `spinner`, `skeleton`, `pagination`, `empty-state`, `price` (Kz), `icon` (SVG inline; sem biblioteca de ícones).

Cada componente: inputs tipados, `aria-*`, foco visível, suporte a `dark:`, documentado com um exemplo de uso no topo do `.ts`.
