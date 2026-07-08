import { createPROD, getPROD, updatePROD } from "../apis/prod-client";
import { getQA, listQAChildFormsByFatherId } from "../apis/qa-client";
import { collectChildFormIdsFromForm, isNotFoundError } from "../utils/data-processing";
import { Token } from "../utils/types";

async function discoverChildFormIds(
  workflowFormData: any,
  access_token_qa: Token,
  client: string,
  serviceKey: string,
  parentId: string,
  embeddedForm?: any
): Promise<string[]> {
  const ids = collectChildFormIdsFromForm(workflowFormData);
  if (embeddedForm) {
    collectChildFormIdsFromForm(embeddedForm, ids);
  }

  const listedChildren = await listQAChildFormsByFatherId(access_token_qa, client, serviceKey, parentId);
  for (const child of listedChildren) {
    if (child?.id) {
      ids.add(child.id);
    }
  }

  ids.delete(parentId);
  return [...ids];
}

export async function WorkflowForms(
  workflowForm: any,
  access_token_qa: Token,
  access_token_prod: Token,
  client: string,
  serviceKey: string,
  workflow_id: string,
  updateWorkflowData: any
) {
  //////////////////////// WORKFLOW FORMS ////////////////////////
  const workflowFormId = workflowForm?.id;
  if (!workflowFormId) {
    return;
  }

  const workflowFormData = await getQA(
    access_token_qa,
    undefined,
    client!,
    serviceKey!,
    `techforms/workflow-form/${workflowFormId}`,
    "workflow-form",
    workflowFormId
  );
  if (!workflowFormData) {
    return;
  }

  let workflowFormExistsInProd = true;
  try {
    await getPROD(
      access_token_prod,
      undefined,
      client!,
      serviceKey!,
      `techforms/workflow-form/${workflowFormId}`,
      "workflow-form",
      workflowFormId
    );
  } catch (err: any) {
    if (isNotFoundError(err)) {
      workflowFormExistsInProd = false;
    } else {
      throw err;
    }
  }

  // Pai antes dos filhos (webapp-forms)
  if (workflowFormExistsInProd) {
    await updatePROD(
      access_token_prod,
      workflowFormData,
      client!,
      serviceKey!,
      `techforms/workflow-form/${workflowFormId}`,
      "workflow-form",
      workflowFormId,
      updateWorkflowData
    );
  } else {
    await createPROD(
      access_token_prod,
      workflowFormData,
      client!,
      serviceKey!,
      `techforms/workflow-form/${workflowFormId}`,
      "workflow-form",
      workflowFormId,
      updateWorkflowData
    );
  }

  const childFormIds = await discoverChildFormIds(
    workflowFormData,
    access_token_qa,
    client,
    serviceKey,
    workflowFormId,
    workflowForm?.embedded
  );

  for (const childFormId of childFormIds) {
    await WorkflowForms(
      { id: childFormId },
      access_token_qa,
      access_token_prod,
      client,
      serviceKey,
      workflow_id,
      updateWorkflowData
    );
  }
}
