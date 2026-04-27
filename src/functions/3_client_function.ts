import { createPROD, getPROD, updatePROD } from "../apis/prod-client";
import { getQA } from "../apis/qa-client";
import { clientIdPROD, clientIdQA } from "../utils/constants";
import { Token } from "../utils/types";

export async function ClientFunction(function_id: string, access_token_qa: Token, access_token_prod: Token, client: string | undefined, serviceKey: string | undefined, updateWorkflowData: any) {
    if (function_id && client && serviceKey) {
        //////////////////////// CLIENT FUNCTION ////////////////////////
        const update_workflow_protocol_functionData = await getQA(access_token_qa, undefined, client!, serviceKey!, `client/${clientIdQA}/client-function/${function_id}`, "update-workflow-protocol-function", function_id);

        let protocolFunctionExistsInProd = true;
        try {
            await getPROD(access_token_prod, update_workflow_protocol_functionData, client!, serviceKey!, `client/${clientIdPROD}/client-function/${function_id}`, "update-workflow-protocol-function", function_id);
        } catch (err: any) {
            if (err?.response?.status === 404) {
                protocolFunctionExistsInProd = false;
            } else {
                throw err;
            }
        }

        if (protocolFunctionExistsInProd) {
            await updatePROD(access_token_prod, update_workflow_protocol_functionData, client!, serviceKey!, `client/${clientIdPROD}/client-function/${function_id}`, "update-workflow-protocol-function", function_id, updateWorkflowData);
        } else {
            await createPROD(access_token_prod, update_workflow_protocol_functionData, client!, serviceKey!, `client/${clientIdPROD}/client-function/${function_id}`, "update-workflow-protocol-function", function_id, updateWorkflowData);
        }
    }
}