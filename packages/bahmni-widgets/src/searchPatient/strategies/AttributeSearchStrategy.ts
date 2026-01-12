import {
  searchPatientByCustomAttribute,
  PatientSearchResultBundle,
  formatDateAndTime,
  calculateAgeinYearsAndMonths,
} from '@bahmni/services';
import {
  SearchStrategy,
  SearchContext,
  ValidationResult,
} from '../SearchStrategy.interface';

/**
 * Strategy for searching patients by custom attributes (e.g., phone number)
 */
export class AttributeSearchStrategy implements SearchStrategy {
  readonly type = 'attributes' as const;

  /**
   * Execute custom attribute search
   */
  async execute(
    searchTerm: string,
    context: SearchContext,
  ): Promise<PatientSearchResultBundle> {
    const { selectedField, searchFields, translator } = context;
    const fieldType = selectedField?.type ?? '';
    const fieldsToSearch = selectedField?.fields ?? [];

    const rawResults = await searchPatientByCustomAttribute(
      searchTerm,
      fieldType,
      fieldsToSearch,
      searchFields,
      translator,
    );

    return this.transformResults(rawResults, context);
  }

  /**
   * Validate custom attribute search input
   * Includes special validation for phone numbers
   */
  validate(input: string, context: SearchContext): ValidationResult {
    if (!input || input.trim().length === 0) {
      return { valid: false, error: 'SEARCH_TERM_EMPTY' };
    }

    // Special validation for phone number fields
    if (this.isPhoneSearch(context)) {
      return this.validatePhoneNumber(input);
    }

    return { valid: true };
  }

  /**
   * Format the input
   * Includes special formatting for phone numbers
   */
  formatInput(input: string, context: SearchContext): string {
    // Special formatting for phone number fields
    if (this.isPhoneSearch(context)) {
      return this.formatPhoneNumber(input);
    }

    return input.trim();
  }

  /**
   * Transform results to format dates and calculate ages
   */
  transformResults(
    results: PatientSearchResultBundle,
    context: SearchContext,
  ): PatientSearchResultBundle {
    return {
      ...results,
      pageOfResults: results.pageOfResults.map((patient) => ({
        ...patient,
        birthDate: patient.birthDate
          ? formatDateAndTime(new Date(patient.birthDate).getTime(), false)
          : patient.birthDate,
        age: patient.birthDate
          ? calculateAgeinYearsAndMonths(
              new Date(patient.birthDate).getTime(),
              context.translator,
            )
          : patient.age,
      })),
    };
  }

  /**
   * Check if the current search is for phone numbers
   */
  private isPhoneSearch(context: SearchContext): boolean {
    return (
      context.selectedField?.fields.some(
        (field) => field === 'phoneNumber' || field === 'alternatePhoneNumber',
      ) ?? false
    );
  }

  /**
   * Validate phone number format
   * Allows only digits and optional leading '+'
   */
  private validatePhoneNumber(input: string): ValidationResult {
    const hasPlusAtStart = input.length > 0 && input[0] === '+';
    const numericValue = input.replace(/[^0-9]/g, '');
    const formattedValue = hasPlusAtStart ? '+' + numericValue : numericValue;

    // Check if input contains invalid characters
    if (input !== formattedValue && input.length > 0) {
      return {
        valid: false,
        error: 'PHONE_NUMBER_VALIDATION_ERROR',
      };
    }

    return { valid: true };
  }

  /**
   * Format phone number to contain only digits and optional leading '+'
   */
  private formatPhoneNumber(input: string): string {
    const hasPlusAtStart = input.length > 0 && input[0] === '+';
    const numericValue = input.replace(/[^0-9]/g, '');
    return hasPlusAtStart ? '+' + numericValue : numericValue;
  }
}
