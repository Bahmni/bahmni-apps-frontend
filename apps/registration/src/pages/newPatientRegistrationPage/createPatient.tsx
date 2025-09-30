import {
  BaseLayout,
  Button,
  Tile,
  TextInput,
  Dropdown,
  Checkbox,
  DatePicker,
  DatePickerInput,
  Grid,
  Column,
  CheckboxGroup,
} from '@bahmni-frontend/bahmni-design-system';
import { BAHMNI_HOME_PATH } from '@bahmni-frontend/bahmni-services';
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { Header } from '../../components/Header';
import { TimeSelector } from '../../components/TimeSelector/TimeSelector';
import {
  AgeUtils,
  formatToDisplay,
  formatToISO,
  parseDateStringToDate,
} from '../../utils/ageUtils';
import styles from './styles/index.module.scss';

//TODO: add service for reading bahmni configuration for patient id formats
// Formatted Ientifier types
const PATIENT_ID_FORMATS = ['ABC', 'XYZ'];
const GENDERS = ['Male', 'Female', 'Other'];

const CreatePatient: React.FC = () => {
  const navigate = useNavigate();
  const [dobEstimated, setDobEstimated] = useState(false);

  const [formData, setFormData] = useState({
    patientIdFormat: 'ABC',
    enterManually: false,
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    ageYears: 0,
    ageMonths: 0,
    ageDays: 0,
    dateOfBirth: '',
    birthTime: '',
  });

  const [birthTime, setBirthTime] = useState('09:00 AM');

  const onFieldChange = (field: string, value: string | number | boolean) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleDateOfBirthChange = useCallback((selectedDates: Date[] = []) => {
    if (!selectedDates || selectedDates.length === 0) return;

    const selectedDate = selectedDates[0];
    if (!selectedDate) return;

    // Convert Date to ISO for internal state
    const isoDate = formatToISO(selectedDate);

    // Calculate age using cleaned AgeUtils
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

  // Handle NumberInput changes → back-calculate DOB
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
          try {
            // Calculate DOB based on age
            const birthISO = AgeUtils.calculateBirthDate(age); // yyyy-mm-dd
            updated.dateOfBirth = birthISO;
          } catch (err) {
            console.error('Error calculating DOB from age:', err);
          }
        } else {
          updated.dateOfBirth = '';
        }

        return updated;
      });
    },
    [],
  );

  const handleGoBack = () => navigate('/');
  const handleSave = () => {
    // TODO: implement save
    // console.log('Form data:', formData);
  };

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
        <div className={styles.main}>
          <form className={styles.registrationForm}>
            <Tile className={styles.formSection}>
              <h2 className={styles.sectionTitle}>Patient Details</h2>
            </Tile>

            <Grid>
              <Column sm={4} md={8} lg={12} xlg={16}>
                <span>Basic Information</span>
              </Column>

              <Column sm={2} md={4} lg={6} xlg={8}>
                <Dropdown
                  id="patient-id-format"
                  titleText="Patient ID format"
                  label="Select format"
                  items={PATIENT_ID_FORMATS}
                  selectedItem={formData.patientIdFormat}
                  onChange={({ selectedItem }) =>
                    onFieldChange('patientIdFormat', selectedItem)
                  }
                />
              </Column>
              <Column sm={2} md={4} lg={6} xlg={8}>
                <CheckboxGroup legendText="Entry Type">
                  <Checkbox
                    id="enter-manually"
                    labelText="Enter Manually"
                    checked={formData.enterManually}
                    onChange={() =>
                      onFieldChange('enterManually', !formData.enterManually)
                    }
                  />
                </CheckboxGroup>
              </Column>

              {/* Row 2: Names */}
              <Column sm={2} md={3} lg={4} xlg={6}>
                <TextInput
                  id="first-name"
                  labelText="First name *"
                  required
                  value={formData.firstName}
                  onChange={(e) => onFieldChange('firstName', e.target.value)}
                />
              </Column>
              <Column sm={1} md={2} lg={4} xlg={6}>
                <TextInput
                  id="middle-name"
                  labelText="Middle name"
                  value={formData.middleName}
                  onChange={(e) => onFieldChange('middleName', e.target.value)}
                />
              </Column>
              <Column sm={1} md={3} lg={4} xlg={4}>
                <TextInput
                  id="last-name"
                  labelText="Last name *"
                  required
                  value={formData.lastName}
                  onChange={(e) => onFieldChange('lastName', e.target.value)}
                />
              </Column>

              {/* Row 3: Gender + Age */}
              <Column sm={1} md={2} lg={2} xlg={4}>
                <Dropdown
                  id="gender"
                  titleText="Gender"
                  label="Select"
                  items={GENDERS}
                  selectedItem={formData.gender}
                  onChange={({ selectedItem }) =>
                    onFieldChange('gender', selectedItem)
                  }
                />
              </Column>
              <Column sm={2} md={3} lg={2} xlg={3}>
                <TextInput
                  id="age-years"
                  labelText="Age (Years)"
                  type="number"
                  min={0}
                  max={120}
                  value={formData.ageYears}
                  onChange={(e) =>
                    handleAgeChange('ageYears', Number(e.target.value) || 0)
                  }
                />
              </Column>

              <Column sm={1} md={3} lg={2} xlg={3}>
                <TextInput
                  id="age-months"
                  labelText="Age (Months)"
                  type="number"
                  min={0}
                  max={12}
                  value={formData.ageMonths}
                  onChange={(e) =>
                    handleAgeChange('ageMonths', Number(e.target.value) || 0)
                  }
                />
              </Column>

              <Column sm={1} md={3} lg={2} xlg={3}>
                <TextInput
                  id="age-days"
                  labelText="Age (Days)"
                  type="number"
                  min={0}
                  max={31}
                  value={formData.ageDays}
                  onChange={(e) =>
                    handleAgeChange('ageDays', Number(e.target.value) || 0)
                  }
                />
              </Column>

              {/* Row 4: DOB + Estimated + Birth time */}
              <Column lg={4} md={4} sm={1}>
                <DatePicker
                  dateFormat="d/m/Y" // Display format
                  datePickerType="single"
                  value={
                    formData.dateOfBirth
                      ? [
                          parseDateStringToDate(
                            formatToDisplay(formData.dateOfBirth),
                          ),
                        ] // convert ISO → Date
                      : []
                  }
                  onChange={handleDateOfBirthChange}
                >
                  <DatePickerInput
                    id="dob"
                    labelText="Date of Birth"
                    placeholder="dd/mm/yyyy"
                  />
                </DatePicker>
              </Column>
              <Column lg={4} md={2} sm={1}>
                <CheckboxGroup legendText="Accuracy">
                  <Checkbox
                    id="dob-estimated"
                    labelText="Estimated"
                    checked={dobEstimated}
                    onChange={() => setDobEstimated(!dobEstimated)}
                  />
                </CheckboxGroup>
              </Column>
              <Column lg={6} md={4} sm={2}>
                <TimeSelector
                  labelText="Birth Time"
                  value={birthTime}
                  onChange={setBirthTime}
                />
              </Column>
            </Grid>

            <div className={styles.actionButtons}>
              <Button kind="secondary" onClick={handleGoBack}>
                Cancel
              </Button>
              <Button kind="primary" onClick={handleSave}>
                Save
              </Button>
            </div>
          </form>
        </div>
      }
    />
  );
};

export default CreatePatient;
