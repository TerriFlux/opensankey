import {
  dataDimensionLevelsDisplay, readFigureLevelsDisplay, readFigureOpening, withDataOpening, withDimensionLevelsDisplay,
  withElementOpening, withFigureOpening, withLevelsDisplay
} from './figureOpening'

// 04/10/2026 — LA DISPOSITION DES NIVEAUX PAR DIMENSION (os#1511, tableau de navigation) : chaque
// dimension a la sienne (`levels_display_by`) ; le reglage commun `levels_display` reste son defaut.
describe('os#1511 — disposition des niveaux par dimension', () => {
  test('le reglage commun se lit tel quel', () => {
    expect(readFigureLevelsDisplay({ levels_display: 'rings' })).toEqual({ common: 'rings', by: {} })
    expect(readFigureLevelsDisplay({ levels_display: 'in_place' })).toEqual({ common: 'in_place', by: {} })
  })
  test('un sac vide ne dit rien', () => {
    expect(readFigureLevelsDisplay({})).toEqual({ common: undefined, by: {} })
  })
  test('la cle par dimension se lit, une valeur inconnue est ignoree', () => {
    expect(readFigureLevelsDisplay({ levels_display_by: { pays: 'in_place', produit: 'rings', x: 'spiral' } }))
      .toEqual({ common: undefined, by: { pays: 'in_place', produit: 'rings' } })
  })
  test('la dimension l emporte sur le reglage commun, qui reste le defaut des autres', () => {
    const levels = readFigureLevelsDisplay({ levels_display: 'in_place', levels_display_by: { produit: 'rings' } })
    expect(dataDimensionLevelsDisplay(levels, 'produit')).toBe('rings')
    expect(dataDimensionLevelsDisplay(levels, 'pays')).toBe('in_place')
  })
  test('ecrire une dimension garde les autres', () => {
    expect(withDimensionLevelsDisplay({ levels_display_by: { produit: 'rings' }, x: 1 }, 'pays', 'in_place'))
      .toEqual({ levels_display_by: { produit: 'rings', pays: 'in_place' }, x: 1 })
  })
  test('ecrire la disposition commune retire la cle par dimension', () => {
    expect(withLevelsDisplay({ levels_display_by: { produit: 'rings' }, x: 1 }, 'in_place'))
      .toEqual({ levels_display: 'in_place', levels_display_by: undefined, x: 1 })
  })
})

// Sans reglage, en secteurs (« le mode sunburst ne doit pas etre celui selectionne par defaut »).
describe('os#1511 — disposition par defaut', () => {
  test('sans reglage : en secteurs', () => {
    expect(dataDimensionLevelsDisplay(readFigureLevelsDisplay({}))).toBe('in_place')
    expect(dataDimensionLevelsDisplay(readFigureLevelsDisplay({}), 'produit')).toBe('in_place')
  })
  test('le reglage ecrit l emporte', () => {
    expect(dataDimensionLevelsDisplay(readFigureLevelsDisplay({ levels_display: 'rings' }))).toBe('rings')
  })
})

// os#1511 — CE QU UNE FIGURE A OUVERT, lu et ecrit a un seul endroit. Les fichiers d avant rangeaient
// tout dans `hierarchy_expanded` (entree `detache`, entrees `membre:<dim>/<m>`) : ils doivent se
// rouvrir a l identique.

describe('os#1511 — la lecture de ce qu une figure a ouvert', () => {
  test('un sac vide : rien d ouvert, liee au diagramme', () => {
    const o = readFigureOpening({})
    expect([...o.elements]).toEqual([])
    expect(o.data).toEqual({ linked: true })
  })

  test('les noeuds et les cases de croisement restent des elements ouverts', () => {
    const o = readFigureOpening({ hierarchy_expanded: ['n_ble', 'f_1#self'] })
    expect([...o.elements]).toEqual(['n_ble', 'f_1#self'])
  })

  test('fichier d avant, detache : la coupe propre se relit par dimension', () => {
    const o = readFigureOpening({
      hierarchy_expanded: ['detache', 'membre:filiere/produits', 'membre:filiere/cereales', 'membre:pays/monde']
    })
    expect([...o.elements]).toEqual([])
    expect(o.data).toEqual({ linked: false, opened: { filiere: ['produits', 'cereales'], pays: ['monde'] } })
  })

  test('fichier d avant, detache sans membre : coupe jamais ecrite', () => {
    expect(readFigureOpening({ hierarchy_expanded: ['detache'] }).data).toEqual({ linked: false })
  })

  test('fichier d avant, lie : les anciennes entrees de membre sont ignorees, comme au dessin', () => {
    expect(readFigureOpening({ hierarchy_expanded: ['membre:pays/monde'] }).data).toEqual({ linked: true })
  })

  test('une figure n est detachee que si elle le dit', () => {
    expect(readFigureOpening({ coordinates_linked: false }).data.linked).toBe(false)
    expect(readFigureOpening({ coordinates_linked: true, hierarchy_expanded: ['detache'] }).data.linked).toBe(true)
  })
})

describe('os#1511 — l ecriture : un sac se relit comme il s est ecrit', () => {
  test('une coupe propre s ecrit dans ses deux cles, et le vieux format disparait', () => {
    const sac = withDataOpening(
      { hierarchy_expanded: ['detache', 'membre:pays/monde'], autre: 1 },
      { linked: false, opened: { pays: ['monde'] } }
    )
    expect(sac).toEqual({
      hierarchy_expanded: undefined, coordinates_linked: false, dimension_opening: { pays: ['monde'] }, autre: 1
    })
    expect(readFigureOpening(sac).data).toEqual({ linked: false, opened: { pays: ['monde'] } })
  })

  test('relier retire la coupe propre', () => {
    const sac = withDataOpening({ coordinates_linked: false, dimension_opening: { pays: ['monde'] } }, { linked: true })
    expect(sac.coordinates_linked).toBeUndefined()
    expect(sac.dimension_opening).toBeUndefined()
  })

  test('ouvrir un noeud garde la coupe d un fichier d avant, convertie', () => {
    const sac = withElementOpening({ hierarchy_expanded: ['detache', 'membre:pays/monde'] }, ['n_ble'])
    expect(readFigureOpening(sac)).toEqual({
      elements: new Set(['n_ble']), data: { linked: false, opened: { pays: ['monde'] } }
    })
  })

  test('aller-retour', () => {
    const ouvert = { elements: new Set(['n_1']), data: { linked: false, opened: { a: ['x'] } } }
    expect(readFigureOpening(withFigureOpening({}, ouvert))).toEqual(ouvert)
  })
})
