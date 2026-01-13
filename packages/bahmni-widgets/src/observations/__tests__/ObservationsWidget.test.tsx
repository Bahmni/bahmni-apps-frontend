import { FormattedObservation } from '@bahmni/services';
import { render, screen } from '@testing-library/react';
import ObservationsWidget from '../ObservationsWidget';
import { useObservations } from '../useObservations';

jest.mock('../useObservations');

const mockUseObservations = useObservations as jest.MockedFunction<
  typeof useObservations
>;

describe('ObservationsWidget', () => {
  const mockConfig = {
    conceptCodes: ['concept-1'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state', () => {
    mockUseObservations.mockReturnValue({
      observations: [],
      loading: true,
      error: null,
    });

    render(<ObservationsWidget config={mockConfig} />);

    expect(
      screen.getByTestId('observations-widget-loading'),
    ).toBeInTheDocument();
    expect(screen.getByText('OBSERVATIONS_LOADING')).toBeInTheDocument();
  });

  it('should render error message when error occurs', () => {
    const mockError = new Error('Failed to fetch');
    mockUseObservations.mockReturnValue({
      observations: [],
      loading: false,
      error: mockError,
    });

    render(<ObservationsWidget config={mockConfig} />);

    expect(screen.getByTestId('observations-widget-error')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
  });

  it('should render empty state when no observations', () => {
    mockUseObservations.mockReturnValue({
      observations: [],
      loading: false,
      error: null,
    });

    render(<ObservationsWidget config={mockConfig} />);

    expect(screen.getByTestId('observations-widget-empty')).toBeInTheDocument();
    expect(screen.getByText('NO_OBSERVATIONS')).toBeInTheDocument();
  });

  it('should render observations in table format', () => {
    const mockObservations: FormattedObservation[] = [
      {
        id: 'obs-1',
        conceptName: 'Temperature',
        value: '98.6',
        date: '01 Jan 2024, 10:00 AM',
        isParent: false,
        children: [],
      },
    ];

    mockUseObservations.mockReturnValue({
      observations: mockObservations,
      loading: false,
      error: null,
    });

    render(<ObservationsWidget config={mockConfig} />);

    expect(screen.getByText('Temperature')).toBeInTheDocument();
    expect(screen.getByText('98.6')).toBeInTheDocument();
  });

  it('should group observations by date', () => {
    const mockObservations: FormattedObservation[] = [
      {
        id: 'obs-1',
        conceptName: 'Temperature',
        value: '98.6',
        date: '01 Jan 2024',
        isParent: false,
        children: [],
      },
      {
        id: 'obs-2',
        conceptName: 'Blood Pressure',
        value: '120/80',
        date: '01 Jan 2024',
        isParent: false,
        children: [],
      },
    ];

    mockUseObservations.mockReturnValue({
      observations: mockObservations,
      loading: false,
      error: null,
    });

    render(<ObservationsWidget config={mockConfig} />);

    expect(screen.getByText('01 Jan 2024')).toBeInTheDocument();
    expect(screen.getByText('Temperature')).toBeInTheDocument();
    expect(screen.getByText('Blood Pressure')).toBeInTheDocument();
  });

  it('should render child observations with indentation', () => {
    const mockObservations: FormattedObservation[] = [
      {
        id: 'parent-1',
        conceptName: 'Vital Signs',
        value: '',
        date: '01 Jan 2024',
        isParent: true,
        children: [
          {
            id: 'child-1',
            conceptName: 'Heart Rate',
            value: '72',
            date: '01 Jan 2024',
            isParent: false,
            children: [],
          },
        ],
      },
    ];

    mockUseObservations.mockReturnValue({
      observations: mockObservations,
      loading: false,
      error: null,
    });

    render(<ObservationsWidget config={mockConfig} />);

    expect(screen.getByText('Vital Signs')).toBeInTheDocument();
    expect(screen.getByText('Heart Rate')).toBeInTheDocument();
  });

  it('should display "Recorded By" information', () => {
    const mockObservations: FormattedObservation[] = [
      {
        id: 'obs-1',
        conceptName: 'Temperature',
        value: '98.6',
        date: '01 Jan 2024',
        isParent: false,
        recordedBy: 'Dr. Smith',
        children: [],
      },
    ];

    mockUseObservations.mockReturnValue({
      observations: mockObservations,
      loading: false,
      error: null,
    });

    render(<ObservationsWidget config={mockConfig} />);

    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
  });

  it('should render text values normally', () => {
    const mockObservations: FormattedObservation[] = [
      {
        id: 'obs-1',
        conceptName: 'Notes',
        value: 'Patient doing well',
        date: '01 Jan 2024',
        isParent: false,
        children: [],
      },
    ];

    mockUseObservations.mockReturnValue({
      observations: mockObservations,
      loading: false,
      error: null,
    });

    render(<ObservationsWidget config={mockConfig} />);

    expect(screen.getByText('Patient doing well')).toBeInTheDocument();
  });

  it('should handle empty config', () => {
    mockUseObservations.mockReturnValue({
      observations: [],
      loading: false,
      error: null,
    });

    render(<ObservationsWidget config={{}} />);

    expect(screen.getByTestId('observations-widget-empty')).toBeInTheDocument();
  });

  it('should handle undefined config', () => {
    mockUseObservations.mockReturnValue({
      observations: [],
      loading: false,
      error: null,
    });

    render(<ObservationsWidget config={undefined} />);

    expect(screen.getByTestId('observations-widget-empty')).toBeInTheDocument();
  });
});
