# 17 · Auditoria inicial de acessibilidade

## Âmbito

Foi feita uma revisão estática dos templates e componentes da aplicação, com foco na navegação por teclado, foco visível, estrutura de navegação, mensagens de validação, alternativas textuais e movimento reduzido. Não foi usada uma ferramenta externa nem foram simulados leitores de ecrã.

## Correcções aplicadas

- Ligações para saltar a navegação e chegar ao conteúdo em layouts público, de conta e administrativo.
- Estilo global de foco `:focus-visible` com a cor semântica da marca, válido nos temas claro e escuro.
- Respeito por `prefers-reduced-motion` para reduzir duração de animações e transições e desactivar scroll suave.
- Menus de categoria e utilizador: abertura por setas, foco no primeiro/último item, navegação circular com setas, teclas Home/End, nome acessível associado ao botão de abertura e reposição do foco ao fechar com Escape.
- Menu móvel dentro de um landmark `nav`, com nome acessível variável, estado expandido e reposição do foco ao fechar com Escape.
- `aria-current="page"` nas ligações de navegação activas e grupos nomeados nos filtros do catálogo.
- Mensagens de validação ligadas aos respectivos campos por `aria-describedby` nas moradas, registo de empresa e formulários administrativos revistos.
- Imagens redundantes junto ao título do produto marcadas como decorativas; ícones de categoria duplicados pelo texto também são ocultados das tecnologias de apoio.

## Verificação

- Testes unitários da navegação cobrem abertura de menu por teclado, foco no item inicial e reposição do foco ao fechar o menu móvel com Escape.
- Build Angular/SSR e testes do projecto devem continuar a ser executados após as alterações.
- Revisão estática dos templates para imagens, controlos, landmarks, nomes acessíveis e mensagens de estado.

## Validação ainda necessária

- Percorrer todos os fluxos apenas com teclado em browser real, incluindo zoom/reflow e todos os formulários.
- Validar com leitores de ecrã (por exemplo, NVDA/Firefox e VoiceOver/Safari) e confirmar os anúncios nos menus, erros e estados de carregamento.
- Medir contraste de componentes/estados em páginas completas e conferir a experiência visual nos temas claro e escuro.

Esta auditoria é uma primeira camada de endurecimento, não uma declaração de conformidade WCAG. A validação manual deve ser concluída antes de considerar a auditoria de acessibilidade encerrada.
