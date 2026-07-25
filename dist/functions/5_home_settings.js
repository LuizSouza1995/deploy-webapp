"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomeSettings = HomeSettings;
const console_1 = require("console");
const prod_client_1 = require("../apis/prod-client");
const qa_client_1 = require("../apis/qa-client");
const constants_1 = require("../utils/constants");
const data_processing_1 = require("../utils/data-processing");
const _3_client_function_1 = require("./3_client_function");
async function HomeSettings(clientServiceId, access_token_qa, access_token_prod, client, serviceKey, updateWorkflowData) {
    var _a, _b, _c;
    if (!clientServiceId || !client || !serviceKey || !constants_1.clientIdQA || !constants_1.clientIdPROD) {
        return;
    }
    const homeSettings = await (0, qa_client_1.listQAHomeSettingsByServiceId)(access_token_qa, client, serviceKey, constants_1.clientIdQA, clientServiceId);
    if (!homeSettings.length) {
        (0, console_1.log)(`${constants_1.cor.Blue}No home-setting configured for client_service_id ${clientServiceId}${constants_1.cor.Reset}`);
        return;
    }
    for (const home of homeSettings) {
        const homeId = home === null || home === void 0 ? void 0 : home.id;
        if (!homeId)
            continue;
        const homeSettingData = await (0, qa_client_1.getQA)(access_token_qa, undefined, client, serviceKey, `client/${constants_1.clientIdQA}/home-setting/${homeId}`, "home-setting", homeId);
        if (!homeSettingData) {
            (0, console_1.log)(`${constants_1.cor.Blue}Home-setting ${homeId} not found in QA${constants_1.cor.Reset}`);
            continue;
        }
        if (homeSettingData.client_function_id) {
            await (0, _3_client_function_1.ClientFunction)(homeSettingData.client_function_id, access_token_qa, access_token_prod, client, serviceKey, updateWorkflowData);
        }
        const onLoadFunctionId = (_a = homeSettingData.optional_config) === null || _a === void 0 ? void 0 : _a.on_load_client_function_id;
        if (onLoadFunctionId) {
            await (0, _3_client_function_1.ClientFunction)(onLoadFunctionId, access_token_qa, access_token_prod, client, serviceKey, updateWorkflowData);
        }
        let homeExistsInProd = true;
        let prodHomeData = null;
        try {
            prodHomeData = await (0, prod_client_1.getPROD)(access_token_prod, undefined, client, serviceKey, `client/${constants_1.clientIdPROD}/home-setting/${homeId}`, "home-setting", homeId);
        }
        catch (err) {
            if ((0, data_processing_1.isNotFoundError)(err)) {
                homeExistsInProd = false;
            }
            else {
                throw err;
            }
        }
        const dataToSync = Object.assign({}, homeSettingData);
        if (homeExistsInProd && prodHomeData) {
            if (!((_b = dataToSync.name) === null || _b === void 0 ? void 0 : _b.trim()))
                dataToSync.name = prodHomeData.name;
            if (!((_c = dataToSync.description) === null || _c === void 0 ? void 0 : _c.trim()))
                dataToSync.description = prodHomeData.description;
        }
        if (homeExistsInProd) {
            await (0, prod_client_1.updatePROD)(access_token_prod, dataToSync, client, serviceKey, `client/${constants_1.clientIdPROD}/home-setting/${homeId}`, "home-setting", homeId, updateWorkflowData);
        }
        else {
            await (0, prod_client_1.createPROD)(access_token_prod, dataToSync, client, serviceKey, `client/${constants_1.clientIdPROD}/home-setting`, "home-setting", homeId, updateWorkflowData);
        }
    }
}
