import { ValueSet, ValueSetExpansionContains } from 'fhir/r4';
import i18next from 'i18next';
import { get } from '../api';
import { searchFHIRConceptsByName } from '../conceptService';
import { getServiceRequests } from '../orderRequestService';
import {
  ALL_ORDERABLES_CONCEPT_NAME,
  ORDER_TYPE_URL,
  PANEL_CONCEPT_CLASS_NAME,
  FHIR_CONCEPT_CLASS_EXTENSION_URL,
} from './constants';
import {
  ExistingServiceRequest,
  FlattenedInvestigations,
  OrderType,
  OrderTypeResponse,
} from './model';

const fetchInvestigations = async (): Promise<ValueSet> => {
  return await searchFHIRConceptsByName(ALL_ORDERABLES_CONCEPT_NAME);
};

// TODO: Optimize by caching concept classes, using Service Workers
export const getOrderTypes = async (): Promise<OrderTypeResponse> => {
  return await get(ORDER_TYPE_URL);
};

const getInvestigationDisplay = (
  investigation: ValueSetExpansionContains,
): string => {
  let investigationDisplay = investigation.display ?? 'Unknown investigation';
  if (getConceptClassName(investigation) === PANEL_CONCEPT_CLASS_NAME) {
    investigationDisplay += ` (${i18next.t('INVESTIGATION_PANEL')})`;
  }
  return investigationDisplay;
};
const flattenOrderType = (
  orderTypeResponse: OrderTypeResponse,
): Map<string, OrderType> => {
  const orderTypeMap = new Map<string, OrderType>();
  orderTypeResponse.results.forEach((orderType) => {
    orderType.conceptClasses.forEach((conceptClass) => {
      orderTypeMap.set(conceptClass.name, orderType);
    });
  });
  return orderTypeMap;
};

const getConceptClassName = (
  investigation: ValueSetExpansionContains,
): string => {
  const extension = investigation.extension?.find(
    (ext) => ext.url === FHIR_CONCEPT_CLASS_EXTENSION_URL,
  );
  return extension ? (extension.valueString ?? '') : '';
};

const flattenInvestigations = (
  valueSet: ValueSet,
  orderTypeClassMap: Map<string, OrderType>,
): FlattenedInvestigations[] => {
  const results: FlattenedInvestigations[] = [];

  if (
    !valueSet.expansion?.contains ||
    valueSet.expansion.contains.length === 0
  ) {
    return results;
  }
  if (orderTypeClassMap.size === 0) {
    return results;
  }

  valueSet.expansion.contains.forEach((topLevelCategory) => {
    topLevelCategory.contains?.forEach((subCategory) => {
      subCategory.contains?.forEach((investigation) => {
        const investigationConceptClass = getConceptClassName(investigation);
        const orderType = orderTypeClassMap.get(investigationConceptClass);
        if (!orderType) {
          return;
        }
        const isAlreadyAdded =
          results.filter((addedInvestigation) => {
            return (
              addedInvestigation.code === investigation.code &&
              addedInvestigation.categoryCode === orderType.uuid
            );
          }).length > 0;

        if (!isAlreadyAdded) {
          results.push({
            code: investigation.code ?? '',
            display: getInvestigationDisplay(investigation),
            category: orderType.display,
            categoryCode: orderType.uuid,
          });
        }
      });
    });
  });

  return results;
};

export const getFlattenedInvestigations = async (): Promise<
  FlattenedInvestigations[]
> => {
  const valueSet = await fetchInvestigations();
  const orderTypes = await getOrderTypes();
  return flattenInvestigations(valueSet, flattenOrderType(orderTypes));
};

export const getCategoryUuidFromOrderTypes = async (
  categoryName: string | undefined,
): Promise<string | undefined> => {
  if (!categoryName) return undefined;
  const orderTypesData = await getOrderTypes();
  const orderType = orderTypesData.results.find(
    (ot) => ot.display.toLowerCase() === categoryName.toLowerCase(),
  );
  return orderType?.uuid;
};

export const getOrderTypeNames = async (): Promise<string[]> => {
  const orderTypesData = await getOrderTypes();
  return orderTypesData.results.map((orderType) => orderType.display);
};

export const getExistingServiceRequestsForAllCategories = async (
  orderTypes: OrderType[],
  patientUUID: string,
  encounterUuids?: string[],
): Promise<ExistingServiceRequest[]> => {
  const results: ExistingServiceRequest[] = [];

  for (const orderType of orderTypes) {
    const categoryUuid = orderType.uuid;
    if (categoryUuid) {
      const bundle = await getServiceRequests(
        categoryUuid,
        patientUUID,
        encounterUuids,
      );
      const items =
        bundle.entry
          ?.map((entry) => ({
            conceptCode: entry.resource?.code?.coding?.[0]?.code ?? '',
            categoryUuid: categoryUuid,
            display: entry.resource?.code?.text ?? '',
            requesterUuid:
              entry.resource?.requester?.reference?.split('/')[1] ?? '',
          }))
          .filter((item) => item.conceptCode) ?? [];
      results.push(...items);
    }
  }
  return results;
};
