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
import { CheckIcon, ChevronRightIcon } from '@chakra-ui/icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLocationDot, faPercent, faRulerVertical } from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'

import { OSTooltip } from './OSTooltip'
// `applyPositionMode` vit dans le module de règles voisin (sans Chakra) : c'est ce qui le rend
// testable — aucune suite jest du dépôt ne peut charger `@chakra-ui/react`.
import {
  applyPositionMode, setScaleAdaptedReferenceDataTag, scaleAdaptedReferenceDataTagOf
} from './positionModeHost'
import {
  applyBandsByValue, applyDimensionDrawing, applyDisaggregationGap, applyMemberBands, dimensionCarrierCandidates,
  dimensionCarriersOf, dimensionDrawingOf, dimensionInMemberBands, toggleDimensionCarrier
} from './dimensionDrawingHost'
import type { Type_DisaggregationGap } from '../../types/Utils'
import type { Class_ApplicationData } from '../../types/ApplicationData'
import type { Class_DataTagGroup } from '../../types/TagGroup'
import type { Type_PositionMode } from '../../types/PublishOptions'

export const POSITION_MODE_META: { value: Type_PositionMode, icon: IconDefinition, label_key: string }[] = [
  { value: 'absolute', icon: faLocationDot, label_key: 'Banner.posModeShort_absolute' },
  { value: 'proportional', icon: faPercent, label_key: 'Banner.posModeShort_proportional' },
  { value: 'scale_adapted', icon: faRulerVertical, label_key: 'Banner.posModeShort_scale_adapted' },
]

/** Les modes d'écart vertical des enfants, dans l'ordre de `DisaggregationGapControl`. */
const GAP_MODES: { value: Type_DisaggregationGap, label_key: string }[] = [
  { value: 'fill', label_key: 'MEP.childGapFill' },
  { value: 'keep', label_key: 'MEP.childGapKeep' },
  { value: 'children_dy', label_key: 'MEP.childGapDy' },
  { value: 'constant', label_key: 'MEP.childGapConst' }
]

/** Une entrée cochable. */
const CheckItem = ({ label, checked, onClick, icon, closeOnSelect }: {
  label: string, checked: boolean, onClick: () => void, icon?: React.ReactElement, closeOnSelect?: boolean
}) => (
  <MenuItem fontSize='0.75rem' icon={icon} onClick={onClick} closeOnSelect={closeOnSelect}>
    <HStack spacing='0.5rem'>
      <Box as='span'>{label}</Box>
      {checked ? <CheckIcon boxSize='0.6rem' /> : null}
    </HStack>
  </MenuItem>
)

/**
 * os#1511 — UN SOUS-MENU. Chakra v2 n'en a pas de natif : même patron que le menu Aide (tutoriels),
 * ouverture au survol, et l'entrée ne ferme pas le menu parent.
 */
const Submenu = ({ label, icon, checked, children }: {
  label: string, icon?: React.ReactElement, checked?: boolean, children: React.ReactNode
}) => {
  const [open, setOpen] = React.useState(false)
  return (
    <Box onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <Menu isOpen={open} placement='right-start' gutter={0} offset={[0, 0]} isLazy>
        <MenuButton as={MenuItem} closeOnSelect={false} fontSize='0.75rem' icon={icon}>
          <HStack justifyContent='space-between' spacing='0.75rem'>
            <HStack spacing='0.5rem'>
              <Box as='span'>{label}</Box>
              {checked ? <CheckIcon boxSize='0.6rem' /> : null}
            </HStack>
            <ChevronRightIcon boxSize='0.9rem' />
          </HStack>
        </MenuButton>
        <Portal>
          <MenuList
            minWidth='unset'
            zIndex={51}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
          >
            {children}
          </MenuList>
        </Portal>
      </Menu>
    </Box>
  )
}

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
  // os#1511 — LE DESSIN ne se règle qu'en ÉDITION : il change la structure du diagramme (des nœuds
  // engendrés), là où la position n'est qu'une façon de lire. En lecture, le menu reste celui d'hier.
  const can_draw = !app_data.is_static
  const drawing = dimensionDrawingOf(app_data, tagg)
  const in_bands = dimensionInMemberBands(app_data, tagg)
  const position_items = <>
    {POSITION_MODE_META.map(m => (
      <CheckItem
        key={m.value}
        icon={<FontAwesomeIcon icon={m.icon} />}
        label={t(m.label_key)}
        checked={m.value === mode}
        onClick={() => applyPositionMode(app_data, tagg, m.value)}
      />
    ))}
    {/* os#1383 — Sur quoi l'échelle adaptée se cale. Sans ce réglage, la grandeur de
        référence est celle qui se trouvait à l'écran quand le mode a pris : l'échelle
        dépend alors du chemin de clics. Désignée, elle se recalcule à chaque dessin. */}
    {mode === 'scale_adapted' && tagg.tags_list.length > 0 ? <>
      <MenuDivider />
      <MenuGroup title={t('Banner.posMode_ref_title')} fontSize='0.7rem'>
        <CheckItem
          label={t('Banner.posMode_ref_none')}
          checked={reference === undefined}
          onClick={() => setScaleAdaptedReferenceDataTag(app_data, tagg, undefined)}
        />
        {/* Libellé long s'il existe (« Corse »), sinon le nom (« 94 ») — la même règle que les
            sélecteurs de l'éditeur. */}
        {tagg.tags_list.map(tag => (
          <CheckItem
            key={tag.id}
            label={tag.display_name}
            checked={reference === tag.id}
            onClick={() => setScaleAdaptedReferenceDataTag(app_data, tagg, tag.id)}
          />
        ))}
      </MenuGroup>
    </> : null}
  </>
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
        {can_draw
          ? <>
            <Submenu label={t('Banner.posMode_submenu')} icon={<FontAwesomeIcon icon={current.icon} />}>
              {position_items}
            </Submenu>
            {/* os#1511 — LE DESSIN DE LA DIMENSION (Julien, 30/09 : « les options par bandes ou par
                nœud, avec des sous-menus », puis « et les options de désagrégation pour les
                nœuds ») : un membre, plusieurs en bandes, ou plusieurs en nœuds — et alors quels
                nœuds la portent, chacun se désagrégeant selon elle. */}
            <Submenu label={t('Banner.draw_submenu')}>
              <CheckItem
                label={t('Banner.draw_one')}
                checked={drawing === 'one'}
                onClick={() => applyDimensionDrawing(app_data, tagg, 'one')}
              />
              <CheckItem
                label={t('Banner.draw_bands')}
                checked={drawing === 'multi'}
                onClick={() => applyDimensionDrawing(app_data, tagg, 'multi')}
              />
              {/* os#1511 — l'ordre des bandes d'un flux : du plus grand au plus petit (défaut). */}
              <CheckItem
                label={t('Banner.draw_bands_by_value')}
                checked={tagg.bands_by_value}
                closeOnSelect={false}
                onClick={() => applyBandsByValue(app_data, tagg, !tagg.bands_by_value)}
              />
              {tagg.is_hierarchical
                ? <Submenu label={t('Banner.draw_nodes')} checked={drawing === 'nodes'}>
                  <MenuGroup title={t('Banner.draw_carriers')} fontSize='0.7rem'>
                    {dimensionCarrierCandidates(app_data).map(node => (
                      <CheckItem
                        key={node.id}
                        label={node.name}
                        checked={node.driving_dimension === tagg}
                        closeOnSelect={false}
                        onClick={() => toggleDimensionCarrier(app_data, tagg, node.id)}
                      />
                    ))}
                  </MenuGroup>
                  {/* L'écart vertical des enfants du nœud désagrégé : le réglage de l'onglet
                      Hiérarchie, ici aussi (global à la zone de dessin). */}
                  <MenuDivider />
                  <MenuGroup title={t('MEP.childGapMode')} fontSize='0.7rem'>
                    {/* os#1511 — dès deux porteurs, la dimension se range en bandes et le mode
                        d'écart n'a plus d'effet : on le dit, au lieu de cocher un mode qui ne
                        s'applique pas. Choisir un mode quitte les bandes. */}
                    {dimensionCarriersOf(app_data, tagg).length >= 2
                      ? <CheckItem
                        label={t('Banner.draw_member_bands') +
                          ` (${app_data.drawing_area.disaggregation_gap_value})`}
                        checked={in_bands}
                        closeOnSelect={false}
                        onClick={() => applyMemberBands(app_data, tagg, true)}
                      />
                      : null}
                    {GAP_MODES.map(g => (
                      <CheckItem
                        key={g.value}
                        label={t(g.label_key) + (g.value === 'constant'
                          ? ` (${app_data.drawing_area.disaggregation_gap_value})` : '')}
                        checked={!in_bands && app_data.drawing_area.disaggregation_gap_mode === g.value}
                        closeOnSelect={false}
                        onClick={() => applyDisaggregationGap(app_data, g.value, tagg)}
                      />
                    ))}
                  </MenuGroup>
                </Submenu>
                : null}
            </Submenu>
          </>
          : position_items}
      </MenuList>
    </Portal>
  </Menu>
}
