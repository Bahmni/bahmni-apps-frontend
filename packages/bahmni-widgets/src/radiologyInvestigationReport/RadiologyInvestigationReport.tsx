import { SortableDataTable } from '@bahmni/design-system';
import { getDiagnosticReportBundle } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import classNames from 'classnames';
import type { Bundle, Observation, Encounter } from 'fhir/r4';
import React, { useMemo } from 'react';
import { ExtractedObservation } from '../observations/models';
import { extractObservationsFromBundle } from '../observations/utils';
import styles from './styles/RadiologyInvestigationReport.module.scss';

export interface RadiologyInvestigationReportProps {
  reportId: string;
}

interface ObservationMemberProps {
  member: ExtractedObservation;
  depth?: number;
  memberIndex?: number;
}

const getObservationDisplayInfo = (observation: ExtractedObservation) => {
  const observationValue = observation.observationValue;
  if (!observationValue) {
    return { rangeString: '', isAbnormal: false };
  }

  const { value, unit, referenceRange } = observationValue;
  const lowNormal = referenceRange?.low?.value;
  const hiNormal = referenceRange?.high?.value;

  const hasLow = lowNormal != null;
  const hasHigh = hiNormal != null;

  const rangeString =
    hasLow && hasHigh
      ? ` (${lowNormal} - ${hiNormal})`
      : hasLow
        ? ` (>${lowNormal})`
        : hasHigh
          ? ` (<${hiNormal})`
          : '';

  const isAbnormal = observationValue.isAbnormal ?? false;

  return {
    rangeString,
    isAbnormal,
    value: unit ? `${value} ${unit}` : String(value),
  };
};

const ObservationMember: React.FC<ObservationMemberProps> = ({
  member,
  depth = 0,
  memberIndex = 0,
}) => {
  const hasMembers = member.members && member.members.length > 0;
  const displayLabel = member.display;

  if (hasMembers) {
    return (
      <div
        className={styles.nestedGroup}
        data-testid={`obs-nested-group-${displayLabel}-${memberIndex}`}
      >
        <div
          className={styles.nestedGroupLabel}
          data-testid={`obs-nested-group-label-${displayLabel}-${memberIndex}`}
          // eslint-disable-next-line react/forbid-dom-props
          style={{ paddingLeft: `${depth * 16}px` }}
        >
          {displayLabel}
        </div>
        <div
          className={styles.nestedGroupMembers}
          data-testid={`obs-nested-group-members-${displayLabel}-${memberIndex}`}
        >
          {member.members?.map((nestedMember, nestedIndex) => (
            <ObservationMember
              key={`${nestedMember.id}-${nestedMember.id}`}
              member={nestedMember}
              depth={depth + 1}
              memberIndex={nestedIndex}
            />
          ))}
        </div>
      </div>
    );
  }

  const { rangeString, isAbnormal, value } = getObservationDisplayInfo(member);

  return (
    <div
      className={styles.memberRow}
      data-testid={`obs-member-row-${displayLabel}-${memberIndex}`}
      // eslint-disable-next-line react/forbid-dom-props
      style={{ paddingLeft: `${depth * 16}px` }}
    >
      <p
        className={classNames(
          styles.memberLabel,
          isAbnormal ? styles.abnormalValue : '',
        )}
        data-testid={`obs-member-label-${displayLabel}-${memberIndex}`}
      >
        {displayLabel}
        {rangeString}
      </p>
      <p
        className={classNames(
          styles.memberValue,
          isAbnormal ? styles.abnormalValue : '',
        )}
        data-testid={`obs-member-value-${displayLabel}-${memberIndex}`}
      >
        {value}
      </p>
    </div>
  );
};

const renderObservation = (
  observation: ExtractedObservation,
  index: number,
) => {
  const hasMembers = observation.members && observation.members.length > 0;
  const { rangeString, isAbnormal, value } =
    getObservationDisplayInfo(observation);

  return (
    <div
      key={`${observation.id}-${index}`}
      className={styles.observation}
      data-testid={`observation-item-${observation.display}-${index}`}
    >
      <div
        className={hasMembers ? styles.groupContainer : styles.rowContainer}
        data-testid={`observation-container-${observation.display}-${index}`}
      >
        <p
          className={classNames(
            hasMembers ? styles.groupLabel : styles.rowLabel,
            !hasMembers && isAbnormal ? styles.abnormalValue : '',
          )}
          data-testid={`observation-label-${observation.display}-${index}`}
        >
          {observation.display}
          {!hasMembers && rangeString && (
            <span className={styles.rangeInfo}>{rangeString}</span>
          )}
        </p>
        {hasMembers ? (
          <div
            className={styles.groupMembers}
            data-testid={`observation-group-members-${observation.display}-${index}`}
          >
            {observation.members?.map((member, memberIndex) => (
              <ObservationMember
                key={`${member.id}-${member.id}`}
                member={member}
                depth={0}
                memberIndex={memberIndex}
              />
            ))}
          </div>
        ) : (
          <p
            className={classNames(
              styles.rowValue,
              isAbnormal ? styles.abnormalValue : '',
            )}
            data-testid={`observation-value-${observation.display}-${index}`}
          >
            {value}
          </p>
        )}
      </div>
    </div>
  );
};

export const RadiologyInvestigationReport: React.FC<
  RadiologyInvestigationReportProps
> = ({ reportId }) => {
  const { data: diagnosticReportBundle, isLoading: isLoadingReportBundle } =
    useQuery({
      queryKey: ['diagnosticReportBundle', reportId],
      queryFn: () => getDiagnosticReportBundle(reportId),
      enabled: !!reportId,
    });

  const transformedObservations = useMemo(() => {
    if (!diagnosticReportBundle) return null;

    return extractObservationsFromBundle(
      diagnosticReportBundle as Bundle<Observation | Encounter>,
    );
  }, [diagnosticReportBundle]);

  const headers = [
    { key: 'label', header: 'label' },
    { key: 'value', header: 'value' },
  ];

  if (isLoadingReportBundle) {
    return (
      <SortableDataTable headers={headers} rows={[]} loading ariaLabel={''} />
    );
  }

  if (!transformedObservations) {
    return null;
  }

  const { observations, groupedObservations } = transformedObservations;

  const sortedObservations = observations
    .concat(groupedObservations)
    .sort(({ sortId: xSortId = '' }, { sortId: ySortId = '' }) =>
      xSortId.localeCompare(ySortId, undefined, { numeric: true }),
    );

  const multiSelectGroupedObservations = sortedObservations.reduce(
    (
      valueGroupedObs: ExtractedObservation[],
      observation: ExtractedObservation,
    ) => {
      const matchedObs = valueGroupedObs.find(
        (obs: ExtractedObservation) => obs.conceptId === observation.conceptId,
      );

      if (matchedObs) {
        matchedObs.observationValue!.value =
          matchedObs.observationValue?.value +
          ', ' +
          observation.observationValue?.value;
      } else {
        valueGroupedObs.push(observation);
      }
      return valueGroupedObs;
    },
    [],
  );

  return (
    <div
      id="radiology-observations"
      data-testid="radiology-observations-test-id"
      aria-label="radiology-observations-aria-label"
      className={styles.resultsContainer}
    >
      {multiSelectGroupedObservations.map((obs, index) =>
        renderObservation(obs, index),
      )}
    </div>
  );
};

export default RadiologyInvestigationReport;
