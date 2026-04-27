import axios from "axios";
import { log } from "console";
import { cor, replacementRules, urlQA } from "../utils/constants";
import { deleteKeys } from "../utils/data-processing";
import { Token } from "../utils/types";
import { replaceStringsRecursively, replaceStringsRecursivelyWithoutUrl } from "../utils/replace-utils";

export const loginQA = async (client: string, Service_key: string, emailLogin: string, passwordLogin: string) => {
    try {
        let { data: loginData } = await axios.post(
            `${urlQA}/${client}/${Service_key}/authentication/access-session/password`,
            {
                "login": emailLogin,
                "password": passwordLogin
            },
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        log(`${cor.Green}Login in QA Success${cor.Reset}`);
        return loginData.access_token;
    } catch (error: any) {
        log(`${cor.Red}Login in QA Error: ${error.response?.data?.message || error.response?.data?.error}${cor.Reset}`);
        return null;
    }
};

export const getQA = async (access_token: Token, data: any, client: string, Service_key: string, params: string, type: string, id: string) => {
    try {
        let { data } = await axios.get(
            `${urlQA}/${client}/${Service_key}/${params}`,
            {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }
        );

        deleteKeys(data, [
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
            ? replaceStringsRecursivelyWithoutUrl(data, replacementRules, urlQA)
            : replaceStringsRecursively(data, replacementRules);

        if (data.filters === null) {
            data.filters = {};
        }

        log(`${cor.White}Get ${type} ${id} in QA Success${cor.Reset}`);
        return data;
    } catch (error: any) {
        log(`${cor.Red}Get ${type} ${id} in QA Error: ${error.response?.data?.message || error.response?.data?.error}${cor.Reset}`);
        return null;
    }
};

export const publishWorkflowQA = async (access_token: Token, id: string, client: string, Service_key: string, params: string, type: string) => {
    try {
        await axios.post(
            `${urlQA}/${client}/${Service_key}/${params}/publish`,
            {
                commentary: "Publicação de esteira"
            },
            {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    "Content-Type": "application/json",
                },
            }
        );
        log(`${cor.Purple}Publish ${type} ${id} in QA Success${cor.Reset}`);
    } catch (error: any) {
        log(`${cor.Red}Publish ${type} ${id} in QA Error: ${error.response?.data?.message || error.response?.data?.error}${cor.Reset}`);
        throw error;
    }
}