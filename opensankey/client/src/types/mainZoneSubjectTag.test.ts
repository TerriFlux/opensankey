// os#1420 — LE SUJET A CRITERE, DANS LE FICHIER.
//
// Une fenetre epinglee a une ETIQUETTE de noeuds n ecrit pas les noeuds qu elle montre : elle
// ecrit le critere (groupe + etiquette), et les noeuds se redemandent au diagramme a l ouverture.
// C est ce qui la distingue d une liste d identifiants, qui se vide a moitie des qu un changement
// de niveau escamote ses noeuds pendant que la fenetre garde son titre.
//
// Ces tests figent les trois regles de persistance de ce sujet : l aller-retour rend le meme
// critere, une moitie de critere retombe sur le defaut du jalon (SUIVRE), et l epingler n elague
// pas les reglages des vignettes — la liste des cles vivantes d un critere n est pas connue ici.

import { Class_ApplicationData } from './ApplicationData'
import type { Type_JSON } from './Utils'

const freshMenuConfig = () => new Class_ApplicationData(false).menu_configuration

describe('un sujet epingle a une etiquette se persiste par son critere', () => {

  it('l aller-retour rend le groupe et l etiquette', () => {
    const mc = freshMenuConfig()
    const id = mc.openMainZoneWindow({ kind: 'tag', tagg_id: 'g1', tag_id: 'import' }, 'osp.repr.unit')
    const json = mc.mainZoneStateToJSON()

    const relu = freshMenuConfig()
    relu.mainZoneStateFromJSON(json)
    const o = relu.main_zone_occupants.find(x => x.id === id)
    expect(o?.subject).toEqual({ kind: 'tag', tagg_id: 'g1', tag_id: 'import' })
  })

  it('le critere emporte la feuille du sujet', () => {
    // Un critere s applique a UN diagramme : perdre la feuille le ferait porter sur celui qu on
    // edite, donc sur d autres noeuds, sans que rien ne le dise.
    const mc = freshMenuConfig()
    const id = mc.openMainZoneWindow(
      { kind: 'tag', tagg_id: 'g1', tag_id: 'import', sheet: 'S2' }, 'osp.repr.unit'
    )
    const relu = freshMenuConfig()
    relu.mainZoneStateFromJSON(mc.mainZoneStateToJSON())
    const o = relu.main_zone_occupants.find(x => x.id === id)
    expect(o?.subject).toEqual({ kind: 'tag', tagg_id: 'g1', tag_id: 'import', sheet: 'S2' })
  })

  it('les noeuds designes ne sont PAS ecrits dans le fichier', () => {
    // Les ecrire les figerait, ce qui est exactement ce a quoi ce sujet sert a echapper.
    const mc = freshMenuConfig()
    const id = mc.openMainZoneWindow({ kind: 'tag', tagg_id: 'g1', tag_id: 'import' }, 'osp.repr.unit')
    const occupants = mc.mainZoneStateToJSON()['occupants'] as Type_JSON
    const subject = (occupants[id] as Type_JSON)['subject'] as Type_JSON
    expect(subject).toEqual({ kind: 'tag', tagg_id: 'g1', tag_id: 'import' })
  })

  it('une moitie de critere remet la fenetre a SUIVRE', () => {
    // Un groupe sans etiquette ne designe pas « moins de noeuds » : il n en designe aucun tout en
    // pretendant le contraire. La fenetre retombe sur le defaut du jalon, donc reste utile.
    const relu = freshMenuConfig()
    relu.mainZoneStateFromJSON({
      occupants: {
        w_1: {
          place: 'right', size: 1, order: 0, representation: 'osp.repr.unit',
          subject: { kind: 'tag', tagg_id: 'g1' }
        }
      }
    } as unknown as Type_JSON)
    expect(relu.main_zone_occupants.find(x => x.id === 'w_1')?.subject).toEqual({ kind: 'selection' })
  })

  it('une etiquette sans groupe remet aussi la fenetre a SUIVRE', () => {
    const relu = freshMenuConfig()
    relu.mainZoneStateFromJSON({
      occupants: {
        w_1: {
          place: 'right', size: 1, order: 0, representation: 'osp.repr.unit',
          subject: { kind: 'tag', tag_id: 'import', sheet: 'S2' }
        }
      }
    } as unknown as Type_JSON)
    // La feuille part avec le critere : une fenetre qui SUIT suit la feuille vivante.
    expect(relu.main_zone_occupants.find(x => x.id === 'w_1')?.subject).toEqual({ kind: 'selection' })
  })
})

describe('epingler a une etiquette n elague pas les figures', () => {

  it('les reglages des vignettes survivent au passage a un critere', () => {
    // La liste des cles VIVANTES d un critere n est pas connue de la configuration des menus : elle
    // depend du diagramme. Elaguer sur ce qu on sait ici reviendrait a tout jeter.
    const mc = freshMenuConfig()
    const id = mc.openMainZoneWindow({ kind: 'elements', ids: ['n1'], keys: ['n1'] }, 'osp.repr.unit')
    mc.setMainZonePaneOptions(id, 'n1', { axe_de_test: 'dimension' })
    expect(mc.mainZonePaneOptionsOf(id, 'n1')['axe_de_test']).toBe('dimension')

    mc.setMainZoneWindowSubject(id, { kind: 'tag', tagg_id: 'g1', tag_id: 'import' })
    expect(mc.main_zone_occupants.find(x => x.id === id)?.subject)
      .toEqual({ kind: 'tag', tagg_id: 'g1', tag_id: 'import' })
    expect(mc.mainZonePaneOptionsOf(id, 'n1')['axe_de_test']).toBe('dimension')
  })

  it('revenir a une liste elague, lui', () => {
    // La regle d avant ne bouge pas : une liste PORTE ses cles vivantes, donc le menage a un sens.
    const mc = freshMenuConfig()
    const id = mc.openMainZoneWindow({ kind: 'elements', ids: ['n1'], keys: ['n1'] }, 'osp.repr.unit')
    mc.setMainZonePaneOptions(id, 'n1', { axe_de_test: 'dimension' })

    mc.setMainZoneWindowSubject(id, { kind: 'elements', ids: ['n2'], keys: ['n2'] })
    expect(mc.mainZonePaneOptionsOf(id, 'n1')['axe_de_test']).toBeUndefined()
  })
})
