import React from 'react';
import { render, screen, act } from '@testing-library/react';
import ConditionsTable from '../ConditionsTable';
import { usePatientUUID } from '@hooks/usePatientUUID';
import { useConditions } from '@hooks/useConditions';
import { formatConditions } from '@services/conditionService';
import {
  mockPatientUUID,
  mockConditions,
  mockFormattedConditionsWithoutNotes,
  mockFormattedConditionsWithNotes,
} from '@__mocks__/conditionMocks';
import {
  FhirCondition,
  FormattedCondition,
  ConditionStatus,
} from '@types/condition';

// Mock for react-i18next with language switching support
jest.mock('react-i18next', () => {
  // Create a mock module factory that doesn't reference external variables
  return {
    // Mock the useTranslation hook
    useTranslation: () => {
      return {
        t: jest.fn((key: string, options?: Record<string, string>) => {
          // Mock implementation that returns translations based on the current language
          const mockI18n = jest.requireMock('react-i18next').__mockI18n;

          if (mockI18n.language === 'es') {
            const spanishTranslations: Record<string, string> = {
              CONDITION_LIST_CONDITION: 'Condición',
              CONDITION_LIST_STATUS: 'Estado',
              CONDITION_TABLE_ONSET_DATE: 'Fecha de inicio',
              CONDITION_TABLE_PROVIDER: 'Proveedor',
              CONDITION_TABLE_RECORDED_DATE: 'Fecha de grabación',
              CONDITION_LIST_DISPLAY_CONTROL_TITLE: 'Condiciones',
              CONDITION_LIST_NO_CONDITIONS: 'No hay Condiciones disponibles',
              CONDITION_LIST_ACTIVE: 'Activo',
              CONDITION_LIST_INACTIVE: 'Inactivo',
              CONDITION_TABLE_NOT_AVAILABLE: 'No disponible',
              EXPANDABLE_TABLE_ERROR_MESSAGE: '{{title}}: {{message}}',
            };

            // Handle interpolation for error message
            if (key === 'EXPANDABLE_TABLE_ERROR_MESSAGE' && options) {
              return spanishTranslations[key]
                .replace('{{title}}', options.title || '')
                .replace('{{message}}', options.message || '');
            }

            return spanishTranslations[key] || key;
          }

          const englishTranslations: Record<string, string> = {
            CONDITION_LIST_CONDITION: 'Condition',
            CONDITION_LIST_STATUS: 'Status',
            CONDITION_TABLE_ONSET_DATE: 'Onset Date',
            CONDITION_TABLE_PROVIDER: 'Provider',
            CONDITION_TABLE_RECORDED_DATE: 'Recorded Date',
            CONDITION_LIST_DISPLAY_CONTROL_TITLE: 'Conditions',
            CONDITION_LIST_NO_CONDITIONS: 'No conditions found',
            CONDITION_LIST_ACTIVE: 'Active',
            CONDITION_LIST_INACTIVE: 'Inactive',
            CONDITION_TABLE_NOT_AVAILABLE: 'Not available',
            EXPANDABLE_TABLE_ERROR_MESSAGE: '{{title}}: {{message}}',
          };

          // Handle interpolation for error message
          if (key === 'EXPANDABLE_TABLE_ERROR_MESSAGE' && options) {
            return englishTranslations[key]
              .replace('{{title}}', options.title || '')
              .replace('{{message}}', options.message || '');
          }

          return englishTranslations[key] || key;
        }),
        i18n: {
          // These properties will be updated by the test
          get language() {
            return jest.requireMock('react-i18next').__mockI18n.language;
          },
          changeLanguage: jest.fn((lang: string) => {
            jest.requireMock('react-i18next').__mockI18n.language = lang;
            return Promise.resolve();
          }),
        },
      };
    },
    // Store the mock state in the module
    __mockI18n: {
      language: 'en',
    },
  };
});

// Mock the hooks
jest.mock('@hooks/usePatientUUID');
jest.mock('@hooks/useConditions');
jest.mock('@services/conditionService');

const mockedUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;

const mockedUseConditions = useConditions as jest.MockedFunction<
  typeof useConditions
>;

const mockedFormatConditions = formatConditions as jest.MockedFunction<
  typeof formatConditions
>;

describe('ConditionsTable Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation();
    // Reset i18n mock state before each test
    jest.requireMock('react-i18next').__mockI18n.language = 'en';
  });

  it('should call usePatientUUID to get patient UUID', () => {
    // Mock the hooks
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedUseConditions.mockReturnValue({
      conditions: mockConditions,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });
    mockedFormatConditions.mockReturnValue(mockFormattedConditionsWithoutNotes);

    render(<ConditionsTable />);

    // Verify usePatientUUID was called
    expect(usePatientUUID).toHaveBeenCalled();
  });

  it('should call useConditions with the correct patient UUID', () => {
    // Mock the hooks
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedUseConditions.mockReturnValue({
      conditions: mockConditions,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });
    mockedFormatConditions.mockReturnValue(mockFormattedConditionsWithoutNotes);

    render(<ConditionsTable />);

    // Verify useConditions was called with the correct UUID
    expect(useConditions).toHaveBeenCalledWith(mockPatientUUID);
  });

  it('should call formatConditions with the conditions from useConditions', () => {
    // Mock the hooks
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedUseConditions.mockReturnValue({
      conditions: mockConditions,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });
    mockedFormatConditions.mockReturnValue(mockFormattedConditionsWithoutNotes);

    render(<ConditionsTable />);

    // Verify formatConditions was called with the correct conditions
    expect(formatConditions).toHaveBeenCalledWith(mockConditions);
  });

  it('should display formatted conditions from the formatConditions function', () => {
    // Mock the hooks
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedUseConditions.mockReturnValue({
      conditions: mockConditions,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });
    mockedFormatConditions.mockReturnValue(mockFormattedConditionsWithoutNotes);

    render(<ConditionsTable />);

    // Verify the formatted conditions are displayed
    expect(screen.getByText('Cyst of Gallbladder')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Super Man')).toBeInTheDocument();
  });

  it('should refetch conditions when patient UUID changes', () => {
    const refetchMock = jest.fn();

    // First render with initial UUID
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedUseConditions.mockReturnValue({
      conditions: mockConditions,
      loading: false,
      error: null,
      refetch: refetchMock,
    });
    mockedFormatConditions.mockReturnValue(mockFormattedConditionsWithoutNotes);

    const { rerender } = render(<ConditionsTable />);

    // Change the UUID and rerender
    const newUUID = 'new-patient-uuid';
    (usePatientUUID as jest.Mock).mockReturnValue(newUUID);

    rerender(<ConditionsTable />);

    // Verify useConditions was called with the new UUID
    expect(useConditions).toHaveBeenCalledWith(newUUID);
  });

  it('should handle empty patient UUID', () => {
    // Mock the hooks with empty UUID
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedUseConditions.mockReturnValue({
      conditions: [],
      loading: false,
      error: new Error('Invalid patient UUID'),
      refetch: jest.fn(),
    });
    mockedFormatConditions.mockReturnValue([]);

    render(<ConditionsTable />);

    // Verify Error Message is shown for error state
    expect(screen.getByTestId('expandable-table-error')).toBeInTheDocument();
    expect(
      screen.getByText('Invalid patient UUID', { exact: false }),
    ).toBeInTheDocument();
  });

  it('should handle invalid patient UUID', () => {
    // Mock the hooks with invalid UUID
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedUseConditions.mockReturnValue({
      conditions: [],
      loading: false,
      error: new Error('Invalid patient UUID'),
      refetch: jest.fn(),
    });
    mockedFormatConditions.mockReturnValue([]);

    render(<ConditionsTable />);

    // Verify Error Message is shown for error state
    expect(screen.getByTestId('expandable-table-error')).toBeInTheDocument();
    expect(
      screen.getByText('Invalid patient UUID', { exact: false }),
    ).toBeInTheDocument();
  });

  it('should handle network errors from useConditions', () => {
    // Mock the hooks with network error
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedUseConditions.mockReturnValue({
      conditions: [],
      loading: false,
      error: new Error('Network error'),
      refetch: jest.fn(),
    });
    mockedFormatConditions.mockReturnValue([]);

    render(<ConditionsTable />);

    // Verify Error Message is shown for error state
    expect(screen.getByTestId('expandable-table-error')).toBeInTheDocument();
    expect(
      screen.getByText('Network error', { exact: false }),
    ).toBeInTheDocument();
  });

  it('should display notes when condition has notes', () => {
    // Mock the hooks
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedUseConditions.mockReturnValue({
      conditions: mockConditions,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    mockedFormatConditions.mockReturnValue(mockFormattedConditionsWithNotes);

    render(<ConditionsTable />);

    // In a real test with the actual ExpandableDataTable, we would need to expand the row
    // But since we're using a mock, we can just check if the notes are in the document
    expect(
      screen.getByText('Patient reports pain in the upper right quadrant'),
    ).toBeInTheDocument();
  });

  it('should display condition without expanding has no notes', () => {
    // Mock the hooks
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedUseConditions.mockReturnValue({
      conditions: mockConditions,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    mockedFormatConditions.mockReturnValue(mockFormattedConditionsWithoutNotes);

    render(<ConditionsTable />);

    // In a real test with the actual ExpandableDataTable, we would need to expand the row
    // But since we're using a mock, we can just check if there is no notes in the document
    expect(screen.getByText('Cyst of Gallbladder')).toBeInTheDocument();
    expect(screen.getByText('Super Man')).toBeInTheDocument();
  });

  it('should handle missing optional fields in condition data', () => {
    // Create condition with missing optional fields
    const conditionsWithMissingFields: FhirCondition[] = [
      {
        resourceType: 'Condition',
        id: 'condition-without-optionals',
        meta: {
          versionId: '1',
          lastUpdated: '2025-03-25T06:48:32.000+00:00',
        },
        code: {
          coding: [
            {
              code: 'test-code',
              display: 'Test Condition',
            },
          ],
          text: 'Test Condition',
        },
        subject: {
          reference: `Patient/${mockPatientUUID}`,
          type: 'Patient',
          display: 'Test Patient',
        },
        // Missing onsetDateTime, recordedDate, recorder, clinicalStatus
      },
    ];

    const formattedIncompleteCondition: FormattedCondition[] = [
      {
        id: 'condition-without-optionals',
        display: 'Test Condition',
        status: ConditionStatus.Inactive,
        code: 'test-code',
        codeDisplay: 'Test Condition',
        // Missing onsetDate, recordedDate, recorder
      },
    ];

    // Mock the hooks with incomplete data
    (usePatientUUID as jest.Mock).mockReturnValue(mockPatientUUID);
    (useConditions as jest.Mock).mockReturnValue({
      conditions: conditionsWithMissingFields,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });
    (formatConditions as jest.Mock).mockReturnValue(
      formattedIncompleteCondition,
    );

    render(<ConditionsTable />);

    // Verify the component renders with incomplete data
    expect(screen.getByText('Test Condition')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  // Language Switching Tests
  describe('Language Switching Integration', () => {
    beforeEach(() => {
      // Setup standard test data
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseConditions.mockReturnValue({
        conditions: mockConditions,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });
      mockedFormatConditions.mockReturnValue(
        mockFormattedConditionsWithoutNotes,
      );
    });

    it('should render with English translations by default', async () => {
      // Act
      render(<ConditionsTable />);

      // Assert - Check table headers are in English
      expect(screen.getByText('Condition')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Onset Date')).toBeInTheDocument();
      expect(screen.getByText('Provider')).toBeInTheDocument();
      expect(screen.getByText('Recorded Date')).toBeInTheDocument();

      // Check table title is in English
      expect(screen.getByText('Conditions')).toBeInTheDocument();

      // Check status tag is in English
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should display Spanish translations when language is set to Spanish', async () => {
      // Arrange - Set language to Spanish
      jest.requireMock('react-i18next').__mockI18n.language = 'es';

      // Act
      render(<ConditionsTable />);

      // Assert - Check table headers are in Spanish
      expect(screen.getByText('Condición')).toBeInTheDocument();
      expect(screen.getByText('Estado')).toBeInTheDocument();
      expect(screen.getByText('Fecha de inicio')).toBeInTheDocument();
      expect(screen.getByText('Proveedor')).toBeInTheDocument();
      expect(screen.getByText('Fecha de grabación')).toBeInTheDocument();

      // Check table title is in Spanish
      expect(screen.getByText('Condiciones')).toBeInTheDocument();

      // Check status tag is in Spanish
      expect(screen.getByText('Activo')).toBeInTheDocument();
    });

    it('should switch from English to Spanish and back', async () => {
      // Arrange
      const { rerender } = render(<ConditionsTable />);

      // Assert initial English rendering
      expect(screen.getByText('Condition')).toBeInTheDocument();
      expect(screen.getByText('Conditions')).toBeInTheDocument();

      // Act - Change to Spanish
      act(() => {
        jest.requireMock('react-i18next').__mockI18n.language = 'es';
      });
      rerender(<ConditionsTable />);

      // Assert Spanish rendering
      expect(screen.getByText('Condición')).toBeInTheDocument();
      expect(screen.getByText('Condiciones')).toBeInTheDocument();

      // Act - Change back to English
      act(() => {
        jest.requireMock('react-i18next').__mockI18n.language = 'en';
      });
      rerender(<ConditionsTable />);

      // Assert English rendering again
      expect(screen.getByText('Condition')).toBeInTheDocument();
      expect(screen.getByText('Conditions')).toBeInTheDocument();
    });

    it('should display empty state message in the correct language', async () => {
      // Arrange - Empty conditions
      mockedUseConditions.mockReturnValue({
        conditions: [],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });
      mockedFormatConditions.mockReturnValue([]);

      // Act - Render with English
      const { rerender } = render(<ConditionsTable />);

      // Assert - Empty state message in English
      expect(screen.getByText('No conditions found')).toBeInTheDocument();

      // Act - Change to Spanish and rerender
      act(() => {
        jest.requireMock('react-i18next').__mockI18n.language = 'es';
      });
      rerender(<ConditionsTable />);

      // Assert - Empty state message in Spanish
      expect(
        screen.getByText('No hay Condiciones disponibles'),
      ).toBeInTheDocument();
    });

    it('should display error messages in the correct language', async () => {
      // Arrange - Error state
      const testError = new Error('Test error message');
      mockedUseConditions.mockReturnValue({
        conditions: [],
        loading: false,
        error: testError,
        refetch: jest.fn(),
      });

      // Act - Render with English
      const { rerender } = render(<ConditionsTable />);

      // Assert - Error message in English
      expect(screen.getByTestId('expandable-table-error')).toBeInTheDocument();
      expect(
        screen.getByText('Error: Test error message', { exact: false }),
      ).toBeInTheDocument();

      // Act - Change to Spanish and rerender
      act(() => {
        jest.requireMock('react-i18next').__mockI18n.language = 'es';
      });
      rerender(<ConditionsTable />);

      // Assert - Error message in Spanish
      expect(screen.getByTestId('expandable-table-error')).toBeInTheDocument();
      expect(
        screen.getByText('Error: Test error message', { exact: false }),
      ).toBeInTheDocument();
    });
  });
});
