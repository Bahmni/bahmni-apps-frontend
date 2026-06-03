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
  label: string;
  getValue: (p: PatientSearchResult) => string | null | undefined;
}

const PATIENT_FIELD_MAP: Record<PatientFieldKey, FieldDef> = {
  name: {
    label: 'Name',
    getValue: (p) =>
      [p.givenName, p.middleName, p.familyName].filter(Boolean).join(' '),
  },
  identifier: {
    label: 'ID',
    getValue: (p) => p.identifier,
  },
  age: {
    label: 'Age',
    getValue: (p) => p.age,
  },
  gender: {
    label: 'Gender',
    getValue: (p) => p.gender,
  },
  birthDate: {
    label: 'DOB',
    getValue: (p) => (p.birthDate ? String(p.birthDate) : null),
  },
  addressFieldValue: {
    label: 'Address',
    getValue: (p) => p.addressFieldValue,
  },
  extraIdentifiers: {
    label: 'Extra IDs',
    getValue: (p) => p.extraIdentifiers,
  },
  customAttribute: {
    label: 'Attribute',
    getValue: (p) => p.customAttribute,
  },
  activeVisitUuid: {
    label: 'Active Visit',
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
  const [isExpanded, setIsExpanded] = useState(false);
  const activeAction = patientActions[activeActionIndex];

  const fullName = [patient.givenName, patient.middleName, patient.familyName]
    .filter(Boolean)
    .join(' ');
  const initials = getInitials(patient.givenName, patient.familyName);

  const primaryText = buildPrimaryText(
    patient,
    patientFieldsConfig.primaryFields,
  );

  const additionalFields = patientFieldsConfig.additionalFields
    .map((key) => ({
      label: PATIENT_FIELD_MAP[key].label,
      value: PATIENT_FIELD_MAP[key].getValue(patient),
    }))
    .filter((f) => f.value);

  const hasAdditional = additionalFields.length > 0;

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsExpanded((prev) => !prev);
  };

  const handleChevronKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.stopPropagation();
      e.preventDefault();
      setIsExpanded((prev) => !prev);
    }
  };

  return (
    <Command.Item
      key={patient.uuid}
      value={`patient:${fullName} ${patient.identifier}`}
      className={styles.item}
      data-patient-uuid={patient.uuid}
      onSelect={() => {
        if (!activeAction) return;
        const ctx: PatientActionContext = {
          patientUuid: patient.uuid,
          patientIdentifier: patient.identifier ?? '',
        };
        onNavigate(activeAction.getPath(ctx));
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
          onClick={handleChevronClick}
          onKeyDown={handleChevronKeyDown}
          aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
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
                  const ctx: PatientActionContext = {
                    patientUuid: patient.uuid,
                    patientIdentifier: patient.identifier ?? '',
                  };
                  onNavigate(action.getPath(ctx));
                }}
                title={isActive ? `${action.label} (Enter)` : action.label}
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
    [searchTerm, selectedAnnotation, patientActions.length],
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

  return createPortal(
    <>
      <div className={styles.overlay} onClick={close} aria-hidden="true" />
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <Command
          label="Command palette"
          onValueChange={handleCmdValueChange}
          filter={(value, search) => {
            // Patient items are always filtered server-side — never hide them
            if (value.startsWith('patient:')) return 1;
            // Nav items and annotation suggestions use standard substring match
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
                  ? `Search by ${selectedAnnotation.label.toLowerCase()}...`
                  : searchAnnotations.length > 0
                    ? `Search or type @ for filters...`
                    : 'Search patients or navigate...'
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
              No results found.
            </Command.Empty>

            {!selectedAnnotation &&
              searchTerm.startsWith('@') &&
              searchAnnotations.length > 0 && (
                <Command.Group
                  heading="Search filters"
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

            {!searchTerm.startsWith('@') && navItems.length > 0 && (
              <Command.Group heading="Navigation" className={styles.group}>
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

            {searchTerm.length >= 2 &&
              !searchTerm.startsWith('@') &&
              loading && (
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
                  Searching patients...
                </div>
              )}

            {searchTerm.length >= 2 &&
              !searchTerm.startsWith('@') &&
              !loading &&
              error && (
                <div className={styles.empty}>
                  Search failed. Please try again.
                </div>
              )}

            {searchTerm.length >= 2 &&
              !searchTerm.startsWith('@') &&
              !loading &&
              !error && (
                <Command.Group heading="Patients" className={styles.group}>
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
              <kbd className={styles.kbd}>↑↓</kbd> navigate
            </span>
            <span className={styles.shortcutHint}>
              <kbd className={styles.kbd}>←→</kbd> switch action
            </span>
            <span className={styles.shortcutHint}>
              <kbd className={styles.kbd}>↵</kbd> select
            </span>
            <span className={styles.shortcutHint}>
              <kbd className={styles.kbd}>Esc</kbd> close
            </span>
          </div>
        </Command>
      </div>
    </>,
    document.body,
  );
};
