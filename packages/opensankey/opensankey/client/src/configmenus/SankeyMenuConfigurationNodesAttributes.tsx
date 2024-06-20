import React, { FunctionComponent, MutableRefObject, useRef, useState } from 'react'
import {
  FaAlignCenter,
  FaAlignLeft,
  FaAlignRight,
  FaArrowDown,
  FaArrowLeft,
  FaArrowRight,
  FaArrowUp,
  FaBold,
  FaEye,
  FaEyeSlash,
  FaItalic,
  FaLock,
  FaLockOpen,
  FaChevronDown,
  FaUndo
} from 'react-icons/fa'
import { TFunction } from 'i18next'

import {
  Box,
  Button,
  Checkbox,
  Input,
  InputGroup,
  InputRightAddon,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Select,
  Slider,
  SliderFilledTrack,
  SliderMark,
  SliderThumb,
  SliderTrack,
  TabPanel,
  useBoolean,
} from '@chakra-ui/react'

import { SankeyNodeAttrLocal } from '../types/Types'
import {
  ApplyStyleToNodes,
  CutName,
  IsNodeDisplayingValueLocal,
  OSTooltip,
  ReturnValueNode,
  TooltipValueSurcharge,
} from './SankeyUtils'
import { OpenSankeyConfigurationNodesAttributesFType, SankeyWrapperConfigInModalOrMenuType } from './types/SankeyMenuConfigurationNodesAttributesTypes'
import { Class_NodeElement } from '../types/Node'

export const OpenSankeyConfigurationNodesAttributes: FunctionComponent<OpenSankeyConfigurationNodesAttributesFType> = ({
  applicationContext,
  applicationData,
  applicationState,
  menu_for_style,
  ref_selected_style_node,
  advanced_appearence_content,
  advanced_label_content,
  advanced_label_value_content,
  link_function,
  ComponentUpdater,
  node_function
}) => {
  const { t } = applicationContext
  const { data, new_data } = applicationData
  const { multi_selected_nodes } = applicationState
  const [, setForceUpdate] = useBoolean()

  new_data.menu_configuration.updateComponentMenuConfigNodeAppearence.current = setForceUpdate.toggle

  const nodes = new_data.drawing_area.sankey.nodes_dict
  const list_nodes_selected = new_data.drawing_area.selected_nodes_list

  const list_style_or_nodes = (menu_for_style) ? [new_data.drawing_area.sankey.node_styles_dict[ref_selected_style_node.current]] : list_nodes_selected
  const list_nodes_to_reset = (menu_for_style) ? Object.values(nodes) : list_nodes_selected
  const { RedrawNodes } = node_function
  const { RedrawLinks } = link_function

  /**
 * Function used to reset node modified (selected if in menu config else all node)
 *
 */
  const newUpdateMenuConfigNode = () => {
    ComponentUpdater.updateComponenSaveInCache.current(false)
    list_nodes_to_reset.forEach(n => n.reset())
    if (!menu_for_style) {
      new_data.menu_configuration.updateComponentMenuConfigNode.current()
    }
    ComponentUpdater.updateComponenSaveInCache.current(false)
    setForceUpdate.toggle()
  }
  const updateLinkAttachedToNodes = () => {
    if (!menu_for_style) {
      // Redraw link attached to modified node when the modification to the node
      // modify links path
      let link_to_update: string[] = []
      multi_selected_nodes.current.forEach(n => {
        link_to_update = link_to_update.concat(n.outputLinksId)
        link_to_update = link_to_update.concat(n.inputLinksId)
      })
      link_to_update = [...new Set(link_to_update)]
      const list_links = link_to_update.map(lid => data.links[lid])
      RedrawLinks(list_links)
    } else {
      RedrawLinks(Object.values(applicationData.display_links))
    }
  }

  const style_of_selected_nodes = () => {
    let style_to_display = 'Aucun'
    if (multi_selected_nodes.current.length != 0) {
      style_to_display = multi_selected_nodes.current[0].style
      let inchangee = true
      multi_selected_nodes.current.map(d => {
        inchangee = (d.style == style_to_display) ? inchangee : false
      })
      if (style_to_display != '' && style_to_display !== undefined) {
        return (inchangee) ? CutName(data.style_node[style_to_display].name, 20) : t('Noeud.multi_style')
      } else {
        return 'Aucun'
      }
    } else {
      return style_to_display
    }
  }
  /**
   *
   * function that go throught all Class_NodeElement of an array & check if they're all equals
   * (to the first )
   *
   * @param {Class_NodeElement} curr
   * @return {*}
   */
  const check_indeterminate = (curr: Class_NodeElement,) => {
    return (list_nodes_selected[0].isEqual(curr))
  }
  const is_indeterminatae = !list_nodes_selected.every(check_indeterminate)

  const value_shape_visible = (menu_for_style) ? new_data.drawing_area.sankey.node_styles_dict[ref_selected_style_node.current].shape_visible : (list_nodes_selected[0]?.shape_visible ?? false)
  const value_label_visible = (menu_for_style) ? new_data.drawing_area.sankey.node_styles_dict[ref_selected_style_node.current].label_visible : (list_nodes_selected[0]?.label_visible ?? false)
  const value_min_width = (menu_for_style) ? new_data.drawing_area.sankey.node_styles_dict[ref_selected_style_node.current].min_width : (list_nodes_selected[0]?.min_width ?? false)
  const value_min_height = (menu_for_style) ? new_data.drawing_area.sankey.node_styles_dict[ref_selected_style_node.current].min_height : (list_nodes_selected[0]?.min_height ?? false)
  const value_color = (menu_for_style) ? new_data.drawing_area.sankey.node_styles_dict[ref_selected_style_node.current].color : (list_nodes_selected[0]?.color ?? false)
  const value_shape = (menu_for_style) ? new_data.drawing_area.sankey.node_styles_dict[ref_selected_style_node.current].shape : (list_nodes_selected[0]?.shape ?? false)
  const value_node_arrow_angle_factor = (menu_for_style) ? new_data.drawing_area.sankey.node_styles_dict[ref_selected_style_node.current].node_arrow_angle_factor : (list_nodes_selected[0]?.node_arrow_angle_factor ?? false)
  const value_node_arrow_angle_direction = (menu_for_style) ? new_data.drawing_area.sankey.node_styles_dict[ref_selected_style_node.current].node_arrow_angle_direction : (list_nodes_selected[0]?.node_arrow_angle_direction ?? false)
  const value_colorSustainable = (menu_for_style) ? new_data.drawing_area.sankey.node_styles_dict[ref_selected_style_node.current].color_sustainable : (list_nodes_selected[0]?.color_sustainable ?? false)
  const value_font_family = (menu_for_style) ? new_data.drawing_area.sankey.node_styles_dict[ref_selected_style_node.current].font_family : (list_nodes_selected[0]?.font_family ?? false)
  const value_font_size = (menu_for_style) ? new_data.drawing_area.sankey.node_styles_dict[ref_selected_style_node.current].font_size : (list_nodes_selected[0]?.font_size ?? false)
  const value_uppercase = (menu_for_style) ? new_data.drawing_area.sankey.node_styles_dict[ref_selected_style_node.current].uppercase : (list_nodes_selected[0]?.uppercase ?? false)
  const value_bold = (menu_for_style) ? new_data.drawing_area.sankey.node_styles_dict[ref_selected_style_node.current].bold : (list_nodes_selected[0]?.bold ?? false)
  const value_italic = (menu_for_style) ? new_data.drawing_area.sankey.node_styles_dict[ref_selected_style_node.current].italic : (list_nodes_selected[0]?.italic ?? false)
  const value_label_box_width = (menu_for_style) ? new_data.drawing_area.sankey.node_styles_dict[ref_selected_style_node.current].label_box_width : (list_nodes_selected[0]?.label_box_width ?? false)
  const value_label_color = (menu_for_style) ? new_data.drawing_area.sankey.node_styles_dict[ref_selected_style_node.current].label_color : (list_nodes_selected[0]?.label_color ?? false)
  const value_label_vert = (menu_for_style) ? new_data.drawing_area.sankey.node_styles_dict[ref_selected_style_node.current].label_vert : (list_nodes_selected[0]?.label_vert ?? false)
  const value_label_horiz = (menu_for_style) ? new_data.drawing_area.sankey.node_styles_dict[ref_selected_style_node.current].label_horiz : (list_nodes_selected[0]?.label_horiz ?? false)
  const value_label_background = (menu_for_style) ? new_data.drawing_area.sankey.node_styles_dict[ref_selected_style_node.current].label_background : (list_nodes_selected[0]?.label_background ?? false)
  const value_show_value = (menu_for_style) ? new_data.drawing_area.sankey.node_styles_dict[ref_selected_style_node.current].show_value : (list_nodes_selected[0]?.show_value ?? false)
  const value_label_vert_valeur = (menu_for_style) ? new_data.drawing_area.sankey.node_styles_dict[ref_selected_style_node.current].label_vert_valeur : (list_nodes_selected[0]?.label_vert_valeur ?? false)
  const value_label_horiz_valeur = (menu_for_style) ? new_data.drawing_area.sankey.node_styles_dict[ref_selected_style_node.current].label_horiz_valeur : (list_nodes_selected[0]?.label_horiz_valeur ?? false)
  const value_value_font_size = (menu_for_style) ? new_data.drawing_area.sankey.node_styles_dict[ref_selected_style_node.current].value_font_size : (list_nodes_selected[0]?.value_font_size ?? false)


  // Check if the 1st selected node has a tag selected from the group tag 'Type de noeud' so we can disable the selection of the node shape
  const content_appearence = <Box layerStyle='menuconfigpanel_grid' >

    {/* Visibilite du noeud */}
    <Box as='span' layerStyle='menuconfigpanel_part_title_1' >
      <Checkbox
        variant='menuconfigpanel_part_title_1_checkbox'
        icon={(value_shape_visible) ? <FaEye /> : <FaEyeSlash />}
        isChecked={value_shape_visible}
        isIndeterminate={
          is_indeterminatae
        }
        onChange={(evt) => {

          if (menu_for_style) {
            new_data.drawing_area.sankey.node_styles_dict[ref_selected_style_node.current].shape_visible = evt.target.checked
          } else {
            list_style_or_nodes.forEach(node => node.shape_visible = evt.target.checked)
          }
          newUpdateMenuConfigNode()
        }}
      >
        <OSTooltip label={t('Noeud.apparence.tooltips.Visibilité')}>
          {t('Noeud.apparence.Visibilité')}
        </OSTooltip>
        {
          IsNodeDisplayingValueLocal(multi_selected_nodes, 'shape_visible', menu_for_style) ?
            TooltipValueSurcharge('node_var', t) :
            <></>
        }

      </Checkbox>
    </Box>

    {/* In this position of the array, there is an input who can change the node visibility (hide if intermediary)(dev) */}
    {advanced_appearence_content.splice(1, 1)}

    <Box as='span' layerStyle='menuconfigpanel_part_title_2' >
      {t('Menu.edition')}
    </Box>

    {/* Couleur du noeud */}
    <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('Noeud.apparence.Couleur')}
        {
          IsNodeDisplayingValueLocal(multi_selected_nodes, 'color', menu_for_style) ? (
            <>{TooltipValueSurcharge('node_var_', t)}</>
          ) : (
            <></>
          )
        }
      </Box>
      <Box layerStyle='option_with_activation'>
        <OSTooltip label={t('Noeud.apparence.tooltips.Couleur')}>
          <Input
            variant='menuconfigpanel_option_input_color'
            type='color'
            value={value_color}
            onChange={evt => {
              list_style_or_nodes.forEach(n => n.color = evt.target.value)
              newUpdateMenuConfigNode()
              updateLinkAttachedToNodes()
            }}
          />
        </OSTooltip>
        <OSTooltip label={t('Noeud.apparence.tooltips.CouleurPérenne')}>
          <Button
            //Si la valeur est a true alors la couleur des noeuds reste celle sélectionné loreque que l'on affiche les flux celon leur étiquettes
            variant={
              value_colorSustainable ?
                'menuconfigpanel_option_button_activated' :
                'menuconfigpanel_option_button'}
            onClick={() => {
              list_style_or_nodes.forEach(n => n.color_sustainable = !value_colorSustainable)

              newUpdateMenuConfigNode()
            }}
          >
            {value_colorSustainable ? <FaLock /> : <FaLockOpen />}
          </Button>
        </OSTooltip>
      </Box>
    </Box>

    {/* Forme du noeud */}
    <OSTooltip label={t('Noeud.apparence.tooltips.Forme')}>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name' >
          {t('Noeud.apparence.Forme')}
          {(IsNodeDisplayingValueLocal(multi_selected_nodes, 'shape', menu_for_style) ?
            <>{TooltipValueSurcharge('node_var_', t)}</> :
            <></>)}
        </Box>
        <Box layerStyle='options_3cols' >
          <Button
            value="ellipse"

            variant={
              value_shape === 'ellipse' ?
                'menuconfigpanel_option_button_activated' :
                'menuconfigpanel_option_button'}
            onClick={() => {
              list_style_or_nodes.forEach(n => n.shape = 'ellipse')
              newUpdateMenuConfigNode()
              updateLinkAttachedToNodes()
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill='#78C2AD'
              stroke='currentColor'
              viewBox='0 0 17 17'
              width="1.5rem"
              height="1.5rem"
            >
              <path d="M 16.440445,8.4666672 A 7.9737778,7.9737773 0 0 1 8.4666672,16.440444 7.9737778,7.9737773 0 0 1 0.4928894,8.4666672 7.9737778,7.9737773 0 0 1 8.4666672,0.49288988 7.9737778,7.9737773 0 0 1 16.440445,8.4666672 Z" />
            </svg>
          </Button>

          <Button
            variant={
              value_shape === 'rect' ?
                'menuconfigpanel_option_button_activated' :
                'menuconfigpanel_option_button'}
            onClick={() => {
              list_style_or_nodes.forEach(n => n.shape = 'rect')
              newUpdateMenuConfigNode()
              updateLinkAttachedToNodes()
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill='#78C2AD'
              stroke='currentColor'
              viewBox='0 0 17 17'
              width="1.5rem"
              height="1.5rem"
            >
              <path d="M 0.385555,0.385555 H 16.547779 V 16.547779 H 0.385555 Z" />
            </svg>
            {/* {t('Noeud.apparence.Rectangle')} */}
          </Button>

          <Button
            variant={
              value_shape === 'arrow' ?
                'menuconfigpanel_option_button_activated' :
                'menuconfigpanel_option_button'
            }
            onClick={() => {
              list_style_or_nodes.forEach(n => n.shape = 'arrow')
              // assignValueToVar('shape', 'arrow')

              newUpdateMenuConfigNode()
              updateLinkAttachedToNodes()
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill='#78C2AD'
              stroke='currentColor'
              viewBox='0 0 17 17'
              width="1.5rem"
              height="1.5rem"
            >
              <path d="M 0.11499051,0.11500028 H 10.015883 L 16.844087,8.5149428 10.015883,16.818334 H 0.11499051 L 6.601784,8.5149428 Z" />
            </svg>
            {/* {t('Noeud.apparence.arrow')} */}
          </Button>
        </Box>
      </Box>
    </OSTooltip>

    {
      /* Change the angle of the arrow shaped node */
      value_shape === 'arrow' ?
        <Box layerStyle='menuconfigpanel_grid'>
          <OSTooltip label={t('Noeud.apparence.tooltips.arrow_angle')}>
            <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
              <Box layerStyle='menuconfigpanel_option_name' >
                {t('Noeud.apparence.arrow_angle')}
                {(IsNodeDisplayingValueLocal(multi_selected_nodes, 'node_arrow_angle_factor', menu_for_style) ?
                  <>{TooltipValueSurcharge('node_var_', t)}</> :
                  <></>
                )}
              </Box>
              <Slider
                min={0}
                max={45}
                step={5}
                value={value_node_arrow_angle_factor}
                onChange={(value) => {
                  // assignValueToVar('node_arrow_angle_factor', value)
                  list_style_or_nodes.forEach(n => n.node_arrow_angle_factor = value)

                  newUpdateMenuConfigNode()
                  // Redraw only sabot of link attached to the node already shaped as an arrow
                  link_function.reDrawLinkStartSabot(multi_selected_nodes.current.filter(n => ReturnValueNode(data, n, 'shape') === 'arrow'))
                }}
              >
                <SliderMark
                  value={value_node_arrow_angle_factor as number}
                >
                  {value_node_arrow_angle_factor}°
                </SliderMark>
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
            </Box>
          </OSTooltip>

          <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
            <Box layerStyle='menuconfigpanel_option_name' >
              {t('Noeud.apparence.angle_orientation')}
            </Box>
            <Box layerStyle='options_4cols' >
              <Button
                variant={
                  value_node_arrow_angle_direction === 'left' ?
                    'menuconfigpanel_option_button_activated' :
                    'menuconfigpanel_option_button'
                }
                minWidth={0}
                onClick={() => {
                  list_style_or_nodes.forEach(n => n.node_arrow_angle_direction = 'left')

                  newUpdateMenuConfigNode()
                  // Redraw only sabot of link attached to the node already shaped as an arrow
                  link_function.reDrawLinkStartSabot(multi_selected_nodes.current.filter(n => ReturnValueNode(data, n, 'shape') === 'arrow'))

                }}
              >
                <FaArrowLeft />
              </Button>
              <Button
                variant={
                  value_node_arrow_angle_direction === 'right' ?
                    'menuconfigpanel_option_button_activated' :
                    'menuconfigpanel_option_button'
                }
                minWidth={0}
                onClick={() => {
                  list_style_or_nodes.forEach(n => n.node_arrow_angle_direction = 'right')

                  newUpdateMenuConfigNode()
                  // Redraw only sabot of link attached to the node already shaped as an arrow
                  link_function.reDrawLinkStartSabot(multi_selected_nodes.current.filter(n => ReturnValueNode(data, n, 'shape') === 'arrow'))
                }}
              >
                <FaArrowRight />
              </Button>
              <Button
                variant={
                  value_node_arrow_angle_direction === 'top' ?
                    'menuconfigpanel_option_button_activated' :
                    'menuconfigpanel_option_button'
                }
                minWidth={0}
                onClick={() => {
                  list_style_or_nodes.forEach(n => n.node_arrow_angle_direction = 'top')

                  newUpdateMenuConfigNode()
                  // Redraw only sabot of link attached to the node already shaped as an arrow
                  link_function.reDrawLinkStartSabot(multi_selected_nodes.current.filter(n => ReturnValueNode(data, n, 'shape') === 'arrow'))
                }}
              >
                <FaArrowUp />
              </Button>
              <Button
                variant={
                  value_node_arrow_angle_direction === 'bottom' ?
                    'menuconfigpanel_option_button_activated' :
                    'menuconfigpanel_option_button'
                }
                minWidth={0}
                onClick={() => {
                  list_style_or_nodes.forEach(n => n.node_arrow_angle_direction = 'bottom')
                  newUpdateMenuConfigNode()
                  // Redraw only sabot of link attached to the node already shaped as an arrow
                  link_function.reDrawLinkStartSabot(multi_selected_nodes.current.filter(n => ReturnValueNode(data, n, 'shape') === 'arrow'))
                }}
              >
                <FaArrowDown />
              </Button>
            </Box>
          </Box>
        </Box> :
        <></>
    }

    <Box as='span' layerStyle='menuconfigpanel_part_title_2' >
      {t('Noeud.size')}
    </Box>

    {/* Largeur minimale du noeud */}
    <OSTooltip label={t('Noeud.apparence.tooltips.TML')}>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name' >
          {t('Noeud.apparence.TML')}
        </Box>
        <ConfigNodeAttributeNumberInput
          valueOfAttr={value_min_width}
          function_onChange={(_, val) => list_style_or_nodes.forEach(n => n.min_width = val)}
          menu_for_style={menu_for_style}
          function_onBlur={() => {
            newUpdateMenuConfigNode()
            updateLinkAttachedToNodes()
          }}
          stepper={true}
          minimum_value={1}
          unitText='pixels'
        />

      </Box>
    </OSTooltip>

    {/* Hauteur minimale du noeud */}
    <OSTooltip label={t('Noeud.apparence.tooltips.TMH')}>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name' >
          {t('Noeud.apparence.TMH')}
        </Box>
        <ConfigNodeAttributeNumberInput
          valueOfAttr={value_min_height}
          function_onChange={(_, val) => list_style_or_nodes.forEach(n => n.min_height = val)}
          menu_for_style={menu_for_style}
          function_onBlur={() => {
            newUpdateMenuConfigNode()
            updateLinkAttachedToNodes()
          }}
          stepper={true}
          minimum_value={1}
          unitText='pixels'
        />
      </Box>
    </OSTooltip>
    {advanced_appearence_content}
  </Box>

  const svg_label_top = <svg xmlns="http://www.w3.org/2000/svg" viewBox='0 0 24 24' width="12" height="12"><path d="M19.5,0H4.5c-.829,0-1.5,.671-1.5,1.5s.671,1.5,1.5,1.5h7.247c-.143,.042-.278,.12-.391,.234l-5.087,5.191c-.574,.581-.167,1.575,.644,1.575h3.587v12.5c0,.829,.671,1.5,1.5,1.5s1.5-.671,1.5-1.5V10h3.587c.811,0,1.218-.994,.644-1.575L12.644,3.234c-.113-.114-.248-.192-.391-.234h7.247c.828,0,1.5-.671,1.5-1.5s-.672-1.5-1.5-1.5Z" /></svg>
  const svg_label_bottom = <svg xmlns="http://www.w3.org/2000/svg" viewBox='0 0 24 24' width="12" height="12"><path d="M19.5,21h-7.247c.143-.042,.278-.12,.391-.234l5.087-5.191c.574-.581,.167-1.575-.644-1.575h-3.587V1.5c0-.829-.672-1.5-1.5-1.5s-1.5,.671-1.5,1.5V14h-3.587c-.811,0-1.218,.994-.644,1.575l5.087,5.191c.113,.114,.248,.192,.391,.234H4.5c-.828,0-1.5,.671-1.5,1.5s.672,1.5,1.5,1.5h15c.828,0,1.5-.671,1.5-1.5s-.672-1.5-1.5-1.5Z" /></svg>
  const svg_label_center = <svg xmlns="http://www.w3.org/2000/svg" viewBox='0 0 24 24' width="12" height="12"><path d="M24,12c0,.553-.448,1-1,1H1c-.552,0-1-.447-1-1s.448-1,1-1H23c.552,0,1,.447,1,1Zm-13.414-3.586c.39,.39,.902,.585,1.414,.585s1.024-.195,1.414-.585l3.293-3.293c.391-.391,.391-1.023,0-1.414s-1.023-.391-1.414,0l-2.293,2.293V1c0-.553-.448-1-1-1s-1,.447-1,1V6l-2.293-2.293c-.391-.391-1.023-.391-1.414,0s-.391,1.023,0,1.414l3.293,3.293Zm2.828,7.172c-.779-.779-2.049-.779-2.828,0l-3.293,3.293c-.391,.391-.391,1.023,0,1.414s1.023,.391,1.414,0l2.293-2.293v5c0,.553,.448,1,1,1s1-.447,1-1v-5l2.293,2.293c.195,.195,.451,.293,.707,.293s.512-.098,.707-.293c.391-.391,.391-1.023,0-1.414l-3.293-3.293Z" /></svg>
  const svg_label_upper = <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12"><g><path d="M22,8V9.026A4.948,4.948,0,0,0,19,8a5,5,0,0,0,0,10,4.948,4.948,0,0,0,3-1.026V18h2V8Zm-3,8a3,3,0,1,1,3-3A3,3,0,0,1,19,16Z" /><path d="M12,18h2.236L7.118,3.764,0,18H2.236l2-4H10ZM5.236,12,7.118,8.236,9,12Z" /></g></svg>

  const content_label = <Box layerStyle='menuconfigpanel_grid' >
    {/* Checkbox visibilité noeud */}

    <Box as='span' layerStyle='menuconfigpanel_part_title_1' >
      <Checkbox
        variant='menuconfigpanel_part_title_1_checkbox'
        icon={value_label_visible ? <FaEye /> : <FaEyeSlash />}
        isIndeterminate={is_indeterminatae}
        isChecked={value_label_visible}
        onChange={(evt) => {
          list_style_or_nodes.forEach(n => n.label_visible = evt.target.checked)
          newUpdateMenuConfigNode()
        }}
      >
        <OSTooltip label={t('Noeud.labels.tooltips.vdb')}>
          {t('Noeud.labels.vdb')}
        </OSTooltip>
        {(IsNodeDisplayingValueLocal(multi_selected_nodes, 'label_visible', menu_for_style) ?
          TooltipValueSurcharge('node_var', t) :
          <></>
        )}
      </Checkbox>
    </Box>

    {
      value_label_visible as boolean ?
        <Box layerStyle='menuconfigpanel_grid' >
          <Box as='span' layerStyle='menuconfigpanel_part_title_2' >
            {t('Menu.edition')}
          </Box>

          <Box as='span' layerStyle='menuconfigpanel_part_title_3' >
            {t('Noeud.text')}
          </Box>

          {/* Label en blanc ou noir */}
          <Checkbox
            variant='menuconfigpanel_option_checkbox'
            isIndeterminate={is_indeterminatae}
            isChecked={value_label_color}
            onChange={(evt) => {
              list_style_or_nodes.forEach(n => n.label_color = evt.target.checked)
              newUpdateMenuConfigNode()
            }}>
            <OSTooltip label={t('Noeud.labels.tooltips.lb')}>
              {t('Noeud.labels.lb')}
            </OSTooltip>
            {(IsNodeDisplayingValueLocal(multi_selected_nodes, 'label_color', menu_for_style) ? TooltipValueSurcharge('node_var', t) : <></>)}
          </Checkbox>

          <Box as='span' layerStyle='menuconfigpanel_part_title_3' >
            Police
          </Box>

          {/* Police et taille du texte de label */}
          <Box layerStyle='options_3cols' >
            <Box layerStyle='options_3cols' >
              {/* Gras */}
              <Button
                variant={
                  value_bold ?
                    'menuconfigpanel_option_button_activated_left' :
                    'menuconfigpanel_option_button_left'
                }
                paddingStart='0'
                paddingEnd='0'
                minWidth='0'
                onClick={() => {
                  list_style_or_nodes.forEach(n => n.bold = !value_bold)
                  newUpdateMenuConfigNode()
                }}
              >
                <FaBold />
              </Button>

              {/* en majuscule */}
              <Button
                variant={
                  value_uppercase ?
                    'menuconfigpanel_option_button_activated_center' :
                    'menuconfigpanel_option_button_center'
                }
                paddingStart='0'
                paddingEnd='0'
                minWidth='0'
                onClick={() => {
                  list_style_or_nodes.forEach(n => n.uppercase = !value_uppercase)
                  newUpdateMenuConfigNode()
                }}
              >
                {svg_label_upper}
              </Button>

              {/* En italique */}
              <Button
                variant={
                  value_italic ?
                    'menuconfigpanel_option_button_activated_right' :
                    'menuconfigpanel_option_button_right'
                }
                paddingStart='0'
                paddingEnd='0'
                minWidth='0'
                onClick={() => {
                  list_style_or_nodes.forEach(n => n.italic = !value_italic)

                  newUpdateMenuConfigNode()
                }}
              >
                <FaItalic />
              </Button>
            </Box>

            <Select
              variant='menuconfigpanel_option_select'
              value={
                value_font_family
              }
              onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
                list_style_or_nodes.forEach(n => n.font_family = evt.target.value)
                newUpdateMenuConfigNode()
              }}>
              {
                data
                  .display_style
                  .font_family
                  .map((d) => {
                    return <option
                      style={{ fontFamily: d }}
                      key={'ff-' + d}
                      value={d}
                    >{d}</option>
                  })
              }
            </Select>
            <ConfigNodeAttributeNumberInput
              valueOfAttr={value_font_size}
              function_onChange={(_, val) => list_style_or_nodes.forEach(n => n.font_size = val)}
              menu_for_style={menu_for_style}
              function_onBlur={() => {
                newUpdateMenuConfigNode()
              }}
              stepper={true}
              unitText='pixels'
            />
          </Box>

          {/* Ajout fond coloré pour meilleur visibilité si label sur flux */}

          <Checkbox
            variant='menuconfigpanel_option_checkbox'
            isIndeterminate={is_indeterminatae}
            isChecked={value_label_background}
            onChange={(evt) => {
              list_style_or_nodes.forEach(n => n.label_background = evt.target.checked)
              newUpdateMenuConfigNode()
            }}
          >
            <OSTooltip label={t('Noeud.labels.tooltips.l_bg')}>
              {t('Noeud.labels.l_bg')}
            </OSTooltip>

            {(IsNodeDisplayingValueLocal(multi_selected_nodes, 'label_background', menu_for_style) ?
              TooltipValueSurcharge('node_var', t) :
              <></>)}
          </Checkbox>

          <Box as='span' layerStyle='menuconfigpanel_part_title_2' >
            {t('MEP.leg_pos')}
          </Box>

          {/* Largeur de la zone de texte du label */}
          <OSTooltip label={t('Noeud.labels.tooltips.cl')}>
            <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
              <Box layerStyle='menuconfigpanel_option_name' >
                {t('Menu.larg')}
                {(IsNodeDisplayingValueLocal(multi_selected_nodes, 'label_box_width', menu_for_style) ?
                  <>{TooltipValueSurcharge('node_var_', t)}</> :
                  <></>)}
              </Box>

              <ConfigNodeAttributeNumberInput
                valueOfAttr={value_label_box_width}
                function_onChange={(_, val) => list_style_or_nodes.forEach(n => n.label_box_width = val)}
                menu_for_style={menu_for_style}
                function_onBlur={() => newUpdateMenuConfigNode()}
                stepper={true}
                minimum_value={0}
                maximum_value={500}
                unitText='pixels'
              />
            </Box>
          </OSTooltip>

          {/* Position  du label par rapport au noeud */}
          <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
            <Box layerStyle='menuconfigpanel_option_name' >
              Position
            </Box>

            <Box layerStyle='options_2cols' >
              {/* Position horizontale */}
              <Box layerStyle='options_3cols' >
                {/* A gauche  */}
                <OSTooltip label={t('Noeud.labels.tooltips.gauche')}>
                  <Button
                    variant={
                      value_label_horiz === 'left' ?
                        'menuconfigpanel_option_button_activated_left' :
                        'menuconfigpanel_option_button_left'}
                    paddingStart='0'
                    paddingEnd='0'
                    minWidth='0'
                    onClick={() => {
                      // TODO : Delete x_label & y_label when we modify label position (horizontally & vertically)
                      list_style_or_nodes.forEach(n => n.label_horiz = 'left')
                      newUpdateMenuConfigNode()
                    }}
                  >
                    <FaAlignLeft />
                  </Button>
                </OSTooltip>

                {/* Au milieu */}
                <OSTooltip label={t('Noeud.labels.tooltips.Milieu_ph')}>
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
                      list_style_or_nodes.forEach(n => n.label_horiz = 'middle')
                      newUpdateMenuConfigNode()
                    }}
                  >
                    <FaAlignCenter />
                  </Button>
                </OSTooltip>

                {/* A droite */}
                <OSTooltip label={t('Noeud.labels.tooltips.droite')}>
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
                      list_style_or_nodes.forEach(n => n.label_horiz = 'right')
                      newUpdateMenuConfigNode()
                    }}>
                    <FaAlignRight />
                  </Button>
                </OSTooltip>
              </Box>

              {/* Position verticale */}
              <Box layerStyle='options_3cols' >
                {/* En haut */}
                <OSTooltip label={t('Noeud.labels.tooltips.haut')}>
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
                      list_style_or_nodes.forEach(n => n.label_vert = 'top')

                      newUpdateMenuConfigNode()
                    }}
                  >
                    {svg_label_top}
                  </Button>
                </OSTooltip>

                {/* au Milieu */}
                <OSTooltip label={t('Noeud.labels.tooltips.Milieu_pv')}>
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
                      list_style_or_nodes.forEach(n => n.label_vert = 'middle')
                      newUpdateMenuConfigNode()
                    }}
                  >
                    {svg_label_center}
                  </Button>
                </OSTooltip>

                {/* En bas */}
                <OSTooltip label={t('Noeud.labels.tooltips.Bas')}>
                  <Button
                    variant={
                      value_label_vert === 'bottom' ?
                        'menuconfigpanel_option_button_activated_right' :
                        'menuconfigpanel_option_button_right'
                    }
                    paddingStart='0'
                    paddingEnd='0'
                    minWidth='0'
                    onClick={() => {
                      list_style_or_nodes.forEach(n => n.label_vert = 'bottom')
                      newUpdateMenuConfigNode()
                    }}
                  >
                    {svg_label_bottom}
                  </Button>
                </OSTooltip>
              </Box>
            </Box>
          </Box>

          {advanced_label_content}
        </Box> :
        <></>
    }
  </Box>

  const content_label_value = <Box layerStyle='menuconfigpanel_grid' >

    <Box as='span' layerStyle='menuconfigpanel_part_title_1' >
      <Checkbox
        variant='menuconfigpanel_part_title_1_checkbox'
        icon={value_show_value ? <FaEye /> : <FaEyeSlash />}
        isIndeterminate={is_indeterminatae}
        isChecked={value_show_value}
        onChange={(evt) => {
          list_style_or_nodes.forEach(n => n.show_value = evt.target.checked)
          newUpdateMenuConfigNode()
        }}
      >
        <OSTooltip label={t('Noeud.labels.tooltips.vdv')}>
          {t('Noeud.labels.vdv')}
        </OSTooltip>
        {(IsNodeDisplayingValueLocal(multi_selected_nodes, 'show_value', menu_for_style) ?
          TooltipValueSurcharge('node_var', t) :
          <></>)}
      </Checkbox>
    </Box>

    {
      value_show_value ?
        <Box layerStyle='menuconfigpanel_grid' >
          <Box as='span' layerStyle='menuconfigpanel_part_title_2' >
            {t('Menu.edition')}
          </Box>

          {/* Taille de la police du texte de la valeur */}
          <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
            <Box layerStyle='menuconfigpanel_option_name' >
              Police
            </Box>
            <ConfigNodeAttributeNumberInput
              valueOfAttr={value_value_font_size}
              menu_for_style={menu_for_style}
              function_onChange={(_, val) => list_style_or_nodes.forEach(n => n.value_font_size = val)}
              function_onBlur={() => newUpdateMenuConfigNode()}
              stepper={true}
              minimum_value={11}
              unitText='pixels'
            />
          </Box>

          {/* Position de l'affichage des données par rapport au noeud */}
          <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
            <Box layerStyle='menuconfigpanel_option_name' >
              Position
            </Box>
            <Box layerStyle='options_2cols' >
              {/* Horizontale */}
              <Box layerStyle='options_3cols' >
                {/* A gauche */}
                <OSTooltip label={t('Noeud.labels.tooltips.gauche_val')}>
                  <Button
                    variant={
                      value_label_horiz_valeur === 'left' ?
                        'menuconfigpanel_option_button_activated_left' :
                        'menuconfigpanel_option_button_left'
                    }
                    paddingStart='0'
                    paddingEnd='0'
                    minWidth='0'
                    onClick={() => {
                      list_style_or_nodes.forEach(n => n.label_horiz_valeur = 'top')
                      newUpdateMenuConfigNode()
                    }}
                  >
                    <FaAlignLeft />
                  </Button>
                </OSTooltip>

                {/* Au milieu */}
                <OSTooltip label={t('Noeud.labels.tooltips.Milieu_ph_val')}>
                  <Button
                    variant={
                      value_label_horiz_valeur === 'middle' ?
                        'menuconfigpanel_option_button_activated_center' :
                        'menuconfigpanel_option_button_center'
                    }
                    paddingStart='0'
                    paddingEnd='0'
                    minWidth='0'
                    onClick={() => {
                      list_style_or_nodes.forEach(n => n.label_horiz_valeur = 'middle')
                      newUpdateMenuConfigNode()
                    }}
                  >
                    <FaAlignCenter />
                  </Button>
                </OSTooltip>

                {/* A droite */}
                <OSTooltip label={t('Noeud.labels.tooltips.droite_val')}>
                  <Button
                    variant={
                      value_label_horiz_valeur === 'right' ?
                        'menuconfigpanel_option_button_activated_right' :
                        'menuconfigpanel_option_button_right'
                    }
                    paddingStart='0'
                    paddingEnd='0'
                    minWidth='0'
                    onClick={() => {
                      list_style_or_nodes.forEach(n => n.label_horiz_valeur = 'right')
                      newUpdateMenuConfigNode()
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
                      value_label_vert_valeur === 'top' ?
                        'menuconfigpanel_option_button_activated_left' :
                        'menuconfigpanel_option_button_left'
                    }
                    paddingStart='0'
                    paddingEnd='0'
                    minWidth='0'
                    onClick={() => {
                      list_style_or_nodes.forEach(n => n.label_vert_valeur = 'top')
                      newUpdateMenuConfigNode()
                    }}
                  >
                    {svg_label_top}
                  </Button>
                </OSTooltip>

                {/* Au milieu */}
                <OSTooltip label={t('Noeud.labels.tooltips.Milieu_pv_val')}>
                  <Button
                    variant={
                      value_label_vert_valeur === 'middle' ?
                        'menuconfigpanel_option_button_activated_center' :
                        'menuconfigpanel_option_button_center'
                    }
                    paddingStart='0'
                    paddingEnd='0'
                    minWidth='0'
                    onClick={() => {
                      list_style_or_nodes.forEach(n => n.label_vert_valeur = 'middle')
                      newUpdateMenuConfigNode()
                    }}
                  >
                    {svg_label_center}
                  </Button>
                </OSTooltip>

                {/* En bas */}
                <OSTooltip label={t('Noeud.labels.tooltips.Bas_val')}>
                  <Button
                    variant={
                      value_label_vert_valeur === 'bottom' ?
                        'menuconfigpanel_option_button_activated_right' :
                        'menuconfigpanel_option_button_right'
                    }
                    minWidth='0'
                    paddingStart='0'
                    paddingEnd='0'
                    onClick={() => {
                      list_style_or_nodes.forEach(n => n.label_vert_valeur = 'bottom')
                      newUpdateMenuConfigNode()
                    }}
                  >
                    {svg_label_bottom}
                  </Button>
                </OSTooltip>
              </Box>
            </Box>
            {advanced_label_value_content}
          </Box>
        </Box> :
        <></>
    }
  </Box>

  const style_node = !menu_for_style ? <Box layerStyle='menuconfigpanel_row_stylechoice' >
    <Box layerStyle='menuconfigpanel_option_name' textStyle='h3' >
      {t('Noeud.Style')}
    </Box>
    <Menu>
      <MenuButton
        as={Button}
        variant='menuconfigpanel_option_button'
        rightIcon={<FaChevronDown />}>
        {style_of_selected_nodes()}
      </MenuButton>
      <MenuList>
        {Object.keys(data.style_node).map((d, i) => {
          return (
            <MenuItem
              key={i}
              onClick={() => {
                ref_selected_style_node.current = d
                multi_selected_nodes.current.map(n => {
                  n.style = d
                })
                ApplyStyleToNodes(multi_selected_nodes, node_function)
                setForceUpdate.toggle()
                ComponentUpdater.updateComponenSaveInCache.current(false)
              }}
            >
              {data.style_node[d].name}
            </MenuItem>
          )
        })}
      </MenuList>
    </Menu>
    <OSTooltip label={t('Noeud.tooltips.AS')}>
      <Button
        variant='menuconfigpanel_option_button'
        onClick={() => {
          ApplyStyleToNodes(multi_selected_nodes, node_function)
          ComponentUpdater.updateComponenSaveInCache.current(false)
        }}
      >
        <FaUndo />
        {/* {t('Noeud.AS')} */}
      </Button>
    </OSTooltip>
  </Box> : <></>

  // Tableau d'elements de sous-menu attribut de noeuds
  return <>
    <React.Fragment key={'style_node'}>{style_node}</React.Fragment>
    <React.Fragment key={'sep_1'}><hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} /></React.Fragment>
    <React.Fragment key={'app'}>{content_appearence}</React.Fragment>
    <React.Fragment key={'sep_2'}><hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} /></React.Fragment>
    <React.Fragment key={'lab'}>{content_label}</React.Fragment>
    <React.Fragment key={'sep_3'}><hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} /></React.Fragment>
    <React.Fragment key={'val'}>{content_label_value}</React.Fragment>
  </>
}

export const SankeyMenuConfigurationNodesAttributes = (
  t: TFunction,
  menu_configuration_nodes_attributes: JSX.Element[],
  for_modal = false
) => {
  //Function that check if all selected nodes have the same value for some parameter
  return for_modal ?
    <Box layerStyle='menuconfigpanel_grid' >
      {menu_configuration_nodes_attributes}
    </Box>
    :
    // <Tab>
    //   <Box layerStyle='submenuconfig_tab' >
    //     {t('Noeud.tabs.apparence')}
    //   </Box>
    // </Tab>,
    <TabPanel
      id='nodes_desc'
    >
      <Box layerStyle='menuconfigpanel_grid'>
        {menu_configuration_nodes_attributes}
      </Box>
    </TabPanel>

}

export const SankeyWrapperConfigInModalOrMenu: FunctionComponent<SankeyWrapperConfigInModalOrMenuType> = ({
  menu_to_wrap,
  for_modal,
  idTab = ''
}) => {
  //Function that check if all selected nodes have the same value for some parameter
  return for_modal ?
    <Box layerStyle='menuconfigpanel_grid' >
      {menu_to_wrap}
    </Box>
    :
    // <Tab>
    //   <Box layerStyle='submenuconfig_tab' >
    //     {/* {SankeyWrapperConfigInModalOrMenu} */}
    //     {title_tab}
    //   </Box>
    // </Tab>,
    <TabPanel
      id={idTab}
    >
      <Box layerStyle='menuconfigpanel_grid'>
        {menu_to_wrap}
      </Box>
    </TabPanel>

}

type ConfigLayoutNumberInputType = {
  valueOfAttr: number | undefined,
  menu_for_style: boolean
  minimum_value?: number
  maximum_value?: number
  stepper?: boolean
  unitText?: string
  function_onChange: (s: string, val: number) => void
  function_onBlur: () => void
}
/**
 * Component developped for number input of the nodes attributs config menu
 *
 * @param {boolean} menu_for_style Modify either the style of node or the multi_selected_nodes
 * @param {number} minimum_value (optional, if not specified it mean the value can be undefined )
 * @param {number} maximum_value (optional, if not specified it mean the value can be undefined )
 * @param {boolean} stepper (default:false) add stepper to the input to increase or decrease the value
 * @param {string} unitText (default:'') text of the addon
 * @param {function} function_onBlur function called when we leave the input, it is generally used to update the draw area
 *
 * @return {JSX.Elmement}
 */
const ConfigNodeAttributeNumberInput: FunctionComponent<ConfigLayoutNumberInputType> = ({
  valueOfAttr,
  menu_for_style,
  minimum_value,
  maximum_value,
  stepper = false,
  unitText,
  function_onChange,
  function_onBlur
}) => {
  const [_value,setValue]=useState(valueOfAttr)
  const ref_input = useRef<HTMLInputElement>(null)
  const isModifying: MutableRefObject<NodeJS.Timeout | undefined> = useRef<NodeJS.Timeout>()
  const variantOfInput = unitText ? 'menuconfigpanel_option_numberinput_with_right_addon' : 'menuconfigpanel_option_numberinput'

  // Add stepper addon if specified
  const stepperBtn = stepper ? <NumberInputStepper>
    <NumberIncrementStepper />
    <NumberDecrementStepper />
  </NumberInputStepper> : <></>

  // Add unit addon if specified
  const inputUnit = unitText ? <InputRightAddon>{unitText}</InputRightAddon> : <></>

  return <InputGroup variant='menuconfigpanel_option_input' >
    <NumberInput allowMouseWheel variant={variantOfInput} min={minimum_value} max={maximum_value} step={1}
      value={_value}
      onChange={(_, value) => {
        function_onChange(_, value)
        if (!menu_for_style) {
          // reset timeout if exist
          if (isModifying.current) {
            clearTimeout(isModifying.current)
          }
          // launch timeout that automatically blur the input
          isModifying.current = setTimeout(() => {
            function_onBlur()
            ref_input.current?.blur()
          }, 2000)
        }

        setValue(value)
      }}
      onBlur={() => {
        if (!menu_for_style) clearTimeout(isModifying.current)
        function_onBlur()
      }}
    >
      <NumberInputField ref={ref_input} />
      {stepperBtn}
    </NumberInput>
    {inputUnit}
  </InputGroup>
}
