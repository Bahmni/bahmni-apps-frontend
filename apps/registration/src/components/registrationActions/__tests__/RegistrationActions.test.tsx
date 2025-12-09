import { AppExtensionConfig } from '@bahmni/services';
import { NotificationProvider } from '@bahmni/widgets';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { useFilteredExtensions } from '../../../hooks/useFilteredExtensions';
import * as extensionNavigation from '../../../utils/extensionNavigation';
import { RegistrationActions } from '../RegistrationActions';

jest.mock('../../../hooks/useFilteredExtensions');
jest.mock('../../../utils/extensionNavigation');
jest.mock('../../../pages/PatientRegister/visitTypeSelector', () => ({
  VisitTypeSelector: () => (
    <div data-testid="visit-type-selector">Visit Type Selector</div>
  ),
}));

const mockUseFilteredExtensions = useFilteredExtensions as jest.MockedFunction<
  typeof useFilteredExtensions
>;

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <NotificationProvider>
      <BrowserRouter>{component}</BrowserRouter>
    </NotificationProvider>,
  );
};

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

    const { container } = renderWithRouter(
      <RegistrationActions extensionPointId="org.bahmni.registration.footer" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when no extensions are returned', () => {
    mockUseFilteredExtensions.mockReturnValue({
      filteredExtensions: [],
      isLoading: false,
    });

    const { container } = renderWithRouter(
      <RegistrationActions extensionPointId="org.bahmni.registration.footer" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render button for non-startVisit extensions', () => {
    mockUseFilteredExtensions.mockReturnValue({
      filteredExtensions: [mockExtensions[1]],
      isLoading: false,
    });

    renderWithRouter(
      <RegistrationActions extensionPointId="org.bahmni.registration.footer" />,
    );

    expect(screen.getByText('PRINT_CARD')).toBeInTheDocument();
  });

  it('should render VisitTypeSelector for startVisit type', () => {
    mockUseFilteredExtensions.mockReturnValue({
      filteredExtensions: [mockExtensions[0]],
      isLoading: false,
    });

    renderWithRouter(
      <RegistrationActions extensionPointId="org.bahmni.registration.footer" />,
    );

    expect(screen.getByTestId('visit-type-selector')).toBeInTheDocument();
  });

  it('should render icon for button extensions', () => {
    mockUseFilteredExtensions.mockReturnValue({
      filteredExtensions: [mockExtensions[1]],
      isLoading: false,
    });

    const { container } = renderWithRouter(
      <RegistrationActions extensionPointId="org.bahmni.registration.footer" />,
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
      <RegistrationActions extensionPointId="org.bahmni.registration.footer" />,
    );

    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
  });

  it('should render button for extensions with URL templates', () => {
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

    renderWithRouter(
      <RegistrationActions extensionPointId="org.bahmni.registration.footer" />,
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
        extensionPointId: 'org.bahmni.registration.footer',
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
          extensionPointId="org.bahmni.registration.footer"
          onBeforeNavigate={onBeforeNavigate}
        />,
      );

      const button = screen.getByText('VIEW_PATIENT');
      fireEvent.click(button);

      await waitFor(() => {
        expect(onBeforeNavigate).toHaveBeenCalled();
      });
    });

    it('should not navigate if onBeforeNavigate throws error', async () => {
      const onBeforeNavigate = jest
        .fn()
        .mockRejectedValue(new Error('Validation failed'));
      const extension: AppExtensionConfig = {
        id: 'test-extension',
        extensionPointId: 'org.bahmni.registration.footer',
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
          extensionPointId="org.bahmni.registration.footer"
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

    it('should navigate without onBeforeNavigate if not provided', async () => {
      const extension: AppExtensionConfig = {
        id: 'test-extension',
        extensionPointId: 'org.bahmni.registration.footer',
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
        <RegistrationActions extensionPointId="org.bahmni.registration.footer" />,
      );

      const button = screen.getByText('VIEW_PATIENT');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockHandleExtensionNavigation).toHaveBeenCalledWith(
          '#/patient/123',
          {},
          expect.any(Function),
        );
      });
    });
  });
});
