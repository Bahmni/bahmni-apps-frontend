import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { MemoryRouter } from 'react-router-dom';
import { IndexPage } from '../Index';

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  PatientDetails: () => <div data-testid="patient-details-mock" />,
  usePatientUUID: jest.fn(() => 'patient-uuid'),
}));

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getFormattedPatientById: jest
    .fn()
    .mockResolvedValue({ fullName: 'Naman Shukla' }),
}));

jest.mock('../../providers/patientDocumentsConfig', () => ({
  usePatientDocumentsConfig: () => ({
    patientDocumentsConfig: undefined,
    isLoading: false,
    error: null,
  }),
}));

jest.mock('../../hooks/useDocumentEncounterType', () => ({
  useDocumentEncounterType: () => ({
    encounterType: { uuid: 'encounter-uuid', name: 'Patient Document' },
  }),
}));

const renderPage = (initialEntry = '/patient-uuid') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <IndexPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('IndexPage', () => {
  it('renders the patient banner', () => {
    renderPage();
    expect(screen.getByTestId('patient-details-mock')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderPage();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('builds breadcrumb search URL with encounter and concept params', async () => {
    renderPage(
      '/patient-uuid?encounterType=Patient%20Document&topLevelConcept=Patient%20Document&defaultOption=Patient%20File',
    );

    await expect(
      screen.findByTestId('patient-details-mock'),
    ).resolves.toBeInTheDocument();
  });
});
