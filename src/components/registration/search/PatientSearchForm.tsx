import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { PatientSearchCriteria } from '../../../types/registration';
import { REGISTRATION_CONFIG } from '../../../constants/registration';
import useDebounce from '../../../hooks/useDebounce';
import * as styles from './PatientSearchForm.module.scss';

/**
 * Props for the PatientSearchForm component
 */
export interface PatientSearchFormProps {
  /** Callback when search is performed */
  onSearch: (criteria: PatientSearchCriteria) => void;
  /** Callback when search is cleared */
  onClear: () => void;
  /** Whether the form is in loading state */
  isLoading?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Initial search criteria */
  initialCriteria?: PatientSearchCriteria;
  /** Enable auto-search with debouncing */
  enableAutoSearch?: boolean;
  /** Recent search terms */
  recentSearches?: string[];
  /** Additional CSS classes */
  className?: string;
}

/**
 * PatientSearchForm component for patient search functionality
 * Provides both basic and advanced search modes with validation
 *
 * @param props - PatientSearchForm component props
 * @returns JSX.Element
 */
export const PatientSearchForm: React.FC<PatientSearchFormProps> = ({
  onSearch,
  onClear,
  isLoading = false,
  error = null,
  initialCriteria,
  enableAutoSearch = false,
  recentSearches = [],
  className = '',
}) => {
  const { t } = useTranslation();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Basic search state
  const [basicSearch, setBasicSearch] = useState(initialCriteria?.name || '');

  // Advanced search state
  const [advancedCriteria, setAdvancedCriteria] =
    useState<PatientSearchCriteria>({
      givenName: initialCriteria?.givenName || '',
      middleName: initialCriteria?.middleName || '',
      familyName: initialCriteria?.familyName || '',
      gender: initialCriteria?.gender || undefined,
      identifier: initialCriteria?.identifier || '',
      birthdate: initialCriteria?.birthdate || '',
      age: initialCriteria?.age || undefined,
    });

  // Form validation errors
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Debounced search for auto-search
  const debouncedBasicSearch = useDebounce(
    basicSearch,
    REGISTRATION_CONFIG.SEARCH_DEBOUNCE_MS,
  );

  // Auto-search effect
  useEffect(() => {
    if (enableAutoSearch && debouncedBasicSearch.trim() && !showAdvanced) {
      handleSearch();
    }
  }, [debouncedBasicSearch, enableAutoSearch, showAdvanced]); // eslint-disable-line react-hooks/exhaustive-deps

  // Validate form fields
  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};

    // Age validation
    if (
      advancedCriteria.age !== undefined &&
      !isNaN(Number(advancedCriteria.age))
    ) {
      const age = Number(advancedCriteria.age);
      if (age < 0 || age > 150) {
        errors.age = t(
          'search.validation.ageRange',
          'Age must be between 0 and 150',
        );
      }
    }

    // Birth date validation
    if (advancedCriteria.birthdate) {
      const birthDate = new Date(advancedCriteria.birthdate);
      if (isNaN(birthDate.getTime())) {
        errors.birthdate = t(
          'search.validation.invalidDate',
          'Invalid date format',
        );
      } else if (birthDate > new Date()) {
        errors.birthdate = t(
          'search.validation.futureBirthdate',
          'Birth date cannot be in the future',
        );
      }
    }

    // Age and birthdate mutual exclusion
    if (
      advancedCriteria.age !== undefined &&
      !isNaN(Number(advancedCriteria.age)) &&
      advancedCriteria.birthdate
    ) {
      errors.ageBirthdate = t(
        'search.validation.ageOrBirthdate',
        'Please enter either age or birth date, not both',
      );
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [advancedCriteria, t]);

  // Handle basic search input change
  const handleBasicSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setBasicSearch(event.target.value);
      setShowRecentSearches(false);
    },
    [],
  );

  // Handle advanced field changes
  const handleAdvancedFieldChange = useCallback(
    (field: keyof PatientSearchCriteria) =>
      (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = event.target.value;
        setAdvancedCriteria((prev) => ({
          ...prev,
          [field]:
            field === 'age'
              ? value
                ? Number(value)
                : undefined
              : value || undefined,
        }));
      },
    [],
  );

  // Build search criteria
  const buildSearchCriteria = useCallback((): PatientSearchCriteria => {
    if (showAdvanced) {
      // Filter out empty values
      const criteria: PatientSearchCriteria = {};
      Object.entries(advancedCriteria).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          (criteria as any)[key] = value;
        }
      });
      return criteria;
    } else {
      return { name: basicSearch.trim() };
    }
  }, [showAdvanced, advancedCriteria, basicSearch]);

  // Handle search submission
  const handleSearch = useCallback(() => {
    const criteria = buildSearchCriteria();

    // Check if we have any search criteria
    const hasAnyCriteria = Object.values(criteria).some(
      (value) => value !== undefined && value !== '',
    );

    if (!hasAnyCriteria) {
      return;
    }

    // Validate advanced search fields
    if (showAdvanced && !validateForm()) {
      return;
    }

    onSearch(criteria);
  }, [buildSearchCriteria, showAdvanced, validateForm, onSearch]);

  // Handle form submission
  const handleSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      handleSearch();
    },
    [handleSearch],
  );

  // Handle Enter key in form fields
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleSearch();
      }
    },
    [handleSearch],
  );

  // Handle clear functionality
  const handleClear = useCallback(() => {
    setBasicSearch('');
    setAdvancedCriteria({
      givenName: '',
      middleName: '',
      familyName: '',
      gender: undefined,
      identifier: '',
      birthdate: '',
      age: undefined,
    });
    setValidationErrors({});
    setShowRecentSearches(false);
    onClear();

    // Focus search input
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [onClear]);

  // Toggle advanced search
  const toggleAdvancedSearch = useCallback(() => {
    setShowAdvanced((prev) => !prev);
    setValidationErrors({});
  }, []);

  // Handle recent search selection
  const handleRecentSearchSelect = useCallback(
    (searchTerm: string) => {
      setBasicSearch(searchTerm);
      setShowRecentSearches(false);
      if (!enableAutoSearch) {
        onSearch({ name: searchTerm });
      }
    },
    [enableAutoSearch, onSearch],
  );

  // Handle input focus for recent searches
  const handleInputFocus = useCallback(() => {
    if (recentSearches.length > 0 && !showAdvanced) {
      setShowRecentSearches(true);
    }
  }, [recentSearches.length, showAdvanced]);

  // Handle click outside to close recent searches
  const handleInputBlur = useCallback(() => {
    // Delay to allow click on recent search items
    setTimeout(() => setShowRecentSearches(false), 200);
  }, []);

  return (
    <div className={`${styles.searchForm} ${className}`}>
      <form
        onSubmit={handleSubmit}
        role="search"
        aria-label={t('search.form.label', 'Patient Search')}
      >
        {/* Error Display */}
        {error && (
          <div className={styles.errorMessage} role="alert">
            {error}
          </div>
        )}

        {/* Basic Search */}
        <div className={styles.basicSearch}>
          <div className={styles.searchInputContainer}>
            <label
              htmlFor="patient-search-input"
              className={styles.searchLabel}
            >
              {t('search.input.label', 'Search patients')}
            </label>
            <div className={styles.inputWrapper}>
              <input
                ref={searchInputRef}
                id="patient-search-input"
                type="text"
                value={basicSearch}
                onChange={handleBasicSearchChange}
                onKeyDown={handleKeyDown}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                disabled={isLoading || showAdvanced}
                placeholder={t(
                  'search.input.placeholder',
                  'Enter name, ID, or phone number',
                )}
                className={styles.searchInput}
                aria-describedby="search-help"
              />
              {isLoading && (
                <div
                  className={styles.loadingIndicator}
                  data-testid="search-loading"
                >
                  <div className={styles.spinner} />
                </div>
              )}
            </div>
            <div id="search-help" className={styles.searchHelp}>
              {t(
                'search.input.help',
                'Search by name, identifier, or phone number',
              )}
            </div>

            {/* Recent Searches Dropdown */}
            {showRecentSearches && recentSearches.length > 0 && (
              <div className={styles.recentSearches} role="listbox">
                <div className={styles.recentSearchesHeader}>
                  {t('search.recent.title', 'Recent Searches')}
                </div>
                {recentSearches.map((searchTerm, index) => (
                  <button
                    key={index}
                    type="button"
                    className={styles.recentSearchItem}
                    onClick={() => handleRecentSearchSelect(searchTerm)}
                    role="option"
                  >
                    {searchTerm}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className={styles.searchActions}>
            <button
              type="submit"
              disabled={isLoading}
              className={styles.searchButton}
              aria-label={t('search.button.search', 'Search')}
            >
              {t('search.button.search', 'Search')}
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={isLoading}
              className={styles.clearButton}
              aria-label={t('search.button.clear', 'Clear')}
            >
              {t('search.button.clear', 'Clear')}
            </button>
            <button
              type="button"
              onClick={toggleAdvancedSearch}
              className={`${styles.advancedToggle} ${showAdvanced ? styles.active : ''}`}
              aria-expanded={showAdvanced}
              aria-label={t('search.button.advanced', 'Advanced Search')}
            >
              {t('search.button.advanced', 'Advanced Search')}
            </button>
          </div>
        </div>

        {/* Advanced Search */}
        {showAdvanced && (
          <div
            className={styles.advancedSearch}
            aria-label={t('search.advanced.label', 'Advanced Search Options')}
          >
            <div className={styles.advancedFields}>
              {/* Name Fields */}
              <div className={styles.fieldGroup}>
                <h4 className={styles.groupTitle}>
                  {t('search.advanced.nameFields', 'Name Information')}
                </h4>
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label htmlFor="given-name">
                      {t('search.field.givenName', 'Given Name')}
                    </label>
                    <input
                      id="given-name"
                      type="text"
                      value={advancedCriteria.givenName || ''}
                      onChange={handleAdvancedFieldChange('givenName')}
                      onKeyDown={handleKeyDown}
                      disabled={isLoading}
                      className={styles.fieldInput}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="middle-name">
                      {t('search.field.middleName', 'Middle Name')}
                    </label>
                    <input
                      id="middle-name"
                      type="text"
                      value={advancedCriteria.middleName || ''}
                      onChange={handleAdvancedFieldChange('middleName')}
                      onKeyDown={handleKeyDown}
                      disabled={isLoading}
                      className={styles.fieldInput}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="family-name">
                      {t('search.field.familyName', 'Family Name')}
                    </label>
                    <input
                      id="family-name"
                      type="text"
                      value={advancedCriteria.familyName || ''}
                      onChange={handleAdvancedFieldChange('familyName')}
                      onKeyDown={handleKeyDown}
                      disabled={isLoading}
                      className={styles.fieldInput}
                    />
                  </div>
                </div>
              </div>

              {/* Demographics */}
              <div className={styles.fieldGroup}>
                <h4 className={styles.groupTitle}>
                  {t('search.advanced.demographics', 'Demographics')}
                </h4>
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label htmlFor="gender">
                      {t('search.field.gender', 'Gender')}
                    </label>
                    <select
                      id="gender"
                      value={advancedCriteria.gender || ''}
                      onChange={handleAdvancedFieldChange('gender')}
                      disabled={isLoading}
                      className={styles.fieldSelect}
                    >
                      <option value="">
                        {t('search.field.gender.select', 'Select Gender')}
                      </option>
                      <option value="M">
                        {t('patient.gender.male', 'Male')}
                      </option>
                      <option value="F">
                        {t('patient.gender.female', 'Female')}
                      </option>
                      <option value="O">
                        {t('patient.gender.other', 'Other')}
                      </option>
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="age">{t('search.field.age', 'Age')}</label>
                    <input
                      id="age"
                      type="number"
                      min="0"
                      max="150"
                      value={advancedCriteria.age || ''}
                      onChange={handleAdvancedFieldChange('age')}
                      onKeyDown={handleKeyDown}
                      disabled={isLoading}
                      className={`${styles.fieldInput} ${validationErrors.age ? styles.error : ''}`}
                    />
                    {validationErrors.age && (
                      <div className={styles.fieldError}>
                        {validationErrors.age}
                      </div>
                    )}
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="birthdate">
                      {t('search.field.birthdate', 'Birth Date')}
                    </label>
                    <input
                      id="birthdate"
                      type="date"
                      value={advancedCriteria.birthdate || ''}
                      onChange={handleAdvancedFieldChange('birthdate')}
                      onKeyDown={handleKeyDown}
                      disabled={isLoading}
                      className={`${styles.fieldInput} ${validationErrors.birthdate ? styles.error : ''}`}
                    />
                    {validationErrors.birthdate && (
                      <div className={styles.fieldError}>
                        {validationErrors.birthdate}
                      </div>
                    )}
                  </div>
                </div>
                {validationErrors.ageBirthdate && (
                  <div className={styles.groupError}>
                    {validationErrors.ageBirthdate}
                  </div>
                )}
              </div>

              {/* Identifier */}
              <div className={styles.fieldGroup}>
                <h4 className={styles.groupTitle}>
                  {t('search.advanced.identifier', 'Identifier')}
                </h4>
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label htmlFor="identifier">
                      {t('search.field.identifier', 'Patient Identifier')}
                    </label>
                    <input
                      id="identifier"
                      type="text"
                      value={advancedCriteria.identifier || ''}
                      onChange={handleAdvancedFieldChange('identifier')}
                      onKeyDown={handleKeyDown}
                      disabled={isLoading}
                      className={styles.fieldInput}
                      placeholder={t(
                        'search.field.identifier.placeholder',
                        'Enter patient ID',
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default PatientSearchForm;
