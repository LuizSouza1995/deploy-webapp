import axios from "axios";
import { log } from "console";
import { cor, replacementRules, urlPROD, urlQA, addIdUpdated, addIdsCreated, checkIdUpdated } from "../utils/constants";
import { deleteKeys, omitNullProperties, sanitizeWorkflowFormData, sanitizeWorkflowStepData } from "../utils/data-processing";
import { Token } from "../utils/types";
import { replaceStringsRecursively } from "../utils/replace-utils";

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

export const loginPROD = async (client: string, Service_key: string, emailLogin: string, passwordLogin: string) => {
  try {
    let { data: loginData } = await axios.post(
      `${urlPROD}/${client}/${Service_key}/authentication/access-session/password`,
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
    log(`${cor.Green}Login in PROD Success${cor.Reset}`);
    return loginData.access_token;
  } catch (error: any) {
    log(`${cor.Red}Login in PROD Error: ${error.response?.data?.message || error.response?.data?.error}${cor.Reset}`);
    throw error;
  }
};

export const getPROD = async (access_token: Token, data: any, client: string, Service_key: string, params: string, type: string, id: string) => {
  try {
    let { data } = await axios.get(
      `${urlPROD}/${client}/${Service_key}/${params}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (type === "workflow-form" && data === "") {
      return null;
    }

    deleteKeys(data, [
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

    data = replaceStringsRecursively(data, replacementRules);

    log(`${cor.Yellow}Get ${type} ${id} in PROD Success${cor.Reset}`);
    if (!data) {
      throw {
        status: 404,
        error: "Data not found",
      }
    }
    return data;
  } catch (error: any) {
    log(`${cor.Red}Get ${type} ${id} in PROD Error: ${error.response?.data?.message || error.response?.data?.error}${cor.Reset}`);
    throw error;
  }
};

export const createPROD = async (access_token: Token, data: any, client: string, Service_key: string, params: string, type: string, id: string, jsonData: any) => {
  try {
    let payload;
    if (type === "workflow-form") {
      payload = sanitizeWorkflowFormData(data);
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
    } else if (type === "update-workflow-protocol-function") {
      data.function = jsonData.updateWorkflowProtocolFunction || data.function
      payload = data;
    } else if (type === "workflow") {
      data.flow_form_id = jsonData.flow_form_id || data.flow_form_id
      data.pendency_custom_filters = jsonData.pendency_custom_filters || data.pendency_custom_filters
      data.client_service_id = data.client_service_id
      deleteKeys(data, WORKFLOW_PROD_STRIP_KEYS);
      payload = omitNullProperties({ ...data });
    } else if (type === "workflow-step-form") {
      if (data.has_next_workflow_form === null || data.has_previous_workflow_form === null) {
        data.has_next_workflow_form = false;
      }
      payload = data;
    } else if (type === "workflow-step") {
      payload = sanitizeWorkflowStepData(data);
    } else {
      payload = data;
    }

    payload = replaceStringsRecursively(payload, replacementRules);

    let { data: createData } = await axios.post(
      `${urlPROD}/${client}/${Service_key}/${params}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    log(`${cor.Cyan}Created ${type} ${id} in PROD Success${cor.Reset}`);
    addIdsCreated(id, type);
    return createData
  } catch (error: any) {
    log(`${cor.Red}Created ${type} ${id} in PROD Error: ${JSON.stringify(error.response?.data || error.response?.data?.error || error.message || error.stack || error)}${cor.Reset}`);
    throw error;
  }
};

export const updatePROD = async (access_token: Token, data: any, client: string, Service_key: string, params: string, type: string, id: string, jsonData: any) => {
  try {
    if (!checkIdUpdated(id)) {
      let payload;
      if (type === "workflow-form") {
        payload = sanitizeWorkflowFormData(data);
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
      } else if (type === "update-workflow-protocol-function") {
        id = "9a37558f-1f11-4544-9a31-754e24883673"
        data.function = jsonData.updateWorkflowProtocolFunction
        payload = data;
      } else if (type === "workflow") {
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
          client_service_id: data.client_service_id === "2ace827e-3378-4c1b-a5bc-5174109e6892" ? "8c8ab6bf-c907-4e3a-bb57-5e546dd5e729" : data.client_service_id,
          // client_service_id: "8c8ab6bf-c907-4e3a-bb57-5e546dd5e729",
          update_workflow_protocol_function_id: data.update_workflow_protocol_function_id,
        };
        payload = omitNullProperties(payload);
      } else if (type === "workflow-step-form") {
        if (data.has_next_workflow_form === null || data.has_previous_workflow_form === null) {
          data.has_next_workflow_form = false;
        }
        payload = data;
      } else if (type === "workflow-step") {
        payload = sanitizeWorkflowStepData(data);
      } else {
        payload = data;
      }

      payload = replaceStringsRecursively(payload, replacementRules);

      let { data: updateData } = await axios.put(
        `${urlPROD}/${client}/${Service_key}/${params}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      log(`${cor.Green}Updated ${type} ${id} in PROD Success${cor.Reset}`);
      addIdUpdated(id, type);
      return updateData;
    }
  } catch (error: any) {
    log(`${cor.Red}Update ${type} ${id} in PROD Error: ${JSON.stringify(error.response?.data || error.response?.data?.error || error.message || error.stack || error)}${cor.Reset}`);
    if (error?.status === 404) {
      createPROD(access_token, data, client, Service_key, params, type, id, data);
    }
    throw error;
  }
};

export const deletePROD = async (access_token: Token, data: any, client: string, Service_key: string, params: string, type: string, id: string) => {
  try {
    await axios.delete(
      `${urlPROD}/${client}/${Service_key}/${params}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );
    log(`${cor.Red}Deleted${cor.Reset} ${cor.Green} ${type} ${id} in PROD Success${cor.Reset}`);
  } catch (error: any) {
    log(`${cor.Red}Delete Workflow Form Group ${id} in PROD Error: ${error.response?.data?.message || error.response?.data?.error}${cor.Reset}`);
    throw error;
  }
};

export const publishWorkflowPROD = async (access_token: Token, id: string, client: string, Service_key: string, params: string, type: string) => {
  try {
    await axios.post(
      `${urlPROD}/${client}/${Service_key}/${params}/publish`,
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
    log(`${cor.Orange}Publish ${type} ${id} in PROD Success${cor.Reset}`);
  } catch (error: any) {
    log(`${cor.Red}Publish ${type} ${id} in PROD Error: ${error.response?.data?.message || error.response?.data?.error}${cor.Reset}`);
    throw error;
  }
}