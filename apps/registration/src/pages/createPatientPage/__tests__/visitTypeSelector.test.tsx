import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VisitTypeSelector } from '../visitTypeSelector';

Element.prototype.scrollIntoView = jest.fn();

const mockGetVisitTypes = jest.fn();
const mockCreateVisit = jest.fn();
const mockGetUserLoginLocation = jest.fn();

const mockNotificationService = {
  showError: jest.fn(),
};

jest.mock('@bahmni-frontend/bahmni-services', () => ({
  ...jest.requireActual('@bahmni-frontend/bahmni-services'),
  getVisitTypes: () => mockGetVisitTypes(),
  createVisit: (data: any) => mockCreateVisit(data),
  getUserLoginLocation: () => mockGetUserLoginLocation(),
  get notificationService() {
    return mockNotificationService;
  },
  useTranslation: () => ({
    t: (key: string, params?: Record<string, any>) => {
      if (key === 'START_VISIT_TYPE' && params?.visitType) {
        return `Start ${params.visitType} visit`;
      }
      return key;
    },
  }),
}));

const mockVisitTypes = [
  { name: 'EMERGENCY', uuid: '493ebb53-b2bd-4ced-b444-e0965804d771' },
  { name: 'OPD', uuid: '54f43754-c6ce-4472-890e-0f28acaeaea6' },
  { name: 'IPD', uuid: 'b7494a80-fdf9-49bb-bb40-396c47b40343' },
  { name: 'Special OPD', uuid: 'f3185c75-2c8c-476a-bf95-c77e8bb42edd' },
  { name: 'Follow Up', uuid: '9772f68d-9fc5-4470-9b87-2b6139011cad' },
];

const mockLoginLocation = {
  name: 'Support',
  uuid: '9772f68d-9fc5-4470-9b87-2b6139011cad3',
};

describe('VisitTypeSelector', () => {
  let queryClient: QueryClient;
  let mockOnVisitSave: jest.Mock;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    mockOnVisitSave = jest.fn();
    jest.clearAllMocks();
    queryClient.clear();

    mockGetUserLoginLocation.mockReturnValue(mockLoginLocation);
    mockGetVisitTypes.mockResolvedValue(mockVisitTypes);
    mockCreateVisit.mockResolvedValue({
      location: mockLoginLocation.uuid,
      patient: '9891a8b4-7404-4c05-a207-5ec9d34fc719',
      visitType: '54f43754-c6ce-4472-890e-0f28acaeaea6',
    });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <VisitTypeSelector onVisitSave={mockOnVisitSave} />
      </QueryClientProvider>,
    );
  };

  it('shows the button with the right text and look', async () => {
    renderComponent();

    await waitFor(() => expect(mockGetVisitTypes).toHaveBeenCalled());

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('id', 'visit-button');
  });

  it('shows the dropdown with the correct list of items', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => expect(mockGetVisitTypes).toHaveBeenCalled());

    const dropdown = screen.getByRole('combobox');
    expect(dropdown).toBeInTheDocument();

    await user.click(dropdown);

    await waitFor(() => {
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(4);
    });
  });

  it('button click will save the patient and navigate to another page', async () => {
    const patientUuid = '9891a8b4-7404-4c05-a207-5ec9d34fc719';
    mockOnVisitSave.mockResolvedValue(patientUuid);

    delete (window as any).location;
    window.location = { href: '' } as any;

    renderComponent();
    const user = userEvent.setup();

    await waitFor(() => expect(mockGetVisitTypes).toHaveBeenCalled());

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(mockOnVisitSave).toHaveBeenCalled();
      expect(window.location.href).toBe(
        `/bahmni/registration/index.html#/patient/${patientUuid}/visit`,
      );
    });
  });

  it('dropdown selection will save the patient and navigate to another page', async () => {
    const patientUuid = '9891a8b4-7404-4c05-a207-5ec9d34fc719';
    mockOnVisitSave.mockResolvedValue(patientUuid);

    delete (window as any).location;
    window.location = { href: '' } as any;

    renderComponent();
    const user = userEvent.setup();

    await waitFor(() => expect(mockGetVisitTypes).toHaveBeenCalled());

    const dropdown = screen.getByRole('combobox');
    await user.click(dropdown);

    const optionToSelect = screen.getByText('Start IPD visit');
    await user.click(optionToSelect);

    await waitFor(() => {
      expect(mockOnVisitSave).toHaveBeenCalled();
    });

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('LOADING_PATIENT_DETAILS')).toBeInTheDocument();

    expect(window.location.href).toBe(
      `/bahmni/registration/index.html#/patient/${patientUuid}/visit`,
    );
  });

  it('should show error notification when getVisitTypes query fails', async () => {
    const error = new Error('Failed to fetch visit types');
    mockGetVisitTypes.mockRejectedValue(error);

    renderComponent();

    await waitFor(() => {
      expect(mockGetVisitTypes).toHaveBeenCalled();
      expect(mockNotificationService.showError).toHaveBeenCalledWith(
        'ERROR_DEFAULT_TITLE',
        error.message,
      );
    });
  });

  it('should show error notification when createVisit query fails', async () => {
    const patientUuid = '9891a8b4-7404-4c05-a207-5ec9d34fc719';
    const error = new Error('Failed to create visit');
    mockOnVisitSave.mockResolvedValue(patientUuid);
    mockCreateVisit.mockRejectedValue(error);

    delete (window as any).location;
    window.location = { href: '' } as any;

    renderComponent();
    const user = userEvent.setup();

    await waitFor(() => expect(mockGetVisitTypes).toHaveBeenCalled());

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(mockOnVisitSave).toHaveBeenCalled();
      expect(mockNotificationService.showError).toHaveBeenCalledWith(
        'ERROR_DEFAULT_TITLE',
        error.message,
      );
    });
  });
});
