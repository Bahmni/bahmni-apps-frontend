import { get, post } from '../api';
import { getDisplayNameForConcept } from '../conceptService';
import {
  PATIENT_PROGRAMS_URL,
  PROGRAM_DETAILS_URL,
  PROGRAMS_URL,
} from './constants';
import { PatientProgramsResponse, ProgramEnrollment } from './model';

// TODO: Add Optional parameters for pagination and filtering
/**
 * Fetches programs for a given patient UUID
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to a list containing programs
 */
export const getPatientPrograms = async (
  patientUUID: string,
): Promise<PatientProgramsResponse> => {
  return await get<PatientProgramsResponse>(PATIENT_PROGRAMS_URL(patientUUID));
};

/**
 * Fetches program for a given program UUID
 * @param programUUID - The UUID of the program
 * @returns Promise resolving to a program
 */
export const getProgramByUUID = async (
  programUUID: string,
): Promise<ProgramEnrollment> => {
  return await get<ProgramEnrollment>(PROGRAM_DETAILS_URL(programUUID));
};

/**
 * Updates the state of a program enrollment
 * @param programEnrollmentUUID - The UUID of the program enrollment to update
 * @param stateConceptUUID - The UUID of the new state concept to set for the program enrollment
 * @returns Promise resolving to the updated program enrollment
 */
export const updateProgramState = async (
  programEnrollmentUUID: string,
  stateConceptUUID: string,
): Promise<ProgramEnrollment> => {
  const body = {
    uuid: programEnrollmentUUID,
    states: [
      {
        state: { uuid: stateConceptUUID },
      },
    ],
  };
  return await post<ProgramEnrollment>(
    PROGRAMS_URL(programEnrollmentUUID),
    body,
  );
};

/**
 * Gets the current state name of a program enrollment
 * @param enrollment - The program enrollment object
 * @returns The name of the current state or null if not available
 */
export function getCurrentStateName(
  enrollment: ProgramEnrollment,
): string | null {
  if (enrollment.states.length === 0) {
    return null;
  }

  let currentState;

  if (enrollment.dateCompleted !== null) {
    const statesWithEndDate = enrollment.states.filter(
      (state) => state.endDate !== null,
    );
    const sortedStates = statesWithEndDate.sort((a, b) => {
      const dateA = new Date(a.endDate!).getTime();
      const dateB = new Date(b.endDate!).getTime();
      return dateA - dateB;
    });
    currentState = sortedStates[sortedStates.length - 1];
  } else {
    currentState = enrollment.states.find((state) => state.endDate === null);
  }

  if (!currentState) {
    return null;
  }

  const conceptName = getDisplayNameForConcept(
    currentState.state.concept.names,
  );

  return conceptName ?? currentState.state.concept.display;
}

/**
 * Extracts attributes from a program enrollment based on provided attribute names
 * @param enrollment - The program enrollment object
 * @param programAttributes - List of attribute names to extract
 * @returns A map of attribute names to their values or null if not available
 */
export function extractAttributes(
  enrollment: ProgramEnrollment,
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
