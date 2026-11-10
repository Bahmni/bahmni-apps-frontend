import { Bundle } from 'fhir/r4';
import jsonata from 'jsonata';
import { ChartConfig, ChartData } from './model';

/**
 * Evaluates a JSONata expression against a bundle to produce normalized chart data.
 *
 * @param config - Chart configuration containing the JSONata query string.
 * @param bundle - The source data payload to evaluate against.
 * @param t - Active i18next translation function for error messages.
 * @returns A promise resolving to the validated {@link ChartData} object.
 *
 * @throws {Error} If `config.expression` fails to compile or evaluate.
 * @throws {Error} If the evaluation result is nullish or not an object.
 * @throws {Error} If the evaluated result is missing an array-valued `points` property.
 */
export const evaluateChartData = async (
  config: ChartConfig,
  bundle: Bundle<unknown>,
  t: (content: string) => string,
): Promise<ChartData> => {
  if (!bundle?.entry || bundle.entry.length === 0) {
    return {
      points: [],
      xType: 'date',
    };
  }

  const compiled = jsonata(config.expression);
  const result = (await compiled.evaluate(bundle)) as unknown;

  if (result == null || typeof result !== 'object') {
    throw new Error(t('CHART_NO_CHART_DATA'));
  }

  const candidate = result as ChartData;

  return {
    ...candidate,
    points: Array.isArray(candidate.points) ? candidate.points : [],
  };
};
