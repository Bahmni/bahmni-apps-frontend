import { ComboBox } from '@bahmni/design-system';
import { type PatientSearchResult, useTranslation } from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import usePatientSearch from '../../hooks/usePatientSearch';
import { useClinicalConfig } from '../../providers/clinicalConfig';
import type { PatientSearchDisplayField } from '../../providers/clinicalConfig/models';
import styles from './styles/PatientSearch.module.scss';

interface PatientSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

type PatientSearchItem =
  | PatientSearchResult
  | { display: string; disabled: true };

const DEFAULT_DISPLAY_FIELDS: PatientSearchDisplayField[] = [
  { field: 'name', bold: true },
  { field: 'identifier' },
];

const formatPatientName = (patient: PatientSearchResult): string =>
  [patient.givenName, patient.middleName, patient.familyName]
    .filter(Boolean)
    .join(' ');

const getFieldValue = (
  patient: PatientSearchResult,
  field: PatientSearchDisplayField['field'],
): string | null => {
  switch (field) {
    case 'name':
      return formatPatientName(patient);
    case 'identifier':
      return patient.identifier;
    case 'gender':
      return patient.gender;
    case 'age':
      return patient.age;
    default:
      return null;
  }
};

const isPatientResult = (
  item: PatientSearchItem,
): item is PatientSearchResult => 'uuid' in item;

// Server-side search; disable client-side filtering
const alwaysTrue = () => true;

const PatientSearch: React.FC<PatientSearchProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { clinicalConfig } = useClinicalConfig();
  const containerRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [submittedTerm, setSubmittedTerm] = useState('');

  const displayFields =
    clinicalConfig?.patientSearch?.displayFields ?? DEFAULT_DISPLAY_FIELDS;

  const { results, isLoading, isError, error } =
    usePatientSearch(submittedTerm);

  const comboBoxItems: PatientSearchItem[] = useMemo(() => {
    if (!submittedTerm.trim()) return [];

    if (isLoading) {
      return [{ display: t('SEARCHING'), disabled: true as const }];
    }

    if (isError) {
      return [
        {
          display: error?.message ?? t('ERROR_DEFAULT_TITLE'),
          disabled: true as const,
        },
      ];
    }

    if (results.length === 0) {
      return [{ display: t('NO_MATCHING_RECORDS'), disabled: true as const }];
    }

    return results;
  }, [submittedTerm, isLoading, isError, error, results, t]);

  const renderDropdownItem = useMemo(
    () =>
      function PatientSearchItem(item: PatientSearchItem) {
        if (!isPatientResult(item)) {
          return <span className={styles.resultField}>{item.display}</span>;
        }
        return (
          <div className={styles.resultItem}>
            {displayFields.map(({ field, bold }) => {
              const value = getFieldValue(item, field);
              if (!value) return null;
              return (
                <span
                  key={field}
                  className={bold ? styles.resultFieldBold : styles.resultField}
                >
                  {value}
                </span>
              );
            })}
          </div>
        );
      },
    [displayFields],
  );

  // Reset state when closed; auto-focus input when opened
  useEffect(() => {
    if (!isOpen) {
      setInputValue('');
      setSubmittedTerm('');
      return;
    }
    const input = containerRef.current?.querySelector('input');
    if (input) input.focus();
  }, [isOpen]);

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

  // Keyboard handler: Escape closes the panel, Enter submits search
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (submittedTerm) {
          // First Escape: dismiss dropdown, keep input text, refocus
          event.stopPropagation();
          setSubmittedTerm('');
          const input =
            containerRef.current?.querySelector<HTMLInputElement>('input');
          if (input) {
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
          }
        } else {
          onClose();
        }
        return;
      }
      if (
        event.key === 'Enter' &&
        inputValue.trim() &&
        inputValue.trim() !== submittedTerm
      ) {
        // Stop Carbon's ComboBox from processing this Enter (which would
        // trigger auto-selection via indexToHighlight when results arrive).
        event.stopPropagation();
        setSubmittedTerm(inputValue.trim());
      }
    };

    const container = containerRef.current;
    if (!container) return;

    // Use capture phase so our handler fires before Carbon's internal handler
    // can stop propagation on Enter/Escape.
    container.addEventListener('keydown', handleKeyDown, true);
    return () => container.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose, inputValue, submittedTerm]);

  useEffect(() => {
    if (isError && submittedTerm) {
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: error?.message ?? '',
        type: 'error',
      });
    }
  }, [isError, submittedTerm, addNotification, t, error]);

  if (!isOpen) return null;

  const handleChange = (selectedItem: PatientSearchItem | null | undefined) => {
    if (!selectedItem || !isPatientResult(selectedItem)) return;
    navigate(`../${selectedItem.uuid}`);
    onClose();
  };

  return (
    <div
      ref={containerRef}
      className={styles.patientSearchContainer}
      data-testid="patient-search-container"
    >
      <ComboBox
        id="patient-search-combobox"
        data-testid="patient-search-combobox"
        placeholder={t('SEARCH_PATIENT_ID_PLACEHOLDER')}
        items={comboBoxItems}
        itemToString={(item) => {
          if (!item) return '';
          return isPatientResult(item)
            ? `${formatPatientName(item)} (${item.identifier})`
            : item.display;
        }}
        itemToElement={renderDropdownItem}
        onChange={({ selectedItem }) => handleChange(selectedItem)}
        onInputChange={(input) => {
          setInputValue(input);
          if (!input.trim()) {
            setSubmittedTerm('');
          }
        }}
        selectedItem={null}
        shouldFilterItem={alwaysTrue}
        autoAlign
        aria-label={t('SEARCH_PATIENT_ID_PLACEHOLDER')}
        size="md"
        className={styles.searchInput}
      />
    </div>
  );
};

export default PatientSearch;
