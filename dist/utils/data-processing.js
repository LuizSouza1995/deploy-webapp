"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeWorkflowFormData = sanitizeWorkflowFormData;
exports.deleteKeys = deleteKeys;
exports.sanitizeWorkflowStepData = sanitizeWorkflowStepData;
exports.sanitizeWorkflowStepFormData = sanitizeWorkflowStepFormData;
exports.sanitizeWorkflowGroupData = sanitizeWorkflowGroupData;
exports.sanitizeWorkflowGroupItemData = sanitizeWorkflowGroupItemData;
exports.omitNullProperties = omitNullProperties;
exports.isNotFoundError = isNotFoundError;
exports.collectChildFormIdsFromForm = collectChildFormIdsFromForm;
exports.collectChildFormIdsFromWorkflow = collectChildFormIdsFromWorkflow;
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
function sanitizeWorkflowFormData(formData) {
    if (!formData || typeof formData !== "object")
        return formData;
    const cloned = JSON.parse(JSON.stringify(formData));
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
function deleteKeys(obj, keys) {
    if (!obj)
        return obj;
    for (const key of keys) {
        if (key in obj)
            delete obj[key];
    }
    return obj;
}
/** Workflow-step PROD body: nested relations break PUT (missing workflow_step_id on nested forms). */
function sanitizeWorkflowStepData(stepData) {
    if (!stepData || typeof stepData !== "object")
        return stepData;
    const payload = {
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
    if (payload.description == null ||
        (typeof payload.description === "string" && payload.description.trim().length === 0)) {
        payload.description = "   ";
    }
    return omitNullProperties(payload);
}
/** Workflow-step-form PROD body: only API-accepted fields (see WORKFLOW_STEP_FORM_ENTITY_REFERENCE). */
function sanitizeWorkflowStepFormData(stepFormData) {
    var _a, _b;
    if (!stepFormData || typeof stepFormData !== "object")
        return stepFormData;
    const total = (_b = (_a = stepFormData.total_workflow_step_forms) !== null && _a !== void 0 ? _a : stepFormData.index) !== null && _b !== void 0 ? _b : 1;
    const payload = {
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
    }
    else {
        payload.has_next_workflow_form = true;
    }
    if (stepFormData.workflow_form_father !== undefined && stepFormData.workflow_form_father !== null) {
        payload.workflow_form_father = stepFormData.workflow_form_father;
    }
    return omitNullProperties(payload);
}
/** WorkflowGroup PROD body: only title (and id on create). See WORKFLOW_GROUP_ENTITY_REFERENCE. */
function sanitizeWorkflowGroupData(groupData, forUpdate = false) {
    if (!groupData || typeof groupData !== "object")
        return groupData;
    const payload = { title: groupData.title };
    if (!forUpdate && groupData.id != null && String(groupData.id).trim() !== "") {
        payload.id = groupData.id;
    }
    return payload;
}
/** WorkflowGroupItem PROD body: required workflow_group_id, workflow_id, filters. */
function sanitizeWorkflowGroupItemData(itemData, workflowGroupId) {
    var _a;
    if (!itemData || typeof itemData !== "object")
        return itemData;
    const groupId = workflowGroupId !== null && workflowGroupId !== void 0 ? workflowGroupId : itemData.workflow_group_id;
    const payload = {
        workflow_group_id: groupId,
        workflow_id: itemData.workflow_id,
        filters: (_a = itemData.filters) !== null && _a !== void 0 ? _a : {},
    };
    if (itemData.icon_id != null && String(itemData.icon_id).trim() !== "") {
        payload.icon_id = itemData.icon_id;
    }
    return omitNullProperties(payload);
}
/** Shallow copy: drops keys whose value is `null` (axios/JSON would send null otherwise). */
function omitNullProperties(obj) {
    if (!obj || typeof obj !== "object")
        return obj;
    const out = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== null)
            out[key] = value;
    }
    return out;
}
function isNotFoundError(err) {
    var _a;
    return ((_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.status) === 404 || (err === null || err === void 0 ? void 0 : err.status) === 404;
}
/** Coleta ids de formulários filhos aninhados em workflow_children_forms (recursivo). */
function collectChildFormIdsFromForm(form, ids = new Set()) {
    if (!form || typeof form !== "object")
        return ids;
    const children = form.workflow_children_forms;
    if (!Array.isArray(children))
        return ids;
    for (const child of children) {
        if (child === null || child === void 0 ? void 0 : child.id) {
            ids.add(child.id);
            collectChildFormIdsFromForm(child, ids);
        }
    }
    return ids;
}
/** Coleta ids de filhos a partir do snapshot compilado do workflow (GET workflow após publish). */
function collectChildFormIdsFromWorkflow(workflow) {
    const ids = new Set();
    for (const step of (workflow === null || workflow === void 0 ? void 0 : workflow.workflow_steps) || []) {
        for (const stepForm of (step === null || step === void 0 ? void 0 : step.workflow_step_forms) || []) {
            collectChildFormIdsFromForm(stepForm.workflow_form, ids);
        }
    }
    return [...ids];
}
