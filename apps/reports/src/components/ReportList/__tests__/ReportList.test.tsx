import { useNotification, useUserPrivilege } from '@bahmni/widgets';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useReportsAppConfig } from '../../../hooks/useReportsAppConfig';
import { useReportsConfig } from '../../../hooks/useReportsConfig';
import type { ReportsConfig } from '../models';
import { ReportList } from '../ReportList';

expect.extend(toHaveNoViolations);

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useUserPrivilege: jest.fn(),
  useNotification: jest.fn(),
}));

jest.mock('../../../hooks/useReportsConfig', () => ({
  useReportsConfig: jest.fn(),
}));
jest.mock('../../../hooks/useReportsAppConfig', () => ({
  useReportsAppConfig: jest.fn(),
}));

jest.mock('../styles/ReportList.module.scss', () => ({}), { virtual: true });

jest.mock('../TableFilters', () => ({
  __esModule: true,
  default: (props: {
    availableFormats: string[];
    selectedPreset: string | null;
    onStartDateChange: (date: Date | null) => void;
    onEndDateChange: (date: Date | null) => void;
    onFormatChange: (format: string | null) => void;
    onPresetChange: (preset: string | null) => void;
    onApply: () => void;
    onReset: () => void;
  }) => (
    <div data-testid="table-filters-stub">
      <span data-testid="tf-formats">{props.availableFormats.join(',')}</span>
      <span data-testid="tf-preset">{props.selectedPreset ?? ''}</span>
      <button onClick={() => props.onStartDateChange(new Date('2024-03-01'))}>
        set-start
      </button>
      <button onClick={() => props.onEndDateChange(new Date('2024-03-31'))}>
        set-end
      </button>
      <button onClick={() => props.onFormatChange('PDF')}>set-format</button>
      <button onClick={() => props.onPresetChange('TODAY')}>set-preset</button>
      <button onClick={props.onApply}>apply</button>
      <button onClick={props.onReset}>reset</button>
    </div>
  ),
}));

jest.mock('../ReportsTable', () => ({
  __esModule: true,
  default: (props: {
    reports: Array<{ id: string }>;
    appliedFilters: {
      version: number;
      startDate: Date | null;
      endDate: Date | null;
      format: string | null;
    };
    availableFormats: string[];
    defaultPaperSize?: string;
  }) => (
    <div data-testid="reports-table-stub">
      <span data-testid="rt-count">{props.reports.length}</span>
      <span data-testid="rt-version">{props.appliedFilters.version}</span>
      <span data-testid="rt-start">
        {props.appliedFilters.startDate?.toISOString() ?? ''}
      </span>
      <span data-testid="rt-format">{props.appliedFilters.format ?? ''}</span>
      <span data-testid="rt-formats">{props.availableFormats.join(',')}</span>
      <span data-testid="rt-paper-size">{props.defaultPaperSize ?? ''}</span>
    </div>
  ),
}));

const getDateRangeSection = () =>
  screen.getByTestId('reports-date-range-section');
const getNoDateRangeSection = () =>
  screen.getByTestId('reports-no-date-range-section');

const mockUseUserPrivilege = useUserPrivilege as jest.MockedFunction<
  typeof useUserPrivilege
>;
const mockUseNotification = useNotification as jest.MockedFunction<
  typeof useNotification
>;
const mockUseReportsConfig = useReportsConfig as jest.MockedFunction<
  typeof useReportsConfig
>;
const mockUseReportsAppConfig = useReportsAppConfig as jest.MockedFunction<
  typeof useReportsAppConfig
>;

const reportsConfig: ReportsConfig = {
  visible: {
    name: 'Visible Report',
    type: 'visits',
    requiredPrivilege: 'app:reports',
    config: {},
  },
  hidden: {
    name: 'Hidden Report',
    type: 'visits',
    requiredPrivilege: 'app:finance',
    config: {},
  },
};

describe('ReportList', () => {
  const addNotification = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUserPrivilege.mockReturnValue({
      userPrivileges: [{ uuid: 'p1', name: 'app:reports' }],
      isLoading: false,
      error: null,
      setUserPrivileges: jest.fn(),
      setIsLoading: jest.fn(),
      setError: jest.fn(),
    });
    mockUseNotification.mockReturnValue({
      notifications: [],
      addNotification,
      removeNotification: jest.fn(),
      clearAllNotifications: jest.fn(),
    });
    mockUseReportsAppConfig.mockReturnValue({
      data: { config: { supportedFormats: ['pdf', 'csv'], paperSize: 'A3' } },
    } as ReturnType<typeof useReportsAppConfig>);
  });

  it('shows the loading skeleton while the reports config is loading', () => {
    mockUseReportsConfig.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as ReturnType<typeof useReportsConfig>);

    render(<ReportList />);
    expect(screen.getByTestId('reports-config-loading')).toBeInTheDocument();
  });

  it('shows the loading skeleton while privileges are loading', () => {
    mockUseUserPrivilege.mockReturnValue({
      userPrivileges: [],
      isLoading: true,
      error: null,
      setUserPrivileges: jest.fn(),
      setIsLoading: jest.fn(),
      setError: jest.fn(),
    });
    mockUseReportsConfig.mockReturnValue({
      data: reportsConfig,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useReportsConfig>);

    render(<ReportList />);
    expect(screen.getByTestId('reports-config-loading')).toBeInTheDocument();
  });

  it('notifies and renders nothing when the reports config fails to load', () => {
    mockUseReportsConfig.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('failed'),
    } as ReturnType<typeof useReportsConfig>);

    const { container } = render(<ReportList />);
    expect(addNotification).toHaveBeenCalledWith({
      title: 'REPORTS_ERROR_TITLE',
      message: 'REPORTS_CONFIG_LOAD_ERROR',
      type: 'error',
    });
    expect(container).toBeEmptyDOMElement();
  });

  it('shows an empty state when the reports config has no entries', () => {
    mockUseReportsConfig.mockReturnValue({
      data: {},
      isLoading: false,
      error: null,
    } as ReturnType<typeof useReportsConfig>);

    render(<ReportList />);
    expect(screen.getByTestId('reports-empty-state')).toHaveTextContent(
      'REPORTS_EMPTY_STATE_MESSAGE',
    );
  });

  it('shows an empty state when privilege filtering leaves no visible reports', () => {
    mockUseUserPrivilege.mockReturnValue({
      userPrivileges: [],
      isLoading: false,
      error: null,
      setUserPrivileges: jest.fn(),
      setIsLoading: jest.fn(),
      setError: jest.fn(),
    });
    mockUseReportsConfig.mockReturnValue({
      data: reportsConfig,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useReportsConfig>);

    render(<ReportList />);
    expect(screen.getByTestId('reports-empty-state')).toHaveTextContent(
      'REPORTS_EMPTY_STATE_MESSAGE',
    );
  });

  it('groups reports by date-range requirement across the two accordion sections', () => {
    mockUseReportsConfig.mockReturnValue({
      data: reportsConfig,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useReportsConfig>);

    render(<ReportList />);

    expect(
      within(getDateRangeSection()).getByTestId('rt-count'),
    ).toHaveTextContent('1');
    expect(
      within(getNoDateRangeSection()).getByTestId('rt-count'),
    ).toHaveTextContent('0');
    expect(screen.getByTestId('tf-formats')).toHaveTextContent('PDF,CSV');
    expect(
      within(getDateRangeSection()).getByTestId('rt-formats'),
    ).toHaveTextContent('PDF,CSV');
    expect(
      within(getDateRangeSection()).getByTestId('rt-paper-size'),
    ).toHaveTextContent('A3');
    expect(
      within(getNoDateRangeSection()).getByTestId('rt-paper-size'),
    ).toHaveTextContent('A3');
  });

  it('applies filter changes and bumps the applied-filters version on Apply', async () => {
    const user = userEvent.setup();
    mockUseReportsConfig.mockReturnValue({
      data: reportsConfig,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useReportsConfig>);

    render(<ReportList />);

    await user.click(screen.getByText('set-start'));
    await user.click(screen.getByText('set-end'));
    await user.click(screen.getByText('set-format'));
    await user.click(screen.getByText('apply'));

    const dateRangeSection = getDateRangeSection();
    expect(
      within(dateRangeSection).getByTestId('rt-version'),
    ).toHaveTextContent('1');
    expect(within(dateRangeSection).getByTestId('rt-start')).toHaveTextContent(
      new Date('2024-03-01').toISOString(),
    );
    expect(within(dateRangeSection).getByTestId('rt-format')).toHaveTextContent(
      'PDF',
    );
  });

  it('clears filters and bumps the applied-filters version on Reset', async () => {
    const user = userEvent.setup();
    mockUseReportsConfig.mockReturnValue({
      data: reportsConfig,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useReportsConfig>);

    render(<ReportList />);

    await user.click(screen.getByText('set-start'));
    await user.click(screen.getByText('set-preset'));
    await user.click(screen.getByText('apply'));
    const dateRangeSection = getDateRangeSection();
    expect(
      within(dateRangeSection).getByTestId('rt-version'),
    ).toHaveTextContent('1');
    expect(screen.getByTestId('tf-preset')).toHaveTextContent('TODAY');

    await user.click(screen.getByText('reset'));

    expect(
      within(dateRangeSection).getByTestId('rt-version'),
    ).toHaveTextContent('2');
    expect(within(dateRangeSection).getByTestId('rt-start')).toHaveTextContent(
      '',
    );
    expect(within(dateRangeSection).getByTestId('rt-format')).toHaveTextContent(
      '',
    );
    expect(screen.getByTestId('tf-preset')).toHaveTextContent('');
  });

  it('has no accessibility violations', async () => {
    mockUseReportsConfig.mockReturnValue({
      data: reportsConfig,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useReportsConfig>);

    const { container } = render(<ReportList />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
