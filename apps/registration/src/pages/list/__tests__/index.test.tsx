import {
  AUDIT_LOG_EVENT_DETAILS,
  AuditEventType,
  dispatchAuditEvent,
} from '@bahmni/services';
import { NotificationProvider, UserPrivilegeProvider } from '@bahmni/widgets';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import RegistrationList from '..';
import { useRegistrationConfig } from '../../../providers/registrationConfig';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  dispatchAuditEvent: jest.fn(),
  getCurrentUser: jest.fn().mockResolvedValue({
    username: 'testuser',
    uuid: 'test-uuid',
  }),
  notificationService: {
    register: jest.fn(),
    showError: jest.fn(),
    showSuccess: jest.fn(),
    showWarning: jest.fn(),
    showInfo: jest.fn(),
  },
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

jest.mock('../../../providers/registrationConfig', () => ({
  ...jest.requireActual('../../../providers/registrationConfig'),
  useRegistrationConfig: jest.fn(),
}));

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  UserGlobalAction: jest.fn(() => <div data-testid="user-global-action" />),
  register: jest.fn(),
  SearchPatient: jest.fn(() => <div data-testid="search-patient-widget" />),
}));

const mockRegistrationConfig = {
  patientSearch: {
    customAttributes: [],
    appointment: [],
  },
};

describe('RegistrationList', () => {
  const mockNavigate = jest.fn();

  const renderPage = () =>
    render(
      <MemoryRouter>
        <NotificationProvider>
          <UserPrivilegeProvider>
            <RegistrationList />
          </UserPrivilegeProvider>
        </NotificationProvider>
      </MemoryRouter>,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (useRegistrationConfig as jest.Mock).mockReturnValue({
      registrationConfig: mockRegistrationConfig,
    });
  });

  it("should log the user's visit to page", () => {
    renderPage();
    expect(dispatchAuditEvent).toHaveBeenCalledWith({
      eventType: AUDIT_LOG_EVENT_DETAILS.VIEWED_REGISTRATION_PATIENT_SEARCH
        .eventType as AuditEventType,
      module: AUDIT_LOG_EVENT_DETAILS.VIEWED_REGISTRATION_PATIENT_SEARCH.module,
    });
  });

  it('should render the header with breadcrumbs, globalActions, and Create New Patient button', () => {
    renderPage();
    expect(screen.getByTestId('user-global-action')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /create new patient/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('search-patient-widget')).toBeInTheDocument();
  });

  it('should navigate to new patient page when Create New Patient is clicked', async () => {
    renderPage();
    const createButton = screen.getByRole('button', {
      name: /create new patient/i,
    });
    fireEvent.click(createButton);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/registration/patient/new');
    });
  });
});
