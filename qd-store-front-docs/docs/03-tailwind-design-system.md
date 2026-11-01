# 03 · Tailwind e design system

## Regras
- Tailwind **puro**, configurado em `src/styles.css` (CSS-first, v4). Sem `tailwind.config.js` salvo necessidade comprovada.
- Sem CSS por componente. Sem classes personalizadas além de `@layer base` mínimo.
- Confirmar a sintaxe de instalação para Angular na documentação oficial da versão instalada (normalmente `tailwindcss` + `@tailwindcss/postcss` + `.postcssrc.json`).

## Esqueleto de `src/styles.css`
```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  /* tokens semânticos: valores vêm do inventário do front antigo */
  --color-brand: /* preencher a partir do React antigo */;
  --font-sans: /* idem */;
}

@layer base {
  :root { --surface: ...; --fg: ...; --line: ...; }
  .dark { --surface: ...; --fg: ...; --line: ...; }
  html { color-scheme: light; }
  html.dark { color-scheme: dark; }
}
```
Os tokens semânticos (`surface`, `surface-muted`, `fg`, `fg-muted`, `line`, `brand`, `brand-fg`, `danger`, `success`, `warning`) são expostos via `@theme inline` apontando para as variáveis acima, de modo que `bg-surface` muda sozinho entre claro e escuro.

## Fonte dos valores
Cores, fontes, raios e sombras **não se inventam**: extraem-se do front antigo (ver `11`). O resultado fica documentado numa tabela aqui:

| Token | Claro | Escuro | Origem no React antigo |
|---|---|---|---|
| (preencher na Fase 0) | | | |

## UI kit mínimo (Fase 0)
`button` (variants/sizes), `input`, `select`, `textarea`, `checkbox`, `form-field` (label+erro), `card`, `badge`, `modal`, `confirm-dialog`, `dropdown` (menu), `toast`, `spinner`, `skeleton`, `pagination`, `empty-state`, `price` (Kz), `icon` (SVG inline; sem biblioteca de ícones).

Cada componente: inputs tipados, `aria-*`, foco visível, suporte a `dark:`, documentado com um exemplo de uso no topo do `.ts`.
