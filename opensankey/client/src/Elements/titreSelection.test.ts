import { pluralGroupName } from './titleTokens'

// os#1511 (Julien, 10/10) — plusieurs membres montres : le titre dit « Selection de filieres ».

describe('os#1511 — nom de dimension au pluriel pour le titre', () => {
  test('premier mot au pluriel, en minuscules', () => {
    expect(pluralGroupName('Filière')).toBe('filières')
    expect(pluralGroupName('Type de matière')).toBe('types de matière')
  })
  test('un mot qui finit deja par s, x ou z reste tel quel', () => {
    expect(pluralGroupName('Pays')).toBe('pays')
    expect(pluralGroupName('Prix')).toBe('prix')
  })
})
