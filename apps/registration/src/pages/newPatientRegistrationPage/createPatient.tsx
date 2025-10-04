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
  getIdentifierPrefixes,
} from '@bahmni-frontend/bahmni-services';
import { useQuery } from '@tanstack/react-query';
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header';
import { AgeUtils, formatToDisplay, formatToISO } from '../../utils/ageUtils';
import styles from './styles/index.module.scss';

const GENDERS = ['Male', 'Female', 'Other'];

const NewPatientRegistration = () => {
  const navigate = useNavigate();
  const [dobEstimated, setDobEstimated] = useState(false);

  // Fetch identifier prefixes using TanStack Query
  const { data: identifierPrefixes = [] } = useQuery({
    queryKey: ['identifierPrefixes'],
    queryFn: getIdentifierPrefixes,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
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
    birthTime: '09:00 AM',
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
        } else {
          updated.dateOfBirth = '';
        }
        return updated;
      });
    },
    [],
  );

  const breadcrumbs = [
    {
      label: 'Home',
      href: BAHMNI_HOME_PATH,
    },
    {
      label: 'Search Patient',
      onClick: () => navigate('/registration/search'),
    },
    {
      label: 'Create New Patient',
    },
  ];

  return (
    <BaseLayout
      header={
        <Header
          breadcrumbs={breadcrumbs}
          showButton
          buttonText="Create new patient"
          buttonTestId="create-new-patient-button"
          buttonDisabled
        />
      }
      main={
        <div>
          <Tile className={styles.patientDetailsHeader}>
            <h3>Patient details</h3>
          </Tile>
          <div className={styles.formContainer}>
            {/* Basic Information */}
            <div className={styles.formSection}>
              <h4 className={styles.sectionTitle}>Basic information</h4>
              <Grid>
                <Column sm={4} md={2} lg={3}>
                  <div className={styles.photoUploadSection}>
                    <Button
                      kind="tertiary"
                      size="sm"
                      className={styles.wrapButton}
                    >
                      Upload photo
                    </Button>
                    <Button
                      kind="tertiary"
                      size="sm"
                      className={styles.wrapButton}
                    >
                      Capture photo
                    </Button>
                  </div>
                </Column>
                <Column sm={4} md={6} lg={13}>
                  <Grid>
                    <Column sm={2} md={4} lg={4}>
                      <Dropdown
                        id="patient-id-format"
                        titleText="Patient ID format"
                        label={
                          formData.patientIdFormat ||
                          identifierPrefixes[0] ||
                          'Select'
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
                      <CheckboxGroup legendText="Entry type">
                        <Checkbox
                          labelText="Enter manually"
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
                    <Column sm={4} md={2} lg={3}>
                      <TextInput
                        id="first-name"
                        labelText="First name*"
                        placeholder="First name"
                        value={formData.firstName}
                        required
                        onChange={(e) =>
                          handleInputChange('firstName', e.target.value)
                        }
                      />
                    </Column>
                    <Column sm={4} md={2} lg={3}>
                      <TextInput
                        id="middle-name"
                        labelText="Middle name"
                        placeholder="Middle name"
                        value={formData.middleName}
                        onChange={(e) =>
                          handleInputChange('middleName', e.target.value)
                        }
                      />
                    </Column>
                    <Column sm={4} md={2} lg={3}>
                      <TextInput
                        id="last-name"
                        labelText="Last name*"
                        placeholder="Last name"
                        required
                        value={formData.lastName}
                        onChange={(e) =>
                          handleInputChange('lastName', e.target.value)
                        }
                      />
                    </Column>
                  </Grid>

                  <Grid className={styles.demographicsFields}>
                    <Column sm={2} md={2} lg={2}>
                      <Dropdown
                        id="gender"
                        titleText="Gender"
                        label="Select"
                        items={GENDERS}
                        selectedItem={formData.gender}
                        onChange={({ selectedItem }) =>
                          handleInputChange('gender', selectedItem ?? '')
                        }
                      />
                    </Column>

                    <div className={styles.ageInputs}>
                      <TextInput
                        placeholder="Years"
                        id="age-years"
                        labelText="Age"
                        size="md"
                        type="number"
                        min={0}
                        max={150}
                        value={formData.ageYears}
                        onChange={(e) =>
                          handleAgeChange('ageYears', Number(e.target.value))
                        }
                      />
                    </div>
                    <div className={styles.ageInputs}>
                      <TextInput
                        placeholder="Months"
                        labelText="Months"
                        id="age-months"
                        type="number"
                        min={0}
                        max={11}
                        value={formData.ageMonths}
                        onChange={(e) =>
                          handleAgeChange('ageMonths', Number(e.target.value))
                        }
                      />
                    </div>
                    <div className={styles.ageInputs}>
                      <TextInput
                        placeholder="days"
                        id="age-days"
                        labelText="Days"
                        type="number"
                        min={0}
                        max={31}
                        value={formData.ageDays}
                        onChange={(e) =>
                          handleAgeChange('ageDays', Number(e.target.value))
                        }
                      />
                    </div>
                  </Grid>

                  <Grid>
                    <Column sm={3} md={2} lg={5}>
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
                          placeholder="dd/mm/yyyy"
                          labelText="Date of birth"
                        />
                      </DatePicker>
                    </Column>
                    <Column sm={3} md={3} lg={4}>
                      <CheckboxGroup legendText="Accuracy">
                        <Checkbox
                          labelText="Estimated"
                          id="accuracy"
                          checked={dobEstimated}
                          onChange={() => setDobEstimated(!dobEstimated)}
                        />
                      </CheckboxGroup>
                    </Column>
                    <Column sm={4} md={2} lg={3}>
                      <TextInput
                        id="birth time"
                        type="time"
                        value={formData.birthTime}
                        onChange={(e) =>
                          handleInputChange('birthTime', e.target.value)
                        }
                        labelText="Birth time"
                      />
                    </Column>
                  </Grid>
                </Column>
              </Grid>
            </div>

            {/* Address Information */}
            <div className={styles.formSection}>
              <h4 className={styles.sectionTitle}>Address information</h4>
              <Grid>
                <Column sm={4} md={4} lg={8}>
                  <TextInput
                    id="house-number"
                    labelText="House number/ Flat number"
                    placeholder="Address line"
                    value={formData.houseNumber}
                    onChange={(e) =>
                      handleInputChange('houseNumber', e.target.value)
                    }
                  />
                </Column>
                <Column sm={4} md={4} lg={8}>
                  <TextInput
                    id="locality"
                    labelText="Locality/Sector"
                    placeholder="Address line 2"
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
                    labelText="District"
                    placeholder="District"
                    value={formData.district}
                    onChange={(e) =>
                      handleInputChange('district', e.target.value)
                    }
                  />
                </Column>
                <Column sm={4} md={2} lg={4}>
                  <TextInput
                    id="city"
                    labelText="City/Village"
                    placeholder="District"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                  />
                </Column>
                <Column sm={4} md={2} lg={4}>
                  <TextInput
                    id="state"
                    labelText="State"
                    placeholder="District"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                  />
                </Column>
                <Column sm={4} md={2} lg={4}>
                  <TextInput
                    id="pincode"
                    labelText="Pincode"
                    placeholder="District"
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
              <h4 className={styles.sectionTitle}>Contact information</h4>
              <Grid>
                <Column sm={4} md={4} lg={8}>
                  <TextInput
                    id="phone-number"
                    labelText="Phone number"
                    placeholder="Phone number"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      handleInputChange('phoneNumber', e.target.value)
                    }
                  />
                </Column>
                <Column sm={4} md={4} lg={8}>
                  <TextInput
                    id="alt-phone-number"
                    labelText="Alternative phone number"
                    placeholder="Phone number"
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
              <h4 className={styles.sectionTitle}>Additional information</h4>
              <Grid>
                <Column sm={4} md={4} lg={8}>
                  <TextInput
                    id="email"
                    labelText="Email Id"
                    placeholder="Email id"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </Column>
              </Grid>
            </div>
          </div>

          {/* Footer Actions */}
          <div className={styles.formActions}>
            <Button kind="tertiary">Back to search patient</Button>
            <div className={styles.actionButtons}>
              <Button kind="tertiary">Save</Button>
              <Button kind="tertiary">Print reg card</Button>
              <Button kind="primary">Start OPD visit</Button>
            </div>
          </div>
        </div>
      }
    />
  );
};

export default NewPatientRegistration;
