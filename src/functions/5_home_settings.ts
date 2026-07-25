import { log } from "console";
import { createPROD, getPROD, updatePROD } from "../apis/prod-client";
import { getQA, listQAHomeSettingsByServiceId } from "../apis/qa-client";
import { clientIdPROD, clientIdQA, cor } from "../utils/constants";
import { isNotFoundError } from "../utils/data-processing";
import { Token } from "../utils/types";
import { ClientFunction } from "./3_client_function";

export async function HomeSettings(
  clientServiceId: string | undefined,
  access_token_qa: Token,
  access_token_prod: Token,
  client: string | undefined,
  serviceKey: string | undefined,
  updateWorkflowData: any
) {
  if (!clientServiceId || !client || !serviceKey || !clientIdQA || !clientIdPROD) {
    return;
  }

  const homeSettings = await listQAHomeSettingsByServiceId(
    access_token_qa,
    client,
    serviceKey,
    clientIdQA,
    clientServiceId
  );

  if (!homeSettings.length) {
    log(`${cor.Blue}No home-setting configured for client_service_id ${clientServiceId}${cor.Reset}`);
    return;
  }

  for (const home of homeSettings) {
    const homeId = home?.id;
    if (!homeId) continue;

    const homeSettingData = await getQA(
      access_token_qa,
      undefined,
      client,
      serviceKey,
      `client/${clientIdQA}/home-setting/${homeId}`,
      "home-setting",
      homeId
    );

    if (!homeSettingData) {
      log(`${cor.Blue}Home-setting ${homeId} not found in QA${cor.Reset}`);
      continue;
    }

    if (homeSettingData.client_function_id) {
      await ClientFunction(
        homeSettingData.client_function_id,
        access_token_qa,
        access_token_prod,
        client,
        serviceKey,
        updateWorkflowData
      );
    }

    const onLoadFunctionId = homeSettingData.optional_config?.on_load_client_function_id;
    if (onLoadFunctionId) {
      await ClientFunction(
        onLoadFunctionId,
        access_token_qa,
        access_token_prod,
        client,
        serviceKey,
        updateWorkflowData
      );
    }

    let homeExistsInProd = true;
    let prodHomeData: any = null;
    try {
      prodHomeData = await getPROD(
        access_token_prod,
        undefined,
        client,
        serviceKey,
        `client/${clientIdPROD}/home-setting/${homeId}`,
        "home-setting",
        homeId
      );
    } catch (err: any) {
      if (isNotFoundError(err)) {
        homeExistsInProd = false;
      } else {
        throw err;
      }
    }

    const dataToSync = { ...homeSettingData };
    if (homeExistsInProd && prodHomeData) {
      if (!dataToSync.name?.trim()) dataToSync.name = prodHomeData.name;
      if (!dataToSync.description?.trim()) dataToSync.description = prodHomeData.description;
    }

    if (homeExistsInProd) {
      await updatePROD(
        access_token_prod,
        dataToSync,
        client,
        serviceKey,
        `client/${clientIdPROD}/home-setting/${homeId}`,
        "home-setting",
        homeId,
        updateWorkflowData
      );
    } else {
      await createPROD(
        access_token_prod,
        dataToSync,
        client,
        serviceKey,
        `client/${clientIdPROD}/home-setting`,
        "home-setting",
        homeId,
        updateWorkflowData
      );
    }
  }
}
