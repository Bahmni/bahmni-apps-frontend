import { createEvent, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { NumberInput } from '..';

const defaultProps = {
  id: 'test-number-input',
  label: 'Quantity',
};

describe('NumberInput', () => {
  describe('disableWheel', () => {
    it('should prevent wheel events by default', () => {
      render(<NumberInput {...defaultProps} />);
      const input = screen.getByRole('spinbutton');
      fireEvent.focus(input);
      const wheelEvent = createEvent.wheel(input);
      fireEvent(input, wheelEvent);
      expect(wheelEvent.defaultPrevented).toBe(true);
    });

    it('should allow wheel events when disableWheel is false', () => {
      render(<NumberInput {...defaultProps} disableWheel={false} />);
      const input = screen.getByRole('spinbutton');
      fireEvent.focus(input);
      const wheelEvent = createEvent.wheel(input);
      fireEvent(input, wheelEvent);
      expect(wheelEvent.defaultPrevented).toBe(false);
    });
  });
});
