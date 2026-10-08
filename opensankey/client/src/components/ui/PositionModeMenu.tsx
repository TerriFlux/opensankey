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
import { faChartPie, faLocationDot, faPercent, faRulerVertical } from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'

import { OSTooltip } from './OSTooltip'
// `applyPositionMode` vit dans le module de règles voisin (sans Chakra) : c'est ce qui le rend
// testable — aucune suite jest du dépôt ne peut charger `@chakra-ui/react`.
import {
  applyPositionMode, setScaleAdaptedReferenceDataTag, scaleAdaptedReferenceDataTagOf,
  dimensionDrawingEnabledFor, positionModeSelectorEnabledFor, loneSubmenuOf
} from './positionModeHost'
import {
  applyDimensionDrawing, applyMemberBands, applyMembersColorFlows,
  dimensionCarrierCandidates,
  dimensionDrawingOf, dimensionInMemberBands, toggleDimensionCarrier, carrierRefusal
} from './dimensionDrawingHost'
import type { Class_ApplicationData } from '../../types/ApplicationData'
import type { Class_DataTagGroup } from '../../types/TagGroup'
import type { Type_PositionMode } from '../../types/PublishOptions'
import type { Type_TopbarFigureChoice, Type_TopbarFigureMenus } from '../../types/MenuConfig'
import { FigureDrawingIcon, isFigureDrawingIconName } from './FigureDrawingIcon'
import { DimensionDrawingIcon, dimensionDrawingIconName } from './DimensionDrawingIcon'

export const POSITION_MODE_META: { value: Type_PositionMode, icon: IconDefinition, label_key: string }[] = [
  { value: 'absolute', icon: faLocationDot, label_key: 'Banner.posModeShort_absolute' },
  { value: 'proportional', icon: faPercent, label_key: 'Banner.posModeShort_proportional' },
  { value: 'scale_adapted', icon: faRulerVertical, label_key: 'Banner.posModeShort_scale_adapted' },
]

/** Les modes d'écart vertical des enfants, dans l'ordre de `DisaggregationGapControl`. */

/** Une entrée cochable. */
const CheckItem = ({ label, checked, onClick, icon, glyph, closeOnSelect, disabled, title }: {
  label: string, checked: boolean, onClick: () => void, icon?: React.ReactElement, closeOnSelect?: boolean,
  disabled?: boolean, title?: string,
  /** 03/10/2026 — un petit visuel devant le libellé, sur la même ligne (cf. `FigureDrawingIcon`). */
  glyph?: React.ReactElement
}) => (
  <MenuItem
    fontSize='0.75rem' icon={icon} onClick={onClick} closeOnSelect={closeOnSelect} isDisabled={disabled} title={title}
  >
    <HStack spacing='0.5rem'>
      {glyph ?? null}
      <Box as='span'>{label}</Box>
      {checked ? <CheckIcon boxSize='0.6rem' /> : null}
    </HStack>
  </MenuItem>
)

/**
 * os#1511 — UN SOUS-MENU. Chakra v2 n'en a pas de natif : même patron que le menu Aide (tutoriels),
 * ouverture au survol, et l'entrée ne ferme pas le menu parent.
 */
const Submenu = ({ label, icon, glyph, checked, disabled, children }: {
  label: string, icon?: React.ReactElement, checked?: boolean, disabled?: boolean, children: React.ReactNode
  /** 07/10/2026 — un petit visuel devant le libellé, sur la même ligne (cf. `CheckItem`). */
  glyph?: React.ReactElement
}) => {
  const [open, setOpen] = React.useState(false)
  return (
    <Box onMouseEnter={() => setOpen(!disabled)} onMouseLeave={() => setOpen(false)}>
      <Menu isOpen={open && !disabled} placement='right-start' gutter={0} offset={[0, 0]} isLazy>
        <MenuButton as={MenuItem} closeOnSelect={false} fontSize='0.75rem' icon={icon} isDisabled={disabled}>
          <HStack justifyContent='space-between' spacing='0.75rem'>
            <HStack spacing='0.5rem'>
              {glyph ?? null}
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
 * 03/10/2026 — UNE ENTRÉE DE MENU, sous-menu ou non. Un menu qui n'aurait qu'un sous-menu
 * (« Dessiner › » seul, couronne active) l'APLATIT : son contenu, titres de section compris, se
 * pose directement dans le menu (`loneSubmenuOf`). `flat` : ce contenu quand il se pose à plat.
 */
type Type_MenuEntry = { key: string, is_submenu: boolean, node: React.ReactNode, flat?: React.ReactNode }

const submenuEntry = (key: string, label: string, content: React.ReactNode, opts: {
  disabled?: boolean, checked?: boolean, flat?: React.ReactNode
} = {}): Type_MenuEntry => ({
  key,
  is_submenu: true,
  node: <Submenu label={label} disabled={opts.disabled} checked={opts.checked}>{content}</Submenu>,
  flat: opts.flat ?? content
})

const menuEntries = (entries: (Type_MenuEntry | null)[]): React.ReactNode => {
  const lone = loneSubmenuOf(entries)
  if (lone !== null) return lone.flat
  return entries.map(e => e === null ? null : <React.Fragment key={e.key}>{e.node}</React.Fragment>)
}

/** Le petit visuel d'une option de figure, s'il en a un (cf. `FigureDrawingIcon`). */
const optionIcon = (o: Type_TopbarFigureChoice['options'][number]) =>
  isFigureDrawingIconName(o.icon) ? <FigureDrawingIcon name={o.icon} /> : undefined

/**
 * 02/10/2026 — LES CHOIX D'UNE FIGURE (os#1511), rendus comme ceux du diagramme : un groupe titré
 * par choix, une coche sur la valeur. Une option grisée ne fait rien — le choix n'a pas d'effet sur
 * ce que la figure montre. Un choix à une seule option est une case.
 */
const figureChoiceItems = (choices: Type_TopbarFigureChoice[]) => choices.map((c, i) => {
  if (c.options.length === 1) {
    const only = c.options[0]
    return <CheckItem
      key={c.key}
      glyph={optionIcon(only)}
      label={only.label}
      checked={c.value === only.value}
      disabled={c.disabled || only.disabled}
      title={only.title}
      closeOnSelect={false}
      onClick={() => c.choose(c.value === only.value ? '' : only.value)}
    />
  }
  return <React.Fragment key={c.key}>
    {i > 0 ? <MenuDivider /> : null}
    <MenuGroup title={c.label} fontSize='0.7rem'>
      {c.options.map(o => (
        <CheckItem
          key={o.value}
          glyph={optionIcon(o)}
          label={o.label}
          checked={c.value === o.value}
          disabled={c.disabled || o.disabled}
          title={o.title}
          closeOnSelect={false}
          onClick={() => { if (c.value !== o.value) c.choose(o.value) }}
        />
      ))}
    </MenuGroup>
  </React.Fragment>
})

/** Un choix a-t-il au moins une option qui agit ? Sinon son sous-menu se grise. */
const anyEnabled = (choices: Type_TopbarFigureChoice[]) =>
  choices.some(c => !c.disabled && c.options.some(o => !o.disabled))

/**
 * 02/10/2026 — LE BOUTON DE LA FIGURE ACTIVE, en tête de la barre du haut (os#1511) : son icône, et
 * ses réglages communs — clic sur une part, liaison au diagramme, couche de données (le dessin, en
 * secteurs / en sunburst / une couronne par membre, se règle par dimension dans le tableau de
 * navigation depuis le 04/10/2026) —, un sous-menu au survol par réglage, comme le
 * menu d'une dimension. Les gestes sont ceux des lignes de ses Coordonnées (OS+, `figureGesturesHost`).
 *
 * 03/10/2026 — L'ICÔNE SEULE, comme les autres boutons de la barre (Julien) : le nom de la
 * représentation passe en info-bulle et en `aria-label`.
 */
export const FigureTopbarMenu = ({ menus }: { menus: Type_TopbarFigureMenus }) => (
  <Menu placement='bottom-start'>
    <MenuButton
      as={Button}
      size='xs'
      variant='menuconfigpanel_icon_button'
      aria-label={menus.title}
      title={menus.title}
    >
      <Box as='span' display='inline-flex'>{menus.icon ?? <FontAwesomeIcon icon={faChartPie} />}</Box>
    </MenuButton>
    <Portal>
      <MenuList minWidth='unset' zIndex={50}>
        {menuEntries(menus.settings.map((c): Type_MenuEntry => c.options.length === 1
          ? { key: c.key, is_submenu: false, node: figureChoiceItems([c])[0] }
          : submenuEntry(c.key, c.label, c.options.map(o => (
            <CheckItem
              key={o.value}
              glyph={optionIcon(o)}
              label={o.label}
              checked={c.value === o.value}
              disabled={c.disabled || o.disabled}
              title={o.title}
              closeOnSelect={false}
              onClick={() => { if (c.value !== o.value) c.choose(o.value) }}
            />
          )), {
            disabled: !anyEnabled([c]),
            // À plat, le choix garde son titre de section.
            flat: figureChoiceItems([c])
          })))}
      </MenuList>
    </Portal>
  </Menu>
)

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
export const PositionModeMenu = ({ app_data, tagg, figure }: {
  app_data: Class_ApplicationData,
  tagg: Class_DataTagGroup,
  /**
   * 02/10/2026 — LA FENÊTRE ACTIVE EST UNE COURONNE (os#1511) : « Placer », qui place des nœuds du
   * diagramme, se retire. « Afficher » reste celui du diagramme, que la couronne liée suit ;
   * détachée, elle a sa coupe (l'arbre du bouton), et il se retire aussi.
   *
   * 03/10/2026 — « Dessiner » et « Anneau » se retirent aussi : le dessin est un réglage de la
   * figure (son bouton en tête de barre), l'anneau suit l'ordre des dimensions (le ⇄). Sans rien à
   * offrir, la dimension n'a pas de menu.
   */
  figure?: { detached: boolean }
}) => {
  const { t } = app_data
  const mode = tagg.position_mode
  // Valeur héritée hors liste : on affiche l'icône absolu sans le cocher.
  const current = POSITION_MODE_META.find(m => m.value === mode) ?? POSITION_MODE_META[0]
  // os#1383 — La référence ne se propose qu'en échelle adaptée : c'est le seul mode qu'elle règle.
  const reference = mode === 'scale_adapted' ? scaleAdaptedReferenceDataTagOf(app_data, tagg) : undefined
  // os#1511 — LE DESSIN change la structure du diagramme (des nœuds engendrés), là où la position
  // n'est qu'une façon de lire : en lecture, il ne s'offre que si la page le demande
  // (`dimension_drawing`). Chaque moitié du menu a son propre gate ; seule, elle se montre à plat.
  const can_draw = dimensionDrawingEnabledFor(app_data)
  const can_position = positionModeSelectorEnabledFor(app_data)
  const drawing = dimensionDrawingOf(app_data, tagg)
  const in_bands = dimensionInMemberBands(app_data, tagg)
  // os#1511 (Julien, 07/10) — plus de mode d'écart des enfants ici : l'écart est CONSTANT, et sa
  // valeur se règle dans « Navigation » et par le curseur en haut de la légende.
  const position_items = <>
    {can_position ? POSITION_MODE_META.map(m => (
      <CheckItem
        key={m.value}
        icon={<FontAwesomeIcon icon={m.icon} />}
        label={t(m.label_key)}
        checked={m.value === mode}
        onClick={() => applyPositionMode(app_data, tagg, m.value)}
      />
    )) : null}
    {/* os#1383 — Sur quoi l'échelle adaptée se cale. Sans ce réglage, la grandeur de
        référence est celle qui se trouvait à l'écran quand le mode a pris : l'échelle
        dépend alors du chemin de clics. Désignée, elle se recalcule à chaque dessin. */}
    {can_position && mode === 'scale_adapted' && tagg.tags_list.length > 0 ? <>
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
  // La couronne : Afficher (liée), puis Dessiner sur la figure ; rien de « Placer ».
  // os#1511, 07/10 — « Afficher » se retire là où la NATURE de la dimension tranche (Julien : « en
  // mode multiple on peut ne cliquer qu'un seul membre, je ne vois pas l'intérêt ») : hiérarchisée,
  // elle est additive, toujours en choix multiple (`Class_DataTagGroup.admissibleBanner`) ; en
  // séquence (années, scénarios), un membre à la fois. Seule une dimension plate, dont rien ne dit
  // si ses membres se somment, garde le choix.
  const nature_decides = tagg.is_hierarchical || tagg.banner === 'sequence'
  const show_items = nature_decides ? null : submenuEntry('show', t('Banner.show_submenu'), <>
    <CheckItem
      label={t('Banner.draw_one')}
      glyph={<DimensionDrawingIcon name='one' />}
      checked={drawing === 'one'}
      onClick={() => applyDimensionDrawing(app_data, tagg, 'one')}
    />
    <CheckItem
      label={t('Banner.show_many')}
      checked={drawing !== 'one'}
      onClick={() => { if (drawing === 'one') applyDimensionDrawing(app_data, tagg, 'multi') }}
    />
  </>)
  if (figure !== undefined) {
    if (!can_draw || figure.detached || show_items === null) return null
    return <Menu placement='bottom-start'>
      <MenuButton
        as={Button}
        size='xs'
        variant='menuconfigpanel_icon_button'
        aria-label={t('Banner.show_submenu') + ' — ' + tagg.name}
        title={t('Banner.show_submenu') + ' — ' + tagg.name}
      >
        <FontAwesomeIcon icon={faChartPie} />
      </MenuButton>
      <Portal>
        <MenuList minWidth='unset' zIndex={50}>
          {/* « Afficher » seul s'aplatit : ses deux choix se posent dans le menu. */}
          {menuEntries([show_items])}
        </MenuList>
      </Portal>
    </Menu>
  }
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
        {/* 07/10/2026 — LE BOUTON DIT LE DESSIN, comme celui d'une couronne (Julien) : un membre, en
            bandes, en nœuds, en diagrammes séparés. Sans dessin à offrir, le mode de position. */}
        {can_draw
          ? <DimensionDrawingIcon name={dimensionDrawingIconName(drawing, in_bands)} />
          : <FontAwesomeIcon icon={current.icon} />}
      </MenuButton>
    </OSTooltip>
    {/* Portal : hôtes à contexte d'empilement propre (topbar / panneau) — sans lui la
        MenuList peut s'ouvrir clippée. */}
    <Portal>
      <MenuList minWidth='unset' zIndex={50}>
        {can_draw
          ? menuEntries([
            /* os#1511 — TROIS QUESTIONS, DANS L'ORDRE OÙ ON SE LES POSE (Jean-Yves, 01/10 :
                séparer le choix d'un ou de plusieurs membres, la façon de les dessiner et leur
                placement). « Afficher » : un membre ou plusieurs. « Dessiner » : en bandes ou en
                nœuds, et dans quel ordre ; grisé tant qu'on n'affiche qu'un membre. « Placer » :
                le mode de position, et l'écart des enfants quand la dimension est en nœuds. */
            show_items,
            submenuEntry('draw', t('Banner.draw_submenu'), <>
              <CheckItem
                label={t('Banner.draw_bands')}
                glyph={<DimensionDrawingIcon name='bands' />}
                checked={drawing === 'multi'}
                onClick={() => applyDimensionDrawing(app_data, tagg, 'multi')}
              />
              {/* os#1511 — UN DIAGRAMME PAR MEMBRE est un dessin, à côté des bandes et des nœuds
                  (Julien, 07/10 : « c'est une option de Dessiner et pas de Placer »). Tous les
                  nœuds portent alors la dimension, sans que leur réglage change. */}
              <CheckItem
                label={t('Banner.draw_member_bands') + ` (${app_data.drawing_area.disaggregation_gap_value})`}
                glyph={<DimensionDrawingIcon name='separate' />}
                checked={in_bands}
                onClick={() => applyMemberBands(app_data, tagg, true)}
              />
              {tagg.is_hierarchical
                ? <Submenu label={t('Banner.draw_nodes')} glyph={<DimensionDrawingIcon name='nodes' />}
                  checked={drawing === 'nodes' && !in_bands}>
                  <MenuGroup title={t('Banner.draw_carriers')} fontSize='0.7rem'>
                    {dimensionCarrierCandidates(app_data).map(node => {
                      // os#1511 — un nœud qui TRANSFORME la dimension ne se coche pas (il se
                      // découperait en morceaux sans lien) ; déjà coché, il se décoche toujours.
                      const checked = node.own_driving_dimension === tagg
                      const refus = carrierRefusal(app_data, tagg, node.id)
                      return <CheckItem
                        key={node.id}
                        label={node.name + (refus !== undefined ? ' — ' + t('Banner.carrier_transforms') : '')}
                        title={refus !== undefined ? t('Banner.carrier_transforms_tooltip') : undefined}
                        checked={checked}
                        disabled={refus !== undefined && !checked}
                        closeOnSelect={false}
                        onClick={() => toggleDimensionCarrier(app_data, tagg, node.id)}
                      />
                    })}
                  </MenuGroup>
                </Submenu>
                : null}
              {/* os#1511 — sous un diagramme par membre, une dimension en nœuds peut colorer les flux. */}
              {drawing === 'nodes' && !in_bands &&
                app_data.drawing_area.sankey.data_taggs_list.some(d => d.member_bands === true)
                ? <CheckItem
                  label={t('Banner.members_color_flows')}
                  checked={tagg.paints_member_bands_flows}
                  closeOnSelect={false}
                  onClick={() => applyMembersColorFlows(app_data, tagg, !tagg.paints_flows)}
                />
                : null}
              {/* os#1511 — l'ORDRE DES MEMBRES vit dans « Navigation » (Julien, 08/10 : « ici on garde
                  l'essentiel, ce qu'un utilisateur en mode publication veut faire »). */}
            </>, { disabled: drawing === 'one' }),
            can_position
              ? submenuEntry('place', t('Banner.place_submenu'), position_items)
              : null
          ])
          : position_items}
      </MenuList>
    </Portal>
  </Menu>
}
