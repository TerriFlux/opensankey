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
// définition du groupe et ses étiquettes, et un bouton « Vue » ouvre le diagramme mis en forme
// par les seules étiquettes de ce groupe.
//
// sa#563 (lot 4) — LA VUE N'EST PLUS UNE PHOTO. `renderLegendTagGroupView` clonait le SVG du
// dessin vivant en chaîne de caractères pendant que la cascade était en aperçu : une image, dans
// un `div` de 260 px, où rien ne se déplaçait ni ne se réglait. La vue est devenue une NATURE de
// la grande zone (`TagGroupViewRepresentation`), et ce bouton ne fait plus que l'ouvrir — dans un
// volet flottant, réglable par la colonne d'outils comme n'importe quel autre volet.

import React from 'react'
import { Box, Text } from '@chakra-ui/react'

import type { Class_ApplicationData } from '../../../types/ApplicationData'
import type { Class_TagGroup } from '../../../types/TagGroup'
import { isLegendGroupZoneId } from '../../../Elements/legendIds'
import { default_font_size } from '../../../css/Theme'
import { FIGURE_DIAGRAM_PANE_KEY } from '../../../Representations/Figure'
import { TAG_GROUP_VIEW_REPRESENTATION_ID } from '../../../Representations/representationIds'
import { TAG_GROUP_VIEW_OPTION_KEY } from '../../../Representations/TagGroupViewRepresentation'
import type { Type_Presentable } from './openPresentation'
import { placeFloatingNear } from './openPresentation'

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

// VUE DU GROUPE — L'OUVERTURE, et plus le dessin ===================================

/**
 * sa#563 — OUVRE LA « VUE » DE CE GROUPE dans un volet flottant de la grande zone.
 *
 * UNE SEULE FENÊTRE DE CETTE NATURE, et c'est voulu : le groupe est un RÉGLAGE de la vue (cf.
 * `TagGroupViewRepresentation`), pas son sujet. Demander la vue d'un second groupe change donc
 * le réglage de la fenêtre qui est déjà là, au lieu d'en ouvrir une de plus — exactement comme
 * on ne rouvre pas un tableur pour regarder une autre feuille.
 *
 * ET ON NE LA DÉMÉNAGE PAS. Si l'auteur l'a ancrée en volet dans la grande zone, un nouveau clic
 * dans la légende doit la remplir, pas l'en arracher : `openMainZoneWindow` ne pose la place
 * demandée que sur une fenêtre NEUVE.
 */
export const openTagGroupView = (
  app_data: Class_ApplicationData,
  group: Class_TagGroup,
  anchor?: { x: number, y: number }
): void => {
  const mc = app_data.menu_configuration
  const known = mc.isMainZoneOccupant(TAG_GROUP_VIEW_REPRESENTATION_ID)
  if (!known) mc.enforceMainZoneFloatingCap(TAG_GROUP_VIEW_REPRESENTATION_ID)
  const id = mc.openMainZoneWindow(
    { kind: 'diagram' }, TAG_GROUP_VIEW_REPRESENTATION_ID, 'floating',
    known ? undefined : placeFloatingNear(app_data, anchor, TAG_GROUP_VIEW_REPRESENTATION_ID)
  )
  // Le sac COMPLET de la figure (cf. `setMainZoneWindowOptions`) : on part des réglages
  // EFFECTIFS pour ne pas effacer ce que l'auteur aurait posé à côté, et on n'y change que le
  // groupe. `assign` ne pose rien qui vaille déjà ce que le style dit, donc rien ne se fige.
  mc.setMainZoneWindowOptions(id, {
    ...mc.mainZonePaneOptionsOf(id, FIGURE_DIAGRAM_PANE_KEY),
    [TAG_GROUP_VIEW_OPTION_KEY]: group.id
  })
}
