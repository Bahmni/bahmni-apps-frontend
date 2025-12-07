import { useTranslation } from '@bahmni/services';
import { render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import { useConfigValidation } from '../../hooks/useConfigValidation';
import { ConfigValidator } from '../ConfigValidator';

expect.extend(toHaveNoViolations);

jest.mock('@bahmni/services', () => ({
  useTranslation: jest.fn(),
}));

jest.mock('../../hooks/useConfigValidation');

const mockUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;
const mockUseConfigValidation = useConfigValidation as jest.MockedFunction<
  typeof useConfigValidation
>;

describe('ConfigValidator', () => {
  const mockSchema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'number' },
    },
    required: ['name'],
  };

  const validConfig = {
    name: 'John Doe',
    age: 30,
  };

  const mockT = jest.fn((key: string) => key) as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: {} as any,
      ready: true,
    } as any);
  });

  describe('Rendering States', () => {
    it('should render loading component when validating', () => {
      mockUseConfigValidation.mockReturnValue({
        isValidating: true,
        isValid: false,
        error: null,
      });

      render(
        <ConfigValidator config={validConfig} schema={mockSchema}>
          <div>Child Content</div>
        </ConfigValidator>,
      );

      expect(screen.getByText('CONFIG_VALIDATING')).toBeInTheDocument();
      expect(screen.queryByText('Child Content')).not.toBeInTheDocument();
    });

    it('should render error component when validation fails', () => {
      mockUseConfigValidation.mockReturnValue({
        isValidating: false,
        isValid: false,
        error: 'Configuration does not match required schema',
      });

      render(
        <ConfigValidator config={validConfig} schema={mockSchema}>
          <div>Child Content</div>
        </ConfigValidator>,
      );

      expect(
        screen.getByText('⚠️ INVALID_CONTROL_CONFIGURATION'),
      ).toBeInTheDocument();
      expect(screen.queryByText('Child Content')).not.toBeInTheDocument();
    });

    it('should render children when validation succeeds', () => {
      mockUseConfigValidation.mockReturnValue({
        isValidating: false,
        isValid: true,
        error: null,
      });

      render(
        <ConfigValidator config={validConfig} schema={mockSchema}>
          <div>Child Content</div>
        </ConfigValidator>,
      );

      expect(screen.getByText('Child Content')).toBeInTheDocument();
      expect(screen.queryByText('CONFIG_VALIDATING')).not.toBeInTheDocument();
      expect(
        screen.queryByText('⚠️ INVALID_CONTROL_CONFIGURATION'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Custom Components', () => {
    it('should render custom loading component when provided', () => {
      mockUseConfigValidation.mockReturnValue({
        isValidating: true,
        isValid: false,
        error: null,
      });

      const CustomLoadingComponent = () => <div>Custom Loading Message</div>;

      render(
        <ConfigValidator
          config={validConfig}
          schema={mockSchema}
          loadingComponent={<CustomLoadingComponent />}
        >
          <div>Child Content</div>
        </ConfigValidator>,
      );

      expect(screen.getByText('Custom Loading Message')).toBeInTheDocument();
      expect(screen.queryByText('CONFIG_VALIDATING')).not.toBeInTheDocument();
    });

    it('should render custom error component when provided', () => {
      mockUseConfigValidation.mockReturnValue({
        isValidating: false,
        isValid: false,
        error: 'Configuration does not match required schema',
      });

      const CustomErrorComponent = () => <div>Custom Error Message</div>;

      render(
        <ConfigValidator
          config={validConfig}
          schema={mockSchema}
          errorComponent={<CustomErrorComponent />}
        >
          <div>Child Content</div>
        </ConfigValidator>,
      );

      expect(screen.getByText('Custom Error Message')).toBeInTheDocument();
      expect(
        screen.queryByText('INVALID_CONTROL_CONFIGURATION'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Hook Integration', () => {
    it('should pass config and schema to useConfigValidation hook', () => {
      mockUseConfigValidation.mockReturnValue({
        isValidating: false,
        isValid: true,
        error: null,
      });

      render(
        <ConfigValidator config={validConfig} schema={mockSchema}>
          <div>Child Content</div>
        </ConfigValidator>,
      );

      expect(mockUseConfigValidation).toHaveBeenCalledWith({
        config: validConfig,
        schema: mockSchema,
      });
    });
  });

  describe('Translation Integration', () => {
    it('should call translation function for default loading message', () => {
      mockUseConfigValidation.mockReturnValue({
        isValidating: true,
        isValid: false,
        error: null,
      });

      render(
        <ConfigValidator config={validConfig} schema={mockSchema}>
          <div>Child Content</div>
        </ConfigValidator>,
      );

      expect(mockT).toHaveBeenCalledWith('CONFIG_VALIDATING');
    });

    it('should call translation function for default error message', () => {
      mockUseConfigValidation.mockReturnValue({
        isValidating: false,
        isValid: false,
        error: 'Configuration does not match required schema',
      });

      render(
        <ConfigValidator config={validConfig} schema={mockSchema}>
          <div>Child Content</div>
        </ConfigValidator>,
      );

      expect(mockT).toHaveBeenCalledWith('INVALID_CONTROL_CONFIGURATION');
    });

    it('should not call translation when custom components are provided', () => {
      mockUseConfigValidation.mockReturnValue({
        isValidating: true,
        isValid: false,
        error: null,
      });

      const CustomLoadingComponent = () => <div>Custom Loading Message</div>;

      render(
        <ConfigValidator
          config={validConfig}
          schema={mockSchema}
          loadingComponent={<CustomLoadingComponent />}
        >
          <div>Child Content</div>
        </ConfigValidator>,
      );

      // Translation should not be called since custom component is used
      expect(mockT).not.toHaveBeenCalled();
    });
  });

  describe('State Transitions', () => {
    it('should transition from loading to valid state', async () => {
      mockUseConfigValidation.mockReturnValue({
        isValidating: true,
        isValid: false,
        error: null,
      });

      const { rerender } = render(
        <ConfigValidator config={validConfig} schema={mockSchema}>
          <div>Child Content</div>
        </ConfigValidator>,
      );

      expect(screen.getByText('CONFIG_VALIDATING')).toBeInTheDocument();

      mockUseConfigValidation.mockReturnValue({
        isValidating: false,
        isValid: true,
        error: null,
      });

      rerender(
        <ConfigValidator config={validConfig} schema={mockSchema}>
          <div>Child Content</div>
        </ConfigValidator>,
      );

      await waitFor(() => {
        expect(screen.getByText('Child Content')).toBeInTheDocument();
      });
      expect(screen.queryByText('CONFIG_VALIDATING')).not.toBeInTheDocument();
    });

    it('should transition from loading to error state', async () => {
      mockUseConfigValidation.mockReturnValue({
        isValidating: true,
        isValid: false,
        error: null,
      });

      const { rerender } = render(
        <ConfigValidator config={validConfig} schema={mockSchema}>
          <div>Child Content</div>
        </ConfigValidator>,
      );

      expect(screen.getByText('CONFIG_VALIDATING')).toBeInTheDocument();

      mockUseConfigValidation.mockReturnValue({
        isValidating: false,
        isValid: false,
        error: 'Configuration does not match required schema',
      });

      rerender(
        <ConfigValidator config={validConfig} schema={mockSchema}>
          <div>Child Content</div>
        </ConfigValidator>,
      );

      await waitFor(() => {
        expect(
          screen.getByText('⚠️ INVALID_CONTROL_CONFIGURATION'),
        ).toBeInTheDocument();
      });
      expect(screen.queryByText('CONFIG_VALIDATING')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations in loading state', async () => {
      mockUseConfigValidation.mockReturnValue({
        isValidating: true,
        isValid: false,
        error: null,
      });

      const { container } = render(
        <ConfigValidator config={validConfig} schema={mockSchema}>
          <div>Child Content</div>
        </ConfigValidator>,
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations in error state', async () => {
      mockUseConfigValidation.mockReturnValue({
        isValidating: false,
        isValid: false,
        error: 'Configuration does not match required schema',
      });

      const { container } = render(
        <ConfigValidator config={validConfig} schema={mockSchema}>
          <div>Child Content</div>
        </ConfigValidator>,
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations in valid state', async () => {
      mockUseConfigValidation.mockReturnValue({
        isValidating: false,
        isValid: true,
        error: null,
      });

      const { container } = render(
        <ConfigValidator config={validConfig} schema={mockSchema}>
          <div>Child Content</div>
        </ConfigValidator>,
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
