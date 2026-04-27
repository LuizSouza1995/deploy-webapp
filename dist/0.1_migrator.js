"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigration = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const console_1 = require("console");
const constants_1 = require("./utils/constants");
const qa_client_1 = require("./apis/qa-client");
const prod_client_1 = require("./apis/prod-client");
const _2_workflow_step_1 = require("./functions/2_workflow_step");
const _3_client_function_1 = require("./functions/3_client_function");
const _4_workflow_form_groups_1 = require("./functions/4_workflow_form_groups");
const _1_workflow_1 = require("./functions/1_workflow");
const runMigration = async () => {
    if (!constants_1.emailLoginQA || !constants_1.passwordLoginQA || !constants_1.emailLoginPROD || !constants_1.passwordLoginPROD || !constants_1.client || !constants_1.serviceKey) {
        throw new Error("Variáveis de ambiente WEBAPP_QA_EMAIL_LOGIN, WEBAPP_QA_PASSWORD_LOGIN, WEBAPP_PROD_EMAIL_LOGIN, WEBAPP_PROD_PASSWORD_LOGIN, CLIENT_ID e/ou SERVICE_KEY não definidas");
    }
    // Limpa os arquivos de histórico antes de começar
    (0, constants_1.clearHistoryCreated)();
    (0, constants_1.clearHistoryUpdated)();
    (0, console_1.log)(`${constants_1.cor.Yellow}Históricos limpos. Iniciando migração...${constants_1.cor.Reset}`);
    const access_token_qa = await (0, qa_client_1.loginQA)(constants_1.client, constants_1.serviceKey, constants_1.emailLoginQA, constants_1.passwordLoginQA);
    const access_token_prod = await (0, prod_client_1.loginPROD)(constants_1.client, constants_1.serviceKey, constants_1.emailLoginPROD, constants_1.passwordLoginPROD);
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
    const csvFilePath = path.resolve(filesDirectory, "ids.csv");
    // Verificar se os arquivos existem
    if (!fs.existsSync(updateWorkflow)) {
        throw new Error(`Arquivo updateWorkflow.json não encontrado em: ${filesDirectory}\nCertifique-se de que o arquivo está no local correto.`);
    }
    if (!fs.existsSync(csvFilePath)) {
        throw new Error(`Arquivo ids.csv não encontrado em: ${filesDirectory}\nCertifique-se de que o arquivo está no local correto.`);
    }
    const getUpdateWorkflow = fs.readFileSync(updateWorkflow, "utf8");
    const updateWorkflowData = JSON.parse(getUpdateWorkflow);
    const csv = require("csvtojson");
    const jsonArray = await csv({ delimiter: ";" }).fromFile(csvFilePath);
    const arrayIds = jsonArray.map((row) => ({
        id: row.workflow_id
    }));
    const execute = async (info) => {
        var _a, _b;
        try {
            //////////////////////// PUBLISH WORKFLOW QA ////////////////////////
            await (0, qa_client_1.publishWorkflowQA)(access_token_qa, info.id, constants_1.client, constants_1.serviceKey, `techforms/workflow/${info.id}`, "workflow");
            //////////////////////// WORKFLOW ////////////////////////
            const workflow = await (0, qa_client_1.getQA)(access_token_qa, undefined, constants_1.client, constants_1.serviceKey, `techforms/workflow/${info.id}`, "workflow", info.id);
            const groupItems = workflow.workflow_group_item || [];
            if (!workflow) {
                (0, console_1.log)(`${constants_1.cor.Blue}Workflow ${info.id} not found in QA${constants_1.cor.Reset}`);
                return;
            }
            await (0, _1_workflow_1.Workflow)(access_token_qa, access_token_prod, workflow, constants_1.client, constants_1.serviceKey, info.id, updateWorkflowData);
            //////////////////////// WORKFLOW STEPS ////////////////////////
            const workflowSteps = workflow.workflow_steps;
            await (0, _2_workflow_step_1.WorkflowSteps)(workflowSteps, access_token_qa, access_token_prod, constants_1.client, constants_1.serviceKey, undefined, undefined, updateWorkflowData);
            //////////////////////// CLIENT-FUNCTION ////////////////////////
            const update_workflow_protocol_function_id = workflow.update_workflow_protocol_function_id;
            await (0, _3_client_function_1.ClientFunction)(update_workflow_protocol_function_id, access_token_qa, access_token_prod, constants_1.client, constants_1.serviceKey, updateWorkflowData);
            //////////////////////// WORKFLOW FORM GROUP ////////////////////////
            const workflowFormGroupQA = workflow.workflow_form_groups;
            await (0, _4_workflow_form_groups_1.WorkflowFormGroups)(workflowFormGroupQA, access_token_qa, access_token_prod, constants_1.client, constants_1.serviceKey, info.id, updateWorkflowData);
            //////////////////////// PUBLISH WORKFLOW PROD ////////////////////////
            await (0, prod_client_1.publishWorkflowPROD)(access_token_prod, info.id, constants_1.client, constants_1.serviceKey, `techforms/workflow/${info.id}`, "workflow");
        }
        catch (error) {
            (0, console_1.log)(`${constants_1.cor.Red}Error to process ID ${info.id}: ${JSON.stringify((_b = (_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message)}${constants_1.cor.Reset}`);
        }
    };
    for (const info of arrayIds) {
        await execute(info);
    }
};
exports.runMigration = runMigration;
