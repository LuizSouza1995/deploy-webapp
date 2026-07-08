"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Workflow = Workflow;
const prod_client_1 = require("../apis/prod-client");
const data_processing_1 = require("../utils/data-processing");
const _1_1_workflow_group_1 = require("./1.1_workflow_group");
const _1_2_workflow_group_item_1 = require("./1.2_workflow_group_item");
async function Workflow(access_token_qa, access_token_prod, workflow, client, serviceKey, id, updateWorkflowData) {
    if (workflow && client && serviceKey) {
        //////////////////////// WORKFLOW + WORKFLOW-GROUP ////////////////////////
        const groupId = workflow.workflow_group_id;
        let workflowProd = true;
        try {
            await (0, prod_client_1.getPROD)(access_token_prod, undefined, client, serviceKey, `techforms/workflow/${id}`, "workflow", id);
        }
        catch (err) {
            if ((0, data_processing_1.isNotFoundError)(err)) {
                workflowProd = false;
            }
            else {
                throw err;
            }
        }
        // Quando há groupId: criar grupo PRIMEIRO (se não existir), depois workflow
        // WorkflowGroup cuida de: grupo -> workflow (ordem correta para prod)
        if (groupId) {
            await (0, _1_1_workflow_group_1.WorkflowGroup)(groupId, access_token_qa, access_token_prod, client, serviceKey, id, updateWorkflowData, workflowProd, workflow);
        }
        else {
            if (workflowProd) {
                await (0, prod_client_1.updatePROD)(access_token_prod, workflow, client, serviceKey, `techforms/workflow/${id}`, "workflow", id, updateWorkflowData);
            }
            else {
                await (0, prod_client_1.createPROD)(access_token_prod, workflow, client, serviceKey, `techforms/workflow/${id}`, "workflow", id, updateWorkflowData);
            }
        }
        const workflowGroupItems = workflow.workflow_group_item || [];
        if (workflowGroupItems.length > 0) {
            await (0, _1_2_workflow_group_item_1.WorkflowGroupItem)(workflowGroupItems, access_token_qa, access_token_prod, client, serviceKey, id, updateWorkflowData);
        }
    }
}
