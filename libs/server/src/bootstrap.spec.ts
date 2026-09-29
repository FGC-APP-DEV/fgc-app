import { trustProxyHops } from './bootstrap'

describe('trustProxyHops', () => {
  it('defaults to trusting no proxy', () => {
    expect(trustProxyHops({})).toBe(0)
    expect(trustProxyHops({ TRUST_PROXY_HOPS: ' ' })).toBe(0)
  })
  it('accepts an integer from 0 to 5', () => {
    expect(trustProxyHops({ TRUST_PROXY_HOPS: '2' })).toBe(2)
  })
  it.each(['-1', '1.5', 'two', '6', 'true'])('rejects %s', (value) => {
    expect(() => trustProxyHops({ TRUST_PROXY_HOPS: value })).toThrow(
      'TRUST_PROXY_HOPS',
    )
  })
})
