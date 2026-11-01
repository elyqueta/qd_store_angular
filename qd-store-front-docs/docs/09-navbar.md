# 09 · Navbar e menu do utilizador

## Processo (obrigatório)
1. O agente **avalia a navbar do front antigo** (código real) e produz um inventário: links, ordem, estilos, comportamento mobile, estados ativo/hover, logotipo, elementos extra.
2. Apresenta ao Elizandro; ele indica o que implementar agora.
3. Só então se constrói. **Os links existentes mantêm exatamente o estilo antigo.**

## O que muda
Apenas a área do utilizador:
- **Visitante:** links/botões "Entrar" e "Criar conta" (estilo antigo).
- **Autenticado:** **ícone principal** (avatar/iniciais) que abre um **dropdown** com:
  - Perfil
  - Moradas
  - Empresas
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
