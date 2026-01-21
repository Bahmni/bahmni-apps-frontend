import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import {
  mockBundleWithMultipleEncounters,
  mockBundleWithMixedObservations,
} from '../__mocks__/observationTestData';
import { ObsByEncounter } from '../components/ObsByEncounter';
import {
  extractObservationsFromBundle,
  groupObservationsByEncounter,
} from '../utils';

expect.extend(toHaveNoViolations);

jest.mock('../utils', () => ({
  ...jest.requireActual('../utils'),
  formatEncounterTitle: jest.fn(() => '21 Jan 2026, 10:30 AM'),
  transformObservationToRowCell: jest.fn((obs, index) => ({
    index,
    header: obs.display,
    value: '120 mmHg',
    provider: 'Dr. Smith',
  })),
}));

jest.mock('@bahmni/services', () => ({
  useTranslation: jest.fn(() => ({
    t: (key: string, params?: any) => {
      if (key === 'OBSERVATION_RECORDED_BY' && params?.provider) {
        return `Recorded by ${params.provider}`;
      }
      return key;
    },
  })),
}));

describe('ObsByEncounter', () => {
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

  describe('Snapshot', () => {
    it('should match snapshot for ObsByEncounterAndForm', () => {
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
