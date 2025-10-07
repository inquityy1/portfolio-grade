describe('Button', () => {
  it('should be exportable', () => {
    // Simple test to verify the module can be imported without errors
    expect(() => {
      require('./Button');
    }).not.toThrow();
  });

  it('should exist as a React component', () => {
    const { Button } = require('./Button');
    expect(typeof Button).toBe('object');
    expect(Button).toBeDefined();
  });
});
