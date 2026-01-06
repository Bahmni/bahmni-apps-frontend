import {
  getPatientRadiologyInvestigations,
  getOrderTypes,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { ServiceRequest } from 'fhir/r4';
import { useNotification } from '../../notification';
import RadiologyInvestigationTable from '../RadiologyInvestigationTable';

jest.mock('../../notification');
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getPatientRadiologyInvestigations: jest.fn(),
  getOrderTypes: jest.fn(),
}));
jest.mock('../../hooks/usePatientUUID', () => ({
  usePatientUUID: jest.fn(() => 'test-patient-uuid'),
}));
const mockAddNotification = jest.fn();

const mockOrderTypesData = {
  results: [
    {
      uuid: 'radiology-uuid-123',
      display: 'Radiology Order',
    },
  ],
};

const mockValidRadiologyInvestigations: ServiceRequest[] = [
  {
    resourceType: 'ServiceRequest',
    id: 'investigation-1',
    meta: {
      versionId: '1',
      lastUpdated: '2025-06-13T08:48:15.000+00:00',
    },
    status: 'active',
    intent: 'order',
    category: [
      {
        coding: [
          {
            system: 'http://fhir.bahmni.org/code-system/order-type',
            code: 'd3561dc0-5e07-11ef-8f7c-0242ac120002',
            display: 'Radiology Order',
          },
        ],
        text: 'Radiology Order',
      },
    ],
    priority: 'stat',
    code: {
      coding: [
        {
          code: '40d1df86-45bd-4925-b831-7015da66d863',
          display: 'Chest X-Ray',
        },
        {
          system: 'http://snomed.info/sct',
          code: '168537006',
        },
      ],
      text: 'Chest X-Ray',
    },
    subject: {
      reference: 'Patient/test-patient-uuid',
      type: 'Patient',
      display: 'John Doe (Patient Identifier: ABC200003)',
    },
    encounter: {
      reference: 'Encounter/89a4fba9-5202-4403-b525-574f7a006819',
      type: 'Encounter',
    },
    occurrencePeriod: {
      start: '2023-12-01T10:30:00.000Z',
      end: '2023-12-01T10:30:00.000Z',
    },
    requester: {
      reference: 'Practitioner/d7a67c17-5e07-11ef-8f7c-0242ac120002',
      type: 'Practitioner',
      identifier: {
        value: 'drsmith',
      },
      display: 'Dr. Smith',
    },
    note: [
      {
        text: 'Patient should be fasting',
      },
    ],
  },
];

describe('RadiologyInvestigationTable', () => {
  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });
  beforeEach(() => {
    jest.clearAllMocks();
    (useNotification as jest.Mock).mockReturnValue({
      addNotification: mockAddNotification,
    });
  });
  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = (
    <QueryClientProvider client={queryClient}>
      <RadiologyInvestigationTable config={{ orderType: 'Radiology Order' }} />
    </QueryClientProvider>
  );

  it('should show radiology investigations table when patient has investigations', async () => {
    (getOrderTypes as jest.Mock).mockResolvedValue(mockOrderTypesData);
    (getPatientRadiologyInvestigations as jest.Mock).mockReturnValue(
      mockValidRadiologyInvestigations,
    );
    render(wrapper);
    expect(
      screen.getByTestId('radiology-investigations-table-test-id'),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Chest X-Ray')).toBeInTheDocument();
    });
    expect(screen.getByText('Chest X-Ray')).toBeInTheDocument();
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    expect(getPatientRadiologyInvestigations).toHaveBeenCalledTimes(1);
  });

  it('should show error state when an error occurs', async () => {
    (getOrderTypes as jest.Mock).mockResolvedValue(mockOrderTypesData);
    const errorMessage = 'Failed to fetch radiology investigations from server';
    (getPatientRadiologyInvestigations as jest.Mock).mockRejectedValue(
      new Error(errorMessage),
    );
    render(wrapper);
    expect(
      screen.getByTestId('radiology-investigations-table-test-id'),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('sortable-table-error')).toBeInTheDocument();
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'ERROR_DEFAULT_TITLE',
        message: 'Failed to fetch radiology investigations from server',
      });
    });
  });
});
