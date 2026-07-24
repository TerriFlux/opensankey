import { addThousandsSeparator } from './numberFormat'

// OS#305 — La règle de séparation des milliers était dupliquée dans TooltipsNode
// et TooltipsLink ; extraite ici, elle est enfin couverte. La regex est le
// morceau fragile : elle ne doit JAMAIS mordre sur la partie décimale.

describe('#305 addThousandsSeparator', () => {
  it('sépare les milliers de la partie entière', () => {
    expect(addThousandsSeparator('1000')).toBe('1 000')
    expect(addThousandsSeparator('1234567')).toBe('1 234 567')
    expect(addThousandsSeparator('1000000')).toBe('1 000 000')
  })

  it('laisse intacts les nombres courts', () => {
    expect(addThousandsSeparator('0')).toBe('0')
    expect(addThousandsSeparator('999')).toBe('999')
    expect(addThousandsSeparator('')).toBe('')
  })

  it('ne touche PAS à la partie décimale', () => {
    expect(addThousandsSeparator('1234.5678')).toBe('1 234.5678')
    expect(addThousandsSeparator('0.123456')).toBe('0.123456')
    expect(addThousandsSeparator('12345.6789')).toBe('12 345.6789')
  })

  it('gère le signe négatif', () => {
    expect(addThousandsSeparator('-1234567')).toBe('-1 234 567')
  })

  it('laisse passer la notation scientifique sans la casser', () => {
    expect(addThousandsSeparator('1.2345e+21')).toBe('1.2345e+21')
  })
})
