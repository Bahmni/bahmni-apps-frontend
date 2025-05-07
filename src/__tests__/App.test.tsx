import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import ConsultationPage from '@pages/ConsultationPage';
import NotFoundPage from '@pages/NotFoundPage';

jest.mock('@pages/ConsultationPage', () => {
  return jest.fn(() => <div data-testid="mock-home-page">Home Page</div>);
});

jest.mock('@pages/NotFoundPage', () => {
  return jest.fn(() => (
    <div data-testid="mock-not-found-page">Not Found Page</div>
  ));
});

jest.mock('@carbon/react', () => ({
  Content: jest.fn(({ children }) => (
    <div data-testid="mock-carbon-content">{children}</div>
  )),
}));

jest.mock('@providers/ClinicalConfigProvider', () => ({
  ClinicalConfigProvider: jest.fn(({ children }) => (
    <div data-testid="mock-clinical-config-provider">{children}</div>
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

    expect(screen.getByTestId('mock-carbon-content')).toBeInTheDocument();
  });

  it('should render ConsultationPage for patient-specific path', () => {
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
      <MemoryRouter
        initialEntries={['/clinical/123e4567-e89b-12d3-a456-426614174000']}
      >
        <App />
      </MemoryRouter>,
    );

    expect(asFragment()).toMatchSnapshot();
  });
});
