import classNames from 'classnames';
import React from 'react';
import { ObservationData } from './models';
import styles from './styles/FormsTable.module.scss';

interface ObservationItemProps {
  observation: ObservationData;
  index: number;
}

interface ObservationMemberProps {
  member: ObservationData;
  depth?: number;
}

const INTERPRETATION_ABNORMAL = 'ABNORMAL';
/**
 * Utility function to get range string and abnormal status for an observation
 */
const getObservationDisplayInfo = (observation: ObservationData) => {
  const units = observation.concept?.units;
  const lowNormal = observation.concept?.lowNormal;
  const hiNormal = observation.concept?.hiNormal;

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

  const isAbnormal =
    observation.interpretation &&
    observation.interpretation.toUpperCase() === INTERPRETATION_ABNORMAL;

  return { units, rangeString, isAbnormal };
};

/**
 * Recursive component to render observation members at any depth
 */
const ObservationMember: React.FC<ObservationMemberProps> = ({
  member,
  depth = 0,
}) => {
  const hasGroupMembers = member.groupMembers && member.groupMembers.length > 0;
  const displayLabel =
    member.conceptNameToDisplay ??
    member.concept?.shortName ??
    member.concept?.name;

  if (hasGroupMembers) {
    // Render as a nested group - label at current depth, children at depth + 1
    return (
      <div className={styles.nestedGroup}>
        <div
          className={styles.nestedGroupLabel}
          // eslint-disable-next-line react/forbid-dom-props
          style={{ paddingLeft: `${depth * 16}px` }}
        >
          {displayLabel}
        </div>
        <div className={styles.nestedGroupMembers}>
          {member.groupMembers?.map((nestedMember) => (
            <ObservationMember
              key={`${nestedMember.concept.uuid}`}
              member={nestedMember}
              depth={depth + 1}
            />
          ))}
        </div>
      </div>
    );
  }

  // Render as a leaf node (value) at current depth
  const { units, rangeString, isAbnormal } = getObservationDisplayInfo(member);

  return (
    <div
      className={styles.memberRow}
      // eslint-disable-next-line react/forbid-dom-props
      style={{ paddingLeft: `${depth * 16}px` }}
    >
      <p
        className={classNames(
          styles.memberLabel,
          isAbnormal ? styles.abnormalValue : '',
        )}
      >
        {displayLabel}
        {rangeString}
      </p>
      <p
        className={classNames(
          styles.memberValue,
          isAbnormal ? styles.abnormalValue : '',
        )}
      >
        {member.valueAsString}
        {units && ` ${units}`}
      </p>
    </div>
  );
};

export const ObservationItem: React.FC<ObservationItemProps> = ({
  observation,
  index,
}) => {
  const hasGroupMembers =
    observation.groupMembers && observation.groupMembers.length > 0;

  const { units, rangeString, isAbnormal } =
    getObservationDisplayInfo(observation);

  return (
    <div
      key={`${observation.concept.uuid}-${index}`}
      className={styles.observation}
    >
      <div
        className={
          hasGroupMembers ? styles.groupContainer : styles.rowContainer
        }
      >
        <p
          className={classNames(
            hasGroupMembers ? styles.groupLabel : styles.rowLabel,
            !hasGroupMembers && isAbnormal ? styles.abnormalValue : '',
          )}
        >
          {observation.conceptNameToDisplay}
          {!hasGroupMembers && rangeString && (
            <span className={styles.rangeInfo}>{rangeString}</span>
          )}
        </p>
        {hasGroupMembers ? (
          <div className={styles.groupMembers}>
            {observation.groupMembers?.map((member) => (
              <ObservationMember
                key={`${member.concept.uuid}`}
                member={member}
                depth={0}
              />
            ))}
          </div>
        ) : (
          <p
            className={classNames(
              styles.rowValue,
              isAbnormal ? styles.abnormalValue : '',
            )}
          >
            {observation.valueAsString}
            {units && ` ${units}`}
          </p>
        )}
      </div>
      {observation.comment && (
        <div className={styles.commentSection}>
          <span className={styles.commentText}>
            {observation.comment}
            {observation.providers?.[0]?.name &&
              ` - by ${observation.providers[0].name}`}
          </span>
        </div>
      )}
    </div>
  );
};

export default ObservationItem;
