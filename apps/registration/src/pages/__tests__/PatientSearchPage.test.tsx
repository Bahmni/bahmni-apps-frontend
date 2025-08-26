import { PatientSearch } from '@bahmni-frontend/bahmni-services';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import PatientSearchPage from '../PatientSearchPage';

const mockSearchPatientData: PatientSearch[] = [
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

describe('PatientSearchPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
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

  it('should render the Header with Breadcrumbs component', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <PatientSearchPage />
      </QueryClientProvider>,
    );
    expect(
      screen.getByRole('banner', { name: 'registration-search-page-header' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Registration')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-tile')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-seachbar')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-seachbar')).toHaveAttribute(
      'placeholder',
      'Search by name or patient ID',
    );
  });

  it('should render only search patient widget on mount', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <PatientSearchPage />
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('search-patient-seachbar')).toHaveAttribute(
      'placeholder',
      'Search by name or patient ID',
    );
    expect(screen.queryByTestId(/sortable-table-/)).not.toBeInTheDocument();
  });

  it('should show patient details when search is successfull', async () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: mockSearchPatientData,
      error: null,
      isLoading: false,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <PatientSearchPage />
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('search-patient-seachbar')).toHaveAttribute(
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

  it('should show not show sortable table when patient search returns no match', async () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      error: null,
      isLoading: false,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <PatientSearchPage />
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('search-patient-seachbar')).toHaveAttribute(
      'placeholder',
      'Search by name or patient ID',
    );
    const searchInput = screen.getByPlaceholderText(
      'Search by name or patient ID',
    );

    fireEvent.input(searchInput, { target: { value: 'ABC20000' } });
    fireEvent.click(screen.getByTestId('search-patient-search-button'));

    await waitFor(() => {
      expect(
        screen.queryByRole('div', { name: 'Add to cart' }),
      ).not.toBeInTheDocument();
    });
  });
});
