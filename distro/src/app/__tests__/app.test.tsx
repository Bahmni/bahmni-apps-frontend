import { act, render, screen } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';

import App from '../app';

// Lazy-loaded pages are mocked so Suspense resolves synchronously.
// These mocks test that distro wires routes correctly — not what's inside each page.
jest.mock('@bahmni/home-app', () => ({
  HomeApp: () => <main data-testid="index-page" />,
}));

jest.mock('@bahmni/patient-documents-app', () => ({
  PatientDocumentsApp: () => <div data-testid="patient-documents-page" />,
}));

jest.mock('@bahmni/admin-app', () => ({
  AdminApp: () => <div data-testid="admin-page" />,
}));

jest.mock('@bahmni/reports-app', () => ({
  ReportsApp: () => <div data-testid="reports-page" />,
  }));

jest.mock('@bahmni/widgets', () => ({
  AppContextProvider: ({ children }: { children: React.ReactNode }) => children,
  CommandPaletteProvider: ({ children }: { children: React.ReactNode }) =>
    children,
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

  it('renders the patient-documents route', async () => {
    render(
      <MemoryRouter initialEntries={['/patient-documents/']}>
        <App />
      </MemoryRouter>,
    );

    await act(async () => {});

    expect(screen.getByTestId('patient-documents-page')).toBeInTheDocument();
  });

  it('renders the admin route lazily', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/']}>
        <App />
         </MemoryRouter>,
    );
    await act(async () => {});
    expect(screen.getByTestId('admin-page')).toBeInTheDocument();
    });
    
  it('renders the reports route', async () => {
    render(
      <MemoryRouter initialEntries={['/reports/']}>
        <App />
      </MemoryRouter>,
    );

    await act(async () => {});
    expect(screen.getByTestId('reports-page')).toBeInTheDocument();
  });
});
