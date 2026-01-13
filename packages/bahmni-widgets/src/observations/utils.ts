import { type ObsGroup, type ObservationFormGroup } from '@bahmni/services';
import {
  type ObservationRow,
  type GroupedObservations,
  type FormattedObservationGroup,
  type RenderedObservationRow,
} from './models';

/**
 * Check if a value is an image filename
 */
export const isImageValue = (value: string): boolean => {
  if (!value) return false;
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'];
  const lowerValue = value.toLowerCase();
  return imageExtensions.some((ext) => lowerValue.endsWith(ext));
};

/**
 * Check if a value is a video filename
 */
export const isVideoValue = (value: string): boolean => {
  if (!value) return false;
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
  const lowerValue = value.toLowerCase();
  return videoExtensions.some((ext) => lowerValue.endsWith(ext));
};

/**
 * Get media URL for authenticated document access
 */
export const getMediaUrl = (filename: string): string => {
  return `/openmrs/auth?requested_document=/document_images/${filename}`;
};

/**
 * Group observations by date and transform them into table rows
 */
export const groupObservationsByDate = (
  observations: ObsGroup[],
): GroupedObservations[] => {
  // Group observations by date
  const dateGroups = new Map<string, ObsGroup[]>();
  observations.forEach((obs) => {
    if (!dateGroups.has(obs.date)) {
      dateGroups.set(obs.date, []);
    }
    dateGroups.get(obs.date)!.push(obs);
  });

  if (dateGroups.size === 0) {
    dateGroups.set('', []);
  }

  return Array.from(dateGroups.entries()).map(([date, obs]) => {
    const rows: ObservationRow[] = [];

    obs.forEach((observation) => {
      const valueWithUnit = observation.unit
        ? `${observation.value} ${observation.unit}`
        : observation.value;

      rows.push({
        id: observation.id,
        conceptName: observation.conceptName,
        value: observation.children.length > 0 ? '' : valueWithUnit,
        recordedBy: observation.recordedBy ?? '',
        isChild: false,
      });

      if (observation.children.length > 0) {
        observation.children.forEach((child: ObsGroup) => {
          const childValueWithUnit = child.unit
            ? `${child.value} ${child.unit}`
            : child.value;

          rows.push({
            id: child.id,
            conceptName: child.conceptName,
            value: childValueWithUnit,
            recordedBy: '',
            isChild: true,
          });
        });
      }
    });

    return { date, rows };
  });
};

/**
 * Format grouped observations with rendering and headers for display
 */
export const formatObservationsForDisplay = (
  observations: ObsGroup[],
  renderValue: (value: string, conceptName: string) => React.ReactNode,
  childRowRenderer: (conceptName: string) => React.ReactNode,
  headers: { conceptName: string; value: string; recordedBy: string },
): FormattedObservationGroup[] => {
  const grouped = groupObservationsByDate(observations);

  const headerArray = [
    { key: 'conceptName', header: headers.conceptName },
    { key: 'value', header: headers.value },
    { key: 'recordedBy', header: headers.recordedBy },
  ];

  return grouped.map((group) => ({
    date: group.date,
    headers: headerArray,
    rows: group.rows.map((row): RenderedObservationRow => {
      const renderedValue = row.value
        ? renderValue(row.value, row.conceptName)
        : '';

      return {
        id: row.id,
        conceptName: row.isChild
          ? childRowRenderer(row.conceptName)
          : row.conceptName,
        value: renderedValue,
        recordedBy: row.recordedBy,
      };
    }),
  }));
};

/**
 * Extract form name from FHIR extension path
 * Path format: "Bahmni^History and Examination.1/25-0"
 * Returns: "History and Examination"
 */
export const extractFormName = (formNamespacePath: string): string => {
  if (!formNamespacePath) return 'Unknown Form';

  // Split by ^ and get the second part
  const parts = formNamespacePath.split('^');
  if (parts.length < 2) return 'Unknown Form';

  // Get form name before the version number
  const formPart = parts[1].split('.')[0];
  return formPart || 'Unknown Form';
};

/**
 * Group observations by form name
 */
export const groupObservationsByForm = (
  observations: ObsGroup[],
): ObservationFormGroup[] => {
  const formGroups = new Map<string, ObsGroup[]>();

  observations.forEach((obs) => {
    const formName = obs.formName || 'General Observations';
    if (!formGroups.has(formName)) {
      formGroups.set(formName, []);
    }
    formGroups.get(formName)!.push(obs);
  });

  return Array.from(formGroups.entries()).map(([formName, observations]) => ({
    formName,
    observations,
  }));
};
