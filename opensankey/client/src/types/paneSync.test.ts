import { Class_ApplicationData } from './ApplicationData'
import type { Type_JSON } from './Utils'
import { representation_registry } from '../Representations/RepresentationRegistry'
import { Class_FigureNature } from '../Representations/Figure'
import { readSyncedKeys, syncableKeysOf, syncedChanges } from '../Representations/paneSync'

/**
 * sa#568 - SYNCHRONISER DES REGLAGES ENTRE VOLETS, REGLAGE PAR REGLAGE ET VOLET PAR VOLET.
 *
 * Recette de l issue : deux volets, l annee cochee des deux cotes -> changer l annee dans l un la
 * change dans l autre ; un reglage non coche (l axe) change dans un volet sans toucher l autre ;
 * ce qui est coche se retrouve a la reouverture ; rien de coche = le meme fichier qu avant.
 */

const NATURE = 'test.figure.sync.donut'
const OTHER = 'test.figure.sync.star'

const labels = (en: string) => ({ en, fr: en, es: en, de: en, it: en, 'zh-CN': en, ja: en })
const attr = (sort: string, def: unknown = undefined) => ({
  default: def, type: () => def, category: 'figure', labels: labels(sort), tooltips: labels(sort), sort
})

// Une nature declaree comme une vraie couronne : l annee et l axe (navigation), un reglage de
// mise en forme, et un reglage d identite qui ne doit JAMAIS voyager.
const DONUT_ENTRY = {
  id: NATURE,
  scale: 'element',
  order: 98,
  label: () => 'Donut',
  attributes: {
    value_mode: attr('style', 'percent'),
    normalize_link_id: attr('identity'),
    data_tags: attr('navigation'),
    descriptor: attr('navigation')
  },
  draw: () => undefined
}
// Une autre nature qui partage la cle d annee : l annee d une etoile et celle d une couronne sont
// la meme cle, et cocher l annee des deux cotes les relie.
const STAR_ENTRY = {
  id: OTHER,
  scale: 'element',
  order: 99,
  label: () => 'Star',
  attributes: { data_tags: attr('navigation'), value_mode: attr('style', 'percent') },
  draw: () => undefined
}

/** Deux volets neufs de la nature donnee, chacun sur son noeud. */
const twoPanes = (natureA = NATURE, natureB = NATURE) => {
  const mc = new Class_ApplicationData(false).menu_configuration
  const a = mc.openMainZoneWindow({ kind: 'node', id: 'n1' }, natureA, undefined, undefined, true)
  const b = mc.openMainZoneWindow({ kind: 'node', id: 'n2' }, natureB, undefined, undefined, true)
  // Une vignette montree a sa figure : la lire suffit a la creer (c est ce que fait le dessin).
  mc.mainZonePaneOptionsOf(a, 'n1')
  mc.mainZonePaneOptionsOf(b, 'n2')
  return { mc, a, b }
}

const Y2019 = { year: '2019' }
const Y2020 = { year: '2020' }

describe('sa#568 les regles pures', () => {
  it('se cochent les reglages declares sauf l identite, la navigation en tete', () => {
    const nature = new Class_FigureNature('n', DONUT_ENTRY.attributes as never)
    expect(syncableKeysOf(nature)).toEqual(['data_tags', 'descriptor', 'value_mode'])
  })

  it('une cle RETIREE voyage (revenir a suivre le diagramme), une cle inchangee non', () => {
    const out = syncedChanges(
      { data_tags: Y2019, descriptor: 'x', value_mode: 'value' },
      { descriptor: 'x', value_mode: 'percent' },
      ['data_tags', 'descriptor']
    )
    expect('data_tags' in out).toBe(true)
    expect(out.data_tags).toBeUndefined()
    expect('descriptor' in out).toBe(false)
    // value_mode a change, mais il n est pas coche.
    expect('value_mode' in out).toBe(false)
  })

  it('la liste relue d un fichier ne garde que des chaines non vides, sans doublon', () => {
    expect(readSyncedKeys(['data_tags', '', 3, 'data_tags', 'descriptor'])).toEqual(['data_tags', 'descriptor'])
    expect(readSyncedKeys(undefined)).toEqual([])
    expect(readSyncedKeys('data_tags')).toEqual([])
  })
})

describe('sa#568 la synchronisation entre volets', () => {
  beforeAll(() => {
    representation_registry.register(DONUT_ENTRY as never)
    representation_registry.register(STAR_ENTRY as never)
  })
  afterAll(() => {
    representation_registry.unregister(NATURE)
    representation_registry.unregister(OTHER)
  })

  it('rien de coche : chaque volet garde ses reglages (aucun changement de comportement)', () => {
    const { mc, a, b } = twoPanes()
    mc.setMainZonePaneOptions(a, 'n1', { data_tags: Y2019 })
    expect(mc.mainZonePaneOptionsOf(b, 'n2').data_tags).toBeUndefined()
  })

  it('l annee cochee des deux cotes : la changer dans l un la change dans l autre, dans les deux sens', () => {
    const { mc, a, b } = twoPanes()
    mc.setMainZoneSyncedKey(a, 'data_tags', true)
    mc.setMainZoneSyncedKey(b, 'data_tags', true)

    mc.setMainZonePaneOptions(a, 'n1', { data_tags: Y2019 })
    expect(mc.mainZonePaneOptionsOf(b, 'n2').data_tags).toEqual(Y2019)

    mc.setMainZonePaneOptions(b, 'n2', { data_tags: Y2020 })
    expect(mc.mainZonePaneOptionsOf(a, 'n1').data_tags).toEqual(Y2020)

    // Retirer l epingle (« suit le diagramme ») voyage aussi.
    mc.setMainZonePaneOptions(a, 'n1', {})
    expect(mc.mainZonePaneOptionsOf(b, 'n2').data_tags).toBeUndefined()
  })

  it('un reglage non coche (l axe) change dans un volet sans toucher l autre', () => {
    const { mc, a, b } = twoPanes()
    mc.setMainZoneSyncedKey(a, 'data_tags', true)
    mc.setMainZoneSyncedKey(b, 'data_tags', true)
    mc.setMainZonePaneOptions(a, 'n1', { data_tags: Y2019, descriptor: 'by_tag' })
    expect(mc.mainZonePaneOptionsOf(b, 'n2').data_tags).toEqual(Y2019)
    expect(mc.mainZonePaneOptionsOf(b, 'n2').descriptor).toBeUndefined()
  })

  it('coche d un seul cote : rien ne relie les deux volets', () => {
    const { mc, a, b } = twoPanes()
    mc.setMainZoneSyncedKey(a, 'data_tags', true)
    mc.setMainZonePaneOptions(a, 'n1', { data_tags: Y2019 })
    expect(mc.mainZonePaneOptionsOf(b, 'n2').data_tags).toBeUndefined()
    expect(mc.mainZoneSyncPartners(a, 'data_tags')).toEqual([])
  })

  it('cocher ne recopie rien : c est le changement suivant qui voyage', () => {
    const { mc, a, b } = twoPanes()
    mc.setMainZonePaneOptions(a, 'n1', { data_tags: Y2019 })
    mc.setMainZoneSyncedKey(a, 'data_tags', true)
    mc.setMainZoneSyncedKey(b, 'data_tags', true)
    expect(mc.mainZonePaneOptionsOf(b, 'n2').data_tags).toBeUndefined()
    expect(mc.mainZoneSyncPartners(a, 'data_tags')).toEqual([b])
  })

  it('l annee relie deux natures differentes qui la declarent', () => {
    const { mc, a, b } = twoPanes(NATURE, OTHER)
    mc.setMainZoneSyncedKey(a, 'data_tags', true)
    mc.setMainZoneSyncedKey(b, 'data_tags', true)
    mc.setMainZonePaneOptions(a, 'n1', { data_tags: Y2019 })
    expect(mc.mainZonePaneOptionsOf(b, 'n2').data_tags).toEqual(Y2019)
  })

  it('un reglage d identite ne voyage jamais, meme coche', () => {
    const { mc, a, b } = twoPanes()
    mc.setMainZoneSyncedKey(a, 'normalize_link_id', true)
    mc.setMainZoneSyncedKey(b, 'normalize_link_id', true)
    mc.setMainZonePaneOptions(a, 'n1', { normalize_link_id: 'l1' })
    expect(mc.mainZonePaneOptionsOf(b, 'n2').normalize_link_id).toBeUndefined()
    expect(mc.mainZoneSyncableKeys(a)).not.toContain('normalize_link_id')
  })

  it('toutes les vignettes montrees d un volet relie recoivent le reglage', () => {
    const mc = new Class_ApplicationData(false).menu_configuration
    const a = mc.openMainZoneWindow({ kind: 'node', id: 'n1' }, NATURE, undefined, undefined, true)
    const b = mc.openMainZoneWindow({ kind: 'elements', ids: ['n2', 'n3'], keys: ['n2', 'n3'] }, NATURE, undefined, undefined, true)
    mc.mainZonePaneOptionsOf(b, 'n2')
    mc.mainZonePaneOptionsOf(b, 'n3')
    mc.setMainZoneSyncedKey(a, 'value_mode', true)
    mc.setMainZoneSyncedKey(b, 'value_mode', true)
    mc.setMainZonePaneOptions(a, 'n1', { value_mode: 'value' })
    expect(mc.mainZonePaneOptionsOf(b, 'n2').value_mode).toBe('value')
    expect(mc.mainZonePaneOptionsOf(b, 'n3').value_mode).toBe('value')
  })

  it('rien de coche : le fichier n ecrit pas la cle', () => {
    const { mc } = twoPanes()
    const occupants = mc.mainZoneStateToJSON()['occupants'] as Type_JSON
    Object.values(occupants).forEach(entry => expect('synced' in (entry as Type_JSON)).toBe(false))
  })

  it('ce qui est coche se retrouve a la reouverture du fichier', () => {
    const { mc, a, b } = twoPanes()
    mc.setMainZoneSyncedKey(a, 'data_tags', true)
    mc.setMainZoneSyncedKey(b, 'data_tags', true)
    mc.setMainZoneSyncedKey(b, 'descriptor', true)
    const json = JSON.parse(JSON.stringify(mc.mainZoneStateToJSON())) as Type_JSON
    expect(((json['occupants'] as Type_JSON)[b] as Type_JSON)['synced']).toEqual(['data_tags', 'descriptor'])

    const reread = new Class_ApplicationData(false).menu_configuration
    reread.mainZoneStateFromJSON(json)
    expect(reread.mainZoneSyncedKeys(a)).toEqual(['data_tags'])
    expect(reread.mainZoneSyncedKeys(b)).toEqual(['data_tags', 'descriptor'])
    // Et le lien joue apres relecture.
    reread.mainZonePaneOptionsOf(b, 'n2')
    reread.setMainZonePaneOptions(a, 'n1', { data_tags: Y2019 })
    expect(reread.mainZonePaneOptionsOf(b, 'n2').data_tags).toEqual(Y2019)
  })

  it('decocher le dernier reglage retire la cle du volet', () => {
    const { mc, a } = twoPanes()
    mc.setMainZoneSyncedKey(a, 'data_tags', true)
    mc.setMainZoneSyncedKey(a, 'data_tags', false)
    expect(mc.mainZoneSyncedKeys(a)).toEqual([])
    expect('synced' in (mc.mainZoneWindowToJSON(a) as Type_JSON)).toBe(false)
  })

  it('la forme d une vue garde ses reglages partages, et les rend en se rouvrant', () => {
    const { mc, a } = twoPanes()
    mc.setMainZoneSyncedKey(a, 'data_tags', true)
    const form = mc.mainZoneWindowToJSON(a) as Type_JSON
    expect(form['synced']).toEqual(['data_tags'])
    const id = mc.openMainZoneWindowFromJSON(form, 'v_test')
    expect(id).not.toBeNull()
    expect(mc.mainZoneSyncedKeys(id as string)).toEqual(['data_tags'])
  })
})
