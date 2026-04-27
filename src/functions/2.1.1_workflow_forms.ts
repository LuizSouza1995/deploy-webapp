import { createPROD, getPROD, updatePROD } from "../apis/prod-client";
import { getQA } from "../apis/qa-client";
import { Token } from "../utils/types";
import { ClientFunction } from "./3_client_function";

export async function WorkflowForms(workflowForm: any, access_token_qa: Token, access_token_prod: Token, client: string, serviceKey: string, workflow_id: string, updateWorkflowData: any) {
    //////////////////////// WORKFLOW FORMS ////////////////////////
    // Sempre faz GET em QA primeiro para garantir a sequência correta
    const workflowFormId = workflowForm?.id;
    if (!workflowFormId) {
        return;
    }

    const workflowFormData = await getQA(access_token_qa, undefined, client!, serviceKey!, `techforms/workflow-form/${workflowFormId}`, "workflow-form", workflowFormId);

    // Depois faz GET em PROD para verificar se existe
    let workflowFormExistsInProd = true;
    try {
        await getPROD(access_token_prod, undefined, client!, serviceKey!, `techforms/workflow-form/${workflowFormId}`, "workflow-form", workflowFormId);
    } catch (err: any) {
        if (err?.response?.status === 404) {
            workflowFormExistsInProd = false;
        } else {
            throw err;
        }
    }

    // Finalmente faz CREATE ou UPDATE em PROD
    if (workflowFormExistsInProd) {
        await updatePROD(access_token_prod, workflowFormData, client!, serviceKey!, `techforms/workflow-form/${workflowFormId}`, "workflow-form", workflowFormId, updateWorkflowData);
    } else {
        await createPROD(access_token_prod, workflowFormData, client!, serviceKey!, `techforms/workflow-form/${workflowFormId}`, "workflow-form", workflowFormId, updateWorkflowData);
    }
}