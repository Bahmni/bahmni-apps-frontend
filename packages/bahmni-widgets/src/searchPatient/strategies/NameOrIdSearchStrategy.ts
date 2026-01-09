import {
  searchPatientByNameOrId,
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
 * Strategy for searching patients by name or patient ID
 */
export class NameOrIdSearchStrategy implements SearchStrategy {
  readonly type = 'nameOrId' as const;

  /**
   * Execute name or ID search
   */
  async execute(
    searchTerm: string,
    context: SearchContext,
  ): Promise<PatientSearchResultBundle> {
    const rawResults = await searchPatientByNameOrId(
      encodeURI(searchTerm),
      context.searchFields,
    );
    return this.transformResults(rawResults, context);
  }

  /**
   * Validate name or ID search input
   */
  validate(input: string): ValidationResult {
    if (!input || input.trim().length === 0) {
      return { valid: false, error: 'SEARCH_TERM_EMPTY' };
    }
    return { valid: true };
  }

  /**
   * Format the input by trimming whitespace
   */
  formatInput(input: string): string {
    return input.trim();
  }

  /**
   * Parse JSON string safely
   */
  private parseJSON(
    jsonString: string | null | undefined,
  ): Record<string, string> {
    try {
      return jsonString ? JSON.parse(jsonString) : {};
    } catch {
      return {};
    }
  }

  /**
   * Transform results to format dates, calculate ages, and parse address/custom attributes
   */
  transformResults(
    results: PatientSearchResultBundle,
    context: SearchContext,
  ): PatientSearchResultBundle {
    return {
      ...results,
      pageOfResults: results.pageOfResults.map((patient) => {
        const addressData = this.parseJSON(patient.addressFieldValue);
        const customData = this.parseJSON(patient.customAttribute);

        return {
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
          city_village: addressData.city_village || '',
          address2: addressData.address2 || '',
          email: customData.email || '',
        };
      }),
    };
  }
}
