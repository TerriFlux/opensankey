import React, { FunctionComponent, MutableRefObject, useRef } from 'react'
import {
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaEyeSlash,
  FaEye,
  FaChevronDown,
  FaUndo
} from 'react-icons/fa'
import {
  FaAngleDoubleDown,
  FaAngleDoubleUp,
  FaAngleDown,
  FaAngleUp
} from 'react-icons/fa'

import {
  Box,
  Button,
  Checkbox,
  Input,
  InputGroup,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Select,
  useBoolean,
} from '@chakra-ui/react'

/*************************************************************************************************/

import {
  Class_LinkElement,
  Class_LinkStyle,
  default_shape_arrow_size,
  default_shape_color,
  default_shape_ending_curve,
  default_shape_ending_tangeant,
  default_shape_is_arrow,
  default_shape_is_curved,
  default_shape_is_dashed,
  default_shape_is_recycling,
  default_shape_opacity,
  default_shape_orientation,
  default_shape_starting_curve,
  default_shape_starting_tangeant,
  default_value_label_color,
  default_value_label_custom_digit,
  default_value_label_font_family,
  default_value_label_font_size,
  default_value_label_is_visible,
  default_value_label_nb_digit,
  default_value_label_on_path,
  default_value_label_orthogonal_position,
  default_value_label_pos_auto,
  default_value_label_position,
  default_value_label_scientific_precision,
  default_value_label_to_precision,
  default_value_label_unit,
  default_value_label_unit_visible,
  isAttributeOverloaded,
} from '../types/Link'
import {
  default_style_id
} from '../types/Sankey'
import {
  font_families
} from '../types/Utils'
import {
  MenuConfigurationLinksAppearenceFType,
} from './types/SankeyMenuConfigurationLinksAppearenceTypes'

/*************************************************************************************************/

import {
  TooltipValueSurcharge,
  OSTooltip,
  CutName
} from './SankeyUtils'
import { ConfigMenuNumberInput } from './SankeyMenuConfiguration'

/*************************************************************************************************/

const logo_hv = <svg xmlns="http://www.w3.org/2000/svg"
  width="16"
  height="16"
  viewBox="0 0 26 26"
>
  <g>
    <path
      d="m 17.84271,23.063448 c -1.269418,-1.282992 -2.346574,-2.454122 -2.393679,-2.602512 -0.0594,-0.187118 -0.01495,-0.364549 0.145033,-0.578998 0.227793,-0.305339 0.251457,-0.30961 1.893906,-0.341824 l 1.663232,-0.03262 v -5.044847 c 0,-3.278554 -0.04379,-5.16073 -0.125076,-5.375831 C 18.85592,8.636398 18.348461,8.114093 17.890847,7.918325 17.58911,7.78924 16.487878,7.756442 12.455374,7.756442 H 7.3983032 l -0.03263,1.662971 c -0.0324,1.65136 -0.03483,1.664613 -0.348521,1.898566 -0.272363,0.203132 -0.362903,0.216128 -0.65705,0.09431 -0.187636,-0.07771 -1.355183,-1.160016 -2.594548,-2.405127 -1.678774,-1.686558 -2.25339,-2.336228 -2.25339,-2.547722 0,-0.212412 0.600322,-0.884111 2.384458,-2.667967 2.546767,-2.546366 2.737072,-2.671811 3.260033,-2.148932 0.212788,0.212755 0.235188,0.391917 0.235188,1.881201 v 1.646051 h 5.0906128 c 5.443018,0 5.946321,0.04455 6.897173,0.610539 0.590386,0.351422 1.254964,1.004393 1.65343,1.62455 0.666046,1.036613 0.705198,1.426315 0.705198,7.019257 v 5.089812 h 1.646309 c 1.489519,0 1.668709,0.0224 1.881497,0.235151 0.519204,0.519121 0.394333,0.708915 -2.142301,3.256165 -1.834562,1.84224 -2.445485,2.387833 -2.675253,2.389168 -0.232072,0.0013 -0.80697,-0.51292 -2.605802,-2.330984 z"
    />
  </g>
</svg>

const logo_vh = <svg xmlns="http://www.w3.org/2000/svg"
  width="16"
  height="16"
  viewBox="0 0 26 26"
  style={{ transform: 'rotate(180deg)' }}
>
  <g>
    <path
      d="m 3.1500765,17.283934 c 1.282992,-1.269418 2.454122,-2.346574 2.602512,-2.393679 0.187118,-0.0594 0.364549,-0.01495 0.578998,0.145033 0.305339,0.227793 0.30961,0.251457 0.341824,1.893906 l 0.03262,1.663232 h 5.0448465 c 3.278554,0 5.16073,-0.04379 5.375831,-0.125076 0.450418,-0.170206 0.972723,-0.677665 1.168491,-1.135279 0.129085,-0.301737 0.161883,-1.402969 0.161883,-5.435473 V 6.8395274 l -1.662971,-0.03263 c -1.65136,-0.0324 -1.664613,-0.03483 -1.898566,-0.348521 -0.203132,-0.272363 -0.216128,-0.362903 -0.09431,-0.65705 0.07771,-0.187636 1.160016,-1.355183 2.405127,-2.594548 1.686558,-1.678774 2.336228,-2.25339004 2.547722,-2.25339004 0.212412,0 0.884111,0.60032204 2.667967,2.38445804 2.546366,2.546767 2.671811,2.737072 2.148932,3.260033 -0.212755,0.212788 -0.391917,0.235188 -1.881201,0.235188 H 21.043731 V 11.92368 c 0,5.443018 -0.04455,5.946321 -0.610539,6.897173 -0.351422,0.590386 -1.004393,1.254964 -1.62455,1.65343 -1.036613,0.666046 -1.426315,0.705198 -7.019257,0.705198 H 6.6995735 v 1.646309 c 0,1.489519 -0.0224,1.668709 -0.235151,1.881497 -0.519121,0.519204 -0.708915,0.394333 -3.256165,-2.142301 -1.84224,-1.834562 -2.387833,-2.445485 -2.389168,-2.675253 -0.0013,-0.232072 0.51292,-0.80697 2.330984,-2.605802 z"
    />
  </g>
</svg>

const logo_vv = <svg xmlns="http://www.w3.org/2000/svg"
  width="16"
  height="16"
  viewBox="0 0 27 70">
  <g>
    <path
      d="m 1.0769167,58.015255 c 0.217654,0.354078 2.981133,3.275215 6.141066,6.491418 5.2863293,5.380463 5.8029433,5.84764 6.4664543,5.84764 0.665502,0 1.194478,-0.484452 6.858149,-6.280882 6.083147,-6.225736 6.13703,-6.28875 6.13703,-7.176876 0,-0.637443 -0.145906,-1.069736 -0.505635,-1.498089 L 25.668348,54.796371 21.3514,54.730451 17.034455,54.664531 V 37.542387 c 0,-9.417179 -0.06092,-18.000541 -0.135383,-19.074135 l -0.135382,-1.951988 4.45232,-0.06594 4.452319,-0.06597 0.505644,-0.602096 c 0.358397,-0.426766 0.505643,-0.861029 0.505643,-1.491273 0,-0.878947 -0.07053,-0.961469 -6.133897,-7.1768736 -5.688745,-5.831388 -6.186808,-6.28770195 -6.86297,-6.28770195 -0.675922,0 -1.176483,0.45789495 -6.8661033,6.28087995 -6.08314705,6.2257346 -6.13703005,6.2887486 -6.13703005,7.1768766 0,0.637443 0.145908,1.069735 0.50563505,1.498089 l 0.505633,0.602095 4.316948,0.06592 4.3169453,0.06592 v 17.122137 c 0,9.417183 0.06092,18.000543 0.135383,19.074137 l 0.135382,1.951988 -4.4523203,0.06596 -4.452317,0.06596 -0.505646,0.602096 c -0.61444705,0.731653 -0.65563605,1.726456 -0.108342,2.616786 z"
    />
  </g>
</svg>

const logo_hh = <svg xmlns="http://www.w3.org/2000/svg"
  width="16"
  height="16"
  viewBox="0 0 70 27"
>
  <g>
    <path
      d="m 57.188847,25.602699 c 0.354078,-0.217654 3.275215,-2.981133 6.491418,-6.141066 5.380463,-5.286329 5.84764,-5.802943 5.84764,-6.466454 0,-0.665502 -0.484452,-1.194478 -6.280882,-6.858149 C 57.021287,0.053883 56.958273,0 56.070147,0 55.432704,0 55.000411,0.145906 54.572058,0.505635 l -0.602095,0.505633 -0.06592,4.316948 -0.06592,4.316945 H 36.715979 c -9.41718,0 -18.000542,0.06092 -19.074136,0.135383 L 15.689855,9.915926 15.623915,5.463606 15.557945,1.011287 14.955849,0.505643 C 14.529083,0.147246 14.09482,0 13.464576,0 12.585629,0 12.503107,0.07053 6.287703,6.133897 0.45631402,11.822642 2.289157e-8,12.320705 2.289157e-8,12.996867 2.289157e-8,13.672789 0.45789502,14.17335 6.280881,19.86297 12.506615,25.946117 12.569629,26 13.457757,26 c 0.637443,0 1.069735,-0.145908 1.498089,-0.505635 l 0.602095,-0.505633 0.06592,-4.316948 0.06592,-4.316945 h 17.122138 c 9.417183,0 18.000543,-0.06092 19.074137,-0.135383 l 1.951988,-0.135382 0.06596,4.45232 0.06596,4.452317 0.602096,0.505646 c 0.731653,0.614447 1.726456,0.655636 2.616786,0.108342 z"
    />
  </g>
</svg>

const svg_label_top = <svg xmlns="http://www.w3.org/2000/svg" viewBox='0 0 24 24' width="12" height="12"><path d="M19.5,0H4.5c-.829,0-1.5,.671-1.5,1.5s.671,1.5,1.5,1.5h7.247c-.143,.042-.278,.12-.391,.234l-5.087,5.191c-.574,.581-.167,1.575,.644,1.575h3.587v12.5c0,.829,.671,1.5,1.5,1.5s1.5-.671,1.5-1.5V10h3.587c.811,0,1.218-.994,.644-1.575L12.644,3.234c-.113-.114-.248-.192-.391-.234h7.247c.828,0,1.5-.671,1.5-1.5s-.672-1.5-1.5-1.5Z" /></svg>
const svg_label_bottom = <svg xmlns="http://www.w3.org/2000/svg" viewBox='0 0 24 24' width="12" height="12"><path d="M19.5,21h-7.247c.143-.042,.278-.12,.391-.234l5.087-5.191c.574-.581,.167-1.575-.644-1.575h-3.587V1.5c0-.829-.672-1.5-1.5-1.5s-1.5,.671-1.5,1.5V14h-3.587c-.811,0-1.218,.994-.644,1.575l5.087,5.191c.113,.114,.248,.192,.391,.234H4.5c-.828,0-1.5,.671-1.5,1.5s.672,1.5,1.5,1.5h15c.828,0,1.5-.671,1.5-1.5s-.672-1.5-1.5-1.5Z" /></svg>
const svg_label_center = <svg xmlns="http://www.w3.org/2000/svg" viewBox='0 0 24 24' width="12" height="12"><path d="M24,12c0,.553-.448,1-1,1H1c-.552,0-1-.447-1-1s.448-1,1-1H23c.552,0,1,.447,1,1Zm-13.414-3.586c.39,.39,.902,.585,1.414,.585s1.024-.195,1.414-.585l3.293-3.293c.391-.391,.391-1.023,0-1.414s-1.023-.391-1.414,0l-2.293,2.293V1c0-.553-.448-1-1-1s-1,.447-1,1V6l-2.293-2.293c-.391-.391-1.023-.391-1.414,0s-.391,1.023,0,1.414l3.293,3.293Zm2.828,7.172c-.779-.779-2.049-.779-2.828,0l-3.293,3.293c-.391,.391-.391,1.023,0,1.414s1.023,.391,1.414,0l2.293-2.293v5c0,.553,.448,1,1,1s1-.447,1-1v-5l2.293,2.293c.195,.195,.451,.293,.707,.293s.512-.098,.707-.293c.391-.391,.391-1.023,0-1.414l-3.293-3.293Z" /></svg>

/*************************************************************************************************/

export const MenuConfigurationLinksAppearence: FunctionComponent<MenuConfigurationLinksAppearenceFType> = ({
  applicationData,
  applicationState,
  applicationContext,
  additional_link_appearence_items,
  menu_for_style
}) => {

  // Datas ------------------------------------------------------------------------------

  // Get traduction function
  const { t } = applicationContext

  // Get data
  const { new_data } = applicationData
  const { ref_selected_style_link } = applicationState

  // Elements on which this menu applies ------------------------------------------------

  // Selected links
  let selected_links
  if (!new_data.menu_configuration.is_selector_only_for_visible_links) {
    // All availables links
    selected_links = new_data.drawing_area.selected_links_list_sorted
  }
  else {
    // Only visible links
    selected_links = new_data.drawing_area.visible_and_selected_links_list_sorted
  }

  // Elements on which menu modification applies
  let elements: Class_LinkStyle[] | Class_LinkElement[]
  if (menu_for_style) {
    elements = [new_data.drawing_area.sankey.link_styles_dict[ref_selected_style_link.current]]
  }
  else {
    elements = selected_links
  }

  // Elements attributes ----------------------------------------------------------------

  /**
   * function that go throught all links of an array & check if they're all equals
   * (to the first )
   * @param {Class_LinkElement} curr
   * @return {*}
   */
  const check_indeterminate = (curr: Class_LinkElement) => {
    return (selected_links[0].isEqual(curr))
  }
  const is_indeterminate = !selected_links.every(check_indeterminate)

  const shape_orientation = (elements[0]?.shape_orientation ?? default_shape_orientation)
  const shape_starting_curve = (elements[0]?.shape_starting_curve ?? default_shape_starting_curve)
  const shape_ending_curve = (elements[0]?.shape_ending_curve ?? default_shape_ending_curve)
  const shape_starting_tangeant = (elements[0]?.shape_starting_tangeant ?? default_shape_starting_tangeant)
  const shape_ending_tangeant = (elements[0]?.shape_ending_tangeant ?? default_shape_ending_tangeant)
  const shape_is_curved = (elements[0]?.shape_is_curved ?? default_shape_is_curved)
  const shape_is_recycling = (elements[0]?.shape_is_recycling ?? default_shape_is_recycling)
  const shape_arrow_size = (elements[0]?.shape_arrow_size ?? default_shape_arrow_size)
  const value_label_position = (elements[0]?.value_label_position ?? default_value_label_position)
  const value_label_orthogonal_position = (elements[0]?.value_label_orthogonal_position ?? default_value_label_orthogonal_position)
  const value_label_on_path = (elements[0]?.value_label_on_path ?? default_value_label_on_path)
  const value_label_pos_auto = (elements[0]?.value_label_pos_auto ?? default_value_label_pos_auto)
  const shape_is_arrow = (elements[0]?.shape_is_arrow ?? default_shape_is_arrow)
  const shape_color = (elements[0]?.shape_color ?? default_shape_color)
  const shape_opacity = (elements[0]?.shape_opacity ?? default_shape_opacity)
  const shape_is_dashed = (elements[0]?.shape_is_dashed ?? default_shape_is_dashed)
  const value_label_is_visible = (elements[0]?.value_label_is_visible ?? default_value_label_is_visible)
  const value_label_font_size = (elements[0]?.value_label_font_size ?? default_value_label_font_size)
  const value_label_color = (elements[0]?.value_label_color ?? default_value_label_color)
  const value_label_to_precision = (elements[0]?.value_label_to_precision ?? default_value_label_to_precision)
  const value_label_scientific_precision = (elements[0]?.value_label_scientific_precision ?? default_value_label_scientific_precision)
  const value_label_font_family = (elements[0]?.value_label_font_family ?? default_value_label_font_family)
  const value_label_unit_visible = (elements[0]?.value_label_unit_visible ?? default_value_label_unit_visible)
  const value_label_unit = (elements[0]?.value_label_unit ?? default_value_label_unit)
  const value_label_custom_digit = (elements[0]?.value_label_custom_digit ?? default_value_label_custom_digit)
  const value_label_nb_digit = (elements[0]?.value_label_nb_digit ?? default_value_label_nb_digit)

  //Change le style des flux sélectionnés
  const style_of_selected_links = () => {
    if (selected_links.length !== 0) {
      const style = selected_links[0].style
      let inchangee = true
      selected_links.map(link => {
        inchangee = (link.style.id === style.id) ? inchangee : false
      })
      return (inchangee) ?
        CutName(style.id, 25) :
        t('Noeud.multi_style')
    }
    else {
      return default_style_id
    }
  }

  // Components updaters ----------------------------------------------------------------

  // State variable to trigger this menu refreshing
  const [ , refreshThis ] = useBoolean()

  // Link this menu's update function
  if (!menu_for_style) {
    new_data.menu_configuration.ref_to_menu_config_link_apparence_updater.current = refreshThis.toggle
  }

  // Link to ConfigMenuNumberInput state variable
  const number_of_input = 9
  const ref_set_number_inputs: MutableRefObject<(_:number | null | undefined) => void>[] = []
  for (let i=0; i<number_of_input; i++)
    ref_set_number_inputs.push(useRef((_:number | null | undefined) => null))

  // Be sure that values are updated in inputs when refreshing this component
  ref_set_number_inputs[0].current(shape_arrow_size)
  ref_set_number_inputs[1].current(shape_starting_curve*100)
  ref_set_number_inputs[2].current(shape_ending_curve*100)
  ref_set_number_inputs[3].current(shape_starting_tangeant*100)
  ref_set_number_inputs[4].current(shape_ending_tangeant*100)
  ref_set_number_inputs[5].current(shape_opacity)
  ref_set_number_inputs[6].current(value_label_scientific_precision)
  ref_set_number_inputs[7].current(value_label_nb_digit)
  ref_set_number_inputs[8].current(value_label_font_size)

  /**
   * Function used to reset menu UI
   */
  const refreshThisAndUpdateRelatedComponents = () => {
    // Whatever is done, set saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    // Update menus for node's apparence in case we use this for style
    if (menu_for_style) {
      new_data.menu_configuration.updateAllComponentsRelatedToLinks()
    }
    // And update this menu also
    refreshThis.toggle()
  }


  // JSX menu components ---------------------------------------------------------------

  const content_appearence = <Box
    layerStyle='menuconfigpanel_grid'
  >
    <Box
      as='span'
      layerStyle='menuconfigpanel_part_title_2'
    >
      {t('Menu.edition')}
    </Box>

    {/* Flux en recyclage  */}

    <Checkbox
      variant='menuconfigpanel_option_checkbox'
      isIndeterminate={is_indeterminate}
      isChecked={shape_is_recycling}
      onChange={
        (evt) => {
          elements.forEach(element => {element.shape_is_recycling = evt.target.checked})
          refreshThisAndUpdateRelatedComponents()
        }}>
      <OSTooltip label={t('Flux.apparence.tooltips.recy')}>{t('Flux.apparence.recy')}
      </OSTooltip>
    </Checkbox>

    {/* Orientation du flux */}
    <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('Flux.apparence.of')}
        {
          (!menu_for_style) &&
          isAttributeOverloaded(selected_links, 'shape_orientation') ?
            <>{TooltipValueSurcharge('link_var_', t)}</> :
            <></>
        }
      </Box>
      <Box layerStyle='options_4cols' >
        {/* Horizontal - Horizontal  */}
        <OSTooltip label={t('Flux.apparence.tooltips.of_hh')}>
          <Button
            className='btn_menu_config'
            value='hh'
            variant={
              (shape_orientation === 'hh') ?
                'menuconfigpanel_option_button_activated_left' :
                'menuconfigpanel_option_button_left'
            }
            onClick={
              () => {
                elements.forEach(element => element.shape_orientation = 'hh')
                refreshThisAndUpdateRelatedComponents()
              }
            }
          >
            {logo_hh}
          </Button>
        </OSTooltip>

        {/* Vertical - Verticale  */}
        <OSTooltip label={t('Flux.apparence.tooltips.of_vv')}>
          <Button
            className='btn_menu_config'
            value='vv'
            variant={(shape_orientation === 'vv') ? 'menuconfigpanel_option_button_activated_center' :
              'menuconfigpanel_option_button_center'}
            onClick={() => {
              elements.forEach(element => element.shape_orientation = 'vv')
              refreshThisAndUpdateRelatedComponents()
            }}
          >
            {logo_vv}
          </Button>
        </OSTooltip>

        {/* Vertical - Horizontal  */}
        <OSTooltip label={t('Flux.apparence.tooltips.of_vh')}>
          <Button
            className='btn_menu_config'
            value='vh'
            variant={
              (shape_orientation === 'vh') ?
                'menuconfigpanel_option_button_activated_center' :
                'menuconfigpanel_option_button_center'
            }
            onClick={() => {
              elements.forEach(element => element.shape_orientation = 'vh')
              refreshThisAndUpdateRelatedComponents()
            }}
          >
            {logo_vh}
          </Button>
        </OSTooltip>

        {/* Horizontal - Vertical  */}
        <OSTooltip label={t('Flux.apparence.tooltips.of_hv')}>
          <Button
            className='btn_menu_config'
            value='hv'
            variant={
              (shape_orientation === 'hv') ?
                'menuconfigpanel_option_button_activated_right' :
                'menuconfigpanel_option_button_right'
            }
            onClick={() => {
              elements.forEach(element => element.shape_orientation = 'hv')
              refreshThisAndUpdateRelatedComponents()
            }}
          >
            {logo_hv}
          </Button>
        </OSTooltip>
      </Box>
    </Box>

    {/* Forme fleche droite  */}
    <Checkbox
      variant='menuconfigpanel_option_checkbox'
      isIndeterminate={is_indeterminate}
      isChecked={shape_is_arrow}
      onChange={(evt) => {
        elements.forEach(element => element.shape_is_arrow = evt.target.checked)
        refreshThisAndUpdateRelatedComponents()
      }}
    >
      <OSTooltip label={t('Flux.apparence.tooltips.fleche')}>
        {t('Flux.apparence.fleche')}
      </OSTooltip>
    </Checkbox>

    <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('Flux.apparence.arrow_size')}
        {
          (!menu_for_style) &&
          isAttributeOverloaded(selected_links, 'shape_arrow_size') ?
            <>{TooltipValueSurcharge('link_var_', t)}</> :
            <></>
        }
      </Box>
      <InputGroup variant='menuconfigpanel_option_input' >
        <OSTooltip label={t('Flux.apparence.tooltips.arrow_size')}>
          <ConfigMenuNumberInput
            ref_to_set_value={ref_set_number_inputs[0]}
            default_value={shape_arrow_size}
            menu_for_style={menu_for_style}
            minimum_value={1}
            stepper={true}
            function_on_blur={(value) => {
              elements.forEach(element => element.shape_arrow_size = value ?? undefined)
              refreshThisAndUpdateRelatedComponents()
            }}
          />
        </OSTooltip>
      </InputGroup>
    </Box>

    {/* Forme courbée  */}
    <Checkbox
      variant='menuconfigpanel_option_checkbox'
      isIndeterminate={is_indeterminate}
      isChecked={shape_is_curved}
      onChange={(evt) => {
        elements.forEach(element => element.shape_is_curved = evt.target.checked)
        refreshThisAndUpdateRelatedComponents()
      }}
    >
      <OSTooltip label={t('Flux.apparence.tooltips.courbe')}>
        {t('Flux.apparence.courbe')}
      </OSTooltip>
    </Checkbox>

    {/* Départ de courbure */}
    <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('Flux.apparence.starting_curve')}
        {
          (
            (!menu_for_style) &&
            isAttributeOverloaded(selected_links, 'shape_starting_curve')
          ) ?
            <>{TooltipValueSurcharge('link_var_', t)}</> :
            <></>
        }
      </Box>
      <OSTooltip label={t('Flux.apparence.tooltips.starting_curve')}>
        <ConfigMenuNumberInput
          ref_to_set_value={ref_set_number_inputs[1]}
          default_value={shape_starting_curve*100}
          function_on_blur={(value) => {
            elements.forEach(element =>
              element.shape_starting_curve = (value ? value/100 : undefined))
            refreshThisAndUpdateRelatedComponents()
          }}
          menu_for_style={menu_for_style}
          minimum_value={0}
          maximum_value={shape_ending_curve*100}
          step={1}
          stepper={true}
          unit_text='%'
        />
      </OSTooltip>
    </Box>

    {/* Fin de courbure */}
    <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('Flux.apparence.ending_curve')}
        {
          (
            (!menu_for_style) &&
            isAttributeOverloaded(selected_links, 'shape_ending_curve')
          ) ?
            <>{TooltipValueSurcharge('link_var_', t)}</> :
            <></>
        }
      </Box>
      <OSTooltip label={t('Flux.apparence.tooltips.ending_curve')}>
        <ConfigMenuNumberInput
          ref_to_set_value={ref_set_number_inputs[2]}
          default_value={shape_ending_curve*100}
          menu_for_style={menu_for_style}
          minimum_value={shape_starting_curve*100}
          maximum_value={100}
          step={1}
          stepper={true}
          unit_text='%'
          function_on_blur={(value) => {
            elements.forEach(element =>
              element.shape_ending_curve = (value ? value/100 : undefined))
            refreshThis.toggle()
          }}
        />
      </OSTooltip>
    </Box>


    {/* Modification de la longueur de la tangente de départ  */}
    <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('Flux.apparence.starting_tangeant')}
        {
          (!menu_for_style) &&
          isAttributeOverloaded(selected_links, 'shape_starting_tangeant') ?
            <>{TooltipValueSurcharge('link_var_', t)}</> :
            <></>
        }
      </Box>
      <InputGroup variant='menuconfigpanel_option_input' >
        <OSTooltip label={t('Flux.apparence.tooltips.starting_tangeant')}>
          <ConfigMenuNumberInput
            ref_to_set_value={ref_set_number_inputs[3]}
            default_value={shape_starting_tangeant*100}
            menu_for_style={menu_for_style}
            minimum_value={0}
            step={1}
            stepper={true}
            unit_text='%'
            function_on_blur={(value) => {
              elements.forEach(element =>
                element.shape_starting_tangeant = (value ? value/100 : undefined))
              refreshThisAndUpdateRelatedComponents()
            }
            }

          />
        </OSTooltip>
      </InputGroup>
    </Box>


    {/* Modification de la longueur de la tangente de fin  */}
    <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('Flux.apparence.ending_tangeant')}
        {
          (!menu_for_style) &&
          isAttributeOverloaded(selected_links, 'shape_ending_tangeant') ?
            <>{TooltipValueSurcharge('link_var_', t)}</> :
            <></>
        }
      </Box>
      <InputGroup variant='menuconfigpanel_option_input' >
        <OSTooltip label={t('Flux.apparence.tooltips.ending_tangeant')}>
          <ConfigMenuNumberInput
            ref_to_set_value={ref_set_number_inputs[4]}
            default_value={shape_ending_tangeant*100}
            menu_for_style={menu_for_style}
            minimum_value={0}
            step={1}
            stepper={true}
            unit_text='%'
            function_on_blur={(value) => {
              elements.forEach(element =>
                element.shape_ending_tangeant = (value ? value/100 : undefined))
              refreshThisAndUpdateRelatedComponents()  }
            }
          />
        </OSTooltip>
      </InputGroup>
    </Box>

    {/* Choix de la couleur du flux */}
    <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('Flux.apparence.couleur')}
        {
          (!menu_for_style) &&
          isAttributeOverloaded(selected_links, 'shape_color') ?
            <>{TooltipValueSurcharge('link_var_', t)}</> :
            <></>
        }
      </Box>
      <Input
        variant='menuconfigpanel_option_input_color'
        type='color'
        value={shape_color}
        onChange={evt => {
          elements.forEach(element => element.shape_color = evt.target.value)
          refreshThisAndUpdateRelatedComponents()
        }}
      />
    </Box>

    {/* Opacité */}
    <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('Flux.apparence.opacity')}
        {
          (!menu_for_style) &&
          isAttributeOverloaded(selected_links, 'shape_opacity') ?
            <>{TooltipValueSurcharge('link_var_', t)}</> :
            <></>
        }
      </Box>
      <InputGroup variant='menuconfigpanel_option_input' >
        <OSTooltip label={t('Flux.apparence.tooltips.shape_opacity')}>
          <ConfigMenuNumberInput
            ref_to_set_value={ref_set_number_inputs[5]}
            default_value={shape_opacity}
            menu_for_style={menu_for_style}
            minimum_value={0}
            maximum_value={1}
            step={0.1}
            stepper={true}
            function_on_blur={(value) => {
              elements.forEach(element =>
                element.shape_opacity = value ?? undefined)
              refreshThisAndUpdateRelatedComponents()
            }}
          />
        </OSTooltip>
      </InputGroup>
    </Box>

    {/* Flux hachuré */}
    <Checkbox
      variant='menuconfigpanel_option_checkbox'
      isIndeterminate={is_indeterminate}
      isChecked={shape_is_dashed}
      onChange={(evt) => {
        elements.forEach(element => element.shape_is_dashed = evt.target.checked)
        refreshThisAndUpdateRelatedComponents()
      }}>
      <OSTooltip label={t('Flux.apparence.tooltips.hach')}>
        {t('Flux.apparence.hach') + ' '}
      </OSTooltip>
      {
        (!menu_for_style) &&
        isAttributeOverloaded(selected_links, 'shape_is_dashed') ?
          TooltipValueSurcharge('link_var_', t) :
          <></>
      }
    </Checkbox>

    {additional_link_appearence_items}

  </Box>

  const content_label = <Box
    layerStyle='menuconfigpanel_grid'
  >
    <Box
      as='span'
      layerStyle='menuconfigpanel_part_title_1'
    >

      <Checkbox
        variant='menuconfigpanel_part_title_1_checkbox'
        icon={value_label_is_visible ? <FaEye /> : <FaEyeSlash />}
        isIndeterminate={is_indeterminate}
        isChecked={value_label_is_visible}
        onChange={(evt) => {
          elements.forEach(element => element.value_label_is_visible = evt.target.checked)
          refreshThisAndUpdateRelatedComponents()
        }}>
        <OSTooltip label={t('Flux.label.tooltips.label')}>
          {t('Flux.label.vdb') + ' '}
        </OSTooltip>
        {
          (!menu_for_style) &&
          isAttributeOverloaded(selected_links, 'value_label_is_visible') ?
            TooltipValueSurcharge('link_var_', t) :
            <></>
        }
      </Checkbox>
    </Box>

    {value_label_is_visible ? <>

      {/* Choose number of significant number */}
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name'>
          {t('Flux.label.NbPrecision')}
        </Box>
        <OSTooltip label={t('Flux.label.tooltips.NbPrecision')}>
          <ConfigMenuNumberInput
            ref_to_set_value={ref_set_number_inputs[6]}
            default_value={value_label_scientific_precision}
            menu_for_style={menu_for_style}
            minimum_value={0}
            stepper={true}
            function_on_blur={(value) => {
              elements.forEach(element =>
                element.value_label_scientific_precision = value ?? undefined)
              refreshThisAndUpdateRelatedComponents()
            }}
          />
        </OSTooltip>
      </Box>

      {/* Choix d'affichage en notation scientifique  */}
      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isIndeterminate={is_indeterminate}
        isChecked={value_label_to_precision}
        onChange={(evt) => {
          elements.forEach(element => {
            element.value_label_custom_digit = false
            element.value_label_to_precision = evt.target.checked
          })
          refreshThisAndUpdateRelatedComponents()
        }}>
        <OSTooltip label={t('Flux.label.tooltips.toPrecision')}>
          {t('Flux.label.toPrecision') + ' '}
        </OSTooltip>
        {
          (!menu_for_style) &&
          isAttributeOverloaded(selected_links, 'value_label_to_precision') ?
            TooltipValueSurcharge('link_var_', t) :
            <></>
        }
      </Checkbox>

      {
        value_label_to_precision ?
          <></> :
          <></>
      }

      {/* Choix d'affichage du nombre de chiffre après la virgule  */}
      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isIndeterminate={is_indeterminate}
        isChecked={value_label_custom_digit}
        onChange={(evt) => {
          elements.forEach(element => {
            element.value_label_custom_digit = evt.target.checked
            element.value_label_to_precision = false
          })
          refreshThisAndUpdateRelatedComponents()
        }}>
        <OSTooltip label={t('Flux.label.tooltips.custom_digit')}>
          {t('Flux.label.custom_digit') + ' '}
        </OSTooltip>
        {
          (!menu_for_style) &&
          isAttributeOverloaded(selected_links, 'value_label_custom_digit') ?
            TooltipValueSurcharge('link_var_', t) :
            <></>
        }
      </Checkbox>

      {value_label_custom_digit ? <>
        {/* Choose number of custom digit */}
        <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
          <Box layerStyle='menuconfigpanel_option_name'>
            {t('Flux.label.NbDigit')}
          </Box>
          <OSTooltip label={t('Flux.label.tooltips.NbDigit')}>
            <ConfigMenuNumberInput
              ref_to_set_value={ref_set_number_inputs[7]}
              default_value={value_label_nb_digit}
              menu_for_style={menu_for_style}
              minimum_value={0}
              stepper={true}
              function_on_blur={(value) =>{
                elements.forEach(element =>
                  element.value_label_nb_digit = value ?? undefined)
                refreshThisAndUpdateRelatedComponents()
              }}
            />
          </OSTooltip>
        </Box></> : <></>}

      {/* Ajout une unité au label de flux */}
      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        icon={value_label_unit_visible ? <FaEye /> : <FaEyeSlash />}
        isChecked={value_label_unit_visible}
        onChange={(evt) => {
          elements.forEach(element => element.value_label_unit_visible = evt.target.checked)
          refreshThisAndUpdateRelatedComponents()
        }}>
        <OSTooltip label={t('Flux.label.tooltips.l_u_v')}>
          {t('Flux.label.l_u_v') + ' '}
        </OSTooltip>
        {
          (!menu_for_style) &&
          isAttributeOverloaded(selected_links, 'value_label_unit_visible') ?
            TooltipValueSurcharge('link_var_', t) :
            <></>
        }
      </Checkbox>

      {/* Modifie l'unité du label de flux */}
      {
        value_label_unit_visible ?
          <>
            <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
              <Box layerStyle='menuconfigpanel_option_name'>
                {t('Flux.label.l_u')}
                {
                  (!menu_for_style) &&
                  isAttributeOverloaded(selected_links, 'value_label_unit') ?
                    <>{TooltipValueSurcharge('link_var_', t)}</> :
                    <></>
                }
              </Box>
              <OSTooltip label={t('Flux.label.tooltips.l_u')}>
                <Input
                  variant='menuconfigpanel_option_input'
                  value={value_label_unit}
                  onChange={evt => {
                    elements.forEach(element => element.value_label_unit = evt.target.value)
                    refreshThisAndUpdateRelatedComponents()
                  }}
                />
              </OSTooltip>
            </Box>
          </> :
          <></>
      }

      <Box
        layerStyle='menuconfigpanel_grid'
      >
        <Box as='span' layerStyle='menuconfigpanel_part_title_2' >
          {t('Menu.edition')}
        </Box>

        {/* Couleur des Labels  */}
        <Box layerStyle='options_3cols' >

          {/* Label en noir  */}
          <OSTooltip label={t('Flux.label.tooltips.len')}>
            <Button
              variant={
                (!is_indeterminate && (value_label_color === 'black')) ?
                  'menuconfigpanel_option_button_activated_left' :
                  'menuconfigpanel_option_button_left'
              }
              onClick={() => {
                elements.forEach(element => element.value_label_color = 'black')
                refreshThisAndUpdateRelatedComponents()
              }}
            >
              {t('Flux.label.len')}
              {
                (!menu_for_style) &&
                isAttributeOverloaded(selected_links, 'value_label_color') ?
                  <>{TooltipValueSurcharge('link_var_', t)}</> :
                  <></>
              }
            </Button>
          </OSTooltip>

          {/* Label en blanc  */}
          <OSTooltip label={t('Flux.label.tooltips.lb')}>
            <Button
              variant={
                (!is_indeterminate && (value_label_color === 'white')) ?
                  'menuconfigpanel_option_button_activated_center' :
                  'menuconfigpanel_option_button_center'
              }
              onClick={() => {
                elements.forEach(element => element.value_label_color = 'white')
                refreshThisAndUpdateRelatedComponents()
              }}
            >
              {t('Flux.label.lb')}
              {
                (!menu_for_style) &&
                isAttributeOverloaded(selected_links, 'value_label_color') ?
                  <>{TooltipValueSurcharge('link_var_', t)}</> :
                  <></>
              }
            </Button>
          </OSTooltip>

          {/* Label en couleur  */}
          <OSTooltip label={t('Flux.label.tooltips.lec')}>
            <Button
              variant={
                (!is_indeterminate && (value_label_color === 'color')) ?
                  'menuconfigpanel_option_button_activated_right' :
                  'menuconfigpanel_option_button_right'
              }
              onClick={() => {
                elements.forEach(element => element.value_label_color = 'color')
                refreshThisAndUpdateRelatedComponents()
              }}
            >
              {t('Flux.label.lec')}
              {
                (!menu_for_style) &&
                isAttributeOverloaded(selected_links, 'value_label_color') ?
                  <>{TooltipValueSurcharge('link_var_', t)}</> :
                  <></>
              }
            </Button>
          </OSTooltip>
        </Box>

        {/* Police des labels de flux  */}
        <Box as='span' layerStyle='menuconfigpanel_part_title_3' >
          Police
        </Box>
        <Box layerStyle='options_2cols' >
          <Select
            variant='menuconfigpanel_option_select'
            value={value_label_font_family}
            onChange={
              (evt: React.ChangeEvent<HTMLSelectElement>) => {
                elements.forEach(element => element.value_label_font_family = evt.target.value)
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
                  >
                    {d}
                  </option>
                })
            }
          </Select>

          <ConfigMenuNumberInput
            ref_to_set_value={ref_set_number_inputs[8]}
            default_value={value_label_font_size}
            menu_for_style={menu_for_style}
            minimum_value={11}
            stepper={true}
            unit_text='pixels'
            function_on_blur={(value) =>{
              elements.forEach(element =>
                element.value_label_font_size = value ?? undefined)
              refreshThisAndUpdateRelatedComponents()
            }}
          />
        </Box>

        {/* Button to adjust label position in case the label is bigger than the link */}
        <Box as='span' layerStyle='menuconfigpanel_part_title_2' >
          Position
        </Box>
        <Checkbox
          variant='menuconfigpanel_option_checkbox'
          isIndeterminate={is_indeterminate}
          isChecked={value_label_pos_auto}
          onChange={(evt) => {
            elements.forEach(element => {
              const orth_pos = element.value_label_orthogonal_position
              element.value_label_pos_auto = evt.target.checked
              element.value_label_position = 'start'
              element.value_label_orthogonal_position = (orth_pos === 'dragged') ? 'middle' : orth_pos
            })
            selected_links.forEach(link => link.deleteRelativeLabelPos())
            refreshThisAndUpdateRelatedComponents()
          }}
        >
          <OSTooltip label={t('Flux.tooltips.ajust_label')}>
            {t('Flux.ajust_label')}
          </OSTooltip>
        </Checkbox>

        {/* Positionnement lateral des label */}
        <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
          <Box layerStyle='menuconfigpanel_option_name'>
            {t('Flux.label.pos')}
            {
              (!menu_for_style) &&
              isAttributeOverloaded(selected_links, 'value_label_position') ?
                <>{TooltipValueSurcharge('link_var_', t)}</> :
                <></>
            }
          </Box>
          <Box
            layerStyle='options_2cols'
          >
            <Box layerStyle='options_3cols' >
              {/* Vers le début  */}
              <OSTooltip label={t('Flux.label.tooltips.deb')}>
                <Button
                  paddingStart='0'
                  paddingEnd='0'
                  minWidth='0'
                  variant={
                    (!is_indeterminate && (value_label_position === 'start')) ?
                      'menuconfigpanel_option_button_activated_left' :
                      'menuconfigpanel_option_button_left'
                  }
                  onClick={
                    () => {
                      elements.forEach(element => {
                        const orth_pos = element.value_label_orthogonal_position
                        element.value_label_position = 'start'
                        element.value_label_orthogonal_position = (orth_pos == 'dragged') ? 'middle' : orth_pos
                      })
                      selected_links.forEach(link => link.deleteRelativeLabelPos())
                      refreshThisAndUpdateRelatedComponents()
                    }}>
                  <FaAlignLeft />
                </Button>
              </OSTooltip>

              {/* Vers le milieu  */}
              <OSTooltip label={t('Flux.label.tooltips.milieu_h')}>
                <Button
                  paddingStart='0'
                  paddingEnd='0'
                  minWidth='0'
                  variant={
                    (!is_indeterminate && (value_label_position === 'middle')) ?
                      'menuconfigpanel_option_button_activated_center' :
                      'menuconfigpanel_option_button_center'
                  }
                  onClick={
                    () => {
                      elements.forEach(element => {
                        const orth_pos = element.value_label_orthogonal_position
                        element.value_label_position = 'middle'
                        element.value_label_orthogonal_position = (orth_pos == 'dragged') ? 'middle' : orth_pos
                      })
                      selected_links.forEach(link => link.deleteRelativeLabelPos())
                      refreshThisAndUpdateRelatedComponents()
                    }}>
                  <FaAlignCenter />
                </Button>
              </OSTooltip>

              {/* Vers la fin du flux  */}
              <OSTooltip label={t('Flux.label.tooltips.fin')}>
                <Button
                  paddingStart='0'
                  paddingEnd='0'
                  minWidth='0'
                  variant={
                    (!is_indeterminate && (value_label_position === 'end')) ?
                      'menuconfigpanel_option_button_activated_right' :
                      'menuconfigpanel_option_button_right'}
                  onClick={
                    () => {
                      elements.forEach(element => {
                        const orth_pos = element.value_label_orthogonal_position
                        element.value_label_position = 'end'
                        element.value_label_orthogonal_position = (orth_pos == 'dragged') ? 'middle' : orth_pos
                      })
                      selected_links.forEach(link => link.deleteRelativeLabelPos())
                      refreshThisAndUpdateRelatedComponents()
                    }}>
                  <FaAlignRight />
                </Button>
              </OSTooltip>
            </Box>

            {/* Positionnement vertical des label  */}
            <Box layerStyle='options_3cols' >
              {/* Positionnement au dessous  */}
              <OSTooltip label={t('Flux.label.tooltips.dessous')}>
                <Button
                  paddingStart='0'
                  paddingEnd='0'
                  minWidth='0'
                  variant={
                    (
                      !value_label_pos_auto &&
                      !is_indeterminate &&
                      (value_label_orthogonal_position === 'below')
                    ) ?
                      'menuconfigpanel_option_button_activated_left' :
                      'menuconfigpanel_option_button_left'}
                  onClick={() => {
                    elements.forEach(element => {
                      element.value_label_pos_auto = false
                      const lab_pos = element.value_label_position
                      element.value_label_position = (lab_pos == 'dragged') ? 'middle' : lab_pos
                      element.value_label_orthogonal_position = 'below'
                    })
                    selected_links.forEach(link => link.deleteRelativeLabelPos())
                    refreshThisAndUpdateRelatedComponents()
                  }}
                >
                  {svg_label_bottom}
                </Button>
              </OSTooltip>

              {/* Positionnement au milieu  */}
              <OSTooltip label={t('Flux.label.tooltips.milieu_v')}>
                <Button
                  paddingStart='0'
                  paddingEnd='0'
                  minWidth='0'
                  variant={
                    (
                      !value_label_pos_auto &&
                      !is_indeterminate &&
                      (value_label_orthogonal_position === 'middle')
                    ) ?
                      'menuconfigpanel_option_button_activated_center' :
                      'menuconfigpanel_option_button_center'}
                  onClick={() => {
                    elements.forEach(element => {
                      element.value_label_pos_auto = false
                      const lab_pos = element.value_label_position
                      element.value_label_position = (lab_pos == 'dragged') ? 'middle' : lab_pos
                      element.value_label_orthogonal_position = 'middle'
                    })
                    selected_links.forEach(link => link.deleteRelativeLabelPos())
                    refreshThisAndUpdateRelatedComponents()
                  }}
                >
                  {svg_label_center}
                </Button>
              </OSTooltip>

              {/* Positionnement au dessus  */}
              <OSTooltip label={t('Flux.label.tooltips.dessus')}>
                <Button
                  paddingStart='0'
                  paddingEnd='0'
                  minWidth='0'
                  variant={
                    (
                      !value_label_pos_auto &&
                      !is_indeterminate &&
                      (value_label_orthogonal_position === 'above')
                    ) ?
                      'menuconfigpanel_option_button_activated_right' :
                      'menuconfigpanel_option_button_right'}
                  onClick={
                    () => {
                      elements.forEach(element => {
                        element.value_label_pos_auto = false
                        const lab_pos = element.value_label_position
                        element.value_label_position = (lab_pos == 'dragged') ? 'middle' : lab_pos
                        element.value_label_orthogonal_position = 'above'
                      })
                      selected_links.forEach(link => link.deleteRelativeLabelPos())
                      refreshThisAndUpdateRelatedComponents()
                    }}>
                  {svg_label_top}
                </Button>
              </OSTooltip>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Orienter le texte du label le long du flux  */}
      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isIndeterminate={is_indeterminate}
        isChecked={value_label_on_path}
        onChange={(evt) => {
          elements.forEach(element => {
            element.value_label_on_path = evt.target.checked
            if (element.value_label_on_path) {
              const lab_pos = element.value_label_position
              const lab_orth_pos = element.value_label_orthogonal_position
              element.value_label_position = (lab_pos == 'dragged') ? 'middle' : lab_pos
              element.value_label_orthogonal_position = (lab_orth_pos == 'dragged' ? 'middle' : lab_orth_pos)
            }
          })
          selected_links.forEach(link => link.deleteRelativeLabelPos())
          refreshThisAndUpdateRelatedComponents()
        }}>
        <OSTooltip label={t('Flux.label.tooltips.acf')}>
          {t('Flux.label.acf') + ' '}
        </OSTooltip>
        {
          (!menu_for_style) &&
          isAttributeOverloaded(selected_links, 'value_label_on_path') ?
            TooltipValueSurcharge('link_var_', t) :
            <></>
        }
      </Checkbox>
    </> : <></>}
  </Box>

  const content_style = (!menu_for_style) ? <Box
    layerStyle='menuconfigpanel_grid'
  >
    <Box
      layerStyle='menuconfigpanel_row_stylechoice'
    >
      <Box
        layerStyle='menuconfigpanel_option_name'
        textStyle='h3'
      >
        {t('Noeud.Style')}
      </Box>
      <Menu>
        <MenuButton
          as={Button}
          variant='menuconfigpanel_option_button'
          rightIcon={<FaChevronDown />}
        >
          {style_of_selected_links()}
        </MenuButton>
        <MenuList>
          {
            new_data.drawing_area.sankey.link_styles_list_sorted
              .map(style => {
                return (
                  <MenuItem
                    key={style.id}
                    onClick={() => {
                      ref_selected_style_link.current = style.id
                      selected_links.map(link => {
                        link.style = style
                      })
                      refreshThisAndUpdateRelatedComponents()
                    }}
                  >
                    {style.id}
                  </MenuItem>
                )
              })
          }
        </MenuList>
      </Menu>
      <OSTooltip label={t('Noeud.tooltips.AS')}>
        <Button
          variant='menuconfigpanel_option_button'
          onClick={() => {
            selected_links.forEach(link => link.resetAttributes())
            refreshThisAndUpdateRelatedComponents()
          }}
        >
          <FaUndo />
        </Button>
      </OSTooltip>
    </Box>
    <hr style={{
      borderStyle: 'none',
      margin: '10px',
      color: 'grey',
      backgroundColor: 'grey',
      height: 2 }}
    />
  </Box> : <></>

  const content_zIndex_and_direction = (!menu_for_style) ? <Box layerStyle='menuconfigpanel_grid' >
    <Box as='span' layerStyle='menuconfigpanel_part_title_2' >
      {t('Flux.FS')}
    </Box>
    <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
      <Box layerStyle='menuconfigpanel_option_name' >
        {t('Flux.dzf')}
      </Box>
      <Box layerStyle='options_4cols' >
        {/* Boutton pour monter le lien sélctionné */}
        <OSTooltip label={t('Flux.tooltips.up')}>
          <Button
            className='btn_menu_config'
            variant={'menuconfigpanel_option_button_left'}
            isDisabled={selected_links.length === 0}
            onClick={() => {
              selected_links.forEach(link => link.increaseDisplayOrder())
              refreshThisAndUpdateRelatedComponents()
            }}>
            <FaAngleUp />
          </Button>
        </OSTooltip>

        <OSTooltip label={t('Flux.tooltips.upup')}>
          <Button
            variant={'menuconfigpanel_option_button_center'}
            isDisabled={selected_links.length === 0}
            className='btn_menu_config'
            onClick={() => {
              selected_links.forEach(link => link.setTopDisplayOrder())
              refreshThisAndUpdateRelatedComponents()
            }}>
            <FaAngleDoubleUp />
          </Button>
        </OSTooltip>

        {/* Boutton pour baisser le lien sélctionné */}
        <OSTooltip label={t('Flux.tooltips.dwn')}>
          <Button
            variant={'menuconfigpanel_option_button_center'}
            isDisabled={selected_links.length === 0}
            className='btn_menu_config'
            onClick={() => {
              selected_links.forEach(link => link.decreaseDisplayOrder())
              refreshThisAndUpdateRelatedComponents()
            }}>
            <FaAngleDown />
          </Button>
        </OSTooltip>

        <OSTooltip label={t('Flux.tooltips.dwndwn')}>
          <Button
            variant={'menuconfigpanel_option_button_right'}
            isDisabled={selected_links.length === 0}
            className='btn_menu_config'
            onClick={() => {
              selected_links.forEach(link => link.setDownDisplayOrder())
              refreshThisAndUpdateRelatedComponents()
            }}>
            <FaAngleDoubleDown />
          </Button>
        </OSTooltip>
      </Box>
    </Box>
    <hr style={{
      borderStyle: 'none',
      margin: '10px',
      color: 'grey',
      backgroundColor: 'grey',
      height: 2 }}
    />
  </Box> : <></>

  const content = <Box
    layerStyle='menuconfigpanel_grid'
  >
    {content_style}
    {content_zIndex_and_direction}

    {content_appearence}
    <hr style={{
      borderStyle: 'none',
      margin: '10px',
      color: 'grey',
      backgroundColor: 'grey',
      height: 2 }} />
    {content_label}
  </Box>

  /* Formattage de l'affichage du menu attribut de flux */
  return content
}
