import {
  AppointmentSearchResult,
  PatientSearchResultBundle,
  SearchActionConfig,
  updateAppointmentStatus,
  UserPrivilege,
  checkInAppointment,
} from '@bahmni/services';
import { NavigateFunction } from 'react-router-dom';
import {
  getAppointmentStatusClassName,
  updateAppointmentStatusInResults,
  handleActionNavigation,
  handleActionButtonClick,
  shouldRenderActionButton,
  appDateValidator,
  appointmentServiceValidator,
} from '../appointmentSearchResultActionHandler';
import { PatientSearchViewModel } from '../utils';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  updateAppointmentStatus: jest.fn(),
  checkInAppointment: jest.fn(),
  hasPrivilege: jest.fn((privileges: any[], privilegeName: string) => {
    return privileges.some((priv) => priv.name === privilegeName);
  }),
  dateComparator: jest.fn((date: string, comparator: string) => {
    if (comparator === 'today') {
      const today = new Date().toISOString().split('T')[0];
      return date === today;
    }
    return false;
  }),
  formatUrl: jest.fn((url: string, options: Record<string, any>) => {
    let formattedUrl = url;
    Object.keys(options || {}).forEach((key) => {
      formattedUrl = formattedUrl.replace(`{{${key}}}`, options[key]);
    });
    return formattedUrl;
  }),
}));

describe('appointmentSearchResultActionHandler', () => {
  describe('getAppointmentStatusClassName', () => {
    it('should return scheduledStatus for scheduled status', () => {
      expect(getAppointmentStatusClassName('Scheduled')).toBe(
        'scheduledStatus',
      );
      expect(getAppointmentStatusClassName('scheduled')).toBe(
        'scheduledStatus',
      );
      expect(getAppointmentStatusClassName('SCHEDULED')).toBe(
        'scheduledStatus',
      );
    });

    it('should return arrivedStatus for arrived status', () => {
      expect(getAppointmentStatusClassName('Arrived')).toBe('arrivedStatus');
      expect(getAppointmentStatusClassName('arrived')).toBe('arrivedStatus');
      expect(getAppointmentStatusClassName('ARRIVED')).toBe('arrivedStatus');
    });

    it('should return missedStatus for missed status', () => {
      expect(getAppointmentStatusClassName('Missed')).toBe('missedStatus');
      expect(getAppointmentStatusClassName('missed')).toBe('missedStatus');
      expect(getAppointmentStatusClassName('MISSED')).toBe('missedStatus');
    });

    it('should return completedStatus for completed status', () => {
      expect(getAppointmentStatusClassName('Completed')).toBe(
        'completedStatus',
      );
      expect(getAppointmentStatusClassName('completed')).toBe(
        'completedStatus',
      );
      expect(getAppointmentStatusClassName('COMPLETED')).toBe(
        'completedStatus',
      );
    });

    it('should return cancelledStatus for cancelled status', () => {
      expect(getAppointmentStatusClassName('Cancelled')).toBe(
        'cancelledStatus',
      );
      expect(getAppointmentStatusClassName('cancelled')).toBe(
        'cancelledStatus',
      );
      expect(getAppointmentStatusClassName('CANCELLED')).toBe(
        'cancelledStatus',
      );
    });

    it('should return checkedInStatus for checked in status', () => {
      expect(getAppointmentStatusClassName('CheckedIn')).toBe(
        'checkedInStatus',
      );
      expect(getAppointmentStatusClassName('checkedin')).toBe(
        'checkedInStatus',
      );
      expect(getAppointmentStatusClassName('Checked In')).toBe(
        'checkedInStatus',
      );
      expect(getAppointmentStatusClassName('checked in')).toBe(
        'checkedInStatus',
      );
    });

    it('should return defaultStatus for unknown status', () => {
      expect(getAppointmentStatusClassName('Unknown')).toBe('defaultStatus');
      expect(getAppointmentStatusClassName('')).toBe('defaultStatus');
    });
  });

  describe('updateAppointmentStatusInResults', () => {
    const mockAppointmentData: AppointmentSearchResult[] = [
      {
        uuid: 'patient-uuid-1',
        birthDate: new Date('1990-01-01'),
        extraIdentifiers: null,
        personId: 1,
        deathDate: null,
        identifier: 'PAT001',
        addressFieldValue: null,
        givenName: 'John',
        middleName: '',
        familyName: 'Doe',
        gender: 'M',
        dateCreated: new Date(),
        activeVisitUuid: '',
        customAttribute: '',
        hasBeenAdmitted: false,
        age: '33',
        patientProgramAttributeValue: null,
        appointmentUuid: 'appt-uuid-1',
        appointmentNumber: 'APT-001',
        appointmentDate: '2025-01-15',
        appointmentStatus: 'Scheduled',
        appointmentReason: 'Checkup',
      },
      {
        uuid: 'patient-uuid-2',
        birthDate: new Date('1985-05-15'),
        extraIdentifiers: null,
        personId: 2,
        deathDate: null,
        identifier: 'PAT002',
        addressFieldValue: null,
        givenName: 'Jane',
        middleName: '',
        familyName: 'Smith',
        gender: 'F',
        dateCreated: new Date(),
        activeVisitUuid: '',
        customAttribute: '',
        hasBeenAdmitted: false,
        age: '39',
        patientProgramAttributeValue: null,
        appointmentUuid: 'appt-uuid-2',
        appointmentNumber: 'APT-002',
        appointmentDate: '2025-01-16',
        appointmentStatus: 'Scheduled',
        appointmentReason: 'Follow-up',
      },
    ];

    it('should update the status of the matching appointment', () => {
      const result = updateAppointmentStatusInResults(
        mockAppointmentData,
        'appt-uuid-1',
        'Arrived',
      );

      expect(result[0].appointmentStatus).toBe('Arrived');
      expect(result[1].appointmentStatus).toBe('Scheduled');
    });

    it('should not modify appointments that do not match', () => {
      // Create a fresh copy for this test to avoid mutation from previous test
      const testData: AppointmentSearchResult[] = [
        {
          uuid: 'patient-uuid-1',
          birthDate: new Date('1990-01-01'),
          extraIdentifiers: null,
          personId: 1,
          deathDate: null,
          identifier: 'PAT001',
          addressFieldValue: null,
          givenName: 'John',
          middleName: '',
          familyName: 'Doe',
          gender: 'M',
          dateCreated: new Date(),
          activeVisitUuid: '',
          customAttribute: '',
          hasBeenAdmitted: false,
          age: '33',
          patientProgramAttributeValue: null,
          appointmentUuid: 'appt-uuid-1',
          appointmentNumber: 'APT-001',
          appointmentDate: '2025-01-15',
          appointmentStatus: 'Scheduled',
          appointmentReason: 'Checkup',
        },
        {
          uuid: 'patient-uuid-2',
          birthDate: new Date('1985-05-15'),
          extraIdentifiers: null,
          personId: 2,
          deathDate: null,
          identifier: 'PAT002',
          addressFieldValue: null,
          givenName: 'Jane',
          middleName: '',
          familyName: 'Smith',
          gender: 'F',
          dateCreated: new Date(),
          activeVisitUuid: '',
          customAttribute: '',
          hasBeenAdmitted: false,
          age: '39',
          patientProgramAttributeValue: null,
          appointmentUuid: 'appt-uuid-2',
          appointmentNumber: 'APT-002',
          appointmentDate: '2025-01-16',
          appointmentStatus: 'Scheduled',
          appointmentReason: 'Follow-up',
        },
      ];

      const result = updateAppointmentStatusInResults(
        testData,
        'non-existent-uuid',
        'Arrived',
      );

      expect(result[0].appointmentStatus).toBe('Scheduled');
      expect(result[1].appointmentStatus).toBe('Scheduled');
    });

    it('should return a new array with updated data', () => {
      const result = updateAppointmentStatusInResults(
        mockAppointmentData,
        'appt-uuid-2',
        'CheckedIn',
      );

      expect(result).not.toBe(mockAppointmentData);
      expect(result).toHaveLength(mockAppointmentData.length);
    });
  });

  describe('handleActionNavigation', () => {
    let mockNavigate: jest.MockedFunction<NavigateFunction>;

    beforeEach(() => {
      mockNavigate = jest.fn();
      delete (window as any).location;
      window.location = { href: '' } as any;
    });

    it('should navigate using react-router for hash URLs', () => {
      const options = {
        patientUuid: 'patient-123',
        appointmentNumber: 'APT-001',
      };
      handleActionNavigation(
        '#/patient/{{patientUuid}}/appointments',
        options,
        mockNavigate,
      );

      expect(mockNavigate).toHaveBeenCalledWith(
        '/patient/patient-123/appointments',
      );
    });

    it('should handle regular URLs by setting window.location.href', () => {
      const options = { patientUuid: 'patient-456' };
      handleActionNavigation(
        '/patient/{{patientUuid}}/details',
        options,
        mockNavigate,
      );

      expect(window.location.href).toBe('/patient/patient-456/details');
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should do nothing if navigationUrl is empty', () => {
      const options = {};
      handleActionNavigation('', options, mockNavigate);

      expect(mockNavigate).not.toHaveBeenCalled();
      expect(window.location.href).toBe('');
    });

    it('should replace multiple placeholders in the URL', () => {
      const options = {
        patientUuid: 'patient-789',
        appointmentNumber: 'APT-999',
      };
      handleActionNavigation(
        '#/patient/{{patientUuid}}/appointment/{{appointmentNumber}}',
        options,
        mockNavigate,
      );

      expect(mockNavigate).toHaveBeenCalledWith(
        '/patient/patient-789/appointment/APT-999',
      );
    });
  });

  describe('handleActionButtonClick', () => {
    let mockNavigate: jest.MockedFunction<NavigateFunction>;
    let mockSetPatientSearchData: jest.Mock;
    let mockAddNotification: jest.Mock;
    const mockT = (key: string) => key;

    const mockRow: PatientSearchViewModel<AppointmentSearchResult> = {
      uuid: 'patient-uuid-1',
      birthDate: new Date('1990-01-01'),
      extraIdentifiers: null,
      personId: 1,
      deathDate: null,
      identifier: 'PAT001',
      addressFieldValue: null,
      givenName: 'John',
      middleName: '',
      familyName: 'Doe',
      gender: 'M',
      dateCreated: new Date(),
      activeVisitUuid: '',
      customAttribute: '',
      hasBeenAdmitted: false,
      age: '33',
      patientProgramAttributeValue: null,
      appointmentUuid: 'appt-uuid-1',
      appointmentNumber: 'APT-001',
      appointmentDate: '2025-01-15',
      appointmentStatus: 'Scheduled',
      appointmentReason: 'Checkup',
      id: 'PAT001',
      name: 'John Doe',
    };

    const mockPatientSearchData: PatientSearchResultBundle = {
      totalCount: 1,
      pageOfResults: [mockRow],
    };

    beforeEach(() => {
      mockNavigate = jest.fn();
      mockSetPatientSearchData = jest.fn();
      mockAddNotification = jest.fn();
      jest.clearAllMocks();
    });

    it('should call updateAppointmentStatus for changeStatus action', async () => {
      const action: SearchActionConfig = {
        type: 'changeStatus',
        translationKey: 'Mark Arrived',
        onAction: {
          status: 'Arrived',
        },
        enabledRule: [],
      };

      (updateAppointmentStatus as jest.Mock).mockResolvedValue({
        uuid: 'appt-uuid-1',
        status: 'Arrived',
      });

      await handleActionButtonClick(
        action,
        mockRow,
        mockPatientSearchData,
        mockSetPatientSearchData,
        mockNavigate,
        mockAddNotification,
        mockT,
      );

      expect(updateAppointmentStatus).toHaveBeenCalledWith(
        'appt-uuid-1',
        'Arrived',
      );
      expect(mockSetPatientSearchData).toHaveBeenCalled();
    });

    it('should update patient search data after status change', async () => {
      const action: SearchActionConfig = {
        type: 'changeStatus',
        translationKey: 'Mark Arrived',
        onAction: {
          status: 'Arrived',
        },
        enabledRule: [],
      };

      (updateAppointmentStatus as jest.Mock).mockResolvedValue({
        uuid: 'appt-uuid-1',
        status: 'Arrived',
      });

      await handleActionButtonClick(
        action,
        mockRow,
        mockPatientSearchData,
        mockSetPatientSearchData,
        mockNavigate,
        mockAddNotification,
        mockT,
      );

      expect(mockSetPatientSearchData).toHaveBeenCalledWith({
        totalCount: 1,
        pageOfResults: expect.arrayContaining([
          expect.objectContaining({
            appointmentUuid: 'appt-uuid-1',
            appointmentStatus: 'Arrived',
          }),
        ]),
      });
    });

    it('should show success notification after changeStatus action when onSuccess is configured', async () => {
      const action: SearchActionConfig = {
        type: 'changeStatus',
        translationKey: 'Mark Arrived',
        onAction: { status: 'Arrived' },
        enabledRule: [],
        onSuccess: {
          notification:
            'REGISTRATION_APPOINTMENT_MARKED_AS_ARRIVED_SUCCESS_NOTIFICATION',
        },
      };

      (updateAppointmentStatus as jest.Mock).mockResolvedValue({
        uuid: 'appt-uuid-1',
        status: 'Arrived',
      });

      await handleActionButtonClick(
        action,
        mockRow,
        mockPatientSearchData,
        mockSetPatientSearchData,
        mockNavigate,
        mockAddNotification,
        mockT,
      );

      expect(mockAddNotification).toHaveBeenCalledWith({
        title:
          'REGISTRATION_APPOINTMENT_MARKED_AS_ARRIVED_SUCCESS_NOTIFICATION',
        message: '',
        type: 'success',
        timeout: 5000,
      });
    });

    it('should show success notification after checkInAndStartVisit action when onSuccess is configured', async () => {
      const action: SearchActionConfig = {
        type: 'checkInAndStartVisit',
        translationKey: 'Check In',
        onAction: {
          submit: '/bahmni/appointment/checkin',
        },
        enabledRule: [],
        onSuccess: {
          notification:
            'REGISTRATION_APPOINTMENT_MARKED_AS_ARRIVED_SUCCESS_NOTIFICATION',
        },
      };

      (checkInAppointment as jest.Mock).mockResolvedValue({
        appointmentUuid: 'appt-uuid-1',
        status: 'Arrived',
      });

      await handleActionButtonClick(
        action,
        mockRow,
        mockPatientSearchData,
        mockSetPatientSearchData,
        mockNavigate,
        mockAddNotification,
        mockT,
      );

      expect(mockAddNotification).toHaveBeenCalledWith({
        title:
          'REGISTRATION_APPOINTMENT_MARKED_AS_ARRIVED_SUCCESS_NOTIFICATION',
        message: '',
        type: 'success',
        timeout: 5000,
      });
    });

    it('should not show success notification when onSuccess is not configured', async () => {
      const action: SearchActionConfig = {
        type: 'changeStatus',
        translationKey: 'Mark Arrived',
        onAction: { status: 'Arrived' },
        enabledRule: [],
      };

      (updateAppointmentStatus as jest.Mock).mockResolvedValue({
        uuid: 'appt-uuid-1',
        status: 'Arrived',
      });

      await handleActionButtonClick(
        action,
        mockRow,
        mockPatientSearchData,
        mockSetPatientSearchData,
        mockNavigate,
        mockAddNotification,
        mockT,
      );

      expect(mockAddNotification).not.toHaveBeenCalled();
    });

    it('should navigate for navigate action', async () => {
      const action: SearchActionConfig = {
        type: 'navigate',
        translationKey: 'View Details',
        onAction: {
          navigation: '#/patient/{{patientUuid}}/appointments',
        },
        enabledRule: [],
      };

      await handleActionButtonClick(
        action,
        mockRow,
        mockPatientSearchData,
        mockSetPatientSearchData,
        mockNavigate,
        mockAddNotification,
        mockT,
      );

      expect(mockNavigate).toHaveBeenCalledWith(
        '/patient/patient-uuid-1/appointments',
      );
      expect(updateAppointmentStatus).not.toHaveBeenCalled();
    });

    it('should include appointmentNumber in navigation options', async () => {
      const action: SearchActionConfig = {
        type: 'navigate',
        translationKey: 'View Details',
        onAction: {
          navigation: '#/appointment/{{appointmentNumber}}',
        },
        enabledRule: [],
      };

      await handleActionButtonClick(
        action,
        mockRow,
        mockPatientSearchData,
        mockSetPatientSearchData,
        mockNavigate,
        mockAddNotification,
        mockT,
      );

      expect(mockNavigate).toHaveBeenCalledWith('/appointment/APT-001');
    });

    it('should call checkInAppointment with submit URL and appointmentUuid for checkInAndStartVisit action', async () => {
      const submitUrl = '/bahmni/appointment/checkin';
      const action: SearchActionConfig = {
        type: 'checkInAndStartVisit',
        translationKey: 'Check In',
        onAction: { submit: submitUrl },
        enabledRule: [],
      };

      (checkInAppointment as jest.Mock).mockResolvedValue({
        appointmentUuid: 'appt-uuid-1',
        status: 'Arrived',
      });

      await handleActionButtonClick(
        action,
        mockRow,
        mockPatientSearchData,
        mockSetPatientSearchData,
        mockNavigate,
        mockAddNotification,
        mockT,
      );

      expect(checkInAppointment).toHaveBeenCalledWith(submitUrl, 'appt-uuid-1');
      expect(updateAppointmentStatus).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should update patient search data after successful checkInAndStartVisit', async () => {
      const action: SearchActionConfig = {
        type: 'checkInAndStartVisit',
        translationKey: 'Check In',
        onAction: {
          submit: '/bahmni/appointment/checkin',
        },
        enabledRule: [],
      };

      (checkInAppointment as jest.Mock).mockResolvedValue({
        appointmentUuid: 'appt-uuid-1',
        status: 'Arrived',
      });

      await handleActionButtonClick(
        action,
        mockRow,
        mockPatientSearchData,
        mockSetPatientSearchData,
        mockNavigate,
        mockAddNotification,
        mockT,
      );

      expect(mockSetPatientSearchData).toHaveBeenCalledWith({
        totalCount: 1,
        pageOfResults: expect.arrayContaining([
          expect.objectContaining({
            appointmentUuid: 'appt-uuid-1',
            appointmentStatus: 'Arrived',
          }),
        ]),
      });
    });

    it('should show the API error message when changeStatus fails with a message', async () => {
      const action: SearchActionConfig = {
        type: 'changeStatus',
        translationKey: 'Mark Arrived',
        onAction: { status: 'Arrived' },
        enabledRule: [],
      };

      (updateAppointmentStatus as jest.Mock).mockRejectedValue(
        'Server error occurred',
      );

      await handleActionButtonClick(
        action,
        mockRow,
        mockPatientSearchData,
        mockSetPatientSearchData,
        mockNavigate,
        mockAddNotification,
        mockT,
      );

      expect(mockAddNotification).toHaveBeenCalledWith({
        title: 'Server error occurred',
        message: '',
        type: 'error',
        timeout: 5000,
      });
      expect(mockSetPatientSearchData).not.toHaveBeenCalled();
    });

    it('should show generic error notification when changeStatus fails without a message', async () => {
      const action: SearchActionConfig = {
        type: 'changeStatus',
        translationKey: 'Mark Arrived',
        onAction: { status: 'Arrived' },
        enabledRule: [],
      };

      (updateAppointmentStatus as jest.Mock).mockRejectedValue(null);

      await handleActionButtonClick(
        action,
        mockRow,
        mockPatientSearchData,
        mockSetPatientSearchData,
        mockNavigate,
        mockAddNotification,
        mockT,
      );

      expect(mockAddNotification).toHaveBeenCalledWith({
        title: 'REGISTRATION_ACTION_BUTTON_GENERIC_ERROR',
        message: '',
        type: 'error',
        timeout: 5000,
      });
    });

    it('should show the API error message when checkInAndStartVisit fails with a message', async () => {
      const action: SearchActionConfig = {
        type: 'checkInAndStartVisit',
        translationKey: 'Check In',
        onAction: { submit: '/bahmni/appointment/checkin' },
        enabledRule: [],
      };

      (checkInAppointment as jest.Mock).mockRejectedValue('Check-in failed');

      await handleActionButtonClick(
        action,
        mockRow,
        mockPatientSearchData,
        mockSetPatientSearchData,
        mockNavigate,
        mockAddNotification,
        mockT,
      );

      expect(mockAddNotification).toHaveBeenCalledWith({
        title: 'Check-in failed',
        message: '',
        type: 'error',
        timeout: 5000,
      });
      expect(mockSetPatientSearchData).not.toHaveBeenCalled();
    });

    it('should show generic error notification when checkInAndStartVisit fails without a message', async () => {
      const action: SearchActionConfig = {
        type: 'checkInAndStartVisit',
        translationKey: 'Check In',
        onAction: { submit: '/bahmni/appointment/checkin' },
        enabledRule: [],
      };

      (checkInAppointment as jest.Mock).mockRejectedValue(null);

      await handleActionButtonClick(
        action,
        mockRow,
        mockPatientSearchData,
        mockSetPatientSearchData,
        mockNavigate,
        mockAddNotification,
        mockT,
      );

      expect(mockAddNotification).toHaveBeenCalledWith({
        title: 'REGISTRATION_ACTION_BUTTON_GENERIC_ERROR',
        message: '',
        type: 'error',
        timeout: 5000,
      });
    });
  });

  describe('shouldRenderActionButton', () => {
    const mockUserPrivileges: UserPrivilege[] = [
      { uuid: 'priv-1', name: 'Manage Appointments' },
      { uuid: 'priv-2', name: 'Edit Patient' },
    ];

    const mockRow: PatientSearchViewModel<AppointmentSearchResult> = {
      uuid: 'patient-uuid-1',
      birthDate: new Date('1990-01-01'),
      extraIdentifiers: null,
      personId: 1,
      deathDate: null,
      identifier: 'PAT001',
      addressFieldValue: null,
      givenName: 'John',
      middleName: '',
      familyName: 'Doe',
      gender: 'M',
      dateCreated: new Date(),
      activeVisitUuid: '',
      customAttribute: '',
      hasBeenAdmitted: false,
      age: '33',
      patientProgramAttributeValue: null,
      appointmentUuid: 'appt-uuid-1',
      appointmentNumber: 'APT-001',
      appointmentDate: new Date().toISOString(),
      appointmentStatus: 'Scheduled',
      appointmentReason: 'Checkup',
      id: 'PAT001',
      name: 'John Doe',
    };

    it('should return false when enabledRule is empty', () => {
      const action: SearchActionConfig = {
        type: 'navigate',
        translationKey: 'View Details',
        onAction: {},
        enabledRule: [],
      };

      expect(
        shouldRenderActionButton(action, mockUserPrivileges, mockRow),
      ).toBe(false);
    });

    it('should return true when user has required privilege', () => {
      const action: SearchActionConfig = {
        type: 'navigate',
        translationKey: 'View Details',
        onAction: {},
        enabledRule: [
          { type: 'privilegeCheck', values: ['Manage Appointments'] },
        ],
      };

      expect(
        shouldRenderActionButton(action, mockUserPrivileges, mockRow),
      ).toBe(true);
    });

    it('should return false when user does not have required privilege', () => {
      const action: SearchActionConfig = {
        type: 'navigate',
        translationKey: 'View Details',
        onAction: {},
        enabledRule: [
          { type: 'privilegeCheck', values: ['Non-existent Privilege'] },
        ],
      };

      expect(
        shouldRenderActionButton(action, mockUserPrivileges, mockRow),
      ).toBe(false);
    });

    it('should return true when all rules pass (privilege + status + date)', () => {
      const action: SearchActionConfig = {
        type: 'changeStatus',
        translationKey: 'Mark Arrived',
        onAction: {},
        enabledRule: [
          { type: 'privilegeCheck', values: ['Manage Appointments'] },
          { type: 'statusCheck', values: ['Scheduled'] },
          { type: 'appDateCheck', values: ['today'] },
        ],
      };

      expect(
        shouldRenderActionButton(action, mockUserPrivileges, mockRow),
      ).toBe(true);
    });

    it('should return false when status check fails', () => {
      const action: SearchActionConfig = {
        type: 'changeStatus',
        translationKey: 'Mark Arrived',
        onAction: {},
        enabledRule: [
          { type: 'privilegeCheck', values: ['Manage Appointments'] },
          { type: 'statusCheck', values: ['Arrived'] },
        ],
      };

      expect(
        shouldRenderActionButton(action, mockUserPrivileges, mockRow),
      ).toBe(false);
    });

    it('should return false when date check fails', () => {
      const rowWithFutureDate = { ...mockRow, appointmentDate: '2099-12-31' };
      const action: SearchActionConfig = {
        type: 'changeStatus',
        translationKey: 'Mark Arrived',
        onAction: {},
        enabledRule: [
          { type: 'privilegeCheck', values: ['Manage Appointments'] },
          { type: 'appDateCheck', values: ['today'] },
        ],
      };

      expect(
        shouldRenderActionButton(action, mockUserPrivileges, rowWithFutureDate),
      ).toBe(false);
    });

    it('should return true when user has at least one of multiple required privileges', () => {
      const action: SearchActionConfig = {
        type: 'navigate',
        translationKey: 'View Details',
        onAction: {},
        enabledRule: [
          {
            type: 'privilegeCheck',
            values: ['Non-existent Privilege', 'Manage Appointments'],
          },
        ],
      };

      expect(
        shouldRenderActionButton(action, mockUserPrivileges, mockRow),
      ).toBe(true);
    });

    it('should handle multiple privilege check rules', () => {
      const action: SearchActionConfig = {
        type: 'navigate',
        translationKey: 'View Details',
        onAction: {},
        enabledRule: [
          { type: 'privilegeCheck', values: ['Manage Appointments'] },
          { type: 'privilegeCheck', values: ['Edit Patient'] },
        ],
      };

      expect(
        shouldRenderActionButton(action, mockUserPrivileges, mockRow),
      ).toBe(true);
    });

    it('should return false when enabledRule is undefined', () => {
      const action: SearchActionConfig = {
        type: 'navigate',
        translationKey: 'View Details',
        onAction: {},
        enabledRule: undefined,
      };

      expect(
        shouldRenderActionButton(action, mockUserPrivileges, mockRow),
      ).toBe(false);
    });
  });

  describe('appDateValidator', () => {
    const createMockRow = (
      appointmentDate: string,
    ): PatientSearchViewModel<AppointmentSearchResult> => ({
      uuid: 'patient-uuid-1',
      birthDate: new Date('1990-01-01'),
      extraIdentifiers: null,
      personId: 1,
      deathDate: null,
      identifier: 'PAT001',
      addressFieldValue: null,
      givenName: 'John',
      middleName: '',
      familyName: 'Doe',
      gender: 'M',
      dateCreated: new Date(),
      activeVisitUuid: '',
      customAttribute: '',
      hasBeenAdmitted: false,
      age: '33',
      patientProgramAttributeValue: null,
      appointmentUuid: 'appt-uuid-1',
      appointmentNumber: 'APT-001',
      appointmentDate,
      appointmentStatus: 'Scheduled',
      appointmentReason: 'Checkup',
      id: 'PAT001',
      name: 'John Doe',
    });

    const getTodayDateString = () => {
      const now = new Date();
      return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      ).toISOString();
    };

    const getPastDateString = () => {
      const date = new Date();
      date.setDate(date.getDate() - 5);
      return date.toISOString();
    };

    const getFutureDateString = () => {
      const date = new Date();
      date.setDate(date.getDate() + 5);
      return date.toISOString();
    };

    it('should return true for "today" rule when appointment is today', () => {
      const row = createMockRow(getTodayDateString());
      expect(appDateValidator(['today'], row)).toBe(true);
    });

    it('should return false for "today" rule when appointment is in the past', () => {
      const row = createMockRow(getPastDateString());
      expect(appDateValidator(['today'], row)).toBe(false);
    });

    it('should return false for "today" rule when appointment is in the future', () => {
      const row = createMockRow(getFutureDateString());
      expect(appDateValidator(['today'], row)).toBe(false);
    });

    it('should return true for "past" rule when appointment is in the past', () => {
      const row = createMockRow(getPastDateString());
      expect(appDateValidator(['past'], row)).toBe(true);
    });

    it('should return false for "past" rule when appointment is today', () => {
      const row = createMockRow(getTodayDateString());
      expect(appDateValidator(['past'], row)).toBe(false);
    });

    it('should return false for "past" rule when appointment is in the future', () => {
      const row = createMockRow(getFutureDateString());
      expect(appDateValidator(['past'], row)).toBe(false);
    });

    it('should return true for "future" rule when appointment is in the future', () => {
      const row = createMockRow(getFutureDateString());
      expect(appDateValidator(['future'], row)).toBe(true);
    });

    it('should return false for "future" rule when appointment is today', () => {
      const row = createMockRow(getTodayDateString());
      expect(appDateValidator(['future'], row)).toBe(false);
    });

    it('should return false for "future" rule when appointment is in the past', () => {
      const row = createMockRow(getPastDateString());
      expect(appDateValidator(['future'], row)).toBe(false);
    });

    it('should return true when at least one rule matches', () => {
      const row = createMockRow(getTodayDateString());
      expect(appDateValidator(['past', 'today', 'future'], row)).toBe(true);
    });

    it('should return false when no rules match', () => {
      const row = createMockRow(getTodayDateString());
      expect(appDateValidator(['past', 'future'], row)).toBe(false);
    });

    it('should return false for unknown rule values', () => {
      const row = createMockRow(getTodayDateString());
      expect(appDateValidator(['unknown', 'invalid'], row)).toBe(false);
    });

    it('should return false for empty rules array', () => {
      const row = createMockRow(getTodayDateString());
      expect(appDateValidator([], row)).toBe(false);
    });
  });

  describe('appointmentServiceValidator', () => {
    const FOLLOW_UP_UUID = '5b786bef-a263-4127-9f1a-7c585278ccad';
    const MAKATI_UUID = '816c8b33-a5b2-4ed0-a6fd-c596efa1bb0a';
    const OTHER_UUID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

    const createMockRow = (
      appointmentServiceUuid: string,
    ): PatientSearchViewModel<AppointmentSearchResult> => ({
      uuid: 'patient-uuid-1',
      birthDate: new Date('1990-01-01'),
      extraIdentifiers: null,
      personId: 1,
      deathDate: null,
      identifier: 'PAT001',
      addressFieldValue: null,
      givenName: 'John',
      middleName: '',
      familyName: 'Doe',
      gender: 'M',
      dateCreated: new Date(),
      activeVisitUuid: '',
      customAttribute: '',
      hasBeenAdmitted: false,
      age: '33',
      patientProgramAttributeValue: null,
      appointmentUuid: 'appt-uuid-1',
      appointmentNumber: 'APT-001',
      appointmentDate: new Date().toISOString(),
      appointmentStatus: 'Scheduled',
      appointmentReason: 'Checkup',
      appointmentServiceUuid,
      id: 'PAT001',
      name: 'John Doe',
    });

    it('should return false when service uuid is in excludeValues', () => {
      const row = createMockRow(FOLLOW_UP_UUID);
      expect(
        appointmentServiceValidator(
          undefined,
          [FOLLOW_UP_UUID, MAKATI_UUID],
          row,
        ),
      ).toBe(false);
    });

    it('should return true when service uuid is not in excludeValues', () => {
      const row = createMockRow(OTHER_UUID);
      expect(
        appointmentServiceValidator(
          undefined,
          [FOLLOW_UP_UUID, MAKATI_UUID],
          row,
        ),
      ).toBe(true);
    });

    it('should return true when service uuid is in values', () => {
      const row = createMockRow(FOLLOW_UP_UUID);
      expect(
        appointmentServiceValidator(
          [FOLLOW_UP_UUID, MAKATI_UUID],
          undefined,
          row,
        ),
      ).toBe(true);
    });

    it('should return false when service uuid is not in values', () => {
      const row = createMockRow(OTHER_UUID);
      expect(
        appointmentServiceValidator(
          [FOLLOW_UP_UUID, MAKATI_UUID],
          undefined,
          row,
        ),
      ).toBe(false);
    });

    it('should return false when neither values nor excludeValues are provided', () => {
      const row = createMockRow(OTHER_UUID);
      expect(appointmentServiceValidator(undefined, undefined, row)).toBe(
        false,
      );
    });

    it('should return false when values is an empty array', () => {
      const row = createMockRow(OTHER_UUID);
      expect(appointmentServiceValidator([], undefined, row)).toBe(false);
    });

    it('should return true when excludeValues is an empty array', () => {
      const row = createMockRow(OTHER_UUID);
      expect(appointmentServiceValidator(undefined, [], row)).toBe(true);
    });

    it('excludeValues takes precedence when both are provided', () => {
      const row = createMockRow(FOLLOW_UP_UUID);
      expect(
        appointmentServiceValidator([FOLLOW_UP_UUID], [FOLLOW_UP_UUID], row),
      ).toBe(false);
    });

    it('should return false when appointmentServiceUuid is undefined and excludeValues contains empty string', () => {
      const row = createMockRow('');
      expect(appointmentServiceValidator(undefined, [''], row)).toBe(false);
    });
  });

  describe('shouldRenderActionButton with appointmentService rules', () => {
    const FOLLOW_UP_UUID = '5b786bef-a263-4127-9f1a-7c585278ccad';
    const OTHER_UUID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

    const mockUserPrivileges: UserPrivilege[] = [
      { uuid: 'priv-1', name: 'Manage Appointments' },
    ];

    const createMockRow = (
      appointmentServiceUuid: string,
    ): PatientSearchViewModel<AppointmentSearchResult> => ({
      uuid: 'patient-uuid-1',
      birthDate: new Date('1990-01-01'),
      extraIdentifiers: null,
      personId: 1,
      deathDate: null,
      identifier: 'PAT001',
      addressFieldValue: null,
      givenName: 'John',
      middleName: '',
      familyName: 'Doe',
      gender: 'M',
      dateCreated: new Date(),
      activeVisitUuid: '',
      customAttribute: '',
      hasBeenAdmitted: false,
      age: '33',
      patientProgramAttributeValue: null,
      appointmentUuid: 'appt-uuid-1',
      appointmentNumber: 'APT-001',
      appointmentDate: new Date().toISOString(),
      appointmentStatus: 'Scheduled',
      appointmentReason: 'Checkup',
      appointmentServiceUuid,
      id: 'PAT001',
      name: 'John Doe',
    });

    it('should not render when service uuid is in excludeValues', () => {
      const action: SearchActionConfig = {
        type: 'changeStatus',
        translationKey: 'Mark Arrived',
        onAction: {},
        enabledRule: [
          { type: 'privilegeCheck', values: ['Manage Appointments'] },
          { type: 'appointmentService', excludeValues: [FOLLOW_UP_UUID] },
        ],
      };
      const row = createMockRow(FOLLOW_UP_UUID);
      expect(shouldRenderActionButton(action, mockUserPrivileges, row)).toBe(
        false,
      );
    });

    it('should render when service uuid is not in excludeValues', () => {
      const action: SearchActionConfig = {
        type: 'changeStatus',
        translationKey: 'Mark Arrived',
        onAction: {},
        enabledRule: [
          { type: 'privilegeCheck', values: ['Manage Appointments'] },
          { type: 'appointmentService', excludeValues: [FOLLOW_UP_UUID] },
        ],
      };
      const row = createMockRow(OTHER_UUID);
      expect(shouldRenderActionButton(action, mockUserPrivileges, row)).toBe(
        true,
      );
    });

    it('should render when service uuid is in values', () => {
      const action: SearchActionConfig = {
        type: 'checkInAndStartVisit',
        translationKey: 'Check In',
        onAction: {},
        enabledRule: [
          { type: 'privilegeCheck', values: ['Manage Appointments'] },
          { type: 'appointmentService', values: [FOLLOW_UP_UUID] },
        ],
      };
      const row = createMockRow(FOLLOW_UP_UUID);
      expect(shouldRenderActionButton(action, mockUserPrivileges, row)).toBe(
        true,
      );
    });

    it('should not render when service uuid is not in values', () => {
      const action: SearchActionConfig = {
        type: 'checkInAndStartVisit',
        translationKey: 'Check In',
        onAction: {},
        enabledRule: [
          { type: 'privilegeCheck', values: ['Manage Appointments'] },
          { type: 'appointmentService', values: [FOLLOW_UP_UUID] },
        ],
      };
      const row = createMockRow(OTHER_UUID);
      expect(shouldRenderActionButton(action, mockUserPrivileges, row)).toBe(
        false,
      );
    });

    it('should still check privileges when row is provided', () => {
      const action: SearchActionConfig = {
        type: 'changeStatus',
        translationKey: 'Mark Arrived',
        onAction: {},
        enabledRule: [
          { type: 'privilegeCheck', values: ['Missing Privilege'] },
          { type: 'appointmentService', excludeValues: [OTHER_UUID] },
        ],
      };
      const row = createMockRow(FOLLOW_UP_UUID);
      expect(shouldRenderActionButton(action, mockUserPrivileges, row)).toBe(
        false,
      );
    });

    it('should render when no appointmentService rule exists (backward compatible)', () => {
      const action: SearchActionConfig = {
        type: 'changeStatus',
        translationKey: 'Mark Arrived',
        onAction: {},
        enabledRule: [
          { type: 'privilegeCheck', values: ['Manage Appointments'] },
          { type: 'statusCheck', values: ['Scheduled'] },
        ],
      };
      const row = createMockRow(OTHER_UUID);
      expect(shouldRenderActionButton(action, mockUserPrivileges, row)).toBe(
        true,
      );
    });
  });
});
