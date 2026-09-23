// os#1498 — PLUSIEURS FENETRES DE LA MEME NATURE, SUR LA MEME FEUILLE.
//
// La grande zone nommait toute fenetre a sujet DIAGRAMME par sa representation : un tableur, une
// doc, un JSON, et redemander la nature montrait celle qui etait deja la. La vue par groupe montre
// le meme document mis en forme par UN SEUL groupe d etiquettes, et le groupe est un reglage de la
// FIGURE de la fenetre : deux groupes cote a cote est l usage meme. Une nature qui declare
// `allow_many` recoit donc un identifiant propre `w_N`, comme une fenetre d element.
//
// Ces tests figent les trois regles du lot : deux ouvertures font deux fenetres distinctes, chacune
// garde SON reglage a travers l aller-retour du fichier, et une nature qui ne declare rien ne
// change pas d un iota.

import { Class_ApplicationData } from './ApplicationData'
import { representation_registry } from '../Representations/RepresentationRegistry'
import { FIGURE_DIAGRAM_PANE_KEY } from '../Representations/Figure'
import { MAIN_ZONE_CANVAS_ID, MAIN_ZONE_GROUP_VIEW_ID } from './MenuConfig'

// Une nature de test qui accepte plusieurs fenetres, sous l identifiant meme de la vue par groupe :
// c est cet identifiant que la fiche d un groupe ouvrira, et le tester sous un autre nom ne dirait
// rien de ce qui sera branche.
const NATURE_MANY = MAIN_ZONE_GROUP_VIEW_ID
// Une nature d echelle diagramme ordinaire, temoin de la non-regression.
const NATURE_ONE = 'test.repr.une_seule'

const freshMenuConfig = () => new Class_ApplicationData(false).menu_configuration

beforeEach(() => {
  representation_registry.register({
    id: NATURE_MANY, scale: 'diagram', order: 40, allow_many: true,
    label: () => 'Vue par groupe', draw: () => undefined
  })
  representation_registry.register({
    id: NATURE_ONE, scale: 'diagram', order: 41,
    label: () => 'Une seule', draw: () => undefined
  })
})

afterEach(() => {
  representation_registry.unregister(NATURE_MANY)
  representation_registry.unregister(NATURE_ONE)
})

describe('une nature allow_many ouvre autant de fenetres quon lui demande', () => {

  it('deux ouvertures font deux occupants distincts', () => {
    const mc = freshMenuConfig()
    const a = mc.openMainZoneWindow({ kind: 'diagram' }, NATURE_MANY, 'right')
    const b = mc.openMainZoneWindow({ kind: 'diagram' }, NATURE_MANY, 'right')

    expect(a).not.toBe(b)
    // L identifiant est celui des fenetres d element, et surtout PAS celui du registre : un id de
    // registre ne peut nommer qu une fenetre.
    expect(a).toMatch(/^w_\d+$/)
    expect(b).toMatch(/^w_\d+$/)
    const ouvertes = mc.main_zone_occupants.filter(o => o.representation === NATURE_MANY)
    expect(ouvertes).toHaveLength(2)
    expect(ouvertes.map(o => o.subject)).toEqual([{ kind: 'diagram' }, { kind: 'diagram' }])
  })

  it('la normalisation ne remplace pas la nature par lidentifiant de session', () => {
    // La regle « une fenetre diagramme est nommee par sa representation » se reaffirmait a chaque
    // normalisation : appliquee ici, elle donnait `w_N` pour nature et la fenetre navait plus rien
    // a dessiner. C est le point dur du lot.
    const mc = freshMenuConfig()
    const id = mc.openMainZoneWindow({ kind: 'diagram' }, NATURE_MANY, 'right')
    expect(mc.main_zone_occupants.find(o => o.id === id)?.representation).toBe(NATURE_MANY)
  })

  it('le canevas reste la fenetre principale', () => {
    // Une vue de groupe souvre dans un volet : elle ne prend la place de personne.
    const mc = freshMenuConfig()
    mc.openMainZoneWindow({ kind: 'diagram' }, NATURE_MANY, 'right')
    expect(mc.main_zone_main_id).toBe(MAIN_ZONE_CANVAS_ID)
  })

  it('changer la nature dune telle fenetre ne la rebaptise pas', () => {
    // Le remplacement EN PLACE lui donnerait lidentifiant de sa nouvelle nature : deux vues de
    // groupe qui changent pour la meme fusionneraient en une seule.
    const mc = freshMenuConfig()
    const a = mc.openMainZoneWindow({ kind: 'diagram' }, NATURE_MANY, 'right')
    const b = mc.openMainZoneWindow({ kind: 'diagram' }, NATURE_MANY, 'right')

    mc.setMainZoneWindowRepresentation(a, NATURE_ONE)
    expect(mc.main_zone_occupants.find(o => o.id === a)?.representation).toBe(NATURE_ONE)
    expect(mc.main_zone_occupants.find(o => o.id === b)?.representation).toBe(NATURE_MANY)
  })
})

describe('chaque fenetre de groupe garde son groupe', () => {

  it('les deux reglages ne se melangent pas', () => {
    const mc = freshMenuConfig()
    const a = mc.openMainZoneWindow({ kind: 'diagram' }, NATURE_MANY, 'right')
    const b = mc.openMainZoneWindow({ kind: 'diagram' }, NATURE_MANY, 'right')
    mc.setMainZoneWindowOptions(a, { tag_group_id: 'g1' })
    mc.setMainZoneWindowOptions(b, { tag_group_id: 'g2' })

    expect(mc.figureOf(a, FIGURE_DIAGRAM_PANE_KEY).attributes['tag_group_id']).toBe('g1')
    expect(mc.figureOf(b, FIGURE_DIAGRAM_PANE_KEY).attributes['tag_group_id']).toBe('g2')
  })

  it('laller-retour rend les deux fenetres avec leur groupe', () => {
    // Recette 6 de lissue : enregistrer, rouvrir, le volet revient avec son groupe.
    const mc = freshMenuConfig()
    const a = mc.openMainZoneWindow({ kind: 'diagram' }, NATURE_MANY, 'right')
    const b = mc.openMainZoneWindow({ kind: 'diagram' }, NATURE_MANY, 'right')
    mc.setMainZoneWindowOptions(a, { tag_group_id: 'g1' })
    mc.setMainZoneWindowOptions(b, { tag_group_id: 'g2' })

    const relu = freshMenuConfig()
    relu.mainZoneStateFromJSON(mc.mainZoneStateToJSON())

    const revenues = relu.main_zone_occupants.filter(o => o.representation === NATURE_MANY)
    expect(revenues.map(o => o.id)).toEqual([a, b])
    expect(relu.figureOf(a, FIGURE_DIAGRAM_PANE_KEY).attributes['tag_group_id']).toBe('g1')
    expect(relu.figureOf(b, FIGURE_DIAGRAM_PANE_KEY).attributes['tag_group_id']).toBe('g2')
  })

  it('lidentifiant dune fenetre relue nest jamais redonne a une autre', () => {
    // Le compteur `w_N` se realigne sur le fichier : sans cela, la fenetre ouverte juste apres
    // ecraserait celle quon vient de relire.
    const mc = freshMenuConfig()
    const a = mc.openMainZoneWindow({ kind: 'diagram' }, NATURE_MANY, 'right')

    const relu = freshMenuConfig()
    relu.mainZoneStateFromJSON(mc.mainZoneStateToJSON())
    const suivante = relu.openMainZoneWindow({ kind: 'diagram' }, NATURE_MANY, 'right')

    expect(suivante).not.toBe(a)
    expect(relu.main_zone_occupants.filter(o => o.representation === NATURE_MANY)).toHaveLength(2)
  })
})

describe('une nature qui ne declare rien ne change pas', () => {

  it('deux ouvertures rendent la meme et unique fenetre', () => {
    const mc = freshMenuConfig()
    const a = mc.openMainZoneWindow({ kind: 'diagram' }, NATURE_ONE, 'right')
    const b = mc.openMainZoneWindow({ kind: 'diagram' }, NATURE_ONE, 'right')

    expect(a).toBe(NATURE_ONE)
    expect(b).toBe(NATURE_ONE)
    expect(mc.main_zone_occupants.filter(o => o.representation === NATURE_ONE)).toHaveLength(1)
  })

  it('une nature inconnue du registre reste elle aussi une fenetre unique', () => {
    // Module non charge, fichier plus recent : on ne fabrique pas une fenetre de plus au nom dune
    // nature dont on ne sait rien.
    const mc = freshMenuConfig()
    const a = mc.openMainZoneWindow({ kind: 'diagram' }, 'test.repr.jamais_enregistree', 'right')
    const b = mc.openMainZoneWindow({ kind: 'diagram' }, 'test.repr.jamais_enregistree', 'right')

    expect(a).toBe(b)
    expect(mc.main_zone_occupants.filter(o => o.id === a)).toHaveLength(1)
  })

  it('une fenetre delement garde exactement son comportement', () => {
    // Le prédicat de sujet decide toujours seul quand la nature ne dit rien.
    const mc = freshMenuConfig()
    const a = mc.openMainZoneWindow({ kind: 'node', id: 'n1' }, NATURE_ONE, 'right')
    const b = mc.openMainZoneWindow({ kind: 'node', id: 'n2' }, NATURE_ONE, 'right')

    expect(a).not.toBe(b)
    expect(a).toMatch(/^w_\d+$/)
  })
})
