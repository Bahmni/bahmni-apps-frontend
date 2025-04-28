import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import MainLayout from '@layouts/MainLayout';
import ConsultationPage from '../pages/consultationPage/ConsultationPage';
import NotFoundPage from '../pages/notFoundPage/NotFoundPage';

// Mock dependencies
jest.mock('@layouts/MainLayout', () => {
  return jest.fn(({ children }) => (
    <div data-testid="mock-main-layout">{children}</div>
  ));
});

jest.mock('@pages/consultationPage/ConsultationPage', () => {
  return jest.fn(() => <div data-testid="mock-home-page">Home Page</div>);
});

jest.mock('@pages/notFoundPage/NotFoundPage', () => {
  return jest.fn(() => (
    <div data-testid="mock-not-found-page">Not Found Page</div>
  ));
});

jest.mock('@carbon/react', () => ({
  Content: jest.fn(({ children }) => (
    <div data-testid="mock-carbon-content">{children}</div>
  )),
}));

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('mock-main-layout')).toBeInTheDocument();
    expect(screen.getByTestId('mock-carbon-content')).toBeInTheDocument();
  });

  it('should render HomePage for root path', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    expect(ConsultationPage).toHaveBeenCalled();
    expect(screen.getByTestId('mock-home-page')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-not-found-page')).not.toBeInTheDocument();
  });

  it('should render HomePage for patient-specific path', () => {
    render(
      <MemoryRouter
        initialEntries={['/clinical/123e4567-e89b-12d3-a456-426614174000']}
      >
        <App />
      </MemoryRouter>,
    );

    expect(ConsultationPage).toHaveBeenCalled();
    expect(screen.getByTestId('mock-home-page')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-not-found-page')).not.toBeInTheDocument();
  });

  it('should render NotFoundPage for unknown paths', () => {
    render(
      <MemoryRouter initialEntries={['/unknown-path']}>
        <App />
      </MemoryRouter>,
    );

    expect(NotFoundPage).toHaveBeenCalled();
    expect(screen.getByTestId('mock-not-found-page')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-home-page')).not.toBeInTheDocument();
  });

  it('should wrap content with MainLayout', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(MainLayout).toHaveBeenCalled();
    const mainLayout = screen.getByTestId('mock-main-layout');
    expect(mainLayout).toBeInTheDocument();
    expect(mainLayout).toContainElement(
      screen.getByTestId('mock-carbon-content'),
    );
  });

  it('should render Routes component correctly', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    // Verify that the Routes component is rendered
    const contentElement = screen.getByTestId('mock-carbon-content');
    expect(contentElement).toBeInTheDocument();

    // Since Routes is not easily testable directly, we verify its behavior
    // by testing the rendered components based on different routes
  });

  it('should match snapshot', () => {
    const { asFragment } = render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(asFragment()).toMatchSnapshot();
  });
});
