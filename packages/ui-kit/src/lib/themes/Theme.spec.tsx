describe('Theme', () => {
  it('should be exportable', () => {
    // Simple test to verify the module can be imported without errors
    expect(() => {
      require('./Theme')
    }).not.toThrow()
  })

  it('should export theme object', () => {
    const { theme } = require('./Theme')
    expect(typeof theme).toBe('object')
    expect(theme).toBeDefined()
    expect(theme.colors).toBeDefined()
    expect(theme.radius).toBeDefined()
    expect(typeof theme.spacing).toBe('function')
  })

  it('should export GlobalStyle component', () => {
    const { GlobalStyle } = require('./Theme')
    expect(typeof GlobalStyle).toBe('object')
    expect(GlobalStyle).toBeDefined()
  })

  it('should export UIProvider component', () => {
    const { UIProvider } = require('./Theme')
    expect(typeof UIProvider).toBe('function')
    expect(UIProvider).toBeDefined()
  })

  it('should have correct theme structure', () => {
    const { theme } = require('./Theme')
    expect(theme.colors).toHaveProperty('bg')
    expect(theme.colors).toHaveProperty('text')
    expect(theme.colors).toHaveProperty('surface')
    expect(theme.colors).toHaveProperty('border')
    expect(theme.colors).toHaveProperty('primary')
    expect(theme.radius).toHaveProperty('md')
    expect(theme.radius).toHaveProperty('lg')
    expect(theme.spacing(4)).toBe('16px')
  })
})
