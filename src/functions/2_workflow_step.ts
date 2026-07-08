import { isNotFoundError } from "../utils/data-processing";
import { createPROD, getPROD, updatePROD } from "../apis/prod-client";
import { getQA } from "../apis/qa-client";
import { Token } from "../utils/types";
import { WorkflowStepForms } from "./2.1_workflow_step_forms";

export async function WorkflowSteps(workflowSteps: any, access_token_qa: Token, access_token_prod: Token, client: string | undefined, serviceKey: string | undefined, workflow_id: string | undefined, step_id: string | undefined, updateWorkflowData: any) {
    if (workflowSteps) {
        // console.log(workflowSteps.map((step: any) => step.id));
        for (const step of workflowSteps) {
            //////////////////////// WORKFLOW STEPS ////////////////////////
            const workflowStepData = await getQA(access_token_qa, undefined, client!, serviceKey!, `techforms/workflow/${workflow_id}/workflow-step/${step.id}`, "workflow-step", step.id);
            let workflowStepExistsInProd = true;
            try {
                await getPROD(access_token_prod, undefined, client!, serviceKey!, `techforms/workflow/${workflow_id}/workflow-step/${step.id}`, "workflow-step", step.id);
            } catch (err: any) {
                if (isNotFoundError(err)) {
                    workflowStepExistsInProd = false;
                } else {
                    throw err;
                }
            }

            if (workflowStepExistsInProd) {
                await updatePROD(access_token_prod, workflowStepData, client!, serviceKey!, `techforms/workflow/${workflow_id}/workflow-step/${step.id}`, "workflow-step", step.id, updateWorkflowData);
            } else {
                await createPROD(access_token_prod, workflowStepData, client!, serviceKey!, `techforms/workflow/${workflow_id}/workflow-step/${step.id}`, "workflow-step", step.id, updateWorkflowData);
            }

            //////////////////////// WORKFLOW STEPS FORMS ////////////////////////
            const workflowStepsForms = workflowStepData?.workflow_step_forms ?? [];
            for (const stepForm of workflowStepsForms) {
                const workflowStepFormData = await getQA(access_token_qa, undefined, client!, serviceKey!, `techforms/workflow/${workflow_id}/workflow-step/${step.id}/workflow-step-form/${stepForm.id}`, "workflow-step-form", stepForm.id);
                await WorkflowStepForms(workflowStepFormData, access_token_qa, access_token_prod, client!, serviceKey!, workflow_id!, step.id, updateWorkflowData);
            }

        }
    }
}