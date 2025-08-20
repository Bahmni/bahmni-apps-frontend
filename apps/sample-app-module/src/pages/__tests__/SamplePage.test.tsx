import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import { SamplePage } from '../SamplePage';

expect.extend(toHaveNoViolations);

describe('SamplePage', () => {
  it('should render without crashing', () => {
    render(<SamplePage />);
    expect(screen.getByText('Sample Page')).toBeDefined();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(<SamplePage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
