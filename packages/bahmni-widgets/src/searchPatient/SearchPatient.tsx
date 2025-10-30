import {
  Search,
  Button,
  Dropdown,
  Tag,
} from '@bahmni-frontend/bahmni-design-system';
import {
  searchPatientByNameOrId,
  searchPatientByCustomAttribute,
  PatientSearchResultBundle,
  useTranslation,
  getRegistrationConfig,
  PatientSearchField,
  searchAppointmentsByAttribute,
} from '@bahmni-frontend/bahmni-services';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  Appointment,
  AppointmentSearchResult,
  Reason,
} from '../../../bahmni-services/src/appointmentService/models';
import {
  calculateAgeinYearsAndMonths,
  formatDateAndTime,
} from '../../../bahmni-services/src/date/date';
import { useNotification } from '../notification';
import styles from './styles/SearchPatient.module.scss';

interface SearchPatientProps {
  buttonTitle: string;
  searchBarPlaceholder: string;
  onSearch: (
    data: PatientSearchResultBundle | undefined,
    searchTerm: string,
    isLoading: boolean,
    isError: boolean,
    isAdvancedSearch: boolean,
  ) => void;
}

const SearchPatient: React.FC<SearchPatientProps> = ({
  buttonTitle,
  searchBarPlaceholder,
  onSearch,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [advanceSearchInput, setAdvanceSearchInput] = useState('');
  const [phoneInputError, setPhoneInputError] = useState('');
  const { addNotification } = useNotification();
  const { t } = useTranslation();
  const [isAdvancedSearch, setIsAdvancedSearch] = useState<boolean>(false);
  const [dropdownItems, setDropdownItems] = useState<string[]>([]);
  const [selectedDropdownItem, setSelectedDropdownItem] = useState<string>('');
  const [searchFields, setSearchFields] = useState<PatientSearchField[]>([]);

  const {
    data: configData,
    isError: configIsError,
    error: configError,
  } = useQuery({
    queryKey: ['registrationConfig'],
    queryFn: () => getRegistrationConfig(),
    staleTime: 0,
    gcTime: 0,
  });
  const getSearchQuery = () => {
    const selectedField = searchFields.find(
      (field) => t(field.translationKey) === selectedDropdownItem,
    );
    const fieldType = isAdvancedSearch ? (selectedField?.type ?? '') : '';

    return fieldType === 'appointment'
      ? getAppointmentSearchQuery()
      : getPatientSearchQuery();
  };

  const getPatientSearchQuery = async () => {
    if (isAdvancedSearch) {
      const selectedField = searchFields.find(
        (field) => t(field.translationKey) === selectedDropdownItem,
      );
      const fieldType = selectedField?.type ?? '';
      const fieldsToSearch = selectedField ? selectedField.fields : [];

      const rawResults = await searchPatientByCustomAttribute(
        encodeURI(searchTerm),
        fieldType,
        fieldsToSearch,
        searchFields,
        t,
      );
      return formatPatientDob(rawResults);
    } else {
      const rawResults = await searchPatientByNameOrId(encodeURI(searchTerm));
      return formatPatientDob(rawResults);
    }
  };
  const getAppointmentSearchQuery = async () => {
    const selectedField = searchFields.find(
      (field) => t(field.translationKey) === selectedDropdownItem,
    );
    const fieldsToSearch = selectedField ? selectedField.fields : [];
    const requestBody: Record<string, string> = {};
    if (fieldsToSearch.length > 0) {
      requestBody[fieldsToSearch[0]] = searchTerm.trim();
    }
    const formattedRequest = formatAppointmentSearchRequest(requestBody);
    const rawResults = searchAppointmentsByAttribute(
      formattedRequest,
      fieldsToSearch,
    );
    return transformAppointmentsToPatientBundle(await rawResults);
  };
  const formatAppointmentSearchRequest = (
    requestBody: Record<string, string>,
  ): Record<string, string> => {
    const oneYearFromToday = new Date();
    oneYearFromToday.setFullYear(oneYearFromToday.getFullYear() - 1);
    oneYearFromToday.setHours(23, 59, 59, 999);
    requestBody.startDate = oneYearFromToday.toISOString();
    return requestBody;
  };
  const transformAppointmentsToPatientBundle = (
    appointmentsData: Appointment[],
  ): { totalCount: number; pageOfResults: AppointmentSearchResult[] } => {
    return {
      pageOfResults: appointmentsData.map(
        (appt: Appointment): AppointmentSearchResult => ({
          uuid: appt.patient.uuid,
          identifier: appt.patient.identifier,
          givenName: appt.patient.name,
          middleName: '',
          familyName: '',
          gender: appt.patient.gender,
          birthDate: formatDateAndTime(appt.patient.birthDate, false),
          age: calculateAgeinYearsAndMonths(appt.patient.birthDate),
          extraIdentifiers: null,
          personId: 0,
          deathDate: null,
          addressFieldValue: null,
          patientProgramAttributeValue: null,
          dateCreated: new Date(appt.dateCreated),
          activeVisitUuid: '',
          customAttribute: '',
          hasBeenAdmitted: false,

          // appointment-specific fields
          appointmentNumber: appt.appointmentNumber,
          appointmentDate: formatDateAndTime(appt.startDateTime, true),
          appointmentReason: getAppointmentReasons(appt),
          appointmentStatus: appt.status,
        }),
      ),
      totalCount: appointmentsData.length,
    };
  };

  const getAppointmentReasons = (appt: Appointment) => {
    if (Array.isArray(appt?.reasons) && appt.reasons.length > 0) {
      // join all reason names with commas
      return appt.reasons
        .map((reason: Reason) => reason?.name)
        .filter(Boolean)
        .join(', ');
    }
    return '';
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
    const selectedField = searchFields.find(
      (field) => t(field.translationKey) === selectedDropdownItem,
    );
    return (
      selectedField?.fields.some(
        (fieldName) =>
          fieldName === 'phoneNumber' || fieldName === 'alternatePhoneNumber',
      ) ?? false
    );
  };

  const handleChange = (inputValue: string, type: 'name' | 'advance') => {
    if (type === 'advance') {
      if (isPhoneSearch()) {
        setAdvanceSearchInput(inputValue);
        setSearchInput('');
        const hasPlusAtStart = inputValue.length > 0 && inputValue[0] === '+';
        const numericValue = inputValue.replace(/[^0-9]/g, '');
        const formattedValue = hasPlusAtStart
          ? '+' + numericValue
          : numericValue;
        setPhoneInputError(
          phoneInputError && inputValue !== formattedValue
            ? t('PHONE_NUMBER_VALIDATION_ERROR')
            : '',
        );
      } else {
        setPhoneInputError('');
        setAdvanceSearchInput(inputValue);
        setSearchInput('');
      }
    } else {
      setPhoneInputError('');
      setAdvanceSearchInput('');
      setSearchInput(inputValue);
    }
  };
  const formatPatientDob: (
    searchResultsBundle: PatientSearchResultBundle,
  ) => PatientSearchResultBundle = (searchResultsBundle) => {
    return {
      ...searchResultsBundle,
      pageOfResults: searchResultsBundle.pageOfResults.map((patient) => ({
        ...patient,
        birthDate: patient.birthDate
          ? formatDateAndTime(new Date(patient.birthDate).getTime(), false)
          : patient.birthDate,
        age: patient.birthDate
          ? calculateAgeinYearsAndMonths(new Date(patient.birthDate).getTime())
          : patient.age,
      })),
    };
  };

  const handleClick = (type: 'name' | 'advance') => {
    const inputValue = type === 'advance' ? advanceSearchInput : searchInput;
    if (!inputValue.trim()) return;

    const trimmedValue = inputValue.trim();

    if (type === 'advance') {
      if (isPhoneSearch()) {
        const hasPlusAtStart = inputValue.length > 0 && inputValue[0] === '+';
        const numericValue = inputValue.replace(/[^0-9]/g, '');
        const formattedValue = hasPlusAtStart
          ? '+' + numericValue
          : numericValue;

        const hasInvalidChars =
          inputValue !== formattedValue && inputValue.length > 0;

        if (hasInvalidChars) {
          setPhoneInputError(t('PHONE_NUMBER_VALIDATION_ERROR'));
          return;
        } else {
          setPhoneInputError('');
          setSearchTerm(formattedValue);
          setAdvanceSearchInput(trimmedValue);
        }
      } else {
        setPhoneInputError('');
        setAdvanceSearchInput(trimmedValue);
        setSearchTerm(trimmedValue);
      }
    } else {
      setSearchInput(trimmedValue);
      setSearchTerm(trimmedValue);
    }

    setIsAdvancedSearch(type === 'advance');
  };

  const handleOnClear = (type: 'name' | 'advance') => {
    if (type === 'advance') {
      setAdvanceSearchInput('');
      setPhoneInputError('');
    } else {
      setSearchInput('');
    }
    setSearchTerm('');
  };

  useEffect(() => {
    if (configIsError) {
      addNotification({
        title: t('CONFIG_ERROR_SCHEMA_VALIDATION_FAILED'),
        message:
          configError instanceof Error
            ? configError.message
            : String(configError),
        type: 'error',
      });
      setDropdownItems([]);
      setSelectedDropdownItem('');
    } else if (configData?.patientSearch?.customAttributes) {
      const combinedFields = [
        ...(configData.patientSearch.customAttributes || []),
        ...(configData.patientSearch.appointment || []),
      ];
      setSearchFields(combinedFields);

      const labels = combinedFields.map((field: PatientSearchField) =>
        t(field.translationKey),
      );
      setDropdownItems(labels);
      setSelectedDropdownItem(labels[0] || '');
    } else if (configData && dropdownItems.length === 0) {
      addNotification({
        title: t('CONFIG_ERROR_NOT_FOUND'),
        message: 'No patient search configuration found',
        type: 'error',
      });
      setDropdownItems([]);
      setSelectedDropdownItem('');
    }
  }, [configData, configIsError, configError, addNotification, t]);

  useEffect(() => {
    if (isError && searchTerm) {
      onSearch(data, searchTerm, isLoading, isError, isAdvancedSearch);
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: error instanceof Error ? error.message : String(error),
        type: 'error',
      });
    }
    if (searchTerm)
      onSearch(data, searchTerm, isLoading, isError, isAdvancedSearch);
  }, [
    searchTerm,
    isLoading,
    isError,
    onSearch,
    data,
    isAdvancedSearch,
    selectedDropdownItem,
    searchFields,
    addNotification,
    t,
    error,
  ]);

  return (
    <div
      data-testid="search-patient-tile"
      id="search-patient-tile"
      className={styles.searchPatientContainer}
    >
      <div
        className={styles.searchPatient}
        data-testid="search-patient-input"
        id="search-patient-input"
      >
        <Search
          id="search-patient-searchbar"
          testId="search-patient-searchbar"
          placeholder={searchBarPlaceholder}
          labelText="Search"
          value={searchInput}
          onChange={(e) => handleChange(e.target.value, 'name')}
          onKeyDown={(e) => {
            if (e.code === 'Enter') {
              handleClick('name');
            }
          }}
          onClear={() => handleOnClear('name')}
        />
        <Button
          id="search-patient-search-button"
          testId="search-patient-search-button"
          size="md"
          onClick={() => handleClick('name')}
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
              onChange={(e) => handleChange(e.target.value, 'advance')}
              onKeyDown={(e) => {
                if (e.code === 'Enter') {
                  handleClick('advance');
                }
              }}
              onClear={() => handleOnClear('advance')}
              inputMode="numeric"
            />
            {phoneInputError && (
              <div
                className={styles.errorMessage}
                data-testid="phone-validation-error"
              >
                {phoneInputError}
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
            onChange={(event) => {
              setSelectedDropdownItem(event.selectedItem ?? '');
              setAdvanceSearchInput('');
              setSearchInput('');
              setSearchTerm('');
              setPhoneInputError('');
            }}
            aria-label={t('PATIENT_SEARCH_ATTRIBUTE_SELECTOR')}
          />
        </div>
        <Button
          size="md"
          id="advance-search-button"
          testId="advance-search-button"
          disabled={isLoading || advanceSearchInput.trim().length === 0}
          className={styles.searchButton}
          onClick={() => handleClick('advance')}
        >
          {buttonTitle}
        </Button>
      </div>
    </div>
  );
};
export default SearchPatient;
