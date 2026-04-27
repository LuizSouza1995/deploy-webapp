"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowGroupItem = WorkflowGroupItem;
const qa_client_1 = require("../apis/qa-client");
const prod_client_1 = require("../apis/prod-client");
async function WorkflowGroupItem(workflowGroupItems, access_token_qa, access_token_prod, client, serviceKey, workflow_id, updateWorkflowData) {
    var _a, _b;
    if (workflowGroupItems.length > 0 && client && serviceKey && workflow_id) {
        //////////////////////// WORKFLOW-GROUP-ITEM ////////////////////////
        for (const groupItem of workflowGroupItems) {
            const groupItemData = await (0, qa_client_1.getQA)(access_token_qa, undefined, client, serviceKey, `techforms/workflow-group/${workflow_id}/workflow-group-item/${groupItem.id}`, "workflow-group-item", groupItem.id);
            const groupId = groupItem.workflow_group_id;
            if (!groupId)
                continue;
            // Garantir que o grupo existe em prod ANTES de criar o item
            let groupExistsInProd = true;
            try {
                await (0, prod_client_1.getPROD)(access_token_prod, undefined, client, serviceKey, `techforms/workflow-group/${groupId}`, "workflow-group", groupId);
            }
            catch (err) {
                if (((_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.status) === 404) {
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
                await (0, prod_client_1.getPROD)(access_token_prod, undefined, client, serviceKey, `techforms/workflow-group/${workflow_id}/workflow-group-item/${groupItem.id}`, "workflow-group-item", groupItem.id);
            }
            catch (err) {
                if (((_b = err === null || err === void 0 ? void 0 : err.response) === null || _b === void 0 ? void 0 : _b.status) === 404) {
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
