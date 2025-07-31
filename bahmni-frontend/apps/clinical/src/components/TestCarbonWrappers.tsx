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
  Tag,
  ButtonSet,
  TextInput,
  TextArea,
  FormGroup,
} from '@bahmni-frontend/bahmni-design-system';
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
      <ButtonSet>
        <Button kind="secondary">
          Secondary button
        </Button>
        <Button kind="primary">
          Primary button
        </Button>
      </ButtonSet>
      <TextArea
        enableCounter
        helperText="TextArea helper text"
        id="text-area-1"
        invalidText="Error message that is really long can wrap to more lines but should not be excessively long."
        labelText="TextArea label"
        maxCount={500}
        placeholder=""
        rows={4}
        warnText="This is a warning message."
      />
      <FormGroup
        legendId="form-group-1"
        legendText="FormGroup Legend"
        style={{
          maxWidth: '400px'
        }}>
        <TextInput
          id="one"
          labelText="First Name"
        />
        <TextInput
          id="two"
          labelText="Last Name"
        />
      </FormGroup>
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
            <form style={{
              margin: '2em'
            }}>
              <legend className={`cds--label`}>Validation example</legend>
            </form>
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
