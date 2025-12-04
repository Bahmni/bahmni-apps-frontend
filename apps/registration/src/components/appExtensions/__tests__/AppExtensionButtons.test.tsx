import { AppExtensionConfig } from '@bahmni/services';
import { useUserPrivilege } from '@bahmni/widgets';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRegistrationConfig } from '../../../hooks/useRegistrationConfig';
import { AppExtensionButtons } from '../AppExtensionButtons';

// Mock the hooks
jest.mock('../../../hooks/useRegistrationConfig');
jest.mock('@bahmni/widgets');

const mockUseRegistrationConfig = useRegistrationConfig as jest.MockedFunction<
  typeof useRegistrationConfig
>;
const mockUseUserPrivilege = useUserPrivilege as jest.MockedFunction<
  typeof useUserPrivilege
>;

describe('AppExtensionButtons', () => {
  const mockExtensions: AppExtensionConfig[] = [
    {
      id: 'bahmni.registration.navigation.patient.start.visit',
      extensionPointId: 'org.bahmni.registration.footer',
      type: 'startVisit',
      translationKey: 'START_VISIT',
      url: '/visit',
      icon: 'fa-calendar',
      order: 1,
      requiredPrivilege: 'Start Visit',
    },
    {
      id: 'ext-2',
      extensionPointId: 'org.bahmni.registration.footer',
      type: 'link',
      translationKey: 'PRINT_CARD',
      url: '/print',
      icon: 'fa-print',
      order: 2,
    },
    {
      id: 'ext-3',
      extensionPointId: 'org.bahmni.registration.header',
      type: 'link',
      translationKey: 'SETTINGS',
      url: '/settings',
      order: 1,
    },
  ];

  const mockUserPrivileges = [
    { uuid: '1', name: 'Start Visit' },
    { uuid: '2', name: 'View Patients' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUserPrivilege.mockReturnValue({
      userPrivileges: mockUserPrivileges,
      isLoading: false,
      error: null,
      setUserPrivileges: jest.fn(),
      setIsLoading: jest.fn(),
      setError: jest.fn(),
    });
  });

  it('should render nothing while config is loading', () => {
    mockUseRegistrationConfig.mockReturnValue({
      registrationConfig: null,
      isLoading: true,
      error: null,
      setRegistrationConfig: jest.fn(),
      setIsLoading: jest.fn(),
      setError: jest.fn(),
      refetch: jest.fn(),
    });

    const { container } = render(
      <AppExtensionButtons extensionPointId="org.bahmni.registration.footer" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render nothing while privileges are loading', () => {
    mockUseRegistrationConfig.mockReturnValue({
      registrationConfig: {
        registrationAppExtensions: mockExtensions,
      } as any,
      isLoading: false,
      error: null,
      setRegistrationConfig: jest.fn(),
      setIsLoading: jest.fn(),
      setError: jest.fn(),
      refetch: jest.fn(),
    });
    mockUseUserPrivilege.mockReturnValue({
      userPrivileges: null,
      isLoading: true,
      error: null,
      setUserPrivileges: jest.fn(),
      setIsLoading: jest.fn(),
      setError: jest.fn(),
    });

    const { container } = render(
      <AppExtensionButtons extensionPointId="org.bahmni.registration.footer" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render extensions filtered by extension point', () => {
    mockUseRegistrationConfig.mockReturnValue({
      registrationConfig: {
        registrationAppExtensions: mockExtensions,
      } as any,
      isLoading: false,
      error: null,
      setRegistrationConfig: jest.fn(),
      setIsLoading: jest.fn(),
      setError: jest.fn(),
      refetch: jest.fn(),
    });

    render(
      <AppExtensionButtons extensionPointId="org.bahmni.registration.footer" />,
    );

    expect(screen.getByText('START_VISIT')).toBeInTheDocument();
    expect(screen.getByText('PRINT_CARD')).toBeInTheDocument();
    expect(screen.queryByText('SETTINGS')).not.toBeInTheDocument();
  });

  it('should filter extensions by user privilege', () => {
    mockUseUserPrivilege.mockReturnValue({
      userPrivileges: [{ uuid: '1', name: 'View Patients' }],
      isLoading: false,
      error: null,
      setUserPrivileges: jest.fn(),
      setIsLoading: jest.fn(),
      setError: jest.fn(),
    });

    mockUseRegistrationConfig.mockReturnValue({
      registrationConfig: {
        registrationAppExtensions: mockExtensions,
      } as any,
      isLoading: false,
      error: null,
      setRegistrationConfig: jest.fn(),
      setIsLoading: jest.fn(),
      setError: jest.fn(),
      refetch: jest.fn(),
    });

    render(
      <AppExtensionButtons extensionPointId="org.bahmni.registration.footer" />,
    );

    expect(screen.queryByText('START_VISIT')).not.toBeInTheDocument();
    expect(screen.getByText('PRINT_CARD')).toBeInTheDocument();
  });

  it('should render extensions in order', () => {
    mockUseRegistrationConfig.mockReturnValue({
      registrationConfig: {
        registrationAppExtensions: mockExtensions,
      } as any,
      isLoading: false,
      error: null,
      setRegistrationConfig: jest.fn(),
      setIsLoading: jest.fn(),
      setError: jest.fn(),
      refetch: jest.fn(),
    });

    const { container } = render(
      <AppExtensionButtons extensionPointId="org.bahmni.registration.footer" />,
    );

    const buttons = container.querySelectorAll('button');
    expect(buttons[0]).toHaveTextContent('START_VISIT');
    expect(buttons[1]).toHaveTextContent('PRINT_CARD');
  });

  it('should call onExtensionClick when button is clicked', () => {
    const onExtensionClick = jest.fn();
    mockUseRegistrationConfig.mockReturnValue({
      registrationConfig: {
        registrationAppExtensions: mockExtensions,
      } as any,
      isLoading: false,
      error: null,
      setRegistrationConfig: jest.fn(),
      setIsLoading: jest.fn(),
      setError: jest.fn(),
      refetch: jest.fn(),
    });

    render(
      <AppExtensionButtons
        extensionPointId="org.bahmni.registration.footer"
        onExtensionClick={onExtensionClick}
      />,
    );

    const button = screen.getByText('START_VISIT');
    fireEvent.click(button);

    expect(onExtensionClick).toHaveBeenCalledWith(mockExtensions[0]);
  });

  it('should render icon if provided', () => {
    mockUseRegistrationConfig.mockReturnValue({
      registrationConfig: {
        registrationAppExtensions: mockExtensions,
      } as any,
      isLoading: false,
      error: null,
      setRegistrationConfig: jest.fn(),
      setIsLoading: jest.fn(),
      setError: jest.fn(),
      refetch: jest.fn(),
    });

    const { container } = render(
      <AppExtensionButtons extensionPointId="org.bahmni.registration.footer" />,
    );

    const icons = container.querySelectorAll('.fa-calendar');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should render nothing when no extensions match extension point', () => {
    mockUseRegistrationConfig.mockReturnValue({
      registrationConfig: {
        registrationAppExtensions: mockExtensions,
      } as any,
      isLoading: false,
      error: null,
      setRegistrationConfig: jest.fn(),
      setIsLoading: jest.fn(),
      setError: jest.fn(),
      refetch: jest.fn(),
    });

    const { container } = render(
      <AppExtensionButtons extensionPointId="org.bahmni.nonexistent" />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when registrationAppExtensions is undefined', () => {
    mockUseRegistrationConfig.mockReturnValue({
      registrationConfig: {} as any,
      isLoading: false,
      error: null,
      setRegistrationConfig: jest.fn(),
      setIsLoading: jest.fn(),
      setError: jest.fn(),
      refetch: jest.fn(),
    });

    const { container } = render(
      <AppExtensionButtons extensionPointId="org.bahmni.registration.footer" />,
    );

    expect(container.firstChild).toBeNull();
  });

  // Tests for extensionId filtering
  it('should render specific extension when filtered by extensionId', () => {
    mockUseRegistrationConfig.mockReturnValue({
      registrationConfig: {
        registrationAppExtensions: mockExtensions,
      } as any,
      isLoading: false,
      error: null,
      setRegistrationConfig: jest.fn(),
      setIsLoading: jest.fn(),
      setError: jest.fn(),
      refetch: jest.fn(),
    });

    render(
      <AppExtensionButtons extensionId="bahmni.registration.navigation.patient.start.visit" />,
    );

    expect(screen.getByText('START_VISIT')).toBeInTheDocument();
    expect(screen.queryByText('PRINT_CARD')).not.toBeInTheDocument();
    expect(screen.queryByText('SETTINGS')).not.toBeInTheDocument();
  });

  it('should respect privilege when filtering by extensionId', () => {
    mockUseUserPrivilege.mockReturnValue({
      userPrivileges: [{ uuid: '1', name: 'View Patients' }],
      isLoading: false,
      error: null,
      setUserPrivileges: jest.fn(),
      setIsLoading: jest.fn(),
      setError: jest.fn(),
    });

    mockUseRegistrationConfig.mockReturnValue({
      registrationConfig: {
        registrationAppExtensions: mockExtensions,
      } as any,
      isLoading: false,
      error: null,
      setRegistrationConfig: jest.fn(),
      setIsLoading: jest.fn(),
      setError: jest.fn(),
      refetch: jest.fn(),
    });

    const { container } = render(
      <AppExtensionButtons extensionId="bahmni.registration.navigation.patient.start.visit" />,
    );

    // START_VISIT requires 'Start Visit' privilege, user only has 'View Patients'
    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when extensionId does not match any extension', () => {
    mockUseRegistrationConfig.mockReturnValue({
      registrationConfig: {
        registrationAppExtensions: mockExtensions,
      } as any,
      isLoading: false,
      error: null,
      setRegistrationConfig: jest.fn(),
      setIsLoading: jest.fn(),
      setError: jest.fn(),
      refetch: jest.fn(),
    });

    const { container } = render(
      <AppExtensionButtons extensionId="non.existent.extension" />,
    );

    expect(container.firstChild).toBeNull();
  });
});
