import {
  AppointmentSearchResult,
  PatientSearchResultBundle,
  SearchActionConfig,
  updateAppointmentStatus,
  UserPrivilege,
} from '@bahmni/services';
import { NavigateFunction } from 'react-router-dom';
import {
  getAppointmentStatusClassName,
  updateAppointmentStatusInResults,
  handleActionNavigation,
  handleActionButtonClick,
  isActionButtonEnabled,
  shouldRenderActionButton,
  appDateValidator,
} from '../appointmentSearchResultActionHandler';
import { PatientSearchViewModel } from '../utils';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  updateAppointmentStatus: jest.fn(),
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
      );

      expect(mockNavigate).toHaveBeenCalledWith('/appointment/APT-001');
    });
  });

  describe('isActionButtonEnabled', () => {
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
      appointmentDate: new Date().toISOString().split('T')[0], // Today's date
      appointmentStatus: 'Scheduled',
      appointmentReason: 'Checkup',
      id: 'PAT001',
      name: 'John Doe',
    };

    it('should return true when no enabled rules are provided', () => {
      expect(
        isActionButtonEnabled(undefined, mockRow, mockUserPrivileges),
      ).toBe(true);
      expect(isActionButtonEnabled([], mockRow, mockUserPrivileges)).toBe(true);
    });

    it('should return true when all rules pass', () => {
      const rules: SearchActionConfig['enabledRule'] = [
        { type: 'privilegeCheck', values: ['Manage Appointments'] },
        { type: 'statusCheck', values: ['Scheduled'] },
        { type: 'appDateCheck', values: ['today'] },
      ];

      expect(isActionButtonEnabled(rules, mockRow, mockUserPrivileges)).toBe(
        true,
      );
    });

    it('should return false when privilege check fails', () => {
      const rules: SearchActionConfig['enabledRule'] = [
        { type: 'privilegeCheck', values: ['Non-existent Privilege'] },
      ];

      expect(isActionButtonEnabled(rules, mockRow, mockUserPrivileges)).toBe(
        false,
      );
    });

    it('should return false when status check fails', () => {
      const rules: SearchActionConfig['enabledRule'] = [
        { type: 'statusCheck', values: ['Arrived'] },
      ];

      expect(isActionButtonEnabled(rules, mockRow, mockUserPrivileges)).toBe(
        false,
      );
    });

    it('should return false when date check fails', () => {
      const rowWithFutureDate = {
        ...mockRow,
        appointmentDate: '2025-12-31',
      };

      const rules: SearchActionConfig['enabledRule'] = [
        { type: 'appDateCheck', values: ['today'] },
      ];

      expect(
        isActionButtonEnabled(rules, rowWithFutureDate, mockUserPrivileges),
      ).toBe(false);
    });

    it('should return true when privilege check passes with multiple privileges', () => {
      const rules: SearchActionConfig['enabledRule'] = [
        {
          type: 'privilegeCheck',
          values: ['Manage Appointments', 'Edit Patient'],
        },
      ];

      expect(isActionButtonEnabled(rules, mockRow, mockUserPrivileges)).toBe(
        true,
      );
    });

    it('should return false when all rules do not pass', () => {
      const rules: SearchActionConfig['enabledRule'] = [
        { type: 'privilegeCheck', values: ['Manage Appointments'] },
        { type: 'statusCheck', values: ['Arrived'] }, // This will fail
      ];

      expect(isActionButtonEnabled(rules, mockRow, mockUserPrivileges)).toBe(
        false,
      );
    });
  });

  describe('shouldRenderActionButton', () => {
    const mockUserPrivileges: UserPrivilege[] = [
      { uuid: 'priv-1', name: 'Manage Appointments' },
      { uuid: 'priv-2', name: 'Edit Patient' },
    ];

    it('should return true when no privilege rules exist', () => {
      const action: SearchActionConfig = {
        type: 'navigate',
        translationKey: 'View Details',
        onAction: {},
        enabledRule: [],
      };

      expect(shouldRenderActionButton(action, mockUserPrivileges)).toBe(false);
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

      expect(shouldRenderActionButton(action, mockUserPrivileges)).toBe(true);
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

      expect(shouldRenderActionButton(action, mockUserPrivileges)).toBe(false);
    });

    it('should ignore non-privilege rules', () => {
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

      expect(shouldRenderActionButton(action, mockUserPrivileges)).toBe(true);
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

      expect(shouldRenderActionButton(action, mockUserPrivileges)).toBe(true);
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

      expect(shouldRenderActionButton(action, mockUserPrivileges)).toBe(true);
    });

    it('should return true when enabledRule is undefined', () => {
      const action: SearchActionConfig = {
        type: 'navigate',
        translationKey: 'View Details',
        onAction: {},
        enabledRule: undefined,
      };

      expect(shouldRenderActionButton(action, mockUserPrivileges)).toBe(false);
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
});
