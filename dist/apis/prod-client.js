"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishWorkflowPROD = exports.deletePROD = exports.updatePROD = exports.createPROD = exports.getPROD = exports.loginPROD = void 0;
const axios_1 = __importDefault(require("axios"));
const console_1 = require("console");
const constants_1 = require("../utils/constants");
const data_processing_1 = require("../utils/data-processing");
const replace_utils_1 = require("../utils/replace-utils");
/** Workflow PROD request body: strip nested/relation fields the API rejects. */
const WORKFLOW_PROD_STRIP_KEYS = [
    "client_service",
    "update_workflow_protocol_function",
    "workflow_protocol_duplicity_rule_function_id",
    "workflow_protocol_duplicity_rule_function",
    "get_workflow_protocol_batch_file_function_id",
    "get_workflow_protocol_batch_file_function",
    "show_before_create_protocol_function_id",
    "show_before_create_protocol_function",
    "get_faq_data_function_id",
    "get_faq_data_function",
    "execute_before_create_workflow_protocol_in_batch_function_id",
    "deleted_at",
    "custom_section_protocol_function",
    "bottom_custom_section_protocol_function",
    "top_custom_section_protocol_function",
    "get_protocol_number_on_create_draft_protocol_function",
    "format_products_field_function",
    "update_external_data_with_workflow_protocol_data_function",
    "company_data_form_id",
    "personal_data_form_id",
    "custom_filters",
    "pendency_custom_filters",
    "workflow_group_id",
    "customer_view_form_id",
    "acceptance_term",
    "should_use_has_person_contact_data_filter",
    "should_use_attended_assembly_filter",
    "is_preview_opening",
    "only_owner_can_edit_protocol",
];
const loginPROD = async (client, Service_key, emailLogin, passwordLogin) => {
    var _a, _b, _c, _d;
    try {
        let { data: loginData } = await axios_1.default.post(`${constants_1.urlPROD}/${client}/${Service_key}/authentication/access-session/password`, {
            "login": emailLogin,
            "password": passwordLogin
        }, {
            headers: {
                "Content-Type": "application/json",
            },
        });
        (0, console_1.log)(`${constants_1.cor.Green}Login in PROD Success${constants_1.cor.Reset}`);
        return loginData.access_token;
    }
    catch (error) {
        (0, console_1.log)(`${constants_1.cor.Red}Login in PROD Error: ${((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || ((_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error)}${constants_1.cor.Reset}`);
        throw error;
    }
};
exports.loginPROD = loginPROD;
const getPROD = async (access_token, data, client, Service_key, params, type, id) => {
    var _a, _b, _c, _d;
    try {
        let { data } = await axios_1.default.get(`${constants_1.urlPROD}/${client}/${Service_key}/${params}`, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });
        if (type === "workflow-form" && data === "") {
            return null;
        }
        (0, data_processing_1.deleteKeys)(data, [
            "created_at",
            "updated_at",
            "deleted_at",
            "customer_view_form_id",
            "sla",
            "client_service",
            "workflow_group_item",
            "client_service",
            "icon_id",
            "icon",
            "max_responses",
            "workflow_group",
            "workflow",
            "format_payload_function"
        ]);
        data = (0, replace_utils_1.replaceStringsRecursively)(data, constants_1.replacementRules);
        (0, console_1.log)(`${constants_1.cor.Yellow}Get ${type} ${id} in PROD Success${constants_1.cor.Reset}`);
        if (!data) {
            throw {
                status: 404,
                error: "Data not found",
            };
        }
        return data;
    }
    catch (error) {
        (0, console_1.log)(`${constants_1.cor.Red}Get ${type} ${id} in PROD Error: ${((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || ((_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error)}${constants_1.cor.Reset}`);
        throw error;
    }
};
exports.getPROD = getPROD;
const createPROD = async (access_token, data, client, Service_key, params, type, id, jsonData) => {
    var _a, _b, _c;
    try {
        let payload;
        if (type === "workflow-form") {
            payload = (0, data_processing_1.sanitizeWorkflowFormData)(data);
            // payload.client = client;
            if (payload.title == null || (typeof payload.title === "string" && payload.title.trim().length === 0)) {
                payload.title = "   ";
            }
            if (payload.description == null || (typeof payload.description === "string" && payload.description.trim().length === 0)) {
                payload.description = "   ";
            }
            if (payload.placeholder == null || (typeof payload.placeholder === "string" && payload.placeholder.trim().length === 0)) {
                payload.placeholder = "   ";
            }
            if (payload.required == null || payload.required === undefined || !payload.required) {
                payload.required = false;
            }
            if (payload.index == null || payload.index === undefined) {
                payload.index = 1;
            }
        }
        else if (type === "update-workflow-protocol-function") {
            data.function = jsonData.updateWorkflowProtocolFunction || data.function;
            payload = data;
        }
        else if (type === "workflow") {
            data.flow_form_id = jsonData.flow_form_id || data.flow_form_id;
            data.pendency_custom_filters = jsonData.pendency_custom_filters || data.pendency_custom_filters;
            data.client_service_id = data.client_service_id;
            (0, data_processing_1.deleteKeys)(data, WORKFLOW_PROD_STRIP_KEYS);
            payload = (0, data_processing_1.omitNullProperties)(Object.assign({}, data));
        }
        else if (type === "workflow-step-form") {
            if (data.has_next_workflow_form === null || data.has_previous_workflow_form === null) {
                data.has_next_workflow_form = false;
            }
            payload = data;
        }
        else if (type === "workflow-step") {
            payload = data;
            if (payload.description == null || (typeof payload.description === "string" && payload.description.trim().length === 0)) {
                payload.description = "   ";
            }
        }
        else {
            payload = data;
        }
        payload = (0, replace_utils_1.replaceStringsRecursively)(payload, constants_1.replacementRules);
        let { data: createData } = await axios_1.default.post(`${constants_1.urlPROD}/${client}/${Service_key}/${params}`, payload, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });
        (0, console_1.log)(`${constants_1.cor.Cyan}Created ${type} ${id} in PROD Success${constants_1.cor.Reset}`);
        (0, constants_1.addIdsCreated)(id, type);
        return createData;
    }
    catch (error) {
        (0, console_1.log)(`${constants_1.cor.Red}Created ${type} ${id} in PROD Error: ${JSON.stringify(((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || ((_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.error) || error.message || error.stack || error)}${constants_1.cor.Reset}`);
        throw error;
    }
};
exports.createPROD = createPROD;
const updatePROD = async (access_token, data, client, Service_key, params, type, id, jsonData) => {
    var _a, _b, _c;
    try {
        if (!(0, constants_1.checkIdUpdated)(id)) {
            let payload;
            if (type === "workflow-form") {
                payload = (0, data_processing_1.sanitizeWorkflowFormData)(data);
                // payload.client = client;
                if (payload.title == null || (typeof payload.title === "string" && payload.title.trim().length === 0)) {
                    payload.title = "   ";
                }
                if (payload.description == null || (typeof payload.description === "string" && payload.description.trim().length === 0)) {
                    payload.description = "   ";
                }
                if (payload.placeholder == null || (typeof payload.placeholder === "string" && payload.placeholder.trim().length === 0)) {
                    payload.placeholder = "   ";
                }
                if (payload.required == null || payload.required === undefined || !payload.required) {
                    payload.required = false;
                }
                if (payload.index == null || payload.index === undefined) {
                    payload.index = 1;
                }
            }
            else if (type === "update-workflow-protocol-function") {
                id = "9a37558f-1f11-4544-9a31-754e24883673";
                data.function = jsonData.updateWorkflowProtocolFunction;
                payload = data;
            }
            else if (type === "workflow") {
                payload = {
                    id: data.id,
                    title: data.title,
                    alternative_title: data.alternative_title,
                    description: data.description,
                    execute_before_create_protocol: data.execute_before_create_protocol,
                    execute_filter_workflow_protocols_before_create_draft: data.execute_filter_workflow_protocols_before_create_draft,
                    enabled: data.enabled,
                    flow_form_id: jsonData.flow_form_id || data.flow_form_id,
                    protocol_provider: jsonData.protocol_provider || data.protocol_provider,
                    index: data.index,
                    filters: data.filters,
                    optional_config: data.optional_config,
                    workflow_key: data.workflow_key,
                    get_external_identification_function: data.get_external_identification_function,
                    get_main_user_account_data_function: data.get_main_user_account_data_function,
                    client_service_id: data.client_service_id,
                    update_workflow_protocol_function_id: data.update_workflow_protocol_function_id,
                };
                payload = (0, data_processing_1.omitNullProperties)(payload);
            }
            else if (type === "workflow-step-form") {
                if (data.has_next_workflow_form === null || data.has_previous_workflow_form === null) {
                    data.has_next_workflow_form = false;
                }
                payload = data;
            }
            else if (type === "workflow-step") {
                payload = data;
                if (payload.description == null || (typeof payload.description === "string" && payload.description.trim().length === 0)) {
                    payload.description = "   ";
                }
            }
            else {
                payload = data;
            }
            let { data: updateData } = await axios_1.default.put(`${constants_1.urlPROD}/${client}/${Service_key}/${params}`, payload, {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            });
            payload = (0, replace_utils_1.replaceStringsRecursively)(payload, constants_1.replacementRules);
            (0, console_1.log)(`${constants_1.cor.Green}Updated ${type} ${id} in PROD Success${constants_1.cor.Reset}`);
            (0, constants_1.addIdUpdated)(id, type);
            return updateData;
        }
    }
    catch (error) {
        (0, console_1.log)(`${constants_1.cor.Red}Update ${type} ${id} in PROD Error: ${JSON.stringify(((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || ((_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.error) || error.message || error.stack || error)}${constants_1.cor.Reset}`);
        if ((error === null || error === void 0 ? void 0 : error.status) === 404) {
            (0, exports.createPROD)(access_token, data, client, Service_key, params, type, id, data);
        }
        throw error;
    }
};
exports.updatePROD = updatePROD;
const deletePROD = async (access_token, data, client, Service_key, params, type, id) => {
    var _a, _b, _c, _d;
    try {
        await axios_1.default.delete(`${constants_1.urlPROD}/${client}/${Service_key}/${params}`, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });
        (0, console_1.log)(`${constants_1.cor.Red}Deleted${constants_1.cor.Reset} ${constants_1.cor.Green} ${type} ${id} in PROD Success${constants_1.cor.Reset}`);
    }
    catch (error) {
        (0, console_1.log)(`${constants_1.cor.Red}Delete Workflow Form Group ${id} in PROD Error: ${((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || ((_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error)}${constants_1.cor.Reset}`);
        throw error;
    }
};
exports.deletePROD = deletePROD;
const publishWorkflowPROD = async (access_token, id, client, Service_key, params, type) => {
    var _a, _b, _c, _d;
    try {
        await axios_1.default.post(`${constants_1.urlPROD}/${client}/${Service_key}/${params}/publish`, {
            commentary: "Publicação de esteira"
        }, {
            headers: {
                Authorization: `Bearer ${access_token}`,
                "Content-Type": "application/json",
            },
        });
        (0, console_1.log)(`${constants_1.cor.Orange}Publish ${type} ${id} in PROD Success${constants_1.cor.Reset}`);
    }
    catch (error) {
        (0, console_1.log)(`${constants_1.cor.Red}Publish ${type} ${id} in PROD Error: ${((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || ((_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error)}${constants_1.cor.Reset}`);
        throw error;
    }
};
exports.publishWorkflowPROD = publishWorkflowPROD;
