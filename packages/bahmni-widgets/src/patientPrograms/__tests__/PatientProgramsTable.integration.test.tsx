import { getPatientPrograms, PatientProgramsResponse } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { useNotification } from '../../notification';
import PatientProgramsTable from '../PatientProgramsTable';

jest.mock('../../notification');
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getPatientPrograms: jest.fn(),
}));
jest.mock('../../hooks/usePatientUUID', () => ({
  usePatientUUID: jest.fn(() => 'test-patient-uuid'),
}));

const mockAddNotification = jest.fn();

const mockPatientProgramsResponse: PatientProgramsResponse = {
  results: [
    {
      uuid: 'enrollment-uuid-1',
      display: 'HIV Program',
      patient: {
        uuid: 'test-patient-uuid',
        display: 'John Doe',
        identifiers: [
          {
            uuid: 'identifier-1',
            display: 'BAH123456',
            links: [],
          },
        ],
        person: {
          uuid: 'person-1',
          display: 'John Doe',
          gender: 'M',
          age: 35,
          birthdate: '1988-01-01',
          birthdateEstimated: false,
          dead: false,
          deathDate: null,
          causeOfDeath: null,
          preferredName: {
            uuid: 'name-1',
            display: 'John Doe',
          },
          preferredAddress: null,
          attributes: [],
          voided: false,
          birthtime: null,
          deathdateEstimated: false,
          links: [],
          resourceVersion: '1.0',
        },
        voided: false,
        links: [],
        resourceVersion: '1.0',
      },
      program: {
        uuid: 'program-uuid-1',
        name: 'HIV Program',
        display: 'HIV Program',
        retired: false,
        concept: {
          uuid: 'concept-1',
          display: 'HIV Program Concept',
          links: [],
          resourceVersion: '1.0',
        },
        allWorkflows: [],
        links: [],
        resourceVersion: '1.0',
      },
      dateEnrolled: '2023-01-15T10:30:00.000+00:00',
      dateCompleted: null,
      location: null,
      voided: false,
      outcome: null,
      states: [
        {
          uuid: 'state-uuid-1',
          startDate: '2023-01-15T10:30:00.000+00:00',
          endDate: null,
          voided: false,
          state: {
            uuid: 'workflow-state-1',
            display: 'On ART',
            retired: false,
            concept: {
              uuid: 'state-concept-1',
              display: 'On ART',
              name: {
                uuid: 'name-1',
                display: 'On ART',
                name: 'On ART',
                locale: 'en',
                localePreferred: true,
                conceptNameType: 'FULLY_SPECIFIED',
                links: [],
                resourceVersion: '1.0',
              },
              links: [],
              resourceVersion: '1.0',
            },
            links: [],
            resourceVersion: '1.0',
          },
        },
      ],
      attributes: [],
      episodeUuid: 'episode-1',
      auditInfo: {
        creator: {
          uuid: 'user-1',
          display: 'Admin User',
          links: [],
        },
        dateCreated: '2023-01-15T10:30:00.000+00:00',
        changedBy: null,
        dateChanged: null,
      },
      links: [],
      resourceVersion: '1.0',
    },
    {
      uuid: 'enrollment-uuid-2',
      display: 'TB Program',
      patient: {
        uuid: 'test-patient-uuid',
        display: 'John Doe',
        identifiers: [
          {
            uuid: 'identifier-1',
            display: 'BAH123456',
            links: [],
          },
        ],
        person: {
          uuid: 'person-1',
          display: 'John Doe',
          gender: 'M',
          age: 35,
          birthdate: '1988-01-01',
          birthdateEstimated: false,
          dead: false,
          deathDate: null,
          causeOfDeath: null,
          preferredName: {
            uuid: 'name-1',
            display: 'John Doe',
          },
          preferredAddress: null,
          attributes: [],
          voided: false,
          birthtime: null,
          deathdateEstimated: false,
          links: [],
          resourceVersion: '1.0',
        },
        voided: false,
        links: [],
        resourceVersion: '1.0',
      },
      program: {
        uuid: 'program-uuid-2',
        name: 'TB Program',
        display: 'TB Program',
        retired: false,
        concept: {
          uuid: 'concept-2',
          display: 'TB Program Concept',
          links: [],
          resourceVersion: '1.0',
        },
        allWorkflows: [],
        links: [],
        resourceVersion: '1.0',
      },
      dateEnrolled: '2022-06-10T08:15:00.000+00:00',
      dateCompleted: '2023-01-10T08:15:00.000+00:00',
      location: null,
      voided: false,
      outcome: {
        uuid: 'outcome-concept-1',
        display: 'Cured',
        name: {
          uuid: 'outcome-name-1',
          display: 'Cured',
          name: 'Cured',
          locale: 'en',
          localePreferred: true,
          conceptNameType: 'FULLY_SPECIFIED',
          links: [],
          resourceVersion: '1.0',
        },
        descriptions: [
          {
            uuid: 'outcome-desc-1',
            display: 'Patient completed treatment successfully',
            description: 'Patient completed treatment successfully',
            locale: 'en',
            links: [],
            resourceVersion: '1.0',
          },
        ],
        links: [],
        resourceVersion: '1.0',
      },
      states: [
        {
          uuid: 'state-uuid-2',
          startDate: '2022-06-10T08:15:00.000+00:00',
          endDate: '2023-01-10T08:15:00.000+00:00',
          voided: false,
          state: {
            uuid: 'workflow-state-2',
            display: 'Treatment Complete',
            retired: false,
            concept: {
              uuid: 'state-concept-2',
              display: 'Treatment Complete',
              name: {
                uuid: 'name-2',
                display: 'Treatment Complete',
                name: 'Treatment Complete',
                locale: 'en',
                localePreferred: true,
                conceptNameType: 'FULLY_SPECIFIED',
                links: [],
                resourceVersion: '1.0',
              },
              links: [],
              resourceVersion: '1.0',
            },
            links: [],
            resourceVersion: '1.0',
          },
        },
      ],
      attributes: [],
      episodeUuid: 'episode-2',
      auditInfo: {
        creator: {
          uuid: 'user-1',
          display: 'Admin User',
          links: [],
        },
        dateCreated: '2022-06-10T08:15:00.000+00:00',
        changedBy: null,
        dateChanged: null,
      },
      links: [],
      resourceVersion: '1.0',
    },
  ],
};

const mockPatientProgramsWithAttributes: PatientProgramsResponse = {
  results: [
    {
      uuid: 'enrollment-uuid-3',
      display: 'HIV Program with Attributes',
      patient: {
        uuid: 'test-patient-uuid',
        display: 'John Doe',
        identifiers: [
          {
            uuid: 'identifier-1',
            display: 'BAH123456',
            links: [],
          },
        ],
        person: {
          uuid: 'person-1',
          display: 'John Doe',
          gender: 'M',
          age: 35,
          birthdate: '1988-01-01',
          birthdateEstimated: false,
          dead: false,
          deathDate: null,
          causeOfDeath: null,
          preferredName: {
            uuid: 'name-1',
            display: 'John Doe',
          },
          preferredAddress: null,
          attributes: [],
          voided: false,
          birthtime: null,
          deathdateEstimated: false,
          links: [],
          resourceVersion: '1.0',
        },
        voided: false,
        links: [],
        resourceVersion: '1.0',
      },
      program: {
        uuid: 'program-uuid-3',
        name: 'HIV Program',
        display: 'HIV Program',
        retired: false,
        concept: {
          uuid: 'concept-3',
          display: 'HIV Program Concept',
          links: [],
          resourceVersion: '1.0',
        },
        allWorkflows: [],
        links: [],
        resourceVersion: '1.0',
      },
      dateEnrolled: '2023-01-15T10:30:00.000+00:00',
      dateCompleted: null,
      location: null,
      voided: false,
      outcome: null,
      states: [
        {
          uuid: 'state-uuid-3',
          startDate: '2023-01-15T10:30:00.000+00:00',
          endDate: null,
          voided: false,
          state: {
            uuid: 'workflow-state-3',
            display: 'On ART',
            retired: false,
            concept: {
              uuid: 'state-concept-3',
              display: 'On ART',
              name: {
                uuid: 'name-3',
                display: 'On ART',
                name: 'On ART',
                locale: 'en',
                localePreferred: true,
                conceptNameType: 'FULLY_SPECIFIED',
                links: [],
                resourceVersion: '1.0',
              },
              links: [],
              resourceVersion: '1.0',
            },
            links: [],
            resourceVersion: '1.0',
          },
        },
      ],
      attributes: [
        {
          uuid: 'attr-uuid-1',
          display: 'Registration Number: REG123456',
          attributeType: {
            uuid: 'attr-type-1',
            display: 'Registration Number',
            description: 'Patient registration number for the program',
            retired: false,
            links: [],
          },
          value: 'REG123456',
          voided: false,
          links: [],
          resourceVersion: '1.0',
        },
        {
          uuid: 'attr-uuid-2',
          display: 'Treatment Category: Category I',
          attributeType: {
            uuid: 'attr-type-2',
            display: 'Treatment Category',
            description: 'Treatment category for the patient',
            retired: false,
            links: [],
          },
          value: {
            uuid: 'category-concept-1',
            display: 'Category I',
            name: {
              uuid: 'category-name-1',
              display: 'Category I',
              name: 'Category I',
              locale: 'en',
              localePreferred: true,
              conceptNameType: 'FULLY_SPECIFIED',
              links: [],
              resourceVersion: '1.0',
            },
            links: [],
            resourceVersion: '1.0',
          },
          voided: false,
          links: [],
          resourceVersion: '1.0',
        },
      ],
      episodeUuid: 'episode-3',
      auditInfo: {
        creator: {
          uuid: 'user-1',
          display: 'Admin User',
          links: [],
        },
        dateCreated: '2023-01-15T10:30:00.000+00:00',
        changedBy: null,
        dateChanged: null,
      },
      links: [],
      resourceVersion: '1.0',
    },
  ],
};

describe('PatientProgramsTable Integration', () => {
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

  it('should fetch and display patient programs correctly', async () => {
    (getPatientPrograms as jest.Mock).mockResolvedValue(
      mockPatientProgramsResponse,
    );

    render(
      <QueryClientProvider client={queryClient}>
        <PatientProgramsTable
          config={{
            fields: ['programName', 'startDate', 'endDate', 'state', 'outcome'],
          }}
        />
      </QueryClientProvider>,
    );

    expect(
      screen.getByTestId('patient-programs-table-test-id'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('patient-programs-table-skeleton'),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('HIV Program')).toBeInTheDocument();
    });

    expect(screen.getByText('HIV Program')).toBeInTheDocument();
    expect(screen.getByText('TB Program')).toBeInTheDocument();

    const activeStateTag = screen.getByTestId(
      'enrollment-uuid-1-state-test-id',
    );
    expect(activeStateTag).toHaveTextContent('On ART');

    const completedStateTag = screen.getByTestId(
      'enrollment-uuid-2-state-test-id',
    );
    expect(completedStateTag).toHaveTextContent('Treatment Complete');

    expect(screen.getByText('Cured')).toBeInTheDocument();
    expect(
      screen.getByText('Patient completed treatment successfully'),
    ).toBeInTheDocument();

    expect(getPatientPrograms).toHaveBeenCalledTimes(1);
    expect(getPatientPrograms).toHaveBeenCalledWith('test-patient-uuid');
  });

  it('should show error state when an error occurs', async () => {
    const errorMessage = 'Failed to fetch patient programs from server';
    (getPatientPrograms as jest.Mock).mockRejectedValue(
      new Error(errorMessage),
    );

    render(
      <QueryClientProvider client={queryClient}>
        <PatientProgramsTable
          config={{
            fields: ['programName', 'startDate', 'endDate', 'state'],
          }}
        />
      </QueryClientProvider>,
    );

    expect(
      screen.getByTestId('patient-programs-table-test-id'),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByTestId('patient-programs-table-error'),
      ).toBeInTheDocument();
    });
  });

  it('should fetch and display custom program attributes', async () => {
    (getPatientPrograms as jest.Mock).mockResolvedValue(
      mockPatientProgramsWithAttributes,
    );

    render(
      <QueryClientProvider client={queryClient}>
        <PatientProgramsTable
          config={{
            fields: [
              'programName',
              'Registration Number',
              'Treatment Category',
              'startDate',
              'state',
            ],
          }}
        />
      </QueryClientProvider>,
    );

    expect(
      screen.getByTestId('patient-programs-table-test-id'),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('HIV Program')).toBeInTheDocument();
    });

    expect(screen.getByText('REG123456')).toBeInTheDocument();
    expect(screen.getByText('Category I')).toBeInTheDocument();

    expect(getPatientPrograms).toHaveBeenCalledTimes(1);
    expect(getPatientPrograms).toHaveBeenCalledWith('test-patient-uuid');
  });

  it('should display empty state when no programs exist', async () => {
    (getPatientPrograms as jest.Mock).mockResolvedValue({ results: [] });

    render(
      <QueryClientProvider client={queryClient}>
        <PatientProgramsTable
          config={{
            fields: ['programName', 'startDate', 'state'],
          }}
        />
      </QueryClientProvider>,
    );

    expect(
      screen.getByTestId('patient-programs-table-test-id'),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByTestId('patient-programs-table-empty'),
      ).toBeInTheDocument();
    });

    expect(getPatientPrograms).toHaveBeenCalledTimes(1);
  });
});
