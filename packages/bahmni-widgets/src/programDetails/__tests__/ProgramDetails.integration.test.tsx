import { getProgramByUUID, ProgramEnrollment } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import ProgramDetails from '../ProgramDetails';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getProgramByUUID: jest.fn(),
}));

const mockProgramWithAttributes: ProgramEnrollment = {
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
  dateEnrolled: '2023-01-15T10:30:00.000+00:00',
  dateCompleted: null,
  location: null,
  voided: false,
  outcome: null,
  states: [
    {
      uuid: 'state-uuid-2',
      startDate: '2023-01-15T10:30:00.000+00:00',
      endDate: null,
      voided: false,
      state: {
        uuid: 'workflow-state-2',
        display: 'Treatment Phase',
        retired: false,
        concept: {
          uuid: 'state-concept-2',
          display: 'Treatment Phase',
          name: {
            uuid: 'name-2',
            display: 'Treatment Phase',
            name: 'Treatment Phase',
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
  episodeUuid: 'episode-2',
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
};

describe('ProgramDetails Integration', () => {
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
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch and display program details correctly', async () => {
    (getProgramByUUID as jest.Mock).mockResolvedValue(
      mockProgramWithAttributes,
    );

    render(
      <QueryClientProvider client={queryClient}>
        <ProgramDetails
          programUUID="enrollment-uuid-2"
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
      screen.getByTestId('patient-programs-table-loading-test-id'),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByTestId('patient-programs-tile-test-id'),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByTestId('program-details-programName-value-test-id'),
    ).toHaveTextContent('TB Program');
    expect(screen.getByTestId('program-status-test-id')).toHaveTextContent(
      'Treatment Phase',
    );
    expect(screen.getByText('REG123456')).toBeInTheDocument();
    expect(screen.getByText('Category I')).toBeInTheDocument();

    expect(getProgramByUUID).toHaveBeenCalledTimes(1);
    expect(getProgramByUUID).toHaveBeenCalledWith('enrollment-uuid-2');
  });

  it('should show error state when an error occurs', async () => {
    const errorMessage = 'Failed to fetch program details from server';
    (getProgramByUUID as jest.Mock).mockRejectedValue(new Error(errorMessage));

    render(
      <QueryClientProvider client={queryClient}>
        <ProgramDetails
          programUUID="enrollment-uuid-1"
          config={{
            fields: ['programName', 'startDate', 'endDate', 'state'],
          }}
        />
      </QueryClientProvider>,
    );

    expect(
      screen.getByTestId('patient-programs-table-loading-test-id'),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByTestId('patient-programs-table-error-test-id'),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText('ERROR_FETCHING_PROGRAM_DETAILS'),
    ).toBeInTheDocument();
  });
});
