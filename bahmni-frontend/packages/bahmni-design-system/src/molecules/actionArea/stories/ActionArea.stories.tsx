import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import {
  Button,
  Select,
  SelectItem,
  DatePicker,
  DatePickerInput,
  Stack,
  FormGroup,
  Grid,
  Column,
} from '@carbon/react';
import ActionArea from '../ActionArea';

// Story metadata
const meta: Meta<typeof ActionArea> = {
  title: 'Components/Common/ActionArea',
  component: ActionArea,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    primaryButtonText: { control: 'text' },
    isPrimaryButtonDisabled: { control: 'boolean' },
    secondaryButtonText: { control: 'text' },
    isSecondaryButtonDisabled: { control: 'boolean' },
    tertiaryButtonText: { control: 'text' },
    isTertiaryButtonDisabled: { control: 'boolean' },
    onPrimaryButtonClick: { action: 'primary button clicked' },
    onSecondaryButtonClick: { action: 'secondary button clicked' },
    onTertiaryButtonClick: { action: 'tertiary button clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof ActionArea>;

// Base story with required buttons
export const Default: Story = {
  render: (args) => (
    <div style={{ top: '0', height: '100vh', position: 'fixed' }}>
      <ActionArea {...args} />
    </div>
  ),
  args: {
    title: 'New Consultation',
    primaryButtonText: 'Done',
    onPrimaryButtonClick: action('Done clicked'),
    secondaryButtonText: 'Cancel',
    onSecondaryButtonClick: action('Cancel clicked'),
    content: (
      <Stack gap={6}>
        <p>Content goes here</p>
      </Stack>
    ),
  },
};

// Story with all three buttons
export const WithAllButtons: Story = {
  render: (args) => (
    <div style={{ top: '0', height: '100vh', position: 'fixed' }}>
      <ActionArea {...args} />
    </div>
  ),
  args: {
    ...Default.args,
    secondaryButtonText: 'Discard',
    onSecondaryButtonClick: action('Discard clicked'),
    tertiaryButtonText: 'Save Draft',
    onTertiaryButtonClick: action('Save Draft clicked'),
  },
};

// Story with form content
export const WithFormContent: Story = {
  render: (args) => (
    <div style={{ top: '0', height: '100vh', position: 'fixed' }}>
      <ActionArea {...args} />
    </div>
  ),
  args: {
    ...WithAllButtons.args,
    content: (
      <Stack gap={6}>
        <FormGroup legendText="">
          <Grid>
            <Column sm={4} md={8} lg={16}>
              <Select
                id="visit-type"
                labelText="Visit type"
                defaultValue="placeholder"
              >
                <SelectItem
                  disabled
                  hidden
                  value="placeholder"
                  text="Choose an option"
                />
                <SelectItem value="emergency" text="Emergency" />
                <SelectItem value="follow-up" text="Follow-up" />
                <SelectItem value="regular" text="Regular" />
              </Select>
            </Column>
          </Grid>
        </FormGroup>

        <FormGroup legendText="">
          <Grid>
            <Column sm={4} md={8} lg={16}>
              <Select
                id="encounter-type"
                labelText="Encounter type"
                defaultValue="placeholder"
              >
                <SelectItem
                  disabled
                  hidden
                  value="placeholder"
                  text="Choose an option"
                />
                <SelectItem value="follow-up" text="Follow-up" />
                <SelectItem value="initial" text="Initial" />
                <SelectItem value="consultation" text="Consultation" />
              </Select>
            </Column>
          </Grid>
        </FormGroup>

        <FormGroup legendText="">
          <Grid>
            <Column sm={4} md={8} lg={16}>
              <Select
                id="participant"
                labelText="Participant/s"
                defaultValue="placeholder"
              >
                <SelectItem
                  disabled
                  hidden
                  value="placeholder"
                  text="Choose an option"
                />
                <SelectItem value="dr-sarah-johnson" text="Dr. Sarah Johnson" />
                <SelectItem value="dr-michael-smith" text="Dr. Michael Smith" />
              </Select>
            </Column>
          </Grid>
        </FormGroup>

        <FormGroup legendText="">
          <Grid>
            <Column sm={4} md={8} lg={16}>
              <Select
                id="location"
                labelText="Location"
                defaultValue="placeholder"
              >
                <SelectItem
                  disabled
                  hidden
                  value="placeholder"
                  text="Choose an option"
                />
                <SelectItem value="general-ward" text="General Ward" />
                <SelectItem value="icu" text="ICU" />
                <SelectItem value="opd" text="OPD" />
              </Select>
            </Column>
          </Grid>
        </FormGroup>

        <FormGroup legendText="">
          <Grid>
            <Column sm={4} md={8} lg={16}>
              <DatePicker datePickerType="single" dateFormat="d/m/Y">
                <DatePickerInput
                  id="consultation-date"
                  placeholder="dd/mm/yyyy"
                  labelText="Consultation Date"
                  defaultValue="24/04/2025"
                />
              </DatePicker>
            </Column>
          </Grid>
        </FormGroup>
      </Stack>
    ),
  },
};

// Story with disabled primary button
export const WithDisabledPrimaryButton: Story = {
  render: (args) => (
    <div style={{ top: '0', height: '100vh', position: 'fixed' }}>
      <ActionArea {...args} />
    </div>
  ),
  args: {
    ...Default.args,
    isPrimaryButtonDisabled: true,
  },
};

// Story with disabled secondary button
export const WithDisabledSecondaryButton: Story = {
  render: (args) => (
    <div style={{ top: '0', height: '100vh', position: 'fixed' }}>
      <ActionArea {...args} />
    </div>
  ),
  args: {
    ...Default.args,
    isSecondaryButtonDisabled: true,
  },
};

// Story with disabled tertiary button
export const WithDisabledTertiaryButton: Story = {
  render: (args) => (
    <div style={{ top: '0', height: '100vh', position: 'fixed' }}>
      <ActionArea {...args} />
    </div>
  ),
  args: {
    ...WithAllButtons.args,
    isTertiaryButtonDisabled: true,
  },
};

// Story with all buttons disabled
export const WithAllButtonsDisabled: Story = {
  render: (args) => (
    <div style={{ top: '0', height: '100vh', position: 'fixed' }}>
      <ActionArea {...args} />
    </div>
  ),
  args: {
    ...WithAllButtons.args,
    isPrimaryButtonDisabled: true,
    isSecondaryButtonDisabled: true,
    isTertiaryButtonDisabled: true,
  },
};

// Interactive story with toggle visibility and dynamic disable states
const InteractiveActionArea = (args: any) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isPrimaryDisabled, setIsPrimaryDisabled] = useState(false);
  const [isSecondaryDisabled, setIsSecondaryDisabled] = useState(false);
  const [isTertiaryDisabled, setIsTertiaryDisabled] = useState(false);

  const handlePrimaryClick = () => {
    action('Done clicked')();
    setIsVisible(false);
    setTimeout(() => setIsVisible(true), 1000); // Re-open after 1 second for demo purposes
  };

  return (
    <>
      <div
        style={{
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <Button onClick={() => setIsVisible(!isVisible)}>
          {isVisible ? 'Hide Action Area' : 'Show Action Area'}
        </Button>
        <Button
          kind="secondary"
          onClick={() => setIsPrimaryDisabled(!isPrimaryDisabled)}
        >
          {isPrimaryDisabled ? 'Enable Primary' : 'Disable Primary'}
        </Button>
        <Button
          kind="secondary"
          onClick={() => setIsSecondaryDisabled(!isSecondaryDisabled)}
        >
          {isSecondaryDisabled ? 'Enable Secondary' : 'Disable Secondary'}
        </Button>
        <Button
          kind="secondary"
          onClick={() => setIsTertiaryDisabled(!isTertiaryDisabled)}
        >
          {isTertiaryDisabled ? 'Enable Tertiary' : 'Disable Tertiary'}
        </Button>
      </div>

      {isVisible && (
        <div style={{ top: '0', height: '100vh', position: 'fixed' }}>
          <ActionArea
            {...args}
            onPrimaryButtonClick={handlePrimaryClick}
            isPrimaryButtonDisabled={isPrimaryDisabled}
            isSecondaryButtonDisabled={isSecondaryDisabled}
            isTertiaryButtonDisabled={isTertiaryDisabled}
          />
        </div>
      )}
    </>
  );
};

// Interactive story with toggle visibility and dynamic disable states
export const Interactive: Story = {
  render: (args) => <InteractiveActionArea {...args} />,
  args: {
    ...WithFormContent.args,
  },
};
