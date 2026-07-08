import { isNotFoundError } from "../utils/data-processing";
import { createPROD, getPROD, updatePROD } from "../apis/prod-client";
import { getQA } from "../apis/qa-client";
import { Token } from "../utils/types";
import { WorkflowForms } from "./2.1.1_workflow_forms";

export async function WorkflowStepForms(workflowStepFormData: any, access_token_qa: Token, access_token_prod: Token, client: string, serviceKey: string, workflow_id: string, step_id: string, updateWorkflowData: any) {
    //////////////////////// WORKFLOW STEPS FORMS ////////////////////////
    let workflowStepFormExistsInProd = true;

    //////////////////////// WORKFLOW FORMS ////////////////////////
    const workflowFormId = workflowStepFormData?.workflow_form_id;
    const workflowFormReferenceId = workflowStepFormData?.workflow_form_reference_id;

    if (workflowFormId) {
        await WorkflowForms(
            { id: workflowFormId, embedded: workflowStepFormData?.workflow_form },
            access_token_qa,
            access_token_prod,
            client,
            serviceKey,
            workflow_id,
            updateWorkflowData
        );
    }
    if (workflowFormReferenceId && workflowFormReferenceId !== workflowFormId) {
        await WorkflowForms(
            { id: workflowFormReferenceId, embedded: workflowStepFormData?.workflow_form_reference },
            access_token_qa,
            access_token_prod,
            client,
            serviceKey,
            workflow_id,
            updateWorkflowData
        );
    }

    try {
        await getPROD(access_token_prod, undefined, client!, serviceKey!, `techforms/workflow/${workflow_id}/workflow-step/${step_id}/workflow-step-form/${workflowStepFormData.id}`, "workflow-step-form", workflowStepFormData.id);
    } catch (err: any) {
        if (isNotFoundError(err)) {
            workflowStepFormExistsInProd = false;
        } else {
            throw err;
        }
    }

    if (workflowStepFormExistsInProd) {
        await updatePROD(access_token_prod, workflowStepFormData, client!, serviceKey!, `techforms/workflow/${workflow_id}/workflow-step/${step_id}/workflow-step-form/${workflowStepFormData.id}`, "workflow-step-form", workflowStepFormData.id, updateWorkflowData);
    } else {
        await createPROD(access_token_prod, workflowStepFormData, client!, serviceKey!, `techforms/workflow/${workflow_id}/workflow-step/${step_id}/workflow-step-form`, "workflow-step-form", workflowStepFormData.id, updateWorkflowData);
    }

}