import React from 'react';
import { StoryObj, Meta } from '@storybook/react';
import { Dropdown, TextInput, Stack, Grid, Column } from '@carbon/react';
import SelectedItem from '../SelectedItem';
import * as styles from './styles/SelectedItemStories.module.scss';

/**
 * SelectedItem Stories
 *
 * The SelectedItem component displays selected content with a close button.
 * It's typically used in forms or selection interfaces where users can make
 * a selection and then remove it.
 */
const meta: Meta<typeof SelectedItem> = {
  title: 'Components/Common/SelectedItem',
  component: SelectedItem,
  parameters: {
    docs: {
      description: {
        component:
          'A component for displaying selected items with a close button. Commonly used in form inputs and selection interfaces.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SelectedItem>;

/**
 * Default implementation of SelectedItem with basic text content
 */
export const Default: Story = {
  args: {
    children: <div className={styles.storyText}>Lorem Ipsum</div>,
    onClose: () => console.log('Close clicked'),
  },
};

/**
 * SelectedItem with Carbon typography components
 */
export const WithCarbonTypography: Story = {
  args: {
    children: (
      <Stack gap={3}>
        <div className={styles.storyHeading}>Item Title</div>
        <div className={styles.storyText}>
          Item description with more detailed information
        </div>
        <div className={styles.storySmallText}>Additional metadata</div>
      </Stack>
    ),
    onClose: () => console.log('Close clicked'),
  },
};

/**
 * SelectedItem with custom CSS class applied
 */
export const WithCustomClass: Story = {
  args: {
    children: (
      <div className={styles.storyText}>Selected item with custom class</div>
    ),
    onClose: () => console.log('Close clicked'),
    className: 'custom-selected-item-class',
  },
};

/**
 * SelectedItem used to display patient selection
 */
export const PatientSelectionExample: Story = {
  args: {
    children: (
      <Stack gap={2}>
        <div className={styles.storyHeading}>John Smith</div>
        <div className={styles.storyText}>Patient ID: 12345</div>
        <div className={styles.storyText}>Age: 45</div>
      </Stack>
    ),
    onClose: () => console.log('Patient selection removed'),
    dataTestId: 'patient-selected-item',
  },
};

/**
 * SelectedItem with a complex content structure including Carbon components
 */
export const ComplexFormExample: Story = {
  args: {
    children: (
      <Grid fullWidth narrow style={{ width: 'inherit' }}>
        <Column sm={4} md={6} lg={6}>
          <div className={styles.storyFormTitle}>Medication Order</div>
          <div className={styles.storyFormSubtitle}>
            Enter medication details
          </div>
        </Column>

        <Column sm={4} md={3} lg={3} className={styles.storyFormGroup}>
          <Dropdown
            id="medication-type"
            titleText="Medication Type"
            label="Select medication type"
            items={[
              'Antibiotic',
              'Analgesic',
              'Antihistamine',
              'Anti-inflammatory',
            ]}
            selectedItem="Antibiotic"
          />
        </Column>

        <Column sm={4} md={3} lg={3} className={styles.storyFormGroup}>
          <TextInput
            id="medication-dosage"
            labelText="Dosage"
            placeholder="Enter dosage"
            value="500mg"
          />
        </Column>

        <Column sm={4} md={3} lg={3} className={styles.storyFormGroup}>
          <TextInput
            id="medication-frequency"
            labelText="Frequency"
            placeholder="Enter frequency"
            value="Twice daily"
          />
        </Column>
      </Grid>
    ),
    onClose: () => console.log('Medication form closed'),
  },
};
