// sa#598 — LE TYPE DE VALEUR D'UN VOLET (pourcentage, normalise, valeur), CHOISI DANS SON EN-TETE.
//
// Fige ici :
//  - le champ du volet : il s'ecrit seulement s'il est pose, se relit, et vaut pour les volets qui le
//    suivent (sa#594) — y compris quand ils s'en detachent ou que le volet suivi se ferme ;
//  - le reglage PROPRE des vignettes que le bouton retire.

import { Class_ApplicationData } from './ApplicationData'
import type { Type_JSON } from './Utils'

const freshMenuConfig = () => new Class_ApplicationData(false).menu_configuration
const roundTrip = (json: Type_JSON) => {
  const relu = freshMenuConfig()
  relu.mainZoneStateFromJSON(json)
  return relu
}

describe('le type de valeur du volet, dans le fichier', () => {
  it('s ecrit et se relit quand il est pose', () => {
    const mc = freshMenuConfig()
    const id = mc.openMainZoneWindow({ kind: 'selection' }, 'osp.repr.unit')
    mc.setMainZoneWindowValueMode(id, 'normalized')
    const relu = roundTrip(mc.mainZoneStateToJSON())
    expect(relu.main_zone_occupants.find(x => x.id === id)?.value_mode).toBe('normalized')
    expect(relu.mainZoneEffectiveValueMode(id)).toBe('normalized')
  })

  it('ne s ecrit pas quand rien n est pose, ni apres un retour aux libelles de l auteur', () => {
    const mc = freshMenuConfig()
    const id = mc.openMainZoneWindow({ kind: 'selection' }, 'osp.repr.unit')
    const entry = () => (mc.mainZoneStateToJSON()['occupants'] as Type_JSON)[id] as Type_JSON
    expect(entry()['value_mode']).toBeUndefined()
    mc.setMainZoneWindowValueMode(id, 'value')
    mc.setMainZoneWindowValueMode(id, null)
    expect(entry()['value_mode']).toBeUndefined()
  })

  it('ignore une valeur inconnue a la relecture', () => {
    const mc = freshMenuConfig()
    const id = mc.openMainZoneWindow({ kind: 'selection' }, 'osp.repr.unit')
    const json = mc.mainZoneStateToJSON()
    ;((json['occupants'] as Type_JSON)[id] as Type_JSON)['value_mode'] = 'pour mille'
    expect(roundTrip(json).mainZoneEffectiveValueMode(id)).toBeNull()
  })
})

describe('un volet qui en suit un autre', () => {
  it('montre le type de valeur du volet suivi', () => {
    const mc = freshMenuConfig()
    const unit = mc.openMainZoneWindow({ kind: 'filter', tags: { filiere: ['lait'] } }, 'osp.repr.unit')
    const suiveur = mc.openMainZoneWindow({ kind: 'pane', id: unit }, 'osp.repr.unit')
    mc.setMainZoneWindowValueMode(unit, 'value')
    expect(mc.mainZoneEffectiveValueMode(suiveur)).toBe('value')
    mc.setMainZoneWindowValueMode(unit, 'percent')
    expect(mc.mainZoneEffectiveValueMode(suiveur)).toBe('percent')
  })

  it('garde le type qu il montrait en se detachant', () => {
    const mc = freshMenuConfig()
    const unit = mc.openMainZoneWindow({ kind: 'filter', tags: { filiere: ['lait'] } }, 'osp.repr.unit')
    const suiveur = mc.openMainZoneWindow({ kind: 'pane', id: unit }, 'osp.repr.unit')
    mc.setMainZoneWindowValueMode(unit, 'normalized')
    mc.detachMainZoneWindow(suiveur, ['n1'])
    mc.setMainZoneWindowValueMode(unit, 'value')
    expect(mc.mainZoneEffectiveValueMode(suiveur)).toBe('normalized')
  })

  it('prend le type que montrait le volet suivi quand celui-ci se ferme', () => {
    const mc = freshMenuConfig()
    const unit = mc.openMainZoneWindow({ kind: 'filter', tags: { filiere: ['lait'] } }, 'osp.repr.unit')
    const suiveur = mc.openMainZoneWindow({ kind: 'pane', id: unit }, 'osp.repr.unit')
    mc.setMainZoneWindowValueMode(unit, 'value')
    mc.hideMainZoneOccupant(unit)
    expect(mc.mainZoneEffectiveValueMode(suiveur)).toBe('value')
  })
})

describe('le reglage propre des vignettes', () => {
  it('est retire par le bouton de l en-tete, et seulement lui', () => {
    const mc = freshMenuConfig()
    const id = mc.openMainZoneWindow({ kind: 'elements', ids: ['n1', 'n2'] }, 'osp.repr.unit')
    mc.figureOf(id, 'n1').set('value_mode', 'value')
    mc.figureOf(id, 'n1').set('neutral_colors', false)
    mc.figureOf(id, 'n2').set('value_mode', 'normalized')
    mc.clearMainZoneFigureOption([id], 'value_mode')
    expect(mc.figureOf(id, 'n1').isAttributeExplicit('value_mode')).toBe(false)
    expect(mc.figureOf(id, 'n2').isAttributeExplicit('value_mode')).toBe(false)
    expect(mc.figureOf(id, 'n1').own['neutral_colors']).toBe(false)
  })
})
