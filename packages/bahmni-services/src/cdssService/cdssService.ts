import { Bundle } from 'fhir/r4';
import { post } from '../api';
import { generateUUID } from '../utils/utils';
import {
  CDSSServerConfig,
  CDSSServiceConfig,
  CDSSRule,
  CDSCard,
  CDSHooksRequest,
  CDSHooksResponse,
  CDSSContext,
  ContextResourceMap,
} from './models';

export const findCdsServiceConfig = (
  serversConfig: CDSSServerConfig[],
  serverName: string,
  serviceName: string,
): {
  serverConfig: CDSSServerConfig;
  serviceConfig: CDSSServiceConfig;
} => {
  const serverConfig = serversConfig.find((s) => s.server === serverName);

  if (!serverConfig) {
    throw new Error(`CDSS server "${serverName}" not found in configuration`);
  }

  const serviceConfig = serverConfig.services.find(
    (svc) => svc.name === serviceName,
  );

  if (!serviceConfig) {
    throw new Error(
      `CDSS service "${serviceName}" not found in server "${serverName}"`,
    );
  }

  return { serverConfig, serviceConfig };
};

export const buildContextFromResourceMap = (
  bundle: Bundle,
  resourceMap?: ContextResourceMap[],
): Record<string, unknown> => {
  if (!resourceMap || resourceMap.length === 0) {
    return {};
  }

  const contextResources: Record<string, unknown> = {};

  resourceMap.forEach((mapping) => {
    const filteredEntries =
      bundle.entry?.filter(
        (entry) => entry.resource?.resourceType === mapping.type,
      ) ?? [];

    if (filteredEntries.length > 0) {
      contextResources[mapping.attribute] = {
        resourceType: 'Bundle',
        type: 'collection',
        entry: filteredEntries,
      };
    }
  });

  return contextResources;
};

export const invokeCDSSRule = async (
  serversConfig: CDSSServerConfig[],
  rule: CDSSRule,
  context: CDSSContext,
  dataBundle: Bundle,
): Promise<CDSCard[]> => {
  const config = findCdsServiceConfig(serversConfig, rule.server, rule.service);

  const { serverConfig, serviceConfig } = config;

  const filteredContext = buildContextFromResourceMap(
    dataBundle,
    serviceConfig.contextResourceMap,
  );

  const apiUrl = `${serverConfig.url}/${serviceConfig.name}`;

  const requestBody: CDSHooksRequest = {
    hook: serviceConfig.name,
    hookInstance: generateUUID(),
    context: {
      ...filteredContext,
      patientId: context.patientId,
      ...(context.visitId && { visitId: context.visitId }),
      ...(context.episodeId && { episodeId: context.episodeId }),
    },
  };

  if (serviceConfig.prefetch) {
    requestBody.prefetch = serviceConfig.prefetch;
  }

  const responseData = await post<CDSHooksResponse, CDSHooksRequest>(
    apiUrl,
    requestBody,
  );

  return responseData.cards || [];
};
