import { getValueType } from '@bahmni/services';
import { render, screen } from '@testing-library/react';
import {
  renderObservation,
  renderGroupedObservation,
} from '../components/renderUtils';

import { ExtractedObservation, GroupedObservation } from '../models';

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
  transformObservationToRowCell: (obs: any, index: number) =>
    mockTransformObservationToRowCell(obs, index),
}));

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getValueType: jest.fn(),
}));

const mockT = jest.fn((key: string, params?: any) => {
  if (key === 'OBSERVATIONS_RECORDED_BY' && params?.provider) {
    return `Recorded by ${params.provider}`;
  }
  return key;
});

describe('renderUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('renderObservation', () => {
    it('should render a RowCell with correct props', () => {
      mockGetValueType.mockReturnValue('string');
      const observation: ExtractedObservation = {
        id: 'obs-1',
        display: 'Systolic Blood Pressure',
        observationValue: {
          value: 120,
          unit: 'mmHg',
          type: 'quantity',
        },
      };

      const TestComponent = () => renderObservation(observation, 0, mockT);
      const { container } = render(<TestComponent />);

      expect(container.querySelector('#obs-obs-1')).toBeInTheDocument();
      expect(screen.getByText('Systolic Blood Pressure')).toBeInTheDocument();
      expect(screen.getByText('120 mmHg')).toBeInTheDocument();
    });

    it('should render observation without provider info', () => {
      mockGetValueType.mockReturnValue('string');
      const observation: ExtractedObservation = {
        id: 'obs-2',
        display: 'Temperature',
        observationValue: {
          value: 98.6,
          unit: '°F',
          type: 'quantity',
        },
      };

      const TestComponent = () => renderObservation(observation, 1, mockT);
      const { container } = render(<TestComponent />);

      expect(container.querySelector('#obs-obs-2')).toBeInTheDocument();
    });

    it('should render ImageTile when observation value is an image', () => {
      mockGetValueType.mockReturnValue('Image');
      const imagePath = '/documents/patient-scan.jpg';
      mockTransformObservationToRowCell.mockReturnValueOnce({
        index: 0,
        header: 'X-Ray Image',
        value: imagePath,
        provider: 'Dr. Smith',
      });

      const observation: ExtractedObservation = {
        id: 'obs-3',
        display: 'X-Ray Image',
        observationValue: {
          value: imagePath,
          unit: '',
          type: 'string',
        },
      };

      const TestComponent = () => renderObservation(observation, 0, mockT);
      const { container } = render(<TestComponent />);

      const imageElement = container.querySelector('img');
      expect(imageElement).toBeInTheDocument();
      expect(imageElement?.getAttribute('src')).toContain(imagePath);
    });

    it('should render VideoTile when observation value is a video', () => {
      mockGetValueType.mockReturnValue('Video');
      const videoPath = '/documents/procedure-recording.mp4';
      mockTransformObservationToRowCell.mockReturnValueOnce({
        index: 0,
        header: 'Procedure Video',
        value: videoPath,
        provider: 'Dr. Smith',
      });

      const observation: ExtractedObservation = {
        id: 'obs-4',
        display: 'Procedure Video',
        observationValue: {
          value: videoPath,
          unit: '',
          type: 'string',
        },
      };

      const TestComponent = () => renderObservation(observation, 0, mockT);
      const { container } = render(<TestComponent />);

      const videoElement = container.querySelector('video');
      expect(videoElement).toBeInTheDocument();
      const sourceElement = container.querySelector('source');
      expect(sourceElement?.getAttribute('src')).toContain(videoPath);
    });
  });

  describe('renderGroupedObservation', () => {
    it('should render a CollapsibleRowGroup with children', () => {
      const groupedObs: GroupedObservation = {
        id: 'grouped-1',
        display: 'Blood Pressure',
        children: [
          {
            id: 'child-1',
            display: 'Systolic',
            observationValue: {
              value: 120,
              unit: 'mmHg',
              type: 'quantity',
            },
          },
          {
            id: 'child-2',
            display: 'Diastolic',
            observationValue: {
              value: 80,
              unit: 'mmHg',
              type: 'quantity',
            },
          },
        ],
      };

      const TestComponent = () => renderGroupedObservation(groupedObs, mockT);
      const { container } = render(<TestComponent />);

      expect(
        container.querySelector('#grouped-obs-grouped-1'),
      ).toBeInTheDocument();
      expect(screen.getByText('Blood Pressure')).toBeInTheDocument();
      expect(screen.getByText('Systolic')).toBeInTheDocument();
      expect(screen.getByText('Diastolic')).toBeInTheDocument();
    });

    it('should render grouped observation with single child', () => {
      const groupedObs: GroupedObservation = {
        id: 'grouped-2',
        display: 'Lab Results',
        children: [
          {
            id: 'child-1',
            display: 'Glucose',
            observationValue: {
              value: 95,
              unit: 'mg/dL',
              type: 'quantity',
            },
          },
        ],
      };

      const TestComponent = () => renderGroupedObservation(groupedObs, mockT);
      const { container } = render(<TestComponent />);

      expect(
        container.querySelector('#grouped-obs-grouped-2'),
      ).toBeInTheDocument();
      expect(screen.getByText('Lab Results')).toBeInTheDocument();
      expect(screen.getByText('Glucose')).toBeInTheDocument();
    });
  });
});
