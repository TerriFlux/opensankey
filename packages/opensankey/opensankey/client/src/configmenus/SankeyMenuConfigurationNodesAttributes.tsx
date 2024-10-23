// External libs
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
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Select,
  Slider,
  SliderFilledTrack,
  SliderMark,
  SliderThumb,
  SliderTrack,
  TabPanel,
} from '@chakra-ui/react'

// Local types
import type {
  FCType_OpenSankeyConfigurationNodesAttributes,
  SankeyWrapperConfigInModalOrMenuType
} from './types/SankeyMenuConfigurationNodesAttributesTypes'
import type { Type_GenericNodeElementOS } from '../types/TypesOS'
import {
  type Class_NodeStyle,
  default_label_bold,
  default_label_box_width,
  default_label_color,
  default_label_font_family,
  default_label_font_size,
  default_label_italic,
  default_label_uppercase,
  default_name_label_horiz,
  default_name_label_horiz_shift,
  default_name_label_vert,
  default_name_label_vert_shift,
  default_name_label_visible,
  default_shape_arrow_angle_direction,
  default_shape_arrow_angle_factor,
  default_shape_color,
  default_shape_color_sustainable,
  default_shape_min_height,
  default_shape_min_width,
  default_shape_type,
  default_shape_visible,
  isAttributeOverloaded
} from '../types/Node'
import {
  CustomFaEyeCheckIcon,
  font_families
} from '../types/Utils'

// Local functions
import {
  CutName,
  OSTooltip,
  TooltipValueSurcharge,
} from '../types/Utils'
import { default_style_id } from '../types/Utils'
import { ConfigMenuNumberInput } from './SankeyMenuConfiguration'

export const svg_label_top = <svg xmlns="http://www.w3.org/2000/svg" viewBox='0 0 24 24' width="12" height="12"><path d="M19.5,0H4.5c-.829,0-1.5,.671-1.5,1.5s.671,1.5,1.5,1.5h7.247c-.143,.042-.278,.12-.391,.234l-5.087,5.191c-.574,.581-.167,1.575,.644,1.575h3.587v12.5c0,.829,.671,1.5,1.5,1.5s1.5-.671,1.5-1.5V10h3.587c.811,0,1.218-.994,.644-1.575L12.644,3.234c-.113-.114-.248-.192-.391-.234h7.247c.828,0,1.5-.671,1.5-1.5s-.672-1.5-1.5-1.5Z" /></svg>
export const svg_label_bottom = <svg xmlns="http://www.w3.org/2000/svg" viewBox='0 0 24 24' width="12" height="12"><path d="M19.5,21h-7.247c.143-.042,.278-.12,.391-.234l5.087-5.191c.574-.581,.167-1.575-.644-1.575h-3.587V1.5c0-.829-.672-1.5-1.5-1.5s-1.5,.671-1.5,1.5V14h-3.587c-.811,0-1.218,.994-.644,1.575l5.087,5.191c.113,.114,.248,.192,.391,.234H4.5c-.828,0-1.5,.671-1.5,1.5s.672,1.5,1.5,1.5h15c.828,0,1.5-.671,1.5-1.5s-.672-1.5-1.5-1.5Z" /></svg>
export const svg_label_center = <svg xmlns="http://www.w3.org/2000/svg" viewBox='0 0 24 24' width="12" height="12"><path d="M24,12c0,.553-.448,1-1,1H1c-.552,0-1-.447-1-1s.448-1,1-1H23c.552,0,1,.447,1,1Zm-13.414-3.586c.39,.39,.902,.585,1.414,.585s1.024-.195,1.414-.585l3.293-3.293c.391-.391,.391-1.023,0-1.414s-1.023-.391-1.414,0l-2.293,2.293V1c0-.553-.448-1-1-1s-1,.447-1,1V6l-2.293-2.293c-.391-.391-1.023-.391-1.414,0s-.391,1.023,0,1.414l3.293,3.293Zm2.828,7.172c-.779-.779-2.049-.779-2.828,0l-3.293,3.293c-.391,.391-.391,1.023,0,1.414s1.023,.391,1.414,0l2.293-2.293v5c0,.553,.448,1,1,1s1-.447,1-1v-5l2.293,2.293c.195,.195,.451,.293,.707,.293s.512-.098,.707-.293c.391-.391,.391-1.023,0-1.414l-3.293-3.293Z" /></svg>
export const svg_label_upper = <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12"><g><path d="M22,8V9.026A4.948,4.948,0,0,0,19,8a5,5,0,0,0,0,10,4.948,4.948,0,0,0,3-1.026V18h2V8Zm-3,8a3,3,0,1,1,3-3A3,3,0,0,1,19,16Z" /><path d="M12,18h2.236L7.118,3.764,0,18H2.236l2-4H10ZM5.236,12,7.118,8.236,9,12Z" /></g></svg>


/*************************************************************************************************/

/**
 * Define the menu that allows to modifiy appararence for nodes / properties for a node style
 *
 * @param {*} {
 *   applicationContext,
 *   new_data,
 *   applicationState,
 *   menu_for_style,
 *   ref_selected_style_node,
 *   advanced_appearence_content,
 *   advanced_label_content,
 *   advanced_label_value_content,
 *   node_function
 * }
 * @return {*}
 */
export const OpenSankeyConfigurationNodesAttributes: FunctionComponent<FCType_OpenSankeyConfigurationNodesAttributes> = ({
  new_data,
  menu_for_style,
  additional_menus,
}) => {

  // Datas ------------------------------------------------------------------------------

  // Get traduction function
  const { t } = new_data

  // Elements on which this menu applies ------------------------------------------------

  let selected_nodes: Type_GenericNodeElementOS[]
  if (!new_data.menu_configuration.is_selector_only_for_visible_nodes) {
    // All availables nodes
    selected_nodes = new_data.drawing_area.selected_nodes_list_sorted
  }
  else {
    // Only visible nodes
    selected_nodes = new_data.drawing_area.visible_and_selected_nodes_list_sorted
  }

  // Elements on which menu modification applies
  let elements: Class_NodeStyle[] | Type_GenericNodeElementOS[]
  if (menu_for_style) {
    elements = [new_data.drawing_area.sankey.node_styles_dict[new_data.menu_configuration.ref_selected_style_node.current]]
  }
  else {
    elements = selected_nodes
  }

  // Elements attributes ----------------------------------------------------------------

  /**
   *
   * function that go throught all Type_GenericNodeElementOS of an array & check if they're all equals
   * (to the first )
   *
   * @param {Type_GenericNodeElementOS} curr
   * @return {*}
   */
  const check_indeterminate = (curr: Type_GenericNodeElementOS,) => {
    return (selected_nodes[0].isEqual(curr))
  }
  const is_indeterminated = !selected_nodes.every(check_indeterminate)

  // Get values or default values
  const shape_visible = (elements[0]?.shape_visible ?? default_shape_visible)
  const name_label_visible = (elements[0]?.name_label_visible ?? default_name_label_visible)
  const shape_min_width = (elements[0]?.shape_min_width ?? default_shape_min_width)
  const shape_min_height = (elements[0]?.shape_min_height ?? default_shape_min_height)
  const shape_color = (elements[0]?.shape_color ?? default_shape_color)
  const shape_type = (elements[0]?.shape_type ?? default_shape_type)
  const shape_arrow_angle_factor = (elements[0]?.shape_arrow_angle_factor ?? default_shape_arrow_angle_factor)
  const shape_arrow_angle_direction = (elements[0]?.shape_arrow_angle_direction ?? default_shape_arrow_angle_direction)
  const shape_color_sustainable = (elements[0]?.shape_color_sustainable ?? default_shape_color_sustainable)
  const name_label_font_family = (elements[0]?.name_label_font_family ?? default_label_font_family)
  const name_label_font_size = (elements[0]?.name_label_font_size ?? default_label_font_size)
  const name_label_uppercase = (elements[0]?.name_label_uppercase ?? default_label_uppercase)
  const name_label_bold = (elements[0]?.name_label_bold ?? default_label_bold)
  const name_label_italic = (elements[0]?.name_label_italic ?? default_label_italic)
  const name_label_box_width = (elements[0]?.name_label_box_width ?? default_label_box_width)
  const name_label_color = (elements[0]?.name_label_color ?? default_label_color)
  const name_label_vert = (elements[0]?.name_label_vert ?? default_name_label_vert)
  const name_label_vert_shift = (elements[0]?.name_label_vert_shift ?? default_name_label_vert_shift)
  const name_label_horiz = (elements[0]?.name_label_horiz ?? default_name_label_horiz)
  const name_label_horiz_shift = (elements[0]?.name_label_horiz_shift ?? default_name_label_horiz_shift)

  /**
   * Get style name to display for style selector
   * @return {*}
   */
  const style_of_selected_nodes = () => {
    if (selected_nodes.length !== 0) {
      const style = selected_nodes[0].style
      let inchangee = true
      selected_nodes.forEach(node => {
        inchangee = (node.style.id === style.id) ? inchangee : false
      })
      return (inchangee) ?
        CutName(style.name, 20) :
        t('Noeud.multi_style')
    }
    else {
      return default_style_id
    }
  }

  // Components updaters ----------------------------------------------------------------

  // Boolean used to force this component to reload
  const [, setCount] = useState(0)
  const [, setCountStyle] = useState(0)

  // Link this menu's update function
  if (!menu_for_style) {
    new_data.menu_configuration.ref_to_menu_config_nodes_apparence_updater.current = () => setCount(a => a + 1)
  } else {
    new_data.menu_configuration.ref_to_menu_config_nodes_styles_updater.current = () => setCountStyle(a => a + 1)
  }

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
    new_data.menu_configuration.updateComponentRelatedToNodesApparence()
  }

  // Node to ConfigMenuNumberInput state variable
  const number_of_input = 7
  const ref_set_number_inputs: MutableRefObject<(_: string | null | undefined) => void>[] = []
  for (let i = 0; i < number_of_input; i++)
    ref_set_number_inputs.push(useRef((_: string | null | undefined) => null))

  // Be sure that values are updated in inputs when refreshing this component
  ref_set_number_inputs[0].current(String(shape_min_height))
  ref_set_number_inputs[1].current(String(shape_min_width))
  ref_set_number_inputs[3].current(String(name_label_font_size))
  ref_set_number_inputs[4].current(String(name_label_box_width))
  ref_set_number_inputs[5].current(String(name_label_horiz_shift))
  ref_set_number_inputs[6].current(String(name_label_vert_shift))



  // JSX menu components ---------------------------------------------------------------

  // Check if the 1st selected node has a tag selected from the group tag 'Type de noeud' so we can disable the selection of the node shape
  const content_appearence = <Box layerStyle='menuconfigpanel_grid' >

    {/* Visibilite du noeud */}
    <Box as='span' layerStyle='menuconfigpanel_part_title_1' >
      <Checkbox
        variant='menuconfigpanel_part_title_1_checkbox'
        icon={<CustomFaEyeCheckIcon />}
        isChecked={shape_visible}
        isIndeterminate={
          is_indeterminated
        }
        onChange={(evt) => {
          elements.forEach(
            element => (element.shape_visible = evt.target.checked)
          )
          refreshThisAndUpdateRelatedComponents()
        }}
      >
        <OSTooltip label={t('Noeud.apparence.tooltips.Visibilité')}>
          {t('Noeud.apparence.Visibilité')}
        </OSTooltip>
        {
          (!menu_for_style) &&
            isAttributeOverloaded(selected_nodes, 'shape_visible') ?
            TooltipValueSurcharge('node_var', t) :
            <></>
        }
      </Checkbox>
    </Box>

    {/* In this position of the array, there is an input who can change the node visibility (hide if intermediary)(dev) */}
    {additional_menus.advanced_appearence_content.splice(1, 1)}

    <Box as='span' layerStyle='menuconfigpanel_part_title_2' >
      {t('Menu.edition')}
    </Box>

    {/* Couleur du noeud */}
    <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('Noeud.apparence.Couleur')}
        {
          (!menu_for_style) &&
            isAttributeOverloaded(selected_nodes, 'shape_color') ? (
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
            value={shape_color}
            onChange={evt => {
              elements.forEach(element => element.shape_color = evt.target.value)
              refreshThisAndUpdateRelatedComponents()
            }}
          />
        </OSTooltip>
        <OSTooltip label={t('Noeud.apparence.tooltips.CouleurPérenne')}>
          <Button
            //Si la valeur est a true alors la couleur des noeuds reste celle sélectionné loreque que l'on affiche les flux celon leur étiquettes
            variant={
              shape_color_sustainable ?
                'menuconfigpanel_option_button_activated' :
                'menuconfigpanel_option_button'}
            onClick={() => {
              elements.forEach(element => element.shape_color_sustainable = !shape_color_sustainable)
              refreshThisAndUpdateRelatedComponents()
            }}
          >
            {shape_color_sustainable ? <FaLock /> : <FaLockOpen />}
          </Button>
        </OSTooltip>
      </Box>
    </Box>

    {/* Forme du noeud */}
    <OSTooltip label={t('Noeud.apparence.tooltips.Forme')}>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name' >
          {t('Noeud.apparence.Forme')}
          {((!menu_for_style) &&
            isAttributeOverloaded(selected_nodes, 'shape_type') ?
            <>{TooltipValueSurcharge('node_var_', t)}</> :
            <></>)}
        </Box>
        <Box layerStyle='options_3cols' >
          <Button
            value="ellipse"
            variant={
              shape_type === 'ellipse' ?
                'menuconfigpanel_option_button_activated' :
                'menuconfigpanel_option_button'}
            onClick={() => {
              elements.forEach(element => element.shape_type = 'ellipse')
              refreshThisAndUpdateRelatedComponents()
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
              shape_type === 'rect' ?
                'menuconfigpanel_option_button_activated' :
                'menuconfigpanel_option_button'}
            onClick={() => {
              elements.forEach(element => element.shape_type = 'rect')
              refreshThisAndUpdateRelatedComponents()
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
              shape_type === 'arrow' ?
                'menuconfigpanel_option_button_activated' :
                'menuconfigpanel_option_button'
            }
            onClick={() => {
              elements.forEach(element => element.shape_type = 'arrow')
              refreshThisAndUpdateRelatedComponents()
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
      shape_type === 'arrow' ?
        <Box layerStyle='menuconfigpanel_grid'>
          <OSTooltip label={t('Noeud.apparence.tooltips.arrow_angle')}>
            <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
              <Box layerStyle='menuconfigpanel_option_name' >
                {t('Noeud.apparence.arrow_angle')}
                {((!menu_for_style) &&
                  isAttributeOverloaded(selected_nodes, 'shape_arrow_angle_factor') ?
                  <>{TooltipValueSurcharge('node_var_', t)}</> :
                  <></>
                )}
              </Box>
              <Slider
                min={0}
                max={45}
                step={5}
                value={shape_arrow_angle_factor}
                onChange={(value) => {
                  elements.forEach(element => element.shape_arrow_angle_factor = value)
                  refreshThisAndUpdateRelatedComponents()
                }}
              >
                <SliderMark
                  value={shape_arrow_angle_factor as number}
                >
                  {shape_arrow_angle_factor}°
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
                  shape_arrow_angle_direction === 'left' ?
                    'menuconfigpanel_option_button_activated' :
                    'menuconfigpanel_option_button'
                }
                minWidth={0}
                onClick={() => {
                  elements.forEach(element => element.shape_arrow_angle_direction = 'left')
                  refreshThisAndUpdateRelatedComponents()
                }}
              >
                <FaArrowLeft />
              </Button>
              <Button
                variant={
                  shape_arrow_angle_direction === 'right' ?
                    'menuconfigpanel_option_button_activated' :
                    'menuconfigpanel_option_button'
                }
                minWidth={0}
                onClick={() => {
                  elements.forEach(element => element.shape_arrow_angle_direction = 'right')
                  refreshThisAndUpdateRelatedComponents()
                }}
              >
                <FaArrowRight />
              </Button>
              <Button
                variant={
                  shape_arrow_angle_direction === 'top' ?
                    'menuconfigpanel_option_button_activated' :
                    'menuconfigpanel_option_button'
                }
                minWidth={0}
                onClick={() => {
                  elements.forEach(element => element.shape_arrow_angle_direction = 'top')
                  refreshThisAndUpdateRelatedComponents()
                }}
              >
                <FaArrowUp />
              </Button>
              <Button
                variant={
                  shape_arrow_angle_direction === 'bottom' ?
                    'menuconfigpanel_option_button_activated' :
                    'menuconfigpanel_option_button'
                }
                minWidth={0}
                onClick={() => {
                  elements.forEach(element => element.shape_arrow_angle_direction = 'bottom')
                  refreshThisAndUpdateRelatedComponents()
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
        <ConfigMenuNumberInput
          ref_to_set_value={ref_set_number_inputs[1]}
          default_value={shape_min_width}
          function_on_blur={(value) => {
            elements.forEach(element =>
              element.shape_min_width = (value ?? undefined))
            refreshThisAndUpdateRelatedComponents()
          }}
          menu_for_style={menu_for_style}
          minimum_value={0}
          step={1}
          stepper={true}
          unit_text='pixels'
        />
      </Box>
    </OSTooltip>

    {/* Hauteur minimale du noeud */}
    <OSTooltip label={t('Noeud.apparence.tooltips.TMH')}>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name' >
          {t('Noeud.apparence.TMH')}
        </Box>
        <ConfigMenuNumberInput
          ref_to_set_value={ref_set_number_inputs[0]}
          default_value={shape_min_height}
          function_on_blur={(value) => {
            elements.forEach(element =>
              element.shape_min_height = (value ?? undefined))
            refreshThisAndUpdateRelatedComponents()
          }}
          menu_for_style={menu_for_style}
          minimum_value={0}
          step={1}
          stepper={true}
          unit_text='pixels'
        />
      </Box>
    </OSTooltip>
    {additional_menus.advanced_appearence_content}
  </Box>

  const content_label = <Box layerStyle='menuconfigpanel_grid' >
    {/* Checkbox visibilité noeud */}

    <Box as='span' layerStyle='menuconfigpanel_part_title_1' >
      <Checkbox
        variant='menuconfigpanel_part_title_1_checkbox'
        icon={<CustomFaEyeCheckIcon />}
        isIndeterminate={is_indeterminated}
        isChecked={name_label_visible}
        onChange={(evt) => {
          elements.forEach(element => element.name_label_visible = evt.target.checked)
          refreshThisAndUpdateRelatedComponents()
        }}
      >
        <OSTooltip label={t('Noeud.labels.tooltips.vdb')}>
          {t('Noeud.labels.vdb')}
        </OSTooltip>
        {((!menu_for_style) &&
          isAttributeOverloaded(selected_nodes, 'name_label_visible') ?
          TooltipValueSurcharge('node_var', t) :
          <></>
        )}
      </Checkbox>
    </Box>

    {
      name_label_visible as boolean ?
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
            isIndeterminate={is_indeterminated}
            isChecked={name_label_color}
            onChange={(evt) => {
              elements.forEach(element => element.name_label_color = evt.target.checked)
              refreshThisAndUpdateRelatedComponents()
            }}>
            <OSTooltip label={t('Noeud.labels.tooltips.lb')}>
              {t('Noeud.labels.lb')}
            </OSTooltip>
            {((!menu_for_style) &&
              isAttributeOverloaded(selected_nodes, 'name_label_color') ? TooltipValueSurcharge('node_var', t) : <></>)}
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
                  name_label_bold ?
                    'menuconfigpanel_option_button_activated_left' :
                    'menuconfigpanel_option_button_left'
                }
                paddingStart='0'
                paddingEnd='0'
                minWidth='0'
                onClick={() => {
                  elements.forEach(element => element.name_label_bold = !name_label_bold)
                  refreshThisAndUpdateRelatedComponents()
                }}
              >
                <FaBold />
              </Button>

              {/* en majuscule */}
              <Button
                variant={
                  name_label_uppercase ?
                    'menuconfigpanel_option_button_activated_center' :
                    'menuconfigpanel_option_button_center'
                }
                paddingStart='0'
                paddingEnd='0'
                minWidth='0'
                onClick={() => {
                  elements.forEach(element => element.name_label_uppercase = !name_label_uppercase)
                  refreshThisAndUpdateRelatedComponents()
                }}
              >
                {svg_label_upper}
              </Button>

              {/* En italique */}
              <Button
                variant={
                  name_label_italic ?
                    'menuconfigpanel_option_button_activated_right' :
                    'menuconfigpanel_option_button_right'
                }
                paddingStart='0'
                paddingEnd='0'
                minWidth='0'
                onClick={() => {
                  elements.forEach(element => element.name_label_italic = !name_label_italic)

                  refreshThisAndUpdateRelatedComponents()
                }}
              >
                <FaItalic />
              </Button>
            </Box>

            <Select
              variant='menuconfigpanel_option_select'
              value={
                name_label_font_family
              }
              onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
                elements.forEach(element => element.name_label_font_family = evt.target.value)
                refreshThisAndUpdateRelatedComponents()
              }}
            >
              {
                font_families
                  .map((d) => {
                    return <option
                      style={{ fontFamily: d }}
                      key={'ff-' + d}
                      value={d}
                    >{d}</option>
                  })
              }
            </Select>
            <ConfigMenuNumberInput
              ref_to_set_value={ref_set_number_inputs[3]}
              default_value={name_label_font_size}
              function_on_blur={(value) => {
                elements.forEach(element =>
                  element.name_label_font_size = (value ?? undefined))
                refreshThisAndUpdateRelatedComponents()
              }}
              menu_for_style={menu_for_style}
              minimum_value={0}
              step={1}
              stepper={true}
              unit_text='pixels'
            />
          </Box>

              {/* Additional input to modify attr from submodule */}
            {additional_menus.additional_node_label_layout_content.map((content,idx)=>{
              return <React.Fragment key={idx}>{content}</React.Fragment>
            })}

          <Box as='span' layerStyle='menuconfigpanel_part_title_2' >
            {t('MEP.leg_pos')}
          </Box>

          {/* Largeur de la zone de texte du label */}
          <OSTooltip label={t('Noeud.labels.tooltips.cl')}>
            <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
              <Box layerStyle='menuconfigpanel_option_name' >
                {t('Menu.larg')}
                {
                  (!menu_for_style) &&
                    isAttributeOverloaded(selected_nodes, 'name_label_box_width') ?
                    <>{TooltipValueSurcharge('node_var_', t)}</> :
                    <></>
                }
              </Box>

              <ConfigMenuNumberInput
                ref_to_set_value={ref_set_number_inputs[4]}
                default_value={name_label_box_width}
                function_on_blur={(value) => {
                  elements.forEach(element =>
                    element.name_label_box_width = (value ?? undefined))
                  refreshThisAndUpdateRelatedComponents()
                }}
                menu_for_style={menu_for_style}
                minimum_value={0}
                step={1}
                stepper={true}
                unit_text='pixels'
              />
            </Box>
          </OSTooltip>

          {/* Position  du label par rapport au noeud */}
          <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
            <Box layerStyle='menuconfigpanel_option_name' >
              {t('Noeud.labels.anchor')}
            </Box>

            <Box layerStyle='options_2cols' >
              {/* Position horizontale */}
              <Box layerStyle='options_3cols' >
                {/* A gauche  */}
                <OSTooltip label={t('Noeud.labels.tooltips.gauche')}>
                  <Button
                    variant={
                      name_label_horiz === 'left' ?
                        'menuconfigpanel_option_button_activated_left' :
                        'menuconfigpanel_option_button_left'}
                    paddingStart='0'
                    paddingEnd='0'
                    minWidth='0'
                    onClick={() => {
                      // TODO : Delete x_label & y_label when we modify label position (horizontally & vertically)
                      elements.forEach(element => element.name_label_horiz = 'left')
                      refreshThisAndUpdateRelatedComponents()
                    }}
                  >
                    <FaAlignLeft />
                  </Button>
                </OSTooltip>

                {/* Au milieu */}
                <OSTooltip label={t('Noeud.labels.tooltips.Milieu_ph')}>
                  <Button
                    variant={
                      name_label_horiz === 'middle' ?
                        'menuconfigpanel_option_button_activated_center' :
                        'menuconfigpanel_option_button_center'
                    }
                    paddingStart='0'
                    paddingEnd='0'
                    minWidth='0'
                    onClick={() => {
                      elements.forEach(element => element.name_label_horiz = 'middle')
                      refreshThisAndUpdateRelatedComponents()
                    }}
                  >
                    <FaAlignCenter />
                  </Button>
                </OSTooltip>

                {/* A droite */}
                <OSTooltip label={t('Noeud.labels.tooltips.droite')}>
                  <Button
                    variant={
                      name_label_horiz === 'right' ?
                        'menuconfigpanel_option_button_activated_right' :
                        'menuconfigpanel_option_button_right'
                    }
                    paddingStart='0'
                    paddingEnd='0'
                    minWidth='0'
                    onClick={() => {
                      elements.forEach(element => element.name_label_horiz = 'right')
                      refreshThisAndUpdateRelatedComponents()
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
                      name_label_vert === 'top' ?
                        'menuconfigpanel_option_button_activated_left' :
                        'menuconfigpanel_option_button_left'
                    }
                    paddingStart='0'
                    paddingEnd='0'
                    minWidth='0'
                    onClick={() => {
                      elements.forEach(element => element.name_label_vert = 'top')

                      refreshThisAndUpdateRelatedComponents()
                    }}
                  >
                    {svg_label_top}
                  </Button>
                </OSTooltip>

                {/* au Milieu */}
                <OSTooltip label={t('Noeud.labels.tooltips.Milieu_pv')}>
                  <Button
                    variant={
                      name_label_vert === 'middle' ?
                        'menuconfigpanel_option_button_activated_center' :
                        'menuconfigpanel_option_button_center'
                    }
                    paddingStart='0'
                    paddingEnd='0'
                    minWidth='0'
                    onClick={() => {
                      elements.forEach(element => element.name_label_vert = 'middle')
                      refreshThisAndUpdateRelatedComponents()
                    }}
                  >
                    {svg_label_center}
                  </Button>
                </OSTooltip>

                {/* En bas */}
                <OSTooltip label={t('Noeud.labels.tooltips.Bas')}>
                  <Button
                    variant={
                      name_label_vert === 'bottom' ?
                        'menuconfigpanel_option_button_activated_right' :
                        'menuconfigpanel_option_button_right'
                    }
                    paddingStart='0'
                    paddingEnd='0'
                    minWidth='0'
                    onClick={() => {
                      elements.forEach(element => element.name_label_vert = 'bottom')
                      refreshThisAndUpdateRelatedComponents()
                    }}
                  >
                    {svg_label_bottom}
                  </Button>
                </OSTooltip>
              </Box>
            </Box>
          </Box>
          {/* Position du label par rapport à l'ancre*/}
          <OSTooltip label={t('Noeud.labels.tooltips.anchor_dx')}>
            <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
              <Box layerStyle='menuconfigpanel_option_name' >
                {t('Noeud.labels.anchor_dx')}
                {(!menu_for_style) &&
                  isAttributeOverloaded(selected_nodes, 'name_label_horiz_shift') ?
                  TooltipValueSurcharge('node_var', t) :
                  <></>}
              </Box>
              <ConfigMenuNumberInput
                ref_to_set_value={ref_set_number_inputs[5]}
                default_value={name_label_horiz_shift}
                function_on_blur={(value) => {
                  elements.forEach(element =>
                    element.name_label_horiz_shift = (value ?? undefined))
                  refreshThisAndUpdateRelatedComponents()
                }}
                menu_for_style={menu_for_style}
                minimum_value={0}
                step={1}
                stepper={true}
                unit_text='pixels'
              />
            </Box>
          </OSTooltip>

          {/* Position du label par rapport à l'ancre*/}
          <OSTooltip label={t('Noeud.labels.tooltips.anchor_dy')}>
            <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
              <Box layerStyle='menuconfigpanel_option_name' >
                {t('Noeud.labels.anchor_dy')}
                {(!menu_for_style) &&
                  isAttributeOverloaded(selected_nodes, 'name_label_vert_shift') ?
                  TooltipValueSurcharge('node_var', t) :
                  <></>}
              </Box>

              <ConfigMenuNumberInput
                ref_to_set_value={ref_set_number_inputs[6]}
                default_value={name_label_vert_shift}
                function_on_blur={(value) => {
                  elements.forEach(element =>
                    element.name_label_vert_shift = (value ?? undefined))
                  refreshThisAndUpdateRelatedComponents()
                }}
                menu_for_style={menu_for_style}
                minimum_value={0}
                step={1}
                stepper={true}
                unit_text='pixels'
              />
            </Box>
          </OSTooltip>

          {additional_menus.advanced_label_content}
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
        rightIcon={<FaChevronDown />}
      >
        {style_of_selected_nodes()}
      </MenuButton>
      <MenuList>
        {
          new_data.drawing_area.sankey.node_styles_list_sorted
            .map(style => {
              return (<React.Fragment key={style.id}>
                <MenuItem
                  key={style.id}
                  onClick={() => {
                    new_data.menu_configuration.ref_selected_style_node.current = style.id
                    selected_nodes.forEach(node => {
                      node.style = style
                    })
                    refreshThisAndUpdateRelatedComponents()
                  }}
                >
                  {style.id}
                </MenuItem></React.Fragment>
              )
            })
        }
      </MenuList>
    </Menu>
    <OSTooltip label={t('Noeud.tooltips.AS')}>
      <Button
        variant='menuconfigpanel_option_button'
        onClick={() => {
          selected_nodes.forEach(node => node.resetAttributes())
          refreshThisAndUpdateRelatedComponents()
        }}
      >
        <FaUndo />
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
    {additional_menus.additional_node_apparence_content.map((content,idx)=><React.Fragment key={idx}>{content}</React.Fragment>)}
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
    </Box> :
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
    </Box> :
    <TabPanel
      id={idTab}
    >
      <Box layerStyle='menuconfigpanel_grid'>
        {menu_to_wrap}
      </Box>
    </TabPanel>

}
