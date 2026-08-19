import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { HomePageHeader } from '../HomePageHeader';

expect.extend(toHaveNoViolations);

jest.mock('@bahmni/design-system', () => ({
  Header: ({ ariaLabel, brandPrefix, globalFeatures, userMenu }: any) => (
    <header aria-label={ariaLabel} data-testid="header">
      <div data-testid="brand">{brandPrefix}</div>
      <div data-testid="global-features">{globalFeatures}</div>
      <div data-testid="user-menu-slot">{userMenu}</div>
    </header>
  ),
}));

jest.mock('@bahmni/widgets', () => ({
  LocationSelector: () => (
    <div data-testid="location-selector">Location Selector</div>
  ),
  UserGlobalAction: () => (
    <div data-testid="user-global-action">User Global Action</div>
  ),
}));

describe('HomePageHeader', () => {
  it('renders the header with correct aria-label', () => {
    render(<HomePageHeader />);

    const header = screen.getByTestId('header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveAttribute('aria-label', 'Bahmni');
  });

  it('renders Home branding via brandPrefix', () => {
    render(<HomePageHeader />);

    expect(screen.getByTestId('brand')).toHaveTextContent('Home');
  });

  it('renders the location selector in the global features slot', () => {
    render(<HomePageHeader />);

    const features = screen.getByTestId('global-features');
    expect(features).toContainElement(screen.getByTestId('location-selector'));
  });

  it('renders the shared UserGlobalAction in the user menu slot', () => {
    render(<HomePageHeader />);

    const userMenuSlot = screen.getByTestId('user-menu-slot');
    expect(userMenuSlot).toContainElement(
      screen.getByTestId('user-global-action'),
    );
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<HomePageHeader />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
