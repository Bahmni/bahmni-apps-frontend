import {
  BaseLayout,
  Button,
  Tile,
  TextInput,
  Dropdown,
  Checkbox,
  NumberInput,
  DatePicker,
  DatePickerInput,
  Grid,
  Column,
  CheckboxGroup,
  TimePicker,
  TimePickerSelect,
} from '@bahmni-frontend/bahmni-design-system';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './styles/index.module.scss';

//TODO: add service for reading bahmni configuration for patient id formats
const PATIENT_ID_FORMATS = ['ABC', 'XYZ'];
const GENDERS = ['Male', 'Female', 'Other'];

const NewPatientRegistrationPage: React.FC = () => {
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

  const onFieldChange = (field: string, value: string | number | boolean) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleGoBack = () => navigate('/');
  const handleSave = () => {
    // TODO: implement save
    // console.log('Form data:', formData);
  };

  return (
    <BaseLayout
      header={
        //TODO: header needs to be replaced with actual header component
        <div className={styles.customHeader}>
          <div className={styles.headerContent}>
            <div className={styles.breadcrumbSection}>
              <nav className={styles.breadcrumb}>
                <span className={styles.breadcrumbSeparator}>/</span>
                <span className={styles.breadcrumbCurrent}>Search patient</span>
              </nav>
            </div>
            <div className={styles.rightActions}>
              <div className={styles.profileSection}>
                <div className={styles.userAvatar} />
                <span className={styles.profileText}>Hi, Profile name</span>
              </div>
            </div>
          </div>
        </div>
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

              {/* Row 1: Photo + ID */}
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
              <Column sm={1} md={2} lg={2} xlg={4}>
                <NumberInput
                  id="age-years"
                  label="Age (Years)"
                  min={0}
                  max={120}
                  value={formData.ageYears}
                  onChange={(e) =>
                    onFieldChange('ageYears', e.imaginaryTarget.value)
                  }
                />
              </Column>
              <Column sm={1} md={2} lg={2} xlg={4}>
                <NumberInput
                  id="age-months"
                  label="Age (Months)"
                  min={0}
                  max={11}
                  value={formData.ageMonths}
                  onChange={(e) =>
                    onFieldChange('ageMonths', e.imaginaryTarget.value)
                  }
                />
              </Column>
              <Column sm={1} md={2} lg={2} xlg={4}>
                <NumberInput
                  id="age-days"
                  label="Age (Days)"
                  min={0}
                  max={31}
                  value={formData.ageDays}
                  onChange={(e) =>
                    onFieldChange('ageDays', e.imaginaryTarget.value)
                  }
                />
              </Column>

              {/* Row 4: DOB + Estimated + Birth time */}
              <Column lg={4} md={4} sm={1}>
                <DatePicker dateFormat="d/m/Y" datePickerType="single">
                  <DatePickerInput
                    id="dob"
                    labelText="Date of birth"
                    placeholder="dd/mm/yyyy"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      onFieldChange('dateOfBirth', e.target.value)
                    }
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
              <Column lg={4} md={2} sm={2}>
                <TimePicker
                  id="birth-time"
                  labelText="Birth time"
                  value={formData.birthTime}
                  onChange={(e) => onFieldChange('birthTime', e.target.value)}
                >
                  <TimePickerSelect id="time-suffix">
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </TimePickerSelect>
                </TimePicker>
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

export default NewPatientRegistrationPage;
