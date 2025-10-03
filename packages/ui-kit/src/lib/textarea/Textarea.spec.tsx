describe('Textarea', () => {
  it('should be exportable', () => {
    // Simple test to verify the module can be imported without errors
    expect(() => {
      require('./Textarea')
    }).not.toThrow()
  })

  it('should exist as a React component', () => {
    const { Textarea } = require('./Textarea')
    expect(typeof Textarea).toBe('object')
    expect(Textarea).toBeDefined()
  })
})
