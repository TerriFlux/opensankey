// sa#609 — UN VOLET MASQUE SES PROCESS NEUTRES, CHOISI DANS SON EN-TETE.
//
// Fige ici le champ du volet : il s'ecrit seulement s'il est pose, se relit (une page publiee
// s'ouvre « neutres masques »), et vaut pour les volets qui le suivent (sa#594) — y compris quand
// ils s'en detachent ou que le volet suivi se ferme. Le tri des vignettes, lui, est celui de la
// figure (`isNeutralStar`, starNeutralProcess.test.ts).

import { Class_ApplicationData } from './ApplicationData'
import type { Type_JSON } from './Utils'

const freshMenuConfig = () => new Class_ApplicationData(false).menu_configuration
const roundTrip = (json: Type_JSON) => {
  const relu = freshMenuConfig()
  relu.mainZoneStateFromJSON(json)
  return relu
}

describe('les process neutres masques, dans le fichier', () => {
  it('s ecrit et se relit quand c est pose', () => {
    const mc = freshMenuConfig()
    const id = mc.openMainZoneWindow({ kind: 'selection' }, 'osp.repr.unit')
    mc.setMainZoneWindowHideNeutral(id, true)
    const relu = roundTrip(mc.mainZoneStateToJSON())
    expect(relu.main_zone_occupants.find(x => x.id === id)?.hide_neutral).toBe(true)
    expect(relu.mainZoneEffectiveHideNeutral(id)).toBe(true)
  })

  it('ne s ecrit pas quand rien n est pose, ni apres les avoir remontres', () => {
    const mc = freshMenuConfig()
    const id = mc.openMainZoneWindow({ kind: 'selection' }, 'osp.repr.unit')
    const entry = () => (mc.mainZoneStateToJSON()['occupants'] as Type_JSON)[id] as Type_JSON
    expect(entry()['hide_neutral']).toBeUndefined()
    mc.setMainZoneWindowHideNeutral(id, true)
    mc.setMainZoneWindowHideNeutral(id, false)
    expect(entry()['hide_neutral']).toBeUndefined()
    expect(mc.mainZoneEffectiveHideNeutral(id)).toBe(false)
  })

  it('ignore une valeur qui n est pas vraie a la relecture', () => {
    const mc = freshMenuConfig()
    const id = mc.openMainZoneWindow({ kind: 'selection' }, 'osp.repr.unit')
    const json = mc.mainZoneStateToJSON()
    ;((json['occupants'] as Type_JSON)[id] as Type_JSON)['hide_neutral'] = 'oui'
    expect(roundTrip(json).mainZoneEffectiveHideNeutral(id)).toBe(false)
  })
})

describe('un volet qui en suit un autre', () => {
  it('suit le choix du volet suivi', () => {
    const mc = freshMenuConfig()
    const unit = mc.openMainZoneWindow({ kind: 'filter', tags: { filiere: ['lait'] } }, 'osp.repr.unit')
    const suiveur = mc.openMainZoneWindow({ kind: 'pane', id: unit }, 'osp.repr.unit')
    mc.setMainZoneWindowHideNeutral(unit, true)
    expect(mc.mainZoneEffectiveHideNeutral(suiveur)).toBe(true)
    mc.setMainZoneWindowHideNeutral(unit, false)
    expect(mc.mainZoneEffectiveHideNeutral(suiveur)).toBe(false)
  })

  it('garde son choix en se detachant', () => {
    const mc = freshMenuConfig()
    const unit = mc.openMainZoneWindow({ kind: 'filter', tags: { filiere: ['lait'] } }, 'osp.repr.unit')
    const suiveur = mc.openMainZoneWindow({ kind: 'pane', id: unit }, 'osp.repr.unit')
    mc.setMainZoneWindowHideNeutral(unit, true)
    mc.detachMainZoneWindow(suiveur, ['n1'])
    mc.setMainZoneWindowHideNeutral(unit, false)
    expect(mc.mainZoneEffectiveHideNeutral(suiveur)).toBe(true)
  })

  it('prend le choix du volet suivi quand celui-ci se ferme', () => {
    const mc = freshMenuConfig()
    const unit = mc.openMainZoneWindow({ kind: 'filter', tags: { filiere: ['lait'] } }, 'osp.repr.unit')
    const suiveur = mc.openMainZoneWindow({ kind: 'pane', id: unit }, 'osp.repr.unit')
    mc.setMainZoneWindowHideNeutral(unit, true)
    mc.hideMainZoneOccupant(unit)
    expect(mc.mainZoneEffectiveHideNeutral(suiveur)).toBe(true)
  })
})
