# 18 · Paridade visual com o front React aprovado

> Ler antes de qualquer tarefa de UI. Complementa `AGENTS.md`, `03-tailwind-design-system.md` e `11-migracao-do-react.md`.
> O layout React (`../../../qd_store`) foi **aprovado**. O Angular actual afastou-se dele em vários pontos.
> Esta lista é **obrigatória**: não inventar estilos, não "interpretar", copiar o resultado visual do React.

## 0. Regra de ouro

Antes de tocar numa tela, abrir o ficheiro React correspondente, extrair valores reais (classes, cores, espaçamentos, tamanhos, animações) e só depois escrever o template Angular. Fazer captura lado a lado (React vs Angular, claro e escuro) e anexá-la ao relatório. Sem captura, a tarefa não está concluída.

## 1. Decisões que exigem aprovação antes de implementar

| ID proposto | Tema                                    | Conflito                                    | Recomendação                                                                                                                                                        |
| ----------- | --------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-013       | Font Awesome                            | `AGENTS.md` §2 proíbe Font Awesome          | **Aprovado por Elizandro (2026-11-06):** usar apenas SVG inline (componente `qd-icon` com mapa de ícones), sem CSS/webfont ou dependência de runtime.               |
| D-014       | Efeito glass (glassmorphism)            | Nenhum                                      | **Aprovado por Elizandro (2026-11-06):** tokens `glass` em `styles.css` (ver §3), restritos aos locais listados e com fallback opaco.                               |
| D-015       | Âmbito de Carrinho/Favoritos/Pagamentos | O contrato antigo em `08` estava incompleto | **Aprovado por Elizandro (2026-11-06):** integrar carrinho, favoritos, encomendas e pagamentos, agora descritos em `08`; não criar endpoints nem simular operações. |

O Copilot deve perguntar estas decisões em escolha múltipla (2–4 opções, recomendação marcada) e registá-las em `13-decisoes.md`.

## 2. Tipografia: acabar com texto minúsculo

O texto pequeno é o sinal mais óbvio de interface "gerada por IA". Regras:

- **Proibido** `text-[10px]`, `text-[11px]`, `text-[9px]` e qualquer tamanho arbitrário `text-[Npx]`.
- Mínimo para texto funcional (botões, links, labels, mensagens, preços, tabelas): `text-sm` (14 px).
- `text-xs` (12 px) só em etiquetas em maiúsculas (eyebrow) e metadados secundários, nunca em acções nem em erros.
- Corpo de texto: `text-base` (16 px). Títulos de secção: `text-3xl` a `text-4xl` com `tracking-tight`, como no React.
- Locais com tamanhos a corrigir já identificados: `product-card.component.html` (badge `text-[10px]`, categoria `text-[11px]`), ver também navbar, formulários de admin e footer. Fazer pesquisa global por `text-\[` e `text-xs`.
- Fontes iguais ao React: DM Sans (corpo), Playfair Display (display) e DM Mono (mono). Confirmar onde o React usa `font-display` e `font-mono` e replicar.

## 3. Glassmorphism com as cores da QD

Usar o efeito vidro como assinatura visual da v2, mas **só** onde o React já o usava ou onde indicado aqui (navbar, menu de utilizador, cartões sobre o hero, modais).

Fonte no React: `src/index.css` (`.nav-glass`, `.nav-glass-dark`) e `Navbar.jsx`.

Tokens a acrescentar em `src/styles.css` (valores a **confirmar** contra o React e validar contraste):

```css
@theme inline {
  --color-glass: var(--glass);
  --color-glass-border: var(--glass-border);
}
:root {
  --glass: rgba(255, 255, 255, 0.72);
  --glass-border: rgba(255, 255, 255, 0.45);
}
.dark {
  --glass: rgba(28, 28, 30, 0.72);
  --glass-border: rgba(255, 255, 255, 0.12);
}
```

Receita de utilitários Tailwind: `bg-glass backdrop-blur-xl backdrop-saturate-150 border border-glass-border shadow-xl rounded-2xl`.

Regras:

- O texto sobre vidro tem de manter contraste ≥ 4,5:1 nos dois temas (medir sobre o fundo real, não sobre branco).
- Fallback sem `backdrop-filter`: fundo `bg-surface` opaco (`@supports not (backdrop-filter: blur(1px))`).
- Não pôr vidro sobre vidro.

## 4. Navbar (alterar)

Estado actual: demasiados links e controlos soltos (tema, entrar, criar conta).

Alvo:

1. **Esquerda:** logótipo oficial `favicon.webp` (não o círculo "QD" + texto).
2. **Centro (desktop ≥ 1130 px):** links como no React: Início, Smartphones, Laptops, Desktops, Som, Gaming, Extra, Empresas, com mega-menu de produtos por categoria (a navbar Angular actual só mostra Início/Catálogo/Sobre/Contactos + categorias; reavaliar com o inventário `migracao/inventario.md` e o `Navbar.jsx`).
3. **Direita:** apenas **dois** controlos:
   - Pesquisa (ícone);
   - **Um único botão de menu de utilizador** (ícone de utilizador/avatar).
4. O botão de menu abre um **painel glass** que contém, por ordem:
   - Visitante: "Entrar" (principal), "Criar conta" (secundário), separador, alternar tema (com rótulo e ícone, não só emoji), idioma (escondido até haver `en`);
   - Autenticado: cabeçalho com avatar, nome e e-mail; Perfil; Moradas; As minhas empresas; Painel de administração (só `admin`); separador; alternar tema; Sair.
5. Tema deixa de ser botão solto na barra. Fica dentro do painel como item com rótulo ("Tema: claro / escuro / sistema").
6. Painel com animação de entrada discreta (`slideDown`, 0,25–0,3 s, respeitando `prefers-reduced-motion`), fecha com Esc/clique fora, mantém a navegação por teclado já implementada (setas, Home/End, foco devolvido ao botão).
7. Estado transparente/escuro sobre o hero na Home e fundo glass depois de 10 px de scroll, como no React.
8. Altura `70px` (`--nav-height`).
9. Mobile (< 770 px): drawer de ecrã inteiro com atalhos no topo e a mesma ordem de links.

Ícones: ver §6. Não usar emoji (`☀️`, `🌙`, `⌕`, `☰`, `⌄`, `◇`) em lado nenhum da interface.

## 5. Logótipo e preloader

- **Logótipo:** usar `public/favicon.webp` do React (copiar para `public/` do Angular). Substituir todos os "QD" em círculo e o texto "QD · ItSOLUTIONS" na navbar, footer e preloader. Corrigir o `index.html` que referencia `favicon.ico`/`favicon.svg` inexistentes.
- **Preloader:** reintroduzir como no React (`Preloader.jsx` + `PreloaderContext`): fundo em gradiente claro, logo central com glow, feixes de luz, anel pulsante, barra de progresso e pontos. Aparece **apenas no primeiro carregamento**, não em cada rota (o React tinha um `usePageTransition` que não deve ser replicado em cada navegação).
- Regras técnicas Angular: componente standalone, signal `visible`; em SSR não bloquear o HTML (renderizar já escondido ou só no browser, via `isPlatformBrowser`); respeitar `prefers-reduced-motion` (sem feixes nem pulsar, só fade); duração máxima de 3,2 s com opção de sair mais cedo se a página estiver pronta; não bloquear o carregamento real.
- Esta peça é distinta de `15-estados-de-carregamento.md` (que cobre carregamento de dados).

## 6. Ícones (Font Awesome)

- Criar `shared/ui/icon.component` (`qd-icon`, input `name` tipado por união de strings) com os caminhos SVG do Font Awesome Free (estilos `solid` e `brands`).
- Sempre `aria-hidden="true"` quando decorativo; se o ícone for o único conteúdo do botão, o botão leva `aria-label` traduzido.
- Tamanhos: 16 px em linha com texto, 20 px em botões, 24 px em cabeçalhos de estado. Herdar `currentColor`.
- Mapa inicial sugerido (confirmar com o Elizandro, que pode escolher): utilizador `user`, pesquisa `magnifying-glass`, menu `bars`, fechar `xmark`, tema `circle-half-stroke` / `sun` / `moon`, sair `right-from-bracket`, morada `location-dot`, empresas `building`, admin `gauge-high`, WhatsApp `whatsapp` (brands), sucesso `circle-check`, erro `circle-exclamation`, aviso `triangle-exclamation`, info `circle-info`, apagar `trash-can`.
- **Categorias**: hoje a API devolve emoji em `icon` (ex.: `💻`). Ver `20-prompt-backend-destaques-icones-utilizadores.md`: o back-end passará a guardar o **nome** do ícone FA. Até lá, o front mapeia emoji conhecidos para ícones FA e usa `box` como fallback; nunca renderizar o emoji cru.
- Remover os emoji de `home.page.html` (`📦`), `admin-layout`, navbar, etc.

## 7. Página inicial: restaurar todas as secções do React

O React tem (ver `HomePage.jsx`, `Hero.jsx`): Hero em ecrã inteiro com slides automáticos (7 s) e pontos; "Os mais procurados"; secções "Tesla" em ecrã inteiro (iPhone, MacBook, iMac, Sony, PS5) alternando overlay escuro/claro; "Potência para o teu trabalho" (Desktops); "Experiências imersivas" (Gaming & Som); "Completa a tua setup" (Extra); CTA de WhatsApp.

O Angular actual só tem hero editorial neutro, categorias e 4 produtos.

Alvo:

1. **Hero em ecrã inteiro** com slides, título/subtítulo/CTA e imagem de fundo, **gerido por destaques** (ver §7.1) em vez de dados hardcoded. Manter o estilo (`tesla-section`, overlay em gradiente, pontos de navegação).
2. **Secções em ecrã inteiro** (estilo Tesla) para produtos/serviços em destaque, também geridas por destaques.
3. **Blocos por categoria** (Desktops, Gaming e Som, Extra) com cartões de produto e link "Ver todos".
4. **Serviços**: o utilizador pede também "produtos e serviços". O contrato actual não tem serviços. Ver `20-…` (proposta de entidade `service` ou `highlight` genérico). Não inventar dados.
5. **CTA WhatsApp** final ("Precisa de ajuda?").
6. Animações de entrada ao scroll (`useReveal` / Framer Motion) recriadas com CSS + `IntersectionObserver` numa directiva `qdReveal`, desactivadas com `prefers-reduced-motion`.
7. Cartões de produto: efeito de elevação no hover, selo de desconto em vermelho com percentagem, preço riscado, "Poupas X Kz", como no React. Remover o efeito tilt 3D se ficar pesado, mas manter a elevação.

### 7.1 Destaques (configuração)

Dependem do back-end (`20-…`). Até existir endpoint:

- Registar como lacuna L-09 em `13-decisoes.md`.
- Não ler produtos "por posição" para fingir destaque (já proibido por D-008).
- Implementar a UI contra um serviço `HighlightApiService` com interface estável e estado vazio tratado, para ligar assim que o endpoint existir.

## 8. Itens ainda por concluir (estado honesto)

| Item                                     | Estado                                 | Acção                                                                                                                                                                              |
| ---------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catálogo e cartões                       | Reaproximados da referência React      | Cabeçalho em faixa própria, grelha responsiva 1/2/3/4, cartões 4:3 de altura uniforme, acções com hover/foco e estados de carregamento em transição; validar capturas lado a lado. |
| Botão flutuante WhatsApp                 | Implementado, falta revisão de overlay | Botão e painel acessível com texto/horário, número e mensagem do React; confirmar que fica oculto sobre overlays e comparar capturas.                                              |
| Favoritos                                | Integrado                              | API real para listar, adicionar/remover e adicionar ao carrinho; sem mock.                                                                                                         |
| Carrinho / Checkout / Pagamentos         | Integrado                              | API real para gerir artigos, criar encomenda e registar tentativa de pagamento; detalhe e cancelamento disponíveis.                                                                |
| Footer                                   | Parcialmente alinhado                  | Quatro colunas Loja/Empresas/Apoio/Pagamento, categorias vindas da API e logótipo; falta revisão visual lado a lado.                                                               |
| Página 404                               | Verificar                              | Usar o mesmo estilo (código grande, botão).                                                                                                                                        |
| Página de empresas pública (`/empresas`) | Implementada                           | Página informativa com CTA WhatsApp; sem simular o formulário de orçamento que não tem endpoint. Gestão de membros continua bloqueada pela falta de pesquisa de utilizadores.      |

## 9. Área empresarial (B2B)

No React existe uma página `/empresas` (benefícios, pedido de orçamento) e um checkout empresarial com descontos por volume. O Angular tem agora a página informativa `/empresas` e mantém a gestão autenticada em `/conta/empresas`.

Alvo:

1. Página pública `/empresas` com o hero escuro, grelha de benefícios (orçamentos com NIF, gestor de conta, preços especiais, assistência técnica, suporte WhatsApp, entrega corporativa) e CTA.
2. Formulário "Pedir orçamento": depende de endpoint no back-end (`20-…`). Até lá, mostrar o CTA que abre WhatsApp com mensagem pré-preenchida, sem simular envio.
3. Gestão de empresas na conta: manter `/conta/empresas` e `/conta/empresas/nova`; acrescentar gestão de membros (associar/remover utilizador, alterar cargo) para proprietários, usando os endpoints `/companies/:companyId/users` que já existem. Atenção: associar exige `userId` (UUID); não existe pesquisa de utilizadores. Propor no back-end um endpoint de pesquisa por e-mail para proprietários (ver `20-…`).
4. Badge/destaque "Conta empresarial" nos sítios onde o React o usava (BuyModal, checkout), quando aplicável.
5. Link **Empresas** reintroduzido na navbar segundo D-018.

## 9.1 Perfil da conta

A tela React `src/pages/ProfilePage.jsx` é a referência visual. Reproduzir o painel, a navegação lateral e a iconografia SVG sem copiar os dados fictícios ou operações não suportadas. Manter as rotas Angular actuais e usar uma transição discreta entre secções, respeitando `prefers-reduced-motion`. Os dados pessoais continuam apenas de leitura a partir da sessão; encomendas, favoritos e notificações usam os endpoints próprios documentados em `08`. Não apresentar secções de métodos de pagamento guardados, preferências de notificações ou alteração de palavra-passe enquanto essas operações não existirem.

## 10. Back-office: seguir o estilo do protótipo React

Problema relatado: o Angular "inventou" um estilo em vez de seguir o do protótipo.

Passos obrigatórios:

1. Localizar no repositório React o protótipo do back-office (pesquisar por `admin`, `backoffice`, `dashboard`, `painel`, `tabela`). **Se não existir** nas pastas conhecidas (`src/pages`, `src/components`), **parar e perguntar ao Elizandro o caminho/branch**. Não presumir.
2. Inventariar para o back-office, como foi feito em `migracao/inventario.md`: layout (sidebar/topbar), larguras, cores, tipografia, tabelas, cartões de métricas, formulários, botões, estados vazios, ícones.
3. Aprovar o inventário com o Elizandro antes de reescrever.
4. Reescrever `admin-layout` e as páginas administrativas com esse estilo (tema claro/escuro incluído) apenas se o protótipo existir. **Elizandro confirmou em 2026-11-06 que a UI antiga não tem back-office:** manter as páginas Angular existentes, sem inventar uma referência visual.
5. Acrescentar o módulo de **Utilizadores** (§11).

## 11. Back-office: gestão de utilizadores

Nova secção `/admin/utilizadores` (guard `auth+admin`, render client).

Funcionalidades alvo (todas dependem de endpoints novos, ver `20-…`):

- Lista paginada com pesquisa por nome/e-mail, filtros por `role`, `status`, `accountType`.
- Detalhe: dados, empresas associadas, estado, datas.
- Acções: alterar `status` (activar/desactivar/banir), alterar `role` (com confirmação em cartão, ver `19-…`), terminar sessões.
- Sem edição de palavra-passe por admin nesta fase.

Até haver API: registar L-10 e preparar a rota/UI com estado "indisponível" tratado.

## 12. Checklist de aceitação desta paridade

- [x] D-013, D-014, D-015 decididas e registadas
- [x] Zero classes `text-[Npx]` e sem emojis renderizados na interface (os emojis legados da API são mapeados para SVG)
- [x] Navbar com um único menu de utilizador glass; tema dentro do menu
- [x] Catálogo e cartões aproximados à estrutura React, mantendo a API e os filtros de estado existentes
- [x] Detalhe de produto aproximado à composição React, mantendo dados reais e operações da API; cartão de preço e modal de compra incluídos
- [x] Traduções pt-PT separadas por domínio e agregadas no loader Transloco
- [ ] Logótipo oficial em navbar, footer, favicon e preloader (falta o preloader)
- [ ] Preloader reposto (só no primeiro carregamento)
- [ ] Home com todas as secções do React
- [ ] Botão flutuante WhatsApp e footer revistos em captura lado a lado
- [ ] Página `/empresas` e gestão de membros (página pronta; gestão depende de pesquisa de utilizadores)
- [x] Back-office mantido sem reestilização porque não existe protótipo React (D-017)
- [ ] Capturas lado a lado, claro/escuro, mobile/desktop (incluindo catálogo e detalhe actualizados)
- [ ] `ng build` e `ng test` sem falhas; docs actualizados
