import { Bundle } from 'fhir/r4';
import { ChartConfig } from '../model';
import { evaluateChartData } from '../utils';

const config = (overrides: Partial<ChartConfig> = {}): ChartConfig => ({
  url: 'fhir/Observation?patient={patientUuid}',
  chartType: 'line',
  title: 'Chart',
  expression: '$',
  ...overrides,
});

const t = (key: string) => key;

const bundleWith = (resource: unknown): Bundle<unknown> => ({
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [{ resource: resource as never }],
});

describe('evaluateChartData', () => {
  it('returns empty date data when the bundle has no entries', async () => {
    const result = await evaluateChartData(
      config(),
      {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [],
      } as unknown as Bundle<unknown>,
      t,
    );

    expect(result).toEqual({ points: [], xType: 'date' });
  });

  it('returns empty date data when the bundle entry is missing', async () => {
    const result = await evaluateChartData(
      config(),
      {
        resourceType: 'Bundle',
        type: 'searchset',
      } as unknown as Bundle<unknown>,
      t,
    );

    expect(result).toEqual({ points: [], xType: 'date' });
  });

  it('evaluates the expression and returns the produced chart data', async () => {
    const expression = `{"points":[{"x":1,"y":10}],"xType":"category","unit":"mmHg"}`;
    const result = await evaluateChartData(
      config({ expression }),
      bundleWith({}),
      t,
    );

    expect(result).toEqual({
      points: [{ x: 1, y: 10 }],
      xType: 'category',
      unit: 'mmHg',
    });
  });

  it('coerces a missing points array to an empty array', async () => {
    const result = await evaluateChartData(
      config({ expression: `{"xType":"category"}` }),
      bundleWith({}),
      t,
    );

    expect(result).toEqual({ points: [], xType: 'category' });
  });

  it('coerces a non-array points value to an empty array', async () => {
    const result = await evaluateChartData(
      config({ expression: `{"points":"nope","xType":"category"}` }),
      bundleWith({}),
      t,
    );

    expect(result.points).toEqual([]);
  });

  it('throws when the expression does not produce an object', async () => {
    await expect(
      evaluateChartData(config({ expression: `42` }), bundleWith({}), t),
    ).rejects.toThrow('CHART_NO_CHART_DATA');
  });
});
