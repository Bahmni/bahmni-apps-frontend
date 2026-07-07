import type { ObservationForm } from '@bahmni/services';
import { useActivePractitioner } from '@bahmni/widgets';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useClinicalAppData } from '../../../../hooks/useClinicalAppData';
import useObservationFormsSearch from '../../../../hooks/useObservationFormsSearch';
import { usePinnedObservationForms } from '../../../../hooks/usePinnedObservationForms';
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

jest.mock('../../../../stores/observationFormsStore', () => ({
  useObservationFormsStore: jest.fn(),
}));

jest.mock('../ObservationForms', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="observation-forms" />),
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
});
