import { Button, Dropdown, Search, Tag } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import styles from '../styles/SearchPatient.module.scss';

interface SearchPatientInputProps {
  buttonTitle: string;
  searchBarPlaceholder: string;
  isLoading: boolean;
  searchInput: string;
  advanceSearchInput: string;
  validationError: string;
  dropdownItems: string[];
  selectedDropdownItem: string;
  onNameChange: (value: string) => void;
  onAdvanceChange: (value: string) => void;
  onNameSearch: () => void;
  onAdvanceSearch: () => void;
  onNameClear: () => void;
  onAdvanceClear: () => void;
  onDropdownChange: (item: string) => void;
}

const SearchPatientInput = ({
  buttonTitle,
  searchBarPlaceholder,
  isLoading,
  searchInput,
  advanceSearchInput,
  validationError,
  dropdownItems,
  selectedDropdownItem,
  onNameChange,
  onAdvanceChange,
  onNameSearch,
  onAdvanceSearch,
  onNameClear,
  onAdvanceClear,
  onDropdownChange,
}: SearchPatientInputProps) => {
  const { t } = useTranslation();

  return (
    <div
      id="search-patient-tile"
      data-testid="search-patient-tile"
      className={styles.searchPatientContainer}
    >
      <div
        id="search-patient-input"
        className={styles.searchPatient}
        data-testid="search-patient-input"
      >
        <Search
          id="search-patient-searchbar"
          testId="search-patient-searchbar"
          placeholder={searchBarPlaceholder}
          labelText="Search"
          value={searchInput}
          onChange={(e) => onNameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.code === 'Enter') {
              onNameSearch();
            }
          }}
          onClear={onNameClear}
        />
        <Button
          id="search-patient-search-button"
          testId="search-patient-search-button"
          size="md"
          onClick={onNameSearch}
          disabled={isLoading || searchInput.trim().length === 0}
          className={styles.searchButton}
        >
          {buttonTitle}
        </Button>
      </div>

      <div className={styles.orDivider}>
        <Tag type="cool-gray">{t('OR')}</Tag>
      </div>

      <div className={styles.searchPatient}>
        <div className={styles.advanceSearchContainer}>
          <div className={styles.advanceInputWrapper}>
            <Search
              id="advance-search-input"
              testId="advance-search-input"
              labelText="Advance Search"
              placeholder={t('SEARCH_BY_CUSTOM_ATTRIBUTE', {
                attribute: String(selectedDropdownItem),
              })}
              value={advanceSearchInput}
              onChange={(e) => onAdvanceChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.code === 'Enter') {
                  onAdvanceSearch();
                }
              }}
              onClear={onAdvanceClear}
              inputMode="numeric"
            />
            {validationError && (
              <div
                className={styles.errorMessage}
                data-testid="field-validation-error"
              >
                {validationError}
              </div>
            )}
          </div>
          <Dropdown
            id="search-type-dropdown"
            testId="search-type-dropdown"
            titleText=""
            label={selectedDropdownItem}
            className={styles.searchTypeDropdown}
            size="md"
            items={dropdownItems}
            selectedItem={selectedDropdownItem}
            onChange={(event) => onDropdownChange(event.selectedItem ?? '')}
            aria-label={t('PATIENT_SEARCH_ATTRIBUTE_SELECTOR')}
          />
        </div>
        <Button
          size="md"
          id="advance-search-button"
          testId="advance-search-button"
          disabled={isLoading || advanceSearchInput.trim().length === 0}
          className={styles.searchButton}
          onClick={onAdvanceSearch}
        >
          {buttonTitle}
        </Button>
      </div>
    </div>
  );
};

export default SearchPatientInput;
