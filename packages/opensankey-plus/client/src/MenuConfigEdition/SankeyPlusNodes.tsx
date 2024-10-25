// External lib
import React, { ChangeEvent, useState, useRef, FunctionComponent, MutableRefObject } from 'react'

import {
  FaAlignCenter,
  FaAlignLeft,
  FaAlignRight,
  FaEyeSlash,
  FaFileImport,
  FaLock,
  FaLockOpen
} from 'react-icons/fa'
import {
  Box,
  Button,
  Checkbox,
  TabPanel,
  Input,
  InputGroup
} from '@chakra-ui/react'
import { faIcons, faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDeleteLeft } from '@fortawesome/free-solid-svg-icons'

// Local imports
import {
  FCType_ButtonNodeContextShowTagMenu,
  FCType_NodeBgLabelOSP,
  FCType_NodeHyperLinkOSP,
  FCType_NodeIconOSP,
  FCType_NodeValueOSP,
} from './types/SankeyPlusNodesTypes'

// OpenSankey ts-code
import { default_label_font_size, default_shape_visible, default_value_label_horiz, default_value_label_horiz_shift, default_value_label_vert, default_value_label_vert_shift, default_value_label_visible, isAttributeOverloaded } from '../deps/OpenSankey/types/Node'
import { isAttributeOverloaded as isAttributeOverloadedPlus } from '../types/NodePlus'
import { CustomFaEyeCheckIcon, OSTooltip, TooltipValueSurcharge } from '../deps/OpenSankey/types/Utils'
import { Type_GenericNodeElementOSP } from '../types/TypesOSP'
import { Class_NodeStylePlus } from '../types/NodePlus'
import { ConfigMenuNumberInput } from '../deps/OpenSankey/configmenus/SankeyMenuConfiguration'
import { svg_label_top, svg_label_center, svg_label_bottom } from '../deps/OpenSankey/configmenus/SankeyMenuConfigurationNodesAttributes'
import { icon_open_modal } from '../deps/OpenSankey/dialogs/SankeyMenuContextNode'

export const default_label_background = false


declare const window: Window &
  typeof globalThis & {
    SankeyToolsStatic: boolean
  }

export const NodeIconOSP: FunctionComponent<FCType_NodeIconOSP> = ({
  new_data_plus,
  menu_for_modal,
}) => {
  const { t } = new_data_plus
  const is_activated = new_data_plus.has_sankey_plus
  const [show_menu_node_icon, set_show_menu_node_icon] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(false)
  const selected_nodes = new_data_plus.drawing_area.selected_nodes_list
  new_data_plus.menu_configuration.dict_setter_show_dialog_plus.ref_setter_show_menu_node_icon.current = set_show_menu_node_icon
  new_data_plus.menu_configuration.ref_to_menu_config_node_icon_updater.current = () => setForceUpdate(b => !b)

  // Update only this component
  const redrawIllustrationAndRefresh = () => {
    selected_nodes.forEach(zdt => zdt.drawIllustration())
    setForceUpdate(!forceUpdate)
  }

  // Update this component & component node appareance because we modify shape visibility
  const redrawAndRefresh = () => {
    new_data_plus.menu_configuration.updateComponentRelatedToNodesApparence()
    selected_nodes.forEach(zdt => zdt.draw())
  }


  const _load_image = useRef<HTMLInputElement>(null)

  const isAllNodeVisible = (selected_nodes[0]?.shape_visible ?? default_shape_visible)

  let all_are_icons = (
    selected_nodes.length > 0)
  let all_are_images = all_are_icons
  let all_are_none = all_are_icons
  selected_nodes
    .forEach(d => {
      all_are_icons = (all_are_icons && d.iconVisible)
      all_are_images = (all_are_images && d.is_image)
      all_are_none = (all_are_none && (!d.iconVisible && !d.is_image))
    })

  let button_icon_or_image = 'both'
  if (all_are_icons) {
    button_icon_or_image = 'icon'
  }
  if (all_are_images) {
    button_icon_or_image = 'image'
  }
  if (all_are_none) {
    button_icon_or_image = 'none'
  }

  // Content if we want to add icon to node
  const content_icon = <Box
    layerStyle='menuconfigpanel_grid'
  >
    {
      button_icon_or_image === 'icon' ?
        <Box
          layerStyle='menuconfigpanel_grid'
        >

          <OSTooltip label={!is_activated ? t('Menu.sankeyOSPDisabled') : ''} >

            <Box
              as='span'
              layerStyle='menuconfigpanel_row_2cols'
            >
              <Box
                as='span'
                layerStyle='menuconfigpanel_option_name'
              >
                {t('Noeud.icon.icon_catalog')}
              </Box>
              <Button
                variant='menuconfigpanel_option_button'
                disabled={!is_activated}
                onClick={() => {
                  new_data_plus.menu_configuration.dict_setter_show_dialog_plus.ref_setter_show_modal_import_icons.current!(true)
                }}
              >
                <FontAwesomeIcon icon={faIcons} />
              </Button>
            </Box>
          </OSTooltip>

          <OSTooltip label={!is_activated ? t('Menu.sankeyOSPDisabled') : ''} >
            <Box
              as='span'
              layerStyle='menuconfigpanel_row_3cols'
            >
              <Box
                as='span'
                layerStyle='menuconfigpanel_option_name'
              >
                {t('Noeud.apparence.Couleur')}
              </Box>
              <Input
                variant='menuconfigpanel_option_input_color'
                type='color'
                value={
                  (selected_nodes.length === 1) ?
                    selected_nodes[0].iconColor :
                    '#ffffff'
                }
                onChange={evt => {
                  const color = evt.target.value
                  selected_nodes.map(d => d.iconColor = color)
                  redrawIllustrationAndRefresh()
                }}
              />
              <Button
                //Si la valeur est a true alors la couleur des noeuds reste celle sélectionné loreque que l'on affiche les flux celon leur étiquettes
                variant={
                  (selected_nodes.length === 1) ?
                    'menuconfigpanel_option_button_activated' :
                    'menuconfigpanel_option_button'}
                onClick={() => {
                  selected_nodes.forEach(d => d.iconColorSustainable = !d.iconColorSustainable)
                  redrawIllustrationAndRefresh()
                }}
              >
                {(selected_nodes.length === 1 && selected_nodes[0].iconColorSustainable) ? <FaLock /> : <FaLockOpen />}
              </Button>
            </Box>
          </OSTooltip>
        </Box> :
        <></>
    }
  </Box>

  // Content if we want to add image to node
  const content_image = <Box
    layerStyle='menuconfigpanel_grid'
  >
    {/* Import image */}
    {
      (button_icon_or_image === 'image') ?
        <OSTooltip label={!is_activated ? t('Menu.sankeyOSPDisabled') : ''} >

          <Box
            as='span'
            layerStyle='menuconfigpanel_row_2cols'
          >
            <Box
              as='span'
              layerStyle='menuconfigpanel_option_name'
            >
              {t('Noeud.img_src')}
            </Box>
            <Box
              as='span'
              layerStyle='options_2cols'
            >
              <Button
                variant='menuconfigpanel_option_button_left'
                onClick={() => {
                  if (_load_image.current) {
                    _load_image.current.name = ''
                    _load_image.current.click()
                  }
                }}
              >
                <FaFileImport />
              </Button>
              <Button
                variant='menuconfigpanel_option_button_right'
                onClick={() => {
                  selected_nodes.forEach(n => n.image_src = '')
                  redrawIllustrationAndRefresh()
                }}
              >
                <FontAwesomeIcon icon={faDeleteLeft} />
              </Button>
            </Box>
            <Input
              ref={_load_image}
              style={{ display: 'none' }}
              accept='image/*'
              type="file"
              disabled={!is_activated}
              onChange={(evt: ChangeEvent) => {
                const files = (evt.target as HTMLFormElement).files
                const reader = new FileReader()
                reader.onload = (() => {
                  return (e: ProgressEvent<FileReader>) => {
                    const resultat = (e.target as FileReader).result
                    const res = resultat?.toString().replaceAll('=', '')
                    selected_nodes.forEach(n => n.image_src = (res as string))
                    redrawIllustrationAndRefresh()

                  }
                })()
                reader.readAsDataURL(files[0])
              }}
            />
          </Box>
        </OSTooltip>
        : <></>
    }
  </Box>

  // Content of the tab that change depending on the illustration we want to make
  const content_tab = <Box
    layerStyle='menuconfigpanel_grid'
  >
    {/* Visibilite du noeud */}

    <Checkbox
      variant='menuconfigpanel_option_checkbox'
      // isIndeterminate={isAllNodeVisible[1]}
      isChecked={isAllNodeVisible}
      onChange={(evt) => {
        selected_nodes.forEach(element => (element.shape_visible = evt.target.checked))

        redrawAndRefresh()
      }}
    >
      <OSTooltip label={t('Noeud.apparence.tooltips.Visibilité')} >
        {t('Noeud.apparence.Visibilité')}
      </OSTooltip>
      {
        isAttributeOverloaded(selected_nodes, 'shape_visible') ?
          TooltipValueSurcharge('node_var', t) :
          <></>
      }
    </Checkbox>

    <OSTooltip label={!is_activated ? t('Menu.sankeyOSPDisabled') : ''} >

      <Box
        as='span'
        layerStyle='menuconfigpanel_row_2cols'
      >
        <Box
          as='span'
          layerStyle='menuconfigpanel_option_name'
        >
          {t('Noeud.illustration_type')}
        </Box>
        <Box
          as='span'
          layerStyle='options_3cols'
        >
          <Button
            variant={
              button_icon_or_image !== 'none' ?
                'menuconfigpanel_option_button_left' :
                'menuconfigpanel_option_button_activated_left'
            }
            isDisabled={!is_activated}
            onClick={() => {
              selected_nodes.forEach(d => {
                d.iconVisible = false
                d.is_image = false
              })
              redrawIllustrationAndRefresh()
            }}
          >
            <FaEyeSlash />
          </Button>
          <Button
            variant={
              button_icon_or_image !== 'icon' ?
                'menuconfigpanel_option_button_center' :
                'menuconfigpanel_option_button_activated_center'
            }
            isDisabled={!is_activated}
            onClick={() => {
              selected_nodes.forEach(d => {
                d.is_image = false
                d.iconVisible = true
              })
              redrawIllustrationAndRefresh()
            }}
          >
            {t('Noeud.icon.icon')}
          </Button>
          <Button
            variant={
              button_icon_or_image !== 'image' ?
                'menuconfigpanel_option_button_right' :
                'menuconfigpanel_option_button_activated_right'
            }
            isDisabled={!is_activated}
            onClick={() => {
              selected_nodes.forEach(d => {
                d.is_image = true
                d.iconVisible = false
              })
              redrawIllustrationAndRefresh()
            }}
          >
            Image
          </Button>
        </Box>
      </Box>
    </OSTooltip>

    {
      button_icon_or_image === 'icon' ?
        content_icon :
        button_icon_or_image === 'image' ?
          content_image :
          <></>
    }

  </Box>

  if (menu_for_modal && !show_menu_node_icon) {
    return [<></>]
  }
  if (menu_for_modal && show_menu_node_icon) {
    return [content_tab]
  }

  return <TabPanel>
    {content_tab}
  </TabPanel>
}

export const NodeHyperLinkOSP: FunctionComponent<FCType_NodeHyperLinkOSP> = ({
  new_data_plus,
  is_activated,
}) => {
  const { drawing_area, t } = new_data_plus
  const selected_nodes = drawing_area.selected_nodes_list

  const [, setCount] = useState(0)

  const hasHyperLink = () => {
    let visible = ''
    visible = selected_nodes[0]?.hyperlink ?? ''
    return visible
  }
  const node_hyperlink = hasHyperLink()
  // const data_plus = data as OSPData
  const content_image_tab = selected_nodes.length > 0 ?
    <Box
      layerStyle='menuconfigpanel_grid'
    >
      <OSTooltip label={!is_activated ? t('Menu.sankeyOSPDisabled') : ''} >

        <Box
          as='span'
          layerStyle='menuconfigpanel_row_2cols'
        >
          <Box
            as='span'
            layerStyle='menuconfigpanel_option_name'
          >
            {t('Noeud.HL')}
          </Box>
          <InputGroup
            variant='menuconfigpanel_option_input'
          >
            <Input
              placeholder={node_hyperlink}
              isDisabled={!is_activated}
              onChange={(evt) => {
                selected_nodes
                  .forEach(d => d.hyperlink = evt.target.value)
                setCount(a => a + 1)
              }}
            />
          </InputGroup>
        </Box>
      </OSTooltip>

      {/* Open Hyperlink */}
      <OSTooltip label={!is_activated ? t('Menu.sankeyOSPDisabled') : ''} >
        <Box
          as='span'
          layerStyle='menuconfigpanel_row_2cols'
        >
          <Box
            as='span'
            layerStyle='menuconfigpanel_option_name'
          >
            {t('Noeud.open_HL')}
          </Box>
          <Button
            variant='menuconfigpanel_option_button'
            onClick={() => {
              window.open(node_hyperlink)
            }}
          >
            <FontAwesomeIcon icon={faUpRightFromSquare} />
          </Button>
        </Box>
      </OSTooltip>
    </Box> :
    <></>

  return <TabPanel>
    {content_image_tab}
  </TabPanel>
}

export const NodeBgLabel: FunctionComponent<FCType_NodeBgLabelOSP> = ({ new_data, menu_for_style }) => {
  {/* Ajout fond coloré pour meilleur visibilité si label sur flux */ }

  const { drawing_area, t } = new_data
  const selected_nodes = drawing_area.selected_nodes_list

  const [, setCount] = useState(0)
  new_data.menu_configuration.ref_to_menu_config_node_name_label_bg_updater.current = () => setCount(a => a + 1)

  // Elements on which menu modification applies
  let elements: Class_NodeStylePlus[] | Type_GenericNodeElementOSP[]
  if (menu_for_style) {
    elements = [new_data.drawing_area.sankey.node_styles_dict[new_data.menu_configuration.ref_selected_style_node.current]]
  }
  else {
    elements = selected_nodes
  }

  const name_label_background = (elements[0]?.name_label_background ?? default_label_background)

  /**
   * Function used to reset menu UI
   */
  const refreshThisAndUpdateRelatedComponents = () => {
    // Whatever is done, set saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    if (menu_for_style) {
      // Update menus for node's apparence in case we use this for style
      new_data.menu_configuration.updateComponentRelatedToNodesStyles()
      // Redraw all visible nodes if we modifie node style
      new_data.drawing_area.sankey.visible_nodes_list.forEach(n => n.draw())
    }
    // And update this menu also
    setCount(a => a + 1)
  }

  return <Checkbox
    variant='menuconfigpanel_option_checkbox'
    isIndeterminate={false}
    isChecked={name_label_background}
    onChange={(evt) => {
      elements.forEach(element => element.name_label_background = evt.target.checked)
      refreshThisAndUpdateRelatedComponents()
    }}
  >
    <OSTooltip label={t('Noeud.labels.tooltips.l_bg')}>
      {t('Noeud.labels.l_bg')}
    </OSTooltip>
    {
      (!menu_for_style) &&
        isAttributeOverloadedPlus(selected_nodes, 'name_label_background') ?
        TooltipValueSurcharge('node_var', t) :
        <></>
    }
  </Checkbox>
}

export const NodeValue: FunctionComponent<FCType_NodeValueOSP> = ({ new_data, menu_for_style }) => {

  const { drawing_area, t } = new_data
  const selected_nodes = drawing_area.selected_nodes_list


  const [, setCount] = useState(0)

  // Elements on which menu modification applies
  let elements: Class_NodeStylePlus[] | Type_GenericNodeElementOSP[]
  if (menu_for_style) {
    elements = [new_data.drawing_area.sankey.node_styles_dict[new_data.menu_configuration.ref_selected_style_node.current]]
  }
  else {
    elements = selected_nodes
  }

  const value_label_visible = (elements[0]?.value_label_visible ?? default_value_label_visible)
  const value_label_vert = (elements[0]?.value_label_vert ?? default_value_label_vert)
  const value_label_vert_shift = (elements[0]?.value_label_vert_shift ?? default_value_label_vert_shift)
  const value_label_horiz = (elements[0]?.value_label_horiz ?? default_value_label_horiz)
  const value_label_horiz_shift = (elements[0]?.value_label_horiz_shift ?? default_value_label_horiz_shift)
  const value_label_font_size = (elements[0]?.value_label_font_size ?? default_label_font_size)


  // Node to ConfigMenuNumberInput state variable
  const number_of_input = 3
  const ref_set_number_inputs: MutableRefObject<(_: string | null | undefined) => void>[] = []
  for (let i = 0; i < number_of_input; i++)
    ref_set_number_inputs.push(useRef((_: string | null | undefined) => null))
  ref_set_number_inputs[0].current(String(value_label_font_size))
  ref_set_number_inputs[1].current(String(value_label_horiz_shift))
  ref_set_number_inputs[2].current(String(value_label_vert_shift))

  /**
   *
   * function that go throught all Type_GenericNodeElementOS of an array & check if they're all equals
   * (to the first )
   *
   * @param {Type_GenericNodeElementOS} curr
   * @return {*}
   */
  const check_indeterminate = (curr: Type_GenericNodeElementOSP,) => {
    return (selected_nodes[0].isEqual(curr))
  }
  const is_indeterminated = !selected_nodes.every(check_indeterminate)

  /**
   * Function used to reset menu UI
   */
  const refreshThisAndUpdateRelatedComponents = () => {
    // Whatever is done, set saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    if (menu_for_style) {
      // Update menus for node's apparence in case we use this for style
      new_data.menu_configuration.updateComponentRelatedToNodesStyles()
      // Redraw all visible nodes if we modifie node style
      new_data.drawing_area.sankey.visible_nodes_list.forEach(n => n.draw())
    }
    // And update this menu also
    setCount(a => a + 1)
  }

  return <Box layerStyle='menuconfigpanel_grid' >

    <Box as='span' layerStyle='menuconfigpanel_part_title_1' >
      <Checkbox
        variant='menuconfigpanel_part_title_1_checkbox'
        icon={<CustomFaEyeCheckIcon />}
        isIndeterminate={is_indeterminated}
        isChecked={value_label_visible}
        onChange={(evt) => {
          elements.forEach(element => element.value_label_visible = evt.target.checked)
          refreshThisAndUpdateRelatedComponents()
        }}
      >
        <OSTooltip label={t('Noeud.labels.tooltips.vdv')}>
          {t('Noeud.labels.vdv')}
        </OSTooltip>
      </Checkbox>
    </Box>

    {
      value_label_visible ?
        <Box layerStyle='menuconfigpanel_grid' >
          <Box as='span' layerStyle='menuconfigpanel_part_title_2' >
            {t('Menu.edition')}
          </Box>

          {/* Taille de la police du texte de la valeur */}
          <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
            <Box layerStyle='menuconfigpanel_option_name' >
              Police
            </Box>
            <ConfigMenuNumberInput
              ref_to_set_value={ref_set_number_inputs[0]}
              default_value={value_label_font_size}
              function_on_blur={(value) => {
                elements.forEach(element =>
                  element.value_label_font_size = (value ?? undefined))
                refreshThisAndUpdateRelatedComponents()
              }}
              menu_for_style={menu_for_style}
              minimum_value={0}
              step={1}
              stepper={true}
              unit_text='pixels'
            />
          </Box>

          {/* Position de l'affichage des données par rapport au noeud */}
          <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
            <Box layerStyle='menuconfigpanel_option_name' >
              {t('Noeud.node_value.anchor')}
            </Box>
            <Box layerStyle='options_2cols' >
              {/* Horizontale */}
              <Box layerStyle='options_3cols' >
                {/* A gauche */}
                <OSTooltip label={t('Noeud.labels.tooltips.gauche_val')}>
                  <Button
                    variant={
                      value_label_horiz === 'left' ?
                        'menuconfigpanel_option_button_activated_left' :
                        'menuconfigpanel_option_button_left'
                    }
                    paddingStart='0'
                    paddingEnd='0'
                    minWidth='0'
                    onClick={() => {
                      elements.forEach(element => element.value_label_horiz = 'left')
                      refreshThisAndUpdateRelatedComponents()
                    }}
                  >
                    <FaAlignLeft />
                  </Button>
                </OSTooltip>

                {/* Au milieu */}
                <OSTooltip label={t('Noeud.labels.tooltips.Milieu_ph_val')}>
                  <Button
                    variant={
                      value_label_horiz === 'middle' ?
                        'menuconfigpanel_option_button_activated_center' :
                        'menuconfigpanel_option_button_center'
                    }
                    paddingStart='0'
                    paddingEnd='0'
                    minWidth='0'
                    onClick={() => {
                      elements.forEach(element => element.value_label_horiz = 'middle')
                      refreshThisAndUpdateRelatedComponents()
                    }}
                  >
                    <FaAlignCenter />
                  </Button>
                </OSTooltip>

                {/* A droite */}
                <OSTooltip label={t('Noeud.labels.tooltips.droite_val')}>
                  <Button
                    variant={
                      value_label_horiz === 'right' ?
                        'menuconfigpanel_option_button_activated_right' :
                        'menuconfigpanel_option_button_right'
                    }
                    paddingStart='0'
                    paddingEnd='0'
                    minWidth='0'
                    onClick={() => {
                      elements.forEach(element => element.value_label_horiz = 'right')
                      refreshThisAndUpdateRelatedComponents()
                    }}
                  >
                    <FaAlignRight />
                  </Button>
                </OSTooltip>
              </Box>

              {/* Verticale */}
              <Box layerStyle='options_3cols' >
                {/* en haut */}
                <OSTooltip label={t('Noeud.labels.tooltips.haut_val')}>
                  <Button
                    variant={
                      value_label_vert === 'top' ?
                        'menuconfigpanel_option_button_activated_left' :
                        'menuconfigpanel_option_button_left'
                    }
                    paddingStart='0'
                    paddingEnd='0'
                    minWidth='0'
                    onClick={() => {
                      elements.forEach(element => element.value_label_vert = 'top')
                      refreshThisAndUpdateRelatedComponents()
                    }}
                  >
                    {svg_label_top}
                  </Button>
                </OSTooltip>

                {/* Au milieu */}
                <OSTooltip label={t('Noeud.labels.tooltips.Milieu_pv_val')}>
                  <Button
                    variant={
                      value_label_vert === 'middle' ?
                        'menuconfigpanel_option_button_activated_center' :
                        'menuconfigpanel_option_button_center'
                    }
                    paddingStart='0'
                    paddingEnd='0'
                    minWidth='0'
                    onClick={() => {
                      elements.forEach(element => element.value_label_vert = 'middle')
                      refreshThisAndUpdateRelatedComponents()
                    }}
                  >
                    {svg_label_center}
                  </Button>
                </OSTooltip>

                {/* En bas */}
                <OSTooltip label={t('Noeud.labels.tooltips.Bas_val')}>
                  <Button
                    variant={
                      value_label_vert === 'bottom' ?
                        'menuconfigpanel_option_button_activated_right' :
                        'menuconfigpanel_option_button_right'
                    }
                    minWidth='0'
                    paddingStart='0'
                    paddingEnd='0'
                    onClick={() => {
                      elements.forEach(element => element.value_label_vert = 'bottom')
                      refreshThisAndUpdateRelatedComponents()
                    }}
                  >
                    {svg_label_bottom}
                  </Button>
                </OSTooltip>
              </Box>
            </Box>
            {/* {additional_menus.advanced_label_value_content} */}
          </Box>
          {/* Position de la valeur du noeud par rapport à l'ancre*/}
          <OSTooltip label={t('Noeud.node_value.tooltips.anchor_dx')}>
            <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
              <Box layerStyle='menuconfigpanel_option_name' >
                {t('Noeud.node_value.anchor_dx')}
                {(!menu_for_style) &&
                  isAttributeOverloaded(selected_nodes, 'value_label_horiz_shift') ?
                  TooltipValueSurcharge('node_var', t) :
                  <></>}
              </Box>

              <ConfigMenuNumberInput
                ref_to_set_value={ref_set_number_inputs[1]}
                default_value={value_label_horiz_shift}
                function_on_blur={(value) => {
                  elements.forEach(element =>
                    element.value_label_horiz_shift = (value ?? undefined))
                  refreshThisAndUpdateRelatedComponents()
                }}
                menu_for_style={menu_for_style}
                step={1}
                stepper={true}
                unit_text='pixels'
              />
            </Box>
          </OSTooltip>

          {/* Position de la valeur du noeud par rapport à l'ancre*/}
          <OSTooltip label={t('Noeud.node_value.tooltips.anchor_dy')}>
            <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
              <Box layerStyle='menuconfigpanel_option_name' >
                {t('Noeud.node_value.anchor_dy')}
                {(!menu_for_style) &&
                  isAttributeOverloaded(selected_nodes, 'name_label_vert_shift') ?
                  TooltipValueSurcharge('node_var', t) :
                  <></>}
              </Box>

              <ConfigMenuNumberInput
                ref_to_set_value={ref_set_number_inputs[2]}
                default_value={value_label_vert_shift}
                function_on_blur={(value) => {
                  elements.forEach(element =>
                    element.value_label_vert_shift = (value ?? undefined))
                  refreshThisAndUpdateRelatedComponents()
                }}
                menu_for_style={menu_for_style}
                step={1}
                stepper={true}
                unit_text='pixels'
              />
            </Box>
          </OSTooltip>
        </Box> :
        <></>
    }
  </Box>
}

export const ButtonNodeContextShowTagMenu: FunctionComponent<FCType_ButtonNodeContextShowTagMenu> = ({ new_data }) => {
  const { t } = new_data
  const { ref_setter_show_menu_node_tags } = new_data.menu_configuration.dict_setter_show_dialog

  const closeContextMenu = () => {
    // Unset contextualized node
    new_data.drawing_area.node_contextualised = undefined
    // Refresh this menu
    new_data.menu_configuration.ref_to_menu_context_nodes_updater.current()
  }
  return <Button
    onClick={() => {
      ref_setter_show_menu_node_tags.current(true)
      closeContextMenu()
    }}
    variant='contextmenu_button'
  >
    {t('Menu.Etiquettes')}
    {icon_open_modal}
  </Button>
}

export const ButtonNodeContextShowTooltipMenu: FunctionComponent<FCType_ButtonNodeContextShowTagMenu> = ({ new_data }) => {
  const { t } = new_data
  const { ref_setter_show_menu_node_tooltip } = new_data.menu_configuration.dict_setter_show_dialog

  const closeContextMenu = () => {
    // Unset contextualized node
    new_data.drawing_area.node_contextualised = undefined
    // Refresh this menu
    new_data.menu_configuration.ref_to_menu_context_nodes_updater.current()
  }

  return <Button
    onClick={() => {
      ref_setter_show_menu_node_tooltip.current(true)
      closeContextMenu()
    }}
    variant='contextmenu_button'
  >
    {t('Noeud.IS')}
    {icon_open_modal}
  </Button>
}

export const ButtonNodeContextMaskValue: FunctionComponent<FCType_ButtonNodeContextShowTagMenu> = ({ new_data }) => {
  const { t } = new_data
  const [, setCount] = useState(0)
  const contextualised_node = new_data.drawing_area.node_contextualised
  const contextualised_node_value_visible = contextualised_node !== undefined ? contextualised_node.value_label_visible : false

  const selected_nodes = new_data.drawing_area.visible_and_selected_nodes_list

  const refreshThisAndToggleSaving = () => {
    // Toogle saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    // Refresh this menu
    setCount(a => a + 1)
  }

  return <Button
    variant='contextmenu_button'
    onClick={() => {
      selected_nodes.forEach(n => n.value_label_visible = !contextualised_node_value_visible)
      refreshThisAndToggleSaving()
    }}
  >
    {
      contextualised_node_value_visible ?
        t('Noeud.apparence.hide_value') :
        t('Noeud.apparence.display_value')
    }
  </Button>
}

export const ButtonNodeContextStartAnimation: FunctionComponent<FCType_ButtonNodeContextShowTagMenu> = ({ new_data }) => {
  const { t } = new_data

  const closeContextMenu = () => {
    // Unset contextualized node
    new_data.drawing_area.node_contextualised = undefined
    // Refresh this menu
    new_data.menu_configuration.ref_to_menu_context_nodes_updater.current()
  }

  return <Button
    onClick={() => {
      new_data.drawing_area.purgeSelection()
      new_data.drawing_area.node_contextualised?.launchAnimation() //launch sankey animation form contextualised node
      closeContextMenu()
    }}
    variant='contextmenu_button'
  >
    {t('Noeud.animate')}
  </Button>
}