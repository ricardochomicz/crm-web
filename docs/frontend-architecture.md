# Arquitetura do frontend CRM

## Responsabilidades por camada

- **views/**: composição de componentes, bindings e eventos. Não devem fazer requisições HTTP, tratar erros de infraestrutura ou implementar regras de negócio.
- **components/**: apresentação e interação local. Componentes compartilhados em `src/components/ui`; específicos de domínio dentro da feature.
- **composables/**: estado reativo, filtros, paginação, ciclo de vida, carregamento, comandos, permissões derivadas e integração com a rota.
- **api.ts**: chamadas HTTP e contratos de transporte; sem notificações visuais ou regras de apresentação.
- **utils/**: funções puras (datas, moeda, status, transformação), sem estado Vue e sem efeitos colaterais.
- **types.ts**: contratos do domínio. Não duplicar interfaces em Views.

## Padrões obrigatórios

1. Seleções: usar `SearchSelect` compartilhado; não usar `<select>` nativo em telas novas ou refatoradas.
2. Listagens: `ListFilters`, `ListTable`, `PagePagination` e estados explícitos de carregamento, erro e vazio.
3. Modais: `AppDialog` e componentes específicos; não implementar modais diretamente nas Views.
4. Dados remotos: controlar respostas obsoletas ao trocar filtros/empresa e limpar assinaturas no desmontar.
5. Multitenancy: toda chamada deve receber tenant ID do contexto ativo; autorização efetiva permanece no backend.
6. Permissões: composables podem derivar capacidades para exibição, mas não substituem validações no servidor.
7. Alterações: eventos de invalidação publicados uma única vez após sucesso da operação, preferencialmente na camada de API.
8. Formatação: funções puras centralizadas por domínio ou em utilitários compartilhados quando houver reutilização real.
9. Não criar abstrações genéricas antes de identificar pelo menos dois consumidores com o mesmo contrato.
10. Refatorar incrementalmente, preservando comportamento, contratos de API e testes de regressão.

## Backlog de refatoração

### Prioridade alta
- `activities/views/ActivitiesView.vue`: extrair `useActivitiesPage` (filtros, paginação, overview, comandos) e `useActivityPermissions`; separar os cards de indicadores.
- `calendar/views/CalendarView.vue`: extrair `useCalendarPage` (intervalos, carregamento, navegação, seleção e assinaturas); separar grade mensal e lista do dia.
- `opportunities/views/OpportunitiesView.vue`: extrair agendamento para composable e diálogo próprio; reduzir responsabilidades de `useOpportunitiesPage` se estiver agregando domínios independentes.

### Prioridade média
- `orders/views/OrdersView.vue`: extrair formatação e regras de movimentação para utilitários/composable; manter View somente como composição.
- `productivity/components/ProductivityDashboard.vue`: extrair métricas/atingimento e editor para componentes focados; centralizar regras de cálculo e evitar comparações entre períodos incompatíveis.
- Revisar componentes de formulário em todas as features para substituir selects nativos por `SearchSelect` sem quebrar v-model, validação ou acessibilidade.

## Critérios de aceite por tela

- View sem `api.*`, `request`, `mutate` ou chamadas de infraestrutura.
- Sem regras de domínio complexas ou formatadores repetidos na View.
- Estados loading/error/empty e concorrência entre requisições cobertos.
- Filtros aplicados separados dos filtros em edição.
- Permissões e isolamento por tenant verificados.
- Build TypeScript/Vite, lint e testes relevantes executados antes de concluir a etapa.
