"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowForms = WorkflowForms;
const prod_client_1 = require("../apis/prod-client");
const qa_client_1 = require("../apis/qa-client");
const _3_client_function_1 = require("./3_client_function");
async function WorkflowForms(workflowForm, access_token_qa, access_token_prod, client, serviceKey, workflow_id, updateWorkflowData) {
    var _a;
    //////////////////////// WORKFLOW FORMS ////////////////////////
    // Sempre faz GET em QA primeiro para garantir a sequência correta
    const workflowFormId = workflowForm === null || workflowForm === void 0 ? void 0 : workflowForm.id;
    if (!workflowFormId) {
        return;
    }
    const workflowFormData = await (0, qa_client_1.getQA)(access_token_qa, undefined, client, serviceKey, `techforms/workflow-form/${workflowFormId}`, "workflow-form", workflowFormId);
    // Depois faz GET em PROD para verificar se existe
    let workflowFormExistsInProd = true;
    try {
        await (0, prod_client_1.getPROD)(access_token_prod, undefined, client, serviceKey, `techforms/workflow-form/${workflowFormId}`, "workflow-form", workflowFormId);
    }
    catch (err) {
        if (((_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.status) === 404) {
            workflowFormExistsInProd = false;
        }
        else {
            throw err;
        }
    }
    // Finalmente faz CREATE ou UPDATE em PROD
    if (workflowFormExistsInProd) {
        await (0, prod_client_1.updatePROD)(access_token_prod, workflowFormData, client, serviceKey, `techforms/workflow-form/${workflowFormId}`, "workflow-form", workflowFormId, updateWorkflowData);
    }
    else {
        await (0, prod_client_1.createPROD)(access_token_prod, workflowFormData, client, serviceKey, `techforms/workflow-form/${workflowFormId}`, "workflow-form", workflowFormId, updateWorkflowData);
    }
    //////////////////////// CLIENT FUNCTION ////////////////////////
    const formatPayloadFunctionId = workflowFormData === null || workflowFormData === void 0 ? void 0 : workflowFormData.format_payload_function_id;
    if (formatPayloadFunctionId) {
        await (0, _3_client_function_1.ClientFunction)(formatPayloadFunctionId, access_token_qa, access_token_prod, client, serviceKey, updateWorkflowData);
    }
}
