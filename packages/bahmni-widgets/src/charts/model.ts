/**
 * Configuration for a `type: "charts"` dashboard control.
 */
export interface ChartConfig {
  /**
   * FHIR search/read URL template. `{expr}` tokens are resolved at runtime
   * against `{ patientUuid }` via `resolveNavigationURL`.
   */
  url: string;
  /**
   * Heading rendered above the chart. Falls back to the chart mode name
   * (`"Line"`, `"Area"`, etc.) when omitted.
   */
  title: string;
  /**
   * Which chart to render. A fixed union; adding a new value is a code change
   */
  chartType: 'line' | 'area' | 'bar' | 'scatter';
  /**
   * A `jsonata` expression evaluated over the entire fetched FHIR `Bundle`,
   * producing a `ChartData` shape.
   */
  expression: string;
  /**
   * Unit label for the plotted value, e.g. `"mmHg"`, `"%"`.
   */
  unit?: string;
  /**
   * Optional fixed `[min, max]` y scale.
   */
  yDomain?: [number, number] | null;
  /**
   * Optional alternate empty state message.
   */
  emptyMessage?: string;
  /**
   * Optional alternate error state message.
   */
  errorMessage?: string;
}

/** The `jsonata` `expression` is evaluated to produce this mode-agnostic shape. */
export interface ChartData {
  points: Array<{
    x: number | string;
    y: number;
    series?: string;
  }>;
  xType: 'date' | 'category';
  xTitle?: string;
  yTitle?: string;
  unit?: string;
  yDomain?: [number, number];
}

/** The closed set of chart modes the widget supports. */
export type ChartType = ChartConfig['chartType'];
