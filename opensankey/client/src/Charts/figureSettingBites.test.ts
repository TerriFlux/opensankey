// os#1481 — CHAQUE REGLAGE OFFERT MORD-IL SUR LE DESSIN ? La question posee a TOUS, d un coup.
//
// Julien, apres avoir liste cinq reglages inertes sur une couronne : « on repart comme d hab, ou je
// te dis les choses une par une, au lieu de faire en sorte que ce soit une methode systematique
// pour faire tout d un coup juste. C est comme si tu ne verifiais pas que les attributs existants
// et visibles ont un code correspondant sur la figure concernee. Et vice versa. »
//
// Ce fichier est cette methode. Il ne teste AUCUN reglage en particulier : il les pose tous, l un
// apres l autre, redessine, et regarde si le DOM bouge. Ce qui ne bouge pas est un bouton mort.
//
// ── LE CLIQUET ───────────────────────────────────────────────────────────────────────────────
//
// La liste des inertes est GELEE ci-dessous, comme la dette i18n : elle ne peut que DECROITRE. Un
// reglage neuf qui n agit pas fait rougir la suite le jour ou on l ajoute, et non le jour ou Julien
// le trouve. C est tout ce que ce lot change de durable.
//
// ⚠️ CE QUE JSDOM NE VOIT PAS. Il ne met rien en page : un reglage dont le seul effet est une
// MESURE — « masquer si ca depasse », le retour a la ligne, la largeur de boite — ne bougera rien
// ici alors qu il agit a l ecran. Ces cles sont NOMMEES plus bas, pas devinees, et elles sortent du
// compte au lieu d etre comptees mortes.

import { drawDonutChart, drawBarChart } from './NodeStatsCharts'
import { drawSunburstChart } from './SunburstChart'
import { partAspectResolver } from './partAspect'
import type { Type_FigurePart } from './partAspect'
import { BARS_STYLE_DEFAULTS, DONUT_STYLE_DEFAULTS } from './figureChartStyle'
import { ALL_ATTRIBUTES_CONFIG } from '../Elements/ElementsAttributesConfig'
import { attributeAppliesToElements } from '../Elements/attributeScope'
import { Class_ApplicationData } from '../types/ApplicationData'
import { buildParts } from '../Representations/parts/buildParts'
import type { Type_FigureParts } from '../Representations/parts/buildParts'
import {
  givePlainDrawingEnvironment, sizedContainer, plainSunburstTree
} from './figureDomHarness.test-utils'
import { measureBites } from './figureSettingBites.test-utils'
import BASELINE from './figureSettingBites.baseline.json'

givePlainDrawingEnvironment()

const PARTS = [
  { id: 'a', label: 'Ble', value: 6 },
  { id: 'b', label: 'Mais', value: 4 }
]

/**
 * CE QUE JSDOM NE PEUT PAS MESURER, nomme une fois.
 *
 * Toutes ces cles ont en commun de n agir qu APRES une mise en page : `getBBox` rend une boite
 * vide ici, donc rien ne depasse jamais, rien ne revient a la ligne, et un cartouche ne se pose
 * pas. Elles se verifient a l ecran, et c est dit plutot que compte faux.
 */
const HORS_PORTEE_DE_JSDOM = [
  'name_label_prune_if_unfitting', 'value_label_prune_if_unfitting',
  'name_label_wrap_long_words', 'value_label_wrap_long_words',
  'name_label_box_width', 'value_label_box_width',
  // Le cartouche se mesure sur le texte pose (`drawFigureLabelBackground` rend la main sur une
  // boite vide) : toutes ses cles sont dans le meme cas.
  'name_label_background_visible', 'name_label_background_color',
  'name_label_background_opacity', 'name_label_background_border_visible',
  'name_label_background_border_color', 'name_label_background_border_thickness',
  'name_label_background_border_radius', 'name_label_background_color_visible',
  'name_label_background_border_color_sustainable', 'name_label_background_shadow_visible',
  'name_label_background_type', 'name_label_background_min_width',
  'name_label_background_min_height', 'name_label_background_width_locked',
  'name_label_background_box_width', 'name_label_background_border_dashed',
  'name_label_background_margin_left', 'name_label_background_margin_right',
  'name_label_background_margin_top', 'name_label_background_margin_bottom',
  'value_label_background_visible', 'value_label_background_color',
  'value_label_background_opacity', 'value_label_background_border_visible',
  'value_label_background_border_color', 'value_label_background_border_thickness',
  'value_label_background_border_radius', 'value_label_background_color_visible',
  'value_label_background_border_color_sustainable', 'value_label_background_shadow_visible',
  'value_label_background_type', 'value_label_background_min_width',
  'value_label_background_min_height', 'value_label_background_width_locked',
  'value_label_background_box_width', 'value_label_background_border_dashed',
  'value_label_background_margin_left', 'value_label_background_margin_right',
  'value_label_background_margin_top', 'value_label_background_margin_bottom'
]

/** Des parts REELLES, dans une figure de cette nature. */
const figureDe = (nature: string): Type_FigureParts => {
  const doc = new Class_ApplicationData(false)
  doc.drawing_area.bypass_redraws = true
  doc.drawing_area.sankey.icon_catalog = { epi: 'M0 0 L10 10 Z' }
  return buildParts(doc, PARTS, undefined, nature)
}

/**
 * LA FIGURE EST ALLUMEE AU MAXIMUM, et il le faut : la moitie des cles d une etiquette ne peut agir
 * que si l etiquette s ecrit. Les mesurer sur une figure qui n affiche rien les compterait toutes
 * mortes, et le test dirait le contraire de la verite.
 */
const allume = <T extends object>(base: T): T => ({
  ...base,
  name_label_is_visible: true,
  value_label_is_visible: true,
  legend_visible: true,
  name_label_callout: false
})

/** Dessine dans un conteneur neuf et rend le DOM produit. */
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

/** Les trois natures, pretes a se faire interroger. */
const sondes = () => {
  const donut = figureDe('donut')
  const bars = figureDe('bars')
  const disque = figureDe('sunburst')
  const donut_style = allume(DONUT_STYLE_DEFAULTS)
  const bars_style = allume(BARS_STYLE_DEFAULTS)
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

/** Les cles que l inspecteur propose sur une part, hors celles que jsdom ne peut pas juger. */
const clesOffertes = (part: unknown): string[] =>
  Object.keys(ALL_ATTRIBUTES_CONFIG)
    .filter(k => attributeAppliesToElements([part], k))
    .filter(k => !HORS_PORTEE_DE_JSDOM.includes(k))

afterEach(() => { document.body.innerHTML = '' })

describe('os#1481 tout reglage offert a une part MORD sur le dessin', () => {

  sondes().forEach(sonde => {
    it(`la ${sonde.nature} : aucun bouton mort hors de la liste gelee`, () => {
      const part = sonde.parts['a']
      const cles = clesOffertes(part)

      // CONTRE-VERIFICATION D ABORD : sans cela, un dessin vide rendrait TOUT inerte et le test
      // dirait « rien ne mord » au lieu de « rien n est dessine ».
      expect(dom(sonde.draw).length).toBeGreaterThan(200)
      // Le seuil dit seulement « on interroge un jeu substantiel ». Il a baisse a os#1483, quand la
      // portee par nature de FIGURE a retire d un coup une vingtaine de reglages qui n avaient pas
      // de sens dans un rond — c est une bonne nouvelle, pas une regression.
      expect(cles.length).toBeGreaterThan(35)

      const resultat = measureBites(
        { nature: sonde.nature, parts: sonde.parts, probe_id: 'a', draw: sonde.draw },
        cles,
        dom
      )

      // eslint-disable-next-line no-console
      console.log(
        `[bites] ${sonde.nature} : ${resultat.bites.length} mordent, ` +
        `${resultat.inert.length} inertes, ${resultat.unmeasurable.length} non mesurables\n` +
        `  INERTES: ${resultat.inert.join(' ')}\n` +
        `  NON MESURABLES: ${resultat.unmeasurable.join(' ')}`
      )

      // ── LE CLIQUET ─────────────────────────────────────────────────────────────────────────
      //
      // La dette est GELEE dans `figureSettingBites.baseline.json`, comme celle de `check:i18n`.
      // Deux regles, et elles sont dissymetriques expres :
      //
      //   UN INERTE NOUVEAU FAIT ROUGIR. C est le point du lot : un reglage qu on offre sans le
      //   dessiner se voit le jour ou on l offre, et non le jour ou Julien le trouve a l ecran.
      //
      //   UN INERTE QUI DISPARAIT NE FAIT PAS ROUGIR, il demande seulement de regeler la liste.
      //   Le message le dit, avec la commande.
      const gelee: string[] = (BASELINE as { [k: string]: string[] })[sonde.nature] ?? []
      const nouveaux = resultat.inert.filter(k => !gelee.includes(k))
      expect([`${sonde.nature} : reglages OFFERTS que le trace ignore`, nouveaux])
        .toEqual([`${sonde.nature} : reglages OFFERTS que le trace ignore`, []])

      const reparees = gelee.filter(k => !resultat.inert.includes(k))
      if (reparees.length > 0) {
        // eslint-disable-next-line no-console
        console.log(
          `[bites] ${sonde.nature} : ${reparees.length} reglage(s) REPARE(S) — ${reparees.join(' ')}\n` +
          '  Regeler la liste : `node scripts/freeze_figure_bites.mjs` (ou la refaire a la main).'
        )
      }
      expect(resultat.bites.length).toBeGreaterThan(0)
    })
  })
})
