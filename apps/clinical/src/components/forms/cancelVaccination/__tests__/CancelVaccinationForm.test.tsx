import { useQuery } from '@tanstack/react-query';
import { act, render, screen, fireEvent } from '@testing-library/react';

import type { EncounterSessionStartContext } from '../../../../events/startConsultation';
import { useCancelVaccinationStore } from '../../../../stores/cancelVaccinationStore';
import CancelVaccinationForm from '../CancelVaccinationForm';

let capturedDropdownProps: any = null;

jest.mock('@bahmni/design-system', () => {
  const actual = jest.requireActual('@bahmni/design-system');
  return {
    ...actual,
    Dropdown: jest.fn((props: any) => {
      capturedDropdownProps = props;
      return (
        <div
          data-testid="cancel-vaccination-reason-dropdown"
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
}));

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

jest.mock('../../../../stores/cancelVaccinationStore', () => ({
  useCancelVaccinationStore: jest.fn(),
}));

jest.mock('../styles/CancelVaccinationForm.module.scss', () => ({}), {
  virtual: true,
});

const mockMedicationRequest = {
  resourceType: 'MedicationRequest' as const,
  id: 'med-uuid-1',
  status: 'active' as const,
  intent: 'order' as const,
  subject: { reference: 'Patient/patient-uuid-1' },
  medicationReference: { display: 'BCG Vaccine' },
  dosageInstruction: [{ route: { coding: [{ display: 'Intramuscular' }] } }],
};

const mockCancelReasonValueSet = {
  resourceType: 'ValueSet' as const,
  status: 'active' as const,
  expansion: {
    timestamp: '2025-01-01',
    contains: [
      { code: 'reason-uuid-1', display: 'Adverse reaction' },
      { code: 'reason-uuid-2', display: 'Patient request' },
    ],
  },
};

const defaultFieldConfig = {
  cancellationReason: { isVisible: true, isMandatory: false },
  note: { isVisible: true, isMandatory: false },
};

function makeStoreMock(overrides: Record<string, unknown> = {}) {
  return {
    cancellationReason: null as string | null,
    note: '',
    errors: {} as Record<string, string>,
    fieldConfig: defaultFieldConfig,
    setCancellationReason: jest.fn(),
    setNote: jest.fn(),
    setMedicationToCancel: jest.fn(),
    ...overrides,
  };
}

const mockUseQuery = jest.mocked(useQuery);
const mockUseCancelVaccinationStore = jest.mocked(useCancelVaccinationStore);

const renderForm = (
  encounterSessionStartContext?: EncounterSessionStartContext,
) =>
  render(
    <CancelVaccinationForm
      encounterSessionStartContext={encounterSessionStartContext}
    />,
  );

describe('CancelVaccinationForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedDropdownProps = null;
    mockUseQuery.mockReturnValue({
      data: mockCancelReasonValueSet,
      isLoading: false,
      error: null,
    } as any);
    mockUseCancelVaccinationStore.mockReturnValue(makeStoreMock() as any);
  });

  it('returns null when encounterSessionStartContext has no cancelVaccination', () => {
    const { container } = renderForm({ encounterType: 'Consultation' });
    expect(container).toBeEmptyDOMElement();
  });

  it('calls setMedicationToCancel with the medication on mount', async () => {
    const setMedicationToCancel = jest.fn();
    mockUseCancelVaccinationStore.mockReturnValue(
      makeStoreMock({ setMedicationToCancel }) as any,
    );

    await act(async () => {
      renderForm({ cancelVaccination: mockMedicationRequest });
    });

    expect(setMedicationToCancel).toHaveBeenCalledWith(mockMedicationRequest);
  });

  it('does not call setMedicationToCancel when cancelVaccination is absent', async () => {
    const setMedicationToCancel = jest.fn();
    mockUseCancelVaccinationStore.mockReturnValue(
      makeStoreMock({ setMedicationToCancel }) as any,
    );

    await act(async () => {
      renderForm();
    });

    expect(setMedicationToCancel).not.toHaveBeenCalled();
  });

  it('renders the medication name and route', async () => {
    await act(async () => {
      renderForm({ cancelVaccination: mockMedicationRequest });
    });

    expect(screen.getByText('BCG Vaccine')).toBeInTheDocument();
    expect(screen.getByText('[Intramuscular]')).toBeInTheDocument();
  });

  it('does not render a route span when route is absent', async () => {
    const medWithoutRoute = { ...mockMedicationRequest, dosageInstruction: [] };

    await act(async () => {
      renderForm({ cancelVaccination: medWithoutRoute });
    });

    expect(screen.queryByText(/\[.*\]/)).not.toBeInTheDocument();
  });

  it('calls setCancellationReason with the selected reason display when a new item is chosen', async () => {
    const setCancellationReason = jest.fn();
    mockUseCancelVaccinationStore.mockReturnValue(
      makeStoreMock({ setCancellationReason, cancellationReason: null }) as any,
    );

    await act(async () => {
      renderForm({ cancelVaccination: mockMedicationRequest });
    });

    capturedDropdownProps.onChange({
      selectedItem: { uuid: 'reason-uuid-1', display: 'Adverse reaction' },
    });

    expect(setCancellationReason).toHaveBeenCalledWith('Adverse reaction');
  });

  it('calls setCancellationReason with null when selectedItem has no display', async () => {
    const setCancellationReason = jest.fn();
    mockUseCancelVaccinationStore.mockReturnValue(
      makeStoreMock({ setCancellationReason, cancellationReason: null }) as any,
    );

    await act(async () => {
      renderForm({ cancelVaccination: mockMedicationRequest });
    });

    capturedDropdownProps.onChange({ selectedItem: null });

    expect(setCancellationReason).toHaveBeenCalledWith(null);
  });

  it('calls setCancellationReason(null) when the already-selected reason is chosen again', async () => {
    const setCancellationReason = jest.fn();
    mockUseCancelVaccinationStore.mockReturnValue(
      makeStoreMock({
        setCancellationReason,
        cancellationReason: 'Adverse reaction',
      }) as any,
    );

    await act(async () => {
      renderForm({ cancelVaccination: mockMedicationRequest });
    });

    capturedDropdownProps.onChange({
      selectedItem: { uuid: 'reason-uuid-1', display: 'Adverse reaction' },
    });

    expect(setCancellationReason).toHaveBeenCalledWith(null);
  });

  it('shows the cancellationReason error text when errors.cancellationReason is set', async () => {
    mockUseCancelVaccinationStore.mockReturnValue(
      makeStoreMock({
        errors: { cancellationReason: 'CANCEL_VACCINATION_REASON_REQUIRED' },
      }) as any,
    );

    await act(async () => {
      renderForm({ cancelVaccination: mockMedicationRequest });
    });

    expect(
      screen.getByText('CANCEL_VACCINATION_REASON_REQUIRED'),
    ).toBeInTheDocument();
  });

  it('does not render the cancellation reason dropdown when isVisible is false', async () => {
    mockUseCancelVaccinationStore.mockReturnValue(
      makeStoreMock({
        fieldConfig: {
          ...defaultFieldConfig,
          cancellationReason: { isVisible: false, isMandatory: false },
        },
      }) as any,
    );

    await act(async () => {
      renderForm({ cancelVaccination: mockMedicationRequest });
    });

    expect(
      screen.queryByTestId('cancel-vaccination-reason-dropdown'),
    ).not.toBeInTheDocument();
  });

  it('shows the note textarea and hides the "add note" link after clicking it', async () => {
    await act(async () => {
      renderForm({ cancelVaccination: mockMedicationRequest });
    });

    fireEvent.click(screen.getByTestId('cancel-vaccination-add-note-link'));

    expect(screen.getByPlaceholderText('CANCEL_VACCINATION_NOTE_PLACEHOLDER')).toBeInTheDocument();
    expect(
      screen.queryByTestId('cancel-vaccination-add-note-link'),
    ).not.toBeInTheDocument();
  });

  it('calls setNote when the textarea value changes within the 100-char limit', async () => {
    const setNote = jest.fn();
    mockUseCancelVaccinationStore.mockReturnValue(
      makeStoreMock({ setNote, note: '' }) as any,
    );

    await act(async () => {
      renderForm({ cancelVaccination: mockMedicationRequest });
    });

    fireEvent.click(screen.getByTestId('cancel-vaccination-add-note-link'));
    fireEvent.change(screen.getByPlaceholderText('CANCEL_VACCINATION_NOTE_PLACEHOLDER'), {
      target: { value: 'Hello' },
    });

    expect(setNote).toHaveBeenCalledWith('Hello');
  });

  it('does not call setNote when the new value exceeds 100 characters', async () => {
    const setNote = jest.fn();
    mockUseCancelVaccinationStore.mockReturnValue(
      makeStoreMock({ setNote, note: '' }) as any,
    );

    await act(async () => {
      renderForm({ cancelVaccination: mockMedicationRequest });
    });

    fireEvent.click(screen.getByTestId('cancel-vaccination-add-note-link'));
    fireEvent.change(screen.getByPlaceholderText('CANCEL_VACCINATION_NOTE_PLACEHOLDER'), {
      target: { value: 'A'.repeat(101) },
    });

    expect(setNote).not.toHaveBeenCalled();
  });

  it('calls setNote when the new value is exactly 100 characters', async () => {
    const setNote = jest.fn();
    mockUseCancelVaccinationStore.mockReturnValue(
      makeStoreMock({ setNote, note: '' }) as any,
    );

    await act(async () => {
      renderForm({ cancelVaccination: mockMedicationRequest });
    });

    fireEvent.click(screen.getByTestId('cancel-vaccination-add-note-link'));
    const exactly100 = 'B'.repeat(100);
    fireEvent.change(screen.getByPlaceholderText('CANCEL_VACCINATION_NOTE_PLACEHOLDER'), {
      target: { value: exactly100 },
    });

    expect(setNote).toHaveBeenCalledWith(exactly100);
  });

  it('displays the note character counter based on note length', async () => {
    mockUseCancelVaccinationStore.mockReturnValue(
      makeStoreMock({ note: 'Hello' }) as any,
    );

    await act(async () => {
      renderForm({ cancelVaccination: mockMedicationRequest });
    });

    fireEvent.click(screen.getByTestId('cancel-vaccination-add-note-link'));

    expect(screen.getByText('5/100')).toBeInTheDocument();
  });

  it('does not render the "add note" link or textarea when note isVisible is false', async () => {
    mockUseCancelVaccinationStore.mockReturnValue(
      makeStoreMock({
        fieldConfig: {
          ...defaultFieldConfig,
          note: { isVisible: false, isMandatory: false },
        },
      }) as any,
    );

    await act(async () => {
      renderForm({ cancelVaccination: mockMedicationRequest });
    });

    expect(
      screen.queryByTestId('cancel-vaccination-add-note-link'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText('CANCEL_VACCINATION_NOTE_PLACEHOLDER'),
    ).not.toBeInTheDocument();
  });
});
