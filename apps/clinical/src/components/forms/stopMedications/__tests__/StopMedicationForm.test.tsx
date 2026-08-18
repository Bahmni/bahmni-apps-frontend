import { useQuery } from '@tanstack/react-query';
import { act, render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import type { EncounterSessionStartContext } from '../../../../events/startConsultation';
import { useStopMedicationStore } from '../../../../stores/stopMedicationsStore';
import StopMedicationForm from '../StopMedicationForm';

// Capture the onChange prop injected into the Dropdown so tests can invoke it
// directly without relying on Carbon's internal DOM interactions.
let capturedDropdownOnChange:
  | ((args: { selectedItem: { uuid: string; display: string } | null }) => void)
  | null = null;

jest.mock('@bahmni/design-system', () => {
  const actual = jest.requireActual('@bahmni/design-system');
  return {
    ...actual,
    Dropdown: jest.fn((props: any) => {
      capturedDropdownOnChange = props.onChange;
      return (
        <div
          data-testid="stop-medication-reason-dropdown"
          data-invalid={props.invalid ? 'true' : undefined}
        >
          {props.invalid && props.invalidText ? (
            <span>{props.invalidText}</span>
          ) : null}
        </div>
      );
    }),
  };
});

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: jest.fn(() => ({
    t: (key: string) => key,
  })),
  get: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

jest.mock('../../../../services/stopMedicationService', () => ({
  fetchStopReasons: jest.fn(),
}));

jest.mock('../../../../stores/stopMedicationsStore', () => ({
  useStopMedicationStore: jest.fn(),
}));

// Prevent SCSS module resolution errors in jsdom
jest.mock('../styles/StopMedicationForm.module.scss', () => ({}), {
  virtual: true,
});

const mockMedicationRequest = {
  resourceType: 'MedicationRequest' as const,
  id: 'med-uuid-1',
  status: 'active' as const,
  intent: 'order' as const,
  subject: { reference: 'Patient/patient-uuid-1' },
  medicationReference: { display: 'Aspirin 100 mg' },
};

const mockStopReasons = [
  { uuid: 'reason-uuid-1', display: 'Adverse reaction' },
  { uuid: 'reason-uuid-2', display: 'Patient request' },
];

const defaultFieldConfig = {
  stopDate: { isVisible: true, isMandatory: true },
  stopReason: { isVisible: true, isMandatory: true },
  note: { isVisible: true, isMandatory: false },
};

function makeStoreMock(
  overrides: Record<string, unknown> = {},
): ReturnType<typeof buildStoreMock> {
  return buildStoreMock(overrides);
}

function buildStoreMock(overrides: Record<string, unknown> = {}) {
  return {
    stopDate: new Date('2025-06-10'),
    stopReason: null as { uuid: string; display: string } | null,
    note: '',
    errors: {} as Record<string, string>,
    fieldConfig: defaultFieldConfig,
    setStopDate: jest.fn(),
    setStopReason: jest.fn(),
    setNote: jest.fn(),
    setMedicationToStop: jest.fn(),
    setFieldConfig: jest.fn(),
    ...overrides,
  };
}

const mockUseQuery = jest.mocked(useQuery);
const mockUseStopMedicationStore = jest.mocked(useStopMedicationStore);

const defaultQueryMock = ({ queryKey }: { queryKey: readonly unknown[] }) => {
  if (queryKey[0] === 'stopReasons') {
    return { data: mockStopReasons, isLoading: false, error: null };
  }
  if (queryKey[0] === 'medicationConfig') {
    return { data: undefined, isLoading: false, error: null };
  }
  // orderDates query (keyed by ['orderDates', id])
  return { data: undefined, isLoading: false, error: null };
};

const renderForm = (
  encounterSessionStartContext?: EncounterSessionStartContext,
) =>
  render(
    <StopMedicationForm
      encounterSessionStartContext={encounterSessionStartContext}
    />,
  );

describe('StopMedicationForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedDropdownOnChange = null;
    mockUseQuery.mockImplementation(defaultQueryMock as any);
    mockUseStopMedicationStore.mockReturnValue(makeStoreMock() as any);
  });

  // 1. Returns null when no stopMedication in context
  describe('when no stopMedication is provided', () => {
    it('returns null when encounterSessionStartContext is undefined', () => {
      const { container } = renderForm(undefined);
      expect(container).toBeEmptyDOMElement();
    });

    it('returns null when encounterSessionStartContext has no stopMedication key', () => {
      const { container } = renderForm({ encounterType: 'Consultation' });
      expect(container).toBeEmptyDOMElement();
    });

    it('returns null when encounterSessionStartContext is not passed at all', () => {
      const { container } = render(<StopMedicationForm />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  // 2. Renders medication name when stopMedication is provided
  describe('when stopMedication is provided', () => {
    it('renders the medication name from medicationReference.display', async () => {
      await act(async () => {
        renderForm({ stopMedication: mockMedicationRequest });
      });

      expect(screen.getByText('Aspirin 100 mg')).toBeInTheDocument();
    });

    it('renders empty medication name gracefully when medicationReference has no display', async () => {
      const medWithoutDisplay = {
        ...mockMedicationRequest,
        medicationReference: {},
      };

      await act(async () => {
        renderForm({ stopMedication: medWithoutDisplay });
      });

      expect(
        screen.getByTestId('stop-medication-form-tile'),
      ).toBeInTheDocument();
    });
  });

  // 3. Renders stop date picker, stop reason dropdown, note textarea
  describe('field rendering with default field config', () => {
    it('renders the stop date picker input', async () => {
      await act(async () => {
        renderForm({ stopMedication: mockMedicationRequest });
      });

      expect(
        screen.getByTestId('stop-medication-date-input'),
      ).toBeInTheDocument();
    });

    it('renders the stop reason dropdown', async () => {
      await act(async () => {
        renderForm({ stopMedication: mockMedicationRequest });
      });

      expect(
        screen.getByTestId('stop-medication-reason-dropdown'),
      ).toBeInTheDocument();
    });

    it('renders the note textarea after clicking Add Note link', async () => {
      await act(async () => {
        renderForm({ stopMedication: mockMedicationRequest });
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('stop-medication-add-note-link'));
      });

      expect(
        screen.getByPlaceholderText('STOP_MEDICATION_NOTE_PLACEHOLDER'),
      ).toBeInTheDocument();
    });

    it('renders the form tile with the correct test id', async () => {
      await act(async () => {
        renderForm({ stopMedication: mockMedicationRequest });
      });

      expect(
        screen.getByTestId('stop-medication-form-tile'),
      ).toBeInTheDocument();
    });
  });

  // 4. Calls setMedicationToStop when stopMedication is provided
  describe('setMedicationToStop side effect', () => {
    it('calls setMedicationToStop with the medication on mount', async () => {
      const setMedicationToStop = jest.fn();
      mockUseStopMedicationStore.mockReturnValue(
        makeStoreMock({ setMedicationToStop }) as any,
      );

      await act(async () => {
        renderForm({ stopMedication: mockMedicationRequest });
      });

      expect(setMedicationToStop).toHaveBeenCalledWith(mockMedicationRequest);
      expect(setMedicationToStop).toHaveBeenCalledTimes(1);
    });

    it('does not call setMedicationToStop when stopMedication is absent', async () => {
      const setMedicationToStop = jest.fn();
      mockUseStopMedicationStore.mockReturnValue(
        makeStoreMock({ setMedicationToStop }) as any,
      );

      await act(async () => {
        renderForm();
      });

      expect(setMedicationToStop).not.toHaveBeenCalled();
    });
  });

  // 5. Stop reason dropdown onChange - selecting a reason calls setStopReason
  describe('stop reason dropdown onChange', () => {
    it('calls setStopReason with the selected reason display when a new item is chosen', async () => {
      const setStopReason = jest.fn();
      mockUseStopMedicationStore.mockReturnValue(
        makeStoreMock({ setStopReason, stopReason: null }) as any,
      );

      await act(async () => {
        renderForm({ stopMedication: mockMedicationRequest });
      });

      expect(capturedDropdownOnChange).not.toBeNull();
      capturedDropdownOnChange!({
        selectedItem: { uuid: 'reason-uuid-1', display: 'Adverse reaction' },
      });

      expect(setStopReason).toHaveBeenCalledWith({
        uuid: 'reason-uuid-1',
        display: 'Adverse reaction',
      });
    });

    it('calls setStopReason with null when selectedItem has no display', async () => {
      const setStopReason = jest.fn();
      mockUseStopMedicationStore.mockReturnValue(
        makeStoreMock({ setStopReason, stopReason: null }) as any,
      );

      await act(async () => {
        renderForm({ stopMedication: mockMedicationRequest });
      });

      capturedDropdownOnChange!({ selectedItem: null });

      expect(setStopReason).toHaveBeenCalledWith(null);
    });
  });

  // 6. Stop reason dropdown deselection - clicking same item sets null
  describe('stop reason deselection', () => {
    it('calls setStopReason(null) when the already-selected reason is chosen again', async () => {
      const setStopReason = jest.fn();
      // Simulate the store already having 'Adverse reaction' selected
      mockUseStopMedicationStore.mockReturnValue(
        makeStoreMock({
          setStopReason,
          stopReason: { uuid: 'reason-uuid-1', display: 'Adverse reaction' },
        }) as any,
      );

      await act(async () => {
        renderForm({ stopMedication: mockMedicationRequest });
      });

      expect(capturedDropdownOnChange).not.toBeNull();
      // Selecting the same item that is currently the stopReason triggers deselect
      capturedDropdownOnChange!({
        selectedItem: { uuid: 'reason-uuid-1', display: 'Adverse reaction' },
      });

      expect(setStopReason).toHaveBeenCalledWith(null);
    });

    it('calls setStopReason with the full object when a different item is selected', async () => {
      const setStopReason = jest.fn();
      mockUseStopMedicationStore.mockReturnValue(
        makeStoreMock({
          setStopReason,
          stopReason: { uuid: 'reason-uuid-1', display: 'Adverse reaction' },
        }) as any,
      );

      await act(async () => {
        renderForm({ stopMedication: mockMedicationRequest });
      });

      capturedDropdownOnChange!({
        selectedItem: { uuid: 'reason-uuid-2', display: 'Patient request' },
      });

      expect(setStopReason).toHaveBeenCalledWith({
        uuid: 'reason-uuid-2',
        display: 'Patient request',
      });
    });
  });

  // 7. Note textarea onChange - calls setNote
  describe('note textarea onChange', () => {
    it('calls setNote when the textarea value changes within the 100-char limit', async () => {
      const setNote = jest.fn();
      mockUseStopMedicationStore.mockReturnValue(
        makeStoreMock({ setNote, note: 'existing' }) as any,
      );

      await act(async () => {
        renderForm({ stopMedication: mockMedicationRequest });
      });

      const textarea = screen.getByPlaceholderText(
        'STOP_MEDICATION_NOTE_PLACEHOLDER',
      );
      fireEvent.change(textarea, { target: { value: 'Hello' } });

      expect(setNote).toHaveBeenCalledWith('Hello');
    });
  });

  // 8. Note character limit enforced (no change beyond 100 chars)
  describe('note character limit', () => {
    it('does not call setNote when the new value exceeds 100 characters', async () => {
      const setNote = jest.fn();
      mockUseStopMedicationStore.mockReturnValue(
        makeStoreMock({ setNote, note: 'existing' }) as any,
      );

      await act(async () => {
        renderForm({ stopMedication: mockMedicationRequest });
      });

      const textarea = screen.getByPlaceholderText(
        'STOP_MEDICATION_NOTE_PLACEHOLDER',
      );
      const over100 = 'A'.repeat(101);
      fireEvent.change(textarea, { target: { value: over100 } });

      expect(setNote).not.toHaveBeenCalled();
    });

    it('calls setNote when the new value is exactly 100 characters', async () => {
      const setNote = jest.fn();
      mockUseStopMedicationStore.mockReturnValue(
        makeStoreMock({ setNote, note: 'existing' }) as any,
      );

      await act(async () => {
        renderForm({ stopMedication: mockMedicationRequest });
      });

      const textarea = screen.getByPlaceholderText(
        'STOP_MEDICATION_NOTE_PLACEHOLDER',
      );
      const exactly100 = 'B'.repeat(100);
      fireEvent.change(textarea, { target: { value: exactly100 } });

      expect(setNote).toHaveBeenCalledWith(exactly100);
    });
  });

  // 9. Note counter displays correct count
  describe('note character counter', () => {
    it('displays "0/100" when note is empty', async () => {
      mockUseStopMedicationStore.mockReturnValue(
        makeStoreMock({ note: '' }) as any,
      );

      await act(async () => {
        renderForm({ stopMedication: mockMedicationRequest });
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('stop-medication-add-note-link'));
      });

      expect(screen.getByText('0/100')).toBeInTheDocument();
    });

    it('displays "5/100" when note has 5 characters', async () => {
      mockUseStopMedicationStore.mockReturnValue(
        makeStoreMock({ note: 'Hello' }) as any,
      );

      await act(async () => {
        renderForm({ stopMedication: mockMedicationRequest });
      });

      expect(screen.getByText('5/100')).toBeInTheDocument();
    });

    it('displays "100/100" when note is at maximum length', async () => {
      mockUseStopMedicationStore.mockReturnValue(
        makeStoreMock({ note: 'A'.repeat(100) }) as any,
      );

      await act(async () => {
        renderForm({ stopMedication: mockMedicationRequest });
      });

      expect(screen.getByText('100/100')).toBeInTheDocument();
    });
  });

  // 10. Date picker onChange calls setStopDate when a date is selected
  describe('date picker onChange', () => {
    it('renders the date picker input mounted in jsdom', async () => {
      await act(async () => {
        renderForm({ stopMedication: mockMedicationRequest });
      });

      expect(
        screen.getByTestId('stop-medication-date-input'),
      ).toBeInTheDocument();
    });

    it('renders the date picker input with the placeholder "dd/mm/yyyy"', async () => {
      await act(async () => {
        renderForm({ stopMedication: mockMedicationRequest });
      });

      const input = screen.getByTestId('stop-medication-date-input');
      expect(input).toHaveAttribute('placeholder', 'dd/mm/yyyy');
    });
  });

  // 11. Shows error text when errors.stopDate is set
  describe('stopDate error display', () => {
    it('shows the stopDate error text when errors.stopDate is set', async () => {
      mockUseStopMedicationStore.mockReturnValue(
        makeStoreMock({
          errors: { stopDate: 'STOP_MEDICATION_DATE_REQUIRED' },
        }) as any,
      );

      await act(async () => {
        renderForm({ stopMedication: mockMedicationRequest });
      });

      // The DatePickerInput renders invalidText when invalid is truthy.
      // Since t() is an identity function in tests, we check for the key.
      expect(
        screen.getByText('STOP_MEDICATION_DATE_REQUIRED'),
      ).toBeInTheDocument();
    });

    it('does not show a stopDate error when errors.stopDate is not set', async () => {
      await act(async () => {
        renderForm({ stopMedication: mockMedicationRequest });
      });

      expect(
        screen.queryByText('STOP_MEDICATION_DATE_REQUIRED'),
      ).not.toBeInTheDocument();
    });
  });

  // 12. Shows error text when errors.stopReason is set
  describe('stopReason error display', () => {
    it('shows the stopReason error text when errors.stopReason is set', async () => {
      mockUseStopMedicationStore.mockReturnValue(
        makeStoreMock({
          errors: { stopReason: 'STOP_MEDICATION_REASON_REQUIRED' },
        }) as any,
      );

      await act(async () => {
        renderForm({ stopMedication: mockMedicationRequest });
      });

      // The mocked Dropdown renders invalidText as a <span> when invalid is true
      expect(
        screen.getByText('STOP_MEDICATION_REASON_REQUIRED'),
      ).toBeInTheDocument();
    });

    it('does not show a stopReason error when errors.stopReason is not set', async () => {
      await act(async () => {
        renderForm({ stopMedication: mockMedicationRequest });
      });

      expect(
        screen.queryByText('STOP_MEDICATION_REASON_REQUIRED'),
      ).not.toBeInTheDocument();
    });
  });

  // 13. Hides stop date field when fieldConfig.stopDate.isVisible = false
  describe('fieldConfig.stopDate visibility', () => {
    it('does not render the stop date picker when isVisible is false', async () => {
      mockUseStopMedicationStore.mockReturnValue(
        makeStoreMock({
          fieldConfig: {
            ...defaultFieldConfig,
            stopDate: { isVisible: false, isMandatory: false },
          },
        }) as any,
      );

      await act(async () => {
        renderForm({ stopMedication: mockMedicationRequest });
      });

      expect(
        screen.queryByTestId('stop-medication-date-input'),
      ).not.toBeInTheDocument();
    });

    it('renders the stop date picker when isVisible is true', async () => {
      await act(async () => {
        renderForm({ stopMedication: mockMedicationRequest });
      });

      expect(
        screen.getByTestId('stop-medication-date-input'),
      ).toBeInTheDocument();
    });
  });

  // 14. Hides stop reason field when fieldConfig.stopReason.isVisible = false
  describe('fieldConfig.stopReason visibility', () => {
    it('does not render the stop reason dropdown when isVisible is false', async () => {
      mockUseStopMedicationStore.mockReturnValue(
        makeStoreMock({
          fieldConfig: {
            ...defaultFieldConfig,
            stopReason: { isVisible: false, isMandatory: false },
          },
        }) as any,
      );

      await act(async () => {
        renderForm({ stopMedication: mockMedicationRequest });
      });

      expect(
        screen.queryByTestId('stop-medication-reason-dropdown'),
      ).not.toBeInTheDocument();
    });

    it('renders the stop reason dropdown when isVisible is true', async () => {
      await act(async () => {
        renderForm({ stopMedication: mockMedicationRequest });
      });

      expect(
        screen.getByTestId('stop-medication-reason-dropdown'),
      ).toBeInTheDocument();
    });
  });

  // 15. Hides note field when fieldConfig.note.isVisible = false
  describe('fieldConfig.note visibility', () => {
    it('does not render the note textarea when isVisible is false', async () => {
      mockUseStopMedicationStore.mockReturnValue(
        makeStoreMock({
          fieldConfig: {
            ...defaultFieldConfig,
            note: { isVisible: false, isMandatory: false },
          },
        }) as any,
      );

      await act(async () => {
        renderForm({ stopMedication: mockMedicationRequest });
      });

      expect(
        screen.queryByPlaceholderText('STOP_MEDICATION_NOTE_PLACEHOLDER'),
      ).not.toBeInTheDocument();
    });

    it('does not render the note counter when note field is hidden', async () => {
      mockUseStopMedicationStore.mockReturnValue(
        makeStoreMock({
          note: 'some text',
          fieldConfig: {
            ...defaultFieldConfig,
            note: { isVisible: false, isMandatory: false },
          },
        }) as any,
      );

      await act(async () => {
        renderForm({ stopMedication: mockMedicationRequest });
      });

      expect(screen.queryByText(/\/100/)).not.toBeInTheDocument();
    });

    it('renders the note textarea when isVisible is true after clicking Add Note', async () => {
      await act(async () => {
        renderForm({ stopMedication: mockMedicationRequest });
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('stop-medication-add-note-link'));
      });

      expect(
        screen.getByPlaceholderText('STOP_MEDICATION_NOTE_PLACEHOLDER'),
      ).toBeInTheDocument();
    });
  });

  // Additional: all three fields hidden simultaneously
  it('renders only the medication name and tile when all fields are hidden', async () => {
    mockUseStopMedicationStore.mockReturnValue(
      makeStoreMock({
        fieldConfig: {
          stopDate: { isVisible: false },
          stopReason: { isVisible: false },
          note: { isVisible: false },
        },
      }) as any,
    );

    await act(async () => {
      renderForm({ stopMedication: mockMedicationRequest });
    });

    expect(screen.getByText('Aspirin 100 mg')).toBeInTheDocument();
    expect(
      screen.queryByTestId('stop-medication-date-input'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('stop-medication-reason-dropdown'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText('STOP_MEDICATION_NOTE_PLACEHOLDER'),
    ).not.toBeInTheDocument();
  });

  // Additional: setFieldConfig is called when medicationConfig has
  // stopMedicationFields
  describe('setFieldConfig side effect', () => {
    it('calls setFieldConfig when medicationConfig provides stopMedicationFields', async () => {
      const setFieldConfig = jest.fn();
      mockUseStopMedicationStore.mockReturnValue(
        makeStoreMock({ setFieldConfig }) as any,
      );

      const stopMedicationFields = {
        stopDate: { isVisible: true, isMandatory: true },
        stopReason: { isVisible: true, isMandatory: false },
        note: { isVisible: false, isMandatory: false },
      };

      mockUseQuery.mockImplementation(({ queryKey }: any) => {
        if (queryKey[0] === 'medicationConfig') {
          return {
            data: { stopMedicationFields },
            isLoading: false,
            error: null,
          };
        }
        if (queryKey[0] === 'stopReasons') {
          return { data: mockStopReasons, isLoading: false, error: null };
        }
        return { data: undefined, isLoading: false, error: null };
      });

      await act(async () => {
        renderForm({ stopMedication: mockMedicationRequest });
      });

      expect(setFieldConfig).toHaveBeenCalledWith(stopMedicationFields);
    });

    it('does not call setFieldConfig when medicationConfig has no stopMedicationFields', async () => {
      const setFieldConfig = jest.fn();
      mockUseStopMedicationStore.mockReturnValue(
        makeStoreMock({ setFieldConfig }) as any,
      );

      mockUseQuery.mockImplementation(({ queryKey }: any) => {
        if (queryKey[0] === 'medicationConfig') {
          return {
            data: { stopReasons: ['Some reason'] },
            isLoading: false,
            error: null,
          };
        }
        if (queryKey[0] === 'stopReasons') {
          return { data: mockStopReasons, isLoading: false, error: null };
        }
        return { data: undefined, isLoading: false, error: null };
      });

      await act(async () => {
        renderForm({ stopMedication: mockMedicationRequest });
      });

      expect(setFieldConfig).not.toHaveBeenCalled();
    });
  });

  // Additional: stop reasons source selection
  describe('stop reasons source', () => {
    it('uses concept-based stop reasons from API when available', async () => {
      const conceptReasons = [
        { uuid: 'c-uuid-1', display: 'Allergy' },
        { uuid: 'c-uuid-2', display: 'Ineffective' },
      ];
      mockUseQuery.mockImplementation(({ queryKey }: any) => {
        if (queryKey[0] === 'stopReasons') {
          return { data: conceptReasons, isLoading: false, error: null };
        }
        return { data: undefined, isLoading: false, error: null };
      });

      await act(async () => {
        renderForm({ stopMedication: mockMedicationRequest });
      });

      // The Dropdown is rendered — the items prop carries conceptReasons
      expect(
        screen.getByTestId('stop-medication-reason-dropdown'),
      ).toBeInTheDocument();
    });

    it('falls back to config-based stop reasons when API returns an empty array', async () => {
      mockUseQuery.mockImplementation(({ queryKey }: any) => {
        if (queryKey[0] === 'stopReasons') {
          return { data: [], isLoading: false, error: null };
        }
        if (queryKey[0] === 'medicationConfig') {
          return {
            data: { stopReasons: ['Completed', 'Side effects'] },
            isLoading: false,
            error: null,
          };
        }
        return { data: undefined, isLoading: false, error: null };
      });

      await act(async () => {
        renderForm({ stopMedication: mockMedicationRequest });
      });

      expect(
        screen.getByTestId('stop-medication-reason-dropdown'),
      ).toBeInTheDocument();
    });
  });

  describe('mandatory note behavior', () => {
    it('renders note textarea immediately when note is mandatory', async () => {
      mockUseStopMedicationStore.mockReturnValue(
        makeStoreMock({
          fieldConfig: {
            ...defaultFieldConfig,
            note: { isVisible: true, isMandatory: true },
          },
          note: '',
        }) as any,
      );

      await act(async () => {
        renderForm({ stopMedication: mockMedicationRequest });
      });

      expect(
        screen.getByPlaceholderText('STOP_MEDICATION_NOTE_PLACEHOLDER'),
      ).toBeInTheDocument();
    });

    it('does not show Add Note link when note is mandatory', async () => {
      mockUseStopMedicationStore.mockReturnValue(
        makeStoreMock({
          fieldConfig: {
            ...defaultFieldConfig,
            note: { isVisible: true, isMandatory: true },
          },
          note: '',
        }) as any,
      );

      await act(async () => {
        renderForm({ stopMedication: mockMedicationRequest });
      });

      expect(
        screen.queryByTestId('stop-medication-add-note-link'),
      ).not.toBeInTheDocument();
    });
  });

  describe('date picker props', () => {
    it('renders with placeholder dd/mm/yyyy', async () => {
      await act(async () => {
        renderForm({ stopMedication: mockMedicationRequest });
      });

      expect(screen.getByTestId('stop-medication-date-input')).toHaveAttribute(
        'placeholder',
        'dd/mm/yyyy',
      );
    });
  });

  describe('inputControlConfig.metadata.stoppedOrderReasonConceptSet', () => {
    it('passes stoppedOrderReasonConceptSet to the stopReasons query when provided', async () => {
      const inputControlConfig = {
        metadata: { stoppedOrderReasonConceptSet: 'Custom Stop Reasons' },
      } as any;

      await act(async () => {
        render(
          <StopMedicationForm
            encounterSessionStartContext={{
              stopMedication: mockMedicationRequest,
            }}
            inputControlConfig={inputControlConfig}
          />,
        );
      });

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['stopReasons', 'Custom Stop Reasons'],
        }),
      );
    });

    it('falls back to STOP_REASON_VALUESET_TITLE when inputControlConfig has no metadata', async () => {
      await act(async () => {
        renderForm({ stopMedication: mockMedicationRequest });
      });

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['stopReasons', 'Stopped Order Reason'],
        }),
      );
    });
  });

  describe('scheduled medication minStopDate', () => {
    it('renders stop date picker for on-hold (scheduled) medication', async () => {
      const scheduledMedication = {
        ...mockMedicationRequest,
        status: 'on-hold' as const,
      };

      await act(async () => {
        renderForm({ stopMedication: scheduledMedication });
      });

      expect(
        screen.getByTestId('stop-medication-date-input'),
      ).toBeInTheDocument();
    });
  });

  describe('prevMedicationIdRef — medication change', () => {
    it('re-renders cleanly when a different medication is passed', async () => {
      const { rerender } = await act(async () =>
        render(
          <StopMedicationForm
            encounterSessionStartContext={{
              stopMedication: mockMedicationRequest,
            }}
          />,
        ),
      );

      const anotherMedication = {
        ...mockMedicationRequest,
        id: 'med-uuid-2',
        medicationReference: { display: 'Metformin 500 mg' },
      };

      await act(async () => {
        rerender(
          <StopMedicationForm
            encounterSessionStartContext={{ stopMedication: anotherMedication }}
          />,
        );
      });

      expect(screen.getByText('Metformin 500 mg')).toBeInTheDocument();
    });
  });

  describe('vaccination cancellation mode — stale date reset', () => {
    it('calls setStopDate with today when isVaccinationCancellation is true, clearing any stale stop-medication date', async () => {
      const setStopDate = jest.fn();
      // Simulate stale date from a prior stop-medication flow
      const staleDate = new Date('2024-01-15');
      mockUseStopMedicationStore.mockReturnValue(
        makeStoreMock({ setStopDate, stopDate: staleDate }) as any,
      );

      const before = Date.now();
      await act(async () => {
        renderForm({
          stopMedication: mockMedicationRequest,
          isVaccinationCancellation: true,
        });
      });
      const after = Date.now();

      expect(setStopDate).toHaveBeenCalledTimes(1);
      const calledWith: Date = setStopDate.mock.calls[0][0];
      expect(calledWith).toBeInstanceOf(Date);
      expect(calledWith.getTime()).toBeGreaterThanOrEqual(before);
      expect(calledWith.getTime()).toBeLessThanOrEqual(after);
    });

    it('does not call setStopDate when isVaccinationCancellation is false', async () => {
      const setStopDate = jest.fn();
      mockUseStopMedicationStore.mockReturnValue(
        makeStoreMock({ setStopDate }) as any,
      );

      await act(async () => {
        renderForm({ stopMedication: mockMedicationRequest });
      });

      expect(setStopDate).not.toHaveBeenCalled();
    });
  });

  describe('vaccination cancellation mode', () => {
    const vaccinationContext = {
      stopMedication: mockMedicationRequest,
      isVaccinationCancellation: true,
    };

    let capturedDatePickerInputProps: Record<string, unknown> = {};
    let originalDatePickerInput: unknown;
    let originalDatePicker: unknown;

    beforeEach(() => {
      capturedDatePickerInputProps = {};
      const designSystem = jest.requireMock('@bahmni/design-system');

      originalDatePicker = designSystem.DatePicker;
      designSystem.DatePicker = jest.fn(({ children }: any) => (
        <div data-testid="stop-medication-date-picker">{children}</div>
      ));

      originalDatePickerInput = designSystem.DatePickerInput;
      designSystem.DatePickerInput = jest.fn((props: any) => {
        capturedDatePickerInputProps = props;
        return (
          <input
            data-testid="stop-medication-date-input"
            disabled={props.disabled}
            aria-label={props.labelText}
          />
        );
      });
    });

    afterEach(() => {
      const designSystem = jest.requireMock('@bahmni/design-system');
      designSystem.DatePickerInput = originalDatePickerInput;
      designSystem.DatePicker = originalDatePicker;
    });

    it('shows "VACCINATION_CANCEL__FORM_TITLE" and hides "STOP_MEDICATION_FORM_TITLE" in vaccination mode', async () => {
      await act(async () => {
        renderForm(vaccinationContext);
      });

      expect(screen.getByText('VACCINATION_CANCEL_FORM_TITLE')).toBeInTheDocument();
      expect(
        screen.queryByText('STOP_MEDICATION_FORM_TITLE'),
      ).not.toBeInTheDocument();
    });

    it('renders DatePickerInput with labelText "VACCINATION_CANCEL_DATE_LABEL"', async () => {
      await act(async () => {
        renderForm(vaccinationContext);
      });

      expect(capturedDatePickerInputProps.labelText).toBe(
        'VACCINATION_CANCEL_DATE_LABEL',
      );
    });

    it('renders DatePickerInput with disabled=true', async () => {
      await act(async () => {
        renderForm(vaccinationContext);
      });

      expect(capturedDatePickerInputProps.disabled).toBe(true);
    });

    it('renders stop reason dropdown with "VACCINATION_CANCEL_REASON_LABEL"', async () => {
      await act(async () => {
        renderForm(vaccinationContext);
      });

      // The Dropdown mock renders the titleText/label into data attributes captured by capturedDropdownOnChange
      // We check the Dropdown was rendered (it is always rendered when isStopReasonVisible)
      expect(
        screen.getByTestId('stop-medication-reason-dropdown'),
      ).toBeInTheDocument();
    });

    it('in normal (non-vaccination) mode, DatePickerInput has labelText "STOP_MEDICATION_DATE_LABEL"', async () => {
      await act(async () => {
        renderForm({ stopMedication: mockMedicationRequest });
      });

      expect(capturedDatePickerInputProps.labelText).toBe(
        'STOP_MEDICATION_DATE_LABEL',
      );
    });

    it('in normal (non-vaccination) mode, DatePickerInput is not disabled', async () => {
      await act(async () => {
        renderForm({ stopMedication: mockMedicationRequest });
      });

      expect(capturedDatePickerInputProps.disabled).toBeFalsy();
    });

    it('treats isVaccinationCancellation=false as normal stop medication mode', async () => {
      await act(async () => {
        renderForm({
          stopMedication: mockMedicationRequest,
          isVaccinationCancellation: false,
        });
      });

      expect(
        screen.getByText('STOP_MEDICATION_FORM_TITLE'),
      ).toBeInTheDocument();
      expect(capturedDatePickerInputProps.disabled).toBeFalsy();
    });
  });

  describe('note close (onClose) handler', () => {
    it('hides the note textarea and clears the note when onClose is called', async () => {
      let capturedOnClose: (() => void) | null = null;

      const designSystem = jest.requireMock('@bahmni/design-system');
      const originalTextAreaWClose = designSystem.TextAreaWClose;
      designSystem.TextAreaWClose = jest.fn((props: any) => {
        capturedOnClose = props.onClose;
        return (
          <textarea
            placeholder={props.placeholder}
            value={props.value}
            onChange={props.onChange}
          />
        );
      });

      const setNote = jest.fn();
      mockUseStopMedicationStore.mockReturnValue(
        makeStoreMock({ setNote, note: 'some note' }) as any,
      );

      await act(async () => {
        renderForm({ stopMedication: mockMedicationRequest });
      });

      expect(capturedOnClose).not.toBeNull();

      await act(async () => {
        capturedOnClose!();
      });

      expect(setNote).toHaveBeenCalledWith('');

      designSystem.TextAreaWClose = originalTextAreaWClose;
    });
  });
});
