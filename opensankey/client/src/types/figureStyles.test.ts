import { Class_ApplicationData } from './ApplicationData'
import { representation_registry } from '../Representations/RepresentationRegistry'

/**
 * os#1418 - REGLER UNE FIGURE N EST PAS REGLER SA NATURE.
 *
 * Le defaut par nature de os#1394 s ecrivait tout seul : regler une etoile devenait, sans que
 * rien ne le dise, le reglage de toutes les etoiles a venir, et l auteur ne le decouvrait qu en
 * ouvrant la suivante. Arbitrage Julien du 16/09/2026 : trois portees, et l ecriture du style
 * n a lieu que dans la troisieme.
 *
 * Ce fichier remplace representationDefaults.test.ts, qui verifiait l ancienne regle.
 */

const NATURE = 'test.figure.star'

// Une nature de TEST, declaree comme une vraie : trois attributs, un par sorte. C est la sorte
// qui decide ce qui entre dans un style, et il faut donc les trois pour l eprouver.
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
    },
    descriptor: {
      default: undefined,
      type: () => undefined,
      category: 'figure',
      labels: {
        en: 'Axis', fr: 'Axe', es: 'Eje', de: 'Achse',
        it: 'Asse', 'zh-CN': '轴', ja: '軸'
      },
      tooltips: {
        en: 'Decomposition axis', fr: 'Axe de decomposition', es: 'Eje de descomposicion',
        de: 'Zerlegungsachse', it: 'Asse di scomposizione', 'zh-CN': '分解轴', ja: '分解軸'
      },
      sort: 'navigation'
    }
  },
  draw: () => undefined
}

describe('os#1418 les styles de figure', () => {

  beforeAll(() => {
    // `as never` : le champ `attributes` arrive avec le lot 1 de os#1418 et ce test doit
    // compiler quel que soit l ordre des merges.
    representation_registry.register(TEST_ENTRY as never)
  })

  afterAll(() => {
    representation_registry.unregister(NATURE)
  })

  it('regler une vignette n ecrit PAS le style de la nature', () => {
    const mc = new Class_ApplicationData(false).menu_configuration
    const id = mc.openMainZoneWindow({ kind: 'node', id: 'n1' }, NATURE)
    mc.setMainZonePaneOptions(id, 'p1', { value_mode: 'normalized' })

    // La vignette dit ce qu on lui a dit...
    expect(mc.mainZonePaneOptionsOf(id, 'p1').value_mode).toBe('normalized')
    // ... et le style de la nature n a pas bouge d un pouce (valeur d usine).
    expect(mc.representationStyleOptions(NATURE).value_mode).toBe('percent')
    expect(mc.figureStylesToJSON()).toBeUndefined()
  })

  it('le style regle les figures qui ne surchargent rien, pas celles qui surchargent', () => {
    const mc = new Class_ApplicationData(false).menu_configuration
    const id = mc.openMainZoneWindow({ kind: 'elements', ids: ['n1', 'n2'], keys: ['n1', 'n2'] }, NATURE)
    mc.setMainZonePaneOptions(id, 'n1', { value_mode: 'value' })

    mc.setRepresentationStyleOptions(NATURE, { value_mode: 'normalized' })

    expect(mc.mainZonePaneOptionsOf(id, 'n1').value_mode).toBe('value')
    expect(mc.mainZonePaneOptionsOf(id, 'n2').value_mode).toBe('normalized')
  })

  it('un style REFUSE ce qui nomme un objet du sujet ou un axe', () => {
    const mc = new Class_ApplicationData(false).menu_configuration
    const refused = mc.setRepresentationStyleOptions(NATURE, {
      value_mode: 'value',
      normalize_link_id: 'flux_de_n1',
      descriptor: { decompose: { kind: 'outputs' } }
    })

    expect(refused.sort()).toEqual(['descriptor', 'normalize_link_id'])
    const style = mc.representationStyleOptions(NATURE)
    expect(style.value_mode).toBe('value')
    expect(style.normalize_link_id).toBeUndefined()
    expect(style.descriptor).toBeUndefined()
  })

  it('une fenetre ouverte APRES suit le style', () => {
    const mc = new Class_ApplicationData(false).menu_configuration
    mc.setRepresentationStyleOptions(NATURE, { value_mode: 'value' })

    const id = mc.openMainZoneWindow({ kind: 'node', id: 'n9' }, NATURE)
    expect(mc.mainZonePaneOptionsOf(id, 'n9').value_mode).toBe('value')
  })

  it('poser la valeur que le style dit deja ne cree pas de surcharge', () => {
    // C est `shouldSaveAttribute` des elements : une figure reglee « comme son style » continue
    // de le suivre quand il change, au lieu d en avoir fige une copie.
    const mc = new Class_ApplicationData(false).menu_configuration
    mc.setRepresentationStyleOptions(NATURE, { value_mode: 'value' })
    const id = mc.openMainZoneWindow({ kind: 'node', id: 'n1' }, NATURE)

    mc.setMainZonePaneOptions(id, 'n1', { value_mode: 'value' })
    expect(mc.figureOf(id, 'n1').isAttributeExplicit('value_mode')).toBe(false)

    mc.setRepresentationStyleOptions(NATURE, { value_mode: 'normalized' })
    expect(mc.mainZonePaneOptionsOf(id, 'n1').value_mode).toBe('normalized')
  })

  it('figure_styles est une cle ADDITIVE, et se relit a l identique', () => {
    const mc = new Class_ApplicationData(false).menu_configuration
    expect(mc.figureStylesToJSON()).toBeUndefined()

    mc.setRepresentationStyleOptions(NATURE, { value_mode: 'value' })
    const json = mc.figureStylesToJSON()
    expect(json).toEqual({ [NATURE]: { default: { attributes: { value_mode: 'value' } } } })

    const relu = new Class_ApplicationData(false).menu_configuration
    relu.figureStylesFromJSON(json)
    expect(relu.representationStyleOptions(NATURE).value_mode).toBe('value')
    expect(relu.figureStylesToJSON()).toEqual(json)
  })

  it('representationDefaultOptions reste un alias du style default', () => {
    const mc = new Class_ApplicationData(false).menu_configuration
    mc.setRepresentationStyleOptions(NATURE, { value_mode: 'normalized' })
    expect(mc.representationDefaultOptions(NATURE)).toEqual(mc.representationStyleOptions(NATURE))
  })
})
