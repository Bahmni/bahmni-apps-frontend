import { useNotification } from '@bahmni/widgets';
import { act, renderHook } from '@testing-library/react';
import type {
  AppliedFilters,
  ReportDefinition,
} from '../../components/ReportList/models';
import { useReportTableState } from '../useReportTableState';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      typeof options?.defaultValue === 'string' ? options.defaultValue : key,
  }),
}));

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useNotification: jest.fn(),
}));

const mockRunReport = jest.fn();
jest.mock('../useRunReport', () => ({
  useRunReport: () => ({ runReport: mockRunReport }),
}));

const mockUseNotification = useNotification as jest.MockedFunction<
  typeof useNotification
>;

const NO_FILTERS: AppliedFilters = {
  startDate: null,
  endDate: null,
  format: null,
  version: 0,
};

const reportA: ReportDefinition & { id: string } = {
  id: 'report-a',
  name: 'Report A',
  type: 'visits',
  config: { dateRangeRequired: false },
};

const reportB: ReportDefinition & { id: string } = {
  id: 'report-b',
  name: 'Report B',
  type: 'visits',
  config: { dateRangeRequired: false },
};

describe('useReportTableState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRunReport.mockReturnValue(true);
    mockUseNotification.mockReturnValue({
      notifications: [],
      addNotification: jest.fn(),
      removeNotification: jest.fn(),
      clearAllNotifications: jest.fn(),
    });
  });

  const runReportsWithFormat = (
    result: {
      current: ReturnType<typeof useReportTableState>;
    },
    report: ReportDefinition & { id: string },
  ) => {
    act(() => {
      result.current.updateRow(report.id, { format: 'PDF' });
    });
    act(() => {
      result.current.handleRunReport(report);
    });
  };

  it('falls back to the applied filters until a row override is set', () => {
    const { result } = renderHook(() =>
      useReportTableState([reportA], NO_FILTERS, undefined),
    );
    expect(result.current.rowFilters(reportA.id)).toEqual({
      startDate: null,
      endDate: null,
      format: null,
    });

    act(() => {
      result.current.updateRow(reportA.id, { format: 'CSV' });
    });
    expect(result.current.rowFilters(reportA.id)).toEqual({
      startDate: null,
      endDate: null,
      format: 'CSV',
    });
  });

  it('resets overrides and errors when appliedFilters.version changes', () => {
    const { result, rerender } = renderHook(
      ({ filters }) => useReportTableState([reportA], filters, undefined),
      { initialProps: { filters: NO_FILTERS } },
    );

    act(() => {
      result.current.updateRow(reportA.id, { format: 'CSV' });
    });
    expect(result.current.rowFilters(reportA.id).format).toBe('CSV');

    rerender({ filters: { ...NO_FILTERS, version: 1 } });

    expect(result.current.rowFilters(reportA.id).format).toBeNull();
  });

  it('does not let an earlier row-run timer clear a later run on a different row (race fix)', () => {
    jest.useFakeTimers();
    const { result } = renderHook(() =>
      useReportTableState([reportA, reportB], NO_FILTERS, undefined),
    );

    runReportsWithFormat(result, reportA);
    expect(result.current.isRunning(reportA.id)).toBe(true);

    // Row B starts running within row A's 300ms window.
    act(() => {
      jest.advanceTimersByTime(100);
    });
    runReportsWithFormat(result, reportB);
    expect(result.current.isRunning(reportB.id)).toBe(true);

    // Row A's stale timer fires here — it must not clear row B's spinner.
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(result.current.isRunning(reportA.id)).toBe(false);
    expect(result.current.isRunning(reportB.id)).toBe(true);

    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current.isRunning(reportB.id)).toBe(false);

    jest.useRealTimers();
  });
});
