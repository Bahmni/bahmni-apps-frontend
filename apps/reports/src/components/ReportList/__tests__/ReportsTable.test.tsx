import { useNotification } from '@bahmni/widgets';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import type { AppliedFilters, FormatKey, ReportDefinition } from '../models';
import ReportsTable from '../ReportsTable';

expect.extend(toHaveNoViolations);

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

jest.mock('../styles/ReportsTable.module.scss', () => ({}), { virtual: true });

const mockRunReport = jest.fn();
jest.mock('../hooks/useRunReport', () => ({
  useRunReport: () => ({ runReport: mockRunReport }),
}));

// Mirrors the real Dropdown/DatePicker contract closely enough to drive
// onChange/value without depending on Carbon's flatpickr/floating-ui internals.
jest.mock('@bahmni/design-system', () => {
  const actual = jest.requireActual('@bahmni/design-system');
  return {
    ...actual,
    Dropdown: ({
      id,
      items,
      itemToString,
      selectedItem,
      invalid,
      invalidText,
      onChange,
    }: {
      id: string;
      items: unknown[];
      itemToString: (item: unknown) => string;
      selectedItem?: unknown;
      invalid?: boolean;
      invalidText?: string;
      onChange: (data: { selectedItem: unknown }) => void;
    }) => (
      <div>
        <select
          id={id}
          aria-label={id}
          value={selectedItem ? String(selectedItem) : ''}
          onChange={(e) => {
            const raw = e.target.value;
            if (!raw) {
              onChange({ selectedItem: null });
              return;
            }
            const match = items.find((item) => String(item) === raw);
            onChange({ selectedItem: match ?? raw });
          }}
        >
          <option value="">{itemToString(null)}</option>
          {items.map((item) => (
            <option key={String(item)} value={String(item)}>
              {itemToString(item)}
            </option>
          ))}
        </select>
        {invalid && <span data-testid={`error-${id}`}>{invalidText}</span>}
      </div>
    ),
    DatePicker: ({
      children,
      onChange,
      value,
    }: {
      children: React.ReactElement<{ id: string }>;
      onChange: (dates: Date[]) => void;
      value?: Date;
    }) => (
      <div>
        <span data-testid={`value-${children.props.id}`}>
          {value ? value.toISOString() : ''}
        </span>
        {children}
        <button
          type="button"
          aria-label={`set-${children.props.id}`}
          onClick={() => onChange([new Date('2024-03-10')])}
        >
          set
        </button>
        <button
          type="button"
          aria-label={`clear-${children.props.id}`}
          onClick={() => onChange([])}
        >
          clear
        </button>
      </div>
    ),
    DatePickerInput: ({
      id,
      invalid,
      invalidText,
    }: {
      id: string;
      invalid?: boolean;
      invalidText?: string;
    }) => (
      <div>
        <input id={id} aria-label={id} readOnly value="" />
        {invalid && <span data-testid={`error-${id}`}>{invalidText}</span>}
      </div>
    ),
  };
});

const mockUseNotification = useNotification as jest.MockedFunction<
  typeof useNotification
>;

const NO_FILTERS: AppliedFilters = {
  startDate: null,
  endDate: null,
  format: null,
  version: 0,
};

const availableFormats: FormatKey[] = ['PDF', 'CSV', 'HTML'];

const reportWithDates: ReportDefinition & { id: string } = {
  id: 'r-date',
  name: 'Diagnosis Summary',
  type: 'aggregation',
  config: { dateRangeRequired: true },
};

const reportNoDates: ReportDefinition & { id: string } = {
  id: 'r-nodate',
  name: 'Patient List',
  type: 'sql',
  config: { dateRangeRequired: false },
};

const reportConcatenated: ReportDefinition & { id: string } = {
  id: 'r-concat',
  name: 'Concatenated Visit Report',
  type: 'concatenated',
  config: { dateRangeRequired: true },
};

const setRowDate = async (
  user: ReturnType<typeof userEvent.setup>,
  id: string,
) => {
  await user.click(screen.getByRole('button', { name: `set-${id}` }));
};

const setRowFormat = async (
  user: ReturnType<typeof userEvent.setup>,
  id: string,
  format: FormatKey,
) => {
  await user.selectOptions(screen.getByLabelText(id), format);
};

const runRow = async (
  user: ReturnType<typeof userEvent.setup>,
  row: HTMLElement,
) => {
  await user.click(within(row).getByRole('button', { name: 'Options' }));
  await user.click(screen.getByText('REPORTS_RUN_BUTTON_LABEL'));
};

describe('ReportsTable', () => {
  const addNotification = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockRunReport.mockReturnValue(true);
    mockUseNotification.mockReturnValue({
      notifications: [],
      addNotification,
      removeNotification: jest.fn(),
      clearAllNotifications: jest.fn(),
    });
  });

  it('renders the empty state when there are no reports', () => {
    render(
      <ReportsTable
        reports={[]}
        appliedFilters={NO_FILTERS}
        availableFormats={availableFormats}
      />,
    );
    expect(screen.getByTestId('reports-table-empty')).toHaveTextContent(
      'REPORTS_NO_REPORTS_IN_SECTION',
    );
    expect(screen.queryByTestId('reports-table')).not.toBeInTheDocument();
  });

  it('renders a row per report with the translated report name', () => {
    render(
      <ReportsTable
        reports={[reportWithDates, reportNoDates]}
        appliedFilters={NO_FILTERS}
        availableFormats={availableFormats}
      />,
    );
    expect(screen.getByTestId('reports-table')).toBeInTheDocument();
    expect(screen.getByText('Diagnosis Summary')).toBeInTheDocument();
    expect(screen.getByText('Patient List')).toBeInTheDocument();
  });

  it('only renders date pickers for reports that require a date range', () => {
    render(
      <ReportsTable
        reports={[reportWithDates, reportNoDates]}
        appliedFilters={NO_FILTERS}
        availableFormats={availableFormats}
      />,
    );
    expect(
      screen.getByLabelText(`row-start-date-${reportWithDates.id}`),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText(`row-start-date-${reportNoDates.id}`),
    ).not.toBeInTheDocument();
  });

  it('omits the Start Date/End Date columns entirely for a no-date-range-only section', () => {
    render(
      <ReportsTable
        reports={[reportNoDates]}
        appliedFilters={NO_FILTERS}
        availableFormats={availableFormats}
      />,
    );

    expect(
      screen.queryByText('REPORTS_START_DATE_LABEL'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('REPORTS_END_DATE_LABEL'),
    ).not.toBeInTheDocument();

    const headerCells = screen.getAllByRole('columnheader');
    expect(headerCells).toHaveLength(3);
    expect(headerCells.map((cell) => cell.textContent)).toEqual([
      'REPORTS_NAME_HEADER',
      'REPORTS_FORMAT_LABEL',
      'REPORTS_ACTIONS_HEADER',
    ]);

    const row = screen.getByText('Patient List').closest('tr')!;
    expect(within(row).getAllByRole('cell')).toHaveLength(3);
  });

  it('clears a row date override to null when its date picker is cleared', async () => {
    const user = userEvent.setup();
    render(
      <ReportsTable
        reports={[reportWithDates]}
        appliedFilters={NO_FILTERS}
        availableFormats={availableFormats}
      />,
    );

    await setRowDate(user, `row-start-date-${reportWithDates.id}`);
    expect(
      screen.getByTestId(`value-row-start-date-${reportWithDates.id}`),
    ).toHaveTextContent(new Date('2024-03-10').toISOString());

    await user.click(
      screen.getByRole('button', {
        name: `clear-row-start-date-${reportWithDates.id}`,
      }),
    );
    expect(
      screen.getByTestId(`value-row-start-date-${reportWithDates.id}`),
    ).toHaveTextContent('');

    await setRowDate(user, `row-end-date-${reportWithDates.id}`);
    await user.click(
      screen.getByRole('button', {
        name: `clear-row-end-date-${reportWithDates.id}`,
      }),
    );
    expect(
      screen.getByTestId(`value-row-end-date-${reportWithDates.id}`),
    ).toHaveTextContent('');
  });

  it('applies a row override on date change and resets it when appliedFilters.version changes', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ReportsTable
        reports={[reportWithDates]}
        appliedFilters={NO_FILTERS}
        availableFormats={availableFormats}
      />,
    );

    await setRowDate(user, `row-start-date-${reportWithDates.id}`);
    expect(
      screen.getByTestId(`value-row-start-date-${reportWithDates.id}`),
    ).toHaveTextContent(new Date('2024-03-10').toISOString());

    rerender(
      <ReportsTable
        reports={[reportWithDates]}
        appliedFilters={{ ...NO_FILTERS, version: 1 }}
        availableFormats={availableFormats}
      />,
    );

    expect(
      screen.getByTestId(`value-row-start-date-${reportWithDates.id}`),
    ).toHaveTextContent('');
  });

  it('clears a field error once the field is edited', async () => {
    const user = userEvent.setup();
    render(
      <ReportsTable
        reports={[reportWithDates]}
        appliedFilters={NO_FILTERS}
        availableFormats={availableFormats}
      />,
    );

    const row = screen.getByText('Diagnosis Summary').closest('tr')!;
    await runRow(user, row);
    expect(
      screen.getByTestId(`error-row-format-${reportWithDates.id}`),
    ).toBeInTheDocument();

    await setRowFormat(user, `row-format-${reportWithDates.id}`, 'PDF');
    expect(
      screen.queryByTestId(`error-row-format-${reportWithDates.id}`),
    ).not.toBeInTheDocument();
  });

  it('discards the stale row-level error entry once a fixed-up run succeeds', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    jest.useFakeTimers({ legacyFakeTimers: false });
    render(
      <ReportsTable
        reports={[reportWithDates]}
        appliedFilters={NO_FILTERS}
        availableFormats={availableFormats}
      />,
    );

    const row = screen.getByText('Diagnosis Summary').closest('tr')!;
    await runRow(user, row);
    expect(
      screen.getByTestId(`error-row-format-${reportWithDates.id}`),
    ).toBeInTheDocument();

    await setRowFormat(user, `row-format-${reportWithDates.id}`, 'PDF');
    await setRowDate(user, `row-start-date-${reportWithDates.id}`);
    await setRowDate(user, `row-end-date-${reportWithDates.id}`);
    await runRow(user, row);

    expect(mockRunReport).toHaveBeenCalledWith(
      reportWithDates,
      'PDF',
      new Date('2024-03-10'),
      new Date('2024-03-10'),
      undefined,
    );
    expect(
      screen.queryByTestId(`error-row-format-${reportWithDates.id}`),
    ).not.toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    jest.useRealTimers();
  });

  it('shows a validation error and no run when no format is selected', async () => {
    const user = userEvent.setup();
    render(
      <ReportsTable
        reports={[reportWithDates]}
        appliedFilters={NO_FILTERS}
        availableFormats={availableFormats}
      />,
    );
    await setRowDate(user, `row-start-date-${reportWithDates.id}`);
    await setRowDate(user, `row-end-date-${reportWithDates.id}`);

    const row = screen.getByText('Diagnosis Summary').closest('tr')!;
    await runRow(user, row);

    expect(addNotification).toHaveBeenCalledWith({
      title: 'REPORTS_VALIDATION_ERROR_TITLE',
      message: 'REPORTS_SELECT_FORMAT_ERROR',
      type: 'error',
    });
    expect(
      screen.getByTestId(`error-row-format-${reportWithDates.id}`),
    ).toHaveTextContent('REPORTS_SELECT_FORMAT_ERROR');
    expect(mockRunReport).not.toHaveBeenCalled();
  });

  it('flags both date fields when neither date is set', async () => {
    const user = userEvent.setup();
    render(
      <ReportsTable
        reports={[reportWithDates]}
        appliedFilters={NO_FILTERS}
        availableFormats={availableFormats}
      />,
    );
    await setRowFormat(user, `row-format-${reportWithDates.id}`, 'PDF');

    const row = screen.getByText('Diagnosis Summary').closest('tr')!;
    await runRow(user, row);

    expect(addNotification).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'REPORTS_MISSING_BOTH_DATES_ERROR' }),
    );
    expect(
      screen.getByTestId(`error-row-start-date-${reportWithDates.id}`),
    ).toHaveTextContent('REPORTS_MISSING_BOTH_DATES_ERROR');
    expect(
      screen.getByTestId(`error-row-end-date-${reportWithDates.id}`),
    ).toHaveTextContent('REPORTS_MISSING_BOTH_DATES_ERROR');
  });

  it('flags only the start date when the end date is present but the start date is missing', async () => {
    const user = userEvent.setup();
    render(
      <ReportsTable
        reports={[reportWithDates]}
        appliedFilters={NO_FILTERS}
        availableFormats={availableFormats}
      />,
    );
    await setRowFormat(user, `row-format-${reportWithDates.id}`, 'PDF');
    await setRowDate(user, `row-end-date-${reportWithDates.id}`);

    const row = screen.getByText('Diagnosis Summary').closest('tr')!;
    await runRow(user, row);

    expect(addNotification).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'REPORTS_MISSING_START_DATE_ERROR' }),
    );
    expect(
      screen.getByTestId(`error-row-start-date-${reportWithDates.id}`),
    ).toHaveTextContent('REPORTS_MISSING_START_DATE_ERROR');
    expect(
      screen.queryByTestId(`error-row-end-date-${reportWithDates.id}`),
    ).not.toBeInTheDocument();
  });

  it('flags only the end date when the start date is present but the end date is missing', async () => {
    const user = userEvent.setup();
    render(
      <ReportsTable
        reports={[reportWithDates]}
        appliedFilters={NO_FILTERS}
        availableFormats={availableFormats}
      />,
    );
    await setRowFormat(user, `row-format-${reportWithDates.id}`, 'PDF');
    await setRowDate(user, `row-start-date-${reportWithDates.id}`);

    const row = screen.getByText('Diagnosis Summary').closest('tr')!;
    await runRow(user, row);

    expect(addNotification).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'REPORTS_MISSING_END_DATE_ERROR' }),
    );
    expect(
      screen.getByTestId(`error-row-end-date-${reportWithDates.id}`),
    ).toHaveTextContent('REPORTS_MISSING_END_DATE_ERROR');
    expect(
      screen.queryByTestId(`error-row-start-date-${reportWithDates.id}`),
    ).not.toBeInTheDocument();
  });

  it('flags the end date when the start date is after the end date', async () => {
    const user = userEvent.setup();
    render(
      <ReportsTable
        reports={[reportWithDates]}
        appliedFilters={{
          ...NO_FILTERS,
          startDate: new Date('2024-03-31'),
          endDate: new Date('2024-03-01'),
        }}
        availableFormats={availableFormats}
      />,
    );
    await setRowFormat(user, `row-format-${reportWithDates.id}`, 'PDF');

    const row = screen.getByText('Diagnosis Summary').closest('tr')!;
    await runRow(user, row);

    expect(addNotification).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'REPORTS_DATE_ORDER_ERROR' }),
    );
    expect(
      screen.getByTestId(`error-row-end-date-${reportWithDates.id}`),
    ).toHaveTextContent('REPORTS_DATE_ORDER_ERROR');
  });

  it('shows a validation error without a field-level error for CSV on a concatenated report', async () => {
    const user = userEvent.setup();
    render(
      <ReportsTable
        reports={[reportConcatenated]}
        appliedFilters={{
          ...NO_FILTERS,
          startDate: new Date('2024-03-01'),
          endDate: new Date('2024-03-31'),
        }}
        availableFormats={availableFormats}
      />,
    );
    await setRowFormat(user, `row-format-${reportConcatenated.id}`, 'CSV');

    const row = screen.getByText('Concatenated Visit Report').closest('tr')!;
    await runRow(user, row);

    expect(addNotification).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'REPORTS_CSV_NOT_SUPPORTED_ERROR' }),
    );
    expect(
      screen.queryByTestId(`error-row-format-${reportConcatenated.id}`),
    ).not.toBeInTheDocument();
    expect(mockRunReport).not.toHaveBeenCalled();
  });

  it('runs the report with the row filters and shows a loading state while running', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    jest.useFakeTimers({ legacyFakeTimers: false });

    render(
      <ReportsTable
        reports={[reportWithDates]}
        appliedFilters={NO_FILTERS}
        availableFormats={availableFormats}
      />,
    );
    await setRowFormat(user, `row-format-${reportWithDates.id}`, 'PDF');
    await setRowDate(user, `row-start-date-${reportWithDates.id}`);
    await setRowDate(user, `row-end-date-${reportWithDates.id}`);

    const row = screen.getByText('Diagnosis Summary').closest('tr')!;
    await user.click(within(row).getByRole('button', { name: 'Options' }));
    await user.click(screen.getByText('REPORTS_RUN_BUTTON_LABEL'));

    expect(mockRunReport).toHaveBeenCalledWith(
      reportWithDates,
      'PDF',
      new Date('2024-03-10'),
      new Date('2024-03-10'),
      undefined,
    );
    expect(addNotification).not.toHaveBeenCalled();
    expect(
      screen.getByText('REPORTS_RUNNING_LOADING_LABEL'),
    ).toBeInTheDocument();
    expect(
      within(row).queryByRole('button', { name: 'Options' }),
    ).not.toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    expect(
      screen.queryByText('REPORTS_RUNNING_LOADING_LABEL'),
    ).not.toBeInTheDocument();
    expect(
      within(row).getByRole('button', { name: 'Options' }),
    ).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('passes the app-level default paper size through to runReport', async () => {
    const user = userEvent.setup();
    render(
      <ReportsTable
        reports={[reportWithDates]}
        appliedFilters={NO_FILTERS}
        availableFormats={availableFormats}
        defaultPaperSize="A3"
      />,
    );
    await setRowFormat(user, `row-format-${reportWithDates.id}`, 'PDF');
    await setRowDate(user, `row-start-date-${reportWithDates.id}`);
    await setRowDate(user, `row-end-date-${reportWithDates.id}`);

    const row = screen.getByText('Diagnosis Summary').closest('tr')!;
    await runRow(user, row);

    expect(mockRunReport).toHaveBeenCalledWith(
      reportWithDates,
      'PDF',
      new Date('2024-03-10'),
      new Date('2024-03-10'),
      'A3',
    );
  });

  it('shows a pop-up-blocked error and clears the loading state immediately when runReport reports failure', async () => {
    mockRunReport.mockReturnValue(false);
    const user = userEvent.setup();

    render(
      <ReportsTable
        reports={[reportWithDates]}
        appliedFilters={NO_FILTERS}
        availableFormats={availableFormats}
      />,
    );
    await setRowFormat(user, `row-format-${reportWithDates.id}`, 'PDF');
    await setRowDate(user, `row-start-date-${reportWithDates.id}`);
    await setRowDate(user, `row-end-date-${reportWithDates.id}`);

    const row = screen.getByText('Diagnosis Summary').closest('tr')!;
    await runRow(user, row);

    expect(mockRunReport).toHaveBeenCalled();
    expect(addNotification).toHaveBeenCalledWith({
      title: 'REPORTS_ERROR_TITLE',
      message: 'REPORTS_POPUP_BLOCKED_ERROR',
      type: 'error',
    });
    expect(
      screen.queryByText('REPORTS_RUNNING_LOADING_LABEL'),
    ).not.toBeInTheDocument();
    expect(
      within(row).getByRole('button', { name: 'Options' }),
    ).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <ReportsTable
        reports={[reportWithDates, reportNoDates]}
        appliedFilters={NO_FILTERS}
        availableFormats={availableFormats}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
