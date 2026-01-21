import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import {
  mockBundleWithMixedObservations,
  mockBundleWithGroupedObservationsOnly,
} from '../__mocks__/observationTestData';
import { ObsByEncounterAndForm } from '../components/ObsByEncounterAndForm';
import {
  extractObservationsFromBundle,
  groupObservationsByEncounterAndForm,
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

describe('ObsByEncounterAndForm', () => {
  it('should render encounters with form groups', () => {
    const result = extractObservationsFromBundle(
      mockBundleWithMixedObservations,
    );
    const groupedData = groupObservationsByEncounterAndForm(result);

    render(<ObsByEncounterAndForm groupedData={groupedData} />);

    expect(screen.getByText('Vitals')).toBeInTheDocument();
    expect(screen.getByText('Lab Results')).toBeInTheDocument();
    expect(screen.getByText('Temperature')).toBeInTheDocument();
  });

  it('should render form groups with grouped observations', () => {
    const result = extractObservationsFromBundle(
      mockBundleWithMixedObservations,
    );
    const groupedData = groupObservationsByEncounterAndForm(result);

    render(<ObsByEncounterAndForm groupedData={groupedData} />);

    expect(screen.getByText('Blood Pressure')).toBeInTheDocument();
    expect(screen.getByText('Systolic')).toBeInTheDocument();
  });

  it('should render multiple encounters with forms', () => {
    const result = extractObservationsFromBundle(
      mockBundleWithGroupedObservationsOnly,
    );
    const groupedData = groupObservationsByEncounterAndForm(result);

    const { container } = render(
      <ObsByEncounterAndForm groupedData={groupedData} />,
    );

    expect(container.querySelector('#encounter-enc-1')).toBeInTheDocument();
    expect(container.querySelector('#encounter-enc-2')).toBeInTheDocument();
    expect(screen.getByText('Blood Pressure')).toBeInTheDocument();
    expect(screen.getByText('Systolic')).toBeInTheDocument();
  });

  describe('Snapshot', () => {
    it('should match snapshot for ObsByEncounterAndForm', () => {
      const result = extractObservationsFromBundle(
        mockBundleWithMixedObservations,
      );
      const groupedData = groupObservationsByEncounterAndForm(result);

      const { container } = render(
        <ObsByEncounterAndForm groupedData={groupedData} />,
      );

      expect(container).toMatchSnapshot();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const result = extractObservationsFromBundle(
        mockBundleWithMixedObservations,
      );
      const groupedData = groupObservationsByEncounterAndForm(result);

      const { container } = render(
        <ObsByEncounterAndForm groupedData={groupedData} />,
      );

      const results = await axe(container!);
      await expect(results).toHaveNoViolations();
    });
  });
});
