import {
  createPatient,
  getAddressHierarchyEntries,
  notificationService,
} from '@bahmni-frontend/bahmni-services';
import { NotificationProvider } from '@bahmni-frontend/bahmni-widgets';
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
} from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import NewPatientRegistration from '../createPatient';

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

jest.mock('@bahmni-frontend/bahmni-services', () => ({
  ...jest.requireActual('@bahmni-frontend/bahmni-services'),
  createPatient: jest.fn(),
  getIdentifierData: jest.fn(),
  getGenders: jest.fn(),
  getAddressHierarchyEntries: jest.fn(),
  notificationService: {
    showSuccess: jest.fn(),
    showError: jest.fn(),
  },
}));

const mockIdentifierData = {
  prefixes: ['BAH'],
  sourcesByPrefix: new Map([['BAH', 'uuid-1']]),
  primaryIdentifierTypeUuid: 'type-uuid-1',
};
const mockGenders = ['Male', 'Female', 'Other'];

describe('NewPatientRegistration', () => {
  const mockNavigate = jest.fn();
  const mockMutate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);

    (useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'identifierData') return { data: mockIdentifierData };
      if (queryKey[0] === 'genders') return { data: mockGenders };
      return { data: undefined };
    });

    (useMutation as jest.Mock).mockImplementation(() => ({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      isSuccess: false,
    }));
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <NotificationProvider>
          <QueryClientProvider client={new QueryClient()}>
            <NewPatientRegistration />
          </QueryClientProvider>
        </NotificationProvider>
      </MemoryRouter>,
    );

  it('renders the key form sections', () => {
    renderComponent();
    expect(screen.getByText('Patient details')).toBeInTheDocument();
    expect(screen.getByText('Basic information')).toBeInTheDocument();
    expect(screen.getByText('Address information')).toBeInTheDocument();
  });

  it('shows validation errors when required fields are empty', async () => {
    renderComponent();
    await userEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument();
      expect(screen.getByText('Last name is required')).toBeInTheDocument();
      expect(screen.getByText('Gender is required')).toBeInTheDocument();
      expect(screen.getByText('Date of birth is required')).toBeInTheDocument();
    });
  });

  it('clears first name error once valid input is provided', async () => {
    renderComponent();
    await userEvent.click(screen.getByText('Save'));

    // First verify the error appears
    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument();
    });

    const firstNameInput = screen.getByLabelText('First name*');
    await userEvent.type(firstNameInput, 'John');

    // Now verify the error message disappears (not the label)
    await waitFor(() => {
      expect(
        screen.queryByText('First name is required'),
      ).not.toBeInTheDocument();
    });
  });

  it('creates patient and navigates when successful', async () => {
    const mockResponse = { patient: { uuid: '123', display: 'John Doe' } };
    (createPatient as jest.Mock).mockResolvedValue(mockResponse);

    (useMutation as jest.Mock).mockImplementation((options) => ({
      mutate: async (data: any) => {
        const response = await options.mutationFn(data);
        options.onSuccess(response);
      },
    }));

    renderComponent();

    await userEvent.type(screen.getByLabelText('First name*'), 'John');
    await userEvent.type(screen.getByLabelText('Last name*'), 'Doe');

    const genderDropdown = screen.getByRole('combobox', {
      name: 'Gender',
    });
    await userEvent.click(genderDropdown);
    await waitFor(() => fireEvent.click(screen.getByText('Male')));

    const ageInput = screen.getByLabelText('Years(Age)');
    await userEvent.type(ageInput, '30');

    await userEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(createPatient).toHaveBeenCalled();
      expect(notificationService.showSuccess).toHaveBeenCalledWith(
        'Success',
        'Patient saved successfully',
        5000,
      );
      expect(mockNavigate).toHaveBeenCalledWith('/registration/patient/123', {
        state: { patientDisplay: 'John Doe', patientUuid: '123' },
      });
    });
  });

  it('shows error notification when patient creation fails', async () => {
    const mockError = new Error('Network error');
    (createPatient as jest.Mock).mockRejectedValue(mockError);

    (useMutation as jest.Mock).mockImplementation((options) => ({
      mutate: async (data: any) => {
        try {
          await options.mutationFn(data);
        } catch (error) {
          options.onError(error);
        }
      },
    }));

    renderComponent();

    // Fill required fields
    await userEvent.type(screen.getByLabelText('First name*'), 'John');
    await userEvent.type(screen.getByLabelText('Last name*'), 'Doe');

    const genderDropdown = screen.getByRole('combobox', {
      name: 'Gender',
    });
    await userEvent.click(genderDropdown);
    await waitFor(() => fireEvent.click(screen.getByText('Male')));

    const ageInput = screen.getByLabelText('Years(Age)');
    await userEvent.type(ageInput, '30');

    // Try to save
    await userEvent.click(screen.getByText('Save'));

    // Verify error notification is shown and navigation does not occur
    await waitFor(() => {
      expect(createPatient).toHaveBeenCalled();
      expect(notificationService.showError).toHaveBeenCalledWith(
        'Error',
        'Failed to save patient',
        5000,
      );
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('fetches address suggestions for district', async () => {
    (getAddressHierarchyEntries as jest.Mock).mockResolvedValue([
      { uuid: '1', name: 'Bangalore Urban', parent: { name: 'Karnataka' } },
    ]);

    renderComponent();
    const districtInput = screen.getByLabelText('District');
    await userEvent.type(districtInput, 'Ban');

    await waitFor(() => {
      expect(getAddressHierarchyEntries).toHaveBeenCalledWith(
        'countyDistrict',
        'Ban',
      );
    });
  });

  describe('Address field dropdown validation', () => {
    it('shows error when district is typed but not selected from dropdown', async () => {
      // Mock empty results so no suggestions appear
      (getAddressHierarchyEntries as jest.Mock).mockResolvedValue([]);

      renderComponent();

      // Fill required fields
      await userEvent.type(screen.getByLabelText('First name*'), 'John');
      await userEvent.type(screen.getByLabelText('Last name*'), 'Doe');

      const genderDropdown = screen.getByRole('combobox', { name: 'Gender' });
      await userEvent.click(genderDropdown);
      await waitFor(() => fireEvent.click(screen.getByText('Male')));

      const ageInput = screen.getByLabelText('Years(Age)');
      await userEvent.type(ageInput, '30');

      // Type district without selecting from dropdown
      const districtInput = screen.getByLabelText('District');
      await userEvent.type(districtInput, 'InvalidDistrict');

      // Try to save
      await userEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(
          screen.getByText('Select input from drop down'),
        ).toBeInTheDocument();
      });
    });

    it('shows error when state is typed but not selected from dropdown', async () => {
      // Mock empty results so no suggestions appear
      (getAddressHierarchyEntries as jest.Mock).mockResolvedValue([]);

      renderComponent();

      // Fill required fields
      await userEvent.type(screen.getByLabelText('First name*'), 'John');
      await userEvent.type(screen.getByLabelText('Last name*'), 'Doe');

      const genderDropdown = screen.getByRole('combobox', { name: 'Gender' });
      await userEvent.click(genderDropdown);
      await waitFor(() => fireEvent.click(screen.getByText('Male')));

      const ageInput = screen.getByLabelText('Years(Age)');
      await userEvent.type(ageInput, '30');

      // Type state without selecting from dropdown
      const stateInput = screen.getByLabelText('State');
      await userEvent.type(stateInput, 'InvalidState');

      // Try to save
      await userEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(
          screen.getByText('Select input from drop down'),
        ).toBeInTheDocument();
      });
    });

    it('shows error when pincode is typed but not selected from dropdown', async () => {
      renderComponent();

      // Fill required fields
      await userEvent.type(screen.getByLabelText('First name*'), 'John');
      await userEvent.type(screen.getByLabelText('Last name*'), 'Doe');

      const genderDropdown = screen.getByRole('combobox', { name: 'Gender' });
      await userEvent.click(genderDropdown);
      await waitFor(() => fireEvent.click(screen.getByText('Male')));

      const ageInput = screen.getByLabelText('Years(Age)');
      await userEvent.type(ageInput, '30');

      // Type pincode without selecting from dropdown
      const pincodeInput = screen.getByLabelText('Pincode');
      await userEvent.type(pincodeInput, '123456');

      // Try to save
      await userEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(
          screen.getByText('Select input from drop down'),
        ).toBeInTheDocument();
      });
    });

    it('does not show error when district is selected from dropdown', async () => {
      (getAddressHierarchyEntries as jest.Mock).mockResolvedValue([
        {
          uuid: '1',
          name: 'Bangalore Urban',
          parent: { name: 'Karnataka' },
        },
      ]);

      renderComponent();

      // Fill required fields
      await userEvent.type(screen.getByLabelText('First name*'), 'John');
      await userEvent.type(screen.getByLabelText('Last name*'), 'Doe');

      const genderDropdown = screen.getByRole('combobox', { name: 'Gender' });
      await userEvent.click(genderDropdown);
      await waitFor(() => fireEvent.click(screen.getByText('Male')));

      const ageInput = screen.getByLabelText('Years(Age)');
      await userEvent.type(ageInput, '30');

      // Type district to trigger suggestions
      const districtInput = screen.getByLabelText('District');
      await userEvent.type(districtInput, 'Ban');

      // Wait for and click on suggestion
      await waitFor(() => {
        const suggestion = screen.getByText('Bangalore Urban');
        fireEvent.click(suggestion);
      });

      // Try to save
      await userEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        // Should not show the dropdown validation error for district
        expect(
          screen.queryByText('Select input from drop down'),
        ).not.toBeInTheDocument();
      });
    });

    it('clears address error when empty value is provided', async () => {
      renderComponent();

      // Fill required fields
      await userEvent.type(screen.getByLabelText('First name*'), 'John');
      await userEvent.type(screen.getByLabelText('Last name*'), 'Doe');

      const genderDropdown = screen.getByRole('combobox', { name: 'Gender' });
      await userEvent.click(genderDropdown);
      await waitFor(() => fireEvent.click(screen.getByText('Male')));

      const ageInput = screen.getByLabelText('Years(Age)');
      await userEvent.type(ageInput, '30');

      // Type district without selecting from dropdown
      const districtInput = screen.getByLabelText('District');
      await userEvent.type(districtInput, 'InvalidDistrict');

      // Try to save to trigger validation error
      await userEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(
          screen.getByText('Select input from drop down'),
        ).toBeInTheDocument();
      });

      // Clear the district field
      await userEvent.clear(districtInput);

      // Try to save again
      await userEvent.click(screen.getByText('Save'));

      // The dropdown validation error should be cleared (though other required field errors may remain)
      await waitFor(() => {
        const dropdownErrors = screen.queryAllByText(
          'Select input from drop down',
        );
        // Should not have dropdown error for district anymore
        expect(dropdownErrors).toHaveLength(0);
      });
    });

    it('shows multiple address field errors when all are typed without selection', async () => {
      renderComponent();

      // Fill required fields
      await userEvent.type(screen.getByLabelText('First name*'), 'John');
      await userEvent.type(screen.getByLabelText('Last name*'), 'Doe');

      const genderDropdown = screen.getByRole('combobox', { name: 'Gender' });
      await userEvent.click(genderDropdown);
      await waitFor(() => fireEvent.click(screen.getByText('Male')));

      const ageInput = screen.getByLabelText('Years(Age)');
      await userEvent.type(ageInput, '30');

      // Type all address fields without selecting from dropdown
      await userEvent.type(
        screen.getByLabelText('District'),
        'InvalidDistrict',
      );
      await userEvent.type(screen.getByLabelText('State'), 'InvalidState');
      await userEvent.type(screen.getByLabelText('Pincode'), '123456');

      // Try to save
      await userEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        const dropdownErrors = screen.getAllByText(
          'Select input from drop down',
        );
        // Should have 3 errors - one for each address field
        expect(dropdownErrors).toHaveLength(3);
      });
    });

    it('auto-populates district and state when pincode is selected from dropdown', async () => {
      (getAddressHierarchyEntries as jest.Mock).mockResolvedValue([
        {
          uuid: '1',
          name: '560001',
          parent: {
            name: 'Bangalore Urban',
            parent: { name: 'Karnataka' },
          },
        },
      ]);

      renderComponent();

      // Fill required fields
      await userEvent.type(screen.getByLabelText('First name*'), 'John');
      await userEvent.type(screen.getByLabelText('Last name*'), 'Doe');

      const genderDropdown = screen.getByRole('combobox', { name: 'Gender' });
      await userEvent.click(genderDropdown);
      await waitFor(() => fireEvent.click(screen.getByText('Male')));

      const ageInput = screen.getByLabelText('Years(Age)');
      await userEvent.type(ageInput, '30');

      // Type pincode to trigger suggestions
      const pincodeInput = screen.getByLabelText('Pincode');
      await userEvent.type(pincodeInput, '560001');

      // Wait for and click on suggestion
      await waitFor(() => {
        const suggestion = screen.getByText('560001');
        fireEvent.click(suggestion);
      });

      // Verify district and state are auto-populated
      await waitFor(() => {
        const districtInput = screen.getByLabelText(
          'District',
        ) as HTMLInputElement;
        const stateInput = screen.getByLabelText('State') as HTMLInputElement;

        expect(districtInput.value).toBe('Bangalore Urban');
        expect(stateInput.value).toBe('Karnataka');
      });

      // Try to save - should not show dropdown errors for auto-populated fields
      await userEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(
          screen.queryByText('Select input from drop down'),
        ).not.toBeInTheDocument();
      });
    });

    it('auto-populates state when district is selected from dropdown', async () => {
      (getAddressHierarchyEntries as jest.Mock).mockResolvedValue([
        {
          uuid: '1',
          name: 'Bangalore Urban',
          parent: { name: 'Karnataka' },
        },
      ]);

      renderComponent();

      // Fill required fields
      await userEvent.type(screen.getByLabelText('First name*'), 'John');
      await userEvent.type(screen.getByLabelText('Last name*'), 'Doe');

      const genderDropdown = screen.getByRole('combobox', { name: 'Gender' });
      await userEvent.click(genderDropdown);
      await waitFor(() => fireEvent.click(screen.getByText('Male')));

      const ageInput = screen.getByLabelText('Years(Age)');
      await userEvent.type(ageInput, '30');

      // Type district to trigger suggestions
      const districtInput = screen.getByLabelText('District');
      await userEvent.type(districtInput, 'Ban');

      // Wait for and click on suggestion
      await waitFor(() => {
        const suggestion = screen.getByText('Bangalore Urban');
        fireEvent.click(suggestion);
      });

      // Verify state is auto-populated
      await waitFor(() => {
        const stateInput = screen.getByLabelText('State') as HTMLInputElement;
        expect(stateInput.value).toBe('Karnataka');
      });

      // Try to save - should not show dropdown errors for auto-populated fields
      await userEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(
          screen.queryByText('Select input from drop down'),
        ).not.toBeInTheDocument();
      });
    });

    it('auto-populates and marks fields as selected when pincode with hierarchy is chosen', async () => {
      (getAddressHierarchyEntries as jest.Mock).mockResolvedValue([
        {
          uuid: '1',
          name: '560001',
          parent: {
            name: 'Bangalore Urban',
            parent: { name: 'Karnataka' },
          },
        },
      ]);

      renderComponent();

      // Fill required fields
      await userEvent.type(screen.getByLabelText('First name*'), 'John');
      await userEvent.type(screen.getByLabelText('Last name*'), 'Doe');

      const genderDropdown = screen.getByRole('combobox', { name: 'Gender' });
      await userEvent.click(genderDropdown);
      await waitFor(() => fireEvent.click(screen.getByText('Male')));

      const ageInput = screen.getByLabelText('Years(Age)');
      await userEvent.type(ageInput, '30');

      // Type pincode and select from dropdown
      const pincodeInput = screen.getByLabelText('Pincode');
      await userEvent.type(pincodeInput, '560001');

      // Wait for and click on suggestion
      await waitFor(() => {
        const suggestions = screen.getAllByText('560001');
        fireEvent.click(suggestions[0]);
      });

      // Verify district and state are auto-populated
      await waitFor(() => {
        const districtInput = screen.getByLabelText(
          'District',
        ) as HTMLInputElement;
        const stateInput = screen.getByLabelText('State') as HTMLInputElement;

        expect(districtInput.value).toBe('Bangalore Urban');
        expect(stateInput.value).toBe('Karnataka');
      });

      // Try to save - should not show dropdown validation errors
      await userEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(
          screen.queryByText('Select input from drop down'),
        ).not.toBeInTheDocument();
      });
    });

    it('handles pincode selection with only district parent (no state)', async () => {
      (getAddressHierarchyEntries as jest.Mock).mockResolvedValue([
        {
          uuid: '1',
          name: '123456',
          parent: {
            name: 'Some District',
            // No parent (state) for this district
          },
        },
      ]);

      renderComponent();

      // Fill required fields
      await userEvent.type(screen.getByLabelText('First name*'), 'John');
      await userEvent.type(screen.getByLabelText('Last name*'), 'Doe');

      const genderDropdown = screen.getByRole('combobox', { name: 'Gender' });
      await userEvent.click(genderDropdown);
      await waitFor(() => fireEvent.click(screen.getByText('Male')));

      const ageInput = screen.getByLabelText('Years(Age)');
      await userEvent.type(ageInput, '30');

      // Type pincode to trigger suggestions
      const pincodeInput = screen.getByLabelText('Pincode');
      await userEvent.type(pincodeInput, '123456');

      // Wait for and click on suggestion
      await waitFor(() => {
        const suggestion = screen.getByText('123456');
        fireEvent.click(suggestion);
      });

      // Verify only district is auto-populated (no state)
      await waitFor(() => {
        const districtInput = screen.getByLabelText(
          'District',
        ) as HTMLInputElement;
        const stateInput = screen.getByLabelText('State') as HTMLInputElement;

        expect(districtInput.value).toBe('Some District');
        // State should remain empty as there's no parent
        expect(stateInput.value).toBe('');
      });
    });
  });

  describe('handleDateOfBirthChange', () => {
    it('sets dobEstimated to false when date of birth is selected', async () => {
      renderComponent();

      // First set the estimated checkbox to true
      const estimatedCheckbox = screen.getByLabelText('Estimated');
      await userEvent.click(estimatedCheckbox);

      // Verify checkbox is checked
      expect(estimatedCheckbox).toBeChecked();

      // Now select a date of birth
      const dobInput = screen.getByLabelText('Date of birth');
      const testDate = '15/06/1990';
      await userEvent.type(dobInput, testDate);
      fireEvent.blur(dobInput);

      // Wait and verify checkbox is unchecked (dobEstimated should be false)
      await waitFor(() => {
        expect(estimatedCheckbox).not.toBeChecked();
      });
    });

    it('allows user to toggle estimated checkbox', async () => {
      renderComponent();

      const estimatedCheckbox = screen.getByLabelText('Estimated');

      // Initially unchecked
      expect(estimatedCheckbox).not.toBeChecked();

      // Click to check
      await userEvent.click(estimatedCheckbox);
      expect(estimatedCheckbox).toBeChecked();

      // Click again to uncheck
      await userEvent.click(estimatedCheckbox);
      expect(estimatedCheckbox).not.toBeChecked();
    });

    it('sets dobEstimated to true when age is entered', async () => {
      renderComponent();

      const estimatedCheckbox = screen.getByLabelText('Estimated');

      // Initially unchecked
      expect(estimatedCheckbox).not.toBeChecked();

      // Enter age
      const ageInput = screen.getByLabelText('Years(Age)');
      await userEvent.type(ageInput, '30');

      // Wait for dobEstimated to be set to true
      await waitFor(() => {
        expect(estimatedCheckbox).toBeChecked();
      });
    });

    it('calculates and populates age fields when date of birth is selected', async () => {
      renderComponent();

      const dobInput = screen.getByLabelText('Date of birth');
      // Select a date that's 30 years, 6 months, and 15 days ago
      const today = new Date();
      const birthDate = new Date(
        today.getFullYear() - 30,
        today.getMonth() - 6,
        today.getDate() - 15,
      );
      const formattedDate = `${String(birthDate.getDate()).padStart(2, '0')}/${String(birthDate.getMonth() + 1).padStart(2, '0')}/${birthDate.getFullYear()}`;

      await userEvent.type(dobInput, formattedDate);
      fireEvent.blur(dobInput);

      await waitFor(() => {
        const ageYearsInput = screen.getByLabelText(
          'Years(Age)',
        ) as HTMLInputElement;

        // Age calculation should be approximately correct
        expect(parseInt(ageYearsInput.value)).toBeGreaterThanOrEqual(29);
        expect(parseInt(ageYearsInput.value)).toBeLessThanOrEqual(31);
      });
    });

    it('clears date of birth validation error when valid date is selected', async () => {
      renderComponent();

      // First trigger validation error
      await userEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(
          screen.getByText('Date of birth is required'),
        ).toBeInTheDocument();
      });

      // Now select a valid date
      const dobInput = screen.getByLabelText('Date of birth');
      const testDate = '15/06/1990';

      await userEvent.type(dobInput, testDate);
      fireEvent.blur(dobInput);

      await waitFor(() => {
        expect(
          screen.queryByText('Date of birth is required'),
        ).not.toBeInTheDocument();
      });
    });

    it('handles selecting a birth date that makes patient less than 1 year old', async () => {
      renderComponent();

      const dobInput = screen.getByLabelText('Date of birth');
      // Select a date 6 months ago
      const today = new Date();
      const birthDate = new Date(
        today.getFullYear(),
        today.getMonth() - 6,
        today.getDate(),
      );
      const formattedDate = `${String(birthDate.getDate()).padStart(2, '0')}/${String(birthDate.getMonth() + 1).padStart(2, '0')}/${birthDate.getFullYear()}`;

      await userEvent.type(dobInput, formattedDate);
      fireEvent.blur(dobInput);

      await waitFor(() => {
        const ageYearsInput = screen.getByLabelText(
          'Years(Age)',
        ) as HTMLInputElement;
        const ageMonthsInput = screen.getByLabelText(
          'Months(Age)',
        ) as HTMLInputElement;

        expect(ageYearsInput.value).toBe('0');
        expect(parseInt(ageMonthsInput.value)).toBeGreaterThanOrEqual(5);
        expect(parseInt(ageMonthsInput.value)).toBeLessThanOrEqual(7);
      });
    });

    it('handles selecting a birth date for a newborn (less than 1 month old)', async () => {
      renderComponent();

      const dobInput = screen.getByLabelText('Date of birth');
      // Select a date 15 days ago
      const today = new Date();
      const birthDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - 15,
      );
      const formattedDate = `${String(birthDate.getDate()).padStart(2, '0')}/${String(birthDate.getMonth() + 1).padStart(2, '0')}/${birthDate.getFullYear()}`;

      await userEvent.type(dobInput, formattedDate);
      fireEvent.blur(dobInput);

      await waitFor(() => {
        const ageYearsInput = screen.getByLabelText(
          'Years(Age)',
        ) as HTMLInputElement;
        const ageMonthsInput = screen.getByLabelText(
          'Months(Age)',
        ) as HTMLInputElement;
        const ageDaysInput = screen.getByLabelText(
          'Days(Age)',
        ) as HTMLInputElement;

        expect(ageYearsInput.value).toBe('0');
        expect(ageMonthsInput.value).toBe('0');
        expect(parseInt(ageDaysInput.value)).toBeGreaterThanOrEqual(14);
        expect(parseInt(ageDaysInput.value)).toBeLessThanOrEqual(16);
      });
    });
  });
});
