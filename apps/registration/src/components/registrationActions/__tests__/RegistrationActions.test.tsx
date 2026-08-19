import { type VisitType } from '@bahmni/services';
import { NotificationProvider } from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { useFilteredExtensions } from '../../../hooks/useFilteredExtensions';
import { AppExtensionConfig } from '../../../providers/registrationConfig';
import * as extensionNavigation from '../../../utils/extensionNavigation';
import { RegistrationActions } from '../RegistrationActions';

const mockCreateVisit = jest.fn();

jest.mock('../../../hooks/useFilteredExtensions');
// useIsCreatingVisit is kept real (backed by the actual QueryClient cache)
// so tests can verify the startVisitInProgress guard set in
// RegistrationActions.handleVisitTypeSelect is actually observed reactively
// -- only useCreateVisit is stubbed so we can assert on/control its calls.
jest.mock('../../../hooks/useVisit', () => ({
  ...jest.requireActual('../../../hooks/useVisit'),
  useCreateVisit: () => ({ createVisit: mockCreateVisit }),
}));
jest.mock('../../../utils/extensionNavigation');

jest.mock('../../../pages/PatientRegister/visitTypeSelector', () => ({
  VisitTypeSelector: ({
    onVisitTypeSelect,
    activeVisitLabel,
    onActiveVisitClick,
    disabled,
    isLoading,
  }: {
    onVisitTypeSelect: (visitType: VisitType) => void;
    activeVisitLabel?: string;
    onActiveVisitClick?: () => void;
    disabled?: boolean;
    isLoading?: boolean;
  }) => (
    <div data-testid="visit-type-selector">
      <button
        data-testid="select-visit-type-button"
        disabled={disabled}
        onClick={() =>
          onVisitTypeSelect({ name: 'OPD', uuid: 'opd-visit-type-uuid' })
        }
      >
        {isLoading ? 'Loading' : 'Select Visit Type'}
      </button>
      {onActiveVisitClick && (
        <button data-testid="active-visit-button" onClick={onActiveVisitClick}>
          {activeVisitLabel ?? 'Enter Visit Details'}
        </button>
      )}
    </div>
  ),
}));

const mockUseFilteredExtensions = useFilteredExtensions as jest.MockedFunction<
  typeof useFilteredExtensions
>;

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const renderWithRouter = (
  component: React.ReactElement,
  queryClient: QueryClient = createTestQueryClient(),
) => {
  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          <BrowserRouter>{component}</BrowserRouter>
        </NotificationProvider>
      </QueryClientProvider>,
    ),
    queryClient,
  };
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

  describe('disabled prop', () => {
    it('should disable the action button when disabled is true', () => {
      mockUseFilteredExtensions.mockReturnValue({
        filteredExtensions: [mockExtensions[1]],
        isLoading: false,
      });

      renderWithRouter(
        <RegistrationActions
          extensionPointId="org.bahmni.registration.navigation"
          disabled
        />,
      );

      expect(screen.getByTestId('registration-action-button')).toBeDisabled();
    });

    it('should not disable the action button by default', () => {
      mockUseFilteredExtensions.mockReturnValue({
        filteredExtensions: [mockExtensions[1]],
        isLoading: false,
      });

      renderWithRouter(
        <RegistrationActions extensionPointId="org.bahmni.registration.navigation" />,
      );

      expect(
        screen.getByTestId('registration-action-button'),
      ).not.toBeDisabled();
    });

    it('should propagate disabled to VisitTypeSelector', () => {
      mockUseFilteredExtensions.mockReturnValue({
        filteredExtensions: [mockExtensions[0]],
        isLoading: false,
      });

      renderWithRouter(
        <RegistrationActions
          extensionPointId="org.bahmni.registration.navigation"
          disabled
        />,
      );

      expect(screen.getByTestId('select-visit-type-button')).toBeDisabled();
    });
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

    it('should call onBeforeNavigate and createVisit when visit type is selected, but NOT navigate', async () => {
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
      });

      expect(mockHandleExtensionNavigation).not.toHaveBeenCalled();
    });

    it('should navigate to extension URL when active visit button is clicked', async () => {
      const onBeforeNavigate = jest.fn().mockResolvedValue('patient-uuid-123');
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

      const activeVisitButton = screen.getByTestId('active-visit-button');
      fireEvent.click(activeVisitButton);

      await waitFor(() => {
        expect(onBeforeNavigate).toHaveBeenCalled();
        expect(mockHandleExtensionNavigation).toHaveBeenCalledWith(
          '/clinical/patient/{{patientUuid}}/dashboard',
          {},
          expect.any(Function),
        );
      });
    });

    it('should not navigate when active visit button is clicked and onBeforeNavigate is not provided', async () => {
      mockUseFilteredExtensions.mockReturnValue({
        filteredExtensions: [startVisitExtension],
        isLoading: false,
      });

      renderWithRouter(
        <RegistrationActions extensionPointId="org.bahmni.registration.navigation" />,
      );

      const activeVisitButton = screen.getByTestId('active-visit-button');
      fireEvent.click(activeVisitButton);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockHandleExtensionNavigation).not.toHaveBeenCalled();
    });

    it('should not navigate when active visit button is clicked and onBeforeNavigate returns null', async () => {
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

      const activeVisitButton = screen.getByTestId('active-visit-button');
      fireEvent.click(activeVisitButton);

      await waitFor(() => {
        expect(onBeforeNavigate).toHaveBeenCalled();
      });

      expect(mockHandleExtensionNavigation).not.toHaveBeenCalled();
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

    it('should disable the button and show the loading state when startVisitInProgress is already true in the cache', () => {
      const queryClient = createTestQueryClient();
      queryClient.setQueryData(['startVisitInProgress'], true);

      mockUseFilteredExtensions.mockReturnValue({
        filteredExtensions: [startVisitExtension],
        isLoading: false,
      });

      renderWithRouter(
        <RegistrationActions
          extensionPointId="org.bahmni.registration.navigation"
          onBeforeNavigate={jest.fn().mockResolvedValue('patient-uuid-123')}
        />,
        queryClient,
      );

      const selectButton = screen.getByTestId('select-visit-type-button');
      expect(selectButton).toBeDisabled();
      expect(selectButton).toHaveTextContent('Loading');
    });

    it('should not disable the button or show the loading state when startVisitInProgress is false', () => {
      mockUseFilteredExtensions.mockReturnValue({
        filteredExtensions: [startVisitExtension],
        isLoading: false,
      });

      renderWithRouter(
        <RegistrationActions
          extensionPointId="org.bahmni.registration.navigation"
          onBeforeNavigate={jest.fn().mockResolvedValue('patient-uuid-123')}
        />,
      );

      const selectButton = screen.getByTestId('select-visit-type-button');
      expect(selectButton).not.toBeDisabled();
      expect(selectButton).toHaveTextContent('Select Visit Type');
    });

    it('sets the in-progress flag synchronously before the first await, so a remounted instance sees it immediately on its first render (regression: BAH-4923 flicker)', async () => {
      const queryClient = createTestQueryClient();
      let resolveOnBeforeNavigate: (uuid: string) => void;
      const onBeforeNavigate = jest.fn(
        () =>
          new Promise<string>((resolve) => {
            resolveOnBeforeNavigate = resolve;
          }),
      );

      mockUseFilteredExtensions.mockReturnValue({
        filteredExtensions: [startVisitExtension],
        isLoading: false,
      });

      const { unmount } = renderWithRouter(
        <RegistrationActions
          extensionPointId="org.bahmni.registration.navigation"
          onBeforeNavigate={onBeforeNavigate}
        />,
        queryClient,
      );

      fireEvent.click(screen.getByTestId('select-visit-type-button'));

      await waitFor(() => expect(onBeforeNavigate).toHaveBeenCalled());

      // Simulate the route-change remount that happens mid-click for a
      // brand-new patient: the old instance is torn down while
      // onBeforeNavigate (and the navigate() call inside it) is still
      // pending.
      unmount();

      // A fresh instance mounts on the new route, sharing the same
      // QueryClient. Its very first render must already show the button
      // as disabled -- this is exactly what the original bug got wrong
      // (the flag used to be set only inside createVisit, which runs
      // *after* onBeforeNavigate resolves and the remount has already
      // happened, leaving a window where the button flickered back to
      // enabled).
      renderWithRouter(
        <RegistrationActions
          extensionPointId="org.bahmni.registration.navigation"
          onBeforeNavigate={onBeforeNavigate}
        />,
        queryClient,
      );

      expect(screen.getByTestId('select-visit-type-button')).toBeDisabled();

      resolveOnBeforeNavigate!('new-patient-uuid');

      await waitFor(() => {
        expect(
          screen.getByTestId('select-visit-type-button'),
        ).not.toBeDisabled();
      });
    });

    it('should not call onBeforeNavigate a second time while the first call is still in flight (double-click guard)', async () => {
      const queryClient = createTestQueryClient();
      let resolveOnBeforeNavigate: (uuid: string) => void;
      const onBeforeNavigate = jest.fn(
        () =>
          new Promise<string>((resolve) => {
            resolveOnBeforeNavigate = resolve;
          }),
      );

      mockUseFilteredExtensions.mockReturnValue({
        filteredExtensions: [startVisitExtension],
        isLoading: false,
      });

      renderWithRouter(
        <RegistrationActions
          extensionPointId="org.bahmni.registration.navigation"
          onBeforeNavigate={onBeforeNavigate}
        />,
        queryClient,
      );

      const selectButton = screen.getByTestId('select-visit-type-button');
      fireEvent.click(selectButton);
      fireEvent.click(selectButton);

      await waitFor(() => {
        expect(onBeforeNavigate).toHaveBeenCalledTimes(1);
      });

      resolveOnBeforeNavigate!('patient-uuid-123');

      await waitFor(() => {
        expect(mockCreateVisit).toHaveBeenCalledTimes(1);
      });
    });
  });
});
