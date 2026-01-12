import {
  PatientSearchResult,
  searchPatientByNameOrId,
  searchPatientByCustomAttribute,
  useTranslation,
  getRegistrationConfig,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { validRegistrationConfig } from '../../../../bahmni-services/src/configService/__mocks__/configMocks';
import { useNotification } from '../../notification';
import SearchPatient from '../SearchPatient';

expect.extend(toHaveNoViolations);

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  searchPatientByNameOrId: jest.fn(),
  searchPatientByCustomAttribute: jest.fn(),
  useTranslation: jest.fn(),
  getRegistrationConfig: jest.fn(),
}));
jest.mock('../../notification');
const mockOnSearch = jest.fn();

const mockAddNotification = jest.fn();
const mockUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;
const mockGetRegistrationConfig = getRegistrationConfig as jest.MockedFunction<
  typeof getRegistrationConfig
>;
const mockSearchPatientData: PatientSearchResult[] = [
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
    patientProgramAttributeValue: null,
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
    patientProgramAttributeValue: null,
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
    patientProgramAttributeValue: null,
  },
];

const buttonTitle = 'Search';
const searchBarPlaceholder = 'Search by name or patient ID';
describe('SearchPatient', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    Element.prototype.scrollIntoView = jest.fn();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    (useNotification as jest.Mock).mockReturnValue({
      addNotification: mockAddNotification,
    });
    mockUseTranslation.mockReturnValue({
      t: ((key: string) => {
        const translations: Record<string, string> = {
          ERROR_DEFAULT_TITLE: 'Error',
          PHONE_NUMBER_VALIDATION_ERROR:
            'Special characters and alphabets should not be allowed',
          SEARCH_BY_CUSTOM_ATTRIBUTE: 'Search by phone number',
          REGISTRATION_PATIENT_SEARCH_DROPDOWN_PHONE_NUMBER: 'Phone Number',
          REGISTRATION_PATIENT_SEARCH_DROPDOWN_EMAIL: 'Email',
          SEARCH_TYPE: 'Search Type',
          OR: 'OR',
          PATIENT_SEARCH_ATTRIBUTE_SELECTOR: 'Select search attribute',
        };
        return translations[key] || key;
      }) as any,
    } as any);
    mockGetRegistrationConfig.mockResolvedValue(validRegistrationConfig as any);
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
          onSearch={mockOnSearch}
        />
      </QueryClientProvider>,
    );
    expect(screen.getByTestId('search-patient-tile')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-searchbar')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-searchbar')).toHaveAttribute(
      'placeholder',
      searchBarPlaceholder,
    );
    expect(
      screen.getByTestId('search-patient-search-button'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('search-patient-search-button'),
    ).toHaveTextContent(buttonTitle);
    expect(screen.getByTestId('advance-search-input')).toBeInTheDocument();
    expect(screen.getByTestId('search-type-dropdown')).toBeInTheDocument();
    expect(screen.getByTestId('advance-search-button')).toBeInTheDocument();
    expect(screen.getByTestId('advance-search-button')).toHaveTextContent(
      buttonTitle,
    );
  });

  it('should search for patient when search input has a valid text', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SearchPatient
          buttonTitle={buttonTitle}
          searchBarPlaceholder={searchBarPlaceholder}
          onSearch={mockOnSearch}
        />
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('search-patient-tile')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-searchbar')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-searchbar')).toHaveAttribute(
      'placeholder',
      searchBarPlaceholder,
    );

    const searchInput = screen.getByPlaceholderText(searchBarPlaceholder);

    (searchPatientByNameOrId as jest.Mock).mockResolvedValue({
      pageOfResults: [],
      totalCount: 0,
    });
    await waitFor(() => {
      fireEvent.input(searchInput, { target: { value: 'new value' } });
      fireEvent.click(screen.getByTestId('search-patient-search-button'));
    });

    expect(searchPatientByNameOrId).toHaveBeenCalledTimes(1);
    expect(mockOnSearch).toHaveBeenCalled();
    expect(searchPatientByNameOrId).toHaveBeenCalledWith(
      'new value',
      expect.any(Array),
    );
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.anything(),
        'new value',
        expect.any(Boolean),
        expect.any(Boolean),
        false,
        expect.any(String),
      );
    });
  });

  it('should search for patient when search input has a valid text and hits enter', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SearchPatient
          buttonTitle={buttonTitle}
          searchBarPlaceholder={searchBarPlaceholder}
          onSearch={mockOnSearch}
        />
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('search-patient-tile')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-searchbar')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-searchbar')).toHaveAttribute(
      'placeholder',
      searchBarPlaceholder,
    );

    const searchInput = screen.getByPlaceholderText(searchBarPlaceholder);

    (searchPatientByNameOrId as jest.Mock).mockResolvedValue({
      pageOfResults: [],
      totalCount: 0,
    });
    await waitFor(() => {
      fireEvent.input(searchInput, { target: { value: 'new value' } });
      searchInput.focus();
      userEvent.keyboard('{enter}');
    });

    await waitFor(() => {
      expect(searchPatientByNameOrId).toHaveBeenCalledWith(
        'new value',
        expect.any(Array),
      );
      expect(mockOnSearch).toHaveBeenCalled();
    });
  });
  it('should search for patient when phone search input has a valid text', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SearchPatient
          buttonTitle={buttonTitle}
          searchBarPlaceholder={searchBarPlaceholder}
          onSearch={mockOnSearch}
        />
      </QueryClientProvider>,
    );
    expect(screen.getByTestId('search-patient-tile')).toBeInTheDocument();
    expect(screen.getByTestId('advance-search-input')).toBeInTheDocument();
    expect(screen.getByTestId('advance-search-button')).toBeInTheDocument();
    const phoneSearchInput = screen.getByTestId('advance-search-input');

    (searchPatientByCustomAttribute as jest.Mock).mockResolvedValue({
      pageOfResults: [],
      totalCount: 0,
    });
    await waitFor(() => {
      fireEvent.input(phoneSearchInput, { target: { value: '1234567890' } });
      fireEvent.click(screen.getByTestId('advance-search-button'));
    });
    expect(searchPatientByCustomAttribute).toHaveBeenCalledTimes(1);
    expect(mockOnSearch).toHaveBeenCalled();
    await waitFor(() => {
      expect(searchPatientByCustomAttribute).toHaveBeenCalledWith(
        '1234567890',
        expect.any(String),
        expect.any(Array),
        expect.any(Array),
        expect.any(Function),
      );
    });

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          pageOfResults: expect.any(Array),
          totalCount: expect.any(Number),
        }),
        '1234567890',
        false,
        false,
        true,
        expect.any(String),
      );
    });
  });
  it('should search for patient when phone search input has a valid text and hits enter', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SearchPatient
          buttonTitle={buttonTitle}
          searchBarPlaceholder={searchBarPlaceholder}
          onSearch={mockOnSearch}
        />
      </QueryClientProvider>,
    );
    expect(screen.getByTestId('search-patient-tile')).toBeInTheDocument();
    expect(screen.getByTestId('advance-search-input')).toBeInTheDocument();
    expect(screen.getByTestId('advance-search-button')).toBeInTheDocument();
    const phoneSearchInput = screen.getByTestId('advance-search-input');

    (searchPatientByCustomAttribute as jest.Mock).mockResolvedValue({
      pageOfResults: [],
      totalCount: 0,
    });

    await waitFor(() => {
      fireEvent.input(phoneSearchInput, { target: { value: '1234567890' } });
      phoneSearchInput.focus();
      userEvent.keyboard('{enter}');
    });

    await waitFor(() => {
      expect(searchPatientByCustomAttribute).toHaveBeenCalledWith(
        '1234567890',
        expect.any(String),
        expect.any(Array),
        expect.any(Array),
        expect.any(Function),
      );
    });

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          pageOfResults: expect.any(Array),
          totalCount: expect.any(Number),
        }),
        '1234567890',
        false,
        false,
        true,
        expect.any(String),
      );
    });
  });

  it('should return patient search data back to parent component when search is successfull', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SearchPatient
          buttonTitle={buttonTitle}
          searchBarPlaceholder={searchBarPlaceholder}
          onSearch={mockOnSearch}
        />
      </QueryClientProvider>,
    );
    expect(screen.getByTestId('search-patient-tile')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-searchbar')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-searchbar')).toHaveAttribute(
      'placeholder',
      searchBarPlaceholder,
    );
    const searchInput = screen.getByPlaceholderText(searchBarPlaceholder);
    (searchPatientByNameOrId as jest.Mock).mockResolvedValue({
      pageOfResults: mockSearchPatientData,
      totalCount: mockSearchPatientData.length,
    });

    await waitFor(() => {
      fireEvent.input(searchInput, { target: { value: 'new value' } });
      fireEvent.click(screen.getByTestId('search-patient-search-button'));
    });

    expect(searchPatientByNameOrId).toHaveBeenCalledTimes(1);
    expect(searchPatientByNameOrId).toHaveBeenCalledWith(
      'new value',
      expect.any(Array),
    );
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith(
        undefined,
        'new value',
        true,
        false,
        false,
        expect.any(String),
      );
    });

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          pageOfResults: expect.arrayContaining([
            expect.objectContaining({
              identifier: 'ABC200000',
              givenName: 'Steffi',
            }),
          ]),
          totalCount: mockSearchPatientData.length,
        }),
        'new value',
        false,
        false,
        false,
        expect.any(String),
      );
    });
  });

  it('should not search for patient when search input is empty', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SearchPatient
          buttonTitle={buttonTitle}
          searchBarPlaceholder={searchBarPlaceholder}
          onSearch={mockOnSearch}
        />
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('search-patient-tile')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-searchbar')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-searchbar')).toHaveAttribute(
      'placeholder',
      searchBarPlaceholder,
    );

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('search-patient-search-button'));
    });

    expect(searchPatientByNameOrId).not.toHaveBeenCalled();
  });

  it('should not search for patient when phone search input is empty', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SearchPatient
          buttonTitle={buttonTitle}
          searchBarPlaceholder={searchBarPlaceholder}
          onSearch={mockOnSearch}
        />
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('search-patient-tile')).toBeInTheDocument();
    expect(screen.getByTestId('advance-search-input')).toBeInTheDocument();
    expect(screen.getByTestId('advance-search-button')).toBeInTheDocument();

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('advance-search-button'));
    });

    expect(searchPatientByCustomAttribute).not.toHaveBeenCalled();
  });

  it('should disable search button when search call is happening', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SearchPatient
          buttonTitle={buttonTitle}
          searchBarPlaceholder={searchBarPlaceholder}
          onSearch={mockOnSearch}
        />
      </QueryClientProvider>,
    );

    expect(
      screen.getByTestId('search-patient-search-button'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-searchbar')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-searchbar')).toHaveAttribute(
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

  it('should disable phone search button when search call is happening', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SearchPatient
          buttonTitle={buttonTitle}
          searchBarPlaceholder={searchBarPlaceholder}
          onSearch={mockOnSearch}
        />
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('advance-search-button')).toBeInTheDocument();
    expect(screen.getByTestId('advance-search-input')).toBeInTheDocument();
    const phoneSearchInput = screen.getByTestId('advance-search-input');

    (searchPatientByCustomAttribute as jest.Mock).mockReturnValue([]);

    await waitFor(() => {
      fireEvent.input(phoneSearchInput, { target: { value: '1234567890' } });
      fireEvent.click(screen.getByTestId('advance-search-button'));
      expect(screen.getByTestId('advance-search-button')).toBeDisabled();
    });

    await waitFor(() => {
      expect(screen.getByTestId('advance-search-button')).not.toBeDisabled();
    });
  });

  it('should update parent when there is an error', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SearchPatient
          buttonTitle={buttonTitle}
          searchBarPlaceholder={searchBarPlaceholder}
          onSearch={mockOnSearch}
        />
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('search-patient-tile')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-searchbar')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-searchbar')).toHaveAttribute(
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

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith(
        undefined,
        'new value',
        false,
        true,
        false,
      );
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'Error',
        message: 'Login location is missing or invalid. Please reauthenticate.',
      });
    });
  });

  it('should remove error message when search term is cleared', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SearchPatient
          buttonTitle={buttonTitle}
          searchBarPlaceholder={searchBarPlaceholder}
          onSearch={mockOnSearch}
        />
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('search-patient-tile')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-searchbar')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-searchbar')).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-searchbar')).toHaveAttribute(
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

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith(
        undefined,
        'new value',
        false,
        true,
        false,
      );
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'Error',
        message: 'Login location is missing or invalid. Please reauthenticate.',
      });
    });

    const searchClear = screen.getAllByRole('button', {
      name: 'Clear search input',
    })[0];
    await waitFor(() => {
      fireEvent.click(searchClear);
    });
    await waitFor(() =>
      expect(mockOnSearch).toHaveBeenCalledWith(
        undefined,
        'new value',
        false,
        true,
        false,
      ),
    );
  });

  it('should remove error message when phone search term is cleared', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SearchPatient
          buttonTitle={buttonTitle}
          searchBarPlaceholder={searchBarPlaceholder}
          onSearch={mockOnSearch}
        />
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('search-patient-tile')).toBeInTheDocument();
    expect(screen.getByTestId('advance-search-input')).toBeInTheDocument();
    expect(screen.getByTestId('advance-search-button')).toBeInTheDocument();

    const phoneSearchInput = screen.getByTestId('advance-search-input');

    const error = new Error(
      'Login location is missing or invalid. Please reauthenticate.',
    );

    (searchPatientByCustomAttribute as jest.Mock).mockRejectedValue(error);

    await waitFor(() => {
      fireEvent.input(phoneSearchInput, { target: { value: '1234567890' } });
      fireEvent.click(screen.getByTestId('advance-search-button'));
    });

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith(
        undefined,
        '1234567890',
        false,
        true,
        true,
      );
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'Error',
        message: 'Login location is missing or invalid. Please reauthenticate.',
      });
    });

    const phoneSearchClear = screen.getAllByRole('button', {
      name: 'Clear search input',
    })[1];
    await waitFor(() => {
      fireEvent.click(phoneSearchClear);
    });
    await waitFor(() =>
      expect(mockOnSearch).toHaveBeenCalledWith(
        undefined,
        '1234567890',
        false,
        true,
        true,
      ),
    );
  });

  it('should render phone validation error message when invalid characters are entered', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SearchPatient
          buttonTitle={buttonTitle}
          searchBarPlaceholder={searchBarPlaceholder}
          onSearch={mockOnSearch}
        />
      </QueryClientProvider>,
    );

    const phoneSearchInput = screen.getByTestId('advance-search-input');

    expect(
      screen.queryByTestId('field-validation-error'),
    ).not.toBeInTheDocument();

    await waitFor(() => {
      fireEvent.input(phoneSearchInput, { target: { value: '123a' } });
    });
    fireEvent.click(screen.getByTestId('advance-search-button'));

    expect(phoneSearchInput).toHaveValue('123a');
    await waitFor(() => {
      expect(searchPatientByCustomAttribute).toHaveBeenCalled();
    });
  });

  it('should not render phone validation error message when only numeric characters are entered', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SearchPatient
          buttonTitle={buttonTitle}
          searchBarPlaceholder={searchBarPlaceholder}
          onSearch={mockOnSearch}
        />
      </QueryClientProvider>,
    );

    const phoneSearchInput = screen.getByTestId('advance-search-input');

    await waitFor(() => {
      fireEvent.input(phoneSearchInput, { target: { value: '1234567890' } });
    });

    expect(
      screen.queryByTestId('field-validation-error'),
    ).not.toBeInTheDocument();

    expect(phoneSearchInput).toHaveValue('1234567890');
  });

  it('should not render phone validation error message when entered with country code', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SearchPatient
          buttonTitle={buttonTitle}
          searchBarPlaceholder={searchBarPlaceholder}
          onSearch={mockOnSearch}
        />
      </QueryClientProvider>,
    );

    const phoneSearchInput = screen.getByTestId('advance-search-input');

    await waitFor(() => {
      fireEvent.input(phoneSearchInput, { target: { value: '+911234567890' } });
    });

    expect(
      screen.queryByTestId('field-validation-error'),
    ).not.toBeInTheDocument();

    expect(phoneSearchInput).toHaveValue('+911234567890');
  });

  it('should clear name input when typing in phone field', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SearchPatient
          buttonTitle={buttonTitle}
          searchBarPlaceholder={searchBarPlaceholder}
          onSearch={mockOnSearch}
        />
      </QueryClientProvider>,
    );

    const phoneSearchInput = screen.getByTestId('advance-search-input');
    const nameSearchInput = screen.getByTestId('search-patient-searchbar');

    fireEvent.input(nameSearchInput, { target: { value: 'John Doe' } });
    expect(nameSearchInput).toHaveValue('John Doe');

    fireEvent.input(phoneSearchInput, { target: { value: '1234567890' } });
    expect(nameSearchInput).toHaveValue('');
    expect(phoneSearchInput).toHaveValue('1234567890');
  });

  it('should clear phone input when typing in name field', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SearchPatient
          buttonTitle={buttonTitle}
          searchBarPlaceholder={searchBarPlaceholder}
          onSearch={mockOnSearch}
        />
      </QueryClientProvider>,
    );

    const phoneSearchInput = screen.getByTestId('advance-search-input');
    const nameSearchInput = screen.getByTestId('search-patient-searchbar');

    fireEvent.input(phoneSearchInput, { target: { value: '123a' } });
    expect(phoneSearchInput).toHaveValue('123a');

    fireEvent.input(nameSearchInput, { target: { value: 'John Doe' } });
    expect(phoneSearchInput).toHaveValue('');
    expect(nameSearchInput).toHaveValue('John Doe');
  });

  it('should show notification when config validation fails', async () => {
    const configError = new Error('Schema validation failed');
    mockGetRegistrationConfig.mockRejectedValue(configError);

    render(
      <QueryClientProvider client={queryClient}>
        <SearchPatient
          buttonTitle={buttonTitle}
          searchBarPlaceholder={searchBarPlaceholder}
          onSearch={mockOnSearch}
        />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'CONFIG_ERROR_SCHEMA_VALIDATION_FAILED',
        message: 'Schema validation failed',
      });
    });
  });

  it('should show notification when config has no patient search fields', async () => {
    const configWithoutSearchFields = {
      config: {
        patientSearch: {},
      },
    };

    mockGetRegistrationConfig.mockResolvedValue(
      configWithoutSearchFields as any,
    );

    render(
      <QueryClientProvider client={queryClient}>
        <SearchPatient
          buttonTitle={buttonTitle}
          searchBarPlaceholder={searchBarPlaceholder}
          onSearch={mockOnSearch}
        />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'CONFIG_ERROR_NOT_FOUND',
        message: 'No patient search configuration found',
      });
    });
  });

  it('should search by email when email is selected from dropdown', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SearchPatient
          buttonTitle={buttonTitle}
          searchBarPlaceholder={searchBarPlaceholder}
          onSearch={mockOnSearch}
        />
      </QueryClientProvider>,
    );

    const dropdownButton = screen.getByRole('combobox', {
      name: /select search attribute/i,
    });

    await userEvent.click(dropdownButton);

    const emailOption = await screen.findByText('Email');
    await userEvent.click(emailOption);

    const customSearchInput = screen.getByTestId('advance-search-input');
    await userEvent.type(customSearchInput, 'test@example.com');

    (searchPatientByCustomAttribute as jest.Mock).mockResolvedValue({
      pageOfResults: [],
      totalCount: 0,
    });

    const customSearchButton = screen.getByTestId('advance-search-button');
    await userEvent.click(customSearchButton);

    expect(searchPatientByCustomAttribute).toHaveBeenCalledTimes(1);
    expect(mockOnSearch).toHaveBeenCalled();
    expect(searchPatientByCustomAttribute).toHaveBeenCalledWith(
      'test@example.com',
      'person',
      ['email'],
      expect.any(Array),
      expect.any(Function),
    );
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <SearchPatient
          buttonTitle={buttonTitle}
          searchBarPlaceholder={searchBarPlaceholder}
          onSearch={mockOnSearch}
        />
      </QueryClientProvider>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
