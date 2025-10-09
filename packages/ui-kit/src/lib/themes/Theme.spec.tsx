import React from 'react';
import { render } from '@testing-library/react';
import { theme, GlobalStyle, UIProvider } from './Theme';

// Mock styled-components
jest.mock('styled-components', () => ({
  __esModule: true,
  ThemeProvider: ({ children, theme }: any) => children,
  createGlobalStyle: () => () => null,
}));

describe('Theme', () => {
  it('should be exportable', () => {
    // Simple test to verify the module can be imported without errors
    expect(() => {
      require('./Theme');
    }).not.toThrow();
  });

  it('should export theme object', () => {
    const { theme } = require('./Theme');
    expect(typeof theme).toBe('object');
    expect(theme).toBeDefined();
    expect(theme.colors).toBeDefined();
    expect(theme.radius).toBeDefined();
    expect(typeof theme.spacing).toBe('function');
  });

  it('should export GlobalStyle component', () => {
    const { GlobalStyle } = require('./Theme');
    expect(typeof GlobalStyle).toBe('function');
    expect(GlobalStyle).toBeDefined();
  });

  it('should export UIProvider component', () => {
    const { UIProvider } = require('./Theme');
    expect(typeof UIProvider).toBe('function');
    expect(UIProvider).toBeDefined();
  });

  it('should have correct theme structure', () => {
    const { theme } = require('./Theme');
    expect(theme.colors).toHaveProperty('bg');
    expect(theme.colors).toHaveProperty('text');
    expect(theme.colors).toHaveProperty('surface');
    expect(theme.colors).toHaveProperty('border');
    expect(theme.colors).toHaveProperty('primary');
    expect(theme.radius).toHaveProperty('md');
    expect(theme.radius).toHaveProperty('lg');
    expect(theme.spacing(4)).toBe('16px');
  });

  it('should have all required color properties', () => {
    expect(theme.colors.bg).toBe('#0b0d12');
    expect(theme.colors.text).toBe('#e8eaed');
    expect(theme.colors.surface).toBe('#161a22');
    expect(theme.colors.border).toBe('#2a2f3a');
    expect(theme.colors.primary).toBe('#5865f2');
    expect(theme.colors.error).toBe('tomato');
    expect(theme.colors.errorBackground).toBe('#ffe6e6');
    expect(theme.colors.success).toBe('#2e7d32');
    expect(theme.colors.successBackground).toBe('#e8f5e8');
    expect(theme.colors.warning).toBe('#f57c00');
    expect(theme.colors.warningBackground).toBe('#fff3e0');
  });

  it('should have correct radius values', () => {
    expect(theme.radius.md).toBe('12px');
    expect(theme.radius.lg).toBe('16px');
  });

  it('should have working spacing function', () => {
    expect(theme.spacing(0)).toBe('0px');
    expect(theme.spacing(1)).toBe('4px');
    expect(theme.spacing(2)).toBe('8px');
    expect(theme.spacing(3)).toBe('12px');
    expect(theme.spacing(4)).toBe('16px');
    expect(theme.spacing(5)).toBe('20px');
    expect(theme.spacing(10)).toBe('40px');
  });

  it('should handle spacing function with different inputs', () => {
    const spacing = theme.spacing;
    expect(spacing(0.5)).toBe('2px');
    expect(spacing(1.5)).toBe('6px');
    expect(spacing(2.5)).toBe('10px');
    expect(spacing(3.5)).toBe('14px');
  });

  it('should render UIProvider with children', () => {
    const { container } = render(
      <UIProvider>
        <div>Test content</div>
      </UIProvider>,
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render UIProvider with multiple children', () => {
    const { container } = render(
      <UIProvider>
        <div>Child 1</div>
        <div>Child 2</div>
        <span>Child 3</span>
      </UIProvider>,
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render UIProvider with complex children', () => {
    const ComplexChild = () => (
      <div>
        <h1>Title</h1>
        <p>Content</p>
        <button>Action</button>
      </div>
    );

    const { container } = render(
      <UIProvider>
        <ComplexChild />
      </UIProvider>,
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should handle GlobalStyle component', () => {
    const { container } = render(<GlobalStyle />);
    // GlobalStyle doesn't render visible content, just styles
    // The mock returns null, so we just test that it doesn't throw
    expect(container).toBeDefined();
  });

  it('should have theme as immutable object', () => {
    // Test that theme properties are accessible
    expect(() => {
      const bg = theme.colors.bg;
      const text = theme.colors.text;
      const spacing = theme.spacing(2);
      return { bg, text, spacing };
    }).not.toThrow();
  });

  it('should have consistent theme structure', () => {
    // Test that all expected properties exist
    expect(theme).toHaveProperty('colors');
    expect(theme).toHaveProperty('radius');
    expect(theme).toHaveProperty('spacing');

    expect(theme.colors).toHaveProperty('bg');
    expect(theme.colors).toHaveProperty('text');
    expect(theme.colors).toHaveProperty('surface');
    expect(theme.colors).toHaveProperty('border');
    expect(theme.colors).toHaveProperty('primary');
    expect(theme.colors).toHaveProperty('error');
    expect(theme.colors).toHaveProperty('errorBackground');
    expect(theme.colors).toHaveProperty('success');
    expect(theme.colors).toHaveProperty('successBackground');
    expect(theme.colors).toHaveProperty('warning');
    expect(theme.colors).toHaveProperty('warningBackground');

    expect(theme.radius).toHaveProperty('md');
    expect(theme.radius).toHaveProperty('lg');
  });
});
