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

const mockQueueReportMutate = jest.fn();
jest.mock('../useQueueReport', () => ({
  useQueueReport: () => ({ mutate: mockQueueReportMutate }),
}));

const mockUploadTemplateMutate = jest.fn();
jest.mock('../useUploadReportTemplate', () => ({
  useUploadReportTemplate: () => ({ mutate: mockUploadTemplateMutate }),
}));

const mockUseNotification = useNotification as jest.MockedFunction<
  typeof useNotification
>;

const NO_FILTERS: AppliedFilters = {
  startDate: null,
  endDate: null,
  format: null,
  reportTemplateLocation: null,
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
      reportTemplateLocation: null,
    });

    act(() => {
      result.current.updateRow(reportA.id, { format: 'CSV' });
    });
    expect(result.current.rowFilters(reportA.id)).toEqual({
      startDate: null,
      endDate: null,
      format: 'CSV',
      reportTemplateLocation: null,
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

  describe('custom Excel template handling', () => {
    const customExcelReport: ReportDefinition & { id: string } = {
      id: 'report-custom',
      name: 'Custom Excel Report',
      type: 'visits',
      config: { dateRangeRequired: false },
    };

    it('surfaces a template error and does not run when Custom Excel has no uploaded or pre-configured template', () => {
      const { result } = renderHook(() =>
        useReportTableState([customExcelReport], NO_FILTERS, undefined),
      );

      act(() => {
        result.current.updateRow(customExcelReport.id, {
          format: 'CUSTOM EXCEL',
        });
      });
      act(() => {
        result.current.handleRunReport(customExcelReport);
      });

      expect(result.current.errors(customExcelReport.id)?.template).toBe(
        'REPORTS_MISSING_TEMPLATE_ERROR',
      );
      expect(mockRunReport).not.toHaveBeenCalled();
    });

    it('falls back to the pre-configured macro template path when none was uploaded', () => {
      const preconfiguredReport: ReportDefinition & { id: string } = {
        id: 'report-preconfigured',
        name: 'Preconfigured Report',
        type: 'visits',
        config: { dateRangeRequired: false, macroTemplatePath: 'preset.xlsx' },
      };
      const { result } = renderHook(() =>
        useReportTableState([preconfiguredReport], NO_FILTERS, undefined),
      );

      act(() => {
        result.current.updateRow(preconfiguredReport.id, {
          format: 'CUSTOM EXCEL',
        });
      });
      act(() => {
        result.current.handleRunReport(preconfiguredReport);
      });

      expect(mockRunReport).toHaveBeenCalledWith(
        preconfiguredReport,
        'CUSTOM EXCEL',
        null,
        null,
        undefined,
        'preset.xlsx',
      );
    });

    it('clears the uploaded template and resets the format after a successful Custom Excel run', () => {
      const { result } = renderHook(() =>
        useReportTableState([customExcelReport], NO_FILTERS, undefined),
      );

      act(() => {
        result.current.updateRow(customExcelReport.id, {
          format: 'CUSTOM EXCEL',
          reportTemplateLocation: 'uploaded.xlsx',
        });
      });
      act(() => {
        result.current.handleRunReport(customExcelReport);
      });

      expect(mockRunReport).toHaveBeenCalledWith(
        customExcelReport,
        'CUSTOM EXCEL',
        null,
        null,
        undefined,
        'uploaded.xlsx',
      );
      expect(result.current.rowFilters(customExcelReport.id)).toEqual({
        startDate: null,
        endDate: null,
        format: null,
        reportTemplateLocation: null,
      });
    });
  });

  describe('handleTemplateUpload', () => {
    it('stores the uploaded template location on the row and clears its template error on success', () => {
      const { result } = renderHook(() =>
        useReportTableState([reportA], NO_FILTERS, undefined),
      );
      const file = new File(['contents'], 'template.xlsx');

      act(() => {
        result.current.handleTemplateUpload(reportA, file);
      });

      const [uploadedFile, callbacks] = mockUploadTemplateMutate.mock.calls[0];
      expect(uploadedFile).toBe(file);

      act(() => {
        callbacks.onSuccess('uploaded.xlsx');
      });

      expect(result.current.rowFilters(reportA.id).reportTemplateLocation).toBe(
        'uploaded.xlsx',
      );
    });

    it('shows an error notification when the upload fails', () => {
      const addNotification = jest.fn();
      mockUseNotification.mockReturnValue({
        notifications: [],
        addNotification,
        removeNotification: jest.fn(),
        clearAllNotifications: jest.fn(),
      });
      const { result } = renderHook(() =>
        useReportTableState([reportA], NO_FILTERS, undefined),
      );
      const file = new File(['contents'], 'template.xlsx');

      act(() => {
        result.current.handleTemplateUpload(reportA, file);
      });

      const [, callbacks] = mockUploadTemplateMutate.mock.calls[0];
      act(() => {
        callbacks.onError();
      });

      expect(addNotification).toHaveBeenCalledWith({
        title: 'REPORTS_ERROR_TITLE',
        message: 'REPORTS_UPLOAD_ERROR',
        type: 'error',
      });
    });
  });

  describe('handleQueueReport', () => {
    const report = reportA;

    it('validates before queueing and surfaces an error without calling the mutation', () => {
      const { result } = renderHook(() =>
        useReportTableState([report], NO_FILTERS, undefined),
      );

      act(() => {
        result.current.handleQueueReport(report);
      });

      expect(result.current.errors(report.id)?.format).toBe(
        'REPORTS_SELECT_FORMAT_ERROR',
      );
      expect(mockQueueReportMutate).not.toHaveBeenCalled();
    });

    it('calls the queue mutation with the resolved row filters and marks the row as queueing', () => {
      const { result } = renderHook(() =>
        useReportTableState([report], NO_FILTERS, undefined),
      );

      act(() => {
        result.current.updateRow(report.id, { format: 'PDF' });
      });
      act(() => {
        result.current.handleQueueReport(report);
      });

      expect(result.current.isQueueing(report.id)).toBe(true);
      expect(mockQueueReportMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          report,
          format: 'PDF',
          reportTemplateLocation: null,
        }),
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onSettled: expect.any(Function),
        }),
      );
    });

    it('clears the queueing flag and resets the template on settle/success for Custom Excel', () => {
      const { result } = renderHook(() =>
        useReportTableState([report], NO_FILTERS, undefined),
      );

      act(() => {
        result.current.updateRow(report.id, {
          format: 'CUSTOM EXCEL',
          reportTemplateLocation: 'uploaded.xlsx',
        });
      });
      act(() => {
        result.current.handleQueueReport(report);
      });

      const [, callbacks] = mockQueueReportMutate.mock.calls[0];
      act(() => {
        callbacks.onSuccess();
        callbacks.onSettled();
      });

      expect(result.current.isQueueing(report.id)).toBe(false);
      expect(result.current.rowFilters(report.id)).toEqual({
        startDate: null,
        endDate: null,
        format: null,
        reportTemplateLocation: null,
      });
    });

    it('does not clobber a row the user changed while the queue request was in flight', () => {
      const { result } = renderHook(() =>
        useReportTableState([report], NO_FILTERS, undefined),
      );

      act(() => {
        result.current.updateRow(report.id, {
          format: 'CUSTOM EXCEL',
          reportTemplateLocation: 'uploaded.xlsx',
        });
      });
      act(() => {
        result.current.handleQueueReport(report);
      });

      // User edits the row again before the in-flight request resolves.
      act(() => {
        result.current.updateRow(report.id, {
          format: 'PDF',
          reportTemplateLocation: null,
        });
      });

      const [, callbacks] = mockQueueReportMutate.mock.calls[0];
      act(() => {
        callbacks.onSuccess();
      });

      expect(result.current.rowFilters(report.id)).toEqual({
        startDate: null,
        endDate: null,
        format: 'PDF',
        reportTemplateLocation: null,
      });
    });
  });
});
