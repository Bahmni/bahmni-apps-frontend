import { Loading, Search } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import usePatientSearch from '../../hooks/usePatientSearch';
import styles from './styles/PatientSearch.module.scss';

interface PatientSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const LISTBOX_ID = 'patient-search-listbox';

const PatientSearch: React.FC<PatientSearchProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const containerRef = useRef<HTMLDivElement>(null);

  const [inputValue, setInputValue] = useState('');
  const [submittedTerm, setSubmittedTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const { results, isLoading, isError, error } =
    usePatientSearch(submittedTerm);

  const showDropdown =
    submittedTerm.trim().length > 0 &&
    inputValue === submittedTerm &&
    !isLoading &&
    !isError;

  // Reset state when the search panel is closed
  useEffect(() => {
    if (!isOpen) {
      setInputValue('');
      setSubmittedTerm('');
      setFocusedIndex(-1);
    }
  }, [isOpen]);

  // Reset focused index when results change
  useEffect(() => {
    setFocusedIndex(-1);
  }, [results]);

  // Click-outside handler to close the search panel
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Keyboard handler: Escape closes the panel
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isError && submittedTerm) {
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: error?.message,
        type: 'error',
      });
    }
  }, [isError, submittedTerm, addNotification, t, error]);

  if (!isOpen) return null;

  const handleResultClick = (resultUuid: string) => {
    navigate(`../${resultUuid}`);
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      if (focusedIndex >= 0 && showDropdown && results[focusedIndex]) {
        handleResultClick(results[focusedIndex].uuid);
        return;
      }
      if (inputValue.trim()) {
        setSubmittedTerm(inputValue.trim());
        setFocusedIndex(-1);
      }
      return;
    }

    if (!showDropdown || results.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setFocusedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setFocusedIndex((prev) => Math.max(prev - 1, -1));
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
    setSubmittedTerm('');
  };

  const handleClear = () => {
    setInputValue('');
    setSubmittedTerm('');
    setFocusedIndex(-1);
  };

  const activedescendant =
    focusedIndex >= 0
      ? `patient-search-result-${results[focusedIndex]?.uuid}`
      : undefined;

  return (
    <div
      ref={containerRef}
      className={styles.patientSearchContainer}
      data-testid="patient-search-container"
    >
      <Search
        id="patient-search-input"
        testId="patient-search-input"
        labelText={t('SEARCH_PATIENT_ID_PLACEHOLDER')}
        placeholder={t('SEARCH_PATIENT_ID_PLACEHOLDER')}
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onClear={handleClear}
        autoFocus
        size="md"
        className={styles.searchInput}
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={LISTBOX_ID}
        aria-activedescendant={activedescendant}
      />
      {isLoading && submittedTerm && (
        <div
          className={styles.resultsDropdown}
          data-testid="patient-search-loading"
        >
          <Loading description={t('SEARCHING')} role="status" small />
        </div>
      )}
      {showDropdown && (
        <div
          id={LISTBOX_ID}
          className={styles.resultsDropdown}
          data-testid="patient-search-results"
          role="listbox"
          aria-label={t('SEARCH_PATIENT_ID_PLACEHOLDER')}
        >
          {results.length === 0 ? (
            <div
              className={styles.noResults}
              data-testid="patient-search-no-results"
              role="option"
              aria-selected={false}
            >
              {t('NO_MATCHING_RECORDS')}
            </div>
          ) : (
            results.map((result, index) => (
              <div
                key={result.uuid}
                id={`patient-search-result-${result.uuid}`}
                className={styles.resultItem}
                data-testid={`patient-search-result-${result.uuid}`}
                role="option"
                aria-selected={index === focusedIndex}
                onClick={() => handleResultClick(result.uuid)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleResultClick(result.uuid);
                  }
                }}
                tabIndex={0}
              >
                <span
                  className={styles.patientName}
                  data-testid="patient-search-result-name"
                >
                  {[result.givenName, result.middleName, result.familyName]
                    .filter(Boolean)
                    .join(' ')}
                </span>
                <span
                  className={styles.patientIdentifier}
                  data-testid="patient-search-result-identifier"
                >
                  {result.identifier}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default PatientSearch;
