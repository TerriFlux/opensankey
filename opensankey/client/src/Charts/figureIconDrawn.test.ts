// os#1465 — L ICONE EST-ELLE DESSINEE ? LA QUESTION POSEE AU DOM, PAS AU RESOLVEUR.
//
// Julien, TROIS FOIS : « l icone ne marche toujours pas », puis « franchement t es lourd ».
//
// Il avait raison de s enerver. J ai corrige trois causes plausibles — le catalogue vide, la regle
// posee dans la mauvaise classe, la porte de l attribut — en verifiant chaque fois le RESOLVEUR :
// « l aspect rend-il bien un chemin ? ». Il le rendait. Ce que je n avais jamais verifie, c est que
// le TRACE en fasse un element dans le document.
//
// Un test de resolveur ne dit rien du dessin. Celui-ci dessine pour de vrai et cherche le
// pictogramme dans le DOM.
//
// ── DEUX PIEGES DE JSDOM, ET ILS ONT FAILLI RENDRE CE FICHIER INUTILE ────────────────────────
//
// 1. PAS DE MISE EN PAGE. Un conteneur y mesure zero par zero : le trace ne dessine alors AUCUN
//    arc, et un test qui cherche une icone passe au vert pour la mauvaise raison — la premiere
//    version de ce fichier l a fait. D ou la taille posee a la main, et la contre-verification qui
//    exige des arcs AVANT de chercher l icone.
// 2. PAS DE GEOMETRIE SVG. `d3-zoom` lit `viewBox` / `width` / `height` au sens de l IDL, que jsdom
//    declare sans les implementer : toute figure qui se zoome jetait avant d avoir dessine un arc,
//    et le SUNBURST etait repute non testable ici.
//
//    ⚠️ CE N EST PLUS VRAI (os#1476). Trois accesseurs suffisent a lever ca
//    (`figureDomHarness.test-utils`), et le disque est desormais dessine pour de vrai, ici comme
//    dans `figurePartTextShared.test`. La limite qui reste est la mesure : `getBBox` rend une boite
//    vide, donc un cartouche ne se pose pas et une etiquette ne se tronque pas pour de bon.

import { drawDonutChart } from './NodeStatsCharts'
import { drawSunburstChart } from './SunburstChart'
import { Class_ApplicationData } from '../types/ApplicationData'
import { buildParts } from '../Representations/parts/buildParts'
import { givePlainDrawingEnvironment, plainSunburstTree } from './figureDomHarness.test-utils'

givePlainDrawingEnvironment()

const CHEMIN = 'M0 0 L10 10 Z'

/** Un document dont le catalogue connait un pictogramme, comme un vrai en connait. */
const source = () => {
  const doc = new Class_ApplicationData(false)
  doc.drawing_area.bypass_redraws = true
  doc.drawing_area.sankey.icon_catalog = { epi: CHEMIN }
  return doc
}

const PARTS = [
  { id: 'a', label: 'Ble', value: 6 },
  { id: 'b', label: 'Mais', value: 4 }
]

/** Un conteneur QUI A UNE TAILLE (cf. le piege 1 en tete de fichier). */
const conteneur = () => {
  const el = document.createElement('div')
  Object.defineProperty(el, 'clientWidth', { value: 400, configurable: true })
  Object.defineProperty(el, 'clientHeight', { value: 400, configurable: true })
  el.getBoundingClientRect = () => ({
    width: 400, height: 400, top: 0, left: 0, right: 400, bottom: 400, x: 0, y: 0,
    toJSON: () => ({})
  }) as DOMRect
  document.body.appendChild(el)
  return el
}

describe('os#1465 le pictogramme dune part arrive jusquau dessin', () => {

  afterEach(() => { document.body.innerHTML = '' })

  it('la couronne peint le chemin que laspect lui donne', () => {
    const el = conteneur()

    drawDonutChart(el, PARTS, {
      part_aspect: (id: string) => id === 'a' ? { icon_path: CHEMIN } : undefined
    })

    // CONTRE-VERIFICATION D ABORD : si rien n est dessine, ce test ne prouve rien.
    expect(el.querySelectorAll('path.node_stats_arc').length).toBeGreaterThan(0)
    const icons = el.querySelectorAll('svg.node_stats_arc_icon')
    expect(icons.length).toBe(1)
    expect(icons[0].querySelector('path')?.getAttribute('d')).toBe(CHEMIN)
  })

  it('et rien quand laspect nen donne pas', () => {
    // La contre-epreuve : une couronne enregistree ne gagne pas de pictogramme.
    const el = conteneur()

    drawDonutChart(el, PARTS, {})

    expect(el.querySelectorAll('path.node_stats_arc').length).toBeGreaterThan(0)
    expect(el.querySelectorAll('svg.node_stats_arc_icon').length).toBe(0)
  })

  it('LE DISQUE AUSSI, et c est ce qui manquait a ce fichier', () => {
    // os#1476 — La moitie sunburst se verifiait au resolveur faute de pouvoir dessiner ici. C est
    // precisement le genre de verification qui m a fait dire trois fois « c est corrige » alors que
    // l ecran ne montrait rien. Elle se pose maintenant au DOM, comme celle de la couronne.
    const figure = buildParts(source(), PARTS, undefined, 'sunburst')
    const part = figure.by_id['a']
    part.icon_is_visible = true
    part.icon_icon_name = 'epi'
    const el = conteneur()

    drawSunburstChart(el, plainSunburstTree(PARTS), { parts: figure.by_id as never })

    expect(el.querySelectorAll('path.sunburst_arc').length).toBe(2)
    const icons = el.querySelectorAll('svg.sunburst_arc_icon')
    expect(icons.length).toBe(1)
    expect(icons[0].querySelector('path')?.getAttribute('d')).toBe(CHEMIN)
  })

  it('une part qui NOMME son icone la voit peinte : la chaine entiere', () => {
    // LE VRAI SUJET. Les deux cas ci-dessus verifient le trace ; celui-ci part de ce que
    // l utilisateur fait — activer l icone, la choisir — et va jusqu au DOM, en passant par la
    // resolution du chemin dans le catalogue du document.
    const figure = buildParts(source(), PARTS, undefined, 'donut')
    const part = figure.by_id['a']
    part.icon_is_visible = true
    part.icon_icon_name = 'epi'
    const el = conteneur()

    drawDonutChart(el, PARTS, {
      part_aspect: (id: string) => {
        const p = figure.by_id[id]
        if (!p || !p.isAttributeOverloaded('icon_icon_name')) return undefined
        const chemin = p.sankey.getIconFromCatalog(p.icon_icon_name)
        return chemin ? { icon_path: chemin } : undefined
      }
    })

    expect(el.querySelectorAll('svg.node_stats_arc_icon').length).toBe(1)
  })
})
