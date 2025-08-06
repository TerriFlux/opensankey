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
} from '@chakra-ui/react'
import { t, TFunction } from 'i18next'
import React, { FC, useState } from 'react'
import { Class_LinkElement } from '../../Elements/Link'
import { LINKS_ATTRIBUTES_CONFIG, Class_LinkStyle } from '../../Elements/LinkAttributes'
import {
  Class_NodeAttribute,
  Class_NodeStyle} from '../../Elements/NodeAttributes'
import { ChevronDownIcon } from '@chakra-ui/icons'
import { FaSquare } from 'react-icons/fa'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSquareCheck } from '@fortawesome/free-solid-svg-icons'
import { Class_NodeElement } from '../../Elements/Node'
import { Class_ApplicationData } from '../../types/ApplicationData'
import {
  FCType_WrapperBoxSubSectionMenu, FCType_WrapperCheckBoxSubSectionMenu,
  labelAttributeType, labelValueAttribute, possibleDecoratorName} from '../SankeyMenuTypes'


/**
 * Check if element attribute is from local attr
 *
 * @param {(Class_LinkElement[] | Class_NodeElement[])} elements
 * @param {possibleDecoratorName} attr
 * @return {boolean} 
 */
export function isElementAttributeOverloaded(
  elements: Class_LinkElement[] | Class_NodeElement[],
  attr: possibleDecoratorName) {
  let overloaded = false
  elements.forEach(el => overloaded = (overloaded || el.isAttributeOverloaded(attr)))
  return overloaded
}

/**
 * Generic function to call getter decorator of model
 *
 * @template TModel
 * @template TKey
 * @param {TModel} model
 * @param {TKey} key
 * @return {TModel[TKey]} 
 */
export function getValueWithDecoratorRetriever<TModel, TKey extends keyof TModel>(
  model: TModel,
  key: TKey
) {
  return model[key]
}

export type elementsType = Class_LinkStyle | Class_LinkElement | Class_NodeElement | Class_NodeStyle
type valueType = labelValueAttribute[valueKeu]
type valueKeu = keyof labelValueAttribute
export type valueElementsType = elementsType[valueType] | undefined


/**
 * Generic function to call setter decorator of model
 *
 * @template TModel
 * @template TKey
 * @template Tvalue
 * @param {TModel} model
 * @param {TKey} key
 * @param {Tvalue} value
 */
export function setValueWithDecoratorRetriever<TModel, TKey extends keyof TModel, Tvalue extends TModel[TKey]>(
  model: TModel,
  key: TKey,
  value: Tvalue | undefined
) {
  model[key] = value as TModel[TKey]
}

/**
 * Upate attribute value via it's decorator & save it's possible undoing in data history
 *
 * @param {Class_ApplicationData} data
 * @param {elementsType[]} elements
 * @param {(labelValueAttribute | labelAttributeType)} _dict_decorator_name
 * @param {keyof labelValueAttribute} k
 * @param {valueElementsType} val
 * @param {() => void} refreshParentComponent
 */
export const updateElements = (
  data: Class_ApplicationData,
  elements: elementsType[],
  _dict_decorator_name: labelValueAttribute | labelAttributeType, // declare var can be both type so we can use the function in SankeyMenuLabelComponent & SankeyMenuValueLabelComponent 
  k: keyof labelValueAttribute, // key of labelValueAttribute also contain key of labelAttributeType (since labelValueAttribute is a composite type with labelAttributeType)
  val: valueElementsType,
  refreshParentComponent: () => void
) => {
  const dict_decorator_name = _dict_decorator_name as labelValueAttribute
  // Create a dict of old val for each elements 
  const dict_old_val: { [x: string]: valueElementsType } = {}
  elements.forEach(element => dict_old_val[element.id] = getValueWithDecoratorRetriever(element, dict_decorator_name[k]))

  // Original function
  const _updateElements = () => {
    elements.forEach(element => setValueWithDecoratorRetriever(element, dict_decorator_name[k], val))
    refreshParentComponent()
  }

  // Undo function
  const inv_updateElements = () => {
    elements.forEach(element => setValueWithDecoratorRetriever(element, dict_decorator_name[k], dict_old_val[element.id]))
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
 *   new_data,
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
 *   new_data,
 *   title,
 *   children
 * }
 * @return {*} 
 */
export const WrapperCheckBoxSubSectionMenu: FC<FCType_WrapperCheckBoxSubSectionMenu> = ({
  title,
  open = true,
  onClick,
  children
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
 * @param {*} { new_data, title, children, hide = false }
 * @return {*} 
 */
export const WrapperContentConfig: FC<{ title: string; hide?: boolean; children: JSX.Element }> = ({ title, children, hide = false }) => {
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
 * @param {*} { new_data, nodesOrLinks, dict_overwritted_attr }
 * @return {*} 
 */
export const MenuResetAttrLocal: FC<{ new_data: Class_ApplicationData, nodesOrLinks: 'nodes' | 'links', dict_overwritted_attr: { [x: string]: { overloaded: boolean, name: string } } }> = (
  {
    new_data,
    nodesOrLinks,
    dict_overwritted_attr
  }) => {
  const { t, icon_library } = new_data
  const { icon_undo } = icon_library

  // Delete all local attributes of selected elements
  const resetAll = () => nodesOrLinks == 'nodes' ? new_data.drawing_area.sankey.resetAttrSelectedNodes() : new_data.drawing_area.sankey.resetAttrSelectedLinks()
  // Delete local attributes 'k' of selected elements
  const resetLocal = (k: string) => nodesOrLinks == 'nodes' ? new_data.drawing_area.deleteLocalAttrSelectedNode(k as keyof Class_NodeAttribute) : new_data.drawing_area.deleteLocalAttrSelectedLinks(k as (keyof typeof LINKS_ATTRIBUTES_CONFIG))

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
export const OSMultiSelect: FC<{ t: TFunction, elements: typeElementSelectable, onClick: (entries: typeElementSelectable) => void }> = ({
  elements,
  onClick
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


