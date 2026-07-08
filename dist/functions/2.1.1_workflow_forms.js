"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowForms = WorkflowForms;
const prod_client_1 = require("../apis/prod-client");
const qa_client_1 = require("../apis/qa-client");
const data_processing_1 = require("../utils/data-processing");
async function discoverChildFormIds(workflowFormData, access_token_qa, client, serviceKey, parentId, embeddedForm) {
    const ids = (0, data_processing_1.collectChildFormIdsFromForm)(workflowFormData);
    if (embeddedForm) {
        (0, data_processing_1.collectChildFormIdsFromForm)(embeddedForm, ids);
    }
    const listedChildren = await (0, qa_client_1.listQAChildFormsByFatherId)(access_token_qa, client, serviceKey, parentId);
    for (const child of listedChildren) {
        if (child === null || child === void 0 ? void 0 : child.id) {
            ids.add(child.id);
        }
    }
    ids.delete(parentId);
    return [...ids];
}
async function WorkflowForms(workflowForm, access_token_qa, access_token_prod, client, serviceKey, workflow_id, updateWorkflowData) {
    //////////////////////// WORKFLOW FORMS ////////////////////////
    const workflowFormId = workflowForm === null || workflowForm === void 0 ? void 0 : workflowForm.id;
    if (!workflowFormId) {
        return;
    }
    const workflowFormData = await (0, qa_client_1.getQA)(access_token_qa, undefined, client, serviceKey, `techforms/workflow-form/${workflowFormId}`, "workflow-form", workflowFormId);
    if (!workflowFormData) {
        return;
    }
    let workflowFormExistsInProd = true;
    try {
        await (0, prod_client_1.getPROD)(access_token_prod, undefined, client, serviceKey, `techforms/workflow-form/${workflowFormId}`, "workflow-form", workflowFormId);
    }
    catch (err) {
        if ((0, data_processing_1.isNotFoundError)(err)) {
            workflowFormExistsInProd = false;
        }
        else {
            throw err;
        }
    }
    // Pai antes dos filhos (webapp-forms)
    if (workflowFormExistsInProd) {
        await (0, prod_client_1.updatePROD)(access_token_prod, workflowFormData, client, serviceKey, `techforms/workflow-form/${workflowFormId}`, "workflow-form", workflowFormId, updateWorkflowData);
    }
    else {
        await (0, prod_client_1.createPROD)(access_token_prod, workflowFormData, client, serviceKey, `techforms/workflow-form/${workflowFormId}`, "workflow-form", workflowFormId, updateWorkflowData);
    }
    const childFormIds = await discoverChildFormIds(workflowFormData, access_token_qa, client, serviceKey, workflowFormId, workflowForm === null || workflowForm === void 0 ? void 0 : workflowForm.embedded);
    for (const childFormId of childFormIds) {
        await WorkflowForms({ id: childFormId }, access_token_qa, access_token_prod, client, serviceKey, workflow_id, updateWorkflowData);
    }
}
