import {
  PatientSearchResultBundle,
  PatientSearchField,
} from '@bahmni/services';

/**
 * Type definition for different patient search types
 */
export type PatientSearchType = 'nameOrId' | 'attributes' | 'appointment';

/**
 * Context object passed to search strategies containing necessary information
 * for executing searches
 */
export interface SearchContext {
  selectedField?: PatientSearchField;
  searchFields: PatientSearchField[];
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  translator: (key: string, params?: any) => string;
}

/**
 * Result of input validation
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Base strategy interface that all search strategies must implement.
 * This follows the Strategy Pattern to encapsulate different search algorithms.
 *
 * @template T - The type of search result (e.g., PatientSearchResult, AppointmentSearchResult)
 */
export interface SearchStrategy {
  /**
   * Unique identifier for this search strategy
   */
  readonly type: PatientSearchType;

  /**
   * Execute the search operation
   * @param searchTerm - The search term entered by the user
   * @param context - Context containing search configuration and utilities
   * @returns Promise resolving to search results
   */
  execute(
    searchTerm: string,
    context: SearchContext,
  ): Promise<PatientSearchResultBundle>;

  /**
   * Optional: Validate the search input before executing the search
   * @param input - The input to validate
   * @param context - Context for validation
   * @returns Validation result indicating if input is valid
   */
  validate?(input: string, context: SearchContext): ValidationResult;

  /**
   * Optional: Format/transform the input before searching
   * @param input - The input to format
   * @param context - Context for formatting
   * @returns Formatted input string
   */
  formatInput?(input: string, context: SearchContext): string;

  /**
   * Optional: Transform/post-process the search results
   * @param results - The raw search results
   * @returns Transformed search results
   */
  transformResults?(
    results: PatientSearchResultBundle,
  ): PatientSearchResultBundle;
}
