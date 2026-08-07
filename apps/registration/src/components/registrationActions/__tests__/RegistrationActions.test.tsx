import {
  type VisitType,
  type Extension,
  type UserPrivilege,
} from '@bahmni/services';
import { NotificationProvider, useUserPrivilege } from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { useRegistrationConfig } from '../../../providers/registrationConfig';
import { handleExtensionNavigation } from '../../../utils/extensionNavigation';
import { RegistrationActions } from '../RegistrationActions';

const mockCreateVisit = jest.fn();

jest.mock('../../../providers/registrationConfig');
jest.mock('../../../utils/extensionNavigation');
// useIsCreatingVisit is kept real (backed by the actual QueryClient cache)
// so tests can verify the startVisitInProgress guard set in
// RegistrationActions.handleVisitTypeSelect is actually observed reactively
// -- only useCreateVisit is stubbed so we can assert on/control its calls.
jest.mock('../../../hooks/useVisit', () => ({
  ...jest.requireActual('../../../hooks/useVisit'),
  useCreateVisit: () => ({ createVisit: mockCreateVisit }),
}));
jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useUserPrivilege: jest.fn(),
}));

const mockUseRegistrationConfig = useRegistrationConfig as jest.MockedFunction<
  typeof useRegistrationConfig
>;
const mockUseUserPrivilege = useUserPrivilege as jest.MockedFunction<
  typeof useUserPrivilege
>;
const mockHandleExtensionNavigation =
  handleExtensionNavigation as jest.MockedFunction<
    typeof handleExtensionNavigation
  >;

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

const NAVIGATION_POINT = 'org.bahmni.registration.navigation';

type SetupOptions = {
  configLoading?: boolean;
  privilegesLoading?: boolean;
  userPrivileges?: UserPrivilege[];
};

const setup = (extensions: Extension[], opts: SetupOptions = {}) => {
  mockUseRegistrationConfig.mockReturnValue({
    registrationConfig: { extensions },
    isLoading: opts.configLoading ?? false,
    error: null,
  });
  mockUseUserPrivilege.mockReturnValue({
    userPrivileges: opts.userPrivileges ?? [
      { uuid: 'priv-1', name: 'Start Visit' },
    ],
    isLoading: opts.privilegesLoading ?? false,
    error: null,
    setUserPrivileges: jest.fn(),
    setIsLoading: jest.fn(),
    setError: jest.fn(),
  });
};

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
  const startVisit: Extension = {
    id: 'bahmni.registration.navigation.patient.start.visit',
    extensionPointId: NAVIGATION_POINT,
    translationKey: 'START_VISIT',
    icon: 'fa-calendar',
    requiredPrivileges: ['Start Visit'],
    extensionParams: {
      type: 'startVisit',
      url: '/clinical/patient/{{patientUuid}}/dashboard',
      order: 1,
    },
  };

  const link: Extension = {
    id: 'ext-2',
    extensionPointId: NAVIGATION_POINT,
    translationKey: 'PRINT_CARD',
    icon: 'fa-print',
    extensionParams: {
      type: 'link',
      url: '/print',
      order: 2,
    },
  };

  const searchExtension: Extension = {
    id: 'search-ext',
    extensionPointId: NAVIGATION_POINT,
    translationKey: 'SEARCH',
    extensionParams: { searchHandler: 'defaultSearch' },
  };

  const otherPointExtension: Extension = {
    id: 'other-point',
    extensionPointId: 'org.bahmni.registration.other',
    translationKey: 'OTHER',
    extensionParams: { type: 'link', url: '/other', order: 1 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setup([]);
  });

  it.each<{ name: string; extensions: Extension[]; opts: SetupOptions }>([
    {
      name: 'config is loading',
      extensions: [link],
      opts: { configLoading: true },
    },
    {
      name: 'privileges are loading',
      extensions: [link],
      opts: { privilegesLoading: true },
    },
    { name: 'no extensions are configured', extensions: [], opts: {} },
    {
      name: 'the user lacks the required privilege',
      extensions: [startVisit],
      opts: {
        userPrivileges: [{ uuid: 'priv-9', name: 'Some Other Privilege' }],
      },
    },
    {
      name: 'only non-action (search) extensions are present',
      extensions: [searchExtension],
      opts: {},
    },
    {
      name: 'no extension matches the extension point',
      extensions: [otherPointExtension],
      opts: {},
    },
  ])('renders nothing when $name', ({ extensions, opts }) => {
    setup(extensions, opts);
    const { container } = renderWithRouter(
      <RegistrationActions extensionPointId={NAVIGATION_POINT} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it.each<{ name: string; extension: Extension; testId: string }>([
    {
      name: 'a button for a link extension',
      extension: link,
      testId: 'registration-action-button',
    },
    {
      name: 'a VisitTypeSelector for a startVisit extension',
      extension: startVisit,
      testId: 'visit-type-selector',
    },
  ])('renders $name', ({ extension, testId }) => {
    setup([extension]);
    renderWithRouter(
      <RegistrationActions extensionPointId={NAVIGATION_POINT} />,
    );
    expect(screen.getByTestId(testId)).toBeInTheDocument();
  });

  it('should render icon for button extensions', () => {
    setup([link]);
    const { container } = renderWithRouter(
      <RegistrationActions extensionPointId={NAVIGATION_POINT} />,
    );
    const icons = container.querySelectorAll('.fa-print');
    expect(icons.length).toBeGreaterThan(0);
  });

  describe('selection logic', () => {
    it('includes extensions with no required privileges regardless of user privileges', () => {
      setup([link], { userPrivileges: [] });
      renderWithRouter(
        <RegistrationActions extensionPointId={NAVIGATION_POINT} />,
      );
      expect(screen.getByText('PRINT_CARD')).toBeInTheDocument();
    });

    it('renders valid siblings while excluding extensions from a different extension point', () => {
      setup([otherPointExtension, link]);
      renderWithRouter(
        <RegistrationActions extensionPointId={NAVIGATION_POINT} />,
      );
      expect(screen.getByText('PRINT_CARD')).toBeInTheDocument();
      expect(screen.queryByText('OTHER')).not.toBeInTheDocument();
    });

    it('sorts extensions by extensionParams.order', () => {
      const first: Extension = {
        id: 'first',
        extensionPointId: NAVIGATION_POINT,
        translationKey: 'FIRST',
        extensionParams: { type: 'link', url: '/first', order: 1 },
      };
      const second: Extension = {
        id: 'second',
        extensionPointId: NAVIGATION_POINT,
        translationKey: 'SECOND',
        extensionParams: { type: 'link', url: '/second', order: 2 },
      };
      setup([second, first]);
      renderWithRouter(
        <RegistrationActions extensionPointId={NAVIGATION_POINT} />,
      );
      const buttons = screen.getAllByTestId('registration-action-button');
      expect(buttons[0]).toHaveTextContent('FIRST');
      expect(buttons[1]).toHaveTextContent('SECOND');
    });
  });

  describe('disabled prop', () => {
    it('should disable the action button when disabled is true', () => {
      setup([link]);
      renderWithRouter(
        <RegistrationActions extensionPointId={NAVIGATION_POINT} disabled />,
      );
      expect(screen.getByTestId('registration-action-button')).toBeDisabled();
    });

    it('should not disable the action button by default', () => {
      setup([link]);
      renderWithRouter(
        <RegistrationActions extensionPointId={NAVIGATION_POINT} />,
      );
      expect(
        screen.getByTestId('registration-action-button'),
      ).not.toBeDisabled();
    });

    it('should propagate disabled to VisitTypeSelector', () => {
      setup([startVisit]);
      renderWithRouter(
        <RegistrationActions extensionPointId={NAVIGATION_POINT} disabled />,
      );
      expect(screen.getByTestId('select-visit-type-button')).toBeDisabled();
    });
  });

  describe('onBeforeNavigate callback', () => {
    const linkExtension: Extension = {
      id: 'test-extension',
      extensionPointId: NAVIGATION_POINT,
      translationKey: 'VIEW_PATIENT',
      extensionParams: { type: 'link', url: '#/patient/123', order: 1 },
    };

    it('should call onBeforeNavigate before navigation', async () => {
      const onBeforeNavigate = jest.fn().mockResolvedValue(undefined);
      setup([linkExtension]);
      renderWithRouter(
        <RegistrationActions
          extensionPointId={NAVIGATION_POINT}
          onBeforeNavigate={onBeforeNavigate}
        />,
      );
      fireEvent.click(screen.getByText('VIEW_PATIENT'));
      await waitFor(() => {
        expect(onBeforeNavigate).toHaveBeenCalled();
      });
    });

    it('should not navigate if onBeforeNavigate returns null', async () => {
      const onBeforeNavigate = jest.fn().mockResolvedValue(null);
      setup([linkExtension]);
      renderWithRouter(
        <RegistrationActions
          extensionPointId={NAVIGATION_POINT}
          onBeforeNavigate={onBeforeNavigate}
        />,
      );
      fireEvent.click(screen.getByText('VIEW_PATIENT'));
      await waitFor(() => {
        expect(onBeforeNavigate).toHaveBeenCalled();
      });
      expect(mockHandleExtensionNavigation).not.toHaveBeenCalled();
    });

    it('should not navigate when onBeforeNavigate is not provided', () => {
      setup([linkExtension]);
      renderWithRouter(
        <RegistrationActions extensionPointId={NAVIGATION_POINT} />,
      );
      fireEvent.click(screen.getByText('VIEW_PATIENT'));
      expect(mockHandleExtensionNavigation).not.toHaveBeenCalled();
    });

    it('should navigate to extension url after successful onBeforeNavigate', async () => {
      const onBeforeNavigate = jest.fn().mockResolvedValue('patient-uuid-123');
      const templated: Extension = {
        id: 'test-extension',
        extensionPointId: NAVIGATION_POINT,
        translationKey: 'VIEW_PATIENT',
        extensionParams: {
          type: 'link',
          url: '/clinical/patient/{{patientUuid}}/dashboard',
          order: 1,
        },
      };
      setup([templated]);
      renderWithRouter(
        <RegistrationActions
          extensionPointId={NAVIGATION_POINT}
          onBeforeNavigate={onBeforeNavigate}
        />,
      );
      fireEvent.click(screen.getByText('VIEW_PATIENT'));
      await waitFor(() => {
        expect(onBeforeNavigate).toHaveBeenCalled();
        expect(mockHandleExtensionNavigation).toHaveBeenCalledWith(
          '/clinical/patient/{{patientUuid}}/dashboard',
          { patientUuid: 'patient-uuid-123' },
          expect.any(Function),
        );
      });
    });
  });

  describe('handleVisitTypeSelect', () => {
    beforeEach(() => {
      setup([startVisit]);
    });
    it('should call onBeforeNavigate and createVisit when visit type is selected, but NOT navigate', async () => {
      const onBeforeNavigate = jest.fn().mockResolvedValue('patient-uuid-123');
      mockCreateVisit.mockResolvedValue(undefined);
      renderWithRouter(
        <RegistrationActions
          extensionPointId={NAVIGATION_POINT}
          onBeforeNavigate={onBeforeNavigate}
        />,
      );
      fireEvent.click(screen.getByTestId('select-visit-type-button'));
      await waitFor(() => {
        expect(onBeforeNavigate).toHaveBeenCalled();
        expect(mockCreateVisit).toHaveBeenCalledWith('patient-uuid-123', {
          name: 'OPD',
          uuid: 'opd-visit-type-uuid',
        });
      });
      expect(mockHandleExtensionNavigation).not.toHaveBeenCalled();
    });

    it('should navigate to extension URL with patientUuid in the context when active visit button is clicked', async () => {
      const onBeforeNavigate = jest.fn().mockResolvedValue('patient-uuid-123');
      renderWithRouter(
        <RegistrationActions
          extensionPointId={NAVIGATION_POINT}
          onBeforeNavigate={onBeforeNavigate}
        />,
      );
      fireEvent.click(screen.getByTestId('active-visit-button'));
      await waitFor(() => {
        expect(onBeforeNavigate).toHaveBeenCalled();
        expect(mockHandleExtensionNavigation).toHaveBeenCalledWith(
          '/clinical/patient/{{patientUuid}}/dashboard',
          { patientUuid: 'patient-uuid-123' },
          expect.any(Function),
        );
      });
    });

    it('should not navigate when active visit button is clicked and onBeforeNavigate is not provided', () => {
      renderWithRouter(
        <RegistrationActions extensionPointId={NAVIGATION_POINT} />,
      );
      fireEvent.click(screen.getByTestId('active-visit-button'));
      expect(mockHandleExtensionNavigation).not.toHaveBeenCalled();
    });

    it('should not navigate when active visit button is clicked and onBeforeNavigate returns null', async () => {
      const onBeforeNavigate = jest.fn().mockResolvedValue(null);
      renderWithRouter(
        <RegistrationActions
          extensionPointId={NAVIGATION_POINT}
          onBeforeNavigate={onBeforeNavigate}
        />,
      );
      fireEvent.click(screen.getByTestId('active-visit-button'));
      await waitFor(() => {
        expect(onBeforeNavigate).toHaveBeenCalled();
      });
      expect(mockHandleExtensionNavigation).not.toHaveBeenCalled();
    });

    it('should not call createVisit or navigate when onBeforeNavigate returns null', async () => {
      const onBeforeNavigate = jest.fn().mockResolvedValue(null);
      renderWithRouter(
        <RegistrationActions
          extensionPointId={NAVIGATION_POINT}
          onBeforeNavigate={onBeforeNavigate}
        />,
      );
      fireEvent.click(screen.getByTestId('select-visit-type-button'));
      await waitFor(() => {
        expect(onBeforeNavigate).toHaveBeenCalled();
      });
      expect(mockCreateVisit).not.toHaveBeenCalled();
      expect(mockHandleExtensionNavigation).not.toHaveBeenCalled();
    });

    it('should disable the button and show the loading state when startVisitInProgress is already true in the cache', () => {
      const queryClient = createTestQueryClient();
      queryClient.setQueryData(['startVisitInProgress'], true);

      setup([startVisit]);

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
      setup([startVisit]);

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

      setup([startVisit]);

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

      setup([startVisit]);

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
