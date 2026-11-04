# 09 · Navbar e menu do utilizador

## Processo (obrigatório)

1. O agente **avalia a navbar do front antigo** (código real) e produz um inventário: links, ordem, estilos, comportamento mobile, estados ativo/hover, logotipo, elementos extra.
2. Apresenta ao Elizandro; ele indica o que implementar agora.
3. Só então se constrói. **Os links existentes mantêm exatamente o estilo antigo.**

## Selecção aprovada para v1 (2026-11-01)

- Manter links de categorias, mega-menus, pesquisa e estilo visual antigo; categorias e produtos dos menus são carregados da API.
- Visitante: "Entrar" e "Criar conta".
- Utilizador autenticado: dropdown descrito nesta documentação.
- Remover o carrinho e o atalho público para Empresas, por não corresponderem a funcionalidades/rotas públicas da v1.
- Registado como D-010 em `docs/13-decisoes.md`.

## O que muda

Apenas a área do utilizador:

- **Visitante:** links/botões "Entrar" e "Criar conta" (estilo antigo).
- **Autenticado:** **ícone principal** (avatar/iniciais) que abre um **dropdown** com:
  - Perfil
  - Moradas
  - Empresas (quando as rotas estiverem implementadas)
  - Painel de administração (só `admin`)
  - Alternar tema (claro/escuro/sistema)
  - Idioma (escondido até existir `en`)
  - Sair

## Implementação

- Itens definidos em config tipada (`NAV_ITEMS`, `USER_MENU_ITEMS`) com `labelKey` (i18n), `route`, `roles?`, `featureFlag?`. Novas features adicionam uma entrada, sem mexer no componente.
- Só aparecem itens cujas rotas já existem (nada de links mortos).
- Dropdown próprio em `shared/ui` (sem CDK): abre com clique/Enter/Espaço, fecha com Esc e clique fora, setas ↑↓ navegam, `aria-haspopup="menu"`, `aria-expanded`, devolve o foco ao botão.
- Mobile: menu colapsável com o mesmo conteúdo.
- Sem item ativo duplicado; `routerLinkActive` com estilo do front antigo.

Na implementação pública inicial, as categorias e as sugestões do menu são consultadas em `GET /api/v1/categories` e `GET /api/v1/products`; o resultado de categorias fica em cache durante a sessão. O menu abre por clique/teclado e fecha com Escape ou clique fora. As entradas de conta só são mostradas quando a respectiva rota está implementada.

O perfil está disponível em `/conta/perfil` e a gestão de moradas em `/conta/moradas`, para utilizadores autenticados, no menu desktop e na navegação mobile. O perfil mostra apenas os dados da sessão; empresas permanecem ocultas até as respectivas rotas estarem implementadas.
