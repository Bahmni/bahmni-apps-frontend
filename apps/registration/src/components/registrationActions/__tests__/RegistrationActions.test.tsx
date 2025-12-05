import { AppExtensionConfig } from '@bahmni/services';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useFilteredExtensions } from '../../../hooks/useFilteredExtensions';
import { RegistrationActions } from '../RegistrationActions';

// Mock the hooks
jest.mock('../../../hooks/useFilteredExtensions');

const mockUseFilteredExtensions = useFilteredExtensions as jest.MockedFunction<
  typeof useFilteredExtensions
>;

describe('RegistrationActions', () => {
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
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render nothing while loading', () => {
    mockUseFilteredExtensions.mockReturnValue({
      filteredExtensions: [],
      isLoading: true,
    });

    const { container } = render(
      <RegistrationActions extensionPointId="org.bahmni.registration.footer" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when no extensions are returned', () => {
    mockUseFilteredExtensions.mockReturnValue({
      filteredExtensions: [],
      isLoading: false,
    });

    const { container } = render(
      <RegistrationActions extensionPointId="org.bahmni.registration.footer" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render filtered extensions', () => {
    mockUseFilteredExtensions.mockReturnValue({
      filteredExtensions: mockExtensions,
      isLoading: false,
    });

    render(
      <RegistrationActions extensionPointId="org.bahmni.registration.footer" />,
    );

    expect(screen.getByText('START_VISIT')).toBeInTheDocument();
    expect(screen.getByText('PRINT_CARD')).toBeInTheDocument();
  });

  it('should render extensions in order', () => {
    mockUseFilteredExtensions.mockReturnValue({
      filteredExtensions: mockExtensions,
      isLoading: false,
    });

    const { container } = render(
      <RegistrationActions extensionPointId="org.bahmni.registration.footer" />,
    );

    const buttons = container.querySelectorAll('button');
    expect(buttons[0]).toHaveTextContent('START_VISIT');
    expect(buttons[1]).toHaveTextContent('PRINT_CARD');
  });

  it('should render icon if provided', () => {
    mockUseFilteredExtensions.mockReturnValue({
      filteredExtensions: mockExtensions,
      isLoading: false,
    });

    const { container } = render(
      <RegistrationActions extensionPointId="org.bahmni.registration.footer" />,
    );

    const icons = container.querySelectorAll('.fa-calendar');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should apply custom buttonKind prop', () => {
    mockUseFilteredExtensions.mockReturnValue({
      filteredExtensions: [mockExtensions[0]],
      isLoading: false,
    });

    const { container } = render(
      <RegistrationActions
        extensionPointId="org.bahmni.registration.footer"
        buttonKind="primary"
      />,
    );

    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
  });

  it('should accept urlContext prop for URL interpolation', () => {
    const extensionWithTemplate: AppExtensionConfig = {
      id: 'test-extension',
      extensionPointId: 'org.bahmni.registration.footer',
      type: 'link',
      translationKey: 'VIEW_PATIENT',
      url: '/clinical/patient/{{patientUuid}}/dashboard',
      order: 1,
    };

    mockUseFilteredExtensions.mockReturnValue({
      filteredExtensions: [extensionWithTemplate],
      isLoading: false,
    });

    render(
      <RegistrationActions
        extensionPointId="org.bahmni.registration.footer"
        urlContext={{ patientUuid: 'test-uuid-123' }}
      />,
    );

    const button = screen.getByText('VIEW_PATIENT');
    expect(button).toBeInTheDocument();
  });
});
