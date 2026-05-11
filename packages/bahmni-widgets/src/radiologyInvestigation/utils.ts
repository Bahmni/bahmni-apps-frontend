import { getPriorityByOrder, filterReplacementEntries } from '@bahmni/services';
import {
  ServiceRequest,
  Bundle,
  ImagingStudy as FhirImagingStudy,
} from 'fhir/r4';
import { RadiologyInvestigationViewModel, ImagingStudy } from './models';

/**
 * Priority order for radiology investigation priorities (case insensitive)
 * Index 0 = highest priority, higher index = lower priority
 * Used for sorting radiology investigations by priority: stat → routine
 */
export const PRIORITY_ORDER = ['stat', 'routine'];

/**
 * Maps radiology investigation priority to numeric priority for sorting
 * Uses generic getPriorityByOrder function with PRIORITY_ORDER
 * @param priority - The priority of the radiology investigation
 * @returns Numeric priority (lower = higher priority)
 */
export const getRadiologyPriority = (priority: string): number => {
  return getPriorityByOrder(priority, PRIORITY_ORDER);
};

/**
 * Sorts radiology investigations by priority: stat → routine
 * Maintains stable sorting (preserves original order for same priority)
 * @param investigations - Array of radiology investigations to sort
 * @returns New sorted array (does not mutate original)
 */
export const sortRadiologyInvestigationsByPriority = (
  investigations: RadiologyInvestigationViewModel[],
): RadiologyInvestigationViewModel[] => {
  return [...investigations].sort((a, b) => {
    return getRadiologyPriority(a.priority) - getRadiologyPriority(b.priority);
  });
};

/**
 * Filters out radiology investigations that have replacement relationships
 * Removes both the replacing entry (has replaces field) and the replaced entries (referenced in replaces)
 * This prevents duplicate entries from showing in the UI where one investigation replaces another
 * @param investigations - Array of formatted radiology investigations
 * @returns Filtered array without replacement-related entries
 */
export const filterRadiologyInvestionsReplacementEntries = (
  investigations: RadiologyInvestigationViewModel[],
): RadiologyInvestigationViewModel[] => {
  return filterReplacementEntries(
    investigations,
    (investigation) => investigation.id,
    (investigation) => investigation.replaces,
  );
};

const extractServiceRequests = (
  bundle: Bundle<ServiceRequest | FhirImagingStudy>,
): ServiceRequest[] => {
  return (
    bundle.entry
      ?.filter((entry) => entry.resource?.resourceType === 'ServiceRequest')
      .map((entry) => entry.resource as ServiceRequest) ?? []
  );
};

const extractImagingStudies = (
  bundle: Bundle<ServiceRequest | FhirImagingStudy>,
): FhirImagingStudy[] => {
  return (
    bundle.entry
      ?.filter((entry) => entry.resource?.resourceType === 'ImagingStudy')
      .map((entry) => entry.resource as FhirImagingStudy) ?? []
  );
};

const findMatchingImagingStudies = (
  serviceRequestId: string,
  imagingStudies: FhirImagingStudy[],
): FhirImagingStudy[] => {
  return imagingStudies.filter((imagingStudy) => {
    return imagingStudy.basedOn?.some((basedOnRef) => {
      const referencedId = basedOnRef.reference?.split('/').pop() ?? '';
      return referencedId === serviceRequestId;
    });
  });
};

const transformToImagingStudyViewModel = (
  fhirImagingStudy: FhirImagingStudy,
): ImagingStudy => {
  const dicomUid =
    fhirImagingStudy.identifier?.find(
      (identifier) => identifier.system === 'urn:dicom:uid',
    )?.value ?? '';

  return {
    id: fhirImagingStudy.id as string,
    StudyInstanceUIDs: dicomUid,
    status: fhirImagingStudy.status,
  };
};

export const getAvailableImagingStudies = (
  imagingStudies?: ImagingStudy[],
): ImagingStudy[] => {
  return imagingStudies?.filter((study) => study.status === 'available') ?? [];
};

/**
 * Finds the root/primary order by traversing up the basedOn chain
 * Primary order is the one without a basedOn field
 * @param orderId - The ID of the order to find the primary for
 * @param investigationsMap - Map of order ID to investigation
 * @returns The ID of the primary order
 */
const findPrimaryOrderId = (
  orderId: string,
  investigationsMap: Map<string, RadiologyInvestigationViewModel>,
): string => {
  const investigation = investigationsMap.get(orderId);
  if (!investigation) return orderId;

  if (!investigation.basedOn || investigation.basedOn.length === 0) {
    return orderId;
  }

  // Traverse up the chain
  const basedOnId = investigation.basedOn[0];
  return findPrimaryOrderId(basedOnId, investigationsMap);
};

export const groupInvestigationsByPrimaryOrder = (
  investigations: RadiologyInvestigationViewModel[],
): RadiologyInvestigationViewModel[] => {
  const investigationsMap = new Map(investigations.map((inv) => [inv.id, inv]));

  const primaryToLinkedMap = new Map<
    string,
    RadiologyInvestigationViewModel[]
  >();

  const primaryOrdersMap = new Map<string, RadiologyInvestigationViewModel>();

  // First pass: identify all orders and their primary
  investigations.forEach((investigation) => {
    const primaryId = findPrimaryOrderId(investigation.id, investigationsMap);

    if (primaryId === investigation.id) {
      // This is a primary order
      primaryOrdersMap.set(primaryId, investigation);
      if (!primaryToLinkedMap.has(primaryId)) {
        primaryToLinkedMap.set(primaryId, []);
      }
    } else {
      // This is a linked order
      if (!primaryToLinkedMap.has(primaryId)) {
        primaryToLinkedMap.set(primaryId, []);
      }
      primaryToLinkedMap.get(primaryId)!.push(investigation);
    }
  });

  return Array.from(primaryOrdersMap.values()).map((primaryOrder) => {
    const linkedOrders = primaryToLinkedMap.get(primaryOrder.id) ?? [];
    return {
      ...primaryOrder,
      ...(linkedOrders.length > 0 && { linkedOrders }),
    };
  });
};

/**
 * Transforms FHIR Bundle containing ServiceRequest and ImagingStudy resources into radiology investigation view models
 * @param bundle - FHIR Bundle containing ServiceRequest and ImagingStudy resources
 * @returns Array of RadiologyInvestigationViewModel view models ready for table rendering
 */
export function createRadiologyInvestigationViewModels(
  bundle: Bundle<ServiceRequest | FhirImagingStudy>,
): RadiologyInvestigationViewModel[] {
  const serviceRequests = extractServiceRequests(bundle);
  const imagingStudies = extractImagingStudies(bundle);

  return serviceRequests.map((order) => {
    const orderedDate = order.occurrencePeriod?.start as string;

    const replaces = order.replaces
      ?.map((replace) => {
        const reference = replace.reference ?? '';
        return reference.split('/').pop() ?? '';
      })
      .filter((id) => id.length > 0);

    const basedOn = order.basedOn
      ?.map((basedOnRef) => {
        const reference = basedOnRef.reference ?? '';
        return reference.split('/').pop() ?? '';
      })
      .filter((id) => id.length > 0);

    const note = order.note?.[0]?.text;

    const matchingFhirImagingStudies = findMatchingImagingStudies(
      order.id as string,
      imagingStudies,
    );

    const imagingStudiesViewModels = matchingFhirImagingStudies.map(
      transformToImagingStudyViewModel,
    );

    return {
      id: order.id as string,
      testName: order.code!.text!,
      priority: order.priority!,
      orderedBy: order.requester!.display!,
      orderedDate: orderedDate,
      status: order.status.toLowerCase(),
      ...(replaces && replaces.length > 0 && { replaces }),
      ...(basedOn && basedOn.length > 0 && { basedOn }),
      ...(note && { note }),
      ...(imagingStudiesViewModels.length > 0 && {
        imagingStudies: imagingStudiesViewModels,
      }),
    };
  });
}
