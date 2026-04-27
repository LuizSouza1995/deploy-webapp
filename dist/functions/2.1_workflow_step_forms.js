"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowStepForms = WorkflowStepForms;
const prod_client_1 = require("../apis/prod-client");
const _2_1_1_workflow_forms_1 = require("./2.1.1_workflow_forms");
async function WorkflowStepForms(workflowStepFormData, access_token_qa, access_token_prod, client, serviceKey, workflow_id, step_id, updateWorkflowData) {
    var _a;
    //////////////////////// WORKFLOW STEPS FORMS ////////////////////////
    let workflowStepFormExistsInProd = true;
    //////////////////////// WORKFLOW FORMS ////////////////////////
    const workflowFormId = workflowStepFormData === null || workflowStepFormData === void 0 ? void 0 : workflowStepFormData.workflow_form_id;
    if (workflowFormId) {
        await (0, _2_1_1_workflow_forms_1.WorkflowForms)({ id: workflowFormId }, access_token_qa, access_token_prod, client, serviceKey, workflow_id, updateWorkflowData);
    }
    try {
        await (0, prod_client_1.getPROD)(access_token_prod, undefined, client, serviceKey, `techforms/workflow/${workflow_id}/workflow-step/${step_id}/workflow-step-form/${workflowStepFormData.id}`, "workflow-step-form", workflowStepFormData.id);
    }
    catch (err) {
        if (((_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.status) === 404) {
            workflowStepFormExistsInProd = false;
        }
        else {
            throw err;
        }
    }
    if (workflowStepFormExistsInProd) {
        await (0, prod_client_1.updatePROD)(access_token_prod, workflowStepFormData, client, serviceKey, `techforms/workflow/${workflow_id}/workflow-step/${step_id}/workflow-step-form/${workflowStepFormData.id}`, "workflow-step-form", workflowStepFormData.id, updateWorkflowData);
    }
    else {
        await (0, prod_client_1.createPROD)(access_token_prod, workflowStepFormData, client, serviceKey, `techforms/workflow/${workflow_id}/workflow-step/${step_id}/workflow-step-form`, "workflow-step-form", workflowStepFormData.id, updateWorkflowData);
    }
}
