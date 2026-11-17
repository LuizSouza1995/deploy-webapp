import { Token } from "../utils/types";
import { getQA } from "../apis/qa-client";
import { createPROD, getPROD, updatePROD } from "../apis/prod-client";
import { isNotFoundError } from "../utils/data-processing";

export async function WorkflowGroupItem(workflowGroupItems: any, access_token_qa: Token, access_token_prod: Token, client: string, serviceKey: string, workflow_id: string, updateWorkflowData: any) {
    if (workflowGroupItems.length > 0 && client && serviceKey && workflow_id) {
        //////////////////////// WORKFLOW-GROUP-ITEM ////////////////////////
        for (const groupItem of workflowGroupItems) {
            const groupId = groupItem.workflow_group_id;

            if (!groupId) continue;

            const groupItemData = await getQA(access_token_qa, undefined, client!, serviceKey!, `techforms/workflow-group/${groupId}/workflow-group-item/${groupItem.id}`, "workflow-group-item", groupItem.id);
            if (groupItemData && !groupItemData.workflow_group_id) {
                groupItemData.workflow_group_id = groupId;
            }

            // Garantir que o grupo existe em prod ANTES de criar o item
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
            if (!groupExistsInProd) {
                const workflowGroup = await getQA(access_token_qa, undefined, client!, serviceKey!, `techforms/workflow-group/${groupId}`, "workflow-group", groupId);
                await createPROD(access_token_prod, workflowGroup, client!, serviceKey!, `techforms/workflow-group/${groupId}`, "workflow-group", groupId, updateWorkflowData);
            }

            // O item em PROD pode ter id diferente do da QA (a API gera o id no POST). Por isso a checagem é
            // por id E por (grupo + workflow_id): sem isso cada deploy recriava o item e duplicava o menu.
            let prodItemId: string | undefined = groupItem.id;
            let existsInProd = true;
            try {
                await getPROD(access_token_prod, undefined, client!, serviceKey!, `techforms/workflow-group/${groupId}/workflow-group-item/${groupItem.id}`, "workflow-group-item", groupItem.id);
            } catch (err: any) {
                if (!isNotFoundError(err)) throw err;
                existsInProd = false;
                const prodItems = await getPROD(access_token_prod, undefined, client!, serviceKey!, `techforms/workflow-group/${groupId}/workflow-group-item?page=1&per_page=100`, "workflow-group-item", groupItem.id);
                const sameWorkflowItem = (prodItems?.data ?? []).find((item: any) => item.workflow_id === groupItemData.workflow_id);
                if (sameWorkflowItem) {
                    existsInProd = true;
                    prodItemId = sameWorkflowItem.id;
                }
            }

            if (existsInProd) {
                await updatePROD(access_token_prod, groupItemData, client!, serviceKey!, `techforms/workflow-group/${groupId}/workflow-group-item/${prodItemId}`, "workflow-group-item", prodItemId!, updateWorkflowData);
            } else {
                await createPROD(access_token_prod, groupItemData, client!, serviceKey!, `techforms/workflow-group/${groupId}/workflow-group-item/${groupItem.id}`, "workflow-group-item", groupItem.id, updateWorkflowData);
            }
        }
    }
}