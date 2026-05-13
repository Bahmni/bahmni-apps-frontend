import { act, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

import App from '../app';

// Lazy-loaded pages are mocked so Suspense resolves synchronously.
// These mocks test that distro wires routes correctly — not what's inside each page.
jest.mock('@bahmni/home-app', () => ({
  HomeApp: () => <main data-testid="index-page" />,
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
});
