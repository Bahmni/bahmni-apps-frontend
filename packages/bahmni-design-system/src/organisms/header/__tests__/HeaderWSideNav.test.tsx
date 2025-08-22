import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import { HeaderWSideNav } from '../HeaderWSideNav';
import {
  HeaderWSideNavProps,
  HeaderSideNavItem,
  HeaderBreadcrumbItem,
  HeaderGlobalAction,
} from '../models';
import '@testing-library/jest-dom';

expect.extend(toHaveNoViolations);

// Mock window.matchMedia for Carbon components
Object.defineProperty(global, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock useHeaderSideNav hook
const mockHandleSideNavItemClick = jest.fn();
let mockIsSideNavExpanded = false;

const resetSideNavMock = (expanded = false) => {
  mockIsSideNavExpanded = expanded;
  mockHandleSideNavItemClick.mockClear();
};

jest.mock('../useHeaderSideNav', () => ({
  useHeaderSideNav: (onItemClick: (itemId: string) => void) => ({
    isSideNavExpanded: mockIsSideNavExpanded,
    handleSideNavItemClick: (e: React.MouseEvent, itemId: string) => {
      e.preventDefault();
      mockHandleSideNavItemClick(e, itemId);
      onItemClick(itemId);
    },
  }),
}));

// Mock isMobile utility
const mockIsMobile = jest.fn(() => false);
jest.mock('../utils', () => ({
  isMobile: () => mockIsMobile(),
}));

// Mock Icon component to isolate HeaderWSideNav testing
jest.mock('../../../molecules/icon', () => ({
  Icon: ({ name, id, size }: { name: string; id: string; size: string }) => (
    <div data-testid={id} data-icon-name={name} data-size={size} />
  ),
  ICON_SIZE: { LG: 'lg' },
}));

describe('HeaderWSideNav', () => {
  // Test data
  const mockSideNavItems: HeaderSideNavItem[] = [
    {
      id: 'dashboard',
      icon: 'fa-dashboard',
      label: 'Dashboard',
      href: '/dashboard',
    },
    {
      id: 'patients',
      icon: 'fa-user',
      label: 'Patients',
    },
  ];

  const mockBreadcrumbItems: HeaderBreadcrumbItem[] = [
    {
      id: 'home',
      label: 'Home',
      href: '/home',
    },
    {
      id: 'current',
      label: 'Current Page',
      isCurrentPage: true,
    },
  ];

  const mockGlobalActions: HeaderGlobalAction[] = [
    {
      id: 'search',
      label: 'Search',
      renderIcon: <div data-testid="search-icon">Search Icon</div>,
      onClick: jest.fn(),
    },
    {
      id: 'notifications',
      label: 'Notifications',
      renderIcon: <div data-testid="notification-icon">Notification Icon</div>,
      onClick: jest.fn(),
    },
  ];

  const mockOnSideNavItemClick = jest.fn();

  const defaultProps: HeaderWSideNavProps = {
    breadcrumbItems: mockBreadcrumbItems,
    globalActions: mockGlobalActions,
    sideNavItems: mockSideNavItems,
    activeSideNavItemId: 'dashboard',
    onSideNavItemClick: mockOnSideNavItemClick,
    ariaLabel: 'Bahmni Clinical',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsMobile.mockReturnValue(false);
    resetSideNavMock(false);
  });

  describe('Rendering', () => {
    it('renders with just breadcrumbs', () => {
      const minimalProps: HeaderWSideNavProps = {
        breadcrumbItems: mockBreadcrumbItems,
      };

      render(<HeaderWSideNav {...minimalProps} />);

      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Current Page')).toBeInTheDocument();
    });

    it('renders all sections when fully configured', () => {
      render(<HeaderWSideNav {...defaultProps} />);

      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('breadcrumb')).toBeInTheDocument();
      expect(screen.getByTestId('header-global-bar')).toBeInTheDocument();
      expect(screen.getByTestId('side-nav')).toBeInTheDocument();
    });

    it('uses correct aria-label on header', () => {
      render(<HeaderWSideNav {...defaultProps} />);

      expect(screen.getByTestId('header')).toHaveAttribute(
        'aria-label',
        'Bahmni Clinical',
      );
    });

    it('uses default aria-label when not provided', () => {
      const propsWithoutAriaLabel = { ...defaultProps };
      delete propsWithoutAriaLabel.ariaLabel;

      render(<HeaderWSideNav {...propsWithoutAriaLabel} />);

      expect(screen.getByTestId('header')).toHaveAttribute(
        'aria-label',
        'HeaderWSideNav',
      );
    });
  });

  describe('Breadcrumbs', () => {
    it('does not render breadcrumbs when array is empty', () => {
      render(<HeaderWSideNav {...defaultProps} breadcrumbItems={[]} />);

      expect(screen.queryByTestId('breadcrumb')).not.toBeInTheDocument();
    });

    it('does not render breadcrumbs when not provided', () => {
      const propsWithoutBreadcrumbs = { ...defaultProps };
      delete propsWithoutBreadcrumbs.breadcrumbItems;

      render(<HeaderWSideNav {...propsWithoutBreadcrumbs} />);

      expect(screen.queryByTestId('breadcrumb')).not.toBeInTheDocument();
    });
  });

  describe('Global Actions', () => {
    it('renders global actions with correct content', () => {
      render(<HeaderWSideNav {...defaultProps} />);

      expect(screen.getByTestId('global-action-search')).toBeInTheDocument();
      expect(
        screen.getByTestId('global-action-notifications'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
      expect(screen.getByTestId('notification-icon')).toBeInTheDocument();
    });

    it('handles global action clicks', () => {
      render(<HeaderWSideNav {...defaultProps} />);

      fireEvent.click(screen.getByTestId('global-action-search'));
      expect(mockGlobalActions[0].onClick).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByTestId('global-action-notifications'));
      expect(mockGlobalActions[1].onClick).toHaveBeenCalledTimes(1);
    });

    it('does not render global actions when array is empty', () => {
      render(<HeaderWSideNav {...defaultProps} globalActions={[]} />);

      expect(screen.queryByTestId('header-global-bar')).not.toBeInTheDocument();
    });

    it('does not render global actions when not provided', () => {
      const propsWithoutGlobalActions = { ...defaultProps };
      delete propsWithoutGlobalActions.globalActions;

      render(<HeaderWSideNav {...propsWithoutGlobalActions} />);

      expect(screen.queryByTestId('header-global-bar')).not.toBeInTheDocument();
    });
  });

  describe('Side Navigation', () => {
    it('renders side nav items with correct content and icons', () => {
      render(<HeaderWSideNav {...defaultProps} />);

      expect(screen.getByTestId('sidenav-item-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('sidenav-item-patients')).toBeInTheDocument();

      expect(screen.getByTestId('sidebar-icon-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar-icon-patients')).toBeInTheDocument();
    });

    it('handles item clicks correctly', () => {
      render(<HeaderWSideNav {...defaultProps} />);

      fireEvent.click(screen.getByTestId('sidenav-item-patients'));

      expect(mockHandleSideNavItemClick).toHaveBeenCalledWith(
        expect.any(Object),
        'patients',
      );
      expect(mockOnSideNavItemClick).toHaveBeenCalledWith('patients');
    });

    it('uses href when provided, defaults to # when not', () => {
      render(<HeaderWSideNav {...defaultProps} />);

      expect(screen.getByTestId('sidenav-item-dashboard')).toHaveAttribute(
        'href',
        '/dashboard',
      );
      expect(screen.getByTestId('sidenav-item-patients')).toHaveAttribute(
        'href',
        '#',
      );
    });

    it('passes correct props to Icon component', () => {
      render(<HeaderWSideNav {...defaultProps} />);

      const dashboardIcon = screen.getByTestId('sidebar-icon-dashboard');
      expect(dashboardIcon).toHaveAttribute('data-icon-name', 'fa-dashboard');
      expect(dashboardIcon).toHaveAttribute('data-size', 'lg');
    });
  });

  describe('Props and Data Flow', () => {
    it('handles null activeSideNavItemId', () => {
      render(<HeaderWSideNav {...defaultProps} activeSideNavItemId={null} />);

      expect(screen.getByTestId('sidenav-item-dashboard')).not.toHaveAttribute(
        'aria-current',
      );
      expect(screen.getByTestId('sidenav-item-patients')).not.toHaveAttribute(
        'aria-current',
      );
    });

    it('handles undefined activeSideNavItemId', () => {
      const propsWithUndefinedActive = { ...defaultProps };
      delete propsWithUndefinedActive.activeSideNavItemId;

      render(<HeaderWSideNav {...propsWithUndefinedActive} />);

      expect(screen.getByTestId('sidenav-item-dashboard')).not.toHaveAttribute(
        'aria-current',
      );
      expect(screen.getByTestId('sidenav-item-patients')).not.toHaveAttribute(
        'aria-current',
      );
    });

    it('correctly integrates with useHeaderSideNav hook', () => {
      render(<HeaderWSideNav {...defaultProps} />);

      expect(mockHandleSideNavItemClick).not.toHaveBeenCalled();

      fireEvent.click(screen.getByTestId('sidenav-item-dashboard'));

      expect(mockHandleSideNavItemClick).toHaveBeenCalledWith(
        expect.any(Object),
        'dashboard',
      );
    });
  });

  describe('Edge Cases', () => {
    it('handles side nav items without icon', () => {
      const itemsWithoutIcon = [
        { id: 'no-icon', label: 'No Icon Item', icon: '' },
      ];

      render(
        <HeaderWSideNav {...defaultProps} sideNavItems={itemsWithoutIcon} />,
      );

      expect(screen.getByTestId('sidenav-item-no-icon')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar-icon-no-icon')).toHaveAttribute(
        'data-icon-name',
        '',
      );
    });

    it('handles long navigation lists', () => {
      const longNavList = Array.from({ length: 10 }, (_, i) => ({
        id: `item-${i}`,
        icon: `icon-${i}`,
        label: `Item ${i}`,
      }));

      render(<HeaderWSideNav {...defaultProps} sideNavItems={longNavList} />);

      longNavList.forEach((item) => {
        expect(
          screen.getByTestId(`sidenav-item-${item.id}`),
        ).toBeInTheDocument();
      });
    });

    it('handles breadcrumb items without href', () => {
      const breadcrumbsWithoutHref = [{ id: 'no-href', label: 'No Href Item' }];

      render(
        <HeaderWSideNav
          {...defaultProps}
          breadcrumbItems={breadcrumbsWithoutHref}
        />,
      );

      const item = screen.getByText('No Href Item');
      expect(item.closest('li')).toBeInTheDocument();
      expect(item.closest('a')).toBeNull();
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<HeaderWSideNav {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
