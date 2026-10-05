import { Class_ApplicationData } from './ApplicationData'
import { MAIN_ZONE_CANVAS_ID } from './MenuConfig'
import { representation_registry } from '../Representations/RepresentationRegistry'
import { basePaneKeyOf, paneCoordinatesKey } from './mainZonePanes'
import type { Type_JSON } from './Utils'

/**
 * sa#596 - UNE VIGNETTE PAR VALEUR COCHEE, UNE FIGURE PAR OBJET.
 *
 * Avec 2015, 2019 et 2023 coches, la Meunerie a trois vignettes : trois CLES (on clique, on
 * selectionne, on masque un dessin precis) mais une seule FIGURE - la regler en 2015 la regle pour
 * ses trois annees, et le fichier ne porte qu une figure par noeud.
 */

const NATURE = 'test.figure.deployed'

const TEST_ENTRY = {
  id: NATURE,
  scale: 'element',
  order: 97,
  label: () => 'Deployed',
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
    }
  },
  draw: () => undefined
}

const windows = (): Type_JSON => ({
  occupants: {
    [MAIN_ZONE_CANVAS_ID]: {
      place: 'main', size: 1, order: 0,
      representation: MAIN_ZONE_CANVAS_ID, subject: { kind: 'diagram' }
    },
    w_1: {
      place: 'right', size: 1, order: 1, representation: NATURE,
      subject: { kind: 'elements', ids: ['meunerie', 'beurre'], keys: ['meunerie', 'beurre'] }
    }
  }
})

const newConfig = () => {
  const mc = new Class_ApplicationData(false).menu_configuration
  mc.mainZoneStateFromJSON(windows())
  return mc
}

describe('sa#596 cles de vignettes deployees', () => {

  beforeAll(() => {
    representation_registry.register(TEST_ENTRY as never)
  })

  afterAll(() => {
    representation_registry.unregister(NATURE)
  })

  it('une cle deployee se distingue par ses coordonnees et revient a son objet', () => {
    const k2015 = paneCoordinatesKey('meunerie', ['2015'])
    const k2023 = paneCoordinatesKey('meunerie', ['2023'])
    expect(k2015).not.toBe(k2023)
    expect(k2015).not.toBe('meunerie')
    expect(basePaneKeyOf(k2015)).toBe('meunerie')
    expect(basePaneKeyOf(paneCoordinatesKey('beurre', ['2023', 'kt MG']))).toBe('beurre')
    // Sans coordonnees, la cle est celle de l objet : rien ne change hors deploiement.
    expect(paneCoordinatesKey('meunerie', [])).toBe('meunerie')
    expect(basePaneKeyOf('meunerie')).toBe('meunerie')
  })

  it('les vignettes deployees d un objet sont SA figure', () => {
    const mc = newConfig()
    const fig = mc.figureOf('w_1', 'meunerie')
    expect(mc.figureOf('w_1', paneCoordinatesKey('meunerie', ['2015']))).toBe(fig)
    expect(mc.figureOf('w_1', paneCoordinatesKey('meunerie', ['2023']))).toBe(fig)
    expect(mc.figureOf('w_1', paneCoordinatesKey('beurre', ['2015']))).not.toBe(fig)
  })

  it('regler la vignette de 2015 regle les trois annees, et le fichier n en garde qu une', () => {
    const mc = newConfig()
    mc.setMainZonePaneOptions('w_1', paneCoordinatesKey('meunerie', ['2015']), { value_mode: 'value' })

    expect(mc.mainZonePaneOptionsOf('w_1', paneCoordinatesKey('meunerie', ['2023']))['value_mode']).toBe('value')
    expect(mc.mainZonePaneOptionsOf('w_1', 'meunerie')['value_mode']).toBe('value')
    expect(mc.mainZonePaneOptionsOf('w_1', 'beurre')['value_mode']).toBe('percent')
  })

  it('une vignette deployee selectionnee le reste tant que son objet est dans le sujet', () => {
    const mc = newConfig()
    const k2015 = paneCoordinatesKey('meunerie', ['2015'])
    const k2023 = paneCoordinatesKey('meunerie', ['2023'])
    mc.setMainZoneActivePane('w_1', k2015)
    mc.setMainZoneActivePane('w_1', k2023, true)
    expect(mc.main_zone_selected_pane_keys).toEqual([k2015, k2023])

    // Le sujet change mais garde la Meunerie : la selection survit au menage.
    mc.setMainZoneWindowSubject('w_1', { kind: 'elements', ids: ['meunerie'], keys: ['meunerie'] })
    expect(mc.main_zone_selected_pane_keys).toEqual([k2015, k2023])
    expect(mc.main_zone_active_pane_key).toBe(k2023)
  })
})
