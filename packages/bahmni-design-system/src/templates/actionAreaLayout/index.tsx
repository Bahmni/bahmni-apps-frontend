import classNames from 'classnames';
import React, { ReactNode } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { ICON_SIZE } from '../../molecules/icon/constants';
import { Icon } from '../../molecules/icon/Icon';
import styles from './styles/index.module.scss';

const MAIN_DISPLAY_PANEL_DEFAULT_SIZE = 40;
const ACTION_AREA_PANEL_DEFAULT_SIZE = 60;
const PANEL_MIN_SIZE = 40;

type LayoutVariant = 'default' | 'extended';

interface ActionAreaLayoutProps {
  headerWSideNav: ReactNode;
  patientHeader: ReactNode;
  mainDisplay: ReactNode;
  actionArea: ReactNode;
  isActionAreaVisible: boolean;
  layoutVariant?: LayoutVariant;
}

/**
 * ActionArea Layout provides the layout structure for pages with four distinct sections:
 * 1. HeaderWSideNav - at the top of the screen, full width along with the left side navigation
 * 2. Patient Details - below header, spans full width
 * 3. Main Display - right side, scrollable content area
 * 4. Action Area - right side, conditionally displayed
 *
 * @param {ReactNode} headerWSideNav - The header component
 * @param {ReactNode} patientHeader - The patient header component
 * @param {ReactNode} mainDisplay - The main content to display
 * @param {ReactNode} actionArea - The action area component
 * @param {boolean} isActionAreaVisible - Flag to control visibility of the action area
 * @returns {React.ReactElement} The ActionAreaLayout component
 */
const ActionAreaLayout: React.FC<ActionAreaLayoutProps> = ({
  headerWSideNav,
  patientHeader,
  mainDisplay,
  actionArea,
  isActionAreaVisible,
  layoutVariant = 'default',
}) => {
  return (
    <div
      className={classNames(
        styles.layout,
        isActionAreaVisible && styles.collapsedModal,
      )}
      id="actionAreaLayout"
    >
      {headerWSideNav}
      <Group orientation="horizontal" className={styles.panelGroup}>
        <Panel
          defaultSize={MAIN_DISPLAY_PANEL_DEFAULT_SIZE}
          minSize={PANEL_MIN_SIZE}
        >
          <div
            className={classNames(
              styles.body,
              isActionAreaVisible ? styles.collapse : styles.expand,
            )}
          >
            <div
              className={classNames(
                styles.patientHeader,
                isActionAreaVisible && styles.collapsedPatientHeader,
              )}
            >
              {patientHeader}
            </div>
            <div
              className={classNames(
                styles.mainDisplay,
                isActionAreaVisible && styles.collapsedMainDisplay,
              )}
            >
              {mainDisplay}
            </div>
          </div>
        </Panel>
        {isActionAreaVisible && (
          <>
            <Separator className={styles.separator}>
              <div className={styles.separatorGrip}>
                <Icon
                  name="fa-grip-vertical"
                  id="separator-grip-icon"
                  size={ICON_SIZE.XS}
                />
              </div>
            </Separator>
            <Panel
              defaultSize={ACTION_AREA_PANEL_DEFAULT_SIZE}
              minSize={PANEL_MIN_SIZE}
            >
              <div
                className={classNames(
                  styles.actionArea,
                  layoutVariant === 'extended' && styles.extended,
                )}
              >
                {actionArea}
              </div>
            </Panel>
          </>
        )}
      </Group>
    </div>
  );
};

export default ActionAreaLayout;
