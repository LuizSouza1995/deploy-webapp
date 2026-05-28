export function sanitizeWorkflowFormData(formData: any): any {
  if (!formData || typeof formData !== "object") return formData;
  const cloned: any = JSON.parse(JSON.stringify(formData));
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
  if (
    payload.description == null ||
    (typeof payload.description === "string" && payload.description.trim().length === 0)
  ) {
    payload.description = "   ";
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