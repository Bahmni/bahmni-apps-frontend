import {
  Button,
  TextInput,
  Dropdown,
  Checkbox,
  DatePicker,
  DatePickerInput,
  Tile,
  CheckboxGroup,
  BaseLayout,
} from '@bahmni-frontend/bahmni-design-system';
import {
  BAHMNI_HOME_PATH,
  useTranslation,
  createPatient,
  notificationService,
  getIdentifierData,
  getGenders,
  getAddressHierarchyEntries,
  type CreatePatientRequest,
  type PatientAttribute,
  type AddressHierarchyEntry,
  PatientAddress,
} from '@bahmni-frontend/bahmni-services';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header';
import { AgeUtils, formatToDisplay, formatToISO } from '../../utils/ageUtils';
import styles from './styles/index.module.scss';

const NewPatientRegistration = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [dobEstimated, setDobEstimated] = useState(false);

  // Fetch all identifier type data in a single optimized query
  const { data: identifierData } = useQuery({
    queryKey: ['identifierData'],
    queryFn: getIdentifierData,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const { data: gendersFromApi = [] } = useQuery({
    queryKey: ['genders'],
    queryFn: getGenders,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Map genders to their translated values
  const genders = useMemo(() => {
    return gendersFromApi.map((gender) => {
      const genderKey = `CREATE_PATIENT_GENDER_${gender.toUpperCase()}`;
      return t(genderKey);
    });
  }, [gendersFromApi, t]);

  const identifierPrefixes = useMemo(
    () => identifierData?.prefixes ?? [],
    [identifierData?.prefixes],
  );
  const identifierSources = useMemo(
    () => identifierData?.sourcesByPrefix,
    [identifierData?.sourcesByPrefix],
  );
  const primaryIdentifierType = useMemo(
    () => identifierData?.primaryIdentifierTypeUuid,
    [identifierData?.primaryIdentifierTypeUuid],
  );

  // Mutation for creating a patient
  const createPatientMutation = useMutation({
    mutationFn: createPatient,
    onSuccess: (response) => {
      notificationService.showSuccess(
        'Success',
        'Patient saved successfully',
        5000,
      );
      if (response?.patient?.uuid) {
        window.history.replaceState(
          {
            patientDisplay: response.patient.display,
            patientUuid: response.patient.uuid,
          },
          '',
          `/registration/patient/${response.patient.uuid}`,
        );
      } else {
        navigate('/registration/search');
      }
    },
    onError: () => {
      notificationService.showError('Error', 'Failed to save patient', 5000);
    },
  });

  const [formData, setFormData] = useState({
    patientIdFormat: '',
    entryType: false,
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    ageYears: '',
    ageMonths: '',
    ageDays: '',
    dateOfBirth: '',
    birthTime: '',
    houseNumber: '',
    locality: '',
    district: '',
    city: '',
    state: '',
    pincode: '',
    phoneNumber: '',
    altPhoneNumber: '',
    email: '',
  });

  const [nameErrors, setNameErrors] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
  });

  const [validationErrors, setValidationErrors] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
  });

  const [ageErrors, setAgeErrors] = useState({
    ageYears: '',
    ageMonths: '',
    ageDays: '',
  });

  const [dateErrors, setDateErrors] = useState({
    dateOfBirth: '',
  });

  // Address hierarchy state (only for district, state, and pincode)
  const [suggestions, setSuggestions] = useState({
    district: [] as AddressHierarchyEntry[],
    state: [] as AddressHierarchyEntry[],
    pincode: [] as AddressHierarchyEntry[],
  });

  const [showSuggestions, setShowSuggestions] = useState({
    district: false,
    state: false,
    pincode: false,
  });

  // Track if address fields were selected from dropdown
  const [addressSelectedFromDropdown, setAddressSelectedFromDropdown] =
    useState({
      district: false,
      state: false,
      pincode: false,
    });

  // Address validation errors
  const [addressErrors, setAddressErrors] = useState({
    district: '',
    state: '',
    pincode: '',
  });

  useEffect(() => {
    if (identifierPrefixes.length > 0 && !formData.patientIdFormat) {
      setFormData((prev) => ({
        ...prev,
        patientIdFormat: identifierPrefixes[0],
      }));
    }
  }, [identifierPrefixes, formData.patientIdFormat]);

  const handleInputChange = useCallback(
    (field: string, value: string | number | boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleNameChange = (field: string, value: string) => {
    const nameRegex = /^[a-zA-Z\s]*$/;
    if (nameRegex.test(value)) {
      handleInputChange(field, value);
      setNameErrors((prev) => ({ ...prev, [field]: '' }));
      setValidationErrors((prev) => ({ ...prev, [field]: '' }));
    } else {
      setNameErrors((prev) => ({
        ...prev,
        [field]: t('CREATE_PATIENT_VALIDATION_NAME_INVALID'),
      }));
    }
  };

  const handlePhoneChange = (field: string, value: string) => {
    const numericRegex = /^\+?[0-9]*$/;
    if (numericRegex.test(value)) {
      handleInputChange(field, value);
    }
  };

  // Helper function to clear all errors
  const clearAllErrors = useCallback(() => {
    setDateErrors({ dateOfBirth: '' });
    setValidationErrors((prev) => ({ ...prev, dateOfBirth: '' }));
    setAgeErrors({ ageYears: '', ageMonths: '', ageDays: '' });
  }, []);

  // Helper function to clear form age data
  const clearAgeData = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      dateOfBirth: '',
      ageYears: '',
      ageMonths: '',
      ageDays: '',
    }));
    setDobEstimated(false);
  }, []);

  // Helper function to update form with calculated age
  const updateFormWithAge = useCallback(
    (date: Date) => {
      const isoDate = formatToISO(date);
      const calculatedAge = AgeUtils.diffInYearsMonthsDays(date, new Date());

      setFormData((prev) => ({
        ...prev,
        dateOfBirth: isoDate,
        ageYears: String(calculatedAge.years ?? 0),
        ageMonths: String(calculatedAge.months ?? 0),
        ageDays: String(calculatedAge.days ?? 0),
      }));
      setDobEstimated(false);
      clearAllErrors();
    },
    [clearAllErrors],
  );

  const handleDateInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value.replace(/\D/g, '');
      const inputElement = e.target;

      if (input.length === 0) {
        inputElement.value = '';
        clearAgeData();
        setDateErrors({ dateOfBirth: '' });
        setValidationErrors((prev) => ({ ...prev, dateOfBirth: '' }));
        return;
      }

      // Format as DD/MM/YYYY while typing
      let formatted = '';
      if (input.length <= 2) {
        formatted = input;
      } else if (input.length <= 4) {
        formatted = `${input.slice(0, 2)}/${input.slice(2)}`;
      } else {
        formatted = `${input.slice(0, 2)}/${input.slice(2, 4)}/${input.slice(4, 8)}`;
      }

      inputElement.value = formatted;

      // If complete date (8 digits), parse and validate
      if (input.length === 8) {
        const day = parseInt(input.slice(0, 2), 10);
        const month = parseInt(input.slice(2, 4), 10);
        const year = parseInt(input.slice(4, 8), 10);

        // Check for invalid day or month ranges
        if (day < 1 || day > 31 || month < 1 || month > 12) {
          setDateErrors({ dateOfBirth: t('DATE_ERROR_INVALID_FORMAT') });
          clearAgeData();
          return;
        }

        const parsedDate = new Date(year, month - 1, day);

        // Check if date is valid (e.g., not 31st Feb)
        if (
          parsedDate.getDate() !== day ||
          parsedDate.getMonth() !== month - 1 ||
          parsedDate.getFullYear() !== year
        ) {
          setDateErrors({ dateOfBirth: t('DATE_ERROR_INVALID_FORMAT') });
          clearAgeData();
          return;
        }

        // Check if date is in future
        if (parsedDate > new Date()) {
          const today = new Date();
          const todayFormatted = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
          setDateErrors({
            dateOfBirth: t('DATE_ERROR_FUTURE_DATE', { date: todayFormatted }),
          });
          clearAgeData();
          return;
        }

        // Calculate age to validate it's within acceptable range
        const calculatedAge = AgeUtils.diffInYearsMonthsDays(
          parsedDate,
          new Date(),
        );

        // Check if calculated age exceeds 120 years
        if (calculatedAge.years && calculatedAge.years > 120) {
          setDateErrors({
            dateOfBirth: t('CREATE_PATIENT_VALIDATION_AGE_YEARS_MAX'),
          });
          clearAgeData();
          return;
        }

        // If no errors, update form data
        updateFormWithAge(parsedDate);
      }
    },
    [t, clearAgeData, updateFormWithAge],
  );

  const handleDateOfBirthChange = useCallback(
    (selectedDates: Date[] = []) => {
      if (!selectedDates || selectedDates.length === 0) return;
      const selectedDate = selectedDates[0];
      if (!selectedDate) return;

      updateFormWithAge(selectedDate);
    },
    [updateFormWithAge],
  );

  const handleAgeChange = useCallback(
    (field: 'ageYears' | 'ageMonths' | 'ageDays', value: string) => {
      const numValue = Number(value);
      let error = '';

      // Validate based on field
      if (value && !isNaN(numValue)) {
        if (field === 'ageYears' && numValue > 120) {
          error = t('CREATE_PATIENT_VALIDATION_AGE_YEARS_MAX');
          // Set DOB to today's date when age exceeds 120
          setFormData((prev) => ({
            ...prev,
            [field]: value,
            dateOfBirth: formatToISO(new Date()),
          }));
          setAgeErrors((prev) => ({ ...prev, [field]: error }));
          setDobEstimated(true);
          return;
        } else if (field === 'ageMonths' && numValue > 11) {
          error = t('CREATE_PATIENT_VALIDATION_AGE_MONTHS_MAX');
        } else if (field === 'ageDays' && numValue > 31) {
          error = t('CREATE_PATIENT_VALIDATION_AGE_DAYS_MAX');
        }
      }

      setAgeErrors((prev) => ({ ...prev, [field]: error }));

      // Only update formData if there's no error
      if (!error) {
        setFormData((prev) => {
          const updated = { ...prev, [field]: value };
          const age = {
            years: Number(updated.ageYears) || 0,
            months: Number(updated.ageMonths) || 0,
            days: Number(updated.ageDays) || 0,
          };
          if (age.years > 0 || age.months > 0 || age.days > 0) {
            const birthISO = AgeUtils.calculateBirthDate(age);
            updated.dateOfBirth = birthISO;
            setDobEstimated(true);
          } else {
            updated.dateOfBirth = '';
            setDobEstimated(false);
          }
          return updated;
        });
      } else {
        // Still update the value even if there's an error, so user can see their input
        setFormData((prev) => ({ ...prev, [field]: value }));
      }
    },
    [t],
  );

  const debouncedSearchAddress = useCallback(
    (field: string, searchText: string, addressField: string) => {
      const timeoutId = setTimeout(async () => {
        if (!searchText || searchText.length < 2) {
          setSuggestions((prev) => ({ ...prev, [field]: [] }));
          setShowSuggestions((prev) => ({ ...prev, [field]: false }));
          return;
        }

        try {
          const results = await getAddressHierarchyEntries(
            addressField,
            searchText,
          );
          setSuggestions((prev) => ({ ...prev, [field]: results }));
          setShowSuggestions((prev) => ({
            ...prev,
            [field]: results.length > 0,
          }));
        } catch {
          setSuggestions((prev) => ({ ...prev, [field]: [] }));
          setShowSuggestions((prev) => ({ ...prev, [field]: false }));
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    },
    [],
  );

  const handleAddressInputChange = useCallback(
    (field: string, value: string, addressField: string) => {
      handleInputChange(field, value);
      debouncedSearchAddress(field, value, addressField);

      // Mark field as not selected from dropdown when manually typed
      if (field === 'district' || field === 'state' || field === 'pincode') {
        setAddressSelectedFromDropdown((prev) => ({
          ...prev,
          [field]: false,
        }));
        // Clear error when field is empty
        if (!value) {
          setAddressErrors((prev) => ({
            ...prev,
            [field]: '',
          }));
        }
      }
    },
    [handleInputChange, debouncedSearchAddress],
  );

  const handleSuggestionSelect = useCallback(
    (field: string, entry: AddressHierarchyEntry) => {
      handleInputChange(field, entry.name);
      const parents: AddressHierarchyEntry[] = [];
      let currentParent = entry.parent;
      while (currentParent) {
        parents.push(currentParent);
        currentParent = currentParent.parent;
      }

      // Mark field as selected from dropdown
      if (field === 'district' || field === 'state' || field === 'pincode') {
        setAddressSelectedFromDropdown((prev) => ({
          ...prev,
          [field]: true,
        }));
        setAddressErrors((prev) => ({
          ...prev,
          [field]: '',
        }));
      }

      // Auto-populate parent fields based on the selected field and hierarchy
      if (parents.length > 0) {
        if (field === 'pincode') {
          // When pincode is selected, first parent is district
          if (parents[0]) {
            handleInputChange('district', parents[0].name);
            setAddressSelectedFromDropdown((prev) => ({
              ...prev,
              district: true,
            }));
            setAddressErrors((prev) => ({
              ...prev,
              district: '',
            }));
          }
          // Second parent is state
          if (parents.length > 1 && parents[1]) {
            handleInputChange('state', parents[1].name);
            setAddressSelectedFromDropdown((prev) => ({
              ...prev,
              state: true,
            }));
            setAddressErrors((prev) => ({
              ...prev,
              state: '',
            }));
          }
        } else if (field === 'district') {
          // When district is selected, first parent is state
          if (parents[0]) {
            handleInputChange('state', parents[0].name);
            setAddressSelectedFromDropdown((prev) => ({
              ...prev,
              state: true,
            }));
            setAddressErrors((prev) => ({
              ...prev,
              state: '',
            }));
          }
        }
      }

      setShowSuggestions((prev) => ({ ...prev, [field]: false }));
      setSuggestions((prev) => ({ ...prev, [field]: [] }));
    },
    [handleInputChange],
  );

  const handleSave = () => {
    const errors = { firstName: '', lastName: '', gender: '', dateOfBirth: '' };
    const addrErrors = { district: '', state: '', pincode: '' };
    let hasErrors = false;

    if (!formData.firstName.trim()) {
      errors.firstName = t('CREATE_PATIENT_VALIDATION_FIRST_NAME_REQUIRED');
      hasErrors = true;
    }
    if (!formData.lastName.trim()) {
      errors.lastName = t('CREATE_PATIENT_VALIDATION_LAST_NAME_REQUIRED');
      hasErrors = true;
    }
    if (!formData.gender) {
      errors.gender = t('CREATE_PATIENT_VALIDATION_GENDER_REQUIRED');
      hasErrors = true;
    }
    if (!formData.dateOfBirth) {
      errors.dateOfBirth = t(
        'CREATE_PATIENT_VALIDATION_DATE_OF_BIRTH_REQUIRED',
      );
      hasErrors = true;
    }

    // Validate address fields - if they have a value, it must be from dropdown
    if (formData.district && !addressSelectedFromDropdown.district) {
      addrErrors.district = t('CREATE_PATIENT_VALIDATION_SELECT_FROM_DROPDOWN');
      hasErrors = true;
    }
    if (formData.state && !addressSelectedFromDropdown.state) {
      addrErrors.state = t('CREATE_PATIENT_VALIDATION_SELECT_FROM_DROPDOWN');
      hasErrors = true;
    }
    if (formData.pincode && !addressSelectedFromDropdown.pincode) {
      addrErrors.pincode = t('CREATE_PATIENT_VALIDATION_SELECT_FROM_DROPDOWN');
      hasErrors = true;
    }

    setValidationErrors(errors);
    setAddressErrors(addrErrors);
    if (hasErrors) return;

    if (!primaryIdentifierType) {
      notificationService.showError(
        'Error',
        'Unable to determine identifier type',
        5000,
      );
      return;
    }

    const addresses: PatientAddress[] = [];
    if (
      formData.houseNumber ||
      formData.locality ||
      formData.city ||
      formData.district ||
      formData.state ||
      formData.pincode
    ) {
      addresses.push({
        ...(formData.houseNumber && { address1: formData.houseNumber }),
        ...(formData.locality && { address2: formData.locality }),
        ...(formData.city && { cityVillage: formData.city }),
        ...(formData.district && { countyDistrict: formData.district }),
        ...(formData.state && { stateProvince: formData.state }),
        ...(formData.pincode && { postalCode: formData.pincode }),
      });
    } else {
      addresses.push({});
    }

    const attributes: PatientAttribute[] = [];
    if (formData.phoneNumber) {
      attributes.push({
        attributeType: { uuid: 'phoneNumber-uuid' },
        value: formData.phoneNumber,
        voided: false,
      });
    }
    if (formData.altPhoneNumber) {
      attributes.push({
        attributeType: { uuid: 'alternatePhoneNumber-uuid' },
        value: formData.altPhoneNumber,
        voided: false,
      });
    }
    if (formData.email) {
      attributes.push({
        attributeType: { uuid: 'email-uuid' },
        value: formData.email,
        voided: false,
      });
    }

    const identifierSourceUuid = identifierSources?.get(
      formData.patientIdFormat,
    );

    const patientRequest: CreatePatientRequest = {
      patient: {
        person: {
          names: [
            {
              givenName: formData.firstName,
              ...(formData.middleName && { middleName: formData.middleName }),
              familyName: formData.lastName,
              display: `${formData.firstName}${formData.middleName ? ' ' + formData.middleName : ''} ${formData.lastName}`,
              preferred: false,
            },
          ],
          addresses,
          birthdate: formData.dateOfBirth,
          birthdateEstimated: dobEstimated,
          gender: formData.gender.charAt(0).toUpperCase(),
          birthtime: null,
          attributes,
          deathDate: null,
          causeOfDeath: '',
        },
        identifiers: [
          {
            ...(identifierSourceUuid && { identifierSourceUuid }),
            identifierPrefix: formData.patientIdFormat,
            identifierType: primaryIdentifierType,
            preferred: true,
            voided: false,
          },
        ],
      },
      relationships: [],
    };

    createPatientMutation.mutate(patientRequest);
  };

  const breadcrumbs = [
    { label: t('CREATE_PATIENT_BREADCRUMB_HOME'), href: BAHMNI_HOME_PATH },
    {
      label: t('CREATE_PATIENT_BREADCRUMB_SEARCH'),
      onClick: () => navigate('/registration/search'),
    },
    { label: t('CREATE_PATIENT_BREADCRUMB_CURRENT') },
  ];

  return (
    <BaseLayout
      header={
        <Header
          breadcrumbs={breadcrumbs}
          showButton
          buttonText={t('CREATE_PATIENT_BUTTON_TEXT')}
          buttonTestId="create-new-patient-button"
          buttonDisabled
        />
      }
      main={
        <div>
          <Tile className={styles.patientDetailsHeader}>
            <span className={styles.sectionTitle}>
              {t('CREATE_PATIENT_HEADER_TITLE')}
            </span>
          </Tile>

          <div className={styles.formContainer}>
            {/* Basic Information */}
            <div className={styles.formSection}>
              <span className={styles.formSectionTitle}>
                {t('CREATE_PATIENT_SECTION_BASIC_INFO')}
              </span>
              <div className={styles.row}>
                <div className={styles.photocol}>
                  <div className={styles.photoUploadSection}>
                    <Button
                      kind="tertiary"
                      size="sm"
                      className={styles.wrapButton}
                    >
                      {t('CREATE_PATIENT_UPLOAD_PHOTO')}
                    </Button>
                    <Button
                      kind="tertiary"
                      size="sm"
                      className={styles.wrapButton}
                    >
                      {t('CREATE_PATIENT_CAPTURE_PHOTO')}
                    </Button>
                  </div>
                </div>

                <div className={styles.col}>
                  <div className={styles.row}>
                    <div className={styles.dropdownField}>
                      <Dropdown
                        id="patient-id-format"
                        titleText={t('CREATE_PATIENT_PATIENT_ID_FORMAT')}
                        label={
                          (formData.patientIdFormat || identifierPrefixes[0]) ??
                          t('CREATE_PATIENT_SELECT')
                        }
                        items={identifierPrefixes}
                        selectedItem={formData.patientIdFormat}
                        onChange={({ selectedItem }) =>
                          handleInputChange(
                            'patientIdFormat',
                            selectedItem ?? '',
                          )
                        }
                      />
                    </div>
                    <div className={styles.col}>
                      <CheckboxGroup
                        legendText={t('CREATE_PATIENT_ENTRY_TYPE')}
                      >
                        <div className={styles.checkboxField}>
                          <Checkbox
                            labelText={t('CREATE_PATIENT_ENTER_MANUALLY')}
                            id="entry-type"
                            checked={formData.entryType}
                            onChange={(e) =>
                              handleInputChange('entryType', e.target.checked)
                            }
                          />
                        </div>
                      </CheckboxGroup>
                    </div>
                  </div>

                  <div className={`${styles.row} ${styles.nameFields}`}>
                    <TextInput
                      id="first-name"
                      labelText={t('CREATE_PATIENT_FIRST_NAME')}
                      placeholder={t('CREATE_PATIENT_FIRST_NAME_PLACEHOLDER')}
                      value={formData.firstName}
                      required
                      invalid={
                        !!nameErrors.firstName || !!validationErrors.firstName
                      }
                      invalidText={
                        nameErrors.firstName || validationErrors.firstName
                      }
                      onChange={(e) =>
                        handleNameChange('firstName', e.target.value)
                      }
                    />

                    <TextInput
                      id="middle-name"
                      labelText={t('CREATE_PATIENT_MIDDLE_NAME')}
                      placeholder={t('CREATE_PATIENT_MIDDLE_NAME_PLACEHOLDER')}
                      value={formData.middleName}
                      invalid={!!nameErrors.middleName}
                      invalidText={nameErrors.middleName}
                      onChange={(e) =>
                        handleNameChange('middleName', e.target.value)
                      }
                    />

                    <TextInput
                      id="last-name"
                      labelText={t('CREATE_PATIENT_LAST_NAME')}
                      placeholder={t('CREATE_PATIENT_LAST_NAME_PLACEHOLDER')}
                      required
                      value={formData.lastName}
                      invalid={
                        !!nameErrors.lastName || !!validationErrors.lastName
                      }
                      invalidText={
                        nameErrors.lastName || validationErrors.lastName
                      }
                      onChange={(e) =>
                        handleNameChange('lastName', e.target.value)
                      }
                    />
                  </div>
                  <div className={`${styles.row} ${styles.demographicsFields}`}>
                    <div className={styles.dropdownField}>
                      <Dropdown
                        id="gender"
                        titleText={t('CREATE_PATIENT_GENDER')}
                        label={t('CREATE_PATIENT_SELECT')}
                        items={genders}
                        aria-required="true"
                        selectedItem={formData.gender}
                        invalid={!!validationErrors.gender}
                        invalidText={validationErrors.gender}
                        onChange={({ selectedItem }) => {
                          handleInputChange('gender', selectedItem ?? '');
                          setValidationErrors((prev) => ({
                            ...prev,
                            gender: '',
                          }));
                        }}
                      />
                    </div>

                    <div className={styles.col}>
                      <div className={styles.ageFieldsWrapper}>
                        <div className={styles.ageInputs}>
                          <TextInput
                            id="age-years"
                            labelText={t('CREATE_PATIENT_AGE_YEARS')}
                            type="number"
                            required
                            min={0}
                            max={120}
                            value={formData.ageYears}
                            invalid={!!ageErrors.ageYears}
                            invalidText={ageErrors.ageYears}
                            onChange={(e) =>
                              handleAgeChange('ageYears', e.target.value)
                            }
                          />
                        </div>

                        <div className={styles.ageInputs}>
                          <TextInput
                            id="age-months"
                            labelText={t('CREATE_PATIENT_AGE_MONTHS')}
                            type="number"
                            required
                            min={0}
                            max={11}
                            value={formData.ageMonths}
                            invalid={!!ageErrors.ageMonths}
                            invalidText={ageErrors.ageMonths}
                            onChange={(e) =>
                              handleAgeChange('ageMonths', e.target.value)
                            }
                          />
                        </div>
                        <div className={styles.ageInputs}>
                          <TextInput
                            id="age-days"
                            labelText={t('CREATE_PATIENT_AGE_DAYS')}
                            type="number"
                            min={0}
                            max={31}
                            value={formData.ageDays}
                            invalid={!!ageErrors.ageDays}
                            invalidText={ageErrors.ageDays}
                            onChange={(e) =>
                              handleAgeChange('ageDays', e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`${styles.row} ${styles.birthInfoFields}`}>
                    <div>
                      <DatePicker
                        dateFormat="d/m/Y"
                        datePickerType="single"
                        minDate={(() => {
                          const date = new Date();
                          date.setFullYear(date.getFullYear() - 120);
                          date.setHours(0, 0, 0, 0);
                          return date;
                        })()}
                        maxDate={new Date()}
                        value={
                          formData.dateOfBirth
                            ? formatToDisplay(formData.dateOfBirth)
                            : ''
                        }
                        onChange={handleDateOfBirthChange}
                      >
                        <DatePickerInput
                          id="date-of-birth"
                          placeholder={t(
                            'CREATE_PATIENT_DATE_OF_BIRTH_PLACEHOLDER',
                          )}
                          labelText={t('CREATE_PATIENT_DATE_OF_BIRTH')}
                          invalid={
                            !!dateErrors.dateOfBirth ||
                            !!validationErrors.dateOfBirth
                          }
                          invalidText={
                            dateErrors.dateOfBirth ||
                            validationErrors.dateOfBirth
                          }
                          onInput={handleDateInputChange}
                        />
                      </DatePicker>
                    </div>

                    <CheckboxGroup legendText={t('CREATE_PATIENT_ACCURACY')}>
                      <div className={styles.checkboxField}>
                        <Checkbox
                          labelText={t('CREATE_PATIENT_ESTIMATED')}
                          id="accuracy"
                          checked={dobEstimated}
                          onChange={() => setDobEstimated(!dobEstimated)}
                        />
                      </div>
                    </CheckboxGroup>
                    <div>
                      <TextInput
                        id="birth-time"
                        type="time"
                        required
                        value={formData.birthTime}
                        onChange={(e) =>
                          handleInputChange('birthTime', e.target.value)
                        }
                        labelText={t('CREATE_PATIENT_BIRTH_TIME')}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className={styles.formSection}>
              <span className={styles.sectionTitle}>
                {t('CREATE_PATIENT_SECTION_ADDRESS_INFO')}
              </span>
              <div className={styles.row}>
                <div className={styles.col}>
                  <TextInput
                    id="house-number"
                    labelText={t('CREATE_PATIENT_HOUSE_NUMBER')}
                    placeholder={t('CREATE_PATIENT_ADDRESS_LINE_PLACEHOLDER')}
                    value={formData.houseNumber}
                    onChange={(e) =>
                      handleInputChange('houseNumber', e.target.value)
                    }
                  />
                </div>
                <div className={styles.col}>
                  <TextInput
                    id="locality"
                    labelText={t('CREATE_PATIENT_LOCALITY')}
                    placeholder={t('CREATE_PATIENT_LOCALITY')}
                    value={formData.locality}
                    onChange={(e) =>
                      handleInputChange('locality', e.target.value)
                    }
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.col}>
                  <div className={styles.addressFieldWrapper}>
                    <TextInput
                      id="district"
                      labelText={t('CREATE_PATIENT_DISTRICT')}
                      placeholder={t('CREATE_PATIENT_DISTRICT')}
                      value={formData.district}
                      invalid={!!addressErrors.district}
                      invalidText={addressErrors.district}
                      onChange={(e) =>
                        handleAddressInputChange(
                          'district',
                          e.target.value,
                          'countyDistrict',
                        )
                      }
                      onBlur={() => {
                        setTimeout(() => {
                          setShowSuggestions((prev) => ({
                            ...prev,
                            district: false,
                          }));
                        }, 200);
                      }}
                      onFocus={() => {
                        if (suggestions.district.length > 0) {
                          setShowSuggestions((prev) => ({
                            ...prev,
                            district: true,
                          }));
                        }
                      }}
                    />
                    {showSuggestions.district &&
                      suggestions.district.length > 0 && (
                        <div className={styles.suggestionsList}>
                          {suggestions.district.map((entry) => (
                            <div
                              key={entry.userGeneratedId ?? entry.uuid}
                              className={styles.suggestionItem}
                              onClick={() =>
                                handleSuggestionSelect('district', entry)
                              }
                            >
                              <div className={styles.suggestionName}>
                                {entry.name}
                              </div>
                              {entry.parent && (
                                <div className={styles.suggestionParent}>
                                  {entry.parent.name}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
                <div className={styles.col}>
                  <TextInput
                    id="city"
                    labelText={t('CREATE_PATIENT_CITY')}
                    placeholder={t('CREATE_PATIENT_CITY')}
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                  />
                </div>
                <div className={styles.col}>
                  <div className={styles.addressFieldWrapper}>
                    <TextInput
                      id="state"
                      labelText={t('CREATE_PATIENT_STATE')}
                      placeholder={t('CREATE_PATIENT_STATE')}
                      value={formData.state}
                      invalid={!!addressErrors.state}
                      invalidText={addressErrors.state}
                      onChange={(e) =>
                        handleAddressInputChange(
                          'state',
                          e.target.value,
                          'stateProvince',
                        )
                      }
                      onBlur={() => {
                        setTimeout(() => {
                          setShowSuggestions((prev) => ({
                            ...prev,
                            state: false,
                          }));
                        }, 200);
                      }}
                      onFocus={() => {
                        if (suggestions.state.length > 0) {
                          setShowSuggestions((prev) => ({
                            ...prev,
                            state: true,
                          }));
                        }
                      }}
                    />
                    {showSuggestions.state && suggestions.state.length > 0 && (
                      <div className={styles.suggestionsList}>
                        {suggestions.state.map((entry) => (
                          <div
                            key={entry.userGeneratedId ?? entry.uuid}
                            className={styles.suggestionItem}
                            onClick={() =>
                              handleSuggestionSelect('state', entry)
                            }
                          >
                            <div className={styles.suggestionName}>
                              {entry.name}
                            </div>
                            {entry.parent && (
                              <div className={styles.suggestionParent}>
                                {entry.parent.name}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className={styles.col}>
                  <div className={styles.addressFieldWrapper}>
                    <TextInput
                      id="pincode"
                      labelText={t('CREATE_PATIENT_PINCODE')}
                      placeholder={t('CREATE_PATIENT_PINCODE')}
                      value={formData.pincode}
                      invalid={!!addressErrors.pincode}
                      invalidText={addressErrors.pincode}
                      onChange={(e) =>
                        handleAddressInputChange(
                          'pincode',
                          e.target.value,
                          'postalCode',
                        )
                      }
                      onBlur={() => {
                        setTimeout(() => {
                          setShowSuggestions((prev) => ({
                            ...prev,
                            pincode: false,
                          }));
                        }, 200);
                      }}
                      onFocus={() => {
                        if (suggestions.pincode.length > 0) {
                          setShowSuggestions((prev) => ({
                            ...prev,
                            pincode: true,
                          }));
                        }
                      }}
                    />
                    {showSuggestions.pincode &&
                      suggestions.pincode.length > 0 && (
                        <div className={styles.suggestionsList}>
                          {suggestions.pincode.map((entry) => (
                            <div
                              key={entry.userGeneratedId ?? entry.uuid}
                              className={styles.suggestionItem}
                              onClick={() =>
                                handleSuggestionSelect('pincode', entry)
                              }
                            >
                              <div className={styles.suggestionName}>
                                {entry.name}
                              </div>
                              {entry.parent && (
                                <div className={styles.suggestionParent}>
                                  {entry.parent.name}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className={styles.formSection}>
              <span className={styles.formSectionTitle}>
                {t('CREATE_PATIENT_SECTION_CONTACT_INFO')}
              </span>
              <div className={styles.row}>
                <div className={styles.phoneNumberField}>
                  <TextInput
                    id="phone-number"
                    labelText={t('CREATE_PATIENT_PHONE_NUMBER')}
                    placeholder={t('CREATE_PATIENT_PHONE_NUMBER_PLACEHOLDER')}
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      handlePhoneChange('phoneNumber', e.target.value)
                    }
                  />
                </div>
                <div className={styles.phoneNumberField}>
                  <TextInput
                    id="alt-phone-number"
                    labelText={t('CREATE_PATIENT_ALT_PHONE_NUMBER')}
                    placeholder={t('CREATE_PATIENT_ALT_PHONE_NUMBER')}
                    value={formData.altPhoneNumber}
                    onChange={(e) =>
                      handlePhoneChange('altPhoneNumber', e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className={styles.formSection}>
              <span className={styles.formSectionTitle}>
                {t('CREATE_PATIENT_SECTION_ADDITIONAL_INFO')}
              </span>
              <div className={styles.row}>
                <div className={styles.emailField}>
                  <TextInput
                    id="email"
                    labelText={t('CREATE_PATIENT_EMAIL')}
                    placeholder={t('CREATE_PATIENT_EMAIL_PLACEHOLDER')}
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className={styles.formActions}>
            <Button kind="tertiary">
              {t('CREATE_PATIENT_BACK_TO_SEARCH')}
            </Button>
            <div className={styles.actionButtons}>
              <Button
                kind="tertiary"
                onClick={handleSave}
                disabled={createPatientMutation.isPending}
              >
                {createPatientMutation.isPending
                  ? 'Saving...'
                  : t('CREATE_PATIENT_SAVE')}
              </Button>
              <Button kind="tertiary">
                {t('CREATE_PATIENT_PRINT_REG_CARD')}
              </Button>
              <Button kind="primary">
                {t('CREATE_PATIENT_START_OPD_VISIT')}
              </Button>
            </div>
          </div>
        </div>
      }
    />
  );
};

export default NewPatientRegistration;
