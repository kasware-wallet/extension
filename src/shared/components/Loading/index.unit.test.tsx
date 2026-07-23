/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Loading, { Spinner } from './index';

// Mock the CSS import
jest.mock('./style.less', () => ({}));

describe('Loading component', () => {
  describe('Loading', () => {
    it('should render when loading is true', () => {
      render(<Loading loading={true} />);
      const loading = document.querySelector('.kasware-loading');
      expect(loading).toBeInTheDocument();
    });

    it('should not render when loading is false', () => {
      render(<Loading loading={false} />);
      const loading = document.querySelector('.kasware-loading');
      expect(loading).not.toBeInTheDocument();
    });

    it('should render by default (loading=true)', () => {
      render(<Loading />);
      const loading = document.querySelector('.kasware-loading');
      expect(loading).toBeInTheDocument();
    });

    it('should render children as loading text', () => {
      render(<Loading loading={true}>Loading data...</Loading>);
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<Loading loading={true} className="custom-loading" />);
      const loading = document.querySelector('.kasware-loading.custom-loading');
      expect(loading).toBeInTheDocument();
    });

    it('should apply custom style', () => {
      render(<Loading loading={true} style={{ marginTop: '10px' }} />);
      const loading = document.querySelector('.kasware-loading');
      expect(loading).toHaveStyle({ marginTop: '10px' });
    });

    it('should render Spinner component inside', () => {
      render(<Loading loading={true} />);
      const spinner = document.querySelector('.kasware-loading-image');
      expect(spinner).toBeInTheDocument();
    });

    it('should render loading text container', () => {
      render(<Loading loading={true}>Text</Loading>);
      const textContainer = document.querySelector('.kasware-loading-text');
      expect(textContainer).toBeInTheDocument();
    });
  });

  describe('Spinner', () => {
    it('should render spinner element', () => {
      render(<Spinner />);
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should apply tiny size class', () => {
      render(<Spinner size="tiny" />);
      const spinner = document.querySelector('.h-3.w-3');
      expect(spinner).toBeInTheDocument();
    });

    it('should apply small size class', () => {
      render(<Spinner size="small" />);
      const spinner = document.querySelector('.h-3\\.5.w-3\\.5');
      expect(spinner).toBeInTheDocument();
    });

    it('should apply medium size class', () => {
      render(<Spinner size="medium" />);
      const spinner = document.querySelector('.h-4\\.5.w-4\\.5');
      expect(spinner).toBeInTheDocument();
    });

    it('should apply large size class by default', () => {
      render(<Spinner />);
      const spinner = document.querySelector('.h-6.w-6');
      expect(spinner).toBeInTheDocument();
    });

    it('should apply large size class when specified', () => {
      render(<Spinner size="large" />);
      const spinner = document.querySelector('.h-6.w-6');
      expect(spinner).toBeInTheDocument();
    });

    it('should apply xlarge size class', () => {
      render(<Spinner size="xlarge" />);
      const spinner = document.querySelector('.h-8.w-8');
      expect(spinner).toBeInTheDocument();
    });

    it('should apply xxlarge size class', () => {
      render(<Spinner size="xxlarge" />);
      const spinner = document.querySelector('.h-10.w-10');
      expect(spinner).toBeInTheDocument();
    });

    it('should default to medium size for invalid size', () => {
      render(<Spinner size={'invalid' as any} />);
      const spinner = document.querySelector('.h-4\\.5.w-4\\.5');
      expect(spinner).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<Spinner className="custom-spinner" />);
      const container = document.querySelector('.custom-spinner');
      expect(container).toBeInTheDocument();
    });

    it('should apply custom style', () => {
      render(<Spinner style={{ marginLeft: '5px' }} />);
      const container = document.querySelector('.flex.justify-center.items-center');
      expect(container).toHaveStyle({ marginLeft: '5px' });
    });

    it('should have border-primary class for spinner color by default', () => {
      render(<Spinner />);
      const spinner = document.querySelector('.border-primary');
      expect(spinner).toBeInTheDocument();
    });

    it('should apply custom color via style', () => {
      render(<Spinner color="#ff0000" />);
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toHaveStyle({ borderColor: '#ff0000', borderTopColor: 'transparent' });
    });

    it('should have rounded-full class for circular shape', () => {
      render(<Spinner />);
      const spinner = document.querySelector('.rounded-full');
      expect(spinner).toBeInTheDocument();
    });

    it('should have animate-spin class for rotation animation', () => {
      render(<Spinner />);
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('integration', () => {
    it('should render Spinner with tiny size inside Loading', () => {
      render(<Loading loading={true} />);
      const spinnerInLoading = document.querySelector('.kasware-loading-image');
      expect(spinnerInLoading).toBeInTheDocument();

      // The spinner inside Loading uses "tiny" size
      const tinySpinner = document.querySelector('.h-3.w-3');
      expect(tinySpinner).toBeInTheDocument();
    });
  });
});
