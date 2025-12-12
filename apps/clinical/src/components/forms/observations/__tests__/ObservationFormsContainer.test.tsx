import { ObservationForm } from '@bahmni/services';
import { render, screen, fireEvent } from '@testing-library/react';
import ObservationFormsContainer from '../ObservationFormsContainer';

// Mock the defaultFormNames import
jest.mock('../ObservationForms', () => ({
  defaultFormNames: ['History and Examination', 'Vitals'],
}));

// Mock the hooks used by the component
jest.mock('../../../../hooks/useObservationFormsSearch');
jest.mock('../../../../hooks/usePinnedObservationForms');

// Mock the extracted custom hooks
const mockUseObservationFormMetadata = jest.fn();
const mockUseObservationFormPinning = jest.fn();
const mockUseObservationFormActions = jest.fn();

jest.mock('../../../../hooks/useObservationFormMetadata', () => ({
  useObservationFormMetadata: (...args: unknown[]) =>
    mockUseObservationFormMetadata(...args),
}));

jest.mock('../../../../hooks/useObservationFormPinning', () => ({
  useObservationFormPinning: (...args: unknown[]) =>
    mockUseObservationFormPinning(...args),
}));

jest.mock('../../../../hooks/useObservationFormActions', () => ({
  useObservationFormActions: (...args: unknown[]) =>
    mockUseObservationFormActions(...args),
}));

// Mock the translation hook
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: jest.fn((key) => `translated_${key}`),
  })),
}));

// Mock the form metadata service
const mockGetFormattedError = jest.fn();
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getFormattedError: (...args: unknown[]) => mockGetFormattedError(...args),
}));

// Mock the form2-controls package
jest.mock('@bahmni/form2-controls', () => ({
  Container: jest.fn(({ metadata }) => (
    <div data-testid="form2-container">
      Form Container with metadata: {JSON.stringify(metadata)}
    </div>
  )),
}));

// Mock the form2-controls CSS
jest.mock('@bahmni/form2-controls/dist/bundle.css', () => ({}));

// Mock the usePatientUUID hook
jest.mock('@bahmni/widgets', () => ({
  usePatientUUID: jest.fn(() => 'test-patient-uuid'),
}));

// Mock the constants
jest.mock('../../../../constants/forms', () => ({
  DEFAULT_FORM_API_NAMES: ['History and Examination', 'Vitals'],
}));

// Mock ActionArea component
jest.mock('@bahmni/design-system', () => ({
  ActionArea: jest.fn(
    ({
      className,
      title,
      primaryButtonText,
      onPrimaryButtonClick,
      isPrimaryButtonDisabled,
      secondaryButtonText,
      onSecondaryButtonClick,
      tertiaryButtonText,
      onTertiaryButtonClick,
      content,
    }) => (
      <div data-testid="action-area" className={className}>
        <div data-testid="action-area-title">{title}</div>
        <div data-testid="action-area-content">{content}</div>
        <div data-testid="action-area-buttons">
          <button
            data-testid="primary-button"
            disabled={isPrimaryButtonDisabled}
            onClick={onPrimaryButtonClick}
          >
            {primaryButtonText}
          </button>
          <button
            data-testid="secondary-button"
            onClick={onSecondaryButtonClick}
          >
            {secondaryButtonText}
          </button>
          <button data-testid="tertiary-button" onClick={onTertiaryButtonClick}>
            {tertiaryButtonText}
          </button>
        </div>
      </div>
    ),
  ),
  Icon: jest.fn(({ id, name, size }) => (
    <div data-testid={`icon-${id}`} data-icon-name={name} data-size={size}>
      Icon
    </div>
  )),
  SkeletonText: jest.fn(({ width, lineCount }) => (
    <div
      data-testid="skeleton-text"
      data-width={width}
      data-line-count={lineCount}
    />
  )),
  ICON_SIZE: {
    SM: 'SM',
    MD: 'MD',
    LG: 'LG',
  },
}));

// Mock styles
jest.mock('../styles/ObservationFormsContainer.module.scss', () => ({
  formView: 'formView',
  formContent: 'formContent',
  formViewActionArea: 'formViewActionArea',
  formTitleContainer: 'formTitleContainer',
  pinIconContainer: 'pinIconContainer',
  pinned: 'pinned',
  unpinned: 'unpinned',
}));

describe('ObservationFormsContainer', () => {
  const mockForm: ObservationForm = {
    name: 'Test Form',
    uuid: 'test-form-uuid',
    id: 1,
    privileges: [],
  };

  const defaultProps = {
    onViewingFormChange: jest.fn(),
    viewingForm: null,
    onRemoveForm: jest.fn(),
    pinnedForms: [],
    updatePinnedForms: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useObservationFormsSearch
    const mockUseObservationFormsSearch = jest.requireMock(
      '../../../../hooks/useObservationFormsSearch',
    ).default;
    mockUseObservationFormsSearch.mockReturnValue({
      forms: [],
      isLoading: false,
      error: null,
    });

    // Mock usePinnedObservationForms
    const mockUsePinnedObservationForms = jest.requireMock(
      '../../../../hooks/usePinnedObservationForms',
    ).usePinnedObservationForms;
    mockUsePinnedObservationForms.mockReturnValue({
      pinnedForms: [],
      updatePinnedForms: jest.fn(),
      isLoading: false,
      error: null,
    });

    // Mock the extracted hooks with default values
    mockUseObservationFormMetadata.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });

    mockUseObservationFormPinning.mockReturnValue({
      isCurrentFormPinned: false,
      handlePinToggle: jest.fn(),
    });

    mockUseObservationFormActions.mockReturnValue({
      handleDiscardForm: jest.fn(),
      handleSaveForm: jest.fn(),
      handleBackToForms: jest.fn(),
    });
  });

  describe('Rendering and Structure', () => {
    it('should render ActionArea when viewingForm is provided', () => {
      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );

      expect(screen.getByTestId('action-area')).toBeInTheDocument();
      expect(screen.getByTestId('action-area-title')).toHaveTextContent(
        'Test Form',
      );
    });

    it('should match the snapshot when viewing a form', () => {
      const { container } = render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );
      expect(container).toMatchSnapshot();
    });

    it('should match the snapshot when not viewing a form', () => {
      const { container } = render(
        <ObservationFormsContainer {...defaultProps} viewingForm={null} />,
      );
      expect(container).toMatchSnapshot();
    });
  });

  describe('ActionArea Configuration', () => {
    it('should configure ActionArea with correct props', () => {
      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );

      const actionArea = screen.getByTestId('action-area');
      expect(actionArea).toHaveClass('formViewActionArea');

      expect(screen.getByTestId('primary-button')).toHaveTextContent(
        'translated_OBSERVATION_FORM_SAVE_BUTTON',
      );
      expect(screen.getByTestId('secondary-button')).toHaveTextContent(
        'translated_OBSERVATION_FORM_DISCARD_BUTTON',
      );
      expect(screen.getByTestId('tertiary-button')).toHaveTextContent(
        'translated_OBSERVATION_FORM_BACK_BUTTON',
      );
    });
  });

  describe('Button Click Handlers', () => {
    it('should call handleSaveForm when Save button is clicked', () => {
      const mockHandleSaveForm = jest.fn();
      mockUseObservationFormActions.mockReturnValue({
        handleDiscardForm: jest.fn(),
        handleSaveForm: mockHandleSaveForm,
        handleBackToForms: jest.fn(),
      });

      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );

      const saveButton = screen.getByTestId('primary-button');
      fireEvent.click(saveButton);

      expect(mockHandleSaveForm).toHaveBeenCalled();
    });

    it('should call handleBackToForms when Back button is clicked', () => {
      const mockHandleBackToForms = jest.fn();
      mockUseObservationFormActions.mockReturnValue({
        handleDiscardForm: jest.fn(),
        handleSaveForm: jest.fn(),
        handleBackToForms: mockHandleBackToForms,
      });

      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );

      const backButton = screen.getByTestId('tertiary-button');
      fireEvent.click(backButton);

      expect(mockHandleBackToForms).toHaveBeenCalled();
    });

    it('should call handleDiscardForm when Discard button is clicked', () => {
      const mockHandleDiscardForm = jest.fn();
      mockUseObservationFormActions.mockReturnValue({
        handleDiscardForm: mockHandleDiscardForm,
        handleSaveForm: jest.fn(),
        handleBackToForms: jest.fn(),
      });

      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );

      const discardButton = screen.getByTestId('secondary-button');
      fireEvent.click(discardButton);

      expect(mockHandleDiscardForm).toHaveBeenCalled();
    });

    it('should pass correct props to useObservationFormActions hook', () => {
      const mockOnViewingFormChange = jest.fn();
      const mockOnRemoveForm = jest.fn();

      render(
        <ObservationFormsContainer
          {...defaultProps}
          onViewingFormChange={mockOnViewingFormChange}
          onRemoveForm={mockOnRemoveForm}
          viewingForm={mockForm}
        />,
      );

      expect(mockUseObservationFormActions).toHaveBeenCalledWith({
        viewingForm: mockForm,
        onViewingFormChange: mockOnViewingFormChange,
        onRemoveForm: mockOnRemoveForm,
      });
    });
  });

  describe('Form Display', () => {
    it('should display the correct form name in the title', () => {
      const customForm: ObservationForm = {
        name: 'Custom Form Name',
        uuid: 'custom-uuid',
        id: 2,
        privileges: [],
      };

      render(
        <ObservationFormsContainer
          {...defaultProps}
          viewingForm={customForm}
        />,
      );

      expect(screen.getByTestId('action-area-title')).toHaveTextContent(
        'Custom Form Name',
      );
    });
  });

  describe('Translation Integration', () => {
    it('should use translation keys for button texts', () => {
      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );

      expect(
        screen.getByText('translated_OBSERVATION_FORM_SAVE_BUTTON'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('translated_OBSERVATION_FORM_DISCARD_BUTTON'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('translated_OBSERVATION_FORM_BACK_BUTTON'),
      ).toBeInTheDocument();
    });
  });

  describe('form-controls Rendering', () => {
    beforeEach(() => {
      mockGetFormattedError.mockClear();
    });

    it('should call useObservationFormMetadata hook with viewingForm UUID', () => {
      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );

      // Verify useObservationFormMetadata was called with the correct UUID
      expect(mockUseObservationFormMetadata).toHaveBeenCalledWith(
        'test-form-uuid',
      );
    });

    it('should display SkeletonText while fetching metadata', () => {
      // Mock useObservationFormMetadata to return loading state
      mockUseObservationFormMetadata.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );

      const skeletonText = screen.getByTestId('skeleton-text');
      expect(skeletonText).toBeInTheDocument();
      expect(skeletonText).toHaveAttribute('data-width', '100%');
      expect(skeletonText).toHaveAttribute('data-line-count', '3');
    });

    it('should render Container component with metadata when loaded', async () => {
      const mockMetadata = {
        schema: {
          name: 'Test Form Schema',
          controls: [],
        },
      };

      // Mock useObservationFormMetadata to return success state with data
      mockUseObservationFormMetadata.mockReturnValue({
        data: mockMetadata,
        isLoading: false,
        error: null,
      });

      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );

      expect(screen.getByTestId('form2-container')).toBeInTheDocument();
    });

    it('should display error message when metadata fetch fails', async () => {
      const mockError = new Error('Failed to fetch');
      mockGetFormattedError.mockReturnValue({
        message: 'Failed to fetch',
        title: 'Error',
      });

      // Mock useObservationFormMetadata to return error state
      mockUseObservationFormMetadata.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
      });

      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );

      expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    });

    it('should call useObservationFormMetadata with undefined when viewingForm is null', () => {
      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={null} />,
      );

      // Verify useObservationFormMetadata was called with undefined
      expect(mockUseObservationFormMetadata).toHaveBeenCalledWith(undefined);
    });
  });

  describe('Pin Toggle Functionality', () => {
    const nonDefaultForm: ObservationForm = {
      name: 'Custom Form',
      uuid: 'custom-form-uuid',
      id: 3,
      privileges: [],
    };

    it('should show pinned state when form is in pinnedForms array', () => {
      mockUseObservationFormPinning.mockReturnValue({
        isCurrentFormPinned: true,
        handlePinToggle: jest.fn(),
      });

      render(
        <ObservationFormsContainer
          {...defaultProps}
          viewingForm={nonDefaultForm}
          pinnedForms={[nonDefaultForm]}
        />,
      );

      const pinIcon = screen.getByTestId('icon-pin-icon');
      const pinContainer = pinIcon.parentElement;

      expect(pinContainer).toHaveClass('pinned');
      expect(pinContainer).toHaveAttribute('title', 'Unpin form');
    });

    it('should show unpinned state when form is not in pinnedForms array', () => {
      mockUseObservationFormPinning.mockReturnValue({
        isCurrentFormPinned: false,
        handlePinToggle: jest.fn(),
      });

      render(
        <ObservationFormsContainer
          {...defaultProps}
          viewingForm={nonDefaultForm}
          pinnedForms={[]}
        />,
      );

      const pinIcon = screen.getByTestId('icon-pin-icon');
      const pinContainer = pinIcon.parentElement;

      expect(pinContainer).toHaveClass('unpinned');
      expect(pinContainer).toHaveAttribute('title', 'Pin form');
    });

    it('should call handlePinToggle when pin icon is clicked', () => {
      const mockHandlePinToggle = jest.fn();
      mockUseObservationFormPinning.mockReturnValue({
        isCurrentFormPinned: true,
        handlePinToggle: mockHandlePinToggle,
      });

      render(
        <ObservationFormsContainer
          {...defaultProps}
          viewingForm={nonDefaultForm}
          pinnedForms={[nonDefaultForm]}
        />,
      );

      const pinIcon = screen.getByTestId('icon-pin-icon');
      const pinContainer = pinIcon.parentElement;

      fireEvent.click(pinContainer!);

      expect(mockHandlePinToggle).toHaveBeenCalled();
    });

    it('should pass correct props to useObservationFormPinning hook', () => {
      const mockUpdatePinnedForms = jest.fn();

      render(
        <ObservationFormsContainer
          {...defaultProps}
          viewingForm={nonDefaultForm}
          pinnedForms={[nonDefaultForm]}
          updatePinnedForms={mockUpdatePinnedForms}
        />,
      );

      expect(mockUseObservationFormPinning).toHaveBeenCalledWith({
        viewingForm: nonDefaultForm,
        pinnedForms: [nonDefaultForm],
        updatePinnedForms: mockUpdatePinnedForms,
      });
    });
  });
});
