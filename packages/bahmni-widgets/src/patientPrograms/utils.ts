import {
  camelToScreamingSnakeCase,
  extractAttributes,
  getCurrentStateName,
  PatientProgramsResponse,
} from '@bahmni/services';
import { KNOWN_FIELDS } from './constants';
import { PatientProgramViewModel } from './model';

export function extractProgramAttributeNames(fields?: string[]): string[] {
  if (!fields) return [];
  return fields.filter((field) => !KNOWN_FIELDS.includes(field));
}

export function createProgramHeaders(
  fields: string[],
  t: (key: string) => string,
): Array<{ key: string; header: string }> {
  return fields.map((field) => ({
    key: field,
    header: t(`PROGRAMS_TABLE_HEADER_${camelToScreamingSnakeCase(field)}`),
  }));
}

export function createPatientProgramViewModal(
  programs: PatientProgramsResponse,
  programAttributes: string[],
): PatientProgramViewModel[] {
  if (!programs.results || programs.results.length === 0) {
    return [];
  }

  return programs.results.map((enrollment) => ({
    id: enrollment.uuid,
    uuid: enrollment.uuid,
    programName: enrollment.program.name,
    dateEnrolled: enrollment.dateEnrolled,
    dateCompleted: enrollment.dateCompleted,
    outcomeName: enrollment.outcome
      ? enrollment.outcome.name
        ? enrollment.outcome.name.name!
        : null
      : null,
    outcomeDetails: enrollment.outcome
      ? enrollment.outcome.descriptions &&
        enrollment.outcome.descriptions.length > 0
        ? enrollment.outcome.descriptions[0].description!
        : null
      : null,
    currentStateName: getCurrentStateName(enrollment),
    attributes: extractAttributes(enrollment, programAttributes),
  }));
}
