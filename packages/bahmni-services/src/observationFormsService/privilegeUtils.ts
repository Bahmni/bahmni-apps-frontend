import { ObservationForm } from './models';

/**
 * Interface for user privilege from whoami API
 */
export interface UserPrivilege {
  name: string;
}

/**
 * Check if user has required privileges to access a form
 * @param userPrivileges - Array of user privileges from whoami API
 * @param form - Form with privilege requirements
 * @returns true if user can access the form, false otherwise
 */
export const canUserAccessForm = (
  userPrivileges: UserPrivilege[] | null,
  form: ObservationForm,
): boolean => {
  // If no user privileges, deny access
  if (!userPrivileges || userPrivileges.length === 0) {
    return false;
  }

  // If form has no privilege requirements, allow access
  if (!form.privileges || form.privileges.length === 0) {
    return true;
  }

  // Extract user privilege names
  const userPrivilegeNames = userPrivileges.map((privilege) => privilege.name);

  // Check if user has required privileges AND the privilege is editable
  const hasAccess = form.privileges.some((formPrivilege) => {
    const hasPrivilege = userPrivilegeNames.includes(
      formPrivilege.privilegeName,
    );
    const isEditable = formPrivilege.editable;
    // User must have the privilege and it must be editable
    return hasPrivilege && isEditable;
  });

  return hasAccess;
};

/**
 * Filter forms based on user privileges
 * @param userPrivileges - Array of user privileges from whoami API
 * @param forms - Array of forms to filter
 * @returns Array of forms that user has access to
 */
export const filterFormsByUserPrivileges = (
  userPrivileges: UserPrivilege[] | null,
  forms: ObservationForm[],
): ObservationForm[] => {
  if (!userPrivileges || userPrivileges.length === 0) {
    return [];
  }

  const filteredForms = forms.filter((form) =>
    canUserAccessForm(userPrivileges, form),
  );
  return filteredForms;
};

/**
 * Check if user has a specific privilege by name
 * @param userPrivileges - Array of user privileges from whoami API
 * @param privilegeName - Name of the privilege to check
 * @returns true if user has the privilege, false otherwise
 */
// to privilege service
export const hasPrivilege = (
  userPrivileges: UserPrivilege[] | null,
  privilegeName: string,
): boolean => {
  if (!userPrivileges || userPrivileges.length === 0) {
    return false;
  }

  return userPrivileges.some((privilege) => privilege.name === privilegeName);
};
