/**
 * Address Form
 * Third step of patient creation wizard - address information with hierarchical selection
 */
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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

  const handleCountryChange = useCallback((countryUuid: string) => {
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

  const handleStateChange = useCallback((stateUuid: string) => {
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

  const handleCityChange = useCallback((cityUuid: string) => {
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
    <div className="address-form">
      <div className="address-form__section">
        <h3 className="address-form__section-title">
          {t('registration.patient.address.title')}
        </h3>
        <p className="address-form__description">
          {t('registration.patient.address.description')}
        </p>

        {/* Mode Toggle */}
        <div className="address-form__mode-toggle">
          <label className="address-form__toggle-label">
            <input
              type="checkbox"
              className="address-form__toggle-checkbox"
              checked={hierarchyMode}
              onChange={toggleHierarchyMode}
            />
            <span className="address-form__toggle-text">
              {t('registration.patient.address.useHierarchy')}
            </span>
          </label>
          <p className="address-form__toggle-help">
            {hierarchyMode
              ? t('registration.patient.address.hierarchyModeHelp')
              : t('registration.patient.address.manualModeHelp')
            }
          </p>
        </div>

        {/* Address Lines */}
        <div className="address-form__group">
          <h4 className="address-form__group-title">
            {t('registration.patient.address.addressLines')}
          </h4>

          <div className="address-form__row">
            <div className="address-form__field">
              <label htmlFor="address1" className="address-form__label">
                {t('registration.patient.address.address1')}
              </label>
              <input
                type="text"
                id="address1"
                className="address-form__input"
                value={formData.address.address1 || ''}
                onChange={(e) => updateAddress('address1', e.target.value)}
                placeholder={t('registration.patient.address.address1Placeholder')}
              />
            </div>
          </div>

          <div className="address-form__row">
            <div className="address-form__field">
              <label htmlFor="address2" className="address-form__label">
                {t('registration.patient.address.address2')}
              </label>
              <input
                type="text"
                id="address2"
                className="address-form__input"
                value={formData.address.address2 || ''}
                onChange={(e) => updateAddress('address2', e.target.value)}
                placeholder={t('registration.patient.address.address2Placeholder')}
              />
            </div>
          </div>
        </div>

        {/* Geographic Information */}
        <div className="address-form__group">
          <h4 className="address-form__group-title">
            {t('registration.patient.address.geographic')}
          </h4>

          {hierarchyMode ? (
            // Hierarchical Selection Mode
            <>
              <div className="address-form__row">
                <div className="address-form__field">
                  <label htmlFor="country-select" className="address-form__label">
                    {t('registration.patient.address.country')}
                  </label>
                  <select
                    id="country-select"
                    className="address-form__select"
                    value={selectedCountry}
                    onChange={(e) => handleCountryChange(e.target.value)}
                  >
                    <option value="">{t('registration.patient.address.selectCountry')}</option>
                    {addressHierarchy.map((country) => (
                      <option key={country.uuid} value={country.uuid}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {availableStates.length > 0 && (
                <div className="address-form__row">
                  <div className="address-form__field">
                    <label htmlFor="state-select" className="address-form__label">
                      {t('registration.patient.address.state')}
                    </label>
                    <select
                      id="state-select"
                      className={`address-form__select ${fieldErrors['stateProvince'] ? 'address-form__select--error' : ''}`}
                      value={selectedState}
                      onChange={(e) => handleStateChange(e.target.value)}
                      disabled={!selectedCountry}
                    >
                      <option value="">{t('registration.patient.address.selectState')}</option>
                      {availableStates.map((state) => (
                        <option key={state.uuid} value={state.uuid}>
                          {state.name}
                        </option>
                      ))}
                    </select>
                    {fieldErrors['stateProvince'] && (
                      <div className="address-form__field-error" role="alert">
                        {fieldErrors['stateProvince']}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {availableCities.length > 0 && (
                <div className="address-form__row">
                  <div className="address-form__field">
                    <label htmlFor="city-select" className="address-form__label">
                      {t('registration.patient.address.city')}
                    </label>
                    <select
                      id="city-select"
                      className={`address-form__select ${fieldErrors['cityVillage'] ? 'address-form__select--error' : ''}`}
                      value={selectedCity}
                      onChange={(e) => handleCityChange(e.target.value)}
                      disabled={!selectedState}
                    >
                      <option value="">{t('registration.patient.address.selectCity')}</option>
                      {availableCities.map((city) => (
                        <option key={city.uuid} value={city.uuid}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                    {fieldErrors['cityVillage'] && (
                      <div className="address-form__field-error" role="alert">
                        {fieldErrors['cityVillage']}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            // Manual Entry Mode
            <>
              <div className="address-form__row">
                <div className="address-form__field">
                  <label htmlFor="country-manual" className="address-form__label">
                    {t('registration.patient.address.country')}
                  </label>
                  <input
                    type="text"
                    id="country-manual"
                    className="address-form__input"
                    value={formData.address.country || ''}
                    onChange={(e) => updateAddress('country', e.target.value)}
                    placeholder={t('registration.patient.address.countryPlaceholder')}
                  />
                </div>
              </div>

              <div className="address-form__row">
                <div className="address-form__field">
                  <label htmlFor="state-manual" className="address-form__label">
                    {t('registration.patient.address.state')}
                  </label>
                  <input
                    type="text"
                    id="state-manual"
                    className="address-form__input"
                    value={formData.address.stateProvince || ''}
                    onChange={(e) => updateAddress('stateProvince', e.target.value)}
                    placeholder={t('registration.patient.address.statePlaceholder')}
                  />
                </div>
                <div className="address-form__field">
                  <label htmlFor="city-manual" className="address-form__label">
                    {t('registration.patient.address.city')}
                  </label>
                  <input
                    type="text"
                    id="city-manual"
                    className="address-form__input"
                    value={formData.address.cityVillage || ''}
                    onChange={(e) => updateAddress('cityVillage', e.target.value)}
                    placeholder={t('registration.patient.address.cityPlaceholder')}
                  />
                </div>
              </div>
            </>
          )}

          <div className="address-form__row">
            <div className="address-form__field">
              <label htmlFor="postalCode" className="address-form__label">
                {t('registration.patient.address.postalCode')}
              </label>
              <input
                type="text"
                id="postalCode"
                className={`address-form__input ${fieldErrors['postalCode'] ? 'address-form__input--error' : ''}`}
                value={formData.address.postalCode || ''}
                onChange={(e) => updateAddress('postalCode', e.target.value)}
                placeholder={t('registration.patient.address.postalCodePlaceholder')}
              />
              {fieldErrors['postalCode'] && (
                <div className="address-form__field-error" role="alert">
                  {fieldErrors['postalCode']}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Address Preview */}
        {getAddressPreview && (
          <div className="address-form__preview">
            <h4 className="address-form__preview-title">
              {t('registration.patient.address.preview')}
            </h4>
            <div className="address-form__preview-content">
              {getAddressPreview}
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {stepValidation.errors.length > 0 && (
          <div className="address-form__validation-summary" role="alert">
            <h4 className="address-form__validation-title">
              {t('registration.patient.address.validationErrors')}
            </h4>
            <ul className="address-form__validation-list">
              {stepValidation.errors.map((error, index) => (
                <li key={index} className="address-form__validation-item">
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressForm;
