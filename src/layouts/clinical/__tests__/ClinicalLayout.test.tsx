import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ClinicalLayout from '../ClinicalLayout';

// Mock component to be used as children
const MockChild = () => <div data-testid="mock-child">Mock Child</div>;
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
describe('ClinicalLayout Component', () => {
  test('renders the Home menu item', () => {
    render(
      <BrowserRouter>
        <ClinicalLayout>
          <MockChild />
        </ClinicalLayout>
      </BrowserRouter>,
    );

    // Check if the Home menu item is rendered
    const homeMenuItem = screen.getByText('Home');
    expect(homeMenuItem).toBeInTheDocument();

    // Verify it's a link to the home page
    expect(homeMenuItem.closest('a')).toHaveAttribute('href', '/');
  });

  test('renders the Bahmni Clinical header', () => {
    render(
      <BrowserRouter>
        <ClinicalLayout>
          <MockChild />
        </ClinicalLayout>
      </BrowserRouter>,
    );

    // Check if the header with Bahmni Clinical text is rendered
    const header = screen.getByText('Bahmni Clinical');
    expect(header).toBeInTheDocument();
  });

  test('renders children content', () => {
    render(
      <BrowserRouter>
        <ClinicalLayout>
          <MockChild />
        </ClinicalLayout>
      </BrowserRouter>,
    );

    // Check if children are rendered
    const childContent = screen.getByTestId('mock-child');
    expect(childContent).toBeInTheDocument();
    expect(childContent).toHaveTextContent('Mock Child');
  });
});
