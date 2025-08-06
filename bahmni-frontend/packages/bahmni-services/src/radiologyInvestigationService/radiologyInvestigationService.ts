import { Bundle, ServiceRequest } from 'fhir/r4';
import { PATIENT_RADIOLOGY_RESOURCE_URL } from '@constants/app';
import { RadiologyInvestigation } from '../../bahmni-frontend/packages/bahmni-services/src/radiologyInvestigationService/radiologyInvestigation';
import { get } from './api';

/**
 * Fetches radiology investigations for a given patient UUID from the FHIR R4 endpoint
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to a Bundle containing radiology investigations
 */
async function getPatientRadiologyInvestigationBundle(
  patientUUID: string,
): Promise<Bundle> {
  const url = PATIENT_RADIOLOGY_RESOURCE_URL(patientUUID);
  return await get<Bundle>(url);
}

/**
 * Formats FHIR radiology investigations into a more user-friendly format
 * @param bundle - The FHIR bundle to format
 * @returns An array of formatted radiology order investigation objects
 */
function formatRadiologyInvestigations(
  bundle: Bundle,
): RadiologyInvestigation[] {
  const orders =
    bundle.entry?.map((entry) => entry.resource as ServiceRequest) ?? [];

  return orders.map((order) => {
    const orderedDate = order.occurrencePeriod?.start as string;

    const replaces = order.replaces
      ?.map((replace) => {
        const reference = replace.reference ?? '';
        return reference.split('/').pop() ?? '';
      })
      .filter((id) => id.length > 0);

    return {
      id: order.id as string,
      testName: order.code!.text!,
      priority: order.priority!,
      orderedBy: order.requester!.display!,
      orderedDate: orderedDate,
      ...(replaces && replaces.length > 0 && { replaces }),
    };
  });
}

/**
 * Fetches and formats radiology investigations for a given patient UUID
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to an array of radiology investigations
 */
export async function getPatientRadiologyInvestigations(
  patientUUID: string,
): Promise<RadiologyInvestigation[]> {
  const bundle = await getPatientRadiologyInvestigationBundle(patientUUID);
  return formatRadiologyInvestigations(bundle);
}
