import {
  mapAreaChart,
  mapBarChart,
  mapLineChart,
  mapScatterChart,
} from './mappers';

export const SUPPORTED_CHART_TYPES: ReadonlySet<string> = new Set([
  'line',
  'area',
  'bar',
  'scatter',
]);

export const CHART_MAPPERS = {
  area: mapAreaChart,
  bar: mapBarChart,
  scatter: mapScatterChart,
  line: mapLineChart,
} as const;

export const DEFAULT_CHART_HEIGHT = 'clamp(244px, 50vh, 80vh)';
