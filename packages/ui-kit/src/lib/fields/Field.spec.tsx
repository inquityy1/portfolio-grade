describe('Field', () => {
  it('should be exportable', () => {
    // Simple test to verify the module can be imported without errors
    expect(() => {
      require('./Field');
    }).not.toThrow();
  });

  it('should exist as a React component', () => {
    const { Field } = require('./Field');
    expect(typeof Field).toBe('object');
    expect(Field).toBeDefined();
  });
});
