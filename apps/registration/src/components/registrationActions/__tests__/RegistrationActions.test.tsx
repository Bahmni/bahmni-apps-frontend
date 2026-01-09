import { AppExtensionConfig, type VisitType } from '@bahmni/services';
import { NotificationProvider } from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { useFilteredExtensions } from '../../../hooks/useFilteredExtensions';
import { useCreateVisit } from '../../../hooks/useVisit';
import * as extensionNavigation from '../../../utils/extensionNavigation';
import { RegistrationActions } from '../RegistrationActions';

jest.mock('../../../hooks/useFilteredExtensions');
jest.mock('../../../hooks/useVisit');
jest.mock('../../../utils/extensionNavigation');

const mockCreateVisit = jest.fn();
const mockUseCreateVisit = useCreateVisit as jest.MockedFunction<
  typeof useCreateVisit
>;

jest.mock('../../../pages/PatientRegister/visitTypeSelector', () => ({
  VisitTypeSelector: ({
    onVisitTypeSelect,
  }: {
    onVisitTypeSelect: (visitType: VisitType) => void;
  }) => (
    <div data-testid="visit-type-selector">
      <button
        data-testid="select-visit-type-button"
        onClick={() =>
          onVisitTypeSelect({ name: 'OPD', uuid: 'opd-visit-type-uuid' })
        }
      >
        Select Visit Type
      </button>
    </div>
  ),
}));

const mockUseFilteredExtensions = useFilteredExtensions as jest.MockedFunction<
  typeof useFilteredExtensions
>;

const renderWithRouter = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <BrowserRouter>{component}</BrowserRouter>
      </NotificationProvider>
    </QueryClientProvider>,
  );
};

describe('RegistrationActions', () => {
  const mockExtensions: AppExtensionConfig[] = [
    {
      id: 'bahmni.registration.navigation.patient.start.visit',
      extensionPointId: 'org.bahmni.registration.navigation',
      type: 'startVisit',
      translationKey: 'START_VISIT',
      url: '/visit',
      icon: 'fa-calendar',
      order: 1,
      requiredPrivilege: 'Start Visit',
    },
    {
      id: 'ext-2',
      extensionPointId: 'org.bahmni.registration.navigation',
      type: 'link',
      translationKey: 'PRINT_CARD',
      url: '/print',
      icon: 'fa-print',
      order: 2,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCreateVisit.mockReturnValue({
      createVisit: mockCreateVisit,
    });
  });

  it('should render nothing while loading', () => {
    mockUseFilteredExtensions.mockReturnValue({
      filteredExtensions: [],
      isLoading: true,
    });

    const { container } = renderWithRouter(
      <RegistrationActions extensionPointId="org.bahmni.registration.navigation" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when no extensions are returned', () => {
    mockUseFilteredExtensions.mockReturnValue({
      filteredExtensions: [],
      isLoading: false,
    });

    const { container } = renderWithRouter(
      <RegistrationActions extensionPointId="org.bahmni.registration.navigation" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render button for non-startVisit extensions', () => {
    mockUseFilteredExtensions.mockReturnValue({
      filteredExtensions: [mockExtensions[1]],
      isLoading: false,
    });

    renderWithRouter(
      <RegistrationActions extensionPointId="org.bahmni.registration.navigation" />,
    );

    expect(screen.getByText('PRINT_CARD')).toBeInTheDocument();
  });

  it('should render VisitTypeSelector for startVisit type', () => {
    mockUseFilteredExtensions.mockReturnValue({
      filteredExtensions: [mockExtensions[0]],
      isLoading: false,
    });

    renderWithRouter(
      <RegistrationActions extensionPointId="org.bahmni.registration.navigation" />,
    );

    expect(screen.getByTestId('visit-type-selector')).toBeInTheDocument();
  });

  it('should render icon for button extensions', () => {
    mockUseFilteredExtensions.mockReturnValue({
      filteredExtensions: [mockExtensions[1]],
      isLoading: false,
    });

    const { container } = renderWithRouter(
      <RegistrationActions extensionPointId="org.bahmni.registration.navigation" />,
    );

    const icons = container.querySelectorAll('.fa-print');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should render Button component for non-startVisit type', () => {
    mockUseFilteredExtensions.mockReturnValue({
      filteredExtensions: [mockExtensions[1]],
      isLoading: false,
    });

    const { container } = renderWithRouter(
      <RegistrationActions extensionPointId="org.bahmni.registration.navigation" />,
    );

    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
  });

  it('should render button for extensions with URL templates', () => {
    const extensionWithTemplate: AppExtensionConfig = {
      id: 'test-extension',
      extensionPointId: 'org.bahmni.registration.navigation',
      type: 'link',
      translationKey: 'VIEW_PATIENT',
      url: '/clinical/patient/{{patientUuid}}/dashboard',
      order: 1,
    };

    mockUseFilteredExtensions.mockReturnValue({
      filteredExtensions: [extensionWithTemplate],
      isLoading: false,
    });

    renderWithRouter(
      <RegistrationActions extensionPointId="org.bahmni.registration.navigation" />,
    );

    const button = screen.getByText('VIEW_PATIENT');
    expect(button).toBeInTheDocument();
  });

  describe('onBeforeNavigate callback', () => {
    const mockHandleExtensionNavigation = jest.spyOn(
      extensionNavigation,
      'handleExtensionNavigation',
    );

    beforeEach(() => {
      mockHandleExtensionNavigation.mockClear();
    });

    it('should call onBeforeNavigate before navigation', async () => {
      const onBeforeNavigate = jest.fn().mockResolvedValue(undefined);
      const extension: AppExtensionConfig = {
        id: 'test-extension',
        extensionPointId: 'org.bahmni.registration.navigation',
        type: 'link',
        translationKey: 'VIEW_PATIENT',
        url: '#/patient/123',
        order: 1,
      };

      mockUseFilteredExtensions.mockReturnValue({
        filteredExtensions: [extension],
        isLoading: false,
      });

      renderWithRouter(
        <RegistrationActions
          extensionPointId="org.bahmni.registration.navigation"
          onBeforeNavigate={onBeforeNavigate}
        />,
      );

      const button = screen.getByText('VIEW_PATIENT');
      fireEvent.click(button);

      await waitFor(() => {
        expect(onBeforeNavigate).toHaveBeenCalled();
      });
    });

    it('should not navigate if onBeforeNavigate returns null', async () => {
      const onBeforeNavigate = jest.fn().mockResolvedValue(null);
      const extension: AppExtensionConfig = {
        id: 'test-extension',
        extensionPointId: 'org.bahmni.registration.navigation',
        type: 'link',
        translationKey: 'VIEW_PATIENT',
        url: '#/patient/123',
        order: 1,
      };

      mockUseFilteredExtensions.mockReturnValue({
        filteredExtensions: [extension],
        isLoading: false,
      });

      renderWithRouter(
        <RegistrationActions
          extensionPointId="org.bahmni.registration.navigation"
          onBeforeNavigate={onBeforeNavigate}
        />,
      );

      const button = screen.getByText('VIEW_PATIENT');
      fireEvent.click(button);

      await waitFor(() => {
        expect(onBeforeNavigate).toHaveBeenCalled();
      });

      expect(mockHandleExtensionNavigation).not.toHaveBeenCalled();
    });

    it('should not navigate when onBeforeNavigate is not provided', async () => {
      const extension: AppExtensionConfig = {
        id: 'test-extension',
        extensionPointId: 'org.bahmni.registration.navigation',
        type: 'link',
        translationKey: 'VIEW_PATIENT',
        url: '#/patient/123',
        order: 1,
      };

      mockUseFilteredExtensions.mockReturnValue({
        filteredExtensions: [extension],
        isLoading: false,
      });

      renderWithRouter(
        <RegistrationActions extensionPointId="org.bahmni.registration.navigation" />,
      );

      const button = screen.getByText('VIEW_PATIENT');
      fireEvent.click(button);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockHandleExtensionNavigation).not.toHaveBeenCalled();
    });

    it('should navigate to extension url after successful onBeforeNavigate', async () => {
      const onBeforeNavigate = jest.fn().mockResolvedValue('patient-uuid-123');
      const extension: AppExtensionConfig = {
        id: 'test-extension',
        extensionPointId: 'org.bahmni.registration.navigation',
        type: 'link',
        translationKey: 'VIEW_PATIENT',
        url: '/clinical/patient/{{patientUuid}}/dashboard',
        order: 1,
      };

      mockUseFilteredExtensions.mockReturnValue({
        filteredExtensions: [extension],
        isLoading: false,
      });

      renderWithRouter(
        <RegistrationActions
          extensionPointId="org.bahmni.registration.navigation"
          onBeforeNavigate={onBeforeNavigate}
        />,
      );

      const button = screen.getByText('VIEW_PATIENT');
      fireEvent.click(button);

      await waitFor(() => {
        expect(onBeforeNavigate).toHaveBeenCalled();
        expect(mockHandleExtensionNavigation).toHaveBeenCalledWith(
          '/clinical/patient/{{patientUuid}}/dashboard',
          {},
          expect.any(Function),
        );
      });
    });
  });

  describe('handleVisitTypeSelect', () => {
    const mockHandleExtensionNavigation = jest.spyOn(
      extensionNavigation,
      'handleExtensionNavigation',
    );

    const startVisitExtension: AppExtensionConfig = {
      id: 'bahmni.registration.navigation.patient.start.visit',
      extensionPointId: 'org.bahmni.registration.navigation',
      type: 'startVisit',
      translationKey: 'START_VISIT',
      url: '/clinical/patient/{{patientUuid}}/dashboard',
      order: 1,
    };

    beforeEach(() => {
      mockHandleExtensionNavigation.mockClear();
      mockCreateVisit.mockClear();
    });

    it('should call onBeforeNavigate, createVisit and navigate when visit type is selected', async () => {
      const onBeforeNavigate = jest.fn().mockResolvedValue('patient-uuid-123');
      mockCreateVisit.mockResolvedValue(undefined);

      mockUseFilteredExtensions.mockReturnValue({
        filteredExtensions: [startVisitExtension],
        isLoading: false,
      });

      renderWithRouter(
        <RegistrationActions
          extensionPointId="org.bahmni.registration.navigation"
          onBeforeNavigate={onBeforeNavigate}
        />,
      );

      const selectButton = screen.getByTestId('select-visit-type-button');
      fireEvent.click(selectButton);

      await waitFor(() => {
        expect(onBeforeNavigate).toHaveBeenCalled();
        expect(mockCreateVisit).toHaveBeenCalledWith('patient-uuid-123', {
          name: 'OPD',
          uuid: 'opd-visit-type-uuid',
        });
        expect(mockHandleExtensionNavigation).toHaveBeenCalledWith(
          '/clinical/patient/{{patientUuid}}/dashboard',
          {},
          expect.any(Function),
        );
      });
    });

    it('should not call createVisit or navigate when onBeforeNavigate returns null', async () => {
      const onBeforeNavigate = jest.fn().mockResolvedValue(null);
      mockUseFilteredExtensions.mockReturnValue({
        filteredExtensions: [startVisitExtension],
        isLoading: false,
      });

      renderWithRouter(
        <RegistrationActions
          extensionPointId="org.bahmni.registration.navigation"
          onBeforeNavigate={onBeforeNavigate}
        />,
      );

      const selectButton = screen.getByTestId('select-visit-type-button');
      fireEvent.click(selectButton);

      await waitFor(() => {
        expect(onBeforeNavigate).toHaveBeenCalled();
      });

      expect(mockCreateVisit).not.toHaveBeenCalled();
      expect(mockHandleExtensionNavigation).not.toHaveBeenCalled();
    });
  });
});
