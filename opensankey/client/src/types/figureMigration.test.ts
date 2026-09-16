import { Class_ApplicationData } from './ApplicationData'
import { representation_registry } from '../Representations/RepresentationRegistry'
import type { Type_JSON } from './Utils'

/**
 * os#1419 - MIGRER LES REGLAGES D AVANT, ET DIRE CE QU ON N A PAS PORTE.
 *
 * Les fichiers d avant os#1418 portent deux choses : un defaut par nature
 * (`representation_defaults`) et, par fenetre, un sac `options` avec son sous-dictionnaire
 * `panes`. La migration doit reproduire EXACTEMENT ce que ces fichiers montraient - vignette
 * propre, puis defaut de nature, puis repli au niveau de la fenetre - et RAPPORTER ce qu elle
 * n a pas su porter, plutot que de l avaler.
 */

const NATURE = 'test.figure.star'

const TEST_ENTRY = {
  id: NATURE,
  scale: 'element',
  order: 99,
  label: () => 'Star',
  attributes: {
    value_mode: {
      default: 'percent',
      type: () => 'percent',
      category: 'figure',
      labels: {
        en: 'Value mode', fr: 'Mode de valeur', es: 'Modo de valor', de: 'Wertmodus',
        it: 'Modo di valore', 'zh-CN': '数值模式', ja: '値モード'
      },
      tooltips: {
        en: 'How values are shown', fr: 'Comment les valeurs sont montrees',
        es: 'Como se muestran los valores', de: 'Wie Werte angezeigt werden',
        it: 'Come sono mostrati i valori', 'zh-CN': '数值显示方式', ja: '値の表示方法'
      },
      sort: 'style'
    },
    normalize_link_id: {
      default: undefined,
      type: () => undefined,
      category: 'figure',
      labels: {
        en: 'Reference flux', fr: 'Flux de reference', es: 'Flujo de referencia',
        de: 'Referenzfluss', it: 'Flusso di riferimento', 'zh-CN': '参考流', ja: '基準フロー'
      },
      tooltips: {
        en: 'Flux the star is normalized on', fr: 'Flux sur lequel l etoile est normalisee',
        es: 'Flujo sobre el que se normaliza', de: 'Fluss zur Normalisierung',
        it: 'Flusso di normalizzazione', 'zh-CN': '归一化所用的流', ja: '正規化に使うフロー'
      },
      sort: 'identity'
    }
  },
  draw: () => undefined
}

/** Une fenetre du FORMAT D AVANT : sac par fenetre + dictionnaire des vignettes. */
const legacyState = (options: Type_JSON): Type_JSON => ({
  occupants: {
    w_1: {
      place: 'right',
      size: 1,
      order: 0,
      representation: NATURE,
      subject: { kind: 'elements', ids: ['n1', 'n2'], keys: ['n1', 'n2'] },
      options
    }
  }
})

describe('os#1419 migration des reglages de figure', () => {

  beforeAll(() => {
    representation_registry.register(TEST_ENTRY as never)
  })

  afterAll(() => {
    representation_registry.unregister(NATURE)
  })

  it('un defaut de nature POLLUE entre dans le style sans sa cle de sujet, et c est rapporte', () => {
    const mc = new Class_ApplicationData(false).menu_configuration
    mc.representationDefaultsFromJSON({
      [NATURE]: { value_mode: 'normalized', normalize_link_id: 'flux_dun_autre' }
    })

    expect(mc.representationStyleOptions(NATURE).value_mode).toBe('normalized')
    expect(mc.figureStylesToJSON())
      .toEqual({ [NATURE]: { default: { attributes: { value_mode: 'normalized' } } } })

    const notes = mc.figure_migration_report.notes
    expect(notes.length).toBe(1)
    expect(notes[0].key).toBe('normalize_link_id')
    expect(notes[0].reason).toBe('not_transposable')
  })

  it('SANS defaut de nature, la vignette garde le sien et sa voisine prend le repli de la fenetre', () => {
    const mc = new Class_ApplicationData(false).menu_configuration
    mc.mainZoneStateFromJSON(legacyState({
      value_mode: 'value',
      panes: { n1: { value_mode: 'percent', normalize_link_id: 'l1' } }
    }))

    expect(mc.mainZonePaneOptionsOf('w_1', 'n1')).toEqual({ value_mode: 'percent', normalize_link_id: 'l1' })
    expect(mc.mainZonePaneOptionsOf('w_1', 'n2').value_mode).toBe('value')
  })

  it('AVEC un defaut de nature, la vignette sans reglage suit le defaut et non le repli', () => {
    // C etait la regle de os#1394 : le defaut s intercalait AVANT le repli au niveau de la
    // fenetre. La migration la reproduit, et va meme un peu plus loin : la figure SUIT le style
    // au lieu d en figer une copie.
    const mc = new Class_ApplicationData(false).menu_configuration
    mc.setRepresentationStyleOptions(NATURE, { value_mode: 'normalized' })
    mc.mainZoneStateFromJSON(legacyState({
      value_mode: 'value',
      panes: { n1: { value_mode: 'percent' } }
    }))

    expect(mc.mainZonePaneOptionsOf('w_1', 'n1').value_mode).toBe('percent')
    expect(mc.mainZonePaneOptionsOf('w_1', 'n2').value_mode).toBe('normalized')
  })

  it('une cle qu aucune nature ne declare est GARDEE et rapportee', () => {
    const mc = new Class_ApplicationData(false).menu_configuration
    mc.mainZoneStateFromJSON(legacyState({
      panes: { n1: { value_mode: 'value', zorglub: 1 } }
    }))

    expect(mc.mainZonePaneOptionsOf('w_1', 'n1').zorglub).toBe(1)
    const notes = mc.figure_migration_report.notes
    expect(notes.some(n => n.key === 'zorglub' && n.reason === 'unknown_key')).toBe(true)
  })

  it('apres migration le fichier ecrit figures et plus options, et se relit a l identique', () => {
    const mc = new Class_ApplicationData(false).menu_configuration
    mc.mainZoneStateFromJSON(legacyState({
      value_mode: 'value',
      panes: { n1: { value_mode: 'percent', normalize_link_id: 'l1' } }
    }))

    const json = mc.mainZoneStateToJSON()
    const entry = (json['occupants'] as Type_JSON)['w_1'] as Type_JSON
    expect(entry['options']).toBeUndefined()
    expect(entry['figures']).toEqual({
      n1: { attributes: { value_mode: 'percent', normalize_link_id: 'l1' } },
      n2: { attributes: { value_mode: 'value' } }
    })

    const relu = new Class_ApplicationData(false).menu_configuration
    relu.mainZoneStateFromJSON(json)
    expect(relu.mainZonePaneOptionsOf('w_1', 'n1')).toEqual(mc.mainZonePaneOptionsOf('w_1', 'n1'))
    expect(relu.mainZonePaneOptionsOf('w_1', 'n2')).toEqual(mc.mainZonePaneOptionsOf('w_1', 'n2'))
  })

  it('une fenetre sans reglages n ecrit ni options ni figures', () => {
    const mc = new Class_ApplicationData(false).menu_configuration
    mc.mainZoneStateFromJSON({
      occupants: {
        w_1: {
          place: 'right', size: 1, order: 0, representation: NATURE,
          subject: { kind: 'elements', ids: ['n1'], keys: ['n1'] }
        }
      }
    })
    // Lire ne cree rien de persistant : une figure qui suit son style n a rien a dire.
    mc.mainZonePaneOptionsOf('w_1', 'n1')

    const entry = (mc.mainZoneStateToJSON()['occupants'] as Type_JSON)['w_1'] as Type_JSON
    expect(entry['options']).toBeUndefined()
    expect(entry['figures']).toBeUndefined()
  })
})
