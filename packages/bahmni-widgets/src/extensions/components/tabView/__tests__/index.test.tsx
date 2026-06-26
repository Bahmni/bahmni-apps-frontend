import { render, screen } from '@testing-library/react';
import { useUserPrivilege } from '../../../../userPrivileges/useUserPrivilege';
import { useExtensionConfig, getExtensionWidget } from '../../../index';
import TabView from '../index';
import {
  mockExtensionNoPrivileges,
  mockExtensionUnregisteredType,
  mockExtensionWithIcon,
  mockExtensionWithWidget,
  mockExtensionWithoutIcon,
  mockUserPrivileges,
} from './__mocks__/tabViewMocks';

jest.mock('../../../index');
jest.mock('../../../../userPrivileges/useUserPrivilege');

const mockUseExtensionConfig = useExtensionConfig as jest.MockedFunction<
  typeof useExtensionConfig
>;
const mockUseUserPrivilege = useUserPrivilege as jest.MockedFunction<
  typeof useUserPrivilege
>;
const mockGetExtensionWidget = getExtensionWidget as jest.MockedFunction<
  typeof getExtensionWidget
>;

const MockWidget = () => <div data-testid="mock-widget">Widget</div>;

const defaultPrivilegeContext = {
  userPrivileges: mockUserPrivileges,
  isLoading: false,
  error: null,
  setUserPrivileges: jest.fn(),
  setIsLoading: jest.fn(),
  setError: jest.fn(),
};

describe('TabView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetExtensionWidget.mockReturnValue({
      key: 'sqlSearch',
      component: MockWidget,
    });
  });

  it('returns null when no extensions are visible after privilege filtering', () => {
    mockUseExtensionConfig.mockReturnValue({
      extensions: [mockExtensionWithWidget],
      isLoading: false,
      error: null,
    });
    mockUseUserPrivilege.mockReturnValue({
      ...defaultPrivilegeContext,
      userPrivileges: [{ uuid: 'priv-2', name: 'app:other' }],
    });

    const { container } = render(<TabView />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a tab per visible extension', () => {
    mockUseExtensionConfig.mockReturnValue({
      extensions: [mockExtensionWithWidget, mockExtensionNoPrivileges],
      isLoading: false,
      error: null,
    });
    mockUseUserPrivilege.mockReturnValue(defaultPrivilegeContext);

    render(<TabView />);

    expect(screen.getAllByRole('tab')).toHaveLength(2);
  });

  it('always shows tab with no requiredPrivileges even when userPrivileges is null', () => {
    mockUseExtensionConfig.mockReturnValue({
      extensions: [mockExtensionNoPrivileges],
      isLoading: false,
      error: null,
    });
    mockUseUserPrivilege.mockReturnValue({
      ...defaultPrivilegeContext,
      userPrivileges: null,
    });

    render(<TabView />);

    expect(screen.getAllByRole('tab')).toHaveLength(1);
  });

  it('renders icon when extension has icon set', () => {
    mockUseExtensionConfig.mockReturnValue({
      extensions: [mockExtensionWithIcon],
      isLoading: false,
      error: null,
    });
    mockUseUserPrivilege.mockReturnValue(defaultPrivilegeContext);

    render(<TabView />);

    expect(
      screen.getByRole('img', { name: `${mockExtensionWithIcon.id}-icon` }),
    ).toBeInTheDocument();
  });

  it('does not render icon when extension has no icon', () => {
    mockUseExtensionConfig.mockReturnValue({
      extensions: [mockExtensionWithoutIcon],
      isLoading: false,
      error: null,
    });
    mockUseUserPrivilege.mockReturnValue(defaultPrivilegeContext);

    render(<TabView />);

    expect(
      screen.queryByRole('img', {
        name: `${mockExtensionWithoutIcon.id}-icon`,
      }),
    ).not.toBeInTheDocument();
  });

  it('renders the registered widget in the tab panel', () => {
    mockUseExtensionConfig.mockReturnValue({
      extensions: [mockExtensionWithWidget],
      isLoading: false,
      error: null,
    });
    mockUseUserPrivilege.mockReturnValue(defaultPrivilegeContext);

    render(<TabView />);

    expect(screen.getByTestId('mock-widget')).toBeInTheDocument();
  });

  it('shows not-registered message when no widget found for type', () => {
    mockGetExtensionWidget.mockReturnValue(undefined);
    mockUseExtensionConfig.mockReturnValue({
      extensions: [mockExtensionUnregisteredType],
      isLoading: false,
      error: null,
    });
    mockUseUserPrivilege.mockReturnValue(defaultPrivilegeContext);

    render(<TabView />);

    expect(
      screen.getByTestId('no-registered-extension-message-test-id'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('EXTENSION_WIDGET_NOT_REGISTERED'),
    ).toBeInTheDocument();
  });
});
