# 11 · Migração do front-end React (clone visual)

## Fonte
- **Caminho/repositório do front antigo:** `../../../qd_store` (caminho absoluto nesta máquina: `/home/elyqueta/Documentos/projectos/qd/qd_store`; repositório `qd_store`, deploy `qd-store-one.vercel.app`).
- O front antigo **continua a existir** e é só leitura. Não o alterar.
- Inventário inicial: [docs/migracao/inventario.md](./migracao/inventario.md). As decisões por tela permanecem pendentes de validação pelo Elizandro.

## Princípio
O layout está **aprovado**; a tecnologia é que não era adequada. Replicar o resultado visual, **não** os idiomas do React (estado, hooks, estrutura de ficheiros).

## Processo (ordem obrigatória)
1. **Inventário** → criar `docs/migracao/inventario.md` com, para cada rota/tela do React:
   - nome, rota, componentes usados, dados que consome (ficheiros estáticos ou API), estados (loading/vazio/erro), responsividade, interações;
   - abordagem de estilos usada (CSS puro, módulos, inline…) e **tokens** reais: cores, tipografia, raios, sombras, espaçamentos;
   - assets (logo, imagens, ícones) e textos (para as chaves i18n).
2. **Aprovação** do inventário pelo Elizandro (marcar cada tela: *migrar v1 / adiar / descartar*).
3. **Mapeamento** React → Angular: tela → `feature/page`; componente → `shared/ui` ou componente de feature; dados estáticos → endpoint da API (`08`) ou "sem back-end" (adiar).
4. **Tokens** → preencher a tabela em `03`.
5. **Construção** por fases (`12`), uma tela por vez, com **captura lado a lado** (antigo vs novo, claro e escuro quando aplicável).
6. **Textos** → extraídos para `pt.json`, sem hardcode.

## Regras
- Não copiar código React; reescrever em Angular idiomático.
- Dados estáticos do antigo (`data files`) só servem de referência de conteúdo; a fonte de verdade passa a ser a API.
- Telas do antigo que dependam de funcionalidades **sem back-end** (carrinho, checkout, wishlist…) ficam registadas como "adiadas", sem implementar.
- Qualquer divergência visual intencional (tema escuro, menu do utilizador) é listada e aprovada.

## Estado do inventário
| Tela | Rota antiga | Rota nova | Back-end disponível | Decisão |
|---|---|---|---|---|
| Início | `/` | `/` | Produtos e categorias | Migrar v1; hero editorial neutro e produtos da API |
| Catálogo | `/catalogo` | `/produtos` | Produtos e categorias | Migrar v1; paginação e filtros reais |
| Detalhe de produto | `/produto/:id` | `/produtos/:id` | Produto, imagens e especificações | Migrar v1; sem compra/wishlist |
| Perfil | `/perfil` | `/conta/perfil` | Dados da sessão; sem `GET /me`/edição | Migrar apenas o que a API suporta |
| Empresas / pedido de orçamento | `/empresas` | — (gestão de empresas é feature distinta em `/conta/empresas`) | Gestão autenticada; sem endpoint de orçamento; L-05 limita listagem própria | Adiar o formulário público; tratar gestão de empresas na Fase 3 |
| Checkout pessoal | `/checkout/dados`, `/checkout/*` | — | Sem endpoints de carrinho, encomendas e pagamentos | Adiar |
| Checkout empresarial | `/checkout/empresa` | — | Sem endpoints de encomendas e pagamentos | Adiar |
| Não encontrada | `*` | `**` (fallback Angular) | Não aplicável | Migrar v1 |

As rotas React antigas não serão mantidas como aliases. Os links internos serão actualizados para os caminhos canónicos acima e em `docs/07-rotas-e-perfis.md` (D-009).
