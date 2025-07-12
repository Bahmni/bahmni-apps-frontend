/**
 * Address Form
 * Third step of patient creation wizard - address information with hierarchical selection
 */
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Stack,
  Grid,
  Column,
  TextInput,
  Select,
  SelectItem,
  Toggle,
  Heading,
  InlineNotification,
  Layer,
} from '@carbon/react';
import { PatientFormData, AddressLevel } from '../../../types/registration';
import { WizardContextValue } from './PatientFormWizardContext';

interface AddressFormProps {
  formData: PatientFormData;
  errors: Record<string, string>;
  updateField: (field: string, value: any) => void;
  wizard: WizardContextValue;
}

// Mock address hierarchy data - in real implementation, this would come from the service
const MOCK_ADDRESS_HIERARCHY: AddressLevel[] = [
  {
    uuid: 'country-1',
    name: 'United States',
    level: 1,
    children: [
      {
        uuid: 'state-1',
        name: 'California',
        level: 2,
        parent: 'country-1',
        children: [
          {
            uuid: 'city-1',
            name: 'San Francisco',
            level: 3,
            parent: 'state-1',
          },
          {
            uuid: 'city-2',
            name: 'Los Angeles',
            level: 3,
            parent: 'state-1',
          },
        ],
      },
      {
        uuid: 'state-2',
        name: 'New York',
        level: 2,
        parent: 'country-1',
        children: [
          {
            uuid: 'city-3',
            name: 'New York City',
            level: 3,
            parent: 'state-2',
          },
        ],
      },
    ],
  },
  {
    uuid: 'country-2',
    name: 'India',
    level: 1,
    children: [
      {
        uuid: 'state-3',
        name: 'Karnataka',
        level: 2,
        parent: 'country-2',
        children: [
          {
            uuid: 'city-4',
            name: 'Bangalore',
            level: 3,
            parent: 'state-3',
          },
        ],
      },
    ],
  },
];

export const AddressForm: React.FC<AddressFormProps> = ({
  formData,
  errors,
  updateField,
  wizard,
}) => {
  const { t } = useTranslation();
  const [addressHierarchy] = useState<AddressLevel[]>(MOCK_ADDRESS_HIERARCHY);
  const [hierarchyMode, setHierarchyMode] = useState<boolean>(true);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Initialize address if empty
  useEffect(() => {
    if (!formData.address) {
      updateField('address', {
        address1: '',
        address2: '',
        cityVillage: '',
        stateProvince: '',
        country: '',
        postalCode: '',
        countyDistrict: '',
        preferred: true,
      });
    }
  }, [formData.address, updateField]);

  // Get available states based on selected country
  const availableStates = useMemo(() => {
    if (!selectedCountry) return [];
    const country = addressHierarchy.find(c => c.uuid === selectedCountry);
    return country?.children || [];
  }, [selectedCountry, addressHierarchy]);

  // Get available cities based on selected state
  const availableCities = useMemo(() => {
    if (!selectedState) return [];
    const state = availableStates.find(s => s.uuid === selectedState);
    return state?.children || [];
  }, [selectedState, availableStates]);

  // Validate address fields
  const stepValidation = useMemo(() => {
    const stepErrors: string[] = [];
    const newFieldErrors: Record<string, string> = {};
    let isValid = true;
    let isComplete = true;

    // Address is optional, but if started, some fields should be validated
    if (formData.address && (formData.address.address1 || formData.address.cityVillage || formData.address.country)) {
      // If address is being filled, validate postal code format (basic validation)
      if (formData.address.postalCode) {
        const postalCodeRegex = /^[A-Za-z0-9\s-]{3,10}$/;
        if (!postalCodeRegex.test(formData.address.postalCode)) {
          const error = t('registration.patient.address.validation.invalidPostalCode');
          newFieldErrors['postalCode'] = error;
          stepErrors.push(error);
          isValid = false;
        }
      }

      // In hierarchy mode, validate selections if country is chosen
      if (hierarchyMode && selectedCountry) {
        if (!selectedState && availableStates.length > 0) {
          const error = t('registration.patient.address.validation.stateRequired');
          newFieldErrors['stateProvince'] = error;
          stepErrors.push(error);
          isValid = false;
        }
        if (selectedState && !selectedCity && availableCities.length > 0) {
          const error = t('registration.patient.address.validation.cityRequired');
          newFieldErrors['cityVillage'] = error;
          stepErrors.push(error);
          isValid = false;
        }
      }
    }

    setFieldErrors(newFieldErrors);
    return { isValid, errors: stepErrors, isComplete };
  }, [formData.address, hierarchyMode, selectedCountry, selectedState, availableStates, availableCities, t]);

  // Update wizard validation when step validation changes
  useEffect(() => {
    wizard.actions.setStepValidation('address', stepValidation);
  }, [stepValidation, wizard.actions]);

  const updateAddress = useCallback((field: string, value: string) => {
    const currentAddress = formData.address || {};
    updateField('address', { ...currentAddress, [field]: value });
  }, [formData.address, updateField]);

  const handleCountryChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const countryUuid = event.target.value;
    setSelectedCountry(countryUuid);
    setSelectedState('');
    setSelectedCity('');

    if (countryUuid) {
      const country = addressHierarchy.find(c => c.uuid === countryUuid);
      updateAddress('country', country?.name || '');
      updateAddress('stateProvince', '');
      updateAddress('cityVillage', '');
    } else {
      updateAddress('country', '');
      updateAddress('stateProvince', '');
      updateAddress('cityVillage', '');
    }
  }, [addressHierarchy, updateAddress]);

  const handleStateChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const stateUuid = event.target.value;
    setSelectedState(stateUuid);
    setSelectedCity('');

    if (stateUuid) {
      const state = availableStates.find(s => s.uuid === stateUuid);
      updateAddress('stateProvince', state?.name || '');
      updateAddress('cityVillage', '');
    } else {
      updateAddress('stateProvince', '');
      updateAddress('cityVillage', '');
    }
  }, [availableStates, updateAddress]);

  const handleCityChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const cityUuid = event.target.value;
    setSelectedCity(cityUuid);

    if (cityUuid) {
      const city = availableCities.find(c => c.uuid === cityUuid);
      updateAddress('cityVillage', city?.name || '');
    } else {
      updateAddress('cityVillage', '');
    }
  }, [availableCities, updateAddress]);

  const toggleHierarchyMode = useCallback(() => {
    setHierarchyMode(!hierarchyMode);
    if (!hierarchyMode) {
      // Switching to hierarchy mode - clear manual entries
      setSelectedCountry('');
      setSelectedState('');
      setSelectedCity('');
    }
  }, [hierarchyMode]);

  const getAddressPreview = useMemo(() => {
    const address = formData.address;
    if (!address) return '';

    const parts = [
      address.address1,
      address.address2,
      address.cityVillage,
      address.stateProvince,
      address.country,
      address.postalCode,
    ].filter(Boolean);

    return parts.join(', ');
  }, [formData.address]);

  if (!formData.address) {
    return null;
  }

  return (
    <Stack gap={6}>
      <Layer>
        <Stack gap={5}>
          <Heading>
            {t('registration.patient.address.title')}
          </Heading>
          <p style={{ marginBottom: '1rem', color: '#525252' }}>
            {t('registration.patient.address.description')}
          </p>

          {/* Mode Toggle */}
          <Toggle
            id="hierarchy-mode-toggle"
            toggled={hierarchyMode}
            onToggle={toggleHierarchyMode}
            labelA={t('registration.patient.address.manualModeHelp')}
            labelB={t('registration.patient.address.hierarchyModeHelp')}
            labelText={t('registration.patient.address.useHierarchy')}
          />
        </Stack>
      </Layer>

      <Layer>
        <Stack gap={5}>
          <h3>{t('registration.patient.address.addressLines')}</h3>
          <Grid>
            <Column md={4} lg={8}>
              <TextInput
                id="address1"
                labelText={t('registration.patient.address.address1')}
                value={formData.address.address1 || ''}
                onChange={(e) => updateAddress('address1', e.target.value)}
                placeholder={t('registration.patient.address.address1Placeholder')}
              />
            </Column>
            <Column md={4} lg={8}>
              <TextInput
                id="address2"
                labelText={t('registration.patient.address.address2')}
                value={formData.address.address2 || ''}
                onChange={(e) => updateAddress('address2', e.target.value)}
                placeholder={t('registration.patient.address.address2Placeholder')}
              />
            </Column>
          </Grid>
        </Stack>
      </Layer>

      <Layer>
        <Stack gap={5}>
          <h3>{t('registration.patient.address.geographic')}</h3>
          <Grid>
            {hierarchyMode ? (
              // Hierarchical Selection Mode
              <>
                <Column md={4} lg={8}>
                  <Select
                    id="country-select"
                    labelText={t('registration.patient.address.country')}
                    value={selectedCountry}
                    onChange={handleCountryChange}
                  >
                    <SelectItem value="" text={t('registration.patient.address.selectCountry')} />
                    {addressHierarchy.map((country) => (
                      <SelectItem key={country.uuid} value={country.uuid} text={country.name} />
                    ))}
                  </Select>
                </Column>

                {availableStates.length > 0 && (
                  <Column md={4} lg={8}>
                    <Select
                      id="state-select"
                      labelText={t('registration.patient.address.state')}
                      value={selectedState}
                      onChange={handleStateChange}
                      disabled={!selectedCountry}
                      invalid={!!fieldErrors['stateProvince']}
                      invalidText={fieldErrors['stateProvince']}
                    >
                      <SelectItem value="" text={t('registration.patient.address.selectState')} />
                      {availableStates.map((state) => (
                        <SelectItem key={state.uuid} value={state.uuid} text={state.name} />
                      ))}
                    </Select>
                  </Column>
                )}

                {availableCities.length > 0 && (
                  <Column md={4} lg={8}>
                    <Select
                      id="city-select"
                      labelText={t('registration.patient.address.city')}
                      value={selectedCity}
                      onChange={handleCityChange}
                      disabled={!selectedState}
                      invalid={!!fieldErrors['cityVillage']}
                      invalidText={fieldErrors['cityVillage']}
                    >
                      <SelectItem value="" text={t('registration.patient.address.selectCity')} />
                      {availableCities.map((city) => (
                        <SelectItem key={city.uuid} value={city.uuid} text={city.name} />
                      ))}
                    </Select>
                  </Column>
                )}
              </>
            ) : (
              // Manual Entry Mode
              <>
                <Column md={4} lg={8}>
                  <TextInput
                    id="country-manual"
                    labelText={t('registration.patient.address.country')}
                    value={formData.address.country || ''}
                    onChange={(e) => updateAddress('country', e.target.value)}
                    placeholder={t('registration.patient.address.countryPlaceholder')}
                  />
                </Column>
                <Column md={4} lg={4}>
                  <TextInput
                    id="state-manual"
                    labelText={t('registration.patient.address.state')}
                    value={formData.address.stateProvince || ''}
                    onChange={(e) => updateAddress('stateProvince', e.target.value)}
                    placeholder={t('registration.patient.address.statePlaceholder')}
                  />
                </Column>
                <Column md={4} lg={4}>
                  <TextInput
                    id="city-manual"
                    labelText={t('registration.patient.address.city')}
                    value={formData.address.cityVillage || ''}
                    onChange={(e) => updateAddress('cityVillage', e.target.value)}
                    placeholder={t('registration.patient.address.cityPlaceholder')}
                  />
                </Column>
              </>
            )}

            <Column md={4} lg={8}>
              <TextInput
                id="postalCode"
                labelText={t('registration.patient.address.postalCode')}
                value={formData.address.postalCode || ''}
                onChange={(e) => updateAddress('postalCode', e.target.value)}
                placeholder={t('registration.patient.address.postalCodePlaceholder')}
                invalid={!!fieldErrors['postalCode']}
                invalidText={fieldErrors['postalCode']}
              />
            </Column>
          </Grid>
        </Stack>
      </Layer>

      {/* Address Preview */}
      {getAddressPreview && (
        <Layer>
          <Stack gap={5}>
            <h3>{t('registration.patient.address.preview')}</h3>
            <div style={{ padding: '1rem', backgroundColor: '#f4f4f4', borderRadius: '4px' }}>
              {getAddressPreview}
            </div>
          </Stack>
        </Layer>
      )}

      {/* Validation Errors */}
      {stepValidation.errors.length > 0 && (
        <InlineNotification
          kind="error"
          title={t('registration.patient.address.validationErrors')}
          subtitle=""
          hideCloseButton
          lowContrast
        >
          <ul style={{ margin: 0, paddingLeft: '1rem' }}>
            {stepValidation.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </InlineNotification>
      )}
    </Stack>
  );
};

export default AddressForm;
