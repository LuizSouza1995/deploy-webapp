"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishWorkflowQA = exports.getQA = exports.loginQA = void 0;
const axios_1 = __importDefault(require("axios"));
const console_1 = require("console");
const constants_1 = require("../utils/constants");
const data_processing_1 = require("../utils/data-processing");
const replace_utils_1 = require("../utils/replace-utils");
const loginQA = async (client, Service_key, emailLogin, passwordLogin) => {
    var _a, _b, _c, _d;
    try {
        let { data: loginData } = await axios_1.default.post(`${constants_1.urlQA}/${client}/${Service_key}/authentication/access-session/password`, {
            "login": emailLogin,
            "password": passwordLogin
        }, {
            headers: {
                "Content-Type": "application/json",
            },
        });
        (0, console_1.log)(`${constants_1.cor.Green}Login in QA Success${constants_1.cor.Reset}`);
        return loginData.access_token;
    }
    catch (error) {
        (0, console_1.log)(`${constants_1.cor.Red}Login in QA Error: ${((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || ((_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error)}${constants_1.cor.Reset}`);
        return null;
    }
};
exports.loginQA = loginQA;
const getQA = async (access_token, data, client, Service_key, params, type, id) => {
    var _a, _b, _c, _d;
    try {
        let { data } = await axios_1.default.get(`${constants_1.urlQA}/${client}/${Service_key}/${params}`, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });
        (0, data_processing_1.deleteKeys)(data, [
            "created_at",
            "updated_at",
            "deleted_at",
            "customer_view_form_id",
            "sla",
            "client_service",
            "client_service",
            "icon_id",
            "icon",
            "max_responses",
            "workflow_group",
            "workflow",
            "workflow_form",
            "default_workflow_form",
            "format_payload_function"
        ]);
        data = type === "workflow-form"
            ? (0, replace_utils_1.replaceStringsRecursivelyWithoutUrl)(data, constants_1.replacementRules, constants_1.urlQA)
            : (0, replace_utils_1.replaceStringsRecursively)(data, constants_1.replacementRules);
        if (data.filters === null) {
            data.filters = {};
        }
        (0, console_1.log)(`${constants_1.cor.White}Get ${type} ${id} in QA Success${constants_1.cor.Reset}`);
        return data;
    }
    catch (error) {
        (0, console_1.log)(`${constants_1.cor.Red}Get ${type} ${id} in QA Error: ${((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || ((_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error)}${constants_1.cor.Reset}`);
        return null;
    }
};
exports.getQA = getQA;
const publishWorkflowQA = async (access_token, id, client, Service_key, params, type) => {
    var _a, _b, _c, _d;
    try {
        await axios_1.default.post(`${constants_1.urlQA}/${client}/${Service_key}/${params}/publish`, {
            commentary: "Publicação de esteira"
        }, {
            headers: {
                Authorization: `Bearer ${access_token}`,
                "Content-Type": "application/json",
            },
        });
        (0, console_1.log)(`${constants_1.cor.Purple}Publish ${type} ${id} in QA Success${constants_1.cor.Reset}`);
    }
    catch (error) {
        (0, console_1.log)(`${constants_1.cor.Red}Publish ${type} ${id} in QA Error: ${((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || ((_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error)}${constants_1.cor.Reset}`);
        throw error;
    }
};
exports.publishWorkflowQA = publishWorkflowQA;
