# Deploy WebApp - Guia Passo a Passo

Este projeto automatiza o processo de migração de workflows do ambiente QA para PROD no WebApp.

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Configuração](#configuração)
3. [Estrutura de Arquivos](#estrutura-de-arquivos)
4. [Como Executar](#como-executar)
5. [Empacotamento](#empacotamento)
6. [Fluxo do Processo](#fluxo-do-processo)
7. [Sequência de Operações](#sequência-de-operações)
8. [Troubleshooting](#troubleshooting)

## 🔧 Pré-requisitos

- Node.js instalado
- Yarn ou npm instalado
- Acesso aos ambientes QA e PROD
- Credenciais de autenticação para ambos os ambientes

## ⚙️ Configuração

### 1. Instalar Dependências

```bash
yarn install
# ou
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Configurações Gerais
CLIENT=seu_client_id
SERVICE_KEY=sua_service_key

# Ambiente QA
CLIENT_ID_QA=client_id_qa
EMAIL_LOGIN_QA=email@qa.com
PASSWORD_LOGIN_QA=senha_qa
URL_QA=https://url-qa.com

# Ambiente PROD
CLIENT_ID_PROD=client_id_prod
EMAIL_LOGIN_PROD=email@prod.com
PASSWORD_LOGIN_PROD=senha_prod
URL_PROD=https://url-prod.com
```

### 3. Preparar Arquivos de Configuração

#### `src/utils/ids.csv`

Arquivo CSV com os IDs dos workflows a serem migrados. Formato:

```csv
workflow_id
d8e1d640-f734-4051-b296-1938cbf47e86
outro-workflow-id
```

#### `src/utils/updateWorkflow.json`

Arquivo JSON com configurações de atualização do workflow. Exemplo:

```json
{
  "flow_form_id": "id do form de produção",
  "pendency_custom_filters": "função stringficada (se tiver)", // DICA: coloque os ids de QA e de PROD junto, feito isso nao tera problemas em deploys futuros
  "updateWorkflowProtocolFunction": "função stringficada (se tiver)" // DICA: coloque os ids de QA e de PROD junto, feito isso nao tera problemas em deploys futuros
}
```

## 📁 Estrutura de Arquivos

```
deployWebApp/
├── src/
│   ├── 0_index.ts                 # Ponto de entrada
│   ├── 0.1_migrator.ts            # Lógica principal de migração
│   ├── apis/
│   │   ├── qa-client.ts          # Cliente API QA
│   │   └── prod-client.ts        # Cliente API PROD
│   ├── functions/
│   │   ├── 1_workflow.ts         # Processamento de workflows
│   │   ├── 1.1_workflow_group.ts # Processamento de grupos
│   │   ├── 1.2_workflow_group_item.ts
│   │   ├── 2_workflow_step.ts    # Processamento de steps
│   │   ├── 2.1_workflow_step_forms.ts
│   │   ├── 2.1.1_workflow_forms.ts
│   │   ├── 3_client_function.ts
│   │   └── 4_workflow_form_groups.ts
│   └── utils/
│       ├── constants.ts          # Constantes e configurações
│       ├── data-processing.ts   # Processamento de dados
│       ├── ids.csv              # IDs dos workflows
│       ├── updateWorkflow.json  # Configurações de atualização
│       ├── history_created.txt  # Histórico de criados
│       └── history_updated.txt  # Histórico de atualizados
└── package.json
```

## 🚀 Como Executar

### Executar Migração

```bash
yarn start
# ou
npm start
```

O script irá:
1. Limpar os históricos anteriores
2. Fazer login nos ambientes QA e PROD
3. Processar cada workflow do arquivo `ids.csv`
4. Exibir logs de progresso
5. Salvar histórico de operações

## 🔄 Fluxo do Processo

### Visão Geral

O processo segue esta sequência para cada workflow:

1. **Publicar Workflow em QA**
2. **Obter Workflow de QA**
3. **Processar Workflow** (CREATE ou UPDATE em PROD)
4. **Processar Workflow Steps**
5. **Processar Client Functions**
6. **Processar Workflow Form Groups**
7. **Publicar Workflow em PROD**

### Sequência Detalhada

#### 1. Workflow Principal

```
GET QA → GET PROD → CREATE/UPDATE PROD
```

- Se existe em PROD: **UPDATE**
- Se não existe em PROD: **CREATE**

#### 2. Workflow Group

```
GET QA → GET PROD → CREATE/UPDATE PROD
```

#### 3. Workflow Group Items

```
Para cada item:
  GET QA → GET PROD → CREATE/UPDATE PROD
```

#### 4. Workflow Steps

```
Para cada step:
  GET QA → GET PROD → CREATE/UPDATE PROD
  
  Para cada workflow-step-form:
    GET QA (workflow-form) → GET PROD (workflow-form) → CREATE/UPDATE PROD (workflow-form)
    GET QA (workflow-step-form) → GET PROD (workflow-step-form) → CREATE/UPDATE PROD (workflow-step-form)
```

#### 5. Workflow Forms

**IMPORTANTE:** Sempre segue a sequência:

```
GET QA → GET PROD → CREATE/UPDATE PROD
```

A função `WorkflowForms` garante que:
- Sempre faz GET em QA primeiro
- Depois faz GET em PROD para verificar existência
- Finalmente faz CREATE ou UPDATE conforme necessário

#### 6. Workflow Form Groups

```
GET QA → GET PROD → CREATE/UPDATE PROD

Para cada workflow-form dentro do grupo:
  GET QA → GET PROD → CREATE/UPDATE PROD
```

## 📊 Sequência de Operações

### Ordem de Execução para Cada Workflow

```
1. Login QA ✅
2. Login PROD ✅
3. Publish Workflow QA ✅
4. Get Workflow QA ✅
5. Get Workflow PROD ✅
6. Create/Update Workflow PROD ✅
7. Get Workflow Group QA ✅
8. Get Workflow Group PROD ✅
9. Create/Update Workflow Group PROD ✅
10. Para cada Workflow Group Item:
    - Get QA → Get PROD → Create/Update PROD ✅
11. Para cada Workflow Step:
    - Get QA → Get PROD → Create/Update PROD ✅
    - Para cada Workflow Step Form:
      - Get Workflow Form QA ✅
      - Get Workflow Form PROD ✅
      - Create/Update Workflow Form PROD ✅
      - Get Workflow Step Form QA ✅
      - Get Workflow Step Form PROD ✅
      - Create/Update Workflow Step Form PROD ✅
12. Process Client Function ✅
13. Para cada Workflow Form Group:
    - Get QA → Get PROD → Create/Update PROD ✅
    - Para cada Workflow Form:
      - Get QA → Get PROD → Create/Update PROD ✅
14. Publish Workflow PROD ✅
```

## 🔍 Regras de Negócio

### Sanitização de Dados

O sistema sanitiza automaticamente os dados de `workflow-form`:

- **placeholder**: Se vazio/null → `"   "` (3 espaços)
- **required**: Se null/undefined → `false`
- **index**: Se null/undefined → `1`
- **title**: Se vazio/null → `"   "` (3 espaços)
- **length**: Se null/undefined ou não é número → `0`

### Substituição de Strings

O sistema substitui automaticamente:

- URLs de QA → URLs de PROD
- Client IDs de QA → Client IDs de PROD
- Configurações de ambiente
- Flags de mock

#### Como Adicionar Mais Strings para Mapeamento

Para adicionar novas regras de substituição de strings, edite o arquivo `src/utils/constants.ts` e adicione novos objetos ao array `replacementRules`:

**Exemplo prático:**
Se você precisa substituir um ID específico ou uma URL customizada:

```typescript
// No arquivo constants.ts
export const CUSTOM_ID_QA = "id-qa-123"; // string como esta em qa
export const CUSTOM_ID_PROD = "id-prod-456"; // string como vai ficar em prod

export const replacementRules = [
  // ... regras existentes ...
  { from: CUSTOM_ID_QA, to: CUSTOM_ID_PROD },
];
```

**Importante:**
- As substituições são feitas recursivamente em todos os objetos e arrays
- A ordem das regras importa: as substituições são aplicadas sequencialmente
- Use strings exatas que correspondem ao que você quer substituir

### Histórico

- `history_created.txt`: Registra todos os recursos criados
- `history_updated.txt`: Registra todos os recursos atualizados

## ⚠️ Troubleshooting

### Erro: "WorkflowForm is not found"

**Causa:** Tentativa de UPDATE sem verificar existência em PROD.

**Solução:** O sistema já foi corrigido para sempre fazer GET em PROD antes de UPDATE. Se ainda ocorrer, verifique:
- A função `WorkflowForms` está sendo chamada corretamente
- O GET em PROD está sendo executado antes do UPDATE

### Erro: "Variáveis de ambiente não definidas"

**Solução:** Verifique se o arquivo `.env` existe e contém todas as variáveis necessárias.

### Erro: "Workflow X not found in QA"

**Causa:** O workflow não existe no ambiente QA.

**Solução:** Verifique se o ID do workflow está correto no arquivo `ids.csv`.

### CREATE executado após "DEPLOYMENT COMPLETED!"

**Causa:** Promise não aguardada corretamente.

**Solução:** Já corrigido. O sistema agora usa `await` em todas as operações assíncronas.

### Erro de validação: "length must be a number"

**Causa:** Campo `length` não está sendo sanitizado.

**Solução:** Já corrigido. O sistema agora sanitiza o campo `length` automaticamente.

## 📝 Logs

O sistema exibe logs coloridos:

- 🟢 **Verde**: Sucesso
- 🔴 **Vermelho**: Erro
- 🟡 **Amarelo**: Aviso/Info
- 🔵 **Azul**: Informação

## 🔐 Segurança

- **NUNCA** commite o arquivo `.env` no repositório
- Mantenha as credenciais seguras
- Use variáveis de ambiente em produção
- Revise os logs antes de executar em produção

## 📞 Suporte

Em caso de problemas:

1. Verifique os logs de erro
2. Confirme que todas as variáveis de ambiente estão configuradas
3. Verifique se os arquivos de configuração estão corretos
4. Revise o histórico de operações (`history_created.txt` e `history_updated.txt`)

---

**Última atualização:** 12/2025
**Versão:** 1.0.0