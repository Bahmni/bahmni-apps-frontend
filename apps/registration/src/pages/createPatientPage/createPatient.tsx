import {
  Grid,
  Column,
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
  type CreatePatientRequest,
  type PatientAttribute,
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
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
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
      // Map API gender values to translation keys
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
      // Navigate to patient details page with patient information
      if (response?.patient?.uuid) {
        navigate(`/registration/patient/${response.patient.uuid}`, {
          state: {
            patientDisplay: response.patient.display,
            patientUuid: response.patient.uuid,
          },
        });
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
    ageYears: 0,
    ageMonths: 0,
    ageDays: 0,
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

  // Set the first prefix as default when data is loaded
  useEffect(() => {
    if (identifierPrefixes.length > 0 && !formData.patientIdFormat) {
      setFormData((prev) => ({
        ...prev,
        patientIdFormat: identifierPrefixes[0],
      }));
    }
  }, [identifierPrefixes, formData.patientIdFormat]);

  const handleInputChange = (
    field: string,
    value: string | number | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNameChange = (field: string, value: string) => {
    const nameRegex = /^[a-zA-Z\s]*$/;

    if (nameRegex.test(value)) {
      handleInputChange(field, value);
      setNameErrors((prev) => ({ ...prev, [field]: '' }));
      setValidationErrors((prev) => ({ ...prev, [field]: '' }));
    } else {
      setNameErrors((prev) => ({
        ...prev,
        [field]: 'Numbers and special characters are not allowed.',
      }));
    }
  };

  const handleDateOfBirthChange = useCallback((selectedDates: Date[] = []) => {
    if (!selectedDates || selectedDates.length === 0) return;

    const selectedDate = selectedDates[0];
    if (!selectedDate) return;

    // Convert Date to ISO for internal state
    const isoDate = formatToISO(selectedDate);

    // Calculate age using AgeUtils
    const calculatedAge = AgeUtils.diffInYearsMonthsDays(
      selectedDate,
      new Date(),
    );

    setFormData((prev) => ({
      ...prev,
      dateOfBirth: isoDate, // yyyy-mm-dd
      ageYears: Number(calculatedAge.years) || 0,
      ageMonths: Number(calculatedAge.months) || 0,
      ageDays: Number(calculatedAge.days) || 0,
    }));
    setDobEstimated(false);
    setValidationErrors((prev) => ({ ...prev, dateOfBirth: '' }));
  }, []);

  // Handle TextInput changes → back-calculate DOB
  const handleAgeChange = useCallback(
    (field: 'ageYears' | 'ageMonths' | 'ageDays', value: number) => {
      setFormData((prev) => {
        const updated = { ...prev, [field]: value || 0 };

        const age = {
          years: updated.ageYears,
          months: updated.ageMonths,
          days: updated.ageDays,
        };
        if (age.years > 0 || age.months > 0 || age.days > 0) {
          const birthISO = AgeUtils.calculateBirthDate(age); // yyyy-mm-dd
          updated.dateOfBirth = birthISO;
          setDobEstimated(true);
        } else {
          updated.dateOfBirth = '';
          setDobEstimated(false);
        }
        return updated;
      });
    },
    [],
  );

  // Handle save patient
  const handleSave = () => {
    const errors = {
      firstName: '',
      lastName: '',
      gender: '',
      dateOfBirth: '',
    };

    let hasErrors = false;

    if (!formData.firstName || formData.firstName.trim() === '') {
      errors.firstName = 'First name is required';
      hasErrors = true;
    }

    if (!formData.lastName || formData.lastName.trim() === '') {
      errors.lastName = 'Last name is required';
      hasErrors = true;
    }

    if (!formData.gender) {
      errors.gender = 'Gender is required';
      hasErrors = true;
    }

    if (!formData.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required';
      hasErrors = true;
    }

    setValidationErrors(errors);

    if (hasErrors) {
      return;
    }

    if (!primaryIdentifierType) {
      notificationService.showError(
        'Error',
        'Unable to determine identifier type',
        5000,
      );
      return;
    }

    // Build patient request matching Bahmni API structure
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
      addresses.push({}); // Empty address object as per API requirement
    }

    const attributes: PatientAttribute[] = [];
    // Note: You would need to get the actual attribute type UUIDs from your system
    // For now, marking as voided:true since we don't have the UUIDs
    if (formData.phoneNumber) {
      attributes.push({
        attributeType: { uuid: 'phoneNumber-uuid' }, // Replace with actual UUID
        value: formData.phoneNumber,
        voided: false,
      });
    }
    if (formData.altPhoneNumber) {
      attributes.push({
        attributeType: { uuid: 'alternatePhoneNumber-uuid' }, // Replace with actual UUID
        value: formData.altPhoneNumber,
        voided: false,
      });
    }
    if (formData.email) {
      attributes.push({
        attributeType: { uuid: 'email-uuid' }, // Replace with actual UUID
        value: formData.email,
        voided: false,
      });
    }

    // Get identifier source UUID for the selected prefix
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

    // Call mutation
    createPatientMutation.mutate(patientRequest);
  };

  const breadcrumbs = [
    {
      label: t('CREATE_PATIENT_BREADCRUMB_HOME'),
      href: BAHMNI_HOME_PATH,
    },
    {
      label: t('CREATE_PATIENT_BREADCRUMB_SEARCH'),
      onClick: () => navigate('/registration/search'),
    },
    {
      label: t('CREATE_PATIENT_BREADCRUMB_CURRENT'),
    },
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
            <h3>{t('CREATE_PATIENT_HEADER_TITLE')}</h3>
          </Tile>
          <div className={styles.formContainer}>
            {/* Basic Information */}
            <div className={styles.formSection}>
              <h4 className={styles.sectionTitle}>
                {t('CREATE_PATIENT_SECTION_BASIC_INFO')}
              </h4>
              <Grid>
                <Column sm={4} md={2} lg={3}>
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
                </Column>
                <Column sm={4} md={6} lg={13}>
                  <Grid>
                    <Column sm={2} md={4} lg={4}>
                      <Dropdown
                        id="patient-id-format"
                        titleText={t('CREATE_PATIENT_PATIENT_ID_FORMAT')}
                        label={
                          formData.patientIdFormat ||
                          identifierPrefixes[0] ||
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
                    </Column>
                    <Column sm={2} md={4} lg={4}>
                      <CheckboxGroup
                        legendText={t('CREATE_PATIENT_ENTRY_TYPE')}
                      >
                        <Checkbox
                          labelText={t('CREATE_PATIENT_ENTER_MANUALLY')}
                          id="entry-type"
                          checked={formData.entryType}
                          onChange={(event) =>
                            handleInputChange('entryType', event.target.checked)
                          }
                        />
                      </CheckboxGroup>
                    </Column>
                  </Grid>

                  <Grid className={styles.nameFields}>
                    <Column sm={4} md={2} lg={4}>
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
                    </Column>
                    <Column sm={4} md={2} lg={4}>
                      <TextInput
                        id="middle-name"
                        labelText={t('CREATE_PATIENT_MIDDLE_NAME')}
                        placeholder={t(
                          'CREATE_PATIENT_MIDDLE_NAME_PLACEHOLDER',
                        )}
                        value={formData.middleName}
                        invalid={!!nameErrors.middleName}
                        invalidText={nameErrors.middleName}
                        onChange={(e) =>
                          handleNameChange('middleName', e.target.value)
                        }
                      />
                    </Column>
                    <Column sm={4} md={2} lg={4}>
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
                    </Column>
                  </Grid>

                  <Grid className={styles.demographicsFields}>
                    <Column sm={4} md={3} lg={5}>
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
                          // Clear validation error when user selects gender
                          setValidationErrors((prev) => ({
                            ...prev,
                            gender: '',
                          }));
                        }}
                      />
                    </Column>

                    <Column sm={2} md={5} lg={7} className={styles.ageColumn}>
                      <div className={styles.ageFieldsWrapper}>
                        <div className={styles.ageInputs}>
                          <TextInput
                            placeholder={t(
                              'CREATE_PATIENT_AGE_YEARS_PLACEHOLDER',
                            )}
                            id="age-years"
                            labelText={t(
                              'CREATE_PATIENT_AGE_YEARS_PLACEHOLDER',
                            )}
                            required
                            size="md"
                            type="number"
                            min={0}
                            max={150}
                            value={formData.ageYears}
                            onChange={(e) =>
                              handleAgeChange(
                                'ageYears',
                                Number(e.target.value),
                              )
                            }
                          />
                        </div>
                        <div className={styles.ageInputs}>
                          <TextInput
                            placeholder={t(
                              'CREATE_PATIENT_AGE_MONTHS_PLACEHOLDER',
                            )}
                            labelText={t('CREATE_PATIENT_AGE_MONTHS')}
                            id="age-months"
                            type="number"
                            required
                            min={0}
                            max={11}
                            value={formData.ageMonths}
                            onChange={(e) =>
                              handleAgeChange(
                                'ageMonths',
                                Number(e.target.value),
                              )
                            }
                          />
                        </div>
                        <div className={styles.ageInputs}>
                          <TextInput
                            placeholder={t(
                              'CREATE_PATIENT_AGE_DAYS_PLACEHOLDER',
                            )}
                            id="age-days"
                            labelText={t('CREATE_PATIENT_AGE_DAYS')}
                            type="number"
                            min={0}
                            max={31}
                            value={formData.ageDays}
                            onChange={(e) =>
                              handleAgeChange('ageDays', Number(e.target.value))
                            }
                          />
                        </div>
                      </div>
                    </Column>
                  </Grid>

                  <Grid className={styles.birthInfoFields}>
                    <Column sm={4} md={3} lg={5}>
                      <DatePicker
                        dateFormat="d/m/Y"
                        datePickerType="single"
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
                          invalid={!!validationErrors.dateOfBirth}
                          invalidText={validationErrors.dateOfBirth}
                        />
                      </DatePicker>
                    </Column>
                    <Column sm={2} md={2} lg={3}>
                      <CheckboxGroup legendText={t('CREATE_PATIENT_ACCURACY')}>
                        <Checkbox
                          labelText={t('CREATE_PATIENT_ESTIMATED')}
                          id="accuracy"
                          checked={dobEstimated}
                          onChange={() => setDobEstimated(!dobEstimated)}
                        />
                      </CheckboxGroup>
                    </Column>
                    <Column sm={2} md={3} lg={4}>
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
                    </Column>
                  </Grid>
                </Column>
              </Grid>
            </div>

            {/* Address Information */}
            <div className={styles.formSection}>
              <h4 className={styles.sectionTitle}>
                {t('CREATE_PATIENT_SECTION_ADDRESS_INFO')}
              </h4>
              <Grid>
                <Column sm={4} md={4} lg={8}>
                  <TextInput
                    id="house-number"
                    labelText={t('CREATE_PATIENT_HOUSE_NUMBER')}
                    placeholder={t('CREATE_PATIENT_ADDRESS_LINE_PLACEHOLDER')}
                    value={formData.houseNumber}
                    onChange={(e) =>
                      handleInputChange('houseNumber', e.target.value)
                    }
                  />
                </Column>
                <Column sm={4} md={4} lg={8}>
                  <TextInput
                    id="locality"
                    labelText={t('CREATE_PATIENT_LOCALITY')}
                    placeholder={t('CREATE_PATIENT_ADDRESS_LINE2_PLACEHOLDER')}
                    value={formData.locality}
                    onChange={(e) =>
                      handleInputChange('locality', e.target.value)
                    }
                  />
                </Column>
              </Grid>
              <Grid>
                <Column sm={4} md={2} lg={4}>
                  <TextInput
                    id="district"
                    labelText={t('CREATE_PATIENT_DISTRICT')}
                    placeholder={t('CREATE_PATIENT_DISTRICT_PLACEHOLDER')}
                    value={formData.district}
                    onChange={(e) =>
                      handleInputChange('district', e.target.value)
                    }
                  />
                </Column>
                <Column sm={4} md={2} lg={4}>
                  <TextInput
                    id="city"
                    labelText={t('CREATE_PATIENT_CITY')}
                    placeholder={t('CREATE_PATIENT_DISTRICT_PLACEHOLDER')}
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                  />
                </Column>
                <Column sm={4} md={2} lg={4}>
                  <TextInput
                    id="state"
                    labelText={t('CREATE_PATIENT_STATE')}
                    placeholder={t('CREATE_PATIENT_DISTRICT_PLACEHOLDER')}
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                  />
                </Column>
                <Column sm={4} md={2} lg={4}>
                  <TextInput
                    id="pincode"
                    labelText={t('CREATE_PATIENT_PINCODE')}
                    placeholder={t('CREATE_PATIENT_DISTRICT_PLACEHOLDER')}
                    value={formData.pincode}
                    onChange={(e) =>
                      handleInputChange('pincode', e.target.value)
                    }
                  />
                </Column>
              </Grid>
            </div>

            {/* Contact Information */}
            <div className={styles.formSection}>
              <h4 className={styles.sectionTitle}>
                {t('CREATE_PATIENT_SECTION_CONTACT_INFO')}
              </h4>
              <Grid>
                <Column sm={4} md={4} lg={8}>
                  <TextInput
                    id="phone-number"
                    labelText={t('CREATE_PATIENT_PHONE_NUMBER')}
                    placeholder={t('CREATE_PATIENT_PHONE_NUMBER_PLACEHOLDER')}
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      handleInputChange('phoneNumber', e.target.value)
                    }
                  />
                </Column>
                <Column sm={4} md={4} lg={8}>
                  <TextInput
                    id="alt-phone-number"
                    labelText={t('CREATE_PATIENT_ALT_PHONE_NUMBER')}
                    placeholder={t('CREATE_PATIENT_PHONE_NUMBER_PLACEHOLDER')}
                    value={formData.altPhoneNumber}
                    onChange={(e) =>
                      handleInputChange('altPhoneNumber', e.target.value)
                    }
                  />
                </Column>
              </Grid>
            </div>

            {/* Additional Information */}
            <div className={styles.formSection}>
              <h4 className={styles.sectionTitle}>
                {t('CREATE_PATIENT_SECTION_ADDITIONAL_INFO')}
              </h4>
              <Grid>
                <Column sm={4} md={4} lg={8}>
                  <TextInput
                    id="email"
                    labelText={t('CREATE_PATIENT_EMAIL')}
                    placeholder={t('CREATE_PATIENT_EMAIL_PLACEHOLDER')}
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </Column>
              </Grid>
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
