// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction.
// ==================================================================================================
// Author        : TerriFlux
// ==================================================================================================

// SA#551 — PRÉSENTATION D'UN GROUPE D'ÉTIQUETTES depuis la légende.
//
// Cliquer le nom d'un groupe dans la légende ouvre la même pop-up que n'importe quel élément du
// diagramme (arbitrage d'Alexandre, 2026-09-18 — le clic n'ouvre plus le groupe). Elle montre la
// définition du groupe et ses étiquettes, et sa colonne de droite porte, à la place des analyses
// d'un élément, une VUE : le diagramme mis en forme par les seules étiquettes de ce groupe.
//
// La vue est une COPIE du dessin courant, prise pendant que la cascade est mise en aperçu
// (`Class_Sankey.setTagStylePreview`) puis rendue telle quelle : le diagramme lui-même n'est pas
// modifié — deux dessins successifs dans la même tâche, donc rien ne clignote.

import React from 'react'
import { Box, Text } from '@chakra-ui/react'

import type { Class_ApplicationData } from '../../../types/ApplicationData'
import type { Class_TagGroup } from '../../../types/TagGroup'
import type { Class_DrawingArea } from '../../../types/DrawingArea'
import { isLegendGroupZoneId } from '../../../Elements/legendIds'
import { redrawForTagStylePreview } from '../../../Elements/LegendGenerator'
import { default_font_size } from '../../../css/Theme'
import { diagramContext, representation_registry } from '../../../Representations/RepresentationRegistry'
// os#1498 (agent A) — identifiant de la nature « Vue par groupe », posé à côté de
// `MAIN_ZONE_UNIT_WINDOW_ID` ; c'est OS+ qui l'enregistre, OS ne fait que le citer.
import { MAIN_ZONE_GROUP_VIEW_ID } from '../../../types/MenuConfig'
import type { Class_MenuConfig, Type_MainZoneSubject } from '../../../types/MenuConfig'
import { presentationPanelId, type Type_Presentable } from './openPresentation'

export { isLegendGroupZoneId }

/**
 * Groupe de nœuds ou de flux que désigne une zone de titre, ou `undefined`. Le relevé est tenu par
 * le générateur de légende (les ids de zone sont des slugs : ils ne se relisent pas).
 */
export const findLegendTagGroup = (
  app_data: Class_ApplicationData,
  zone_id: string
): Class_TagGroup | undefined => {
  const sankey = app_data.drawing_area.sankey
  const group_id = app_data.drawing_area.legend.tagGroupIdOfTitle(zone_id)
  if (group_id === undefined) return undefined
  return [...sankey.node_taggs_list, ...sankey.flux_taggs_list]
    .find(group => group.id === group_id) as unknown as Class_TagGroup | undefined
}

/** Le groupe d'une zone, si cette zone est un titre de groupe de nœuds ou de flux. */
export const legendTagGroupOf = (
  app_data: Class_ApplicationData,
  element: Type_Presentable
): Class_TagGroup | undefined =>
  isLegendGroupZoneId(element.id) ? findLegendTagGroup(app_data, element.id) : undefined

// CONTENU DE LA POP-UP ==============================================================

/** Définition (groupe ou étiquette) telle que la pop-up l'affiche : rien quand elle est blanche. */
const definitionOf = (owner: { description?: string }): string | undefined => {
  const description = owner.description
  return typeof description === 'string' && description.trim() !== '' ? description : undefined
}

/** Damier gris et blanc du carré d'un style d'opacité, en CSS (même code que la légende du dessin). */
const CHECKER_BACKGROUND = {
  backgroundImage:
    'linear-gradient(45deg, #c8c8c8 25%, transparent 25%, transparent 75%, #c8c8c8 75%),' +
    'linear-gradient(45deg, #c8c8c8 25%, transparent 25%, transparent 75%, #c8c8c8 75%)',
  backgroundSize: '0.3rem 0.3rem',
  backgroundPosition: '0 0, 0.15rem 0.15rem',
  backgroundColor: '#ffffff'
}

/** Carré d'une étiquette : sa couleur à son opacité, sur un damier quand le style ne fixe que celle-ci. */
const TagSwatch = ({ color, opacity, checker }: { color: string, opacity: number, checker: boolean }) => (
  <Box
    as='span'
    className={checker ? 'legend_swatch_checker' : undefined}
    style={{
      flex: 'none', width: '0.6rem', height: '0.6rem', borderRadius: '2px',
      border: '1px solid #cbd5e0', display: 'inline-block',
      ...(checker ? CHECKER_BACKGROUND : {})
    }}
  >
    <Box
      as='span'
      style={{
        display: 'block', width: '100%', height: '100%', borderRadius: '1px',
        backgroundColor: color, opacity
      }}
    />
  </Box>
)

/**
 * Définition du groupe puis ses étiquettes, chacune avec sa pastille (couleur de son style, sinon sa
 * couleur historique) et sa propre définition. C'est ce qu'un lecteur attend d'un groupe : ce qu'il
 * veut dire, et ce qu'il contient.
 */
export const LegendTagGroupBlock = ({ app_data, group }: {
  app_data: Class_ApplicationData
  group: Class_TagGroup
}) => {
  const { t } = app_data
  const styles = app_data.drawing_area.sankey.styles_dict
  const description = definitionOf(group as unknown as { description?: string })
  const tags = group.tags_list as unknown as {
    id: string, display_name: string, color: string, style_id?: string, description?: string
  }[]
  // Carré d'une étiquette : sa couleur de style, sinon sa couleur historique ; et, comme dans la
  // légende du diagramme, un DAMIER sous un style qui règle l'opacité sans couleur — sans quoi la
  // pop-up montrait des gris là où la légende montre une transparence (retour du 2026-09-18).
  const swatchOf = (tag: { color: string, style_id?: string }): { color: string, opacity: number, checker: boolean } => {
    const style = tag.style_id ? styles[tag.style_id] : undefined
    const color = style?.getElementProperty('shape_color')
    const opacity = style?.getElementProperty('shape_opacity')
    return {
      color: typeof color === 'string' ? color : tag.color,
      opacity: typeof opacity === 'number' ? opacity : 1,
      checker: typeof opacity === 'number' && typeof color !== 'string'
    }
  }
  return (
    <Box style={{ fontSize: default_font_size, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      {description && <Text style={{ opacity: 0.9 }}>{description}</Text>}
      <Text style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.65 }}>
        {t('MEP.legend_group_tags')}
      </Text>
      {tags.map(tag => (
        <Box key={tag.id} style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
          <TagSwatch {...swatchOf(tag)} />
          <Text as='span'>
            {tag.display_name}
            {definitionOf(tag) && <Text as='span' style={{ opacity: 0.7 }}>{' — ' + definitionOf(tag)}</Text>}
          </Text>
        </Box>
      ))}
    </Box>
  )
}

// VUE DU GROUPE (colonne de droite) =================================================

/** Marge autour du contenu dans la copie, en px écran. */
const VIEW_PADDING = 5

/**
 * Renomme les identifiants de la copie : un clone du SVG vivant porterait les MÊMES ids, et une
 * référence interne (`url(#hatch-xxx)`, `clip-path`) se résoudrait alors sur l'élément du diagramme
 * vivant — c'est-à-dire sur le motif REMIS dans son état normal après l'aperçu.
 */
const renameIds = (svg: string, suffix: string): string => svg
  .replaceAll(/\bid="([^"]+)"/g, (_m, id: string) => `id="${id}${suffix}"`)
  .replaceAll(/url\(#([^)]+)\)/g, (_m, id: string) => `url(#${id}${suffix})`)
  .replaceAll(/\bhref="#([^"]+)"/g, (_m, id: string) => `href="#${id}${suffix}"`)

/** Copie du dessin courant, recadrée sur le contenu (même recette que les vignettes de vue). */
const currentDrawingAsSvg = (drawing_area: Class_DrawingArea, suffix: string): string | null => {
  const svg_sel = drawing_area.d3_selection_zoom_area
  const node = svg_sel?.node()
  const bounds = drawing_area.contentBounds()
  if (!node || !bounds || bounds.width <= 0 || bounds.height <= 0) return null
  const scale = drawing_area.is_paper_mode ? 1 : drawing_area.getZoomScale()
  const ox = drawing_area.is_paper_mode ? 0 : bounds.x
  const oy = drawing_area.is_paper_mode ? 0 : bounds.y
  const w = (drawing_area.is_paper_mode ? bounds.x + bounds.width : bounds.width) * scale + 2 * VIEW_PADDING
  const h = (drawing_area.is_paper_mode ? bounds.y + bounds.height : bounds.height) * scale + 2 * VIEW_PADDING
  const clone = node.cloneNode(true) as SVGSVGElement
  // os#1438 — PAR LE SÉLECTEUR DE LA ZONE, et non par les noms nus. Ces trois identifiants ne
  // sont nus QUE pour le canevas du document principal ; toute autre zone les préfixe par son
  // identifiant de diagramme (cf. `dom_id_prefix`). Écrits en dur, ils ne trouvaient rien dès que
  // la présentation portait sur une feuille voisine, un aperçu unitaire ou une vue en coulisse :
  // le cadre de viewport restait dans l'image, la découpe rognait le dessin, et le recadrage ne
  // s'appliquait pas — sans la moindre erreur, puisque `querySelector` rend simplement `null`.
  //
  // Le clone est SCOPÉ (on interroge le clone, pas le document), donc il n'y avait pas de risque
  // de prendre le mauvais élément : seulement celui de n'en prendre aucun.
  clone.querySelector(drawing_area.domIdSelector('g_drawing'))
    ?.setAttribute('transform', `translate(${-ox * scale + VIEW_PADDING},${-oy * scale + VIEW_PADDING}) scale(${scale})`)
  clone.querySelectorAll('input').forEach(input => input.remove())
  clone.querySelector(drawing_area.domIdSelector('viewport_border'))?.remove()
  clone.querySelector(drawing_area.domIdSelector('g_clip'))?.removeAttribute('clip-path')
  const inner = renameIds(clone.innerHTML, suffix)
  return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"' +
    ` viewBox="0 0 ${w} ${h}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">` +
    inner + '</svg>'
}

/**
 * Dessine dans `container` le diagramme mis en forme par les seules étiquettes du groupe. L'aperçu
 * est posé sur la cascade, les éléments redessinés, la copie prise, puis TOUT est rétabli : le
 * diagramme vivant retrouve son état avant la fin de la tâche, donc sans clignoter.
 */
export const renderLegendTagGroupView = (
  app_data: Class_ApplicationData,
  group: Class_TagGroup,
  container: HTMLElement
): (() => void) => {
  const drawing_area = app_data.drawing_area
  const sankey = drawing_area.sankey
  const applied = sankey.setTagStylePreview(group.id)
  // Un groupe FERMÉ ne met rien en forme et n'a pas de bloc dans la légende : le temps de la copie,
  // il est présenté comme développé (son interrupteur retrouve sa valeur juste après, dans la même
  // tâche — le document n'en garde rien).
  const was_switched_on = group.use_colors
  let svg: string | null = null
  try {
    if (applied) {
      if (!was_switched_on) group.use_colors = true
      // TOUT est redessiné, même quand l'interrupteur vient de le faire pour une partie : l'aperçu
      // éteint la mise en forme des autres groupes, la leur comprise.
      redrawForTagStylePreview(drawing_area)
      // La légende suit l'aperçu : elle ne montre plus que ce groupe (retour du test local du
      // 2026-09-18 — la vue doit faire lire CE groupe, pas ceux qui restent développés).
      drawing_area.legend.draw()
    }
    svg = currentDrawingAsSvg(drawing_area, '-groupview')
  } finally {
    if (applied) {
      sankey.setTagStylePreview(undefined)
      if (!was_switched_on) group.use_colors = false
      redrawForTagStylePreview(drawing_area)
      drawing_area.legend.draw()
    }
  }
  container.innerHTML = svg ?? ''
  return () => { container.innerHTML = '' }
}

// OUVRIR LA VUE DU GROUPE DANS UN VOLET (os#1498) ===================================

/**
 * La vue de ce groupe peut-elle s'ouvrir dans un VOLET de la grande zone ?
 *
 * LA PHOTO CI-DESSUS EST UNE COPIE : on la regarde, on ne la touche pas. Le volet, lui, montre le
 * diagramme vivant mis en forme par ce seul groupe — nœuds déplaçables, inspecteur, annulation. Ce
 * n'est pas la même chose, et la photo reste le repli quand le volet n'est pas offert.
 *
 * LA GARDE EST CELLE DU « + » DE LA BARRE DU HAUT (`MenuTop`, os#1431), et c'est délibéré : on ne
 * réécrit pas ici les conditions d'ouverture d'une fenêtre, on interroge le registre.
 * `representation_registry.list(diagramContext(app_data))` applique déjà, dans cet ordre, le
 * `gate` de la nature, les capacités du diagramme (`needs`) et — sur une page publiée — les deux
 * verrous de `isOfferedToReader` : la liste blanche `publish_options.representations` et la clé
 * booléenne que l'entrée désigne par `publish_option`. Une page publiée qui n'offre pas cette
 * nature n'a donc pas ce bouton, sans qu'aucun test de mode publié soit écrit ici.
 *
 * S'y ajoute la SEULE chose que le registre ne sait pas : il faut une configuration de menus pour
 * qu'il y ait une grande zone où poser le volet. Sans elle — et sans nature enregistrée, ce qui
 * est le cas d'OpenSankey seul et du viewer, où OS+ n'est pas là — pas de bouton.
 */
export const canOpenTagGroupPane = (app_data: Class_ApplicationData): boolean => {
  // Le getter est typé non nul mais ne l'est pas avant `createNewMenuConfiguration`
  // (cf. ApplicationData) : un document hors écran n'en a pas.
  const mc = app_data.menu_configuration as Class_MenuConfig | undefined
  if (!mc) return false
  if (!representation_registry.get(MAIN_ZONE_GROUP_VIEW_ID)) return false
  return representation_registry.list(diagramContext(app_data))
    .some(entry => entry.id === MAIN_ZONE_GROUP_VIEW_ID)
}

/**
 * Ouvre le volet sur ce groupe et referme la pop-up ; rend l'identifiant de la fenêtre, ou `null`
 * quand le volet n'est pas offert (cf. `canOpenTagGroupPane`).
 *
 * Trois gestes, dans cet ordre, et l'ordre compte : la fenêtre NAÎT d'abord (elle seule donne
 * l'identifiant sous lequel sa figure se range), le groupe est posé ENSUITE sur sa figure de
 * diagramme (clé `''`), et la pop-up ne se referme qu'après — sans quoi le clic ressemblerait à un
 * clic sans effet si l'une des deux écritures échouait.
 */
export const openTagGroupPane = (
  app_data: Class_ApplicationData,
  group: Class_TagGroup,
  element_id: string
): string | null => {
  if (!canOpenTagGroupPane(app_data)) return null
  const mc = app_data.menu_configuration
  const subject: Type_MainZoneSubject = { kind: 'diagram' }
  const window_id = mc.openMainZoneWindow(subject, MAIN_ZONE_GROUP_VIEW_ID, 'right')
  mc.setMainZoneWindowOptions(window_id, { tag_group_id: group.id })
  mc.panels.close(presentationPanelId(element_id))
  return window_id
}
