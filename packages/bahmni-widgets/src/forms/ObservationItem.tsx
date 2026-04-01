import { ImageTile, VideoTile, FileTile } from '@bahmni/design-system';
import { getValueType, useTranslation } from '@bahmni/services';
import classNames from 'classnames';
import React from 'react';
import { ExtractedObservation } from '../observations/models';
import { formatObservationValue } from '../observations/utils';
import styles from './styles/FormsTable.module.scss';

interface ObservationItemProps {
  observation: ExtractedObservation;
  index: number;
  formName?: string;
  comment?: string;
}

interface ObservationMemberProps {
  member: ExtractedObservation;
  depth?: number;
  memberIndex?: number;
  formName?: string;
  comment?: string;
}

/**
 * Helper function to render value with media support (images/videos)
 */
const renderValueWithMedia = (valueAsString: string): React.ReactNode => {
  const valueType = getValueType(valueAsString);

  if (valueType === 'Image') {
    return (
      <ImageTile
        imageSrc={valueAsString}
        alt={valueAsString}
        id={`${valueAsString}-img`}
      />
    );
  }

  if (valueType === 'Video') {
    return <VideoTile id={`${valueAsString}-video`} videoSrc={valueAsString} />;
  }

  if (valueType === 'PDF') {
    return <FileTile id={`${valueAsString}-pdf`} src={valueAsString} />;
  }

  return valueAsString;
};

const getObservationDisplayInfo = (observation: ExtractedObservation) => {
  const lowNormal = observation.observationValue?.referenceRange?.low?.value;
  const hiNormal = observation.observationValue?.referenceRange?.high?.value;

  const hasLow = lowNormal != null;
  const hasHigh = hiNormal != null;

  let rangeString = '';
  if (hasLow && hasHigh) {
    rangeString = ` (${lowNormal} - ${hiNormal})`;
  } else if (hasLow) {
    rangeString = ` (>${lowNormal})`;
  } else if (hasHigh) {
    rangeString = ` (<${hiNormal})`;
  }

  const isAbnormal = observation.observationValue?.isAbnormal === true;

  return { rangeString, isAbnormal };
};

/**
 * Recursive component to render observation members at any depth
 */
const ObservationMember: React.FC<ObservationMemberProps> = ({
  member,
  depth = 0,
  memberIndex = 0,
  formName = '',
  comment,
}) => {
  const { t } = useTranslation();
  const hasGroupMembers = member.members && member.members.length > 0;
  const displayLabel = member.display;
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
          {member.members?.map((nestedMember, nestedIndex) => (
            <ObservationMember
              key={`${nestedMember.id}`}
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
  const { rangeString, isAbnormal } = getObservationDisplayInfo(member);
  const formattedValue = formatObservationValue(member, t);
  const valueToDisplay = formattedValue
    ? renderValueWithMedia(formattedValue)
    : null;

  return (
    <>
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
        <div
          className={classNames(
            styles.memberValue,
            isAbnormal ? styles.abnormalValue : '',
          )}
          data-testid={`${testIdPrefix}obs-member-value-${displayLabel}-${memberIndex}`}
        >
          {valueToDisplay}
        </div>
      </div>
      {comment && (
        <div
          className={styles.commentSection}
          data-testid={`${testIdPrefix}obs-member-comment-${displayLabel}-${memberIndex}`}
          // eslint-disable-next-line react/forbid-dom-props
          style={{ paddingLeft: `${depth * 16}px` }}
        >
          <span className={styles.commentText}>
            {comment}
            {member.encounter?.provider && ` - by ${member.encounter.provider}`}
          </span>
        </div>
      )}
    </>
  );
};

export const ObservationItem: React.FC<ObservationItemProps> = ({
  observation,
  index,
  formName = '',
  comment,
}) => {
  const { t } = useTranslation();
  const hasGroupMembers = observation.members && observation.members.length > 0;

  const { rangeString, isAbnormal } = getObservationDisplayInfo(observation);

  const testIdPrefix = formName ? `${formName}-` : '';
  const formattedValue = formatObservationValue(observation, t);
  const valueToDisplay = formattedValue
    ? renderValueWithMedia(formattedValue)
    : null;

  return (
    <div
      key={`${observation.id}-${index}`}
      className={styles.observation}
      data-testid={`${testIdPrefix}observation-item-${observation.display}-${index}`}
    >
      <div
        className={
          hasGroupMembers ? styles.groupContainer : styles.rowContainer
        }
        data-testid={`${testIdPrefix}observation-container-${observation.display}-${index}`}
      >
        <p
          className={classNames(
            hasGroupMembers ? styles.groupLabel : styles.rowLabel,
            !hasGroupMembers && isAbnormal ? styles.abnormalValue : '',
          )}
          data-testid={`${testIdPrefix}observation-label-${observation.display}-${index}`}
        >
          {observation.display}
          {!hasGroupMembers && rangeString && (
            <span className={styles.rangeInfo}>{rangeString}</span>
          )}
        </p>
        {hasGroupMembers ? (
          <div
            className={styles.groupMembers}
            data-testid={`${testIdPrefix}observation-group-members-${observation.display}-${index}`}
          >
            {observation.members?.map((member, memberIndex) => (
              <ObservationMember
                key={`${member.id}`}
                member={member}
                depth={0}
                memberIndex={memberIndex}
                formName={formName}
              />
            ))}
          </div>
        ) : (
          <div
            className={classNames(
              styles.rowValue,
              isAbnormal ? styles.abnormalValue : '',
            )}
            data-testid={`${testIdPrefix}observation-value-${observation.display}-${index}`}
          >
            {valueToDisplay}
          </div>
        )}
      </div>
      {comment && (
        <div
          className={styles.commentSection}
          data-testid={`${testIdPrefix}observation-comment-${observation.display}-${index}`}
        >
          <span className={styles.commentText}>
            {comment}
            {observation.encounter?.provider &&
              ` - by ${observation.encounter.provider}`}
          </span>
        </div>
      )}
    </div>
  );
};

export default ObservationItem;
