// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================


import React, { FC, useRef, useState, ChangeEvent, ReactNode, useEffect, MutableRefObject, CSSProperties, JSX } from 'react'
import { ColorResult, SketchPicker } from 'react-color'
import {
  Text,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  InputRightAddon,
  InputGroup,
  Input,
  FormErrorMessage,
  FormControl,
} from '@chakra-ui/react'
import { t, TFunction } from 'i18next'
import {
  Box,
  Button,
  Checkbox,
  Collapse,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  useDisclosure,
  CheckboxProps,
  Tooltip,
  Select,
  PlacementWithLogical,
  Textarea
} from '@chakra-ui/react'
import { Class_LinkElement } from '../../Elements/Link'
import { Class_ElementStyle } from '../../Elements/Element'
import { ChevronDownIcon } from '@chakra-ui/icons'
import { FaSquare } from 'react-icons/fa'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSquareCheck, faEye, faEyeSlash, faCircleInfo } from '@fortawesome/free-solid-svg-icons'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { FCType_WrapperBoxSubSectionMenu } from '../SankeyMenuTypes'
import { Class_DataTagGroup } from '../../types/TagGroup'
import { SankeyLinkSelectionSimple, SankeyNodeSelectionSimple } from './MenuElementsSelection'
import { Class_NodeBase } from '../../Elements/NodeBase'
import { AttributeConfig, BASE_LABEL_CONFIG, ElementsType, ExtractConfigValue, getConfigValues, isConfigValueIndeterminate, ALL_ATTRIBUTES_CONFIG, updateElements, useElementAttributeConfig, VALUE_LABEL_CONFIG, getShapeAttributeKey, ShapePrefix, getLabelAttributeKey, BASE_SHAPE_CONFIG } from '../../Elements/ElementsAttributesConfig'

// Déclaration du type pour l'EyeDropper API
declare global {
  interface Window {
    EyeDropper?: {
      new(): EyeDropper
    }
  }
}
/**
 * Wrapper to create a box collapsable to reduce size of sub-section in configuration sub-menus 
 *
 * @param {*} {
 *   app_data,
 *   title,
 *   children
 * }
 * @return {*} 
 */
export const WrapperBoxSubSectionMenu: FC<FCType_WrapperBoxSubSectionMenu> = ({
  new_data,
  title,
  is_open = true,
  with_border = true,
  children
}: FCType_WrapperBoxSubSectionMenu) => {
  // Hooks controlling collapse opening, initiallised at true
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: is_open })
  return <Box layerStyle={with_border ? 'menu_sub_section' : 'menu_sub_section_without_border'}>
    <Box layerStyle='menu_sub_section_head'>
      <Button variant='menu_sub_section_collapse_button'
        size='sizeCollapseButton'
        onClick={onToggle}>
        {isOpen ? new_data.icon_library.icon_collapse_up : new_data.icon_library.icon_collapse_down}
      </Button>
      <Box as='span' layerStyle='menu_sub_section_title'
        textStyle='title_sub_section'
      >{title}</Box>
    </Box>
    <Collapse in={isOpen} animateOpacity>
      <Box
        layerStyle='menuconfigpanel_grid'
      >
        {children}
      </Box>
    </Collapse>
  </Box>
}

export const WrapperCheckBoxSubSectionMenu = ({ title, open = true, onClick, children }: {
  title: string,
  open?: boolean,
  onClick: (evt: boolean) => void,
  children: React.ReactNode
}) => {
  // Hooks controlling collapse opening, initiallised at true
  const { isOpen, onToggle } = useDisclosure({ isOpen: open })
  return <> <Box layerStyle='menu_sub_section_title'>
    <Checkbox
      variant='menuconfigpanel_part_title_1_checkbox'
      isChecked={isOpen}
      onChange={() => {
        onClick(!isOpen)
        onToggle()

      }}
    >
      {title}
    </Checkbox>

  </Box>
    <Collapse in={isOpen} animateOpacity>
      <Box
        layerStyle='menuconfigpanel_grid'
        marginLeft='1rem'
        borderLeft='lightgray 1px solid'
        paddingLeft='0.2rem'
      >
        {children}
      </Box>
    </Collapse>
  </>
}
// Version refactorisée de MenuSectionCheckbox
export const MenuSectionCheckbox = <
  CONFIG extends Record<string, AttributeConfig<unknown>>,
  K extends keyof CONFIG
>({
  elements, attributePath, attributeKey, config,
  prefix = '', refreshParentComponent, children, rightComponent
}: React.PropsWithChildren<{
  elements: ElementsType
  attributePath: string,
  attributeKey: K
  config: CONFIG
  prefix?: string
  refreshParentComponent: () => void
  children: React.ReactNode
  rightComponent?: React.ReactNode  // ✅ Nouveau paramètre optionnel
}>) => {
  const attribute_values = getConfigValues(elements, config, prefix, refreshParentComponent)
  const fullKey = (prefix ? `${prefix}_${String(attributeKey)}` : String(attributeKey))
  const fullAttributeKey = `${prefix}_${String(attributeKey)}` as keyof typeof config

  return (
    <Box layerStyle='menu_sub_section'>
      <Box
        layerStyle='menu_sub_section_head'
        display="flex"
        alignItems="center"
        justifyContent="space-between"  // ✅ Espace entre checkbox et rightComponent
        gap={2}
      >
        <InputIndicatorWrapper
          isOverloaded={isElementAttributeOverloaded(elements, fullAttributeKey, config)}
          isMultiValue={isConfigValueIndeterminate(elements, config, attributeKey, prefix)}
          t={t}
        >
          <Checkbox
            variant='menuconfigpanel_part_title_1_checkbox'
            icon={<CustomFaEyeCheckIcon />}
            isChecked={attribute_values[attributeKey] as boolean}
            onChange={(evt: React.ChangeEvent<HTMLInputElement>) => {
              attribute_values[attributeKey] = evt.target.checked as ExtractConfigValue<CONFIG[K]>
            }}
          >
            <OSTooltip label={t(`${String(attributePath)}.tooltips.${fullKey}`)}>
              {t(`${String(attributePath)}.${fullKey}`)}
            </OSTooltip>
          </Checkbox>
        </InputIndicatorWrapper>

        {/* ✅ Composant optionnel à droite */}
        {rightComponent && (
          <Box flexShrink={0}>
            {rightComponent}
          </Box>
        )}
      </Box>
      <Box layerStyle='menuconfigpanel_grid'>
        {children}
      </Box>
    </Box>
  )
}

/**
 * Wrapper for content of each sub-menus  
 *
 * @param {*} { app_data, title, children, hide = false }
 * @return {*} 
 */
export const WrapperContentConfig = ({ title, children, hide = false }: React.PropsWithChildren<
  {
    title: string; hide?: boolean
    children: JSX.Element
  }>) => {
  // If var hide is at true then return 'nothing'
  if (hide)
    return <></>

  return <Box layerStyle='box_content_config'>
    <span className='title_box'>{title}</span>
    {children}
  </Box>
}

/**
 * Menu select to delete local attribute value of nodes/links
 *
 * @param {*} { app_data, nodesOrLinks, dict_overwritted_attr }
 * @return {*} 
 */
export const MenuResetAttrLocal = (
  {
    new_data,
    dict_overwritted_attr
  }: {
    new_data: Class_ApplicationData,
    dict_overwritted_attr: { [x: string]: { overloaded: boolean, name: string } }
  }) => {
  const { t, icon_library, drawing_area } = new_data
  const { sankey } = drawing_area
  const { icon_undo } = icon_library

  // Delete all local attributes of selected elements
  const resetAll = () => new_data.drawing_area.sankey.resetAttrSelectedElements()
  // Delete local attributes 'k' of selected elements
  const resetLocal = (k: string) =>
    sankey.deleteLocalAttrSelectedElements(k as (keyof typeof ALL_ATTRIBUTES_CONFIG), drawing_area.selected_elements_list)

  return <Menu direction='rtl' placement='left' closeOnSelect={false}>
    <MenuButton as={Button} variant='menuconfigpanel_option_button'>
      {icon_undo}
      <ChevronDownIcon />
    </MenuButton>

    <MenuList>
      <MenuItem onClick={resetAll}>{t('Menu.reset_all_attr')} </MenuItem>
      <MenuDivider />
      {
        Object.entries(dict_overwritted_attr).filter(ent => ent[1].overloaded).map(ent => {
          return <MenuItem onClick={() => resetLocal(ent[0])}>{t('Menu.reset_attr')}{ent[1].name}</MenuItem>
        })
      }
    </MenuList>
  </Menu>
}

export type typeElementSelectable = {
  label: string,
  value: string,
  selected: boolean,
  disabled?: boolean
}[]


/**
 * Component to select multple element from a list passed in parameter
 *
 * @param {*} {
 *   elements,
 *   selected_elements,
 *   onClick
 * }
 * @return {*} 
 */
export const OSMultiSelect = ({ elements, onClick }: {
  t: TFunction,
  elements: typeElementSelectable,
  onClick: (entries: typeElementSelectable) => void
}) => {
  const [menuListItems, setMenuListItems] = useState<JSX.Element[]>([])
  const [displayBgOverlay, setDisplayBgOverlay] = useState(false)

  const selected_elements = elements.filter(el => el.selected)
  const textBtn = selected_elements.length > 0 ? selected_elements.map(el => el.label).join(',') : 'Aucune sélection'
  const selecAll = elements.length > 0 ? <>
    <MenuItem
      icon={(selected_elements.length == elements.length) ? <FontAwesomeIcon icon={faSquareCheck} /> : <FaSquare />}
      onClick={() => {
        if (selected_elements.length == elements.length) {
          elements.forEach(e => e.selected = false)
        } else {
          elements.forEach(e => e.selected = true)
        }
        const new_sel = selected_elements.length == elements.length ? [] : elements //select or deselect all
        onClick(new_sel)
        setMenuListItems(renderMenu())
      }}>{t('Noeud.TS')}</MenuItem>
    <MenuDivider />
  </> : <></>

  // Create a function that render list so we can choose when to go throught list (that can be long with big sankey)
  const renderMenu = () => elements.map((el, i) => {

    return <MenuItem
      key={'elements_' + i}
      isDisabled={el.disabled}
      icon={el.selected ? <FontAwesomeIcon icon={faSquareCheck} /> : <FaSquare />}
      onClick={() => {
        // Update list of selected element before letting parent decide what to do with it (via onClick)
        el.selected = !el.selected
        const new_selected_elements = elements.filter(el => el.selected)
        // Execute parent function for newly selected elements
        onClick(new_selected_elements)
        setMenuListItems(renderMenu())
      }}>
      {el.label}
    </MenuItem>
  })

  // Background overlay for when we want to close selector by clicking outside Menu (sometime the DA) we don't trigger any other event
  const backgroundOverlay = <div style={{
    display: displayBgOverlay ? 'unset' : 'none',
    position: 'fixed',
    top: '0px',
    right: '0px',
    bottom: '0px',
    left: '0px',
  }} onClick={() => setDisplayBgOverlay(false)}></div>

  return <Menu isLazy
    placement='auto'
    variant={'menu_select_elements'}
    closeOnSelect={false}
    isOpen={displayBgOverlay}
    onOpen={() => setMenuListItems(renderMenu())}>
    <MenuButton as={Button} rightIcon={<ChevronDownIcon />} variant={'text_menu_select'} onClick={() => setDisplayBgOverlay(!displayBgOverlay)}> {textBtn}</MenuButton>
    {backgroundOverlay}
    <MenuList>
      {selecAll}
      {menuListItems}
    </MenuList>
  </Menu>
}

export const BOX2COLS = ({ children }: React.PropsWithChildren<{ children: React.ReactNode }>) => {
  return (
    <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
      {children}
    </Box>
  )
}

export const BOX2COLSTITLEH4 = ({ title, children }: React.PropsWithChildren<{
  title: string
  children: React.ReactNode
}>) => {
  return (
    <BOX2COLS>
      <Box as='span' layerStyle='menuconfigpanel_part_title_3'>
        {title}
      </Box>
      {children}
    </BOX2COLS>
  )
}

export const RowSetter2Cols = ({
  attributePath, attributeKey, children
}: React.PropsWithChildren<{
  attributePath: string
  attributeKey: string
  children: React.ReactNode
}>) => {
  const label = t(`${attributePath}.${String(attributeKey)}`)
  const tooltip = t(`${attributePath}.tooltips.${String(attributeKey)}`)
  return (
    <OSTooltip label={tooltip}>
      <span>
        <BOX2COLS>
          <Box layerStyle='menuconfigpanel_option_name'>
            {label}
          </Box>
          {children}
        </BOX2COLS>
      </span>
    </OSTooltip>
  )
}

export const ElementAttrSetter2Cols = <
  CONFIG extends Record<string, AttributeConfig<unknown>>,
  K extends keyof CONFIG
>({
  attributePath, attributeKey,
  prefix = '', t, children
}: React.PropsWithChildren<{
  attributePath: string,
  attributeKey: K
  config: CONFIG
  prefix?: string

  t: TFunction; // Fonction de traduction
  showTooltipOverload?: boolean; // Optionnel - afficher le tooltip overload
  children: React.ReactNode; // Le composant enfant (Select, Input, etc.)
}>) => {
  const fullKey = (prefix ? `${prefix}_${String(attributeKey)}` : String(attributeKey)) as K
  const label = t(`${String(attributePath)}.${String(fullKey)}`)
  const tooltip = t(`${String(attributePath)}.tooltips.${String(fullKey)}`)

  return (
    <OSTooltip label={tooltip}>
      <span>
        <BOX2COLS>
          <Box layerStyle='menuconfigpanel_option_name'>
            {label}
          </Box>
          {children}
        </BOX2COLS>
      </span>
    </OSTooltip>
  )
}

// Version refactorisée d'ElementAttrSetterSelect2Cols
export const ElementAttrSetterSelect2Cols = <
  CONFIG extends Record<string, AttributeConfig<unknown>>,
  K extends keyof CONFIG
>({
  app_data,
  elements,
  attributePath,
  attributeKey,
  config,
  prefix = '',
  refreshParentComponent,
  options
}: {
  app_data: Class_ApplicationData
  elements: ElementsType
  attributePath: string
  attributeKey: K
  config: CONFIG
  prefix?: string
  refreshParentComponent: () => void
  options: Array<{
    key: string
    value: ExtractConfigValue<CONFIG[K]>
    label: string
  }>
}) => {
  const { t } = useElementAttributeConfig<CONFIG>(app_data, elements)
  const attribute_values = getConfigValues(elements, config, prefix, refreshParentComponent)

  return (
    <ElementAttrSetter2Cols
      attributePath={attributePath}
      attributeKey={attributeKey}
      config={config}
      prefix={prefix}
      t={t}>
      <Select
        value={attribute_values[attributeKey] as string}
        onChange={(evt) => {
          updateElements(
            app_data,
            elements,
            config,
            prefix,
            attributeKey,
            evt.target.value as ExtractConfigValue<CONFIG[K]>,
            refreshParentComponent
          )
        }}
      >
        {options.map(option => (
          <option key={option.key} value={option.value as string}>
            {option.label}
          </option>
        ))}
      </Select>
    </ElementAttrSetter2Cols>
  )
}


// ==================================================================================================
// COMPOSANT POUR TEXT INPUT
// ==================================================================================================

// Version refactorisée d'ElementAttrSetterTextInput2Cols
export const ElementAttrSetterTextInput2Cols = <
  CONFIG extends Record<string, AttributeConfig<unknown>>,
  K extends keyof CONFIG
>({
  app_data, elements, attributePath, attributeKey, config,
  prefix = '', refreshParentComponent, isOverloaded
}: {
  app_data: Class_ApplicationData
  elements: ElementsType
  attributePath: string
  attributeKey: K,
  config: CONFIG,
  prefix?: string,
  refreshParentComponent: () => void
  isOverloaded: boolean
}) => {
  const { menu_for_style, t } = useElementAttributeConfig<CONFIG>(app_data, elements)
  const attribute_values = getConfigValues(elements, config, prefix, refreshParentComponent)
  return (
    <ElementAttrSetter2Cols
      attributePath={attributePath}
      attributeKey={attributeKey}
      config={config}
      prefix={prefix}
      t={t}>
      <ConfigMenuTextInput
        t={t}
        default_value={attribute_values[attributeKey] as string}
        function_on_blur={(value) => {
          attribute_values[attributeKey] = (value ?? '') as ExtractConfigValue<CONFIG[K]>
        }}
        menu_for_style={menu_for_style}
        multiValue={isConfigValueIndeterminate(elements, config, attributeKey, prefix)}
        isOverloaded={isOverloaded}
      />
    </ElementAttrSetter2Cols>
  )
}

// ==================================================================================================
// COMPOSANT POUR NUMBER INPUT
// ==================================================================================================

// Version refactorisée d'ElementAttrSetterNumberInput2Cols
export const ElementAttrSetterNumberInput2Cols = <
  CONFIG extends Record<string, AttributeConfig<unknown>>,
  K extends keyof CONFIG
>({
  app_data, elements, attributePath, attributeKey, config,
  prefix, refreshParentComponent = () => null,
  minimum_value = 0, maximum_value, step = 1, stepper = true, percent = false, unit_text, isOverloaded
}: {
  app_data: Class_ApplicationData
  elements: ElementsType
  attributePath: string,
  attributeKey: K,
  config: CONFIG,
  prefix: string,
  refreshParentComponent?: () => void
  minimum_value?: number
  maximum_value?: number
  step?: number
  stepper?: boolean
  percent?: boolean,
  unit_text?: string,
  isOverloaded: boolean
}) => {

  const { menu_for_style, t } = useElementAttributeConfig<CONFIG>(app_data, elements)
  const attribute_values = getConfigValues(elements, config, prefix, refreshParentComponent)

  return (
    <ElementAttrSetter2Cols
      attributePath={attributePath}
      attributeKey={attributeKey}
      config={config}
      prefix={prefix}
      t={t}>
      <ConfigMenuNumberInput
        t={t}
        default_value={percent ? +attribute_values[attributeKey] * 100 : +attribute_values[attributeKey]}
        function_on_blur={(value) => {
          attribute_values[attributeKey] = (percent && value ? value / 100 : value) as ExtractConfigValue<CONFIG[K]>
        }}
        menu_for_style={menu_for_style}
        minimum_value={minimum_value}
        maximum_value={maximum_value}
        unit_text={percent ? '%' : unit_text}
        step={step}
        stepper={stepper}
        multiValue={isConfigValueIndeterminate(elements, config, attributeKey, prefix)}
        isOverloaded={isOverloaded}

      />
    </ElementAttrSetter2Cols>
  )
}

export const DataTagSelector = ({ data_tagg, value, onChange }: {
  data_tagg: Class_DataTagGroup;
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
}) => {
  return (
    <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
      <Box as='span' layerStyle='menuconfigpanel_part_title_3'>
        {data_tagg.name}
      </Box>
      <Select
        name={data_tagg.id}
        variant='menuconfigpanel_option_select'
        value={value}
        onChange={onChange}
      >
        {data_tagg.tags_list.map(tag => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
      </Select>
    </Box>
  )
}
// Tooltipe added to input in menu when add a local value (for nodes & links local attributes)



export const TooltipValueSurcharge = (k: string, t: TFunction) => {
  return <OSTooltip label={t('Menu.overcharge_style_value')} placement='left'>
    <FontAwesomeIcon className='tooltip_overload' style={{ color: '#6cc3d5', height: '12', width: '12', float: 'right' }} icon={faCircleInfo} />
  </OSTooltip>
}


export const OSTooltip = ({ label, delay = 500, placement = 'auto', isAlwaysOpen = false, children }: React.PropsWithChildren<{
  delay?: number,
  label: string,
  placement?: PlacementWithLogical
  isAlwaysOpen?: boolean
  children: ReactNode
}>) => {
  if (label === undefined || label === null) {
    return <>{children}</>
  }
  const element_key = label.split(' ').join('_')
  if (isAlwaysOpen) {
    return <Tooltip
      key={element_key}
      openDelay={delay}
      placement={placement}
      label={label}
      closeDelay={100}
      isOpen={true}
      hasArrow={true}
    >
      {children}
    </Tooltip>
  } else {
    return <Tooltip
      key={element_key}
      openDelay={delay}
      placement={placement}
      label={label}
      closeDelay={100}
    >
      {children}
    </Tooltip>
  }
}

export const CustomFaEyeCheckIcon = (props: CheckboxProps) => {
  const { isChecked } = props
  return isChecked
    ? <FontAwesomeIcon icon={faEye} />
    : <FontAwesomeIcon icon={faEyeSlash} />
}
/**
 * Check if given attribute is overloaded in at least one link
 * @export
 * @param {Class_LinkElement[]} links
 * @param {keyof Class_LinkAttribute} attr
 * @return {*}
 */

export const isElementAttributeOverloaded = <
  CONFIG extends Record<string, AttributeConfig<unknown>>,
  K extends keyof CONFIG
>(
  elements: ElementsType,
  attr: K,
  _config: CONFIG
) => {
  return elements.some(element => {
    //if (element instanceof Class_LinkElement) {
    //@ts-expect-error xxx
    return element.isAttributeOverloaded(attr)
    // } else if (element instanceof Class_NodeElement) {
    //   return element.isAttributeOverloaded(attr)
    // } else if (element instanceof Class_ContainerElement) {
    //   return element.isAttributeOverloaded(attr)
    // }
    // return false
  })
}

export const TooltipElementOverloaded = <
  CONFIG extends Record<string, AttributeConfig<unknown>>,
  K extends keyof CONFIG
>({
  attributeKey, config, prefix, elements, t
}: {
  attributeKey: K,
  config: CONFIG,
  prefix: string,
  elements: ElementsType
  t: TFunction
}): JSX.Element => {
  // const menu_for_style = elements.length > 0 && (elements[0] instanceof Class_ElementStyle)
  // if (menu_for_style) {
  //   return <></>
  // }
  const isOverwritted = isElementAttributeOverloaded(elements, prefix + '_' + String(attributeKey), config)
  return isOverwritted ? (
    <>{TooltipValueSurcharge('el_var_', t)}</>
  ) : <></>
}
// ==================================================================================================
// COMPOSANTS RÉUTILISABLES POUR BOUTONS AVEC INDICATEUR D'OVERLOAD
// ==================================================================================================

/**
 * Bouton unique avec indicateur d'overload intégré
 */
interface OverloadedButtonProps {
  elements: ElementsType
  config: any
  attributePath: string,
  prefix: ShapePrefix | 'name_label' | 'value_label' | 'icon'
  attributeKey: string
  variant: string
  onClick: () => void
  children: React.ReactNode
}

export const OverloadedButton = ({
  elements,
  config,
  attributePath,
  prefix,
  attributeKey,
  variant,
  onClick,
  children
}: React.PropsWithChildren<OverloadedButtonProps>) => {
  const fullAttributeKey = `${prefix}_${attributeKey}` as keyof typeof config
  const tooltipLabel = t(`${String(attributePath)}.tooltips.${String(fullAttributeKey)}`)

  return (
    <InputIndicatorWrapper
      isOverloaded={isElementAttributeOverloaded(elements, fullAttributeKey, config)}
      isMultiValue={isConfigValueIndeterminate(elements, config, attributeKey as any, prefix)}
      t={t}
    >
      <OSTooltip label={tooltipLabel}>
        <Button
          variant={variant}
          onClick={onClick}
          sx={{ padding: '4px', minWidth: 'auto', height: 'auto' }}
        >
          {children}
        </Button>
      </OSTooltip>
    </InputIndicatorWrapper>
  )
}

/**
 * Groupe de boutons générés en boucle avec indicateurs d'overload
 */
interface ButtonGroupItem<T = string> {
  value: T
  icon: React.ReactNode
  label?: string
}

interface OverloadedButtonGroupProps<T = string> {
  elements: ElementsType
  config: any
  attributePath: string,
  prefix: ShapePrefix | 'name_label' | 'value_label' | 'icon'
  attributeKey: string
  currentValue: T
  items: ButtonGroupItem<T>[]
  onChange: (value: T) => void
  getIsIndeterminate: () => boolean
  t: (key: string) => string
}

export const OverloadedButtonGroup = <T extends string>({
  elements,
  config,
  attributePath,
  prefix,
  attributeKey,
  currentValue,
  items,
  onChange,
  getIsIndeterminate,
  t
}: OverloadedButtonGroupProps<T>) => {
  const fullAttributeKey = `${prefix}_${attributeKey}` as keyof typeof config
  const isOverloaded = isElementAttributeOverloaded(elements, fullAttributeKey, config)
  const tooltipLabel = t(`${String(attributePath)}.tooltips.${String(fullAttributeKey)}`)
  return (
    <OverloadIndicatorWrapper
      isOverloaded={isOverloaded}
    >
      <OSTooltip label={tooltipLabel}>
        <Box layerStyle={`options_${items.length}cols`}>
          {items.map((item, idx) => {
            const position =
              items.length === 2 ? (idx === 0 ? 'left' : 'right') :
                items.length === 3 ? (idx === 0 ? 'left' : idx === 2 ? 'right' : 'center') :
                  items.length === 4 ? (idx === 0 ? 'left' : idx === 3 ? 'right' : 'center') :
                    items.length === 5 ? (idx === 0 ? 'left' : idx === 4 ? 'right' : 'center') :
                      ''

            // Déterminer le contenu du bouton : icône ou label
            const buttonContent = item.icon || item.label || String(item.value)

            return (
              <Button
                key={String(item.value)}
                variant={getButtonVariant(
                  position as any,
                  getIsIndeterminate(),
                  currentValue === item.value
                )}
                onClick={() => onChange(item.value)}
                sx={{
                  padding: '4px',
                  minWidth: 'auto',
                  height: 'auto',
                  ...(item.icon ? { '& svg': { width: '16px', height: '16px' } } : {})
                }}
              >
                {buttonContent}
              </Button>
            )
          })}
        </Box>
      </OSTooltip>
    </OverloadIndicatorWrapper>
  )
}

/**
 * Checkbox avec indicateur d'overload intégré
 */
/**
 * Bouton stylisé comme une checkbox avec indicateur d'overload intégré
 * Utilise les styles menuconfigpanel_option_button pour un look uniforme
 */
interface OverloadedCheckboxProps {
  elements: ElementsType
  config: any
  prefix: ShapePrefix | 'name_label' | 'value_label' | 'icon'
  attributeKey: string
  isChecked: boolean
  onChange: (checked: boolean) => void
  getIsIndeterminate: () => boolean
  tooltipLabel?: string
  children: React.ReactNode
  t: (key: string) => string
}

export const OverloadedCheckbox = ({
  elements,
  config,
  prefix,
  attributeKey,
  isChecked,
  onChange,
  getIsIndeterminate,
  tooltipLabel,
  children,
  t
}: React.PropsWithChildren<OverloadedCheckboxProps>) => {
  const fullAttributeKey = `${prefix}_${attributeKey}` as keyof typeof config
  
  return (
    <InputIndicatorWrapper
      isOverloaded={isElementAttributeOverloaded(elements, fullAttributeKey, config)}
      isMultiValue={getIsIndeterminate()}
      t={t}
    >
      <Button
        variant={isChecked ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
        onClick={() => onChange(!isChecked)}
        sx={{ padding: '4px', minWidth: 'auto', height: 'auto' }}
      >
        {tooltipLabel ? (
          <OSTooltip label={tooltipLabel}>
            {children}
          </OSTooltip>
        ) : children}
      </Button>
    </InputIndicatorWrapper>
  )
}

/**
 * Wrapper qui ajoute un indicateur visuel subtil quand un attribut est overloadé
 * Peut wrapper n'importe quel élément (boutons, inputs, etc.)
 */
export const OverloadIndicatorWrapper = ({
  isOverloaded,
  children
}: React.PropsWithChildren<{
  isOverloaded: boolean
  children: React.ReactNode
}>) => {
  if (!isOverloaded) {
    return <>{children}</>
  }

  return (
    <Box
      position='relative'
      display='inline-flex'
      sx={{
        '& > *': {
          boxShadow: '0 0 0 1.5px rgba(66, 153, 225, 0.5)', // blue.400 avec transparence
          borderRadius: '6px',
          transition: 'box-shadow 0.2s'
        },
        '&:hover > *': {
          boxShadow: '0 0 0 2px rgba(66, 153, 225, 0.8)', // blue.500 plus opaque
        },
        cursor: 'help'
      }}
    >
      {children}
    </Box>
  )
}

export const ConditionalCheckboxWithInput = <
  CONFIG extends Record<string, AttributeConfig<unknown>>,
  K extends keyof CONFIG
>({
  app_data, elements, checkboxAttributeKey, inputAttributeKey, config, prefix, refreshParentComponent,
  minimum_value = 0, stepper = true, children
}: {
  app_data: Class_ApplicationData,
  elements: ElementsType,
  checkboxAttributeKey: K,
  inputAttributeKey: K
  config: CONFIG
  prefix: string
  refreshParentComponent: () => void,
  minimum_value?: number,
  stepper?: boolean,
  children?: React.ReactNode  // ✅ Ajouter ce paramètre
}) => {
  const { t, menu_for_style } = useElementAttributeConfig<CONFIG>(app_data, elements)
  const attribute_values = getConfigValues(elements, config, prefix, refreshParentComponent)

  const fullinputAttributeKey = (prefix ? `${prefix}_${String(inputAttributeKey)}` : String(inputAttributeKey)) as keyof typeof config
  const fullCheckboxKey = (prefix ? `${prefix}_${String(checkboxAttributeKey)}` : String(checkboxAttributeKey))
  const layoutStyle = 'menuconfigpanel_row_2cols'

  return (
    <Box as='span' layerStyle={layoutStyle}>
      <OverloadedCheckbox
        elements={elements}
        config={config}
        prefix={prefix as any}
        attributeKey={String(checkboxAttributeKey)}
        isChecked={attribute_values[checkboxAttributeKey] as boolean}
        onChange={(checked) => {
          attribute_values[checkboxAttributeKey] = checked as ExtractConfigValue<CONFIG[K]>
        }}
        getIsIndeterminate={() => isConfigValueIndeterminate(elements, config, checkboxAttributeKey, prefix)}
        tooltipLabel={t(`Flux.labels.tooltips.${fullCheckboxKey}`)}
        t={t}
      >
        <Box display="flex" alignItems="center" gap={1}>
          {children ? children : t(`Flux.labels.${fullCheckboxKey}`)}
        </Box>
      </OverloadedCheckbox>

      {attribute_values[checkboxAttributeKey] && inputAttributeKey && (
        <ConfigMenuNumberInput
          t={t}
          default_value={attribute_values[inputAttributeKey] as number}
          menu_for_style={menu_for_style}
          minimum_value={minimum_value}
          stepper={stepper}
          function_on_blur={(value) => {
            attribute_values[inputAttributeKey] = value as ExtractConfigValue<CONFIG[K]>
          }}
          multiValue={isConfigValueIndeterminate(elements, config, inputAttributeKey, prefix ?? '')}
          isOverloaded={isElementAttributeOverloaded(elements, fullinputAttributeKey, config)}
        />
      )}
    </Box>
  )
}

interface TooltipElement {
  id: string
  tooltip_text?: string
}

/**
 * Composant générique pour éditer les tooltips des noeuds et liens
 */
export const TooltipEditor = ({ app_data, elements, updaterRef }: {
  app_data: Class_ApplicationData
  elements: TooltipElement[]
  updaterRef: React.MutableRefObject<(() => void) | null>
}) => {
  const { t, menu_configuration, history } = app_data

  // Editor state
  const [editor_content_tooltip, setEditorContentTooltip] = useState('')
  const [isInitialized, setIsInitialized] = useState(false)
  const [, setCount] = useState(0)
  const inputRef = useRef() as MutableRefObject<HTMLTextAreaElement>

  // Fonction pour obtenir le texte du tooltip selon le type d'élément
  const getTooltipText = (element: TooltipElement): string => {
    return element.tooltip_text || ''
  }

  // Fonction pour définir le texte du tooltip selon le type d'élémentd
  const setTooltipText = (element: TooltipElement, text: string): void => {
    element.tooltip_text = text
  }

  // Fonction pour obtenir le texte initial
  const getInitialTooltipText = (): string => {
    if (elements.length > 0) {
      return getTooltipText(elements[0])
    }
    return ''
  }

  // Fonction de mise à jour complète
  const updateEditorContent = () => {
    const initialText = getInitialTooltipText()
    setEditorContentTooltip(initialText)
    if (inputRef.current) {
      inputRef.current.value = initialText
    }
    setIsInitialized(true)
  }

  // useEffect pour l'initialisation et les changements de sélection
  useEffect(() => {
    const timer = setTimeout(() => {
      updateEditorContent()
    }, 10)

    return () => clearTimeout(timer)
  }, [elements.length, elements[0]?.id])

  // Force une mise à jour si le contenu n'est pas initialisé et qu'on a des éléments
  useEffect(() => {
    if (!isInitialized && elements.length > 0) {
      updateEditorContent()
    }
  })

  // Check if there is difference between original text and current editor content
  const originalText = elements.length > 0 ? getTooltipText(elements[0]) : ''
  const hasChanges = originalText !== editor_content_tooltip

  const applyEditor = () => {
    const dict_old_value: { [x: string]: string } = {}
    elements.forEach(element => {
      dict_old_value[element.id] = getTooltipText(element)
    })

    const _applyEditor = () => {
      elements.forEach(element => {
        setTooltipText(element, editor_content_tooltip)
      })
      // Toggle saving indicator
      menu_configuration.ref_to_save_in_cache_indicator.current(false)
    }

    const inv_applyEditor = () => {
      elements.forEach(element => {
        setTooltipText(element, dict_old_value[element.id])
      })
      updateEditorContent()
    }

    history.saveUndo(inv_applyEditor)
    history.saveRedo(_applyEditor)

    _applyEditor()
  }

  // Reset to original values
  const resetTextEditor = () => {
    updateEditorContent()
  }

  // Link with new_data components updater
  updaterRef.current = () => {
    setCount(a => a + 1)
    setIsInitialized(false)
    setTimeout(() => {
      updateEditorContent()
    }, 20)
  }

  // Handle textarea changes
  const handleTextareaChange = (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditorContentTooltip(evt.target.value)
  }

  // Render only if we have elements
  if (elements.length === 0) {
    return null
  }

  return (
    <WrapperBoxSubSectionMenu new_data={app_data} title={t('Noeud.IB')}>
      <>
        <OSTooltip label={t('Flux.tooltips.IB')}>
          <Textarea
            rows={5}
            ref={inputRef}
            value={editor_content_tooltip}
            onChange={handleTextareaChange}
          />
        </OSTooltip>
        <Box as='span' layerStyle='options_2cols'>
          <Button
            variant='menuconfigpanel_option_button_left'
            isDisabled={!hasChanges}
            backgroundColor='red.200'
            onClick={resetTextEditor}
          >
            {t('Menu.annuler')}
          </Button>
          <Button
            variant='menuconfigpanel_option_button_right'
            isDisabled={!hasChanges}
            onClick={applyEditor}
          >
            {t('Menu.submit')}
          </Button>
        </Box>
      </>
    </WrapperBoxSubSectionMenu>
  )
}

// Export de composants spécialisés pour faciliter l'utilisation
const NodeTooltipEditor: FC<{
  app_data: Class_ApplicationData
  elements: TooltipElement[]
  updaterRef: React.MutableRefObject<(() => void) | null>
}> = (props) => <TooltipEditor {...props} />

const LinkTooltipEditor: FC<{
  app_data: Class_ApplicationData
  elements: TooltipElement[]
  updaterRef: React.MutableRefObject<(() => void) | null>
}> = (props) => <TooltipEditor {...props} />

export const MenuConfigurationNodesTooltip = ({ new_data }: { new_data: Class_ApplicationData }) => {
  const selected_nodes = new_data.drawing_area.selected_nodes_list_sorted

  return (
    <>
      <SankeyNodeSelectionSimple app_data={new_data} />
      <NodeTooltipEditor
        app_data={new_data}
        elements={selected_nodes}
        updaterRef={new_data.menu_configuration.ref_to_menu_config_nodes_tooltips_updater}
      />
    </>
  )
}

export const MenuConfigurationLinksTooltip = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const selected_links = app_data.drawing_area.selected_links_list_sorted

  return (
    <>
      <SankeyLinkSelectionSimple app_data={app_data} />
      <LinkTooltipEditor
        app_data={app_data}
        elements={selected_links}
        updaterRef={app_data.menu_configuration.ref_to_menu_config_links_tooltips_updater}
      />
    </>
  )
}

/**
 * Wrapper universel qui gère à la fois :
 * - L'encadrement bleu pour les attributs overloadés
 * - L'encadrement orange pour les valeurs multiples (indéterminées)
 */
export const InputIndicatorWrapper = ({
  isOverloaded = false,
  isMultiValue = false,
  children,
  t
}: React.PropsWithChildren<{
  isOverloaded?: boolean
  isMultiValue?: boolean
  children: React.ReactNode
  t: (key: string) => string
}>) => {
  // Priorité : multiValue > overloaded
  const hasIndicator = isMultiValue || isOverloaded
  const color = isMultiValue ? 'rgba(237, 137, 54, 0.5)' : 'rgba(66, 153, 225, 0.5)' // orange ou bleu
  const colorHover = isMultiValue ? 'rgba(237, 137, 54, 0.8)' : 'rgba(66, 153, 225, 0.8)'

  if (!hasIndicator) {
    return <>{children}</>
  }

  return (
    <Box
      position='relative'
      display='inline-flex'
      width='100%'
      sx={{
        '& > *': {
          boxShadow: `0 0 0 1.5px ${color}`,
          borderRadius: '6px',
          transition: 'box-shadow 0.2s'
        },
        '&:hover > *': {
          boxShadow: `0 0 0 2px ${colorHover}`,
        },
        cursor: 'help'
      }}
    >
      {children}
    </Box>
  )
}

/**
 * Component developped for number input of the config menu
  * @param {*} {
  *   ref_to_set_value,
  *   function_on_blur,
  *   menu_for_style = false,
  *   minimum_value = Number.MIN_SAFE_INTEGER,
  *   maximum_value = Number.MAX_SAFE_INTEGER,
  *   stepper = false,
  *   step = 1,
  *   unit_text = undefined,
  * }
  * @return {*}
  */
export const ConfigMenuNumberInput = ({
  t,
  default_value,
  function_on_blur,
  menu_for_style = false,
  minimum_value = Number.MIN_SAFE_INTEGER,
  maximum_value = Number.MAX_SAFE_INTEGER,
  stepper = false,
  step = 1,
  unit_text = undefined,
  fixed_dec = 2,
  disabled = false,
  multiValue = false,
  isOverloaded = false  // ✅ Nouveau paramètre
}: FCType_ConfigMenuNumberInput) => {
  const ref_input = useRef<HTMLInputElement>(null)
  const is_modifying: MutableRefObject<NodeJS.Timeout | undefined> = useRef<NodeJS.Timeout>()
  const variant = unit_text ? 'menuconfigpanel_option_numberinput_with_right_addon' : 'menuconfigpanel_option_numberinput'

  const getFixedVal = (_: string | number | null | undefined) => {
    const number_val = Number(_)
    const new_fixed_value = (fixed_dec !== 0 && number_val !== null && number_val !== undefined && Math.trunc(number_val) != number_val) ? (number_val?.toFixed(fixed_dec)) : number_val
    return (String(new_fixed_value))
  }

  const fixed_value = getFixedVal(default_value)
  const [value, setValue] = useState<string | null | undefined>(default_value ? String(fixed_value) : '')

  useEffect(() => {
    setValue(default_value ? String(fixed_value) : '')
  }, [default_value])

  const stepperBtn = stepper ? <NumberInputStepper>
    <NumberIncrementStepper />
    <NumberDecrementStepper />
  </NumberInputStepper> : <></>

  const input_unit = unit_text ? <InputRightAddon>{unit_text}</InputRightAddon> : <></>

  return (
    <InputIndicatorWrapper isOverloaded={isOverloaded} isMultiValue={multiValue} t={t}>
      <InputGroup>
        <NumberInput
          allowMouseWheel
          isDisabled={disabled}
          variant={variant}
          min={minimum_value ?? undefined}
          max={maximum_value}
          step={step}
          value={value ?? ''}
          onChange={(value_as_string) => {
            if (!menu_for_style) {
              if (is_modifying.current) {
                clearTimeout(is_modifying.current)
              }
              is_modifying.current = setTimeout(() => {
                ref_input.current?.blur()
              }, 3000)
            }
            setValue((value_as_string !== '') ? value_as_string : null)
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              ref_input.current?.blur()
            }
          }}
        >
          <NumberInputField
            ref={ref_input}
            onBlur={() => {
              if (!menu_for_style) {
                clearTimeout(is_modifying.current)
              }
              let new_value = value === null ? value : Number(value)
              if (fixed_dec > 0 && new_value !== null) {
                new_value = +new_value?.toFixed(2)
              }
              function_on_blur(new_value)
            }}
          />
          {stepperBtn}
        </NumberInput>
        {input_unit}
      </InputGroup>
    </InputIndicatorWrapper>
  )
}

export type FCType_ConfigMenuNumberInput = {
  t: TFunction,
  default_value: number | null | undefined,
  function_on_blur: (val: number | null) => void,
  menu_for_style?: boolean,
  minimum_value?: number | null,
  maximum_value?: number,
  stepper?: boolean,
  step?: number,
  unit_text?: string,
  fixed_dec?: number,
  disabled?: boolean,
  multiValue?: boolean,
  isOverloaded?: boolean,
}

/**
 * Component developped for text input of the config menu
 * @param {*} {
 *   default_value,
 *   function_onChange,
 *   function_onBlur,
 *   menu_for_style = false
 * }
 * @return {*}
 */
export const ConfigMenuTextInput: FC<FCType_ConfigMenuTextInput> = ({

  default_value,
  function_on_blur,
  menu_for_style = false,
  disabled = false,
  multiValue = false,
  isOverloaded = false,  // ✅ Nouveau paramètre
  t
}: FCType_ConfigMenuTextInput) => {
  const ref_input = useRef<HTMLInputElement>(null)
  const is_modifying: MutableRefObject<NodeJS.Timeout | undefined> = useRef<NodeJS.Timeout>()
  const [value, setValue] = useState<string | null | undefined>(default_value)

  useEffect(() => {
    setValue(default_value)
  }, [default_value])

  return (
    <InputIndicatorWrapper isOverloaded={isOverloaded} isMultiValue={multiValue} t={t}>
      <InputGroup>
        <Input
          isDisabled={disabled}
          ref={ref_input}
          variant='menuconfigpanel_option_input'
          value={value ?? ''}
          onChange={evt => {
            const updated_value = evt.target.value
            if (!menu_for_style) {
              if (is_modifying.current) {
                clearTimeout(is_modifying.current)
              }
              is_modifying.current = setTimeout(() => {
                ref_input.current?.blur()
              }, 2000)
            }
            setValue((updated_value !== '') ? updated_value : null)
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              ref_input.current?.blur()
            }
          }}
          onBlur={() => {
            if (!menu_for_style) {
              clearTimeout(is_modifying.current)
            }
            function_on_blur(value ?? null)
          }}
        />
      </InputGroup>
    </InputIndicatorWrapper>
  )
}

export type FCType_ConfigMenuTextInput = {
  t: TFunction,
  default_value: string | null | undefined,
  function_on_blur: (_: string | null) => void,
  menu_for_style?: boolean,
  disabled?: boolean,
  multiValue?: boolean,
  isOverloaded?: boolean
}



interface EyeDropper {
  open(): Promise<{ sRGBHex: string }>
}


export const MenuColorPicker = ({
  initialColor,
  label = '',
  onColorChange,
  isDisabled = false,
  disabledTooltip = '',
  showLabel = true,
  showEyeDropper = true
}: {
  initialColor: string
  label?: string
  onColorChange: (color: string) => void
  isDisabled?: boolean
  disabledTooltip?: string
  showLabel?: boolean
  showEyeDropper?: boolean
}) => {
  const [displayColorPicker, setDisplayColorPicker] = useState(false)
  const [color, setColor] = useState(initialColor)
  const [isEyeDropperSupported, setIsEyeDropperSupported] = useState(false)

  // Vérifier si l'EyeDropper API est supportée
  useEffect(() => {
    setIsEyeDropperSupported('EyeDropper' in window)
  }, [])

  // Update swatch color when we change color from outside picker
  if (!displayColorPicker && color !== initialColor) {
    setColor(initialColor)
  }

  /**
   * Utiliser l'EyeDropper natif du navigateur
   */
  const useEyeDropper = async () => {

    if (!window.EyeDropper || isDisabled) return

    try {
      const eyeDropper = new window.EyeDropper()
      const result = await eyeDropper.open()
      const newColor = result.sRGBHex
      setColor(newColor)
      onColorChange(newColor)
    } catch (error) {
      console.error('EyeDropper error:', error)
    }
  }

  /**
   * Event when we click on the color button
   */
  const handleClick = () => {
    if (!isDisabled) {
      setDisplayColorPicker(!displayColorPicker)
    }
  }

  /**
   * Event when we close the picker
   */
  const handleClose = () => {
    setDisplayColorPicker(false)
    onColorChange(color)
  }

  /**
   * Event when we change color in picker
   */
  const handleChange = (color: ColorResult) => {
    setColor(color.hex)
  }

  // Styles for the color picker components
  const styles: { [x: string]: CSSProperties } = {
    colorPreview: {
      width: '100%',
      height: '1rem',
      borderRadius: '2px',
      background: `${color}`,
    },
    swatch: {
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      width: '100%',
      height: '1.5rem',
      padding: '5px',
      background: '#fff',
      borderRadius: '1px',
      boxShadow: '0 0 0 1px rgba(124, 104, 104, 0.1)',
      display: 'grid',
      gridTemplateColumns: '7fr 1fr',
      gridColumnGap: '0.25rem',
    },
    popover: {
      position: 'absolute',
      left: '-20%',
      top: '20%',
      zIndex: '2',
    },
    cover: {
      position: 'fixed',
      top: '0px',
      right: '0px',
      bottom: '0px',
      left: '0px',
    },
  }

  return (
    <Box>

      {showLabel && (
        <Text fontSize="sm" color={isDisabled ? 'gray.400' : 'gray.700'} minW="fit-content">
          {label}
        </Text>
      )}


      <Box style={styles.swatch} >
        <OSTooltip label={isDisabled ? disabledTooltip : 'Cliquer pour changer la couleur'}>
          <Box style={styles.colorPreview} onClick={handleClick} />
        </OSTooltip>
        {/* Bouton EyeDropper */}
        {showEyeDropper && (
          <OSTooltip label={
            !isEyeDropperSupported
              ? 'Pipette non supportée dans ce navigateur'
              : isDisabled
                ? disabledTooltip
                : 'Sélectionner une couleur à l\'écran'
          }>
            <Box
              onClick={useEyeDropper}
            >✏️</Box>
          </OSTooltip>
        )}
      </Box>


      {/* Color Picker Popover */}
      {
        displayColorPicker && (
          <Box style={styles.popover}>
            <Box style={styles.cover} onClick={handleClose} />
            <SketchPicker
              color={color}
              onChange={handleChange}
              disableAlpha={false}
            />
            {/* {this._user_preferences.color.length > 0 ? <SwatchesPicker colors={list_colors} onChange={handleChange} /> : <></>} */}
          </Box>
        )
      }

      {/* Message si EyeDropper n'est pas supporté
      {showEyeDropper && !isEyeDropperSupported && (
        <Text fontSize="xs" color="orange.500" mt={1}>
          💡 La pipette nécessite Chrome/Edge 95+ ou Firefox avec flag activé
        </Text>
      )} */}
    </Box >
  )
}

// À ajouter dans MenuCommon.tsx

interface ColorPickerWithSustainableProps<T extends Record<string, any>> {
  app_data: Class_ApplicationData
  elements: ElementsType
  config: T
  prefix: ShapePrefix | 'value_label' | 'name_label' | 'icon'
  attributePath: string
  colorAttributeKey: keyof T
  sustainableAttributeKey: keyof T
  refreshParentComponent: () => void
}

export const ColorPickerWithSustainable = <T extends Record<string, any>>({
  app_data,
  elements,
  config,
  prefix,
  attributePath,
  colorAttributeKey,
  sustainableAttributeKey,
  refreshParentComponent
}: ColorPickerWithSustainableProps<T>) => {
  const { t, icon_library } = app_data
  const { icon_locked, icon_unlocked } = icon_library

  // Récupération des valeurs via le système de config
  const values = elements.length > 0
    ? getConfigValues(elements, config, prefix, refreshParentComponent)
    : Object.fromEntries(
      Object.entries(config).map(([key, value]) => [key, value.default])
    )

  const colorValue = values[colorAttributeKey as string] as string
  const sustainableValue = values[sustainableAttributeKey as string] as boolean

  type label_type = keyof typeof BASE_LABEL_CONFIG
  type shape_type = keyof typeof BASE_SHAPE_CONFIG
  const is_label = prefix == 'name_label' || prefix == 'value_label' || prefix == 'icon'
  const tooltip_color_key = is_label
    ? getLabelAttributeKey(prefix, colorAttributeKey as label_type)
    : getShapeAttributeKey(prefix, colorAttributeKey as shape_type)

  // Calcul des overloads
  const fullColorAttributeKey = `${prefix}_${String(colorAttributeKey)}` as keyof typeof config
  const fullSustainableAttributeKey = `${prefix}_${String(sustainableAttributeKey)}` as keyof typeof config
  const isColorOverloaded = isElementAttributeOverloaded(elements, fullColorAttributeKey, config)
  const isSustainableOverloaded = isElementAttributeOverloaded(elements, fullSustainableAttributeKey, config)

  // Calcul des multi-values
  const isColorMultiValue = isConfigValueIndeterminate(elements, config, colorAttributeKey as any, prefix)
  const isSustainableMultiValue = isConfigValueIndeterminate(elements, config, sustainableAttributeKey as any, prefix)

  return (
    <Box layerStyle='option_with_activation'>
      <InputIndicatorWrapper
        isOverloaded={isColorOverloaded}
        isMultiValue={isColorMultiValue}
        t={t}
      >
        <MenuColorPicker
          initialColor={colorValue}
          onColorChange={(new_color) => {
            values[colorAttributeKey as string] = new_color
          }}
        />
      </InputIndicatorWrapper>

      <OSTooltip label={t(`${attributePath}.tooltips.${tooltip_color_key}`)}>
        <InputIndicatorWrapper
          isOverloaded={isSustainableOverloaded}
          isMultiValue={isSustainableMultiValue}
          t={t}
        >
          <Button
            variant={sustainableValue ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
            onClick={() => {
              values[sustainableAttributeKey as string] = !sustainableValue
            }}
            sx={{
              padding: '0px',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {sustainableValue ? icon_locked : icon_unlocked}
          </Button>
        </InputIndicatorWrapper>
      </OSTooltip>
    </Box>
  )
}
/**
 * Retourne le variant approprié pour un bouton selon son état
 */
export const getButtonVariant = (
  position: 'left' | 'center' | 'right' | '',
  isIndeterminate: boolean,
  isActive: boolean
): string => {
  const suffix = position ? `_${position}` : ''

  if (isIndeterminate) {
    return `menuconfigpanel_option_button_indeterminate${suffix}`
  }

  if (isActive) {
    return `menuconfigpanel_option_button_activated${suffix}`
  }

  return `menuconfigpanel_option_button${suffix}`
}

/**
 * Helper pour les checkboxes - retourne les props communes
 * Similaire à getButtonVariant mais pour les Checkbox
 * 
 * @param isIndeterminate - Si la checkbox a des valeurs multiples
 * @param variant - Variant Chakra UI à utiliser (par défaut: 'menuconfigpanel_option_checkbox')
 * @returns Objet avec variant, iconColor et isIndeterminate
 * 
 * @example
 * <Checkbox
 *   {...getCheckboxProps(isShapeValueIndeterminate(elements, prefix, 'color_visible'))}
 *   isChecked={shapeValues.color_visible}
 *   onChange={(evt) => { shapeValues.color_visible = evt.target.checked }}
 * >
 *   Fond visible
 * </Checkbox>
 */
export const getCheckboxProps = (
  isIndeterminate: boolean,
  variant: string = 'menuconfigpanel_option_checkbox'
) => ({
  variant,
  iconColor: isIndeterminate ? '#78C2AD' : 'white',
  isIndeterminate
})

