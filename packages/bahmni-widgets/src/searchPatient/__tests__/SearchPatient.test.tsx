import {
  PatientSearch,
  searchPatientByNameOrId,
} from '@bahmni-frontend/bahmni-services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SearchPatient from '../SearchPatient';

jest.mock('@bahmni-frontend/bahmni-services', () => ({
  searchPatientByNameOrId: jest.fn(),
}));

const mockHandleSearchPatientUpdate = jest.fn();

const mockSearchPatientData: PatientSearch[] = [
  {
    uuid: '02f47490-d657-48ee-98e7-4c9133ea168b',
    birthDate: new Date(-17366400000),
    extraIdentifiers: null,
    personId: 9,
    deathDate: null,
    identifier: 'ABC200000',
    addressFieldValue: null,
    givenName: 'Steffi',
    middleName: 'Maria',
    familyName: 'Graf',
    gender: 'F',
    dateCreated: new Date(1739872641000),
    activeVisitUuid: 'de947029-15f6-4318-afff-a1cbce3593d2',
    customAttribute: {
      phoneNumber: '864579392',
      alternatePhoneNumber: '4596781239',
    },
    hasBeenAdmitted: true,
    age: '56',
  },
];

describe('SearchPatient', () => {
  let queryClient;

  beforeEach(() => {
    jest.clearAllMocks();
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

  it('should render the searchbar and the search button', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SearchPatient handleSearchPatient={mockHandleSearchPatientUpdate} />
      </QueryClientProvider>,
    );
    expect(screen.getByTestId('search-patient')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-seachbar')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-seachbar')).toHaveAttribute(
      'placeholder',
      'Search by name or patient ID',
    );
    expect(
      screen.getByTestId('search-patient-search-button'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('search-patient-search-button'),
    ).toHaveTextContent('Search');
  });

  it('should search for patient when search input has a valid text', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SearchPatient handleSearchPatient={mockHandleSearchPatientUpdate} />
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('search-patient')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-seachbar')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-seachbar')).toHaveAttribute(
      'placeholder',
      'Search by name or patient ID',
    );

    const searchInput = screen.getByPlaceholderText(
      'Search by name or patient ID',
    );

    (searchPatientByNameOrId as jest.Mock).mockReturnValue({});

    await waitFor(() => {
      fireEvent.input(searchInput, { target: { value: 'new value' } });
      fireEvent.click(screen.getByTestId('search-patient-search-button'));
    });

    expect(searchPatientByNameOrId).toHaveBeenCalledTimes(1);
    expect(mockHandleSearchPatientUpdate).toHaveBeenCalled();
    expect(searchPatientByNameOrId).toHaveBeenCalledWith('new value');
  });

  it('should return patient search data back to parent component when search is successfull', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SearchPatient handleSearchPatient={mockHandleSearchPatientUpdate} />
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('search-patient')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-seachbar')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-seachbar')).toHaveAttribute(
      'placeholder',
      'Search by name or patient ID',
    );

    const searchInput = screen.getByPlaceholderText(
      'Search by name or patient ID',
    );

    (searchPatientByNameOrId as jest.Mock).mockReturnValue(
      mockSearchPatientData,
    );

    await waitFor(() => {
      fireEvent.input(searchInput, { target: { value: 'new value' } });
      fireEvent.click(screen.getByTestId('search-patient-search-button'));
    });

    expect(searchPatientByNameOrId).toHaveBeenCalledTimes(1);
    expect(searchPatientByNameOrId).toHaveBeenCalledWith('new value');
    await waitFor(() => {
      expect(mockHandleSearchPatientUpdate).toHaveBeenCalledWith(
        undefined,
        null,
        true,
      );
      expect(mockHandleSearchPatientUpdate).toHaveBeenCalledTimes(2);
      expect(mockHandleSearchPatientUpdate).toHaveBeenCalledWith(
        mockSearchPatientData,
        null,
        false,
      );
    });
  });

  it('should not search for patient when search input is empty', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SearchPatient handleSearchPatient={mockHandleSearchPatientUpdate} />
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('search-patient')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-seachbar')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-seachbar')).toHaveAttribute(
      'placeholder',
      'Search by name or patient ID',
    );

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('search-patient-search-button'));
    });

    expect(searchPatientByNameOrId).not.toHaveBeenCalled();
  });

  it('should return error back to parent component when search throws an error', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SearchPatient handleSearchPatient={mockHandleSearchPatientUpdate} />
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('search-patient')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-seachbar')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-seachbar')).toHaveAttribute(
      'placeholder',
      'Search by name or patient ID',
    );

    const searchInput = screen.getByPlaceholderText(
      'Search by name or patient ID',
    );

    const error = new Error(
      'Login location is missing or invalid. Please reauthenticate.',
    );

    (searchPatientByNameOrId as jest.Mock).mockRejectedValue(error);

    await waitFor(() => {
      fireEvent.input(searchInput, { target: { value: 'new value' } });
      fireEvent.click(screen.getByTestId('search-patient-search-button'));
    });

    expect(searchPatientByNameOrId).toHaveBeenCalledTimes(1);
    expect(searchPatientByNameOrId).toHaveBeenCalledWith('new value');
    expect(mockHandleSearchPatientUpdate).toHaveBeenCalledWith(
      undefined,
      null,
      true,
    );
    await waitFor(() => {
      expect(mockHandleSearchPatientUpdate).toHaveBeenCalledTimes(2);
      expect(mockHandleSearchPatientUpdate).toHaveBeenCalledWith(
        undefined,
        error,
        false,
      );
    });
  });
});
