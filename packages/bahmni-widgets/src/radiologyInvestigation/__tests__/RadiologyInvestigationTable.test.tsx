import {
  getCategoryUuidFromOrderTypes,
  getPatientRadiologyInvestigationBundleWithImagingStudy,
  getDiagnosticReports,
  dispatchAuditEvent,
  useSubscribeConsultationSaved,
  useTranslation,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useNotification } from '../../notification';
import {
  mockCategoryUuid,
  createMockServiceRequest,
  createMockBundleWithServiceRequestAndImagingStudy,
  createMockImagingStudy,
} from '../__mocks__/mocks';
import RadiologyInvestigationTable from '../RadiologyInvestigationTable';

expect.extend(toHaveNoViolations);

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: jest.fn(),
  getCategoryUuidFromOrderTypes: jest.fn(),
  getPatientRadiologyInvestigationBundleWithImagingStudy: jest.fn(),
  getDiagnosticReports: jest.fn(),
  dispatchAuditEvent: jest.fn(),
  useSubscribeConsultationSaved: jest.fn(),
}));

jest.mock('../../notification', () => ({
  useNotification: jest.fn(),
}));

jest.mock('../../hooks/usePatientUUID', () => ({
  usePatientUUID: jest.fn(() => 'test-patient-uuid'),
}));

jest.mock('../../radiologyInvestigationReport', () => ({
  RadiologyInvestigationReport: ({ reportId }: { reportId: string }) => (
    <div data-testid="radiology-observations-test-id">
      Report ID: {reportId}
    </div>
  ),
}));

const mockUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;
const mockGetCategoryUuidFromOrderTypes =
  getCategoryUuidFromOrderTypes as jest.MockedFunction<
    typeof getCategoryUuidFromOrderTypes
  >;
const mockGetPatientRadiologyInvestigationBundleWithImagingStudy =
  getPatientRadiologyInvestigationBundleWithImagingStudy as jest.MockedFunction<
    typeof getPatientRadiologyInvestigationBundleWithImagingStudy
  >;
const mockGetDiagnosticReports = getDiagnosticReports as jest.MockedFunction<
  typeof getDiagnosticReports
>;
const mockDispatchAuditEvent = dispatchAuditEvent as jest.MockedFunction<
  typeof dispatchAuditEvent
>;
const mockUseNotification = useNotification as jest.MockedFunction<
  typeof useNotification
>;
const mockUseSubscribeConsultationSaved =
  useSubscribeConsultationSaved as jest.MockedFunction<
    typeof useSubscribeConsultationSaved
  >;

const renderRadiologyInvestigationTable = (
  config: Record<string, unknown> = { orderType: 'Radiology Order' },
  encounterUuids?: string[],
  episodeOfCareUuids?: string[],
) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <RadiologyInvestigationTable
        config={config}
        encounterUuids={encounterUuids}
        episodeOfCareUuids={episodeOfCareUuids}
      />
    </QueryClientProvider>
  );
};

describe('RadiologyInvestigationTable', () => {
  const mockAddNotification = jest.fn();

  const mockBundleWithInvestigations =
    createMockBundleWithServiceRequestAndImagingStudy(
      createMockServiceRequest({
        id: 'investigation-1',
        code: { text: 'Chest X-Ray' },
        priority: 'stat',
        requester: { display: 'Dr. Smith' },
        occurrencePeriod: { start: '2023-12-01T10:30:00.000Z' },
      }),
      [],
    );

  const mockBundleWithCTScan =
    createMockBundleWithServiceRequestAndImagingStudy(
      createMockServiceRequest({
        id: 'investigation-2',
        code: { text: 'CT Scan' },
        priority: 'routine',
        requester: { display: 'Dr. Johnson' },
        occurrencePeriod: { start: '2023-12-01T14:15:00.000Z' },
      }),
      [],
    );

  const mockBundleWithMultipleInvestigations = {
    resourceType: 'Bundle' as const,
    type: 'searchset' as const,
    entry: [
      ...(mockBundleWithInvestigations.entry ?? []),
      ...(mockBundleWithCTScan.entry ?? []),
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseTranslation.mockReturnValue({
      t: (key: string) => {
        const translations: Record<string, string> = {
          RADIOLOGY_INVESTIGATION_NAME: 'Investigation Name',
          RADIOLOGY_RESULTS: 'Results',
          RADIOLOGY_ORDERED_BY: 'Ordered By',
          SERVICE_REQUEST_ORDERED_STATUS: 'Status',
          RADIOLOGY_INVESTIGATION_HEADING: 'Radiology Investigations',
          NO_RADIOLOGY_INVESTIGATIONS: 'No radiology investigations recorded',
          ERROR_DEFAULT_TITLE: 'Error',
          RADIOLOGY_PRIORITY_URGENT: 'Urgent',
          RADIOLOGY_VIEW_IMAGES: 'View Images',
          RADIOLOGY_VIEW_REPORT: 'View Report',
          SERVICE_REQUEST_STATUS_ACTIVE: 'Active',
          SERVICE_REQUEST_STATUS_COMPLETED: 'Completed',
          SERVICE_REQUEST_STATUS_DRAFT: 'Draft',
          SERVICE_REQUEST_STATUS_REVOKED: 'Revoked',
          SERVICE_REQUEST_STATUS_UNKNOWN: 'Unknown',
        };
        return translations[key] || key;
      },
    } as any);

    mockUseNotification.mockReturnValue({
      addNotification: mockAddNotification,
      notifications: [],
      removeNotification: jest.fn(),
      clearAllNotifications: jest.fn(),
    });

    mockGetCategoryUuidFromOrderTypes.mockResolvedValue(mockCategoryUuid);
    mockGetPatientRadiologyInvestigationBundleWithImagingStudy.mockResolvedValue(
      { resourceType: 'Bundle', type: 'searchset', entry: [] },
    );
    mockGetDiagnosticReports.mockResolvedValue({
      resourceType: 'Bundle',
      type: 'searchset',
      entry: [],
    });
    mockUseSubscribeConsultationSaved.mockImplementation(() => {});
  });

  it('should show loading state when data is loading', () => {
    mockGetPatientRadiologyInvestigationBundleWithImagingStudy.mockImplementation(
      () => new Promise(() => {}),
    );

    render(renderRadiologyInvestigationTable());

    expect(
      screen.getByTestId('radiology-investigations-table-test-id'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('radiology-investigations-table-skeleton'),
    ).toBeInTheDocument();
  });

  it('should show error state when an error occurs', async () => {
    mockGetPatientRadiologyInvestigationBundleWithImagingStudy.mockRejectedValue(
      new Error('An unexpected error occurred'),
    );

    render(renderRadiologyInvestigationTable());

    await waitFor(() => {
      expect(
        screen.getByTestId('radiology-investigations-table-error'),
      ).toBeInTheDocument();
    });

    expect(mockAddNotification).toHaveBeenCalledWith({
      type: 'error',
      title: 'Error',
      message: 'An unexpected error occurred',
    });
  });

  it('should fetch categoryUuid and resolve when config has orderType', async () => {
    render(
      renderRadiologyInvestigationTable({
        orderType: 'Radiology Order',
      }),
    );

    await waitFor(() => {
      expect(mockGetCategoryUuidFromOrderTypes).toHaveBeenCalledWith(
        'Radiology Order',
      );
    });

    await waitFor(() => {
      expect(
        mockGetPatientRadiologyInvestigationBundleWithImagingStudy,
      ).toHaveBeenCalled();
    });
  });

  it('should not fetch radiology investigations when order type is not found', async () => {
    mockGetCategoryUuidFromOrderTypes.mockResolvedValue(undefined);

    render(
      renderRadiologyInvestigationTable({
        orderType: 'Non-existent Order Type',
      }),
    );

    await waitFor(() => {
      expect(mockGetCategoryUuidFromOrderTypes).toHaveBeenCalled();
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(
      mockGetPatientRadiologyInvestigationBundleWithImagingStudy,
    ).not.toHaveBeenCalled();
  });

  it('should show error notification when order types query fails', async () => {
    mockGetCategoryUuidFromOrderTypes.mockRejectedValue(
      new Error('Failed to fetch order types'),
    );

    render(
      renderRadiologyInvestigationTable({
        orderType: 'Radiology Order',
      }),
    );

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch order types',
      });
    });
  });

  it('should show empty state when there is no data', async () => {
    mockGetPatientRadiologyInvestigationBundleWithImagingStudy.mockResolvedValue(
      [],
    );

    render(renderRadiologyInvestigationTable());

    await waitFor(() => {
      expect(
        screen.getByTestId('radiology-investigations-table-empty'),
      ).toBeInTheDocument();
    });
  });

  it('should show radiology investigations table when patient has investigations', async () => {
    mockGetPatientRadiologyInvestigationBundleWithImagingStudy.mockResolvedValue(
      mockBundleWithMultipleInvestigations,
    );

    render(renderRadiologyInvestigationTable());

    await waitFor(() => {
      expect(screen.getByText('Chest X-Ray')).toBeInTheDocument();
      expect(screen.getByText('CT Scan')).toBeInTheDocument();
      expect(screen.getByText('Urgent')).toBeInTheDocument();
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      expect(screen.getByText('Dr. Johnson')).toBeInTheDocument();
    });
  });

  it('should render pacs result link when imaging studies with available status exist and pacsViewerUrl is configured', async () => {
    const mockBundleWithImagingStudies =
      createMockBundleWithServiceRequestAndImagingStudy(
        createMockServiceRequest({
          id: 'investigation-1',
          code: { text: 'Chest X-Ray' },
          priority: 'stat',
          requester: { display: 'Dr. Smith' },
          occurrencePeriod: { start: '2023-12-01T10:30:00.000Z' },
        }),
        [
          createMockImagingStudy({
            id: 'study-1',
            status: 'available',
            basedOn: [{ reference: 'ServiceRequest/investigation-1' }],
            identifier: [
              {
                system: 'urn:dicom:uid',
                value: '1.2.840.113619.2.55.3.1',
              },
            ],
          }),
          createMockImagingStudy({
            id: 'study-2',
            status: 'available',
            basedOn: [{ reference: 'ServiceRequest/investigation-1' }],
            identifier: [
              {
                system: 'urn:dicom:uid',
                value: '1.2.840.113619.2.55.3.2',
              },
            ],
          }),
        ],
      );

    mockGetCategoryUuidFromOrderTypes.mockResolvedValue(mockCategoryUuid);
    mockGetPatientRadiologyInvestigationBundleWithImagingStudy.mockResolvedValue(
      mockBundleWithImagingStudies,
    );

    render(
      renderRadiologyInvestigationTable({
        orderType: 'Radiology Order',
        pacsViewerUrl:
          'http://pacs.example.com/viewer?study={{StudyInstanceUIDs}}',
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByTestId('investigation-1-result-link-0-test-id'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('investigation-1-result-link-1-test-id'),
      ).toBeInTheDocument();
    });

    const firstLink = screen.getByTestId(
      'investigation-1-result-link-0-test-id',
    );
    await userEvent.click(firstLink);

    expect(mockDispatchAuditEvent).toHaveBeenCalledWith({
      eventType: 'VIEWED_RADIOLOGY_RESULTS',
      patientUuid: 'test-patient-uuid',
    });
  });

  it('should render "View Report" link when investigation has reportId', async () => {
    const mockBundleWithReport =
      createMockBundleWithServiceRequestAndImagingStudy(
        createMockServiceRequest({
          id: 'investigation-1',
          code: { text: 'Chest X-Ray' },
          priority: 'stat',
          status: 'completed',
          requester: { display: 'Dr. Smith' },
          occurrencePeriod: { start: '2023-12-01T10:30:00.000Z' },
        }),
        [],
      );

    mockGetPatientRadiologyInvestigationBundleWithImagingStudy.mockResolvedValue(
      mockBundleWithReport,
    );
    mockGetDiagnosticReports.mockResolvedValue({
      resourceType: 'Bundle',
      type: 'searchset',
      entry: [
        {
          resource: {
            resourceType: 'DiagnosticReport',
            id: 'report-123',
            status: 'final',
            code: { text: 'Chest X-Ray' },
            basedOn: [{ reference: 'ServiceRequest/investigation-1' }],
            resultsInterpreter: [{ display: 'Dr. Radiologist' }],
            issued: '2023-12-02T14:30:00.000Z',
          } as any,
        },
      ],
    });

    render(renderRadiologyInvestigationTable());

    await waitFor(() => {
      expect(
        screen.getByTestId('investigation-1-view-report-link-test-id'),
      ).toBeInTheDocument();
      expect(screen.getByText('View Report')).toBeInTheDocument();
    });
  });

  it('should open modal when "View Report" link is clicked', async () => {
    const mockBundleWithReport =
      createMockBundleWithServiceRequestAndImagingStudy(
        createMockServiceRequest({
          id: 'investigation-1',
          code: { text: 'Chest X-Ray' },
          priority: 'stat',
          status: 'completed',
          requester: { display: 'Dr. Smith' },
          occurrencePeriod: { start: '2023-12-01T10:30:00.000Z' },
        }),
        [],
      );

    mockGetPatientRadiologyInvestigationBundleWithImagingStudy.mockResolvedValue(
      mockBundleWithReport,
    );
    mockGetDiagnosticReports.mockResolvedValue({
      resourceType: 'Bundle',
      type: 'searchset',
      entry: [
        {
          resource: {
            resourceType: 'DiagnosticReport',
            id: 'report-123',
            status: 'final',
            code: { text: 'Chest X-Ray' },
            basedOn: [{ reference: 'ServiceRequest/investigation-1' }],
            resultsInterpreter: [{ display: 'Dr. Radiologist' }],
            issued: '2023-12-02T14:30:00.000Z',
          } as any,
        },
      ],
    });

    render(renderRadiologyInvestigationTable());

    await waitFor(() => {
      expect(
        screen.getByTestId('investigation-1-view-report-link-test-id'),
      ).toBeInTheDocument();
    });

    const viewReportLink = screen.getByTestId(
      'investigation-1-view-report-link-test-id',
    );
    await userEvent.click(viewReportLink);

    await waitFor(() => {
      expect(screen.getByTestId('diagnostic-report-modal')).toBeInTheDocument();
    });
  });

  it('should close modal when close is requested', async () => {
    const mockBundleWithReport =
      createMockBundleWithServiceRequestAndImagingStudy(
        createMockServiceRequest({
          id: 'investigation-1',
          code: { text: 'Chest X-Ray' },
          priority: 'stat',
          status: 'completed',
          requester: { display: 'Dr. Smith' },
          occurrencePeriod: { start: '2023-12-01T10:30:00.000Z' },
        }),
        [],
      );

    mockGetPatientRadiologyInvestigationBundleWithImagingStudy.mockResolvedValue(
      mockBundleWithReport,
    );
    mockGetDiagnosticReports.mockResolvedValue({
      resourceType: 'Bundle',
      type: 'searchset',
      entry: [
        {
          resource: {
            resourceType: 'DiagnosticReport',
            id: 'report-123',
            status: 'final',
            code: { text: 'Chest X-Ray' },
            basedOn: [{ reference: 'ServiceRequest/investigation-1' }],
            resultsInterpreter: [{ display: 'Dr. Radiologist' }],
            issued: '2023-12-02T14:30:00.000Z',
          } as any,
        },
      ],
    });

    render(renderRadiologyInvestigationTable());

    await waitFor(() => {
      expect(
        screen.getByTestId('investigation-1-view-report-link-test-id'),
      ).toBeInTheDocument();
    });

    const viewReportLink = screen.getByTestId(
      'investigation-1-view-report-link-test-id',
    );
    await userEvent.click(viewReportLink);

    await waitFor(() => {
      expect(screen.getByTestId('diagnostic-report-modal')).toBeInTheDocument();
    });

    const closeButton = screen.getByLabelText(/close/i);
    await userEvent.click(closeButton);

    await waitFor(() => {
      expect(
        screen.queryByTestId('diagnostic-report-modal'),
      ).not.toBeInTheDocument();
    });
  });

  it('should not render "View Report" link when investigation has no reportId', async () => {
    const mockBundleWithoutReport =
      createMockBundleWithServiceRequestAndImagingStudy(
        createMockServiceRequest({
          id: 'investigation-1',
          code: { text: 'Chest X-Ray' },
          priority: 'routine',
          status: 'active',
          requester: { display: 'Dr. Smith' },
          occurrencePeriod: { start: '2023-12-01T10:30:00.000Z' },
        }),
        [],
      );

    mockGetPatientRadiologyInvestigationBundleWithImagingStudy.mockResolvedValue(
      mockBundleWithoutReport,
    );

    render(renderRadiologyInvestigationTable());

    await waitFor(() => {
      expect(screen.getByText('Chest X-Ray')).toBeInTheDocument();
    });

    expect(
      screen.queryByTestId('investigation-1-view-report-link-test-id'),
    ).not.toBeInTheDocument();
  });

  it('should fetch diagnostic reports only for opened accordion', async () => {
    const mockBundleWithTwoDateGroups = {
      resourceType: 'Bundle' as const,
      type: 'searchset' as const,
      entry: [
        {
          resource: createMockServiceRequest({
            id: 'investigation-1',
            code: { text: 'Chest X-Ray' },
            priority: 'stat',
            status: 'completed',
            requester: { display: 'Dr. Smith' },
            occurrencePeriod: { start: '2023-12-01T10:30:00.000Z' },
          }),
        },
        {
          resource: createMockServiceRequest({
            id: 'investigation-2',
            code: { text: 'CT Scan' },
            priority: 'routine',
            status: 'completed',
            requester: { display: 'Dr. Johnson' },
            occurrencePeriod: { start: '2023-12-02T14:15:00.000Z' },
          }),
        },
      ],
    };

    mockGetPatientRadiologyInvestigationBundleWithImagingStudy.mockResolvedValue(
      mockBundleWithTwoDateGroups,
    );

    mockGetDiagnosticReports.mockResolvedValue({
      resourceType: 'Bundle',
      type: 'searchset',
      entry: [],
    });

    render(renderRadiologyInvestigationTable());

    await waitFor(() => {
      expect(screen.getByText('Chest X-Ray')).toBeInTheDocument();
    });

    expect(mockGetDiagnosticReports).toHaveBeenCalledTimes(1);
    expect(mockGetDiagnosticReports).toHaveBeenCalledWith('test-patient-uuid', [
      'investigation-1',
    ]);
  });

  it('should not refetch diagnostic reports for previously opened accordion', async () => {
    const mockBundleWithTwoDateGroups = {
      resourceType: 'Bundle' as const,
      type: 'searchset' as const,
      entry: [
        {
          resource: createMockServiceRequest({
            id: 'investigation-1',
            code: { text: 'Chest X-Ray' },
            priority: 'stat',
            status: 'completed',
            requester: { display: 'Dr. Smith' },
            occurrencePeriod: { start: '2023-12-01T10:30:00.000Z' },
          }),
        },
        {
          resource: createMockServiceRequest({
            id: 'investigation-2',
            code: { text: 'CT Scan' },
            priority: 'routine',
            status: 'completed',
            requester: { display: 'Dr. Johnson' },
            occurrencePeriod: { start: '2023-12-02T14:15:00.000Z' },
          }),
        },
      ],
    };

    mockGetPatientRadiologyInvestigationBundleWithImagingStudy.mockResolvedValue(
      mockBundleWithTwoDateGroups,
    );

    mockGetDiagnosticReports.mockResolvedValue({
      resourceType: 'Bundle',
      type: 'searchset',
      entry: [
        {
          resource: {
            resourceType: 'DiagnosticReport',
            id: 'report-1',
            status: 'final',
            code: { text: 'Chest X-Ray' },
            basedOn: [{ reference: 'ServiceRequest/investigation-1' }],
            performer: [{ display: 'Dr. Radiologist' }],
            issued: '2023-12-01T14:30:00.000Z',
          } as any,
        },
        {
          resource: {
            resourceType: 'DiagnosticReport',
            id: 'report-2',
            status: 'final',
            code: { text: 'CT Scan' },
            basedOn: [{ reference: 'ServiceRequest/investigation-2' }],
            performer: [{ display: 'Dr. Radiologist' }],
            issued: '2023-12-02T16:00:00.000Z',
          } as any,
        },
      ],
    });

    render(renderRadiologyInvestigationTable());

    await waitFor(() => {
      expect(screen.getByText('Chest X-Ray')).toBeInTheDocument();
      expect(
        screen.getByTestId('investigation-1-view-report-link-test-id'),
      ).toBeInTheDocument();
    });

    const accordionHeaders = screen.getAllByTestId('accordian-table-title');
    await userEvent.click(accordionHeaders[1]);

    await waitFor(() => {
      expect(
        screen.getByTestId('investigation-2-view-report-link-test-id'),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByTestId('investigation-1-view-report-link-test-id'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('investigation-2-view-report-link-test-id'),
    ).toBeInTheDocument();
  });

  describe('Accessibility', () => {
    it('passes accessibility tests with data', async () => {
      mockGetPatientRadiologyInvestigationBundleWithImagingStudy.mockResolvedValue(
        mockBundleWithMultipleInvestigations,
      );

      const { container } = render(renderRadiologyInvestigationTable());

      await waitFor(() => {
        expect(screen.getByText('Chest X-Ray')).toBeInTheDocument();
      });

      await act(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });
  });

  describe('consultation saved event subscription', () => {
    it('registers consultation saved event listener', async () => {
      mockGetPatientRadiologyInvestigationBundleWithImagingStudy.mockResolvedValue(
        mockBundleWithMultipleInvestigations,
      );

      render(renderRadiologyInvestigationTable());

      await waitFor(() => {
        expect(mockUseSubscribeConsultationSaved).toHaveBeenCalled();
      });
    });

    it('refetches data when consultation saved event is triggered with matching category', async () => {
      let eventCallback: (payload: any) => void = () => {};
      mockUseSubscribeConsultationSaved.mockImplementation((callback) => {
        eventCallback = callback;
      });

      mockGetCategoryUuidFromOrderTypes.mockResolvedValue(mockCategoryUuid);
      mockGetPatientRadiologyInvestigationBundleWithImagingStudy.mockResolvedValue(
        mockBundleWithMultipleInvestigations,
      );

      render(
        renderRadiologyInvestigationTable({
          orderType: 'Radiology Order',
        }),
      );

      await waitFor(() => {
        expect(screen.getByText('Chest X-Ray')).toBeInTheDocument();
      });

      mockGetPatientRadiologyInvestigationBundleWithImagingStudy.mockClear();

      eventCallback({
        patientUUID: 'test-patient-uuid',
        updatedResources: {
          conditions: false,
          allergies: false,
          medications: false,
          serviceRequests: { 'radiology order': true },
        },
      });

      await waitFor(() => {
        expect(
          mockGetPatientRadiologyInvestigationBundleWithImagingStudy,
        ).toHaveBeenCalled();
      });
    });

    it('does not refetch when event is for different patient', async () => {
      let eventCallback: (payload: any) => void = () => {};
      mockUseSubscribeConsultationSaved.mockImplementation((callback) => {
        eventCallback = callback;
      });

      mockGetCategoryUuidFromOrderTypes.mockResolvedValue(mockCategoryUuid);
      mockGetPatientRadiologyInvestigationBundleWithImagingStudy.mockResolvedValue(
        mockBundleWithMultipleInvestigations,
      );

      render(
        renderRadiologyInvestigationTable({
          orderType: 'Radiology Order',
        }),
      );

      await waitFor(() => {
        expect(screen.getByText('Chest X-Ray')).toBeInTheDocument();
      });

      mockGetPatientRadiologyInvestigationBundleWithImagingStudy.mockClear();

      eventCallback({
        patientUUID: 'different-patient',
        updatedResources: {
          conditions: false,
          allergies: false,
          medications: false,
          serviceRequests: { 'radiology order': true },
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(
        mockGetPatientRadiologyInvestigationBundleWithImagingStudy,
      ).not.toHaveBeenCalled();
    });

    it('does not refetch when different category was updated', async () => {
      let eventCallback: (payload: any) => void = () => {};
      mockUseSubscribeConsultationSaved.mockImplementation((callback) => {
        eventCallback = callback;
      });

      mockGetCategoryUuidFromOrderTypes.mockResolvedValue(mockCategoryUuid);
      mockGetPatientRadiologyInvestigationBundleWithImagingStudy.mockResolvedValue(
        mockBundleWithMultipleInvestigations,
      );

      render(
        renderRadiologyInvestigationTable({
          orderType: 'Radiology Order',
        }),
      );

      await waitFor(() => {
        expect(screen.getByText('Chest X-Ray')).toBeInTheDocument();
      });

      mockGetPatientRadiologyInvestigationBundleWithImagingStudy.mockClear();

      eventCallback({
        patientUUID: 'test-patient-uuid',
        updatedResources: {
          conditions: false,
          allergies: false,
          medications: false,
          serviceRequests: { 'lab order': true },
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(
        mockGetPatientRadiologyInvestigationBundleWithImagingStudy,
      ).not.toHaveBeenCalled();
    });
  });
});
