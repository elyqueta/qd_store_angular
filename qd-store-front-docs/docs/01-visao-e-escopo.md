# 01 · Visão e âmbito

## Objetivo
Substituir o front-end React/JS por uma aplicação **Angular + Tailwind CSS** limpa, escalável e preparada para crescer (novas features, novos idiomas), com o layout antigo como referência visual aprovada.

## Princípios
- **Paridade visual primeiro**, depois melhorias (tema escuro, menu do utilizador).
- **Sintonia com o back-end:** o front só implementa o que a API já oferece.
- **Infraestrutura antes de features:** i18n, tema, auth, erros e layouts prontos antes das páginas.
- **Sem dependências desnecessárias.**

## Dentro do âmbito (v1)
| Área | Funcionalidades |
|---|---|
| Autenticação | Criar conta (pessoal), login, refresh transparente, logout |
| Público | Home, catálogo paginado com filtros, detalhe de produto (imagens e especificações), tipos de entrega (consulta) |
| Conta (autenticado) | Perfil (dados da sessão), moradas (CRUD + padrão, com províncias/municípios de Angola), empresas e utilizadores associados |
| Back office (admin) | Categorias, produtos (+ imagens + especificações), tipos de entrega, empresas (listagem com utilizadores) |
| Transversal | Tema claro/escuro, i18n (pt agora), SEO/SSR nas páginas públicas, tratamento global de erros, rate limit (429) |

## Fora de âmbito (até o back-end implementar)
Carrinho, encomendas, pagamentos (Multicaixa/transferência), wishlist, notificações, conta empresarial no registo, edição do perfil do utilizador. A estrutura de pastas deve permitir adicioná-los como novas `features/` sem refatorar.

## Níveis de utilizador (resumo; detalhe em `07`)
Visitante · Cliente (`customer`) · Administrador (`admin`) · Proprietário de empresa · Membro de empresa.
