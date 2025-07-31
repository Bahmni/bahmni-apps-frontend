import React from 'react';
import {
  Button,
  Tile,
  Accordion,
  AccordionItem,
  DataTableSkeleton,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  NumberInput,
  ComboBox,
  Tag
} from '@bahmni-frontend/bahmni-design-system';
import { Layer, Checkbox, TextInput } from '@carbon/react';


export const TestCarbonWrappers: React.FC = () => {
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
      <div>
        <ComboBox
          allowCustomValue
          helperText="Combobox helper text"
          id="carbon-combobox"
          items={[
            'Apple',
            'Apricot',
            'Avocado',
            'Banana',
            'Blackberry',
            'Blueberry',
            'Cantaloupe'
          ]}
          onChange={() => { }}
          titleText="ComboBox title"
          typeahead
        />
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
      <Tabs>
        <TabList contained>
          <Tab>Dashboard</Tab>
          <Tab>Monitoring</Tab>
          <Tab>Activity</Tab>
          <Tab>Analyze</Tab>
          <Tab disabled>Settings</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>Tab Panel 1</TabPanel>
          <TabPanel>
            <Layer>
              <form style={{
                margin: '2em'
              }}>
                <legend className={`cds--label`}>Validation example</legend>
                <Checkbox id="cb" labelText="Accept privacy policy" />
                <Button style={{
                  marginTop: '1rem',
                  marginBottom: '1rem'
                }} type="submit">
                  Submit
                </Button>
                <TextInput id="text-input-1" type="text" labelText="Text input label" helperText="Optional help text" />
              </form>
            </Layer>
          </TabPanel>
          <TabPanel>Tab Panel 3</TabPanel>
          <TabPanel>Tab Panel 4</TabPanel>
          <TabPanel>Tab Panel 5</TabPanel>
        </TabPanels>
      </Tabs>
      <Tag type="magenta">Tag example</Tag>
      <NumberInput
        helperText="Optional helper text."
        id="default-number-input"
        invalidText="Number is not valid. Must be between -100 and 100"
        label="NumberInput label"
        max={100}
        min={-100}
        onChange={() => { }}
        size="md"
        step={1}
        value={50}
        warnText="Warning message that is really long can wrap to more lines but should not be excessively long."
      />
    </div>
  );
};
