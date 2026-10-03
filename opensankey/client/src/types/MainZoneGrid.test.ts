import {
  Type_MainZoneGridNode, gridAddAtEdge, gridDock, gridFrames, gridFromJSON, gridKeep, gridNormalize,
  gridPaneIds, gridPlaceLabels, gridPrincipal, gridRemove, gridSameShape, gridSetPairSizes,
  gridSplitPane, gridSwap, gridToJSON
} from './MainZoneGrid'

/**
 * sa#589 — LA GRILLE EN MOSAIQUE : un arbre de decoupes (cf. MainZoneGrid.ts).
 *
 * Ces epreuves figent la FORME que prend l arbre a chaque geste (pas seulement les volets qu il
 * contient) : deux arbres differents qui dessinent la meme mosaique feraient deux poignees au meme
 * endroit, et « ajouter une ligne en bas » une deuxieme fois creerait une ligne dans une ligne.
 */

const P = (id: string): Type_MainZoneGridNode => ({ pane: id })
const row = (...c: Type_MainZoneGridNode[]): Type_MainZoneGridNode => ({ split: 'row', children: c, sizes: c.map(() => 1) })
const col = (...c: Type_MainZoneGridNode[]): Type_MainZoneGridNode => ({ split: 'column', children: c, sizes: c.map(() => 1) })
/** La forme seule, lisible : row(A,col(B,C)). */
const shape = (n: Type_MainZoneGridNode | null): string => {
  if (!n) return '-'
  if ('pane' in n) return n.pane
  return (n.split === 'row' ? 'row(' : 'col(') + n.children.map(shape).join(',') + ')'
}
/** La grille d avant : grande case, colonne de droite, bandeau du bas. */
const legacy = (): Type_MainZoneGridNode => col(row(P('M'), col(P('R1'), P('R2'))), row(P('B1'), P('B2')))

describe('sa#589 la grille en mosaique (fonctions pures)', () => {

  test('normaliser : une decoupe d une bande s efface, une decoupe du meme sens se fond dans sa mere', () => {
    const n = gridNormalize({ split: 'row', sizes: [2, 2], children: [P('A'), { split: 'row', sizes: [1, 3], children: [P('B'), col(P('C'))] }] })
    expect(shape(n)).toBe('row(A,B,C)')
    // Les proportions survivent a la fusion : B et C se partagent la part de leur mere (2) au prorata.
    expect((n as { sizes: number[] }).sizes).toEqual([2, 0.5, 1.5])
    // Un volet en double ne garde que sa premiere case.
    expect(shape(gridNormalize(row(P('A'), P('A'), P('B'))))).toBe('row(A,B)')
  })

  test('retirer un volet : ses voisins se partagent sa case, et la forme se simplifie', () => {
    expect(shape(gridRemove(legacy(), 'M'))).toBe('col(R1,R2,row(B1,B2))')
    expect(shape(gridRemove(legacy(), 'B1'))).toBe('col(row(M,col(R1,R2)),B2)')
    expect(gridRemove(P('A'), 'A')).toBeNull()
  })

  test('le principal est la premiere feuille, et les etiquettes heritees en decoulent', () => {
    expect(gridPrincipal(legacy())).toBe('M')
    expect(gridPlaceLabels(legacy())).toEqual({ M: 'main', R1: 'right', R2: 'right', B1: 'bottom', B2: 'bottom' })
    // Une ligne ajoutee EN HAUT devient le principal ; ce qui etait la grande case est dessous.
    const top = gridAddAtEdge(legacy(), 'T', 'top')
    expect(gridPrincipal(top)).toBe('T')
    expect(gridPlaceLabels(top)['M']).toBe('bottom')
  })

  test('ajouter au bord : une colonne ou une ligne sur toute la grille, puis une de plus au meme bout', () => {
    const a = gridAddAtEdge(legacy(), 'X', 'bottom')
    expect(shape(a)).toBe('col(row(M,col(R1,R2)),row(B1,B2),X)')
    // Une 2e fois en bas : encore une ligne, pas une ligne dans la ligne.
    const b = gridAddAtEdge(a, 'Y', 'bottom')
    expect(shape(b)).toBe('col(row(M,col(R1,R2)),row(B1,B2),X,Y)')
    // A droite d une grille empilee : une colonne sur toute sa hauteur.
    expect(shape(gridAddAtEdge(b, 'Z', 'right'))).toBe('row(col(row(M,col(R1,R2)),row(B1,B2),X,Y),Z)')
    // A gauche, puis en haut.
    expect(shape(gridAddAtEdge(P('M'), 'L', 'left'))).toBe('row(L,M)')
    expect(shape(gridAddAtEdge(row(P('L'), P('M')), 'T', 'top'))).toBe('col(T,row(L,M))')
    // Le volet deplace quitte d abord sa case : la colonne de droite qu on envoie en bas.
    expect(shape(gridAddAtEdge(row(P('M'), P('R')), 'R', 'bottom'))).toBe('col(M,R)')
  })

  test('la premiere bande ajoutee au bord prend un tiers, les suivantes leur part egale', () => {
    const a = gridAddAtEdge(P('M'), 'R', 'right') as { sizes: number[] }
    expect(a.sizes[1] / (a.sizes[0] + a.sizes[1])).toBeCloseTo(1 / 3)
    const b = gridAddAtEdge(a as Type_MainZoneGridNode, 'S', 'right') as { sizes: number[] }
    const total = b.sizes.reduce((x, y) => x + y, 0)
    expect(b.sizes[2] / total).toBeCloseTo(1 / 3)
  })

  test('couper un volet en deux : le volet depose prend le cote ou on l a lache', () => {
    expect(shape(gridSplitPane(legacy(), 'M', 'X', 'left'))).toBe('col(row(X,M,col(R1,R2)),row(B1,B2))')
    expect(shape(gridSplitPane(legacy(), 'M', 'X', 'bottom'))).toBe('col(row(col(M,X),col(R1,R2)),row(B1,B2))')
    // Dans une pile du meme sens, une bande de plus a cote de lui (meme mosaique, sans imbrication).
    expect(shape(gridSplitPane(legacy(), 'R1', 'X', 'bottom'))).toBe('col(row(M,col(R1,X,R2)),row(B1,B2))')
    // Il cede la moitie de SA part, les autres ne bougent pas.
    const s = gridSplitPane(row(P('A'), P('B')), 'B', 'X', 'right') as { sizes: number[] }
    expect(s.sizes).toEqual([1, 0.5, 0.5])
    // Le volet deplace quitte d abord sa case.
    expect(shape(gridSplitPane(legacy(), 'R1', 'B2', 'top'))).toBe('col(row(M,col(B2,R1,R2)),B1)')
    // Se couper soi-meme ne change rien.
    expect(shape(gridSplitPane(legacy(), 'M', 'M', 'left'))).toBe(shape(legacy()))
  })

  test('echanger deux volets : chacun prend la case de l autre', () => {
    expect(shape(gridSwap(legacy(), 'M', 'B2'))).toBe('col(row(B2,col(R1,R2)),row(B1,M))')
  })

  test('ouvrir « a droite » et « en bas » refait les gestes d avant sur la grille d avant', () => {
    expect(shape(gridDock(P('M'), 'R1', 'right'))).toBe('row(M,R1)')
    expect(shape(gridDock(row(P('M'), P('R1')), 'R2', 'right'))).toBe('row(M,col(R1,R2))')
    expect(shape(gridDock(legacy(), 'R3', 'right'))).toBe('col(row(M,col(R1,R2,R3)),row(B1,B2))')
    expect(shape(gridDock(P('M'), 'B1', 'bottom'))).toBe('col(M,B1)')
    expect(shape(gridDock(legacy(), 'B3', 'bottom'))).toBe('col(row(M,col(R1,R2)),row(B1,B2,B3))')
    // Sans colonne a droite mais avec un bandeau : la colonne nait au-dessus du bandeau.
    expect(shape(gridDock(col(P('M'), P('B1')), 'R1', 'right'))).toBe('col(row(M,R1),B1)')
    // 'main' : il devient le principal, celui qui l etait passe a droite.
    expect(shape(gridDock(row(P('M'), P('R1')), 'X', 'main'))).toBe('row(X,col(R1,M))')
    expect(shape(gridDock(null, 'X', 'right'))).toBe('X')
  })

  test('la geometrie : chaque case, et une poignee entre deux bandes voisines', () => {
    const { frames, dividers } = gridFrames(row(P('A'), col(P('B'), P('C'))), { top: 10, left: 0, width: 206, height: 106 }, 6)
    expect(frames['A']).toEqual({ top: 10, left: 0, width: 100, height: 106 })
    expect(frames['B']).toEqual({ top: 10, left: 106, width: 100, height: 50 })
    expect(frames['C']).toEqual({ top: 66, left: 106, width: 100, height: 50 })
    expect(dividers).toHaveLength(2)
    expect(dividers[0]).toMatchObject({ path: [], index: 0, dir: 'row', frame: { top: 10, left: 100, width: 6, height: 106 }, lengths: [100, 100] })
    expect(dividers[1]).toMatchObject({ path: [1], index: 0, dir: 'column', frame: { top: 60, left: 106, width: 100, height: 6 } })
  })

  test('une poignee repartit la place de ses deux bandes, sans toucher les autres ni l arbre donne', () => {
    const g = col(P('A'), P('B'), P('C'))
    // Des longueurs en px (300 et 100) : la paire garde son poids total (2), partage 3 : 1.
    const next = gridSetPairSizes(g, [], 1, 300, 100) as { sizes: number[] }
    expect(next.sizes).toEqual([1, 1.5, 0.5])
    expect((g as { sizes: number[] }).sizes).toEqual([1, 1, 1])
    // Chemin perime : rien ne change.
    expect(gridSetPairSizes(g, [4], 0, 1, 1)).toBe(g)
  })

  test('la forme de fichier se relit a l identique, et refuse ce qui ne decrit rien', () => {
    const g = gridSetPairSizes(legacy(), [0], 0, 300, 100) as Type_MainZoneGridNode
    const back = gridFromJSON(JSON.parse(JSON.stringify(gridToJSON(g))))
    expect(back).toEqual(g)
    expect(gridFromJSON(undefined)).toBeNull()
    expect(gridFromJSON({ split: 'diagonal', children: {} })).toBeNull()
    // Plus de dix bandes : l ordre est celui des rangs, pas celui des cles en texte.
    const many = row(...'ABCDEFGHIJKL'.split('').map(P))
    expect(gridPaneIds(gridFromJSON(JSON.parse(JSON.stringify(gridToJSON(many)))))).toEqual('ABCDEFGHIJKL'.split(''))
  })

  test('meme forme aux proportions pres', () => {
    expect(gridSameShape(legacy(), gridSetPairSizes(legacy(), [], 0, 5, 1))).toBe(true)
    expect(gridSameShape(legacy(), gridSwap(legacy(), 'R1', 'R2'))).toBe(false)
    expect(gridSameShape(gridKeep(legacy(), id => id === 'M'), P('M'))).toBe(true)
  })
})
