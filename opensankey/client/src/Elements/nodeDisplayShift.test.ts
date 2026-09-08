// ==================================================================================================
// os#1383 — UNE POUSSÉE D'AFFICHAGE N'EST PAS UNE POSITION.
//
// Le mode « échelle adaptée » pousse des nœuds vers le bas pour qu'ils ne se recouvrent pas
// (`resolveScaleAdaptedOverlaps`), en écrivant `position_y`. Le centre stocké — la vérité du nœud
// depuis #1231 — ne doit jamais l'apprendre : un nœud poussé dans une vue puis masqué dans la
// suivante gardait son coin poussé, que `settleCenterAnchor` (bascule de mode, sur TOUS les nœuds)
// ou la branche « taille inchangée » de `anchorByCenterIfResized` committaient dans le centre du
// maître, donc de toutes les vues légères. Mesuré sur CARTOFOB : Prélèvements (Douglas) à y = −793.
//
// Ces tests verrouillent le registre `_display_shift_y` : une capture du centre défait la poussée,
// une dérivation du coin l'annule, et la poussée n'atteint jamais le centre.
// ==================================================================================================
import { Class_ApplicationData } from '../types/ApplicationData'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

function makeNode() {
  const app = new Class_ApplicationData(false)
  const da = app.drawing_area
  da.bypass_redraws = true
  const n = da.sankey.addNewNodeWithName('Prelevements')
  n.position_x = 100
  n.position_y = 200
  n.captureCenterFromCorner()
  return { n, cx: n.center_x as number, cy: n.center_y as number }
}

describe('os#1383 — la poussee d affichage ne fuit pas dans le centre', () => {
  it('une capture du centre defait la poussee avant de lire le coin', () => {
    const { n, cx, cy } = makeNode()
    n.pushDisplayShiftY(-993)
    expect(n.position_y).toBe(200 - 993)
    // C est le geste de `settleCenterAnchor` et de la branche « taille inchangee ».
    n.captureCenterFromCorner()
    expect(n.center_x).toBe(cx)
    expect(n.center_y).toBe(cy)
    // Et le coin est revenu la ou il etait : la poussee n existe plus.
    expect(n.position_y).toBe(200)
  })

  it('une derivation du coin depuis le centre annule la poussee', () => {
    const { n, cy } = makeNode()
    n.pushDisplayShiftY(50)
    n.pushDisplayShiftY(25)
    n.applyCenterToCorner()
    expect(n.center_y).toBe(cy)
    expect(n.position_y).toBe(200)
    // Plus rien a defaire : une capture ne bouge pas le coin.
    n.captureCenterFromCorner()
    expect(n.position_y).toBe(200)
  })

  it('les poussees se cumulent et se defont d un bloc', () => {
    const { n } = makeNode()
    n.pushDisplayShiftY(10)
    n.pushDisplayShiftY(15)
    expect(n.position_y).toBe(225)
    n.undoDisplayShift()
    expect(n.position_y).toBe(200)
    n.undoDisplayShift()
    expect(n.position_y).toBe(200)
  })

  it('une ecriture directe du coin entre la poussee et la capture ne fausse pas le centre', () => {
    // Mesure sur CARTOFOB : coin redérivé par un tiers alors que la poussée était encore posée.
    // Une annulation par SOUSTRACTION aurait retranché 127 d un coin déjà propre : centre faux
    // d une demi-hauteur. On restaure le coin d AVANT la poussée, quoi qu il soit arrivé depuis.
    const { n, cy } = makeNode()
    n.pushDisplayShiftY(127)
    n.position_y = 200   // un tiers redérive le coin sans passer par applyCenterToCorner
    n.captureCenterFromCorner()
    expect(n.position_y).toBe(200)
    expect(n.center_y).toBe(cy)
  })

  it('un geste explicite oublie la poussee : le coin courant fait foi', () => {
    const { n } = makeNode()
    n.pushDisplayShiftY(40)
    n.clearDisplayShift()    // ce que fait le depart d un glisser
    n.position_y += 5        // le glisser
    n.captureCenterFromCorner()
    expect(n.position_y).toBe(245)
    expect(n.center_y).toBeCloseTo(245 + (n.getShapeHeightToUse() / 2), 9)
  })
})
