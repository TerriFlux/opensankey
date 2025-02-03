import {
  Box,
  Button,
  Checkbox,
  Input,
  Select,
} from '@chakra-ui/react'
import { t } from 'i18next'
import React, { FunctionComponent, MutableRefObject, useRef } from 'react'
import { FaAlignLeft, FaAlignCenter, FaAlignRight, FaBold, FaItalic } from 'react-icons/fa'
import { ClassTemplate_LinkElement } from '../../Elements/Link'
import { Class_LinkStyle } from '../../Elements/LinkAttributes'
import { CustomFaEyeCheckIcon, OSTooltip, TooltipValueSurcharge, font_families } from '../../types/Utils'
import { ConfigMenuNumberInput } from './SankeyMenuConfiguration'
import { svg_label_bottom, svg_label_center, svg_label_top, svg_label_upper } from './SankeyMenuConfigurationNodesAttributes'
import { FCType_SankeyMenuLabelComponent, FCType_SankeyMenuValueLabelComponent, possibleDecoratorName } from './types/SankeyMenuComponentsType'
import { Type_GenericLinkElement, Type_GenericNodeElement } from '../../types/Types'
import { ClassTemplate_NodeElement } from '../../Elements/Node'
import { Class_NodeStyle, default_node_value_label_bold, default_node_value_label_color, default_node_value_label_custom_digit, default_node_value_label_font_family, default_node_value_label_font_size, default_node_value_label_horiz, default_node_value_label_horiz_shift, default_node_value_label_italic, default_node_value_label_nb_digit, default_node_value_label_unit, default_node_value_label_unit_factor, default_node_value_label_unit_visible, default_node_value_label_uppercase, default_node_value_label_vert, default_node_value_label_vert_shift } from '../../Elements/NodeAttributes'


function isElementAttributeOverloaded(
  elements: Type_GenericLinkElement[] | Type_GenericNodeElement[],
  attr: possibleDecoratorName) {
  let overloaded = false
  elements.forEach(el => overloaded = (overloaded || el.isAttributeOverloaded(attr)))
  return overloaded
}

function getValueWithDecoratorRetriever<TModel, TKey extends keyof TModel>(
  model: TModel,
  key: TKey
) {
  return model[key];
}

function setValueWithDecoratorRetriever<TModel, TKey extends keyof TModel>(
  model: TModel,
  key: TKey,
  value: TModel[TKey]
) {
  model[key] = value;
}

export const SankeyMenuLabelComponent: FunctionComponent<FCType_SankeyMenuLabelComponent> = ({
  new_data,
  elements,
  selectedElements,
  refreshParentComponent,
  dict_decorator_name
}) => {

  const menu_for_style = elements.length > 0 && (elements[0] instanceof Class_NodeStyle || elements[0] instanceof Class_LinkStyle)

  const check_indeterminate = (curr: Type_GenericLinkElement | Type_GenericNodeElement) => {
    const ref_element = selectedElements[0]
    if (curr instanceof ClassTemplate_LinkElement && ref_element instanceof ClassTemplate_LinkElement) {
      return (ref_element.isEqual(curr))
    } else if (curr instanceof ClassTemplate_NodeElement && ref_element instanceof ClassTemplate_NodeElement) {
      return (ref_element.isEqual(curr))
    } else {
      return false
    }
  }
  const is_indeterminate = !selectedElements.every(check_indeterminate)

  let get_label_horiz = default_node_value_label_horiz
  let get_label_vert = default_node_value_label_vert
  let get_label_font_size = default_node_value_label_font_size
  let get_label_color = default_node_value_label_color
  let get_label_bold = default_node_value_label_bold
  let get_label_italic = default_node_value_label_italic
  let get_label_uppercase = default_node_value_label_uppercase
  let get_label_font_family = default_node_value_label_font_family

  // If elements selected set displayed value with first selected element
  if (elements.length > 0) {
    const element_ref = elements[0]
    // Since element_ref can be LinkAttributes | Type_GenericLinkElement | Type_GenericNodeElement | Class_NodeStyle
    // we use a function to use correct decorator 'getter' to get attribute of either name label or value label depending on what we used in dict_decorator_name
    get_label_horiz = (getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_horiz']) ?? default_node_value_label_horiz)
    get_label_vert = (getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_vert']) ?? default_node_value_label_vert)
    get_label_font_size = (getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_font_size']) ?? default_node_value_label_font_size)
    get_label_color = (getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_color']) ?? default_node_value_label_color)
    get_label_font_family = (getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_font_family']) ?? default_node_value_label_font_family)
    get_label_bold = (getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_bold'])) ?? default_node_value_label_bold
    get_label_italic = (getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_italic'])) ?? default_node_value_label_italic
    get_label_uppercase = (getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_uppercase'])) ?? default_node_value_label_uppercase
  }

  // Link to ConfigMenuNumberInput state variable
  const number_of_input = 3
  const ref_set_number_inputs: MutableRefObject<(_: string | null | undefined) => void>[] = []
  for (let i = 0; i < number_of_input; i++)
    ref_set_number_inputs.push(useRef((_: string | null | undefined) => null))
  ref_set_number_inputs[0].current(String(get_label_font_size))

  return <Box
    layerStyle='menuconfigpanel_grid'
  >
    <Box
      layerStyle='menuconfigpanel_grid'
    >
      <Box as='span' layerStyle='menuconfigpanel_part_title_2' >
        {t('Menu.edition')}
      </Box>

      {/* Couleur des Labels  */}
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name'>
          {t('Flux.apparence.couleur')}
          {
            (!menu_for_style) &&
              isElementAttributeOverloaded(selectedElements, 'value_label_color') ?
              <>{TooltipValueSurcharge('link_var_', t)}</> :
              <></>
          }
        </Box>
        <Input
          variant='menuconfigpanel_option_input_color'
          type='color'
          value={get_label_color}
          onChange={evt => {
            elements.forEach(element => setValueWithDecoratorRetriever(element, dict_decorator_name['label_color'], evt.target.value))
            refreshParentComponent()
          }}
        />
      </Box>

      {/* Police des labels de flux  */}
      <Box as='span' layerStyle='menuconfigpanel_part_title_3' >
        Police
      </Box>
      {/* Police et taille du texte de label */}
      <Box layerStyle='options_3cols' >
        <Box layerStyle='options_3cols' >
          {/* Gras */}
          <Button
            variant={
              get_label_bold ?
                'menuconfigpanel_option_button_activated_left' :
                'menuconfigpanel_option_button_left'
            }
            paddingStart='0'
            paddingEnd='0'
            minWidth='0'
            onClick={() => {
              elements.forEach(element => setValueWithDecoratorRetriever(element, dict_decorator_name['label_bold'], !get_label_bold))
              refreshParentComponent()
            }}
          >
            <FaBold />
          </Button>

          {/* en majuscule */}
          <Button
            variant={
              get_label_uppercase ?
                'menuconfigpanel_option_button_activated_center' :
                'menuconfigpanel_option_button_center'
            }
            paddingStart='0'
            paddingEnd='0'
            minWidth='0'
            onClick={() => {
              elements.forEach(element => setValueWithDecoratorRetriever(element, dict_decorator_name['label_uppercase'], !get_label_uppercase))
              refreshParentComponent()
            }}
          >
            {svg_label_upper}
          </Button>

          {/* En italique */}
          <Button
            variant={
              get_label_italic ?
                'menuconfigpanel_option_button_activated_right' :
                'menuconfigpanel_option_button_right'
            }
            paddingStart='0'
            paddingEnd='0'
            minWidth='0'
            onClick={() => {
              elements.forEach(element => setValueWithDecoratorRetriever(element, dict_decorator_name['label_italic'], !get_label_italic))
              refreshParentComponent()
            }}
          >
            <FaItalic />
          </Button>
        </Box>
        <Select
          variant='menuconfigpanel_option_select'
          value={get_label_font_family}
          onChange={
            (evt: React.ChangeEvent<HTMLSelectElement>) => {
              elements.forEach(element => setValueWithDecoratorRetriever(element, dict_decorator_name['label_font_family'], evt.target.value))
              refreshParentComponent()
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
          ref_to_set_value={ref_set_number_inputs[0]}
          default_value={get_label_font_size}
          menu_for_style={menu_for_style}
          minimum_value={11}
          stepper={true}
          unit_text='pixels'
          function_on_blur={(value) => {
            elements.forEach(element =>
              setValueWithDecoratorRetriever(element, dict_decorator_name['label_font_size'], value ?? undefined))
            refreshParentComponent()
          }}
        />
      </Box>
      <Box as='span' layerStyle='menuconfigpanel_part_title_2' >
        Position
      </Box>

      {/* Positionnement lateral des label */}
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name'>
          {t('Flux.label.pos')}
          {
            (!menu_for_style) &&
              isElementAttributeOverloaded(selectedElements, 'value_label_horiz') ?
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
                  (!is_indeterminate && (get_label_horiz === 'left')) ?
                    'menuconfigpanel_option_button_activated_left' :
                    'menuconfigpanel_option_button_left'
                }
                onClick={
                  () => {
                    elements.forEach(element => {
                      const orth_pos = getValueWithDecoratorRetriever(element, dict_decorator_name['label_vert'])
                      setValueWithDecoratorRetriever(element, dict_decorator_name['label_horiz'], 'left')
                      setValueWithDecoratorRetriever(element, dict_decorator_name['label_vert'], (orth_pos == 'dragged') ? 'middle' : orth_pos)
                    })
                    refreshParentComponent()
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
                  (!is_indeterminate && (get_label_horiz === 'middle')) ?
                    'menuconfigpanel_option_button_activated_center' :
                    'menuconfigpanel_option_button_center'
                }
                onClick={
                  () => {
                    elements.forEach(element => {
                      const orth_pos = getValueWithDecoratorRetriever(element, dict_decorator_name['label_vert'])
                      setValueWithDecoratorRetriever(element, dict_decorator_name['label_horiz'], 'middle')
                      setValueWithDecoratorRetriever(element, dict_decorator_name['label_vert'], (orth_pos == 'dragged') ? 'middle' : orth_pos)
                    })
                    refreshParentComponent()
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
                  (!is_indeterminate && (get_label_horiz === 'right')) ?
                    'menuconfigpanel_option_button_activated_right' :
                    'menuconfigpanel_option_button_right'}
                onClick={
                  () => {
                    elements.forEach(element => {
                      const orth_pos = getValueWithDecoratorRetriever(element, dict_decorator_name['label_vert'])
                      setValueWithDecoratorRetriever(element, dict_decorator_name['label_horiz'], 'right')
                      setValueWithDecoratorRetriever(element, dict_decorator_name['label_vert'], (orth_pos == 'dragged') ? 'middle' : orth_pos)
                    })
                    refreshParentComponent()
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
                    !is_indeterminate &&
                    (get_label_vert === 'bottom')
                  ) ?
                    'menuconfigpanel_option_button_activated_left' :
                    'menuconfigpanel_option_button_left'}
                onClick={() => {
                  elements.forEach(element => {
                    const lab_pos = getValueWithDecoratorRetriever(element, dict_decorator_name['label_horiz'])
                    getValueWithDecoratorRetriever(element, dict_decorator_name['label_horiz'])
                    setValueWithDecoratorRetriever(element, dict_decorator_name['label_horiz'], (lab_pos == 'dragged') ? 'middle' : lab_pos)
                    setValueWithDecoratorRetriever(element, dict_decorator_name['label_vert'], 'bottom')
                  })
                  refreshParentComponent()
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

                    !is_indeterminate &&
                    (get_label_vert === 'middle')
                  ) ?
                    'menuconfigpanel_option_button_activated_center' :
                    'menuconfigpanel_option_button_center'}
                onClick={() => {
                  elements.forEach(element => {
                    const lab_pos = getValueWithDecoratorRetriever(element, dict_decorator_name['label_horiz'])
                    setValueWithDecoratorRetriever(element, dict_decorator_name['label_horiz'], (lab_pos == 'dragged') ? 'middle' : lab_pos)
                    setValueWithDecoratorRetriever(element, dict_decorator_name['label_vert'], 'middle')
                  })
                  refreshParentComponent()
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
                    !is_indeterminate &&
                    (get_label_vert === 'top')
                  ) ?
                    'menuconfigpanel_option_button_activated_right' :
                    'menuconfigpanel_option_button_right'}
                onClick={
                  () => {
                    elements.forEach(element => {
                      const lab_pos = getValueWithDecoratorRetriever(element, dict_decorator_name['label_horiz'])
                      setValueWithDecoratorRetriever(element, dict_decorator_name['label_horiz'], (lab_pos == 'dragged') ? 'middle' : lab_pos)
                      setValueWithDecoratorRetriever(element, dict_decorator_name['label_vert'], 'top')
                    })
                    refreshParentComponent()
                  }}>
                {svg_label_top}
              </Button>
            </OSTooltip>
          </Box>
        </Box>
      </Box>


    </Box>

  </Box>
}

export const SankeyMenuValueLabelComponent: FunctionComponent<FCType_SankeyMenuValueLabelComponent> = ({
  new_data,
  elements,
  selectedElements,
  refreshParentComponent,
  dict_decorator_name
}) => {

  const menu_for_style = elements.length > 0 && (elements[0] instanceof Class_NodeStyle || elements[0] instanceof Class_LinkStyle)

  const check_indeterminate = (curr: Type_GenericLinkElement | Type_GenericNodeElement) => {
    const ref_element = selectedElements[0]
    if (curr instanceof ClassTemplate_LinkElement && ref_element instanceof ClassTemplate_LinkElement) {
      return (ref_element.isEqual(curr))
    } else if (curr instanceof ClassTemplate_NodeElement && ref_element instanceof ClassTemplate_NodeElement) {
      return (ref_element.isEqual(curr))
    } else {
      return false
    }
  }
  const is_indeterminate = !selectedElements.every(check_indeterminate)

  let get_label_unit_visible = default_node_value_label_unit_visible
  let get_label_unit = default_node_value_label_unit
  let get_label_unit_factor = default_node_value_label_unit_factor
  let get_label_custom_digit = default_node_value_label_custom_digit
  let get_label_nb_digit = default_node_value_label_nb_digit

  // If elements selected set displayed value with first selected element
  if (elements.length > 0) {
    const element_ref = elements[0]
    // Since element_ref can be LinkAttributes | Type_GenericLinkElement | Type_GenericNodeElement | Class_NodeStyle
    // we use a function to use correct decorator 'getter' to get attribute of either name label or value label depending on what we used in dict_decorator_name
    get_label_unit_visible = (getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_unit_visible']) ?? default_node_value_label_unit_visible)
    get_label_unit = (getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_unit']) ?? default_node_value_label_unit)
    get_label_unit_factor = (getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_unit_factor']) ?? default_node_value_label_unit_factor)
    get_label_custom_digit = (getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_custom_digit']) ?? default_node_value_label_custom_digit)
    get_label_nb_digit = (getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_nb_digit']) ?? default_node_value_label_nb_digit)
  }

  // Link to ConfigMenuNumberInput state variable
  const number_of_input = 2
  const ref_set_number_inputs: MutableRefObject<(_: string | null | undefined) => void>[] = []
  for (let i = 0; i < number_of_input; i++)
    ref_set_number_inputs.push(useRef((_: string | null | undefined) => null))
  ref_set_number_inputs[0].current(String(get_label_nb_digit))
  ref_set_number_inputs[1].current(String(get_label_unit_factor))



  return <Box
    layerStyle='menuconfigpanel_grid'
  >
    <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
      {/* Choix d'affichage du nombre de chiffre après la virgule  */}
      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isIndeterminate={is_indeterminate}
        isChecked={get_label_custom_digit}
        onChange={(evt) => {
          elements.forEach(element => {
            setValueWithDecoratorRetriever(element, dict_decorator_name['label_custom_digit'], evt.target.checked)

          })
          refreshParentComponent()
        }}>
        <OSTooltip label={t('Flux.label.tooltips.custom_digit')}>
          {t('Flux.label.custom_digit') + ' '}
        </OSTooltip>
        {
          (!menu_for_style) &&
            isElementAttributeOverloaded(selectedElements, 'value_label_custom_digit') ?
            TooltipValueSurcharge('link_var_', t) :
            <></>
        }
      </Checkbox>
      {get_label_custom_digit ?
        /* Choose number of custom digit */
        <OSTooltip label={t('Flux.label.tooltips.NbDigit')}>
          <ConfigMenuNumberInput
            ref_to_set_value={ref_set_number_inputs[0]}
            default_value={get_label_nb_digit}
            menu_for_style={menu_for_style}
            minimum_value={0}
            stepper={true}
            function_on_blur={(value) => {
              elements.forEach(element =>
                setValueWithDecoratorRetriever(element, dict_decorator_name['label_nb_digit'], value ?? undefined))
              refreshParentComponent()
            }}
          />
        </OSTooltip>
        : <></>
      }
    </Box>

    {/* Ajout une unité au label de flux */}
    <Checkbox
      variant='menuconfigpanel_option_checkbox'
      icon={<CustomFaEyeCheckIcon />}
      isChecked={get_label_unit_visible}
      onChange={(evt) => {
        elements.forEach(element => setValueWithDecoratorRetriever(element, dict_decorator_name['label_unit_visible'], evt.target.checked))
        refreshParentComponent()
      }}>
      <OSTooltip label={t('Flux.label.tooltips.l_u_v')}>
        {t('Flux.label.l_u_v') + ' '}
      </OSTooltip>
      {
        (!menu_for_style) &&
          isElementAttributeOverloaded(selectedElements, 'value_label_unit_visible') ?
          TooltipValueSurcharge('link_var_', t) :
          <></>
      }
    </Checkbox>

    {/* Modifie l'unité du label de flux */}
    {
      get_label_unit_visible ?
        <>
          <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
            <Box layerStyle='menuconfigpanel_option_name'>
              {t('Flux.label.l_u')}
              {
                (!menu_for_style) &&
                  isElementAttributeOverloaded(selectedElements, 'value_label_unit') ?
                  <>{TooltipValueSurcharge('link_var_', t)}</> :
                  <></>
              }
            </Box>
            <OSTooltip label={t('Flux.label.tooltips.l_u')}>
              <Input
                variant='menuconfigpanel_option_input'
                value={get_label_unit}
                onChange={evt => {
                  elements.forEach(element => setValueWithDecoratorRetriever(element, dict_decorator_name['label_unit'], evt.target.value))
                  refreshParentComponent()
                }}
              />
            </OSTooltip>
          </Box>
          {/* Change unit factor*/}
          <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
            <Box layerStyle='menuconfigpanel_option_name'>
              {t('Flux.label.unit_factor')}
              {
                (
                  (!menu_for_style) &&
                  isElementAttributeOverloaded(selectedElements, 'value_label_unit_factor')
                ) ?
                  <>{TooltipValueSurcharge('link_var_', t)}</> :
                  <></>
              }
            </Box>
            <OSTooltip label={t('Flux.label.tooltips.unit_factor')}>
              <ConfigMenuNumberInput
                ref_to_set_value={ref_set_number_inputs[1]}
                default_value={get_label_unit_factor}
                function_on_blur={(value) => {
                  elements.forEach(element =>
                    setValueWithDecoratorRetriever(element, dict_decorator_name['label_unit_factor'], (value ? value : undefined)))
                  refreshParentComponent()
                }}
                menu_for_style={menu_for_style}
                minimum_value={1}
                maximum_value={get_label_unit_factor}
                step={1}
                stepper={true}
              />
            </OSTooltip>
          </Box>
        </> :
        <></>
    }

    <SankeyMenuLabelComponent
      new_data={new_data}
      elements={elements}
      selectedElements={selectedElements}
      refreshParentComponent={refreshParentComponent}
      dict_decorator_name={dict_decorator_name} />
  </Box>
}