describe('Card', () => {
  it('should be exportable', () => {
    // Simple test to verify the module can be imported without errors
    expect(() => {
      require('./Card');
    }).not.toThrow();
  });

  it('should exist as a React component', () => {
    const { Card, CardHeader, CardTitle, CardContent, CardFooter } = require('./Card');
    expect(typeof Card).toBe('object');
    expect(Card).toBeDefined();
    expect(typeof CardHeader).toBe('object');
    expect(CardHeader).toBeDefined();
    expect(typeof CardTitle).toBe('object');
    expect(CardTitle).toBeDefined();
    expect(typeof CardContent).toBe('object');
    expect(CardContent).toBeDefined();
    expect(typeof CardFooter).toBe('object');
    expect(CardFooter).toBeDefined();
  });
});
