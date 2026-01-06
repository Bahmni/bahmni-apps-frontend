import { Bundle, ServiceRequest } from 'fhir/r4';
import { getServiceRequests } from '../orderRequestService';
import { RadiologyInvestigation } from './models';

/**
 * Fetches radiology investigations for a given patient UUID from the FHIR R4 endpoint
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to a Bundle containing radiology investigations
 */

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

    const note = order.note?.[0]?.text;

    return {
      id: order.id as string,
      testName: order.code!.text!,
      priority: order.priority!,
      orderedBy: order.requester!.display!,
      orderedDate: orderedDate,
      ...(replaces && replaces.length > 0 && { replaces }),
      ...(note && { note }),
    };
  });
}

/**
 * Fetches and formats radiology investigations for a given patient UUID
 * @param patientUUID - The UUID of the patient
 * @param category
 * @param encounterUuids
 * @param numberOfVisits
 * @returns Promise resolving to an array of radiology investigations
 */
export async function getPatientRadiologyInvestigations(
  patientUUID: string,
  category: string,
  encounterUuids?: string[],
  numberOfVisits?: number,
): Promise<RadiologyInvestigation[]> {
  const bundle = await getServiceRequests(
    category,
    patientUUID,
    encounterUuids,
    numberOfVisits,
  );
  return formatRadiologyInvestigations(bundle);
}
