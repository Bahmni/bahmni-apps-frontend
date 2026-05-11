import { act, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

import App from '../app';

// Lazy-loaded pages are mocked so Suspense resolves synchronously.
// These mocks test that distro wires routes correctly — not what's inside each page.
// TODO: When pages move to apps/home/ (or other packages), only the import paths below change.
jest.mock('../IndexPage', () => ({
  IndexPage: () => <main data-testid="index-page" />,
}));

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getUserLoginLocation: jest.fn().mockReturnValue({
    name: 'Test Location',
    uuid: 'test-uuid',
  }),
  getAvailableLocations: jest.fn().mockResolvedValue([]),
  getCurrentUser: jest.fn().mockResolvedValue({
    uuid: 'user-uuid',
    username: 'testuser',
    display: 'Test User',
  }),
  getVisibleModules: jest.fn().mockResolvedValue([]),
  getConfig: jest.fn().mockResolvedValue({}),
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
