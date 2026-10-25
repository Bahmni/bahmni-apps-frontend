import { AreaChartOptions, ChartTabularData } from '@carbon/charts';
import { AreaChart as CarbonAreaChart } from '@carbon/charts-react';
import React from 'react';
import styles from './styles/Chart.module.scss';
import './style';

export interface AreaChartProps {
  data: ChartTabularData;
  options: AreaChartOptions;
  ariaLabel?: string;
  testId?: string;
  className?: string;
}

export const AreaChart: React.FC<AreaChartProps> = ({
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
      <CarbonAreaChart {...props} />
    </div>
  );
};

export default AreaChart;
