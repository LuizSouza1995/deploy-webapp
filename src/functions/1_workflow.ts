import { createPROD, getPROD, updatePROD } from "../apis/prod-client";
import { isNotFoundError } from "../utils/data-processing";
import { Token } from "../utils/types";
import { WorkflowGroup } from "./1.1_workflow_group";
import { WorkflowGroupItem } from "./1.2_workflow_group_item";

export async function Workflow(access_token_qa: Token, access_token_prod: Token, workflow: any, client: string, serviceKey: string, id: string, updateWorkflowData: any) {
    if (workflow && client && serviceKey) {
        //////////////////////// WORKFLOW + WORKFLOW-GROUP ////////////////////////
        const groupId = workflow.workflow_group_id;
        let workflowProd = true;
        try {
            await getPROD(access_token_prod, undefined, client!, serviceKey!, `techforms/workflow/${id}`, "workflow", id);
        } catch (err: any) {
            if (isNotFoundError(err)) {
                workflowProd = false;
            } else {
                throw err;
            }
        }

        // Quando há groupId: criar grupo PRIMEIRO (se não existir), depois workflow
        // WorkflowGroup cuida de: grupo -> workflow (ordem correta para prod)
        if (groupId) {
            await WorkflowGroup(groupId, access_token_qa, access_token_prod, client!, serviceKey!, id!, updateWorkflowData, workflowProd, workflow);
        } else {
            if (workflowProd) {
                await updatePROD(access_token_prod, workflow, client!, serviceKey!, `techforms/workflow/${id}`, "workflow", id, updateWorkflowData);
            } else {
                await createPROD(access_token_prod, workflow, client!, serviceKey!, `techforms/workflow/${id}`, "workflow", id, updateWorkflowData);
            }
        }

        const workflowGroupItems = workflow.workflow_group_item || [];
        if (workflowGroupItems.length > 0) {
            await WorkflowGroupItem(workflowGroupItems, access_token_qa, access_token_prod, client!, serviceKey!, id!, updateWorkflowData);
        }

    }
}