import {
  applyDrop, dropTarget, cellDropId, newRowDropId, newColDropId, NEW_TAB, TRAY
} from './presentationDrop'
import { layoutFor, DEFAULT_BLOCK_VISIBILITY, type Type_Composition } from '../../../types/PresentationComposition'
import type { Type_PanelMode } from '../../../types/PanelManager'

// AJUSTEMENT #5 — le geste de glisser-déposer, vu du modèle. Chaque test décrit
// un dépôt dans le TABLEAU (onglets × colonnes × rangées) et ce que le LECTEUR
// verra ensuite.

const entry = (block: string): never =>
  ({ block, show: { ...DEFAULT_BLOCK_VISIBILITY } }) as never

/** Vue lisible : onglets -> colonnes -> rangées -> blocs. */
const grid = (composition: Type_Composition, mode: Type_PanelMode) =>
  layoutFor(composition, mode).map(cols => cols.map(rows => rows.map(cell => cell.map(e => e.block))))

const shape = { tabs: 2, cols: () => 3, rows: () => 4 }

describe('#5 dropTarget', () => {
  it('lit les quatre sortes de zones', () => {
    expect(dropTarget(cellDropId(1, 2, 3), shape)).toEqual({ tab: 1, col: 2, row: 3 })
    expect(dropTarget(newRowDropId(0, 1), shape)).toEqual({ tab: 0, col: 1, row: 4 })
    expect(dropTarget(newColDropId(1), shape)).toEqual({ tab: 1, col: 3, row: 0 })
    expect(dropTarget(NEW_TAB, shape)).toEqual({ tab: 2, col: 0, row: 0 })
    expect(dropTarget(TRAY, shape)).toBeNull()
  })

  it('rejette un identifiant inexploitable au lieu d\'inventer un placement', () => {
    expect(dropTarget('nawak', shape)).toBeUndefined()
    expect(dropTarget('cell|x|y|z', shape)).toBeUndefined()
  })
})

describe('#5 applyDrop — construire le tableau', () => {
  const base: Type_Composition = [entry('a'), entry('b'), entry('c')]

  it('« nouvelle colonne » met le bloc CÔTE À CÔTE des autres', () => {
    const next = applyDrop(base, 'tooltip', 'c', newColDropId(0), 0)
    expect(grid(next, 'tooltip')).toEqual([[[['a'], ['b']], [['c']]]])
  })

  it('une colonne accueille ensuite plusieurs rangées', () => {
    const deux_cols = applyDrop(base, 'tooltip', 'c', newColDropId(0), 0)
    const next = applyDrop(deux_cols, 'tooltip', 'b', newRowDropId(0, 1), 0)
    expect(grid(next, 'tooltip')).toEqual([[[['a']], [['c'], ['b']]]])
  })

  it('« nouvelle rangée » descend le bloc au bas de SA colonne', () => {
    const next = applyDrop(base, 'tooltip', 'a', newRowDropId(0, 0), 0)
    expect(grid(next, 'tooltip')).toEqual([[[['b'], ['c'], ['a']]]])
  })

  it('« nouvel onglet » ouvre un second tableau', () => {
    const next = applyDrop(base, 'tooltip', 'c', NEW_TAB, 0)
    expect(grid(next, 'tooltip')).toEqual([[[['a'], ['b']]], [[['c']]]])
  })

  it('déposer sur une cellule occupée y empile les blocs', () => {
    const next = applyDrop(base, 'tooltip', 'c', cellDropId(0, 0, 0), 1)
    expect(grid(next, 'tooltip')).toEqual([[[['a', 'c'], ['b']]]])
  })

  it('respecte l\'ENDROIT du dépôt dans la cellule', () => {
    const next = applyDrop(base, 'tooltip', 'c', cellDropId(0, 0, 0), 0)
    expect(grid(next, 'tooltip')).toEqual([[[['c', 'a'], ['b']]]])
  })

  it('une colonne vidée de son dernier bloc disparaît', () => {
    const deux_cols = applyDrop(base, 'tooltip', 'c', newColDropId(0), 0)
    const revenu = applyDrop(deux_cols, 'tooltip', 'c', cellDropId(0, 0, 0), 1)
    expect(grid(revenu, 'tooltip')).toEqual([[[['a', 'c'], ['b']]]])
  })

  it('un onglet vidé de son dernier bloc disparaît', () => {
    const deux = applyDrop(base, 'tooltip', 'c', NEW_TAB, 0)
    const revenu = applyDrop(deux, 'tooltip', 'c', newRowDropId(0, 0), 0)
    expect(grid(revenu, 'tooltip')).toEqual([[[['a'], ['b'], ['c']]]])
  })
})

describe('#5 applyDrop — retirer', () => {
  const base: Type_Composition = [entry('a'), entry('b')]

  it('la réserve retire du contenant, sans retirer du document', () => {
    const next = applyDrop(base, 'tooltip', 'a', TRAY, 0)
    expect(grid(next, 'tooltip')).toEqual([[[['b']]]])
    expect(next).toHaveLength(2)
    expect(next.find(e => e.block === 'a')?.show.tooltip).toBe(false)
  })

  it('le bloc retiré d\'un contenant reste intact dans les DEUX autres', () => {
    const next = applyDrop(base, 'tooltip', 'a', TRAY, 0)
    expect(grid(next, 'popup')).toEqual([[[['a'], ['b']]]])
    expect(grid(next, 'sidebar')).toEqual([[[['a'], ['b']]]])
  })

  it('rapatrier un bloc depuis la réserve le replace où on le dépose', () => {
    const retire = applyDrop(base, 'tooltip', 'a', TRAY, 0)
    const revenu = applyDrop(retire, 'tooltip', 'a', newColDropId(0), 0)
    expect(grid(revenu, 'tooltip')).toEqual([[[['b']], [['a']]]])
  })
})

describe('#5 applyDrop — isolement entre contenants', () => {
  it('arranger un contenant NE TOUCHE PAS l\'affichage des autres', () => {
    // La régression la plus coûteuse du glisser-déposer : réordonner la liste
    // pour ranger une cellule déplaçait les blocs non placés des autres modes.
    const base: Type_Composition = [entry('a'), entry('b'), entry('c')]
    const avant_popup = grid(base, 'popup')
    const avant_sidebar = grid(base, 'sidebar')
    const next = applyDrop(base, 'tooltip', 'c', cellDropId(0, 0, 0), 0)
    expect(grid(next, 'tooltip')).toEqual([[[['c', 'a'], ['b']]]])
    expect(grid(next, 'popup')).toEqual(avant_popup)
    expect(grid(next, 'sidebar')).toEqual(avant_sidebar)
  })

  it('ne mute jamais la composition reçue', () => {
    const base: Type_Composition = [entry('a'), entry('b')]
    const copie = JSON.parse(JSON.stringify(base))
    applyDrop(base, 'popup', 'b', cellDropId(0, 0, 0), 0)
    expect(base).toEqual(copie)
  })
})
