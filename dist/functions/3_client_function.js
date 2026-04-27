"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientFunction = ClientFunction;
const prod_client_1 = require("../apis/prod-client");
const qa_client_1 = require("../apis/qa-client");
const constants_1 = require("../utils/constants");
async function ClientFunction(function_id, access_token_qa, access_token_prod, client, serviceKey, updateWorkflowData) {
    var _a;
    if (function_id && client && serviceKey) {
        //////////////////////// CLIENT FUNCTION ////////////////////////
        const update_workflow_protocol_functionData = await (0, qa_client_1.getQA)(access_token_qa, undefined, client, serviceKey, `client/${constants_1.clientIdQA}/client-function/${function_id}`, "update-workflow-protocol-function", function_id);
        let protocolFunctionExistsInProd = true;
        try {
            await (0, prod_client_1.getPROD)(access_token_prod, update_workflow_protocol_functionData, client, serviceKey, `client/${constants_1.clientIdPROD}/client-function/${function_id}`, "update-workflow-protocol-function", function_id);
        }
        catch (err) {
            if (((_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.status) === 404) {
                protocolFunctionExistsInProd = false;
            }
            else {
                throw err;
            }
        }
        if (protocolFunctionExistsInProd) {
            await (0, prod_client_1.updatePROD)(access_token_prod, update_workflow_protocol_functionData, client, serviceKey, `client/${constants_1.clientIdPROD}/client-function/${function_id}`, "update-workflow-protocol-function", function_id, updateWorkflowData);
        }
        else {
            await (0, prod_client_1.createPROD)(access_token_prod, update_workflow_protocol_functionData, client, serviceKey, `client/${constants_1.clientIdPROD}/client-function/${function_id}`, "update-workflow-protocol-function", function_id, updateWorkflowData);
        }
    }
}
