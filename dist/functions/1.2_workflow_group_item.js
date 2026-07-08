"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowGroupItem = WorkflowGroupItem;
const qa_client_1 = require("../apis/qa-client");
const prod_client_1 = require("../apis/prod-client");
const data_processing_1 = require("../utils/data-processing");
async function WorkflowGroupItem(workflowGroupItems, access_token_qa, access_token_prod, client, serviceKey, workflow_id, updateWorkflowData) {
    if (workflowGroupItems.length > 0 && client && serviceKey && workflow_id) {
        //////////////////////// WORKFLOW-GROUP-ITEM ////////////////////////
        for (const groupItem of workflowGroupItems) {
            const groupId = groupItem.workflow_group_id;
            if (!groupId)
                continue;
            const groupItemData = await (0, qa_client_1.getQA)(access_token_qa, undefined, client, serviceKey, `techforms/workflow-group/${groupId}/workflow-group-item/${groupItem.id}`, "workflow-group-item", groupItem.id);
            if (groupItemData && !groupItemData.workflow_group_id) {
                groupItemData.workflow_group_id = groupId;
            }
            // Garantir que o grupo existe em prod ANTES de criar o item
            let groupExistsInProd = true;
            try {
                await (0, prod_client_1.getPROD)(access_token_prod, undefined, client, serviceKey, `techforms/workflow-group/${groupId}`, "workflow-group", groupId);
            }
            catch (err) {
                if ((0, data_processing_1.isNotFoundError)(err)) {
                    groupExistsInProd = false;
                }
                else {
                    throw err;
                }
            }
            if (!groupExistsInProd) {
                const workflowGroup = await (0, qa_client_1.getQA)(access_token_qa, undefined, client, serviceKey, `techforms/workflow-group/${groupId}`, "workflow-group", groupId);
                await (0, prod_client_1.createPROD)(access_token_prod, workflowGroup, client, serviceKey, `techforms/workflow-group/${groupId}`, "workflow-group", groupId, updateWorkflowData);
            }
            let existsInProd = true;
            try {
                await (0, prod_client_1.getPROD)(access_token_prod, undefined, client, serviceKey, `techforms/workflow-group/${groupId}/workflow-group-item/${groupItem.id}`, "workflow-group-item", groupItem.id);
            }
            catch (err) {
                if ((0, data_processing_1.isNotFoundError)(err)) {
                    existsInProd = false;
                }
                else {
                    throw err;
                }
            }
            if (existsInProd) {
                await (0, prod_client_1.updatePROD)(access_token_prod, groupItemData, client, serviceKey, `techforms/workflow-group/${groupId}/workflow-group-item/${groupItem.id}`, "workflow-group-item", groupItem.id, updateWorkflowData);
            }
            else {
                await (0, prod_client_1.createPROD)(access_token_prod, groupItemData, client, serviceKey, `techforms/workflow-group/${groupId}/workflow-group-item/${groupItem.id}`, "workflow-group-item", groupItem.id, updateWorkflowData);
            }
        }
    }
}
