import { Bundle, DiagnosticReport } from 'fhir/r4';
import { get } from '../api';
import {
  DIAGNOSTIC_REPORTS_URL,
  DIAGNOSTIC_REPORT_BUNDLE_URL,
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
  const url = DIAGNOSTIC_REPORT_BUNDLE_URL(diagnosticReportId);
  return await get<Bundle>(url);
}
