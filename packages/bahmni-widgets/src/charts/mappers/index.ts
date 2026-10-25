import {
  type AreaChartOptions,
  type BarChartOptions,
  type ChartOptions,
  type ChartTabularData,
  type LineChartOptions,
  type ScatterChartOptions,
  ScaleTypes,
} from '@carbon/charts';
import { DEFAULT_CHART_HEIGHT } from '../constants';
import { ChartData } from '../model';

export interface MappedChart {
  data: ChartTabularData;
  options:
    | LineChartOptions
    | AreaChartOptions
    | BarChartOptions
    | ScatterChartOptions;
  ariaLabel: string;
  testId: string;
}

const toTabularData = (
  ChartData: ChartData,
  defaultGroup?: string,
): ChartTabularData => {
  const isDate = ChartData.xType === 'date';
  const points = ChartData?.points ?? [];

  const rows = points.map((p) => ({
    x: isDate ? new Date(p.x as string | number) : p.x,
    y: p.y,
    group: p.series ?? defaultGroup,
  }));

  if (isDate) {
    return rows.sort(
      (a, b) => (a.x as Date).getTime() - (b.x as Date).getTime(),
    );
  }

  return rows;
};

const buildOptions = (
  ChartData: ChartData,
  title: string,
):
  | LineChartOptions
  | AreaChartOptions
  | BarChartOptions
  | ScatterChartOptions => {
  const { xType, unit, yDomain, xTitle, yTitle } = ChartData;

  const resolvedXTitle = xTitle ?? (xType === 'date' ? 'Date' : 'Period');
  const resolvedYTitle = yTitle ?? unit ?? '';

  const x = {
    mapsTo: 'x' as const,
    scaleType: xType === 'date' ? ScaleTypes.TIME : ScaleTypes.LABELS,
    title: resolvedXTitle,
    ticks: {
      number: 10,
      formatter: (date: Date) => {
        if (date instanceof Date) {
          return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
          });
        }
        return date;
      },
    },
  };

  const y = {
    mapsTo: 'y' as const,
    scaleType: ScaleTypes.LINEAR,
    title: resolvedYTitle,
    domain: yDomain,
  };

  return {
    title: title,
    height: DEFAULT_CHART_HEIGHT,
    axes: {
      bottom: x,
      left: y,
    },
    data: {
      groupMapsTo: 'group',
    },
    legend: {
      enabled: true,
    },
    toolbar: {
      enabled: true,
      numberOfIcons: 5,
      controls: [
        { type: 'Zoom in' },
        { type: 'Zoom out' },
        { type: 'Make fullscreen' },
        { type: 'Show as data-table' },
        { type: 'Reset zoom' },
        { type: 'Export as CSV' },
        { type: 'Export as PNG' },
        { type: 'Export as JPG' },
      ],
    },
    zoomBar: {
      top: {
        enabled: true,
        type: 'slider_view',
      },
    },
    canvasZoom: {
      enabled: true,
    },
  } as
    | LineChartOptions
    | AreaChartOptions
    | BarChartOptions
    | ScatterChartOptions;
};

const map =
  (chartName: string, testIdPrefix = 'graph') =>
  (meta: { title: string; group?: string }) =>
  (ChartData: ChartData): MappedChart => {
    const options = buildOptions(ChartData, meta.title);
    return {
      data: toTabularData(ChartData, meta?.group),
      options,
      ariaLabel: `${options.title} chart`,
      testId: `${testIdPrefix}-${chartName}`,
    };
  };

export const mapLineChart = map('Line');
export const mapAreaChart = map('Area');
export const mapBarChart = map('Bar');
export const mapScatterChart = map('Scatter');

export type { ChartOptions };
