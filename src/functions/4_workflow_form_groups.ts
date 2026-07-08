import { createPROD, getPROD, updatePROD } from "../apis/prod-client";
import { isNotFoundError } from "../utils/data-processing";
import { getQA } from "../apis/qa-client";
import { Token } from "../utils/types";
import { WorkflowForms } from "./2.1.1_workflow_forms";

export async function WorkflowFormGroups(workflowFormGroupQA: any, access_token_qa: Token, access_token_prod: Token, client: string | undefined, serviceKey: string | undefined, workflow_id: string | undefined, updateWorkflowData: any) {
    if (workflowFormGroupQA.length > 0 && client && serviceKey && workflow_id) {
        for (const formGroup of workflowFormGroupQA) {
            const workflowFormGroupData = await getQA(access_token_qa, undefined, client!, serviceKey!, `techforms/workflow/${workflow_id}/workflow-form/null/workflow-form-group/${formGroup.id}`, "workflow-form-group", formGroup.id);
            let workflowFormGroupExistsInProd = true;
            try {
                await getPROD(access_token_prod, undefined, client!, serviceKey!, `techforms/workflow/${workflow_id}/workflow-form/null/workflow-form-group/${formGroup.id}`, "workflow-form-group", formGroup.id);
            } catch (err: any) {
                if (isNotFoundError(err)) {
                    workflowFormGroupExistsInProd = false;
                } else {
                    throw err;
                }
            }

            if (workflowFormGroupExistsInProd) {
                await updatePROD(access_token_prod, workflowFormGroupData, client!, serviceKey!, `techforms/workflow/${workflow_id}/workflow-form/null/workflow-form-group/${formGroup.id}`, "workflow-form-group", formGroup.id, updateWorkflowData);
            } else {
                await createPROD(access_token_prod, workflowFormGroupData, client!, serviceKey!, `techforms/workflow/${workflow_id}/workflow-form/null/workflow-form-group`, "workflow-form-group", formGroup.id, updateWorkflowData);
            }

            //////////////////////// WORKFLOW FORMS IN FORM GROUP ////////////////////////
            const workflowForms = workflowFormGroupData?.workflow_form_id
            if (workflowForms) {
                await WorkflowForms({ id: workflowForms }, access_token_qa, access_token_prod, client!, serviceKey!, workflow_id!, updateWorkflowData);
            }
        }
    }
}