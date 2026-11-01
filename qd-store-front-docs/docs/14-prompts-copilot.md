# 14 · Prompts prontos para o Copilot

## Arranque (colar uma vez por sessão)
```
Lê AGENTS.md e docs/ por completo. Responde em pt-PT.
Não escrevas código ainda. Primeiro: (1) confirma que percebeste as regras;
(2) pergunta-me o caminho do front-end antigo React (docs/11);
(3) lista as perguntas em aberto de docs/13 como escolhas múltiplas.
```

## Inventário do front antigo
```
Com o front antigo em <CAMINHO>, executa o passo 1 de docs/11: cria
docs/migracao/inventario.md com todas as rotas/telas, componentes, dados,
tokens de design (cores, fontes, raios, sombras), assets e textos.
Avalia também a navbar (docs/09). Não alteres o front antigo. Não escrevas código Angular.
```

## Fase 0 (plano primeiro)
```
Segue docs/12 Fase 0. Apresenta o plano de implementação (ficheiros, ordem,
riscos) e espera a minha aprovação. Depois implementa UM item de cada vez,
com ficheiros completos e relatório pt-PT (o quê, porquê, como, alternativas).
```

## Tarefa genérica
```
Tarefa: <descrição>. Consulta os docs relevantes. Entrega: plano → aprovação →
implementação (ficheiros completos) → verificação (build, tema claro/escuro,
mobile) → atualização dos docs.
```

## Nova feature futura (ex.: carrinho)
```
O back-end passou a expor <endpoints>. Atualiza docs/08, cria features/cart
com o esqueleto padrão (pages, components, data-access, models, routes),
chaves i18n, item em NAV_ITEMS e lazy route. Plano primeiro.
```
