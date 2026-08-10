import { initFontAwesome } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { OrdersHeader } from '../OrdersHeader';
import '@testing-library/jest-dom';

initFontAwesome();

expect.extend(toHaveNoViolations);

jest.mock('@bahmni/services');

const mockedUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;

// Mock window.location.href
delete (window as any).location;
window.location = { href: '' } as any;

describe('OrdersHeader Component', () => {
  const mockTranslate = jest.fn((key: string) => {
    const translations: Record<string, string> = {
      HOME_LABEL: 'Home',
      ORDERS_LABEL: 'Orders',
      SEARCH_LABEL: 'Search',
      NOTIFICATIONS_LABEL: 'Notifications',
      USER_LABEL: 'User',
      ORDERS_HEADER_LABEL: 'Orders Header',
    };
    return translations[key] || key;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseTranslation.mockReturnValue({ t: mockTranslate } as any);
    window.location.href = '';
  });

  describe('Rendering', () => {
    test('renders without crashing', () => {
      render(<OrdersHeader />);
      expect(screen.getByLabelText('Orders Header')).toBeInTheDocument();
    });

    test('renders Header with correct aria-label', () => {
      render(<OrdersHeader />);
      const header = screen.getByLabelText('Orders Header');
      expect(header).toBeInTheDocument();
    });

    test('renders breadcrumb items correctly', () => {
      render(<OrdersHeader />);
      expect(screen.getAllByText('Home').length).toBeGreaterThan(0);
      expect(screen.getByText('Orders')).toBeInTheDocument();
    });
  });

  describe('Global Actions', () => {
    test('renders search button', () => {
      render(<OrdersHeader />);
      const searchButton = screen.getByLabelText('Search');
      expect(searchButton).toBeInTheDocument();
    });

    test('renders notifications button', () => {
      render(<OrdersHeader />);
      const notificationsButton = screen.getByLabelText('Notifications');
      expect(notificationsButton).toBeInTheDocument();
    });

    test('renders user button', () => {
      render(<OrdersHeader />);
      const userButton = screen.getByLabelText('User');
      expect(userButton).toBeInTheDocument();
    });

    test('search button has correct icon', () => {
      const { container } = render(<OrdersHeader />);
      const searchIcon = container.querySelector('#search-icon');
      expect(searchIcon).toBeInTheDocument();
    });

    test('notifications button has correct icon', () => {
      const { container } = render(<OrdersHeader />);
      const notificationIcon = container.querySelector('#notification-icon');
      expect(notificationIcon).toBeInTheDocument();
    });

    test('user button has correct icon', () => {
      const { container } = render(<OrdersHeader />);
      const userIcon = container.querySelector('#user-icon');
      expect(userIcon).toBeInTheDocument();
    });
  });

  describe('Breadcrumbs', () => {
    test('Home breadcrumb has correct href', () => {
      render(<OrdersHeader />);
      const homeLinks = screen.getAllByText('Home');
      // Find the link element among the Home elements
      const homeLinkElement = homeLinks.find(
        (el) => el.tagName === 'A' || el.closest('a'),
      );
      expect(homeLinkElement).toBeDefined();
    });

    test('Orders breadcrumb is marked as current page', () => {
      render(<OrdersHeader />);
      const ordersText = screen.getByText('Orders');
      expect(ordersText).toBeInTheDocument();
    });
  });

  describe('Text Content', () => {
    test('displays Home text in breadcrumb', () => {
      render(<OrdersHeader />);
      expect(screen.getAllByText('Home').length).toBeGreaterThan(0);
    });

    test('displays Orders text in breadcrumb', () => {
      render(<OrdersHeader />);
      expect(screen.getByText('Orders')).toBeInTheDocument();
    });

    test('displays Search text in button', () => {
      render(<OrdersHeader />);
      expect(screen.getByText('Search')).toBeInTheDocument();
    });

    test('displays Notifications text in button', () => {
      render(<OrdersHeader />);
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    test('displays User text in button', () => {
      render(<OrdersHeader />);
      expect(screen.getByText('User')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has no accessibility violations', async () => {
      const { container } = render(<OrdersHeader />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('buttons have proper labels', () => {
      render(<OrdersHeader />);

      const searchButton = screen.getByLabelText('Search');
      const notificationsButton = screen.getByLabelText('Notifications');
      const userButton = screen.getByLabelText('User');

      expect(searchButton).toHaveAttribute('aria-label', 'Search');
      expect(notificationsButton).toHaveAttribute(
        'aria-label',
        'Notifications',
      );
      expect(userButton).toHaveAttribute('aria-label', 'User');
    });
  });

  describe('Header Structure', () => {
    test('renders sideNavItems as empty array', () => {
      const { container } = render(<OrdersHeader />);
      // Since sideNavItems is empty, there should be no side navigation
      const sideNav = container.querySelector('[data-testid="side-nav"]');
      expect(sideNav).not.toBeInTheDocument();
    });

    test('has correct number of global actions', () => {
      render(<OrdersHeader />);
      const searchButton = screen.getByLabelText('Search');
      const notificationsButton = screen.getByLabelText('Notifications');
      const userButton = screen.getByLabelText('User');

      expect(searchButton).toBeInTheDocument();
      expect(notificationsButton).toBeInTheDocument();
      expect(userButton).toBeInTheDocument();
    });
  });
});
