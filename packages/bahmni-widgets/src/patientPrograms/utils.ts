import { PatientProgramsResponse } from '@bahmni/services';
import { KNOWN_FIELDS } from './constants';
import { PatientProgramViewModel } from './model';

function camelToScreamingSnakeCase(str: string): string {
  return str
    .replace(/\s+/g, '_')
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .toUpperCase();
}

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

function getCurrentStateName(
  enrollment: PatientProgramsResponse['results'][0],
): string {
  if (enrollment.states.length === 0) {
    return null;
  }
  if (enrollment.dateCompleted !== null) {
    const statesWithEndDate = enrollment.states.filter(
      (state) => state.endDate !== null,
    );
    const sortedStates = statesWithEndDate.sort((a, b) => {
      const dateA = new Date(a.endDate!).getTime();
      const dateB = new Date(b.endDate!).getTime();
      return dateA - dateB;
    });
    const latestState = sortedStates[sortedStates.length - 1];
    return latestState.state.concept.display ?? '';
  } else {
    const activeState = enrollment.states.find(
      (state) => state.endDate === null,
    );
    return activeState!.state.concept.display ?? '';
  }
}

function extractAttributes(
  enrollment: PatientProgramsResponse['results'][0],
  programAttributes: string[],
): Record<string, string | null> {
  if (programAttributes.length === 0) {
    return {};
  }

  const attributesMap: Record<string, string | null> = {};

  for (const attributeName of programAttributes) {
    const foundAttribute = enrollment.attributes.find(
      (attr) => attr.attributeType.display === attributeName,
    );

    if (foundAttribute) {
      if (typeof foundAttribute.value === 'string') {
        attributesMap[attributeName] = foundAttribute.value;
      } else {
        attributesMap[attributeName] = foundAttribute.value.name!.name;
      }
    } else {
      attributesMap[attributeName] = null;
    }
  }

  return attributesMap;
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
