import { get } from '../api';
import { VITAL_FLOW_SHEET_URL } from './constants';

export interface VitalFlowSheetConceptDetail {
  name: string;
  fullName: string;
  units: string;
  hiNormal: number;
  lowNormal: number;
  attributes: Record<string, unknown>;
}

export interface VitalFlowSheetObservation {
  value: string;
  abnormal: boolean;
}

export interface VitalFlowSheetData {
  tabularData: Record<string, Record<string, VitalFlowSheetObservation>>;
  conceptDetails: VitalFlowSheetConceptDetail[];
}

export interface VitalFlowSheetConfig {
  latestCount?: number;
  numberOfVisits?: number;
  obsConcepts: string[];
}

/**
 * Fetches vital flow sheet data for a patient using direct parameters
 * @param patientUuid - The patient UUID
 * @param latestCount - Number of latest observations to fetch
 * @param obsConcepts - Array of observation concepts to fetch
 * @param groupBy - How to group the data (default: 'obstime')
 * @returns Promise<VitalFlowSheetData>
 */

export const getVitalFlowSheetData = async (
  patientUuid: string,
  latestCount: number,
  obsConcepts: string[],
  groupBy: string = 'obstime',
): Promise<VitalFlowSheetData> => {
  const params = new URLSearchParams({
    groupBy,
    latestCount: latestCount.toString(),
    patientUuid,
  });

  // Add each concept as a separate parameter
  obsConcepts.forEach((concept: string) => {
    params.append('obsConcepts', concept);
  });

  const url = VITAL_FLOW_SHEET_URL + params.toString();
  return get<VitalFlowSheetData>(url);
};
