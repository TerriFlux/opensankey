// os#1487 — LE POURCENTAGE EST UNE FACON D ECRIRE LA VALEUR, PAS UNE LIGNE DE PLUS.
//
// Julien, capture a l appui : « ce que je ne comprends pas, c est que sur la couronne on a le %
// quoi qu il arrive. Or pour moi c est l affichage de la valeur en unite pourcentage. »
//
// Il avait « Visible » DECOCHE sur la Valeur, et le 13 % s ecrivait quand meme. Les deux lignes
// etaient independantes : l une regardait la visibilite, l autre non. Et comme `value_label_percent`
// vaut « total » par defaut sur une couronne, TOUTE couronne ecrivait son pourcentage — y compris
// celles dont l auteur avait masque la valeur.
//
// ⚠️ LE HARNAIS D os#1481 NE POUVAIT PAS VOIR CA NON PLUS. Basculer `value_label_is_visible`
// changeait bien le DOM (la valeur chiffree disparaissait), donc la cle « mordait » : il serait
// passe au vert sur une couronne qui affiche un pourcentage qu on lui a demande de cacher. Une
// mesure qui compare deux dessins sans les LIRE ne voit pas ce qui reste a l ecran.

import { drawDonutChart } from './NodeStatsCharts'
import { drawSunburstChart } from './SunburstChart'
import { DONUT_STYLE_DEFAULTS } from './figureChartStyle'
import {
  givePlainDrawingEnvironment, sizedContainer, plainSunburstTree
} from './figureDomHarness.test-utils'

givePlainDrawingEnvironment()

const PARTS = [
  { id: 'a', label: 'Ble', value: 6 },
  { id: 'b', label: 'Mais', value: 2 }
]

/** Tout le texte que la figure a ecrit, colle bout a bout. */
const texteDe = (el: HTMLElement, classe: string): string =>
  Array.from(el.querySelectorAll(classe)).map(t => t.textContent ?? '').join(' ')

const couronne = (value_visible: boolean, percent: string): string => {
  const el = sizedContainer()
  drawDonutChart(el, PARTS, {
    style: {
      ...DONUT_STYLE_DEFAULTS,
      name_label_is_visible: true,
      value_label_is_visible: value_visible,
      value_label_percent: percent
    } as never
  })
  const out = texteDe(el, 'text.node_stats_pct')
  el.remove()
  return out
}

const disque = (value_visible: boolean, percent: string): string => {
  const el = sizedContainer()
  drawSunburstChart(el, plainSunburstTree(PARTS), {
    style: { labels_mode: 'always', value_visible, label_percent: percent } as never
  })
  const out = texteDe(el, 'text.sunburst_arc_label')
  el.remove()
  return out
}

afterEach(() => { document.body.innerHTML = '' })

describe('os#1487 le pourcentage ne s ecrit pas quand la valeur est masquee', () => {

  it('LA COURONNE : valeur masquee, pourcentage demande — rien ne s ecrit', () => {
    // LE CAS DE JULIEN, a la lettre : « Visible » decoche, et le 13 % s affichait quand meme.
    const texte = couronne(false, 'total')

    expect(texte).not.toContain('%')
    // CONTRE-VERIFICATION : le NOM, lui, est bien la — sinon ce test passerait au vert sur une
    // figure qui n ecrit rien du tout.
    expect(texte).toContain('Ble')
  })

  it('LE DISQUE : le meme, et il avait le meme defaut', () => {
    const texte = disque(false, 'total')

    expect(texte).not.toContain('%')
    expect(texte).toContain('Ble')
  })

  it('valeur VISIBLE : la valeur et son pourcentage s ecrivent tous les deux', () => {
    // La garantie qui protege le parc : une couronne enregistree qui montrait « 6 75 % » continue.
    const texte = couronne(true, 'total')

    expect(texte).toContain('%')
    expect(texte).toContain('6')
  })

  it('valeur visible SANS pourcentage : le chiffre seul', () => {
    const texte = couronne(true, 'none')

    expect(texte).not.toContain('%')
    expect(texte).toContain('6')
  })
})
