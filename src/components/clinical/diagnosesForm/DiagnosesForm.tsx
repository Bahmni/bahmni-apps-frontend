import React, { useState, useEffect } from 'react';
import { ComboBox, Tile, InlineNotification } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import * as styles from './styles/DiagnosesForm.module.scss';
import SelectedItem from '@components/common/selectedItem/SelectedItem';
import BoxWHeader from '@components/common/boxWHeader/BoxWHeader';
import { ConceptSearch } from '@types/concepts';
import SelectedDiagnosisItem, {
  SelectedDiagnosisItemProps,
} from './SelectedDiagnosisItem';
import { useConceptSearch } from '@hooks/useConceptSearch';

/**
 * DiagnosesForm component props
 * @interface DiagnosesFormProps
 * @property {function} handleResultSelection - Function to call when a diagnosis is selected
 * @property {SelectedDiagnosisItemProps[]} selectedDiagnoses - List of selected diagnoses
 * @property {function} handleRemoveDiagnosis - Function to call when a diagnosis is removed
 */
interface DiagnosesFormProps {
  handleResultSelection: (selectedItem: ConceptSearch) => void;
  selectedDiagnoses: SelectedDiagnosisItemProps[];
  handleRemoveDiagnosis: (index: number) => void;
}

/**
 * DiagnosesForm component
 *
 * A component that displays a search interface for diagnoses and a list of selected diagnoses.
 * It allows users to search for diagnoses, select them, and specify the certainty level.
 * @param {DiagnosesFormProps} props - Component props
 */
const DiagnosesForm: React.FC<DiagnosesFormProps> = React.memo(
  ({ handleResultSelection, selectedDiagnoses, handleRemoveDiagnosis }) => {
    const { t } = useTranslation();
    const [searchDiagnosesTerm, setSearchDiagnosesTerm] = useState('');
    const [diagnosisErrors, setDiagnosisErrors] = React.useState<Error[]>([]);

    // Use concept search hook for diagnoses
    const {
      searchResults,
      loading: isSearchLoading,
      error: searchError,
    } = useConceptSearch(searchDiagnosesTerm);

    // Handle search errors
    useEffect(() => {
      if (searchError) {
        setDiagnosisErrors([...diagnosisErrors, searchError]);
      }
    }, [searchError]);

    const handleSearch = (searchTerm: string) => {
      setSearchDiagnosesTerm(searchTerm);
      setDiagnosisErrors([]);
    };

    const handleOnChange = (selectedItem: ConceptSearch) => {
      if (
        !selectedItem ||
        !selectedItem.conceptUuid ||
        !selectedItem.conceptName
      ) {
        return;
      }

      const isDuplicate = selectedDiagnoses.some(
        (diagnosis) => diagnosis.id === selectedItem?.conceptUuid,
      );

      if (isDuplicate) {
        setDiagnosisErrors([new Error(t('DIAGNOSES_DUPLICATE_ERROR'))]);
        return;
      }

      handleResultSelection(selectedItem);
    };

    const isSearchEmpty =
      searchResults.length === 0 &&
      !isSearchLoading &&
      searchDiagnosesTerm.length > 2 &&
      !searchError;

    const selectedDiagnosisItems = isSearchLoading
      ? [
          {
            conceptName: t('LOADING_CONCEPTS'),
            conceptUuid: '',
            matchedName: '',
            disabled: true,
          },
        ]
      : isSearchEmpty
        ? [
            {
              conceptName: t('NO_MATCHING_CONCEPTS_FOUND'),
              conceptUuid: '',
              matchedName: '',
              disabled: true,
            },
          ]
        : searchResults;

    return (
      <Tile className={styles.diagnosesFormTile}>
        <div className={styles.diagnosesFormTitle}>
          {t('DIAGNOSES_FORM_TITLE')}
        </div>
        <ComboBox
          id="diagnoses-search"
          placeholder={t('DIAGNOSES_SEARCH_PLACEHOLDER')}
          items={selectedDiagnosisItems}
          itemToString={(item) => (item?.conceptName ? item.conceptName : '')}
          onChange={(data) => handleOnChange(data.selectedItem!)}
          onInputChange={(searchQuery: string) => handleSearch(searchQuery)}
          size="lg"
          autoAlign
          aria-label={t('DIAGNOSES_SEARCH_ARIA_LABEL')}
        />
        {diagnosisErrors &&
          diagnosisErrors.length > 0 &&
          diagnosisErrors.map((error, index) => (
            <InlineNotification
              key={`error-${index}-${error.message}`}
              kind="error"
              title={error.message}
              lowContrast
              className={styles.inlineErrorNotification}
              role="alert"
            />
          ))}
        {selectedDiagnoses && selectedDiagnoses.length > 0 && (
          <BoxWHeader
            title={t('DIAGNOSES_ADDED_DIAGNOSES')}
            className={styles.diagnosesBox}
          >
            {selectedDiagnoses.map((diagnosis, index) => (
              <SelectedItem
                key={`${diagnosis.title}-${index}`}
                className={styles.selectedDiagnosisItem}
                onClose={() => handleRemoveDiagnosis(index)}
              >
                <SelectedDiagnosisItem
                  id={`${diagnosis.id}-${index}`}
                  title={diagnosis.title}
                  certaintyConcepts={diagnosis.certaintyConcepts}
                  selectedCertainty={diagnosis.selectedCertainty}
                  handleCertaintyChange={diagnosis.handleCertaintyChange}
                />
              </SelectedItem>
            ))}
          </BoxWHeader>
        )}
      </Tile>
    );
  },
);

DiagnosesForm.displayName = 'DiagnosesForm';

export default DiagnosesForm;
