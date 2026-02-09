import {
  camelToScreamingSnakeCase,
  extractAttributes,
  getCurrentStateName,
  ProgramEnrollment,
} from '@bahmni/services';
import { KNOWN_FIELDS } from './constants';
import { ProgramDetailsViewModel } from './model';

export function extractProgramAttributeNames(fields?: string[]): string[] {
  if (!fields) return [];
  return fields.filter((field) => !KNOWN_FIELDS.includes(field));
}

export function createProgramHeader(field: string): string {
  return `PROGRAMS_TABLE_HEADER_${camelToScreamingSnakeCase(field)}`;
}

export function createProgramDetailsViewModel(
  enrollment: ProgramEnrollment,
  programAttributes: string[],
): ProgramDetailsViewModel {
  return {
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
  };
}
