import { shadeAmongSiblings } from './splitBandColor'
import * as d3 from '../d3Modules'

describe('shadeAmongSiblings', () => {
  test('une couleur portee par une seule soeur reste intacte', () => {
    expect(shadeAmongSiblings(['#1f77b4', '#d62728'], 0)).toBe('#1f77b4')
    expect(shadeAmongSiblings(['#1f77b4', '#d62728'], 1)).toBe('#d62728')
  })

  test('deux soeurs de meme couleur deviennent une sombre et une claire', () => {
    const colors = ['#1f77b4', '#1F77B4']
    const a = shadeAmongSiblings(colors, 0)
    const b = shadeAmongSiblings(colors, 1)
    expect(a).not.toBe(b)
    expect(d3.hsl(a).l).toBeLessThan(d3.hsl('#1f77b4').l)
    expect(d3.hsl(b).l).toBeGreaterThan(d3.hsl('#1f77b4').l)
  })

  test('les soeurs de couleur distincte ne comptent pas dans la nuance', () => {
    const colors = ['#1f77b4', '#d62728', '#1f77b4', '#1f77b4']
    const shades = [0, 2, 3].map(i => d3.hsl(shadeAmongSiblings(colors, i)).l)
    expect(shades[0]).toBeLessThan(shades[1])
    expect(shades[1]).toBeLessThan(shades[2])
    expect(shadeAmongSiblings(colors, 1)).toBe('#d62728')
  })

  test('une couleur illisible est rendue telle quelle', () => {
    expect(shadeAmongSiblings(['none', 'none'], 0)).toBe('none')
  })
})
