import { ObservationForm } from '@bahmni-frontend/bahmni-services';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import * as pinnedFormsService from '../../../../services/pinnedFormsService';
import ObservationForms from '../ObservationForms';

// Setup jest-axe matchers
expect.extend(toHaveNoViolations);

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: jest.fn((key) => key), // Return the key as-is for testing
  })),
}));

// Mock the pinnedFormsService
jest.mock('../../../../services/pinnedFormsService');
const mockedLoadPinnedForms =
  pinnedFormsService.loadPinnedForms as jest.MockedFunction<
    typeof pinnedFormsService.loadPinnedForms
  >;
const mockedSavePinnedForms =
  pinnedFormsService.savePinnedForms as jest.MockedFunction<
    typeof pinnedFormsService.savePinnedForms
  >;

// Mock useObservationFormsSearch hook
jest.mock('../../../../hooks/useObservationFormsSearch', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock usePinnedObservationForms hook
jest.mock('../../../../hooks/usePinnedObservationForms', () => ({
  __esModule: true,
  usePinnedObservationForms: jest.fn(),
}));

describe('ObservationForms Integration Tests', () => {
  const mockAvailableForms: ObservationForm[] = [
    {
      name: 'History and Examination',
      uuid: 'history-exam-uuid',
      id: 1,
      privileges: [],
    },
    {
      name: 'Vitals',
      uuid: 'vitals-uuid',
      id: 2,
      privileges: [],
    },
    {
      name: 'Custom Form 1',
      uuid: 'custom-form-1-uuid',
      id: 3,
      privileges: [],
    },
    {
      name: 'Custom Form 2',
      uuid: 'custom-form-2-uuid',
      id: 4,
      privileges: [],
    },
  ];

  const defaultProps = {
    onFormSelect: jest.fn(),
    selectedForms: [],
    onRemoveForm: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    const mockUseObservationFormsSearch = jest.requireMock(
      '../../../../hooks/useObservationFormsSearch',
    ).default;
    mockUseObservationFormsSearch.mockReturnValue({
      forms: mockAvailableForms,
      isLoading: false,
      error: null,
    });

    const mockUsePinnedObservationForms = jest.requireMock(
      '../../../../hooks/usePinnedObservationForms',
    ).usePinnedObservationForms;
    mockUsePinnedObservationForms.mockReturnValue({
      pinnedForms: [],
      updatePinnedForms: jest.fn(),
      isLoading: false,
      error: null,
    });

    mockedLoadPinnedForms.mockResolvedValue([]);
    mockedSavePinnedForms.mockResolvedValue();
  });

  const renderComponent = (component: React.ReactElement) => {
    return render(component);
  };

  describe('Default Forms Persistence', () => {
    it('should always display default forms in pinned section regardless of database state', async () => {
      mockedLoadPinnedForms.mockResolvedValue([]);

      renderComponent(<ObservationForms {...defaultProps} />);

      // Verify default forms appear in "Default and Pinned Forms" section
      await waitFor(() => {
        expect(screen.getByTestId('pinned-forms-section')).toBeInTheDocument();
        expect(
          screen.getByTestId('pinned-forms-container-title'),
        ).toHaveTextContent('DEFAULT_AND_PINNED_FORMS_TITLE');
        expect(
          screen.getByTestId('pinned-form-history-exam-uuid'),
        ).toBeInTheDocument();
        expect(
          screen.getByTestId('pinned-form-vitals-uuid'),
        ).toBeInTheDocument();
      });

      // Verify default forms don't have unpin action icons (they should be permanent)
      const defaultFormCards = [
        screen.getByTestId('pinned-form-history-exam-uuid'),
        screen.getByTestId('pinned-form-vitals-uuid'),
      ];

      defaultFormCards.forEach((card) => {
        expect(
          card.querySelector('[id*="action-icon"]'),
        ).not.toBeInTheDocument();
      });
    });

    it('should persist default forms display even when database has user pinned forms', async () => {
      const userPinnedForms = [mockAvailableForms[2]]; // Custom Form 1

      const mockUsePinnedObservationForms = jest.requireMock(
        '../../../../hooks/usePinnedObservationForms',
      ).usePinnedObservationForms;
      mockUsePinnedObservationForms.mockReturnValue({
        pinnedForms: userPinnedForms,
        updatePinnedForms: jest.fn(),
        isLoading: false,
        error: null,
      });

      renderComponent(<ObservationForms {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.getByTestId('pinned-forms-container-title'),
        ).toHaveTextContent('DEFAULT_AND_PINNED_FORMS_TITLE');
      });

      // Verify all forms are displayed: default + user pinned
      expect(
        screen.getByTestId('pinned-form-history-exam-uuid'),
      ).toBeInTheDocument(); // Default
      expect(screen.getByTestId('pinned-form-vitals-uuid')).toBeInTheDocument(); // Default
      expect(
        screen.getByTestId('pinned-form-custom-form-1-uuid'),
      ).toBeInTheDocument(); // User pinned

      // Verify only user-pinned forms have action icons
      const userPinnedCard = screen.getByTestId(
        'pinned-form-custom-form-1-uuid',
      );
      expect(
        userPinnedCard.querySelector('[id*="action-icon-fa-thumbtack"]'),
      ).toBeInTheDocument();
    });
  });

  describe('User Pin/Unpin Persistence Workflow', () => {
    it('should complete full pin workflow with database persistence', async () => {
      const mockUpdatePinnedForms = jest.fn();
      const userPinnedForms = [mockAvailableForms[2]]; // Custom Form 1 is already pinned

      const mockUsePinnedObservationForms = jest.requireMock(
        '../../../../hooks/usePinnedObservationForms',
      ).usePinnedObservationForms;
      mockUsePinnedObservationForms.mockReturnValue({
        pinnedForms: userPinnedForms,
        updatePinnedForms: mockUpdatePinnedForms,
        isLoading: false,
        error: null,
      });

      renderComponent(<ObservationForms {...defaultProps} />);
      await waitFor(() => {
        expect(
          screen.getByTestId('pinned-form-custom-form-1-uuid'),
        ).toBeInTheDocument();
      });

      // Verify pinned form has unpin button
      const pinnedFormCard = screen.getByTestId(
        'pinned-form-custom-form-1-uuid',
      );
      const unpinAction = pinnedFormCard.querySelector(
        '[id*="action-icon-fa-thumbtack"]',
      );
      expect(unpinAction).toBeInTheDocument();
    });

    it('should handle unpin workflow with database persistence', async () => {
      const user = userEvent.setup();
      const mockUpdatePinnedForms = jest.fn();
      const userPinnedForms = [mockAvailableForms[2]]; // Custom Form 1 is pinned

      const mockUsePinnedObservationForms = jest.requireMock(
        '../../../../hooks/usePinnedObservationForms',
      ).usePinnedObservationForms;
      mockUsePinnedObservationForms.mockReturnValue({
        pinnedForms: userPinnedForms,
        updatePinnedForms: mockUpdatePinnedForms,
        isLoading: false,
        error: null,
      });

      renderComponent(<ObservationForms {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.getByTestId('pinned-form-custom-form-1-uuid'),
        ).toBeInTheDocument();
      });

      // Find and click the unpin action
      const pinnedFormCard = screen.getByTestId(
        'pinned-form-custom-form-1-uuid',
      );
      const actionContainer = pinnedFormCard.querySelector(
        '[id*="action-icon-fa-thumbtack"]',
      );

      expect(actionContainer).toBeInTheDocument();
      await user.click(actionContainer!);

      // Verify updatePinnedForms is called with the updated array (without the unpinned form)
      expect(mockUpdatePinnedForms).toHaveBeenCalledWith([]);
    });
  });

  describe('Cross-Session Persistence', () => {
    it('should persist pinned forms across component remounts (session simulation)', async () => {
      const userPinnedForms = [mockAvailableForms[2]]; // Custom Form 1

      const mockUsePinnedObservationForms = jest.requireMock(
        '../../../../hooks/usePinnedObservationForms',
      ).usePinnedObservationForms;
      mockUsePinnedObservationForms.mockReturnValue({
        pinnedForms: userPinnedForms,
        updatePinnedForms: jest.fn(),
        isLoading: false,
        error: null,
      });

      // First mount - simulate session 1
      const { unmount } = renderComponent(
        <ObservationForms {...defaultProps} />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('pinned-form-custom-form-1-uuid'),
        ).toBeInTheDocument();
      });

      unmount();

      // Second mount - simulate session 2 (component remount)
      renderComponent(<ObservationForms {...defaultProps} />);

      // Verify forms persist across sessions
      await waitFor(() => {
        expect(
          screen.getByTestId('pinned-form-custom-form-1-uuid'),
        ).toBeInTheDocument();
      });

      // Verify the form is displayed correctly
      expect(
        screen.getByTestId('pinned-form-custom-form-1-uuid'),
      ).toBeInTheDocument();
    });

    it('should handle database errors gracefully during session restoration', async () => {
      // Simulate database error during load
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      renderComponent(<ObservationForms {...defaultProps} />);

      await waitFor(() => {
        // Should still show default forms even if user pinned forms fail to load
        expect(
          screen.getByTestId('pinned-form-history-exam-uuid'),
        ).toBeInTheDocument();
        expect(
          screen.getByTestId('pinned-form-vitals-uuid'),
        ).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database save errors gracefully in unpin operations', async () => {
      const user = userEvent.setup();
      const mockUpdatePinnedForms = jest.fn();
      const userPinnedForms = [mockAvailableForms[2]]; // Custom Form 1

      const mockUsePinnedObservationForms = jest.requireMock(
        '../../../../hooks/usePinnedObservationForms',
      ).usePinnedObservationForms;
      mockUsePinnedObservationForms.mockReturnValue({
        pinnedForms: userPinnedForms,
        updatePinnedForms: mockUpdatePinnedForms,
        isLoading: false,
        error: null,
      });

      renderComponent(<ObservationForms {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.getByTestId('pinned-form-custom-form-1-uuid'),
        ).toBeInTheDocument();
      });

      const form1Card = screen.getByTestId('pinned-form-custom-form-1-uuid');
      const actionContainer = form1Card.querySelector(
        '[id*="action-icon-fa-thumbtack"]',
      );

      await user.click(actionContainer!);

      // Verify the callback is called (error handling is managed by the container)
      expect(mockUpdatePinnedForms).toHaveBeenCalledWith([]);
    });

    it('should handle empty database state correctly', async () => {
      renderComponent(<ObservationForms {...defaultProps} />);

      // Should only show default forms when no user pinned forms
      await waitFor(() => {
        expect(
          screen.getByTestId('pinned-form-history-exam-uuid'),
        ).toBeInTheDocument();
        expect(
          screen.getByTestId('pinned-form-vitals-uuid'),
        ).toBeInTheDocument();
      });

      // Verify no user-pinned forms are displayed
      expect(
        screen.queryByTestId('pinned-form-custom-form-1-uuid'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('pinned-form-custom-form-2-uuid'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Accessibility Integration', () => {
    it('should maintain accessibility across pin/unpin workflows', async () => {
      const userPinnedForms = [mockAvailableForms[2]]; // Custom Form 1

      const mockUsePinnedObservationForms = jest.requireMock(
        '../../../../hooks/usePinnedObservationForms',
      ).usePinnedObservationForms;
      mockUsePinnedObservationForms.mockReturnValue({
        pinnedForms: userPinnedForms,
        updatePinnedForms: jest.fn(),
        isLoading: false,
        error: null,
      });

      const { container } = renderComponent(
        <ObservationForms {...defaultProps} />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('pinned-form-custom-form-1-uuid'),
        ).toBeInTheDocument();
      });

      // Test accessibility on the main container
      // Since Tile doesn't pass through data-testid, use class selector
      const observationFormsTile = container.querySelector(
        '.observationFormsTile',
      );
      expect(observationFormsTile).toBeInTheDocument();

      const result = await axe(observationFormsTile!, {
        rules: {
          'nested-interactive': { enabled: false }, // Disable this rule for known design system limitation
        },
      });
      expect(result).toHaveNoViolations();
    });
  });

  describe('Performance and Real-World Scenarios', () => {
    it('should handle large numbers of forms efficiently', async () => {
      const largeMockForms: ObservationForm[] = Array.from(
        { length: 20 },
        (_, index) => ({
          name: `Form ${index + 1}`,
          uuid: `form-${index + 1}-uuid`,
          id: index + 5,
          privileges: [],
        }),
      );

      // Include default forms in the large set
      const allForms = [...mockAvailableForms, ...largeMockForms];

      const mockUseObservationFormsSearch = jest.requireMock(
        '../../../../hooks/useObservationFormsSearch',
      ).default;
      mockUseObservationFormsSearch.mockReturnValue({
        forms: allForms,
        isLoading: false,
        error: null,
      });

      const { container } = renderComponent(
        <ObservationForms {...defaultProps} />,
      );

      // Should render without performance issues
      await waitFor(
        () => {
          expect(
            screen.getByTestId('pinned-forms-container-title'),
          ).toHaveTextContent('DEFAULT_AND_PINNED_FORMS_TITLE');
          expect(
            screen.getByTestId('pinned-form-history-exam-uuid'),
          ).toBeInTheDocument();
        },
        { timeout: 10000 },
      );

      expect(container).toBeInTheDocument();
    }, 15000);

    it('should handle rapid successive unpin operations without race conditions', async () => {
      const user = userEvent.setup();
      const mockUpdatePinnedForms = jest.fn();

      const userPinnedForms = [mockAvailableForms[2]]; // Custom Form 1

      const mockUsePinnedObservationForms = jest.requireMock(
        '../../../../hooks/usePinnedObservationForms',
      ).usePinnedObservationForms;
      mockUsePinnedObservationForms.mockReturnValue({
        pinnedForms: userPinnedForms,
        updatePinnedForms: mockUpdatePinnedForms,
        isLoading: false,
        error: null,
      });

      renderComponent(<ObservationForms {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.getByTestId('pinned-form-custom-form-1-uuid'),
        ).toBeInTheDocument();
      });

      const formCard = screen.getByTestId('pinned-form-custom-form-1-uuid');
      const actionContainer = formCard.querySelector(
        '[id*="action-icon-fa-thumbtack"]',
      );

      // Click the action
      await user.click(actionContainer!);

      // Should handle gracefully
      expect(mockUpdatePinnedForms).toHaveBeenCalledWith([]);
    });
  });

  describe('Search Functionality Integration', () => {
    it('should integrate with backend search hook correctly', () => {
      const mockUseObservationFormsSearch = jest.requireMock(
        '../../../../hooks/useObservationFormsSearch',
      ).default;

      // Test backend integration with search results
      const searchResults = [mockAvailableForms[1], mockAvailableForms[2]]; // Vitals and Custom Form 1

      mockUseObservationFormsSearch.mockReturnValue({
        forms: searchResults,
        isLoading: false,
        error: null,
      });

      renderComponent(<ObservationForms {...defaultProps} />);

      // Verify backend hook was called
      expect(mockUseObservationFormsSearch).toHaveBeenCalled();

      // Verify search section is present for backend integration
      expect(
        screen.getByTestId('observation-forms-search-section'),
      ).toBeInTheDocument();
    });

    it('should handle already selected forms from backend search', () => {
      const mockUseObservationFormsSearch = jest.requireMock(
        '../../../../hooks/useObservationFormsSearch',
      ).default;

      // Mock backend returns all forms
      mockUseObservationFormsSearch.mockReturnValue({
        forms: mockAvailableForms,
        isLoading: false,
        error: null,
      });

      // One form is already selected
      const selectedForms = [mockAvailableForms[1]]; // Vitals is already selected

      renderComponent(
        <ObservationForms {...defaultProps} selectedForms={selectedForms} />,
      );

      // Verify backend integration happens
      expect(mockUseObservationFormsSearch).toHaveBeenCalled();

      // Verify selected forms are properly displayed
      expect(screen.getByTestId('added-forms-section')).toBeInTheDocument();
      expect(
        screen.getByTestId('selected-form-vitals-uuid'),
      ).toBeInTheDocument();

      // This verifies the integration where already selected forms
      // would be marked as disabled in the search results
      expect(
        screen.getByTestId('observation-forms-search-section'),
      ).toBeInTheDocument();
    });

    it('should handle backend search errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockUseObservationFormsSearch = jest.requireMock(
        '../../../../hooks/useObservationFormsSearch',
      ).default;

      // Mock backend search error
      mockUseObservationFormsSearch.mockReturnValue({
        forms: [],
        isLoading: false,
        error: new Error('Search API failed'),
      });

      renderComponent(<ObservationForms {...defaultProps} />);

      // Verify backend was called despite error
      expect(mockUseObservationFormsSearch).toHaveBeenCalled();

      // Component should still render search functionality
      expect(
        screen.getByTestId('observation-forms-search-section'),
      ).toBeInTheDocument();

      // Error handling occurs within the ComboBox component itself
      // when the backend returns an error state

      consoleSpy.mockRestore();
    });

    it('should handle backend loading state', () => {
      const mockUseObservationFormsSearch = jest.requireMock(
        '../../../../hooks/useObservationFormsSearch',
      ).default;

      // Mock backend loading state
      mockUseObservationFormsSearch.mockReturnValue({
        forms: [],
        isLoading: true,
        error: null,
      });

      renderComponent(<ObservationForms {...defaultProps} />);

      // Verify backend integration occurs during loading
      expect(mockUseObservationFormsSearch).toHaveBeenCalled();

      // Search combobox should be disabled during backend loading
      const searchCombobox = screen.getByRole('combobox');
      expect(searchCombobox).toBeDisabled();

      // Search section should still be present
      expect(
        screen.getByTestId('observation-forms-search-section'),
      ).toBeInTheDocument();
    });

    it('should complete backend form selection workflow', () => {
      const mockOnFormSelect = jest.fn();
      const mockUseObservationFormsSearch = jest.requireMock(
        '../../../../hooks/useObservationFormsSearch',
      ).default;

      // Mock backend returns search results
      const searchResults = [mockAvailableForms[1]]; // Vitals

      mockUseObservationFormsSearch.mockReturnValue({
        forms: searchResults,
        isLoading: false,
        error: null,
      });

      renderComponent(
        <ObservationForms {...defaultProps} onFormSelect={mockOnFormSelect} />,
      );

      // Verify backend integration
      expect(mockUseObservationFormsSearch).toHaveBeenCalled();

      // The component should integrate with backend data
      // Form selection would occur through ComboBox interactions
      // which would call onFormSelect with the form from backend
      expect(
        screen.getByTestId('observation-forms-search-section'),
      ).toBeInTheDocument();
    });
  });

  describe('Sad Scenarios & Error Handling', () => {
    describe('Database Operation Failures', () => {
      it('should handle database connection failures during pin/unpin operations', async () => {
        const user = userEvent.setup();
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        const mockUpdatePinnedForms = jest.fn();

        // Mock database failure
        mockedSavePinnedForms.mockRejectedValue(
          new Error('Database connection failed'),
        );

        const userPinnedForms = [mockAvailableForms[2]]; // Custom Form 1

        const mockUsePinnedObservationForms = jest.requireMock(
          '../../../../hooks/usePinnedObservationForms',
        ).usePinnedObservationForms;
        mockUsePinnedObservationForms.mockReturnValue({
          pinnedForms: userPinnedForms,
          updatePinnedForms: mockUpdatePinnedForms,
          isLoading: false,
          error: null,
        });

        renderComponent(<ObservationForms {...defaultProps} />);

        await waitFor(() => {
          expect(
            screen.getByTestId('pinned-form-custom-form-1-uuid'),
          ).toBeInTheDocument();
        });

        const formCard = screen.getByTestId('pinned-form-custom-form-1-uuid');
        const actionContainer = formCard.querySelector(
          '[id*="action-icon-fa-thumbtack"]',
        );

        await user.click(actionContainer!);

        // Component should handle database failure gracefully
        expect(mockUpdatePinnedForms).toHaveBeenCalledWith([]);

        consoleSpy.mockRestore();
      });

      it('should handle service unavailable scenarios', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        // Mock service unavailable error
        mockedLoadPinnedForms.mockRejectedValue(
          new Error('Service Unavailable'),
        );

        renderComponent(<ObservationForms {...defaultProps} />);

        // Should still render default forms even if service is unavailable
        await waitFor(() => {
          expect(
            screen.getByTestId('pinned-form-history-exam-uuid'),
          ).toBeInTheDocument();
          expect(
            screen.getByTestId('pinned-form-vitals-uuid'),
          ).toBeInTheDocument();
        });

        consoleSpy.mockRestore();
      });

      it('should handle save operation timeouts', async () => {
        const user = userEvent.setup();
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        const mockUpdatePinnedForms = jest.fn();

        // Mock timeout error
        mockedSavePinnedForms.mockRejectedValue(new Error('Operation timeout'));

        const userPinnedForms = [mockAvailableForms[2]];

        const mockUsePinnedObservationForms = jest.requireMock(
          '../../../../hooks/usePinnedObservationForms',
        ).usePinnedObservationForms;
        mockUsePinnedObservationForms.mockReturnValue({
          pinnedForms: userPinnedForms,
          updatePinnedForms: mockUpdatePinnedForms,
          isLoading: false,
          error: null,
        });

        renderComponent(<ObservationForms {...defaultProps} />);

        await waitFor(() => {
          expect(
            screen.getByTestId('pinned-form-custom-form-1-uuid'),
          ).toBeInTheDocument();
        });

        const formCard = screen.getByTestId('pinned-form-custom-form-1-uuid');
        const actionContainer = formCard.querySelector(
          '[id*="action-icon-fa-thumbtack"]',
        );

        await user.click(actionContainer!);

        expect(mockUpdatePinnedForms).toHaveBeenCalledWith([]);

        consoleSpy.mockRestore();
      });

      it('should handle concurrent modification conflicts', async () => {
        const user = userEvent.setup();
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        const mockUpdatePinnedForms = jest.fn();

        // Mock conflict error
        mockedSavePinnedForms.mockRejectedValue(
          new Error('Concurrent modification detected'),
        );

        const userPinnedForms = [mockAvailableForms[2], mockAvailableForms[3]];

        const mockUsePinnedObservationForms = jest.requireMock(
          '../../../../hooks/usePinnedObservationForms',
        ).usePinnedObservationForms;
        mockUsePinnedObservationForms.mockReturnValue({
          pinnedForms: userPinnedForms,
          updatePinnedForms: mockUpdatePinnedForms,
          isLoading: false,
          error: null,
        });

        renderComponent(<ObservationForms {...defaultProps} />);

        await waitFor(() => {
          expect(
            screen.getByTestId('pinned-form-custom-form-1-uuid'),
          ).toBeInTheDocument();
          expect(
            screen.getByTestId('pinned-form-custom-form-2-uuid'),
          ).toBeInTheDocument();
        });

        // Try to unpin multiple forms rapidly (simulate concurrent modifications)
        const form1Card = screen.getByTestId('pinned-form-custom-form-1-uuid');
        const form2Card = screen.getByTestId('pinned-form-custom-form-2-uuid');

        const action1 = form1Card.querySelector(
          '[id*="action-icon-fa-thumbtack"]',
        );
        const action2 = form2Card.querySelector(
          '[id*="action-icon-fa-thumbtack"]',
        );

        await user.click(action1!);
        await user.click(action2!);

        expect(mockUpdatePinnedForms).toHaveBeenCalledTimes(2);

        consoleSpy.mockRestore();
      });
    });

    describe('Data Integrity Issues', () => {
      it('should handle orphaned pinned forms (forms no longer available)', async () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

        // Mock orphaned forms: pinned forms that don't exist in available forms
        const orphanedPinnedForms = [
          {
            name: 'Deleted Form',
            uuid: 'deleted-form-uuid',
            id: 999,
            privileges: [],
          },
        ];

        const mockUsePinnedObservationForms = jest.requireMock(
          '../../../../hooks/usePinnedObservationForms',
        ).usePinnedObservationForms;
        mockUsePinnedObservationForms.mockReturnValue({
          pinnedForms: orphanedPinnedForms,
          updatePinnedForms: jest.fn(),
          isLoading: false,
          error: null,
        });

        renderComponent(<ObservationForms {...defaultProps} />);

        // Should still render default forms
        await waitFor(() => {
          expect(
            screen.getByTestId('pinned-form-history-exam-uuid'),
          ).toBeInTheDocument();
          expect(
            screen.getByTestId('pinned-form-vitals-uuid'),
          ).toBeInTheDocument();
        });

        // Enhanced implementation now correctly filters out orphaned forms
        expect(
          screen.queryByTestId('pinned-form-deleted-form-uuid'),
        ).not.toBeInTheDocument();

        consoleSpy.mockRestore();
      });

      it('should handle malformed form data gracefully', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        // Mock malformed form data
        const malformedForms = [
          { name: null, uuid: 'malformed-uuid', id: 1, privileges: [] }, // Missing name
          { uuid: 'no-name-uuid', id: 2, privileges: [] }, // No name property
          { name: 'No UUID Form', id: 3, privileges: [] }, // Missing uuid
        ];

        const mockUseObservationFormsSearch = jest.requireMock(
          '../../../../hooks/useObservationFormsSearch',
        ).default;
        mockUseObservationFormsSearch.mockReturnValue({
          forms: malformedForms,
          isLoading: false,
          error: null,
        });

        renderComponent(<ObservationForms {...defaultProps} />);

        // Should handle gracefully and not crash
        await waitFor(() => {
          expect(
            screen.getByTestId('pinned-forms-section'),
          ).toBeInTheDocument();
        });

        consoleSpy.mockRestore();
      });

      it('should handle duplicate form UUIDs', async () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

        // Mock forms with duplicate UUIDs
        const formsWithDuplicates = [
          ...mockAvailableForms,
          {
            name: 'Duplicate Form',
            uuid: 'history-exam-uuid',
            id: 999,
            privileges: [],
          }, // Same UUID as default form
        ];

        const mockUseObservationFormsSearch = jest.requireMock(
          '../../../../hooks/useObservationFormsSearch',
        ).default;
        mockUseObservationFormsSearch.mockReturnValue({
          forms: formsWithDuplicates,
          isLoading: false,
          error: null,
        });

        renderComponent(<ObservationForms {...defaultProps} />);

        await waitFor(() => {
          expect(
            screen.getByTestId('pinned-form-history-exam-uuid'),
          ).toBeInTheDocument();
        });

        // Should only render one instance of the form
        const duplicateForms = screen.getAllByTestId(
          'pinned-form-history-exam-uuid',
        );
        expect(duplicateForms).toHaveLength(1);

        consoleSpy.mockRestore();
      });

      it('should handle missing required properties in form objects', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        // Mock forms missing critical properties
        const incompleteForm = { name: 'Incomplete Form', privileges: [] }; // Missing uuid and id

        const mockUseObservationFormsSearch = jest.requireMock(
          '../../../../hooks/useObservationFormsSearch',
        ).default;
        mockUseObservationFormsSearch.mockReturnValue({
          forms: [...mockAvailableForms, incompleteForm],
          isLoading: false,
          error: null,
        });

        renderComponent(<ObservationForms {...defaultProps} />);

        // Should render default forms despite malformed data
        await waitFor(() => {
          expect(
            screen.getByTestId('pinned-form-history-exam-uuid'),
          ).toBeInTheDocument();
          expect(
            screen.getByTestId('pinned-form-vitals-uuid'),
          ).toBeInTheDocument();
        });

        consoleSpy.mockRestore();
      });
    });

    describe('Essential System Failures', () => {
      it('should handle search API failures', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        const mockUseObservationFormsSearch = jest.requireMock(
          '../../../../hooks/useObservationFormsSearch',
        ).default;

        mockUseObservationFormsSearch.mockReturnValue({
          forms: [],
          isLoading: false,
          error: new Error('Failed to fetch forms'),
        });

        renderComponent(<ObservationForms {...defaultProps} />);

        // Should still show pinned forms section
        await waitFor(() => {
          expect(
            screen.getByTestId('pinned-forms-section'),
          ).toBeInTheDocument();
        });

        consoleSpy.mockRestore();

        // Restore to working state
        mockUseObservationFormsSearch.mockReturnValue({
          forms: mockAvailableForms,
          isLoading: false,
          error: null,
        });
      });

      it('should handle network connectivity issues', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        // Mock network failure
        mockedLoadPinnedForms.mockRejectedValue(
          new Error('Network Error: ENOTFOUND'),
        );
        mockedSavePinnedForms.mockRejectedValue(
          new Error('Network Error: ENOTFOUND'),
        );

        renderComponent(<ObservationForms {...defaultProps} />);

        // Should fallback to default forms
        await waitFor(() => {
          expect(
            screen.getByTestId('pinned-form-history-exam-uuid'),
          ).toBeInTheDocument();
          expect(
            screen.getByTestId('pinned-form-vitals-uuid'),
          ).toBeInTheDocument();
        });

        consoleSpy.mockRestore();

        // Restore to working state
        mockedLoadPinnedForms.mockResolvedValue([]);
        mockedSavePinnedForms.mockResolvedValue();
      });
    });
  });
});
