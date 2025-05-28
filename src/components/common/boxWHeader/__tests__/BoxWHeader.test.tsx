import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import BoxWHeader from '../BoxWHeader';
import i18n from '@/setupTests.i18n';

expect.extend(toHaveNoViolations);
// Mock the styles to prevent issues with CSS modules in tests
jest.mock('../styles/BoxWHeader.module.scss', () => ({
  box: 'box-class',
  header: 'header-class',
}));

describe('BoxWHeader', () => {
  beforeEach(() => {
    i18n.changeLanguage('en');
  });

  describe('Happy Paths', () => {
    it('should render correctly with required props', () => {
      // Arrange
      const title = 'Test Title';
      const childText = 'Test Children';

      // Act
      render(
        <BoxWHeader title={title}>
          <div>{childText}</div>
        </BoxWHeader>,
      );

      // Assert
      expect(screen.getByText(title)).toBeInTheDocument();
      expect(screen.getByText(childText)).toBeInTheDocument();
      expect(screen.getByTestId('box-w-title')).toBeInTheDocument();
    });

    it('should translate title when it is a translation key', () => {
      // Arrange - Add a test translation
      i18n.addResource('en', 'clinical', 'test.key', 'Translated Title');

      // Act
      render(
        <BoxWHeader title="test.key">
          <div>Content</div>
        </BoxWHeader>,
      );

      // Assert
      expect(screen.getByText('Translated Title')).toBeInTheDocument();
    });

    it('should render with custom data-testid when provided', () => {
      // Arrange
      const customTestId = 'custom-test-id';

      // Act
      render(
        <BoxWHeader title="Title" dataTestId={customTestId}>
          <div>Content</div>
        </BoxWHeader>,
      );

      // Assert
      expect(screen.getByTestId(customTestId)).toBeInTheDocument();
    });

    it('should apply custom className when provided', () => {
      // Arrange
      const customClass = 'custom-class';

      // Act
      const { container } = render(
        <BoxWHeader title="Title" className={customClass}>
          <div>Content</div>
        </BoxWHeader>,
      );

      // Assert
      const gridElement = container.firstChild;
      expect(gridElement).toHaveClass('box-class');
      expect(gridElement).toHaveClass(customClass);
    });

    it('should match snapshot', () => {
      // Arrange & Act
      const { container } = render(
        <BoxWHeader title="Snapshot Test">
          <div>Snapshot Content</div>
        </BoxWHeader>,
      );

      // Assert
      expect(container).toMatchSnapshot();
    });
  });

  describe('Accessibility', () => {
    it('should not have accessibility violations', async () => {
      // Arrange
      const { container } = render(
        <BoxWHeader title="Accessibility Test">
          <div>Test content for accessibility</div>
        </BoxWHeader>,
      );

      // Act & Assert
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
