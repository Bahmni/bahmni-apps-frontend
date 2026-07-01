import {
  extractAttributes,
  getCurrentStateName,
  ProgramEnrollment,
} from '@bahmni/services';
import { KNOWN_FIELDS } from './constants';
import { ProgramDetailsViewModel, ProgramField } from './model';

export function extractProgramAttributeNames(
  fields?: ProgramField[],
): string[] {
  if (!fields) return [];
  return fields
    .map((field) => field.name)
    .filter((name) => !KNOWN_FIELDS.includes(name));
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
    allowedStates: enrollment.allowedStates.map((state) => ({
      uuid: state.uuid,
      display: state.concept.display,
    })),
  };
}
