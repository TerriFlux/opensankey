// os#1477 — LE TITRE S ECRIT PAREIL SUR LES TROIS NATURES, ET IL N EST PLUS SEUL.
//
// Julien : « elles ont toutes un titre et une legende, et le code devrait implementer de la meme
// maniere. Elles devraient pouvoir avoir aussi des zones de texte et autres elements
// additionnels. »
//
// os#1449 a repondu a ca — pour le DISQUE seulement. La couronne et les barres montaient leur titre
// par un traceur qui ne savait poser qu un bloc et n en portait que cinq reglages sur onze : pas
// d italique, pas de police, pas d encre, pas d alignement, pas de retour a la ligne, et aucune
// zone de texte. Six cles communes etaient tenues hors du socle a cause de ca.
//
// CE FICHIER PART DU SAC DE REGLAGES, comme l auteur le remplit dans l inspecteur, et va jusqu au
// DOM. Un test qui appellerait `figureTextsOf` puis verifierait son resultat ne dirait rien du
// dessin — c est la lecon d os#1465, payee trois fois.

import { drawDonutChart, drawBarChart } from './NodeStatsCharts'
import { drawSunburstChart } from './SunburstChart'
import { figureTextsOf, DONUT_STYLE_DEFAULTS, BARS_STYLE_DEFAULTS } from './figureChartStyle'
import {
  givePlainDrawingEnvironment, sizedContainer, plainSunburstTree
} from './figureDomHarness.test-utils'

givePlainDrawingEnvironment()

const PARTS = [
  { id: 'a', label: 'Ble', value: 6 },
  { id: 'b', label: 'Mais', value: 4 }
]

/** Ce que l auteur a regle : un titre habille, et une mention sous le dessin. */
const REGLAGES = {
  title_visible: true,
  title_text: 'Recolte 2026',
  title_italic: true,
  title_color: '#B7410E',
  title_align: 'left',
  title_font_family: 'Georgia',
  title_font_size: 21,
  text_zones: [{ text: 'Source : douanes', position: 'bottom', italic: true }]
}

const textes = () => figureTextsOf(REGLAGES, 'Le sujet')

/** Les trois natures, dessinees pour de vrai, chacune sur son conteneur. */
const dessine = (nature: 'disque' | 'couronne' | 'barres'): HTMLElement => {
  const el = sizedContainer()
  if (nature === 'disque') {
    drawSunburstChart(el, plainSunburstTree(PARTS), { texts: textes })
  } else if (nature === 'couronne') {
    drawDonutChart(el, PARTS, {
      style: DONUT_STYLE_DEFAULTS, texts: textes, title_fallback: 'Le sujet'
    })
  } else {
    drawBarChart(el, PARTS, {
      style: BARS_STYLE_DEFAULTS, texts: textes, title_fallback: 'Le sujet'
    })
  }
  return el
}

const titreDe = (el: HTMLElement): HTMLElement => {
  const t = el.querySelector<HTMLElement>('.figure_title')
  if (!t) throw new Error('aucun .figure_title dans le dessin')
  return t
}

afterEach(() => { document.body.innerHTML = '' })

describe('os#1477 le titre porte toute sa mise en forme sur les trois natures', () => {

  ;(['disque', 'couronne', 'barres'] as const).forEach(nature => {
    it(`la ${nature} ecrit son titre en italique, dans sa police et son encre`, () => {
      const el = dessine(nature)

      const titre = titreDe(el)
      expect(titre.textContent).toBe('Recolte 2026')
      // LES CINQ CLES QUI ATTENDAIENT (os#1469 les tenait hors du socle faute de savoir les
      // dessiner ici) : italique, encre, alignement, police, et le retour a la ligne plus bas.
      expect(titre.style.fontStyle).toBe('italic')
      expect(titre.style.color).toBe('rgb(183, 65, 14)')
      expect(titre.style.textAlign).toBe('left')
      expect(titre.style.fontFamily).toBe('Georgia')
      // Et celles qui etaient deja servies, qui ne bougent pas.
      expect(titre.style.fontSize).toBe('21px')
    })

    it(`la ${nature} pose AUSSI la zone de texte ajoutee, sous son dessin`, () => {
      // Le titre n est plus un cas a part : c est la zone n° 0. La preuve qu il n est plus seul.
      const el = dessine(nature)

      const blocs = Array.from(el.querySelectorAll<HTMLElement>('.figure_text'))
      expect(blocs.map(b => b.textContent)).toEqual(['Recolte 2026', 'Source : douanes'])
      // « Dessous » veut dire APRES le corps du dessin dans le document, et c est ce qui le place.
      const corps = el.querySelector('.figure_body')
      expect(corps).not.toBeNull()
      expect(corps!.compareDocumentPosition(blocs[1]) & Node.DOCUMENT_POSITION_FOLLOWING)
        .toBeTruthy()
      expect(corps!.compareDocumentPosition(blocs[0]) & Node.DOCUMENT_POSITION_PRECEDING)
        .toBeTruthy()
    })

    it(`la ${nature} dessine QUAND MEME : le texte prend sa hauteur, pas toute la place`, () => {
      // CONTRE-VERIFICATION. Une zone de texte qui mangerait le cadre ferait un test vert sur un
      // dessin vide — exactement le piege de jsdom qu on a deja paye une fois.
      const el = dessine(nature)

      const dessins = nature === 'barres'
        ? el.querySelectorAll('rect[data-repr-kind="part"]')
        : el.querySelectorAll(nature === 'disque' ? 'path.sunburst_arc' : 'path.node_stats_arc')
      expect(dessins.length).toBe(2)
    })
  })

  it('un titre eteint ne pose RIEN, et le dessin garde tout le cadre', () => {
    // La garantie qui protege le parc : une figure enregistree sans titre se rouvre a l identique.
    const el = sizedContainer()

    drawDonutChart(el, PARTS, {
      style: DONUT_STYLE_DEFAULTS, texts: () => figureTextsOf({}, 'Le sujet')
    })

    expect(el.querySelectorAll('.figure_text').length).toBe(0)
    expect(el.querySelectorAll('.figure_titled').length).toBe(0)
    expect(el.querySelectorAll('path.node_stats_arc').length).toBe(2)
  })
})
