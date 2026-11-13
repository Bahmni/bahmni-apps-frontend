import { BarChartOptions, ChartTabularData } from '@carbon/charts';
import { GroupedBarChart as CarbonBarChart } from '@carbon/charts-react';
import React from 'react';
import styles from './styles/Chart.module.scss';
import './style';

export interface BarChartProps {
  data: ChartTabularData;
  options: BarChartOptions;
  ariaLabel?: string;
  testId?: string;
  className?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
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
      <CarbonBarChart {...props} />
    </div>
  );
};

export default BarChart;
