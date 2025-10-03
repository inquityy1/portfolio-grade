describe('Label', () => {
  it('should be exportable', () => {
    // Simple test to verify the module can be imported without errors
    expect(() => {
      require('./Label')
    }).not.toThrow()
  })

  it('should exist as a React component', () => {
    const { Label } = require('./Label')
    expect(typeof Label).toBe('object')
    expect(Label).toBeDefined()
  })
})
