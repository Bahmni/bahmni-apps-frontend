import {
  FormattedPatientData,
  formatDateTime,
  getFormattedAge,
} from '@bahmni/services';
import { PatientDetailsViewModel } from './models';

function formatPatientIdentifiers(
  identifiers: Map<string, string | null>,
): string {
  if (!identifiers.size) return '';
  const joined = Array.from(identifiers.values())
    .filter((value) => value != null && value !== '')
    .join(' | ');
  return joined || '';
}

function formatAgeDetails(
  birthDate: string | null,
  t: (key: string) => string,
): string {
  if (!birthDate) return '';
  const age = getFormattedAge(birthDate, t);
  const date = formatDateTime(birthDate, t).formattedResult;
  return [age, date].filter(Boolean).join(' | ') || '';
}

export function createPatientDetailsViewModel(
  patient: FormattedPatientData,
  t: (key: string) => string,
): PatientDetailsViewModel {
  return {
    fullName: patient.fullName ?? '',
    gender: patient.gender ?? '',
    formattedIdentifiers: formatPatientIdentifiers(patient.identifiers),
    ageDetails: formatAgeDetails(patient.birthDate, t),
  };
}
