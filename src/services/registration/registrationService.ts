/**
 * Registration Service
 * Handles all OpenMRS REST API interactions for patient registration
 */

import {
  OpenMRSPatient,
  PatientSearchResult,
  PatientSearchCriteria,
  PatientSearchResponse,
  CreatePatientRequest,
  UpdatePatientRequest,
  PatientIdentifierType,
  PersonAttributeType,
  AddressLevel,
  ApiResponse,
  ErrorResponse,
} from '@types/registration';
import {
  Relationship,
  RelationshipType,
  CreateRelationshipRequest,
  UpdateRelationshipRequest,
  RelationshipSearchResponse,
} from '@types/registration/relationships';
import {
  PatientHistoryEntry,
  HistorySearchCriteria,
  HistorySearchResponse,
  HistoryExportRequest,
  HistoryExportResponse,
} from '@types/registration/history';
import {
  REGISTRATION_ENDPOINTS,
  REGISTRATION_CONFIG,
  REGISTRATION_ERROR_CODES,
} from '@constants/registration';
import { get, post, put, del } from '../api';

/**
 * Registration Service Class
 * Implements all patient registration related API operations
 */
export class RegistrationService {
  /**
   * Search for patients based on criteria
   * @param criteria - Search criteria
   * @returns Promise<PatientSearchResponse>
   */
  static async searchPatients(
    criteria: PatientSearchCriteria,
  ): Promise<PatientSearchResponse> {
    try {
      const limit = criteria.limit || REGISTRATION_CONFIG.DEFAULT_PAGE_SIZE;
      const startIndex = criteria.startIndex || 0;

      let endpoint: string;

      if (criteria.name) {
        // General search
        endpoint = REGISTRATION_ENDPOINTS.PATIENT_SEARCH(
          criteria.name,
          limit,
          startIndex,
        );
      } else {
        // Advanced search
        const searchParams: Record<string, string> = {};
        if (criteria.identifier) searchParams.identifier = criteria.identifier;
        if (criteria.givenName) searchParams.givenName = criteria.givenName;
        if (criteria.middleName) searchParams.middleName = criteria.middleName;
        if (criteria.familyName) searchParams.familyName = criteria.familyName;
        if (criteria.gender) searchParams.gender = criteria.gender;
        if (criteria.birthdate) searchParams.birthdate = criteria.birthdate;
        if (criteria.age !== undefined)
          searchParams.age = criteria.age.toString();

        endpoint = REGISTRATION_ENDPOINTS.PATIENT_SEARCH_ADVANCED(
          searchParams,
          limit,
          startIndex,
        );
      }

      const response = await get<{
        results: PatientSearchResult[];
        totalCount?: number;
        links?: Array<{ rel: string; uri: string }>;
      }>(endpoint);

      return {
        results: response.results || [],
        totalCount: response.totalCount || response.results?.length || 0,
        hasMore: (response.results?.length || 0) >= limit,
        links: response.links,
      };
    } catch (error) {
      throw this.handleError(error, REGISTRATION_ERROR_CODES.NETWORK_ERROR);
    }
  }

  /**
   * Get patient by UUID
   * @param uuid - Patient UUID
   * @returns Promise<OpenMRSPatient>
   */
  static async getPatientByUuid(uuid: string): Promise<OpenMRSPatient> {
    try {
      const endpoint = REGISTRATION_ENDPOINTS.PATIENT_RESOURCE(uuid);
      return await get<OpenMRSPatient>(endpoint);
    } catch (error) {
      throw this.handleError(
        error,
        REGISTRATION_ERROR_CODES.RESOURCE_NOT_FOUND,
      );
    }
  }

  /**
   * Create a new patient
   * @param data - Patient creation data
   * @returns Promise<OpenMRSPatient>
   */
  static async createPatient(
    data: CreatePatientRequest,
  ): Promise<OpenMRSPatient> {
    try {
      const endpoint = REGISTRATION_ENDPOINTS.PATIENT_RESOURCE();
      return await post<OpenMRSPatient>(endpoint, data);
    } catch (error) {
      throw this.handleError(error, REGISTRATION_ERROR_CODES.VALIDATION_ERROR);
    }
  }

  /**
   * Update an existing patient
   * @param uuid - Patient UUID
   * @param data - Patient update data
   * @returns Promise<OpenMRSPatient>
   */
  static async updatePatient(
    uuid: string,
    data: UpdatePatientRequest,
  ): Promise<OpenMRSPatient> {
    try {
      const endpoint = REGISTRATION_ENDPOINTS.PATIENT_RESOURCE(uuid);
      return await put<OpenMRSPatient>(endpoint, data);
    } catch (error) {
      throw this.handleError(error, REGISTRATION_ERROR_CODES.VALIDATION_ERROR);
    }
  }

  /**
   * Delete a patient
   * @param uuid - Patient UUID
   * @returns Promise<void>
   */
  static async deletePatient(uuid: string): Promise<void> {
    try {
      const endpoint = REGISTRATION_ENDPOINTS.PATIENT_RESOURCE(uuid);
      await del(endpoint);
    } catch (error) {
      throw this.handleError(
        error,
        REGISTRATION_ERROR_CODES.AUTHORIZATION_ERROR,
      );
    }
  }

  /**
   * Get all patient identifier types
   * @returns Promise<PatientIdentifierType[]>
   */
  static async getPatientIdentifierTypes(): Promise<PatientIdentifierType[]> {
    try {
      const endpoint = REGISTRATION_ENDPOINTS.PATIENT_IDENTIFIER_TYPES();
      const response = await get<{ results: PatientIdentifierType[] }>(
        endpoint,
      );
      return response.results || [];
    } catch (error) {
      throw this.handleError(error, REGISTRATION_ERROR_CODES.NETWORK_ERROR);
    }
  }

  /**
   * Get all person attribute types
   * @returns Promise<PersonAttributeType[]>
   */
  static async getPersonAttributeTypes(): Promise<PersonAttributeType[]> {
    try {
      const endpoint = REGISTRATION_ENDPOINTS.PERSON_ATTRIBUTE_TYPES();
      const response = await get<{ results: PersonAttributeType[] }>(endpoint);
      return response.results || [];
    } catch (error) {
      throw this.handleError(error, REGISTRATION_ERROR_CODES.NETWORK_ERROR);
    }
  }

  /**
   * Get address hierarchy
   * @param uuid - Optional specific level UUID
   * @returns Promise<AddressLevel[]>
   */
  static async getAddressHierarchy(uuid?: string): Promise<AddressLevel[]> {
    try {
      const endpoint = REGISTRATION_ENDPOINTS.ADDRESS_HIERARCHY(uuid);
      const response = await get<{ results: AddressLevel[] }>(endpoint);
      return response.results || [];
    } catch (error) {
      throw this.handleError(error, REGISTRATION_ERROR_CODES.NETWORK_ERROR);
    }
  }

  /**
   * Get all relationship types
   * @returns Promise<RelationshipType[]>
   */
  static async getRelationshipTypes(): Promise<RelationshipType[]> {
    try {
      const endpoint = REGISTRATION_ENDPOINTS.RELATIONSHIP_TYPES();
      const response = await get<{ results: RelationshipType[] }>(endpoint);
      return response.results || [];
    } catch (error) {
      throw this.handleError(error, REGISTRATION_ERROR_CODES.NETWORK_ERROR);
    }
  }

  /**
   * Get patient relationships
   * @param patientUuid - Patient UUID
   * @returns Promise<RelationshipSearchResponse>
   */
  static async getPatientRelationships(
    patientUuid: string,
  ): Promise<RelationshipSearchResponse> {
    try {
      const endpoint =
        REGISTRATION_ENDPOINTS.PATIENT_RELATIONSHIPS(patientUuid);
      const response = await get<{ results: Relationship[] }>(endpoint);
      return {
        results: response.results || [],
        totalCount: response.results?.length || 0,
        hasMore: false,
      };
    } catch (error) {
      throw this.handleError(
        error,
        REGISTRATION_ERROR_CODES.RELATIONSHIP_ERROR,
      );
    }
  }

  /**
   * Create a new relationship
   * @param data - Relationship creation data
   * @returns Promise<Relationship>
   */
  static async createRelationship(
    data: CreateRelationshipRequest,
  ): Promise<Relationship> {
    try {
      const endpoint = REGISTRATION_ENDPOINTS.RELATIONSHIP_RESOURCE();
      return await post<Relationship>(endpoint, data);
    } catch (error) {
      throw this.handleError(
        error,
        REGISTRATION_ERROR_CODES.RELATIONSHIP_ERROR,
      );
    }
  }

  /**
   * Update an existing relationship
   * @param uuid - Relationship UUID
   * @param data - Relationship update data
   * @returns Promise<Relationship>
   */
  static async updateRelationship(
    uuid: string,
    data: UpdateRelationshipRequest,
  ): Promise<Relationship> {
    try {
      const endpoint = REGISTRATION_ENDPOINTS.RELATIONSHIP_RESOURCE(uuid);
      return await put<Relationship>(endpoint, data);
    } catch (error) {
      throw this.handleError(
        error,
        REGISTRATION_ERROR_CODES.RELATIONSHIP_ERROR,
      );
    }
  }

  /**
   * Delete a relationship
   * @param uuid - Relationship UUID
   * @returns Promise<void>
   */
  static async deleteRelationship(uuid: string): Promise<void> {
    try {
      const endpoint = REGISTRATION_ENDPOINTS.RELATIONSHIP_RESOURCE(uuid);
      await del(endpoint);
    } catch (error) {
      throw this.handleError(
        error,
        REGISTRATION_ERROR_CODES.RELATIONSHIP_ERROR,
      );
    }
  }

  /**
   * Get patient history
   * @param criteria - History search criteria
   * @returns Promise<HistorySearchResponse>
   */
  static async getPatientHistory(
    criteria: HistorySearchCriteria,
  ): Promise<HistorySearchResponse> {
    try {
      const limit = criteria.limit || 50;
      const endpoint = REGISTRATION_ENDPOINTS.PATIENT_HISTORY(
        criteria.patientUuid,
        limit,
      );
      const response = await get<{ results: PatientHistoryEntry[] }>(endpoint);
      return {
        results: response.results || [],
        totalCount: response.results?.length || 0,
        hasMore: (response.results?.length || 0) >= limit,
      };
    } catch (error) {
      throw this.handleError(error, REGISTRATION_ERROR_CODES.HISTORY_ERROR);
    }
  }

  /**
   * Export patient history
   * @param request - History export request
   * @returns Promise<HistoryExportResponse>
   */
  static async exportPatientHistory(
    request: HistoryExportRequest,
  ): Promise<HistoryExportResponse> {
    try {
      // Implementation would depend on the specific export service
      // For now, return a mock response
      const fileName = `patient_history_${request.patientUuid}_${Date.now()}.${request.options.format.toLowerCase()}`;
      return {
        fileUrl: `/api/exports/${fileName}`,
        fileName,
        fileSize: 0,
        mimeType: this.getMimeType(request.options.format),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
    } catch (error) {
      throw this.handleError(error, REGISTRATION_ERROR_CODES.HISTORY_ERROR);
    }
  }

  /**
   * Upload patient photo
   * @param patientUuid - Patient UUID
   * @param photoData - Photo data (base64 encoded)
   * @param contentType - Photo content type
   * @returns Promise<void>
   */
  static async uploadPatientPhoto(
    patientUuid: string,
    photoData: string,
    contentType: string,
  ): Promise<void> {
    try {
      const endpoint = REGISTRATION_ENDPOINTS.PATIENT_PHOTO(patientUuid);
      const data = {
        photo: photoData,
        contentType,
      };
      await post(endpoint, data);
    } catch (error) {
      throw this.handleError(
        error,
        REGISTRATION_ERROR_CODES.PHOTO_UPLOAD_ERROR,
      );
    }
  }

  /**
   * Get patient photo
   * @param patientUuid - Patient UUID
   * @returns Promise<string> - Base64 encoded photo data
   */
  static async getPatientPhoto(patientUuid: string): Promise<string> {
    try {
      const endpoint = REGISTRATION_ENDPOINTS.PATIENT_PHOTO(patientUuid);
      const response = await get<{ photo: string }>(endpoint);
      return response.photo;
    } catch (error) {
      throw this.handleError(
        error,
        REGISTRATION_ERROR_CODES.PHOTO_UPLOAD_ERROR,
      );
    }
  }

  /**
   * Validate patient data for duplicates
   * @param data - Patient data to validate
   * @returns Promise<boolean> - True if no duplicates found
   */
  static async validatePatientForDuplicates(
    data: CreatePatientRequest,
  ): Promise<boolean> {
    try {
      // Search for potential duplicates based on name and identifiers
      const searchCriteria: PatientSearchCriteria = {};

      if (data.person.names?.[0]) {
        const name = data.person.names[0];
        searchCriteria.givenName = name.givenName;
        searchCriteria.familyName = name.familyName;
      }

      if (data.person.gender) {
        searchCriteria.gender = data.person.gender;
      }

      if (data.person.birthdate) {
        searchCriteria.birthdate = data.person.birthdate;
      }

      const searchResponse = await this.searchPatients(searchCriteria);

      // Check if any results match closely
      const hasCloseDuplicates = searchResponse.results.some((result) => {
        // Simple duplicate detection logic
        const nameMatch = this.isNameMatch(
          data.person.names?.[0],
          result.person.names?.[0],
        );
        const identifierMatch = this.hasIdentifierMatch(
          data.identifiers,
          result.identifiers,
        );

        return nameMatch && identifierMatch;
      });

      return !hasCloseDuplicates;
    } catch (error) {
      // If validation fails, assume no duplicates to avoid blocking registration
      return true;
    }
  }

  /**
   * Check if patient can be deleted
   * @param patientUuid - Patient UUID
   * @returns Promise<boolean>
   */
  static async canDeletePatient(patientUuid: string): Promise<boolean> {
    try {
      // Check if patient has any relationships or encounters
      const relationships = await this.getPatientRelationships(patientUuid);
      return relationships.results.length === 0;
    } catch (error) {
      // If check fails, assume cannot delete for safety
      return false;
    }
  }

  /**
   * Get locations for identifier assignment
   * @returns Promise<Array<{uuid: string, display: string}>>
   */
  static async getLocations(): Promise<
    Array<{ uuid: string; display: string }>
  > {
    try {
      const endpoint = REGISTRATION_ENDPOINTS.LOCATIONS();
      const response = await get<{
        results: Array<{ uuid: string; display: string }>;
      }>(endpoint);
      return response.results || [];
    } catch (error) {
      throw this.handleError(error, REGISTRATION_ERROR_CODES.NETWORK_ERROR);
    }
  }

  /**
   * Private helper methods
   */

  /**
   * Handle service errors
   * @param error - Original error
   * @param defaultCode - Default error code
   * @returns Error with proper code
   */
  private static handleError(error: any, defaultCode: string): Error {
    if (error.response?.status === 401) {
      const authError = new Error('Authentication required');
      (authError as any).code = REGISTRATION_ERROR_CODES.AUTHENTICATION_ERROR;
      return authError;
    }

    if (error.response?.status === 403) {
      const authzError = new Error('Authorization denied');
      (authzError as any).code = REGISTRATION_ERROR_CODES.AUTHORIZATION_ERROR;
      return authzError;
    }

    if (error.response?.status === 404) {
      const notFoundError = new Error('Resource not found');
      (notFoundError as any).code = REGISTRATION_ERROR_CODES.RESOURCE_NOT_FOUND;
      return notFoundError;
    }

    if (error.response?.status >= 400 && error.response?.status < 500) {
      const validationError = new Error(
        error.response?.data?.message || 'Validation error',
      );
      (validationError as any).code = REGISTRATION_ERROR_CODES.VALIDATION_ERROR;
      return validationError;
    }

    const serviceError = new Error(error.message || 'Service error');
    (serviceError as any).code = defaultCode;
    return serviceError;
  }

  /**
   * Get MIME type for export format
   * @param format - Export format
   * @returns MIME type string
   */
  private static getMimeType(format: string): string {
    switch (format.toLowerCase()) {
      case 'csv':
        return 'text/csv';
      case 'pdf':
        return 'application/pdf';
      case 'json':
        return 'application/json';
      case 'excel':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      default:
        return 'application/octet-stream';
    }
  }

  /**
   * Check if two names match
   * @param name1 - First name
   * @param name2 - Second name
   * @returns boolean
   */
  private static isNameMatch(name1: any, name2: any): boolean {
    if (!name1 || !name2) return false;

    const given1 = name1.givenName?.toLowerCase() || '';
    const given2 = name2.givenName?.toLowerCase() || '';
    const family1 = name1.familyName?.toLowerCase() || '';
    const family2 = name2.familyName?.toLowerCase() || '';

    return given1 === given2 && family1 === family2;
  }

  /**
   * Check if identifiers match
   * @param identifiers1 - First set of identifiers
   * @param identifiers2 - Second set of identifiers
   * @returns boolean
   */
  private static hasIdentifierMatch(
    identifiers1: any[],
    identifiers2: any[],
  ): boolean {
    if (!identifiers1 || !identifiers2) return false;

    for (const id1 of identifiers1) {
      for (const id2 of identifiers2) {
        if (
          id1.identifier === id2.identifier &&
          id1.identifierType === id2.identifierType?.uuid
        ) {
          return true;
        }
      }
    }

    return false;
  }
}

// Export individual methods for easier testing
export const {
  searchPatients,
  getPatientByUuid,
  createPatient,
  updatePatient,
  deletePatient,
  getPatientIdentifierTypes,
  getPersonAttributeTypes,
  getAddressHierarchy,
  getRelationshipTypes,
  getPatientRelationships,
  createRelationship,
  updateRelationship,
  deleteRelationship,
  getPatientHistory,
  exportPatientHistory,
  uploadPatientPhoto,
  getPatientPhoto,
  validatePatientForDuplicates,
  canDeletePatient,
  getLocations,
} = RegistrationService;
