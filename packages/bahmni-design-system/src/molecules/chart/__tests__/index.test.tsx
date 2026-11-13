import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import {
  AreaChart,
  BarChart,
  LineChart,
  ScatterChart,
  type AreaChartProps,
  type BarChartProps,
  type ChartTabularData,
  type LineChartProps,
  type ScatterChartProps,
} from '../index';

expect.extend(toHaveNoViolations);

jest.mock('@carbon/charts-react', () => {
  const node = (
    testId: string,
    props: { data?: unknown[]; options?: unknown },
  ) => (
    <div
      data-options={JSON.stringify(props.options ?? null)}
      data-points={props.data?.length ?? 0}
      data-testid={testId}
    />
  );

  return {
    AreaChart: (props: { data?: unknown[]; options?: unknown }) =>
      node('carbon-area', props),
    GroupedBarChart: (props: { data?: unknown[]; options?: unknown }) =>
      node('carbon-bar', props),
    LineChart: (props: { data?: unknown[]; options?: unknown }) =>
      node('carbon-line', props),
    ScatterChart: (props: { data?: unknown[]; options?: unknown }) =>
      node('carbon-scatter', props),
  };
});

const data: ChartTabularData = [
  { group: 'diastolic', x: 1, y: 80 },
  { group: 'systolic', x: 1, y: 120 },
];

type ChartComponent = React.ComponentType<
  LineChartProps | AreaChartProps | BarChartProps | ScatterChartProps
>;

const cases: Array<{
  Component: ChartComponent;
  ariaLabel: string;
  carbonTestId: string;
}> = [
  {
    Component: LineChart,
    ariaLabel: 'Line chart',
    carbonTestId: 'carbon-line',
  },
  {
    Component: AreaChart,
    ariaLabel: 'Area chart',
    carbonTestId: 'carbon-area',
  },
  {
    Component: BarChart,
    ariaLabel: 'Bar chart',
    carbonTestId: 'carbon-bar',
  },
  {
    Component: ScatterChart,
    ariaLabel: 'Scatter chart',
    carbonTestId: 'carbon-scatter',
  },
];

describe.each(cases)(
  '$ariaLabel wrapper',
  ({ Component, ariaLabel, carbonTestId }) => {
    it('renders the role="img" region with the forwarded aria-label', () => {
      render(
        <Component
          ariaLabel={ariaLabel}
          data={data}
          options={{} as never}
          testId="test"
        />,
      );

      expect(screen.getByRole('img', { name: ariaLabel })).toBeInTheDocument();
    });

    it('forwards data and options to the underlying carbon chart', () => {
      render(
        <Component
          ariaLabel={ariaLabel}
          data={data}
          options={{ title: ariaLabel } as never}
          testId="test"
        />,
      );

      const inner = screen.getByTestId(carbonTestId);
      expect(inner).toHaveAttribute('data-points', '2');
      expect(inner).toHaveAttribute(
        'data-options',
        JSON.stringify({ title: ariaLabel }),
      );
    });

    it('applies the base chart class when className defaults to an empty string', () => {
      render(
        <Component
          ariaLabel={ariaLabel}
          data={data}
          options={{} as never}
          testId="test"
        />,
      );

      const region = screen.getByRole('img');
      expect(region).toHaveClass('chart');
      expect(region.className).toBe('chart ');
    });

    it('appends a custom className to the base chart class', () => {
      render(
        <Component
          ariaLabel={ariaLabel}
          className="custom-chart"
          data={data}
          options={{} as never}
          testId="test"
        />,
      );

      const region = screen.getByRole('img');
      expect(region).toHaveClass('chart');
      expect(region).toHaveClass('custom-chart');
    });

    it('matches snapshot', () => {
      const { container } = render(
        <Component
          ariaLabel={ariaLabel}
          data={data}
          options={{ title: ariaLabel } as never}
          testId="test"
        />,
      );
      expect(container).toMatchSnapshot();
    });

    it('has no accessibility violations', async () => {
      const { container } = render(
        <Component
          ariaLabel={ariaLabel}
          data={data}
          options={{} as never}
          testId="test"
        />,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  },
);
