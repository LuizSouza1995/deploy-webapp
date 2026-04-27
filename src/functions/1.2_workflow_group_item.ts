import { Token } from "../utils/types";
import { getQA } from "../apis/qa-client";
import { createPROD, getPROD, updatePROD } from "../apis/prod-client";

export async function WorkflowGroupItem(workflowGroupItems: any, access_token_qa: Token, access_token_prod: Token, client: string, serviceKey: string, workflow_id: string, updateWorkflowData: any) {
    if (workflowGroupItems.length > 0 && client && serviceKey && workflow_id) {
        //////////////////////// WORKFLOW-GROUP-ITEM ////////////////////////
        for (const groupItem of workflowGroupItems) {
            const groupItemData = await getQA(access_token_qa, undefined, client!, serviceKey!, `techforms/workflow-group/${workflow_id}/workflow-group-item/${groupItem.id}`, "workflow-group-item", groupItem.id);
            const groupId = groupItem.workflow_group_id;

            if (!groupId) continue;

            // Garantir que o grupo existe em prod ANTES de criar o item
            let groupExistsInProd = true;
            try {
                await getPROD(access_token_prod, undefined, client!, serviceKey!, `techforms/workflow-group/${groupId}`, "workflow-group", groupId);
            } catch (err: any) {
                if (err?.response?.status === 404) {
                    groupExistsInProd = false;
                } else {
                    throw err;
                }
            }
            if (!groupExistsInProd) {
                const workflowGroup = await getQA(access_token_qa, undefined, client!, serviceKey!, `techforms/workflow-group/${groupId}`, "workflow-group", groupId);
                await createPROD(access_token_prod, workflowGroup, client!, serviceKey!, `techforms/workflow-group/${groupId}`, "workflow-group", groupId, updateWorkflowData);
            }

            let existsInProd = true;
            try {
                await getPROD(access_token_prod, undefined, client!, serviceKey!, `techforms/workflow-group/${workflow_id}/workflow-group-item/${groupItem.id}`, "workflow-group-item", groupItem.id);
            } catch (err: any) {
                if (err?.response?.status === 404) {
                    existsInProd = false;
                } else {
                    throw err;
                }
            }

            if (existsInProd) {
                await updatePROD(access_token_prod, groupItemData, client!, serviceKey!, `techforms/workflow-group/${groupId}/workflow-group-item/${groupItem.id}`, "workflow-group-item", groupItem.id, updateWorkflowData);
            } else {
                await createPROD(access_token_prod, groupItemData, client!, serviceKey!, `techforms/workflow-group/${groupId}/workflow-group-item/${groupItem.id}`, "workflow-group-item", groupItem.id, updateWorkflowData);
            }
        }
    }
}