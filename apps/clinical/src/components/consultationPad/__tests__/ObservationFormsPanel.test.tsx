import type { ObservationForm } from '@bahmni/services';
import { useActivePractitioner } from '@bahmni/widgets';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useClinicalAppData } from '../../../hooks/useClinicalAppData';
import useObservationFormsSearch from '../../../hooks/useObservationFormsSearch';
import { usePinnedObservationForms } from '../../../hooks/usePinnedObservationForms';
import { useObservationFormsStore } from '../../../stores/observationFormsStore';
import ObservationForms from '../../forms/observations/ObservationForms';
import ObservationFormsPanel from '../components/ObservationFormsPanel';

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

jest.mock('@bahmni/widgets', () => ({
  useActivePractitioner: jest.fn(),
}));

jest.mock('../../../hooks/useClinicalAppData', () => ({
  useClinicalAppData: jest.fn(),
}));

jest.mock('../../../hooks/useObservationFormsSearch', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../../../hooks/usePinnedObservationForms', () => ({
  usePinnedObservationForms: jest.fn(),
}));

jest.mock('../../../stores/observationFormsStore', () => ({
  useObservationFormsStore: jest.fn(),
}));

jest.mock('../../forms/observations/ObservationForms', () => ({
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
  });

  jest.mocked(useObservationFormsStore).mockReturnValue({
    selectedForms: [mockForm2],
    addForm: mockAddForm,
    removeForm: mockRemoveForm,
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

  it('matches snapshot', () => {
    const { container } = render(<ObservationFormsPanel />);
    expect(container).toMatchSnapshot();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<ObservationFormsPanel />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
