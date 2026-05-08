import { useTranslation } from '@bahmni/services';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { dispatchConsultationStart } from '../../../events/startConsultation';
import PatientHeader from '../PatientHeader';
import '@testing-library/jest-dom';

expect.extend(toHaveNoViolations);

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: jest.fn(),
}));

jest.mock('../../../events/startConsultation', () => ({
  dispatchConsultationStart: jest.fn(),
}));
// Mock the PatientDetails component – capture props for assertion
const mockPatientDetails = jest.fn(({ patient, loading, error }: any) => (
  <div
    data-testid="patient-details-mock"
    data-patient-name={patient?.fullName}
    data-loading={String(loading)}
    data-error={error?.message}
  >
    PatientDetails Mock
  </div>
));

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  PatientDetails: (...args: any[]) => mockPatientDetails(...args),
  useActivePractitioner: jest.fn(() => ({
    uuid: 'active-practitioner-uuid',
    practitioner: { uuid: 'active-practitioner-uuid' },
  })),
  usePatientUUID: jest.fn(() => 'patient-uuid'),
  useHasPrivilege: jest.fn(() => true),
}));

jest.mock('../../../hooks/useEncounterSession', () => ({
  useEncounterSession: jest.fn(() => ({
    hasActiveSession: false,
    activeEncounter: null,
    isPractitionerMatch: false,
    editActiveEncounter: false,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })),
}));

const mockedUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;

const mockDispatchConsultationStart =
  dispatchConsultationStart as jest.MockedFunction<
    typeof dispatchConsultationStart
  >;

describe('PatientHeader Component', () => {
  const defaultProps = {
    isActionAreaVisible: false,
  };

  // Helper function to render with props
  const renderComponent = (props = {}) => {
    return render(<PatientHeader {...defaultProps} {...props} />);
  };
  const mockTranslate = jest.fn((key: string) => {
    const translations: Record<string, string> = {
      CONSULTATION_ACTION_NEW: 'New Consultation',
      CONSULTATION_ACTION_EDIT: 'Edit Consultation',
      CONSULTATION_ACTION_IN_PROGRESS: 'Consultation in progress',
      PATIENT_HEADER_LABEL: 'Patient Header',
    };
    return translations[key] || key;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseTranslation.mockReturnValue({ t: mockTranslate } as any);
  });

  // Basic rendering tests
  describe('Rendering', () => {
    test('renders without crashing', () => {
      renderComponent();
      expect(screen.getByLabelText('Patient Header')).toBeInTheDocument();
    });

    test('renders Tile with correct aria-label', () => {
      renderComponent();
      const tile = screen.getByLabelText('Patient Header');
      expect(tile).toBeInTheDocument();
    });

    test('renders PatientDetails component', () => {
      renderComponent();
      const patientDetails = screen.getByTestId('patient-details-mock');
      expect(patientDetails).toBeInTheDocument();
    });
  });

  // Patient data forwarding tests
  describe('Patient data forwarding', () => {
    test('forwards patient, loading, and error props to PatientDetails', () => {
      const patient = { fullName: 'Jane Doe' } as any;
      const error = new Error('fetch failed');
      renderComponent({ patient, loading: true, error });

      const patientDetails = screen.getByTestId('patient-details-mock');
      expect(patientDetails).toHaveAttribute('data-patient-name', 'Jane Doe');
      expect(patientDetails).toHaveAttribute('data-loading', 'true');
      expect(patientDetails).toHaveAttribute('data-error', 'fetch failed');
    });

    test('renders PatientDetails without patient props when none provided', () => {
      renderComponent();

      const patientDetails = screen.getByTestId('patient-details-mock');
      expect(patientDetails).not.toHaveAttribute('data-patient-name');
    });
  });

  // Button tests
  describe('Button functionality', () => {
    test('renders button with "New Consultation" text and dispatches event on click', () => {
      renderComponent({ isActionAreaVisible: false });
      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockDispatchConsultationStart).toHaveBeenCalled();
      expect(button).toHaveTextContent('New Consultation');
    });

    test('renders disabled button with "in progress" text when action area is visible', () => {
      renderComponent({ isActionAreaVisible: true });
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('disabled');
      expect(button).toHaveTextContent('Consultation in progress');
    });

    test('does not dispatch event when button is disabled', () => {
      renderComponent({ isActionAreaVisible: true });
      const button = screen.getByRole('button');

      fireEvent.click(button);

      expect(mockDispatchConsultationStart).not.toHaveBeenCalled();
    });
  });

  // Accessibility tests
  describe('Accessibility', () => {
    test('has no accessibility violations', async () => {
      const { container } = renderComponent();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
