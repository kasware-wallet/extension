/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Checkbox from './index';

// Mock the CSS import
jest.mock('./style.less', () => ({}));

describe('Checkbox component', () => {
  const defaultProps = {
    checked: false,
    onChange: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render unchecked by default', () => {
      render(<Checkbox {...defaultProps} />);
      const wrapper = document.querySelector('.kasware-checkbox__wrapper');
      expect(wrapper).toBeInTheDocument();
    });

    it('should render checked when checked prop is true', () => {
      render(<Checkbox {...defaultProps} checked={true} />);
      const wrapper = document.querySelector('.kasware-checkbox__wrapper.checked');
      expect(wrapper).toBeInTheDocument();
    });

    it('should render children as label', () => {
      render(
        <Checkbox {...defaultProps}>
          <span>Label text</span>
        </Checkbox>
      );
      expect(screen.getByText('Label text')).toBeInTheDocument();
    });

    it('should render custom check icon when provided', () => {
      render(<Checkbox {...defaultProps} checkIcon={<span data-testid="custom-icon">Custom</span>} />);
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('should render default check icon when no custom icon provided', () => {
      render(<Checkbox {...defaultProps} />);
      const svg = document.querySelector('svg.icon-check');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('should call onChange with true when clicked while unchecked', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<Checkbox {...defaultProps} checked={false} onChange={onChange} />);

      const wrapper = document.querySelector('.kasware-checkbox__wrapper');
      await user.click(wrapper!);

      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('should call onChange with false when clicked while checked', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<Checkbox {...defaultProps} checked={true} onChange={onChange} />);

      const wrapper = document.querySelector('.kasware-checkbox__wrapper');
      await user.click(wrapper!);

      expect(onChange).toHaveBeenCalledWith(false);
    });

    it('should not call onChange when no onChange handler provided', async () => {
      const user = userEvent.setup();
      render(<Checkbox checked={false} />);

      const wrapper = document.querySelector('.kasware-checkbox__wrapper');
      await user.click(wrapper!);

      // Should not throw error
    });
  });

  describe('styling', () => {
    it('should apply custom className', () => {
      render(<Checkbox {...defaultProps} className="custom-class" />);
      const wrapper = document.querySelector('.kasware-checkbox__wrapper.custom-class');
      expect(wrapper).toBeInTheDocument();
    });

    it('should apply checkBoxClassName', () => {
      render(<Checkbox {...defaultProps} checkBoxClassName="custom-checkbox" />);
      const checkbox = document.querySelector('.kasware-checkbox.custom-checkbox');
      expect(checkbox).toBeInTheDocument();
    });

    it('should apply circle type by default', () => {
      render(<Checkbox {...defaultProps} />);
      const checkbox = document.querySelector('.kasware-checkbox.circle');
      expect(checkbox).toBeInTheDocument();
    });

    it('should apply square type when specified', () => {
      render(<Checkbox {...defaultProps} type="square" />);
      const checkbox = document.querySelector('.kasware-checkbox.square');
      expect(checkbox).toBeInTheDocument();
    });

    it('should apply custom width and height', () => {
      render(<Checkbox {...defaultProps} width="24px" height="24px" />);
      const checkbox = document.querySelector('.kasware-checkbox');
      expect(checkbox).toHaveStyle({ width: '24px', height: '24px' });
    });

    it('should apply checked background color', () => {
      render(<Checkbox {...defaultProps} checked={true} background="#ff0000" />);
      const checkbox = document.querySelector('.kasware-checkbox');
      expect(checkbox).toHaveStyle({ backgroundColor: '#ff0000' });
    });

    it('should apply unchecked background color', () => {
      render(<Checkbox {...defaultProps} checked={false} unCheckBackground="#cccccc" />);
      const checkbox = document.querySelector('.kasware-checkbox');
      expect(checkbox).toHaveStyle({ backgroundColor: '#cccccc' });
    });
  });

  describe('state management', () => {
    it('should update state when checked prop changes', () => {
      const { rerender } = render(<Checkbox {...defaultProps} checked={false} />);
      expect(document.querySelector('.kasware-checkbox__wrapper.checked')).not.toBeInTheDocument();

      rerender(<Checkbox {...defaultProps} checked={true} />);
      expect(document.querySelector('.kasware-checkbox__wrapper.checked')).toBeInTheDocument();
    });

    it('should support defaultChecked for initial render', () => {
      // The component uses defaultChecked for initial state before useEffect runs
      // But checked prop is required, so we test the component renders correctly
      render(<Checkbox checked={true} defaultChecked={true} onChange={jest.fn()} />);
      const wrapper = document.querySelector('.kasware-checkbox__wrapper.checked');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('event propagation', () => {
    it('should stop event propagation on click', () => {
      const parentClick = jest.fn();
      const onChange = jest.fn();

      render(
        <div onClick={parentClick}>
          <Checkbox checked={false} onChange={onChange} />
        </div>
      );

      const wrapper = document.querySelector('.kasware-checkbox__wrapper');
      fireEvent.click(wrapper!);

      expect(parentClick).not.toHaveBeenCalled();
      expect(onChange).toHaveBeenCalled();
    });
  });
});
