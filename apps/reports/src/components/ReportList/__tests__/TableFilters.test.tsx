import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import type { DatePreset } from '../constants';
import type { FormatKey } from '../models';
import TableFilters from '../TableFilters';

expect.extend(toHaveNoViolations);

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../styles/TableFilters.module.scss', () => ({}), { virtual: true });

// Mirrors the real Dropdown/DatePicker contract closely enough to drive
// onChange without depending on Carbon's flatpickr/floating-ui internals.
jest.mock('@bahmni/design-system', () => {
  const actual = jest.requireActual('@bahmni/design-system');
  return {
    ...actual,
    Dropdown: ({
      id,
      titleText,
      items,
      itemToString,
      selectedItem,
      onChange,
    }: {
      id: string;
      titleText: string;
      items: unknown[];
      itemToString: (item: unknown) => string;
      selectedItem?: unknown;
      onChange: (data: { selectedItem: unknown }) => void;
    }) => (
      <div>
        <label htmlFor={id}>{titleText}</label>
        <select
          id={id}
          aria-label={titleText}
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
      </div>
    ),
    DatePicker: ({
      children,
      onChange,
    }: {
      children: React.ReactElement<{ id: string; labelText: string }>;
      onChange: (dates: Date[]) => void;
    }) => (
      <div>
        {children}
        <button
          type="button"
          aria-label={`set-${children.props.id}`}
          onClick={() => onChange([new Date('2024-03-15')])}
        >
          set date
        </button>
        <button
          type="button"
          aria-label={`clear-${children.props.id}`}
          onClick={() => onChange([])}
        >
          clear date
        </button>
      </div>
    ),
    DatePickerInput: ({ id, labelText }: { id: string; labelText: string }) => (
      <input id={id} aria-label={labelText} readOnly value="" />
    ),
  };
});

describe('TableFilters', () => {
  const availableFormats: FormatKey[] = ['PDF', 'CSV', 'HTML'];

  const defaultProps = {
    startDate: null,
    endDate: null,
    format: null as FormatKey | null,
    selectedPreset: null as DatePreset | null,
    availableFormats,
    onStartDateChange: jest.fn(),
    onEndDateChange: jest.fn(),
    onFormatChange: jest.fn(),
    onPresetChange: jest.fn(),
    onReset: jest.fn(),
    onApply: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the filters section with title and controls', () => {
    render(<TableFilters {...defaultProps} />);
    expect(screen.getByTestId('reports-filters')).toBeInTheDocument();
    expect(screen.getByText('REPORTS_FILTERS_LABEL')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'REPORTS_RESET_BUTTON' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'REPORTS_APPLY_BUTTON' }),
    ).toBeInTheDocument();
  });

  it('sets start and end date to today when the "Today" preset is selected', async () => {
    render(<TableFilters {...defaultProps} />);
    await userEvent.selectOptions(
      screen.getByLabelText('REPORTS_SELECT_DATE_RANGE'),
      'TODAY',
    );

    expect(defaultProps.onStartDateChange).toHaveBeenCalledTimes(1);
    expect(defaultProps.onEndDateChange).toHaveBeenCalledTimes(1);
    const [start] = defaultProps.onStartDateChange.mock.calls[0];
    const [end] = defaultProps.onEndDateChange.mock.calls[0];
    expect(start.toDateString()).toBe(end.toDateString());
  });

  it('sets the range to the start of the month through today for the "This Month" preset', async () => {
    render(<TableFilters {...defaultProps} />);
    await userEvent.selectOptions(
      screen.getByLabelText('REPORTS_SELECT_DATE_RANGE'),
      'THIS_MONTH',
    );

    const [start] = defaultProps.onStartDateChange.mock.calls[0];
    expect(start.getDate()).toBe(1);
    const [end] = defaultProps.onEndDateChange.mock.calls[0];
    expect(end.toDateString()).toBe(new Date().toDateString());
  });

  it('sets the range to 7 days ago through today for the "Last 7 Days" preset', async () => {
    render(<TableFilters {...defaultProps} />);
    await userEvent.selectOptions(
      screen.getByLabelText('REPORTS_SELECT_DATE_RANGE'),
      'LAST_7_DAYS',
    );

    const [start] = defaultProps.onStartDateChange.mock.calls[0];
    const expectedStart = new Date();
    expectedStart.setDate(expectedStart.getDate() - 7);
    expect(start.toDateString()).toBe(expectedStart.toDateString());
  });

  it('notifies onPresetChange when a preset is selected or cleared', async () => {
    render(<TableFilters {...defaultProps} />);
    await userEvent.selectOptions(
      screen.getByLabelText('REPORTS_SELECT_DATE_RANGE'),
      'TODAY',
    );
    expect(defaultProps.onPresetChange).toHaveBeenCalledWith('TODAY');

    await userEvent.selectOptions(
      screen.getByLabelText('REPORTS_SELECT_DATE_RANGE'),
      '',
    );
    expect(defaultProps.onPresetChange).toHaveBeenCalledWith(null);
  });

  it('reflects the selectedPreset prop as the dropdown value', () => {
    render(<TableFilters {...defaultProps} selectedPreset="THIS_MONTH" />);
    expect(screen.getByLabelText('REPORTS_SELECT_DATE_RANGE')).toHaveValue(
      'THIS_MONTH',
    );
  });

  it('translates the date range presets via the format i18n keys', () => {
    render(<TableFilters {...defaultProps} />);
    const select = screen.getByLabelText('REPORTS_SELECT_DATE_RANGE');
    expect(
      within(select).getByText('REPORTS_PRESET_TODAY'),
    ).toBeInTheDocument();
    expect(
      within(select).getByText('REPORTS_PRESET_THIS_MONTH'),
    ).toBeInTheDocument();
    expect(
      within(select).getByText('REPORTS_PRESET_LAST_7_DAYS'),
    ).toBeInTheDocument();
  });

  it('does not update dates when the preset selection is cleared', async () => {
    render(<TableFilters {...defaultProps} />);
    await userEvent.selectOptions(
      screen.getByLabelText('REPORTS_SELECT_DATE_RANGE'),
      '',
    );

    expect(defaultProps.onStartDateChange).not.toHaveBeenCalled();
    expect(defaultProps.onEndDateChange).not.toHaveBeenCalled();
  });

  it('calls onStartDateChange and onEndDateChange when the individual date pickers change', async () => {
    render(<TableFilters {...defaultProps} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'set-filter-start-date' }),
    );
    expect(defaultProps.onStartDateChange).toHaveBeenCalledWith(
      new Date('2024-03-15'),
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'set-filter-end-date' }),
    );
    expect(defaultProps.onEndDateChange).toHaveBeenCalledWith(
      new Date('2024-03-15'),
    );
  });

  it('clears the selected preset when a date is manually picked', async () => {
    render(<TableFilters {...defaultProps} selectedPreset="THIS_MONTH" />);

    await userEvent.click(
      screen.getByRole('button', { name: 'set-filter-start-date' }),
    );
    expect(defaultProps.onPresetChange).toHaveBeenCalledWith(null);

    await userEvent.click(
      screen.getByRole('button', { name: 'set-filter-end-date' }),
    );
    expect(defaultProps.onPresetChange).toHaveBeenCalledWith(null);
  });

  it('clears the start/end date to null when the date picker is cleared', async () => {
    render(<TableFilters {...defaultProps} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'clear-filter-start-date' }),
    );
    expect(defaultProps.onStartDateChange).toHaveBeenCalledWith(null);

    await userEvent.click(
      screen.getByRole('button', { name: 'clear-filter-end-date' }),
    );
    expect(defaultProps.onEndDateChange).toHaveBeenCalledWith(null);
  });

  it('calls onFormatChange when a format is selected', async () => {
    render(<TableFilters {...defaultProps} />);
    await userEvent.selectOptions(
      screen.getByLabelText('REPORTS_FORMAT_LABEL'),
      'CSV',
    );

    expect(defaultProps.onFormatChange).toHaveBeenCalledWith('CSV');
  });

  it('calls onReset when the reset button is clicked', async () => {
    render(<TableFilters {...defaultProps} />);
    await userEvent.click(
      screen.getByRole('button', { name: 'REPORTS_RESET_BUTTON' }),
    );
    expect(defaultProps.onReset).toHaveBeenCalledTimes(1);
  });

  it('calls onApply when the apply button is clicked', async () => {
    render(<TableFilters {...defaultProps} />);
    await userEvent.click(
      screen.getByRole('button', { name: 'REPORTS_APPLY_BUTTON' }),
    );
    expect(defaultProps.onApply).toHaveBeenCalledTimes(1);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<TableFilters {...defaultProps} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
