import { getValueType } from '@bahmni/services';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import {
  mockBundleWithMultipleEncounters,
  mockBundleWithMixedObservations,
  mockBundleWithOnlyFirstReferenceRange,
} from '../__mocks__/observationTestData';
import { ObsByEncounter } from '../components/ObsByEncounter';
import {
  extractObservationsFromBundle,
  groupObservationsByEncounter,
} from '../utils';

expect.extend(toHaveNoViolations);

const mockGetValueType = getValueType as jest.MockedFunction<
  typeof getValueType
>;

const mockTransformObservationToRowCell = jest.fn((obs, index) => ({
  index,
  header: obs.display,
  value: '120 mmHg',
  provider: 'Dr. Smith',
}));

jest.mock('../utils', () => ({
  ...jest.requireActual('../utils'),
  formatEncounterTitle: jest.fn(() => '21 Jan 2026, 10:30 AM'),
  transformObservationToRowCell: (obs: any, index: number) =>
    mockTransformObservationToRowCell(obs, index),
}));

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: jest.fn(() => ({
    t: (key: string, params?: any) => {
      if (key === 'OBSERVATIONS_RECORDED_BY' && params?.provider) {
        return `Recorded by ${params.provider}`;
      }
      return key;
    },
  })),
  getValueType: jest.fn(() => 'string'),
}));

describe('ObsByEncounter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetValueType.mockReturnValue('string');
  });

  it('should render encounters with observations', () => {
    const result = extractObservationsFromBundle(
      mockBundleWithMultipleEncounters,
    );
    const groupedData = groupObservationsByEncounter(result);

    render(<ObsByEncounter groupedData={groupedData} />);

    expect(screen.getByText('Temperature')).toBeInTheDocument();
    expect(screen.getByText('Blood Pressure')).toBeInTheDocument();
    expect(screen.getByText('Weight')).toBeInTheDocument();
  });

  it('should render encounters with grouped observations', () => {
    const result = extractObservationsFromBundle(
      mockBundleWithMixedObservations,
    );
    const groupedData = groupObservationsByEncounter(result);

    render(<ObsByEncounter groupedData={groupedData} />);

    expect(screen.getByText('Temperature')).toBeInTheDocument();
    expect(screen.getByText('Blood Pressure')).toBeInTheDocument();
    expect(screen.getByText('Systolic')).toBeInTheDocument();
  });

  it('should render multiple encounters', () => {
    const result = extractObservationsFromBundle(
      mockBundleWithMultipleEncounters,
    );
    const groupedData = groupObservationsByEncounter(result);

    const { container } = render(<ObsByEncounter groupedData={groupedData} />);

    expect(container.querySelector('#encounter-enc-1')).toBeInTheDocument();
    expect(container.querySelector('#encounter-enc-2')).toBeInTheDocument();
  });

  it('should render observation with provider info', () => {
    const result = extractObservationsFromBundle(
      mockBundleWithMixedObservations,
    );
    const groupedData = groupObservationsByEncounter(result);

    render(<ObsByEncounter groupedData={groupedData} />);

    expect(screen.getAllByText('Recorded by Dr. Smith').length).toBeGreaterThan(
      0,
    );
  });

  describe('Image and Video rendering', () => {
    it('should render ImageTile when observation value is an image', () => {
      const imagePath = '/documents/patient-scan.jpg';
      mockGetValueType.mockReturnValue('Image');
      mockTransformObservationToRowCell.mockReturnValueOnce({
        index: 0,
        header: 'X-Ray Image',
        value: imagePath,
        provider: 'Dr. Smith',
      });

      const result = extractObservationsFromBundle(
        mockBundleWithMixedObservations,
      );
      const groupedData = groupObservationsByEncounter(result);

      const { container } = render(
        <ObsByEncounter groupedData={groupedData} />,
      );

      const imageElement = container.querySelector('img');
      expect(imageElement).toBeInTheDocument();
      expect(imageElement?.getAttribute('src')).toContain(imagePath);
    });

    it('should render VideoTile when observation value is a video', () => {
      const videoPath = '/documents/procedure-recording.mp4';
      mockGetValueType.mockReturnValue('Video');
      mockTransformObservationToRowCell.mockReturnValueOnce({
        index: 0,
        header: 'Procedure Video',
        value: videoPath,
        provider: 'Dr. Smith',
      });

      const result = extractObservationsFromBundle(
        mockBundleWithMixedObservations,
      );
      const groupedData = groupObservationsByEncounter(result);

      const { container } = render(
        <ObsByEncounter groupedData={groupedData} />,
      );

      const videoElement = container.querySelector('video');
      expect(videoElement).toBeInTheDocument();
      const sourceElement = container.querySelector('source');
      expect(sourceElement?.getAttribute('src')).toContain(videoPath);
    });

    it('should render string value as text when not image or video', () => {
      mockGetValueType.mockReturnValue('string');
      mockTransformObservationToRowCell.mockReturnValueOnce({
        index: 0,
        header: 'Temperature',
        value: '98.6°F',
        provider: 'Dr. Smith',
      });

      const result = extractObservationsFromBundle(
        mockBundleWithMixedObservations,
      );
      const groupedData = groupObservationsByEncounter(result);

      render(<ObsByEncounter groupedData={groupedData} />);

      expect(screen.getByText('98.6°F')).toBeInTheDocument();
    });
  });

  describe('Grouped observations', () => {
    it('should render CollapsibleRowGroup for grouped observations', () => {
      const result = extractObservationsFromBundle(
        mockBundleWithMixedObservations,
      );
      const groupedData = groupObservationsByEncounter(result);

      const { container } = render(
        <ObsByEncounter groupedData={groupedData} />,
      );

      // id format: grouped-obs-{display}-{groupIndex}
      expect(
        container.querySelector('#grouped-obs-Blood\\ Pressure-0'),
      ).toBeInTheDocument();
      expect(screen.getByText('Blood Pressure')).toBeInTheDocument();
    });

    it('should render children of grouped observations', () => {
      const result = extractObservationsFromBundle(
        mockBundleWithMixedObservations,
      );
      const groupedData = groupObservationsByEncounter(result);

      render(<ObsByEncounter groupedData={groupedData} />);

      expect(screen.getByText('Systolic')).toBeInTheDocument();
    });
  });

  describe('Snapshot', () => {
    it('should match snapshot for ObsByEncounter', () => {
      const result = extractObservationsFromBundle(
        mockBundleWithMixedObservations,
      );
      const groupedData = groupObservationsByEncounter(result);

      const { container } = render(
        <ObsByEncounter groupedData={groupedData} />,
      );

      expect(container).toMatchSnapshot();
    });
  });

  it('should render abnormal-obs-{id} for abnormal observations', () => {
    const abnormalBundle = {
      ...mockBundleWithOnlyFirstReferenceRange,
      entry: [
        {
          resource: {
            resourceType: 'Encounter' as const,
            id: 'enc-abnormal',
            status: 'finished' as const,
            class: { code: 'AMB' },
            period: { start: '2026-01-20T10:00:00+00:00' },
          },
        },
        {
          ...mockBundleWithOnlyFirstReferenceRange.entry![0],
          resource: {
            ...mockBundleWithOnlyFirstReferenceRange.entry![0].resource!,
            encounter: { reference: 'Encounter/enc-abnormal' },
          },
        },
      ],
    };

    const result = extractObservationsFromBundle(abnormalBundle);
    const groupedData = groupObservationsByEncounter(result);

    render(<ObsByEncounter groupedData={groupedData} />);

    // data-testid format: {testIdPrefix}-{obsName}-{encounterIndex}-{obsIndex}
    // obsName is 'Potassium' (from display), encounterIndex is 0, obsIndex is 0
    expect(
      screen.getByTestId('abnormal-obs-Potassium-0-0'),
    ).toBeInTheDocument();
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const result = extractObservationsFromBundle(
        mockBundleWithMixedObservations,
      );
      const groupedData = groupObservationsByEncounter(result);

      const { container } = render(
        <ObsByEncounter groupedData={groupedData} />,
      );

      const results = await axe(container!);
      await expect(results).toHaveNoViolations();
    });
  });
});
