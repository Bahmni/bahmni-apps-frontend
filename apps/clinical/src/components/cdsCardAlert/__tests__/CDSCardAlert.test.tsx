import type { CDSCard } from '@bahmni/services';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import CDSCardAlert from '../CDSCardAlert';

expect.extend(toHaveNoViolations);

const mockInfoCard: CDSCard = {
  summary: 'Patient has upcoming appointment',
  indicator: 'info',
  source: { label: 'Appointment Service' },
  suggestions: [],
};

const mockWarningCard: CDSCard = {
  summary: 'Potential drug interaction detected',
  indicator: 'warning',
  source: { label: 'Drug Interaction Service' },
  suggestions: [],
};

const mockCriticalCard: CDSCard = {
  summary: 'Critical allergy alert',
  indicator: 'critical',
  source: { label: 'Allergy Service' },
  suggestions: [],
};

const mockCardWithEmptySource: CDSCard = {
  summary: 'Test summary',
  indicator: 'info',
  source: { label: '' },
  suggestions: [],
};

describe('CDSCardAlert', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation();
  });

  describe('Notification Rendering', () => {
    it.each<[string, CDSCard, string, string]>([
      [
        'info card',
        mockInfoCard,
        'cds--inline-notification--info',
        'Patient has upcoming appointment',
      ],
      [
        'warning card',
        mockWarningCard,
        'cds--inline-notification--warning',
        'Potential drug interaction detected',
      ],
      [
        'critical card',
        mockCriticalCard,
        'cds--inline-notification--error',
        'Critical allergy alert',
      ],
    ])(
      'renders %s with correct notification kind and summary',
      (_, card, expectedClass, expectedSummary) => {
        render(<CDSCardAlert card={card} />);

        const notification = screen.getByRole('status');
        expect(notification).toBeInTheDocument();
        expect(notification).toHaveClass(expectedClass);
        expect(notification).toHaveClass(
          'cds--inline-notification--low-contrast',
        );
        expect(screen.getByText(expectedSummary)).toBeInTheDocument();
        expect(
          screen.queryByRole('button', { name: /close/i }),
        ).not.toBeInTheDocument();
      },
    );
  });

  describe('Accessibility', () => {
    it.each<[string, CDSCard]>([
      ['info card', mockInfoCard],
      ['warning card', mockWarningCard],
      ['critical card', mockCriticalCard],
      ['card with empty source', mockCardWithEmptySource],
    ])('should have no accessibility violations for %s', async (_, card) => {
      const { container } = render(<CDSCardAlert card={card} />);
      const results = await axe(container);

      expect(results).toHaveNoViolations();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });
});
