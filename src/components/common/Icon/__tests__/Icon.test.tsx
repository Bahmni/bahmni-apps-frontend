import React from 'react';
import { render, screen } from '@testing-library/react';
import Icon from '../Icon';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';

// Initialize FontAwesome library for tests
library.add(fas);

describe('Icon Component', () => {
  it('renders solid icon correctly', () => {
    render(<Icon name="fa-home" data-testid="icon" />);
    const icon = screen.getByTestId('icon');
    expect(icon).toBeInTheDocument();
    // FontAwesome adds SVG with specific classes
    expect(icon.tagName).toBe('svg');
    // FontAwesome 6 uses 'house' instead of 'home'
    expect(icon.classList.contains('fa-house')).toBe(true);
  });

  it('renders solid icon with alternative syntax', () => {
    render(<Icon name="fa-star" data-testid="icon" />);
    const icon = screen.getByTestId('icon');
    expect(icon).toBeInTheDocument();
    expect(icon.tagName).toBe('svg');
    expect(icon.classList.contains('fa-star')).toBe(true);
  });

  it('applies custom className', () => {
    render(<Icon name="fa-home" className="custom-class" data-testid="icon" />);
    const icon = screen.getByTestId('icon');
    expect(icon.classList.contains('custom-class')).toBe(true);
  });

  it('applies size prop', () => {
    render(<Icon name="fa-home" size="2x" data-testid="icon" />);
    const icon = screen.getByTestId('icon');
    expect(icon.classList.contains('fa-2x')).toBe(true);
  });

  it('returns null for empty name', () => {
    const { container } = render(<Icon name="" />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null for invalid name format', () => {
    const { container } = render(<Icon name="invalid" />);
    expect(container.firstChild).toBeNull();
  });
});
