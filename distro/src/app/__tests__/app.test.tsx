import { act, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

import App from '../app';

// Lazy-loaded pages are mocked so Suspense resolves synchronously.
// These mocks test that distro wires routes correctly — not what's inside each page.
// TODO: When pages move to apps/home/ (or other packages), only the import paths below change.
jest.mock('../IndexPage', () => ({
  IndexPage: () => <main data-testid="index-page" />,
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
