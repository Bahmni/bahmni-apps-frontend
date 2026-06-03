import { type PatientSearchResult } from '@bahmni/services';
import { Command } from 'cmdk';
import React, { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  useCommandPalette,
  type PatientAction,
  type PatientActionContext,
  type PatientFieldKey,
  type PatientFieldsConfig,
  type SearchAnnotation,
} from './CommandPaletteContext';
import styles from './styles/CommandPalette.module.scss';
import { useCommandPaletteSearch } from './useCommandPaletteSearch';

interface FieldDef {
  labelKey: string;
  getValue: (p: PatientSearchResult) => string | null | undefined;
}

const PATIENT_FIELD_MAP: Record<PatientFieldKey, FieldDef> = {
  name: {
    labelKey: 'COMMAND_PALETTE_FIELD_NAME',
    getValue: (p) =>
      [p.givenName, p.middleName, p.familyName].filter(Boolean).join(' '),
  },
  identifier: {
    labelKey: 'COMMAND_PALETTE_FIELD_ID',
    getValue: (p) => p.identifier,
  },
  age: {
    labelKey: 'COMMAND_PALETTE_FIELD_AGE',
    getValue: (p) => p.age,
  },
  gender: {
    labelKey: 'COMMAND_PALETTE_FIELD_GENDER',
    getValue: (p) => p.gender,
  },
  birthDate: {
    labelKey: 'COMMAND_PALETTE_FIELD_DOB',
    getValue: (p) => (p.birthDate ? String(p.birthDate) : null),
  },
  addressFieldValue: {
    labelKey: 'COMMAND_PALETTE_FIELD_ADDRESS',
    getValue: (p) => p.addressFieldValue,
  },
  extraIdentifiers: {
    labelKey: 'COMMAND_PALETTE_FIELD_EXTRA_IDS',
    getValue: (p) => p.extraIdentifiers,
  },
  customAttribute: {
    labelKey: 'COMMAND_PALETTE_FIELD_ATTRIBUTE',
    getValue: (p) => p.customAttribute,
  },
  activeVisitUuid: {
    labelKey: 'COMMAND_PALETTE_FIELD_ACTIVE_VISIT',
    getValue: (p) => (p.activeVisitUuid ? 'Active' : null),
  },
};

function getInitials(givenName: string, familyName: string): string {
  const first = givenName?.[0] ?? '';
  const last = familyName?.[0] ?? '';
  return (first + last).toUpperCase() || '?';
}

function buildPrimaryText(
  patient: PatientSearchResult,
  primaryFields: PatientFieldKey[],
): string {
  return primaryFields
    .map((key) => PATIENT_FIELD_MAP[key].getValue(patient))
    .filter(Boolean)
    .join(' · ');
}

interface PatientCommandItemProps {
  patient: PatientSearchResult;
  patientFieldsConfig: PatientFieldsConfig;
  patientActions: PatientAction[];
  activeActionIndex: number;
  onNavigate: (path: string) => void;
}

const PatientCommandItem: React.FC<PatientCommandItemProps> = ({
  patient,
  patientFieldsConfig,
  patientActions,
  activeActionIndex,
  onNavigate,
}) => {
  const { t } = useCommandPalette();
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
      key={patient.uuid}
      value={`patient:${fullName} ${patient.identifier}`}
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
        <span className={styles.itemLabel}>{primaryText}</span>
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
                        label: action.label,
                      })
                    : action.label
                }
                type="button"
              >
                <span className={styles.actionButtonLabel}>{action.label}</span>
                {isActive && <kbd className={styles.actionEnterHint}>↵</kbd>}
              </button>
            );
          })}
        </span>
      )}
    </Command.Item>
  );
};

export const CommandPalette: React.FC = () => {
  const {
    isOpen,
    setOpen,
    navItems,
    patientActions,
    patientFieldsConfig,
    searchAnnotations,
    t,
  } = useCommandPalette();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAnnotation, setSelectedAnnotation] =
    useState<SearchAnnotation | null>(null);
  const [activeActionIndex, setActiveActionIndex] = useState(0);
  const { patients, loading, error } = useCommandPaletteSearch(
    searchTerm,
    selectedAnnotation,
  );

  const getDefaultActionIndex = useCallback(() => {
    const pathname = window.location.pathname;
    const idx = patientActions.findIndex(
      (a) => a.basePath && pathname.startsWith(a.basePath),
    );
    return idx >= 0 ? idx : 0;
  }, [patientActions]);

  const [selectedPatientUuid, setSelectedPatientUuid] = useState<string | null>(
    null,
  );

  const handleCmdValueChange = useCallback(
    (_val: string) => {
      setActiveActionIndex(getDefaultActionIndex());
      const el = document.querySelector<HTMLElement>(
        '[data-patient-uuid][data-selected="true"]',
      );
      setSelectedPatientUuid(el?.dataset.patientUuid ?? null);
    },
    [getDefaultActionIndex],
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      if (!selectedAnnotation) {
        const matched = searchAnnotations.find(
          (ann) => value === ann.prefix + ' ' || value === ann.prefix + ':',
        );
        if (matched) {
          setSelectedAnnotation(matched);
          setSearchTerm('');
          return;
        }
      }
      setSearchTerm(value);
    },
    [selectedAnnotation, searchAnnotations],
  );

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Backspace' && searchTerm === '' && selectedAnnotation) {
        e.preventDefault();
        setSelectedAnnotation(null);
        return;
      }

      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      if (patientActions.length < 2) return;
      const el = document.querySelector<HTMLElement>(
        '[data-patient-uuid][data-selected="true"]',
      );
      if (!el) return;
      e.preventDefault();
      setSelectedPatientUuid(el.dataset.patientUuid ?? null);
      if (e.key === 'ArrowRight') {
        setActiveActionIndex((prev) => (prev + 1) % patientActions.length);
      } else {
        setActiveActionIndex(
          (prev) => (prev - 1 + patientActions.length) % patientActions.length,
        );
      }
    },
    [searchTerm, selectedAnnotation, patientActions],
  );

  const close = useCallback(() => {
    setOpen(false);
    setSearchTerm('');
    setSelectedAnnotation(null);
  }, [setOpen]);

  const navigateToPath = useCallback(
    (rawPath: string, preferNewTab = false) => {
      const path = rawPath.trim();
      if (!path) return;
      if (/^(javascript|data):/i.test(path)) return;

      const isHttp = /^https?:\/\//i.test(path);
      const isRelative = path.startsWith('/');
      if (!isHttp && !isRelative) return;

      if (preferNewTab || isHttp) {
        window.open(path, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = path;
      }
    },
    [],
  );

  const handleSelect = useCallback(
    (path: string) => {
      close();
      navigateToPath(path);
    },
    [close, navigateToPath],
  );

  if (!isOpen) return null;

  const isAnnotationMode = searchTerm.startsWith('@');
  const isSearchActive = searchTerm.length >= 2 && !isAnnotationMode;

  return createPortal(
    <>
      <div className={styles.overlay} onClick={close} aria-hidden="true" />
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={t('COMMAND_PALETTE_ARIA_LABEL')}
      >
        <Command
          label={t('COMMAND_PALETTE_ARIA_LABEL')}
          onValueChange={handleCmdValueChange}
          filter={(value, search) => {
            if (value.startsWith('patient:')) return 1;
            return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <div className={styles.inputWrapper}>
            <svg
              className={styles.searchIcon}
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="9"
                cy="9"
                r="6"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M13.5 13.5L17 17"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            {selectedAnnotation && (
              <span className={styles.annotationBadge}>
                {selectedAnnotation.label}
              </span>
            )}
            <Command.Input
              className={styles.input}
              placeholder={
                selectedAnnotation
                  ? t('COMMAND_PALETTE_SEARCH_BY_ANNOTATION', {
                      annotation: selectedAnnotation.label.toLowerCase(),
                    })
                  : searchAnnotations.length > 0
                    ? t('COMMAND_PALETTE_SEARCH_WITH_FILTERS')
                    : t('COMMAND_PALETTE_SEARCH_DEFAULT')
              }
              value={searchTerm}
              onValueChange={handleSearchChange}
              onKeyDown={handleInputKeyDown}
              autoFocus
            />
            <kbd className={styles.escHint}>Esc</kbd>
          </div>

          <Command.List className={styles.list}>
            <Command.Empty className={styles.empty}>
              {t('COMMAND_PALETTE_NO_RESULTS')}
            </Command.Empty>

            {!selectedAnnotation &&
              isAnnotationMode &&
              searchAnnotations.length > 0 && (
                <Command.Group
                  heading={t('COMMAND_PALETTE_GROUP_SEARCH_FILTERS')}
                  className={styles.group}
                >
                  {searchAnnotations
                    .filter((ann) => ann.prefix.startsWith(searchTerm))
                    .map((ann) => (
                      <Command.Item
                        key={ann.prefix}
                        value={ann.prefix}
                        className={styles.item}
                        onSelect={() => {
                          setSelectedAnnotation(ann);
                          setSearchTerm('');
                        }}
                      >
                        <span className={styles.annotationSuggestionPrefix}>
                          {ann.prefix}
                        </span>
                        <span className={styles.itemLabel}>{ann.label}</span>
                      </Command.Item>
                    ))}
                </Command.Group>
              )}

            {!isAnnotationMode && navItems.length > 0 && (
              <Command.Group
                heading={t('COMMAND_PALETTE_GROUP_NAVIGATION')}
                className={styles.group}
              >
                {navItems.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={item.label}
                    className={styles.item}
                    onSelect={() => {
                      close();
                      navigateToPath(item.path, item.newTab);
                    }}
                  >
                    <span className={styles.navIcon} aria-hidden="true">
                      ↗
                    </span>
                    <span className={styles.itemLabel}>{item.label}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {isSearchActive && loading && (
              <div className={styles.loading}>
                <svg
                  className={styles.ekgLine}
                  viewBox="0 0 80 20"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    className={styles.ekgPath}
                    d="M 0,10 L 12,10 L 14,8 L 16,10 L 20,10 L 22,2 L 25,18 L 28,10 L 36,10 L 39,5 L 42,10 L 52,10 L 54,8 L 56,10 L 60,10 L 62,2 L 65,18 L 68,10 L 76,10 L 79,5 L 80,8"
                  />
                </svg>
                {t('COMMAND_PALETTE_SEARCHING')}
              </div>
            )}

            {isSearchActive && !loading && error && (
              <div className={styles.empty}>
                {t('COMMAND_PALETTE_SEARCH_ERROR')}
              </div>
            )}

            {isSearchActive && !loading && !error && (
              <Command.Group
                heading={t('COMMAND_PALETTE_GROUP_PATIENTS')}
                className={styles.group}
              >
                {patients.map((patient) => (
                  <PatientCommandItem
                    key={patient.uuid}
                    patient={patient}
                    patientFieldsConfig={patientFieldsConfig}
                    patientActions={patientActions}
                    activeActionIndex={
                      patient.uuid === selectedPatientUuid
                        ? activeActionIndex
                        : getDefaultActionIndex()
                    }
                    onNavigate={handleSelect}
                  />
                ))}
              </Command.Group>
            )}
          </Command.List>

          <div className={styles.footer}>
            <span className={styles.shortcutHint}>
              <kbd className={styles.kbd}>↑↓</kbd>{' '}
              {t('COMMAND_PALETTE_HINT_NAVIGATE')}
            </span>
            <span className={styles.shortcutHint}>
              <kbd className={styles.kbd}>←→</kbd>{' '}
              {t('COMMAND_PALETTE_HINT_SWITCH_ACTION')}
            </span>
            <span className={styles.shortcutHint}>
              <kbd className={styles.kbd}>↵</kbd>{' '}
              {t('COMMAND_PALETTE_HINT_SELECT')}
            </span>
            <span className={styles.shortcutHint}>
              <kbd className={styles.kbd}>Esc</kbd>{' '}
              {t('COMMAND_PALETTE_HINT_CLOSE')}
            </span>
          </div>
        </Command>
      </div>
    </>,
    document.body,
  );
};
