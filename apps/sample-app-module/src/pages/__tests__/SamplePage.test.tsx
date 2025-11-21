import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SamplePage } from '../SamplePage';

describe('SamplePage', () => {
  it('should render without crashing', () => {
    render(<SamplePage />);
    expect(screen.getByText('Clinical Assessment Form')).toBeDefined();
  });

  it('should render patient details', () => {
    render(<SamplePage />);
    expect(screen.getByText('Patient Details')).toBeDefined();
    expect(screen.getByText('Jane Smith')).toBeDefined();
    expect(screen.getByText('MRN-2024-5678')).toBeDefined();
    expect(screen.getByText('35 years')).toBeDefined();
  });

  it('should render form configuration panel', () => {
    render(<SamplePage />);
    expect(screen.getByText('Form Configuration')).toBeDefined();
    expect(screen.getByText('Enable Validation')).toBeDefined();
    expect(screen.getByText('Validate on Load')).toBeDefined();
    expect(screen.getByText('Collapse Sections')).toBeDefined();
  });

  it('should render action buttons', () => {
    render(<SamplePage />);
    expect(screen.getByText('💾 Save Form')).toBeDefined();
    expect(screen.getByText('🔄 Reset')).toBeDefined();
    expect(screen.getByText('🗑️ Clear')).toBeDefined();
  });

  it('should render clinical assessment form', () => {
    render(<SamplePage />);
    expect(screen.getByText('Clinical Assessment')).toBeDefined();
    expect(screen.getByText('v1.0')).toBeDefined();
  });

  it('should render React 19 information panel', () => {
    render(<SamplePage />);
    expect(screen.getByText('About This Demo (React 19)')).toBeDefined();
    expect(screen.getByText('React 19 Improvements ⚡')).toBeDefined();
  });

  it('should have checkboxes for configuration', () => {
    render(<SamplePage />);
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThanOrEqual(3);
  });

  it('should render footer with information', () => {
    render(<SamplePage />);
    expect(
      screen.getByText(/Bahmni Form Controls React 19 Demo/),
    ).toBeDefined();
  });

  it('should toggle configuration options', async () => {
    const user = userEvent.setup();
    render(<SamplePage />);

    const validateCheckbox = screen.getByRole('checkbox', {
      name: /Enable Validation/i,
    }) as HTMLInputElement;
    expect(validateCheckbox.checked).toBe(true);

    await user.click(validateCheckbox);
    expect(validateCheckbox.checked).toBe(false);
  });
});
