import { PATIENT_RADIOLOGY_RESOURCE_URL } from '@constants/app';
import { get } from './api';
import { Bundle, ServiceRequest } from 'fhir/r4';
import {
  RadiologyInvestigation,
  RadiologyInvestigationByDate,
} from '@types/radiologyInvestigation';
import { groupByDate } from '@utils/common';

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
    bundle.entry?.map((entry) => entry.resource as ServiceRequest) || [];

  return orders.map((order) => {
    const orderedDate = order.occurrencePeriod?.start as string;

    return {
      id: order.id as string,
      testName: order.code!.text!,
      priority: order.priority!,
      orderedBy: order.requester!.display!,
      orderedDate: orderedDate,
    };
  });
}

/**
 * Fetches and formats radiology investigations for a given patient UUID
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to an array of radiology investigations grouped by date
 */
export async function getPatientRadiologyInvestigationsByDate(
  patientUUID: string,
): Promise<RadiologyInvestigationByDate[]> {
  const bundle = await getPatientRadiologyInvestigationBundle(patientUUID);
  const formattedInvestigations = formatRadiologyInvestigations(bundle);

  const grouped = groupByDate(formattedInvestigations, (order) =>
    order.orderedDate.substring(0, 10),
  );

  return grouped.map((group) => ({
    date: group.date,
    orders: group.items,
  }));
}
