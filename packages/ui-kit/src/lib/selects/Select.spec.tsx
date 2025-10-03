describe('Select', () => {
  it('should be exportable', () => {
    // Simple test to verify the module can be imported without errors
    expect(() => {
      require('./Select')
    }).not.toThrow()
  })

  it('should exist as a React component', () => {
    const { Select } = require('./Select')
    expect(typeof Select).toBe('object')
    expect(Select).toBeDefined()
  })
})
