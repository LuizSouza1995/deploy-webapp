import { log } from "console";
import { createPROD, getPROD, updatePROD } from "../apis/prod-client";
import { isNotFoundError } from "../utils/data-processing";
import { getQA } from "../apis/qa-client";
import { Token } from "../utils/types";
import { cor } from "../utils/constants";

export async function WorkflowGroup(groupId: any, access_token_qa: Token, access_token_prod: Token, client: string, serviceKey: string, workflow_id: string, updateWorkflowData: any, workflowProd: boolean, workflow: any) {
    if (groupId && client && serviceKey && workflow_id) {
        const workflowGroup = await getQA(access_token_qa, undefined, client!, serviceKey!, `techforms/workflow-group/${groupId}`, "workflow-group", groupId);
        //////////////////////// WORKFLOW-GROUP ////////////////////////
        let groupExistsInProd = true;
        try {
            await getPROD(access_token_prod, undefined, client!, serviceKey!, `techforms/workflow-group/${groupId}`, "workflow-group", groupId);
        } catch (err: any) {
            if (isNotFoundError(err)) {
                groupExistsInProd = false;
            } else {
                throw err;
            }
        }

        if (groupExistsInProd) {
            await updatePROD(access_token_prod, workflowGroup, client!, serviceKey!, `techforms/workflow-group/${groupId}`, "workflow-group", groupId, updateWorkflowData);
        } else {
            await createPROD(access_token_prod, workflowGroup, client!, serviceKey!, `techforms/workflow-group/${groupId}`, "workflow-group", groupId, updateWorkflowData);

            if (workflowProd) {
                await updatePROD(access_token_prod, workflow, client!, serviceKey!, `techforms/workflow/${workflow_id}`, "workflow", workflow_id, updateWorkflowData);
            } else {
                await createPROD(access_token_prod, workflow, client!, serviceKey!, `techforms/workflow/${workflow_id}`, "workflow", workflow_id, updateWorkflowData);
            }
        }
    } else {
        if (workflowProd) {
            await updatePROD(access_token_prod, workflow, client!, serviceKey!, `techforms/workflow/${workflow_id}`, "workflow", workflow_id, updateWorkflowData);
        } else {
            await createPROD(access_token_prod, workflow, client!, serviceKey!, `techforms/workflow/${workflow_id}`, "workflow", workflow_id, updateWorkflowData);
        }
        log(`${cor.Blue}Not exists workflow_group_id in workflow ${workflow_id} ${cor.Reset}`);
    }
}