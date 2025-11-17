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
    const rawResults = await searchPatientByNameOrId(encodeURI(searchTerm));
    return this.transformResults(rawResults);
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
   * Transform results to format dates and calculate ages
   */
  transformResults(
    results: PatientSearchResultBundle,
  ): PatientSearchResultBundle {
    return {
      ...results,
      pageOfResults: results.pageOfResults.map((patient) => ({
        ...patient,
        birthDate: patient.birthDate
          ? formatDateAndTime(new Date(patient.birthDate).getTime(), false)
          : patient.birthDate,
        age: patient.birthDate
          ? calculateAgeinYearsAndMonths(new Date(patient.birthDate).getTime())
          : patient.age,
      })),
    };
  }
}
