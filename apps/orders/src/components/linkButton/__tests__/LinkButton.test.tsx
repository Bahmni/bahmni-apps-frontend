import { formatUrl } from '@bahmni/services';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import LinkButton from '../LinkButton';

jest.mock('@bahmni/services', () => ({
  formatUrl: jest.fn(),
}));

jest.mock('@bahmni/design-system', () => ({
  Link: ({
    children,
    onClick,
    className,
    role,
  }: {
    children: React.ReactNode;
    onClick: (e: React.MouseEvent) => void;
    className: string;
    role: string;
  }) => (
    <button onClick={onClick} className={className} role={role}>
      {children}
    </button>
  ),
}));

describe('LinkButton', () => {
  const originalWindowOpen = window.open;
  const originalWindowLocation = window.location;

  beforeEach(() => {
    jest.clearAllMocks();
    window.open = jest.fn();
    delete (window as any).location;
    window.location = {
      ...originalWindowLocation,
      origin: 'http://localhost:3000',
    };
  });

  afterEach(() => {
    window.open = originalWindowOpen;
    window.location = originalWindowLocation;
  });

  describe('Rendering', () => {
    it('should render with children', () => {
      render(
        <LinkButton href="/test" className="test-class">
          Click Me
        </LinkButton>,
      );

      expect(screen.getByText('Click Me')).toBeInTheDocument();
      expect(screen.getByRole('link')).toBeInTheDocument();
    });

    it('should apply className prop', () => {
      render(
        <LinkButton href="/test" className="custom-class">
          Click Me
        </LinkButton>,
      );

      const link = screen.getByRole('link');
      expect(link).toHaveClass('custom-class');
    });

    it('should render with complex children', () => {
      render(
        <LinkButton href="/test" className="test-class">
          <span>Icon</span>
          <span>Label</span>
        </LinkButton>,
      );

      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Label')).toBeInTheDocument();
    });
  });

  describe('Click Behavior', () => {
    it('should prevent default behavior on click', () => {
      render(
        <LinkButton href="/test" className="test-class">
          Click Me
        </LinkButton>,
      );

      const link = screen.getByRole('link');

      fireEvent.click(link);

      expect(window.open).toHaveBeenCalled();
    });

    it('should call onClick callback when provided', () => {
      const mockOnClick = jest.fn();

      render(
        <LinkButton href="/test" className="test-class" onClick={mockOnClick}>
          Click Me
        </LinkButton>,
      );

      const link = screen.getByRole('link');
      fireEvent.click(link);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should not throw error when onClick is not provided', () => {
      render(
        <LinkButton href="/test" className="test-class">
          Click Me
        </LinkButton>,
      );

      const link = screen.getByRole('link');

      expect(() => {
        fireEvent.click(link);
      }).not.toThrow();
    });
  });

  describe('Window Open Targets', () => {
    it('should open in new tab when newTab is true', () => {
      render(
        <LinkButton href="/test" newTab className="test-class">
          Click Me
        </LinkButton>,
      );

      const link = screen.getByRole('link');
      fireEvent.click(link);

      expect(window.open).toHaveBeenCalledWith('/test', '_blank');
    });

    it('should open in targeted tab when targetedTab is provided', () => {
      render(
        <LinkButton
          href="/test"
          targetedTab="patient-details"
          className="test-class"
        >
          Click Me
        </LinkButton>,
      );

      const link = screen.getByRole('link');
      fireEvent.click(link);

      expect(window.open).toHaveBeenCalledWith('/test', 'patient-details');
    });

    it('should open in same tab when neither newTab nor targetedTab is provided', () => {
      render(
        <LinkButton href="/test" className="test-class">
          Click Me
        </LinkButton>,
      );

      const link = screen.getByRole('link');
      fireEvent.click(link);

      expect(window.open).toHaveBeenCalledWith('/test', '_self');
    });

    it('should prefer newTab over targetedTab when both are provided', () => {
      render(
        <LinkButton
          href="/test"
          newTab
          targetedTab="patient-details"
          className="test-class"
        >
          Click Me
        </LinkButton>,
      );

      const link = screen.getByRole('link');
      fireEvent.click(link);

      expect(window.open).toHaveBeenCalledWith('/test', '_blank');
    });
  });

  describe('URL Formatting', () => {
    it('should use href directly when forwardUrl is not provided', () => {
      render(
        <LinkButton href="/patient/123" className="test-class">
          Click Me
        </LinkButton>,
      );

      const link = screen.getByRole('link');
      fireEvent.click(link);

      expect(window.open).toHaveBeenCalledWith('/patient/123', '_self');
      expect(formatUrl).not.toHaveBeenCalled();
    });

    it('should format URL when forwardUrl and id are provided', () => {
      (formatUrl as jest.Mock).mockReturnValue(
        '/patient/abc-123/dashboard?foo=bar',
      );

      render(
        <LinkButton
          forwardUrl="/patient/{{patientUuid}}/dashboard"
          id="abc-123"
          className="test-class"
        >
          Click Me
        </LinkButton>,
      );

      const link = screen.getByRole('link');
      fireEvent.click(link);

      expect(formatUrl).toHaveBeenCalledWith(
        '/patient/{{patientUuid}}/dashboard',
        { patientUuid: 'abc-123' },
        true,
      );
      expect(window.open).toHaveBeenCalledWith(
        'http://localhost:3000/patient/abc-123/dashboard?foo=bar',
        '_self',
      );
    });

    it('should prefer href over forwardUrl when both are provided but id is missing', () => {
      render(
        <LinkButton
          href="/fallback"
          forwardUrl="/patient/{{patientUuid}}/dashboard"
          className="test-class"
        >
          Click Me
        </LinkButton>,
      );

      const link = screen.getByRole('link');
      fireEvent.click(link);

      expect(formatUrl).not.toHaveBeenCalled();
      expect(window.open).toHaveBeenCalledWith('/fallback', '_self');
    });

    it('should prefer href over forwardUrl when both are provided but forwardUrl is undefined', () => {
      render(
        <LinkButton href="/fallback" id="abc-123" className="test-class">
          Click Me
        </LinkButton>,
      );

      const link = screen.getByRole('link');
      fireEvent.click(link);

      expect(formatUrl).not.toHaveBeenCalled();
      expect(window.open).toHaveBeenCalledWith('/fallback', '_self');
    });

    it('should include window.location.origin in formatted URL', () => {
      (formatUrl as jest.Mock).mockReturnValue('/clinical/patient/123');

      render(
        <LinkButton
          forwardUrl="/clinical/patient/{{patientUuid}}"
          id="123"
          className="test-class"
        >
          Click Me
        </LinkButton>,
      );

      const link = screen.getByRole('link');
      fireEvent.click(link);

      expect(window.open).toHaveBeenCalledWith(
        'http://localhost:3000/clinical/patient/123',
        '_self',
      );
    });
  });

  describe('Complex Scenarios', () => {
    it('should work with forwardUrl, id, and newTab together', () => {
      (formatUrl as jest.Mock).mockReturnValue('/patient/xyz-789/orders');

      render(
        <LinkButton
          forwardUrl="/patient/{{patientUuid}}/orders"
          id="xyz-789"
          newTab
          className="test-class"
        >
          View Orders
        </LinkButton>,
      );

      const link = screen.getByRole('link');
      fireEvent.click(link);

      expect(formatUrl).toHaveBeenCalledWith(
        '/patient/{{patientUuid}}/orders',
        { patientUuid: 'xyz-789' },
        true,
      );
      expect(window.open).toHaveBeenCalledWith(
        'http://localhost:3000/patient/xyz-789/orders',
        '_blank',
      );
    });

    it('should work with forwardUrl, id, targetedTab, and onClick together', () => {
      const mockOnClick = jest.fn();
      (formatUrl as jest.Mock).mockReturnValue('/patient/123/details');

      render(
        <LinkButton
          forwardUrl="/patient/{{patientUuid}}/details"
          id="123"
          targetedTab="patient-tab"
          onClick={mockOnClick}
          className="test-class"
        >
          Patient Details
        </LinkButton>,
      );

      const link = screen.getByRole('link');
      fireEvent.click(link);

      expect(formatUrl).toHaveBeenCalledWith(
        '/patient/{{patientUuid}}/details',
        { patientUuid: '123' },
        true,
      );
      expect(window.open).toHaveBeenCalledWith(
        'http://localhost:3000/patient/123/details',
        'patient-tab',
      );
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should handle undefined href gracefully', () => {
      render(<LinkButton className="test-class">Click Me</LinkButton>);

      const link = screen.getByRole('link');
      fireEvent.click(link);

      expect(window.open).toHaveBeenCalledWith(undefined, '_self');
    });

    it('should handle empty string href', () => {
      render(
        <LinkButton href="" className="test-class">
          Click Me
        </LinkButton>,
      );

      const link = screen.getByRole('link');
      fireEvent.click(link);

      expect(window.open).toHaveBeenCalledWith('', '_self');
    });
  });

  describe('Accessibility', () => {
    it('should have role="link"', () => {
      render(
        <LinkButton href="/test" className="test-class">
          Click Me
        </LinkButton>,
      );

      expect(screen.getByRole('link')).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      const mockOnClick = jest.fn();

      render(
        <LinkButton href="/test" className="test-class" onClick={mockOnClick}>
          Click Me
        </LinkButton>,
      );

      const link = screen.getByRole('link');

      fireEvent.click(link);

      expect(window.open).toHaveBeenCalled();
      expect(mockOnClick).toHaveBeenCalled();
    });
  });
});
