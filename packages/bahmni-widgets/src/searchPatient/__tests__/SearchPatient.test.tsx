import {
  PatientSearch,
  searchPatientByNameOrId,
} from '@bahmni-frontend/bahmni-services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import SearchPatient from '../SearchPatient';

expect.extend(toHaveNoViolations);

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
    customAttribute: JSON.stringify({
      phoneNumber: '864579392',
      alternatePhoneNumber: '4596781239',
    }),
    hasBeenAdmitted: true,
    age: '56',
  },
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
    customAttribute: JSON.stringify({
      phoneNumber: '864579392',
      alternatePhoneNumber: '4596781239',
    }),
    hasBeenAdmitted: true,
    age: '56',
  },
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
    customAttribute: JSON.stringify({
      phoneNumber: '864579392',
      alternatePhoneNumber: '4596781239',
    }),
    hasBeenAdmitted: true,
    age: '56',
  },
];

const buttonTitle = 'Search';
const searchBarPlaceholder = 'Search by name or patient ID';
const searchTerm = 'invalid_searchTerm';
const emptyStateMessage = `Could not find patient with identifier/name '${searchTerm}'`;
const errorMessage =
  'An unexpected error occurred during search. Please try again later.';

describe('SearchPatient', () => {
  let queryClient: QueryClient;

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
        <SearchPatient
          buttonTitle={buttonTitle}
          searchBarPlaceholder={searchBarPlaceholder}
          emptyStateMessage={emptyStateMessage}
          errorMessage={errorMessage}
          handleSearchPatient={mockHandleSearchPatientUpdate}
        />
      </QueryClientProvider>,
    );
    expect(screen.getByTestId('search-patient-tile')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-seachbar')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-seachbar')).toHaveAttribute(
      'placeholder',
      searchBarPlaceholder,
    );
    expect(
      screen.getByTestId('search-patient-search-button'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('search-patient-search-button'),
    ).toHaveTextContent(buttonTitle);
  });

  it('should search for patient when search input has a valid text', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SearchPatient
          buttonTitle={buttonTitle}
          searchBarPlaceholder={searchBarPlaceholder}
          emptyStateMessage={emptyStateMessage}
          errorMessage={errorMessage}
          handleSearchPatient={mockHandleSearchPatientUpdate}
        />
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('search-patient-tile')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-seachbar')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-seachbar')).toHaveAttribute(
      'placeholder',
      searchBarPlaceholder,
    );

    const searchInput = screen.getByPlaceholderText(searchBarPlaceholder);

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
        <SearchPatient
          buttonTitle={buttonTitle}
          searchBarPlaceholder={searchBarPlaceholder}
          emptyStateMessage={emptyStateMessage}
          errorMessage={errorMessage}
          handleSearchPatient={mockHandleSearchPatientUpdate}
        />
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('search-patient-tile')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-seachbar')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-seachbar')).toHaveAttribute(
      'placeholder',
      searchBarPlaceholder,
    );

    const searchInput = screen.getByPlaceholderText(searchBarPlaceholder);

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
        'new value',
      );
      expect(mockHandleSearchPatientUpdate).toHaveBeenCalledTimes(2);
      expect(mockHandleSearchPatientUpdate).toHaveBeenCalledWith(
        mockSearchPatientData,
        'new value',
      );
    });
  });

  it('should not search for patient when search input is empty', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SearchPatient
          buttonTitle={buttonTitle}
          searchBarPlaceholder={searchBarPlaceholder}
          emptyStateMessage={emptyStateMessage}
          errorMessage={errorMessage}
          handleSearchPatient={mockHandleSearchPatientUpdate}
        />
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('search-patient-tile')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-seachbar')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-seachbar')).toHaveAttribute(
      'placeholder',
      searchBarPlaceholder,
    );

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('search-patient-search-button'));
    });

    expect(searchPatientByNameOrId).not.toHaveBeenCalled();
  });

  it('should disable search button when search call is happening', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SearchPatient
          buttonTitle={buttonTitle}
          searchBarPlaceholder={searchBarPlaceholder}
          emptyStateMessage={emptyStateMessage}
          errorMessage={errorMessage}
          handleSearchPatient={mockHandleSearchPatientUpdate}
        />
      </QueryClientProvider>,
    );

    expect(
      screen.getByTestId('search-patient-search-button'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-seachbar')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-seachbar')).toHaveAttribute(
      'placeholder',
      searchBarPlaceholder,
    );
    const searchInput = screen.getByPlaceholderText(searchBarPlaceholder);

    (searchPatientByNameOrId as jest.Mock).mockReturnValue([]);

    await waitFor(() => {
      fireEvent.input(searchInput, { target: { value: 'new value' } });
      fireEvent.click(screen.getByTestId('search-patient-search-button'));
      expect(screen.getByTestId('search-patient-search-button')).toBeDisabled();
    });

    await waitFor(() => {
      expect(
        screen.getByTestId('search-patient-search-button'),
      ).not.toBeDisabled();
    });
  });

  it('should show error message when search throws an error', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SearchPatient
          buttonTitle={buttonTitle}
          searchBarPlaceholder={searchBarPlaceholder}
          emptyStateMessage={emptyStateMessage}
          errorMessage={errorMessage}
          handleSearchPatient={mockHandleSearchPatientUpdate}
        />
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('search-patient-tile')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-seachbar')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-seachbar')).toHaveAttribute(
      'placeholder',
      searchBarPlaceholder,
    );

    const searchInput = screen.getByPlaceholderText(searchBarPlaceholder);

    const error = new Error(
      'Login location is missing or invalid. Please reauthenticate.',
    );

    (searchPatientByNameOrId as jest.Mock).mockRejectedValue(error);

    await waitFor(() => {
      fireEvent.input(searchInput, { target: { value: 'new value' } });
      fireEvent.click(screen.getByTestId('search-patient-search-button'));
    });
    await waitFor(() =>
      expect(screen.getByText(errorMessage)).toBeInTheDocument(),
    );
  });

  it('should remove error message when search term is cleared', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SearchPatient
          buttonTitle={buttonTitle}
          searchBarPlaceholder={searchBarPlaceholder}
          emptyStateMessage={emptyStateMessage}
          errorMessage={errorMessage}
          handleSearchPatient={mockHandleSearchPatientUpdate}
        />
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('search-patient-tile')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-seachbar')).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Clear search input',
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-seachbar')).toHaveAttribute(
      'placeholder',
      searchBarPlaceholder,
    );

    const searchInput = screen.getByPlaceholderText(searchBarPlaceholder);

    const error = new Error(
      'Login location is missing or invalid. Please reauthenticate.',
    );

    (searchPatientByNameOrId as jest.Mock).mockRejectedValue(error);

    await waitFor(() => {
      fireEvent.input(searchInput, { target: { value: 'new value' } });
      fireEvent.click(screen.getByTestId('search-patient-search-button'));
    });
    await waitFor(() =>
      expect(screen.getByText(errorMessage)).toBeInTheDocument(),
    );
    const searchClear = screen.getByRole('button', {
      name: 'Clear search input',
    });
    await waitFor(() => {
      fireEvent.click(searchClear);
    });
    await waitFor(() =>
      expect(screen.queryByText(errorMessage)).not.toBeInTheDocument(),
    );
  });

  it('should show empty state message when search returns no match', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SearchPatient
          buttonTitle={buttonTitle}
          searchBarPlaceholder={searchBarPlaceholder}
          emptyStateMessage={emptyStateMessage}
          errorMessage={errorMessage}
          handleSearchPatient={mockHandleSearchPatientUpdate}
        />
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('search-patient-tile')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-seachbar')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-seachbar')).toHaveAttribute(
      'placeholder',
      searchBarPlaceholder,
    );

    const searchInput = screen.getByPlaceholderText(searchBarPlaceholder);

    (searchPatientByNameOrId as jest.Mock).mockReturnValue([]);

    await waitFor(() => {
      fireEvent.input(searchInput, { target: { value: searchTerm } });
      fireEvent.click(screen.getByTestId('search-patient-search-button'));
    });
    await waitFor(() =>
      expect(screen.getByText(emptyStateMessage)).toBeInTheDocument(),
    );
  });

  it('should clear empty state message when search input is cleared', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SearchPatient
          buttonTitle={buttonTitle}
          searchBarPlaceholder={searchBarPlaceholder}
          emptyStateMessage={emptyStateMessage}
          errorMessage={errorMessage}
          handleSearchPatient={mockHandleSearchPatientUpdate}
        />
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('search-patient-tile')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-seachbar')).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Clear search input',
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-seachbar')).toHaveAttribute(
      'placeholder',
      searchBarPlaceholder,
    );

    const searchInput = screen.getByPlaceholderText(searchBarPlaceholder);

    (searchPatientByNameOrId as jest.Mock).mockReturnValue([]);

    await waitFor(() => {
      fireEvent.input(searchInput, { target: { value: searchTerm } });
      fireEvent.click(screen.getByTestId('search-patient-search-button'));
    });
    await waitFor(() =>
      expect(screen.getByText(emptyStateMessage)).toBeInTheDocument(),
    );
    const searchClear = screen.getByRole('button', {
      name: 'Clear search input',
    });
    await waitFor(() => {
      fireEvent.click(searchClear);
    });
    await waitFor(() =>
      expect(screen.queryByText(emptyStateMessage)).not.toBeInTheDocument(),
    );
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <SearchPatient
          buttonTitle={buttonTitle}
          searchBarPlaceholder={searchBarPlaceholder}
          emptyStateMessage={emptyStateMessage}
          errorMessage={errorMessage}
          handleSearchPatient={mockHandleSearchPatientUpdate}
        />
      </QueryClientProvider>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
