import {
  getCategoryUuidFromOrderTypes,
  getServiceRequests,
  searchConceptByName,
  useSubscribeConsultationSaved,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import type { Bundle, ServiceRequest } from 'fhir/r4';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import { useNotification } from '../../notification';
import DispositionTable from '../DispositionTable';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getCategoryUuidFromOrderTypes: jest.fn(),
  getServiceRequests: jest.fn(),
  searchConceptByName: jest.fn(),
  getUserPreferredLocale: jest.fn(() => 'es'),
  useSubscribeConsultationSaved: jest.fn(),
  useTranslation: () => ({ t: (key: string) => key }),
  formatDateTime: jest.fn((value: string) => ({
    formattedResult: `fmt(${value})`,
    isValid: true,
  })),
}));
jest.mock('../../hooks/usePatientUUID', () => ({ usePatientUUID: jest.fn() }));
jest.mock('../../notification', () => ({ useNotification: jest.fn() }));

const sr = (id: string, type: string, authoredOn: string): ServiceRequest => ({
  resourceType: 'ServiceRequest',
  id,
  status: 'active',
  intent: 'order',
  subject: {},
  code: { text: type },
  occurrencePeriod: { start: '2026-08-14T00:00:00Z' },
  note: [{ text: `${type} note` }],
  authoredOn,
  requester: { display: 'Super Man' },
});

const bundleOf = (...resources: ServiceRequest[]): Bundle<ServiceRequest> => ({
  resourceType: 'Bundle',
  type: 'searchset',
  entry: resources.map((resource) => ({ resource })),
});

const renderWidget = (props = {}) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <DispositionTable {...props} />
    </QueryClientProvider>,
  );
};

describe('DispositionTable', () => {
  const addNotification = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (usePatientUUID as jest.Mock).mockReturnValue('patient-1');
    (useNotification as jest.Mock).mockReturnValue({ addNotification });
    (getCategoryUuidFromOrderTypes as jest.Mock).mockResolvedValue('cat-1');
    (searchConceptByName as jest.Mock).mockResolvedValue(null);
  });

  it('renders a row per disposition with all columns, newest first', async () => {
    (getServiceRequests as jest.Mock).mockResolvedValue(
      bundleOf(
        sr('1', 'Admit', '2026-08-14T08:00:00Z'),
        sr('2', 'Transfer', '2026-08-14T15:00:00Z'),
      ),
    );
    renderWidget();

    await waitFor(() =>
      expect(screen.getByText('Transfer')).toBeInTheDocument(),
    );
    expect(screen.getByText('Admit')).toBeInTheDocument();
    expect(screen.getByText('Transfer note')).toBeInTheDocument();
    expect(screen.getAllByText('Super Man')).toHaveLength(2);
    [
      'DISPOSITION_TYPE_LABEL',
      'DISPOSITION_DATE_LABEL',
      'DISPOSITION_NOTES_LABEL',
      'DISPOSITION_RECORDED_TIME',
      'DISPOSITION_RECORDED_BY',
    ].forEach((h) => expect(screen.getByText(h)).toBeInTheDocument());
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Transfer');
    expect(rows[2]).toHaveTextContent('Admit');
  });

  it('shows the type in the user locale from the Disposition concept', async () => {
    (searchConceptByName as jest.Mock).mockResolvedValue({
      answers: [
        {
          uuid: 'concept-admit',
          name: { name: 'Admit Patient' },
          names: [
            {
              name: 'Admit Patient',
              locale: 'en',
              conceptNameType: 'FULLY_SPECIFIED',
            },
            {
              name: 'Admitir paciente',
              locale: 'es',
              conceptNameType: 'FULLY_SPECIFIED',
            },
          ],
        },
      ],
    });
    const order = sr('1', 'Admit Patient', '2026-08-14T08:00:00Z');
    order.code = { text: 'Admit Patient', coding: [{ code: 'concept-admit' }] };
    (getServiceRequests as jest.Mock).mockResolvedValue(bundleOf(order));
    renderWidget();
    await waitFor(() =>
      expect(screen.getByText('Admitir paciente')).toBeInTheDocument(),
    );
  });

  it('resolves the ADT Order category by default and honours config.orderType', async () => {
    (getServiceRequests as jest.Mock).mockResolvedValue(bundleOf());
    renderWidget({ config: { orderType: 'Custom' } });
    await waitFor(() =>
      expect(getCategoryUuidFromOrderTypes).toHaveBeenCalledWith('Custom'),
    );
    renderWidget();
    await waitFor(() =>
      expect(getCategoryUuidFromOrderTypes).toHaveBeenCalledWith('ADT Order'),
    );
  });

  it('shows the empty state', async () => {
    (getServiceRequests as jest.Mock).mockResolvedValue(bundleOf());
    renderWidget();
    await waitFor(() =>
      expect(screen.getByText('NO_DISPOSITIONS')).toBeInTheDocument(),
    );
  });

  it('passes encounter uuids for encounter mode', async () => {
    (getServiceRequests as jest.Mock).mockResolvedValue(bundleOf());
    renderWidget({ encounterUuids: ['enc-1'] });
    await waitFor(() =>
      expect(getServiceRequests).toHaveBeenCalledWith('cat-1', 'patient-1', [
        'enc-1',
      ]),
    );
  });

  it('notifies on fetch error', async () => {
    (getServiceRequests as jest.Mock).mockRejectedValue(new Error('boom'));
    renderWidget();
    await waitFor(() =>
      expect(addNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error' }),
      ),
    );
  });

  it('subscribes to consultation saved events', async () => {
    (getServiceRequests as jest.Mock).mockResolvedValue(bundleOf());
    renderWidget();
    expect(useSubscribeConsultationSaved).toHaveBeenCalled();
  });
});
