# Regra de Deploy — deploy-webapp

Documento de referência técnica sobre como o `deploy-webapp` migra esteiras (workflows) do
ambiente **QA** para o ambiente **PROD** no WebApp. Complementa o [README.md](README.md)
(que cobre instalação/uso) detalhando a **lógica de negócio** aplicada em cada entidade.

## 1. Entrada do processo

O que é migrado não vem mais de um CSV separado. A lista de workflows a processar é o campo
`workflows` dentro de `src/utils/updateWorkflow.json`:

```json
{
  "flow_form_id": "id do form de produção",
  "protocol_provider": "identificador do provedor de protocolo (se tiver)",
  "pendency_custom_filters": "função stringificada (se tiver)",
  "updateWorkflowProtocolFunction": "função stringificada (se tiver)",
  "workflows": [
    "d7f6bdab-b613-479c-bff2-060c69bb0cbe",
    "5f141142-df84-42af-bf1d-452eb4d0a1f0"
  ]
}
```

`src/0.1_migrator.ts` lê esse arquivo, transforma `workflows` em `WorkflowsIds[]` (`{ id }`) e
executa a migração **sequencialmente**, um workflow por vez (`for...of` com `await`), nunca em
paralelo — isso é proposital, para preservar a ordem de criação de dependências (grupo antes do
workflow, form pai antes dos filhos, etc.) e para que o guard de idempotência baseado em arquivo
(seção 5) funcione corretamente.

> O antigo `src/utils/ids.csv` não é mais lido pelo código. Os IDs devem ser mantidos apenas em
> `updateWorkflow.json`.

## 2. Padrão geral de sincronização

Toda entidade migrada segue o mesmo padrão de 3 passos:

```
GET QA  →  GET PROD (testando existência)  →  UPDATE (PUT) se existir em PROD, senão CREATE (POST)
```

- **GET QA** (`getQA`): busca o dado de origem, remove campos irrelevantes/computados
  (`created_at`, `updated_at`, `deleted_at`, relações aninhadas como `workflow`,
  `workflow_group`, `workflow_form`, `format_payload_function`, etc.) e substitui strings de QA
  por PROD (`replacementRules`, ver seção 4). Erros são **engolidos**: em falha, loga e retorna
  `null` — código chamador precisa tratar esse caso.
- **GET PROD** (`getPROD`): usado só para checar existência. Um 404 (`isNotFoundError`) vira
  "não existe em PROD"; qualquer outro erro é relançado e interrompe o processamento daquele
  workflow (capturado no `try/catch` de `execute()` em `0.1_migrator.ts`, que loga e segue para
  o próximo workflow da lista).
- **CREATE / UPDATE** (`createPROD` / `updatePROD`): montam o payload específico por `type`
  (sanitizadores em `src/utils/data-processing.ts`) e fazem POST/PUT no ambiente PROD.

Sempre que uma entidade tem filhas, a ordem é **pai antes dos filhos**.

## 3. Ordem de execução por workflow

Para cada `id` da lista `workflows`:

1. **Publish Workflow QA** — `POST techforms/workflow/${id}/publish` (garante snapshot
   atualizado antes de ler).
2. **GET Workflow QA** — se não encontrado, loga e **pula esse workflow** (não interrompe os
   demais).
3. **`Workflow(...)`** — sincroniza `workflow` (e, se aplicável, `workflow_group` +
   `workflow_group_item`s), ver seção 3.1.
4. **`HomeSettings(...)`** — uma única vez por `client_service_id` (deduplicado com um `Set` em
   memória durante a execução), ver seção 3.5.
5. **`WorkflowSteps(...)`** — sincroniza cada `workflow_step` e, dentro dele, cada
   `workflow_step_form`, ver seção 3.2/3.3.
6. **Forms filhos do snapshot** — `collectChildFormIdsFromWorkflow` varre recursivamente
   `workflow_steps[].workflow_step_forms[].workflow_form.workflow_children_forms` e chama
   `WorkflowForms` para cada form filho encontrado (garante que forms aninhados fora do fluxo de
   step-forms também sejam migrados).
7. **`ClientFunction(...)`** — sincroniza a função de protocolo do workflow
   (`update_workflow_protocol_function_id`), ver seção 3.4.
8. **`WorkflowFormGroups(...)`** — sincroniza `workflow_form_groups` do workflow.
9. **Publish Workflow PROD** — `POST .../${id}/publish` no ambiente PROD, publicando a esteira
   migrada.

Qualquer erro não-404 em qualquer etapa é capturado no nível de `execute(info)`: loga
`Error to process ID ${info.id}: ...` e segue para o próximo workflow — um workflow com erro
**não** interrompe o lote inteiro.

### 3.1 Workflow / Workflow Group / Workflow Group Item

- Se `workflow.workflow_group_id` existir, a decisão de create/update do **workflow** é
  delegada ao processamento do **grupo**:
  - Se o grupo **já existe** em PROD → apenas `updatePROD` do grupo (o workflow em si é tratado
    fora, no fluxo normal de `Workflow`).
  - Se o grupo **não existe** em PROD → `createPROD` do grupo **e então** create/update do
    workflow (grupo sempre antes do workflow).
- Se não houver `workflow_group_id`, o workflow é persistido diretamente
  (`updatePROD`/`createPROD` conforme exista ou não em PROD).
- Depois do workflow, cada item de `workflow.workflow_group_item` é sincronizado
  (`WorkflowGroupItem`): garante que o grupo exista em PROD antes de criar/atualizar o item, e
  preenche `workflow_group_id` no item quando ausente.

### 3.2 Workflow Steps

Para cada `workflow_step` do workflow: GET QA → checa PROD → update/create. Em seguida, para
cada `workflow_step_form` referenciado pelo step, delega para **Workflow Step Forms**.

### 3.3 Workflow Step Forms / Workflow Forms

- Antes de sincronizar o próprio `workflow_step_form`, os **forms associados são resolvidos
  primeiro** (pai antes do vínculo): `workflow_form_id` sempre, e `workflow_form_reference_id`
  também — mas só se for **diferente** de `workflow_form_id` (evita reprocessar o mesmo form
  duas vezes).
- `WorkflowForms` é recursivo: sincroniza o form, depois descobre filhos por duas vias
  combinadas — filhos embutidos no próprio payload (`workflow_children_forms`) e uma listagem
  explícita na QA por `workflow_form_father_id = parentId` — unindo os IDs num `Set` (removendo
  o próprio `parentId`, para não reprocessar o nó atual) e chamando `WorkflowForms`
  recursivamente para cada filho.
- Sanitização aplicada no create em PROD: `placeholder`/`title` vazios → `"   "` (3 espaços);
  `required` nulo → `false`; `index` nulo → `1`; `length` não-numérico/nulo → `0`.

### 3.4 Client Function

Sincroniza `client/${client}/client-function/${function_id}` (rota com `clientIdQA`/
`clientIdPROD` conforme o ambiente). Chamado tanto pelo workflow principal
(`update_workflow_protocol_function_id`) quanto por Home Settings, quando aplicável.

### 3.5 Home Settings

Executado **uma vez por `client_service_id`** por rodada de migração (não uma vez por
workflow). Lista os home-settings da QA daquele serviço; se vazio, loga e não faz nada. Para
cada home: sincroniza `ClientFunction` associada (`client_function_id` e, se existir,
`optional_config.on_load_client_function_id`) antes do home em si. Regra especial: se o home já
existe em PROD e o `name`/`description` vindos da QA estiverem vazios, usa o valor **já
existente em PROD** em vez de sobrescrever com string vazia.

### 3.6 Workflow Form Groups

Sincroniza cada `workflow_form_group` do workflow; se o grupo referenciar um
`workflow_form_id`, sincroniza também aquele form via `WorkflowForms`.

## 4. Substituição QA → PROD (`constants.ts` / `data-processing.ts`)

Toda leitura da QA passa por `replacementRules`, que troca (nessa ordem):

| De (QA) | Para (PROD) |
|---|---|
| `URL_QA` | `URL_PROD` |
| `CLIENT_ID_QA` | `CLIENT_ID_PROD` |
| `configEnv["qa"]` | `configEnv["prod"]` |
| `let mock = true` | `let mock = false` |
| `env = 'hml'` | `env = 'prod'` |

Essas trocas ocorrem em qualquer string presente na resposta da QA (inclusive dentro de
funções stringificadas), de forma recursiva em objetos/arrays. Para adicionar novas
substituições, editar `replacementRules` em `src/utils/constants.ts`.

Além disso, `mapClientServiceIdToProd` faz um mapeamento fixo de um `client_service_id`
específico de QA para o equivalente em PROD (usado em `home_settings` e
`workflow-group-item`).

## 5. Configurações injetadas via `updateWorkflow.json`

Usadas **apenas** no `type === "workflow"` dentro de `createPROD`/`updatePROD`
(`prod-client.ts`), sempre com prioridade sobre o valor vindo da QA (`jsonData.campo ||
data.campo`):

- `flow_form_id` — aplicado tanto no create quanto no update.
- `pendency_custom_filters` — aplicado no create.
- `protocol_provider` — aplicado no update.

Não há uso desse arquivo fora da entidade `workflow`.

## 6. Idempotência dentro de uma execução

- `history_created.txt` / `history_updated.txt` (limpos no início de cada execução, em
  `runMigration`) registram cada `${type}: ${id}` criado/atualizado.
- `createPROD` sempre grava em `history_created.txt` após um POST bem-sucedido —
  **não há guarda** que impeça recriação se chamado duas vezes na mesma execução (a proteção
  contra duplicidade vem do fluxo de GET PROD antes de decidir create/update).
- `updatePROD` **verifica antes de executar**: se `checkIdUpdated(id, type)` já for verdadeiro
  (aquele par tipo+id já foi atualizado nesta run), o PUT é **pulado silenciosamente** — evita
  updates repetidos do mesmo recurso quando ele é referenciado por múltiplos caminhos (ex.: um
  form compartilhado entre vários steps).
- Em `updatePROD`, se o PUT falhar com 404, há um fallback automático que chama `createPROD`
  antes de relançar o erro original.

## 7. Publicação

`publishWorkflowQA` e `publishWorkflowPROD` fazem `POST .../workflow/${id}/publish` com o corpo
`{ commentary: "Publicação de esteira" }` no respectivo ambiente. QA é publicado **antes** de
qualquer leitura (garante snapshot atualizado), PROD é publicado **por último**, depois de toda
a árvore (workflow, steps, forms, client-function, form-groups) ter sido criada/atualizada.

## 8. Tratamento de erros — resumo

- 404 em `getPROD` → tratado como "não existe" (segue para create), nunca é um erro fatal.
- Qualquer outro erro em `getPROD`/`createPROD`/`updatePROD`/publish → relançado.
- Erro relançado durante o processamento de um workflow é capturado em `execute()`
  (`0.1_migrator.ts`): loga o erro e o processo **continua para o próximo workflow da lista**,
  sem abortar o lote inteiro.
- `getQA` nunca lança: em erro, loga e retorna `null`; funções chamadoras (ex.: `WorkflowForms`)
  tratam esse `null` retornando cedo, sem processar aquele nó.
