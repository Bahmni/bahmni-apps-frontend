import React from 'react';
import { ComboBox, Tile, InlineNotification } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import * as styles from './styles/DiagnosesForm.module.scss';
import SelectedItem from '@components/common/selectedItem/SelectedItem';
import BoxWHeader from '@components/common/boxWHeader/BoxWHeader';
import { ConceptSearch } from '@/types/concepts';
import SelectedDiagnosisItem, {
  SelectedDiagnosisItemProps,
} from './SelectedDiagnosisItem';

/**
 * DiagnosesForm component props
 * @interface DiagnosesFormProps
 * @property {function} handleResultSelection - Function to call when a diagnosis is selected
 * @property {function} handleSearch - Function to call when search term changes
 * @property {boolean} isSearchLoading - Whether search is in progress
 * @property {ConceptSearch[]} searchResults - Available search results
 * @property {ConceptSearch | null} selectedItem - Currently selected search item
 * @property {Error[] | null} errors - Any errors to display
 * @property {SelectedDiagnosisItemProps[]} selectedDiagnoses - List of selected diagnoses
 * @property {function} handleRemoveDiagnosis - Function to call when a diagnosis is removed
 */
interface DiagnosesFormProps {
  handleResultSelection: (
    selectedItem: ConceptSearch | null | undefined,
  ) => void;
  handleSearch: (searchTerm: string) => void;
  isSearchLoading: boolean;
  searchResults: ConceptSearch[];
  selectedItem: ConceptSearch | null;
  errors: Error[] | null;
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
  ({
    handleResultSelection,
    handleSearch,
    searchResults,
    isSearchLoading,
    selectedItem,
    errors,
    selectedDiagnoses,
    handleRemoveDiagnosis,
  }) => {
    const { t } = useTranslation();

    return (
      <Tile className={styles.diagnosesFormTile}>
        <div className={styles.diagnosesFormTitle}>
          {t('DIAGNOSES_FORM_TITLE')}
        </div>
        <ComboBox
          id="diagnoses-search"
          placeholder={t('DIAGNOSES_SEARCH_PLACEHOLDER')}
          items={searchResults}
          itemToString={(item) => (item ? item.conceptName : '')}
          shouldFilterItem={() => true}
          onChange={(data) => {
            handleResultSelection(data.selectedItem);
          }}
          onInputChange={(searchQuery: string) => handleSearch(searchQuery)}
          selectedItem={selectedItem}
          size="lg"
          disabled={isSearchLoading}
          autoAlign
          aria-label={t('DIAGNOSES_SEARCH_ARIA_LABEL')}
        />
        {errors &&
          errors.length > 0 &&
          errors.map((error, index) => (
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
