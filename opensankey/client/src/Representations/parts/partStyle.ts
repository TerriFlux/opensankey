// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1449 — LE STYLE DES PARTS : le semer, et savoir quand il PARLE.
//
// « Pour éditer globalement on le fait par les styles » (Julien, 20/09). Les parts avaient un
// document et une cascade depuis os#1445, mais elles étaient toutes accrochées au `default_style`
// de ce document : l'onglet Styles de l'inspecteur n'avait donc aucun style de part à régler, et
// « toutes les parts d'un coup » restait impossible.
//
// LE PRÉCÉDENT SUIVI EST CELUI DE L'ÉTOILE : `buildStarDocument.seedUnitaryStyles` appelle
// `sankey.create_internal_style(id, elementStyleConfigs)` et s'arrête là. Un style interne n'est
// PAS pré-rempli (cf. `Class_ElementStyle`, branche `is_deletable`) : son sac ne contient que les
// clés déclarées, tout le reste se résout par la cascade. C'est ce qui interdit le `copyFrom` —
// il figerait chaque clé et l'inspecteur montrerait un liséré de surcharge partout.
//
// ── ET LA QUESTION QUI COMMANDE TOUT LE LOT : LA PORTE ────────────────────────────────────────
//
// Le tracé n'écoute une part que sur ce qu'elle DIT (`isAttributeOverloaded`, cf.
// `Charts/SunburstChart.sunburstPartStyle`) ; sur tout le reste c'est le réglage de la FIGURE qui
// tient, et c'est lui qui porte l'aspect de toutes les couronnes enregistrées. Or
// `Class_ProtoElement.isAttributeOverloaded` ne regarde que le sac PROPRE de l'élément : un style
// posé sur une part serait donc invisible au tracé, et « régler toutes les parts » ne changerait
// rien à l'écran.
//
// La porte s'ouvre donc (cf. `Class_PartElement.isAttributeOverloaded`) :
//
//   une part DIT une clé  =  son sac propre la porte
//                         OU un de SES styles la porte AU-DELÀ DE SON AMORCE
//
// Les deux restrictions sont ce qui protège le parc, et ni l'une ni l'autre n'est décorative :
//
//  1. JAMAIS LE STYLE PAR DÉFAUT. Lui seul est PRÉ-REMPLI des valeurs d'usine d'un ÉLÉMENT
//     (quatorze points, opacité 0,85, liséré noir). L'écouter ferait dire à chaque part tout
//     l'aspect d'un nœud, et toutes les couronnes du parc changeraient d'un coup — exactement le
//     défaut que l'étape 2 avait pris soin d'éviter.
//  2. AU-DELÀ DE SON AMORCE, et pas « dès qu'il la porte ». L'amorce d'un style de part EST
//     l'aspect d'usine d'une figure (`elementStyleConfigs[FigurePartStyle]`) : la tenir pour dite
//     écraserait le réglage que l'auteur a posé SUR SA FIGURE — une couronne réglée à quatorze
//     points repasserait à dix à la réouverture. Une amorce est donc muette par construction, et
//     c'est ce qui rend l'identité d'aspect vraie quel que soit son contenu.
//
// CE QUE CE LOT RÉPARE AU PASSAGE. La version héritée d'`isAttributeOverloaded` ne tient le sac
// propre d'un élément pour une surcharge que s'il DIFFÈRE du style résolu. Sur un nœud c'est sans
// effet — il rend la même valeur dans les deux cas. Sur une part, c'était un trou : ce qui attend
// derrière la porte fermée n'est pas son style mais le réglage de la FIGURE, qui peut dire autre
// chose. Cocher le liséré sur UN secteur restait donc sans effet dès que la valeur cochée était
// celle dont la part héritait. `Class_PartElement` lit son sac propre par simple présence.

import {
  elementStyleConfigs, figure_part_nature_styles, figure_part_styles, FigurePartStyle
} from '../../Elements/ElementStyle'
import type { Class_ElementStyle } from '../../Elements/Element'
import type { Class_Sankey } from '../../types/Sankey'

/** L'amorce déclarée d'un style d'application, ou rien : un style fabriqué par l'auteur n'en a pas. */
const seedOf = (style_id: string): { [attr: string]: unknown } | undefined => {
  const declared = (elementStyleConfigs as {
    [id: string]: { config: { [attr: string]: unknown } } | undefined
  })[style_id]
  return declared?.config
}

/**
 * Ce style DIT-IL cette clé, au sens du tracé ?
 *
 * Vrai quand il la porte explicitement ET qu'elle diffère de son amorce. Un style sans amorce —
 * celui que l'auteur a créé lui-même — dit donc tout ce qu'il porte, ce qui est juste : il n'y a
 * aucune valeur d'usine dont il faudrait le distinguer.
 */
export const partStyleSpeaksOf = (style: Class_ElementStyle, attr: string): boolean => {
  if (!style.isAttributeExplicit(attr)) return false
  return style.getElementProperty(attr) !== seedOf(style.id)?.[attr]
}

/**
 * Créer les styles de part d'un document de figure. Idempotent : `create_internal_style` ne
 * réécrit pas un style existant.
 *
 * os#1462 — LE GÉNÉRIQUE, ET CELUI DE CETTE NATURE, ET EUX SEULS. Semer les trois natures d'un
 * coup offrirait « Part de barres » dans la liste des styles d'une couronne : un réglage sans
 * effet, ce qui est la pire chose à proposer à un auteur. Une figure ne voit donc que les deux
 * étages qui la concernent.
 */
export const seedPartStyles = (sankey: Class_Sankey, nature?: string): void => {
  figure_part_styles.forEach(style_id => sankey.create_internal_style(style_id, elementStyleConfigs))
  const nature_style = nature !== undefined ? figure_part_nature_styles[nature] : undefined
  if (nature_style !== undefined) sankey.create_internal_style(nature_style, elementStyleConfigs)
}

/**
 * L'identifiant du style de CETTE nature, sans rien exiger d'un document.
 *
 * Rendu à part de `partNatureStyleOf` parce qu'on en a besoin pour une nature qu'on QUITTE : le
 * style à détacher d'une part est celui de son ancienne nature, et le document, lui, a déjà changé
 * de figure (cf. `buildParts`, le changement de représentation).
 */
export const partNatureStyleIdOf = (nature?: string): string | undefined =>
  nature !== undefined && nature !== '' ? figure_part_nature_styles[nature] : undefined

/** Le style générique des parts d'une figure — celui qui vaut quelle que soit sa nature. */
export const partStyleOf = (sankey: Class_Sankey): Class_ElementStyle =>
  sankey.styles_dict[FigurePartStyle]

/**
 * Le style de CETTE nature, s'il en existe un et qu'il a été semé.
 *
 * Rendu séparément du générique parce qu'il se pose autrement : le générique est le style de
 * construction de la part (`new Class_PartElement(..., style)`), celui-ci s'empile par-dessus
 * (`addStyle`) — c'est-à-dire qu'il gagne, ce qui est le sens de « ça se spécialise en bas ».
 */
export const partNatureStyleOf = (
  sankey: Class_Sankey, nature?: string
): Class_ElementStyle | undefined => {
  const style_id = nature !== undefined ? figure_part_nature_styles[nature] : undefined
  return style_id !== undefined ? sankey.styles_dict[style_id] : undefined
}

// `carryPartStyleOver` A ETE RETIRE (os#1453), et son absence est le signe que la correction a
// porte. Il n'existait que pour rattraper un document qu'on jetait a chaque dessin : il reportait,
// d'un style neuf a l'autre, ce que l'auteur avait regle. Depuis que le document VIT d'un dessin au
// suivant (`buildParts`), le style est le MEME objet — il n'y a plus rien a reporter.
