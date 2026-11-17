"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowGroupItem = WorkflowGroupItem;
const qa_client_1 = require("../apis/qa-client");
const prod_client_1 = require("../apis/prod-client");
const data_processing_1 = require("../utils/data-processing");
async function WorkflowGroupItem(workflowGroupItems, access_token_qa, access_token_prod, client, serviceKey, workflow_id, updateWorkflowData) {
    var _a;
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
            // O item em PROD pode ter id diferente do da QA (a API gera o id no POST). Por isso a checagem é
            // por id E por (grupo + workflow_id): sem isso cada deploy recriava o item e duplicava o menu.
            let prodItemId = groupItem.id;
            let existsInProd = true;
            try {
                await (0, prod_client_1.getPROD)(access_token_prod, undefined, client, serviceKey, `techforms/workflow-group/${groupId}/workflow-group-item/${groupItem.id}`, "workflow-group-item", groupItem.id);
            }
            catch (err) {
                if (!(0, data_processing_1.isNotFoundError)(err))
                    throw err;
                existsInProd = false;
                const prodItems = await (0, prod_client_1.getPROD)(access_token_prod, undefined, client, serviceKey, `techforms/workflow-group/${groupId}/workflow-group-item?page=1&per_page=100`, "workflow-group-item", groupItem.id);
                const sameWorkflowItem = ((_a = prodItems === null || prodItems === void 0 ? void 0 : prodItems.data) !== null && _a !== void 0 ? _a : []).find((item) => item.workflow_id === groupItemData.workflow_id);
                if (sameWorkflowItem) {
                    existsInProd = true;
                    prodItemId = sameWorkflowItem.id;
                }
            }
            if (existsInProd) {
                await (0, prod_client_1.updatePROD)(access_token_prod, groupItemData, client, serviceKey, `techforms/workflow-group/${groupId}/workflow-group-item/${prodItemId}`, "workflow-group-item", prodItemId, updateWorkflowData);
            }
            else {
                await (0, prod_client_1.createPROD)(access_token_prod, groupItemData, client, serviceKey, `techforms/workflow-group/${groupId}/workflow-group-item/${groupItem.id}`, "workflow-group-item", groupItem.id, updateWorkflowData);
            }
        }
    }
}
