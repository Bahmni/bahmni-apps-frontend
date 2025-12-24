import {
  AppointmentSearchResult,
  SearchActionConfig,
  updateAppointmentStatus,
  UserPrivilege,
  formatUrl,
  PatientSearchResultBundle,
  hasPrivilege,
} from '@bahmni/services';
import { isSameDay, isBefore, isAfter } from 'date-fns';
import { NavigateFunction } from 'react-router-dom';
import { PatientSearchViewModel } from './utils';

export const getAppointmentStatusClassName = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'scheduled':
      return 'scheduledStatus';
    case 'arrived':
      return 'arrivedStatus';
    case 'completed':
      return 'completedStatus';
    case 'checkedin':
    case 'checked in':
      return 'checkedInStatus';
    case 'missed':
      return 'missedStatus';
    case 'cancelled':
      return 'cancelledStatus';
    default:
      return 'defaultStatus';
  }
};

export const updateAppointmentStatusInResults = (
  appointmentPatientData: AppointmentSearchResult[],
  responseUuid: string,
  responseStatus: string,
): AppointmentSearchResult[] => {
  return appointmentPatientData.map((result) => {
    if (result.appointmentUuid === responseUuid) {
      result.appointmentStatus = responseStatus;
    }
    return result;
  });
};

export const handleActionNavigation = (
  navigationUrl: string,
  options: Record<string, string>,
  navigate: NavigateFunction,
) => {
  if (!navigationUrl) return;

  const url = formatUrl(navigationUrl, options, true);
  if (url.startsWith('#')) {
    navigate(url.slice(1));
  } else {
    window.location.href = url;
  }
};

export const handleActionButtonClick = async (
  action: SearchActionConfig,
  row: PatientSearchViewModel<AppointmentSearchResult>,
  patientSearchData: PatientSearchResultBundle,
  setPatientSearchData: (data: PatientSearchResultBundle) => void,
  navigate: NavigateFunction,
) => {
  const { status, navigation } = action.onAction;

  if (action.type === 'changeStatus') {
    await updateAppointmentStatus(
      row.appointmentUuid as string,
      status as string,
    ).then((response) => {
      const updatedPatientSearchData = {
        totalCount: patientSearchData.totalCount,
        pageOfResults: updateAppointmentStatusInResults(
          patientSearchData.pageOfResults,
          response.uuid,
          response.status,
        ),
      };
      setPatientSearchData(updatedPatientSearchData);
    });
  } else if (action.type === 'navigate') {
    const options: Record<string, string> = {};
    options['patientUuid'] = row.uuid;
    options['appointmentNumber'] = row.appointmentNumber!;
    options['appointmentUuid'] = row.appointmentUuid!;
    handleActionNavigation(navigation ?? '', options, navigate);
  }
};

export const isActionButtonEnabled = (
  enabledRules: SearchActionConfig['enabledRule'],
  row: PatientSearchViewModel<AppointmentSearchResult>,
  userPrivileges: UserPrivilege[],
): boolean => {
  if (!enabledRules || enabledRules.length === 0) return true;

  const ruleValidatorMap = {
    privilegeCheck: privilegeValidator(userPrivileges),
    statusCheck: statusValidator,
    appDateCheck: appDateValidator,
  };

  return enabledRules.every((rule) =>
    ruleValidatorMap[rule.type](rule.values, row),
  );
};

export const shouldRenderActionButton = (
  action: SearchActionConfig,
  userPrivileges: UserPrivilege[],
): boolean => {
  const privilegeRules =
    action.enabledRule
      ?.filter((rule) => rule.type === 'privilegeCheck')
      .map((rule) => rule.values)
      .flat() ?? [];

  if (privilegeRules.length === 0) {
    return false;
  }

  return privilegeValidator(userPrivileges)(privilegeRules);
};

export const privilegeValidator =
  (userPrivileges: UserPrivilege[]) => (rules: string[]) => {
    return rules.some((privilege) => hasPrivilege(userPrivileges, privilege));
  };

export const statusValidator = (
  rules: string[],
  row: PatientSearchViewModel<AppointmentSearchResult>,
) => {
  const appointmentStatus = String(row.appointmentStatus ?? '');
  return rules.includes(appointmentStatus);
};

export const appDateValidator = (
  rules: string[],
  row: PatientSearchViewModel<AppointmentSearchResult>,
) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const appointmentDate = new Date(row.appointmentDate as string);

  return rules.some((ruleValue) => {
    switch (ruleValue) {
      case 'today':
        return isSameDay(appointmentDate, today);
      case 'past':
        return isBefore(appointmentDate, today);
      case 'future':
        return isAfter(appointmentDate, today);
      default:
        return false;
    }
  });
};
