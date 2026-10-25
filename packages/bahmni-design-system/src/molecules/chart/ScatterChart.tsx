import { ChartTabularData, ScatterChartOptions } from '@carbon/charts';
import { ScatterChart as CarbonScatterChart } from '@carbon/charts-react';
import React from 'react';
import styles from './styles/Chart.module.scss';
import './style';

export interface ScatterChartProps {
  data: ChartTabularData;
  options: ScatterChartOptions;
  ariaLabel?: string;
  testId?: string;
  className?: string;
}

/** FHIR-agnostic scatter-chart wrapper over `@carbon/charts-react`'s `ScatterChart`. */
export const ScatterChart: React.FC<ScatterChartProps> = ({
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
      <CarbonScatterChart {...props} />
    </div>
  );
};

export default ScatterChart;
