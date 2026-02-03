import { OPENMRS_FHIR_R4 } from '../constants/app';

export const DIAGNOSTIC_REPORTS_URL = (
  patientUuid: string,
  basedOnIds?: string,
) => {
  const baseUrl = `${OPENMRS_FHIR_R4}/DiagnosticReport?patient=${patientUuid}`;
  return basedOnIds ? `${baseUrl}&based-on=${basedOnIds}` : baseUrl;
};

export const DIAGNOSTIC_REPORT_BUNDLE_URL = (diagnosticReportId: string) => {
  return `${OPENMRS_FHIR_R4}/DiagnosticReportBundle/${diagnosticReportId}`;
};
