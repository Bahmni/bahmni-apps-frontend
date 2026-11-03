import { formatUrl } from '@bahmni/services';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import LinkButton from '../LinkButton';

jest.mock('@bahmni/services', () => ({
  formatUrl: jest.fn(),
}));

jest.mock('@bahmni/design-system', () => ({
  Link: ({
    children,
    href,
    target,
    rel,
    onClick,
    className,
  }: {
    children: React.ReactNode;
    href?: string;
    target?: string;
    rel?: string;
    onClick?: () => void;
    className: string;
  }) => (
    <a
      href={href}
      target={target}
      rel={rel}
      onClick={onClick}
      className={className}
    >
      {children}
    </a>
  ),
}));

describe('LinkButton', () => {
  const originalWindowLocation = window.location;

  beforeEach(() => {
    jest.clearAllMocks();
    delete (window as any).location;
    window.location = {
      ...originalWindowLocation,
      origin: 'http://localhost:3000',
    };
  });

  afterEach(() => {
    window.location = originalWindowLocation;
  });

  it('renders children as a link', () => {
    render(
      <LinkButton href="/test" className="test-class">
        Click Me
      </LinkButton>,
    );

    const link = screen.getByRole('link', { name: 'Click Me' });
    expect(link).toHaveAttribute('href', '/test');
    expect(link).toHaveClass('test-class');
  });

  it('renders complex children', () => {
    render(
      <LinkButton href="/test" className="test-class">
        <span>Icon</span>
        <span>Label</span>
      </LinkButton>,
    );

    expect(screen.getByText('Icon')).toBeInTheDocument();
    expect(screen.getByText('Label')).toBeInTheDocument();
  });

  it('calls onClick callback when provided', () => {
    const mockOnClick = jest.fn();

    render(
      <LinkButton href="/test" className="test-class" onClick={mockOnClick}>
        Click Me
      </LinkButton>,
    );

    fireEvent.click(screen.getByRole('link', { name: 'Click Me' }));

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('sets target to _blank and rel for new tabs', () => {
    render(
      <LinkButton href="/test" newTab className="test-class">
        Click Me
      </LinkButton>,
    );

    const link = screen.getByRole('link', { name: 'Click Me' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('sets target to targetedTab when provided', () => {
    render(
      <LinkButton
        href="/test"
        targetedTab="patient-details"
        className="test-class"
      >
        Click Me
      </LinkButton>,
    );

    expect(screen.getByRole('link', { name: 'Click Me' })).toHaveAttribute(
      'target',
      'patient-details',
    );
  });

  it('prefers newTab target over targetedTab when both are provided', () => {
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

    expect(screen.getByRole('link', { name: 'Click Me' })).toHaveAttribute(
      'target',
      '_blank',
    );
  });

  it('uses href directly when forwardUrl is not provided', () => {
    render(
      <LinkButton href="/patient/123" className="test-class">
        Click Me
      </LinkButton>,
    );

    expect(screen.getByRole('link', { name: 'Click Me' })).toHaveAttribute(
      'href',
      '/patient/123',
    );
    expect(formatUrl).not.toHaveBeenCalled();
  });

  it('formats URL when forwardUrl and id are provided', () => {
    (formatUrl as jest.Mock).mockReturnValue('/patient/abc-123/dashboard');

    render(
      <LinkButton
        forwardUrl="/patient/{{patientUuid}}/dashboard"
        id="abc-123"
        className="test-class"
      >
        Click Me
      </LinkButton>,
    );

    expect(formatUrl).toHaveBeenCalledWith(
      '/patient/{{patientUuid}}/dashboard',
      { patientUuid: 'abc-123' },
      true,
    );
    expect(screen.getByRole('link', { name: 'Click Me' })).toHaveAttribute(
      'href',
      'http://localhost:3000/patient/abc-123/dashboard',
    );
  });

  it('uses href when forwardUrl is provided without id', () => {
    render(
      <LinkButton
        href="/fallback"
        forwardUrl="/patient/{{patientUuid}}/dashboard"
        className="test-class"
      >
        Click Me
      </LinkButton>,
    );

    expect(formatUrl).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Click Me' })).toHaveAttribute(
      'href',
      '/fallback',
    );
  });
});
