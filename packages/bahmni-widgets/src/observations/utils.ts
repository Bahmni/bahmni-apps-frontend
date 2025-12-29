import {
  type Observation,
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
export const groupObservationsByDate = <T extends Observation>(
  observations: T[],
): GroupedObservations[] => {
  // Group observations by date
  const dateGroups = new Map<string, T[]>();
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
        observation.children.forEach((child) => {
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
export const formatObservationsForDisplay = <T extends Observation>(
  observations: T[],
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
