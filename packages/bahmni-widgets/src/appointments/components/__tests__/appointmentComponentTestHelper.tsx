/// <reference types="jest" />
import { useTranslation } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { useNotification } from '../../../notification';

export const getAppointmentMocks = () => ({
  mockUseQuery: useQuery as jest.MockedFunction<typeof useQuery>,
  mockUseTranslation: useTranslation as jest.MockedFunction<
    typeof useTranslation
  >,
  mockUseNotification: useNotification as jest.MockedFunction<
    typeof useNotification
  >,
});

export const setupAppointmentMocks = (
  mocks: ReturnType<typeof getAppointmentMocks>,
) => {
  jest.clearAllMocks();

  mocks.mockUseTranslation.mockReturnValue({
    t: (key: string) => key,
  } as any);

  const addNotificationMock = jest.fn();
  mocks.mockUseNotification.mockReturnValue({
    addNotification: addNotificationMock,
  } as any);

  mocks.mockUseQuery.mockReturnValue({
    data: undefined,
    isLoading: true,
    isError: false,
    error: null,
  } as any);

  return addNotificationMock;
};

export const getAppointmentTestCases = (
  config: {
    Component: React.ComponentType<any>;
    queryKeyPrefix: string;
    testProps?: Record<string, any>;
  },
  mocks: ReturnType<typeof getAppointmentMocks>,
) => {
  const { Component, queryKeyPrefix, testProps = {} } = config;
  const defaultPageSize = testProps.pageSize ?? 10;
  const mergedProps = { pageSize: defaultPageSize, ...testProps };

  return {
    renderLoadingTest: () => {
      render(<Component patientUUID="test-uuid" {...mergedProps} />);
      expect(mocks.mockUseQuery).toHaveBeenCalled();
    },

    errorNotificationTest: () => {
      const mockError = new Error('Failed to fetch');
      mocks.mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: mockError,
      } as any);

      render(<Component patientUUID="test-uuid" {...mergedProps} />);

      expect(mocks.mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: expect.arrayContaining([queryKeyPrefix, 'test-uuid']),
        }),
      );
    },

    correctParametersTest: () => {
      render(<Component patientUUID="test-uuid" {...mergedProps} />);

      expect(mocks.mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: expect.arrayContaining([
            queryKeyPrefix,
            'test-uuid',
            1,
            defaultPageSize,
          ]),
          enabled: true,
          queryFn: expect.any(Function),
        }),
      );
    },
  };
};
