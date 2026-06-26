import {
  SortableDataTable,
  ImageTile,
  VideoTile,
  FileTile,
} from '@bahmni/design-system';
import { useTranslation, getValueType } from '@bahmni/services';
import classNames from 'classnames';
import type { Observation } from 'fhir/r4';
import React, { useMemo } from 'react';
import { ExtractedObservation } from '../observations/models';
import { formatObservationValue } from '../observations/utils';
import {
  getObservationDisplayInfo,
  sortObservationsBySortId,
  sortObservationsByControlOrder,
  groupMultiSelectObservations,
  transformObservations,
} from '../utils/Observations';
import styles from './styles/ObservationsRenderer.module.scss';

export interface ObservationsRendererProps {
  observations: Observation[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  emptyStateMessage?: string;
  className?: string;
  testIdPrefix?: string;
  hideThumbnail?: boolean;
  controlOrder?: string[];
  sectionMap?: Record<string, string>;
}

interface ObservationMemberProps {
  member: ExtractedObservation;
  depth?: number;
  memberIndex?: number;
  testIdPrefix?: string;
  hideThumbnail?: boolean;
}

const renderValueWithMedia = (
  valueAsString: string,
  hideThumbnail = false,
): React.ReactNode => {
  if (valueAsString.includes(', ')) {
    const parts = valueAsString.split(', ');
    const hasMediaPart = parts.some((part) => {
      const type = getValueType(part);
      return type === 'Image' || type === 'Video' || type === 'PDF';
    });

    if (hasMediaPart) {
      return (
        <div className={styles.mediaGroup}>
          {parts.map((part) => (
            <React.Fragment key={part}>
              {renderValueWithMedia(part, hideThumbnail)}
            </React.Fragment>
          ))}
        </div>
      );
    }
  }

  const valueType = getValueType(valueAsString);

  if (valueType === 'Image') {
    return (
      <ImageTile
        imageSrc={valueAsString}
        alt={valueAsString}
        id={`${valueAsString}-img`}
        hideThumbnail={hideThumbnail}
      />
    );
  }

  if (valueType === 'Video') {
    return (
      <VideoTile
        id={`${valueAsString}-video`}
        videoSrc={valueAsString}
        hideThumbnail={hideThumbnail}
      />
    );
  }

  if (valueType === 'PDF') {
    return <FileTile id={`${valueAsString}-pdf`} src={valueAsString} />;
  }

  return valueAsString;
};

const ObservationMember: React.FC<ObservationMemberProps> = ({
  member,
  depth = 0,
  memberIndex = 0,
  testIdPrefix = '',
  hideThumbnail = false,
}) => {
  const { t } = useTranslation();
  const hasMembers = member.members && member.members.length > 0;
  const displayLabel = member.display;
  const prefix = testIdPrefix ? `${testIdPrefix}-` : '';

  if (hasMembers) {
    return (
      <div
        className={styles.nestedGroup}
        data-testid={`${prefix}obs-nested-group-${displayLabel}-${memberIndex}`}
      >
        <div
          className={styles.nestedGroupLabel}
          data-testid={`${prefix}obs-nested-group-label-${displayLabel}-${memberIndex}`}
          // eslint-disable-next-line react/forbid-dom-props
          style={{ paddingLeft: `${depth * 16}px` }}
        >
          {displayLabel}
        </div>
        <div
          className={styles.nestedGroupMembers}
          data-testid={`${prefix}obs-nested-group-members-${displayLabel}-${memberIndex}`}
        >
          {member.members?.map((nestedMember, nestedIndex) => (
            <ObservationMember
              key={nestedMember.id}
              member={nestedMember}
              depth={depth + 1}
              memberIndex={nestedIndex}
              testIdPrefix={testIdPrefix}
              hideThumbnail={hideThumbnail}
            />
          ))}
        </div>
      </div>
    );
  }

  const { rangeString, isAbnormal } = getObservationDisplayInfo(member);
  const formattedValue = formatObservationValue(member, t);
  const valueToDisplay = formattedValue
    ? renderValueWithMedia(formattedValue, hideThumbnail)
    : null;

  return (
    <>
      <div
        className={styles.memberRow}
        data-testid={`${prefix}obs-member-row-${displayLabel}-${memberIndex}`}
        // eslint-disable-next-line react/forbid-dom-props
        style={{ paddingLeft: `${depth * 16}px` }}
      >
        <div
          className={classNames(
            styles.memberLabel,
            isAbnormal ? styles.abnormalValue : '',
          )}
          data-testid={`${prefix}obs-member-label-${displayLabel}-${memberIndex}`}
        >
          <span>{displayLabel}</span>
          {rangeString && <p className={styles.rangeInfo}>{rangeString}</p>}
        </div>
        <div
          className={classNames(
            styles.memberValue,
            isAbnormal ? styles.abnormalValue : '',
          )}
          data-testid={`${prefix}obs-member-value-${displayLabel}-${memberIndex}`}
        >
          {valueToDisplay}
        </div>
      </div>
      {member.comment && (
        <p
          className={styles.commentSection}
          data-testid={`${prefix}obs-member-comment-${displayLabel}-${memberIndex}`}
          // eslint-disable-next-line react/forbid-dom-props
          style={{ paddingLeft: `${depth * 16}px` }}
        >
          {member.comment}
          {member.encounter?.provider && ` - by ${member.encounter.provider}`}
        </p>
      )}
    </>
  );
};

const renderObservation = (
  observation: ExtractedObservation,
  index: number,
  t: (key: string) => string,
  testIdPrefix = '',
  hideThumbnail = false,
) => {
  const hasMembers = observation.members && observation.members.length > 0;
  const { rangeString, isAbnormal } = getObservationDisplayInfo(observation);
  const formattedValue = formatObservationValue(observation, t);
  const valueToDisplay = formattedValue
    ? renderValueWithMedia(formattedValue, hideThumbnail)
    : null;
  const prefix = testIdPrefix ? `${testIdPrefix}-` : '';

  return (
    <div
      key={`${observation.id}-${index}`}
      className={styles.observation}
      data-testid={`${prefix}observation-item-${observation.display}-${index}`}
    >
      <div
        className={hasMembers ? styles.groupContainer : styles.rowContainer}
        data-testid={`${prefix}observation-container-${observation.display}-${index}`}
      >
        <div
          className={classNames(
            hasMembers ? styles.groupLabel : styles.rowLabel,
            !hasMembers && isAbnormal ? styles.abnormalValue : '',
          )}
          data-testid={`${prefix}observation-label-${observation.display}-${index}`}
        >
          <span>{observation.display}</span>
          {!hasMembers && rangeString && (
            <p className={styles.rangeInfo}>{rangeString}</p>
          )}
        </div>
        {hasMembers ? (
          <div
            className={styles.groupMembers}
            data-testid={`${prefix}observation-group-members-${observation.display}-${index}`}
          >
            {observation.members?.map((member, memberIndex) => (
              <ObservationMember
                key={member.id}
                member={member}
                depth={0}
                memberIndex={memberIndex}
                testIdPrefix={testIdPrefix}
                hideThumbnail={hideThumbnail}
              />
            ))}
          </div>
        ) : (
          <div
            className={classNames(
              styles.rowValue,
              isAbnormal ? styles.abnormalValue : '',
            )}
            data-testid={`${prefix}observation-value-${observation.display}-${index}`}
          >
            {valueToDisplay}
          </div>
        )}
      </div>
      {observation.comment && (
        <p
          className={styles.commentSection}
          data-testid={`${prefix}observation-comment-${observation.display}-${index}`}
        >
          {observation.comment}
          {observation.encounter?.provider &&
            ` - by ${observation.encounter.provider}`}
        </p>
      )}
    </div>
  );
};

export const ObservationsRenderer: React.FC<ObservationsRendererProps> = ({
  observations,
  isLoading = false,
  isError = false,
  errorMessage,
  emptyStateMessage,
  className,
  testIdPrefix = '',
  hideThumbnail = false,
  controlOrder,
  sectionMap,
}) => {
  const { t } = useTranslation();

  const processedObservations = useMemo(() => {
    if (observations.length === 0) return [];

    const transformed = transformObservations(observations);
    const sorted =
      controlOrder && controlOrder.length > 0
        ? sortObservationsByControlOrder(transformed, controlOrder)
        : sortObservationsBySortId(transformed);
    return groupMultiSelectObservations(sorted);
  }, [observations, controlOrder]);

  const headers = [
    { key: 'label', header: 'label' },
    { key: 'value', header: 'value' },
  ];

  if (isLoading) {
    return (
      <SortableDataTable
        headers={headers}
        rows={[]}
        loading
        ariaLabel="Loading observations"
        className={classNames(styles.fullWidth, className)}
        dataTestId="observations-table"
      />
    );
  }

  if (isError) {
    return (
      <SortableDataTable
        headers={headers}
        rows={[]}
        errorStateMessage={errorMessage ?? t('ERROR_LOADING_OBSERVATIONS')}
        ariaLabel="Observations error"
        className={classNames(styles.fullWidth, className)}
      />
    );
  }

  if (processedObservations.length === 0) {
    return (
      <SortableDataTable
        headers={headers}
        rows={[]}
        emptyStateMessage={emptyStateMessage ?? t('NO_OBSERVATIONS_AVAILABLE')}
        ariaLabel="No observations"
        className={classNames(styles.fullWidth, className)}
      />
    );
  }

  // Group observations: standalone obs render as rows; observations belonging
  // to a form section are collected into a group rendered like an obsGroupControl.
  type RenderGroup =
    | { kind: 'obs'; obs: ExtractedObservation; index: number }
    | {
        kind: 'section';
        name: string;
        members: { obs: ExtractedObservation; index: number }[];
      };

  const renderGroups: RenderGroup[] = [];
  let currentSectionGroup: Extract<RenderGroup, { kind: 'section' }> | null =
    null;

  processedObservations.forEach((obs, index) => {
    const controlId = obs.sortId?.split('-')[0] ?? '';
    const sectionName = sectionMap?.[controlId] ?? null;

    if (sectionName) {
      if (currentSectionGroup?.name !== sectionName) {
        currentSectionGroup = {
          kind: 'section',
          name: sectionName,
          members: [],
        };
        renderGroups.push(currentSectionGroup);
      }
      currentSectionGroup.members.push({ obs, index });
    } else {
      currentSectionGroup = null;
      renderGroups.push({ kind: 'obs', obs, index });
    }
  });

  const prefix = testIdPrefix ? `${testIdPrefix}-` : '';

  const elements: React.ReactNode[] = renderGroups.map((group) => {
    if (group.kind === 'obs') {
      return renderObservation(
        group.obs,
        group.index,
        t,
        testIdPrefix,
        hideThumbnail,
      );
    }
    // Render form section exactly like an obsGroupControl
    return (
      <div
        key={`section-${group.name}`}
        className={styles.observation}
        data-testid={`${prefix}section-${group.name}`}
      >
        <div className={styles.groupContainer}>
          <div
            className={styles.groupLabel}
            data-testid={`${prefix}section-label-${group.name}`}
          >
            {group.name}
          </div>
          <div className={styles.groupMembers}>
            {group.members.map(({ obs, index: memberIndex }) => (
              <ObservationMember
                key={obs.id}
                member={obs}
                depth={0}
                memberIndex={memberIndex}
                testIdPrefix={testIdPrefix}
                hideThumbnail={hideThumbnail}
              />
            ))}
          </div>
        </div>
      </div>
    );
  });

  return (
    <div
      id="observations-renderer"
      data-testid="observations-renderer-test-id"
      aria-label="observations-renderer-aria-label"
      className={classNames(styles.resultsContainer, className)}
    >
      {elements}
    </div>
  );
};

export default ObservationsRenderer;
