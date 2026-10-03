import { Class_ApplicationData } from './ApplicationData'
import { MAIN_ZONE_CANVAS_ID, MAIN_ZONE_SPREADSHEET_ID, MAIN_ZONE_DOC_ID, MAIN_ZONE_JSON_ID } from './MenuConfig'
import type { Type_MainZoneGridNode } from './MainZoneGrid'
import type { Type_JSON } from './Utils'

/**
 * sa#587 — DEPOSER UN VOLET DE LA GRILLE LA OU ON L A LACHE.
 * sa#589 — ... DANS UNE MOSAIQUE LIBRE.
 *
 * Les fleches de l en-tete sont parties ; le glisser-deposer de l en-tete les remplace, et ce
 * qu il ecrit dans le modele se resume a `dropMainZoneOccupant`. Ces epreuves figent les quatre
 * issues du geste (prendre la place d un autre, couper un volet en deux, ajouter une colonne ou
 * une ligne au bord de la grille, flotter), ce que la mosaique devient dans le fichier, et la
 * relecture sans perte des fichiers d avant.
 */

const D = MAIN_ZONE_CANVAS_ID
const newApp = () => new Class_ApplicationData(false)
const newMc = () => newApp().menu_configuration
const INFO = 'os.repr.element_info'
/** La forme seule de la grille, lisible : row(A,col(B,C)). */
const shape = (n: Type_MainZoneGridNode | null): string => {
  if (!n) return '-'
  if ('pane' in n) return n.pane
  return (n.split === 'row' ? 'row(' : 'col(') + n.children.map(shape).join(',') + ')'
}
const open = (mc: ReturnType<typeof newMc>, n: string, place: 'right' | 'bottom' | 'floating' = 'right') =>
  mc.openMainZoneWindow({ kind: 'node', id: n }, INFO, place)

describe('sa#587 / sa#589 deposer un volet de la grille', () => {

  test('prendre la place d un autre volet : les deux echangent leur case', () => {
    const mc = newMc()
    const a = open(mc, 'n1')
    const b = open(mc, 'n2')
    expect(shape(mc.main_zone_grid)).toBe(`row(${D},col(${a},${b}))`)
    expect(mc.dropMainZoneOccupant(b, { kind: 'swap', with: D })).toBe(true)
    expect(shape(mc.main_zone_grid)).toBe(`row(${b},col(${a},${D}))`)
    expect(mc.main_zone_main_id).toBe(b)
    expect(mc.mainZonePlaceOf(D)).toBe('right')
    expect(mc.main_zone_active_id).toBe(b)
  })

  test('couper un volet en deux, du cote ou on lache', () => {
    const mc = newMc()
    const a = open(mc, 'n1')
    const b = open(mc, 'n2', 'bottom')
    expect(shape(mc.main_zone_grid)).toBe(`col(row(${D},${a}),${b})`)
    // Au-dessus de a : la colonne de droite se coupe, b en haut.
    mc.dropMainZoneOccupant(b, { kind: 'split', with: a, side: 'top' })
    expect(shape(mc.main_zone_grid)).toBe(`row(${D},col(${b},${a}))`)
    // A gauche du diagramme : une colonne de plus, entre le bord et lui.
    mc.dropMainZoneOccupant(b, { kind: 'split', with: D, side: 'left' })
    expect(shape(mc.main_zone_grid)).toBe(`row(${b},${D},${a})`)
    expect(mc.main_zone_main_id).toBe(b)
  })

  test('ajouter une ligne ou une colonne aux bords, autant de fois qu on veut', () => {
    const mc = newMc()
    const a = open(mc, 'n1')
    const b = open(mc, 'n2')
    const c = open(mc, 'n3')
    const d = open(mc, 'n4')
    // Une ligne en haut, deux en bas, une colonne a gauche : une mosaique que les trois places
    // d avant ne savaient pas dire.
    mc.dropMainZoneOccupant(a, { kind: 'edge', side: 'top' })
    mc.dropMainZoneOccupant(b, { kind: 'edge', side: 'bottom' })
    mc.dropMainZoneOccupant(c, { kind: 'edge', side: 'bottom' })
    expect(shape(mc.main_zone_grid)).toBe(`col(${a},row(${D},${d}),${b},${c})`)
    mc.dropMainZoneOccupant(d, { kind: 'edge', side: 'left' })
    expect(shape(mc.main_zone_grid)).toBe(`row(${d},col(${a},${D},${b},${c}))`)
    expect(mc.main_zone_main_id).toBe(d)
    expect(mc.mainZonePlaceOf(a)).toBe('right')
  })

  test('la composition de l issue : une ligne en haut, deux colonnes dont l une coupee, une ligne en bas', () => {
    const mc = newMc()
    const top = open(mc, 'n1')
    const right = open(mc, 'n2')
    const under = open(mc, 'n3')
    const bottom = open(mc, 'n4')
    mc.dropMainZoneOccupant(top, { kind: 'edge', side: 'top' })
    mc.dropMainZoneOccupant(bottom, { kind: 'edge', side: 'bottom' })
    mc.dropMainZoneOccupant(right, { kind: 'split', with: D, side: 'right' })
    mc.dropMainZoneOccupant(under, { kind: 'split', with: right, side: 'bottom' })
    expect(shape(mc.main_zone_grid)).toBe(`col(${top},row(${D},col(${right},${under})),${bottom})`)
  })

  test('flotter a la geometrie donnee, bornee ; ses voisins reprennent sa case', () => {
    const mc = newMc()
    const a = open(mc, 'n1')
    mc.dropMainZoneOccupant(a, { kind: 'float', geometry: { x: 100, y: 120, w: 10, h: 500 } })
    expect(mc.mainZonePlaceOf(a)).toBe('floating')
    const g = mc.mainZoneOccupantById(a)?.geometry
    expect(g?.x).toBe(100)
    expect(g?.y).toBe(120)
    expect(g?.w).toBeGreaterThan(10)
    expect(g?.h).toBe(500)
    expect(shape(mc.main_zone_grid)).toBe(D)
    // Ancre a nouveau, il revient a droite, comme avant.
    mc.setMainZoneOccupantPlace(a, 'right')
    expect(shape(mc.main_zone_grid)).toBe(`row(${D},${a})`)
  })

  test('refuse ce qui n a pas de sens ou ne change rien, sans rien changer', () => {
    const mc = newMc()
    const a = open(mc, 'n1')
    const f = open(mc, 'n2', 'floating')
    const before = shape(mc.main_zone_grid)
    // Un flottant ne se range pas par ce geste (il a son bouton « Ancrer en volet »).
    expect(mc.dropMainZoneOccupant(f, { kind: 'swap', with: a })).toBe(false)
    // Ni prendre la place d un flottant, ni la sienne, ni se couper soi-meme.
    expect(mc.dropMainZoneOccupant(a, { kind: 'swap', with: f })).toBe(false)
    expect(mc.dropMainZoneOccupant(a, { kind: 'swap', with: a })).toBe(false)
    expect(mc.dropMainZoneOccupant(a, { kind: 'split', with: a, side: 'left' })).toBe(false)
    // La colonne de droite qu on depose au bord droit : elle y est deja.
    expect(mc.dropMainZoneOccupant(a, { kind: 'edge', side: 'right' })).toBe(false)
    // Seul dans la grille, un volet n a nulle part ou aller.
    mc.hideMainZoneOccupant(a)
    expect(mc.dropMainZoneOccupant(D, { kind: 'edge', side: 'right' })).toBe(false)
    expect(before).toBe(`row(${D},${a})`)
    expect(shape(mc.main_zone_grid)).toBe(D)
  })

  test('fermer un volet : ses voisins se partagent sa case', () => {
    const mc = newMc()
    const a = open(mc, 'n1')
    const b = open(mc, 'n2')
    mc.hideMainZoneOccupant(D)
    expect(shape(mc.main_zone_grid)).toBe(`col(${a},${b})`)
    expect(mc.main_zone_main_id).toBe(a)
  })

  test('une etiquette reecrite par un appelant est une demande de place, comme avant', () => {
    const mc = newMc()
    const a = open(mc, 'n1')
    mc.setMainZoneOccupantPlace(a, 'bottom')
    expect(shape(mc.main_zone_grid)).toBe(`col(${D},${a})`)
    mc.makeMainZoneOccupantMain(a)
    expect(shape(mc.main_zone_grid)).toBe(`col(${a},${D})`)
  })
})

describe('sa#589 la mosaique dans le fichier', () => {

  const reload = (json: Type_JSON) => {
    const mc = newMc()
    mc.mainZoneStateFromJSON(JSON.parse(JSON.stringify(json)))
    return mc
  }

  test('une mosaique s enregistre et se rouvre a l identique, proportions comprises', () => {
    const mc = newMc()
    const a = open(mc, 'n1')
    const b = open(mc, 'n2')
    mc.dropMainZoneOccupant(a, { kind: 'edge', side: 'top' })
    mc.dropMainZoneOccupant(b, { kind: 'split', with: D, side: 'left' })
    mc.setMainZoneGridPairSizes([], 0, 1, 4)
    const json = mc.mainZoneStateToJSON()
    expect(json['grid']).toBeDefined()
    const back = reload(json)
    expect(back.main_zone_grid).toEqual(mc.main_zone_grid)
    expect(back.main_zone_main_id).toBe(a)
  })

  test('une grille d avant n ecrit pas `grid` : le fichier reste celui d avant', () => {
    const mc = newMc()
    open(mc, 'n1')
    open(mc, 'n2', 'bottom')
    const json = mc.mainZoneStateToJSON()
    expect(json['grid']).toBeUndefined()
    expect(reload(json).main_zone_grid).toEqual(mc.main_zone_grid)
  })

  test('un fichier d avant se rouvre sur ses trois places', () => {
    const S = MAIN_ZONE_SPREADSHEET_ID
    const DOC = MAIN_ZONE_DOC_ID
    const J = MAIN_ZONE_JSON_ID
    const entry = (id: string, place: string, size: number, order: number): Type_JSON =>
      ({ place, size, order, representation: id, subject: { kind: 'diagram' } })
    const json: Type_JSON = {
      occupants: { [D]: entry(D, 'main', 1, 0), [S]: entry(S, 'right', 2, 1), [DOC]: entry(DOC, 'right', 1, 2), [J]: entry(J, 'bottom', 1, 3) },
      split_ratio: 0.5,
      bottom_px: 200
    }
    const mc = reload(json)
    const g = mc.main_zone_grid
    expect(shape(g)).toBe(`col(row(${D},col(${S},${DOC})),${J})`)
    // La colonne : la moitie de la fenetre (split_ratio) ; ses volets : leurs poids d avant.
    const top = (g as unknown as { children: { sizes: number[], children: { sizes: number[] }[] }[] }).children[0]
    expect(top.sizes[1] / (top.sizes[0] + top.sizes[1])).toBeCloseTo(0.5)
    expect(top.children[1].sizes).toEqual([2, 1])
    // Les etiquettes sont celles du fichier, et il se reecrit sans `grid`.
    expect(mc.mainZonePlaceOf(J)).toBe('bottom')
    expect(mc.mainZoneStateToJSON()['grid']).toBeUndefined()
  })

  test('une mosaique dont un volet manque garde les autres a leur place', () => {
    const mc = newMc()
    const a = open(mc, 'n1')
    const b = open(mc, 'n2')
    mc.dropMainZoneOccupant(a, { kind: 'edge', side: 'top' })
    const json = mc.mainZoneStateToJSON() as { occupants: { [id: string]: unknown } }
    delete json.occupants[b]
    expect(shape(reload(json as unknown as Type_JSON).main_zone_grid)).toBe(`col(${a},${D})`)
  })
})
