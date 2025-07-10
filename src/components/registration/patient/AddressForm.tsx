/**
 * Address Form
 * Third step of patient creation wizard - address information
 */
import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PatientFormData } from '../../../types/registration';
import { WizardContextValue } from './PatientFormWizardContext';

interface AddressFormProps {
  formData: PatientFormData;
  errors: Record<string, string>;
  updateField: (field: string, value: any) => void;
  wizard: WizardContextValue;
}

export const AddressForm: React.FC<AddressFormProps> = ({
  formData,
  errors,
  updateField,
  wizard,
}) => {
  const { t } = useTranslation();

  // Address is optional, so always valid for now
  const stepValidation = useMemo(() => {
    return { isValid: true, errors: [], isComplete: true };
  }, []);

  // Update wizard validation when step validation changes
  useEffect(() => {
    wizard.actions.setStepValidation('address', stepValidation);
  }, [stepValidation, wizard.actions]);

  const updateAddress = (field: string, value: string) => {
    const currentAddress = formData.address || {};
    updateField('address', { ...currentAddress, [field]: value });
  };

  return (
    <div className="address-form">
      <div className="address-form__section">
        <h3 className="address-form__section-title">
          {t('registration.patient.address.title')}
        </h3>
        <p className="address-form__description">
          {t('registration.patient.address.description')}
        </p>

        <div className="address-form__row">
          <div className="address-form__field">
            <label htmlFor="address1" className="address-form__label">
              {t('registration.patient.address.address1')}
            </label>
            <input
              type="text"
              id="address1"
              className="address-form__input"
              value={formData.address?.address1 || ''}
              onChange={(e) => updateAddress('address1', e.target.value)}
              placeholder={t('registration.patient.address.address1Placeholder')}
            />
          </div>
        </div>

        <div className="address-form__row">
          <div className="address-form__field">
            <label htmlFor="cityVillage" className="address-form__label">
              {t('registration.patient.address.city')}
            </label>
            <input
              type="text"
              id="cityVillage"
              className="address-form__input"
              value={formData.address?.cityVillage || ''}
              onChange={(e) => updateAddress('cityVillage', e.target.value)}
              placeholder={t('registration.patient.address.cityPlaceholder')}
            />
          </div>
          <div className="address-form__field">
            <label htmlFor="stateProvince" className="address-form__label">
              {t('registration.patient.address.state')}
            </label>
            <input
              type="text"
              id="stateProvince"
              className="address-form__input"
              value={formData.address?.stateProvince || ''}
              onChange={(e) => updateAddress('stateProvince', e.target.value)}
              placeholder={t('registration.patient.address.statePlaceholder')}
            />
          </div>
        </div>

        <div className="address-form__row">
          <div className="address-form__field">
            <label htmlFor="country" className="address-form__label">
              {t('registration.patient.address.country')}
            </label>
            <input
              type="text"
              id="country"
              className="address-form__input"
              value={formData.address?.country || ''}
              onChange={(e) => updateAddress('country', e.target.value)}
              placeholder={t('registration.patient.address.countryPlaceholder')}
            />
          </div>
          <div className="address-form__field">
            <label htmlFor="postalCode" className="address-form__label">
              {t('registration.patient.address.postalCode')}
            </label>
            <input
              type="text"
              id="postalCode"
              className="address-form__input"
              value={formData.address?.postalCode || ''}
              onChange={(e) => updateAddress('postalCode', e.target.value)}
              placeholder={t('registration.patient.address.postalCodePlaceholder')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressForm;
