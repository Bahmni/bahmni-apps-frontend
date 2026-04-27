import { fetchQualityAssessment } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { ImagingStudy, Observation } from 'fhir/r4';
import { QualityAssessment } from '../QualityAssessment';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  fetchQualityAssessment: jest.fn(),
}));

describe('QualityAssessment', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  describe('Loading and Error States', () => {
    it('should render loading state when data is being fetched', () => {
      (fetchQualityAssessment as jest.Mock).mockImplementation(
        () => new Promise(() => {}),
      );

      renderWithQueryClient(<QualityAssessment imagingStudyId="study-1" />);

      expect(
        screen.getByTestId('observations-table-skeleton'),
      ).toBeInTheDocument();
    });

    it('should render error state when API call fails', async () => {
      (fetchQualityAssessment as jest.Mock).mockRejectedValue(
        new Error('Failed to fetch quality assessment'),
      );

      renderWithQueryClient(<QualityAssessment imagingStudyId="study-1" />);

      expect(
        await screen.findByText(/Failed to fetch quality assessment/i),
      ).toBeInTheDocument();
    });

    it('should render empty state when imaging study has no contained observations', async () => {
      const mockImagingStudy: ImagingStudy = {
        resourceType: 'ImagingStudy',
        id: 'study-1',
        status: 'available',
        subject: { reference: 'Patient/123' },
        contained: [],
      };

      (fetchQualityAssessment as jest.Mock).mockResolvedValue(mockImagingStudy);

      renderWithQueryClient(<QualityAssessment imagingStudyId="study-1" />);

      expect(
        await screen.findByText('NO_QUALITY_ASSESSMENT_DATA'),
      ).toBeInTheDocument();
    });
  });

  describe('Data Fetching and Display', () => {
    it('should fetch quality assessment with correct imagingStudyId', async () => {
      const mockObservation: Observation = {
        resourceType: 'Observation',
        id: 'obs-1',
        status: 'final',
        code: { text: 'Image Quality' },
        valueString: 'Good',
      };

      const mockImagingStudy: ImagingStudy = {
        resourceType: 'ImagingStudy',
        id: 'study-123',
        status: 'available',
        subject: { reference: 'Patient/123' },
        contained: [mockObservation],
      };

      (fetchQualityAssessment as jest.Mock).mockResolvedValue(mockImagingStudy);

      renderWithQueryClient(<QualityAssessment imagingStudyId="study-123" />);

      await screen.findByTestId('observations-renderer-test-id');

      expect(fetchQualityAssessment).toHaveBeenCalledWith('study-123');
      expect(fetchQualityAssessment).toHaveBeenCalledTimes(1);
    });

    it('should pass observations to ObservationsRenderer', async () => {
      const mockObservation: Observation = {
        resourceType: 'Observation',
        id: 'obs-1',
        status: 'final',
        code: { text: 'Contrast Quality' },
        valueQuantity: { value: 8, unit: 'score' },
      };

      const mockImagingStudy: ImagingStudy = {
        resourceType: 'ImagingStudy',
        id: 'study-1',
        status: 'available',
        subject: { reference: 'Patient/123' },
        contained: [mockObservation],
      };

      (fetchQualityAssessment as jest.Mock).mockResolvedValue(mockImagingStudy);

      renderWithQueryClient(<QualityAssessment imagingStudyId="study-1" />);

      expect(
        await screen.findByTestId('observations-renderer-test-id'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('observation-item-Contrast Quality-0'),
      ).toBeInTheDocument();
    });

    it('should filter and pass only Observation resources from contained', async () => {
      const mockObservation: Observation = {
        resourceType: 'Observation',
        id: 'obs-1',
        status: 'final',
        code: { text: 'Image Quality' },
        valueString: 'Excellent',
      };

      const mockProcedure = {
        resourceType: 'Procedure',
        id: 'proc-1',
        status: 'completed',
        code: { text: 'X-Ray' },
      };

      const mockImagingStudy: ImagingStudy = {
        resourceType: 'ImagingStudy',
        id: 'study-1',
        status: 'available',
        subject: { reference: 'Patient/123' },
        contained: [mockProcedure, mockObservation] as any,
      };

      (fetchQualityAssessment as jest.Mock).mockResolvedValue(mockImagingStudy);

      renderWithQueryClient(<QualityAssessment imagingStudyId="study-1" />);

      await screen.findByTestId('observations-renderer-test-id');

      // Should only render the observation, not the procedure
      expect(
        screen.getByTestId('observation-item-Image Quality-0'),
      ).toBeInTheDocument();
      expect(screen.queryByText('X-Ray')).not.toBeInTheDocument();
    });

    it('should handle multiple observations', async () => {
      const observation1: Observation = {
        resourceType: 'Observation',
        id: 'obs-1',
        status: 'final',
        code: {
          text: 'Positioning',
          coding: [{ code: 'positioning' }],
        },
        valueString: 'Correct',
      };

      const observation2: Observation = {
        resourceType: 'Observation',
        id: 'obs-2',
        status: 'final',
        code: {
          text: 'Exposure',
          coding: [{ code: 'exposure' }],
        },
        valueString: 'Adequate',
      };

      const mockImagingStudy: ImagingStudy = {
        resourceType: 'ImagingStudy',
        id: 'study-1',
        status: 'available',
        subject: { reference: 'Patient/123' },
        contained: [observation1, observation2],
      };

      (fetchQualityAssessment as jest.Mock).mockResolvedValue(mockImagingStudy);

      renderWithQueryClient(<QualityAssessment imagingStudyId="study-1" />);

      await screen.findByTestId('observations-renderer-test-id');

      expect(
        screen.getByTestId('observation-item-Positioning-0'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('observation-item-Exposure-1'),
      ).toBeInTheDocument();
    });
  });

  describe('Query Integration', () => {
    it('should not fetch when imagingStudyId is null', () => {
      renderWithQueryClient(<QualityAssessment imagingStudyId={null} />);

      expect(fetchQualityAssessment).not.toHaveBeenCalled();
    });

    it('should not fetch when imagingStudyId is empty string', () => {
      renderWithQueryClient(<QualityAssessment imagingStudyId="" />);

      expect(fetchQualityAssessment).not.toHaveBeenCalled();
    });

    it('should use query key with imagingStudyId', async () => {
      const mockObservation: Observation = {
        resourceType: 'Observation',
        id: 'obs-1',
        status: 'final',
        code: { text: 'Quality Score' },
        valueString: 'High',
      };

      const mockImagingStudy: ImagingStudy = {
        resourceType: 'ImagingStudy',
        id: 'study-1',
        status: 'available',
        subject: { reference: 'Patient/123' },
        contained: [mockObservation],
      };

      (fetchQualityAssessment as jest.Mock).mockResolvedValue(mockImagingStudy);

      renderWithQueryClient(<QualityAssessment imagingStudyId="study-1" />);

      await screen.findByTestId('observations-renderer-test-id');

      expect(fetchQualityAssessment).toHaveBeenCalledTimes(1);
      expect(fetchQualityAssessment).toHaveBeenCalledWith('study-1');
    });

    it('should call onDateLoaded with observation date when data is loaded', async () => {
      const mockOnDateLoaded = jest.fn();
      const mockObservation: Observation = {
        resourceType: 'Observation',
        id: 'obs-1',
        status: 'final',
        code: { text: 'Quality Score' },
        valueString: 'High',
        effectiveDateTime: '2026-04-20T10:50:44+00:00',
      };

      const mockImagingStudy: ImagingStudy = {
        resourceType: 'ImagingStudy',
        id: 'study-1',
        status: 'available',
        subject: { reference: 'Patient/123' },
        contained: [mockObservation],
      };

      (fetchQualityAssessment as jest.Mock).mockResolvedValue(mockImagingStudy);

      renderWithQueryClient(
        <QualityAssessment
          imagingStudyId="study-1"
          onDateLoaded={mockOnDateLoaded}
        />,
      );

      await screen.findByTestId('observations-renderer-test-id');

      expect(mockOnDateLoaded).toHaveBeenCalledWith(
        '2026-04-20T10:50:44+00:00',
      );
    });

    it('should call onDateLoaded with issued date if effectiveDateTime is not available', async () => {
      const mockOnDateLoaded = jest.fn();
      const mockObservation: Observation = {
        resourceType: 'Observation',
        id: 'obs-1',
        status: 'final',
        code: { text: 'Quality Score' },
        valueString: 'High',
        issued: '2026-04-20T10:50:48.000+00:00',
      };

      const mockImagingStudy: ImagingStudy = {
        resourceType: 'ImagingStudy',
        id: 'study-1',
        status: 'available',
        subject: { reference: 'Patient/123' },
        contained: [mockObservation],
      };

      (fetchQualityAssessment as jest.Mock).mockResolvedValue(mockImagingStudy);

      renderWithQueryClient(
        <QualityAssessment
          imagingStudyId="study-1"
          onDateLoaded={mockOnDateLoaded}
        />,
      );

      await screen.findByTestId('observations-renderer-test-id');

      expect(mockOnDateLoaded).toHaveBeenCalledWith(
        '2026-04-20T10:50:48.000+00:00',
      );
    });
  });
});
