import { render, screen } from '@testing-library/react';

import { ObservationData } from '../models';
import { ObservationItem } from '../ObservationItem';

describe('ObservationItem', () => {
  const mockObservation: ObservationData = {
    concept: {
      name: 'Heart Rate',
      uuid: 'hr-uuid',
      shortName: 'HR',
    },
    value: 75,
    valueAsString: '75',
    conceptNameToDisplay: 'HR',
  };

  describe('Range Display', () => {
    it('should display range when both low and high are present', () => {
      const observation: ObservationData = {
        ...mockObservation,
        concept: {
          ...mockObservation.concept,
          lowNormal: 60,
          hiNormal: 100,
          units: 'beats/min',
        },
      };

      render(<ObservationItem observation={observation} index={0} />);

      expect(screen.getByText(/HR/)).toBeInTheDocument();
      expect(screen.getByText(/\(60 - 100\)/)).toBeInTheDocument();
      expect(screen.getByText(/75 beats\/min/)).toBeInTheDocument();
    });

    it('should display >low when only low is present', () => {
      const observation: ObservationData = {
        ...mockObservation,
        concept: {
          ...mockObservation.concept,
          lowNormal: 95,
          units: '%',
        },
        conceptNameToDisplay: 'SpO2',
        valueAsString: '96',
      };

      render(<ObservationItem observation={observation} index={0} />);

      expect(screen.getByText(/SpO2/)).toBeInTheDocument();
      expect(screen.getByText(/\(>95\)/)).toBeInTheDocument();
      expect(screen.getByText(/96 %/)).toBeInTheDocument();
    });

    it('should display <high when only high is present', () => {
      const observation: ObservationData = {
        ...mockObservation,
        concept: {
          ...mockObservation.concept,
          hiNormal: 100,
          units: 'mg/dL',
        },
        conceptNameToDisplay: 'Blood Sugar',
        valueAsString: '85',
      };

      render(<ObservationItem observation={observation} index={0} />);

      expect(screen.getByText(/Blood Sugar/)).toBeInTheDocument();
      expect(screen.getByText(/\(<100\)/)).toBeInTheDocument();
      expect(screen.getByText(/85 mg\/dL/)).toBeInTheDocument();
    });

    it('should not display range when both low and high are null', () => {
      const observation: ObservationData = {
        ...mockObservation,
        concept: {
          ...mockObservation.concept,
          units: 'beats/min',
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
      const observation: ObservationData = {
        ...mockObservation,
        concept: {
          ...mockObservation.concept,
          units: 'beats/min',
        },
      };

      render(<ObservationItem observation={observation} index={0} />);

      expect(screen.getByText(/75 beats\/min/)).toBeInTheDocument();
    });

    it('should not display units when not present', () => {
      const observation: ObservationData = {
        ...mockObservation,
        concept: {
          ...mockObservation.concept,
        },
      };

      render(<ObservationItem observation={observation} index={0} />);

      expect(screen.getByText('75')).toBeInTheDocument();
      expect(screen.queryByText(/beats\/min/)).not.toBeInTheDocument();
    });
  });

  describe('Abnormal Value Highlighting', () => {
    it('should apply abnormal styling when interpretation is ABNORMAL', () => {
      const observation: ObservationData = {
        ...mockObservation,
        interpretation: 'ABNORMAL',
        concept: {
          ...mockObservation.concept,
          lowNormal: 60,
          hiNormal: 100,
          units: 'beats/min',
        },
      };

      render(<ObservationItem observation={observation} index={0} />);

      const valueElement = screen.getByText(/75 beats\/min/);
      expect(valueElement).toHaveClass('abnormalValue');

      const labelElement = screen.getByText(/HR/);
      expect(labelElement).toHaveClass('abnormalValue');
    });

    it('should not apply abnormal styling when interpretation is not ABNORMAL', () => {
      const observation: ObservationData = {
        ...mockObservation,
        interpretation: 'NORMAL',
        concept: {
          ...mockObservation.concept,
          units: 'beats/min',
        },
      };

      render(<ObservationItem observation={observation} index={0} />);

      const valueElement = screen.getByText(/75 beats\/min/);
      expect(valueElement).not.toHaveClass('abnormalValue');
    });
  });

  describe('Group Members', () => {
    it('should render group members recursively', () => {
      const observation: ObservationData = {
        concept: {
          name: 'Vitals',
          uuid: 'vitals-uuid',
        },
        conceptNameToDisplay: 'Vitals',
        groupMembers: [
          {
            concept: {
              name: 'Heart Rate',
              uuid: 'hr-uuid',
              lowNormal: 60,
              hiNormal: 100,
              units: 'beats/min',
            },
            value: 75,
            valueAsString: '75',
            conceptNameToDisplay: 'HR',
          },
          {
            concept: {
              name: 'SpO2',
              uuid: 'spo2-uuid',
              lowNormal: 95,
              units: '%',
            },
            value: 96,
            valueAsString: '96',
            conceptNameToDisplay: 'SpO2',
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
      const observation: ObservationData = {
        concept: {
          name: 'Vitals',
          uuid: 'vitals-uuid',
        },
        conceptNameToDisplay: 'Vitals',
        groupMembers: [
          {
            concept: {
              name: 'Heart Rate',
              uuid: 'hr-uuid',
              lowNormal: 60,
              hiNormal: 100,
              units: 'beats/min',
            },
            value: 120,
            valueAsString: '120',
            conceptNameToDisplay: 'HR',
            interpretation: 'ABNORMAL',
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
      const observation: ObservationData = {
        ...mockObservation,
        comment: 'Patient was resting',
      };

      render(<ObservationItem observation={observation} index={0} />);

      expect(screen.getByText('Patient was resting')).toBeInTheDocument();
    });

    it('should display comment with provider name', () => {
      const observation: ObservationData = {
        ...mockObservation,
        comment: 'Patient was resting',
        providers: [
          {
            uuid: 'provider-uuid',
            name: 'Dr. Smith',
          },
        ],
      };

      render(<ObservationItem observation={observation} index={0} />);

      expect(
        screen.getByText(/Patient was resting - by Dr. Smith/),
      ).toBeInTheDocument();
    });

    it('should not display comment section when comment is not present', () => {
      const observation: ObservationData = {
        ...mockObservation,
      };

      render(<ObservationItem observation={observation} index={0} />);

      expect(screen.queryByText(/Patient was resting/)).not.toBeInTheDocument();
    });
  });
});
