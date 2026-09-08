// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

/**
 * `PositionModeMenu` — sélecteur de MODE D'AFFICHAGE d'une dimension (absolu / proportionnel /
 * échelle adaptée), primitive d'interface PARTAGÉE.
 *
 * os#1366 — Extrait de `opensankey-editor/components/topmenus/Toolbar.tsx`, où il n'était
 * atteignable que par l'éditeur : une publication sert le lecteur, et le réglage n'y avait donc
 * jamais existé. Or le mode d'affichage n'est pas un outil d'édition — c'est une façon de LIRE la
 * donnée quand la sélection change (positions absolues conservées, comprimées proportionnellement,
 * ou échelle adaptée au flux de référence). Il appartient au lecteur autant qu'à l'auteur.
 *
 * Le composant est DÉPLACÉ, pas recopié : ses trois hôtes (ligne du panneau Filtres, sélecteur de
 * la barre du haut, frise de séquence) importent tous celui-ci. Deux copies auraient divergé.
 *
 * La LOGIQUE de positionnement, elle, ne bouge pas : elle vit déjà dans OpenSankey
 * (`Class_DataTagGroup.applyPositionModeToDrawing`, `NodePositioning*`). Ce module n'est que
 * l'interface. La règle d'affichage vit dans `positionModeHost.ts`, à côté.
 *
 * `import type` uniquement pour les classes modèle : ce module reste une feuille, sans arête
 * runtime vers `types/` (cf. `architectureBoundary.test.ts` et le cycle Element → Handler).
 */

import React from 'react'
import {
  Button, Menu, MenuButton, MenuList, MenuItem, MenuDivider, MenuGroup, HStack, Box, Portal
} from '@chakra-ui/react'
import { CheckIcon } from '@chakra-ui/icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLocationDot, faPercent, faRulerVertical } from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'

import { OSTooltip } from './OSTooltip'
// `applyPositionMode` vit dans le module de règles voisin (sans Chakra) : c'est ce qui le rend
// testable — aucune suite jest du dépôt ne peut charger `@chakra-ui/react`.
import {
  applyPositionMode, setScaleAdaptedReferenceDataTag, scaleAdaptedReferenceDataTagOf
} from './positionModeHost'
import type { Class_ApplicationData } from '../../types/ApplicationData'
import type { Class_DataTagGroup } from '../../types/TagGroup'
import type { Type_PositionMode } from '../../types/PublishOptions'

export const POSITION_MODE_META: { value: Type_PositionMode, icon: IconDefinition, label_key: string }[] = [
  { value: 'absolute', icon: faLocationDot, label_key: 'Banner.posModeShort_absolute' },
  { value: 'proportional', icon: faPercent, label_key: 'Banner.posModeShort_proportional' },
  { value: 'scale_adapted', icon: faRulerVertical, label_key: 'Banner.posModeShort_scale_adapted' },
]

/**
 * Menu du mode d'affichage D'UNE DIMENSION : déclencheur icône seule (icône du mode de la
 * dimension, discret), le texte + icône de chaque mode ne se voient que dans le menu
 * déroulé.
 *
 * #370 — Un menu par dimension, à côté d'elle, quel que soit son hôte : ligne du panneau
 * Filtres, sélecteur de la barre du haut, frise de séquence. Remplace le bouton unique en
 * en-tête de section du #367 : le mode n'est plus un réglage global du diagramme, il
 * qualifie chaque dimension (échelle adaptée pour des unités, proportionnel pour des
 * années).
 */
export const PositionModeMenu = ({ app_data, tagg }: {
  app_data: Class_ApplicationData,
  tagg: Class_DataTagGroup
}) => {
  const { t } = app_data
  const mode = tagg.position_mode
  // Valeur héritée hors liste : on affiche l'icône absolu sans le cocher.
  const current = POSITION_MODE_META.find(m => m.value === mode) ?? POSITION_MODE_META[0]
  // os#1383 — La référence ne se propose qu'en échelle adaptée : c'est le seul mode qu'elle règle.
  const reference = mode === 'scale_adapted' ? scaleAdaptedReferenceDataTagOf(app_data, tagg) : undefined
  return <Menu placement='bottom-start'>
    <OSTooltip placement='bottom' label={t('Banner.posMode_title_tt')}>
      {/* `variant` obligatoire : le style de base des boutons du thème est vert PLEINE
          LARGEUR (width 100 %) — sans variant, le bouton écrase le sélecteur voisin.
          `menuconfigpanel_icon_button` = fond blanc, largeur au contenu, hauteur 1.5rem
          (celle des sélecteurs xs). */}
      <MenuButton
        as={Button}
        size='xs'
        variant='menuconfigpanel_icon_button'
        // #370 — plusieurs boutons coexistent désormais (un par dimension) : le nom de la
        // dimension entre dans le libellé, sans quoi ils seraient indiscernables.
        aria-label={t('Banner.posMode_title') + ' — ' + tagg.name}
      >
        <FontAwesomeIcon icon={current.icon} />
      </MenuButton>
    </OSTooltip>
    {/* Portal : hôtes à contexte d'empilement propre (topbar / panneau) — sans lui la
        MenuList peut s'ouvrir clippée. */}
    <Portal>
      <MenuList minWidth='unset' zIndex={50}>
        {POSITION_MODE_META.map(m => (
          <MenuItem
            key={m.value}
            fontSize='0.75rem'
            icon={<FontAwesomeIcon icon={m.icon} />}
            onClick={() => applyPositionMode(app_data, tagg, m.value)}
          >
            <HStack spacing='0.5rem'>
              <Box as='span'>{t(m.label_key)}</Box>
              {m.value === mode ? <CheckIcon boxSize='0.6rem' /> : null}
            </HStack>
          </MenuItem>
        ))}
        {/* os#1383 — Sur quoi l'échelle adaptée se cale. Sans ce réglage, la grandeur de
            référence est celle qui se trouvait à l'écran quand le mode a pris : l'échelle
            dépend alors du chemin de clics. Désignée, elle se recalcule à chaque dessin. */}
        {mode === 'scale_adapted' && tagg.tags_list.length > 0 ? <>
          <MenuDivider />
          <MenuGroup title={t('Banner.posMode_ref_title')} fontSize='0.7rem'>
            <MenuItem
              fontSize='0.75rem'
              onClick={() => setScaleAdaptedReferenceDataTag(app_data, tagg, undefined)}
            >
              <HStack spacing='0.5rem'>
                <Box as='span'>{t('Banner.posMode_ref_none')}</Box>
                {reference === undefined ? <CheckIcon boxSize='0.6rem' /> : null}
              </HStack>
            </MenuItem>
            {tagg.tags_list.map(tag => (
              <MenuItem
                key={tag.id}
                fontSize='0.75rem'
                onClick={() => setScaleAdaptedReferenceDataTag(app_data, tagg, tag.id)}
              >
                <HStack spacing='0.5rem'>
                  {/* Libellé long s'il existe (« Corse »), sinon le nom (« 94 ») — la
                      même règle que les sélecteurs de l'éditeur. */}
                  <Box as='span'>{tag.display_name}</Box>
                  {reference === tag.id ? <CheckIcon boxSize='0.6rem' /> : null}
                </HStack>
              </MenuItem>
            ))}
          </MenuGroup>
        </> : null}
      </MenuList>
    </Portal>
  </Menu>
}
