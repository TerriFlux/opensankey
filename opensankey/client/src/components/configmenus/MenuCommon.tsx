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
import React, { FC, useState, useMemo, ChangeEvent,ReactNode } from 'react'
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
} from '@chakra-ui/react'
import { Class_LinkElement } from '../../Elements/Link'
import { Class_LinkAttribute } from '../../Elements/LinkAttributes'
import { Class_LinkStyle } from '../../Elements/ElementStyle'
import {
  Class_NodeAttribute
} from '../../Elements/NodeAttributes'
import { Class_NodeStyle } from '../../Elements/ElementStyle'
import { ChevronDownIcon } from '@chakra-ui/icons'
import { FaSquare } from 'react-icons/fa'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSquareCheck, faEye, faEyeSlash, faCircleInfo } from '@fortawesome/free-solid-svg-icons'
import { Class_NodeElement } from '../../Elements/Node'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { FCType_WrapperBoxSubSectionMenu } from '../SankeyMenuTypes'
import { Class_DataTagGroup } from '../../types/TagGroup'
import { ConfigMenuNumberInput, ConfigMenuTextInput } from './SankeyMenuConfiguration'
import { default_style_id } from '../../types/Utils'
import { LINKS_ATTRIBUTES_CONFIG } from '../../Elements/LinkAttributesConfig'
import { MenuColorPicker } from './MenuColorPicker'
import { NODES_ATTRIBUTES_CONFIG } from '../../Elements/NodeAttributesConfig'


// ✅ Union de tous vos éléments
export type ElementsType = Class_LinkStyle | Class_LinkElement | Class_NodeElement | Class_NodeStyle

// ✅ Toutes les clés possibles
export type ValueKey = keyof Class_NodeAttribute & keyof Class_LinkAttribute

// ✅ Type conditionnel pour obtenir la bonne valeur selon la clé
export type ValueType<K extends ValueKey> =
  K extends keyof Class_LinkAttribute
  ? Class_LinkAttribute[K]
  : K extends keyof Class_NodeAttribute
  ? Class_NodeAttribute[K]
  : never

// ✅ Type de valeur qu'un élément peut avoir
export type ValueElementsType =
  | Class_LinkAttribute[keyof Class_LinkAttribute]
  | Class_NodeAttribute[keyof Class_NodeAttribute]
  | undefined

// Hook pour extraire la logique commune des composants ElementAttr*
export const useElementAttributeConfig = (app_data: Class_ApplicationData, elements: ElementsType[]) => {
  return useMemo(() => {
    const { drawing_area, menu_configuration } = app_data
    const { sankey } = drawing_area
    const { ref_selected_style_node, ref_selected_style_link } = menu_configuration
    const { link_styles_dict, node_styles_dict } = sankey

    const menu_for_style = elements.length > 0 && (elements[0] instanceof Class_NodeStyle || elements[0] instanceof Class_LinkStyle)
    const nodeStyle = elements.length > 0 && (elements[0] instanceof Class_NodeStyle)
    const nodeRelatedElement = elements.length > 0 && (elements[0] instanceof Class_NodeStyle || elements[0] instanceof Class_NodeElement)

    const correct_dict_style_to_use = (nodeStyle || nodeRelatedElement) ? node_styles_dict : link_styles_dict
    const correct_ref_style_to_use = nodeStyle ? ref_selected_style_node : ref_selected_style_link

    const disable_attr_props = menu_for_style ?
      correct_dict_style_to_use[correct_ref_style_to_use.current].customisable_attribute :
      correct_dict_style_to_use[default_style_id].customisable_attribute

    return {
      menu_for_style,
      disable_attr_props,
      t: app_data.t
    }
  }, [app_data, elements])
}

// Hook pour obtenir la valeur d'un attribut et vérifier s'il est indéterminé
export const useAttributeValue = (elements: ElementsType[], attributeKey: ValueKey) => {
  return useMemo(() => {
    const attribute_value = elements[0]
      ? Reflect.get(elements[0], attributeKey)
      : LINKS_ATTRIBUTES_CONFIG[attributeKey as keyof typeof LINKS_ATTRIBUTES_CONFIG]?.default

    const is_attribute_indetermined = attribute_value != undefined && !elements.every(el => {
      const valEl = Reflect.get(el, attributeKey)
      if (valEl == undefined) return true
      return valEl === attribute_value
    })

    return { attribute_value, is_attribute_indetermined }
  }, [elements, attributeKey])
}

/**
 * Upate attribute value via it's decorator & save it's possible undoing in data history
 *
 * @param {Class_ApplicationData} data
 * @param {elementsType[]} elements
 * @param {(labelValueAttribute | labelAttributeType)} _prefix
 * @param {keyof labelValueAttribute} k
 * @param {valueElementsType} val
 * @param {() => void} refreshParentComponent
 */
export const updateElements = (
  data: Class_ApplicationData,
  elements: ElementsType[],
  k: ValueKey,
  val: ValueElementsType,
  refreshParentComponent: () => void
) => {
  // Create a dict of old val for each elements 
  const dict_old_val: { [x: string]: ValueElementsType } = {}
  elements.forEach(element => dict_old_val[element.id] = Reflect.get(element, k))

  // Original function
  const _updateElements = () => {
    elements.forEach(element => { Reflect.set(element, k, val) })
    refreshParentComponent()
  }

  // Undo function
  const inv_updateElements = () => {
    elements.forEach(element => Reflect.set(element, k, dict_old_val[element.id]))
    refreshParentComponent()
  }

  data.history.saveUndo(inv_updateElements)//save undo
  data.history.saveRedo(_updateElements)//save original func for a redo

  _updateElements() // execute function
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
  collapse = true,
  children
}) => {
  // Hooks controlling collapse opening, initiallised at true
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: collapse })
  return <Box layerStyle='menu_sub_section'>
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
export const WrapperCheckBoxSubSectionMenu = ({title,open = true,onClick,children}:{
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

/**
 * Wrapper for content of each sub-menus  
 *
 * @param {*} { app_data, title, children, hide = false }
 * @return {*} 
 */
export const WrapperContentConfig = ({ title, children, hide = false }  :React.PropsWithChildren<
  { title: string; hide?: boolean
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
    nodesOrLinks,
    dict_overwritted_attr
  }: {
    new_data: Class_ApplicationData, nodesOrLinks: 'nodes' | 'links',
    dict_overwritted_attr: { [x: string]: { overloaded: boolean, name: string } }
  }) => {
  const { t, icon_library,drawing_area } = new_data
  const { sankey } = drawing_area
  const { icon_undo } = icon_library

  // Delete all local attributes of selected elements
  const resetAll = () => nodesOrLinks == 'nodes' ? new_data.drawing_area.sankey.resetAttrSelectedNodes() : new_data.drawing_area.sankey.resetAttrSelectedLinks()
  // Delete local attributes 'k' of selected elements
  const resetLocal = (k: string) => nodesOrLinks == 'nodes' ? 
    sankey.deleteLocalAttrSelectedNodes(k as (keyof typeof  NODES_ATTRIBUTES_CONFIG),drawing_area.selected_nodes_list) : 
    sankey.deleteLocalAttrSelectedLinks(k as (keyof typeof LINKS_ATTRIBUTES_CONFIG),drawing_area.selected_links_list)

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
        const new_sel = selected_elements.length == elements.length ? [] : elements //select or deselect all
        onClick(new_sel)
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
  );
};

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
  const tooltip = t(`${attributePath}.tooltips.${String(attributeKey)}`);
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

export const ElementAttrSetter2Cols = ({
  elements, attributePath, attributeKey, t, showTooltipOverload = true, children
}: React.PropsWithChildren<{
  elements: (Class_LinkElement | Class_NodeElement | Class_LinkStyle | Class_NodeStyle)[]; // Éléments pour vérifier l'overload
  attributePath: string,
  attributeKey: keyof (Class_LinkAttribute | Class_NodeAttribute); // Clé de l'attribut pour les traductions et overload
  t: TFunction; // Fonction de traduction
  showTooltipOverload?: boolean; // Optionnel - afficher le tooltip overload
  children: React.ReactNode; // Le composant enfant (Select, Input, etc.)
}>) => {

  const label = t(`${String(attributePath)}.${String(attributeKey)}`);
  const tooltip = t(`${String(attributePath)}.tooltips.${String(attributeKey)}`);

  return (
    <OSTooltip label={tooltip}>
      <span>
        <BOX2COLS>
          <Box layerStyle='menuconfigpanel_option_name'>
            {label}
            {showTooltipOverload && (
              <TooltipElementOverloaded
                k={attributeKey}
                elements={elements as (Class_LinkElement | Class_NodeElement)[]}
                t={t} />
            )}
          </Box>
          {children}
        </BOX2COLS>
      </span>
    </OSTooltip>
  )
}

// Version refactorisée d'ElementAttrSetterSelect2Cols
export const ElementAttrSetterSelect2Cols = ({ app_data, elements, attributePath, attributeKey, refreshParentComponent, options }: {
  app_data: Class_ApplicationData
  elements: ElementsType[]
  attributePath: string,
  attributeKey: ValueKey
  refreshParentComponent: () => void
  options: Array<{ key: string; value: string; label: string }>
}) => {

  const { disable_attr_props, t } = useElementAttributeConfig(app_data, elements)
  const { attribute_value } = useAttributeValue(elements, attributeKey)

  return (
    <ElementAttrSetter2Cols
      attributePath={attributePath}
      attributeKey={attributeKey}
      t={t} 
      elements={elements}>
      <Select
        isDisabled={!disable_attr_props[attributeKey as keyof typeof disable_attr_props]}
        value={attribute_value as string}
        onChange={(evt) => {
          updateElements(app_data, elements, attributeKey, evt.target.value, refreshParentComponent)
        }}
      >
        {options.map(option => (
          <option key={option.key} value={option.value}>
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
export const ElementAttrSetterTextInput2Cols = ({ app_data, elements, attributePath, attributeKey, refreshParentComponent }:{
  app_data: Class_ApplicationData
  elements: ElementsType[]
  attributePath: string
  attributeKey: ValueKey
  refreshParentComponent: () => void
}) => {
  const { menu_for_style, disable_attr_props, t } = useElementAttributeConfig(app_data, elements)
  const { attribute_value, is_attribute_indetermined } = useAttributeValue(elements, attributeKey)
  return (
    <ElementAttrSetter2Cols
      attributePath={attributePath}
      attributeKey={attributeKey} t={t} elements={elements}>
      <ConfigMenuTextInput
        disabled={!disable_attr_props[attributeKey as keyof typeof disable_attr_props]}
        default_value={attribute_value as string}
        function_on_blur={(value) => {
          updateElements(app_data, elements, attributeKey, value || undefined, refreshParentComponent)
        }}
        menu_for_style={menu_for_style}
        multiValue={is_attribute_indetermined}
      />
    </ElementAttrSetter2Cols>
  )
}

// ==================================================================================================
// COMPOSANT POUR NUMBER INPUT
// ==================================================================================================

// Version refactorisée d'ElementAttrSetterNumberInput2Cols
export const ElementAttrSetterNumberInput2Cols = ({
  app_data, elements, attributePath, attributeKey, refreshParentComponent = () => null,
  minimum_value = 0, maximum_value, step = 1, stepper = true, percent = false, unit_text
}: {
  app_data: Class_ApplicationData
  elements: ElementsType[]
  attributePath: string,
  attributeKey: ValueKey
  refreshParentComponent?: () => void
  minimum_value?: number
  maximum_value?: number
  step?: number
  stepper?: boolean
  percent?: boolean,
  unit_text?: string
}) => {

  const { menu_for_style, disable_attr_props, t } = useElementAttributeConfig(app_data, elements)
  const { attribute_value, is_attribute_indetermined } = useAttributeValue(elements, attributeKey)

  const geometry_attributes = ['position_dx','position_dy','position_u']
  return (
    <ElementAttrSetter2Cols
      attributePath={attributePath}
      attributeKey={attributeKey}
      t={t}
      elements={elements}>
      <ConfigMenuNumberInput
        disabled={!disable_attr_props[attributeKey as keyof typeof disable_attr_props]&& !geometry_attributes.includes(attributeKey)}
        t={t}
        default_value={percent ? attribute_value * 100 : attribute_value}
        function_on_blur={(value) => {
          updateElements(
            app_data, elements, attributeKey,
            (percent && value ? value / 100 : value) as ValueElementsType, refreshParentComponent)
        }}
        menu_for_style={menu_for_style}
        minimum_value={minimum_value}
        maximum_value={maximum_value}
        unit_text={percent ? '%' : unit_text}
        step={step}
        stepper={stepper}
        multiValue={is_attribute_indetermined}
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
      <Box as='span'layerStyle='menuconfigpanel_part_title_3'>
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
  );
};
// Tooltipe added to input in menu when add a local value (for nodes & links local attributes)



export const TooltipValueSurcharge = (k: string, t: TFunction) => {
  return <OSTooltip label={t('Menu.overcharge_style_value')} placement='left'>
    <FontAwesomeIcon className='tooltip_overload' style={{ color: '#6cc3d5', height: '12', width: '12', float: 'right' }} icon={faCircleInfo} />
  </OSTooltip>;
};


export const OSTooltip = ({label, delay = 500, placement = 'auto', isAlwaysOpen = false, children}:React.PropsWithChildren<{
  delay?: number,
  label: string,
  placement?: PlacementWithLogical
  isAlwaysOpen?: boolean
  children: ReactNode
}>) => {
  if (label === undefined) {
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
};

export const CustomFaEyeCheckIcon = (props: CheckboxProps) => {
  const { isChecked } = props;
  return isChecked
    ? <FontAwesomeIcon icon={faEye} />
    : <FontAwesomeIcon icon={faEyeSlash} />;
};
/**
 * Check if given attribute is overloaded in at least one link
 * @export
 * @param {Class_LinkElement[]} links
 * @param {keyof Class_LinkAttribute} attr
 * @return {*}
 */

export const isElementAttributeOverloaded = (
  elements: (Class_LinkElement | Class_NodeElement)[],
  attr: keyof Class_LinkAttribute | keyof Class_NodeAttribute
) => {
  return elements.some(element => {
    if (element instanceof Class_LinkElement) {
      return element.isAttributeOverloaded(attr as unknown as keyof Class_LinkAttribute)
    } else if (element instanceof Class_NodeElement) {
      return element.isAttributeOverloaded(attr as unknown as keyof Class_NodeAttribute)
    }
    return false
  })
}
interface TooltipElementOverloadedProps {
  k: keyof Class_LinkAttribute | keyof Class_NodeAttribute // Clé de l'attribut à vérifier
  elements: (Class_LinkElement | Class_NodeElement)[] // Éléments à vérifier
  t: TFunction // Fonction de traduction
  tooltipPrefix?: string // Préfixe pour le tooltip (par défaut 'el_var_')
}
/**
   * Local component that add a icon with a tooltip to show attribute value is managed by element attribute (and not style as by default)
   *
   * @param {*} {k}
   * @return {*}
   */
/**
 * Local component that adds an icon with a tooltip to show attribute value is managed by element attribute (and not style as by default)
 * @template TElement - Type of elements (Class_LinkElement | Class_NodeElement)
 * @template TElementAttribute - Type of element attributes (Class_LinkAttribute | Class_NodeAttribute)
 */
export const TooltipElementOverloaded = ({
  k, elements, t
}: TooltipElementOverloadedProps): JSX.Element => {
  const isOverwritted = isElementAttributeOverloaded(elements, k)
  return isOverwritted ? (
    <>{TooltipValueSurcharge('el_var_', t)}</>
  ) : <></>
}

// Version refactorisée de MenuSectionCheckbox
export const MenuSectionCheckbox = ({ 
  app_data, elements,attributePath, attributeKey, refreshParentComponent, children 
}: React.PropsWithChildren<{
  app_data: Class_ApplicationData
  elements: ElementsType[]
  attributePath: string,
  attributeKey: ValueKey
  refreshParentComponent: () => void
  children: React.ReactNode
}>) => {

  const { menu_for_style, disable_attr_props, t } = useElementAttributeConfig(app_data, elements)
  const { attribute_value, is_attribute_indetermined } = useAttributeValue(elements, attributeKey)

  return (
    <Box layerStyle='menu_sub_section'>
      <Box layerStyle='menu_sub_section_title'>
        <Checkbox
          isDisabled={!disable_attr_props[attributeKey as keyof typeof disable_attr_props]}
          isIndeterminate={is_attribute_indetermined}
          variant='menuconfigpanel_part_title_1_checkbox'
          icon={<CustomFaEyeCheckIcon />}
          isChecked={attribute_value as boolean}
          onChange={(evt: React.ChangeEvent<HTMLInputElement>) => {
            updateElements(app_data, elements, attributeKey, evt.target.checked, refreshParentComponent)
          }}
        >
          <OSTooltip label={t(`${String(attributePath)}.tooltips.${String(attributeKey)}`)}>
            {t(`${String(attributePath)}.${String(attributeKey)}`) + ' '}
          </OSTooltip>
          {!menu_for_style && (
            <TooltipElementOverloaded
              k={attributeKey}
              elements={elements as (Class_LinkElement | Class_NodeElement)[]}
              t={t}
            />
          )}
        </Checkbox>
      </Box>
      {children}
    </Box>
  )
}

export const ConditionalCheckboxWithInput = ({
  app_data, elements, checkboxAttributeKey, inputAttributeKey, refreshParentComponent,
  minimum_value = 0, stepper = true, children
}: {
  app_data: Class_ApplicationData,
  elements: ElementsType[],
  checkboxAttributeKey: ValueKey,
  inputAttributeKey: ValueKey,
  refreshParentComponent: () => void,
  minimum_value?: number,
  stepper?: boolean,
  children?: React.ReactNode
}) => {
  const { disable_attr_props, t, menu_for_style } = useElementAttributeConfig(app_data, elements)
  const { attribute_value: checkboxValue } = useAttributeValue(elements, checkboxAttributeKey)
  const { attribute_value, is_attribute_indetermined } = useAttributeValue(elements, inputAttributeKey)

  const layoutStyle = 'menuconfigpanel_row_2cols'

  return (
    <Box as='span' layerStyle={layoutStyle}>
      <Checkbox
        isDisabled={!disable_attr_props[checkboxAttributeKey as keyof typeof disable_attr_props]}
        variant='menuconfigpanel_option_checkbox'
        isChecked={checkboxValue as boolean}
        onChange={(evt) => {
          updateElements(app_data, elements, checkboxAttributeKey, evt.target.checked, refreshParentComponent);
        }}
      >
        <OSTooltip label={t(`Flux.labels.tooltips.${String(checkboxAttributeKey)}`)}>
          {t(`Flux.labels.${String(checkboxAttributeKey)}`) + ' '}
        </OSTooltip>
        {!menu_for_style && (
          <TooltipElementOverloaded
            k={checkboxAttributeKey}
            elements={elements as (Class_LinkElement | Class_NodeElement)[]}
            t={t}
          />
        )}
      </Checkbox>

      {checkboxValue && inputAttributeKey && (
        <OSTooltip label={t(`Flux.labels.tooltips.${String(inputAttributeKey)}`)}>
          <ConfigMenuNumberInput
            disabled={!disable_attr_props[inputAttributeKey as keyof typeof disable_attr_props]}
            t={t}
            default_value={attribute_value as number}
            menu_for_style={menu_for_style}
            minimum_value={minimum_value}
            stepper={stepper}
            function_on_blur={(value) => {
              updateElements(app_data, elements, inputAttributeKey, value ?? undefined, refreshParentComponent);
            }}
            multiValue={is_attribute_indetermined}
          />
        </OSTooltip>
      )}

      {children}
    </Box>
  )
}

export const CheckboxWithColorPicker = ({
  app_data, elements, attributePath, checkboxAttributeKey, inputAttributeKey, refreshParentComponent, children
}: {
  app_data: Class_ApplicationData,
  elements: ElementsType[],
  attributePath: string,
  checkboxAttributeKey: ValueKey,
  inputAttributeKey: ValueKey,
  refreshParentComponent: () => void,
  children?: React.ReactNode
}) => {
  const { disable_attr_props, t, menu_for_style } = useElementAttributeConfig(app_data, elements)
  const { attribute_value: checkboxValue } = useAttributeValue(elements, checkboxAttributeKey)
  const { attribute_value, is_attribute_indetermined } = useAttributeValue(elements, inputAttributeKey)

  const layoutStyle = 'menuconfigpanel_row_2cols'

  return (
    <Box as='span' layerStyle={layoutStyle}>
      <Checkbox
        isDisabled={!disable_attr_props[checkboxAttributeKey as keyof typeof disable_attr_props]}
        variant='menuconfigpanel_option_checkbox'
        isChecked={checkboxValue as boolean}
        onChange={(evt) => {
          updateElements(app_data, elements, checkboxAttributeKey, evt.target.checked, refreshParentComponent);
        }}
      >
        <OSTooltip label={t(`${String(attributePath)}.tooltips.${String(checkboxAttributeKey)}`)}>
          {t(`${String(attributePath)}.${String(checkboxAttributeKey)}`) + ' '}
        </OSTooltip>
        {!menu_for_style && (
          <TooltipElementOverloaded
            k={checkboxAttributeKey}
            elements={elements as (Class_LinkElement | Class_NodeElement)[]}
            t={t}
          />
        )}
      </Checkbox>

      {checkboxValue && (
        <OSTooltip label={t(`${String(attributePath)}.tooltips.${String(inputAttributeKey)}`)}>
        <MenuColorPicker
          isDisabled={!disable_attr_props[inputAttributeKey as keyof typeof disable_attr_props]}
          initialColor={attribute_value}
          functionOnBlur={(new_color) => {
            updateElements(app_data, elements, inputAttributeKey, new_color,refreshParentComponent)
          }} />
        </OSTooltip>
      )}
      {children}
    </Box>
  )
}

export const SimpleElementCheckbox = ({
  app_data, elements, attributeKey, refreshParentComponent, variant = 'menuconfigpanel_option_checkbox'
}: {
  app_data: Class_ApplicationData
  elements: ElementsType[]
  attributeKey: ValueKey
  refreshParentComponent: () => void
  variant?: string
}) => {
  const { disable_attr_props, t, menu_for_style } = useElementAttributeConfig(app_data, elements)
  const { attribute_value } = useAttributeValue(elements, attributeKey)

  return (
    <Checkbox
      isDisabled={!disable_attr_props[attributeKey as keyof typeof disable_attr_props]}
      variant={variant}
      isChecked={attribute_value as boolean}
      onChange={(evt) => {
        updateElements(app_data, elements, attributeKey, evt.target.checked, refreshParentComponent)
      }}
    >
      <OSTooltip label={t(`Flux.labels.tooltips.${String(attributeKey)}`)}>
        {t(`Flux.labels.${String(attributeKey)}`) + ' '}
      </OSTooltip>
      {!menu_for_style && (
        <TooltipElementOverloaded
          k={attributeKey}
          elements={elements as (Class_LinkElement | Class_NodeElement)[]}
          t={t}
        />
      )}
    </Checkbox>
  )
}

