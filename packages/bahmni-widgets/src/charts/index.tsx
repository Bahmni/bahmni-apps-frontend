import {
  AreaChart,
  BarChart,
  ChartSkeleton,
  LineChart,
  ScatterChart,
} from '@bahmni/design-system';
import { getBundle, useTranslation } from '@bahmni/services';
import {
  AreaChartOptions,
  BarChartOptions,
  LineChartOptions,
  ScatterChartOptions,
} from '@carbon/charts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { WidgetProps } from '../registry/model';
import { resolveNavigationURL } from '../utils/urlUtils';
import { CHART_MAPPERS, SUPPORTED_CHART_TYPES } from './constants';
import { mapLineChart, type MappedChart } from './mappers';
import type { ChartConfig, ChartData } from './model';
import styles from './styles/index.module.scss';
import { evaluateChartData } from './utils';

export type ChartWidgetPropTypes = WidgetProps;

const renderChart = (
  chartType: ChartConfig['chartType'],
  data: MappedChart,
): React.ReactNode => {
  const { data: rows, ariaLabel, testId, options } = data;
  switch (chartType) {
    case 'area':
      return (
        <AreaChart
          ariaLabel={ariaLabel}
          data={rows}
          options={options as AreaChartOptions}
          testId={testId}
        />
      );
    case 'bar':
      return (
        <BarChart
          ariaLabel={ariaLabel}
          data={rows}
          options={options as BarChartOptions}
          testId={testId}
        />
      );
    case 'scatter':
      return (
        <ScatterChart
          ariaLabel={ariaLabel}
          data={rows}
          options={options as ScatterChartOptions}
          testId={testId}
        />
      );
    case 'line':
    default:
      return (
        <LineChart
          ariaLabel={ariaLabel}
          data={rows}
          options={options as LineChartOptions}
          testId={testId}
        />
      );
  }
};

const fetchPatientChartData = async (
  patientUUID: string | null | undefined,
  chartConfig: ChartConfig,
  t: (content: string) => string,
) => {
  if (!patientUUID) {
    throw new Error(t('CHART_MISSING_PATIENT_ID'));
  }

  const url = await resolveNavigationURL(chartConfig.url, {
    patientUuid: patientUUID,
  });
  if (!url) {
    throw new Error(t('CHART_URL_UNRESOLVED'));
  }

  const bundle = await getBundle(url);
  const mapper =
    CHART_MAPPERS[chartConfig.chartType as keyof typeof CHART_MAPPERS] ??
    mapLineChart;

  const chartData: ChartData = await evaluateChartData(chartConfig, bundle, t);

  return mapper({ title: t(chartConfig.title) })(chartData);
};

const Chart: React.FC<ChartWidgetPropTypes> = ({ config }) => {
  const { t } = useTranslation();
  const patientUUID = usePatientUUID();
  const chartConfig = config as ChartConfig;

  const { data, isLoading, error, isError } = useQuery<
    MappedChart | null,
    Error
  >({
    queryKey: ['chart', chartConfig?.url, patientUUID],
    enabled:
      !!chartConfig?.url &&
      SUPPORTED_CHART_TYPES.has(chartConfig?.chartType ?? ''),
    queryFn: async () => fetchPatientChartData(patientUUID, chartConfig, t),
  });

  const invalidChartType = !SUPPORTED_CHART_TYPES.has(
    chartConfig?.chartType ?? '',
  );

  if (invalidChartType || isError || error) {
    return (
      <div
        id="chart-error-id"
        className={styles.error}
        data-testid="chart-error-test-id"
      >
        {error?.message ?? t('CHART_ERROR_DEFAULT')}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div id="chart-loading-id" data-testid="chart-loading-test-id">
        <ChartSkeleton ariaLabel="Loading chart" testId="chart-loading" />
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <div
        id="chart-empty-id"
        className={styles.empty}
        data-testid="chart-empty-test-id"
      >
        {chartConfig?.emptyMessage ?? t('CHART_EMPTY_DEFAULT')}
      </div>
    );
  }

  return (
    <div id="chart-id" data-testid="chart-test-id" className={styles.chart}>
      {renderChart(chartConfig.chartType, data)}
    </div>
  );
};

export default Chart;
