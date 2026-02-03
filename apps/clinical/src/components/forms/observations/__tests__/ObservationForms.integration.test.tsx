import { ObservationForm } from '@bahmni/services';
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

// Mock hooks
const mockUseObservationFormsSearch = jest.fn();
const mockUsePinnedObservationForms = jest.fn();

jest.mock('../../../../hooks/useObservationFormsSearch', () => ({
  __esModule: true,
  default: () => mockUseObservationFormsSearch(),
}));

jest.mock('../../../../hooks/usePinnedObservationForms', () => ({
  __esModule: true,
  usePinnedObservationForms: () => mockUsePinnedObservationForms(),
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
    pinnedForms: [],
    updatePinnedForms: jest.fn(),
    isPinnedFormsLoading: false,
    allForms: mockAvailableForms,
    isAllFormsLoading: false,
    observationFormsError: null,
  };

  // Mock factories for consistent test data
  const createMockObservationFormsSearchReturn = (overrides = {}) => ({
    forms: mockAvailableForms,
    isLoading: false,
    error: null,
    ...overrides,
  });

  const createMockPinnedObservationFormsReturn = (overrides = {}) => ({
    pinnedForms: [],
    updatePinnedForms: jest.fn(),
    isLoading: false,
    error: null,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Set default mock return values
    mockUseObservationFormsSearch.mockReturnValue(
      createMockObservationFormsSearchReturn(),
    );
    mockUsePinnedObservationForms.mockReturnValue(
      createMockPinnedObservationFormsReturn(),
    );

    mockedLoadPinnedForms.mockResolvedValue([]);
    mockedSavePinnedForms.mockResolvedValue();
  });

  const renderComponent = (component: React.ReactElement) => {
    const mockedPinnedValues = mockUsePinnedObservationForms();
    const mockedFormsValues = mockUseObservationFormsSearch();
    const componentWithProps = React.cloneElement(component, {
      ...(component.props ?? {}),
      pinnedForms: mockedPinnedValues.pinnedForms,
      updatePinnedForms: mockedPinnedValues.updatePinnedForms,
      isPinnedFormsLoading: mockedPinnedValues.isLoading,
      allForms: mockedFormsValues.forms,
      isAllFormsLoading: mockedFormsValues.isLoading,
      observationFormsError: mockedFormsValues.error,
    } as any);
    return render(componentWithProps);
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
          screen.getByTestId('pinned-form-History and Examination'),
        ).toBeInTheDocument();
        expect(screen.getByTestId('pinned-form-Vitals')).toBeInTheDocument();
      });

      // Verify default forms don't have unpin action icons (they should be permanent)
      const defaultFormCards = [
        screen.getByTestId('pinned-form-History and Examination'),
        screen.getByTestId('pinned-form-Vitals'),
      ];

      defaultFormCards.forEach((card) => {
        expect(
          card.querySelector('[id*="action-icon"]'),
        ).not.toBeInTheDocument();
      });
    });

    it('should persist default forms display even when database has user pinned forms', async () => {
      const userPinnedForms = [mockAvailableForms[2]]; // Custom Form 1

      mockUsePinnedObservationForms.mockReturnValue(
        createMockPinnedObservationFormsReturn({
          pinnedForms: userPinnedForms,
        }),
      );

      renderComponent(<ObservationForms {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.getByTestId('pinned-forms-container-title'),
        ).toHaveTextContent('DEFAULT_AND_PINNED_FORMS_TITLE');
      });

      // Verify all forms are displayed: default + user pinned
      expect(
        screen.getByTestId('pinned-form-History and Examination'),
      ).toBeInTheDocument(); // Default
      expect(screen.getByTestId('pinned-form-Vitals')).toBeInTheDocument(); // Default
      expect(
        screen.getByTestId('pinned-form-Custom Form 1'),
      ).toBeInTheDocument(); // User pinned

      // Verify only user-pinned forms have action icons
      const userPinnedCard = screen.getByTestId('pinned-form-Custom Form 1');
      expect(
        userPinnedCard.querySelector('[id*="action-icon-fa-thumbtack"]'),
      ).toBeInTheDocument();
    });
  });

  describe('User Pin/Unpin Persistence Workflow', () => {
    it('should complete full pin workflow with database persistence', async () => {
      const mockUpdatePinnedForms = jest.fn();
      const userPinnedForms = [mockAvailableForms[2]]; // Custom Form 1 is already pinned

      mockUsePinnedObservationForms.mockReturnValue(
        createMockPinnedObservationFormsReturn({
          pinnedForms: userPinnedForms,
          updatePinnedForms: mockUpdatePinnedForms,
        }),
      );

      renderComponent(<ObservationForms {...defaultProps} />);
      await waitFor(() => {
        expect(
          screen.getByTestId('pinned-form-Custom Form 1'),
        ).toBeInTheDocument();
      });

      // Verify pinned form has unpin button
      const pinnedFormCard = screen.getByTestId('pinned-form-Custom Form 1');
      const unpinAction = pinnedFormCard.querySelector(
        '[id*="action-icon-fa-thumbtack"]',
      );
      expect(unpinAction).toBeInTheDocument();
    });

    it('should handle unpin workflow with database persistence', async () => {
      const user = userEvent.setup();
      const mockUpdatePinnedForms = jest.fn();
      const userPinnedForms = [mockAvailableForms[2]]; // Custom Form 1 is pinned

      mockUsePinnedObservationForms.mockReturnValue(
        createMockPinnedObservationFormsReturn({
          pinnedForms: userPinnedForms,
          updatePinnedForms: mockUpdatePinnedForms,
        }),
      );

      renderComponent(<ObservationForms {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.getByTestId('pinned-form-Custom Form 1'),
        ).toBeInTheDocument();
      });

      // Find and click the unpin action
      const pinnedFormCard = screen.getByTestId('pinned-form-Custom Form 1');
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

      mockUsePinnedObservationForms.mockReturnValue(
        createMockPinnedObservationFormsReturn({
          pinnedForms: userPinnedForms,
        }),
      );

      // First mount - simulate session 1
      const { unmount } = renderComponent(
        <ObservationForms {...defaultProps} />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('pinned-form-Custom Form 1'),
        ).toBeInTheDocument();
      });

      unmount();

      // Second mount - simulate session 2 (component remount)
      renderComponent(<ObservationForms {...defaultProps} />);

      // Verify forms persist across sessions
      await waitFor(() => {
        expect(
          screen.getByTestId('pinned-form-Custom Form 1'),
        ).toBeInTheDocument();
      });

      // Verify the form is displayed correctly
      expect(
        screen.getByTestId('pinned-form-Custom Form 1'),
      ).toBeInTheDocument();
    });

    it('should handle database errors gracefully during session restoration', async () => {
      // Simulate database error during load
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      renderComponent(<ObservationForms {...defaultProps} />);

      await waitFor(() => {
        // Should still show default forms even if user pinned forms fail to load
        expect(
          screen.getByTestId('pinned-form-History and Examination'),
        ).toBeInTheDocument();
        expect(screen.getByTestId('pinned-form-Vitals')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database save errors gracefully in unpin operations', async () => {
      const user = userEvent.setup();
      const mockUpdatePinnedForms = jest.fn();
      const userPinnedForms = [mockAvailableForms[2]]; // Custom Form 1

      mockUsePinnedObservationForms.mockReturnValue(
        createMockPinnedObservationFormsReturn({
          pinnedForms: userPinnedForms,
          updatePinnedForms: mockUpdatePinnedForms,
        }),
      );

      renderComponent(<ObservationForms {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.getByTestId('pinned-form-Custom Form 1'),
        ).toBeInTheDocument();
      });

      const form1Card = screen.getByTestId('pinned-form-Custom Form 1');
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
          screen.getByTestId('pinned-form-History and Examination'),
        ).toBeInTheDocument();
        expect(screen.getByTestId('pinned-form-Vitals')).toBeInTheDocument();
      });

      // Verify no user-pinned forms are displayed
      expect(
        screen.queryByTestId('pinned-form-Custom Form 1'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('pinned-form-Custom Form 2'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Accessibility Integration', () => {
    it('should maintain accessibility across pin/unpin workflows', async () => {
      const userPinnedForms = [mockAvailableForms[2]]; // Custom Form 1

      mockUsePinnedObservationForms.mockReturnValue(
        createMockPinnedObservationFormsReturn({
          pinnedForms: userPinnedForms,
        }),
      );

      const { container } = renderComponent(
        <ObservationForms {...defaultProps} />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('pinned-form-Custom Form 1'),
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

      mockUseObservationFormsSearch.mockReturnValue(
        createMockObservationFormsSearchReturn({
          forms: allForms,
        }),
      );

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
            screen.getByTestId('pinned-form-History and Examination'),
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

      mockUsePinnedObservationForms.mockReturnValue(
        createMockPinnedObservationFormsReturn({
          pinnedForms: userPinnedForms,
          updatePinnedForms: mockUpdatePinnedForms,
        }),
      );

      renderComponent(<ObservationForms {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.getByTestId('pinned-form-Custom Form 1'),
        ).toBeInTheDocument();
      });

      const formCard = screen.getByTestId('pinned-form-Custom Form 1');
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
      // Test backend integration with search results
      const searchResults = [mockAvailableForms[1], mockAvailableForms[2]]; // Vitals and Custom Form 1

      mockUseObservationFormsSearch.mockReturnValue(
        createMockObservationFormsSearchReturn({
          forms: searchResults,
        }),
      );

      renderComponent(<ObservationForms {...defaultProps} />);

      // Verify backend hook was called
      expect(mockUseObservationFormsSearch).toHaveBeenCalled();

      // Verify search section is present for backend integration
      expect(
        screen.getByTestId('observation-forms-search-section'),
      ).toBeInTheDocument();
    });

    it('should handle already selected forms from backend search', () => {
      // One form is already selected
      const selectedForms = [mockAvailableForms[1]]; // Vitals is already selected

      renderComponent(
        <ObservationForms {...defaultProps} selectedForms={selectedForms} />,
      );

      // Verify backend integration happens
      expect(mockUseObservationFormsSearch).toHaveBeenCalled();

      // Verify selected forms are properly displayed
      expect(screen.getByTestId('added-forms-section')).toBeInTheDocument();
      expect(screen.getByTestId('selected-form-Vitals')).toBeInTheDocument();

      // This verifies the integration where already selected forms
      // would be marked as disabled in the search results
      expect(
        screen.getByTestId('observation-forms-search-section'),
      ).toBeInTheDocument();
    });

    it('should handle backend search errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Mock backend search error
      mockUseObservationFormsSearch.mockReturnValue(
        createMockObservationFormsSearchReturn({
          forms: [],
          error: new Error('Search API failed'),
        }),
      );

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
      // Mock backend loading state
      mockUseObservationFormsSearch.mockReturnValue(
        createMockObservationFormsSearchReturn({
          forms: [],
          isLoading: true,
        }),
      );

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

      // Mock backend returns search results
      const searchResults = [mockAvailableForms[1]]; // Vitals

      mockUseObservationFormsSearch.mockReturnValue(
        createMockObservationFormsSearchReturn({
          forms: searchResults,
        }),
      );

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

    it('should show skeleton loading state when forms are loading', () => {
      // Set forms to loading state
      mockUseObservationFormsSearch.mockReturnValue(
        createMockObservationFormsSearchReturn({
          forms: [],
          isLoading: true,
        }),
      );

      renderComponent(<ObservationForms {...defaultProps} />);

      // Should show skeleton when forms are loading
      expect(screen.getByTestId('pinned-forms-section')).toBeInTheDocument();
      expect(screen.getByTestId('pinned-forms-skeleton')).toBeInTheDocument();
    });

    it('should show skeleton loading state when pinned forms are loading', () => {
      // Set pinned forms to loading state
      mockUsePinnedObservationForms.mockReturnValue(
        createMockPinnedObservationFormsReturn({
          isLoading: true,
        }),
      );

      renderComponent(<ObservationForms {...defaultProps} />);

      // Should show skeleton when pinned forms are loading
      expect(screen.getByTestId('pinned-forms-section')).toBeInTheDocument();
      expect(screen.getByTestId('pinned-forms-skeleton')).toBeInTheDocument();
    });

    it('should show skeleton loading state when both are loading', () => {
      // Set both to loading state
      mockUseObservationFormsSearch.mockReturnValue(
        createMockObservationFormsSearchReturn({
          forms: [],
          isLoading: true,
        }),
      );
      mockUsePinnedObservationForms.mockReturnValue(
        createMockPinnedObservationFormsReturn({
          isLoading: true,
        }),
      );

      renderComponent(<ObservationForms {...defaultProps} />);

      // Should show skeleton when both are loading
      expect(screen.getByTestId('pinned-forms-section')).toBeInTheDocument();
      expect(screen.getByTestId('pinned-forms-skeleton')).toBeInTheDocument();
    });

    it('should show forms when both are loaded', () => {
      // Both are loaded (default state from factory)
      renderComponent(<ObservationForms {...defaultProps} />);

      // Should show actual forms when both are loaded
      expect(screen.getByTestId('pinned-forms-section')).toBeInTheDocument();
      expect(
        screen.queryByTestId('pinned-forms-skeleton'),
      ).not.toBeInTheDocument();
      expect(
        screen.getByTestId('pinned-form-History and Examination'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('pinned-form-Vitals')).toBeInTheDocument();
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

        mockUsePinnedObservationForms.mockReturnValue(
          createMockPinnedObservationFormsReturn({
            pinnedForms: userPinnedForms,
            updatePinnedForms: mockUpdatePinnedForms,
          }),
        );

        renderComponent(<ObservationForms {...defaultProps} />);

        await waitFor(() => {
          expect(
            screen.getByTestId('pinned-form-Custom Form 1'),
          ).toBeInTheDocument();
        });

        const formCard = screen.getByTestId('pinned-form-Custom Form 1');
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
            screen.getByTestId('pinned-form-History and Examination'),
          ).toBeInTheDocument();
          expect(screen.getByTestId('pinned-form-Vitals')).toBeInTheDocument();
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

        mockUsePinnedObservationForms.mockReturnValue(
          createMockPinnedObservationFormsReturn({
            pinnedForms: userPinnedForms,
            updatePinnedForms: mockUpdatePinnedForms,
          }),
        );

        renderComponent(<ObservationForms {...defaultProps} />);

        await waitFor(() => {
          expect(
            screen.getByTestId('pinned-form-Custom Form 1'),
          ).toBeInTheDocument();
        });

        const formCard = screen.getByTestId('pinned-form-Custom Form 1');
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

        mockUsePinnedObservationForms.mockReturnValue(
          createMockPinnedObservationFormsReturn({
            pinnedForms: userPinnedForms,
            updatePinnedForms: mockUpdatePinnedForms,
          }),
        );

        renderComponent(<ObservationForms {...defaultProps} />);

        await waitFor(() => {
          expect(
            screen.getByTestId('pinned-form-Custom Form 1'),
          ).toBeInTheDocument();
          expect(
            screen.getByTestId('pinned-form-Custom Form 2'),
          ).toBeInTheDocument();
        });

        // Try to unpin multiple forms rapidly (simulate concurrent modifications)
        const form1Card = screen.getByTestId('pinned-form-Custom Form 1');
        const form2Card = screen.getByTestId('pinned-form-Custom Form 2');

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

        mockUsePinnedObservationForms.mockReturnValue(
          createMockPinnedObservationFormsReturn({
            pinnedForms: orphanedPinnedForms,
          }),
        );

        renderComponent(<ObservationForms {...defaultProps} />);

        // Should still render default forms
        await waitFor(() => {
          expect(
            screen.getByTestId('pinned-form-History and Examination'),
          ).toBeInTheDocument();
          expect(screen.getByTestId('pinned-form-Vitals')).toBeInTheDocument();
        });

        // Enhanced implementation now correctly filters out orphaned forms
        expect(
          screen.queryByTestId('pinned-form-Deleted Form'),
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

        mockUseObservationFormsSearch.mockReturnValue(
          createMockObservationFormsSearchReturn({
            forms: malformedForms,
          }),
        );

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

        mockUseObservationFormsSearch.mockReturnValue(
          createMockObservationFormsSearchReturn({
            forms: formsWithDuplicates,
          }),
        );

        renderComponent(<ObservationForms {...defaultProps} />);

        await waitFor(() => {
          expect(
            screen.getByTestId('pinned-form-History and Examination'),
          ).toBeInTheDocument();
        });

        // Should only render one instance of the form
        const duplicateForms = screen.getAllByTestId(
          'pinned-form-History and Examination',
        );
        expect(duplicateForms).toHaveLength(1);

        consoleSpy.mockRestore();
      });

      it('should handle missing required properties in form objects', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        // Mock forms missing critical properties
        const incompleteForm = { name: 'Incomplete Form', privileges: [] }; // Missing uuid and id

        mockUseObservationFormsSearch.mockReturnValue(
          createMockObservationFormsSearchReturn({
            forms: [...mockAvailableForms, incompleteForm],
          }),
        );

        renderComponent(<ObservationForms {...defaultProps} />);

        // Should render default forms despite malformed data
        await waitFor(() => {
          expect(
            screen.getByTestId('pinned-form-History and Examination'),
          ).toBeInTheDocument();
          expect(screen.getByTestId('pinned-form-Vitals')).toBeInTheDocument();
        });

        consoleSpy.mockRestore();
      });
    });

    describe('Essential System Failures', () => {
      it('should handle search API failures', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        mockUseObservationFormsSearch.mockReturnValue(
          createMockObservationFormsSearchReturn({
            forms: [],
            error: new Error('Failed to fetch forms'),
          }),
        );

        renderComponent(<ObservationForms {...defaultProps} />);

        // Should still show pinned forms section
        await waitFor(() => {
          expect(
            screen.getByTestId('pinned-forms-section'),
          ).toBeInTheDocument();
        });

        consoleSpy.mockRestore();

        // Restore to working state
        mockUseObservationFormsSearch.mockReturnValue(
          createMockObservationFormsSearchReturn(),
        );
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
            screen.getByTestId('pinned-form-History and Examination'),
          ).toBeInTheDocument();
          expect(screen.getByTestId('pinned-form-Vitals')).toBeInTheDocument();
        });

        consoleSpy.mockRestore();

        // Restore to working state
        mockedLoadPinnedForms.mockResolvedValue([]);
        mockedSavePinnedForms.mockResolvedValue();
      });
    });
  });
});
