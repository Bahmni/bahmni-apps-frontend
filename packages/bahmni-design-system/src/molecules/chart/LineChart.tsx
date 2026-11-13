import { ChartTabularData, LineChartOptions } from '@carbon/charts';
import { LineChart as CarbonLineChart } from '@carbon/charts-react';
import React from 'react';
import styles from './styles/Chart.module.scss';
import './style';

export interface LineChartProps {
  data: ChartTabularData;
  options: LineChartOptions;
  ariaLabel?: string;
  testId?: string;
  className?: string;
}

/**
 * FHIR-agnostic line-chart wrapper over `@carbon/charts-react`'s `LineChart`.
 * Owns the chart package CSS and the `role="img"`/`aria-label` a11y region,
 * keeping the design system blind to FHIR and to `GraphData`.
 */
export const LineChart: React.FC<LineChartProps> = ({
  data,
  options,
  ariaLabel,
  testId,
  className = '',
}) => {
  const props = { data, options } as const;
  return (
    <div
      role="img"
      aria-label={ariaLabel}
      data-testid={testId}
      className={`${styles.chart} ${className}`}
    >
      <CarbonLineChart {...props} />
    </div>
  );
};

export default LineChart;
