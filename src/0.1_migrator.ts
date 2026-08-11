import * as fs from "fs";
import * as path from "path";
import { log } from "console";
import { client, cor, emailLoginPROD, passwordLoginPROD, emailLoginQA, passwordLoginQA, serviceKey, clearHistoryCreated, clearHistoryUpdated } from "./utils/constants";
import { Token, WorkflowsIds } from "./utils/types";
import { getQA, loginQA, publishWorkflowQA } from "./apis/qa-client";
import { loginPROD, publishWorkflowPROD } from "./apis/prod-client";
import { WorkflowSteps } from "./functions/2_workflow_step";
import { WorkflowForms } from "./functions/2.1.1_workflow_forms";
import { ClientFunction } from "./functions/3_client_function";
import { WorkflowFormGroups } from "./functions/4_workflow_form_groups";
import { Workflow } from "./functions/1_workflow";
import { HomeSettings } from "./functions/5_home_settings";
import { collectChildFormIdsFromWorkflow } from "./utils/data-processing";

export const runMigration = async () => {
  if (!emailLoginQA || !passwordLoginQA || !emailLoginPROD || !passwordLoginPROD || !client || !serviceKey) {
    throw new Error("Variáveis de ambiente WEBAPP_QA_EMAIL_LOGIN, WEBAPP_QA_PASSWORD_LOGIN, WEBAPP_PROD_EMAIL_LOGIN, WEBAPP_PROD_PASSWORD_LOGIN, CLIENT_ID e/ou SERVICE_KEY não definidas");
  }

  // Limpa os arquivos de histórico antes de começar
  clearHistoryCreated();
  clearHistoryUpdated();
  log(`${cor.Yellow}Históricos limpos. Iniciando migração...${cor.Reset}`);

  const access_token_qa = await loginQA(client!, serviceKey!, emailLoginQA!, passwordLoginQA!) as Token;
  const access_token_prod = await loginPROD(client!, serviceKey!, emailLoginPROD!, passwordLoginPROD!) as Token;

  // Determinar onde procurar os arquivos
  // Se estiver em node_modules (pacote instalado), procura na raiz do projeto
  // Se estiver em modo local (desenvolvimento), procura em src/utils
  function getFilesDirectory() {
    if (__dirname.includes('node_modules')) {
      // Pacote instalado: procura na raiz do projeto
      return process.cwd();
    }
    // Modo local: procura em src/utils
    return path.resolve(__dirname, "utils");
  }

  const filesDirectory = getFilesDirectory();
  const updateWorkflow = path.resolve(filesDirectory, "updateWorkflow.json");

  // Verificar se o arquivo existe
  if (!fs.existsSync(updateWorkflow)) {
    throw new Error(`Arquivo updateWorkflow.json não encontrado em: ${filesDirectory}\nCertifique-se de que o arquivo está no local correto.`);
  }

  const getUpdateWorkflow = fs.readFileSync(updateWorkflow, "utf8");
  const updateWorkflowData = JSON.parse(getUpdateWorkflow);

  const arrayIds: WorkflowsIds[] = (updateWorkflowData.workflows || []).map((id: string) => ({
    id
  }));

  const processedClientServices = new Set<string>();

  const execute = async (info: WorkflowsIds) => {
    try {
      //////////////////////// PUBLISH WORKFLOW QA ////////////////////////
      await publishWorkflowQA(access_token_qa, info.id, client!, serviceKey!, `techforms/workflow/${info.id}`, "workflow");

      //////////////////////// WORKFLOW ////////////////////////
      const workflow = await getQA(access_token_qa, undefined, client!, serviceKey!, `techforms/workflow/${info.id}`, "workflow", info.id);
      // const groupItems = workflow.workflow_group_item || [];

      if (!workflow) {
        log(`${cor.Blue}Workflow ${info.id} not found in QA${cor.Reset}`);
        return;
      }

      await Workflow(access_token_qa, access_token_prod, workflow, client!, serviceKey!, info.id, updateWorkflowData);

      //////////////////////// HOME SETTINGS (uma vez por client_service) ////////////////////////
      const clientServiceId = workflow.client_service_id;
      if (clientServiceId && !processedClientServices.has(clientServiceId)) {
        processedClientServices.add(clientServiceId);
        await HomeSettings(clientServiceId, access_token_qa, access_token_prod, client, serviceKey, updateWorkflowData);
      }

      //////////////////////// WORKFLOW STEPS ////////////////////////
      const workflowSteps = workflow.workflow_steps;
      await WorkflowSteps(workflowSteps, access_token_qa, access_token_prod, client, serviceKey, info.id, undefined, updateWorkflowData);

      //////////////////////// WORKFLOW FORMS FILHOS (snapshot compilado) ////////////////////////
      const childFormIds = collectChildFormIdsFromWorkflow(workflow);
      for (const childFormId of childFormIds) {
        await WorkflowForms({ id: childFormId }, access_token_qa, access_token_prod, client!, serviceKey!, info.id!, updateWorkflowData);
      }

      //////////////////////// CLIENT-FUNCTION ////////////////////////
      const update_workflow_protocol_function_id = workflow.update_workflow_protocol_function_id;
      await ClientFunction(update_workflow_protocol_function_id, access_token_qa, access_token_prod, client, serviceKey, updateWorkflowData);

      //////////////////////// WORKFLOW FORM GROUP ////////////////////////
      const workflowFormGroupQA = workflow.workflow_form_groups
      await WorkflowFormGroups(workflowFormGroupQA, access_token_qa, access_token_prod, client!, serviceKey!, info.id!, updateWorkflowData);

      //////////////////////// PUBLISH WORKFLOW PROD ////////////////////////
      await publishWorkflowPROD(access_token_prod, info.id, client!, serviceKey!, `techforms/workflow/${info.id}`, "workflow");
    } catch (error: any) {
      const errorDetail =
        error?.response?.data?.message ??
        error?.response?.data ??
        error?.message ??
        error;
      log(`${cor.Red}Error to process ID ${info.id}: ${JSON.stringify(errorDetail)}${cor.Reset}`);
    }
  };

  for (const info of arrayIds) {
    await execute(info);
  }
};