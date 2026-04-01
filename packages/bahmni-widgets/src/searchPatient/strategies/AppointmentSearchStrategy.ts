import {
  searchAppointmentsByAttribute,
  Appointment,
  Reason,
  formatDateTime,
  getFormattedAge,
  AppointmentSearchResult,
  PatientSearchResultBundle,
} from '@bahmni/services';
import {
  SearchStrategy,
  SearchContext,
  ValidationResult,
} from '../SearchStrategy.interface';

/**
 * Strategy for searching patients by appointment attributes
 */
export class AppointmentSearchStrategy implements SearchStrategy {
  readonly type = 'appointment' as const;

  /**
   * Execute appointment search
   */
  async execute(
    searchTerm: string,
    context: SearchContext,
  ): Promise<PatientSearchResultBundle> {
    const { selectedField } = context;
    const fieldsToSearch = selectedField?.fields ?? [];

    const requestBody = this.buildSearchRequest(searchTerm, fieldsToSearch);
    const appointments = await searchAppointmentsByAttribute(requestBody);

    return this.transformAppointmentsToPatientBundle(appointments, context);
  }

  /**
   * Validate appointment search input
   */
  validate(input: string): ValidationResult {
    if (!input || input.trim().length === 0) {
      return { valid: false, error: 'SEARCH_TERM_EMPTY' };
    }
    return { valid: true };
  }

  /**
   * Format the input by trimming whitespace
   */
  formatInput(input: string): string {
    return input.trim();
  }

  /**
   * Build the search request with appointment number and date range
   */
  private buildSearchRequest(
    searchTerm: string,
    fieldsToSearch: string[],
  ): Record<string, string> {
    const requestBody: Record<string, string> = {};

    // Add the search field (e.g., appointmentNumber)
    if (fieldsToSearch.length > 0) {
      requestBody[fieldsToSearch[0]] = searchTerm.trim();
    }

    // Add date range - search appointments from the last year
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    oneYearAgo.setHours(23, 59, 59, 999);
    requestBody.startDate = oneYearAgo.toISOString();

    return requestBody;
  }

  /**
   * Transform appointments to patient search result bundle
   */
  private transformAppointmentsToPatientBundle(
    appointments: Appointment[],
    context: SearchContext,
  ): PatientSearchResultBundle {
    return {
      totalCount: appointments.length,
      pageOfResults: appointments.map((appt) =>
        this.transformAppointmentToSearchResult(appt, context.translator),
      ),
    };
  }

  /**
   * Transform a single appointment to a search result
   */
  private transformAppointmentToSearchResult = (
    appt: Appointment,
    translator?: (key: string, options?: { count?: number }) => string,
  ): AppointmentSearchResult => ({
    // Patient fields
    uuid: appt.patient.uuid,
    identifier: appt.patient.identifier,
    givenName: appt.patient.name,
    middleName: '',
    familyName: '',
    gender: appt.patient.gender,
    birthDate: formatDateTime(appt.patient.birthDate, translator)
      .formattedResult,
    age: getFormattedAge(appt.patient.birthDate, translator),
    extraIdentifiers: null,
    personId: 0,
    deathDate: null,
    addressFieldValue: null,
    patientProgramAttributeValue: null,
    dateCreated: new Date(appt.dateCreated),
    activeVisitUuid: '',
    customAttribute: '',
    hasBeenAdmitted: false,

    // Appointment-specific fields
    appointmentUuid: appt.uuid,
    appointmentNumber: appt.appointmentNumber,
    appointmentDate: formatDateTime(appt.startDateTime, translator, true)
      .formattedResult,
    appointmentReason: this.getAppointmentReasons(appt),
    appointmentStatus: appt.status,
  });

  /**
   * Extract and format appointment reasons
   */
  private getAppointmentReasons(appt: Appointment): string {
    if (!appt?.reasons || !Array.isArray(appt.reasons)) {
      return '';
    }
    return appt.reasons
      .map((reason: Reason) => reason?.name)
      .filter(Boolean)
      .join(', ');
  }
}
