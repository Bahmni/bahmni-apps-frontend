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
import { PatientSearchViewModel } from '../utils';

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

  const showErrorNotification = (error: unknown) => {
    addNotification({
      title:
        typeof error === 'string'
          ? error
          : t('REGISTRATION_ACTION_BUTTON_GENERIC_ERROR'),
      message: '',
      type: 'error',
      timeout: 5000,
    });
  };

  const handleResponse = async (
    promise: Promise<{ appointmentUuid: string; status: string }>,
  ) => {
    try {
      const { appointmentUuid, status: updatedStatus } = await promise;
      setPatientSearchData({
        totalCount: patientSearchData.totalCount,
        pageOfResults: updateAppointmentStatusInResults(
          patientSearchData.pageOfResults,
          appointmentUuid,
          updatedStatus,
        ),
      });
      showSuccessNotification();
    } catch (error) {
      showErrorNotification(error);
    }
  };

  if (action.type === 'changeStatus') {
    await handleResponse(
      updateAppointmentStatus(row.appointmentUuid!, status!).then((res) => {
        const { uuid, status: updatedStatus } = res as {
          uuid: string;
          status: string;
        };
        return { appointmentUuid: uuid, status: updatedStatus };
      }),
    );
  } else if (action.type === 'navigate') {
    const options: Record<string, string> = {};
    options['patientUuid'] = row.uuid;
    options['appointmentNumber'] = row.appointmentNumber!;
    options['appointmentUuid'] = row.appointmentUuid!;
    handleActionNavigation(navigation ?? '', options, navigate);
  } else if (action.type === 'checkInAndStartVisit') {
    await handleResponse(checkInAppointment(submit!, row.appointmentUuid!));
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
