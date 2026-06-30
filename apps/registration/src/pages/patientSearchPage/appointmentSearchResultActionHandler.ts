import {
  AppointmentSearchResult,
  SearchActionConfig,
  updateAppointmentStatus,
  checkInAppointment,
  UserPrivilege,
  formatUrl,
  PatientSearchResultBundle,
  hasPrivilege,
  type Notification,
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
  addNotification: (notification: Omit<Notification, 'id'>) => void,
  t: (key: string) => string,
) => {
  const { status, navigation, submit } = action.onAction;

  const showSuccessNotification = () => {
    if (action.onSuccess?.notification) {
      addNotification({
        title: t(action.onSuccess.notification),
        message: '',
        type: 'success',
        timeout: 5000,
      });
    }
  };

  const showErrorNotification = () => {
    addNotification({
      title: t('REGISTRATION_ACTION_BUTTON_GENERIC_ERROR'),
      message: '',
      type: 'error',
      timeout: 5000,
    });
  };

  if (action.type === 'changeStatus') {
    await updateAppointmentStatus(
      row.appointmentUuid as string,
      status as string,
    )
      .then((response) => {
        const { uuid, status: updatedStatus } = response as {
          uuid: string;
          status: string;
        };
        const updatedPatientSearchData = {
          totalCount: patientSearchData.totalCount,
          pageOfResults: updateAppointmentStatusInResults(
            patientSearchData.pageOfResults,
            uuid,
            updatedStatus,
          ),
        };
        setPatientSearchData(updatedPatientSearchData);
        showSuccessNotification();
      })
      .catch(showErrorNotification);
  } else if (action.type === 'navigate') {
    const options: Record<string, string> = {};
    options['patientUuid'] = row.uuid;
    options['appointmentNumber'] = row.appointmentNumber!;
    options['appointmentUuid'] = row.appointmentUuid!;
    handleActionNavigation(navigation ?? '', options, navigate);
  } else if (action.type === 'checkInAndStartVisit') {
    await checkInAppointment(submit!, row.appointmentUuid!)
      .then((response) => {
        const updatedPatientSearchData = {
          totalCount: patientSearchData.totalCount,
          pageOfResults: updateAppointmentStatusInResults(
            patientSearchData.pageOfResults,
            response.appointmentUuid,
            response.status,
          ),
        };
        setPatientSearchData(updatedPatientSearchData);
        showSuccessNotification();
      })
      .catch(showErrorNotification);
  }
};

type RuleValidator = (
  values: string[],
  row: PatientSearchViewModel<AppointmentSearchResult>,
  excludeValues?: string[],
) => boolean;

export const shouldRenderActionButton = (
  action: SearchActionConfig,
  userPrivileges: UserPrivilege[],
  row: PatientSearchViewModel<AppointmentSearchResult>,
): boolean => {
  if (!action.enabledRule || action.enabledRule.length === 0) return false;

  const ruleValidatorMap: Record<string, RuleValidator> = {
    privilegeCheck: (values) => privilegeValidator(userPrivileges)(values),
    statusCheck: (values, row) => statusValidator(values, row),
    appDateCheck: (values, row) => appDateValidator(values, row),
    appointmentService: (values, row, excludeValues) =>
      appointmentServiceValidator(values, excludeValues, row),
  };

  return action.enabledRule.every((rule) =>
    ruleValidatorMap[rule.type](rule.values ?? [], row, rule.excludeValues),
  );
};

export const appointmentServiceValidator = (
  values: string[] | undefined,
  excludeValues: string[] | undefined,
  row: PatientSearchViewModel<AppointmentSearchResult>,
): boolean => {
  const serviceUuid = String(row.appointmentServiceUuid ?? '');
  if (excludeValues !== undefined) {
    return excludeValues.length === 0 || !excludeValues.includes(serviceUuid);
  }
  if (values !== undefined) {
    return values.length > 0 && values.includes(serviceUuid);
  }
  return false;
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
