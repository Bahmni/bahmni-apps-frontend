import {
  camelToScreamingSnakeCase,
  extractAttributes,
  getCurrentStateName,
  ProgramEnrollment,
} from '@bahmni/services';
import { EpisodeOfCare } from 'fhir/r4';
import { KNOWN_FIELDS } from './constants';
import { PatientProgramViewModel, ProgramField } from './model';

export function extractProgramAttributeNames(
  fields?: ProgramField[],
): string[] {
  if (!fields) return [];
  return fields
    .map((field) => field.name)
    .filter((name) => !KNOWN_FIELDS.includes(name));
}

export function createProgramHeaders(
  fields: ProgramField[],
  t: (key: string) => string,
): Array<{ key: string; header: string }> {
  return fields.map((field) => ({
    key: field.name,
    header: t(`PROGRAMS_TABLE_HEADER_${camelToScreamingSnakeCase(field.name)}`),
  }));
}

export const createPatientProgramViewModal = (
  program: ProgramEnrollment,
  programAttributes: string[],
  episodeOfCare?: EpisodeOfCare,
): PatientProgramViewModel => ({
  id: program.uuid,
  uuid: program.uuid,
  programName: program.program.name,
  dateEnrolled: program.dateEnrolled,
  dateCompleted: program.dateCompleted,
  outcomeName: program.outcome
    ? program.outcome.name
      ? program.outcome.name.name!
      : null
    : null,
  outcomeDetails: program.outcome
    ? program.outcome.descriptions && program.outcome.descriptions.length > 0
      ? program.outcome.descriptions[0].description!
      : null
    : null,
  careManagerDisplay: episodeOfCare?.careManager?.display ?? null,
  currentStateName: getCurrentStateName(program),
  attributes: extractAttributes(program, programAttributes),
});
