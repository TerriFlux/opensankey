import {
  elementTarget,
  representationTarget,
  resolveRepresentationElementTarget,
  resolveSelectionTarget,
  resolveWindowTarget,
  viewTarget
} from './WindowTarget'
import type {
  Type_RepresentationContext, Type_RepresentationEntry
} from './RepresentationRegistry'

/**
 * os#1399 - LA CIBLE PARTAGEE par les trois familles de commandes.
 *
 * Deux choses a verrouiller :
 *  - la regle d arbitrage de l inspecteur n a pas bouge en demenageant ici (ses propres cas de
 *    test la verifient a l identique, ceux-ci disent la meme chose dans le vocabulaire partage) ;
 *  - une nature RESOUT la cible d un element pointe chez elle, et celle qui ne dit rien garde le
 *    comportement d aujourd hui.
 */

const fakeContext = (): Type_RepresentationContext => ({
  app_data: {} as unknown as Type_RepresentationContext['app_data'],
  scale: 'element',
  element: null,
  options: {}
})

/** Entree de registre factice : seul son `resolveElementTarget` compte ici. */
const entryResolving = (
  resolve: Type_RepresentationEntry['resolveElementTarget']
): Type_RepresentationEntry => ({
  id: 'test.repr', scale: 'element', order: 1, label: () => 'test',
  host: 'component', resolveElementTarget: resolve
})

const pointed = { kind: 'slice', id: 'part_1' }

describe('resolveSelectionTarget', () => {
  it('aucune selection donne la vue', () => {
    expect(resolveSelectionTarget()).toEqual(viewTarget())
  })

  it('un seul type selectionne donne ce type et son decompte', () => {
    expect(resolveSelectionTarget({ nodes: 3 }))
      .toMatchObject({ kind: 'node', count: 3 })
    expect(resolveSelectionTarget({ links: 2 }))
      .toMatchObject({ kind: 'link', count: 2 })
  })

  it('plusieurs types donnent mixed et le total', () => {
    expect(resolveSelectionTarget({ nodes: 2, links: 1 }))
      .toMatchObject({ kind: 'mixed', count: 3 })
  })

  it('la figure active nomme sa representation dans la cible', () => {
    expect(resolveSelectionTarget({}, false, 'osp.repr.donut'))
      .toEqual(representationTarget('osp.repr.donut'))
  })

  it('le dernier geste decide entre la selection et la figure', () => {
    expect(resolveSelectionTarget({ nodes: 1 }, false, 'osp.repr.donut', true).kind)
      .toBe('representation')
    expect(resolveSelectionTarget({ nodes: 1 }, false, 'osp.repr.donut', false).kind)
      .toBe('node')
  })

  it('view_override gagne sur tout', () => {
    expect(resolveSelectionTarget({ nodes: 1 }, true, 'osp.repr.donut', true))
      .toEqual(viewTarget())
  })
})

describe('resolveWindowTarget', () => {
  it('sans rien de pointe la selection decide, comme avant', () => {
    expect(resolveWindowTarget({ counts: { nodes: 2 } }))
      .toMatchObject({ kind: 'node', count: 2 })
    expect(resolveWindowTarget()).toEqual(viewTarget())
  })

  it('un element pointe dans une figure gagne sur la selection', () => {
    // Pointer est le geste qu on vient de faire ; la selection est celui d avant.
    expect(resolveWindowTarget({
      counts: { nodes: 5 },
      active_representation_id: 'osp.repr.donut',
      pointed: elementTarget('link', 'flux_12')
    })).toEqual({
      kind: 'link', count: 1, id: 'flux_12', representation_id: 'osp.repr.donut'
    })
  })

  it('un element pointe ne gagne pas sur une demande explicite de la vue', () => {
    expect(resolveWindowTarget({
      view_override: true,
      pointed: elementTarget('node', 'n1')
    })).toEqual(viewTarget())
  })

  it('la nature garde la figure qu elle s est donnee', () => {
    // Une figure peut resoudre vers un objet vu ailleurs : on ne recrit pas sa reponse.
    expect(resolveWindowTarget({
      active_representation_id: 'osp.repr.donut',
      pointed: { ...elementTarget('node', 'n1'), representation_id: 'osp.repr.unit' }
    }).representation_id).toBe('osp.repr.unit')
  })
})

describe('resolveRepresentationElementTarget', () => {
  it('une nature qui ne declare rien parle de la figure', () => {
    const entry = entryResolving(undefined)
    expect(resolveRepresentationElementTarget(entry, { target: pointed, ctx: fakeContext() }))
      .toEqual(representationTarget('test.repr'))
  })

  it('une nature qui resout donne sa reponse, estampillee de son id', () => {
    const entry = entryResolving(({ target }) => elementTarget('tag', target.id))
    expect(resolveRepresentationElementTarget(entry, { target: pointed, ctx: fakeContext() }))
      .toEqual({ kind: 'tag', count: 1, id: 'part_1', representation_id: 'test.repr' })
  })

  it('une nature qui repond null parle de la figure : c est le cas du fond', () => {
    const entry = entryResolving(() => null)
    expect(resolveRepresentationElementTarget(
      entry, { target: { kind: 'background', id: null }, ctx: fakeContext() }
    )).toEqual(representationTarget('test.repr'))
  })

  it('une resolution qui leve ne prive personne de ses reglages', () => {
    const entry = entryResolving(() => { throw new Error('nature cassee') })
    expect(resolveRepresentationElementTarget(entry, { target: pointed, ctx: fakeContext() }))
      .toEqual(representationTarget('test.repr'))
  })

  it('un id de registre inconnu rend quand meme une cible', () => {
    expect(resolveRepresentationElementTarget(undefined, { target: pointed, ctx: fakeContext() }))
      .toEqual(representationTarget(null))
  })
})
