const WORKFLOW_FORM_PROD_STRIP_KEYS = [
  "workflow_children_forms",
  "workflow_form",
  "default_workflow_form",
  "workflow_form_father",
  "created_at",
  "updated_at",
  "deleted_at",
  "client_service",
  "format_payload_function",
];

export function sanitizeWorkflowFormData(formData: any): any {
  if (!formData || typeof formData !== "object") return formData;
  const cloned: any = JSON.parse(JSON.stringify(formData));
  deleteKeys(cloned, WORKFLOW_FORM_PROD_STRIP_KEYS);
  const fields = cloned.workflow_form_fields;
  if (Array.isArray(fields)) {
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      if (field && typeof field === "object") {
        if (field.placeholder === undefined || field.placeholder === null || (typeof field.placeholder === "string" && field.placeholder.trim().length === 0)) {
          field.placeholder = "   ";
        }
        if (field.required === null || field.required === undefined) {
          field.required = false;
        }
        if (field.index === null || field.index === undefined) {
          field.index = 1;
        }
        if (field.title === null || field.title === undefined || (typeof field.title === "string" && field.title.trim().length === 0)) {
          field.title = "   ";
        }
        if (field.length === null || field.length === undefined || typeof field.length !== "number") {
          field.length = 0;
        }
      }
    }
  }
  return cloned;
}

export function deleteKeys<T extends Record<string, any>>(obj: T, keys: string[]): T {
  if (!obj) return obj;
  for (const key of keys) {
    if (key in obj) delete (obj as any)[key];
  }
  return obj;
}

/** Workflow-step PROD body: nested relations break PUT (missing workflow_step_id on nested forms). */
export function sanitizeWorkflowStepData(stepData: any): Record<string, any> {
  if (!stepData || typeof stepData !== "object") return stepData;
  const payload: Record<string, any> = {
    title: stepData.title,
    description: stepData.description,
    workflow_step_key: stepData.workflow_step_key,
    index: stepData.index,
    filters: stepData.filters,
    required: stepData.required,
    optional_config: stepData.optional_config,
    pendency_step: stepData.pendency_step,
  };
  if (stepData.workflow_forms_count != null) {
    payload.workflow_forms_count = stepData.workflow_forms_count;
  }
  if (
    payload.description == null ||
    (typeof payload.description === "string" && payload.description.trim().length === 0)
  ) {
    payload.description = "   ";
  }
  return omitNullProperties(payload);
}

/** Workflow-step-form PROD body: only API-accepted fields (see WORKFLOW_STEP_FORM_ENTITY_REFERENCE). */
export function sanitizeWorkflowStepFormData(stepFormData: any): Record<string, any> {
  if (!stepFormData || typeof stepFormData !== "object") return stepFormData;

  const total = stepFormData.total_workflow_step_forms ?? stepFormData.index ?? 1;
  const payload: Record<string, any> = {
    index: stepFormData.index,
    total_workflow_step_forms: total,
  };

  const workflowFormId = stepFormData.workflow_form_id;
  if (workflowFormId != null && String(workflowFormId).trim() !== "") {
    payload.workflow_form_id = workflowFormId;
  }

  const workflowFormReferenceId = stepFormData.workflow_form_reference_id;
  if (workflowFormReferenceId != null && String(workflowFormReferenceId).trim() !== "") {
    payload.workflow_form_reference_id = workflowFormReferenceId;
  }

  if (stepFormData.filters != null && typeof stepFormData.filters === "object") {
    payload.filters = stepFormData.filters;
  }

  if (stepFormData.has_next_workflow_form !== undefined && stepFormData.has_next_workflow_form !== null) {
    payload.has_next_workflow_form = stepFormData.has_next_workflow_form;
  } else {
    payload.has_next_workflow_form = true;
  }

  if (stepFormData.workflow_form_father !== undefined && stepFormData.workflow_form_father !== null) {
    payload.workflow_form_father = stepFormData.workflow_form_father;
  }

  return omitNullProperties(payload);
}

/** WorkflowGroup PROD body: only title (and id on create). See WORKFLOW_GROUP_ENTITY_REFERENCE. */
export function sanitizeWorkflowGroupData(groupData: any, forUpdate = false): Record<string, any> {
  if (!groupData || typeof groupData !== "object") return groupData;
  const payload: Record<string, any> = { title: groupData.title };
  if (!forUpdate && groupData.id != null && String(groupData.id).trim() !== "") {
    payload.id = groupData.id;
  }
  return payload;
}

/** WorkflowGroupItem PROD body: required workflow_group_id, workflow_id, filters. */
export function sanitizeWorkflowGroupItemData(
  itemData: any,
  workflowGroupId?: string
): Record<string, any> {
  if (!itemData || typeof itemData !== "object") return itemData;

  const groupId = workflowGroupId ?? itemData.workflow_group_id;
  const payload: Record<string, any> = {
    workflow_group_id: groupId,
    workflow_id: itemData.workflow_id,
    filters: itemData.filters ?? {},
  };

  if (itemData.icon_id != null && String(itemData.icon_id).trim() !== "") {
    payload.icon_id = itemData.icon_id;
  }

  return omitNullProperties(payload);
}

/** Shallow copy: drops keys whose value is `null` (axios/JSON would send null otherwise). */
export function omitNullProperties(obj: Record<string, any>): Record<string, any> {
  if (!obj || typeof obj !== "object") return obj;
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null) out[key] = value;
  }
  return out;
}

export function isNotFoundError(err: any): boolean {
  return err?.response?.status === 404 || err?.status === 404;
}

/** Coleta ids de formulários filhos aninhados em workflow_children_forms (recursivo). */
export function collectChildFormIdsFromForm(form: any, ids: Set<string> = new Set()): Set<string> {
  if (!form || typeof form !== "object") return ids;
  const children = form.workflow_children_forms;
  if (!Array.isArray(children)) return ids;
  for (const child of children) {
    if (child?.id) {
      ids.add(child.id);
      collectChildFormIdsFromForm(child, ids);
    }
  }
  return ids;
}

/** Coleta ids de filhos a partir do snapshot compilado do workflow (GET workflow após publish). */
export function collectChildFormIdsFromWorkflow(workflow: any): string[] {
  const ids = new Set<string>();
  for (const step of workflow?.workflow_steps || []) {
    for (const stepForm of step?.workflow_step_forms || []) {
      collectChildFormIdsFromForm(stepForm.workflow_form, ids);
    }
  }
  return [...ids];
}