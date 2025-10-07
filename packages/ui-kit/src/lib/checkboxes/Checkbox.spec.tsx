describe('Checkbox', () => {
  it('should be exportable', () => {
    // Simple test to verify the module can be imported without errors
    expect(() => {
      require('./Checkbox');
    }).not.toThrow();
  });

  it('should exist as a React component', () => {
    const { Checkbox } = require('./Checkbox');
    expect(typeof Checkbox).toBe('object');
    expect(Checkbox).toBeDefined();
  });
});
