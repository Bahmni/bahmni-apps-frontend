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
  mainDisplay: ReactNode;
  actionArea: ReactNode;
  isActionAreaVisible: boolean;
  layoutVariant?: LayoutVariant;
}

/**
 * ActionArea Layout provides the layout structure for pages with four distinct sections:
 * 1. HeaderWSideNav - at the top of the screen, full width along with the left side navigation
 * 2. Main Display - right side, scrollable content area
 * 3. Action Area - right side, conditionally displayed
 *
 * @param {ReactNode} headerWSideNav - The header component
 * @param {ReactNode} mainDisplay - The main content to display
 * @param {ReactNode} actionArea - The action area component
 * @param {boolean} isActionAreaVisible - Flag to control visibility of the action area
 * @returns {React.ReactElement} The ActionAreaLayout component
 */
const ActionAreaLayout: React.FC<ActionAreaLayoutProps> = ({
  headerWSideNav,
  mainDisplay,
  actionArea,
  isActionAreaVisible,
  layoutVariant = 'default',
}) => {
  return (
    <div
      id="action-area-layout"
      data-testid="action-area-layout-test-id"
      aria-label="action-area-layout-aria-label"
      className={classNames(
        styles.layout,
        isActionAreaVisible && styles.collapsedModal,
      )}
    >
      {headerWSideNav}
      <Group orientation="horizontal" className={styles.panelGroup}>
        <Panel
          defaultSize={MAIN_DISPLAY_PANEL_DEFAULT_SIZE}
          minSize={PANEL_MIN_SIZE}
        >
          <div
            id="main-display-area"
            data-testid="main-display-area-test-id"
            aria-label="main-display-area-aria-label"
            className={classNames(styles.mainDisplay, {
              [styles.expand]: !isActionAreaVisible,
              [styles.collapsedModal]: isActionAreaVisible,
              [styles.collapse]: isActionAreaVisible,
            })}
          >
            {mainDisplay}
          </div>
        </Panel>
        {isActionAreaVisible && (
          <>
            <Separator
              id="panel-separator"
              data-testid="panel-separator-test-id"
              aria-label="panel-separator-aria-label"
              className={styles.separator}
            >
              <div
                id="panel-separator-grip"
                data-testid="panel-separator-grip-test-id"
                aria-label="panel-separator-grip-aria-label"
                className={styles.separatorGrip}
              >
                <Icon
                  id="separator-grip-icon"
                  data-testid="separator-grip-icon-test-id"
                  aria-label="separator-grip-icon-aria-label"
                  name="fa-grip-vertical"
                  size={ICON_SIZE.XS}
                />
              </div>
            </Separator>
            <Panel
              defaultSize={ACTION_AREA_PANEL_DEFAULT_SIZE}
              minSize={PANEL_MIN_SIZE}
            >
              <div
                id="action-display-area"
                data-testid="action-display-area-test-id"
                aria-label="action-display-area-aria-label"
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
