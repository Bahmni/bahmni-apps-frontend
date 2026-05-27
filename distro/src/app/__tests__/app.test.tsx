import { act, render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';

import App from '../app';

// Lazy-loaded pages are mocked so Suspense resolves synchronously.
// These mocks test that distro wires routes correctly — not what's inside each page.
jest.mock('@bahmni/home-app', () => ({
  HomeApp: () => <main data-testid="index-page" />,
}));

jest.mock('@bahmni/widgets', () => ({
  AppContextProvider: ({ children }: { children: React.ReactNode }) => children,
  SessionGate: ({ children }: { children: React.ReactNode }) => children,
}));

describe('App', () => {
  it('renders the index route', async () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>,
    );

    await act(async () => {});

    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('redirects root / to /home/', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    await act(async () => {});

    expect(screen.getByTestId('index-page')).toBeInTheDocument();
  });
});
