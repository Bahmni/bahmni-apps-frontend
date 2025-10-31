import {
  PatientSearchResult,
  UserPrivilege,
} from '@bahmni-frontend/bahmni-services';
import { PatientSearchViewModel } from '../pages/patientSearchPage/utils';
import { dateComparator } from '../utils/dateUtils';

export const privilegeValidator =
  (userPrivileges: UserPrivilege[]) => (rules: string[]) => {
    const userPrivilegeNames = userPrivileges?.map(
      (privilege) => privilege.name,
    );
    return rules.some((privilege) => userPrivilegeNames?.includes(privilege));
  };

export const statusValidator = (
  rules: string[],
  row: PatientSearchViewModel<PatientSearchResult>,
) => {
  const appointmentStatus = String(row.appointmentStatus ?? '');
  return rules.includes(appointmentStatus);
};

export const appDateValidator = (
  rules: string[],
  row: PatientSearchViewModel<PatientSearchResult>,
) => {
  return rules.some((ruleValue) =>
    dateComparator(row.appointmentDate as string, ruleValue),
  );
};
