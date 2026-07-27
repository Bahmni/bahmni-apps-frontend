import type { Row } from '@tanstack/react-table';
import type { DataTableColumn } from '../types';
import {
  buildTanStackColumns,
  defaultRenderCell,
  deriveFacetedOptions,
  inDateRangeFilterFn,
  initialExpandedState,
  initialSortingState,
  type DateRangeFilterValue,
} from '../utils';

const makeRow = (value: unknown) =>
  ({
    getValue: () => value,
  }) as unknown as Row<unknown>;

const noopAddMeta = () => {
  /* no-op */
};

describe('inDateRangeFilterFn', () => {
  const start = Date.UTC(2026, 0, 1);
  const end = Date.UTC(2026, 2, 1);

  it('returns true when filterValue is null/undefined', () => {
    expect(
      inDateRangeFilterFn(
        makeRow(Date.UTC(2026, 0, 15)),
        'col',
        null as unknown as DateRangeFilterValue,
        noopAddMeta,
      ),
    ).toBe(true);
    expect(
      inDateRangeFilterFn(
        makeRow(Date.UTC(2026, 0, 15)),
        'col',
        undefined as unknown as DateRangeFilterValue,
        noopAddMeta,
      ),
    ).toBe(true);
  });

  it('returns true when both start and end are null', () => {
    expect(
      inDateRangeFilterFn(
        makeRow(Date.UTC(2026, 0, 15)),
        'col',
        [null, null],
        noopAddMeta,
      ),
    ).toBe(true);
  });

  it('returns false when the cell value cannot be parsed to a timestamp', () => {
    expect(
      inDateRangeFilterFn(makeRow(null), 'col', [start, end], noopAddMeta),
    ).toBe(false);
    expect(
      inDateRangeFilterFn(makeRow(undefined), 'col', [start, end], noopAddMeta),
    ).toBe(false);
    expect(
      inDateRangeFilterFn(makeRow(''), 'col', [start, end], noopAddMeta),
    ).toBe(false);
    expect(
      inDateRangeFilterFn(
        makeRow('not-a-date'),
        'col',
        [start, end],
        noopAddMeta,
      ),
    ).toBe(false);
    expect(
      inDateRangeFilterFn(
        makeRow({ unparseable: true }),
        'col',
        [start, end],
        noopAddMeta,
      ),
    ).toBe(false);
    expect(
      inDateRangeFilterFn(makeRow(true), 'col', [start, end], noopAddMeta),
    ).toBe(false);
  });

  it('returns false when cellValue is before the start bound', () => {
    expect(
      inDateRangeFilterFn(
        makeRow(Date.UTC(2025, 11, 31)),
        'col',
        [start, end],
        noopAddMeta,
      ),
    ).toBe(false);
  });

  it('returns false when cellValue is after the end bound', () => {
    expect(
      inDateRangeFilterFn(
        makeRow(Date.UTC(2026, 5, 1)),
        'col',
        [start, end],
        noopAddMeta,
      ),
    ).toBe(false);
  });

  it('returns true with an end-only bound when cellValue is at or before end', () => {
    expect(
      inDateRangeFilterFn(
        makeRow(Date.UTC(2025, 0, 1)),
        'col',
        [null, end],
        noopAddMeta,
      ),
    ).toBe(true);
  });

  it('accepts a Date instance as the cell value', () => {
    expect(
      inDateRangeFilterFn(
        makeRow(new Date(Date.UTC(2026, 0, 15))),
        'col',
        [start, end],
        noopAddMeta,
      ),
    ).toBe(true);
  });

  it('accepts a valid ISO string as the cell value', () => {
    expect(
      inDateRangeFilterFn(
        makeRow('2026-01-15T00:00:00.000Z'),
        'col',
        [start, end],
        noopAddMeta,
      ),
    ).toBe(true);
  });

  it('includes all timestamps within a single day when start and end are the same date', () => {
    // Use local dates instead of UTC to align with how the DatePicker works
    const singleDay = new Date(2026, 0, 15).getTime(); // Jan 15, 2026 at 00:00:00 local

    // Test various times throughout the day (all in local timezone)
    expect(
      inDateRangeFilterFn(
        makeRow(new Date(2026, 0, 15, 0, 0, 0).getTime()), // Midnight
        'col',
        [singleDay, singleDay],
        noopAddMeta,
      ),
    ).toBe(true);

    expect(
      inDateRangeFilterFn(
        makeRow(new Date(2026, 0, 15, 12, 30, 0).getTime()), // Noon
        'col',
        [singleDay, singleDay],
        noopAddMeta,
      ),
    ).toBe(true);

    expect(
      inDateRangeFilterFn(
        makeRow(new Date(2026, 0, 15, 23, 59, 59).getTime()), // End of day
        'col',
        [singleDay, singleDay],
        noopAddMeta,
      ),
    ).toBe(true);

    // Test that next day is excluded
    expect(
      inDateRangeFilterFn(
        makeRow(new Date(2026, 0, 16, 0, 0, 0).getTime()), // Next day midnight
        'col',
        [singleDay, singleDay],
        noopAddMeta,
      ),
    ).toBe(false);

    // Test that previous day is excluded
    expect(
      inDateRangeFilterFn(
        makeRow(new Date(2026, 0, 14, 23, 59, 59).getTime()), // Previous day end
        'col',
        [singleDay, singleDay],
        noopAddMeta,
      ),
    ).toBe(false);
  });
});

describe('defaultRenderCell', () => {
  it('returns empty string for null and undefined values', () => {
    expect(defaultRenderCell({ a: null }, 'a')).toBe('');
    expect(defaultRenderCell({ a: undefined }, 'a')).toBe('');
    expect(defaultRenderCell({}, 'missing')).toBe('');
  });

  it('returns the raw value when present', () => {
    expect(defaultRenderCell({ a: 'value' }, 'a')).toBe('value');
    expect(defaultRenderCell({ a: 0 }, 'a')).toBe(0);
  });
});

describe('buildTanStackColumns', () => {
  interface Item {
    id: string;
    name: string;
    qty: number;
  }

  it('falls back to the property at col.key when no accessor is provided', () => {
    const columns: DataTableColumn<Item>[] = [{ key: 'name', header: 'Name' }];
    const built = buildTanStackColumns<Item>(columns, () => null);
    const accessorFn = built[0].accessorFn as (row: Item) => unknown;
    expect(accessorFn({ id: '1', name: 'Aspirin', qty: 1 })).toBe('Aspirin');
  });

  it('uses the table-level accessor when provided to derive the sort/filter value', () => {
    const columns: DataTableColumn<Item>[] = [{ key: 'name', header: 'Name' }];
    const built = buildTanStackColumns<Item>(
      columns,
      () => null,
      (row, key) => (key === 'name' ? row.qty * 2 : undefined),
    );
    const accessorFn = built[0].accessorFn as (row: Item) => unknown;
    expect(accessorFn({ id: '1', name: 'Aspirin', qty: 3 })).toBe(6);
  });

  it('falls back to row[key] when the table-level accessor returns undefined for a column', () => {
    const columns: DataTableColumn<Item>[] = [{ key: 'name', header: 'Name' }];
    const built = buildTanStackColumns<Item>(
      columns,
      () => null,
      () => undefined,
    );
    const accessorFn = built[0].accessorFn as (row: Item) => unknown;
    expect(accessorFn({ id: '1', name: 'Aspirin', qty: 3 })).toBe('Aspirin');
  });

  it('defaults missing values to empty string', () => {
    const columns: DataTableColumn<Item>[] = [{ key: 'name', header: 'Name' }];
    const built = buildTanStackColumns<Item>(columns, () => null);
    const accessorFn = built[0].accessorFn as (row: Item) => unknown;
    expect(
      accessorFn({ id: '1', name: null as unknown as string, qty: 1 }),
    ).toBe('');
  });

  it('resolves the text filter fn by default', () => {
    const columns: DataTableColumn<Item>[] = [
      { key: 'name', header: 'Name', enableFiltering: true },
    ];
    const built = buildTanStackColumns<Item>(columns, () => null);
    expect(built[0].filterFn).toBe('includesString');
  });

  it('resolves the select filter fn for filterType=select', () => {
    const columns: DataTableColumn<Item>[] = [
      {
        key: 'name',
        header: 'Name',
        enableFiltering: true,
        filterType: 'select',
      },
    ];
    const built = buildTanStackColumns<Item>(columns, () => null);
    expect(built[0].filterFn).toBe('arrIncludesSome');
  });

  it('resolves the dateRange filter fn for filterType=dateRange', () => {
    const columns: DataTableColumn<Item>[] = [
      {
        key: 'name',
        header: 'Name',
        enableFiltering: true,
        filterType: 'dateRange',
      },
    ];
    const built = buildTanStackColumns<Item>(columns, () => null);
    expect(built[0].filterFn).toBe(inDateRangeFilterFn);
  });
});

describe('initialSortingState', () => {
  it('returns an empty array when no column has a default sort', () => {
    const columns: DataTableColumn<{ id: string; name: string }>[] = [
      { key: 'name', header: 'Name' },
    ];
    expect(initialSortingState(columns)).toEqual([]);
  });

  it('emits desc=true for defaultSortDirection="desc"', () => {
    const columns: DataTableColumn<{ id: string; name: string }>[] = [
      { key: 'name', header: 'Name', defaultSortDirection: 'desc' },
    ];
    expect(initialSortingState(columns)).toEqual([{ id: 'name', desc: true }]);
  });

  it('emits desc=false for defaultSortDirection="asc"', () => {
    const columns: DataTableColumn<{ id: string; name: string }>[] = [
      { key: 'name', header: 'Name', defaultSortDirection: 'asc' },
    ];
    expect(initialSortingState(columns)).toEqual([{ id: 'name', desc: false }]);
  });
});

describe('initialExpandedState', () => {
  it('returns an empty object when no rows are expanded', () => {
    expect(initialExpandedState(undefined)).toEqual({});
    expect(initialExpandedState([])).toEqual({});
  });

  it('expands every supplied row id', () => {
    expect(initialExpandedState(['1', '3'])).toEqual({ '1': true, '3': true });
  });
});

describe('deriveFacetedOptions', () => {
  it('returns an empty array when facetedValues is undefined', () => {
    expect(deriveFacetedOptions(undefined)).toEqual([]);
  });

  it('drops null and empty-string entries', () => {
    const map = new Map<unknown, number>([
      ['active', 2],
      [null, 5],
      ['', 1],
      ['stopped', 1],
    ]);
    expect(deriveFacetedOptions(map)).toEqual([
      { value: 'active', label: 'active (2)' },
      { value: 'stopped', label: 'stopped (1)' },
    ]);
  });

  it('sorts options alphabetically by value', () => {
    const map = new Map<unknown, number>([
      ['c', 1],
      ['a', 1],
      ['b', 1],
    ]);
    expect(deriveFacetedOptions(map).map((o) => o.value)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });
});
