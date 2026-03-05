import {
  searchPatientByNameOrId,
  searchPatientByCustomAttribute,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useNotification } from '../../notification';
import {
  buttonTitle,
  searchBarPlaceholder,
  validPatientSearchConfig,
  mockSearchPatientData,
} from '../__mocks__/mocks';
import SearchPatient from '../SearchPatient';

expect.extend(toHaveNoViolations);

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  searchPatientByNameOrId: jest.fn(),
  searchPatientByCustomAttribute: jest.fn(),
}));
jest.mock('../../notification');
const mockOnSearch = jest.fn();

const mockAddNotification = jest.fn();

describe('SearchPatient', () => {
  let queryClient: QueryClient;

  const renderSearchPatient = (
    patientSearch?: typeof validPatientSearchConfig,
  ) =>
    render(
      <QueryClientProvider client={queryClient}>
        <SearchPatient
          buttonTitle={buttonTitle}
          searchBarPlaceholder={searchBarPlaceholder}
          patientSearch={patientSearch}
          onSearch={mockOnSearch}
        />
      </QueryClientProvider>,
    );

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
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should render the searchbar and the search button', () => {
    renderSearchPatient(validPatientSearchConfig);
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

  it.each([
    {
      description: 'clicking the search button',
      trigger: () =>
        fireEvent.click(screen.getByTestId('search-patient-search-button')),
    },
    {
      description: 'pressing enter',
      trigger: (searchInput: Element) => {
        searchInput.focus();
        userEvent.keyboard('{enter}');
      },
    },
  ])(
    'should search for patient when name input has valid text by $description',
    async ({ trigger }) => {
      renderSearchPatient(validPatientSearchConfig);
      const searchInput = screen.getByPlaceholderText(searchBarPlaceholder);

      (searchPatientByNameOrId as jest.Mock).mockResolvedValue({
        pageOfResults: [],
        totalCount: 0,
      });
      await waitFor(() => {
        fireEvent.input(searchInput, { target: { value: 'new value' } });
        trigger(searchInput);
      });

      expect(searchPatientByNameOrId).toHaveBeenCalledWith(
        'new value',
        expect.any(Array),
      );
      expect(mockOnSearch).toHaveBeenCalled();
      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith(
          expect.anything(),
          'new value',
          expect.any(Boolean),
          expect.any(Boolean),
          false,
          expect.anything(),
        );
      });
    },
  );

  it('should return matching patient when searching with complete name', async () => {
    renderSearchPatient();
    const searchInput = screen.getByPlaceholderText(searchBarPlaceholder);

    (searchPatientByNameOrId as jest.Mock).mockResolvedValue({
      pageOfResults: mockSearchPatientData,
      totalCount: mockSearchPatientData.length,
    });

    await waitFor(() => {
      fireEvent.input(searchInput, {
        target: { value: '    Steffi Maria Graf    ' },
      });
      fireEvent.click(screen.getByTestId('search-patient-search-button'));
    });

    expect(searchPatientByNameOrId).toHaveBeenCalledWith(
      'Steffi Maria Graf',
      [],
    );
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          pageOfResults: expect.arrayContaining([
            expect.objectContaining({
              identifier: 'ABC200000',
              givenName: 'Steffi',
              familyName: 'Graf',
            }),
          ]),
          totalCount: mockSearchPatientData.length,
        }),
        'Steffi Maria Graf',
        false,
        false,
        false,
        undefined,
      );
    });
  });

  it('should return empty results when searching for non-existent patient', async () => {
    renderSearchPatient();
    const searchInput = screen.getByPlaceholderText(searchBarPlaceholder);

    (searchPatientByNameOrId as jest.Mock).mockResolvedValue({
      pageOfResults: [],
      totalCount: 0,
    });

    await waitFor(() => {
      fireEvent.input(searchInput, {
        target: { value: '    John Doe    ' },
      });
      fireEvent.click(screen.getByTestId('search-patient-search-button'));
    });

    expect(searchPatientByNameOrId).toHaveBeenCalledWith('John Doe', []);
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          pageOfResults: [],
          totalCount: 0,
        }),
        'John Doe',
        false,
        false,
        false,
        undefined,
      );
    });
  });

  it.each([
    {
      description: 'clicking the search button',
      trigger: () =>
        fireEvent.click(screen.getByTestId('advance-search-button')),
    },
    {
      description: 'pressing enter',
      trigger: (phoneSearchInput: Element) => {
        phoneSearchInput.focus();
        userEvent.keyboard('{enter}');
      },
    },
  ])(
    'should search for patient when phone input has valid text by $description',
    async ({ trigger }) => {
      renderSearchPatient(validPatientSearchConfig);
      const phoneSearchInput = screen.getByTestId('advance-search-input');

      (searchPatientByCustomAttribute as jest.Mock).mockResolvedValue({
        pageOfResults: [],
        totalCount: 0,
      });
      await waitFor(() => {
        fireEvent.input(phoneSearchInput, { target: { value: '1234567890' } });
        trigger(phoneSearchInput);
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
    },
  );

  it('should return patient search data back to parent component when search is successfull', async () => {
    renderSearchPatient(validPatientSearchConfig);
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
        expect.anything(),
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
        expect.anything(),
      );
    });
  });

  it.each([
    {
      description: 'name',
      buttonTestId: 'search-patient-search-button',
      mockFn: searchPatientByNameOrId,
    },
    {
      description: 'phone',
      buttonTestId: 'advance-search-button',
      mockFn: searchPatientByCustomAttribute,
    },
  ])(
    'should not search for patient when $description search input is empty',
    async ({ buttonTestId, mockFn }) => {
      renderSearchPatient(validPatientSearchConfig);
      await waitFor(() => {
        fireEvent.click(screen.getByTestId(buttonTestId));
      });
      expect(mockFn).not.toHaveBeenCalled();
    },
  );

  it.each([
    {
      description: 'name',
      inputTestId: 'search-patient-searchbar',
      buttonTestId: 'search-patient-search-button',
      inputValue: 'new value',
      mockFn: searchPatientByNameOrId,
    },
    {
      description: 'phone',
      inputTestId: 'advance-search-input',
      buttonTestId: 'advance-search-button',
      inputValue: '1234567890',
      mockFn: searchPatientByCustomAttribute,
    },
  ])(
    'should disable $description search button when search call is happening',
    async ({ inputTestId, buttonTestId, inputValue, mockFn }) => {
      renderSearchPatient(validPatientSearchConfig);
      const input = screen.getByTestId(inputTestId);
      (mockFn as jest.Mock).mockReturnValue([]);

      await waitFor(() => {
        fireEvent.input(input, { target: { value: inputValue } });
        fireEvent.click(screen.getByTestId(buttonTestId));
        expect(screen.getByTestId(buttonTestId)).toBeDisabled();
      });
      await waitFor(() => {
        expect(screen.getByTestId(buttonTestId)).not.toBeDisabled();
      });
    },
  );

  it('should update parent when there is an error', async () => {
    renderSearchPatient(validPatientSearchConfig);
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
        title: 'ERROR_DEFAULT_TITLE',
        message: 'Login location is missing or invalid. Please reauthenticate.',
      });
    });
  });

  it('should remove error message when search term is cleared', async () => {
    renderSearchPatient(validPatientSearchConfig);
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
        title: 'ERROR_DEFAULT_TITLE',
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
    renderSearchPatient(validPatientSearchConfig);
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
        title: 'ERROR_DEFAULT_TITLE',
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
    renderSearchPatient(validPatientSearchConfig);
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
      expect(screen.getByTestId('field-validation-error')).toBeInTheDocument();
      expect(screen.getByTestId('field-validation-error')).toHaveTextContent(
        'PHONE_NUMBER_VALIDATION_ERROR',
      );
    });
    expect(searchPatientByCustomAttribute).not.toHaveBeenCalled();
  });

  it.each([
    { description: 'only numeric characters', value: '1234567890' },
    { description: 'country code prefix', value: '+911234567890' },
  ])(
    'should not render phone validation error message when entered with $description',
    async ({ value }) => {
      renderSearchPatient(validPatientSearchConfig);
      const phoneSearchInput = screen.getByTestId('advance-search-input');

      await waitFor(() => {
        fireEvent.input(phoneSearchInput, { target: { value } });
      });

      expect(
        screen.queryByTestId('field-validation-error'),
      ).not.toBeInTheDocument();
      expect(phoneSearchInput).toHaveValue(value);
    },
  );

  it.each([
    {
      description: 'name input when typing in phone field',
      firstInputTestId: 'search-patient-searchbar',
      firstInputValue: 'John Doe',
      secondInputTestId: 'advance-search-input',
      secondInputValue: '1234567890',
    },
    {
      description: 'phone input when typing in name field',
      firstInputTestId: 'advance-search-input',
      firstInputValue: '123a',
      secondInputTestId: 'search-patient-searchbar',
      secondInputValue: 'John Doe',
    },
  ])(
    'should clear $description',
    async ({
      firstInputTestId,
      firstInputValue,
      secondInputTestId,
      secondInputValue,
    }) => {
      renderSearchPatient(validPatientSearchConfig);
      const firstInput = screen.getByTestId(firstInputTestId);
      const secondInput = screen.getByTestId(secondInputTestId);

      fireEvent.input(firstInput, { target: { value: firstInputValue } });
      expect(firstInput).toHaveValue(firstInputValue);

      fireEvent.input(secondInput, { target: { value: secondInputValue } });
      expect(firstInput).toHaveValue('');
      expect(secondInput).toHaveValue(secondInputValue);
    },
  );

  it('should search by email when email is selected from dropdown', async () => {
    renderSearchPatient(validPatientSearchConfig);

    const dropdownButton = screen.getByRole('combobox', {
      name: /PATIENT_SEARCH_ATTRIBUTE_SELECTOR/,
    });

    await userEvent.click(dropdownButton);

    const emailOption = await screen.findByText(
      'REGISTRATION_PATIENT_SEARCH_DROPDOWN_EMAIL',
    );
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

  it('should preserve order of search fields from config', async () => {
    const orderedConfig = {
      patientSearch: {
        customAttributes: [
          {
            translationKey: 'REGISTRATION_PATIENT_SEARCH_DROPDOWN_PHONE_NUMBER',
            fields: ['phoneNumber', 'alternatePhoneNumber'],
            columnTranslationKeys: [
              'REGISTRATION_PATIENT_SEARCH_HEADER_PHONE_NUMBER',
              'REGISTRATION_PATIENT_SEARCH_HEADER_ALTERNATE_PHONE_NUMBER',
            ],
            type: 'person',
          },
          {
            translationKey: 'REGISTRATION_PATIENT_SEARCH_DROPDOWN_EMAIL',
            fields: ['email'],
            columnTranslationKeys: ['REGISTRATION_PATIENT_SEARCH_HEADER_EMAIL'],
            type: 'person',
          },
          {
            translationKey: 'REGISTRATION_PATIENT_SEARCH_DROPDOWN_VILLAGE',
            fields: ['village'],
            columnTranslationKeys: [
              'REGISTRATION_PATIENT_SEARCH_HEADER_VILLAGE',
            ],
            type: 'address',
          },
        ],
        appointment: [],
      },
    };

    render(
      <QueryClientProvider client={queryClient}>
        <SearchPatient
          buttonTitle={buttonTitle}
          searchBarPlaceholder={searchBarPlaceholder}
          onSearch={mockOnSearch}
          patientSearch={orderedConfig.patientSearch}
        />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      const dropdownButton = screen.getByRole('combobox', {
        name: /PATIENT_SEARCH_ATTRIBUTE_SELECTOR/,
      });
      expect(dropdownButton).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        screen.getByText('REGISTRATION_PATIENT_SEARCH_DROPDOWN_PHONE_NUMBER'),
      ).toBeInTheDocument();
    });

    const dropdownButton = screen.getByRole('combobox', {
      name: /PATIENT_SEARCH_ATTRIBUTE_SELECTOR/,
    });
    await userEvent.click(dropdownButton);

    await waitFor(() => {
      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveTextContent(
        'REGISTRATION_PATIENT_SEARCH_DROPDOWN_PHONE_NUMBER',
      );
      expect(options[1]).toHaveTextContent(
        'REGISTRATION_PATIENT_SEARCH_DROPDOWN_EMAIL',
      );
      expect(options[2]).toHaveTextContent(
        'REGISTRATION_PATIENT_SEARCH_DROPDOWN_VILLAGE',
      );
    });
  });

  it('should have no accessibility violations', async () => {
    const { container } = renderSearchPatient(validPatientSearchConfig);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
