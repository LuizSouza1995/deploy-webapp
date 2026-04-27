"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeWorkflowFormData = sanitizeWorkflowFormData;
exports.deleteKeys = deleteKeys;
exports.omitNullProperties = omitNullProperties;
function sanitizeWorkflowFormData(formData) {
    if (!formData || typeof formData !== "object")
        return formData;
    const cloned = JSON.parse(JSON.stringify(formData));
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
