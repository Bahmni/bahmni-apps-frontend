import {
  AppointmentSearchResult,
  SearchActionConfig,
  updateAppointmentStatus,
  UserPrivilege,
  formatUrl,
  PatientSearchResultBundle,
} from '@bahmni-frontend/bahmni-services';
import { NavigateFunction } from 'react-router-dom';
import {
  PatientSearchViewModel,
  privilegeValidator,
  statusValidator,
  appDateValidator,
} from './utils';

export const getAppointmentStatusClassName = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'scheduled':
      return 'scheduledStatus';
    case 'arrived':
      return 'arrivedStatus';
    case 'checkedin':
    case 'checked in':
      return 'checkedInStatus';
    default:
      return 'scheduledStatus';
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

export const handleButtonClick = async (
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
    handleActionNavigation(navigation ?? '', options, navigate);
  }
};

export const isButtonEnabled = (
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

export const shouldRenderButton = (
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
