import { NotificationProvider } from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RegistrationConfigProvider } from '../../../providers/registrationConfig';
import { VisitTypeSelector } from '../visitTypeSelector';

Element.prototype.scrollIntoView = jest.fn();

const mockGetVisitTypes = jest.fn();
const mockCheckIfActiveVisitExists = jest.fn();
const mockGetConfig = jest.fn();

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getVisitTypes: () => mockGetVisitTypes(),
  checkIfActiveVisitExists: (patientUuid: string) =>
    mockCheckIfActiveVisitExists(patientUuid),
  getConfig: () => mockGetConfig(),
  useTranslation: () => ({
    t: (key: string, params?: Record<string, any>) => {
      if (key === 'START_VISIT_TYPE' && params?.visitType) {
        return `Start ${params.visitType} visit`;
      }
      if (key === 'ENTER_VISIT_DETAILS') {
        return 'Enter Visit Details';
      }
      if (key === 'PATIENT_DASHBOARD_REDIRECT') {
        return 'Patient Dashboard';
      }
      return key;
    },
  }),
}));

const mockVisitTypes = {
  visitTypes: {
    EMERGENCY: '493ebb53-b2bd-4ced-b444-e0965804d771',
    OPD: '54f43754-c6ce-4472-890e-0f28acaeaea6',
    IPD: 'b7494a80-fdf9-49bb-bb40-396c47b40343',
  },
};

describe('VisitTypeSelector', () => {
  let queryClient: QueryClient;
  let mockOnVisitTypeSelect: jest.Mock;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    mockOnVisitTypeSelect = jest.fn();
    jest.clearAllMocks();
    queryClient.clear();

    mockGetVisitTypes.mockResolvedValue(mockVisitTypes);
    mockCheckIfActiveVisitExists.mockResolvedValue(false);
    mockGetConfig.mockResolvedValue({
      patientSearch: { customAttributes: [], appointment: [] },
      defaultVisitType: 'OPD',
    });
  });

  const renderComponent = (
    patientUuid?: string,
    extraProps?: {
      activeVisitLabel?: string;
      onActiveVisitClick?: () => void;
    },
  ) => {
    const initialEntries = patientUuid
      ? [`/patient/${patientUuid}`]
      : ['/patient/new'];

    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <NotificationProvider>
          <QueryClientProvider client={queryClient}>
            <RegistrationConfigProvider>
              <Routes>
                <Route
                  path="/patient/:patientUuid?"
                  element={
                    <VisitTypeSelector
                      onVisitTypeSelect={mockOnVisitTypeSelect}
                      {...extraProps}
                    />
                  }
                />
              </Routes>
            </RegistrationConfigProvider>
          </QueryClientProvider>
        </NotificationProvider>
      </MemoryRouter>,
    );
  };

  it('shows the button with the right text for new patient', async () => {
    renderComponent();

    await waitFor(() => expect(mockGetVisitTypes).toHaveBeenCalled());
    await waitFor(() => expect(mockGetConfig).toHaveBeenCalled());

    const button = await screen.findByRole('button', {
      name: /Start OPD visit/i,
    });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('id', 'visit-button');
  });

  it('shows "Enter Visit Details" when patient has active visit and no activeVisitLabel provided', async () => {
    const patientUuid = '9891a8b4-7404-4c05-a207-5ec9d34fc719';
    mockCheckIfActiveVisitExists.mockResolvedValue(true);

    renderComponent(patientUuid);

    await waitFor(() => expect(mockGetVisitTypes).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockCheckIfActiveVisitExists).toHaveBeenCalledWith(patientUuid),
    );

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Enter Visit Details');
  });

  it('shows activeVisitLabel when patient has active visit and activeVisitLabel is provided', async () => {
    const patientUuid = '9891a8b4-7404-4c05-a207-5ec9d34fc719';
    mockCheckIfActiveVisitExists.mockResolvedValue(true);

    renderComponent(patientUuid, { activeVisitLabel: 'Patient Dashboard' });

    await waitFor(() => expect(mockGetVisitTypes).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockCheckIfActiveVisitExists).toHaveBeenCalledWith(patientUuid),
    );

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Patient Dashboard');
  });

  it('calls onActiveVisitClick when provided and hasActiveVisit is true', async () => {
    const patientUuid = '9891a8b4-7404-4c05-a207-5ec9d34fc719';
    const mockOnActiveVisitClick = jest.fn();
    mockCheckIfActiveVisitExists.mockResolvedValue(true);

    renderComponent(patientUuid, {
      onActiveVisitClick: mockOnActiveVisitClick,
    });

    await waitFor(() => expect(mockGetVisitTypes).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockCheckIfActiveVisitExists).toHaveBeenCalledWith(patientUuid),
    );

    const user = userEvent.setup();
    const button = screen.getByRole('button');
    await user.click(button);

    expect(mockOnActiveVisitClick).toHaveBeenCalled();
    expect(mockOnVisitTypeSelect).not.toHaveBeenCalled();
  });

  it('button kind is "primary" when hasActiveVisit is true', async () => {
    const patientUuid = '9891a8b4-7404-4c05-a207-5ec9d34fc719';
    mockCheckIfActiveVisitExists.mockResolvedValue(true);

    renderComponent(patientUuid);

    await waitFor(() => expect(mockGetVisitTypes).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockCheckIfActiveVisitExists).toHaveBeenCalledWith(patientUuid),
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('cds--btn--primary');
  });

  it('shows arrow icon when hasActiveVisit is true', async () => {
    const patientUuid = '9891a8b4-7404-4c05-a207-5ec9d34fc719';
    mockCheckIfActiveVisitExists.mockResolvedValue(true);

    renderComponent(patientUuid);

    await waitFor(() => expect(mockGetVisitTypes).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockCheckIfActiveVisitExists).toHaveBeenCalledWith(patientUuid),
    );

    expect(screen.getByTestId('patient-dashboard-arrow')).toBeInTheDocument();
  });

  it('does not show arrow icon when hasActiveVisit is false', async () => {
    renderComponent();

    await waitFor(() => expect(mockGetVisitTypes).toHaveBeenCalled());

    expect(
      screen.queryByTestId('patient-dashboard-arrow'),
    ).not.toBeInTheDocument();
  });

  it('shows the dropdown with the correct list of items when no active visit', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => expect(mockGetVisitTypes).toHaveBeenCalled());

    const dropdown = screen.getByRole('combobox');
    expect(dropdown).toBeInTheDocument();

    await user.click(dropdown);

    await waitFor(() => {
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(2);
    });
  });

  it('hides dropdown when patient has active visit', async () => {
    const patientUuid = '9891a8b4-7404-4c05-a207-5ec9d34fc719';
    mockCheckIfActiveVisitExists.mockResolvedValue(true);

    renderComponent(patientUuid);

    await waitFor(() => expect(mockGetVisitTypes).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockCheckIfActiveVisitExists).toHaveBeenCalledWith(patientUuid),
    );

    const dropdown = screen.queryByRole('combobox');
    expect(dropdown).not.toBeInTheDocument();
  });

  it('button click calls onVisitTypeSelect with selected visit type', async () => {
    renderComponent();
    const user = userEvent.setup();

    await waitFor(() => expect(mockGetVisitTypes).toHaveBeenCalled());

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(mockOnVisitTypeSelect).toHaveBeenCalledWith({
        name: 'OPD',
        uuid: '54f43754-c6ce-4472-890e-0f28acaeaea6',
      });
    });
  });

  it('dropdown selection calls onVisitTypeSelect with selected visit type', async () => {
    renderComponent();
    const user = userEvent.setup();

    await waitFor(() => expect(mockGetVisitTypes).toHaveBeenCalled());

    const dropdown = screen.getByRole('combobox');
    await user.click(dropdown);

    const optionToSelect = screen.getByText('Start IPD visit');
    await user.click(optionToSelect);

    await waitFor(() => {
      expect(mockOnVisitTypeSelect).toHaveBeenCalledWith({
        name: 'IPD',
        uuid: 'b7494a80-fdf9-49bb-bb40-396c47b40343',
      });
    });
  });
});
