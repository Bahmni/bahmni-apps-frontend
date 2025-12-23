import { FormattedObservation } from '@bahmni/services';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ObservationsWidget from '../ObservationsWidget';
import { useObservations } from '../useObservations';
import * as utils from '../utils';

jest.mock('../useObservations');
jest.mock('../utils', () => ({
  ...jest.requireActual('../utils'),
  isImageValue: jest.fn(),
  isVideoValue: jest.fn(),
  getMediaUrl: jest.fn(),
}));

const mockUseObservations = useObservations as jest.MockedFunction<
  typeof useObservations
>;

describe('ObservationsWidget', () => {
  const mockConfig = {
    conceptCodes: ['concept-1'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (utils.isImageValue as jest.Mock).mockReturnValue(false);
    (utils.isVideoValue as jest.Mock).mockReturnValue(false);
    (utils.getMediaUrl as jest.Mock).mockImplementation(
      (url) => `/media/${url}`,
    );
  });

  it('should render loading state', () => {
    mockUseObservations.mockReturnValue({
      observations: [],
      loading: true,
      error: null,
    });

    render(<ObservationsWidget config={mockConfig} />);

    expect(screen.getByTestId('observations-widget')).toBeInTheDocument();
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

    expect(screen.getByTestId('observations-widget')).toBeInTheDocument();
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

    expect(
      screen.getByText(/ALLERGY_LIST_RECORDED_BY Dr. Smith/),
    ).toBeInTheDocument();
  });

  it('should render image thumbnail for image values', () => {
    (utils.isImageValue as jest.Mock).mockReturnValue(true);
    (utils.getMediaUrl as jest.Mock).mockReturnValue('/media/xray.png');

    const mockObservations: FormattedObservation[] = [
      {
        id: 'obs-1',
        conceptName: 'X-Ray',
        value: 'xray.png',
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

    const image = screen.getByRole('img', { name: 'X-Ray' });
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/media/xray.png');
  });

  it('should render video thumbnail for video values', () => {
    (utils.isVideoValue as jest.Mock).mockReturnValue(true);
    (utils.getMediaUrl as jest.Mock).mockReturnValue('/media/video.mp4');

    const mockObservations: FormattedObservation[] = [
      {
        id: 'obs-1',
        conceptName: 'Video Recording',
        value: 'video.mp4',
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

    const video = screen
      .getByText('Video Recording')
      .closest('tr')
      ?.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('src', '/media/video.mp4');
  });

  it('should handle image load errors gracefully', () => {
    (utils.isImageValue as jest.Mock).mockReturnValue(true);

    const mockObservations: FormattedObservation[] = [
      {
        id: 'obs-1',
        conceptName: 'X-Ray',
        value: 'broken.png',
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

    const image = screen.getByRole('img', { name: 'X-Ray' });
    fireEvent.error(image);

    expect(image.style.display).toBe('none');
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

    expect(screen.getByTestId('observations-widget')).toBeInTheDocument();
  });

  it('should handle undefined config', () => {
    mockUseObservations.mockReturnValue({
      observations: [],
      loading: false,
      error: null,
    });

    render(<ObservationsWidget config={undefined} />);

    expect(screen.getByTestId('observations-widget')).toBeInTheDocument();
  });
});
