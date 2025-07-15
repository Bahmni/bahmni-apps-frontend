import React from 'react';
import { useTranslation } from 'react-i18next';
import { Column, Grid, TextInput } from '@carbon/react';
import { PatientOtherInfo } from '../../../types/registration';
import Section from '../Section';

interface PatientOtherInfoSectionProps {
  data: PatientOtherInfo;
  onChange: (data: PatientOtherInfo) => void;
  disabled?: boolean;
}

const PatientOtherInfoSection: React.FC<PatientOtherInfoSectionProps> = ({
  data,
  onChange,
  disabled,
}) => {
  const { t } = useTranslation();

  const handleChange = (field: keyof PatientOtherInfo, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <Section title={t('REGISTRATION_SECTION_OTHER_INFO')}>
      <Grid>
        <Column lg={8} md={4} sm={4}>
          <TextInput
            id="phone-number"
            labelText={t('REGISTRATION_FIELD_PHONE_NUMBER')}
            value={data.phoneNumber || ''}
            onChange={(e) => handleChange('phoneNumber', e.target.value)}
            disabled={disabled}
          />
        </Column>
        <Column lg={8} md={4} sm={4}>
          <TextInput
            id="alternate-phone-number"
            labelText={t('REGISTRATION_FIELD_ALT_PHONE_NUMBER')}
            value={data.alternatePhoneNumber || ''}
            onChange={(e) =>
              handleChange('alternatePhoneNumber', e.target.value)
            }
            disabled={disabled}
          />
        </Column>
      </Grid>
    </Section>
  );
};

export default PatientOtherInfoSection;
