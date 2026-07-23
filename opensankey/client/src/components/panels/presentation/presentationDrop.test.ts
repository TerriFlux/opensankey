import { applyDrop, dropTarget, rowDropId, newRowDropId, NEW_TAB, TRAY } from './presentationDrop'
import { layoutFor, DEFAULT_BLOCK_VISIBILITY, type Type_Composition } from '../../../types/PresentationComposition'

// AJUSTEMENT #5 — le geste de glisser-déposer, vu du modèle. Chaque test décrit
// un dépôt et ce que le LECTEUR verra ensuite.

const entry = (block: string): never =>
  ({ block, show: { ...DEFAULT_BLOCK_VISIBILITY } }) as never

const shown = (composition: Type_Composition, mode: 'tooltip' | 'popup' | 'sidebar') =>
  layoutFor(composition, mode).map(rows => rows.map(row => row.map(e => e.block)))

describe('#5 dropTarget', () => {
  it('lit les trois sortes de zones', () => {
    expect(dropTarget(rowDropId(1, 2), 3, () => 0)).toEqual({ tab: 1, row: 2 })
    expect(dropTarget(newRowDropId(0), 3, () => 4)).toEqual({ tab: 0, row: 4 })
    expect(dropTarget(NEW_TAB, 3, () => 0)).toEqual({ tab: 3, row: 0 })
    expect(dropTarget(TRAY, 3, () => 0)).toBeNull()
  })

  it('rejette un identifiant inexploitable au lieu d\'inventer un placement', () => {
    expect(dropTarget('nawak', 1, () => 0)).toBeUndefined()
    expect(dropTarget('row|x|y', 1, () => 0)).toBeUndefined()
  })
})

describe('#5 applyDrop — placer', () => {
  const base: Type_Composition = [entry('a'), entry('b'), entry('c')]

  it('déposer sur la rangée d\'un autre bloc les met CÔTE À CÔTE', () => {
    // a, b, c empilés ; on lâche c sur la rangée de a.
    const next = applyDrop(base, 'tooltip', 'c', rowDropId(0, 0), 1)
    expect(shown(next, 'tooltip')).toEqual([[['a', 'c'], ['b']]])
  })

  it('respecte l\'ENDROIT du dépôt dans la rangée', () => {
    const next = applyDrop(base, 'tooltip', 'c', rowDropId(0, 0), 0)
    expect(shown(next, 'tooltip')).toEqual([[['c', 'a'], ['b']]])
  })

  it('« nouvelle rangée » descend le bloc sous les autres', () => {
    const next = applyDrop(base, 'tooltip', 'a', newRowDropId(0), 0)
    expect(shown(next, 'tooltip')).toEqual([[['b'], ['c'], ['a']]])
  })

  it('« nouvel onglet » ouvre un second onglet', () => {
    const next = applyDrop(base, 'tooltip', 'c', NEW_TAB, 0)
    expect(shown(next, 'tooltip')).toEqual([[['a'], ['b']], [['c']]])
  })

  it('un onglet vidé de son dernier bloc disparaît', () => {
    const deux = applyDrop(base, 'tooltip', 'c', NEW_TAB, 0)
    const revenu = applyDrop(deux, 'tooltip', 'c', rowDropId(0, 0), 1)
    expect(shown(revenu, 'tooltip')).toEqual([[['a', 'c'], ['b']]])
  })
})

describe('#5 applyDrop — retirer', () => {
  const base: Type_Composition = [entry('a'), entry('b')]

  it('la réserve retire du contenant, sans retirer du document', () => {
    const next = applyDrop(base, 'tooltip', 'a', TRAY, 0)
    expect(shown(next, 'tooltip')).toEqual([[['b']]])
    expect(next).toHaveLength(2)
    expect(next.find(e => e.block === 'a')?.show.tooltip).toBe(false)
  })

  it('le bloc retiré d\'un contenant reste intact dans les DEUX autres', () => {
    const next = applyDrop(base, 'tooltip', 'a', TRAY, 0)
    expect(shown(next, 'popup')).toEqual([[['a'], ['b']]])
    expect(shown(next, 'sidebar')).toEqual([[['a'], ['b']]])
  })

  it('rapatrier un bloc depuis la réserve le replace où on le dépose', () => {
    const retire = applyDrop(base, 'tooltip', 'a', TRAY, 0)
    const revenu = applyDrop(retire, 'tooltip', 'a', rowDropId(0, 0), 0)
    expect(shown(revenu, 'tooltip')).toEqual([[['a', 'b']]])
  })
})

describe('#5 applyDrop — isolement entre contenants', () => {
  it('arranger un contenant NE TOUCHE PAS l\'affichage des autres', () => {
    // La régression la plus coûteuse du glisser-déposer : réordonner la liste
    // pour ranger une rangée déplaçait les blocs non placés des autres modes.
    const base: Type_Composition = [entry('a'), entry('b'), entry('c')]
    const avant_popup = shown(base, 'popup')
    const avant_sidebar = shown(base, 'sidebar')
    const next = applyDrop(base, 'tooltip', 'c', rowDropId(0, 0), 0)
    expect(shown(next, 'tooltip')).toEqual([[['c', 'a'], ['b']]])
    expect(shown(next, 'popup')).toEqual(avant_popup)
    expect(shown(next, 'sidebar')).toEqual(avant_sidebar)
  })

  it('ne mute jamais la composition reçue', () => {
    const base: Type_Composition = [entry('a'), entry('b')]
    const copie = JSON.parse(JSON.stringify(base))
    applyDrop(base, 'popup', 'b', rowDropId(0, 0), 0)
    expect(base).toEqual(copie)
  })
})
