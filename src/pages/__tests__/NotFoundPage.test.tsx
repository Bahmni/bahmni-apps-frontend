import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import NotFoundPage from '../NotFoundPage';

describe('NotFoundPage Component', () => {
  const renderWithRouter = (ui: React.ReactElement) => {
    return render(ui, { wrapper: BrowserRouter });
  };

  it('should render without crashing', () => {
    renderWithRouter(<NotFoundPage />);
    expect(screen.getByText('404 - Page Not Found')).toBeInTheDocument();
  });

  it('should display the error message', () => {
    renderWithRouter(<NotFoundPage />);
    expect(
      screen.getByText('The page you are looking for does not exist.'),
    ).toBeInTheDocument();
  });

  it('should render a link back to home page', () => {
    renderWithRouter(<NotFoundPage />);
    const homeLink = screen.getByText('Return to Home');
    expect(homeLink).toBeInTheDocument();
    expect(homeLink.closest('a')).toHaveAttribute('href', '/');
  });

  it('should render with correct structure', () => {
    renderWithRouter(<NotFoundPage />);
    // Test for the presence of the heading and paragraph
    expect(screen.getByRole('heading')).toBeInTheDocument();
    expect(
      screen.getByText('The page you are looking for does not exist.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Return to Home')).toBeInTheDocument();
  });

  it('should render the heading with correct text', () => {
    renderWithRouter(<NotFoundPage />);
    const heading = screen.getByRole('heading');
    expect(heading).toHaveTextContent('404 - Page Not Found');
  });

  it('should match snapshot', () => {
    const { asFragment } = renderWithRouter(<NotFoundPage />);
    expect(asFragment()).toMatchSnapshot();
  });
});
