import type { PatientSearchResult } from '@bahmni/services';
import { Command } from 'cmdk';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeceasedTag } from '../patientDetails';
import type {
  PatientAction,
  PatientActionContext,
  PatientFieldsConfig,
} from './models';
import styles from './styles/CommandPalette.module.scss';
import { PATIENT_FIELD_MAP, buildPrimaryText, getInitials } from './utils';

export interface PatientCommandItemProps {
  patient: PatientSearchResult;
  patientFieldsConfig: PatientFieldsConfig;
  patientActions: PatientAction[];
  activeActionIndex: number;
  onNavigate: (path: string) => void;
}

export const PatientCommandItem: React.FC<PatientCommandItemProps> = ({
  patient,
  patientFieldsConfig,
  patientActions,
  activeActionIndex,
  onNavigate,
}) => {
  const { t } = useTranslation('command-palette');
  const [isExpanded, setIsExpanded] = useState(false);
  const activeAction = patientActions[activeActionIndex];

  const fullName = PATIENT_FIELD_MAP.name.getValue(patient) ?? '';
  const initials = getInitials(patient.givenName, patient.familyName);
  const primaryText = buildPrimaryText(
    patient,
    patientFieldsConfig.primaryFields,
  );
  const patientCtx: PatientActionContext = {
    patientUuid: patient.uuid,
    patientIdentifier: patient.identifier ?? '',
  };

  const additionalFields = patientFieldsConfig.additionalFields
    .map((key) => ({
      label: t(PATIENT_FIELD_MAP[key].labelKey),
      value: PATIENT_FIELD_MAP[key].getValue(patient),
    }))
    .filter((f) => f.value);

  const hasAdditional = additionalFields.length > 0;

  const toggleExpanded = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsExpanded((prev) => !prev);
  };

  const handleChevronKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') toggleExpanded(e);
  };

  return (
    <Command.Item
      value={`patient:${patient.uuid}:${fullName} ${patient.identifier}`}
      className={styles.item}
      data-patient-uuid={patient.uuid}
      onSelect={() => {
        if (!activeAction) return;
        onNavigate(activeAction.getPath(patientCtx));
      }}
    >
      <span className={styles.avatar} aria-hidden="true">
        {initials}
      </span>

      <span className={styles.itemContent}>
        <span className={styles.itemLabelWrapper}>
          <span className={styles.itemLabel}>{primaryText}</span>
          <DeceasedTag
            isDead={patient.isDead ?? patient.dead ?? !!patient.deathDate}
          />
        </span>
        {isExpanded && hasAdditional && (
          <span className={styles.additionalFields}>
            {additionalFields.map((f) => (
              <span key={f.label} className={styles.additionalField}>
                <span className={styles.fieldLabel}>{f.label}:</span> {f.value}
              </span>
            ))}
          </span>
        )}
      </span>

      {hasAdditional && (
        <button
          className={styles.chevronButton}
          onClick={toggleExpanded}
          onKeyDown={handleChevronKeyDown}
          aria-label={
            isExpanded
              ? t('COMMAND_PALETTE_COLLAPSE_DETAILS')
              : t('COMMAND_PALETTE_EXPAND_DETAILS')
          }
          aria-expanded={isExpanded}
          tabIndex={0}
          type="button"
        >
          <span className={styles.chevronIcon}>{isExpanded ? '▲' : '▼'}</span>
        </button>
      )}

      {patientActions.length > 0 && (
        <span className={styles.itemActions}>
          {patientActions.map((action, index) => {
            const isActive = index === activeActionIndex;
            return (
              <button
                key={action.id}
                className={`${styles.actionButton} ${isActive ? styles.actionButtonDefault : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate(action.getPath(patientCtx));
                }}
                title={
                  isActive
                    ? t('COMMAND_PALETTE_ACTION_ENTER_HINT', {
                        label: t(action.label, { defaultValue: action.label }),
                      })
                    : t(action.label, { defaultValue: action.label })
                }
                type="button"
              >
                <span className={styles.actionButtonLabel}>
                  {t(action.label, { defaultValue: action.label })}
                </span>
                {isActive && <kbd className={styles.actionEnterHint}>↵</kbd>}
              </button>
            );
          })}
        </span>
      )}
    </Command.Item>
  );
};
