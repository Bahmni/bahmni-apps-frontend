import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { initFontAwesome } from '../../../fontawesome';
import { ICON_SIZE } from '../../icon';
import { TooltipIcon } from '../TooltipIcon';
import '@testing-library/jest-dom';

beforeAll(() => {
  initFontAwesome();
});

describe('TooltipIcon', () => {
  const defaultProps = {
    iconName: 'fa-file-lines',
    content: 'Test tooltip content',
  };

  it('renders button with icon and shows content on click', async () => {
    const user = userEvent.setup();
    render(<TooltipIcon {...defaultProps} />);

    expect(screen.getByRole('button')).toBeInTheDocument();

    await user.click(screen.getByRole('button'));
    expect(screen.getByText(defaultProps.content)).toBeInTheDocument();
  });

  it('renders complex ReactNode content', async () => {
    const user = userEvent.setup();
    const complexContent = (
      <div>
        <strong>Important</strong>
        <span>Additional info</span>
      </div>
    );

    render(<TooltipIcon {...defaultProps} content={complexContent} />);

    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Important')).toBeInTheDocument();
    expect(screen.getByText('Additional info')).toBeInTheDocument();
  });

  it('does not render when content is falsy', () => {
    render(<TooltipIcon iconName="fa-test" content="" testId="empty" />);
    render(<TooltipIcon iconName="fa-test" content={null} testId="null" />);
    render(
      <TooltipIcon iconName="fa-test" content={undefined} testId="undefined" />,
    );

    expect(screen.queryByTestId('empty')).not.toBeInTheDocument();
    expect(screen.queryByTestId('null')).not.toBeInTheDocument();
    expect(screen.queryByTestId('undefined')).not.toBeInTheDocument();
  });

  it('applies custom className and default styling', () => {
    const customClass = 'custom-tooltip';
    render(
      <TooltipIcon
        {...defaultProps}
        className={customClass}
        testId="styled-tooltip"
      />,
    );

    const tooltip = screen.getByTestId('styled-tooltip');
    expect(tooltip).toHaveClass('tooltipIcon', customClass);
  });

  it('handles testId prop correctly', () => {
    const testId = 'custom-tooltip';
    render(<TooltipIcon {...defaultProps} testId={testId} />);

    expect(screen.getByTestId(testId)).toBeInTheDocument();
  });

  it('applies custom ariaLabel to icon', () => {
    const ariaLabel = 'Custom info icon';
    render(
      <TooltipIcon
        {...defaultProps}
        ariaLabel={ariaLabel}
        testId="aria-test"
      />,
    );

    const icon = screen.getByLabelText(ariaLabel);
    expect(icon).toBeInTheDocument();
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<TooltipIcon {...defaultProps} />);

    const button = screen.getByRole('button');

    await user.tab();
    expect(button).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(screen.getByText(defaultProps.content)).toBeInTheDocument();
  });

  it('passes icon props correctly', () => {
    render(
      <TooltipIcon
        iconName="fa-info-circle"
        content="Info"
        iconSize={ICON_SIZE.XL}
        testId="icon-props-test"
      />,
    );

    expect(screen.getByTestId('icon-props-test-icon')).toBeInTheDocument();
  });
});
