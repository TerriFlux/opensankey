import { Class_ApplicationData } from './ApplicationData'
import { MAIN_ZONE_CANVAS_ID } from './MenuConfig'

/**
 * sa#587 — DEPOSER UN VOLET DE LA GRILLE LA OU ON L A LACHE.
 *
 * Les fleches de l en-tete sont parties ; le glisser-deposer de l en-tete les remplace, et ce
 * qu il ecrit dans le modele se resume a `dropMainZoneOccupant`. Ces epreuves figent les trois
 * issues du geste (prendre la place d un autre, entrer dans une pile, flotter) et le piege de la
 * normalisation qui renvoyait dans la grande case le volet qu on venait d en sortir.
 */

const newMc = () => new Class_ApplicationData(false).menu_configuration
const INFO = 'os.repr.element_info'
const places = (mc: ReturnType<typeof newMc>) =>
  mc.main_zone_occupants.map(o => [o.id, o.place])

describe('sa#587 deposer un volet de la grille', () => {

  it('prendre la place d un autre volet : les deux echangent place, rang et poids', () => {
    const mc = newMc()
    const a = mc.openMainZoneWindow({ kind: 'node', id: 'n1' }, INFO, 'right')
    const b = mc.openMainZoneWindow({ kind: 'node', id: 'n2' }, INFO, 'right')
    mc.setMainZoneStackSizes({ [a]: 100, [b]: 300 })
    expect(mc.dropMainZoneOccupant(b, { kind: 'swap', with: MAIN_ZONE_CANVAS_ID })).toBe(true)
    expect(mc.main_zone_main_id).toBe(b)
    // Le diagramme prend la case quittee : deuxieme de la colonne, avec le poids de b.
    expect(mc.mainZoneOccupantsIn('right').map(o => [o.id, o.size])).toEqual([[a, 100], [MAIN_ZONE_CANVAS_ID, 300]])
    expect(mc.main_zone_active_id).toBe(b)
  })

  it('entrer dans une pile AVANT un volet donne, ou au bout', () => {
    const mc = newMc()
    const a = mc.openMainZoneWindow({ kind: 'node', id: 'n1' }, INFO, 'right')
    const b = mc.openMainZoneWindow({ kind: 'node', id: 'n2' }, INFO, 'right')
    const c = mc.openMainZoneWindow({ kind: 'node', id: 'n3' }, INFO, 'bottom')
    mc.dropMainZoneOccupant(c, { kind: 'stack', place: 'right', before: a })
    expect(mc.mainZoneOccupantsIn('right').map(o => o.id)).toEqual([c, a, b])
    expect(mc.mainZoneOccupantsIn('bottom')).toHaveLength(0)
    mc.dropMainZoneOccupant(c, { kind: 'stack', place: 'right', before: null })
    expect(mc.mainZoneOccupantsIn('right').map(o => o.id)).toEqual([a, b, c])
    mc.dropMainZoneOccupant(a, { kind: 'stack', place: 'bottom', before: null })
    expect(mc.mainZoneOccupantsIn('bottom').map(o => o.id)).toEqual([a])
  })

  it('quitter la grande case pour la TETE de la colonne ne l y renvoie pas', () => {
    // Le piege : la normalisation promeut le PREMIER volet de la colonne de droite, c est-a-dire
    // celui qu on vient d y deposer en tete — le geste n aurait rien fait.
    const mc = newMc()
    const a = mc.openMainZoneWindow({ kind: 'node', id: 'n1' }, INFO, 'right')
    mc.dropMainZoneOccupant(MAIN_ZONE_CANVAS_ID, { kind: 'stack', place: 'right', before: a })
    expect(mc.main_zone_main_id).toBe(a)
    expect(mc.mainZoneOccupantsIn('right').map(o => o.id)).toEqual([MAIN_ZONE_CANVAS_ID])
  })

  it('quitter la grande case pour le bandeau : l heritier vient de la colonne', () => {
    const mc = newMc()
    const a = mc.openMainZoneWindow({ kind: 'node', id: 'n1' }, INFO, 'right')
    const b = mc.openMainZoneWindow({ kind: 'node', id: 'n2' }, INFO, 'right')
    mc.dropMainZoneOccupant(MAIN_ZONE_CANVAS_ID, { kind: 'stack', place: 'bottom', before: null })
    expect(places(mc)).toEqual(expect.arrayContaining([[a, 'main'], [b, 'right'], [MAIN_ZONE_CANVAS_ID, 'bottom']]))
  })

  it('flotter a la geometrie donnee, bornee', () => {
    const mc = newMc()
    const a = mc.openMainZoneWindow({ kind: 'node', id: 'n1' }, INFO, 'right')
    mc.dropMainZoneOccupant(a, { kind: 'float', geometry: { x: 100, y: 120, w: 10, h: 500 } })
    expect(mc.mainZonePlaceOf(a)).toBe('floating')
    const g = mc.mainZoneOccupantById(a)?.geometry
    expect(g?.x).toBe(100)
    expect(g?.y).toBe(120)
    expect(g?.w).toBeGreaterThan(10)
    expect(g?.h).toBe(500)
    expect(mc.main_zone_main_id).toBe(MAIN_ZONE_CANVAS_ID)
  })

  it('refuse ce qui n a pas de sens, sans rien changer', () => {
    const mc = newMc()
    const a = mc.openMainZoneWindow({ kind: 'node', id: 'n1' }, INFO, 'right')
    const f = mc.openMainZoneWindow({ kind: 'node', id: 'n2' }, INFO, 'floating')
    const before = JSON.stringify(places(mc))
    // Un flottant ne se range pas par ce geste (il a son bouton « Ancrer en volet »).
    expect(mc.dropMainZoneOccupant(f, { kind: 'swap', with: a })).toBe(false)
    // Ni prendre la place d un flottant, ni la sienne.
    expect(mc.dropMainZoneOccupant(a, { kind: 'swap', with: f })).toBe(false)
    expect(mc.dropMainZoneOccupant(a, { kind: 'swap', with: a })).toBe(false)
    // Ni entrer « avant » un volet d une autre pile.
    expect(mc.dropMainZoneOccupant(a, { kind: 'stack', place: 'bottom', before: MAIN_ZONE_CANVAS_ID })).toBe(false)
    // Seul dans la grille, la grande case n a pas d heritier.
    mc.hideMainZoneOccupant(a)
    expect(mc.dropMainZoneOccupant(MAIN_ZONE_CANVAS_ID, { kind: 'stack', place: 'right', before: null })).toBe(false)
    expect(mc.main_zone_main_id).toBe(MAIN_ZONE_CANVAS_ID)
    expect(before).not.toBe('')
  })
})
