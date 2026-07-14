import { getObservationsFromFhir } from '@bahmni/form2-controls';
import type { ObservationForm } from '@bahmni/services';
import { getObservationsBundleByEncounterUuid } from '@bahmni/services';
import { useActivePractitioner } from '@bahmni/widgets';
import { render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useClinicalAppData } from '../../../../hooks/useClinicalAppData';
import useObservationFormsSearch from '../../../../hooks/useObservationFormsSearch';
import { usePinnedObservationForms } from '../../../../hooks/usePinnedObservationForms';
import { useSubmittedEncounterForms } from '../../../../hooks/useSubmittedEncounterForms';
import { useObservationFormsStore } from '../../../../stores/observationFormsStore';
import ObservationForms from '../ObservationForms';
import ObservationFormsPanel from '../ObservationFormsPanel';

expect.extend(toHaveNoViolations);

const mockForm1: ObservationForm = {
  uuid: 'form-uuid-1',
  name: 'Vitals',
  id: 1,
  privileges: [],
};
const mockForm2: ObservationForm = {
  uuid: 'form-uuid-2',
  name: 'History',
  id: 2,
  privileges: [],
};

const mockAddForm = jest.fn();
const mockRemoveForm = jest.fn();
const mockUpdatePinnedForms = jest.fn();
const mockRefetchPinnedForms = jest.fn();

jest.mock('@bahmni/widgets', () => ({
  useActivePractitioner: jest.fn(),
}));

jest.mock('../../../../hooks/useClinicalAppData', () => ({
  useClinicalAppData: jest.fn(),
}));

jest.mock('../../../../hooks/useObservationFormsSearch', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../../../../hooks/usePinnedObservationForms', () => ({
  usePinnedObservationForms: jest.fn(),
}));

jest.mock('../../../../hooks/useSubmittedEncounterForms', () => ({
  useSubmittedEncounterForms: jest.fn(() => new Set<string>()),
}));

jest.mock('../../../../stores/observationFormsStore', () => ({
  useObservationFormsStore: jest.fn(),
}));

jest.mock('../ObservationForms', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="observation-forms" />),
}));

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getObservationsBundleByEncounterUuid: jest.fn(),
}));

jest.mock('@bahmni/form2-controls', () => ({
  getObservationsFromFhir: jest.fn(),
}));

const MockObservationForms = jest.mocked(ObservationForms);

beforeEach(() => {
  jest.mocked(useActivePractitioner).mockReturnValue({
    user: { uuid: 'practitioner-uuid' },
  } as ReturnType<typeof useActivePractitioner>);

  jest.mocked(useClinicalAppData).mockReturnValue({
    episodeOfCare: [{ uuid: 'eoc-uuid-1' }, { uuid: 'eoc-uuid-2' }],
  } as ReturnType<typeof useClinicalAppData>);

  jest.mocked(useObservationFormsSearch).mockReturnValue({
    forms: [mockForm1, mockForm2],
    isLoading: false,
    error: null,
  });

  jest.mocked(usePinnedObservationForms).mockReturnValue({
    pinnedForms: [mockForm1],
    updatePinnedForms: mockUpdatePinnedForms,
    isLoading: false,
    error: null,
    refetch: mockRefetchPinnedForms,
  });

  jest.mocked(useObservationFormsStore).mockReturnValue({
    selectedForms: [mockForm2],
    addForm: mockAddForm,
    removeForm: mockRemoveForm,
    viewingForm: null,
  } as ReturnType<typeof useObservationFormsStore>);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('ObservationFormsPanel', () => {
  it('renders ObservationForms with props wired from all hooks', () => {
    render(<ObservationFormsPanel />);

    expect(screen.getByTestId('observation-forms')).toBeInTheDocument();

    const receivedProps = MockObservationForms.mock.calls[0][0];
    expect(receivedProps.allForms).toEqual([mockForm1, mockForm2]);
    expect(receivedProps.isAllFormsLoading).toBe(false);
    expect(receivedProps.observationFormsError).toBeNull();
    expect(receivedProps.selectedForms).toEqual([mockForm2]);
    expect(receivedProps.pinnedForms).toEqual([mockForm1]);
    expect(receivedProps.updatePinnedForms).toBe(mockUpdatePinnedForms);
    expect(receivedProps.isPinnedFormsLoading).toBe(false);
  });

  it('passes episodeOfCare UUIDs to useObservationFormsSearch', () => {
    render(<ObservationFormsPanel />);

    expect(jest.mocked(useObservationFormsSearch)).toHaveBeenCalledWith('', [
      'eoc-uuid-1',
      'eoc-uuid-2',
    ]);
  });

  it('passes user UUID and forms loading state to usePinnedObservationForms', () => {
    render(<ObservationFormsPanel />);

    expect(jest.mocked(usePinnedObservationForms)).toHaveBeenCalledWith(
      [mockForm1, mockForm2],
      { userUuid: 'practitioner-uuid', isFormsLoading: false },
    );
  });

  it('passes submittedFormUuids from useSubmittedEncounterForms to ObservationForms', () => {
    const mockSubmittedUuids = new Set(['form-uuid-1']);
    jest.mocked(useSubmittedEncounterForms).mockReturnValue(mockSubmittedUuids);

    render(<ObservationFormsPanel />);

    const receivedProps = MockObservationForms.mock.calls[0][0];
    expect(receivedProps.submittedFormUuids).toBe(mockSubmittedUuids);
  });

  it('calls addForm when onFormSelect is invoked', () => {
    render(<ObservationFormsPanel />);

    const { onFormSelect } = MockObservationForms.mock.calls[0][0];
    onFormSelect!(mockForm1);

    expect(mockAddForm).toHaveBeenCalledWith(mockForm1);
  });

  it('calls removeForm when onRemoveForm is invoked', () => {
    render(<ObservationFormsPanel />);

    const { onRemoveForm } = MockObservationForms.mock.calls[0][0];
    onRemoveForm!('form-uuid-1');

    expect(mockRemoveForm).toHaveBeenCalledWith('form-uuid-1');
  });

  it('refetches pinned forms when viewingForm changes from non-null to null', () => {
    jest.mocked(useObservationFormsStore).mockReturnValue({
      selectedForms: [mockForm2],
      addForm: mockAddForm,
      removeForm: mockRemoveForm,
      viewingForm: mockForm1,
    } as ReturnType<typeof useObservationFormsStore>);

    const { rerender } = render(<ObservationFormsPanel />);
    expect(mockRefetchPinnedForms).not.toHaveBeenCalled();

    // Simulate form close: viewingForm goes from mockForm1 to null
    jest.mocked(useObservationFormsStore).mockReturnValue({
      selectedForms: [mockForm2],
      addForm: mockAddForm,
      removeForm: mockRemoveForm,
      viewingForm: null,
    } as ReturnType<typeof useObservationFormsStore>);

    rerender(<ObservationFormsPanel />);
    expect(mockRefetchPinnedForms).toHaveBeenCalledTimes(1);
  });

  it('does not refetch pinned forms when viewingForm is null on initial render', () => {
    render(<ObservationFormsPanel />);
    expect(mockRefetchPinnedForms).not.toHaveBeenCalled();
  });

  it('matches snapshot', () => {
    const { container } = render(<ObservationFormsPanel />);
    expect(container).toMatchSnapshot();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<ObservationFormsPanel />);
    expect(await axe(container)).toHaveNoViolations();
  });

  describe('DirectMode Form Handling', () => {
    const mockReset = jest.fn();

    beforeEach(() => {
      (
        useObservationFormsStore as unknown as { getState: jest.Mock }
      ).getState = jest.fn(() => ({
        reset: mockReset,
      }));
    });

    it('should reset store and add matching form when directFormMode is true and taskFormName is provided', () => {
      const encounterContext = {
        taskFormName: 'Vitals',
        directFormMode: true,
      };

      render(
        <ObservationFormsPanel
          encounterSessionStartContext={encounterContext}
        />,
      );

      expect(mockReset).toHaveBeenCalledTimes(1);
      expect(mockAddForm).toHaveBeenCalledWith(mockForm1);
    });

    it('should not reset store when directFormMode is false', () => {
      const encounterContext = {
        taskFormName: 'Vitals',
        directFormMode: false,
      };

      render(
        <ObservationFormsPanel
          encounterSessionStartContext={encounterContext}
        />,
      );

      expect(mockReset).not.toHaveBeenCalled();
      expect(mockAddForm).not.toHaveBeenCalled();
    });

    it('should not reset store when taskFormName is not provided', () => {
      const encounterContext = {
        directFormMode: true,
      };

      render(
        <ObservationFormsPanel
          encounterSessionStartContext={encounterContext}
        />,
      );

      expect(mockReset).not.toHaveBeenCalled();
      expect(mockAddForm).not.toHaveBeenCalled();
    });

    it('should not add form when matching form is not found', () => {
      const encounterContext = {
        taskFormName: 'Non-existent Form',
        directFormMode: true,
      };

      render(
        <ObservationFormsPanel
          encounterSessionStartContext={encounterContext}
        />,
      );

      expect(mockReset).toHaveBeenCalledTimes(1);
      expect(mockAddForm).not.toHaveBeenCalled();
    });

    it('should not reset store when forms are still loading', () => {
      jest.mocked(useObservationFormsSearch).mockReturnValue({
        forms: [mockForm1, mockForm2],
        isLoading: true,
        error: null,
      });

      const encounterContext = {
        taskFormName: 'Vitals',
        directFormMode: true,
      };

      render(
        <ObservationFormsPanel
          encounterSessionStartContext={encounterContext}
        />,
      );

      expect(mockReset).not.toHaveBeenCalled();
      expect(mockAddForm).not.toHaveBeenCalled();
    });
  });

  describe('Edit mode — fetches FHIR bundle and pre-populates store', () => {
    const mockSetState = jest.fn();

    beforeEach(() => {
      jest.mocked(useObservationFormsStore).mockReturnValue({
        selectedForms: [],
        addForm: mockAddForm,
        removeForm: mockRemoveForm,
        viewingForm: null,
      } as ReturnType<typeof useObservationFormsStore>);

      // Expose setState on the mock so the component can call it
      (
        useObservationFormsStore as unknown as { setState: jest.Mock }
      ).setState = mockSetState;
    });

    it('fetches bundle and calls addForm when edit context is provided', async () => {
      const mockBundle = {
        entry: [{ resource: { resourceType: 'Observation', id: 'obs-1' } }],
      };
      jest
        .mocked(getObservationsBundleByEncounterUuid)
        .mockResolvedValue(mockBundle as never);
      jest
        .mocked(getObservationsFromFhir)
        .mockReturnValue([
          { concept: { uuid: 'concept-1' }, value: 42 },
        ] as never);

      render(
        <ObservationFormsPanel
          encounterSessionStartContext={{
            editOnly: 'observationForms',
            editFormName: 'Vitals',
            editEncounterUuid: 'encounter-uuid-1',
          }}
        />,
      );

      await waitFor(() => {
        expect(getObservationsBundleByEncounterUuid).toHaveBeenCalledWith(
          'encounter-uuid-1',
        );
      });

      await waitFor(() => {
        expect(mockAddForm).toHaveBeenCalledWith(mockForm1);
      });
    });

    it('calls addForm even when FHIR fetch fails', async () => {
      jest
        .mocked(getObservationsBundleByEncounterUuid)
        .mockRejectedValue(new Error('Network error'));

      render(
        <ObservationFormsPanel
          encounterSessionStartContext={{
            editOnly: 'observationForms',
            editFormName: 'Vitals',
            editEncounterUuid: 'encounter-uuid-1',
          }}
        />,
      );

      await waitFor(() => {
        expect(mockAddForm).toHaveBeenCalledWith(mockForm1);
      });
    });

    it('does not fetch when editFormName does not match any form', async () => {
      render(
        <ObservationFormsPanel
          encounterSessionStartContext={{
            editOnly: 'observationForms',
            editFormName: 'NonExistentForm',
            editEncounterUuid: 'encounter-uuid-1',
          }}
        />,
      );

      await waitFor(() => {
        expect(getObservationsBundleByEncounterUuid).not.toHaveBeenCalled();
        expect(mockAddForm).not.toHaveBeenCalled();
      });
    });

    it('does not fetch when form is already in selectedForms', async () => {
      jest.mocked(useObservationFormsStore).mockReturnValue({
        selectedForms: [mockForm1],
        addForm: mockAddForm,
        removeForm: mockRemoveForm,
        viewingForm: null,
      } as ReturnType<typeof useObservationFormsStore>);

      render(
        <ObservationFormsPanel
          encounterSessionStartContext={{
            editOnly: 'observationForms',
            editFormName: 'Vitals',
            editEncounterUuid: 'encounter-uuid-1',
          }}
        />,
      );

      await waitFor(() => {
        expect(getObservationsBundleByEncounterUuid).not.toHaveBeenCalled();
      });
    });

    it('skips fetch when not in edit mode', async () => {
      render(<ObservationFormsPanel />);

      await waitFor(() => {
        expect(getObservationsBundleByEncounterUuid).not.toHaveBeenCalled();
      });
    });
  });
});
