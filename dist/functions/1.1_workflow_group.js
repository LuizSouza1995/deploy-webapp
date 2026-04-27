"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowGroup = WorkflowGroup;
const console_1 = require("console");
const prod_client_1 = require("../apis/prod-client");
const qa_client_1 = require("../apis/qa-client");
const constants_1 = require("../utils/constants");
async function WorkflowGroup(groupId, access_token_qa, access_token_prod, client, serviceKey, workflow_id, updateWorkflowData, workflowProd, workflow) {
    var _a;
    if (groupId && client && serviceKey && workflow_id) {
        const workflowGroup = await (0, qa_client_1.getQA)(access_token_qa, undefined, client, serviceKey, `techforms/workflow-group/${groupId}`, "workflow-group", groupId);
        //////////////////////// WORKFLOW-GROUP ////////////////////////
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
        if (groupExistsInProd) {
            await (0, prod_client_1.updatePROD)(access_token_prod, workflowGroup, client, serviceKey, `techforms/workflow-group/${groupId}`, "workflow-group", groupId, updateWorkflowData);
        }
        else {
            await (0, prod_client_1.createPROD)(access_token_prod, workflowGroup, client, serviceKey, `techforms/workflow-group/${groupId}`, "workflow-group", groupId, updateWorkflowData);
            if (workflowProd) {
                await (0, prod_client_1.updatePROD)(access_token_prod, workflow, client, serviceKey, `techforms/workflow/${workflow_id}`, "workflow", workflow_id, updateWorkflowData);
            }
            else {
                await (0, prod_client_1.createPROD)(access_token_prod, workflow, client, serviceKey, `techforms/workflow/${workflow_id}`, "workflow", workflow_id, updateWorkflowData);
            }
        }
    }
    else {
        if (workflowProd) {
            await (0, prod_client_1.updatePROD)(access_token_prod, workflow, client, serviceKey, `techforms/workflow/${workflow_id}`, "workflow", workflow_id, updateWorkflowData);
        }
        else {
            await (0, prod_client_1.createPROD)(access_token_prod, workflow, client, serviceKey, `techforms/workflow/${workflow_id}`, "workflow", workflow_id, updateWorkflowData);
        }
        (0, console_1.log)(`${constants_1.cor.Blue}Not exists workflow_group_id in workflow ${workflow_id} ${constants_1.cor.Reset}`);
    }
}
