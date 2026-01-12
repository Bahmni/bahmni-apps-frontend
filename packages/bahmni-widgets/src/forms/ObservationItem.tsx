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
          {member.groupMembers?.map((nestedMember, idx) => (
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
  return (
    <div
      className={styles.memberRow}
      // eslint-disable-next-line react/forbid-dom-props
      style={{ paddingLeft: `${depth * 16}px` }}
    >
      <p className={styles.memberLabel}>{displayLabel}</p>
      <p className={styles.memberValue}>{member.valueAsString}</p>
    </div>
  );
};

export const ObservationItem: React.FC<ObservationItemProps> = ({
  observation,
  index,
}) => {
  const hasGroupMembers =
    observation.groupMembers && observation.groupMembers.length > 0;

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
        <p className={hasGroupMembers ? styles.groupLabel : styles.rowLabel}>
          {observation.conceptNameToDisplay}
        </p>
        {hasGroupMembers ? (
          <div className={styles.groupMembers}>
            {observation.groupMembers?.map((member, idx) => (
              <ObservationMember
                key={`${member.concept.uuid}`}
                member={member}
                depth={0}
              />
            ))}
          </div>
        ) : (
          <p className={styles.rowValue}>{observation.valueAsString}</p>
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
