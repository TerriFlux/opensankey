import React, { useState, useEffect, RefObject, useRef, ReactNode, MutableRefObject } from 'react'
import {
  Button, Collapse, Box, useDisclosure,
  Heading, Slider, SliderTrack, SliderFilledTrack, SliderThumb, Text, Select, Checkbox, Switch,
  Menu, MenuButton, MenuList, MenuItem, HStack, VStack, Divider, Portal
} from '@chakra-ui/react'
import { CheckIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLocationDot, faPercent, faRulerVertical } from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { OSMultiSelect, typeElementSelectable, CustomFaEyeCheckIcon, OSTooltip, ConfigMenuNumberInput } from '../configmenus/MenuCommon'
import { PanelShell } from '../panels/PanelShell'
import { useMainZone } from '../spreadsheet/MainZoneTabs'
import { useModelBinding } from '../../hooks/useModelBinding'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { Class_MenuConfig } from '../../types/MenuConfig'
import { PANELS_TOPIC } from '../../types/EventBus'
import { Class_TagGroup, Class_DataTagGroup, Class_LevelTagGroup, Class_ViewTagGroup } from '../../types/TagGroup'
import { Class_LevelTag } from '../../types/Tag'
import { updateUnitaryStyles } from '../../Algorithms/UnitaryBoard'
import { disaggregate, aggregate, resetLocalHierarchy, disaggregationExpansion, applyContainerModeForDim } from '../../Algorithms/Hierarchies'
import { Class_NodeElement } from '../../Elements/Node'
import { Class_NodeDimension, Type_DisaggregationKind } from '../../Elements/NodeDimension'
import { Type_DisaggregationGap, const_default_position_x, const_default_position_y, Type_MacroTagGroup } from '../../types/Utils'
import { Type_PositionMode } from '../../types/PublishOptions'

// #1283 — largeur du tiroir de filtres (comme avant : compact).
const width_fitler_drawer = 270


/**
 * Redessine après un changement de sélection d'un groupe de data tags (les
 * bandes par tranche sont dérivées au draw — plus de liens enfants à
 * reconstruire). Suppose la sélection déjà appliquée sur `tagg`.
 */
export const applyDataTagChildLinks = (
  app_data: Class_ApplicationData,
  _tagg: Class_DataTagGroup,
  _entries: string[]
) => {
  // La sélection à valeur unique a pu poser bypass_redraws=true (preview Menu
  // unitaire) — on le remet à false pour que le redraw réapplique l'échelle.
  app_data.drawing_area.bypass_redraws = false
  app_data.drawing_area.draw()
}

/**
 * Bascule le mode d'affichage global (absolu / proportionnel / échelle adaptée). Ces modes
 * ne prennent sens qu'avec des data tags (ils gouvernent la réaction du diagramme au
 * changement de données) : le sélecteur vit donc À CÔTÉ des data tags (panneau Filtres et
 * topbar), plus dans la toolbar de droite. Reproduit le comportement de l'ancien groupe de
 * boutons : setScaleAdaptedMode fait son propre draw, les deux autres non.
 */
export const applyPositionMode = (app_data: Class_ApplicationData, m: Type_PositionMode) => {
  const da = app_data.drawing_area
  if (da.sankey.styles_dict['default'].shape_position_type === m) return
  if (m === 'absolute') { da.setAbsoluteMode(); da.draw() }
  else if (m === 'proportional') { da.setProportionalMode(); da.draw() }
  else { da.setScaleAdaptedMode() }
  // Rafraîchit les deux hôtes du sélecteur (panneau data + topbar), cf. MenuConfig.
  app_data.menu_configuration.updateAllComponentsRelatedToDataTags()
}

const POSITION_MODE_META: { value: Type_PositionMode, icon: IconDefinition, label_key: string }[] = [
  { value: 'absolute', icon: faLocationDot, label_key: 'Banner.posModeShort_absolute' },
  { value: 'proportional', icon: faPercent, label_key: 'Banner.posModeShort_proportional' },
  { value: 'scale_adapted', icon: faRulerVertical, label_key: 'Banner.posModeShort_scale_adapted' },
]

/**
 * Menu du mode d'affichage, COLLÉ au sélecteur de data tags : déclencheur icône seule
 * (icône du mode courant, discret), le texte + icône de chaque mode ne se voient que
 * dans le menu déroulé. Le mode est GLOBAL au diagramme (style 'default') : un seul
 * menu par hôte, pas un par groupe de data tags.
 */
export const PositionModeMenu = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const { t, drawing_area } = app_data
  const mode = drawing_area.sankey.styles_dict['default'].shape_position_type
  // Mode hérité hors liste (ex. 'parametric') : on affiche l'icône absolu sans le cocher.
  const current = POSITION_MODE_META.find(m => m.value === mode) ?? POSITION_MODE_META[0]
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
        aria-label={t('Banner.posMode_title')}
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
            onClick={() => applyPositionMode(app_data, m.value)}
          >
            <HStack spacing='0.5rem'>
              <Box as='span'>{t(m.label_key)}</Box>
              {m.value === mode ? <CheckIcon boxSize='0.6rem' /> : null}
            </HStack>
          </MenuItem>
        ))}
      </MenuList>
    </Portal>
  </Menu>
}

export const TopbarNavSelect = ({
  prefix, options, value, onChange, onPrev, onNext, prev_disabled, next_disabled, select_label, t, trailing
}: {
  prefix: string
  options: { value: string, label: string }[]
  value: string
  onChange: (value: string) => void
  onPrev: () => void
  onNext: () => void
  prev_disabled: boolean
  next_disabled: boolean
  select_label: string
  t: (key: string) => string
  // Contrôle collé au sélecteur, dans la même ligne (cf. PositionModeMenu en topbar).
  trailing?: JSX.Element
}) => {
  // Flèches : largeur FIXE minuscule (p='0', flexShrink=0) + variant 'ghost' (gris, pas le
  // solid vert par défaut) — sinon elles s'élargissent et écrasent le sélecteur.
  const arrow = (icon: JSX.Element, on_click: () => void, disabled: boolean, tip: string, aria: string) =>
    <OSTooltip placement='bottom' label={tip}>
      <Button
        size='xs' variant='ghost' colorScheme='gray'
        minW='1.1rem' w='1.1rem' h='1.5rem' p='0' flexShrink={0}
        isDisabled={disabled} onClick={on_click} aria-label={aria}
      >
        {icon}
      </Button>
    </OSTooltip>
  // Un contrôle collé (trailing) prend de la place dans la ligne : on élargit d'autant,
  // sinon c'est le <Select> qui se réduit.
  return <VStack spacing='0' align='stretch' w={trailing ? '15rem' : '13rem'} mr='0.7rem'>
    {prefix !== '' ? (
      <Box fontSize='0.6rem' lineHeight='1.1' color='gray.600' whiteSpace='nowrap' overflow='hidden' textOverflow='ellipsis'>
        {prefix}
      </Box>
    ) : null}
    <HStack spacing='0.1rem'>
      {arrow(<ChevronLeftIcon boxSize='0.9rem' />, onPrev, prev_disabled, t('Menu.precView'), 'prev')}
      <Box flex='1' minW='3rem'>
        <OSTooltip placement='bottom' label={select_label}>
          <Select
            size='xs'
            fontSize='0.7rem'
            value={value}
            onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => onChange(evt.target.value)}
          >
            {options.map(o => <option key={o.value} value={o.value} style={{ fontSize: '0.7rem' }}>{o.label}</option>)}
          </Select>
        </OSTooltip>
      </Box>
      {arrow(<ChevronRightIcon boxSize='0.9rem' />, onNext, next_disabled, t('Menu.nextView'), 'next')}
      {trailing ? <Box flexShrink={0} ml='0.2rem'>{trailing}</Box> : null}
    </HStack>
  </VStack>
}

export const BannerDataTagTopbar = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const { t, drawing_area } = app_data
  const { sankey } = drawing_area
  // #247 — re-render piloté par le modèle (lie le slot updater + cleanup au démontage).
  const refreshThis = useModelBinding(app_data.menu_configuration.ref_to_toolbar_data_tag_updater)

  const topbar_taggs = sankey.getTagGroupsAsList('data_taggs')
    .filter(grp => (grp as unknown as Class_DataTagGroup).banner === 'topbar') as unknown as Class_DataTagGroup[]

  if (topbar_taggs.length === 0) return <></>

  // Mode d'affichage (absolu / proportionnel / échelle adaptée) : collé au DERNIER
  // sélecteur, dans sa ligne — le mode gouverne la réaction du diagramme au changement
  // de données, mais il est GLOBAL : un seul bouton, pas un par groupe. En publish,
  // exposé via l'option `toolbar` (comme l'ancien groupe de la barre du bas).
  const show_pos_mode = !app_data.is_static || app_data.publish_options.toolbar
  const last_id = topbar_taggs[topbar_taggs.length - 1].id

  return <HStack className='BannerDataTagTopbar' alignItems='center' spacing='0.4rem'>
    {topbar_taggs.map(tagg => {
      if (Object.keys(tagg.tags_dict || {}).length < 1) return <React.Fragment key={tagg.id} />
      const tags = tagg.tags_list
      const selected_value = tagg.selected_tags_list[0]?.id ?? tags[0]?.id ?? ''
      const cur_idx = tags.findIndex(tg => tg.id === selected_value)
      const select = (id: string) => {
        tagg.selectTagsFromId(id)
        applyDataTagChildLinks(app_data, tagg, [id])
        app_data.menu_configuration.updateAllComponentsRelatedToDataTags()
        refreshThis()
      }
      return <TopbarNavSelect
        key={tagg.id}
        t={t}
        prefix={tagg.name}
        select_label={tagg.name}
        value={selected_value}
        options={tags.map(tag => ({ value: tag.id, label: tag.display_name }))}
        onChange={select}
        onPrev={() => { if (cur_idx > 0) select(tags[cur_idx - 1].id) }}
        onNext={() => { if (cur_idx >= 0 && cur_idx < tags.length - 1) select(tags[cur_idx + 1].id) }}
        prev_disabled={cur_idx <= 0}
        next_disabled={cur_idx < 0 || cur_idx >= tags.length - 1}
        trailing={(show_pos_mode && tagg.id === last_id)
          ? <PositionModeMenu app_data={app_data} /> : undefined}
      />
    })}
  </HStack>
}

/**
 * Redessine après un changement de sélection / d'activation du filtre vue. Suppose que
 * la sélection (selectTagsFromId) et le view_mode ont déjà été posés sur le groupe.
 * Factorisé pour être partagé entre l'ancien panneau (handleTagSelection mode 'unitary')
 * et le sélecteur de view tags en topbar (BannerViewTagTopbar). Reprend la stabilisation
 * de visibilité (2 passes) + mise en page auto optionnelle (view_filter_kind === 'auto').
 */
export const applyViewTagFilterRedraw = (app_data: Class_ApplicationData) => {
  const { drawing_area } = app_data
  const { sankey } = drawing_area
  sankey.nodeTagsUpdated()
  sankey.nodes_list.forEach(n => n.updateVisibilityFingerprint())
  updateUnitaryStyles(drawing_area)
  drawing_area.bypass_redraws = false
  // Stabilise la visibilité avant de décider d'une éventuelle mise en page auto.
  sankey.nodes_list.forEach(n => { void n.is_visible })
  sankey.nodes_list.forEach(n => { void n.is_visible })
  if (sankey.view_mode_active && drawing_area.view_filter_kind === 'auto') {
    const needs_auto_layout = sankey.visible_nodes_list.some(n =>
      n.position_x === const_default_position_x &&
      n.position_y === const_default_position_y)
    if (needs_auto_layout) drawing_area.nodePositioning.computeAutoSankey(true, true)
  }
  drawing_area.recenter()
  drawing_area.draw()
}

/**
 * Sélecteur de view tags (« générateur de vues ») rendu dans la topbar, sur le MODÈLE de
 * la navigation entre vues : bouton Préc. / <Select> / bouton Suiv. Agit sur le PREMIER
 * groupe de view tags affichable (banner !== 'none'). Sélectionner une valeur active le
 * filtre vue (view_mode) du groupe et applique la sélection ; l'option « vue complète »
 * le désactive. Remplace l'ancien panneau « Génération de vues » du tiroir de filtres.
 */
export const BannerViewTagTopbar = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const { t, drawing_area } = app_data
  const { sankey } = drawing_area
  // #247 — re-render piloté par le modèle (lie le slot updater + cleanup au démontage).
  const refreshThis = useModelBinding(app_data.menu_configuration.ref_to_unitarytag_filter_updater)

  // Concept unifié vue ⊕ viewtag : quand la feature Vues remplace le sélecteur viewtag
  // (utilisateurs plus), on masque ce sélecteur topbar (« tout est une vue nommée »).
  if (app_data.views_replace_viewtag_topbar) return <></>
  const view_taggs = sankey.getTagGroupsAsList('view_taggs')
    .filter(grp => grp.banner !== 'none') as unknown as Class_ViewTagGroup[]
  if (view_taggs.length === 0) return <></>
  // Décision : un seul bloc, sur le premier groupe actif.
  const tagg = view_taggs[0]
  const tags = tagg.tags_list
  if (tags.length < 1) return <></>

  // Index courant uniquement si le filtre est actif (view_mode) ; sinon « vue complète ».
  const cur_idx = tagg.view_mode ? tags.findIndex(tg => tg.is_selected) : -1
  // Libellé de l'option « vue complète » : personnalisable par groupe (full_view_label),
  // défaut = traduction Banner.view_full. Édité dans le menu de config (ViewsConfig), pas ici.
  const full_label = tagg.full_view_label || t('Banner.view_full')

  const selectValue = (id: string | null) => {
    // Batch la sélection sous bypass_redraws (applyViewTagFilterRedraw fait le draw
    // final). withBypassRedraws garantit le reset même si selectTagsFromId throw (#240).
    drawing_area.withBypassRedraws(() => {
      if (id === null) {
        tagg.view_mode = false
      } else {
        tagg.activated = true
        tagg.view_mode = true
        tagg.selectTagsFromId(id)
      }
    }, false)
    applyViewTagFilterRedraw(app_data)
    refreshThis()
  }

  // « Vue complète » = position la plus à gauche (valeur '') ; les flèches naviguent dans
  // [vue complète, tag0, tag1, …]. Suiv. depuis « vue complète » va donc au premier tag.
  return <Box className='BannerViewTagTopbar'>
    <TopbarNavSelect
      t={t}
      prefix={tagg.name}
      select_label={tagg.name}
      value={cur_idx >= 0 ? tags[cur_idx].id : ''}
      options={[{ value: '', label: full_label }, ...tags.map(tag => ({ value: tag.id, label: tag.display_name }))]}
      onChange={(v: string) => selectValue(v === '' ? null : v)}
      onPrev={() => {
        if (cur_idx === 0) selectValue(null)
        else if (cur_idx > 0) selectValue(tags[cur_idx - 1].id)
      }}
      onNext={() => {
        if (cur_idx === -1) selectValue(tags[0].id)
        else if (cur_idx < tags.length - 1) selectValue(tags[cur_idx + 1].id)
      }}
      prev_disabled={cur_idx === -1}
      next_disabled={cur_idx === tags.length - 1}
    />
  </Box>
}

/**
 * Component that show filters for for link value and tag group (node,flow &  data)
 *
 * @param {*} { app_data }
 * @return {*}
 */
export const ToolbarFilter = ({ app_data, hide_floating_button }: {
  app_data: Class_ApplicationData,
  // En éditeur, le bouton flottant historique est masqué : le bouton filtre vit dans la colonne
  // d'outils rétractable (cf. SankeyMenu), qui pilote le drawer via ref_toggle_filter_drawer.
  hide_floating_button?: boolean
}) => {
  const hasVisibleFilters = () => {
    const { sankey } = app_data.drawing_area

    // Vérifier les filtres conditionnels de base
    const has_data_type_filter = app_data.publish_options.data_type
    const has_value_filter = app_data.publish_options.value_filter

    // Vérifier UnitaryTagGroupFilter
    const view_taggs = Object.values(sankey.view_taggs_dict).filter(tagg => tagg.banner !== 'none')
    const has_unitary_filter = app_data.publish_options.view_filter && view_taggs.length > 0

    // Vérifier LevelTagFilter
    const nb_level_taggs = Object.values(sankey.level_taggs_dict).filter(tagg => tagg.banner !== 'none').length
    let has_level_filter = app_data.publish_options.level_filter && nb_level_taggs > 0
    if (app_data.publish_options.level_filter && nb_level_taggs === 1) {
      const level_tagg = Object.values(sankey.level_taggs_dict)[0]
      has_level_filter = level_tagg.tags_list.length > 1
    }

    // Vérifier NodeTagGroupFilter (element mode)
    const element_taggs = [...Object.values(sankey.node_taggs_dict), ...Object.values(sankey.flux_taggs_dict)]
      .filter(tagg => tagg.banner !== 'none' && !tagg.id.includes('unitary'))
    const has_element_filter = app_data.publish_options.node_filter &&
      element_taggs.some(tagg => Object.keys(tagg.tags_dict || {}).length >= 1)

    // Vérifier DataTagGroupFilter
    const data_taggs = Object.values(sankey.data_taggs_dict)
      .filter(tagg => tagg.banner === 'one' || tagg.banner === 'multi')
    const has_data_filter = app_data.publish_options.data_filter &&
      data_taggs.some(tagg => Object.keys(tagg.tags_dict || {}).length >= 1)
    return has_data_type_filter || has_value_filter || has_unitary_filter ||
      has_level_filter || has_element_filter || has_data_filter ||
      app_data.has_sankey_dev // « Toutes données » (dev) suffit à ouvrir le drawer
  }
  // #1283b — bascule GLOBALE de révélation des groupes de tags cachés (bannière
  // « Aucun »), partagée par toutes les sections du tiroir. Pilotée par le bouton
  // unique de l'en-tête (à côté du pin) et transmise en prop aux filtres.
  const [showHiddenGroups, setShowHiddenGroups] = useState(false)
  // #1283 — le tiroir de filtres ne fait plus QUE filtrer (panneau unique, sans
  // onglet) : les groupes de tags s'éditent EN PLACE (crayon par carte) et les
  // Vues sont devenues un onglet de l'inspecteur (cible « Vue »).
  // #247 — re-render piloté par le modèle (lie le slot updater + cleanup au démontage).
  useModelBinding(app_data.menu_configuration.ref_toolbar)
  // OS#300 — re-render quand un panneau change (ouverture/fermeture/éviction).
  useModelBinding(undefined, (r) => app_data.menu_configuration.subscribe(PANELS_TOPIC, r))
  // OS#300 — L'ouverture du filtre EST sa présence dans le modèle (panels), en
  // ÉDITEUR comme en PUBLISH : même emplacement (à droite) et même socle unifié
  // (pop-up déplaçable ou barre latérale). Dérivée de panels (pas de useState :
  // sinon désync quand un autre menu prend la barre latérale et éjecte le filtre).
  const drawerOpen = app_data.menu_configuration.panels.isOpen('filter')
  useMainZone(app_data)
  const drawer_width_px = width_fitler_drawer
  // Décalage horizontal du bouton flottant d'ouverture (publish) selon l'état.
  const width_drawer = (drawerOpen ? drawer_width_px + app_data.drawing_area.fit_margin / 2 : 0)
    + app_data.drawing_area.fit_margin
  // Géométrie par défaut d'une pop-up filtre : bord droit (comme la config), sans
  // recouvrir le centre du dessin.
  const filterPopupGeometry = () => ({
    w: 340,
    h: Math.min(560, window.innerHeight - app_data.drawing_area.getNavBarHeight()
      - app_data.drawing_area.getBottomBarHeight() - 24),
    x: Math.max(0, window.innerWidth - 340 - app_data.menu_configuration.getToolsColumnWidthPx() - 16),
    y: app_data.drawing_area.getNavBarHeight() + 8
  })
  // Ouvre/ferme le filtre. Panneau unifié 'filter' : pop-up (superposée) ou barre
  // latérale (exclusive, gérée par panels). Centralise tous les chemins (bouton
  // colonne d'outils, bouton flottant publish, ref_close_filter_drawer).
  const setFilterOpen = (open: boolean) => {
    app_data.menu_configuration.filter_drawer_open = open
    const panels = app_data.menu_configuration.panels
    if (open) {
      if (!panels.isOpen('filter')) {
        // OS#300 — contenant par défaut selon le contexte (barre latérale si
        // affichée, sinon pop-up au bord droit).
        const mode = panels.defaultOpenMode()
        panels.setMode('filter', mode, mode === 'popup' ? { geometry: filterPopupGeometry() } : undefined)
      }
    } else {
      panels.close('filter')
    }
  }
  app_data.menu_configuration.ref_close_filter_drawer.current = setFilterOpen
  app_data.menu_configuration.ref_toggle_filter_drawer.current = () => setFilterOpen(!drawerOpen)

  // Disponibilité publiée pour la colonne d'outils (bouton filtre conditionnel). Posée AVANT le
  // retour anticipé pour rester correcte même sans filtre visible.
  const filters_visible = hasVisibleFilters()
  app_data.menu_configuration.filter_bar_available = filters_visible

  // #1258 — mode épinglé : publier la largeur courante (elle varie selon
  // l'onglet actif) pour que la réserve du dessin suive. Hook AVANT le retour
  // anticipé (règle des hooks).
  const pinned = app_data.menu_configuration.filter_panel_pinned
  useEffect(() => {
    app_data.menu_configuration.filter_drawer_width_px = drawer_width_px
    if (pinned && drawerOpen) app_data.menu_configuration.notifyMainZone()
  }, [drawer_width_px, pinned, drawerOpen])

  // OS#300 — Publish : le filtre s'ouvre par défaut (comme l'ancien tiroir), en
  // pop-up à droite, dès qu'il y a des filtres à montrer.
  useEffect(() => {
    if (app_data.is_static && filters_visible
      && !app_data.menu_configuration.panels.isOpen('filter')) {
      setFilterOpen(true)
    }
  }, [])

  if (!filters_visible) return <></>

  // #1283 — création de groupe TOUJOURS accessible (même si aucun groupe n'existe
  // encore, donc aucune carte à éditer). createTagGroup vit sur le modèle Sankey
  // (OS base) ; on l'expose ici pour n'importe quel type. Gated licence/éditeur.
  const createGroup = (type: Type_MacroTagGroup) => {
    app_data.runWithSnapshotUndo(
      () => {
        app_data.drawing_area.sankey.createTagGroup(type)
        app_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
        app_data.menu_configuration.updateAllComponentsRelatedToTags()
      },
      () => app_data.menu_configuration.updateAllComponentsRelatedToTags()
    )
  }
  const can_create_groups = !app_data.is_static && app_data.has_sankey_plus
  // #285 (fusion dataTags/fluxTags) — plus d'entrée « Données » séparée : on crée
  // une étiquette de flux, et la case « Dimension » de l'éditeur la promeut en
  // dimension combinatoire (conversion sans perte). Les data_taggs existants
  // (imports Excel, timeline…) restent éditables via le filtre Données.
  const group_types: { type: Type_MacroTagGroup, label: string, dev?: boolean }[] = [
    { type: 'node_taggs', label: app_data.t('filter_panel.short.node') },
    { type: 'flux_taggs', label: app_data.t('filter_panel.short.link') },
    { type: 'level_taggs', label: app_data.t('filter_panel.short.level'), dev: true }
  ]

  // #1283b — nombre de groupes CACHÉS (bannière « Aucun ») ayant au moins un tag,
  // parmi les types rendus dans ce tiroir (élément node/flux, données, niveaux).
  // Pilote la présence du bouton GLOBAL de révélation dans l'en-tête.
  const countHiddenTagGroups = () => {
    const { sankey } = app_data.drawing_area
    const hasTags = (tagg: { tags_dict?: object }) => Object.keys(tagg.tags_dict || {}).length >= 1
    let n = 0
    if (app_data.publish_options.node_filter) {
      n += [...Object.values(sankey.node_taggs_dict), ...Object.values(sankey.flux_taggs_dict)]
        .filter(t => t.banner === 'none' && !t.id.includes('unitary') && hasTags(t)).length
    }
    if (app_data.publish_options.data_filter) {
      n += Object.values(sankey.data_taggs_dict).filter(t => t.banner === 'none' && hasTags(t)).length
    }
    if (app_data.publish_options.level_filter) {
      n += Object.values(sankey.level_taggs_dict).filter(t => t.banner === 'none' && t.has_tags).length
    }
    return n
  }
  const nb_hidden_groups = countHiddenTagGroups()

  // #1258 — contenu du panneau, PARTAGÉ entre le tiroir overlay (Drawer) et le
  // mode ÉPINGLÉ (panneau docké pleine hauteur qui réserve sa largeur, comme
  // la config épinglée).
  const panel_content = <>
    {/* #1283 — en-tête : « + Groupe » (création, toujours dispo) à gauche,
        épingle à droite. */}
    <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.3rem 0.3rem 0' }}>
      {can_create_groups ? (
        <Menu placement='bottom-start'>
          <MenuButton
            as={Button}
            size='xs'
            variant='menuconfigpanel_add_button'
            sx={{ height: 'auto', paddingBlock: '0.15rem', paddingInline: '0.5rem' }}
            leftIcon={app_data.icon_library.icon_add_element}
          >
            {app_data.t('Tags.GE')}
          </MenuButton>
          <MenuList>
            {group_types.filter(g => !g.dev || app_data.has_sankey_dev).map(g => (
              <MenuItem key={g.type} onClick={() => createGroup(g.type)}>
                {g.label}
              </MenuItem>
            ))}
          </MenuList>
        </Menu>
      ) : <Box />}
      <Box style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
        {/* #1283b — bouton GLOBAL unique : révèle/masque les groupes de tags cachés
            (bannière « Aucun ») de toutes les sections. Présent seulement s'il en
            existe ; le compteur indique combien. */}
        {nb_hidden_groups > 0 ? (
          <OSTooltip label={showHiddenGroups ? app_data.t('filter_panel.hide_hidden') : app_data.t('filter_panel.show_hidden', { count: nb_hidden_groups })}>
            <Button
              size='xs'
              variant={showHiddenGroups ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
              sx={{ paddingInline: '0.3rem', minWidth: 'auto', width: 'auto', flex: 'none', height: 'auto' }}
              leftIcon={showHiddenGroups ? app_data.icon_library.icon_element_visible : app_data.icon_library.icon_element_invisible}
              onClick={() => setShowHiddenGroups(v => !v)}
            >
              {nb_hidden_groups}
            </Button>
          </OSTooltip>
        ) : null}
        {/* OS#300 — épingler/ancrer vit dans l'en-tête uniforme du panneau
            (PanelShell) en éditeur ; le bouton épingle propre au tiroir est retiré. */}
      </Box>
    </Box>
    <Box layerStyle='drawerFilterBox'>
      {
        (app_data.publish_options.data_type || app_data.publish_options.value_filter)
          ? <FilterDisplay app_data={app_data} /> : <></>
      }
      {
        app_data.publish_options.level_filter ? <LevelTagFilter app_data={app_data} show_hidden_groups={showHiddenGroups} /> : <></>
      }
      {
        app_data.publish_options.node_filter ? <NodeTagGroupFilter app_data={app_data} level={false} show_hidden_groups={showHiddenGroups} /> : <></>
      }
      {
        // #285 — section « Flux » unifiée (étiquettes de flux + dimensions) ;
        // remplace l'ancienne section « Données » séparée.
        (app_data.publish_options.node_filter || app_data.publish_options.data_filter)
          ? <FluxTagGroupFilter app_data={app_data} show_hidden_groups={showHiddenGroups} /> : <></>
      }
    </Box>
  </>

  // OS#300 — Filtre unifié (id 'filter') : pop-up déplaçable ou barre latérale
  // partagée, ancré à DROITE, en éditeur COMME en publish (même emplacement que
  // dans l'appli). Le contenu (panel_content) est identique dans les deux modes.
  // En publish, le bouton flottant sert d'ouvreur (pas de colonne d'outils) ; en
  // éditeur il est masqué (l'ouverture passe par la colonne d'outils).
  return <>
    {!hide_floating_button ? <Button
      id='buttonOpenFilterDrawer'
      variant='toolbar_button_open_filter'
      size='sizeToolbarButton'
      style={{
        left: width_drawer,
        top: app_data.drawing_area.getNavBarHeight() + (app_data.drawing_area.fit_margin)
      }}
      onClick={() => setFilterOpen(!drawerOpen)}
    >
      {
        app_data.icon_library.icon_filter_tags
      }
    </Button> : <></>}

    <PanelShell
      app_data={app_data}
      id='filter'
      title={app_data.t('filter_panel.title', { defaultValue: 'Filtres et légende' })}
      allowedModes={['popup', 'sidebar']}
      onClose={() => setFilterOpen(false)}
    >
      {panel_content}
    </PanelShell>
  </>
}

// Contenu « Paramètres d'affichage » (seuils flux/étiquettes + flux nuls), rendu
// sans cadre propre pour être fusionné dans le panneau « Affichage » (cf. FilterDisplay).
const FlowValueFilterContent = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const { t } = app_data

  // Get the maximum value a link can have, so it is used as maximum value we wan filter in popover_link_visual_filter
  const max_link_value = Math.max(0, ...app_data.drawing_area.sankey.links_list.map(l => Number(l.getMaxValue()) / (l.shape_local_link_scale ?? 1))) + 1
  // #247 — re-render piloté par le modèle (lie le slot updater + cleanup au démontage).
  const refreshThis = useModelBinding(app_data.menu_configuration.ref_to_toolbar_link_visual_filter_updater)

  // #seuil px — les seuils flux/étiquette peuvent s'exprimer en pixels (épaisseur
  // rendue) plutôt qu'en valeur de donnée. En mode pixel, le curseur va de 0 au
  // plus grand flux tracé (+1 px de marge). Chaque unité garde son propre seuil
  // (filter_*_px vs filter_*), on ne fait que sélectionner l'actif ici.
  const is_px = app_data.drawing_area.filter_unit === 'pixel'
  // Zoom live : les seuils px sont en pixels ÉCRAN, donc les max des curseurs =
  // épaisseur/hauteur locale × k (cf. DrawingArea.getZoomScale).
  const zoom_k = app_data.drawing_area.getZoomScale()
  const max_link_thickness_px = Math.ceil(Math.max(0, ...app_data.drawing_area.sankey.links_list.map(l => l.thickness)) * zoom_k) + 1
  const seuil_max = is_px ? max_link_thickness_px : max_link_value
  const flux_seuil = is_px ? app_data.drawing_area.filter_link_value_px : app_data.drawing_area.filter_link_value
  const label_seuil = is_px ? app_data.drawing_area.filter_label_px : app_data.drawing_area.filter_label
  const set_flux_seuil = (v: number) => {
    if (is_px) app_data.drawing_area.filter_link_value_px = v
    else app_data.drawing_area.filter_link_value = v
  }
  const set_label_seuil = (v: number) => {
    if (is_px) app_data.drawing_area.filter_label_px = v
    else app_data.drawing_area.filter_label = v
  }

  // Seuils LABEL nœud + LABEL stock (même unité). Max des curseurs : valeur du nœud
  // (data_value) / |stock initial| en mode valeur ; hauteur de bande rendue en mode px.
  const nodes_list = app_data.drawing_area.sankey.nodes_list
  const stock_nodes = nodes_list.filter(n => n.has_stock)
  const max_node_value = Math.max(0, ...nodes_list.map(n => n.data_value)) + 1
  const max_stock_value = Math.max(0, ...stock_nodes.map(n => Math.abs(n.stock_initial_value ?? 0))) + 1
  const max_node_px = Math.ceil(Math.max(0, ...nodes_list.map(n => n.getShapeHeightToUse())) * zoom_k) + 1
  // Hauteur rendue d'un stock = scaleValueToPx(|.|)/facteur (cf. Node._getNaturalShapeHeight).
  const max_stock_px = Math.ceil(Math.max(0, ...stock_nodes.map(n => {
    const f = n.stock_height_scale_factor > 0 ? n.stock_height_scale_factor : 1
    return app_data.drawing_area.scaleValueToPx(Math.abs(n.stock_initial_value ?? 0)) / f
  })) * zoom_k) + 1
  const node_max = is_px ? max_node_px : max_node_value
  const stock_max = is_px ? max_stock_px : max_stock_value
  const node_seuil = is_px ? app_data.drawing_area.filter_node_px : app_data.drawing_area.filter_node
  const stock_seuil = is_px ? app_data.drawing_area.filter_stock_px : app_data.drawing_area.filter_stock
  const set_node_seuil = (v: number) => {
    if (is_px) app_data.drawing_area.filter_node_px = v
    else app_data.drawing_area.filter_node = v
  }
  const set_stock_seuil = (v: number) => {
    if (is_px) app_data.drawing_area.filter_stock_px = v
    else app_data.drawing_area.filter_stock = v
  }
  // Un seuil nœud/stock change la visibilité des labels → re-tracer les nœuds.
  const redraw_nodes = () => app_data.drawing_area.sankey.nodes_list.forEach(n => n.draw())


  // Ref to popover button trigger to trap focus at popover when onBlur of NumberInput
  const ref: RefObject<HTMLButtonElement> = useRef(null)

  return (
    <Box
      layerStyle='menuconfigpanel_grid'>

      {/* Titre + bascule d'unité (valeur de donnée ↔ pixels). */}
      <HStack justify='space-between' align='center' width='100%'>
        <Text fontSize='sm'>
          {t('Banner.p_aff_seuil')}
        </Text>
        <Select
          size='xs'
          width='auto'
          value={app_data.drawing_area.filter_unit}
          onChange={evt => {
            app_data.drawing_area.filter_unit = evt.target.value === 'pixel' ? 'pixel' : 'value'
            refreshThis()
            // Le sens des deux seuils change → re-tracer flux ET étiquettes.
            app_data.drawing_area.sankey.draw()
          }}
        >
          <option value='value'>{t('Banner.seuil_unit_value')}</option>
          <option value='pixel'>{t('Banner.seuil_unit_pixel')}</option>
        </Select>
      </HStack>

      {/* Les deux seuils (flux + étiquettes) sur une seule ligne, chacun :
          libellé court + slider + saisie compacte. */}
      <HStack spacing='0.6rem' align='center' width='100%'>
        <Box
          display='grid' gridTemplateColumns='auto 1fr auto' gap='0.2rem'
          alignItems='center' flex='1' minW={0}
        >
          <OSTooltip label={is_px ? t('Banner.filtre_px') : t('Banner.filtre')}>
            <Text fontSize='xs'>{t('Banner.seuil_flux')}</Text>
          </OSTooltip>
          <Slider
            variant='slider_filter_link_value'
            min={0}
            max={seuil_max}
            value={flux_seuil}
            onChange={evt => {
              set_flux_seuil(+evt)
              refreshThis()
              app_data.drawing_area.sankey.visible_links_list.forEach(link => {
                link.draw()
                link.target.drawLinksArrow()
              })
            }
            } >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
          <Box width='2.4rem'>
            <ConfigMenuNumberInput
              t={app_data.t}
              default_value={flux_seuil}
              function_on_blur={(value) => {
                if (value && value > seuil_max) {
                  value = seuil_max
                }
                if (value) {
                  set_flux_seuil(value)
                  refreshThis()
                  app_data.drawing_area.sankey.draw()
                }

                ref.current?.focus() //avoid closure of popover
              }}
              minimum_value={0}
              maximum_value={seuil_max}
              stepper={false}
            />
          </Box>
        </Box>

        <Box
          display='grid' gridTemplateColumns='auto 1fr auto' gap='0.2rem'
          alignItems='center' flex='1' minW={0}
        >
          <OSTooltip label={is_px ? t('Banner.fl_px') : t('Banner.fl')}>
            <Text fontSize='xs'>{t('Banner.seuil_label')}</Text>
          </OSTooltip>
          <Slider
            variant='slider_filter_link_value'
            min={0}
            max={seuil_max}
            value={label_seuil}
            onChange={(evt) => {
              set_label_seuil(+evt)
              refreshThis()
              app_data.drawing_area.sankey.visible_links_list.forEach(link => link.drawValueLabel())
            }}
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
          <Box width='2.4rem'>
            <ConfigMenuNumberInput
              t={app_data.t}
              default_value={label_seuil}
              function_on_blur={(value) => {

                if (value) {
                  if (value > seuil_max) {
                    value = seuil_max
                  }
                  set_label_seuil(value)
                  refreshThis()
                  app_data.drawing_area.sankey.links_list.forEach(link => link.drawValueLabel())
                }

                ref.current?.focus() //avoid closure of popover
              }}
              minimum_value={0}
              maximum_value={seuil_max}
              stepper={false}
            />
          </Box>
        </Box>
      </HStack>

      {/* Seuils des LABELS de nœud et de stock, sur une même ligne (même unité que
          les seuils flux/étiquette). Sous le seuil, le label est masqué, la forme reste. */}
      <HStack spacing='0.6rem' align='center' width='100%'>
        <Box
          display='grid' gridTemplateColumns='auto 1fr auto' gap='0.2rem'
          alignItems='center' flex='1' minW={0}
        >
          <OSTooltip label={is_px ? t('Banner.seuil_node_px') : t('Banner.seuil_node_tip')}>
            <Text fontSize='xs'>{t('Banner.seuil_node')}</Text>
          </OSTooltip>
          <Slider
            variant='slider_filter_link_value'
            min={0}
            max={node_max}
            value={node_seuil}
            onChange={evt => {
              set_node_seuil(+evt)
              refreshThis()
              redraw_nodes()
            }}
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
          <Box width='2.4rem'>
            <ConfigMenuNumberInput
              t={app_data.t}
              default_value={node_seuil}
              function_on_blur={(value) => {
                if (value) {
                  if (value > node_max) {
                    value = node_max
                  }
                  set_node_seuil(value)
                  refreshThis()
                  redraw_nodes()
                }
                ref.current?.focus() //avoid closure of popover
              }}
              minimum_value={0}
              maximum_value={node_max}
              stepper={false}
            />
          </Box>
        </Box>

        <Box
          display='grid' gridTemplateColumns='auto 1fr auto' gap='0.2rem'
          alignItems='center' flex='1' minW={0}
        >
          <OSTooltip label={is_px ? t('Banner.seuil_stock_px') : t('Banner.seuil_stock_tip')}>
            <Text fontSize='xs'>{t('Banner.seuil_stock')}</Text>
          </OSTooltip>
          <Slider
            variant='slider_filter_link_value'
            min={0}
            max={stock_max}
            value={stock_seuil}
            onChange={evt => {
              set_stock_seuil(+evt)
              refreshThis()
              redraw_nodes()
            }}
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
          <Box width='2.4rem'>
            <ConfigMenuNumberInput
              t={app_data.t}
              default_value={stock_seuil}
              function_on_blur={(value) => {
                if (value) {
                  if (value > stock_max) {
                    value = stock_max
                  }
                  set_stock_seuil(value)
                  refreshThis()
                  redraw_nodes()
                }
                ref.current?.focus() //avoid closure of popover
              }}
              minimum_value={0}
              maximum_value={stock_max}
              stepper={false}
            />
          </Box>
        </Box>
      </HStack>

      {/* Flux nuls visibles + Nœuds orphelins, sur une même ligne. Chacun rejoue le
          chemin complet du rechargement (drawing_area.draw()) : un sankey.draw()/
          drawElements() seul ne reflète pas la bascule (mémo de visibilité +
          bypass_redraws éventuel). */}
      <HStack spacing='0.8rem' align='center'>
        <Checkbox
          size='sm'
          isChecked={app_data.drawing_area.show_zero_links}
          onChange={evt => {
            app_data.drawing_area.show_zero_links = evt.target.checked
            app_data.drawing_area.sankey.nodes_list.forEach(n => n.resetLinkVisibilitiesMemorization())
            refreshThis()
            app_data.drawing_area.draw()
            app_data.drawing_area.legend.draw()
          }}
        >
          <Text fontSize='xs'>{t('Banner.fn')}</Text>
        </Checkbox>

        <Checkbox
          size='sm'
          isChecked={app_data.drawing_area.show_orphan_nodes}
          onChange={evt => {
            app_data.drawing_area.show_orphan_nodes = evt.target.checked
            app_data.drawing_area.sankey.nodes_list.forEach(n => n.resetLinkVisibilitiesMemorization())
            refreshThis()
            app_data.drawing_area.draw()
            app_data.drawing_area.legend.draw()
          }}
        >
          <Text fontSize='xs'>{t('Banner.no')}</Text>
        </Checkbox>
      </HStack>
    </Box>
  )
}

export const CollapseButton = ({ app_data, isOpen, onToggle }: {
  app_data: Class_ApplicationData, isOpen: boolean, onToggle: () => void
}) => {
  return <Button variant='collapse_filter'
    size='sizeBtnCollapseFilter'
    onClick={onToggle}>
    {isOpen ? app_data.icon_library.icon_collapse_up : app_data.icon_library.icon_collapse_down}
  </Button>
}

export const FilterWrapperBox = ({ app_data, title, defaultOpen, children }: React.PropsWithChildren<{
  app_data: Class_ApplicationData,
  title: string,
  defaultOpen?: boolean
  children: ReactNode
}>) => {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: defaultOpen })
  return <Box layerStyle={'filter_wrapper'}>
    <Box layerStyle='filter_head_box'>
      <Heading variant='title_filter_tagg'>{title}</Heading>
      <CollapseButton app_data={app_data} isOpen={isOpen} onToggle={onToggle} />
    </Box>
    <Collapse in={isOpen} animateOpacity>
      <Box className='content_filter'>
        {children}
      </Box>
    </Collapse>
  </Box>
}

export const FilterDataType = ({ app_data, defaultOpen, bare }: { app_data: Class_ApplicationData, defaultOpen?: boolean, bare?: boolean }) => {
  const { t } = app_data
  // #247 — re-render piloté par le modèle (lie le slot updater + cleanup au démontage).
  const refreshThis = useModelBinding(app_data.menu_configuration.ref_to_toolbar_updater)

  // #665 — `relayout=true` relance le PLACEMENT des nœuds (écartement par nœud,
  // droiture des flux) et pas seulement le tracé. Un changement de type de données
  // affichées (Valeurs/Structure/…) modifie les épaisseurs et la topologie visible :
  // sans ce re-placement, les positions restent figées jusqu'au prochain changement de
  // dataTag (qui, lui, passe par drawing_area.draw → drawElements). On reproduit ici le
  // même `drawElements` (passes de positionnement + enforceStraightLinks) pour que la
  // mise en page suive la bascule de type de données, hors mode absolu seul.
  const redrawNodeLinkLegend = (relayout = false) => {
    app_data.drawing_area.sankey.nodes_list.forEach(n => n.resetLinkVisibilitiesMemorization())
    if (relayout) {
      // OS#1246 — sémantique de draw COMPLET : la bascule de type de données change
      // l'épaisseur/valeur de TOUS les flux sans forcément déplacer leurs ancrages.
      // Un drawElements() nu laisserait Node.updateLinksPositions figer leur épaisseur
      // (il ne redessine hors full-draw que si l'ancrage a bougé ≥1px). D'où
      // drawElementsAsFullDraw, qui pose _in_full_draw le temps du redraw.
      app_data.drawing_area.drawElementsAsFullDraw()
    } else {
      app_data.drawing_area.sankey.draw()
    }
    app_data.drawing_area.legend.draw()
    // Le tableur (matrices TES/TER en mode valeur) affiche valueCurrent, qui suit le type de
    // données (donnée/résultat). Reconstruire le classeur pour que la bascule s'y répercute
    // sans avoir à fermer/rouvrir le tableur. No-op si le tableur n'est pas ouvert.
    app_data.menu_configuration.ref_to_spreadsheet?.current()
    app_data.menu_configuration.ref_to_save_in_cache_indicator.current(true)
  }
  let has_results = false
  app_data.drawing_area.sankey.links_list.forEach(l => has_results = has_results || l.has_result)
  let has_intervals = false
  app_data.drawing_area.sankey.links_list.forEach(l => has_intervals = has_intervals || l.has_intervals || l.value?.value_option === 'intervals')

  const content = <>
    {/* Selector 1: Data source */}
    <Box layerStyle='menuconfig_grid'>
      <Box fontStyle='h3' >
        {t('Banner.sdr')}
      </Box>
      <Select
        value={app_data.drawing_area.data_source}
        onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
          app_data.drawing_area.data_source = evt.target.value as 'data' | 'data_label' | 'structure' | 'reconciled'
          // interval_display n'a de sens qu'avec data_source='reconciled' : sans ce reset, le getter
          // type_data renverrait 'free_interval'/'free_value' pour data/data_label/structure et afficherait
          // valueMin/Max réconciliés au lieu de valueData (option "Collectées").
          if (evt.target.value !== 'reconciled') {
            app_data.drawing_area.interval_display = 'structure'
          }
          refreshThis()
          redrawNodeLinkLegend(true)
        }}>
        <option key='structure' value='structure' >{t('Banner.structure')}</option>
        {has_results ? <>
          <option key='data' value='data' >{t('Banner.collected_data')}</option>
          <option key='data_label' value='data_label' >{t('Banner.collected_data_label')}</option>
          <option key='reconciled' value='reconciled' >{t('Banner.reconciled')}</option>
        </> : <option key='reconciled' value='reconciled' >{t('Banner.collected_data')}</option>}
      </Select>
    </Box>
    {/* Selector 2: Interval display */}
    {has_intervals && app_data.publish_options.data_type_intervals ?
      <Box layerStyle='menuconfig_grid'>
        <Box fontStyle='h3' >
          {t('Banner.indetermined_value')}
        </Box>
        <Select
          value={app_data.drawing_area.interval_display}
          onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
            app_data.drawing_area.interval_display = evt.target.value as 'structure' | 'free_value' | 'free_interval'
            refreshThis()
            redrawNodeLinkLegend(true)
          }}>
          <option key='none' value='structure' >{t('Banner.structure')}</option>
          <option key='free_interval' value='free_interval' >{t('Banner.free_interval')}</option>
          {has_results && app_data.drawing_area.data_source === 'reconciled' && (
            <option key='free_value' value='free_value' >{t('Banner.free_value')}</option>
          )}
        </Select>
      </Box> : <></>}
    {/* « Toutes données » a été déplacé dans le filtre des view tags (mode développeur) —
        cf. RevealDataLinksControl dans UnifiedTagGroupFilter. */}
  </>

  // En mode `bare`, on renvoie le contenu nu pour l'intégrer dans le panneau
  // fusionné « Affichage » (cf. FilterDisplay) ; sinon, cadre autonome historique.
  if (bare) return content

  return <FilterWrapperBox
    app_data={app_data}
    title={t('Banner.title_data_type')}
    defaultOpen={defaultOpen}>
    {content}
  </FilterWrapperBox>
}

/**
 * Panneau unifié « Affichage » : fusionne « Données affichées » (type de données +
 * révélation) et « Paramètres d'affichage » (seuils flux/étiquettes + flux nuls)
 * sous un seul titre/cadre. Chaque sous-bloc reste conditionné à son publish_option.
 */
const FilterDisplay = ({ app_data, defaultOpen }: { app_data: Class_ApplicationData, defaultOpen?: boolean }) => {
  const { t } = app_data
  const show_data_type = app_data.publish_options.data_type
  const show_value_filter = app_data.publish_options.value_filter
  return <FilterWrapperBox
    app_data={app_data}
    title={t('Banner.title_display')}
    defaultOpen={defaultOpen}>
    {show_data_type ? <FilterDataType app_data={app_data} bare /> : <></>}
    {show_data_type && show_value_filter ? <Divider my='0.4rem' /> : <></>}
    {show_value_filter ? <FlowValueFilterContent app_data={app_data} /> : <></>}
  </FilterWrapperBox>
}

// Types pour la configuration des différents modes
// #285 (fusion dataTags/fluxTags) — 'flux' : section d'édition dédiée listant
// les étiquettes de flux ET les dimensions (data_taggs) ensemble, chacune avec
// sa case Dimension. 'element' redevient nœuds seuls.
type TagFilterMode = 'element' | 'level' | 'data' | 'unitary' | 'flux'
interface TagFilterConfig {
  mode: TagFilterMode
  title_key: string
  show_title_column: boolean
  show_palette_switch: boolean
  show_type_selection_header: boolean
  update_method: string
  ref_updater_key?: string
}
const TAG_FILTER_CONFIGS: Record<TagFilterMode, TagFilterConfig> = {
  element: {
    mode: 'element',
    title_key: 'fdn',
    show_title_column: true,
    show_palette_switch: true,
    show_type_selection_header: false,
    update_method: 'updateAllComponentsRelatedToNodeTags',
    ref_updater_key: 'ref_to_nodetag_filter_updater'
  },
  level: {
    mode: 'level',
    title_key: 'ndd',
    show_title_column: false,
    show_palette_switch: false,
    show_type_selection_header: false,
    update_method: 'updateAllComponentsRelatedToNodeTags',
  },
  data: {
    mode: 'data',
    title_key: 'sdd',
    show_title_column: false,
    show_palette_switch: false,
    show_type_selection_header: true,
    update_method: 'updateAllComponentsRelatedToDataTags',
    ref_updater_key: 'ref_to_datatag_filter_updater'
  },
  unitary: {
    mode: 'unitary',
    title_key: 'unitary_view',
    show_title_column: false,
    show_palette_switch: false,
    show_type_selection_header: false,
    update_method: 'updateAllComponentsRelatedToNodeTags',
    ref_updater_key: 'ref_to_unitarytag_filter_updater'
  },
  // #285 — section « Flux » unifiée (étiquettes de flux + dimensions). Le
  // comportement par ligne (palette vs bascule multi/one, sélecteur) est
  // résolu par le type RÉEL du groupe (cf. groupEffectiveMode), pas par le
  // mode. Re-render lié à l'updater des tags de flux (= nodetag_filter).
  flux: {
    mode: 'flux',
    title_key: 'flux',
    show_title_column: false,
    show_palette_switch: true,
    show_type_selection_header: false,
    update_method: 'updateAllComponentsRelatedToFluxAndDataTags',
    ref_updater_key: 'ref_to_nodetag_filter_updater'
  }
}

/**
 * Composant unifié pour filtrer tous les types de tags
 */
export const UnifiedTagGroupFilter = ({ app_data, mode, show_hidden_groups }: {
  app_data: Class_ApplicationData
  mode: TagFilterMode
  // #1283b — piloté par le bouton GLOBAL unique de l'en-tête du tiroir (à côté du
  // pin) : révèle les groupes cachés (bannière « Aucun ») de TOUTES les sections
  // d'un coup. Non fourni = masqués.
  show_hidden_groups?: boolean
}) => {
  const showHiddenGroups = show_hidden_groups ?? false
  const config = TAG_FILTER_CONFIGS[mode]
  const { t, drawing_area } = app_data
  const { sankey } = drawing_area
  // #247 — re-render piloté par le modèle : le slot updater dépend du mode de filtre (clé
  // dynamique dans menu_configuration), d'où le cast ; lié au montage, relâché au démontage.
  const refreshThis = useModelBinding(
    config.ref_updater_key
      ? (app_data.menu_configuration[config.ref_updater_key as keyof Class_MenuConfig] as MutableRefObject<() => void>)
      : undefined
  )

  // #1283 — fusion usage/édition : un seul groupe édité à la fois, déplié EN PLACE
  // sous sa rangée de filtre. Le renderer d'éditeur est injecté par OSP (null en
  // OS pur / sans licence → pas de crayon). Le prop du groupe se déduit de son
  // appartenance (element = node+flux, d'où pas de mapping mode→prop fiable).
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const renderGroupEditor = app_data.menu_configuration.render_tag_group_editor
  const groupProp = (group_id: string): string | null => {
    if (group_id in sankey.node_taggs_dict) return 'node_taggs'
    if (group_id in sankey.flux_taggs_dict) return 'flux_taggs'
    if (group_id in sankey.data_taggs_dict) return 'data_taggs'
    if (group_id in sankey.level_taggs_dict) return 'level_taggs'
    return null
  }

  // #1231 — État HYBRIDE LOCAL : des nœuds ont été désagrégés via le clic droit (et NON
  // via le menu Hiérarchies global). On se base sur l'ORIGINE de l'action
  // (`forced_by_local_action`), pas sur l'état d'affichage : une désagrégation globale
  // englobante/expansion pose aussi container_mode/is_expanded mais ne doit PAS afficher
  // le bouton. Couvre les 3 modes locaux (simple/englobant/expansion). Tant que c'est le
  // cas, le menu global ne doit pas agir (dropdowns désactivés) ; l'utilisateur doit
  // d'abord « Réinitialiser » pour revenir à l'état uniforme du menu.
  const has_local_hierarchy = mode === 'level' &&
    sankey.nodes_list.some(n => n.dimensions_as_parent.some(d => d.forced_by_local_action))

  // #285 — type RÉEL d'un groupe (pour le mode 'flux' mixte) : une dimension
  // (data_tagg) se comporte comme 'data', une étiquette de flux comme 'element'.
  const isDataGroup = (tagg: Class_TagGroup): boolean => tagg.id in sankey.data_taggs_dict
  const groupEffectiveMode = (tagg: Class_TagGroup): TagFilterMode =>
    mode === 'flux' ? (isDataGroup(tagg) ? 'data' : 'element') : mode

  // Récupération des tags selon le mode — passe par getTagGroupsAsList pour respecter _taggs_order.
  // #1283b — `include_hidden` : inclut ou non les groupes en bannière « Aucun ».
  // Par défaut ils sont exclus (tiroir épuré) ; le bouton bascule les révèle en
  // carte ÉDITION SEULE (cf. `edit_only`), seul accès à leur éditeur une fois cachés.
  const getTagsForMode = (include_hidden: boolean): Class_TagGroup[] => {
    const keep = (tagg: { banner: string }) => include_hidden || tagg.banner !== 'none'
    switch (mode) {
    case 'element':
      // #285 — nœuds seuls ; les étiquettes de flux ont leur section 'flux'.
      return sankey.getTagGroupsAsList('node_taggs')
        .filter(tagg => keep(tagg) && !tagg.id.includes('unitary')) as unknown as Class_TagGroup[]
    case 'flux':
      // #285 — étiquettes de flux + dimensions ensemble.
      return [...sankey.getTagGroupsAsList('flux_taggs'), ...sankey.getTagGroupsAsList('data_taggs')]
        .filter(tagg => keep(tagg) && !tagg.id.includes('unitary')) as unknown as Class_TagGroup[]
    case 'level':
      return sankey.getTagGroupsAsList('level_taggs')
        .filter(tagg => tagg.has_tags && keep(tagg)) as unknown as Class_TagGroup[]
    case 'data':
      // #1283 — inclut aussi sequence/topbar : consommés par la timeline/topbar,
      // mais on les liste en carte ÉDITION SEULE (nom + crayon) pour pouvoir
      // rechanger leur mode (sinon aucun accès à leur éditeur).
      return sankey.getTagGroupsAsList('data_taggs')
        .filter(keep) as unknown as Class_TagGroup[]
    case 'unitary':
      return sankey.getTagGroupsAsList('view_taggs')
        .filter(keep) as unknown as Class_TagGroup[]
    default:
      return [] as unknown as Class_TagGroup[]
    }
  }

  const updateComponents = () => {
    refreshThis()
    if (config.update_method == 'updateAllComponentsRelatedToNodeTags') {
      app_data.menu_configuration.updateAllComponentsRelatedToNodeTags()
      app_data.menu_configuration.updateAllComponentsRelatedToFluxTags()
    } else if (config.update_method == 'updateAllComponentsRelatedToDataTags') {
      app_data.menu_configuration.updateAllComponentsRelatedToDataTags()
    } else if (config.update_method == 'updateAllComponentsRelatedToFluxAndDataTags') {
      // #285 — section Flux mixte : rafraîchir flux ET dimensions.
      app_data.menu_configuration.updateAllComponentsRelatedToFluxTags()
      app_data.menu_configuration.updateAllComponentsRelatedToDataTags()
    } else if (config.update_method == 'updateAllComponentsRelatedToLevelTags') {
      app_data.menu_configuration.updateAllComponentsRelatedToLevelTags()
    }
  }

  // #1283b — liste affichée = groupes visibles, + les cachés si l'utilisateur les
  // a révélés via le bouton GLOBAL de l'en-tête.
  const taggs_in_banner = getTagsForMode(showHiddenGroups)

  // Fonction générique pour appliquer une palette
  const setApplyTagGroupPalette = (tagg: Class_TagGroup, checked: boolean) => {
    const taggs_dict = { ...sankey.node_taggs_dict, ...sankey.flux_taggs_dict }

    const dict_old_val = Object.fromEntries(Object.values(taggs_dict).map(t => [t.id, t.use_colors]))

    const applyPalette = () => {
      if (checked) {
        tagg.use_colors = true
      } else {
        tagg.use_colors = false
      }
      app_data.drawing_area.legend.draw()
      app_data.drawing_area.orderElementOnDA()
      updateComponents()
    }

    const revertPalette = () => {
      Object.values(taggs_dict).forEach(t => t.use_colors = dict_old_val[t.id])
      app_data.drawing_area.legend.draw()
      updateComponents()
    }

    app_data.history.saveUndo(revertPalette)
    app_data.history.saveRedo(applyPalette)
    applyPalette()
  }

  // Gestion des actions spécifiques selon le mode
  const handleTagSelection = (tagg: Class_TagGroup, values: string[]) => {
    // #1231 — pour les level taggs, mémoriser le niveau AVANT de changer la sélection,
    // afin de connaître le sens (descendre = désagréger / monter = agréger) et de
    // récupérer les nœuds visibles du niveau courant.
    const old_level_idx = (mode === 'level')
      ? tagg.tags_list.findIndex(t => t.is_selected)
      : -1
    const nodes_before = (mode === 'level')
      ? [...drawing_area.sankey.visible_nodes_list]
      : []

    // Actions spécifiques selon le mode
    const runModeActions = () => {
      switch (mode) {
      case 'level': {
        app_data.drawing_area.bypass_redraws = true
        // #1231 — Désagrégation/agrégation GLOBALE = application des fonctions LOCALES
        // nœud par nœud (mêmes positions que le clic droit : enfants remplissent le slot
        // du parent). On part des nœuds visibles du niveau précédent. La contrainte ±1
        // (dropdown) garantit un seul cran. En désagrégation uniforme « simple »,
        // `showAccordingToLevelTags()` ci-dessous nettoie les force-flags (visibilité
        // pilotée par les level-tags) ; en présence d'un type hybride mémorisé
        // (englobant/expansion) on garde les flags (cf. `any_hybrid`).
        const new_level_idx = tagg.tags_list.findIndex(t => t.id === values[0])
        // #1231 — DÉSAGRÉGATION : chaque nœud applique le type qu'il a MÉMORISÉ
        // (clic droit local : simple / englobant / expansion), au lieu de toujours
        // désagréger « simple ». La préférence survit aux agrégations et au
        // rechargement (cf. Class_NodeDimension.preferred_disaggregation).
        let any_hybrid = false
        if (old_level_idx >= 0 && new_level_idx > old_level_idx) {
          nodes_before.forEach(n => {
            const dim = n.dimensions_as_parent.find(d => d.id === tagg.id) as Class_NodeDimension | undefined
            if (!dim || dim.children.length === 0) return
            const pref: Type_DisaggregationKind | null = dim.preferred_disaggregation
            if (pref === 'expanded_left' || pref === 'expanded_right') {
            // Le parent est encore VISIBLE ici (on n'a pas encore appelé
            // showAccordingToLevelTags) → la redistribution des valeurs sur les
            // liens d'expansion a le bon contexte.
              any_hybrid = true
              // finalize=false : batch sous bypass_redraws ; un unique draw()+recenter()
              // est fait après la boucle (sinon un redraw complet par nœud → O(N²)).
              disaggregationExpansion(app_data, n as Class_NodeElement, pref === 'expanded_left', dim.children[0] as Class_NodeElement, false)
            } else if (pref && pref !== 'children') {
              any_hybrid = true
              applyContainerModeForDim(app_data, dim, pref)
            } else {
              disaggregate(app_data, n as Class_NodeElement, dim.children[0].id, false)
            }
          })
        } else if (old_level_idx >= 0 && new_level_idx < old_level_idx) {
          nodes_before.forEach(n => {
            const dim = n.dimensions_as_child.find(d => d.id === tagg.id)
            if (dim) {
              aggregate(app_data, n as Class_NodeElement, dim.parent.id, false)
            }
          })
        }
        // #1231 — `showAccordingToLevelTags()` efface TOUS les force-flags (y compris
        // container/expansion) pour piloter la visibilité par les level-tags. On ne le
        // fait QUE si la désagrégation est uniforme « simple » : dès qu'un nœud utilise
        // un type hybride (englobant/expansion), l'état est volontairement hybride et on
        // garde ses flags. L'agrégation (sens inverse) repasse toujours par le mode propre.
        if (!any_hybrid) {
          app_data.drawing_area.sankey.showAccordingToLevelTags()
        }
        app_data.drawing_area.sankey.nodes_list.forEach(n => n.dimensionsUpdated())
        updateUnitaryStyles(app_data.drawing_area)
        // #1231 — un changement de niveau (désagrégation/agrégation globale) est une commande
        // de positionnement → mode absolu (réf flux/datatag persistée conservée).
        app_data.drawing_area.setAbsoluteMode()
        // Réordonnancement E/S AVANT le draw (sous bypass_redraws=true encore actif) : il ne
        // réordonne que _links_order (géométrie relative, invariante par la translation du
        // recenter), donc son draw() interne est bypassé. Ainsi le draw() ci-dessous rend
        // directement le bon ordre — au lieu d'un 3e rendu complet après recenter (le draw()
        // réactivait le rendu → une passe entière gaspillée + rendu transitoire mal ordonné).
        app_data.drawing_area.sankey.nodes_list.forEach(node => node.reorganizeIOLinks())
        app_data.drawing_area.draw()
        app_data.drawing_area.recenter()
        app_data.drawing_area.orderElementOnDA()

        break
      }
      case 'data':
        handleDataTagSelection(tagg as unknown as Class_DataTagGroup, values)
        break
      case 'flux':
        // #285 — section mixte : une dimension applique la logique data (child
        // links), une étiquette de flux se contente de redessiner.
        if (isDataGroup(tagg)) {
          handleDataTagSelection(tagg as unknown as Class_DataTagGroup, values)
        } else {
          app_data.drawing_area.draw()
          app_data.drawing_area.orderElementOnDA()
        }
        break
      case 'element':
      //app_data.drawing_area.bypass_compute_positions = true
        app_data.drawing_area.draw()
        //app_data.drawing_area.bypass_compute_positions = false
        app_data.drawing_area.orderElementOnDA()
        break
      case 'unitary':
        updateUnitaryStyles(app_data.drawing_area)
        // Filtre vue générique : la sélection à valeur unique a posé bypass_redraws=true
        // (l.497) via un <Select> SANS wrapper de reset (contrairement au Menu unitaire)
        // → forcer false, sinon draw/recenter/computeAutoSankey ne rendent rien et il
        // faut re-sélectionner pour voir.
        if (app_data.drawing_area.sankey.view_mode_active) {
          app_data.drawing_area.bypass_redraws = false
        }
        app_data.drawing_area.draw()
        // Si le changement de valeur révèle des nœuds jamais positionnés (encore à la
        // position par défaut), relancer une mise en page auto (comme au chargement).
        // On stabilise d'abord la visibilité (2 passes de is_visible).
        if (app_data.drawing_area.sankey.view_mode_active) {
          app_data.drawing_area.sankey.nodes_list.forEach(n => { void n.is_visible })
          app_data.drawing_area.sankey.nodes_list.forEach(n => { void n.is_visible })
          // Mise en page auto SEULEMENT en sous-mode GLOBAL 'auto' (pas en 'filter' = on
          // garde les positions).
          if (app_data.drawing_area.view_filter_kind === 'auto') {
            const needs_auto_layout = app_data.drawing_area.sankey.visible_nodes_list.some(n =>
              n.position_x === const_default_position_x &&
            n.position_y === const_default_position_y)
            if (needs_auto_layout) {
              app_data.drawing_area.nodePositioning.computeAutoSankey(true, true)
            }
          }
          app_data.drawing_area.bypass_redraws = false
        }
        app_data.drawing_area.recenter()
        break
      }
    }

    const run = () => {
      if (values.length > 1) {
        tagg.selectTagsFromIds(values)
        runModeActions()
      } else {
        // Sélection à valeur unique : batch sous bypass_redraws (les case redessinent
        // explicitement). withBypassRedraws garantit le reset même si un case throw (#240).
        drawing_area.withBypassRedraws(() => {
          tagg.selectTagsFromId(values[0])
          runModeActions()
        }, false)
      }
      updateComponents()
    }

    // Le mode 'level' agrège/désagrège nœud par nœud avec register_history=false : c'est
    // volontaire (un undo par nœud saturerait la pile de 10 et casserait le redo, cf.
    // Hierarchies.tsx:281), mais le geste entier n'était alors annulable en rien alors
    // qu'il déplace tout le diagramme et crée/détruit des liens d'expansion. Un seul
    // snapshot pour tout le geste rétablit « un geste utilisateur = un undo ».
    // Les autres modes ne font que filtrer/redessiner : pas de snapshot (trop coûteux).
    if (mode === 'level') {
      app_data.runWithSnapshotUndo(run, updateComponents)
    } else {
      run()
    }
  }

  // Filtre vue : (ré)applique après un changement d'activation (œil) ou de sous-mode
  // global. Stabilise la visibilité (2 passes) puis, en sous-mode GLOBAL 'auto', relance
  // une mise en page auto si des nœuds révélés sont encore à la position par défaut.
  const applyViewFilter = () => {
    sankey.nodeTagsUpdated()
    sankey.nodes_list.forEach(n => n.updateVisibilityFingerprint())
    sankey.nodes_list.forEach(n => { void n.is_visible })
    sankey.nodes_list.forEach(n => { void n.is_visible })
    if (sankey.view_mode_active && drawing_area.view_filter_kind === 'auto') {
      const needs = sankey.visible_nodes_list.some(n =>
        n.position_x === const_default_position_x &&
        n.position_y === const_default_position_y)
      if (needs) drawing_area.nodePositioning.computeAutoSankey(true, true)
    }
    drawing_area.draw()
    updateComponents()
  }

  // Logique spécifique pour les data tags (sélection déjà appliquée en amont par
  // handleTagSelection). Délègue à la fonction factorisée partagée avec la topbar.
  const handleDataTagSelection = (tagg: Class_DataTagGroup, entries: string[]) => {
    applyDataTagChildLinks(app_data, tagg, entries)
  }

  // Création du sélecteur selon le type de banner

  const createSelector = (tagg: Class_TagGroup) => {
    if (tagg.banner === 'one') {
      const selected_value = tagg.selected_tags_list[0]?.id ?? ''

      // Pour les vues unitaires câblées (product/sector/unitary), Menu avec preview.
      // Les view tags GÉNÉRIQUES (filtre vue) utilisent le sélecteur standard <Select>
      // (même type que la sélection des données).
      if (mode === 'unitary' && tagg.id.includes('unitary')) {
        return (
          <Menu
            key={tagg.name}
            closeOnSelect={false} // Garde le menu ouvert
            placement="bottom-start"
          >
            {({ isOpen: _isOpen, onClose }) => (
              <>
                <MenuButton
                  width="100%"
                  textAlign="left"
                  fontWeight="normal"
                  fontSize="11px"
                  paddingX="4"
                  paddingY="1"
                  height="auto"
                  backgroundColor="white"
                  borderColor="inherit"
                  borderWidth="1px"
                  borderRadius="md"
                  justifyContent="space-between"  // Ajout de cette ligne
                  _hover={{
                    borderColor: 'gray.300'
                  }}
                  _active={{
                    borderColor: 'blue.500'
                  }}
                  sx={{
                    '& > span': {
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%'
                    }
                  }}
                >
                  <span>{tagg.tags_list.find(t => t.id === selected_value)?.display_name ?? ''}</span>
                  <ChevronDownIcon color="gray.500" />
                </MenuButton>
                <MenuList
                  maxHeight="300px"
                  overflowY="auto"
                  maxWidth="250px"  // ← Limite la largeur
                  minWidth="200px"  // ← Largeur minimale
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === 'Escape') {
                      onClose()
                    }
                  }}
                >
                  {tagg.tags_list.map((tag, _index) => (
                    <MenuItem
                      key={tag.id}
                      icon={tag.id === selected_value ? <CheckIcon /> : undefined}
                      onClick={() => {
                        // Preview pendant la navigation
                        drawing_area.withBypassRedraws(() => handleTagSelection(tagg, [tag.id]), false)
                      }}
                      onFocus={() => {
                        // Preview au survol/focus avec les flèches
                        drawing_area.withBypassRedraws(() => handleTagSelection(tagg, [tag.id]), false)
                      }}
                    >
                      {tag.display_name}
                    </MenuItem>
                  ))}
                </MenuList>
              </>
            )}
          </Menu>
        )
      }
      // #1231 — Hiérarchie pas-à-pas : en mode 'level', on ne peut changer que d'UN
      // niveau à la fois (désactiver les options à plus de ±1 du niveau courant). Force
      // à désagréger/agréger en se basant sur la position des parents/enfants immédiats.
      const cur_idx = tagg.tags_list.findIndex(t => t.id === selected_value)
      return (
        <Select
          key={tagg.name}
          value={selected_value}
          isDisabled={has_local_hierarchy}
          onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
            handleTagSelection(tagg, [evt.target.value])
          }}
        >
          {tagg.tags_list.map((tag, idx) => (
            <option
              key={tag.id}
              value={tag.id}
              disabled={mode === 'level' && cur_idx >= 0 && Math.abs(idx - cur_idx) > 1}
            >
              {tag.display_name}
            </option>
          ))}
        </Select>
      )
    } else if (tagg.banner === 'multi') {
      const options = tagg.tags_list.map(tag => ({
        label: tag.display_name,
        value: tag.id,
        selected: tag.is_selected,
        disabled: groupEffectiveMode(tagg) === 'data' && tagg.selected_tags_list.length < 2 && tag.id === tagg.selected_tags_list[0]?.id
      }))

      return (
        <OSMultiSelect
          t={t}
          elements={options}
          onClick={(entries: typeElementSelectable) => {
            handleTagSelection(tagg, entries.map(_ => _.value))
          }} />
      )
    }
    return <></>
  }

  // Création du bouton switch/checkbox selon le mode
  const createActionButton = (tagg: Class_TagGroup) => {
    // #285 — en section 'flux', le comportement suit le type réel du groupe.
    const emode = groupEffectiveMode(tagg)
    if (emode === 'element' && config.show_palette_switch) {
      return (
        <Switch
          justifySelf='end'
          alignSelf='center'
          height='1rem'
          isChecked={tagg.use_colors}
          onChange={evt => setApplyTagGroupPalette(tagg, evt.target.checked)} />
      )
    } else if (mode === 'level' && tagg instanceof Class_LevelTagGroup && (tagg as Class_LevelTagGroup).has_tags) {
      const level_tagg = tagg as Class_LevelTagGroup
      return (level_tagg.siblings !== undefined && level_tagg.siblings.filter(tagg => app_data.drawing_area.sankey.level_taggs_dict[tagg].banner != 'none').length > 0) ? (
        <Checkbox
          justifySelf='end'
          alignSelf='center'
          variant='activate_antagonist_checkbox'
          isChecked={level_tagg.activated}
          isDisabled={level_tagg.activated}
          icon={<CustomFaEyeCheckIcon />}
          onChange={evt => {
            const sankey = app_data.drawing_area.sankey
            level_tagg.activated = evt.target.checked
            if (evt.target.checked == true && level_tagg.linked_tag_group) level_tagg.linked_tag_group.use_colors = true
            if (evt.target.checked == false && level_tagg.linked_tag_group) level_tagg.linked_tag_group.use_colors = false
            app_data.drawing_area.sankey.level_taggs_list.forEach(tagg => tagg.activated = evt.target.checked)
            level_tagg.siblings.forEach(sib_tagg_id => {
              if (sankey.level_taggs_dict[sib_tagg_id])
                sankey.level_taggs_dict[sib_tagg_id].activated = !level_tagg.activated
            })
            const selected_tag = level_tagg.selected_tags_list.map(t => t.id)[0]
            level_tagg.selectTagsFromId(level_tagg.tags_list[0]?.id ?? '')
            app_data.drawing_area.withBypassRedraws(() => {
              app_data.drawing_area.sankey.showAccordingToLevelTags()
              app_data.drawing_area.nodePositioning.computeParametricVForTagg(
                level_tagg.selected_tags_list[0] as Class_LevelTag
              )
              app_data.drawing_area.resetAllVerticalIntervals()
              level_tagg.selectTagsFromId(selected_tag ?? '')
              app_data.drawing_area.sankey.nodes_list.forEach(n => n.dimensionsUpdated())
            })
            app_data.drawing_area.sankey.nodes_list.forEach(n => n.reorganizeIOLinks())
            updateComponents()
          }}
        />
      ) : <></>
    } else if (mode === 'unitary') {
      // MODIFIÉ : utiliser view_taggs_dict et gérer correctement les siblings
      const view_tagg = tagg as Class_ViewTagGroup
      // View tags GÉNÉRIQUES (filtre vue) : œil on/off (view_mode) à droite, comme
      // l'action des données. Le sous-mode (Filtre seul / Auto) est GLOBAL (un seul
      // Select pour tous les view tags, cf. ViewFilterKindControl plus bas).
      if (!tagg.id.includes('unitary')) {
        return (
          <OSTooltip label={t('Banner.view_mode_tt')}>
            <Box justifySelf='end' alignSelf='center'>
              <Checkbox
                icon={<CustomFaEyeCheckIcon />}
                isChecked={view_tagg.view_mode}
                onChange={evt => {
                  view_tagg.view_mode = evt.target.checked
                  applyViewFilter()
                }}
              />
            </Box>
          </OSTooltip>
        )
      }
      const view_taggs = Object.values(sankey.view_taggs_dict)
        .filter(t => t.banner !== 'none')

      // S'il n'y a qu'un seul tag group unitary, pas besoin de checkbox
      if (view_taggs.length <= 1) {
        return <></>
      }

      // Vérifier s'il y a des siblings
      const has_siblings = view_tagg.siblings && view_tagg.siblings.length > 0

      if (!has_siblings) {
        return <></>
      }

      return (
        <Checkbox
          justifySelf='end'
          alignSelf='center'
          variant='activate_antagonist_checkbox'
          isChecked={view_tagg.activated}
          isDisabled={view_tagg.activated}
          icon={<CustomFaEyeCheckIcon />}
          onChange={evt => {
            if (evt.target.checked) {
              sankey.nodeTagsUpdated()
              sankey.drawing_area.withBypassRedraws(() => {
                // Activer ce groupe
                view_tagg.activated = true

                // Désactiver tous les siblings
                view_tagg.siblings.forEach(sibling_id => {
                  const sibling = sankey.view_taggs_dict[sibling_id]
                  if (sibling) {
                    sibling.activated = false
                  }
                })

                // Sauvegarder le tag actuellement sélectionné de ce groupe
                const current_selected = view_tagg.selected_tags_list[0]?.id

                // Sélectionner le premier tag du groupe pour forcer la mise à jour
                if (view_tagg.tags_list.length > 0) {
                  // Si on a un tag sélectionné, on le garde, sinon on prend le premier
                  const tag_to_select = current_selected ?? view_tagg.tags_list[0].id
                  view_tagg.selectTagsFromId(tag_to_select)
                }

                // Appliquer les mêmes transformations que dans handleTagSelection pour le mode 'unitary'
                updateUnitaryStyles(app_data.drawing_area)
              })
              app_data.drawing_area.recenter()

              updateComponents()
            }
          }}
        />
      )
    } else if (emode === 'data') {
      return (
        <Switch
          justifySelf='end'
          alignSelf='center'
          height='1rem'
          isChecked={tagg.banner === 'multi'}
          onChange={evt => {
            tagg.banner = evt.target.checked ? 'multi' : 'one'
            tagg.selectTagsFromId(tagg.tags_list[0].id)
            updateComponents()
          }} />
      )
    }
    return <></>
  }

  // Mode d'affichage (absolu / proportionnel / échelle adaptée) : collé au sélecteur du
  // DERNIER groupe de data tags filtrable — le mode gouverne la réaction du diagramme au
  // changement de données, mais il est GLOBAL : un seul bouton pour la section, pas un
  // par groupe. En publish, exposé via l'option `toolbar` (comme l'ancien groupe de la
  // barre du bas). `isSelectorRow` reprend les conditions de rendu de la ligne ci-dessous.
  const isSelectorRow = (tagg: Class_TagGroup) =>
    Object.keys(tagg.tags_dict || {}).length >= 1
    && tagg.banner !== 'sequence' && tagg.banner !== 'topbar' && tagg.banner !== 'none'
  const show_pos_mode = mode === 'data' && (!app_data.is_static || app_data.publish_options.toolbar)
  const pos_mode_host_id = show_pos_mode
    ? [...taggs_in_banner].reverse().find(isSelectorRow)?.id ?? null
    : null

  // Génération des sélecteurs
  const SelectorOfTagsByGroup = taggs_in_banner.map(tagg => {
    if (Object.keys(tagg.tags_dict || {}).length < 1) {
      return <></>
    }
    const selector = createSelector(tagg)
    const actionButton = createActionButton(tagg)
    // #1283 — crayon d'édition en place : visible si OSP a injecté un éditeur
    // et que ce groupe est éditable (level 'Primaire' exclu, comme son titre).
    const editable = renderGroupEditor !== null
      && groupProp(tagg.id) !== null
      && !(mode === 'level' && tagg.name === 'Primaire')
    const is_editing = editingGroupId === tagg.id
    // #1283 — séquence/topbar : filtrés via la timeline/topbar, pas ici. On ne
    // montre que nom + crayon (édition du groupe, ex. rechanger son mode), sans
    // le sélecteur de filtrage qui ferait doublon.
    // #1283b — bannière « Aucun » : groupe caché du bandeau, présenté lui aussi
    // en carte édition seule pour rester éditable (et pouvoir le ré-afficher).
    const edit_only = tagg.banner === 'sequence' || tagg.banner === 'topbar' || tagg.banner === 'none'

    return (
      <Box key={tagg.id} layerStyle={groupEffectiveMode(tagg) === 'data' ? 'menuconfigpanel_grid' : 'menuconfig_grid'}>
        {mode === 'level' && tagg.name === 'Primaire' ? <></> :
          <Box layerStyle='menuconfigpanel_option_name' display='flex' alignItems='center' gap='0.3rem'>
            <Box as='span'>{tagg.name}</Box>
            {editable && (
              <OSTooltip label={t('filter_panel.edit_group')}>
                <Button
                  variant={is_editing ? 'menuconfigpanel_icon_button_activated' : 'menuconfigpanel_icon_button'}
                  size='xs'
                  sx={{ marginLeft: 'auto' }}
                  onClick={() => setEditingGroupId(is_editing ? null : tagg.id)}
                >
                  {app_data.icon_library.icon_edit_style}
                </Button>
              </OSTooltip>
            )}
          </Box>}
        {!edit_only && (
          <Box layerStyle='filter_grid_row'>
            {/* Le bouton de mode partage la cellule du sélecteur pour lui rester collé
                (la grille n'a que deux colonnes : sélecteur | action). */}
            <HStack spacing='0.2rem' minWidth='0'>
              <Box flex='1' minWidth='0'>
                <OSTooltip label={t('Banner.ndd_lst')}>
                  {selector}
                </OSTooltip>
              </Box>
              {tagg.id === pos_mode_host_id && (
                <Box flexShrink={0}><PositionModeMenu app_data={app_data} /></Box>
              )}
            </HStack>
            <OSTooltip label={t('Banner.ndd_chk')}>
              <Box justifySelf='end' alignSelf='center'>
                {actionButton}
              </Box>
            </OSTooltip>
          </Box>
        )}
        {/* #1283 — édition du groupe dépliée EN PLACE (renderer OSP). */}
        {editable && is_editing && renderGroupEditor && (
          <Box
            marginTop='0.3rem'
            padding='0.3rem'
            borderRadius='6px'
            border='1px dashed'
            borderColor='gray.200'
            background='gray.50'
          >
            {renderGroupEditor(groupProp(tagg.id) as string, tagg.id)}
          </Box>
        )}
      </Box>
    )
  })

  const title_filter_column = (app_data: Class_ApplicationData) => <Box layerStyle='filter_grid_row'>
    <Box></Box>
    <Box justifySelf='end' alignSelf='center'>{app_data.t('Menu.color')}</Box>
  </Box>

  // En-tête spécial pour les data tags
  const TypeSelectionHeader = config.show_type_selection_header ? (<Box layerStyle='filter_grid_row'>
    <Box></Box>
    <Box justifySelf='end' alignSelf='center'>{t('Menu.type_selection')}</Box>
  </Box>
  ) : null

  let title_key = config.title_key
  if (mode === 'level' && taggs_in_banner.length > 0 && taggs_in_banner[0].name === 'Primaire') title_key = 'ndd_one'

  // #1231 — Bouton « Réinitialiser » en haut du menu Hiérarchies, visible uniquement en
  // état hybride (désagrégations locales). Il ré-agrège les désagrégations locales et
  // revient à l'état uniforme du menu, ce qui réactive les dropdowns de niveau.
  const ResetHierarchyButton = (mode === 'level' && has_local_hierarchy) ? (
    <Box layerStyle='filter_grid_row'>
      <OSTooltip label={t('Banner.resetHierarchyTooltip')}>
        <Button
          size='xs'
          variant='menuconfigpanel_option_button'
          onClick={() => {
            // Détruit les liens d'expansion et efface tous les force-flags, donc tout le
            // travail de clic droit local : snapshot avant/après.
            app_data.runWithSnapshotUndo(
              () => { resetLocalHierarchy(app_data); updateComponents() },
              updateComponents
            )
          }}>
          {t('Banner.resetHierarchy')}
        </Button>
      </OSTooltip>
    </Box>
  ) : null

  // #1231 — Réglage GLOBAL du mode d'écart vertical des enfants (désagrégation / expansion /
  // englobement), placé sous Hiérarchies (mode 'level'). Persisté ; sert de défaut, le widget
  // par-nœud (clic droit) peut le surcharger ponctuellement.
  const GapModeControl = (mode === 'level') ? (
    <Box layerStyle='menuconfig_grid'>
      <Box layerStyle='menuconfigpanel_option_name'>
        <OSTooltip label={t('MEP.tooltips.childGapMode')}>
          <Box as='span'>{t('MEP.childGapMode')}</Box>
        </OSTooltip>
      </Box>
      <Box layerStyle='filter_grid_row'>
        <Select
          size='xs'
          value={drawing_area.disaggregation_gap_mode}
          onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
            const val = evt.target.value as Type_DisaggregationGap
            const f = (_: Type_DisaggregationGap) => {
              drawing_area.disaggregation_gap_mode = _
              updateComponents()
              // Ré-empiler les enfants englobés selon le nouveau mode (restackContainerChildren
              // au dessin) — sinon le changement de mode ne serait pas visible immédiatement.
              drawing_area.draw()
            }
            app_data.setValueAndSaveHistory(drawing_area, 'disaggregation_gap_mode', val, f)
          }}>
          <option value='fill'>{t('MEP.childGapFill')}</option>
          <option value='keep'>{t('MEP.childGapKeep')}</option>
          <option value='children_dy'>{t('MEP.childGapDy')}</option>
          <option value='constant'>{t('MEP.childGapConst')}</option>
        </Select>
      </Box>
      {drawing_area.disaggregation_gap_mode === 'constant' && (
        <Box layerStyle='filter_grid_row'>
          <Box layerStyle='menuconfigpanel_option_name'>
            <OSTooltip label={t('MEP.tooltips.childGapValue')}>
              <Box as='span'>{t('MEP.childGapValue')}</Box>
            </OSTooltip>
          </Box>
          <ConfigMenuNumberInput
            t={app_data.t}
            default_value={drawing_area.disaggregation_gap_value}
            function_on_blur={(evt: number | null | undefined) => {
              if (evt == null) return
              const f = (_: number) => {
                drawing_area.disaggregation_gap_value = _
                updateComponents()
                // Écart 'constant' lu en direct au dessin (containerChildGap) : re-dessiner ré-empile
                // immédiatement tous les cadres englobants avec la nouvelle valeur.
                drawing_area.draw()
              }
              app_data.setValueAndSaveHistory(drawing_area, 'disaggregation_gap_value', evt, f)
            }}
            minimum_value={0}
            stepper={true}
          />
        </Box>
      )}
    </Box>
  ) : null

  // Réglage GLOBAL du sous-mode du filtre vue (commun à tous les view tags) :
  // « Filtre seul » (garde les positions) vs « Mise en page auto ».
  // UI retirée temporairement (on y reviendra). La logique (drawing_area.view_filter_kind,
  // applyViewFilter) est conservée ; le sous-mode reste piloté par sa valeur par défaut.
  const ViewFilterKindControl = null
  // const ViewFilterKindControl = (mode === 'unitary' && !app_data.is_static && taggs_in_banner.some(t => !t.id.includes('unitary'))) ? (
  //   <Box layerStyle='menuconfig_grid'>
  //     <Box layerStyle='menuconfigpanel_option_name'>
  //       <OSTooltip label={t('Banner.view_mode_tt')}>
  //         <Box as='span'>{t('Banner.view_mode')}</Box>
  //       </OSTooltip>
  //     </Box>
  //     <Box layerStyle='filter_grid_row'>
  //       <Select
  //         size='xs'
  //         value={drawing_area.view_filter_kind}
  //         onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
  //           drawing_area.view_filter_kind = evt.target.value as 'filter' | 'auto'
  //           applyViewFilter()
  //         }}>
  //         <option value='filter'>{t('Banner.view_filter_only')}</option>
  //         <option value='auto'>{t('Banner.view_auto_layout')}</option>
  //       </Select>
  //     </Box>
  //   </Box>
  // ) : null

  // « Toutes données » (reveal_data_links) — UI retirée temporairement (on y reviendra).
  // La logique sous-jacente (app_data.reveal_data_links) est conservée.
  const RevealAllDataControl = null

  // Rendu final
  // #1283b — la section entière est masquée quand aucun groupe n'est affiché
  // (aucun visible, et cachés non révélés) : c'est le bouton GLOBAL de l'en-tête
  // qui les fait réapparaître, section comprise.
  return SelectorOfTagsByGroup.length > 0 ? (
    <FilterWrapperBox app_data={app_data} title={t(`Banner.${title_key}`)} defaultOpen={app_data.is_static}>
      {ResetHierarchyButton}
      {config.show_title_column ? title_filter_column(app_data) : null}
      {TypeSelectionHeader}
      {SelectorOfTagsByGroup}
      {ViewFilterKindControl}
      {GapModeControl}
      {RevealAllDataControl}
    </FilterWrapperBox>
  ) : <></>
}

// Composants wrapper pour maintenir la compatibilité avec l'API existante.
// #1283b — `show_hidden_groups` transmis par ToolbarFilter (bouton global).
export const NodeTagGroupFilter = ({ app_data, level, show_hidden_groups }: { app_data: Class_ApplicationData, level: boolean, show_hidden_groups?: boolean }) => (
  <UnifiedTagGroupFilter app_data={app_data} mode={level ? 'level' : 'element'} show_hidden_groups={show_hidden_groups} />
)

export const LevelTagFilter = ({ app_data, show_hidden_groups }: { app_data: Class_ApplicationData, show_hidden_groups?: boolean }) => {
  // #247 — re-render piloté par le modèle (lie le slot updater + cleanup au démontage).
  useModelBinding(app_data.menu_configuration.ref_to_toolbar_level_tag_filter_updater)
  const nb_level_taggs = Object.entries(app_data.drawing_area.sankey.level_taggs_dict).length
  if (nb_level_taggs == 0) {
    return <></>
  }
  if (nb_level_taggs == 1) {
    const level_tagg = Object.values(app_data.drawing_area.sankey.level_taggs_dict)[0]
    if (level_tagg.tags_list.length == 1) {
      return <></>
    }
  }
  const content_popover = <UnifiedTagGroupFilter app_data={app_data} mode="level" show_hidden_groups={show_hidden_groups} />

  return content_popover
}

export const DataTagGroupFilter = ({ app_data, show_hidden_groups }: { app_data: Class_ApplicationData, show_hidden_groups?: boolean }) =>
  <UnifiedTagGroupFilter app_data={app_data} mode="data" show_hidden_groups={show_hidden_groups} />

// #285 (fusion) — section d'édition unifiée « Flux » : étiquettes de flux +
// dimensions dans une seule liste, chacune avec sa case Dimension.
export const FluxTagGroupFilter = ({ app_data, show_hidden_groups }: { app_data: Class_ApplicationData, show_hidden_groups?: boolean }) =>
  <UnifiedTagGroupFilter app_data={app_data} mode="flux" show_hidden_groups={show_hidden_groups} />

export const UnitaryTagGroupFilter = ({ app_data, show_hidden_groups }: { app_data: Class_ApplicationData, show_hidden_groups?: boolean }) => {
  // #247 — re-render piloté par le modèle (lie le slot updater + cleanup au démontage).
  useModelBinding(app_data.menu_configuration.ref_to_unitarytag_filter_updater)

  // MODIFIÉ : vérifier dans view_taggs_dict au lieu de node_taggs_dict.
  // #1283b — on ne filtre PLUS les bannières « Aucun » ici : sinon un jeu de vues
  // entièrement caché n'afficherait pas la section, donc pas le bouton global qui
  // permet de les rééditer. Le filtrage réel se fait dans UnifiedTagGroupFilter.
  const view_taggs = Object.values(app_data.drawing_area.sankey.view_taggs_dict)

  if (view_taggs.length === 0) {
    return <></>
  }

  return <UnifiedTagGroupFilter app_data={app_data} mode="unitary" show_hidden_groups={show_hidden_groups} />
}