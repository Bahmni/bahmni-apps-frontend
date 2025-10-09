import {
  PatientSearchResult,
  AUDIT_LOG_EVENT_DETAILS,
  AuditEventType,
  dispatchAuditEvent,
} from '@bahmni-frontend/bahmni-services';
import { NotificationProvider } from '@bahmni-frontend/bahmni-widgets';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MemoryRouter } from 'react-router-dom';
import PatientSearchPage from '..';
import i18n from '../../../../setupTests.i18n';

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
  },
];

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

jest.mock('@bahmni-frontend/bahmni-services', () => ({
  ...jest.requireActual('@bahmni-frontend/bahmni-services'),
  dispatchAuditEvent: jest.fn(),
}));

describe('PatientSearchPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    i18n.changeLanguage('en');
    jest.clearAllMocks();
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
  });

  afterEach(() => {
    queryClient.clear();
  });

  it("should log the user's visit to page", () => {
    render(
      <MemoryRouter>
        <NotificationProvider>
          <QueryClientProvider client={queryClient}>
            <PatientSearchPage />
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

  it('should render the Header with Breadcrumbs component', () => {
    render(
      <MemoryRouter>
        <NotificationProvider>
          <QueryClientProvider client={queryClient}>
            <PatientSearchPage />
          </QueryClientProvider>
        </NotificationProvider>
      </MemoryRouter>,
    );
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Search Patient')).toBeInTheDocument();
    expect(screen.getByText('Create new patient')).toBeInTheDocument();
    expect(screen.getByText('Hi, Profile name')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-tile')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-searchbar')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-searchbar')).toHaveAttribute(
      'placeholder',
      'Search by name or patient ID',
    );
  });

  it('should render only search patient widget on mount', async () => {
    render(
      <MemoryRouter>
        <NotificationProvider>
          <QueryClientProvider client={queryClient}>
            <PatientSearchPage />
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
            <PatientSearchPage />
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
    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isError: true,
      isLoading: false,
      error: new Error('Search Failed'),
    });

    render(
      <MemoryRouter>
        <NotificationProvider>
          <QueryClientProvider client={queryClient}>
            <PatientSearchPage />
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
      expect(screen.getAllByText('Error')).toHaveLength(2);
      expect(
        screen.getByText(
          'An unexpected error occurred during search. Please try again later.',
        ),
      ).toBeInTheDocument();
    });
  });

  it('should show loading state during search', async () => {
    (useQuery as jest.Mock).mockImplementation(({ queryKey, enabled }) => {
      const [, searchTerm] = queryKey;
      if (!enabled || !searchTerm) {
        return { data: undefined, error: null, isLoading: false };
      }
      return { data: undefined, error: null, isLoading: true };
    });

    render(
      <MemoryRouter>
        <NotificationProvider>
          <QueryClientProvider client={queryClient}>
            <PatientSearchPage />
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
            <PatientSearchPage />
          </QueryClientProvider>
        </NotificationProvider>
      </MemoryRouter>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should show phone-specific empty message when phone search returns no results', async () => {
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
            <PatientSearchPage />
          </QueryClientProvider>
        </NotificationProvider>
      </MemoryRouter>,
    );

    const phoneSearchInput = screen.getByTestId('phone-search-input');
    fireEvent.input(phoneSearchInput, { target: { value: '1234567890' } });
    fireEvent.click(screen.getByTestId('phone-search-button'));

    await waitFor(() => {
      expect(
        screen.getByText('REGISTRATION_PATIENT_SEARCH_PHONE_EMPTY_MESSAGE'),
      ).toBeInTheDocument();
    });
  });

  it('should show name-specific empty message when name search returns no results', async () => {
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
            <PatientSearchPage />
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
    it('should render patient ID as a clickable link with correct href', async () => {
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
              <PatientSearchPage />
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
        const patientLink1 = screen.getByRole('link', { name: 'ABC200001' });
        const patientLink2 = screen.getByRole('link', { name: 'ABC200002' });

        expect(patientLink1).toBeInTheDocument();
        expect(patientLink2).toBeInTheDocument();

        expect(patientLink1).toHaveAttribute(
          'href',
          '/bahmni/registration/index.html#/patient/02f47490-d657-48ee-98e7-4c9133ea168b',
        );
        expect(patientLink2).toHaveAttribute(
          'href',
          '/bahmni/registration/index.html#/patient/02f47490-d657-48ee-98e7-4c9133ea1685',
        );

        const patientName1 = screen.getByText('Steffi Maria Graf');
        const patientName2 = screen.getByText('John Doe');
        const phoneNumber = screen.getByText('864579392');
        const genderElements = screen.getAllByText('F');

        expect(patientName1).toBeInTheDocument();
        expect(patientName2).toBeInTheDocument();
        expect(phoneNumber).toBeInTheDocument();
        expect(genderElements.length).toBeGreaterThan(0);
        expect(patientName1.tagName).not.toBe('A');
        expect(patientName2.tagName).not.toBe('A');
        expect(phoneNumber.tagName).not.toBe('A');
        expect(genderElements[0].tagName).not.toBe('A');
      });
    });

    it('should navigate to patient details when row is clicked', async () => {
      delete (window as any).location;
      window.location = { href: '' } as any;

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
              <PatientSearchPage />
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
        const tableRows = screen.getAllByRole('row');
        const firstDataRow = tableRows[1];

        fireEvent.click(firstDataRow);

        expect(window.location.href).toBe(
          '/bahmni/registration/index.html#/patient/02f47490-d657-48ee-98e7-4c9133ea168b',
        );
      });
    });

    it('should show loading state when navigating to patient details', async () => {
      delete (window as any).location;
      window.location = { href: '' } as any;

      (useQuery as jest.Mock).mockReturnValue({
        data: {
          totalCount: mockSearchPatientData.length,
          pageOfResults: mockSearchPatientData,
        },
        error: null,
        isLoading: false,
      });

      const { rerender } = render(
        <MemoryRouter>
          <NotificationProvider>
            <QueryClientProvider client={queryClient}>
              <PatientSearchPage />
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
        const patientLink = screen.getByRole('link', { name: 'ABC200001' });
        fireEvent.click(patientLink);
      });

      rerender(
        <MemoryRouter>
          <NotificationProvider>
            <QueryClientProvider client={queryClient}>
              <PatientSearchPage />
            </QueryClientProvider>
          </NotificationProvider>
        </MemoryRouter>,
      );

      expect(screen.getByText('LOADING_PATIENT_DETAILS')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });
});
