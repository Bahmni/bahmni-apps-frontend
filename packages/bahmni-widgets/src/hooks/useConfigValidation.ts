import { useState, useEffect } from 'react';
import { validateConfig } from '@bahmni/services';

interface ConfigValidationState {
  isValidating: boolean;
  isValid: boolean;
  error: string | null;
}

interface UseConfigValidationOptions {
  config: unknown;
  schema: Record<string, unknown>;
}

export const useConfigValidation = ({
  config,
  schema,
}: UseConfigValidationOptions): ConfigValidationState => {
  const [state, setState] = useState<ConfigValidationState>({
    isValidating: true,
    isValid: false,
    error: null,
  });

  useEffect(() => {
    const validate = async () => {
      setState({
        isValidating: true,
        isValid: false,
        error: null,
      });

      try {
        const isValid = await validateConfig(config, schema);

        setState({
          isValidating: false,
          isValid,
          error: isValid
            ? null
            : 'Configuration does not match required schema',
        });
      } catch (error) {
        setState({
          isValidating: false,
          isValid: false,
          error:
            error instanceof Error ? error.message : 'Unknown validation error',
        });
      }
    };

    validate();
  }, [config, schema]);

  return state;
};