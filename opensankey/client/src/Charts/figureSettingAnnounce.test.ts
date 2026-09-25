// 25/09/2026 — CE QUE LE PANNEAU ANNONCE EST-IL CE QUE LE TRACE FAIT ? La question posee a TOUS.
//
// Julien, excede, devant l orientation d un libelle de couronne affichee « Radiale » au-dessus d un
// texte horizontal : « je sais plus quoi faire, ca fait cinquante fois que je te le dis. Reprends
// le design s il faut, mais fais quelque chose : c est un mecanisme general qui doit marcher
// systematiquement pour toutes les figures, tous les elements. »
//
// Il a raison trois fois, et c est mesurable : l angle d une etiquette de barre (os#1505), le fond
// d un cartouche (os#1504), l orientation d un secteur — trois clefs, un seul defaut, trois
// allers-retours ou il a du me le dire.
//
// ── POURQUOI OS#1481 NE POUVAIT PAS L ATTRAPER ───────────────────────────────────────────────
//
// Le harnais des « bites » demande si un reglage MORD. L orientation mord parfaitement : poser « le
// long de l arc » fait tourner le texte. Ce qui est faux, c est ce que le panneau annonce AVANT
// qu on y touche. Les deux sens de la bijection d os#1481 sont donc verts pendant que l ecran ment.
//
// ── LE TROISIEME SENS ────────────────────────────────────────────────────────────────────────
//
//   ECRIRE SUR LA PART LA VALEUR QUE LE PANNEAU AFFICHE NE DOIT RIEN CHANGER AU DESSIN.
//
// Si le panneau dit vrai, l ecrire est un geste sans effet. S il ment, le dessin bouge — et c est
// mot pour mot le « si on edite ca marche, mais au debut ca ne correspond pas » de Julien.
//
// Aucune table de correspondance entre une cle et le champ d aspect qu elle nourrit : ce serait une
// troisieme verite a tenir, donc une quatrieme occasion de diverger. On compare deux DOM.

import { drawDonutChart, drawBarChart } from './NodeStatsCharts'
import { drawSunburstChart } from './SunburstChart'
import { partAspectResolver } from './partAspect'
import type { Type_FigurePart } from './partAspect'
import { BARS_STYLE_DEFAULTS, DONUT_STYLE_DEFAULTS } from './figureChartStyle'
import { ALL_ATTRIBUTES_CONFIG } from '../Elements/ElementsAttributesConfig'
import { attributeAppliesToElements } from '../Elements/attributeScope'
import { figureStyleDefault } from '../Elements/figureNatureDefaults'
import { Class_ApplicationData } from '../types/ApplicationData'
import { buildParts } from '../Representations/parts/buildParts'
import type { Type_FigureParts } from '../Representations/parts/buildParts'
import {
  givePlainDrawingEnvironment, sizedContainer, plainSunburstTree
} from './figureDomHarness.test-utils'
import { measureAnnounce } from './figureSettingBites.test-utils'
import ANNOUNCE_BASELINE from './figureSettingAnnounce.baseline.json'

givePlainDrawingEnvironment()

const PARTS = [
  { id: 'a', label: 'Ble', value: 6 },
  { id: 'b', label: 'Mais', value: 4 }
]

const figureDe = (nature: string): Type_FigureParts => {
  const doc = new Class_ApplicationData(false)
  doc.drawing_area.bypass_redraws = true
  doc.drawing_area.sankey.icon_catalog = { epi: 'M0 0 L10 10 Z' }
  return buildParts(doc, PARTS, undefined, nature)
}

/** La figure allumee au maximum : une cle d etiquette ne peut mentir que si l etiquette s ecrit. */
const allume = <T extends object>(base: T): T => ({
  ...base,
  name_label_is_visible: true,
  value_label_is_visible: true,
  legend_visible: true,
  name_label_callout: false
})

const dom = (draw: (c: HTMLElement) => void): string => {
  const el = sizedContainer()
  draw(el)
  const html = el.innerHTML
  el.remove()
  return html
}

const resolveur = (figure: Type_FigureParts, base: object) =>
  partAspectResolver(
    base as never, figure.by_id as unknown as { [id: string]: Type_FigurePart }
  )

/**
 * LE STYLE DE LA FIGURE, POSE SUR SES PARTS — comme `figurePartsWiring` le fait en vrai.
 *
 * Sans lui la sonde mesurerait un monde ou aucune figure n a de reglages, et declarerait menteuses
 * toutes les cles que la regle generale repare. Le harnais doit voir ce que l ecran voit.
 */
const stampe = (figure: Type_FigureParts, style: object): void => {
  Object.values(figure.by_id).forEach(part => {
    (part as unknown as { [k: string]: unknown })['figure_style'] = style
  })
}

const sondes = () => {
  const donut = figureDe('donut')
  const bars = figureDe('bars')
  const disque = figureDe('sunburst')
  const donut_style = allume(DONUT_STYLE_DEFAULTS)
  const bars_style = allume(BARS_STYLE_DEFAULTS)
  stampe(donut, donut_style)
  stampe(bars, bars_style)
  return [
    {
      nature: 'couronne',
      parts: donut.by_id,
      draw: (c: HTMLElement) => drawDonutChart(c, PARTS, {
        style: donut_style as never, part_aspect: resolveur(donut, donut_style)
      })
    },
    {
      nature: 'barres',
      parts: bars.by_id,
      draw: (c: HTMLElement) => drawBarChart(c, PARTS, {
        style: bars_style as never, part_aspect: resolveur(bars, bars_style)
      })
    },
    {
      nature: 'disque',
      parts: disque.by_id,
      draw: (c: HTMLElement) => drawSunburstChart(c, plainSunburstTree(PARTS), {
        parts: disque.by_id as never,
        style: { labels_mode: 'always', value_visible: true, legend_visible: true }
      })
    }
  ]
}

/**
 * CE QUE LE PANNEAU AFFICHE, lu comme il le lit lui-meme.
 *
 * `getConfigValues` resout dans cet ordre exact (cf. son accesseur) : le defaut de la FIGURE
 * d abord, puis la valeur de l element, puis la valeur d usine du catalogue. On refait les trois
 * plutot que d appeler `getConfigValues`, qui travaille par FAMILLE prefixee et non par cle.
 */
const annonce = (part: Type_FigurePart, key: string): unknown => {
  const figure_default = figureStyleDefault(part, key)
  if (figure_default !== undefined) return figure_default
  const own = Reflect.get(part as object, key)
  return own ?? ALL_ATTRIBUTES_CONFIG[key as keyof typeof ALL_ATTRIBUTES_CONFIG]?.default
}

/** Les cles que l inspecteur propose sur une part de cette figure. */
const clesOffertes = (part: unknown): string[] =>
  Object.keys(ALL_ATTRIBUTES_CONFIG).filter(k => attributeAppliesToElements([part], k))

afterEach(() => { document.body.innerHTML = '' })

describe('tout reglage offert ANNONCE ce que le trace fait', () => {

  sondes().forEach(sonde => {
    it(`la ${sonde.nature} : le panneau ne ment sur rien hors de la liste gelee`, () => {
      const part = sonde.parts['a']
      const cles = clesOffertes(part)

      // CONTRE-VERIFICATION D ABORD : un dessin vide rendrait tout « honnete » par immobilite.
      expect(dom(sonde.draw).length).toBeGreaterThan(200)
      expect(cles.length).toBeGreaterThan(35)

      const resultat = measureAnnounce(
        () => {
          const neuve = sondes().find(s2 => s2.nature === sonde.nature)!
          return { nature: neuve.nature, parts: neuve.parts, probe_id: 'a', draw: neuve.draw }
        },
        cles,
        dom,
        annonce
      )

      // eslint-disable-next-line no-console
      console.log(
        `[annonce] ${sonde.nature} : ${resultat.honest.length} honnetes, ` +
        `${resultat.lying.length} MENTEUSES, ${resultat.unmeasurable.length} sans annonce\n` +
        `  MENTEUSES: ${resultat.lying.join(' ')}`
      )

      // LE CLIQUET, meme regle qu os#1481 : une menteuse NOUVELLE fait rougir, une menteuse
      // reparee demande seulement de regeler la liste.
      // `_notes` porte les RAISONS de chaque gel, et n est pas une liste de cles : d ou le passage
      // par `unknown`. Les raisons vivent dans le fichier gele plutot qu ici, pour etre lues le
      // jour ou quelqu un essaie de degeler une ligne.
      const gelee: string[] =
        (ANNOUNCE_BASELINE as unknown as { [k: string]: string[] })[sonde.nature] ?? []
      const nouvelles = resultat.lying.filter(k => !gelee.includes(k))
      expect([`${sonde.nature} : le panneau annonce autre chose que le dessin`, nouvelles])
        .toEqual([`${sonde.nature} : le panneau annonce autre chose que le dessin`, []])

      const reparees = gelee.filter(k => !resultat.lying.includes(k))
      if (reparees.length > 0) {
        // eslint-disable-next-line no-console
        console.log(
          `[annonce] ${sonde.nature} : ${reparees.length} reparee(s) — ${reparees.join(' ')}\n` +
          '  Regeler la liste dans figureSettingAnnounce.baseline.json.'
        )
      }
    })
  })
})
