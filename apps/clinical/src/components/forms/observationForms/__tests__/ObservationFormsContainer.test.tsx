import { ObservationForm } from '@bahmni/services';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ObservationFormsContainer from '../ObservationFormsContainer';

// Mock the defaultFormNames import
jest.mock('../ObservationForms', () => ({
  defaultFormNames: ['History and Examination', 'Vitals'],
}));

// Mock the hooks used by the component
jest.mock('../../../../hooks/useObservationFormsSearch');
jest.mock('../../../../hooks/usePinnedObservationForms');

// Mock the translation hook
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: jest.fn((key) => `translated_${key}`),
  })),
}));

// Mock TanStack Query
const mockUseQuery = jest.fn();
jest.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

// Mock the form metadata service
const mockFetchFormMetadata = jest.fn();
const mockGetFormattedError = jest.fn();
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  fetchFormMetadata: (...args: unknown[]) => mockFetchFormMetadata(...args),
  getFormattedError: (...args: unknown[]) => mockGetFormattedError(...args),
}));

// Mock the form2-controls package
const mockGetValue = jest.fn();

jest.mock('@bahmni/form2-controls', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockReact = require('react');
  return {
    Container: mockReact.forwardRef((props: any, ref: any) => {
      mockReact.useImperativeHandle(ref, () => ({
        getValue: mockGetValue,
      }));

      return (
        <div data-testid="form2-container">
          Form Container with metadata: {JSON.stringify(props.metadata)}
        </div>
      );
    }),
  };
});

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
  InlineNotification: jest.fn(
    ({ kind, title, subtitle, onClose, hideCloseButton }) => (
      <div
        data-testid="inline-notification"
        data-kind={kind}
        data-hide-close-button={hideCloseButton}
      >
        <div data-testid="notification-title">{title}</div>
        <div data-testid="notification-subtitle">{subtitle}</div>
        {onClose && (
          <button data-testid="notification-close" onClick={onClose}>
            Close
          </button>
        )}
      </div>
    ),
  ),
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

    // Default useQuery mock - returns no data when no form is being viewed
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
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
    it('should call onViewingFormChange with null when Save button is clicked', () => {
      const mockMetadata = {
        schema: {
          name: 'Test Form Schema',
          controls: [],
        },
      };

      // Mock useQuery to return metadata
      mockUseQuery.mockReturnValue({
        data: mockMetadata,
        isLoading: false,
        error: null,
      });

      // Mock getValue to return no errors
      mockGetValue.mockReturnValue({
        errors: [],
      });

      const mockOnViewingFormChange = jest.fn();
      render(
        <ObservationFormsContainer
          {...defaultProps}
          onViewingFormChange={mockOnViewingFormChange}
          viewingForm={mockForm}
        />,
      );

      const saveButton = screen.getByTestId('primary-button');
      fireEvent.click(saveButton);

      expect(mockOnViewingFormChange).toHaveBeenCalledWith(null);
    });

    it('should call onViewingFormChange with null when Back button is clicked', () => {
      const mockOnViewingFormChange = jest.fn();
      render(
        <ObservationFormsContainer
          {...defaultProps}
          onViewingFormChange={mockOnViewingFormChange}
          viewingForm={mockForm}
        />,
      );

      const backButton = screen.getByTestId('tertiary-button');
      fireEvent.click(backButton);

      expect(mockOnViewingFormChange).toHaveBeenCalledWith(null);
    });

    it('should call both onRemoveForm and onViewingFormChange when Discard button is clicked', () => {
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

      const discardButton = screen.getByTestId('secondary-button');
      fireEvent.click(discardButton);

      expect(mockOnRemoveForm).toHaveBeenCalledWith('test-form-uuid');
      expect(mockOnViewingFormChange).toHaveBeenCalledWith(null);
    });

    it('should only call onViewingFormChange when Discard button is clicked and onRemoveForm is not provided', () => {
      const mockOnViewingFormChange = jest.fn();
      render(
        <ObservationFormsContainer
          {...defaultProps}
          onViewingFormChange={mockOnViewingFormChange}
          onRemoveForm={undefined}
          viewingForm={mockForm}
        />,
      );

      const discardButton = screen.getByTestId('secondary-button');
      fireEvent.click(discardButton);

      expect(mockOnViewingFormChange).toHaveBeenCalledWith(null);
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
      mockFetchFormMetadata.mockClear();
      mockGetFormattedError.mockClear();
    });

    it('should use TanStack Query to fetch form metadata when viewingForm is provided', () => {
      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );

      // Verify useQuery was called with the correct configuration
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['formMetadata', 'test-form-uuid'],
          queryFn: expect.any(Function),
          enabled: true,
        }),
      );
    });

    it('should display SkeletonText while fetching metadata', () => {
      // Mock useQuery to return loading state
      mockUseQuery.mockReturnValue({
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

      // Mock useQuery to return success state with data
      mockUseQuery.mockReturnValue({
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

      // Mock useQuery to return error state
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
      });

      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );

      expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    });

    it('should not enable query when viewingForm is null', () => {
      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={null} />,
      );

      // Verify useQuery was called with enabled: false
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false,
        }),
      );
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

    it('should call updatePinnedForms when pin icon is clicked', () => {
      const mockUpdatePinnedForms = jest.fn();

      render(
        <ObservationFormsContainer
          {...defaultProps}
          viewingForm={nonDefaultForm}
          pinnedForms={[nonDefaultForm]}
          updatePinnedForms={mockUpdatePinnedForms}
        />,
      );

      const pinIcon = screen.getByTestId('icon-pin-icon');
      const pinContainer = pinIcon.parentElement;

      fireEvent.click(pinContainer!);

      expect(mockUpdatePinnedForms).toHaveBeenCalledWith([]);
    });

    it('should handle pin toggle gracefully', () => {
      render(
        <ObservationFormsContainer
          {...defaultProps}
          viewingForm={nonDefaultForm}
          pinnedForms={[nonDefaultForm]}
        />,
      );

      const pinIcon = screen.getByTestId('icon-pin-icon');
      const pinContainer = pinIcon.parentElement;

      // Should not throw error when clicking
      expect(() => fireEvent.click(pinContainer!)).not.toThrow();
    });
  });

  describe('Error Handling with Fallback Message', () => {
    it('should display fallback error message when getFormattedError returns undefined message', async () => {
      const mockError = new Error('Service error');
      mockGetFormattedError.mockReturnValue({
        title: 'Error',
        message: undefined,
      });

      // Mock useQuery to return error state
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
      });

      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );

      // Should fall back to ERROR_FETCHING_FORM_METADATA translation
      expect(
        screen.getByText('translated_ERROR_FETCHING_FORM_METADATA'),
      ).toBeInTheDocument();
      expect(mockGetFormattedError).toHaveBeenCalledWith(mockError);
    });

    it('should display fallback error message when getFormattedError returns null message', async () => {
      const mockError = new Error('Service error');
      mockGetFormattedError.mockReturnValue({
        title: 'Error',
        message: null,
      });

      // Mock useQuery to return error state
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
      });

      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );

      // Should fall back to ERROR_FETCHING_FORM_METADATA translation
      expect(
        screen.getByText('translated_ERROR_FETCHING_FORM_METADATA'),
      ).toBeInTheDocument();
    });

    it('should display formatted error message when available', async () => {
      const mockError = new Error('Service error');
      mockGetFormattedError.mockReturnValue({
        title: 'Error',
        message: 'Custom error message',
      });

      // Mock useQuery to return error state
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
      });

      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    const mockMetadata = {
      schema: {
        name: 'Test Form Schema',
        controls: [],
      },
    };

    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: mockMetadata,
        isLoading: false,
        error: null,
      });
    });

    it('should display validation error notification when form has errors on save', () => {
      // Mock getValue to return errors
      mockGetValue.mockReturnValue({
        errors: [{ message: 'Field is required' }],
      });

      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );

      const saveButton = screen.getByTestId('primary-button');
      fireEvent.click(saveButton);

      // Validation error notification should be displayed
      const notification = screen.getByTestId('inline-notification');
      expect(notification).toBeInTheDocument();
      expect(notification).toHaveAttribute('data-kind', 'error');

      expect(screen.getByTestId('notification-title')).toHaveTextContent(
        'translated_OBSERVATION_FORM_VALIDATION_ERROR_TITLE',
      );
      expect(screen.getByTestId('notification-subtitle')).toHaveTextContent(
        'translated_OBSERVATION_FORM_VALIDATION_ERROR_SUBTITLE',
      );

      // Should not close the form when there are validation errors
      expect(defaultProps.onViewingFormChange).not.toHaveBeenCalled();
    });

    it('should close validation error notification when close button is clicked', () => {
      // Mock getValue to return errors
      mockGetValue.mockReturnValue({
        errors: [{ message: 'Field is required' }],
      });

      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );

      const saveButton = screen.getByTestId('primary-button');
      fireEvent.click(saveButton);

      // Notification should be displayed
      expect(screen.getByTestId('inline-notification')).toBeInTheDocument();

      // Close the notification
      const closeButton = screen.getByTestId('notification-close');
      fireEvent.click(closeButton);

      // Notification should be removed
      expect(
        screen.queryByTestId('inline-notification'),
      ).not.toBeInTheDocument();
    });

    it('should hide validation error when discard button is clicked', () => {
      // Mock getValue to return errors
      mockGetValue.mockReturnValue({
        errors: [{ message: 'Field is required' }],
      });

      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );

      const saveButton = screen.getByTestId('primary-button');
      fireEvent.click(saveButton);

      // Notification should be displayed
      expect(screen.getByTestId('inline-notification')).toBeInTheDocument();

      // Click discard button
      const discardButton = screen.getByTestId('secondary-button');
      fireEvent.click(discardButton);

      // Form should be closed
      expect(defaultProps.onViewingFormChange).toHaveBeenCalledWith(null);
    });

    it('should hide validation error when back button is clicked', () => {
      // Mock getValue to return errors
      mockGetValue.mockReturnValue({
        errors: [{ message: 'Field is required' }],
      });

      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );

      const saveButton = screen.getByTestId('primary-button');
      fireEvent.click(saveButton);

      // Notification should be displayed
      expect(screen.getByTestId('inline-notification')).toBeInTheDocument();

      // Click back button
      const backButton = screen.getByTestId('tertiary-button');
      fireEvent.click(backButton);

      // Form should be closed
      expect(defaultProps.onViewingFormChange).toHaveBeenCalledWith(null);
    });

    it('should save form successfully when there are no validation errors', () => {
      // Mock getValue to return no errors
      mockGetValue.mockReturnValue({
        errors: [], // No errors
      });

      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );

      const saveButton = screen.getByTestId('primary-button');
      fireEvent.click(saveButton);

      // Should not display validation error
      expect(
        screen.queryByTestId('inline-notification'),
      ).not.toBeInTheDocument();

      // Should close the form
      expect(defaultProps.onViewingFormChange).toHaveBeenCalledWith(null);
    });

    it('should handle null errors array when saving form', () => {
      // Mock getValue to return null errors
      mockGetValue.mockReturnValue({
        errors: null, // Null errors
      });

      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );

      const saveButton = screen.getByTestId('primary-button');
      fireEvent.click(saveButton);

      // Should not display validation error
      expect(
        screen.queryByTestId('inline-notification'),
      ).not.toBeInTheDocument();

      // Should close the form
      expect(defaultProps.onViewingFormChange).toHaveBeenCalledWith(null);
    });
  });
});
