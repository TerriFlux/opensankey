import React, { useState, RefObject, useRef, ReactNode, useReducer } from 'react'
import {
  Drawer, Button, Collapse, DrawerContent, DrawerBody, Box, useDisclosure,
  Heading, Slider, SliderTrack, SliderFilledTrack, SliderThumb, Text, Select, Checkbox, Switch,
  Menu, MenuButton, MenuList, MenuItem
} from '@chakra-ui/react'
import { CheckIcon, ChevronDownIcon } from '@chakra-ui/icons'
import { OSMultiSelect, typeElementSelectable, CustomFaEyeCheckIcon, OSTooltip, ConfigMenuNumberInput } from '../configmenus/MenuCommon'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { Class_TagGroup, Class_DataTagGroup, Class_LevelTagGroup, Class_ViewTagGroup } from '../../types/TagGroup'
import { Class_LevelTag } from '../../types/Tag'
import { updateUnitaryStyles } from '../../Algorithms/UnitaryBoard'
import { disaggregate, aggregate, resetLocalHierarchy, disaggregationExpansion, applyContainerModeForDim } from '../../Algorithms/Hierarchies'
import { Class_NodeElement } from '../../Elements/Node'
import { Class_NodeDimension, Type_DisaggregationKind } from '../../Elements/NodeDimension'
import { Type_DisaggregationGap, const_default_position_x, const_default_position_y } from '../../types/Utils'

const width_fitler_drawer = 270

/**
 * Component that show filters for for link value and tag group (node,flow &  data)
 *
 * @param {*} { app_data }
 * @return {*} 
 */
export const ToolbarFilter = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const hasVisibleFilters = () => {
    const { sankey } = app_data.drawing_area

    // Vérifier les filtres conditionnels de base
    const has_data_type_filter = app_data.publish_options.data_type
    const has_value_filter = app_data.publish_options.value_filter

    // Vérifier UnitaryTagGroupFilter
    const view_taggs = Object.values(sankey.view_taggs_dict).filter(tagg => tagg.banner !== 'none')
    const has_unitary_filter = view_taggs.length > 0

    // Vérifier LevelTagFilter
    const nb_level_taggs = Object.values(sankey.level_taggs_dict).filter(tagg => tagg.banner !== 'none').length
    let has_level_filter = nb_level_taggs > 0
    if (nb_level_taggs === 1) {
      const level_tagg = Object.values(sankey.level_taggs_dict)[0]
      has_level_filter = level_tagg.tags_list.length > 1
    }

    // Vérifier NodeTagGroupFilter (element mode)
    const element_taggs = [...Object.values(sankey.node_taggs_dict), ...Object.values(sankey.flux_taggs_dict)]
      .filter(tagg => tagg.banner !== 'none' && !tagg.id.includes('unitary'))
    const has_element_filter = element_taggs.some(tagg => Object.keys(tagg.tags_dict || {}).length >= 1)

    // Vérifier DataTagGroupFilter
    const data_taggs = Object.values(sankey.data_taggs_dict)
      .filter(tagg => tagg.banner === 'one' || tagg.banner === 'multi')
    const has_data_filter = data_taggs.some(tagg => Object.keys(tagg.tags_dict || {}).length >= 1)
    return has_data_type_filter || has_value_filter || has_unitary_filter ||
      has_level_filter || has_element_filter || has_data_filter
  }
  const [drawerOpen, setDrawerOpen] = useState(app_data.is_static)
  const [, forceUpdate] = useReducer(x => x + 1, 0)
  const width_drawer = (drawerOpen ? width_fitler_drawer + app_data.drawing_area.fit_margin / 2 : 0) + app_data.drawing_area.fit_margin
  app_data.menu_configuration.ref_close_filter_drawer.current = setDrawerOpen
  app_data.menu_configuration.ref_toolbar.current = forceUpdate


  if (!hasVisibleFilters()) return <></>
  return <>
    <Button
      id='buttonOpenFilterDrawer'
      variant='toolbar_button_open_filter'
      size='sizeToolbarButton'
      style={{
        left: width_drawer,
        top: app_data.drawing_area.getNavBarHeight() + (app_data.drawing_area.fit_margin)
      }}
      onClick={() => setDrawerOpen(!drawerOpen)}
    >
      {
        app_data.icon_library.icon_filter_tags
      }
    </Button>

    <Drawer
      placement='left'
      isOpen={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      blockScrollOnMount={false}
      variant='drawer_menu_filter'
      trapFocus={false}
      onEsc={() => {
        // Override drawer onEscape() to use Class_applicationData 'escape' keyEvent & not the one by default from the <Drawer> component
        const ev = document
        const tmp = new KeyboardEvent('keydown', { key: 'Escape' })
        if (ev.onkeydown) {
          ev.onkeydown(tmp as KeyboardEvent)
        }
      }}
    >
      <DrawerContent
        style={{
          width: 'unset',
          height: 'fit-content',
          boxShadow: 'unset',
          maxWidth: 'unset',
          left: app_data.drawing_area.fit_margin / 2,
          maxHeight: app_data.drawing_area.window_fitting_height,
          //overflowY: 'auto',
          marginTop: (app_data.drawing_area.fit_margin) + document.getElementsByClassName('TopMenu')[0]?.getBoundingClientRect().y + document.getElementsByClassName('TopMenu')[0]?.getBoundingClientRect().height
        }}>
        <DrawerBody
          id='drawer_filter'
          style={{ padding: '0', width: width_fitler_drawer }}
        >
          <Box layerStyle='drawerFilterBox'>
            {
              app_data.publish_options.data_type ? <FilterDataType app_data={app_data} /> : <></>
            }
            {
              app_data.publish_options.value_filter ? <FlowValueFilter app_data={app_data} /> : <></>
            }
            <UnitaryTagGroupFilter app_data={app_data} />
            <LevelTagFilter app_data={app_data} />
            <NodeTagGroupFilter app_data={app_data} level={false} />
            <DataTagGroupFilter app_data={app_data} />
          </Box>
        </DrawerBody>
      </DrawerContent>
    </Drawer></>
}

const FlowValueFilter = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const { t } = app_data

  // Get the maximum value a link can have, so it is used as maximum value we wan filter in popover_link_visual_filter
  const max_link_value = Math.max(0, ...app_data.drawing_area.sankey.links_list.map(l => Number(l.getMaxValue()) / (l.shape_local_link_scale ?? 1))) + 1
  const [, setCount] = useState(0)
  app_data.menu_configuration.ref_to_toolbar_link_visual_filter_updater.current = () => setCount(a => a + 1)

  // Ref to popover button trigger to trap focus at popover when onBlur of NumberInput
  const ref: RefObject<HTMLButtonElement> = useRef(null)

  return <FilterWrapperBox
    app_data={app_data}
    title={t('Banner.p_aff')}
  >
    <Box
      layerStyle='menuconfigpanel_grid'>

      <Text >
        {t('Banner.filtre')}
      </Text>
      <Box layerStyle='filter_grid_row'>
        <Slider
          variant='slider_filter_link_value'
          min={0}
          max={max_link_value}
          value={app_data.drawing_area.filter_link_value}
          onChange={evt => {
            app_data.drawing_area.filter_link_value = +evt
            setCount(a => a + 1)
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

        <ConfigMenuNumberInput
          t={app_data.t}
          default_value={app_data.drawing_area.filter_link_value}
          function_on_blur={(value) => {
            if (value && value > max_link_value) {
              value = max_link_value
            }
            if (value) {
              app_data.drawing_area.filter_link_value = value
              setCount(a => a + 1)
              app_data.drawing_area.sankey.draw()
            }

            ref.current?.focus() //avoid closure of popover
          }}
          minimum_value={0}
          maximum_value={max_link_value}
          stepper={false}
        />
      </Box>

      <Text>
        {t('Banner.fl')}
      </Text>
      <Box layerStyle='filter_grid_row'>

        <Slider
          variant='slider_filter_link_value'
          min={0}
          max={max_link_value}
          value={app_data.drawing_area.filter_label}
          onChange={(evt) => {
            app_data.drawing_area.filter_label = +evt
            setCount(a => a + 1)
            app_data.drawing_area.sankey.visible_links_list.forEach(link => link.drawValueLabel())
          }}
        >
          <SliderTrack>
            <SliderFilledTrack />
          </SliderTrack>
          <SliderThumb />
        </Slider>
        <ConfigMenuNumberInput
          t={app_data.t}
          default_value={app_data.drawing_area.filter_label}
          function_on_blur={(value) => {

            if (value) {
              if (value > max_link_value) {
                value = max_link_value
              }
              app_data.drawing_area.filter_label = value
              setCount(a => a + 1)
              app_data.drawing_area.sankey.links_list.forEach(link => link.drawValueLabel())
            }

            ref.current?.focus() //avoid closure of popover
          }}
          minimum_value={0}
          maximum_value={max_link_value}
          stepper={false}
        />
      </Box>
    </Box>
  </FilterWrapperBox>
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

export const FilterDataType = ({ app_data, defaultOpen }: { app_data: Class_ApplicationData, defaultOpen?: boolean }) => {
  const { t } = app_data
  const [, setCount] = useState(0)
  app_data.menu_configuration.ref_to_toolbar_updater.current = () => setCount(a => a + 1)

  const redrawNodeLinkLegend = () => {
    app_data.drawing_area.sankey.nodes_list.forEach(n => n.resetLinkVisibilitiesMemorization())
    app_data.drawing_area.sankey.draw()
    app_data.drawing_area.legend.draw()
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
          setCount(a => a + 1)
          redrawNodeLinkLegend()
        }}>
        <option key='structure' value='structure' >{t('Banner.structure')}</option>
        {has_results ? <>
          <option key='data' value='data' >{t('Banner.collected_data')}</option>
          <option key='data_label' value='data_label' >{t('Banner.collected_data_label')}</option>
          <option key='reconciled' value='reconciled' >{t('Banner.reconciled')}</option>
        </> : <option key='reconciled' value='reconciled' >{t('Banner.only_data')}</option>}
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
            setCount(a => a + 1)
            redrawNodeLinkLegend()
          }}>
          <option key='none' value='structure' >{t('Banner.structure')}</option>
          <option key='free_interval' value='free_interval' >{t('Banner.free_interval')}</option>
          {has_results && app_data.drawing_area.data_source === 'reconciled' && (
            <option key='free_value' value='free_value' >{t('Banner.free_value')}</option>
          )}
        </Select>
      </Box> : <></>}
  </>

  return <FilterWrapperBox
    app_data={app_data}
    title={t('Banner.title_data_type')}
    defaultOpen={defaultOpen}>
    {content}
  </FilterWrapperBox>
}

// Types pour la configuration des différents modes
type TagFilterMode = 'element' | 'level' | 'data' | 'unitary'
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
  }
}

/**
 * Composant unifié pour filtrer tous les types de tags
 */
export const UnifiedTagGroupFilter = ({ app_data, mode, }: {
  app_data: Class_ApplicationData
  mode: TagFilterMode
}) => {
  const config = TAG_FILTER_CONFIGS[mode]
  const { t, drawing_area } = app_data
  const { sankey } = drawing_area
  // Component updater
  const [, setCount] = useState(0)

  // #1231 — État HYBRIDE LOCAL : des nœuds ont été désagrégés via le clic droit (et NON
  // via le menu Hiérarchies global). On se base sur l'ORIGINE de l'action
  // (`forced_by_local_action`), pas sur l'état d'affichage : une désagrégation globale
  // englobante/expansion pose aussi container_mode/is_expanded mais ne doit PAS afficher
  // le bouton. Couvre les 3 modes locaux (simple/englobant/expansion). Tant que c'est le
  // cas, le menu global ne doit pas agir (dropdowns désactivés) ; l'utilisateur doit
  // d'abord « Réinitialiser » pour revenir à l'état uniforme du menu.
  const has_local_hierarchy = mode === 'level' &&
    sankey.nodes_list.some(n => n.dimensions_as_parent.some(d => d.forced_by_local_action))

  // Configuration du updater selon le mode
  if (config.ref_updater_key && app_data.menu_configuration[config.ref_updater_key as keyof typeof app_data.menu_configuration]) {
    //@ts-expect-error xxx
    app_data.menu_configuration[config.ref_updater_key as keyof typeof app_data.menu_configuration].current = () => setCount(a => a + 1)
  }

  // Récupération des tags selon le mode — passe par getTagGroupsAsList pour respecter _taggs_order
  const getTagsForMode = (): Class_TagGroup[] => {
    switch (mode) {
    case 'element':
      return [...sankey.getTagGroupsAsList('node_taggs'), ...sankey.getTagGroupsAsList('flux_taggs')]
        .filter(tagg => tagg.banner !== 'none' && !tagg.id.includes('unitary')) as unknown as Class_TagGroup[]
    case 'level':
      return sankey.getTagGroupsAsList('level_taggs')
        .filter(tagg => tagg.has_tags && tagg.banner !== 'none') as unknown as Class_TagGroup[]
    case 'data':
      return sankey.getTagGroupsAsList('data_taggs')
        .filter(tagg => tagg.banner === 'one' || tagg.banner === 'multi') as unknown as Class_TagGroup[]
    case 'unitary':
      return sankey.getTagGroupsAsList('view_taggs')
        .filter(tagg => tagg.banner !== 'none') as unknown as Class_TagGroup[]
    default:
      return [] as unknown as Class_TagGroup[]
    }
  }

  const updateComponents = () => {
    setCount(c => c + 1)
    if (config.update_method == 'updateAllComponentsRelatedToNodeTags') {
      app_data.menu_configuration.updateAllComponentsRelatedToNodeTags()
      app_data.menu_configuration.updateAllComponentsRelatedToFluxTags()
    } else if (config.update_method == 'updateAllComponentsRelatedToDataTags') {
      app_data.menu_configuration.updateAllComponentsRelatedToDataTags()
    } else if (config.update_method == 'updateAllComponentsRelatedToLevelTags') {
      app_data.menu_configuration.updateAllComponentsRelatedToLevelTags()
    }
  }

  const taggs_in_banner = getTagsForMode()

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

    if (values.length > 1) {
      tagg.selectTagsFromIds(values)
    } else {
      drawing_area.bypass_redraws = true
      tagg.selectTagsFromId(values[0])
    }

    // Actions spécifiques selon le mode
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
            disaggregationExpansion(app_data, n as Class_NodeElement, pref === 'expanded_left', dim.children[0] as Class_NodeElement)
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
      app_data.drawing_area.draw()
      app_data.drawing_area.to_recenter = true
      app_data.drawing_area.recenter()
      app_data.drawing_area.sankey.nodes_list.forEach(node => node.reorganizeIOLinks())
      app_data.drawing_area.orderElementOnDA()

      break
    }
    case 'data':
      handleDataTagSelection(tagg as unknown as Class_DataTagGroup, values)
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
      app_data.drawing_area.to_recenter = true
      app_data.drawing_area.recenter()
      break
    }
    updateComponents()
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

  // Logique spécifique pour les data tags
  const handleDataTagSelection = (tagg: Class_DataTagGroup, entries: string[]) => {
    app_data.drawing_area.sankey.links_list.forEach(l => {
      if (l.is_multi_link) return

      if (entries.length === 1) {
        Object.keys(l.child_links).forEach(key => {
          l.child_links[key].delete()
          delete l.child_links[key]
        })
      } else {
        tagg.tags_list.forEach(tag => {
          if (!tag.is_selected && tag.id in l.child_links) {
            l.child_links[tag.id].delete()
            delete l.child_links[tag.id]
          }
        })
        tagg.selected_tags_list.forEach(tag => {
          if (tag.id in l.child_links || l.is_multi_link) return
          const child_link = app_data.drawing_area.sankey.addNewLink(l.source, l.target)
          child_link.copyFrom(l)
          l.addChildLink(child_link, tag)
        })
      }
    })

    // Les hauteurs de nœuds dépendent des valeurs des liens (qui viennent de changer
    // avec le data tag). En mode paramétrique il faut donc rejouer la chaîne de
    // positionnement pour que l'écart entre nœuds reste cohérent avec les nouvelles
    // hauteurs.
    if (app_data.drawing_area.sankey.default_style.shape_position_type === 'parametric') {
      app_data.drawing_area.nodePositioning.computeParametrization(false)
    }

    app_data.drawing_area.draw()
    app_data.drawing_area.sankey.visible_nodes_list.forEach(n => n.reorganizeIOLinks())
    app_data.drawing_area.orderElementOnDA()
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
                        drawing_area.bypass_redraws = true
                        handleTagSelection(tagg, [tag.id])
                        drawing_area.bypass_redraws = false
                      }}
                      onFocus={() => {
                        // Preview au survol/focus avec les flèches
                        drawing_area.bypass_redraws = true
                        handleTagSelection(tagg, [tag.id])
                        drawing_area.bypass_redraws = false
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
        disabled: mode === 'data' && tagg.selected_tags_list.length < 2 && tag.id === tagg.selected_tags_list[0]?.id
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
    if (mode === 'element' && config.show_palette_switch) {
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
            app_data.drawing_area.bypass_redraws = true
            app_data.drawing_area.sankey.showAccordingToLevelTags()
            app_data.drawing_area.nodePositioning.computeParametricVForTagg(
              level_tagg.selected_tags_list[0] as Class_LevelTag
            )
            app_data.drawing_area.resetAllVerticalIntervals()
            level_tagg.selectTagsFromId(selected_tag ?? '')
            app_data.drawing_area.sankey.nodes_list.forEach(n => n.dimensionsUpdated())
            app_data.drawing_area.draw()
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
              sankey.drawing_area.bypass_redraws = true
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
              app_data.drawing_area.draw()
              app_data.drawing_area.to_recenter = true
              app_data.drawing_area.recenter()

              updateComponents()
            }
          }}
        />
      )
    } else if (mode === 'data') {
      return (
        <Switch
          justifySelf='end'
          alignSelf='center'
          height='1rem'
          isChecked={tagg.banner === 'multi'}
          onChange={evt => {
            tagg.banner = evt.target.checked ? 'multi' : 'one'
            if (tagg.banner === 'one') {
              app_data.drawing_area.sankey.remove_child_links()
            }
            tagg.selectTagsFromId(tagg.tags_list[0].id)
            updateComponents()
          }} />
      )
    }
    return <></>
  }

  // Génération des sélecteurs
  const SelectorOfTagsByGroup = taggs_in_banner.map(tagg => {
    if (Object.keys(tagg.tags_dict || {}).length < 1) {
      return <></>
    }
    const selector = createSelector(tagg)
    const actionButton = createActionButton(tagg)

    return (
      <Box key={tagg.id} layerStyle={mode === 'data' ? 'menuconfigpanel_grid' : 'menuconfig_grid'}>
        {mode === 'level' && tagg.name === 'Primaire' ? <></> :
          <Box layerStyle='menuconfigpanel_option_name'>
            {tagg.name}
          </Box>}
        <Box layerStyle='filter_grid_row'>
          <OSTooltip label={t('Banner.ndd_lst')}>
            {selector}
          </OSTooltip>
          <OSTooltip label={t('Banner.ndd_chk')}>
            <Box justifySelf='end' alignSelf='center'>
              {actionButton}
            </Box>
          </OSTooltip>
        </Box>
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
            resetLocalHierarchy(app_data)
            updateComponents()
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
  const ViewFilterKindControl = (mode === 'unitary' && taggs_in_banner.some(t => !t.id.includes('unitary'))) ? (
    <Box layerStyle='menuconfig_grid'>
      <Box layerStyle='menuconfigpanel_option_name'>
        <OSTooltip label={t('Banner.view_mode_tt')}>
          <Box as='span'>{t('Banner.view_mode')}</Box>
        </OSTooltip>
      </Box>
      <Box layerStyle='filter_grid_row'>
        <Select
          size='xs'
          value={drawing_area.view_filter_kind}
          onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
            drawing_area.view_filter_kind = evt.target.value as 'filter' | 'auto'
            applyViewFilter()
          }}>
          <option value='filter'>{t('Banner.view_filter_only')}</option>
          <option value='auto'>{t('Banner.view_auto_layout')}</option>
        </Select>
      </Box>
    </Box>
  ) : null

  // Rendu final
  return SelectorOfTagsByGroup.length > 0 ? (
    <FilterWrapperBox app_data={app_data} title={t(`Banner.${title_key}`)} defaultOpen={app_data.is_static}>
      {ResetHierarchyButton}
      {config.show_title_column ? title_filter_column(app_data) : null}
      {TypeSelectionHeader}
      {SelectorOfTagsByGroup}
      {ViewFilterKindControl}
      {GapModeControl}
    </FilterWrapperBox>
  ) : <></>
}

// Composants wrapper pour maintenir la compatibilité avec l'API existante
export const NodeTagGroupFilter = ({ app_data, level }: { app_data: Class_ApplicationData, level: boolean }) => (
  <UnifiedTagGroupFilter app_data={app_data} mode={level ? 'level' : 'element'} />
)

export const LevelTagFilter = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const [_, setCount] = useState(0)
  app_data.menu_configuration.ref_to_toolbar_level_tag_filter_updater.current = () => setCount(a => a + 1)
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
  const content_popover = <UnifiedTagGroupFilter app_data={app_data} mode="level" />

  return content_popover
}

export const DataTagGroupFilter = ({ app_data }: { app_data: Class_ApplicationData }) =>
  <UnifiedTagGroupFilter app_data={app_data} mode="data" />

export const UnitaryTagGroupFilter = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const [_, setCount] = useState(0)
  app_data.menu_configuration.ref_to_unitarytag_filter_updater.current = () => setCount(a => a + 1)

  // MODIFIÉ : vérifier dans view_taggs_dict au lieu de node_taggs_dict
  const view_taggs = Object.values(app_data.drawing_area.sankey.view_taggs_dict)
    .filter(tagg => tagg.banner !== 'none')

  if (view_taggs.length === 0) {
    return <></>
  }

  return <UnifiedTagGroupFilter app_data={app_data} mode="unitary" />
}