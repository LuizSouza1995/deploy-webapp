"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowSteps = WorkflowSteps;
const prod_client_1 = require("../apis/prod-client");
const qa_client_1 = require("../apis/qa-client");
const _2_1_workflow_step_forms_1 = require("./2.1_workflow_step_forms");
async function WorkflowSteps(workflowSteps, access_token_qa, access_token_prod, client, serviceKey, workflow_id, step_id, updateWorkflowData) {
    var _a;
    if (workflowSteps) {
        // console.log(workflowSteps.map((step: any) => step.id));
        for (const step of workflowSteps) {
            //////////////////////// WORKFLOW STEPS ////////////////////////
            const workflowStepData = await (0, qa_client_1.getQA)(access_token_qa, undefined, client, serviceKey, `techforms/workflow/${workflow_id}/workflow-step/${step.id}`, "workflow-step", step.id);
            let workflowStepExistsInProd = true;
            try {
                await (0, prod_client_1.getPROD)(access_token_prod, undefined, client, serviceKey, `techforms/workflow/${workflow_id}/workflow-step/${step.id}`, "workflow-step", step.id);
            }
            catch (err) {
                if (((_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.status) === 404) {
                    workflowStepExistsInProd = false;
                }
                else {
                    throw err;
                }
            }
            if (workflowStepExistsInProd) {
                await (0, prod_client_1.updatePROD)(access_token_prod, workflowStepData, client, serviceKey, `techforms/workflow/${workflow_id}/workflow-step/${step.id}`, "workflow-step", step.id, updateWorkflowData);
            }
            else {
                await (0, prod_client_1.createPROD)(access_token_prod, workflowStepData, client, serviceKey, `techforms/workflow/${workflow_id}/workflow-step/${step.id}`, "workflow-step", step.id, updateWorkflowData);
            }
            //////////////////////// WORKFLOW STEPS FORMS ////////////////////////
            const workflowStepsForms = workflowStepData === null || workflowStepData === void 0 ? void 0 : workflowStepData.workflow_step_forms;
            for (const stepForm of workflowStepsForms) {
                const workflowStepFormData = await (0, qa_client_1.getQA)(access_token_qa, undefined, client, serviceKey, `techforms/workflow/${workflow_id}/workflow-step/${step.id}/workflow-step-form/${stepForm.id}`, "workflow-step-form", stepForm.id);
                await (0, _2_1_workflow_step_forms_1.WorkflowStepForms)(workflowStepFormData, access_token_qa, access_token_prod, client, serviceKey, workflow_id, step.id, updateWorkflowData);
            }
        }
    }
}
