import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Grid,
  Column,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  InlineLoading,
  Layer
} from '@carbon/react';
import { Add } from '@carbon/react/icons';
import PatientSearchForm from '../components/registration/search/PatientSearchForm';
import PatientSearchResults from '../components/registration/search/PatientSearchResults';
import usePatientSearch from '../hooks/usePatientSearch';
import useNotification from '../hooks/useNotification';
import { PatientSearchCriteria, PatientSearchResult } from '../types/registration';
import './PatientSearchPage.scss';

/**
 * PatientSearchPage
 *
 * Main page component for patient search functionality in the registration module.
 * Provides comprehensive search interface with URL parameter handling, browser history
 * integration, and performance optimization.
 *
 * Features:
 * - Integration with PatientSearchForm and PatientSearchResults components
 * - URL parameter handling for deep linking and bookmarking
 * - Browser history integration for back/forward navigation
 * - Search result caching for improved performance
 * - Responsive layout with mobile-first design
 * - Breadcrumb navigation and page title management
 * - Error handling and loading states
 * - Accessibility compliance with WCAG 2.1 AA standards
 *
 * @returns React component for patient search page
 */
const PatientSearchPage: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addNotification } = useNotification();

  // Initialize search criteria from URL parameters
  const initialCriteria = useMemo((): PatientSearchCriteria => {
    const params = Object.fromEntries(searchParams.entries());
    return {
      name: params.name || '',
      givenName: params.givenName || '',
      middleName: params.middleName || '',
      familyName: params.familyName || '',
      gender: (params.gender as 'M' | 'F' | 'O') || undefined,
      age: params.age ? parseInt(params.age, 10) : undefined,
      birthdate: params.birthdate || '',
      identifier: params.identifier || '',
    };
  }, [searchParams]);

  // Search state management
  const [searchCriteria, setSearchCriteria] = useState<PatientSearchCriteria>(initialCriteria);
  const [hasSearched, setHasSearched] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Patient search hook integration
  const {
    searchPatients,
    results,
    totalCount,
    isLoading,
    error,
    clearSearch,
    hasMore,
    loadMore,
  } = usePatientSearch();

  // Local pagination state (since hook doesn't provide it)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Set document title and meta tags
  useEffect(() => {
    document.title = `${t('search.form.label')} - ${t('common.appName')}`;

    // Add meta description for SEO
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', t('search.form.label'));
    }
  }, [t]);

  // Handle URL parameter changes
  useEffect(() => {
    if (isInitialLoad) {
      // Check if there are search parameters on initial load
      const hasParams = searchParams.size > 0;
      if (hasParams) {
        // Automatically search if URL has parameters
        handleSearch(initialCriteria);
      }
      setIsInitialLoad(false);
    }
  }, [initialCriteria, searchParams, isInitialLoad]);

  // Update URL parameters when search criteria changes
  const updateURLParams = useCallback(
    (criteria: PatientSearchCriteria) => {
      const params = new URLSearchParams();

      // Add non-empty criteria to URL
      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.set(key, value.toString());
        }
      });

      // Update URL without triggering navigation
      setSearchParams(params, { replace: true });
    },
    [setSearchParams],
  );

  /**
   * Handle search form submission
   */
  const handleSearch = useCallback(
    async (criteria: PatientSearchCriteria) => {
      try {
        setSearchCriteria(criteria);
        setHasSearched(true);

        // Update URL parameters for deep linking
        updateURLParams(criteria);

        // Perform search
        await searchPatients(criteria);

        // Reset to first page on new search
        setCurrentPage(1);

      } catch (searchError) {
        addNotification({
          title: t('common.error'),
          message: t('search.results.error'),
          type: 'error',
        });
      }
    },
    [searchPatients, updateURLParams, setCurrentPage, addNotification, t],
  );

  /**
   * Handle clearing search results
   */
  const handleClearSearch = useCallback(() => {
    setSearchCriteria({
      name: '',
      givenName: '',
      middleName: '',
      familyName: '',
      gender: undefined,
      age: undefined,
      birthdate: '',
      identifier: '',
    });
    setHasSearched(false);
    clearSearch();

    // Clear URL parameters
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [clearSearch, setSearchParams]);

  /**
   * Handle patient selection
   */
  const handlePatientSelect = useCallback(
    (patient: PatientSearchResult) => {
      // Navigate to patient clinical page
      navigate(`/clinical/${patient.uuid}`);
    },
    [navigate],
  );

  /**
   * Handle "Create New Patient" action
   */
  const handleCreateNewPatient = useCallback(() => {
    navigate('/registration/patient/new');
  }, [navigate]);

  /**
   * Handle pagination changes
   */
  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);

      // Scroll to top of results
      const resultsSection = document.querySelector('.patient-search-page__results');
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth' });
      }
    },
    [setCurrentPage],
  );

  /**
   * Handle page size changes
   */
  const handlePageSizeChange = useCallback(
    (size: number) => {
      setPageSize(size);
      setCurrentPage(1); // Reset to first page
    },
    [setPageSize, setCurrentPage],
  );

  // Determine if we should show results
  const shouldShowResults = hasSearched || results.length > 0;
  const shouldShowEmptyState = hasSearched && results.length === 0 && !isLoading;

  return (
    <div className="patient-search-page">
      {/* Breadcrumb Navigation */}
      <nav
        className="patient-search-page__breadcrumbs"
        aria-label={t('common.breadcrumbNavigation')}
      >
        <Breadcrumb>
          <BreadcrumbItem>
            <a href="/registration/search">{t('registration.title')}</a>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            {t('search.form.label')}
          </BreadcrumbItem>
        </Breadcrumb>
      </nav>

      {/* Main Content Grid */}
      <div className="patient-search-page__content">
        <Grid className="patient-search-page__grid">
          {/* Header Section */}
          <Column span={16} className="patient-search-page__header">
            <Layer>
              <div className="patient-search-page__header-content">
                <div className="patient-search-page__title-section">
                  <h1 className="patient-search-page__title">
                    {t('search.form.label')}
                  </h1>
                  <p className="patient-search-page__description">
                    {t('search.form.description', 'Search for existing patients or create new patient records')}
                  </p>
                </div>

                <div className="patient-search-page__actions">
                  <Button
                    kind="primary"
                    renderIcon={Add}
                    onClick={handleCreateNewPatient}
                    size="md"
                  >
                    {t('search.results.createNew')}
                  </Button>
                </div>
              </div>
            </Layer>
          </Column>

          {/* Search Form Section */}
          <Column span={16} className="patient-search-page__search-section">
            <Layer>
              <div className="patient-search-page__search-form">
                <PatientSearchForm
                  initialCriteria={searchCriteria}
                  onSearch={handleSearch}
                  onClear={handleClearSearch}
                  isLoading={isLoading}
                />
              </div>
            </Layer>
          </Column>

          {/* Results Section */}
          {shouldShowResults && (
            <Column span={16} className="patient-search-page__results">
              <Layer>
                <div className="patient-search-page__results-content">
                  {/* Loading State */}
                  {isLoading && (
                    <div className="patient-search-page__loading">
                      <InlineLoading
                        status="active"
                        description={t('search.results.searching')}
                      />
                    </div>
                  )}

                  {/* Error State */}
                  {error && (
                    <div className="patient-search-page__error">
                      <div className="patient-search-page__error-content">
                        <h3>{t('common.error')}</h3>
                        <p>{error}</p>
                        <Button
                          kind="secondary"
                          onClick={() => handleSearch(searchCriteria)}
                        >
                          {t('search.results.retry')}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Search Results */}
                  {!isLoading && !error && (
                    <PatientSearchResults
                      patients={results}
                      totalResults={totalCount}
                      totalPages={Math.ceil(totalCount / pageSize)}
                      currentPage={currentPage}
                      pageSize={pageSize}
                      onPatientSelect={handlePatientSelect}
                      onPageChange={handlePageChange}
                      onPageSizeChange={handlePageSizeChange}
                      isLoading={isLoading}
                    />
                  )}

                  {/* Empty State */}
                  {shouldShowEmptyState && (
                    <div className="patient-search-page__empty-state">
                      <div className="patient-search-page__empty-content">
                        <h3>{t('search.results.empty.title')}</h3>
                        <p>{t('search.results.empty.suggestion')}</p>
                        <div className="patient-search-page__empty-actions">
                          <Button
                            kind="primary"
                            renderIcon={Add}
                            onClick={handleCreateNewPatient}
                          >
                            {t('search.results.createNew')}
                          </Button>
                          <Button
                            kind="secondary"
                            onClick={handleClearSearch}
                          >
                            {t('search.button.clear')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Layer>
            </Column>
          )}
        </Grid>
      </div>
    </div>
  );
});

PatientSearchPage.displayName = 'PatientSearchPage';

export default PatientSearchPage;
