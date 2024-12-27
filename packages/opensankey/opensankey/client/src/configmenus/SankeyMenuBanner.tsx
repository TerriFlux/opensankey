// External Imports
import React, { FunctionComponent, useState } from 'react'
import {
  MultiSelect
} from 'react-multi-select-component'

import {
  Checkbox,
  Button,
  Popover,
  PopoverHeader,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  PopoverCloseButton,
  Box,
  Select,
  Switch,
  useBoolean
} from '@chakra-ui/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowPointer,
  faPenNib,
  faCodeBranch,
  faDiagramProject,
  faArrowsLeftRight,
  faArrowsUpDown,
  faExpand,
  faCompress,
} from '@fortawesome/free-solid-svg-icons'

// Internal Types / Classes
import {
  SankeyData
} from '../types/LegacyType'
import {
  Class_TagGroup,
  Class_LevelTagGroup
} from '../types/Tag'
import {
  FCType_AddAllDropDownNode,
  FCType_AddAllDropDownFluxFType,
  FCType_DataTagSelector,
  FType_SetDiagram,
  FType_StretchButtons,
  FCType_ToolbarBuilder,
} from './types/SankeyMenuBannerTypes'

// Internal functions / Components
import {
  CustomFaEyeCheckIcon,
  OSTooltip
} from '../types/Utils'
import {
  Type_MenuSelectionEntry
} from '../topmenus/SankeyMenuTop'


// CONSTANTS ============================================================================

declare const window: Window &
  typeof globalThis & {
    sankey: {
      sous_filieres: { [key: string]: string }
      help: { [key: string]: string }
      excel: string
      structure: boolean,
      advanced: boolean
    } & { [key: string]: SankeyData }
  }

// FUNCTIONS ============================================================================

export const setDiagram: FType_SetDiagram = (
  the_diagram,
  new_data
) => {
  const sous_filieres = window.sankey.sous_filieres

  const new_data_as_json = JSON.parse(
    JSON.stringify(
      window.sankey[sous_filieres[the_diagram]]
    )
  )
  new_data.fromJSON(new_data_as_json)
}


// COMPONENTS ===========================================================================



/**
 *
 * Drop down to select node tags
 *
 * @param {*} {
 *   new_data
 *   level
 *  }
 * @return {*}
 */
export const AddAllDropDownNode: FunctionComponent<FCType_AddAllDropDownNode> = (
  {
    new_data,
    level
  }
) => {
  // Data -------------------------------------------------------------------------------
  const { t } = new_data

  // Tag group dicts
  const node_taggs = new_data.drawing_area.sankey.node_taggs_dict
  const level_taggs = new_data.drawing_area.sankey.level_taggs_dict

  // Component updater ------------------------------------------------------------------
  const [, setCount] = useState(0)
  new_data.menu_configuration.ref_to_nodetag_filter_updater.current = () => setCount(a => a + 1)

  let taggs_in_banner: Class_TagGroup[] | Class_LevelTagGroup[]
  if (level) {
    const nb_of_level_taggs = Object.values(level_taggs).filter(tagg => tagg.has_tags).length
    if (nb_of_level_taggs > 1) {
      taggs_in_banner = Object.values(level_taggs)
        .filter(tagg =>
          (tagg.name !== 'Primaire') &&
          (tagg.has_tags))
    }
    else {
      taggs_in_banner = Object.values(level_taggs)
        .filter(tagg => tagg.has_tags)
    }
  }
  else {
    taggs_in_banner = Object.values(node_taggs)
      .filter(tagg => tagg.banner !== 'none')
  }

  // JSX Components --------------------------------------------------------------------
  const allDD = taggs_in_banner.map(tagg => {
    // Create a btn that can either be a switch to activate tag color palette
    // or in some case for level tag activating or deactivating antagonists tags
    let btn_switch = <></>
    if (
      (tagg instanceof Class_TagGroup) &&
      (tagg.banner !== 'level')
    ) {
      btn_switch = <Switch
        justifySelf='end'
        alignSelf='center'
        height='1rem'
        isChecked={tagg.show_legend}
        onChange={evt => {
          // Reset values
          Object.values(node_taggs).forEach(tagg => tagg.show_legend = false)
          // Update this tagg group value
          if (evt.target.checked) {
            tagg.show_legend = true
          }
          new_data.drawing_area.legend.draw()
          // Refresh this & related component
          new_data.menu_configuration.updateAllComponentsRelatedToNodeTags()
        }}
      />
    }
    else if (
      (level) &&
      (tagg instanceof Class_LevelTagGroup) &&
      (tagg.has_tags)
    ) {
      // Cast type to exclude Class_TagGroup
      const level_tagg = tagg as Class_LevelTagGroup
      // Create swith button
      btn_switch = (
        (level_tagg.siblings !== undefined) &&
        (level_tagg.siblings.length > 0)
      ) ?
        <Checkbox
          justifySelf='end'
          alignSelf='center'
          variant='activate_antagonist_checkbox'
          isChecked={level_tagg.activated}
          icon={<CustomFaEyeCheckIcon />}
          onChange={evt => {
            level_tagg.activated = evt.target.checked
            // Refresh this & related component
            new_data.menu_configuration.updateAllComponentsRelatedToNodeTags()
          }}
        /> :
        <></>
    }

    // Create the tag selector
    // It can either select one tag at the time or multiple at the time
    let selector = <></>
    if (tagg.banner == 'one') {
      selector = <Select
        key={tagg.name}
        onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
          // Set tag with given id as selected : other are unselected
          tagg.selectTagsFromId(evt.target.value)
          // Refresh this & related component
          new_data.menu_configuration.updateAllComponentsRelatedToNodeTags()
        }}
      >
        {
          tagg.tags_list
            .map(tag => {
              return (
                <option
                  key={tag.id}
                  value={tag.id}
                >
                  {tag.name}
                </option>
              )
            })
        }
      </Select>
    }
    else if (
      (tagg.banner === 'level') &&
      tagg.has_tags
    ) {
      if (Object.keys(tagg.tags_dict).length < 1) {
        return <></>
      }
      selector = <Select
        key={tagg.name}
        value={tagg.selected_tags_list[0]?.id ?? ''}
        onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
          // Set tag with given id as selected : other are unselected
          new_data.drawing_area.bypass_redraws = true
          tagg.selectTagsFromId(evt.target.value)
          new_data.drawing_area.draw()
          // Refresh this & related component
          new_data.menu_configuration.updateAllComponentsRelatedToNodeTags()
        }}
      >
        {
          tagg.tags_list
            .map(tag => {
              return (
                <option
                  key={tag.id}
                  value={tag.id}
                >
                  {tag.name}
                </option>
              )
            })
        }
      </Select>
    }
    else if (tagg.banner === 'multi') {
      const tags_options = tagg.tags_list
        .map(tag => { return { 'label': tag.name, 'value': tag.id } })
      const selected_tags_options = tagg.selected_tags_list
        .map(tag => { return { 'label': tag.name, 'value': tag.id } })

      selector = <MultiSelect
        className={'multidropdown_filter_node_link'}
        // style={{widthMax:'200px', color: 'black' }}
        valueRenderer={(curr_selected_tags_options: Type_MenuSelectionEntry[]) => {
          return curr_selected_tags_options.length ?
            curr_selected_tags_options.map(({ label }) => label + ', ') :
            'Aucun tag sélectionné'
        }}
        labelledBy={'dropdown_node_filter'}
        overrideStrings={{
          'selectAll': 'Tout sélectionner',
        }}
        value={selected_tags_options}
        options={tags_options}
        onChange={(curr_selected_tags_options: [{ label: string, value: string }]) => {
          // Set tags with given id as selected : other are unselected
          tagg.selectTagsFromIds(curr_selected_tags_options.map(_ => _.value))
          // Refresh this & related component
          new_data.menu_configuration.updateAllComponentsRelatedToNodeTags()
        }}
      />
    }

    return (
      <Box layerStyle='menuconfig_grid'>
        <Box layerStyle='menuconfigpanel_option_name' >
          {tagg.name}
        </Box>
        <Box layerStyle='popover_sidebar_row_tag_filter'>
          <OSTooltip label={t('Banner.ndd_lst')}>
            <Box
              height='2rem'
              maxW='14.75rem'>
              {selector}
            </Box>
          </OSTooltip>
          <OSTooltip label={t('Banner.ndd_chk')} >
            <Box
              justifySelf='end'
            >
              {btn_switch}
            </Box>
          </OSTooltip>
        </Box>
      </Box>
    )
  })
  return (<>{allDD}</>)
}


/**
 * Function that generate dropdown for each groupTag of linkTags
 * @param {*} new_data
 * @return {*}
 */
export const AddAllDropDownFlux: FunctionComponent<FCType_AddAllDropDownFluxFType> = (
  {
    new_data
  }
) => {
  // Data -------------------------------------------------------------------------------
  const { t } = new_data

  // Tag group dicts
  const flux_taggs_dict = new_data.drawing_area.sankey.flux_taggs_dict
  const flux_taggs_with_banner = Object.values(flux_taggs_dict)
    .filter(flux_tagg => {
      return ((flux_tagg.banner === 'one') || (flux_tagg.banner === 'multi'))
    })

  // Component updater ------------------------------------------------------------------
  const [, setCount] = useState(0)
  new_data.menu_configuration.ref_to_fluxtag_filter_updater.current = () => setCount(a => a + 1)

  // JSX Components --------------------------------------------------------------------
  // Create drop down
  const allDD = flux_taggs_with_banner
    .map(flux_tagg => {
      // Create the tag selector
      // It can either select one tag at the time or multiple at the time
      let selector = <></>
      if (flux_tagg.banner == 'one') {
        selector = <Select
          key={flux_tagg.name}
          onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
            // Set correct tag as selected
            flux_tagg.selectTagsFromId(evt.target.value)
            // Update related components (includes this)
            new_data.menu_configuration.updateAllComponentsRelatedToFluxTags()
          }}
        >
          {
            flux_tagg.tags_list.map(tag => {
              return (
                <option key={tag.id} value={tag.id}>{tag.name}</option>
              )
            })
          }
        </Select>
      }
      else {
        const options = flux_tagg.tags_list
          .map(tag => { return { 'label': tag.name, 'value': tag.id } })
        const options_selected = flux_tagg.tags_list
          .filter(tag => tag.is_selected)
          .map(tag => { return { 'label': tag.name, 'value': tag.id } })
        selector = <MultiSelect
          className={'multidropdown_filter_node_link'}
          valueRenderer={(options_selected: Type_MenuSelectionEntry[]) => {
            return (
              options_selected.length ?
                options_selected.map(({ label }) => label + ', ') :
                'Aucun tag sélectionné')
          }}
          labelledBy={'dropdown_node_filter'}
          overrideStrings={{
            'selectAll': 'Tout sélectionner', // TODO Mettre traduction ici
          }}
          value={options_selected}
          options={options}
          onChange={(options_selected: [{ label: string, value: string }]) => {
            // Set correct tags as selected
            flux_tagg.selectTagsFromIds(options_selected.map(_ => _.value))
            // Update related components (includes this)
            new_data.menu_configuration.updateAllComponentsRelatedToFluxTags()
          }}
        />
      }

      return (
        <Box
          layerStyle='menuconfigpanel_grid'
        >
          <Box
            layerStyle='menuconfigpanel_option_name'
          >
            {flux_tagg.name}
          </Box>
          <Box
            as='span'
            layerStyle='popover_sidebar_row_tag_filter'
          >
            <OSTooltip label={t('Banner.ndd_lst')}>
              <Box
                height='2rem'
                width='14.75rem'
              >
                {selector}
              </Box>
            </OSTooltip>
            <OSTooltip label={t('Banner.ndd_chk')} >
              <Box
                justifySelf='end'
                alignSelf='center'
                height='1rem'
              >
                <Switch
                  isChecked={flux_tagg.show_legend}
                  onChange={evt => {
                    // Reset default colormap for all fluxtaggs
                    Object.values(flux_taggs_dict)
                      .forEach(flux_tagg => { flux_tagg.show_legend = false })
                    // Update values for this fluxtagg
                    if (evt.target.checked) {
                      flux_tagg.show_legend = true
                    }
                    new_data.drawing_area.legend.draw()

                    // Redraw all visible node because selectTagsFromId only update nodes directly affected by the tag updated
                    // but it can make link appear/dissapear (with nodes (dis)apearing ) wich affect nodes not updated by tag
                    new_data.drawing_area.sankey.visible_nodes_list.forEach(n => n.drawLinksArrow())
                    // Update related components (includes this)
                    new_data.menu_configuration.updateAllComponentsRelatedToFluxTags()
                  }}
                />
              </Box>
            </OSTooltip>
          </Box>
        </Box>)
    })

  // Output -----------------------------------------------------------------------------
  return (<>{allDD.map((c, i) => { return <React.Fragment key={i}>{c}</React.Fragment> })}</>)
}

/**
 * Function that return a simple or multiple dropdown of groupTag of data and links
 * This allow us to choose wich grouptag to select and wich tag of these group to display
 * @param {*} {
 *   new_data,
 *   in_popover
 * }
 * @return {*}
 */
export const DataTagSelector: FunctionComponent<FCType_DataTagSelector> = ({
  new_data,
  in_popover
}) => {
  // Data -------------------------------------------------------------------------------
  const data_taggs = new_data.drawing_area.sankey.data_taggs_dict
  const data_taggs_with_banner = Object.values(data_taggs)
    .filter(tagg => { return (tagg.banner == 'one' || tagg.banner == 'multi') })
  let show_legend_for_data_taggs = (data_taggs_with_banner.length > 0) // False if no data taggs
  data_taggs_with_banner
    .forEach(tagg => show_legend_for_data_taggs = show_legend_for_data_taggs && tagg.show_legend)

  // Component updater ------------------------------------------------------------------
  const [, setCount] = useState(0)
  if (in_popover) {
    new_data.menu_configuration.ref_to_datatag_filter_updater.current = () => setCount(a => a + 1)
  } else {
    new_data.menu_configuration.ref_to_datatag_filter_navbar_updater.current = () => setCount(a => a + 1)
  }

  // JSX Components --------------------------------------------------------------------
  const allDD = data_taggs_with_banner
    .map(tagg => {
      let selector = <></>
      if (tagg.banner == 'one') {
        const selected_tag_id = tagg.selected_tags_list[0]?.id ?? ''
        selector = <Select
          key={tagg.id}
          value={selected_tag_id}
          onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
            tagg.selectTagsFromId(evt.target.value)
            new_data.menu_configuration.updateAllComponentsRelatedToDataTags()
          }}
        >
          {
            tagg.tags_list
              .map(tag => {
                return (
                  <option key={tag.id} value={tag.id} >{tag.name}</option>
                )
              })
          }
        </Select>
      }
      else {
        const selected_options = tagg.selected_tags_list
          .map((tag) => { return { 'label': tag.name, 'value': tag.id } })
        const options = tagg.tags_list
          .map((tag) => {
            return {
              'label': tag.name,
              'value': tag.id,
              'disabled': (
                (selected_options.length < 2) &&
                (tag.id == selected_options[0].value)
              )
            }
          })
        selector = <MultiSelect
          className={'multidropdown_filter_node_link'}
          labelledBy={'dropdown_link_filter'}
          overrideStrings={{
            'selectAll': 'Tout sélectionner',
          }}
          value={selected_options}
          options={options}
          onChange={(curr_selected_options: [{ label: string, value: string }]) => {
            tagg.selectTagsFromIds(curr_selected_options.map(_ => _.value))
            new_data.menu_configuration.updateAllComponentsRelatedToDataTags()
          }}
        />
      }

      return (
        <Box
          layerStyle='menuconfigpanel_grid'
        >
          <Box
            as='span'
            layerStyle='menuconfigpanel_option_name'
          >
            {tagg.name}
          </Box>
          <Box
            maxWidth='14.75rem'
            height='2rem'
            layerStyle={in_popover ? 'popover_sidebar_row_tag_filter' : ''}
          >
            {selector}
            {
              in_popover ?
                <Switch
                  justifySelf='end'
                  alignSelf='center'
                  height='1rem'
                  isChecked={tagg.show_legend}
                  onChange={evt => {
                    // Met à jour l'indicateur de legende pour tous les tags
                    Object.values(data_taggs_with_banner)
                      .forEach(tagg => tagg.show_legend = false)
                    tagg.show_legend = evt.target.checked
                    new_data.drawing_area.legend.draw()
                    new_data.menu_configuration.updateAllComponentsRelatedToDataTags()
                  }}
                /> :
                <></>
            }
          </Box>
        </Box>)
    })

  // Output -----------------------------------------------------------------------------
  return <>{allDD}</>
}

/**
 * Fucntion to create the toolbar component, the toolbar is used to edit the sankey quicly
 */
export const ToolbarBuilder: FunctionComponent<FCType_ToolbarBuilder> = (
  {
    new_data,
    additionalMenu,
  }
) => {
  // Data -------------------------------------------------------------------------------
  const { t, url_prefix } = new_data
  const { sankey } = new_data.drawing_area

  // ===================Create hooks used in this component========================

  const [s_is_data_type_reconcilied, sIsDataTypeReconcilied] = useState(['reconciled', 'free_value', 'free_interval'].includes(new_data.drawing_area.show_structure))
  const [s_force_update, sforceUpdate] = useBoolean()
  const data_type_not_reconcilied = ['data', 'structure', 'free_value', 'free_interval'].includes(new_data.drawing_area.show_structure)
  const [s_type_value, sTypeValue] = useState<'data' | 'structure' | 'reconciled'>(data_type_not_reconcilied ? (new_data.drawing_area.show_structure as 'data' | 'structure' | 'reconciled') : 'reconciled')
  const [, setCount] = useState(0)
  new_data.menu_configuration.ref_to_toolbar_updater.current = () => setCount(a => a + 1)
  let btn_mouse_mode_edition = <></>

  const logo_btn_fs = s_force_update ? faCompress : faExpand


  const redrawNodeLinkLegend = () => {
    sankey.draw()
    new_data.drawing_area.legend.draw()
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(true)
  }

  const struc_data_reconciled = <Popover
    variant='toolbar_popover_window'
    placement='left'
    id='popover_data_type'
  >
    <PopoverTrigger>
      <Button
        variant='toolbar_button_5'
        id='btn_open_popover_data_type'
      >
        <FontAwesomeIcon icon={faDiagramProject} />
      </Button>
    </PopoverTrigger>

    <PopoverContent>
      <PopoverCloseButton />
      <PopoverHeader >{t('Banner.sdr')}</PopoverHeader>
      <PopoverBody>
        <Box
          layerStyle='menuconfig_grid'
        >
          <Box fontStyle='h3' >
            {t('Banner.type_value')}
          </Box>

          <Select
            value={s_type_value}
            onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
              new_data.drawing_area.show_structure = evt.target.value as 'data' | 'structure' | 'reconciled'
              sTypeValue(evt.target.value as 'data' | 'structure' | 'reconciled')
              if (evt.target.value === 'reconciled') {
                sIsDataTypeReconcilied(true)
              } else {
                sIsDataTypeReconcilied(false)
              }
              setCount(a => a + 1)
              redrawNodeLinkLegend()
            }}>
            <option key='structure' value='structure' >{t('Banner.t_v_s')}</option>
            <option key='data' value='data' >{t('Banner.t_v_c')}</option>
            <option key='reconciled' value='reconciled' >{t('Banner.t_v_r')}</option>
          </Select>
        </Box>

        <Box
          layerStyle='menuconfig_grid'
          display={s_is_data_type_reconcilied ? '' : 'none'}
        >
          <Box fontStyle='h3' >
            {t('Banner.indetermined_value')}
          </Box>
          <Select
            value={new_data.drawing_area.show_structure}
            onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
              new_data.drawing_area.show_structure = evt.target.value as 'reconciled' | 'free_value' | 'free_interval'
              setCount(a => a + 1)
              redrawNodeLinkLegend()
            }}>
            <option key='none' value='reconciled' >{t('Banner.t_v_s')}</option>
            <option key='free_interval' value='free_interval' >{t('Banner.t_v_i')}</option>
            <option key='free_value' value='free_value' >{t('Banner.t_v_pv')}</option>
          </Select>
        </Box>
      </PopoverBody>
    </PopoverContent>
  </Popover>

  // ===========Creation Button to show popover========================

  const button_fullscreen = <>
    <OSTooltip
      placement='left'
      label={s_force_update ? t('Banner.quit_fullscreen') : t('Banner.fullscreen')}
    >
      <Button
        variant='toolbar_button_6'
        id='button_fullscreen'
        onClick={() => {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
          } else if (document.exitFullscreen) {
            document.exitFullscreen()
          }
          sforceUpdate.toggle()
        }}
      >
        <FontAwesomeIcon icon={logo_btn_fs} />
      </Button>
    </OSTooltip>
  </>


  // Add button for the edition of the sankey
  if (!new_data.is_static) {
    btn_mouse_mode_edition = <>
      {/* Boutons permettant soit de passer la souris en mode sélection soit en mode création noeud/flux */}
      <OSTooltip
        placement='left'
        label={(new_data.drawing_area.isInEditionMode()) ? t('Banner.tooltipLiason') : t('Banner.tooltipSelection')}
      >
        <Button
          variant='toolbar_button_1'
          id='button_selection_edition'
          onClick={() => {
            new_data.drawing_area.switchMode()
          }} >
          <FontAwesomeIcon icon={(
            new_data.drawing_area.isInEditionMode() ?
              faPenNib :
              faArrowPointer
          )}
          />
        </Button>
      </OSTooltip>
    </>
  }





  const btn_show_data_type = url_prefix !== '' ? <><OSTooltip placement='left' label={t('Banner.sdr')}>
    {struc_data_reconciled}
  </OSTooltip>
  </> :
    <OSTooltip placement='left' label={t('Banner.tooltipStructure')}>
      <Button variant={'success'} onClick={() => {
        new_data.drawing_area.show_structure = new_data.drawing_area.show_structure == 'reconciled' ? 'structure' : 'reconciled'
        setCount(a => a + 1)
        redrawNodeLinkLegend()

      }} >
        <FontAwesomeIcon icon={faCodeBranch} />
      </Button>
    </OSTooltip>


  const btn_show_help_in_static = new_data.is_static ? <OSTooltip placement='left' label={t('Banner.tooltipHelp')}>
    <Button variant='info' onClick={() => { new_data.menu_configuration.never_see_again.current = false; localStorage.removeItem('dontSeeAggainWelcome'), new_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_modal_welcome.current!(true) }} >
      ?
    </Button>
  </OSTooltip> : <></>




  const init_toolbar_elements: { [_: string]: JSX.Element } = {

    'mode_souris': btn_mouse_mode_edition,
    'node_type': btn_show_data_type,
    'strectch_zdd': stretchButtons(new_data),
    'help': btn_show_help_in_static,
    'fullscreen': button_fullscreen,

    ...additionalMenu.toolbar_elements // Add others toolbar functionnalities created in submodule
  }



  // ===================Assemble different item for the toolbar========================
  return <>
    {additionalMenu.toolbar_order.map((key, id) => {
      return <React.Fragment key={id}>{init_toolbar_elements[key]}</React.Fragment>
    })}
  </>
}

/**
 *  Function that return stretch buttons for the sideBar
 *
 * @param {*} new_data_as_json
 * @return {*}
 */
const stretchButtons: FType_StretchButtons = (
  new_data
) => {
  const { t } = new_data
  return <> <OSTooltip placement='left' label={t('Banner.tooltipAdjustH')}>
    <Button variant='toolbar_button_6' onClick={() => new_data.drawing_area.areaFitHorizontally()} >
      <FontAwesomeIcon icon={faArrowsLeftRight} />
    </Button>
  </OSTooltip>
    <OSTooltip placement='left' label={t('Banner.tooltipAdjustV')} >
      <Button variant='toolbar_button_6' onClick={() => { new_data.drawing_area.areaFitVertically() }} >
        <FontAwesomeIcon icon={faArrowsUpDown} />
      </Button>
    </OSTooltip></>
}



