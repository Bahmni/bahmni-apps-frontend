import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from '../Header';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// Mock FontAwesomeIcon for BahmniIcon
jest.mock('@fortawesome/react-fontawesome', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  FontAwesomeIcon: ({ icon, size, color, ...props }: any) => (
    <svg
      data-testid={props['data-testid']}
      data-icon={icon[1]}
      data-prefix={icon[0]}
      data-size={size}
      data-color={color}
      {...props}
    />
  ),
}));

describe('Header Component', () => {
  // Helper function to render the component with router
  const renderWithRouter = () =>
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>,
    );

  // Happy Path Tests
  describe('Happy Path', () => {
    test('renders the header with correct aria-label', () => {
      renderWithRouter();
      const header = screen.getByRole('banner');
      expect(header).toHaveAttribute('aria-label', 'Bahmni Clinical');
    });

    test('renders the Bahmni Clinical header text', () => {
      renderWithRouter();
      const headerText = screen.getByText('Bahmni Clinical');
      expect(headerText).toBeInTheDocument();
      expect(headerText.tagName).toBe('A'); // Should be a link
      expect(headerText).toHaveAttribute('href', '/');
    });

    test('renders the Home menu item with icon', () => {
      renderWithRouter();
      const homeMenuItem = screen.getByText('Home');
      expect(homeMenuItem).toBeInTheDocument();

      // Check if it's a link to the home page
      const homeLink = homeMenuItem.closest('a');
      expect(homeLink).toHaveAttribute('href', '/');

      // Check if the icon is rendered
      const homeIcon = screen.getByTestId('homeIcon');
      expect(homeIcon).toBeInTheDocument();
    });

    test('renders the HeaderNavigation with correct aria-label', () => {
      renderWithRouter();
      const navigation = screen.getByRole('navigation');
      expect(navigation).toHaveAttribute('aria-label', 'Main Navigation');
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    test('supports keyboard navigation', () => {
      renderWithRouter();

      // Get all interactive elements
      const interactiveElements = screen.getAllByRole('link');

      // Ensure they have proper tab index
      interactiveElements.forEach((element) => {
        expect(element.tabIndex).not.toBe(-1);
      });
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    test('accessible forms pass axe', async () => {
      const { container } = renderWithRouter();
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
