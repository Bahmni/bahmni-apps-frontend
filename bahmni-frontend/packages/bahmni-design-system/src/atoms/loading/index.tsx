import {
    Loading as CarbonLoading,
    LoadingProps as CarbonLoadingProps,
} from "@carbon/react";

export type LoadingProps = CarbonLoadingProps & {
    testId?: string;
}

export const Loading: React.FC<LoadingProps> = ({
    testId,
    children,
    ...carbonProps
}) => {
    return (
        <CarbonLoading {...carbonProps} data-testid={testId}>
            {children}
        </CarbonLoading>
    );
};