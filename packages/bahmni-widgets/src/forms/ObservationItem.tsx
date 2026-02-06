import classNames from 'classnames';
import React from 'react';
import { ObservationData } from './models';
import styles from './styles/FormsTable.module.scss';

interface ObservationItemProps {
  observation: ObservationData;
  index: number;
  formName?: string;
}

interface ObservationMemberProps {
  member: ObservationData;
  depth?: number;
  memberIndex?: number;
  formName?: string;
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
  memberIndex = 0,
  formName = '',
}) => {
  const hasGroupMembers = member.groupMembers && member.groupMembers.length > 0;
  const displayLabel =
    member.conceptNameToDisplay ??
    member.concept?.shortName ??
    member.concept?.name;
  const testIdPrefix = formName ? `${formName}-` : '';

  if (hasGroupMembers) {
    // Render as a nested group - label at current depth, children at depth + 1
    return (
      <div
        className={styles.nestedGroup}
        data-testid={`${testIdPrefix}obs-nested-group-${displayLabel}-${memberIndex}`}
      >
        <div
          className={styles.nestedGroupLabel}
          data-testid={`${testIdPrefix}obs-nested-group-label-${displayLabel}-${memberIndex}`}
          // eslint-disable-next-line react/forbid-dom-props
          style={{ paddingLeft: `${depth * 16}px` }}
        >
          {displayLabel}
        </div>
        <div
          className={styles.nestedGroupMembers}
          data-testid={`${testIdPrefix}obs-nested-group-members-${displayLabel}-${memberIndex}`}
        >
          {member.groupMembers?.map((nestedMember, nestedIndex) => (
            <ObservationMember
              key={`${nestedMember.concept.uuid}`}
              member={nestedMember}
              depth={depth + 1}
              memberIndex={nestedIndex}
              formName={formName}
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
      data-testid={`${testIdPrefix}obs-member-row-${displayLabel}-${memberIndex}`}
      // eslint-disable-next-line react/forbid-dom-props
      style={{ paddingLeft: `${depth * 16}px` }}
    >
      <p
        className={classNames(
          styles.memberLabel,
          isAbnormal ? styles.abnormalValue : '',
        )}
        data-testid={`${testIdPrefix}obs-member-label-${displayLabel}-${memberIndex}`}
      >
        {displayLabel}
        {rangeString}
      </p>
      <p
        className={classNames(
          styles.memberValue,
          isAbnormal ? styles.abnormalValue : '',
        )}
        data-testid={`${testIdPrefix}obs-member-value-${displayLabel}-${memberIndex}`}
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
  formName = '',
}) => {
  const hasGroupMembers =
    observation.groupMembers && observation.groupMembers.length > 0;

  const { units, rangeString, isAbnormal } =
    getObservationDisplayInfo(observation);

  const testIdPrefix = formName ? `${formName}-` : '';

  return (
    <div
      key={`${observation.concept.uuid}-${index}`}
      className={styles.observation}
      data-testid={`${testIdPrefix}observation-item-${observation.conceptNameToDisplay}-${index}`}
    >
      <div
        className={
          hasGroupMembers ? styles.groupContainer : styles.rowContainer
        }
        data-testid={`${testIdPrefix}observation-container-${observation.conceptNameToDisplay}-${index}`}
      >
        <p
          className={classNames(
            hasGroupMembers ? styles.groupLabel : styles.rowLabel,
            !hasGroupMembers && isAbnormal ? styles.abnormalValue : '',
          )}
          data-testid={`${testIdPrefix}observation-label-${observation.conceptNameToDisplay}-${index}`}
        >
          {observation.conceptNameToDisplay}
          {!hasGroupMembers && rangeString && (
            <span className={styles.rangeInfo}>{rangeString}</span>
          )}
        </p>
        {hasGroupMembers ? (
          <div
            className={styles.groupMembers}
            data-testid={`${testIdPrefix}observation-group-members-${observation.conceptNameToDisplay}-${index}`}
          >
            {observation.groupMembers?.map((member, memberIndex) => (
              <ObservationMember
                key={`${member.concept.uuid}`}
                member={member}
                depth={0}
                memberIndex={memberIndex}
                formName={formName}
              />
            ))}
          </div>
        ) : (
          <p
            className={classNames(
              styles.rowValue,
              isAbnormal ? styles.abnormalValue : '',
            )}
            data-testid={`${testIdPrefix}observation-value-${observation.conceptNameToDisplay}-${index}`}
          >
            {observation.valueAsString}
            {units && ` ${units}`}
          </p>
        )}
      </div>
      {observation.comment && (
        <div
          className={styles.commentSection}
          data-testid={`${testIdPrefix}observation-comment-${observation.conceptNameToDisplay}-${index}`}
        >
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
