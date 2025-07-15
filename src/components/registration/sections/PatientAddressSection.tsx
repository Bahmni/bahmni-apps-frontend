/**
 * Patient Address Section Component
 *
 * Handles address fields including address lines, city, state, postal code, and country.
 * Based on the address fields structure from the AngularJS implementation.
 */

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput, FormGroup, Stack, Grid, Column } from '@carbon/react';
import {
  PatientAddress,
  ValidationError,
  RegistrationConfig,
} from '@types/registration';
import { getFieldError, hasFieldError } from '@utils/registrationValidation';
import * as styles from './styles/PatientAddressSection.module.scss';

interface PatientAddressSectionProps {
  data: PatientAddress;
  onChange: (address: PatientAddress) => void;
  errors: ValidationError[];
  disabled?: boolean;
  config?: RegistrationConfig;
  addressLevels?: string[];
  showAddressFieldsTopDown?: boolean;
}

const PatientAddressSection: React.FC<PatientAddressSectionProps> = ({
  data,
  onChange,
  errors,
  disabled = false,
  config,
  addressLevels = [],
  showAddressFieldsTopDown = false,
}) => {
  const { t } = useTranslation();

  /**
   * Handle address field changes
   */
  const handleAddressChange = useCallback(
    (field: keyof PatientAddress, value: string) => {
      onChange({
        ...data,
        [field]: value,
      });
    },
    [data, onChange],
  );

  /**
   * Handle address line 1 change
   */
  const handleAddress1Change = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleAddressChange('address1', event.target.value);
    },
    [handleAddressChange],
  );

  /**
   * Handle address line 2 change
   */
  const handleAddress2Change = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleAddressChange('address2', event.target.value);
    },
    [handleAddressChange],
  );

  /**
   * Handle city/village change
   */
  const handleCityVillageChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleAddressChange('cityVillage', event.target.value);
    },
    [handleAddressChange],
  );

  /**
   * Handle state/province change
   */
  const handleStateProvinceChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleAddressChange('stateProvince', event.target.value);
    },
    [handleAddressChange],
  );

  /**
   * Handle postal code change
   */
  const handlePostalCodeChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleAddressChange('postalCode', event.target.value);
    },
    [handleAddressChange],
  );

  /**
   * Handle country change
   */
  const handleCountryChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleAddressChange('country', event.target.value);
    },
    [handleAddressChange],
  );

  // Get field errors
  const address1Error = getFieldError('address.address1', errors);
  const address2Error = getFieldError('address.address2', errors);
  const cityVillageError = getFieldError('address.cityVillage', errors);
  const stateProvinceError = getFieldError('address.stateProvince', errors);
  const postalCodeError = getFieldError('address.postalCode', errors);
  const countryError = getFieldError('address.country', errors);

  const hasAddress1Error = hasFieldError('address.address1', errors);
  const hasAddress2Error = hasFieldError('address.address2', errors);
  const hasCityVillageError = hasFieldError('address.cityVillage', errors);
  const hasStateProvinceError = hasFieldError('address.stateProvince', errors);
  const hasPostalCodeError = hasFieldError('address.postalCode', errors);
  const hasCountryError = hasFieldError('address.country', errors);

  /**
   * Render address hierarchy fields if configured
   */
  const renderAddressHierarchyFields = () => {
    if (!addressLevels || addressLevels.length === 0) {
      return null;
    }

    // This would be implemented based on the specific address hierarchy configuration
    // For now, we'll render a placeholder
    return (
      <div className={styles.addressHierarchy}>
        <p className={styles.hierarchyNote}>
          {t('REGISTRATION_ADDRESS_HIERARCHY_CONFIGURED')}
        </p>
        {/* Address hierarchy fields would be rendered here based on configuration */}
      </div>
    );
  };

  /**
   * Render standard address fields
   */
  const renderStandardAddressFields = () => {
    const fields = [
      {
        id: 'address1',
        label: 'REGISTRATION_LABEL_ADDRESS_LINE_1',
        value: data.address1 || '',
        onChange: handleAddress1Change,
        error: address1Error,
        hasError: hasAddress1Error,
        required: false,
        colSize: { sm: 4, md: 8, lg: 8 },
      },
      {
        id: 'address2',
        label: 'REGISTRATION_LABEL_ADDRESS_LINE_2',
        value: data.address2 || '',
        onChange: handleAddress2Change,
        error: address2Error,
        hasError: hasAddress2Error,
        required: false,
        colSize: { sm: 4, md: 8, lg: 8 },
      },
      {
        id: 'cityVillage',
        label: 'REGISTRATION_LABEL_CITY_VILLAGE',
        value: data.cityVillage || '',
        onChange: handleCityVillageChange,
        error: cityVillageError,
        hasError: hasCityVillageError,
        required: false,
        colSize: { sm: 4, md: 4, lg: 4 },
      },
      {
        id: 'stateProvince',
        label: 'REGISTRATION_LABEL_STATE_PROVINCE',
        value: data.stateProvince || '',
        onChange: handleStateProvinceChange,
        error: stateProvinceError,
        hasError: hasStateProvinceError,
        required: false,
        colSize: { sm: 4, md: 4, lg: 4 },
      },
      {
        id: 'postalCode',
        label: 'REGISTRATION_LABEL_POSTAL_CODE',
        value: data.postalCode || '',
        onChange: handlePostalCodeChange,
        error: postalCodeError,
        hasError: hasPostalCodeError,
        required: false,
        colSize: { sm: 4, md: 2, lg: 2 },
      },
      {
        id: 'country',
        label: 'REGISTRATION_LABEL_COUNTRY',
        value: data.country || '',
        onChange: handleCountryChange,
        error: countryError,
        hasError: hasCountryError,
        required: false,
        colSize: { sm: 4, md: 2, lg: 2 },
      },
    ];

    return (
      <Grid className={styles.addressGrid}>
        {fields.map((field) => (
          <Column key={field.id} {...field.colSize}>
            <TextInput
              id={field.id}
              labelText={t(field.label)}
              placeholder={t(field.label)}
              value={field.value}
              onChange={field.onChange}
              disabled={disabled}
              invalid={field.hasError}
              invalidText={field.error}
              required={field.required}
            />
          </Column>
        ))}
      </Grid>
    );
  };

  /**
   * Generate address preview
   */
  const generateAddressPreview = () => {
    const addressParts = [
      data.address1,
      data.address2,
      data.cityVillage,
      data.stateProvince,
      data.postalCode,
      data.country,
    ].filter(Boolean);

    return addressParts.length > 0
      ? addressParts.join(', ')
      : t('REGISTRATION_LABEL_ADDRESS_NOT_COMPLETE');
  };

  return (
    <div className={styles.addressSection}>
      <FormGroup legendText={t('REGISTRATION_LABEL_ADDRESS_INFO')}>
        <Stack gap={5}>
          {/* Address Hierarchy Fields (if configured) */}
          {addressLevels.length > 0 && renderAddressHierarchyFields()}

          {/* Standard Address Fields */}
          <div className={styles.standardAddressFields}>
            {showAddressFieldsTopDown ? (
              // Render fields in top-down order (country -> state -> city -> address)
              <div className={styles.topDownFields}>
                <Grid className={styles.addressGrid}>
                  <Column sm={4} md={4} lg={4}>
                    <TextInput
                      id="country"
                      labelText={t('REGISTRATION_LABEL_COUNTRY')}
                      placeholder={t('REGISTRATION_LABEL_COUNTRY')}
                      value={data.country || ''}
                      onChange={handleCountryChange}
                      disabled={disabled}
                      invalid={hasCountryError}
                      invalidText={countryError}
                    />
                  </Column>
                  <Column sm={4} md={4} lg={4}>
                    <TextInput
                      id="stateProvince"
                      labelText={t('REGISTRATION_LABEL_STATE_PROVINCE')}
                      placeholder={t('REGISTRATION_LABEL_STATE_PROVINCE')}
                      value={data.stateProvince || ''}
                      onChange={handleStateProvinceChange}
                      disabled={disabled}
                      invalid={hasStateProvinceError}
                      invalidText={stateProvinceError}
                    />
                  </Column>
                  <Column sm={4} md={4} lg={4}>
                    <TextInput
                      id="cityVillage"
                      labelText={t('REGISTRATION_LABEL_CITY_VILLAGE')}
                      placeholder={t('REGISTRATION_LABEL_CITY_VILLAGE')}
                      value={data.cityVillage || ''}
                      onChange={handleCityVillageChange}
                      disabled={disabled}
                      invalid={hasCityVillageError}
                      invalidText={cityVillageError}
                    />
                  </Column>
                  <Column sm={4} md={6} lg={6}>
                    <TextInput
                      id="address1"
                      labelText={t('REGISTRATION_LABEL_ADDRESS_LINE_1')}
                      placeholder={t('REGISTRATION_LABEL_ADDRESS_LINE_1')}
                      value={data.address1 || ''}
                      onChange={handleAddress1Change}
                      disabled={disabled}
                      invalid={hasAddress1Error}
                      invalidText={address1Error}
                    />
                  </Column>
                  <Column sm={4} md={6} lg={6}>
                    <TextInput
                      id="address2"
                      labelText={t('REGISTRATION_LABEL_ADDRESS_LINE_2')}
                      placeholder={t('REGISTRATION_LABEL_ADDRESS_LINE_2')}
                      value={data.address2 || ''}
                      onChange={handleAddress2Change}
                      disabled={disabled}
                      invalid={hasAddress2Error}
                      invalidText={address2Error}
                    />
                  </Column>
                  <Column sm={4} md={4} lg={4}>
                    <TextInput
                      id="postalCode"
                      labelText={t('REGISTRATION_LABEL_POSTAL_CODE')}
                      placeholder={t('REGISTRATION_LABEL_POSTAL_CODE')}
                      value={data.postalCode || ''}
                      onChange={handlePostalCodeChange}
                      disabled={disabled}
                      invalid={hasPostalCodeError}
                      invalidText={postalCodeError}
                    />
                  </Column>
                </Grid>
              </div>
            ) : (
              // Render fields in standard order (address -> city -> state -> country)
              renderStandardAddressFields()
            )}
          </div>

          {/* Address Preview */}
          <div className={styles.addressPreview}>
            <label className={styles.previewLabel}>
              {t('REGISTRATION_LABEL_ADDRESS_PREVIEW')}
            </label>
            <div className={styles.previewValue}>
              {generateAddressPreview()}
            </div>
          </div>
        </Stack>
      </FormGroup>
    </div>
  );
};

export default PatientAddressSection;
