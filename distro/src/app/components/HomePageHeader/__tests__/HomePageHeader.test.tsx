import { render, screen } from '@testing-library/react';
import { HomePageHeader } from '../HomePageHeader';

jest.mock('@carbon/react', () => ({
  Header: ({ children, ...props }: any) => (
    <header {...props}>{children}</header>
  ),
  HeaderName: ({ prefix }: any) => (
    <div data-testid="header-name">{prefix}</div>
  ),
  HeaderGlobalBar: ({ children }: any) => (
    <div data-testid="header-global-bar">{children}</div>
  ),
}));

jest.mock('../../LocationSelector', () => ({
  LocationSelector: () => (
    <div data-testid="location-selector">Location Selector</div>
  ),
}));

jest.mock('../../UserProfileMenu', () => ({
  UserProfileMenu: () => (
    <div data-testid="user-profile-menu">User Profile Menu</div>
  ),
}));

describe('HomePageHeader', () => {
  it('renders the header with correct aria-label', () => {
    render(<HomePageHeader />);

    const header = screen.getByTestId('home-page-header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveAttribute('aria-label', 'Bahmni');
  });

  it('renders Home branding', () => {
    render(<HomePageHeader />);

    expect(screen.getByTestId('header-name')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('renders location selector', () => {
    render(<HomePageHeader />);

    expect(screen.getByTestId('location-selector')).toBeInTheDocument();
  });

  it('renders user profile menu', () => {
    render(<HomePageHeader />);

    expect(screen.getByTestId('user-profile-menu')).toBeInTheDocument();
  });

  it('renders both location and user components in header global bar', () => {
    render(<HomePageHeader />);

    const globalBar = screen.getByTestId('header-global-bar');
    expect(globalBar).toContainElement(screen.getByTestId('location-selector'));
    expect(globalBar).toContainElement(screen.getByTestId('user-profile-menu'));
  });
});
