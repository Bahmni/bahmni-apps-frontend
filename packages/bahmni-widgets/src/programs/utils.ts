import { ProgramEnrollment } from '@bahmni/services';
import { ProgramViewModel, ProgramStatus } from './model';

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
  const state = getMostRecentState(program);
  const text = state?.state?.concept?.display ?? null;
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

/**
 * Transforms an array of ProgramEnrollment into ProgramViewModel array
 * @param programs - Array of program enrollments to transform
 * @returns Array of ProgramViewModel ready for table rendering
 */
export function createProgramViewModels(
  programs: ProgramEnrollment[],
): ProgramViewModel[] {
  return programs.map((program) => createProgramViewModel(program));
}

function createProgramViewModel(program: ProgramEnrollment): ProgramViewModel {
  const status = determineProgramStatus(program);
  const { text: outcomeText, details: outcomeDetails } =
    extractOutcome(program);
  const referenceNumber = getReferenceNumber(program);
  const currentStateStartDate = getCurrentStateStartDate(program);

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
  };
}
