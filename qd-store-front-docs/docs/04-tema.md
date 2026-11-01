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
- Implementação: `src/app/core/theme/theme.service.ts`; o serviço aplica/remove `dark` em `<html>` e persiste `light`, `dark` ou `system` em `qd.theme`.
- O shell raiz injeta o serviço para inicializar o tema em todas as rotas; em SSR, a preferência do sistema resolve para claro até ao arranque no browser.

## Evitar "flash" (FOUC)
Script **inline no `<head>` de `src/index.html`** que lê `qd.theme` e põe/remove a classe `dark` antes da primeira pintura. É a única exceção tolerada a "sem JS fora do Angular", justificada pelo SSR. Se o acesso a `localStorage` não estiver disponível, o erro é registado e o tema do sistema é usado.

## Regras para componentes
- Usar tokens semânticos (`bg-surface`, `text-fg`), nunca `bg-white`/`text-black` diretamente.
- Testar sempre os dois temas (imagens com fundo transparente, sombras, bordas, estados de foco).
- Gráficos/ilustrações: variantes por tema quando necessário.
- Paleta escura aprovada pelo Elizandro em D-011, documentada em `docs/03-tailwind-design-system.md`; não inferir cores escuras adicionais sem nova decisão.
