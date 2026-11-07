# 19 · Cartões, modais e mensagens de estado

> Complementa `18-paridade-visual-react.md` e `15-estados-de-carregamento.md`.
> Objectivo: toda a informação de sistema (erro, sucesso, vazio, confirmação) segue **um único padrão** visual e de comportamento, com o design system da QD.

## 1. Anatomia obrigatória de qualquer mensagem

Ordem fixa, de cima para baixo:

1. **Ícone** (Font Awesome, ver `18` §6), dentro de um círculo com a cor semântica.
2. **Título** curto (`text-lg font-semibold`).
3. **Texto** explicativo (`text-base text-fg-muted`), uma ou duas frases, a dizer o que aconteceu e o que fazer.
4. **Botões de acção** (um ou dois), só se houver algo a fazer. Acção principal à direita ou em cima no mobile; secundária ("Fechar", "Cancelar") com estilo neutro.

Regras:
- Tamanho mínimo de texto: `text-sm`. Nunca `text-[Npx]`.
- Sem emoji. Sem mensagens genéricas como "Ocorreu um erro." quando existe `ApiError.message` ou contexto melhor.
- Cores semânticas por tipo (tokens existentes): `success`, `danger`, `warning`, `brand` (info).
- Tudo traduzido (Transloco). Mensagens vêm de chaves `feedback.*`, não de strings nos templates.

## 2. Qual formato usar (decisão por situação)

| Situação | Formato | Exemplos |
|---|---|---|
| Falha ao **carregar** conteúdo de uma página/secção | **Estado inline centrado** na própria zona de conteúdo | "Não foi possível carregar os produtos." com botão "Tentar novamente" |
| Zona **vazia** (sem dados) | **Estado inline centrado** | "Ainda não existem produtos." com acção opcional |
| **Falha de uma acção** do utilizador (login, gravar, apagar, registar) | **Modal de feedback** (cartão sobre overlay) com botão Fechar | "Não foi possível iniciar sessão" |
| **Confirmação** antes de acção destrutiva | **Modal de confirmação** (cartão) | Apagar produto, desactivar empresa |
| **Sucesso** de acção rápida e não crítica | **Toast** em cartão, fecha sozinho e manualmente | "Produto guardado." |
| Erro de validação de campo | Mensagem junto ao campo (`aria-describedby`) | NIF inválido |
| Sessão expirada | Toast de erro + redirecção | Já existe |

Regra prática: **erro que bloqueia o utilizador que acabou de agir → modal**; **erro de dados que não carregam → inline centrado**; **sucesso → toast**.

## 3. Componentes a criar em `shared/ui`

Todos standalone, `OnPush`, `.ts` + `.html` separados, sem CSS próprio.

### 3.1 `qd-state-message` (estado inline)
Inputs: `icon`, `tone` (`info|success|warning|danger`), `title`, `message`, e `<ng-content>` para botões. Centrado (`flex flex-col items-center text-center`), `min-h-[40vh]` em páginas, `role="status"` ou `role="alert"` conforme o tom.

### 3.2 `qd-modal` (base)
- Overlay `fixed inset-0` com `bg-black/40 backdrop-blur-sm`; cartão central glass/surface (`rounded-2xl shadow-2xl`, `max-w-md`).
- Acessibilidade obrigatória: `role="dialog"` ou `alertdialog` para confirmações, `aria-modal="true"`, `aria-labelledby`/`aria-describedby`, **focus trap**, foco inicial no botão seguro, **Esc fecha**, clique no overlay fecha (excepto em confirmações destrutivas em curso), devolve o foco ao elemento que abriu, bloqueia scroll do `body`.
- Animação de entrada `scale + fade` 0,25 s; sem animação com `prefers-reduced-motion`.
- Sem biblioteca (CDK proibido): implementar o focus trap à mão.

### 3.3 `qd-confirm-dialog`
Usa `qd-modal`. Inputs: `icon`, `tone`, `title`, `message`, `confirmLabel`, `cancelLabel`, `busy`. Outputs: `confirmed`, `cancelled`. Durante `busy`, ambos os botões ficam desactivados e o confirmar mostra o estado de gravação.

### 3.4 `qd-feedback-dialog`
Usa `qd-modal`. Mostra ícone, título, texto e um ou dois botões. Aberto através de um `FeedbackService` (signal com fila), para que qualquer página peça "mostrar erro" sem importar componentes.

### 3.5 Toast em cartão
Evoluir o `toast-region` actual para a anatomia do §1 (ícone + título opcional + texto + botão de fechar com ícone `xmark` e `aria-label`). Empilhável, 5 s (já existe), `role` e `aria-live` como já testado.

## 4. Substituir os padrões actuais

Os ecrãs de administração e conta usam hoje uma caixa de confirmação **inline abaixo da linha** (`confirmingDeletionId`, `confirmingDeactivationId`, etc.). Substituir por `qd-confirm-dialog` em:

- `admin-categories`, `admin-products`, `admin-product-form` (imagens e especificações), `admin-delivery-types`, `admin-companies`;
- `address-list` (remover morada).

Manter a lógica de estado dos componentes (signals), trocando apenas a apresentação. Os testes existentes que chamam `requestDelete`/`confirmDelete` directamente continuam válidos; acrescentar testes de abertura do diálogo, Esc, foco e botão desactivado durante `busy`.

Erros de acção hoje mostrados em caixa vermelha no topo do formulário (`formError`) passam a **modal de feedback**, mantendo a mensagem junto aos campos apenas para validação.

Erros de carregamento hoje feitos com `<p role="alert">` passam a `qd-state-message` (home, catálogo, produto, listas de admin, empresas, moradas, dashboard).

## 5. Ecrã de login e registo = cartão

- Login e registo ficam num **cartão** centrado (glass sobre fundo da marca), com logótipo no topo, título, campos, botão principal e link secundário.
- O estilo final do cartão será fornecido pelo Elizandro. **Não inventar**: construir a estrutura com `qd-card` neutro (superfície, `rounded-2xl`, sombra) e deixar os tokens do cartão numa única classe/componente para trocar depois com uma alteração.
- Criar `shared/ui/card.component` (`qd-card`) com variantes `default`, `glass`, `interactive`. Todos os cartões novos usam este componente.
- Erros de login: modal de feedback com título "Não foi possível iniciar sessão", texto vindo da API e botão "Fechar" (e "Criar conta" quando fizer sentido).

## 6. Texto das mensagens (pt-PT, tom da marca)

Criar o grupo `feedback` em `pt.json`, por exemplo:

```json
"feedback": {
  "loadError": { "title": "Não foi possível carregar", "message": "Verifica a ligação e tenta novamente.", "retry": "Tentar novamente" },
  "empty": { "products": { "title": "Ainda não há produtos", "message": "Volta em breve para ver as novidades." } },
  "actionError": { "title": "Não foi possível concluir a acção", "close": "Fechar" },
  "confirm": { "cancel": "Cancelar" }
}
```

Regras de redacção: dizer o que aconteceu, depois o que fazer; sem culpar o utilizador; sem termos técnicos (`HTTP 500`, `ApiError`); usar o `message` da API só quando for compreensível e em pt-PT.

## 7. Carregamento

Os indicadores seguem `15-estados-de-carregamento.md`. Nota de coordenação: o estado de carregamento de **dados** usa skeleton/barra/spinner; o **preloader inicial** é o do `18` §5. Não misturar os dois.

## 8. Checklist de aceitação

- [ ] `qd-card`, `qd-state-message`, `qd-modal`, `qd-confirm-dialog`, `qd-feedback-dialog` criados e testados
- [ ] Focus trap, Esc, foco devolvido, scroll bloqueado
- [ ] Nenhuma confirmação inline restante
- [ ] Erros de acção em modal; erros de carregamento e vazios centrados
- [ ] Toasts na anatomia ícone, título, texto, fechar
- [ ] Login e registo em cartão
- [ ] Todos os textos em `pt.json`; nenhum tamanho abaixo de `text-sm` em texto funcional
- [ ] Claro e escuro verificados; `prefers-reduced-motion` respeitado
