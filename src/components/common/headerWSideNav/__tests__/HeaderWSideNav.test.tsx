// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import HeaderWSideNav from '../HeaderWSideNav';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key, // Return the key for testing
  }),
}));

// Mock useHeaderSideNav hook
const mockHandleClickSideNavExpand = jest.fn();
// Allow controlling isSideNavExpanded in tests
let mockIsSideNavExpanded = false;

jest.mock('@hooks/useHeaderSideNav', () => ({
  useHeaderSideNav: (onItemClick) => ({
    isSideNavExpanded: mockIsSideNavExpanded,
    handleClickSideNavExpand: mockHandleClickSideNavExpand,
    // Pass the e and itemId arguments to the onItemClick callback
    handleSideNavItemClick: (e, itemId) => {
      e.preventDefault();
      onItemClick(itemId);
    },
  }),
}));

expect.extend(toHaveNoViolations);

// Mock CSS module
jest.mock('../styles/HeaderWSideNav.module.scss', () => ({
  headerWSideNav: 'headerWSideNav-mock',
  breadcrumb: 'breadcrumb-mock',
}));

// Create a mockOnClickSideNavExpand function that we can access in tests
const mockOnClickSideNavExpand = jest.fn();

// Mock Carbon components
jest.mock('@carbon/react', () => {
  return {
    HeaderContainer: ({ render }) => {
      const isSideNavExpanded = false;
      return (
        <div data-testid="header-container">
          {render({
            isSideNavExpanded,
            onClickSideNavExpand: mockOnClickSideNavExpand,
          })}
        </div>
      );
    },
    Header: ({ children, 'aria-label': ariaLabel }) => (
      <header aria-label={ariaLabel} data-testid="header">
        {children}
      </header>
    ),
    HeaderName: ({ children, href, prefix }) => (
      <a href={href} data-testid="header-name">
        {prefix && <span data-testid="header-prefix">{prefix}</span>}
        <span>{children}</span>
      </a>
    ),
    HeaderMenuButton: ({
      'aria-label': ariaLabel,
      onClick,
      isActive,
      'aria-expanded': ariaExpanded,
    }) => (
      <button
        aria-label={ariaLabel}
        onClick={onClick}
        data-active={isActive}
        aria-expanded={ariaExpanded}
        data-testid="header-menu-button"
      >
        Menu
      </button>
    ),
    SkipToContent: () => (
      <a href="#main-content" data-testid="skip-to-content">
        Skip to content
      </a>
    ),
    HeaderGlobalBar: ({ children }) => (
      <div data-testid="header-global-bar">{children}</div>
    ),
    HeaderGlobalAction: ({
      children,
      'aria-label': ariaLabel,
      onClick,
      tooltipAlignment,
    }) => (
      <button
        aria-label={ariaLabel}
        onClick={onClick}
        data-tooltip-alignment={tooltipAlignment}
        data-testid={`global-action-${ariaLabel.toLowerCase().replace(/\s/g, '-')}`}
      >
        {children}
      </button>
    ),
    SideNav: ({
      children,
      'aria-label': ariaLabel,
      expanded,
      isRail,
      'data-testid': dataTestId,
    }) => (
      <nav
        aria-label={ariaLabel}
        data-expanded={expanded}
        data-is-rail={isRail}
        data-testid={dataTestId || 'side-nav'}
      >
        {children}
      </nav>
    ),
    SideNavItems: ({ children }) => (
      <ul data-testid="side-nav-items">{children}</ul>
    ),
    SideNavLink: ({
      children,
      renderIcon,
      href,
      onClick,
      isActive,
      'data-testid': dataTestId,
    }) => {
      const Icon = renderIcon ? renderIcon() : null;
      return (
        <a
          href={href}
          onClick={onClick}
          data-testid={dataTestId}
          data-active={isActive ? 'true' : 'false'}
          role="link"
          aria-current={isActive ? 'page' : undefined}
        >
          {Icon}
          <span>{children}</span>
        </a>
      );
    },
    Breadcrumb: ({ children, noTrailingSlash, 'data-testid': dataTestId }) => (
      <nav aria-label="Breadcrumb" data-testid={dataTestId || 'breadcrumb'}>
        <ol data-no-trailing={noTrailingSlash}>{children}</ol>
      </nav>
    ),
    BreadcrumbItem: ({ children, href, isCurrentPage }) => (
      <li>
        <a
          href={href}
          aria-current={isCurrentPage ? 'page' : undefined}
          data-testid={`breadcrumb-item${isCurrentPage ? '-current' : ''}`}
        >
          {children}
        </a>
      </li>
    ),
  };
});

// Mock BahmniIcon
jest.mock('@components/common/bahmniIcon/BahmniIcon', () => {
  return function BahmniIcon(props: {
    id: string;
    name: string;
    size: string;
  }) {
    return (
      <div
        data-testid={`${props.id}`}
        data-icon-name={props.name}
        data-size={props.size}
      >
        Icon Mock
      </div>
    );
  };
});

describe('HeaderWSideNav', () => {
  // Test data setup
  const mockSideNavItems = [
    {
      id: 'dashboard',
      icon: 'fa-dashboard',
      label: 'Dashboard',
    },
    {
      id: 'patients',
      icon: 'fa-user',
      label: 'Patients',
    },
  ];

  const mockBreadcrumbItems = [
    {
      id: 'home',
      label: 'Home',
      href: '#',
    },
    {
      id: 'current',
      label: 'Current Page',
      isCurrentPage: true,
    },
  ];

  const mockGlobalActions = [
    {
      id: 'search',
      label: 'Search',
      renderIcon: <div>SearchIcon</div>,
      onClick: jest.fn(),
    },
    {
      id: 'notifications',
      label: 'Notifications',
      renderIcon: <div>NotificationIcon</div>,
      onClick: jest.fn(),
    },
  ];

  const mockOnSideNavItemClick = jest.fn();

  const defaultProps = {
    breadcrumbItems: mockBreadcrumbItems,
    globalActions: mockGlobalActions,
    sideNavItems: mockSideNavItems,
    activeSideNavItemId: 'dashboard',
    onSideNavItemClick: mockOnSideNavItemClick,
    ariaLabel: 'Bahmni Clinical',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Basic rendering tests
  describe('Rendering', () => {
    it('renders breadcrumb items correctly', () => {
      render(<HeaderWSideNav {...defaultProps} />);

      const breadcrumbItems = screen.getAllByTestId(/breadcrumb-item/);
      expect(breadcrumbItems).toHaveLength(2);

      expect(breadcrumbItems[0]).toHaveTextContent('Home');
      expect(breadcrumbItems[0]).toHaveAttribute('href', '#');

      expect(screen.getByTestId('breadcrumb-item-current')).toHaveTextContent(
        'Current Page',
      );
      expect(screen.getByTestId('breadcrumb-item-current')).toHaveAttribute(
        'aria-current',
        'page',
      );
    });

    it('renders global actions', () => {
      render(<HeaderWSideNav {...defaultProps} />);

      expect(screen.getByTestId('global-action-search')).toBeInTheDocument();
      expect(
        screen.getByTestId('global-action-notifications'),
      ).toBeInTheDocument();
    });

    it('renders side navigation items', () => {
      render(<HeaderWSideNav {...defaultProps} />);

      expect(screen.getByTestId('sidenav-item-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('sidenav-item-patients')).toBeInTheDocument();
    });
  });

  // Interaction tests
  describe('Interactions', () => {
    it('calls onSideNavItemClick when side nav item is clicked', () => {
      render(<HeaderWSideNav {...defaultProps} />);

      fireEvent.click(screen.getByTestId('sidenav-item-patients'));
      expect(mockOnSideNavItemClick).toHaveBeenCalledWith('patients');
    });

    it('calls global action onClick when a global action is clicked', () => {
      render(<HeaderWSideNav {...defaultProps} />);

      fireEvent.click(screen.getByTestId('global-action-search'));
      expect(mockGlobalActions[0].onClick).toHaveBeenCalled();
    });
  });

  // Configuration tests
  describe('Configuration variations', () => {
    it('works with minimum required props', () => {
      const minProps = {
        sideNavItems: mockSideNavItems,
        onSideNavItemClick: mockOnSideNavItemClick,
      };

      render(<HeaderWSideNav {...minProps} />);

      expect(screen.getByTestId('sidenav-item-dashboard')).toBeInTheDocument();
      expect(screen.queryByTestId('breadcrumb')).not.toBeInTheDocument();
      expect(screen.queryByTestId('header-global-bar')).not.toBeInTheDocument();
      expect(screen.queryByTestId('breadcrumb')).not.toBeInTheDocument();
      expect(screen.queryByTestId('header-global-bar')).not.toBeInTheDocument();
    });
  });

  // Edge cases
  describe('Edge cases', () => {
    it('handles empty breadcrumbItems array', () => {
      render(<HeaderWSideNav {...defaultProps} breadcrumbItems={[]} />);

      expect(screen.queryByTestId('breadcrumb')).not.toBeInTheDocument();
    });

    it('handles empty globalActions array', () => {
      render(<HeaderWSideNav {...defaultProps} globalActions={[]} />);

      expect(screen.queryByTestId('header-global-bar')).not.toBeInTheDocument();
    });
  });

  // SideNav expansion tests
  describe('SideNav expansion behavior', () => {
    afterEach(() => {
      // Reset the mock value after each test
      mockIsSideNavExpanded = false;
    });

    it('expands SideNav when isSideNavExpanded=true and isRail=false', () => {
      mockIsSideNavExpanded = true;
      const { container } = render(
        <HeaderWSideNav {...defaultProps} isRail={false} />,
      );

      const sideNav = screen.getByTestId('side-nav');
      expect(sideNav).toHaveAttribute('data-expanded', 'true');

      // Create a snapshot for this state
      expect(container).toMatchSnapshot('expanded_sideNav');
    });

    it('does not expand SideNav when isSideNavExpanded=true and isRail=true', () => {
      mockIsSideNavExpanded = true;
      const { container } = render(<HeaderWSideNav {...defaultProps} isRail />);

      const sideNav = screen.getByTestId('side-nav');
      expect(sideNav).toHaveAttribute('data-expanded', 'false');

      // Create a snapshot for this state
      expect(container).toMatchSnapshot('expanded_with_rail');
    });

    it('does not expand SideNav when isSideNavExpanded=false and isRail=false', () => {
      mockIsSideNavExpanded = false;
      const { container } = render(
        <HeaderWSideNav {...defaultProps} isRail={false} />,
      );

      const sideNav = screen.getByTestId('side-nav');
      expect(sideNav).toHaveAttribute('data-expanded', 'false');

      // Create a snapshot for this state
      expect(container).toMatchSnapshot('not_expanded_no_rail');
    });

    it('does not expand SideNav when isSideNavExpanded=false and isRail=true', () => {
      mockIsSideNavExpanded = false;
      const { container } = render(<HeaderWSideNav {...defaultProps} isRail />);

      const sideNav = screen.getByTestId('side-nav');
      expect(sideNav).toHaveAttribute('data-expanded', 'false');

      // Create a snapshot for this state
      expect(container).toMatchSnapshot('not_expanded_with_rail');
    });
  });

  // Accessibility tests
  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<HeaderWSideNav {...defaultProps} />);
      const results = await axe(container, {
        rules: { list: { enabled: false } },
      });
      expect(results).toHaveNoViolations();
    });

    it('has correct ARIA attributes', () => {
      render(<HeaderWSideNav {...defaultProps} />);

      expect(screen.getByTestId('header')).toHaveAttribute(
        'aria-label',
        'Bahmni Clinical',
      );

      const activeItem = screen.getByTestId('sidenav-item-dashboard');
      expect(activeItem).toHaveAttribute('data-active', 'true');
      expect(activeItem).toHaveAttribute('aria-current', 'page');

      const inactiveItem = screen.getByTestId('sidenav-item-patients');
      expect(inactiveItem).toHaveAttribute('data-active', 'false');
      expect(inactiveItem).not.toHaveAttribute('aria-current');
    });
  });
});
