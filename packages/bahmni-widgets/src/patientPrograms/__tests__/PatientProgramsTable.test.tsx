import {
  DEFAULT_DATE_FORMAT,
  DEFAULT_DATE_FORMAT_STORAGE_KEY,
  formatDateTime,
} from '@bahmni/services';
import * as BahmniServices from '@bahmni/services';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { render, screen, act } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import * as CommonSearchUtils from '../../search/commonSearch/utils';
import PatientProgramsTable from '../PatientProgramsTable';
import { mockProgram } from './__mocks__/patientProgramMocks';

jest.mock('../../search/commonSearch/utils', () => ({
  ...jest.requireActual('../../search/commonSearch/utils'),
  resolveNavigationURL: jest.fn(),
}));

const mockResolveNavigationURL =
  CommonSearchUtils.resolveNavigationURL as jest.MockedFunction<
    typeof CommonSearchUtils.resolveNavigationURL
  >;

expect.extend(toHaveNoViolations);

jest.mock('../../hooks/usePatientUUID', () => ({
  usePatientUUID: jest.fn(() => 'test-patient-uuid'),
}));
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getPatientPrograms: jest.fn(),
  formatDateTime: jest.fn(),
}));

const mockFormatDateTime = formatDateTime as jest.MockedFunction<
  typeof formatDateTime
>;

describe('PatientProgramsTable', () => {
  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem(DEFAULT_DATE_FORMAT_STORAGE_KEY, DEFAULT_DATE_FORMAT);
    mockFormatDateTime.mockReturnValue({ formattedResult: '15/01/2023' });
  });

  afterEach(() => {
    queryClient.clear();
    localStorage.removeItem(DEFAULT_DATE_FORMAT_STORAGE_KEY);
  });

  const wrapper = (
    <QueryClientProvider client={queryClient}>
      <PatientProgramsTable
        config={{
          fields: [
            { name: 'programName' },
            { name: 'startDate' },
            { name: 'endDate' },
            { name: 'state' },
            { name: 'outcome' },
          ],
        }}
      />
    </QueryClientProvider>
  );

  it('should show loading state when data is loading', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: null,
      error: null,
      isError: false,
      isLoading: true,
    });
    render(wrapper);
    expect(
      screen.getByTestId('patient-programs-table-test-id'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('patient-programs-table-skeleton'),
    ).toBeInTheDocument();
  });

  it('should show error state when an error occurs', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: null,
      error: new Error('An unexpected error occurred'),
      isError: true,
      isLoading: false,
    });
    render(wrapper);
    expect(
      screen.getByTestId('patient-programs-table-test-id'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('patient-programs-table-error'),
    ).toBeInTheDocument();
  });

  it('should show empty state when there is no data', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: { programs: [], total: 0 },
      error: null,
      isError: false,
      isLoading: false,
    });
    render(wrapper);
    expect(
      screen.getByTestId('patient-programs-table-test-id'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('patient-programs-table-empty'),
    ).toBeInTheDocument();
  });

  it('should show programs table when patient has programs', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: {
        programs: [
          {
            id: 'program-1',
            uuid: 'program-uuid-1',
            programName: 'HIV Program',
            dateEnrolled: '2023-01-15T10:30:00.000+00:00',
            dateCompleted: null,
            outcomeName: null,
            outcomeDetails: null,
            currentStateName: 'On ART',
            attributes: {},
          },
          {
            id: 'program-2',
            uuid: 'program-uuid-2',
            programName: 'TB Program',
            dateEnrolled: '2022-06-10T08:15:00.000+00:00',
            dateCompleted: '2023-01-10T08:15:00.000+00:00',
            outcomeName: 'Cured',
            outcomeDetails: 'Patient completed treatment successfully',
            currentStateName: 'Treatment Complete',
            attributes: {},
          },
        ],
        total: 2,
      },
      error: null,
      isError: false,
      isLoading: false,
    });
    render(wrapper);
    expect(
      screen.getByTestId('patient-programs-table-test-id'),
    ).toBeInTheDocument();
    expect(screen.getByText('HIV Program')).toBeInTheDocument();
    const activeStateTag = screen.getByTestId('program-uuid-1-state-test-id');
    expect(activeStateTag).toHaveTextContent('On ART');
    expect(screen.getByText('TB Program')).toBeInTheDocument();
    const completedStateTag = screen.getByTestId(
      'program-uuid-2-state-test-id',
    );
    expect(completedStateTag).toHaveTextContent('Treatment Complete');
    expect(screen.getByText('Cured')).toBeInTheDocument();
  });

  it('should render custom program attributes', () => {
    const wrapperWithAttributes = (
      <QueryClientProvider client={queryClient}>
        <PatientProgramsTable
          config={{
            fields: [
              { name: 'programName' },
              { name: 'Registration Number' },
              { name: 'Treatment Category' },
              { name: 'startDate' },
              { name: 'state' },
            ],
          }}
        />
      </QueryClientProvider>
    );

    (useQuery as jest.Mock).mockReturnValue({
      data: {
        programs: [
          {
            id: 'program-1',
            uuid: 'program-uuid-1',
            programName: 'HIV Program',
            dateEnrolled: '2023-01-15T10:30:00.000+00:00',
            dateCompleted: null,
            outcomeName: null,
            outcomeDetails: null,
            currentStateName: null,
            attributes: {
              'Registration Number': 'REG123456',
              'Treatment Category': 'Category I',
            },
          },
          {
            id: 'program-2',
            uuid: 'program-uuid-2',
            programName: 'TB Program',
            dateEnrolled: '2022-06-10T08:15:00.000+00:00',
            dateCompleted: '2023-01-10T08:15:00.000+00:00',
            outcomeName: 'Cured',
            outcomeDetails: 'Patient completed treatment successfully',
            currentStateName: 'Treatment Complete',
            attributes: {
              'Registration Number': 'REG789012',
              'Treatment Category': null,
            },
          },
        ],
        total: 2,
      },
      error: null,
      isError: false,
      isLoading: false,
    });

    render(wrapperWithAttributes);
    expect(
      screen.getByTestId('patient-programs-table-test-id'),
    ).toBeInTheDocument();
    expect(screen.getByText('REG123456')).toBeInTheDocument();
    expect(screen.getByText('Category I')).toBeInTheDocument();
    expect(screen.getByText('REG789012')).toBeInTheDocument();
    const nullAttributeCell = screen.getByTestId(
      'program-uuid-2-Treatment Category-test-id',
    );
    expect(nullAttributeCell).toHaveTextContent('-');
  });

  describe('careManager', () => {
    it('should render the care manager value when present', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: {
          programs: [
            {
              id: 'program-1',
              uuid: 'program-uuid-1',
              programName: 'HIV Program',
              dateEnrolled: '2023-01-15T10:30:00.000+00:00',
              dateCompleted: null,
              outcomeName: null,
              outcomeDetails: null,
              currentStateName: null,
              careManagerDisplay: 'Dr. Test',
              attributes: {},
            },
          ],
          total: 1,
        },
        error: null,
        isError: false,
        isLoading: false,
      });

      render(
        <QueryClientProvider client={queryClient}>
          <PatientProgramsTable
            config={{
              fields: [{ name: 'programName' }, { name: 'careManager' }],
            }}
          />
        </QueryClientProvider>,
      );

      expect(
        screen.getByTestId('program-uuid-1-care-manager-test-id'),
      ).toHaveTextContent('Dr. Test');
    });

    it("should render '-' when the care manager is null", () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: {
          programs: [
            {
              id: 'program-1',
              uuid: 'program-uuid-1',
              programName: 'HIV Program',
              dateEnrolled: '2023-01-15T10:30:00.000+00:00',
              dateCompleted: null,
              outcomeName: null,
              outcomeDetails: null,
              currentStateName: null,
              careManagerDisplay: null,
              attributes: {},
            },
          ],
          total: 1,
        },
        error: null,
        isError: false,
        isLoading: false,
      });

      render(
        <QueryClientProvider client={queryClient}>
          <PatientProgramsTable
            config={{
              fields: [{ name: 'programName' }, { name: 'careManager' }],
            }}
          />
        </QueryClientProvider>,
      );

      expect(
        screen.getByTestId('program-uuid-1-care-manager-test-id'),
      ).toHaveTextContent('-');
    });
  });

  describe('Pagination', () => {
    const manyPrograms = Array.from({ length: 3 }, (_, i) => ({
      id: `program-${i + 1}`,
      uuid: `program-uuid-${i + 1}`,
      programName: `Program ${i + 1}`,
      dateEnrolled: '2023-01-15T10:30:00.000+00:00',
      dateCompleted: null,
      outcomeName: null,
      outcomeDetails: null,
      currentStateName: null,
      attributes: {},
    }));

    it('renders pagination when server total exceeds pageSize', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: { programs: manyPrograms, total: 5 },
        error: null,
        isError: false,
        isLoading: false,
      });
      render(
        <QueryClientProvider client={queryClient}>
          <PatientProgramsTable
            config={{
              fields: [{ name: 'programName' }, { name: 'startDate' }],
              pageSize: 1,
            }}
          />
        </QueryClientProvider>,
      );
      expect(
        screen.getByRole('button', { name: /next page/i }),
      ).toBeInTheDocument();
    });

    it('shows pagination footer but disables next when server total is fewer than or equal to pageSize', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: { programs: manyPrograms, total: 3 },
        error: null,
        isError: false,
        isLoading: false,
      });
      render(
        <QueryClientProvider client={queryClient}>
          <PatientProgramsTable
            config={{
              fields: [{ name: 'programName' }, { name: 'startDate' }],
              pageSize: 10,
            }}
          />
        </QueryClientProvider>,
      );
      expect(screen.getByRole('button', { name: /next page/i })).toBeDisabled();
    });

    it('displays the current page of programs returned by the server', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: { programs: manyPrograms.slice(0, 2), total: 3 },
        error: null,
        isError: false,
        isLoading: false,
      });
      render(
        <QueryClientProvider client={queryClient}>
          <PatientProgramsTable
            config={{
              fields: [{ name: 'programName' }, { name: 'startDate' }],
              pageSize: 2,
            }}
          />
        </QueryClientProvider>,
      );
      expect(screen.getByText('Program 1')).toBeInTheDocument();
      expect(screen.getByText('Program 2')).toBeInTheDocument();
      expect(screen.queryByText('Program 3')).not.toBeInTheDocument();
    });
  });

  it('should match snapshot with program data', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: {
        programs: [
          {
            id: 'program-1',
            uuid: 'program-uuid-1',
            programName: 'HIV Program',
            dateEnrolled: '2023-01-15T10:30:00.000+00:00',
            dateCompleted: null,
            outcomeName: null,
            outcomeDetails: null,
            currentStateName: 'On ART',
            attributes: {},
          },
          {
            id: 'program-2',
            uuid: 'program-uuid-2',
            programName: 'TB Program',
            dateEnrolled: '2022-06-10T08:15:00.000+00:00',
            dateCompleted: '2023-01-10T08:15:00.000+00:00',
            outcomeName: 'Cured',
            outcomeDetails: 'Patient completed treatment successfully',
            currentStateName: 'Treatment Complete',
            attributes: {},
          },
        ],
        total: 2,
      },
      error: null,
      isError: false,
      isLoading: false,
    });
    const { container } = render(wrapper);
    expect(container).toMatchSnapshot();
  });

  describe('renderAttributeValue', () => {
    it('should render raw attribute value when field is not in enableTranslation', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: { programs: [mockProgram], total: 1 },
        error: null,
        isError: false,
        isLoading: false,
      });

      render(
        <QueryClientProvider client={queryClient}>
          <PatientProgramsTable
            config={{ fields: [{ name: 'treatmentCategory' }] }}
          />
        </QueryClientProvider>,
      );

      expect(
        screen.getByTestId('program-uuid-1-treatmentCategory-test-id'),
      ).toHaveTextContent('categoryI');
    });

    it('should return "-" for missing attribute when field is in enableTranslation', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: { programs: [mockProgram], total: 1 },
        error: null,
        isError: false,
        isLoading: false,
      });

      render(
        <QueryClientProvider client={queryClient}>
          <PatientProgramsTable
            config={{
              fields: [{ name: 'missingField', enableTranslation: true }],
            }}
          />
        </QueryClientProvider>,
      );

      expect(
        screen.getByTestId('program-uuid-1-missingField-test-id'),
      ).toHaveTextContent('-');
    });

    it('should translate attribute value using EOC key when enableTranslation is true', () => {
      const mockT = jest.fn((key: string, fallback: string) => fallback);
      const useTranslationSpy = jest
        .spyOn(BahmniServices, 'useTranslation')
        .mockReturnValue({ t: mockT });

      (useQuery as jest.Mock).mockReturnValue({
        data: { programs: [mockProgram], total: 1 },
        error: null,
        isError: false,
        isLoading: false,
      });

      render(
        <QueryClientProvider client={queryClient}>
          <PatientProgramsTable
            config={{
              fields: [{ name: 'treatmentCategory', enableTranslation: true }],
            }}
          />
        </QueryClientProvider>,
      );

      expect(mockT).toHaveBeenCalledWith(
        'PROGRAM_ATTRIBUTE_VALUE_TREATMENT_CATEGORY_CATEGORY_I',
        'categoryI',
      );
      expect(
        screen.getByTestId('program-uuid-1-treatmentCategory-test-id'),
      ).toHaveTextContent('categoryI');

      useTranslationSpy.mockRestore();
    });

    it('should call formatDateTime and render the result when attribute value is of Date type', () => {
      mockFormatDateTime.mockReturnValue({ formattedResult: '04/02/2026' });

      (useQuery as jest.Mock).mockReturnValue({
        data: {
          programs: [
            {
              ...mockProgram,
              attributes: {
                treatmentDate: new Date('2026-02-04T00:00:00.000Z'),
              },
            },
          ],
          total: 1,
        },
        error: null,
        isError: false,
        isLoading: false,
      });

      render(
        <QueryClientProvider client={queryClient}>
          <PatientProgramsTable
            config={{ fields: [{ name: 'treatmentDate' }] }}
          />
        </QueryClientProvider>,
      );

      expect(mockFormatDateTime).toHaveBeenCalledWith(
        new Date('2026-02-04T00:00:00.000Z'),
        expect.any(Function),
      );
      expect(
        screen.getByTestId('program-uuid-1-treatmentDate-test-id'),
      ).toHaveTextContent('04/02/2026');
    });
  });

  describe('programNavigation', () => {
    const mockEnrollment = {
      uuid: 'program-uuid-1',
      patient: { uuid: 'test-patient-uuid' },
      program: { name: 'HIV Program' },
      dateEnrolled: '2023-01-15T10:30:00.000+00:00',
      dateCompleted: null,
    } as any;

    const programWithEnrollment = {
      data: {
        programs: [
          {
            id: 'program-1',
            uuid: 'program-uuid-1',
            programName: 'HIV Program',
            dateEnrolled: '2023-01-15T10:30:00.000+00:00',
            dateCompleted: null,
            outcomeName: null,
            outcomeDetails: null,
            currentStateName: null,
            attributes: {},
          },
        ],
        enrollments: [mockEnrollment],
        total: 1,
      },
      error: null,
      isError: false,
      isLoading: false,
    };

    beforeEach(() => {
      mockResolveNavigationURL.mockReset();
    });

    it('renders program name as a Link when navigationUrl matches', async () => {
      mockResolveNavigationURL.mockResolvedValue(
        '/bahmni/hiv?patientUuid=test-patient-uuid&enrollmentUuid=program-uuid-1',
      );
      (useQuery as jest.Mock).mockReturnValue(programWithEnrollment);

      await act(async () => {
        render(
          <QueryClientProvider client={queryClient}>
            <PatientProgramsTable
              config={{
                fields: [{ name: 'programName' }],
                navigationUrl:
                  '/bahmni/hiv?patientUuid={patient.uuid}&enrollmentUuid={uuid}',
              }}
            />
          </QueryClientProvider>,
        );
      });

      const link = screen.getByTestId('program-uuid-1-program-name-test-id');
      expect(link.tagName.toLowerCase()).toBe('a');
      expect(link).toHaveAttribute(
        'href',
        '/bahmni/hiv?patientUuid=test-patient-uuid&enrollmentUuid=program-uuid-1',
      );
      expect(link).toHaveTextContent('HIV Program');
    });

    it('renders program name as a Link using navigationUrlByProgram when program matches', async () => {
      mockResolveNavigationURL.mockResolvedValue(
        '/bahmni/hiv-specific?patientUuid=test-patient-uuid',
      );
      (useQuery as jest.Mock).mockReturnValue(programWithEnrollment);

      await act(async () => {
        render(
          <QueryClientProvider client={queryClient}>
            <PatientProgramsTable
              config={{
                fields: [{ name: 'programName' }],
                navigationUrl: '/bahmni/default?patientUuid={patient.uuid}',
                navigationUrlByProgram: [
                  {
                    program: 'HIV Program',
                    navigationURL:
                      '/bahmni/hiv-specific?patientUuid={patient.uuid}',
                  },
                ],
              }}
            />
          </QueryClientProvider>,
        );
      });

      expect(mockResolveNavigationURL).toHaveBeenCalledWith(
        '/bahmni/hiv-specific?patientUuid={patient.uuid}',
        expect.objectContaining({
          uuid: 'program-uuid-1',
          patientUuid: 'test-patient-uuid',
        }),
      );
    });

    it('falls back to navigationUrl when program is not in navigationUrlByProgram', async () => {
      mockResolveNavigationURL.mockResolvedValue(
        '/bahmni/default?patientUuid=test-patient-uuid',
      );
      (useQuery as jest.Mock).mockReturnValue(programWithEnrollment);

      await act(async () => {
        render(
          <QueryClientProvider client={queryClient}>
            <PatientProgramsTable
              config={{
                fields: [{ name: 'programName' }],
                navigationUrl: '/bahmni/default?patientUuid={patient.uuid}',
                navigationUrlByProgram: [
                  {
                    program: 'TB Program',
                    navigationURL: '/bahmni/tb?patientUuid={patient.uuid}',
                  },
                ],
              }}
            />
          </QueryClientProvider>,
        );
      });

      expect(mockResolveNavigationURL).toHaveBeenCalledWith(
        '/bahmni/default?patientUuid={patient.uuid}',
        expect.objectContaining({ uuid: 'program-uuid-1' }),
      );
    });

    it('renders program name as plain span when no navigation config is set', async () => {
      (useQuery as jest.Mock).mockReturnValue(programWithEnrollment);

      render(
        <QueryClientProvider client={queryClient}>
          <PatientProgramsTable
            config={{ fields: [{ name: 'programName' }] }}
          />
        </QueryClientProvider>,
      );

      const cell = screen.getByTestId('program-uuid-1-program-name-test-id');
      expect(cell.tagName.toLowerCase()).toBe('span');
      expect(mockResolveNavigationURL).not.toHaveBeenCalled();
    });

    it('renders program name as plain span when resolveNavigationURL returns null', async () => {
      mockResolveNavigationURL.mockResolvedValue(null);
      (useQuery as jest.Mock).mockReturnValue(programWithEnrollment);

      await act(async () => {
        render(
          <QueryClientProvider client={queryClient}>
            <PatientProgramsTable
              config={{
                fields: [{ name: 'programName' }],
                navigationUrl: '/bahmni/clinical?bad={nonExistentField}',
              }}
            />
          </QueryClientProvider>,
        );
      });

      const cell = screen.getByTestId('program-uuid-1-program-name-test-id');
      expect(cell.tagName.toLowerCase()).toBe('span');
    });

    it('passes raw enrollment and patientUuid as context to resolveNavigationURL', async () => {
      mockResolveNavigationURL.mockResolvedValue('/resolved-url');
      (useQuery as jest.Mock).mockReturnValue(programWithEnrollment);

      await act(async () => {
        render(
          <QueryClientProvider client={queryClient}>
            <PatientProgramsTable
              config={{
                fields: [{ name: 'programName' }],
                navigationUrl: '/bahmni/clinical?p={patient.uuid}',
              }}
            />
          </QueryClientProvider>,
        );
      });

      expect(mockResolveNavigationURL).toHaveBeenCalledWith(
        '/bahmni/clinical?p={patient.uuid}',
        {
          ...mockEnrollment,
          patientUuid: 'test-patient-uuid',
        },
      );
    });
  });

  describe('Accessibility', () => {
    it('passes accessibility tests with data', async () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: {
          programs: [
            {
              id: 'program-1',
              uuid: 'program-uuid-1',
              programName: 'HIV Program',
              dateEnrolled: '2023-01-15T10:30:00.000+00:00',
              dateCompleted: null,
              outcomeName: null,
              outcomeDetails: null,
              currentStateName: 'On ART',
              attributes: {},
            },
            {
              id: 'program-2',
              uuid: 'program-uuid-2',
              programName: 'TB Program',
              dateEnrolled: '2022-06-10T08:15:00.000+00:00',
              dateCompleted: '2023-01-10T08:15:00.000+00:00',
              outcomeName: 'Cured',
              outcomeDetails: 'Patient completed treatment successfully',
              currentStateName: 'Treatment Complete',
              attributes: {},
            },
          ],
          total: 2,
        },
        error: null,
        isError: false,
        isLoading: false,
      });
      const { container } = render(wrapper);
      await act(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });
  });
});
