// sa#598 — LE TYPE DE VALEUR D'UN VOLET (pourcentage, normalise, valeur), CHOISI DANS SON EN-TETE.
//
// Fige ici :
//  - le champ du volet : il s'ecrit seulement s'il est pose, se relit, et vaut pour les volets qui le
//    suivent (sa#594) — y compris quand ils s'en detachent ou que le volet suivi se ferme ;
//  - le reglage PROPRE des vignettes que le bouton retire ;
//  - ce que devient le libelle de valeur d'un flux dans un volet Sankey.

import { Class_ApplicationData } from './ApplicationData'
import type { Type_JSON } from './Utils'
import { sankeyPaneValueLabelOverrides } from '../Representations/paneValueMode'

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
    expect(relu.mainZoneValueModeOf(id)).toBe('normalized')
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
    expect(roundTrip(json).mainZoneValueModeOf(id)).toBeNull()
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

describe('le libelle de valeur d un flux dans un volet Sankey', () => {
  it('passe en part des sorties de la source, arrondie a l entier', () => {
    expect(sankeyPaneValueLabelOverrides('percent', 'unit_tag')).toEqual(expect.objectContaining({
      unit_type: '%OS', custom_digit: true, nb_digit: 0, unit_visible: true
    }))
  })

  it('passe en valeur normalisee par la regle de la source', () => {
    expect(sankeyPaneValueLabelOverrides('normalized', 'unit_tag')).toEqual(expect.objectContaining({
      unit_type: 'normalized_source', significant_digits: true, nb_significant_digits: 3
    }))
  })

  it('en valeur, garde le reglage de l auteur sauf s il montrait un pourcentage ou un rapport', () => {
    expect(sankeyPaneValueLabelOverrides('value', 'unit_tag')).toBeUndefined()
    expect(sankeyPaneValueLabelOverrides('value', 'unit_name')).toBeUndefined()
    expect(sankeyPaneValueLabelOverrides('value', '%ID')).toEqual(expect.objectContaining({ unit_type: 'unit_tag' }))
    expect(sankeyPaneValueLabelOverrides('value', 'normalized_target')).toEqual(expect.objectContaining({ unit_type: 'unit_tag' }))
  })

  it('ne touche a rien quand le volet n a rien choisi', () => {
    expect(sankeyPaneValueLabelOverrides(null, '%OS')).toBeUndefined()
    expect(sankeyPaneValueLabelOverrides(undefined, 'unit_tag')).toBeUndefined()
  })
})
