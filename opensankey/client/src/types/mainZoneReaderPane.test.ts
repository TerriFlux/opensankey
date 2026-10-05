// sa#594 — LE LECTEUR CHOISIT CE QUE MONTRE UN VOLET, ET UN VOLET PEUT EN SUIVRE UN AUTRE.
//
// Trois ajouts au modele des volets, figes ici :
//  - le sujet `filter` : un critere a plusieurs etiquettes (ET entre groupes) et les noeuds coches ;
//  - le sujet `pane` : ce volet montre ce que montre un autre volet, sujet ET coordonnees ;
//  - les coordonnees de donnees du volet (`data_tags`) et ce que l'en-tete offre au lecteur (`reader`).
// Chacun s'ecrit dans le fichier seulement s'il est pose : un document qui n'en a pas garde son
// fichier d'avant.

import { Class_ApplicationData } from './ApplicationData'
import { effectiveMainZoneSubject } from './MenuConfig'
import type { Type_JSON } from './Utils'

const freshMenuConfig = () => new Class_ApplicationData(false).menu_configuration
const roundTrip = (json: Type_JSON) => {
  const relu = freshMenuConfig()
  relu.mainZoneStateFromJSON(json)
  return relu
}

describe('le critere a plusieurs etiquettes', () => {
  it('se relit tel qu il a ete ecrit, noeuds coches compris', () => {
    const mc = freshMenuConfig()
    const id = mc.openMainZoneWindow(
      { kind: 'filter', tags: { filiere: ['lait', 'sucre'], process: ['transformation'] }, ids: ['n1', 'n2'] },
      'osp.repr.unit'
    )
    const o = roundTrip(mc.mainZoneStateToJSON()).main_zone_occupants.find(x => x.id === id)
    expect(o?.subject).toEqual({
      kind: 'filter', tags: { filiere: ['lait', 'sucre'], process: ['transformation'] }, ids: ['n1', 'n2']
    })
  })

  it('n ecrit ni les groupes vides ni de cles de vignettes', () => {
    const mc = freshMenuConfig()
    const id = mc.openMainZoneWindow({ kind: 'selection' }, 'osp.repr.unit')
    mc.setMainZoneWindowSubject(id, { kind: 'filter', tags: { filiere: ['lait'], process: [] } })
    const subject = ((mc.mainZoneStateToJSON()['occupants'] as Type_JSON)[id] as Type_JSON)['subject']
    expect(subject).toEqual({ kind: 'filter', tags: { filiere: ['lait'] } })
  })
})

describe('un volet qui suit un autre volet', () => {
  it('montre le sujet du volet suivi, et le suit quand il change', () => {
    const mc = freshMenuConfig()
    const unit = mc.openMainZoneWindow({ kind: 'filter', tags: { filiere: ['lait'] } }, 'osp.repr.unit')
    const table = mc.openMainZoneWindow({ kind: 'pane', id: unit }, 'osp.repr.matrix')
    const subjectOf = (id: string) => mc.main_zone_occupants.find(x => x.id === id)!.subject
    expect(effectiveMainZoneSubject(mc.main_zone_occupants, subjectOf(table)))
      .toEqual({ kind: 'filter', tags: { filiere: ['lait'] } })
    mc.setMainZoneWindowSubject(unit, { kind: 'filter', tags: { filiere: ['sucre'] } })
    expect(effectiveMainZoneSubject(mc.main_zone_occupants, subjectOf(table)))
      .toEqual({ kind: 'filter', tags: { filiere: ['sucre'] } })
  })

  it('prend aussi les coordonnees de donnees du volet suivi', () => {
    const mc = freshMenuConfig()
    const unit = mc.openMainZoneWindow({ kind: 'selection' }, 'osp.repr.unit')
    const table = mc.openMainZoneWindow({ kind: 'pane', id: unit }, 'osp.repr.matrix')
    mc.setMainZoneWindowDataTags(unit, { annee: ['2019', '2023'], unite: ['kt MG'] })
    expect(mc.mainZoneEffectiveDataTags(table)).toEqual({ annee: ['2019', '2023'], unite: ['kt MG'] })
  })

  it('refuse de se suivre soi-meme et de fermer une boucle', () => {
    const mc = freshMenuConfig()
    const a = mc.openMainZoneWindow({ kind: 'selection' }, 'osp.repr.unit')
    const b = mc.openMainZoneWindow({ kind: 'pane', id: a }, 'osp.repr.matrix')
    mc.setMainZoneWindowSubject(a, { kind: 'pane', id: a })
    mc.setMainZoneWindowSubject(a, { kind: 'pane', id: b })
    expect(mc.main_zone_occupants.find(x => x.id === a)!.subject).toEqual({ kind: 'selection' })
  })

  it('se detache en gardant ce qu il montrait', () => {
    const mc = freshMenuConfig()
    const unit = mc.openMainZoneWindow({ kind: 'filter', tags: { filiere: ['lait'] } }, 'osp.repr.unit')
    const table = mc.openMainZoneWindow({ kind: 'pane', id: unit }, 'osp.repr.matrix')
    mc.setMainZoneWindowDataTags(unit, { annee: ['2019'] })
    mc.detachMainZoneWindow(table, ['n1', 'n2'])
    // Le volet du dessus change : le tableau detache ne bouge plus.
    mc.setMainZoneWindowSubject(unit, { kind: 'filter', tags: { filiere: ['sucre'] } })
    mc.setMainZoneWindowDataTags(unit, { annee: ['2023'] })
    const o = mc.main_zone_occupants.find(x => x.id === table)!
    expect(o.subject).toEqual({ kind: 'elements', ids: ['n1', 'n2'], keys: ['n1', 'n2'] })
    expect(mc.mainZoneEffectiveDataTags(table)).toEqual({ annee: ['2019'] })
  })

  it('prend ce que montrait le volet suivi quand celui-ci se ferme', () => {
    const mc = freshMenuConfig()
    const unit = mc.openMainZoneWindow({ kind: 'filter', tags: { filiere: ['lait'] } }, 'osp.repr.unit')
    const table = mc.openMainZoneWindow({ kind: 'pane', id: unit }, 'osp.repr.matrix')
    mc.setMainZoneWindowDataTags(unit, { unite: ['kt MG'] })
    mc.hideMainZoneOccupant(unit)
    const o = mc.main_zone_occupants.find(x => x.id === table)!
    expect(o.subject).toEqual({ kind: 'filter', tags: { filiere: ['lait'] } })
    expect(o.data_tags).toEqual({ unite: ['kt MG'] })
  })

  it('se relit en suivant le meme volet', () => {
    const mc = freshMenuConfig()
    const unit = mc.openMainZoneWindow({ kind: 'selection' }, 'osp.repr.unit')
    const table = mc.openMainZoneWindow({ kind: 'pane', id: unit }, 'osp.repr.matrix')
    const o = roundTrip(mc.mainZoneStateToJSON()).main_zone_occupants.find(x => x.id === table)
    expect(o?.subject).toEqual({ kind: 'pane', id: unit })
  })
})

describe('coordonnees du volet et offre au lecteur, dans le fichier', () => {
  it('s ecrivent et se relisent quand elles sont posees', () => {
    const mc = freshMenuConfig()
    const id = mc.openMainZoneWindow({ kind: 'selection' }, 'osp.repr.unit')
    mc.setMainZoneWindowDataTags(id, { annee: ['2019', '2023'], unite: [] })
    mc.setMainZoneWindowReader(id, { header: true, node_taggs: ['filiere', 'process'] })
    const o = roundTrip(mc.mainZoneStateToJSON()).main_zone_occupants.find(x => x.id === id)
    expect(o?.data_tags).toEqual({ annee: ['2019', '2023'] })
    expect(o?.reader).toEqual({ header: true, node_taggs: ['filiere', 'process'] })
  })

  it('ne s ecrivent pas quand rien n est pose', () => {
    const mc = freshMenuConfig()
    const id = mc.openMainZoneWindow({ kind: 'selection' }, 'osp.repr.unit')
    mc.setMainZoneWindowDataTags(id, { annee: [] })
    mc.setMainZoneWindowReader(id, {})
    const entry = (mc.mainZoneStateToJSON()['occupants'] as Type_JSON)[id] as Type_JSON
    expect(entry['data_tags']).toBeUndefined()
    expect(entry['reader']).toBeUndefined()
  })
})
