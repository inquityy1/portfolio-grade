describe('Container', () => {
  it('should be exportable', () => {
    // Simple test to verify the module can be imported without errors
    expect(() => {
      require('./Container');
    }).not.toThrow();
  });

  it('should exist as a React component', () => {
    const { Container, PageContainer, LoadingContainer, ErrorContainer } = require('./Container');
    expect(typeof Container).toBe('object');
    expect(Container).toBeDefined();
    expect(typeof PageContainer).toBe('object');
    expect(PageContainer).toBeDefined();
    expect(typeof LoadingContainer).toBe('object');
    expect(LoadingContainer).toBeDefined();
    expect(typeof ErrorContainer).toBe('object');
    expect(ErrorContainer).toBeDefined();
  });
});
