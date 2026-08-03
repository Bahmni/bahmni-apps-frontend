import {
  AppointmentSearchField,
  PatientSearchField,
  PatientSearchResultBundle,
  useTranslation,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNotification } from '../notification';
import PatientSearchResults from './PatientSearchResults';
import SearchPatientInput from './SearchPatientInput';
import { PatientSearchType, SearchContext } from './SearchStrategy.interface';
import searchStrategyRegistry from './strategies/SearchStrategyRegistry';

interface SearchPatientProps {
  buttonTitle: string;
  searchBarPlaceholder: string;
  patientSearch?: {
    patientDetailUrl?: string;
    customAttributes: PatientSearchField[];
    appointment: AppointmentSearchField[];
  };
}

const SearchPatient = ({
  buttonTitle,
  searchBarPlaceholder,
  patientSearch,
}: SearchPatientProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [advanceSearchInput, setAdvanceSearchInput] = useState('');
  const [validationError, setValidationError] = useState('');
  const { addNotification } = useNotification();
  const { t } = useTranslation();
  const [isAdvancedSearch, setIsAdvancedSearch] = useState<boolean>(false);
  const [dropdownItems, setDropdownItems] = useState<string[]>([]);
  const [selectedDropdownItem, setSelectedDropdownItem] = useState<string>('');
  const [searchFields, setSearchFields] = useState<PatientSearchField[]>([]);
  const [patientSearchData, setPatientSearchData] = useState<
    PatientSearchResultBundle | undefined
  >(undefined);

  const getSelectedField = () =>
    searchFields.find(
      (field) => t(field.translationKey) === selectedDropdownItem,
    );

  const getSearchType = (
    searchField?: PatientSearchField,
  ): PatientSearchType => {
    return isAdvancedSearch
      ? searchField?.type === 'appointment'
        ? 'appointment'
        : 'attributes'
      : 'nameOrId';
  };

  const getSearchQuery = async (): Promise<PatientSearchResultBundle> => {
    const selectedField = getSelectedField();
    const searchType: PatientSearchType = getSearchType(selectedField);
    const strategy = searchStrategyRegistry.getStrategy(searchType);

    const context: SearchContext = {
      selectedField,
      searchFields,
      translator: t,
    };

    if (strategy.validate) {
      const validation = strategy.validate(searchTerm, context);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
    }

    const formattedTerm = strategy.formatInput
      ? strategy.formatInput(searchTerm, context)
      : searchTerm;

    return await strategy.execute(formattedTerm, context);
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [
      'patientSearch',
      searchTerm,
      isAdvancedSearch,
      selectedDropdownItem,
    ],
    queryFn: getSearchQuery,
    enabled: !!searchTerm,
    staleTime: 0,
    gcTime: 0,
  });

  const isPhoneSearch = () => {
    const selectedField = getSelectedField();
    return (
      selectedField?.fields.some(
        (fieldName) =>
          fieldName === 'phoneNumber' || fieldName === 'alternatePhoneNumber',
      ) ?? false
    );
  };

  useEffect(() => {
    setPatientSearchData(data);
  }, [data]);

  useEffect(() => {
    if (isError && searchTerm) {
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: error instanceof Error ? error.message : String(error),
        type: 'error',
      });
    }
  }, [isError, searchTerm, error]);

  useEffect(() => {
    if (patientSearch?.customAttributes || patientSearch?.appointment) {
      const combinedFields = [
        ...(patientSearch.customAttributes ?? []),
        ...(patientSearch.appointment ?? []),
      ];
      setSearchFields(combinedFields);

      const labels = combinedFields.map((field: PatientSearchField) =>
        t(field.translationKey),
      );
      setDropdownItems(labels);
      setSelectedDropdownItem(labels[0] || '');
    } else if (patientSearch && dropdownItems.length === 0) {
      addNotification({
        title: t('CONFIG_ERROR_NOT_FOUND'),
        message: 'No patient search configuration found',
        type: 'error',
      });
      setDropdownItems([]);
      setSelectedDropdownItem('');
    }
  }, [patientSearch]);

  const handleNameChange = (inputValue: string) => {
    setValidationError('');
    setAdvanceSearchInput('');
    setSearchInput(inputValue);
  };

  const handleAdvanceChange = (inputValue: string) => {
    if (isPhoneSearch()) {
      setAdvanceSearchInput(inputValue);
      setSearchInput('');
      const hasPlusAtStart = inputValue.length > 0 && inputValue[0] === '+';
      const numericValue = inputValue.replace(/[^0-9]/g, '');
      const formattedValue = hasPlusAtStart ? '+' + numericValue : numericValue;
      setValidationError(
        validationError && inputValue !== formattedValue
          ? t('PHONE_NUMBER_VALIDATION_ERROR')
          : '',
      );
    } else {
      setValidationError('');
      setAdvanceSearchInput(inputValue);
      setSearchInput('');
    }
  };

  const handleNameSearch = () => {
    if (!searchInput.trim()) return;
    setSearchInput(searchInput.trim());
    setSearchTerm(searchInput.trim());
    setIsAdvancedSearch(false);
  };

  const handleAdvanceSearch = () => {
    if (!advanceSearchInput.trim()) return;
    const trimmedValue = advanceSearchInput.trim();

    if (isPhoneSearch()) {
      const hasPlusAtStart =
        advanceSearchInput.length > 0 && advanceSearchInput[0] === '+';
      const numericValue = advanceSearchInput.replace(/[^0-9]/g, '');
      const formattedValue = hasPlusAtStart ? '+' + numericValue : numericValue;
      const hasInvalidChars =
        advanceSearchInput !== formattedValue && advanceSearchInput.length > 0;

      if (hasInvalidChars) {
        setValidationError(t('PHONE_NUMBER_VALIDATION_ERROR'));
        return;
      }
      setValidationError('');
      setAdvanceSearchInput(trimmedValue);
      setSearchTerm(formattedValue);
    } else {
      setValidationError('');
      setAdvanceSearchInput(trimmedValue);
      setSearchTerm(trimmedValue);
    }
    setIsAdvancedSearch(true);
  };

  const handleNameClear = () => {
    setSearchInput('');
    setSearchTerm('');
  };

  const handleAdvanceClear = () => {
    setAdvanceSearchInput('');
    setValidationError('');
    setSearchTerm('');
  };

  const handleDropdownChange = (item: string) => {
    setSelectedDropdownItem(item);
    setAdvanceSearchInput('');
    setSearchInput('');
    setSearchTerm('');
    setValidationError('');
  };

  const selectedFieldType = getSelectedField()?.type ?? '';

  const resultsFieldType = isAdvancedSearch ? selectedFieldType : '';
  const resultsSearchFields =
    resultsFieldType === 'appointment'
      ? (patientSearch?.appointment ?? [])
      : (patientSearch?.customAttributes ?? []);

  return (
    <div>
      <SearchPatientInput
        buttonTitle={buttonTitle}
        searchBarPlaceholder={searchBarPlaceholder}
        isLoading={isLoading}
        searchInput={searchInput}
        advanceSearchInput={advanceSearchInput}
        validationError={validationError}
        dropdownItems={dropdownItems}
        selectedDropdownItem={selectedDropdownItem}
        onNameChange={handleNameChange}
        onAdvanceChange={handleAdvanceChange}
        onNameSearch={handleNameSearch}
        onAdvanceSearch={handleAdvanceSearch}
        onNameClear={handleNameClear}
        onAdvanceClear={handleAdvanceClear}
        onDropdownChange={handleDropdownChange}
      />
      {searchTerm && (
        <PatientSearchResults
          data={patientSearchData}
          searchTerm={searchTerm}
          isLoading={isLoading}
          isError={isError}
          isAdvancedSearch={isAdvancedSearch}
          searchFields={resultsSearchFields}
          selectedFieldType={resultsFieldType}
          patientDetailUrl={patientSearch?.patientDetailUrl}
          setData={setPatientSearchData}
        />
      )}
    </div>
  );
};

export default SearchPatient;
