import { resolveLinkOrientation } from './linkOrientation'

describe('resolveLinkOrientation — l orientation auto se tranche sur le quadrant', () => {
  it('rend une orientation explicite telle quelle, quel que soit le deplacement', () => {
    expect(resolveLinkOrientation('hh', 0, 500)).toBe('hh')
    expect(resolveLinkOrientation('vv', 500, 0)).toBe('vv')
    expect(resolveLinkOrientation('hv', 1, 1)).toBe('hv')
    expect(resolveLinkOrientation('vh', -1, -1)).toBe('vh')
  })

  it('en auto, une cible plus loin en x qu en y donne un flux horizontal, dans les deux sens', () => {
    expect(resolveLinkOrientation('auto', 300, 100)).toBe('hh')
    expect(resolveLinkOrientation('auto', -300, 100)).toBe('hh')
  })

  it('en auto, une cible plus loin en y qu en x donne un flux vertical, dans les deux sens', () => {
    expect(resolveLinkOrientation('auto', 100, 300)).toBe('vv')
    expect(resolveLinkOrientation('auto', 100, -300)).toBe('vv')
  })

  it('a egalite exacte, l horizontal l emporte, comme le defaut historique', () => {
    expect(resolveLinkOrientation('auto', 200, 200)).toBe('hh')
    expect(resolveLinkOrientation('auto', 0, 0)).toBe('hh')
  })
})
