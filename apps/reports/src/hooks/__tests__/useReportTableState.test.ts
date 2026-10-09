import { useNotification } from '@bahmni/widgets';
import { act, renderHook } from '@testing-library/react';
import type {
  AppliedFilters,
  ReportDefinition,
} from '../../components/ReportList/models';
import { useReportTableState } from '../useReportTableState';

const mockUploadReportTemplate = jest.fn();
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      typeof options?.defaultValue === 'string' ? options.defaultValue : key,
  }),
  uploadReportTemplate: (file: File) => mockUploadReportTemplate(file),
}));

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useNotification: jest.fn(),
}));

const mockRunReport = jest.fn();
jest.mock('../useRunReport', () => ({
  useRunReport: () => ({ runReport: mockRunReport }),
}));

const mockQueueReport = jest.fn();
jest.mock('../useQueueReport', () => ({
  useQueueReport: () => ({ queueReport: mockQueueReport }),
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
  const addNotification = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockRunReport.mockReturnValue(true);
    mockQueueReport.mockResolvedValue(true);
    mockUploadReportTemplate.mockResolvedValue('uploaded-template.xlsx');
    mockUseNotification.mockReturnValue({
      notifications: [],
      addNotification,
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
      useReportTableState([reportA], NO_FILTERS, ['PDF', 'CSV'], undefined),
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
      ({ filters }) =>
        useReportTableState([reportA], filters, ['PDF', 'CSV'], undefined),
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
      useReportTableState(
        [reportA, reportB],
        NO_FILTERS,
        ['PDF', 'CSV'],
        undefined,
      ),
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

  describe('handleQueueReport', () => {
    it('queues the report and shows a success notification', async () => {
      const { result } = renderHook(() =>
        useReportTableState([reportA], NO_FILTERS, ['PDF', 'CSV'], undefined),
      );
      act(() => {
        result.current.updateRow(reportA.id, { format: 'PDF' });
      });

      await act(async () => {
        await result.current.handleQueueReport(reportA);
      });

      expect(mockQueueReport).toHaveBeenCalledWith(
        reportA,
        'PDF',
        null,
        null,
        undefined,
        null,
      );
      expect(addNotification).toHaveBeenCalledWith({
        title: 'REPORTS_QUEUE_SUCCESS_TITLE',
        message: 'REPORTS_QUEUE_SUCCESS_MESSAGE',
        type: 'success',
      });
    });

    it('shows an error notification when queueing fails', async () => {
      mockQueueReport.mockResolvedValue(false);
      const { result } = renderHook(() =>
        useReportTableState([reportA], NO_FILTERS, ['PDF', 'CSV'], undefined),
      );
      act(() => {
        result.current.updateRow(reportA.id, { format: 'PDF' });
      });

      await act(async () => {
        await result.current.handleQueueReport(reportA);
      });

      expect(addNotification).toHaveBeenCalledWith({
        title: 'REPORTS_ERROR_TITLE',
        message: 'REPORTS_QUEUE_ERROR_MESSAGE',
        type: 'error',
      });
    });

    it('does not queue when validation fails', async () => {
      const { result } = renderHook(() =>
        useReportTableState([reportA], NO_FILTERS, ['PDF', 'CSV'], undefined),
      );

      await act(async () => {
        await result.current.handleQueueReport(reportA);
      });

      expect(mockQueueReport).not.toHaveBeenCalled();
      expect(addNotification).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'REPORTS_VALIDATION_ERROR_TITLE' }),
      );
    });
  });

  describe('custom Excel template handling', () => {
    const reportCustomExcel: ReportDefinition & { id: string } = {
      id: 'report-custom-excel',
      name: 'Custom Excel Report',
      type: 'sql',
      config: { dateRangeRequired: false },
    };

    it('uploads a template and stores its location on the row', async () => {
      const { result } = renderHook(() =>
        useReportTableState(
          [reportCustomExcel],
          NO_FILTERS,
          ['PDF', 'CUSTOM EXCEL'],
          undefined,
        ),
      );
      const file = new File(['content'], 'template.xlsx');

      await act(async () => {
        await result.current.handleTemplateUpload(reportCustomExcel, file);
      });

      expect(mockUploadReportTemplate).toHaveBeenCalledWith(file);
      expect(
        result.current.rowFilters(reportCustomExcel.id).templateLocation,
      ).toBe('uploaded-template.xlsx');
    });

    it('shows an error notification when the upload fails', async () => {
      mockUploadReportTemplate.mockRejectedValue(new Error('boom'));
      const { result } = renderHook(() =>
        useReportTableState(
          [reportCustomExcel],
          NO_FILTERS,
          ['PDF', 'CUSTOM EXCEL'],
          undefined,
        ),
      );
      const file = new File(['content'], 'template.xlsx');

      await act(async () => {
        await result.current.handleTemplateUpload(reportCustomExcel, file);
      });

      expect(addNotification).toHaveBeenCalledWith({
        title: 'REPORTS_ERROR_TITLE',
        message: 'REPORTS_UPLOAD_ERROR',
        type: 'error',
      });
      expect(
        result.current.rowFilters(reportCustomExcel.id).templateLocation,
      ).toBeUndefined();
    });

    it('fails validation and does not run when CUSTOM EXCEL has no template', () => {
      const { result } = renderHook(() =>
        useReportTableState(
          [reportCustomExcel],
          NO_FILTERS,
          ['PDF', 'CUSTOM EXCEL'],
          undefined,
        ),
      );
      act(() => {
        result.current.updateRow(reportCustomExcel.id, {
          format: 'CUSTOM EXCEL',
        });
      });

      act(() => {
        result.current.handleRunReport(reportCustomExcel);
      });

      expect(mockRunReport).not.toHaveBeenCalled();
      expect(addNotification).toHaveBeenCalledWith({
        title: 'REPORTS_VALIDATION_ERROR_TITLE',
        message: 'REPORTS_MISSING_TEMPLATE_ERROR',
        type: 'error',
      });
    });

    it('resets the format and clears the template after a successful CUSTOM EXCEL run', async () => {
      const { result } = renderHook(() =>
        useReportTableState(
          [reportCustomExcel],
          NO_FILTERS,
          ['PDF', 'CUSTOM EXCEL'],
          undefined,
        ),
      );
      const file = new File(['content'], 'template.xlsx');
      await act(async () => {
        await result.current.handleTemplateUpload(reportCustomExcel, file);
      });
      act(() => {
        result.current.updateRow(reportCustomExcel.id, {
          format: 'CUSTOM EXCEL',
        });
      });

      act(() => {
        result.current.handleRunReport(reportCustomExcel);
      });

      expect(mockRunReport).toHaveBeenCalledWith(
        reportCustomExcel,
        'CUSTOM EXCEL',
        null,
        null,
        undefined,
        'uploaded-template.xlsx',
      );
      expect(result.current.rowFilters(reportCustomExcel.id)).toEqual(
        expect.objectContaining({ format: 'PDF', templateLocation: null }),
      );
    });
  });
});
