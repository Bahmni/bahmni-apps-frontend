import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { HomePage } from '../HomePage';

expect.extend(toHaveNoViolations);

jest.mock('@bahmni/widgets', () => ({
  ActivePractitionerProvider: ({ children }: any) => children,
  LocationProvider: ({ children }: any) => children,
  NotificationProvider: ({ children }: any) => children,
  NotificationServiceComponent: () => (
    <div data-testid="notification-service" />
  ),
  UserPrivilegeProvider: ({ children }: any) => children,
}));

jest.mock('@tanstack/react-query', () => ({
  QueryClient: jest.fn().mockImplementation(() => ({})),
  QueryClientProvider: ({ children }: any) => children,
}));

jest.mock('../../HomePageGrid', () => ({
  HomePageGrid: () => <div data-testid="home-page-grid" />,
}));

jest.mock('../../HomePageHeader', () => ({
  HomePageHeader: () => <div data-testid="home-page-header" />,
}));

describe('HomePage', () => {
  it('renders the page header', () => {
    render(<HomePage />);
    expect(screen.getByTestId('home-page-header')).toBeInTheDocument();
  });

  it('renders the page grid', () => {
    render(<HomePage />);
    expect(screen.getByTestId('home-page-grid')).toBeInTheDocument();
  });

  it('renders the notification service', () => {
    render(<HomePage />);
    expect(screen.getByTestId('notification-service')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<HomePage />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
