import {
  searchPatientByNameOrId,
  searchPatientByCustomAttribute,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MemoryRouter } from 'react-router-dom';
import { useNotification } from '../../../notification';
import { useUserPrivilege } from '../../../userPrivileges/useUserPrivilege';
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
jest.mock('../../userPrivileges/useUserPrivilege');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(() => jest.fn()),
}));

const mockAddNotification = jest.fn();

describe('SearchPatient', () => {
  let queryClient: QueryClient;

  const renderSearchPatient = (
    patientSearch?: typeof validPatientSearchConfig & {
      patientDetailUrl?: string;
    },
  ) =>
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <SearchPatient
            buttonTitle={buttonTitle}
            searchBarPlaceholder={searchBarPlaceholder}
            patientSearch={patientSearch}
          />
        </QueryClientProvider>
      </MemoryRouter>,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    (useNotification as jest.Mock).mockReturnValue({
      addNotification: mockAddNotification,
    });
    (useUserPrivilege as jest.Mock).mockReturnValue({
      userPrivileges: [],
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

  it('should not show results table before a search is performed', () => {
    renderSearchPatient(validPatientSearchConfig);
    expect(screen.queryByTestId(/sortable-table-/)).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('patient-search-title'),
    ).not.toBeInTheDocument();
  });

  it.each([
    {
      description: 'clicking the search button',
      trigger: async (_input: Element) =>
        fireEvent.click(screen.getByTestId('search-patient-search-button')),
    },
    {
      description: 'pressing enter',
      trigger: async (searchInput: Element) => {
        searchInput.focus();
        await userEvent.keyboard('{enter}');
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
      fireEvent.input(searchInput, { target: { value: 'new value' } });
      await trigger(searchInput);

      await waitFor(() => {
        expect(searchPatientByNameOrId).toHaveBeenCalledWith(
          'new value',
          expect.any(Array),
        );
      });
    },
  );

  it('should show results table after a successful search', async () => {
    renderSearchPatient(validPatientSearchConfig);
    const searchInput = screen.getByPlaceholderText(searchBarPlaceholder);

    (searchPatientByNameOrId as jest.Mock).mockResolvedValue({
      pageOfResults: mockSearchPatientData,
      totalCount: mockSearchPatientData.length,
    });

    fireEvent.input(searchInput, { target: { value: 'Steffi' } });
    fireEvent.click(screen.getByTestId('search-patient-search-button'));

    await waitFor(() => {
      expect(screen.getByTestId('patient-search-title')).toBeInTheDocument();
    });
  });

  it('should show loading state in title while search is in progress', async () => {
    renderSearchPatient(validPatientSearchConfig);
    const searchInput = screen.getByPlaceholderText(searchBarPlaceholder);

    (searchPatientByNameOrId as jest.Mock).mockReturnValue(
      new Promise(() => { }),
    );

    fireEvent.input(searchInput, { target: { value: 'John Doe' } });
    fireEvent.click(screen.getByTestId('search-patient-search-button'));

    await waitFor(() => {
      expect(
        screen.getByTestId('patient-search-title-loading'),
      ).toBeInTheDocument();
    });
  });

  it('should show error state in title when search fails', async () => {
    renderSearchPatient(validPatientSearchConfig);
    const searchInput = screen.getByPlaceholderText(searchBarPlaceholder);

    (searchPatientByNameOrId as jest.Mock).mockRejectedValue(
      new Error('Login location is missing or invalid. Please reauthenticate.'),
    );

    fireEvent.input(searchInput, { target: { value: 'new value' } });
    fireEvent.click(screen.getByTestId('search-patient-search-button'));

    await waitFor(() => {
      expect(
        screen.getByTestId('patient-search-title-error'),
      ).toBeInTheDocument();
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'ERROR_DEFAULT_TITLE',
        message: 'Login location is missing or invalid. Please reauthenticate.',
      });
    });
  });

  it.each([
    {
      description: 'no patientDetailUrl is configured',
      patientDetailUrl: undefined,
    },
    {
      description: 'patientDetailUrl is an unsafe scheme',
      patientDetailUrl: 'javascript' + ':alert(1)',
    },
  ])(
    'should render patient identifier as plain text when $description',
    async ({ patientDetailUrl }) => {
      renderSearchPatient({ ...validPatientSearchConfig, patientDetailUrl });
      const searchInput = screen.getByPlaceholderText(searchBarPlaceholder);

      (searchPatientByNameOrId as jest.Mock).mockResolvedValue({
        pageOfResults: mockSearchPatientData,
        totalCount: mockSearchPatientData.length,
      });

      fireEvent.input(searchInput, { target: { value: 'Steffi' } });
      fireEvent.click(screen.getByTestId('search-patient-search-button'));

      await waitFor(() => {
        const identifiers = screen.getAllByText('ABC200000');
        expect(identifiers.length).toBeGreaterThan(0);
        identifiers.forEach((el) => expect(el.tagName).not.toBe('A'));
      });
    },
  );

  it('should render patient identifier inside an anchor element when patientDetailUrl is configured', async () => {
    const { container } = renderSearchPatient({
      ...validPatientSearchConfig,
      patientDetailUrl: '#/patient/{{patientUuid}}/edit',
    });
    const searchInput = screen.getByPlaceholderText(searchBarPlaceholder);

    (searchPatientByNameOrId as jest.Mock).mockResolvedValue({
      pageOfResults: mockSearchPatientData,
      totalCount: mockSearchPatientData.length,
    });

    fireEvent.input(searchInput, { target: { value: 'Steffi' } });
    fireEvent.click(screen.getByTestId('search-patient-search-button'));

    await waitFor(() => {
      expect(container.querySelectorAll('a').length).toBeGreaterThan(0);
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
      trigger: async (phoneSearchInput: Element) => {
        phoneSearchInput.focus();
        await userEvent.keyboard('{enter}');
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
      fireEvent.input(phoneSearchInput, { target: { value: '1234567890' } });
      await trigger(phoneSearchInput);

      await waitFor(() => {
        expect(searchPatientByCustomAttribute).toHaveBeenCalledTimes(1);
        expect(searchPatientByCustomAttribute).toHaveBeenCalledWith(
          '1234567890',
          expect.any(String),
          expect.any(Array),
          expect.any(Array),
          expect.any(Function),
        );
      });
    },
  );

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
      fireEvent.click(screen.getByTestId(buttonTestId));
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

      fireEvent.input(input, { target: { value: inputValue } });
      fireEvent.click(screen.getByTestId(buttonTestId));
      await waitFor(() => {
        expect(screen.getByTestId(buttonTestId)).toBeDisabled();
      });
      await waitFor(() => {
        expect(screen.getByTestId(buttonTestId)).not.toBeDisabled();
      });
    },
  );

  it('should render phone validation error message when invalid characters are entered', async () => {
    renderSearchPatient(validPatientSearchConfig);
    const phoneSearchInput = screen.getByTestId('advance-search-input');

    expect(
      screen.queryByTestId('field-validation-error'),
    ).not.toBeInTheDocument();

    fireEvent.input(phoneSearchInput, { target: { value: '123a' } });
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

      fireEvent.input(phoneSearchInput, { target: { value } });

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
      customAttributes: [
        {
          translationKey: 'REGISTRATION_PATIENT_SEARCH_DROPDOWN_PHONE_NUMBER',
          fields: ['phoneNumber', 'alternatePhoneNumber'],
          columnTranslationKeys: [
            'REGISTRATION_PATIENT_SEARCH_HEADER_PHONE_NUMBER',
            'REGISTRATION_PATIENT_SEARCH_HEADER_ALTERNATE_PHONE_NUMBER',
          ],
          type: 'person' as const,
        },
        {
          translationKey: 'REGISTRATION_PATIENT_SEARCH_DROPDOWN_EMAIL',
          fields: ['email'],
          columnTranslationKeys: ['REGISTRATION_PATIENT_SEARCH_HEADER_EMAIL'],
          type: 'person' as const,
        },
        {
          translationKey: 'REGISTRATION_PATIENT_SEARCH_DROPDOWN_VILLAGE',
          fields: ['village'],
          columnTranslationKeys: ['REGISTRATION_PATIENT_SEARCH_HEADER_VILLAGE'],
          type: 'address' as const,
        },
      ],
      appointment: [],
    };

    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <SearchPatient
            buttonTitle={buttonTitle}
            searchBarPlaceholder={searchBarPlaceholder}
            patientSearch={orderedConfig}
          />
        </QueryClientProvider>
      </MemoryRouter>,
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
