import type { ObservationForm, UserPrivilege } from '@bahmni/services';
import type { TaskViewModel } from './models';

/**
 * Extract form name from task input based on inputType
 * @param task - TaskViewModel containing the full FHIR Task resource
 * @param inputType - The concept UUID to look for in task.input[].type.coding[].code
 * @returns The form name from task.input[].valueString, or null if not found
 */
export const extractFormNameFromTask = (
  task: TaskViewModel,
  inputType: string,
): string | null => {
  const fhirTask = task.fhirResource;

  if (!fhirTask.input) {
    return null;
  }

  // Find the input entry that matches the inputType
  const matchingInput = fhirTask.input.find((input) => {
    const typeCoding = input.type?.coding?.[0];
    return typeCoding?.code === inputType;
  });

  // Return the valueString from the matching input
  return matchingInput?.valueString ?? null;
};

/**
 * Check if user can edit a form based on privileges
 */
export const canUserEditForm = (
  userPrivileges: UserPrivilege[] | null,
  form: ObservationForm,
): boolean => {
  if (!userPrivileges || userPrivileges.length === 0) {
    return false;
  }

  if (!form.privileges || form.privileges.length === 0) {
    return true;
  }

  const userPrivilegeNames = new Set(
    userPrivileges.map((privilege) => privilege.name),
  );

  return form.privileges.some((formPrivilege) => {
    const hasFormPrivilege = userPrivilegeNames.has(
      formPrivilege.privilegeName,
    );
    return hasFormPrivilege && formPrivilege.editable;
  });
};
