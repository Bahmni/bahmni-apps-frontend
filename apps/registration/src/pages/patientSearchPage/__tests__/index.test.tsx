import {
  PatientSearchResult,
  AUDIT_LOG_EVENT_DETAILS,
  AuditEventType,
  dispatchAuditEvent,
  getRegistrationConfig,
} from '@bahmni/services';
import { NotificationProvider, UserPrivilegeProvider } from '@bahmni/widgets';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import PatientSearchPage from '..';
import i18n from '../../../../setupTests.i18n';
import { RegistrationConfigProvider } from '../../../providers/RegistrationConfigProvider';
import * as appointmentSearchResultActionHandler from '../appointmentSearchResultActionHandler';

expect.extend(toHaveNoViolations);

const mockSearchPatientData: PatientSearchResult[] = [
  {
    uuid: '02f47490-d657-48ee-98e7-4c9133ea168b',
    birthDate: new Date(-17366400000),
    extraIdentifiers: null,
    personId: 9,
    deathDate: null,
    identifier: 'ABC200001',
    addressFieldValue: null,
    givenName: 'Steffi',
    middleName: 'Maria',
    familyName: 'Graf',
    gender: 'F',
    dateCreated: new Date(1739872641000),
    activeVisitUuid: 'de947029-15f6-4318-afff-a1cbce3593d2',
    customAttribute: JSON.stringify({
      phoneNumber: '864579392',
      alternatePhoneNumber: '4596781239',
    }),
    hasBeenAdmitted: true,
    age: '56',
    patientProgramAttributeValue: null,
  },
  {
    uuid: '02f47490-d657-48ee-98e7-4c9133ea1685',
    birthDate: new Date(-17366400000),
    extraIdentifiers: null,
    personId: 9,
    deathDate: null,
    identifier: 'ABC200002',
    addressFieldValue: null,
    givenName: 'John',
    middleName: '',
    familyName: 'Doe',
    gender: 'M',
    dateCreated: new Date(1739872641000),
    activeVisitUuid: 'de947029-15f6-4318-afff-a1abce3593d2',
    customAttribute: '',
    hasBeenAdmitted: true,
    age: '56',
    patientProgramAttributeValue: null,
  },
  {
    uuid: '02f47490-d657-48ee-98e7-4c9133ea2685',
    birthDate: new Date(-17366400000),
    extraIdentifiers: null,
    personId: 9,
    deathDate: null,
    identifier: 'ABC200003',
    addressFieldValue: null,
    givenName: 'Jane',
    middleName: '',
    familyName: 'Doe',
    gender: 'F',
    dateCreated: new Date(1739872641000),
    activeVisitUuid: 'de947029-15f6-4318-afff-a1cbcs3593d2',
    customAttribute: '',
    hasBeenAdmitted: true,
    age: '56',
    patientProgramAttributeValue: null,
  },
];

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  dispatchAuditEvent: jest.fn(),
  getCurrentUser: jest.fn().mockResolvedValue({
    username: 'testuser',
    uuid: 'test-uuid',
  }),
  getRegistrationConfig: jest.fn(),
  updateAppointmentStatus: jest.fn(),
  notificationService: {
    register: jest.fn(),
    showError: jest.fn(),
    showSuccess: jest.fn(),
    showWarning: jest.fn(),
    showInfo: jest.fn(),
  },
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

jest.mock('../appointmentSearchResultActionHandler', () => {
  const actual = jest.requireActual('../appointmentSearchResultActionHandler');
  return {
    getAppointmentStatusClassName: jest.fn((status: string) => {
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
    }),
    handleActionButtonClick: jest.fn(),
    handleActionNavigation: jest.fn(),
    isActionButtonEnabled: jest.fn((...args) => {
      return actual.isActionButtonEnabled(...args);
    }),
    shouldRenderActionButton: jest.fn((...args) => {
      return actual.shouldRenderActionButton(...args);
    }),
  };
});

const mockUserPrivileges = [
  { name: 'Manage Appointments', retired: false },
  { name: 'Edit Patient', retired: false },
];

let mockSearchData: any = null;
let mockOnSearchArgs: any[];

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useUserPrivilege: jest.fn(() => ({
    userPrivileges: mockUserPrivileges,
  })),
  register: jest.fn(),
  useNotification: jest.fn(() => ({ addNotification: jest.fn() })),
  NotificationProvider: ({ children }: any) => children,
  SearchPatient: jest.fn(({ onSearch }) => {
    const handleSearch = () => {
      if (onSearch) {
        onSearch(...mockOnSearchArgs);
      }
    };

    return (
      <div data-testid="search-patient-tile" id="search-patient-tile">
        <div data-testid="search-patient-input" id="search-patient-input">
          <input
            data-testid="search-patient-searchbar"
            placeholder="Search by name or patient ID"
          />
          <button
            data-testid="search-patient-search-button"
            onClick={handleSearch}
          >
            Search
          </button>
        </div>
      </div>
    );
  }),
}));

describe('PatientSearchPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    i18n.changeLanguage('en');
    jest.clearAllMocks();

    mockSearchData = null;

    (getRegistrationConfig as jest.Mock).mockResolvedValue({
      patientSearch: {
        customAttributes: [
          {
            translationKey: 'REGISTRATION_PATIENT_SEARCH_PHONE_NUMBER',
            fields: ['phoneNumber', 'alternatePhoneNumber'],
            expectedFields: [
              {
                field: 'phoneNumber',
                translationKey: 'Phone Number',
              },
              {
                field: 'alternatePhoneNumber',
                translationKey: 'Alternate Phone Number',
              },
            ],
            type: 'person',
          },
        ],
        appointment: [
          {
            translationKey: 'REGISTRATION_PATIENT_SEARCH_APPOINTMENT',
            fields: ['appointmentNumber'],
            expectedFields: [
              {
                field: 'appointmentNumber',
                translationKey: 'Appointment Number',
              },
            ],
            type: 'appointment',
            actions: [
              {
                type: 'navigate',
                translationKey: 'View Details',
                onAction: {
                  navigation: '/patient/{{patientUuid}}/appointments',
                },
                enabledRule: [],
              },
            ],
          },
        ],
      },
    });

    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      error: null,
      isLoading: false,
    });
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'bahmni.user.location=location;',
    });
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    mockOnSearchArgs = [undefined, 'test-search'];
  });

  afterEach(() => {
    queryClient.clear();
  });

  it("should log the user's visit to page", () => {
    render(
      <MemoryRouter>
        <NotificationProvider>
          <QueryClientProvider client={queryClient}>
            <UserPrivilegeProvider>
              <PatientSearchPage />
            </UserPrivilegeProvider>
          </QueryClientProvider>
        </NotificationProvider>
      </MemoryRouter>,
    );
    expect(dispatchAuditEvent).toHaveBeenCalledWith({
      eventType: AUDIT_LOG_EVENT_DETAILS.VIEWED_REGISTRATION_PATIENT_SEARCH
        .eventType as AuditEventType,
      module: AUDIT_LOG_EVENT_DETAILS.VIEWED_REGISTRATION_PATIENT_SEARCH.module,
    });
  });

  it('should render the Header with Breadcrumbs and globalActions', () => {
    render(
      <MemoryRouter>
        <NotificationProvider>
          <QueryClientProvider client={queryClient}>
            <UserPrivilegeProvider>
              <PatientSearchPage />
            </UserPrivilegeProvider>
          </QueryClientProvider>
        </NotificationProvider>
      </MemoryRouter>,
    );
    expect(screen.getByTestId('global-action-user')).toBeInTheDocument();
    const createNewPatientButton = screen.getByRole('button', {
      name: /create new patient/i,
    });
    expect(createNewPatientButton).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-tile')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-searchbar')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-searchbar')).toHaveAttribute(
      'placeholder',
      'Search by name or patient ID',
    );
  });

  it('should render appointment-specific headers when appointment config is present', async () => {
    const appointmentData = [
      {
        ...mockSearchPatientData[0],
        appointmentNumber: 'APT-12345',
        appointmentDate: '15 Jan 2025 10:30 AM',
        appointmentReason: 'Consultation',
        appointmentStatus: 'Scheduled',
      },
    ];

    mockSearchData = {
      totalCount: 1,
      pageOfResults: appointmentData,
    };

    mockOnSearchArgs = [mockSearchData, 'test-search'];

    (useQuery as jest.Mock).mockReturnValue({
      data: {
        totalCount: 1,
        pageOfResults: appointmentData,
      },
      error: null,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <NotificationProvider>
          <QueryClientProvider client={queryClient}>
            <UserPrivilegeProvider>
              <PatientSearchPage />
            </UserPrivilegeProvider>
          </QueryClientProvider>
        </NotificationProvider>
      </MemoryRouter>,
    );

    const searchInput = screen.getByPlaceholderText(
      'Search by name or patient ID',
    );
    fireEvent.input(searchInput, { target: { value: 'APT' } });
    fireEvent.click(screen.getByTestId('search-patient-search-button'));

    await waitFor(() => {
      expect(screen.getByText('Phone Number')).toBeInTheDocument();
      expect(screen.getByText('Alternate Phone Number')).toBeInTheDocument();
    });
  });

  it('should render only search patient widget on mount', async () => {
    render(
      <MemoryRouter>
        <NotificationProvider>
          <QueryClientProvider client={queryClient}>
            <UserPrivilegeProvider>
              <PatientSearchPage />
            </UserPrivilegeProvider>
          </QueryClientProvider>
        </NotificationProvider>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('search-patient-searchbar')).toHaveAttribute(
      'placeholder',
      'Search by name or patient ID',
    );
    expect(screen.queryByTestId(/sortable-table-/)).not.toBeInTheDocument();
  });

  it('should show patient details when search is successfull', async () => {
    mockSearchData = {
      totalCount: mockSearchPatientData.length,
      pageOfResults: mockSearchPatientData,
    };
    mockOnSearchArgs = [mockSearchData, 'test-search'];

    (useQuery as jest.Mock).mockReturnValue({
      data: {
        totalCount: mockSearchPatientData.length,
        pageOfResults: mockSearchPatientData,
      },
      error: null,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <NotificationProvider>
          <QueryClientProvider client={queryClient}>
            <UserPrivilegeProvider>
              <PatientSearchPage />
            </UserPrivilegeProvider>
          </QueryClientProvider>
        </NotificationProvider>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('search-patient-searchbar')).toHaveAttribute(
      'placeholder',
      'Search by name or patient ID',
    );
    const searchInput = screen.getByPlaceholderText(
      'Search by name or patient ID',
    );

    fireEvent.input(searchInput, { target: { value: 'new value' } });
    fireEvent.click(screen.getByTestId('search-patient-search-button'));

    await waitFor(() => {
      expect(
        screen.getByText(
          'Patient results (' + mockSearchPatientData.length + ')',
        ),
      ).toBeInTheDocument();
    });
  });

  it('should show patient error details when search fails', async () => {
    mockOnSearchArgs = [undefined, 'test-search', false, true];
    render(
      <MemoryRouter>
        <NotificationProvider>
          <QueryClientProvider client={queryClient}>
            <UserPrivilegeProvider>
              <PatientSearchPage />
            </UserPrivilegeProvider>
          </QueryClientProvider>
        </NotificationProvider>
      </MemoryRouter>,
    );

    const searchInput = screen.getByPlaceholderText(
      'Search by name or patient ID',
    );
    fireEvent.input(searchInput, { target: { value: 'new value' } });
    fireEvent.click(screen.getByTestId('search-patient-search-button'));

    await waitFor(() => {
      expect(
        screen.getByTestId('patient-search-title-error'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'An unexpected error occurred during search. Please try again later.',
        ),
      ).toBeInTheDocument();
    });
  });

  it('should show loading state during search', async () => {
    mockOnSearchArgs = [undefined, 'test-search', true];

    render(
      <MemoryRouter>
        <NotificationProvider>
          <QueryClientProvider client={queryClient}>
            <UserPrivilegeProvider>
              <PatientSearchPage />
            </UserPrivilegeProvider>
          </QueryClientProvider>
        </NotificationProvider>
      </MemoryRouter>,
    );

    const searchInput = screen.getByPlaceholderText(
      'Search by name or patient ID',
    );
    fireEvent.input(searchInput, { target: { value: 'test search' } });
    fireEvent.click(screen.getByTestId('search-patient-search-button'));

    await waitFor(() => {
      expect(
        screen.getByTestId('patient-search-title-loading'),
      ).toBeInTheDocument();
    });
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <NotificationProvider>
          <QueryClientProvider client={queryClient}>
            <UserPrivilegeProvider>
              <PatientSearchPage />
            </UserPrivilegeProvider>
          </QueryClientProvider>
        </NotificationProvider>
      </MemoryRouter>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should show name-specific empty message when name search returns no results', async () => {
    mockSearchData = {
      totalCount: 0,
      pageOfResults: [],
    };
    mockOnSearchArgs = [mockSearchData, 'test-search', false, false];

    (useQuery as jest.Mock).mockReturnValue({
      data: {
        totalCount: 0,
        pageOfResults: [],
      },
      error: null,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <NotificationProvider>
          <QueryClientProvider client={queryClient}>
            <UserPrivilegeProvider>
              <PatientSearchPage />
            </UserPrivilegeProvider>
          </QueryClientProvider>
        </NotificationProvider>
      </MemoryRouter>,
    );

    const searchInput = screen.getByPlaceholderText(
      'Search by name or patient ID',
    );
    fireEvent.input(searchInput, { target: { value: 'John Doe' } });
    fireEvent.click(screen.getByTestId('search-patient-search-button'));

    await waitFor(() => {
      expect(
        screen.getByText(/Could not find patient with identifier\/name/),
      ).toBeInTheDocument();
    });
  });

  describe('Patient ID Link Navigation', () => {
    it('should render patient ID as text in search results', async () => {
      mockSearchData = {
        totalCount: mockSearchPatientData.length,
        pageOfResults: mockSearchPatientData,
      };
      mockOnSearchArgs = [mockSearchData, 'test-search'];

      (useQuery as jest.Mock).mockReturnValue({
        data: {
          totalCount: mockSearchPatientData.length,
          pageOfResults: mockSearchPatientData,
        },
        error: null,
        isLoading: false,
      });

      render(
        <MemoryRouter>
          <NotificationProvider>
            <QueryClientProvider client={queryClient}>
              <RegistrationConfigProvider>
                <UserPrivilegeProvider>
                  <PatientSearchPage />
                </UserPrivilegeProvider>
              </RegistrationConfigProvider>
            </QueryClientProvider>
          </NotificationProvider>
        </MemoryRouter>,
      );

      const searchInput = screen.getByPlaceholderText(
        'Search by name or patient ID',
      );
      fireEvent.input(searchInput, { target: { value: 'test search' } });
      fireEvent.click(screen.getByTestId('search-patient-search-button'));

      await waitFor(() => {
        // Patient IDs are rendered as text, not links
        expect(screen.getByText('ABC200001')).toBeInTheDocument();
        expect(screen.getByText('ABC200002')).toBeInTheDocument();

        const patientName1 = screen.getByText('Steffi Maria Graf');
        const patientName2 = screen.getByText('John Doe');
        const phoneNumber = screen.getByText('864579392');
        const genderElements = screen.getAllByText('F');

        expect(patientName1).toBeInTheDocument();
        expect(patientName2).toBeInTheDocument();
        expect(phoneNumber).toBeInTheDocument();
        expect(genderElements.length).toBeGreaterThan(0);
      });
    });

    it('should display patient data in search results table', async () => {
      delete (window as any).location;
      window.location = { href: '' } as any;

      mockSearchData = {
        totalCount: mockSearchPatientData.length,
        pageOfResults: mockSearchPatientData,
      };
      mockOnSearchArgs = [mockSearchData, 'test-search'];

      (useQuery as jest.Mock).mockReturnValue({
        data: {
          totalCount: mockSearchPatientData.length,
          pageOfResults: mockSearchPatientData,
        },
        error: null,
        isLoading: false,
      });

      render(
        <MemoryRouter>
          <NotificationProvider>
            <QueryClientProvider client={queryClient}>
              <UserPrivilegeProvider>
                <PatientSearchPage />
              </UserPrivilegeProvider>
            </QueryClientProvider>
          </NotificationProvider>
        </MemoryRouter>,
      );

      const searchInput = screen.getByPlaceholderText(
        'Search by name or patient ID',
      );
      fireEvent.input(searchInput, { target: { value: 'test search' } });
      fireEvent.click(screen.getByTestId('search-patient-search-button'));

      await waitFor(() => {
        // Check patient data is displayed in table
        expect(screen.getByText('ABC200001')).toBeInTheDocument();
        expect(screen.getByText('Steffi Maria Graf')).toBeInTheDocument();
        expect(screen.getByText('864579392')).toBeInTheDocument();
      });
    });
  });

  describe('Appointment Mode Tests', () => {
    const now = new Date();
    const todayDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const mockAppointmentData = [
      {
        ...mockSearchPatientData[0],
        appointmentUuid: 'appt-uuid-001',
        appointmentNumber: 'APT-2025-001',
        appointmentDate: todayDate,
        appointmentStatus: 'Scheduled',
        appointmentReason: 'Regular Checkup',
      },
      {
        ...mockSearchPatientData[1],
        appointmentUuid: 'appt-uuid-002',
        appointmentNumber: 'APT-2025-002',
        appointmentDate: '2025-12-31',
        appointmentStatus: 'Arrived',
        appointmentReason: 'Follow-up',
      },
    ];

    const renderComponent = () => {
      return render(
        <MemoryRouter>
          <NotificationProvider>
            <QueryClientProvider client={queryClient}>
              <UserPrivilegeProvider>
                <PatientSearchPage />
              </UserPrivilegeProvider>
            </QueryClientProvider>
          </NotificationProvider>
        </MemoryRouter>,
      );
    };

    beforeEach(() => {
      mockSearchData = {
        totalCount: 1,
        pageOfResults: [mockAppointmentData[0]],
      };
      mockOnSearchArgs = [
        mockSearchData,
        'test-search',
        false,
        false,
        true,
        'appointment',
      ];

      (getRegistrationConfig as jest.Mock).mockResolvedValue({
        patientSearch: {
          customAttributes: [],
          appointment: [
            {
              translationKey: 'REGISTRATION_PATIENT_SEARCH_APPOINTMENT',
              fields: ['appointmentNumber'],
              expectedFields: [
                {
                  field: 'appointmentNumber',
                  translationKey: 'Appointment Number',
                },
                {
                  field: 'appointmentDate',
                  translationKey: 'Appointment Date',
                },
                {
                  field: 'appointmentStatus',
                  translationKey: 'Status',
                },
              ],
              type: 'appointment',
              actions: [
                {
                  type: 'navigate',
                  translationKey: 'View Details',
                  onAction: {
                    navigation: '/patient/{{patientUuid}}/appointments',
                  },
                  enabledRule: [
                    {
                      type: 'privilegeCheck',
                      values: ['Manage Appointments'],
                    },
                  ],
                },
                {
                  type: 'changeStatus',
                  translationKey: 'Mark Arrived',
                  onAction: {
                    status: 'Arrived',
                  },
                  enabledRule: [
                    {
                      type: 'privilegeCheck',
                      values: ['Manage Appointments'],
                    },
                    {
                      type: 'statusCheck',
                      values: ['Scheduled'],
                    },
                    {
                      type: 'appDateCheck',
                      values: ['today'],
                    },
                  ],
                },
              ],
            },
          ],
        },
      });
    });

    afterEach(() => {
      mockSearchData = null;
      mockOnSearchArgs = [];
    });

    it('should render appointment-specific headers when appointment config is loaded', async () => {
      mockSearchData = {
        totalCount: 1,
        pageOfResults: mockAppointmentData,
      };

      mockOnSearchArgs = [
        mockSearchData,
        'test-search',
        false,
        false,
        true,
        'appointment',
      ];

      (useQuery as jest.Mock).mockReturnValue({
        data: {
          totalCount: 1,
          pageOfResults: mockAppointmentData,
        },
        error: null,
        isLoading: false,
      });

      renderComponent();

      await waitFor(() => {
        expect(getRegistrationConfig).toHaveBeenCalled();
      });

      const searchInput = screen.getByPlaceholderText(
        'Search by name or patient ID',
      );
      fireEvent.input(searchInput, { target: { value: 'APT' } });
      fireEvent.click(screen.getByTestId('search-patient-search-button'));

      await waitFor(() => {
        expect(screen.getByText('Appointment Number')).toBeInTheDocument();
        expect(screen.getByText('Appointment Date')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
      });

      await waitFor(() => {
        const viewDetailsButtons = screen.getAllByText('View Details');
        expect(viewDetailsButtons.length).toBeGreaterThan(0);
      });
    });

    it('should update all state values when search is performed', async () => {
      mockSearchData = {
        totalCount: mockSearchPatientData.length,
        pageOfResults: mockSearchPatientData,
      };

      mockOnSearchArgs = [
        mockSearchData,
        'test-search',
        false,
        false,
        true,
        'appointment',
      ];

      (useQuery as jest.Mock).mockReturnValue({
        data: {
          totalCount: mockSearchPatientData.length,
          pageOfResults: mockSearchPatientData,
        },
        error: null,
        isLoading: false,
      });

      render(
        <MemoryRouter>
          <NotificationProvider>
            <QueryClientProvider client={queryClient}>
              <UserPrivilegeProvider>
                <PatientSearchPage />
              </UserPrivilegeProvider>
            </QueryClientProvider>
          </NotificationProvider>
        </MemoryRouter>,
      );

      const searchInput = screen.getByPlaceholderText(
        'Search by name or patient ID',
      );
      fireEvent.input(searchInput, { target: { value: 'search term' } });
      fireEvent.click(screen.getByTestId('search-patient-search-button'));

      await waitFor(() => {
        expect(screen.getByText('Patient results (3)')).toBeInTheDocument();
      });
    });

    it('should render action buttons for appointment rows', async () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: {
          totalCount: 1,
          pageOfResults: [mockAppointmentData[0]],
        },
        error: null,
        isLoading: false,
      });

      renderComponent();

      await waitFor(() => {
        expect(getRegistrationConfig).toHaveBeenCalled();
      });

      const searchInput = screen.getByPlaceholderText(
        'Search by name or patient ID',
      );
      fireEvent.input(searchInput, { target: { value: 'APT' } });
      fireEvent.click(screen.getByTestId('search-patient-search-button'));

      await waitFor(() => {
        expect(screen.getByText('View Details')).toBeInTheDocument();
        expect(screen.getByText('Mark Arrived')).toBeInTheDocument();
      });
    });

    it('should enable "Mark Arrived" button when all rules pass', async () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: {
          totalCount: 1,
          pageOfResults: [mockAppointmentData[0]],
        },
        error: null,
        isLoading: false,
      });

      renderComponent();

      await waitFor(() => {
        expect(getRegistrationConfig).toHaveBeenCalled();
      });

      const searchInput = screen.getByPlaceholderText(
        'Search by name or patient ID',
      );
      fireEvent.input(searchInput, { target: { value: 'APT' } });
      fireEvent.click(screen.getByTestId('search-patient-search-button'));

      await waitFor(() => {
        const markArrivedButton = screen.getByText('Mark Arrived');
        expect(markArrivedButton).not.toBeDisabled();
      });
    });

    it('should disable "Mark Arrived" button when date is not today', async () => {
      mockSearchData = {
        totalCount: 1,
        pageOfResults: [mockAppointmentData[1]],
      };
      mockOnSearchArgs = [
        mockSearchData,
        'test-search',
        false,
        false,
        true,
        'appointment',
      ];

      (useQuery as jest.Mock).mockReturnValue({
        data: {
          totalCount: 1,
          pageOfResults: [mockAppointmentData[1]],
        },
        error: null,
        isLoading: false,
      });

      renderComponent();

      await waitFor(() => {
        expect(getRegistrationConfig).toHaveBeenCalled();
      });

      const searchInput = screen.getByPlaceholderText(
        'Search by name or patient ID',
      );
      fireEvent.input(searchInput, { target: { value: 'APT' } });
      fireEvent.click(screen.getByTestId('search-patient-search-button'));

      await waitFor(() => {
        const markArrivedButton = screen.getByText('Mark Arrived');
        expect(markArrivedButton).toBeDisabled();
      });
    });

    it('should handle navigate action button click', async () => {
      const mockNavigate = jest.fn();
      (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
      (useQuery as jest.Mock).mockReturnValue({
        data: {
          totalCount: 1,
          pageOfResults: [mockAppointmentData[0]],
        },
        error: null,
        isLoading: false,
      });

      renderComponent();

      await waitFor(() => {
        expect(getRegistrationConfig).toHaveBeenCalled();
      });

      const searchInput = screen.getByPlaceholderText(
        'Search by name or patient ID',
      );
      fireEvent.input(searchInput, { target: { value: 'APT' } });
      fireEvent.click(screen.getByTestId('search-patient-search-button'));

      await waitFor(() => {
        const viewDetailsButton = screen.getByText('View Details');
        fireEvent.click(viewDetailsButton);
      });

      expect(
        appointmentSearchResultActionHandler.handleActionButtonClick,
      ).toHaveBeenCalled();
    });

    it('should not navigate when row is clicked in appointment mode', async () => {
      delete (window as any).location;
      window.location = { href: '' } as any;

      (useQuery as jest.Mock).mockReturnValue({
        data: {
          totalCount: 1,
          pageOfResults: [mockAppointmentData[0]],
        },
        error: null,
        isLoading: false,
      });

      renderComponent();

      await waitFor(() => {
        expect(getRegistrationConfig).toHaveBeenCalled();
      });

      const searchInput = screen.getByPlaceholderText(
        'Search by name or patient ID',
      );
      fireEvent.input(searchInput, { target: { value: 'APT' } });
      fireEvent.click(screen.getByTestId('search-patient-search-button'));

      await waitFor(() => {
        const tableRows = screen.getAllByRole('row');
        const initialHref = window.location.href;
        const dataRow = tableRows[1];
        fireEvent.click(dataRow);
        expect(window.location.href).toBe(initialHref);
      });
    });

    it('should always enable navigation buttons with no enabledRule', async () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: {
          totalCount: 1,
          pageOfResults: [mockAppointmentData[0]],
        },
        error: null,
        isLoading: false,
      });

      renderComponent();

      await waitFor(() => {
        expect(getRegistrationConfig).toHaveBeenCalled();
      });

      const searchInput = screen.getByPlaceholderText(
        'Search by name or patient ID',
      );
      fireEvent.input(searchInput, { target: { value: 'APT' } });
      fireEvent.click(screen.getByTestId('search-patient-search-button'));

      await waitFor(() => {
        const viewDetailsButton = screen.getByText('View Details');
        expect(viewDetailsButton).not.toBeDisabled();
      });
    });

    it('should handle navigation with hash URL format', async () => {
      delete (window as any).location;
      window.location = { href: '' } as any;

      (getRegistrationConfig as jest.Mock).mockResolvedValue({
        patientSearch: {
          customAttributes: [],
          appointment: [
            {
              translationKey: 'REGISTRATION_PATIENT_SEARCH_APPOINTMENT',
              fields: ['appointmentNumber'],
              expectedFields: [
                {
                  field: 'appointmentNumber',
                  translationKey: 'Appointment Number',
                },
              ],
              type: 'appointment',
              actions: [
                {
                  type: 'navigate',
                  translationKey: 'View with Hash',
                  onAction: {
                    navigation: '#/patient/{{patientUuid}}/details',
                  },
                  enabledRule: [
                    {
                      type: 'privilegeCheck',
                      values: ['Manage Appointments'],
                    },
                  ],
                },
              ],
            },
          ],
        },
      });
      (useQuery as jest.Mock).mockReturnValue({
        data: {
          totalCount: 1,
          pageOfResults: [mockAppointmentData[0]],
        },
        error: null,
        isLoading: false,
      });

      renderComponent();

      await waitFor(() => {
        expect(getRegistrationConfig).toHaveBeenCalled();
      });

      const searchInput = screen.getByPlaceholderText(
        'Search by name or patient ID',
      );
      fireEvent.input(searchInput, { target: { value: 'APT' } });
      fireEvent.click(screen.getByTestId('search-patient-search-button'));

      await waitFor(() => {
        const hashNavButton = screen.getByText('View with Hash');
        fireEvent.click(hashNavButton);
        expect(
          appointmentSearchResultActionHandler.handleActionButtonClick,
        ).toHaveBeenCalled();
      });
    });

    it('should correctly translate appointment status', async () => {
      mockSearchData = {
        totalCount: 2,
        pageOfResults: mockAppointmentData,
      };

      mockOnSearchArgs = [
        mockSearchData,
        'test-search',
        false,
        false,
        true,
        'appointment',
      ];

      (useQuery as jest.Mock).mockReturnValue({
        data: {
          totalCount: 2,
          pageOfResults: mockAppointmentData,
        },
        error: null,
        isLoading: false,
      });

      renderComponent();

      await waitFor(() => {
        expect(getRegistrationConfig).toHaveBeenCalled();
      });

      const searchInput = screen.getByPlaceholderText(
        'Search by name or patient ID',
      );
      fireEvent.input(searchInput, { target: { value: 'APT' } });
      fireEvent.click(screen.getByTestId('search-patient-search-button'));

      await waitFor(() => {
        expect(screen.getByText('Scheduled')).toBeInTheDocument();
        expect(screen.getByText('Arrived')).toBeInTheDocument();
      });
    });
  });
});
