import { Class_ApplicationData } from './ApplicationData'

/**
 * os#1394 - UN DEFAUT DE NATURE NE TRANSPORTE JAMAIS UN OBJET DU SUJET.
 *
 * Le defaut par nature sert a ce qu une etoile ouverte apres une autre soit reglee comme elle :
 * valeurs plutot que pourcentages, couleurs du diagramme. Mais certains reglages ne nomment pas
 * une FACON de regarder, ils nomment un OBJET : le flux de reference d une etoile, l axe de
 * decomposition d une analyse, la racine d un sunburst. Les propager rapporterait l etoile d un
 * noeud a un flux qui ne lui appartient pas.
 *
 * Le fichier de la grande zone le disait deja : un flux de reference n existe pas dans l etoile
 * d un autre noeud.
 */

describe('os#1394 le defaut de nature ne transporte pas les cles de sujet', () => {

  it('regler une vignette ne met pas son flux de reference dans le defaut', () => {
    const mc = new Class_ApplicationData(false).menu_configuration
    const id = mc.openMainZoneWindow({ kind: 'node', id: 'n1' }, 'osp.repr.unit')
    mc.setMainZonePaneOptions(id, 'p1', {
      value_mode: 'normalized', neutral_colors: false, normalize_link_id: 'flux_de_n1'
    })

    const def = mc.representationDefaultOptions('osp.repr.unit')
    expect(def.value_mode).toBe('normalized')
    expect(def.neutral_colors).toBe(false)
    expect(def.normalize_link_id).toBeUndefined()
  })

  it('la vignette reglee garde SON flux de reference', () => {
    // Le filtre ne vaut que pour le defaut : sur sa propre vignette, le reglage reste entier.
    const mc = new Class_ApplicationData(false).menu_configuration
    const id = mc.openMainZoneWindow({ kind: 'node', id: 'n1' }, 'osp.repr.unit')
    mc.setMainZonePaneOptions(id, 'p1', { value_mode: 'normalized', normalize_link_id: 'flux_de_n1' })

    expect(mc.mainZonePaneOptionsOf(id, 'p1').normalize_link_id).toBe('flux_de_n1')
  })

  it('une autre vignette herite du mode mais PAS du flux de reference', () => {
    const mc = new Class_ApplicationData(false).menu_configuration
    const id = mc.openMainZoneWindow({ kind: 'node', id: 'n1' }, 'osp.repr.unit')
    mc.setMainZonePaneOptions(id, 'p1', { value_mode: 'normalized', normalize_link_id: 'flux_de_n1' })

    const autre = mc.mainZonePaneOptionsOf(id, 'p2')
    expect(autre.value_mode).toBe('normalized')
    expect(autre.normalize_link_id).toBeUndefined()
  })

  it('une fenetre ouverte ensuite herite du mode mais PAS du flux de reference', () => {
    const mc = new Class_ApplicationData(false).menu_configuration
    const first = mc.openMainZoneWindow({ kind: 'node', id: 'n1' }, 'osp.repr.unit')
    mc.setMainZonePaneOptions(first, 'p1', { value_mode: 'value', normalize_link_id: 'flux_de_n1' })

    const second = mc.openMainZoneWindow({ kind: 'node', id: 'n2' }, 'osp.repr.unit')
    const options = mc.mainZonePaneOptionsOf(second, 'p1')
    expect(options.value_mode).toBe('value')
    expect(options.normalize_link_id).toBeUndefined()
  })

  it('un document enregistre avec un defaut pollue est nettoye a la lecture', () => {
    // Les documents ecrits entre la livraison du defaut par nature et ce correctif portent la
    // cle fautive : la relire telle quelle referait le bug a chaque ouverture.
    const mc = new Class_ApplicationData(false).menu_configuration
    mc.representationDefaultsFromJSON({
      'osp.repr.unit': { value_mode: 'normalized', normalize_link_id: 'flux_dun_autre' }
    })
    const id = mc.openMainZoneWindow({ kind: 'node', id: 'n9' }, 'osp.repr.unit')

    expect(mc.mainZonePaneOptionsOf(id, 'p1').normalize_link_id).toBeUndefined()
  })

  it('l axe de decomposition d une analyse ne se propage pas non plus', () => {
    const mc = new Class_ApplicationData(false).menu_configuration
    const id = mc.openMainZoneWindow({ kind: 'node', id: 'n1' }, 'osp.repr.donut')
    mc.setMainZonePaneOptions(id, 'p1', { descriptor: { decompose: { kind: 'outputs' } } })

    expect(mc.representationDefaultOptions('osp.repr.donut').descriptor).toBeUndefined()
  })
})
