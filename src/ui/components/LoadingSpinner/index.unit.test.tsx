/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoadingSpinner } from './index';

// Mock the CSS imports
jest.mock('../Row/index.less', () => ({}));
jest.mock('../BaseView/index.less', () => ({}));
jest.mock('@/shared/components/Loading/style.less', () => ({}));

describe('LoadingSpinner component', () => {
  it('should render spinner element', () => {
    render(<LoadingSpinner />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should render with large size by default', () => {
    render(<LoadingSpinner />);
    const spinner = document.querySelector('.h-6.w-6');
    expect(spinner).toBeInTheDocument();
  });

  it('should render with tiny size', () => {
    render(<LoadingSpinner size="tiny" />);
    const spinner = document.querySelector('.h-3.w-3');
    expect(spinner).toBeInTheDocument();
  });

  it('should render with small size', () => {
    render(<LoadingSpinner size="small" />);
    const spinner = document.querySelector('.h-3\\.5.w-3\\.5');
    expect(spinner).toBeInTheDocument();
  });

  it('should render with medium size', () => {
    render(<LoadingSpinner size="medium" />);
    const spinner = document.querySelector('.h-4\\.5.w-4\\.5');
    expect(spinner).toBeInTheDocument();
  });

  it('should render with large size', () => {
    render(<LoadingSpinner size="large" />);
    const spinner = document.querySelector('.h-6.w-6');
    expect(spinner).toBeInTheDocument();
  });

  it('should render with xlarge size', () => {
    render(<LoadingSpinner size="xlarge" />);
    const spinner = document.querySelector('.h-8.w-8');
    expect(spinner).toBeInTheDocument();
  });

  it('should render with xxlarge size', () => {
    render(<LoadingSpinner size="xxlarge" />);
    const spinner = document.querySelector('.h-10.w-10');
    expect(spinner).toBeInTheDocument();
  });

  it('should render with custom color', () => {
    render(<LoadingSpinner color="#ff0000" />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toHaveStyle({ borderColor: '#ff0000', borderTopColor: 'transparent' });
  });

  it('should render with text', () => {
    render(<LoadingSpinner text="Loading..." />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should center spinner by default', () => {
    const { container } = render(<LoadingSpinner />);
    const div = container.querySelector('div');
    // Check that the container has the centering styles
    expect(div?.style.display).toBe('flex');
    expect(div?.style.justifyContent).toBe('center');
    expect(div?.style.alignItems).toBe('center');
  });

  it('should not center spinner when center is false', () => {
    const { container } = render(<LoadingSpinner center={false} />);
    const div = container.querySelector('div');
    expect(div?.style.justifyContent).toBeFalsy();
  });

  it('should apply custom className', () => {
    render(<LoadingSpinner className="custom-loading-spinner" />);
    const container = document.querySelector('.custom-loading-spinner');
    expect(container).toBeInTheDocument();
  });

  it('should apply custom style', () => {
    const { container } = render(<LoadingSpinner style={{ marginTop: '10px' }} />);
    const div = container.querySelector('div');
    expect(div?.style.marginTop).toBe('10px');
    expect(div?.style.display).toBe('flex'); // Should still have centering styles
  });

  it('should apply style to non-centered mode', () => {
    const { container } = render(<LoadingSpinner center={false} style={{ padding: '20px' }} />);
    const div = container.querySelector('div');
    expect(div?.style.padding).toBe('20px');
    expect(div?.style.justifyContent).toBeFalsy(); // Should not have centering
  });

  it('should combine spinner and text with spacing', () => {
    render(<LoadingSpinner text="Loading..." />);
    const text = screen.getByText('Loading...');
    expect(text.tagName.toLowerCase()).toBe('span');
    expect(text).toHaveStyle({ marginLeft: '8px' });
  });
});
