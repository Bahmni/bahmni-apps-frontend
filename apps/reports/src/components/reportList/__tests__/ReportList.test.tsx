import { useNotification, useUserPrivilege } from '@bahmni/widgets';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useReportsAppConfig } from '../hooks/useReportsAppConfig';
import { useReportsConfig } from '../hooks/useReportsConfig';
import type { ReportsConfig } from '../models';
import { ReportList } from '../ReportList';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useUserPrivilege: jest.fn(),
  useNotification: jest.fn(),
}));

jest.mock('../hooks/useReportsConfig', () => ({
  useReportsConfig: jest.fn(),
}));
jest.mock('../hooks/useReportsAppConfig', () => ({
  useReportsAppConfig: jest.fn(),
}));

jest.mock('../styles/ReportList.module.scss', () => ({}), { virtual: true });

jest.mock('../TableFilters', () => ({
  __esModule: true,
  default: (props: {
    availableFormats: string[];
    onStartDateChange: (date: Date | null) => void;
    onEndDateChange: (date: Date | null) => void;
    onFormatChange: (format: string | null) => void;
    onApply: () => void;
    onReset: () => void;
  }) => (
    <div data-testid="table-filters-stub">
      <span data-testid="tf-formats">{props.availableFormats.join(',')}</span>
      <button onClick={() => props.onStartDateChange(new Date('2024-03-01'))}>
        set-start
      </button>
      <button onClick={() => props.onEndDateChange(new Date('2024-03-31'))}>
        set-end
      </button>
      <button onClick={() => props.onFormatChange('PDF')}>set-format</button>
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
  }) => (
    <div data-testid="reports-table-stub">
      <span data-testid="rt-count">{props.reports.length}</span>
      <span data-testid="rt-version">{props.appliedFilters.version}</span>
      <span data-testid="rt-start">
        {props.appliedFilters.startDate?.toISOString() ?? ''}
      </span>
      <span data-testid="rt-format">{props.appliedFilters.format ?? ''}</span>
      <span data-testid="rt-formats">{props.availableFormats.join(',')}</span>
    </div>
  ),
}));

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
      data: { supportedFormats: ['pdf', 'csv'] },
    } as ReturnType<typeof useReportsAppConfig>);
  });

  it('shows the loading skeleton while the reports config is loading', () => {
    mockUseReportsConfig.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as ReturnType<typeof useReportsConfig>);

    // The design-system CodeSnippetSkeleton wrapper drops a literal
    // `data-testid` prop (only its own `testId` prop survives), so we assert
    // on the `id` prop instead of `getByTestId` here.
    const { container } = render(<ReportList />);
    expect(
      container.querySelector('#reports-config-loading'),
    ).toBeInTheDocument();
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

    const { container } = render(<ReportList />);
    expect(
      container.querySelector('#reports-config-loading'),
    ).toBeInTheDocument();
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

  it('filters reports by privilege and resolves supported formats for the filters and table', () => {
    mockUseReportsConfig.mockReturnValue({
      data: reportsConfig,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useReportsConfig>);

    render(<ReportList />);

    expect(screen.getByTestId('rt-count')).toHaveTextContent('1');
    expect(screen.getByTestId('tf-formats')).toHaveTextContent('PDF,CSV');
    expect(screen.getByTestId('rt-formats')).toHaveTextContent('PDF,CSV');
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

    expect(screen.getByTestId('rt-version')).toHaveTextContent('1');
    expect(screen.getByTestId('rt-start')).toHaveTextContent(
      new Date('2024-03-01').toISOString(),
    );
    expect(screen.getByTestId('rt-format')).toHaveTextContent('PDF');
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
    await user.click(screen.getByText('apply'));
    expect(screen.getByTestId('rt-version')).toHaveTextContent('1');

    await user.click(screen.getByText('reset'));

    expect(screen.getByTestId('rt-version')).toHaveTextContent('2');
    expect(screen.getByTestId('rt-start')).toHaveTextContent('');
    expect(screen.getByTestId('rt-format')).toHaveTextContent('');
  });
});
