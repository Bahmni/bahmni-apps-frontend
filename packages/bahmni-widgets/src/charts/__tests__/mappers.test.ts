import {
  mapAreaChart,
  mapBarChart,
  mapLineChart,
  mapScatterChart,
  type MappedChart,
} from '../mappers';
import { ChartData } from '../model';

const baseData = (overrides: Partial<ChartData> = {}): ChartData => ({
  points: [
    { x: 1, y: 10 },
    { x: 2, y: 20 },
  ],
  xType: 'category',
  ...overrides,
});

interface Mode {
  map: (meta: {
    title: string;
    group?: string;
  }) => (data: ChartData) => MappedChart;
  name: string;
}

const modes: Mode[] = [
  { map: mapLineChart, name: 'Line' },
  { map: mapAreaChart, name: 'Area' },
  { map: mapBarChart, name: 'Bar' },
  { map: mapScatterChart, name: 'Scatter' },
];

describe('graph mappers', () => {
  it.each(modes)(
    'routes $name to its testId and aria label',
    ({ map, name }) => {
      const mapped = map({ title: name })(baseData());

      expect(mapped.testId).toBe(`graph-${name}`);
      expect(mapped.ariaLabel).toBe(`${name} chart`);
    },
  );

  it.each(modes)(
    'carries points to tabular rows with a $name group',
    ({ map }) => {
      const mapped = map({ title: 'T', group: 'Heart Beat' })(baseData());

      expect(mapped.data).toEqual([
        { x: 1, y: 10, group: 'Heart Beat' },
        { x: 2, y: 20, group: 'Heart Beat' },
      ]);
    },
  );

  it('uses a point series over the default group', () => {
    const data: ChartData = {
      points: [
        { x: 1, y: 120, series: 'systolic' },
        { x: 1, y: 80, series: 'diastolic' },
      ],
      xType: 'date',
    };

    const mapped = mapLineChart({ title: 'BP', group: 'default' })(data);

    expect(mapped.data).toEqual([
      { x: new Date(1), y: 120, group: 'systolic' },
      { x: new Date(1), y: 80, group: 'diastolic' },
    ]);
  });

  it('sorts date points by ascending time', () => {
    const data: ChartData = {
      points: [
        { x: 3, y: 30 },
        { x: 1, y: 10 },
        { x: 2, y: 20 },
      ],
      xType: 'date',
    };

    const mapped = mapLineChart({ title: 'T' })(data);

    expect(mapped.data.map((r) => r.x)).toEqual([
      new Date(1),
      new Date(2),
      new Date(3),
    ]);
  });

  it('defaults the group to undefined when no series or group is given', () => {
    const mapped = mapLineChart({ title: 'T' })(baseData());

    expect(mapped.data).toEqual([
      { x: 1, y: 10, group: undefined },
      { x: 2, y: 20, group: undefined },
    ]);
  });

  it('maps the x axis to a TIME scale titled "Date" for date type', () => {
    const { options } = mapLineChart({ title: 'T' })(
      baseData({ xType: 'date' }),
    );

    expect(
      (options as { axes: Record<string, unknown> }).axes.bottom,
    ).toMatchObject({
      scaleType: 'time',
      title: 'Date',
    });
  });

  it('maps the x axis to a LABELS scale titled "Period" for category type', () => {
    const { options } = mapLineChart({ title: 'T' })(
      baseData({ xType: 'category' }),
    );

    expect(
      (options as { axes: Record<string, unknown> }).axes.bottom,
    ).toMatchObject({
      scaleType: 'labels',
      title: 'Period',
    });
  });

  it('honours an explicit xTitle over the type default', () => {
    const { options } = mapLineChart({ title: 'T' })(
      baseData({ xType: 'date', xTitle: 'When' }),
    );

    expect(
      (options as { axes: Record<string, unknown> }).axes.bottom,
    ).toMatchObject({
      scaleType: 'time',
      title: 'When',
    });
  });

  it.each([
    ['yTitle', { yTitle: 'Pressure' }, 'Pressure'],
    ['unit', { unit: 'mmHg' }, 'mmHg'],
    ['default', {}, ''],
  ] as Array<[string, Partial<ChartData>, string]>)(
    'resolves the y axis title from %s',
    (_label, overrides, expected) => {
      const { options } = mapLineChart({ title: 'T' })(baseData(overrides));

      expect(
        (options as { axes: Record<string, unknown> }).axes.left,
      ).toMatchObject({
        title: expected,
      });
    },
  );

  it('applies a fixed y domain when provided', () => {
    const { options } = mapLineChart({ title: 'T' })(
      baseData({ yDomain: [0, 100] }),
    );

    expect(
      (options as { axes: Record<string, unknown> }).axes.left,
    ).toMatchObject({
      domain: [0, 100],
    });
  });

  it('sets the resolved title on the options', () => {
    const mapped = mapLineChart({ title: 'Vitals Trends' })(baseData());

    expect(mapped.options.title).toBe('Vitals Trends');
    expect(mapped.ariaLabel).toBe('Vitals Trends chart');
  });
});
