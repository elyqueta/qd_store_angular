# 04 · Tema claro/escuro

## Comportamento
- Três preferências: `light`, `dark`, `system` (padrão = `system`).
- Persistência: `localStorage` chave `qd.theme`.
- Aplicação: classe `dark` em `<html>`; Tailwind via `@custom-variant dark`.
- Alternância no cabeçalho (ícone) acessível por teclado, com `aria-label` traduzido.

## ThemeService (`core/theme`)
- Signal `preference` + `computed` `effective`.
- Escuta `matchMedia('(prefers-color-scheme: dark)')` quando `system`.
- Só toca em `document`/`localStorage` no browser (`isPlatformBrowser`), por causa do SSR.

## Evitar "flash" (FOUC)
Pequeno script **inline no `<head>` de `index.html`** que lê `qd.theme` e põe a classe `dark` antes da primeira pintura. É a única exceção tolerada a "sem JS fora do Angular", justificada pelo SSR.

## Regras para componentes
- Usar tokens semânticos (`bg-surface`, `text-fg`), nunca `bg-white`/`text-black` diretamente.
- Testar sempre os dois temas (imagens com fundo transparente, sombras, bordas, estados de foco).
- Gráficos/ilustrações: variantes por tema quando necessário.
