import React from 'react';
import { Button, Tile, ExpandableTile, TagSkeleton, DismissibleTag, Accordion, AccordionItem, DataTableSkeleton } from '@bahmni-frontend/bahmni-design-system';


export const TestButton: React.FC = () => {
  return (
    <div>
      <h2>Testing Bahmni Design System Button</h2>
      <Accordion>
        <AccordionItem title="Accordian Panel A" className="custom-class">
          <Tile testId="test-tile">
            <p>This is a tile component from Bahmni Design System.</p>
          </Tile>
        </AccordionItem>
        <DataTableSkeleton
          aria-label="data table skeleton"
          headers={[
            {
              header: 'Name',
              key: 'name'
            },
            {
              header: 'Protocol',
              key: 'protocol'
            },
            {
              header: 'Port',
              key: 'port'
            },
            {
              header: 'Rule',
              key: 'rule'
            },
            {
              header: 'Attached groups',
              key: 'attached_groups'
            },
            {
              header: 'Status',
              key: 'status'
            }
          ]}
          showHeader
          showToolbar
        />
      </Accordion>
      <ExpandableTile id="expandable-tile-1" tileCollapsedIconText="Interact to Expand tile" tileExpandedIconText="Interact to Collapse tile">
        <p>I am an Expandable Tile. Click to expand or collapse.</p>
      </ExpandableTile>
      <TagSkeleton >
        <span>Tag content</span>
      </TagSkeleton>
      <DismissibleTag size="md" text="Tag content 1" title="Dismiss" type="magenta">
        <span>Dismissible Tag</span>
      </DismissibleTag>
      <div>
      </div>
      <Button kind="primary" testId="test-primary">
        Primary Button
      </Button>
      <Button kind="secondary" testId="test-secondary">
        Secondary Button
      </Button>
      <Button kind="tertiary" testId="test-tertiary" disabled>
        Disabled Button
      </Button>
    </div>
  );
};
