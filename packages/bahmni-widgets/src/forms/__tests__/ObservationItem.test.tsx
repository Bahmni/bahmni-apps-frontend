import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { ExtractedObservation } from '../../observations/models';
import { ObservationItem } from '../ObservationItem';

expect.extend(toHaveNoViolations);

// Mock the design system components
jest.mock('@bahmni/design-system', () => ({
  ImageTile: ({ imageSrc, alt, id }: any) => (
    <div
      data-testid="image-tile"
      data-src={imageSrc}
      data-alt={alt}
      data-id={id}
    >
      Image: {imageSrc}
    </div>
  ),
  VideoTile: ({ videoSrc, id }: any) => (
    <div data-testid="video-tile" data-src={videoSrc} data-id={id}>
      Video: {videoSrc}
    </div>
  ),
}));

// Mock the services
jest.mock('@bahmni/services', () => ({
  getValueType: (value: string) => {
    if (!value) return 'string';
    const lower = value.toLowerCase();
    if (
      lower.endsWith('.jpg') ||
      lower.endsWith('.png') ||
      lower.endsWith('.jpeg')
    ) {
      return 'Image';
    }
    if (
      lower.endsWith('.mp4') ||
      lower.endsWith('.avi') ||
      lower.endsWith('.mov')
    ) {
      return 'Video';
    }
    return 'string';
  },
}));

describe('ObservationItem', () => {
  const mockObservation: ExtractedObservation = {
    id: 'hr-uuid',
    display: 'HR',
    observationValue: {
      value: 75,
      type: 'quantity',
    },
  };

  describe('Range Display', () => {
    it('should display range when both low and high are present', () => {
      const observation: ExtractedObservation = {
        ...mockObservation,
        observationValue: {
          value: 75,
          type: 'quantity',
          unit: 'beats/min',
          referenceRange: {
            low: { value: 60 },
            high: { value: 100 },
          },
        },
      };

      render(<ObservationItem observation={observation} index={0} />);

      expect(screen.getByText(/HR/)).toBeInTheDocument();
      expect(screen.getByText(/\(60 - 100\)/)).toBeInTheDocument();
      expect(screen.getByText(/75 beats\/min/)).toBeInTheDocument();
    });

    it('should display >low when only low is present', () => {
      const observation: ExtractedObservation = {
        id: 'spo2-uuid',
        display: 'SpO2',
        observationValue: {
          value: 96,
          type: 'quantity',
          unit: '%',
          referenceRange: {
            low: { value: 95 },
          },
        },
      };

      render(<ObservationItem observation={observation} index={0} />);

      expect(screen.getByText(/SpO2/)).toBeInTheDocument();
      expect(screen.getByText(/\(>95\)/)).toBeInTheDocument();
      expect(screen.getByText(/96 %/)).toBeInTheDocument();
    });

    it('should display <high when only high is present', () => {
      const observation: ExtractedObservation = {
        id: 'bs-uuid',
        display: 'Blood Sugar',
        observationValue: {
          value: 85,
          type: 'quantity',
          unit: 'mg/dL',
          referenceRange: {
            high: { value: 100 },
          },
        },
      };

      render(<ObservationItem observation={observation} index={0} />);

      expect(screen.getByText(/Blood Sugar/)).toBeInTheDocument();
      expect(screen.getByText(/\(<100\)/)).toBeInTheDocument();
      expect(screen.getByText(/85 mg\/dL/)).toBeInTheDocument();
    });

    it('should not display range when both low and high are null', () => {
      const observation: ExtractedObservation = {
        ...mockObservation,
        observationValue: {
          value: 75,
          type: 'quantity',
          unit: 'beats/min',
        },
      };

      render(<ObservationItem observation={observation} index={0} />);

      expect(screen.getByText(/HR/)).toBeInTheDocument();
      expect(screen.queryByText(/\(/)).not.toBeInTheDocument();
      expect(screen.getByText(/75 beats\/min/)).toBeInTheDocument();
    });
  });

  describe('Units Display', () => {
    it('should display units when present', () => {
      const observation: ExtractedObservation = {
        ...mockObservation,
        observationValue: {
          value: 75,
          type: 'quantity',
          unit: 'beats/min',
        },
      };

      render(<ObservationItem observation={observation} index={0} />);

      expect(screen.getByText(/75 beats\/min/)).toBeInTheDocument();
    });

    it('should not display units when not present', () => {
      const observation: ExtractedObservation = {
        ...mockObservation,
        observationValue: {
          value: 75,
          type: 'quantity',
        },
      };

      render(<ObservationItem observation={observation} index={0} />);

      expect(screen.getByText('75')).toBeInTheDocument();
      expect(screen.queryByText(/beats\/min/)).not.toBeInTheDocument();
    });
  });

  describe('Abnormal Value Highlighting', () => {
    it('should apply abnormal styling when interpretation is ABNORMAL', () => {
      const observation: ExtractedObservation = {
        ...mockObservation,
        observationValue: {
          value: 75,
          type: 'quantity',
          unit: 'beats/min',
          referenceRange: {
            low: { value: 60 },
            high: { value: 100 },
          },
          isAbnormal: true,
        },
      };

      render(<ObservationItem observation={observation} index={0} />);

      const valueElement = screen.getByText(/75 beats\/min/);
      expect(valueElement).toHaveClass('abnormalValue');

      const labelElement = screen.getByText(/HR/);
      expect(labelElement).toHaveClass('abnormalValue');
    });

    it('should not apply abnormal styling when interpretation is not ABNORMAL', () => {
      const observation: ExtractedObservation = {
        ...mockObservation,
        observationValue: {
          value: 75,
          type: 'quantity',
          unit: 'beats/min',
          isAbnormal: false,
        },
      };

      render(<ObservationItem observation={observation} index={0} />);

      const valueElement = screen.getByText(/75 beats\/min/);
      expect(valueElement).not.toHaveClass('abnormalValue');
    });
  });

  describe('Group Members', () => {
    it('should render group members recursively', () => {
      const observation: ExtractedObservation = {
        id: 'vitals-uuid',
        display: 'Vitals',
        members: [
          {
            id: 'hr-uuid',
            display: 'HR',
            observationValue: {
              value: 75,
              type: 'quantity',
              unit: 'beats/min',
              referenceRange: {
                low: { value: 60 },
                high: { value: 100 },
              },
            },
          },
          {
            id: 'spo2-uuid',
            display: 'SpO2',
            observationValue: {
              value: 96,
              type: 'quantity',
              unit: '%',
              referenceRange: {
                low: { value: 95 },
              },
            },
          },
        ],
      };

      render(<ObservationItem observation={observation} index={0} />);

      expect(screen.getByText('Vitals')).toBeInTheDocument();
      expect(screen.getByText(/HR/)).toBeInTheDocument();
      expect(screen.getByText(/\(60 - 100\)/)).toBeInTheDocument();
      expect(screen.getByText(/75 beats\/min/)).toBeInTheDocument();
      expect(screen.getByText(/SpO2/)).toBeInTheDocument();
      expect(screen.getByText(/\(>95\)/)).toBeInTheDocument();
      expect(screen.getByText(/96 %/)).toBeInTheDocument();
    });

    it('should apply abnormal styling to group members', () => {
      const observation: ExtractedObservation = {
        id: 'vitals-uuid',
        display: 'Vitals',
        members: [
          {
            id: 'hr-uuid',
            display: 'HR',
            observationValue: {
              value: 120,
              type: 'quantity',
              unit: 'beats/min',
              referenceRange: {
                low: { value: 60 },
                high: { value: 100 },
              },
              isAbnormal: true,
            },
          },
        ],
      };

      render(<ObservationItem observation={observation} index={0} />);

      const valueElement = screen.getByText(/120 beats\/min/);
      expect(valueElement).toHaveClass('abnormalValue');
    });
  });

  describe('Comment Section', () => {
    it('should display comment when present', () => {
      const observation: ExtractedObservation = {
        ...mockObservation,
      };

      render(
        <ObservationItem
          observation={observation}
          index={0}
          comment="Patient was resting"
        />,
      );

      expect(screen.getByText('Patient was resting')).toBeInTheDocument();
    });

    it('should display comment with provider name', () => {
      const observation: ExtractedObservation = {
        ...mockObservation,
        encounter: {
          id: 'enc-1',
          type: 'visit',
          date: '2024-01-01',
          provider: 'Dr. Smith',
        },
      };

      render(
        <ObservationItem
          observation={observation}
          index={0}
          comment="Patient was resting"
        />,
      );

      expect(
        screen.getByText(/Patient was resting - by Dr. Smith/),
      ).toBeInTheDocument();
    });

    it('should not display comment section when comment is not present', () => {
      const observation: ExtractedObservation = {
        ...mockObservation,
      };

      render(<ObservationItem observation={observation} index={0} />);

      expect(screen.queryByText(/Patient was resting/)).not.toBeInTheDocument();
    });
  });

  describe('Media Rendering', () => {
    it('should render ImageTile for image URLs in top-level observations', () => {
      const observation: ExtractedObservation = {
        id: 'xray-uuid',
        display: 'X-Ray',
        observationValue: {
          value: 'http://example.com/image.jpg',
          type: 'string',
        },
      };

      render(<ObservationItem observation={observation} index={0} />);

      const imageTile = screen.getByTestId('image-tile');
      expect(imageTile).toBeInTheDocument();
      expect(imageTile).toHaveAttribute(
        'data-src',
        'http://example.com/image.jpg',
      );
      expect(
        screen.getByText(/Image: http:\/\/example.com\/image.jpg/),
      ).toBeInTheDocument();
    });

    it('should render VideoTile for video URLs in top-level observations', () => {
      const observation: ExtractedObservation = {
        id: 'video-uuid',
        display: 'Procedure Video',
        observationValue: {
          value: 'http://example.com/video.mp4',
          type: 'string',
        },
      };

      render(<ObservationItem observation={observation} index={0} />);

      const videoTile = screen.getByTestId('video-tile');
      expect(videoTile).toBeInTheDocument();
      expect(videoTile).toHaveAttribute(
        'data-src',
        'http://example.com/video.mp4',
      );
      expect(
        screen.getByText(/Video: http:\/\/example.com\/video.mp4/),
      ).toBeInTheDocument();
    });

    it('should render plain text for non-media values', () => {
      const observation: ExtractedObservation = {
        id: 'notes-uuid',
        display: 'Clinical Notes',
        observationValue: {
          value: 'Normal findings',
          type: 'string',
        },
      };

      render(<ObservationItem observation={observation} index={0} />);

      expect(screen.getByText('Normal findings')).toBeInTheDocument();
      expect(screen.queryByTestId('image-tile')).not.toBeInTheDocument();
      expect(screen.queryByTestId('video-tile')).not.toBeInTheDocument();
    });

    it('should render ImageTile for image URLs in group members', () => {
      const observation: ExtractedObservation = {
        id: 'images-uuid',
        display: 'Medical Images',
        members: [
          {
            id: 'xray-uuid',
            display: 'Chest X-Ray',
            observationValue: {
              value: 'http://example.com/xray.png',
              type: 'string',
            },
          },
        ],
      };

      render(<ObservationItem observation={observation} index={0} />);

      const imageTile = screen.getByTestId('image-tile');
      expect(imageTile).toBeInTheDocument();
      expect(imageTile).toHaveAttribute(
        'data-src',
        'http://example.com/xray.png',
      );
    });

    it('should render VideoTile for video URLs in group members', () => {
      const observation: ExtractedObservation = {
        id: 'videos-uuid',
        display: 'Procedure Videos',
        members: [
          {
            id: 'surgery-uuid',
            display: 'Surgery Recording',
            observationValue: {
              value: 'http://example.com/surgery.avi',
              type: 'string',
            },
          },
        ],
      };

      render(<ObservationItem observation={observation} index={0} />);

      const videoTile = screen.getByTestId('video-tile');
      expect(videoTile).toBeInTheDocument();
      expect(videoTile).toHaveAttribute(
        'data-src',
        'http://example.com/surgery.avi',
      );
    });
  });

  describe('Group Member Comments', () => {
    it('should display comment for top-level observation with members', () => {
      const observation: ExtractedObservation = {
        id: 'vitals-uuid',
        display: 'Vitals',
        members: [
          {
            id: 'hr-uuid',
            display: 'HR',
            observationValue: {
              value: 75,
              type: 'quantity',
              unit: 'beats/min',
            },
          },
        ],
      };

      render(
        <ObservationItem
          observation={observation}
          index={0}
          comment="Patient was exercising"
        />,
      );

      // Comment should be displayed at the parent level
      expect(screen.getByText('Patient was exercising')).toBeInTheDocument();
    });

    it('should display comment with provider name at top level', () => {
      const observation: ExtractedObservation = {
        id: 'vitals-uuid',
        display: 'Vitals',
        members: [
          {
            id: 'spo2-uuid',
            display: 'SpO2',
            observationValue: {
              value: 96,
              type: 'quantity',
              unit: '%',
            },
          },
        ],
        encounter: {
          id: 'enc-1',
          type: 'visit',
          date: '2024-01-01',
          provider: 'Dr. Johnson',
        },
      };

      render(
        <ObservationItem
          observation={observation}
          index={0}
          comment="Patient on oxygen"
        />,
      );

      // Comment with provider should be displayed at the parent level
      expect(
        screen.getByText(/Patient on oxygen - by Dr. Johnson/),
      ).toBeInTheDocument();
    });

    it('should not display comment section for group members when comment is not present', () => {
      const observation: ExtractedObservation = {
        id: 'vitals-uuid',
        display: 'Vitals',
        members: [
          {
            id: 'hr-uuid',
            display: 'HR',
            observationValue: {
              value: 75,
              type: 'quantity',
              unit: 'beats/min',
            },
          },
        ],
      };

      render(<ObservationItem observation={observation} index={0} />);

      expect(screen.getByText('Vitals')).toBeInTheDocument();
      expect(screen.getByText(/75 beats\/min/)).toBeInTheDocument();
      // Should not have any comment-related test ids
      expect(
        screen.queryByTestId(/obs-member-comment/),
      ).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations for normal observation', async () => {
      const observation: ExtractedObservation = {
        id: 'hr-uuid',
        display: 'HR',
        observationValue: {
          value: 75,
          type: 'quantity',
          unit: 'beats/min',
        },
      };

      const { container } = render(
        <ObservationItem observation={observation} index={0} />,
      );

      expect(await axe(container)).toHaveNoViolations();
    });

    it('has no accessibility violations for abnormal observation', async () => {
      const abnormalObs: ExtractedObservation = {
        id: 'hr-uuid',
        display: 'HR',
        observationValue: {
          value: 120,
          type: 'quantity',
          unit: 'beats/min',
          referenceRange: {
            low: { value: 60 },
            high: { value: 100 },
          },
          isAbnormal: true,
        },
      };

      const { container } = render(
        <ObservationItem observation={abnormalObs} index={0} />,
      );

      expect(await axe(container)).toHaveNoViolations();
    });

    it('has no accessibility violations for grouped observations', async () => {
      const observation: ExtractedObservation = {
        id: 'vitals-uuid',
        display: 'Vitals',
        members: [
          {
            id: 'hr-uuid',
            display: 'HR',
            observationValue: {
              value: 120,
              type: 'quantity',
              unit: 'beats/min',
              isAbnormal: true,
            },
          },
          {
            id: 'sbp-uuid',
            display: 'Systolic BP',
            observationValue: {
              value: 150,
              type: 'quantity',
              unit: 'mmHg',
              isAbnormal: true,
            },
          },
        ],
      };

      const { container } = render(
        <ObservationItem observation={observation} index={0} />,
      );

      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
