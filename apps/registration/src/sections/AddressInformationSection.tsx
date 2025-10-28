import { TextInput } from '@bahmni-frontend/bahmni-design-system';
import {
  useTranslation,
  type AddressHierarchyEntry,
} from '@bahmni-frontend/bahmni-services';
import type { AddressErrors } from '../models/address';
import type { PatientFormData } from '../models/patientForm';
import styles from '../pages/createPatientPage/styles/index.module.scss';

interface AddressInformationSectionProps {
  formData: PatientFormData;
  suggestions: {
    district: AddressHierarchyEntry[];
    state: AddressHierarchyEntry[];
    pincode: AddressHierarchyEntry[];
  };
  showSuggestions: {
    district: boolean;
    state: boolean;
    pincode: boolean;
  };
  addressErrors: AddressErrors;
  onInputChange: (field: keyof PatientFormData, value: string) => void;
  onAddressInputChange: (
    field: 'district' | 'state' | 'pincode',
    value: string,
    addressField: string,
  ) => void;
  onSuggestionSelect: (
    field: 'district' | 'state' | 'pincode',
    entry: AddressHierarchyEntry,
  ) => void;
  onSuggestionBlur: (field: 'district' | 'state' | 'pincode') => void;
  onSuggestionFocus: (field: 'district' | 'state' | 'pincode') => void;
}

export const AddressInformationSection = ({
  formData,
  suggestions,
  showSuggestions,
  addressErrors,
  onInputChange,
  onAddressInputChange,
  onSuggestionSelect,
  onSuggestionBlur,
  onSuggestionFocus,
}: AddressInformationSectionProps) => {
  const { t } = useTranslation();

  return (
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
            onChange={(e) => onInputChange('houseNumber', e.target.value)}
          />
        </div>
        <div className={styles.col}>
          <TextInput
            id="locality"
            labelText={t('CREATE_PATIENT_LOCALITY')}
            placeholder={t('CREATE_PATIENT_LOCALITY')}
            value={formData.locality}
            onChange={(e) => onInputChange('locality', e.target.value)}
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
                onAddressInputChange(
                  'district',
                  e.target.value,
                  'countyDistrict',
                )
              }
              onBlur={() => onSuggestionBlur('district')}
              onFocus={() => onSuggestionFocus('district')}
            />
            {showSuggestions.district && suggestions.district.length > 0 && (
              <div className={styles.suggestionsList}>
                {suggestions.district.map((entry) => (
                  <div
                    key={entry.userGeneratedId ?? entry.uuid}
                    className={styles.suggestionItem}
                    onClick={() => onSuggestionSelect('district', entry)}
                  >
                    <div className={styles.suggestionName}>{entry.name}</div>
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
            onChange={(e) => onInputChange('city', e.target.value)}
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
                onAddressInputChange('state', e.target.value, 'stateProvince')
              }
              onBlur={() => onSuggestionBlur('state')}
              onFocus={() => onSuggestionFocus('state')}
            />
            {showSuggestions.state && suggestions.state.length > 0 && (
              <div className={styles.suggestionsList}>
                {suggestions.state.map((entry) => (
                  <div
                    key={entry.userGeneratedId ?? entry.uuid}
                    className={styles.suggestionItem}
                    onClick={() => onSuggestionSelect('state', entry)}
                  >
                    <div className={styles.suggestionName}>{entry.name}</div>
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
                onAddressInputChange('pincode', e.target.value, 'postalCode')
              }
              onBlur={() => onSuggestionBlur('pincode')}
              onFocus={() => onSuggestionFocus('pincode')}
            />
            {showSuggestions.pincode && suggestions.pincode.length > 0 && (
              <div className={styles.suggestionsList}>
                {suggestions.pincode.map((entry) => (
                  <div
                    key={entry.userGeneratedId ?? entry.uuid}
                    className={styles.suggestionItem}
                    onClick={() => onSuggestionSelect('pincode', entry)}
                  >
                    <div className={styles.suggestionName}>{entry.name}</div>
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
  );
};
