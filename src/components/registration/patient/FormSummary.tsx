/**
 * Form Summary
 * Sixth step of patient creation wizard - review and confirmation
 */
import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Grid, Column, InlineNotification } from '@carbon/react';
import { PatientFormData } from '../../../types/registration';
import { WizardContextValue } from './PatientFormWizardContext';
import { DataField } from './components/DataField';
import { FormSection } from './components/FormSection';
import { ValidationSummary } from './components/ValidationSummary';

interface FormSummaryProps {
  formData: PatientFormData;
  errors: Record<string, string>;
  updateField: (field: string, value: any) => void;
  wizard: WizardContextValue;
}

export const FormSummary: React.FC<FormSummaryProps> = ({
  formData,
  errors,
  updateField,
  wizard,
}) => {
  const { t } = useTranslation();

  // Validate that all required steps are complete
  const stepValidation = useMemo(() => {
    const stepErrors: string[] = [];
    let isValid = true;
    let isComplete = true;

    // Check if all previous steps are valid
    const requiredSteps = ['demographics', 'identifiers'] as const;
    for (const stepId of requiredSteps) {
      const stepValidation = wizard.state.stepValidations[stepId];
      if (!stepValidation.isValid) {
        stepErrors.push(
          t('registration.patient.summary.validation.stepIncomplete', {
            step: t(`registration.patient.form.steps.${stepId}`),
          }),
        );
        isValid = false;
        isComplete = false;
      }
    }

    return { isValid, errors: stepErrors, isComplete };
  }, [wizard.state.stepValidations, t]);

  // Update wizard validation when step validation changes
  useEffect(() => {
    wizard.actions.setStepValidation('summary', stepValidation);
  }, [stepValidation, wizard.actions]);

  const formatGender = (gender: 'M' | 'F' | 'O') => {
    switch (gender) {
      case 'M':
        return t('registration.patient.demographics.genderMale');
      case 'F':
        return t('registration.patient.demographics.genderFemale');
      case 'O':
        return t('registration.patient.demographics.genderOther');
      default:
        return '';
    }
  };

  return (
    <Grid>
      <Column sm={4} md={8} lg={12}>
        <FormSection
          title={t('registration.patient.summary.title')}
          headingLevel="h2"
        >
          <p
            style={{
              marginBottom: '2rem',
              fontSize: '1rem',
              color: '#525252',
            }}
          >
            {t('registration.patient.summary.description')}
          </p>

          {/* Demographics Summary */}
          <FormSection
            title={t('registration.patient.demographics.personalInfo')}
            headingLevel="h3"
          >
            <div
              style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem' }}
            >
              <DataField
                label={t('registration.patient.demographics.givenName')}
                value={formData.givenName || t('common.notProvided')}
                required
              />

              {formData.middleName && (
                <DataField
                  label={t('registration.patient.demographics.middleName')}
                  value={formData.middleName}
                />
              )}

              <DataField
                label={t('registration.patient.demographics.familyName')}
                value={formData.familyName || t('common.notProvided')}
                required
              />

              <DataField
                label={t('registration.patient.demographics.gender')}
                value={formatGender(formData.gender)}
                required
              />

              {formData.birthdate && (
                <DataField
                  label={t('registration.patient.demographics.birthdate')}
                  value={
                    <>
                      {new Date(formData.birthdate).toLocaleDateString()}
                      {formData.birthdateEstimated && (
                        <span style={{ fontStyle: 'italic', color: '#525252' }}>
                          {' '}
                          ({t('registration.patient.demographics.estimated')})
                        </span>
                      )}
                    </>
                  }
                />
              )}

              {formData.age && (
                <DataField
                  label={t('registration.patient.demographics.age')}
                  value={`${formData.age} ${t('registration.patient.demographics.years')}`}
                />
              )}
            </div>
          </FormSection>

          {/* Identifiers Summary */}
          {formData.identifiers && formData.identifiers.length > 0 && (
            <FormSection
              title={t('registration.patient.identifiers.title')}
              headingLevel="h3"
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                {formData.identifiers.map((identifier, index) => (
                  <DataField
                    key={index}
                    label={`${identifier.identifierType}${identifier.preferred ? ` (${t('registration.patient.identifiers.preferred')})` : ''}`}
                    value={identifier.identifier}
                  />
                ))}
              </div>
            </FormSection>
          )}

          {/* Address Summary */}
          {formData.address &&
            (formData.address.address1 || formData.address.cityVillage) && (
              <FormSection
                title={t('registration.patient.address.title')}
                headingLevel="h3"
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  {formData.address.address1 && (
                    <DataField
                      label={t('registration.patient.address.address1')}
                      value={formData.address.address1}
                    />
                  )}

                  {formData.address.cityVillage && (
                    <DataField
                      label={t('registration.patient.address.city')}
                      value={formData.address.cityVillage}
                    />
                  )}

                  {formData.address.stateProvince && (
                    <DataField
                      label={t('registration.patient.address.state')}
                      value={formData.address.stateProvince}
                    />
                  )}

                  {formData.address.country && (
                    <DataField
                      label={t('registration.patient.address.country')}
                      value={formData.address.country}
                    />
                  )}

                  {formData.address.postalCode && (
                    <DataField
                      label={t('registration.patient.address.postalCode')}
                      value={formData.address.postalCode}
                    />
                  )}
                </div>
              </FormSection>
            )}

          {/* Validation Errors */}
          {stepValidation.errors.length > 0 && (
            <ValidationSummary
              errors={stepValidation.errors}
              type="error"
              title={t('registration.patient.summary.validationErrors')}
            />
          )}

          {/* Success Message */}
          {stepValidation.isValid && (
            <InlineNotification
              kind="success"
              title={t('registration.patient.summary.readyToSubmit')}
              hideCloseButton
              style={{ marginTop: '2rem' }}
            />
          )}
        </FormSection>
      </Column>
    </Grid>
  );
};

export default FormSummary;
