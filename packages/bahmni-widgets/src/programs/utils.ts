import { ProgramEnrollment } from '@bahmni/services';
import { formattedProgram, ProgramStatus } from './model';

const determineProgramStatus = (program: ProgramEnrollment): ProgramStatus => {
  const endDate = program.dateCompleted ?? program.dateEnded;
  const startDate = new Date(program.dateEnrolled);
  const now = new Date();

  if (endDate) {
    return ProgramStatus.Completed;
  }

  if (startDate > now) {
    return ProgramStatus.OnHold;
  }

  return ProgramStatus.InProgress;
};

const getStatusTranslationKey = (status: ProgramStatus): string => {
  switch (status) {
    case ProgramStatus.InProgress:
      return 'PROGRAMS_STATUS_IN_PROGRESS';
    case ProgramStatus.Submitted:
      return 'PROGRAMS_STATUS_SUBMITTED';
    case ProgramStatus.Finalised:
      return 'PROGRAMS_STATUS_FINALISED';
    case ProgramStatus.Completed:
      return 'PROGRAMS_STATUS_COMPLETED';
    case ProgramStatus.OnHold:
      return 'PROGRAMS_STATUS_ON_HOLD';
    case ProgramStatus.Cancelled:
      return 'PROGRAMS_STATUS_CANCELLED';
    case ProgramStatus.Abandoned:
      return 'PROGRAMS_STATUS_ABANDONED';
    default:
      return 'PROGRAMS_STATUS_UNKNOWN';
  }
};

const getStatusClassName = (status: ProgramStatus): string => {
  switch (status) {
    case ProgramStatus.InProgress:
      return 'inProgressStatus';
    case ProgramStatus.Submitted:
      return 'submittedStatus';
    case ProgramStatus.Finalised:
      return 'finalisedStatus';
    case ProgramStatus.Completed:
      return 'completedStatus';
    case ProgramStatus.OnHold:
      return 'onHoldStatus';
    case ProgramStatus.Cancelled:
      return 'cancelledStatus';
    case ProgramStatus.Abandoned:
      return 'abandonedStatus';
    default:
      return 'unknownStatus';
  }
};

const getMostRecentState = (
  program: ProgramEnrollment,
): ProgramEnrollment['states'][number] | null => {
  if (!program.states || program.states.length === 0) {
    return null;
  }

  // Find the current state (endDate = null)
  const currentState = program.states.find((state) => state.endDate === null);
  if (currentState) {
    return currentState;
  }

  // If all states have endDate, get the most recent one (latest endDate)
  return program.states.reduce(
    (mostRecent, state) => {
      if (!mostRecent) return state;
      const mostRecentEndDate = mostRecent.endDate
        ? new Date(mostRecent.endDate).getTime()
        : 0;
      const stateEndDate = state.endDate
        ? new Date(state.endDate).getTime()
        : 0;
      return stateEndDate > mostRecentEndDate ? state : mostRecent;
    },
    null as ProgramEnrollment['states'][number] | null,
  );
};

const extractOutcome = (
  program: ProgramEnrollment,
): { text: string | null; details: string | null } => {
  const text = program.outcome?.display ?? null;
  return { text, details: null };
};

const getCurrentStateStartDate = (
  program: ProgramEnrollment,
): string | null => {
  const state = getMostRecentState(program);
  return state?.startDate ?? null;
};

const getReferenceNumber = (program: ProgramEnrollment): string => {
  if (program.attributes && program.attributes.length > 0) {
    // Try to find the first attribute with a value
    const referenceAttribute = program.attributes.find(
      (attr) => attr.value && !attr.voided,
    );
    if (referenceAttribute) {
      // Handle both string and Concept values
      const value =
        typeof referenceAttribute.value === 'string'
          ? referenceAttribute.value
          : referenceAttribute.value.display;
      return value || '';
    }
  }
  return '';
};

export function parseAttributeField(field: string): {
  isAttribute: boolean;
  attributeName: string | null;
  fieldKey: string;
  path: string | null;
  property: string | null;
} {
  if (field.includes(':')) {
    const [path, property] = field.split(':', 2);
    return {
      isAttribute: true,
      attributeName: property,
      fieldKey: field,
      path,
      property,
    };
  }
  return {
    isAttribute: false,
    attributeName: null,
    fieldKey: field,
    path: null,
    property: null,
  };
}

export function generateTranslationKey(path: string, property: string): string {
  const responseProperty = path.trim().toUpperCase().replace(/\s+/g, '_');
  const fieldName = property.trim().toUpperCase().replace(/\s+/g, '_');
  return `PROGRAM_${responseProperty}_${fieldName}`;
}

function toCamelCase(property: string): string {
  return property
    .split(/[\s_-]+/)
    .map((word, index) => {
      if (index === 0) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
}

export function getValueByPath(
  program: ProgramEnrollment,
  path: string,
  property: string,
): string {
  if (path.toLowerCase() !== 'attributes') {
    return '';
  }

  if (!program.attributes || program.attributes.length === 0) {
    return '';
  }

  const camelProperty = toCamelCase(property);

  // First try to find by matching attributeType.display
  const attrByType = program.attributes.find(
    (attr) =>
      !attr.voided &&
      attr.attributeType.display.toLowerCase() === property.toLowerCase(),
  );

  if (attrByType) {
    return typeof attrByType.value === 'string'
      ? attrByType.value
      : attrByType.value.display;
  }

  // Then try to access the property directly on first attribute
  const firstAttr = program.attributes.find((attr) => !attr.voided);
  if (firstAttr && camelProperty in firstAttr) {
    const value = (firstAttr as unknown as Record<string, unknown>)[
      camelProperty
    ];
    return typeof value === 'string'
      ? value
      : ((value as { display?: string })?.display ?? '');
  }

  return '';
}

export function mapPrograms(
  programs: ProgramEnrollment[],
  configFields?: string[],
): formattedProgram[] {
  return programs.map((program) => formatProgramDetails(program, configFields));
}

function formatProgramDetails(
  program: ProgramEnrollment,
  configFields?: string[],
): formattedProgram {
  const status = determineProgramStatus(program);
  const { text: outcomeText, details: outcomeDetails } =
    extractOutcome(program);
  const referenceNumber = getReferenceNumber(program);
  const currentStateStartDate = getCurrentStateStartDate(program);

  // Build attributes map based on config
  const attributes: Record<string, string> = {};
  if (configFields) {
    configFields.forEach((field) => {
      const parsed = parseAttributeField(field);
      if (parsed.isAttribute && parsed.path && parsed.property) {
        attributes[field] = getValueByPath(
          program,
          parsed.path,
          parsed.property,
        );
      }
    });
  }

  return {
    id: program.uuid,
    uuid: program.uuid,
    programName: program.program.name ?? program.program.display,
    referenceNumber,
    destination: program.location?.display ?? null,
    dateEnrolled: currentStateStartDate ?? program.dateEnrolled,
    dateEnded: program.dateCompleted ?? program.dateEnded ?? null,
    outcome: outcomeText,
    outcomeDetails,
    status,
    statusKey: getStatusTranslationKey(status),
    statusClassName: getStatusClassName(status),
    attributes,
  };
}
