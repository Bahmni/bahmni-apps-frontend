import { Bundle, DiagnosticReport } from 'fhir/r4';
import { get, post } from '../api';
import {
  DIAGNOSTIC_REPORTS_URL,
  DIAGNOSTIC_REPORT_UPDATE_URL,
  DIAGNOSTIC_REPORT_FETCH_URL,
} from './constants';

export async function getDiagnosticReports(
  patientUuid: string,
  serviceRequestIds: string[] = [],
): Promise<Bundle<DiagnosticReport>> {
  const formattedIds =
    serviceRequestIds.length > 0 ? serviceRequestIds.join(',') : undefined;
  const url = DIAGNOSTIC_REPORTS_URL(patientUuid, formattedIds);
  return await get<Bundle<DiagnosticReport>>(url);
}

export async function getDiagnosticReportBundle(
  diagnosticReportId: string,
): Promise<Bundle> {
  const url = DIAGNOSTIC_REPORT_FETCH_URL(diagnosticReportId);
  return await get<Bundle>(url);
}

export async function updateDiagnosticReportBundle(
  diagnosticReportId: string,
  bundle: Bundle,
): Promise<Bundle> {
  const url = DIAGNOSTIC_REPORT_UPDATE_URL(diagnosticReportId);
  return await post<Bundle>(url, bundle);
}
