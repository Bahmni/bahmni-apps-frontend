import { dispatchCDSSCheck } from '@bahmni/services';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import SelectedMedicationRequestItem from '../components/SelectedMedicationRequestItem';
import { getMedicationRequestStore, useMedicationRequestStore } from '../store';
import {
  makeMockStore,
  mockFullMedicationAttributes,
  mockFullMedicationAttributesReadOnly,
  mockMedicationConfig,
  mockMedicationConfigWithDrugFormDefaults,
  mockMinimalMedicationEntry,
  mockMinimalMedicationEntryWithForm,
  mockRequiredMedicationAttributes,
  mockSelectedMedication,
  mockSelectedMedicationWithAllErrors,
  mockSelectedVaccination,
  mockInputControlConfigWithCDSS,
} from './__mocks__/MedicationRequestFormMocks';

expect.extend(toHaveNoViolations);

jest.mock('../store', () => ({
  ...jest.requireActual('../store'),
  useMedicationRequestStore: jest.fn(),
}));

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  dispatchCDSSCheck: jest.fn(),
}));

const mockUseMedicationRequestStore = jest.mocked(useMedicationRequestStore);

const mockDispatchCDSSCheck = jest.mocked(dispatchCDSSCheck);

describe('SelectedMedicationRequestItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('default_dateFormat', 'dd/MM/yyyy');
    mockUseMedicationRequestStore.mockReturnValue(makeMockStore());
  });

  it('renders correctly with the configured set of attributes', async () => {
    const { id } = mockSelectedMedication;
    const inputControlType = 'medication';

    await act(async () => {
      render(
        <SelectedMedicationRequestItem
          entry={mockSelectedMedication}
          medicationConfig={mockMedicationConfig}
          inputControlType={inputControlType}
          attributes={mockFullMedicationAttributes}
        />,
      );
    });

    expect(
      screen.getByTestId(`${inputControlType}-selected-item-${id}-test-id`),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`${inputControlType}-name-${id}-test-id`),
    ).toHaveTextContent('Magnesium sulfate 500 mg/ml');
    expect(
      screen.getByTestId(`${inputControlType}-details-${id}-test-id`),
    ).toHaveTextContent('(Injection)');
    expect(
      screen.getByTestId(`${inputControlType}-dose-form-${id}-test-id`),
    ).toHaveTextContent('Injection');
    expect(
      screen.getByTestId(`${inputControlType}-stat-checkbox-${id}-test-id`),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`${inputControlType}-prn-checkbox-${id}-test-id`),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`${inputControlType}-dosage-input-${id}-test-id`),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(
        `${inputControlType}-dosage-unit-dropdown-${id}-test-id`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(
        `${inputControlType}-frequency-dropdown-${id}-test-id`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`${inputControlType}-duration-input-${id}-test-id`),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(
        `${inputControlType}-duration-unit-dropdown-${id}-test-id`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(
        `${inputControlType}-instructions-dropdown-${id}-test-id`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`${inputControlType}-route-dropdown-${id}-test-id`),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`${inputControlType}-start-date-picker-${id}-test-id`),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`${inputControlType}-start-date-input-${id}-test-id`),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`${inputControlType}-add-note-link-${id}-test-id`),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`${inputControlType}-total-quantity-${id}-test-id`),
    ).toBeInTheDocument();
  });

  it('does not renders attributes that are not configured', async () => {
    const { id } = mockSelectedMedication;
    const inputControlType = 'medication';

    await act(async () => {
      render(
        <SelectedMedicationRequestItem
          entry={mockSelectedMedication}
          medicationConfig={mockMedicationConfig}
          inputControlType={inputControlType}
          attributes={[]}
        />,
      );
    });

    expect(
      screen.queryByTestId(`${inputControlType}-stat-checkbox-${id}-test-id`),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(`${inputControlType}-prn-checkbox-${id}-test-id`),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(`${inputControlType}-dosage-input-${id}-test-id`),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(
        `${inputControlType}-dosage-unit-dropdown-${id}-test-id`,
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(
        `${inputControlType}-frequency-dropdown-${id}-test-id`,
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(`${inputControlType}-duration-input-${id}-test-id`),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(
        `${inputControlType}-duration-unit-dropdown-${id}-test-id`,
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(
        `${inputControlType}-instructions-dropdown-${id}-test-id`,
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(`${inputControlType}-route-dropdown-${id}-test-id`),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(
        `${inputControlType}-start-date-picker-${id}-test-id`,
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(
        `${inputControlType}-start-date-input-${id}-test-id`,
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(`${inputControlType}-add-note-link-${id}-test-id`),
    ).not.toBeInTheDocument();
  });

  it('renders prn checkboxes only for medication requests', async () => {
    const { id } = mockSelectedMedication;
    const attributes = [{ name: 'prn' }, { name: 'dosage', required: true }];
    await act(async () => {
      render(
        <SelectedMedicationRequestItem
          entry={mockSelectedMedication}
          medicationConfig={mockMedicationConfig}
          inputControlType="vaccination"
          attributes={attributes}
        />,
      );
    });
    expect(
      screen.queryByTestId(`vaccination-prn-checkbox-${id}-test-id`),
    ).not.toBeInTheDocument();
  });

  describe('with real store', () => {
    let store: ReturnType<typeof getMedicationRequestStore>;
    let user: ReturnType<typeof userEvent.setup>;

    const TestWrapper = () => {
      const { selectedMedicationRequests } =
        useMedicationRequestStore('medication');
      const entry = selectedMedicationRequests[0];
      if (!entry) return null;
      return (
        <SelectedMedicationRequestItem
          entry={entry}
          medicationConfig={mockMedicationConfig}
          inputControlType="medication"
          attributes={mockFullMedicationAttributes}
        />
      );
    };

    beforeEach(() => {
      const { useMedicationRequestStore: realUseMedicationRequestStore } =
        jest.requireActual('../store');
      mockUseMedicationRequestStore.mockImplementation(
        realUseMedicationRequestStore,
      );
      store = getMedicationRequestStore('medication');
      user = userEvent.setup();
    });

    afterEach(async () => {
      await act(async () => {
        store.getState().reset();
      });
    });

    it('should let user capture and store data against configured attributes', async () => {
      store.setState({
        selectedMedicationRequests: [{ ...mockSelectedMedication, note: '' }],
      });
      const { id } = mockSelectedMedication;

      await act(async () => {
        render(<TestWrapper />);
      });

      fireEvent.click(screen.getByRole('textbox', { name: 'Start Date' }));
      const todayCell = document.querySelector<HTMLElement>(
        '.flatpickr-day.today',
      );
      if (todayCell) fireEvent.click(todayCell);
      expect(
        store.getState().selectedMedicationRequests[0].startDate,
      ).toBeInstanceOf(Date);

      await user.click(screen.getByRole('checkbox', { name: 'STAT' }));
      expect(store.getState().selectedMedicationRequests[0].isSTAT).toBe(true);

      await user.click(screen.getByRole('checkbox', { name: 'PRN' }));
      expect(store.getState().selectedMedicationRequests[0].isPRN).toBe(true);

      await user.clear(screen.getByRole('spinbutton', { name: 'Dosage' }));
      await user.type(screen.getByRole('spinbutton', { name: 'Dosage' }), '10');
      expect(store.getState().selectedMedicationRequests[0].dosage).toBe(10);

      await user.click(screen.getByRole('combobox', { name: 'Dosage Unit' }));
      await user.click(screen.getByRole('option', { name: 'ml' }));
      expect(store.getState().selectedMedicationRequests[0].dosageUnit).toEqual(
        {
          uuid: 'ml-uuid',
          name: 'ml',
        },
      );

      await user.click(screen.getByRole('combobox', { name: 'Frequency' }));
      await user.click(screen.getByRole('option', { name: 'BD' }));
      expect(store.getState().selectedMedicationRequests[0].frequency).toEqual({
        uuid: 'bd-uuid',
        name: 'BD',
        frequencyPerDay: 2,
      });

      await user.clear(screen.getByRole('spinbutton', { name: 'Duration' }));
      await user.type(
        screen.getByRole('spinbutton', { name: 'Duration' }),
        '7',
      );
      expect(store.getState().selectedMedicationRequests[0].duration).toBe(7);

      await user.click(screen.getByRole('combobox', { name: 'Duration Unit' }));
      await user.click(screen.getByRole('option', { name: 'Weeks' }));
      expect(
        store.getState().selectedMedicationRequests[0].durationUnit,
      ).toEqual({
        code: 'wk',
        display: 'DURATION_UNIT_WEEKS',
        daysMultiplier: 7,
      });

      await user.click(screen.getByRole('combobox', { name: 'Instructions' }));
      await user.click(screen.getByRole('option', { name: 'Before Food' }));
      expect(
        store.getState().selectedMedicationRequests[0].instruction,
      ).toEqual({
        uuid: 'before-food-uuid',
        name: 'Before Food',
      });

      await user.click(screen.getByRole('combobox', { name: 'Route' }));
      await user.click(screen.getByRole('option', { name: 'IV' }));
      expect(store.getState().selectedMedicationRequests[0].route).toEqual({
        uuid: 'iv-uuid',
        name: 'IV',
      });

      await user.click(
        screen.getByTestId(`medication-add-note-link-${id}-test-id`),
      );
      await user.type(
        screen.getByRole('textbox', { name: 'Add Note' }),
        'test note',
      );
      expect(store.getState().selectedMedicationRequests[0].note).toBe(
        'test note',
      );
    });

    it('should update store when user selects a frequency from the dropdown', async () => {
      store.setState({
        selectedMedicationRequests: [
          { ...mockSelectedMedication, frequency: null },
        ],
      });

      await act(async () => {
        render(
          <SelectedMedicationRequestItem
            entry={store.getState().selectedMedicationRequests[0]}
            medicationConfig={mockMedicationConfig}
            inputControlType="medication"
            attributes={[{ name: 'frequency' }]}
          />,
        );
      });

      await user.click(screen.getByRole('combobox', { name: 'Frequency' }));
      await user.click(screen.getByRole('option', { name: 'BD' }));
      expect(store.getState().selectedMedicationRequests[0].frequency).toEqual({
        uuid: 'bd-uuid',
        name: 'BD',
        frequencyPerDay: 2,
      });
    });

    it('should clear notes when note is closed', async () => {
      store.setState({
        selectedMedicationRequests: [
          { ...mockSelectedMedication, note: 'existing note' },
        ],
      });

      await act(async () => {
        render(<TestWrapper />);
      });

      expect(
        screen.getByRole('textbox', { name: 'Add Note' }),
      ).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Close' }));

      expect(
        screen.queryByRole('textbox', { name: 'Add Note' }),
      ).not.toBeInTheDocument();
      expect(store.getState().selectedMedicationRequests[0].note).toBe('');
    });
  });

  it('should apply drug form defaults for route and dosage unit on mount', async () => {
    const mockStore = makeMockStore();
    mockUseMedicationRequestStore.mockReturnValue(mockStore);

    await act(async () => {
      render(
        <SelectedMedicationRequestItem
          entry={mockMinimalMedicationEntryWithForm}
          medicationConfig={mockMedicationConfigWithDrugFormDefaults}
          inputControlType="medication"
          attributes={[{ name: 'dosage', required: true }]}
        />,
      );
    });

    expect(mockStore.updateRoute).toHaveBeenCalledWith(
      mockMinimalMedicationEntryWithForm.id,
      { uuid: 'oral-uuid', name: 'Oral' },
    );
    expect(mockStore.updateDosageUnit).toHaveBeenCalledWith(
      mockMinimalMedicationEntryWithForm.id,
      { uuid: 'mg-uuid', name: 'mg' },
    );
    expect(mockStore.updateDispenseUnit).toHaveBeenCalledWith(
      mockMinimalMedicationEntryWithForm.id,
      { uuid: 'mg-uuid', name: 'mg' },
    );
  });

  it('should update attributes when default values are provided', async () => {
    const mockStore = makeMockStore();
    mockUseMedicationRequestStore.mockReturnValue(mockStore);

    await act(async () => {
      render(
        <SelectedMedicationRequestItem
          entry={mockMinimalMedicationEntry}
          medicationConfig={mockMedicationConfig}
          inputControlType="medication"
          attributes={[
            { name: 'dosage', default: 5 },
            { name: 'frequency', default: 'BD' },
            { name: 'instruction', default: 'Before Food' },
            { name: 'durationUnit', default: 'd' },
          ]}
        />,
      );
    });

    expect(mockStore.updateFrequency).toHaveBeenCalledWith(
      mockMinimalMedicationEntry.id,
      { uuid: 'bd-uuid', name: 'BD', frequencyPerDay: 2 },
    );
    expect(mockStore.updateInstruction).toHaveBeenCalledWith(
      mockMinimalMedicationEntry.id,
      { uuid: 'before-food-uuid', name: 'Before Food' },
    );
    expect(mockStore.updateDurationUnit).toHaveBeenCalledWith(
      mockMinimalMedicationEntry.id,
      { code: 'd', display: 'DURATION_UNIT_DAYS', daysMultiplier: 1 },
    );
  });

  it('sets immediate frequency, clears duration, and updates start date when vaccination isSTAT is true', async () => {
    const mockStore = makeMockStore();
    mockUseMedicationRequestStore.mockReturnValue(mockStore);

    await act(async () => {
      render(
        <SelectedMedicationRequestItem
          entry={{ ...mockSelectedVaccination, isSTAT: true }}
          medicationConfig={mockMedicationConfig}
          inputControlType="vaccination"
          attributes={[{ name: 'stat' }, { name: 'frequency' }]}
        />,
      );
    });

    expect(mockStore.updateFrequency).toHaveBeenCalledWith(
      mockSelectedVaccination.id,
      { uuid: '0', name: 'Immediately', frequencyPerDay: 1 },
    );
    expect(mockStore.updateDuration).toHaveBeenCalledWith(
      mockSelectedVaccination.id,
      0,
    );
    expect(mockStore.updateDurationUnit).toHaveBeenCalledWith(
      mockSelectedVaccination.id,
      null,
    );
    expect(mockStore.updateStartDate).toHaveBeenCalledWith(
      mockSelectedVaccination.id,
      expect.any(Date),
    );
  });

  it('should update attributes with disabled when marked as readOnly', async () => {
    await act(async () => {
      render(
        <SelectedMedicationRequestItem
          entry={{ ...mockSelectedMedication, note: 'existing note' }}
          medicationConfig={mockMedicationConfig}
          inputControlType="medication"
          attributes={mockFullMedicationAttributesReadOnly}
        />,
      );
    });

    expect(screen.getByRole('checkbox', { name: 'STAT' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'PRN' })).toBeDisabled();
    expect(screen.getByRole('spinbutton', { name: 'Dosage' })).toBeDisabled();
    expect(
      screen.getByRole('combobox', { name: 'Dosage Unit' }),
    ).toBeDisabled();
    expect(screen.getByRole('combobox', { name: 'Frequency' })).toBeDisabled();
    expect(screen.getByRole('spinbutton', { name: 'Duration' })).toBeDisabled();
    expect(
      screen.getByRole('combobox', { name: 'Duration Unit' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('combobox', { name: 'Instructions' }),
    ).toBeDisabled();
    expect(screen.getByRole('combobox', { name: 'Route' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Start Date' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Add Note' })).toBeDisabled();
  });

  it('should show validation errors when required fields are not filled', async () => {
    await act(async () => {
      render(
        <SelectedMedicationRequestItem
          entry={mockSelectedMedicationWithAllErrors}
          medicationConfig={mockMedicationConfig}
          inputControlType="medication"
          attributes={mockRequiredMedicationAttributes}
        />,
      );
    });

    expect(screen.getByText('Please check STAT')).toBeInTheDocument();
    expect(screen.getByText('Please check PRN')).toBeInTheDocument();
    expect(screen.getByText('Please enter a dosage')).toBeInTheDocument();
    expect(screen.getByText('Please select a dosage unit')).toBeInTheDocument();
    expect(screen.getByText('Please select a frequency')).toBeInTheDocument();
    expect(screen.getByText('Please enter a duration')).toBeInTheDocument();
    expect(
      screen.getByText('Please select a duration unit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Please select an instruction'),
    ).toBeInTheDocument();
    expect(screen.getByText('Please select a route')).toBeInTheDocument();
    expect(screen.getByText('Please select a start date')).toBeInTheDocument();
    expect(screen.getByText('Please enter a note')).toBeInTheDocument();
  });

  describe('Snapshot', () => {
    it('matches snapshot with all attributes', async () => {
      const inputControlType = 'medication';
      let asFragment!: () => DocumentFragment;

      await act(async () => {
        ({ asFragment } = render(
          <SelectedMedicationRequestItem
            entry={mockSelectedMedication}
            medicationConfig={mockMedicationConfig}
            inputControlType={inputControlType}
            attributes={mockFullMedicationAttributes}
          />,
        ));
      });

      expect(asFragment()).toMatchSnapshot();
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const inputControlType = 'medication';

      await act(async () => {
        const { container } = render(
          <SelectedMedicationRequestItem
            entry={mockSelectedMedication}
            medicationConfig={mockMedicationConfig}
            inputControlType={inputControlType}
            attributes={mockFullMedicationAttributes}
          />,
        );

        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });
  });

  describe('CDSS Integration', () => {
    beforeEach(() => {
      mockDispatchCDSSCheck.mockClear();
    });

    it('dispatches CDSS check event on mount when CDSS rules are configured for onSelect event', async () => {
      await act(async () => {
        render(
          <SelectedMedicationRequestItem
            entry={mockSelectedMedication}
            medicationConfig={mockMedicationConfig}
            inputControlType="medication"
            attributes={mockFullMedicationAttributes}
            cdssRules={mockInputControlConfigWithCDSS.cdss}
          />,
        );
      });

      expect(mockDispatchCDSSCheck).toHaveBeenCalledTimes(1);
      expect(mockDispatchCDSSCheck).toHaveBeenCalledWith({
        controlKey: 'medication',
        itemId: mockSelectedMedication.id,
        rules: [
          {
            event: 'onSelect',
            server: 'test-cdss-server',
            service: 'medication-prescribe',
          },
        ],
      });
    });

    it('does not dispatch CDSS check when no CDSS rules are configured', async () => {
      await act(async () => {
        render(
          <SelectedMedicationRequestItem
            entry={mockSelectedMedication}
            medicationConfig={mockMedicationConfig}
            inputControlType="medication"
            attributes={mockFullMedicationAttributes}
            cdssRules={[]}
          />,
        );
      });

      expect(mockDispatchCDSSCheck).not.toHaveBeenCalled();
    });

    it('does not dispatch CDSS check when CDSS rules exist but not for onSelect event', async () => {
      const configWithDifferentEvent = {
        type: 'medication',
        label: 'MEDICATION_REQUEST_FORM_TITLE',
        cdss: [
          {
            server: 'test-cdss-server',
            service: 'medication-prescribe',
            event: 'onSave',
          },
        ],
      };

      await act(async () => {
        render(
          <SelectedMedicationRequestItem
            entry={mockSelectedMedication}
            medicationConfig={mockMedicationConfig}
            inputControlType="medication"
            attributes={mockFullMedicationAttributes}
            cdssRules={configWithDifferentEvent.cdss}
          />,
        );
      });

      expect(mockDispatchCDSSCheck).not.toHaveBeenCalled();
    });

    it('dispatches CDSS check only once on mount, not on re-renders', async () => {
      const { rerender } = await act(async () =>
        render(
          <SelectedMedicationRequestItem
            entry={mockSelectedMedication}
            medicationConfig={mockMedicationConfig}
            inputControlType="medication"
            attributes={mockFullMedicationAttributes}
            cdssRules={mockInputControlConfigWithCDSS.cdss}
          />,
        ),
      );

      expect(mockDispatchCDSSCheck).toHaveBeenCalledTimes(1);

      await act(async () => {
        rerender(
          <SelectedMedicationRequestItem
            entry={{ ...mockSelectedMedication, dosage: 10 }}
            medicationConfig={mockMedicationConfig}
            inputControlType="medication"
            attributes={mockFullMedicationAttributes}
            cdssRules={mockInputControlConfigWithCDSS.cdss}
          />,
        );
      });

      expect(mockDispatchCDSSCheck).toHaveBeenCalledTimes(1);
    });
  });
});
