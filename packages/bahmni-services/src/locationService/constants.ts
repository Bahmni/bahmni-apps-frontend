import { OPENMRS_REST_V1 } from '../constants/app';

export const LOCATION_BY_TAG_URL = (tag: string) =>
  `${OPENMRS_REST_V1}/location?operator=ALL&s=byTags&tags=${encodeURIComponent(tag)}&v=custom:(uuid,display,childLocations:(uuid,display,retired))`;
