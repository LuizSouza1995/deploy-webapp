"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowFormGroups = WorkflowFormGroups;
const prod_client_1 = require("../apis/prod-client");
const data_processing_1 = require("../utils/data-processing");
const qa_client_1 = require("../apis/qa-client");
const _2_1_1_workflow_forms_1 = require("./2.1.1_workflow_forms");
async function WorkflowFormGroups(workflowFormGroupQA, access_token_qa, access_token_prod, client, serviceKey, workflow_id, updateWorkflowData) {
    if (workflowFormGroupQA.length > 0 && client && serviceKey && workflow_id) {
        for (const formGroup of workflowFormGroupQA) {
            const workflowFormGroupData = await (0, qa_client_1.getQA)(access_token_qa, undefined, client, serviceKey, `techforms/workflow/${workflow_id}/workflow-form/null/workflow-form-group/${formGroup.id}`, "workflow-form-group", formGroup.id);
            let workflowFormGroupExistsInProd = true;
            try {
                await (0, prod_client_1.getPROD)(access_token_prod, undefined, client, serviceKey, `techforms/workflow/${workflow_id}/workflow-form/null/workflow-form-group/${formGroup.id}`, "workflow-form-group", formGroup.id);
            }
            catch (err) {
                if ((0, data_processing_1.isNotFoundError)(err)) {
                    workflowFormGroupExistsInProd = false;
                }
                else {
                    throw err;
                }
            }
            if (workflowFormGroupExistsInProd) {
                await (0, prod_client_1.updatePROD)(access_token_prod, workflowFormGroupData, client, serviceKey, `techforms/workflow/${workflow_id}/workflow-form/null/workflow-form-group/${formGroup.id}`, "workflow-form-group", formGroup.id, updateWorkflowData);
            }
            else {
                await (0, prod_client_1.createPROD)(access_token_prod, workflowFormGroupData, client, serviceKey, `techforms/workflow/${workflow_id}/workflow-form/null/workflow-form-group`, "workflow-form-group", formGroup.id, updateWorkflowData);
            }
            //////////////////////// WORKFLOW FORMS IN FORM GROUP ////////////////////////
            const workflowForms = workflowFormGroupData === null || workflowFormGroupData === void 0 ? void 0 : workflowFormGroupData.workflow_form_id;
            if (workflowForms) {
                await (0, _2_1_1_workflow_forms_1.WorkflowForms)({ id: workflowForms }, access_token_qa, access_token_prod, client, serviceKey, workflow_id, updateWorkflowData);
            }
        }
    }
}
