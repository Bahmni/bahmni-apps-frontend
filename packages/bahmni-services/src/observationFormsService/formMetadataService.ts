import { FORM_METADATA_URL } from './constants';

/**
 * Response structure from the form metadata API
 */
export interface FormResource {
  uuid: string;
  value: string; // JSON string containing the form schema
}

export interface FormMetadataApiResponse {
  uuid: string;
  name: string;
  version: string;
  published: boolean;
  resources: FormResource[];
}

/**
 * Parsed form metadata structure
 */
export interface FormMetadata {
  uuid: string;
  name: string;
  version: string;
  published: boolean;
  schema: unknown; // The parsed form schema/definition
}

/**
 * Fetches form metadata including the form schema/definition
 * @param formUuid - The UUID of the form to fetch
 * @returns Promise resolving to parsed form metadata
 */
export const fetchFormMetadata = async (
  formUuid: string,
): Promise<FormMetadata> => {
  const response = await fetch(FORM_METADATA_URL(formUuid));

  if (!response.ok) {
    throw new Error(
      `Failed to fetch form metadata for ${formUuid}: ${response.status}`,
    );
  }

  const data: FormMetadataApiResponse = await response.json();

  if (!data.resources || data.resources.length === 0) {
    throw new Error(`No resources found for form ${formUuid}`);
  }

  const formSchema = JSON.parse(data.resources[0].value);

  return {
    uuid: data.uuid,
    name: data.name,
    version: data.version,
    published: data.published,
    schema: formSchema,
  };
};
