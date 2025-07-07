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

import React, { Fragment, FunctionComponent, MutableRefObject, useRef, useState } from 'react'

import Draggable from 'react-draggable'

import {
  Box,
  Button,
  ButtonGroup,
  CloseButton,
  Drawer,
  DrawerBody,
  DrawerContent,
  Editable,
  EditableInput,
  EditablePreview,
  Text,
  Toast,
} from '@chakra-ui/react'


/*************************************************************************************************/

import {
  FCType_MenuDraggable,
} from './types/SankeyMenuTopTypes'
import {
  OSTooltip
} from '../../types/Utils'

/*************************************************************************************************/

import SankeyLoad from '../dialogs/SankeyPersistence'
import {
  ExcelModal,
  ApplyLayoutDialog,
  ExcelModalSaver
} from '../dialogs/SankeyMenuDialogs'
import {
  uploadExcelImpl
} from '../dialogs/SankeyPersistence'
import {
  DownloadExamples
} from '../dialogs/SankeyPersistence'

import { ToolBarBottom } from './MenuBottom'
import { FCType_Menu } from '../../types/FunctionTypes'
import { SpreadSheet } from '../spreadsheet/SpreadSheet'
import { modalResolutionPNG } from './SankeyExports'
import { MenuTopNavBar, OpenSankeySaveButton } from './MenuTop'
import { Type_AdditionalMenus, Type_GenericApplicationData } from '../../types/Types'
import { keyTypeConfig, keyTypeElements } from '../../types/MenuConfig'
import { DrawingAreaStyle, GraphElementsOrdoner, LayoutConfigDAScaleAndLimit, LegendContextConfig, LegendStyleConfig } from '../configmenus/SankeyMenuConfigurationLayout'
import { SankeyMenuConfigurationNodesIO } from '../configmenus/SankeyMenuConfigurationNodesIO'
import { MenuConfigurationLinksData } from '../configmenus/SankeyMenuConfigurationLinksData'
import { MenuConfigurationLinkContext, MenuConfigurationLinksStyle } from '../configmenus/SankeyMenuConfigurationLinksAppearence'
import { MenuConfigurationNodeContext, MenuConfigurationNodeStyle } from '../configmenus/SankeyMenuConfigurationNodesAttributes'
import { WrapperContentConfig } from '../configmenus/SankeyMenuComponents'


/*************************************************************************************************/

export declare const window: Window &
  typeof globalThis & {
    sankey: {
      header?: string
      sous_filieres: { [key: string]: string }
      help: { [key: string]: string }
      excel: string
      structure: boolean
      advanced: boolean
      footer: boolean
      toolbar: boolean
      topbar: boolean
    }
  }

/*************************************************************************************************/

export const menu_config_width = 20

/*************************************************************************************************/


/**
 * Description placeholder
 *
 * @param {{ data: any; set_data: any;right_menu: any; settings_edition: any; settings_edition_node_tags: any; settings_edition_link_tags: any; settings_edition_data_tags: any; ... 39 more ...; launch: any; }}
 *
 * @returns
 */
export const Menu: FunctionComponent<FCType_Menu> = (
  {
    new_data,
    external_modal,
    additionalMenus,
    apply_transformation_additional_elements,
    diagramSelector,
  }: FCType_Menu
) => {
  const { t, app_name, logo_terriflux, icon_library, menu_configuration } = new_data
  const { icon_open_close_config } = icon_library
  const [show_nav, set_show_nav] = useState(false)
  const [, setCount] = useState(0)

  menu_configuration.ref_to_menu_updater.current = () => setCount(a => a + 1)
  menu_configuration.ref_menu_opened.current = [show_nav, (val) => set_show_nav(val)]
  const posBtnOpenConfig = menu_configuration.ref_menu_opened.current[0] ? 'calc(' + menu_config_width + '% + ' + new_data.drawing_area.fit_margin + 'px)' : new_data.drawing_area.fit_margin / 2
  //Switch the variable value that handle opening and closing the configuration menu
  const toggleShow = () => {
    set_show_nav(!show_nav)
  }

  // 1.75rem is the size of the btn save in cache + edit diagram name
  const posTopMenuConfig = 'calc(' + (new_data.drawing_area.getNavBarHeight() + (new_data.drawing_area.fit_margin)) + 'px + 1.75rem)'

  // JSX.Elements for the component ----------------------------------------------------------------

  const modal_resolution_png = modalResolutionPNG(new_data)

  const content_support = <>
    <Text
      fontStyle='h3'
    >
      {t('Menu.rth_support')}:
    </Text>
    <Text
      fontStyle='h4'
    >
      {t('Menu.support_explication').split('[]')[0]}
      <a href='mailto:support@open-sankey.fr	'>support@open-sankey.fr</a>
      {t('Menu.support_explication').split('[]')[1]}
    </Text>
  </>


  const modal_support = <MenuDraggable
    dict_hook_ref_setter_show_dialog_components={new_data.menu_configuration.dict_setter_show_dialog}
    dialog_name={'ref_setter_show_modal_support'}
    content={content_support}
    title={t('Menu.c_support')}
  />


  const sankey_file_name = <Box style={{ top: new_data.drawing_area.getNavBarHeight() + new_data.drawing_area.fit_margin / 2, right: new_data.drawing_area.fit_margin / 2 }} className='toolbar_save_and_file_name' layerStyle='toolbar_save_and_file_name' >
    <OpenSankeySaveButton new_data={new_data} />
    <OSTooltip placement='left' label={t('Menu.tooltips.sankey_file_name') + new_data.file_name}>
      <Box layerStyle='topbar_file_name' >
        <Editable textAlign={'center'} justifyContent={'center'}
          variant='name_file_editable'
          defaultValue={new_data.file_name}
          onSubmit={(evt) => {
            if (evt) {
              new_data.file_name = evt
              setCount(a => a + 1)
            }
          }}>
          <EditablePreview />
          <EditableInput />
        </Editable>
      </Box>
    </OSTooltip>
  </Box>

  return (
    <>
      {external_modal.map((c, i) => { return <React.Fragment key={i}>{c}</React.Fragment> })}
      {/* Top Navbar with navigation and edition elements */}
      {((!new_data.is_static) ||(window.sankey && window.sankey.topbar != false ))? <MenuTopNavBar new_data={new_data} additionalMenus={additionalMenus} />:<></>}

      {/* Bottom Navbar with some more info */}
      {
        (
          (!new_data.is_static) ||
          (window.sankey && window.sankey.footer)
        ) ?
          <Box
            className='BottomMenu'
            zIndex='1'
            position='fixed'
            bottom='0'
            layerStyle='menubottom_layout_style'
          >
            {additionalMenus.current.footer.map((add_footer,idx)=><Fragment key={'additional_footer_'+idx}>{add_footer}</Fragment>)}
            <Box
              display='grid'
              gridTemplateColumns='1fr 1fr 1fr 1fr 2fr'
              margin='0.2rem'
            >
              <Box
                layerStyle='menubottom_item_style'
                justifySelf='start'
              >
                ©
                <img
                  width={75}
                  src={logo_terriflux}
                  onClick={() => { window.open('https://terriflux.com/', '_blank') }}
                />
                - {t('tdr')}
              </Box>
              <Box layerStyle='menubottom_item_style'>
                {app_name}
              </Box>
              <Box layerStyle='menubottom_item_style'>
                <a href='https://terriflux.com/mentions-legales/'>{t('legal')}</a>
              </Box>
              <Box layerStyle='menubottom_item_style'>
                <a href='mailto:support@open-sankey.fr	'>support@terriflux.fr</a>
              </Box>
              <Box
                layerStyle='menubottom_item_style'
                justifySelf='end'
                paddingRight='1.5rem'
              >
                12 bis rue Séraphin Martin, 38430 Moirans  +33 (0)6 21 83 56 76
              </Box>
            </Box>
          </Box> :
          <></>
      }

      {
        (!new_data.is_static) ? <>
          {sankey_file_name}
          <Drawer
            blockScrollOnMount={false}
            isOpen={show_nav}
            placement='right'
            onClose={() => set_show_nav(false)}
            onEsc={() => {
              // Override drawer onEscape() to use Class_applicationData 'escape' keyEvent & not the one by default from the <Drawer> component
              const ev = document
              const tmp = new KeyboardEvent('keydown', { key: 'Escape' })
              if (ev.onkeydown) {
                ev.onkeydown(tmp as KeyboardEvent)
              }
            }}
            variant='drawer_menu_config'
            id='drawer_config'
            trapFocus={false}
          >
            {/* We have to set the width of the component here (and not in the theme)
            because for some reason a style is directly applied to this component
            and we cannot override it in the theme */}
            <DrawerContent
              className='drawer_menu_config'
              style={{
                width: menu_config_width + '%',
                right: new_data.drawing_area.fit_margin / 2,
                marginTop: posTopMenuConfig
              }}
            >
              <DrawerBody>
                <ConfigMenu new_data={new_data} additional_menus={additionalMenus} />
              </DrawerBody>
            </DrawerContent>
          </Drawer></> :
          <></>}


      {!(new_data.is_static ? new_data.is_static : false) ? (
        <OSTooltip
          placement='left'
          label={t('Banner.open_configuration_menu')}
          isAlwaysOpen={new_data.menu_configuration.show_splashscreen}
        >
          <Button
            id='toggle-check'
            className='openMenu sideToolBar'
            variant='toolbar_main_button'
            onClick={toggleShow}
            value='menuConfigButton'
            style={{
              right: posBtnOpenConfig,
              top: posTopMenuConfig,
            }}
          >
            {icon_open_close_config}
          </Button></OSTooltip>
      ) : (<></>)}


      {((!new_data.is_static) || (window.sankey && window.sankey.toolbar)) ? <ToolBarBottom
        new_data={new_data}
      />:<></>}

      {
        new_data.processFunction.ref_processing.current ? (
          <Toast >
            <Button className='btn btn-sm btn-warning col-md-12'>
              <span className='glyphicon glyphicon-refresh glyphicon-refresh-animate'></span> Processing...
            </Button></Toast>) : (<></>)
      }
      <ApplyLayoutDialog
        applicationData={new_data}
        apply_transformation_additional_elements={apply_transformation_additional_elements}
        diagramSelector={diagramSelector}
      />

      <ExcelModal
        new_data={new_data}
        launch={new_data.processFunction.launch}
        uploadExcelImpl={uploadExcelImpl}
      />
      <ExcelModalSaver new_data={new_data} />

      <SankeyLoad
        new_data={new_data}
        successAction={() => DownloadExamples(
          new_data.processFunction.path.current,
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )}
        processFunctions={new_data.processFunction}
      />

      {modal_support}
      {modal_resolution_png}
    </>
  )
}

const ConfigMenu: FunctionComponent<{ new_data: Type_GenericApplicationData, additional_menus: MutableRefObject<Type_AdditionalMenus> }> = ({ new_data, additional_menus }) => {
  const { type_menu_configuration_selected, style_config } = new_data.menu_configuration
  const [, setUpdate] = useState(false)

  new_data.menu_configuration.ref_to_menu_config_updater.current = () => setUpdate(a => !a)

  const sizeBtn = document.getElementsByClassName('buttonGroupTypeConfig')[0]?.getBoundingClientRect().height ?? 30
  const maxHConfig = window.innerHeight - (new_data.drawing_area.getNavBarHeight() + new_data.drawing_area.getBottomBarHeight() + sizeBtn + (new_data.drawing_area.fit_margin * 2))

  return <Box layerStyle='config_menu_layout' style={{ background: (style_config[type_menu_configuration_selected].theme) }}>
    <Box layerStyle='type_config_box' >
      <ConfigMenuTypeConfig new_data={new_data} additional_menus={additional_menus} />
    </Box>
    <Box layerStyle='config_box' style={{ maxHeight: 'calc(' + maxHConfig + 'px - 0.8rem)' }}>
      <ConfigContent new_data={new_data} additional_menus={additional_menus} />
    </Box>
    <Box layerStyle='element_box'>
      <ConfigMenuElementToConfig new_data={new_data} additional_menus={additional_menus} />
    </Box>
  </Box>
}

/**
 * Buttons to choose what kind of configuration we want the menu to be.
 * For each kind of menu there is a set of configurable elements (node, flow, drawing area, ...)
 *
 * @param {*} { new_data, additional_menus }
 * @return {*}
 */
const ConfigMenuTypeConfig: FunctionComponent<{ new_data: Type_GenericApplicationData, additional_menus: MutableRefObject<Type_AdditionalMenus> }> = ({ new_data, additional_menus }) => {
  const { t } = new_data
  const { type_menu_configuration_selected, ref_to_menu_config_updater } = new_data.menu_configuration
  return <ButtonGroup className='buttonGroupTypeConfig' spacing='0.2rem' style={{
    border: '2px solid lightblue',
    borderRadius: '4px',
    background: 'white',
    width: '100%'
  }} >
    <Button variant={type_menu_configuration_selected == 'data' ? 'button_type_config_activated' : 'button_type_config'}
      onClick={() => {
        new_data.menu_configuration.type_menu_configuration_selected = 'data'
        ref_to_menu_config_updater.current()
      }}
    >
      {t('Menu.Config.type_data')}
    </Button>

    <Button variant={type_menu_configuration_selected == 'style' ? 'button_type_config_activated' : 'button_type_config'}
      onClick={() => {
        new_data.menu_configuration.type_menu_configuration_selected = 'style'
        ref_to_menu_config_updater.current()
      }}
    >
      {t('Menu.Config.type_style')}
    </Button>
    <Button variant={type_menu_configuration_selected == 'context' ? 'button_type_config_activated' : 'button_type_config'}
      onClick={() => {
        new_data.menu_configuration.type_menu_configuration_selected = 'context'
        ref_to_menu_config_updater.current()
      }}
    >
      {t('Menu.Config.type_context')}
    </Button>
    {Object.entries(additional_menus.current.additional_menu_type).map((el, id) => {
      const keyType = el[0] as keyTypeConfig
      return <Button key={'additional_type_config_' + id} variant={type_menu_configuration_selected == keyType ? 'button_type_config_activated' : 'button_type_config'}
        onClick={() => {
          new_data.menu_configuration.type_menu_configuration_selected = keyType
          ref_to_menu_config_updater.current()
        }}
      >
        {t('Menu.Config.' + el[1])}
      </Button>
    })}
  </ButtonGroup>
}


/**
 * Return the content of displayed sub menus from a type of configuration
 *
 * @param {*} { new_data, additional_menus }
 * @return {*}
 */
const ConfigContent: FunctionComponent<{ new_data: Type_GenericApplicationData, additional_menus: MutableRefObject<Type_AdditionalMenus> }> = ({ new_data, additional_menus }) => {
  const { t } = new_data
  const { type_menu_configuration_selected, elements_configurable_selected } = new_data.menu_configuration
  const elements_in_menu_configuration = elements_configurable_selected[type_menu_configuration_selected]

  const dict_config_windows: { [x: string]: { [x: string]: JSX.Element } } = {
    // Menus related to data config
    data: {
      'data': <WrapperContentConfig title={t('Menu.Config.title_table')}>
        <SpreadSheet new_data={new_data} />
      </WrapperContentConfig>,

      'DA': <WrapperContentConfig title={t('Menu.Config.title_graph')}>
        <>
        <LayoutConfigDAScaleAndLimit new_data={new_data} />
        <GraphElementsOrdoner new_data={new_data}/>
        </>
      </WrapperContentConfig>,
      'node': <WrapperContentConfig title={t('Menu.Config.title_node')}>
        <SankeyMenuConfigurationNodesIO new_data={new_data} />
      </WrapperContentConfig>,

      'flow': <WrapperContentConfig title={t('Menu.Config.title_flow')} >
        <MenuConfigurationLinksData new_data={new_data} contextual={false} />
      </WrapperContentConfig>,

      ...additional_menus.current.additional_menu_config_content.data

    },

    // Menus related to context config
    context: {
      DA: <WrapperContentConfig title={t('Menu.Config.title_graph')}>
        <LegendContextConfig new_data={new_data} />
      </WrapperContentConfig>,

      flow: <WrapperContentConfig title={t('Menu.Config.title_flow')} >
        <MenuConfigurationLinkContext new_data={new_data} additionMenus={additional_menus} menu_for_style={false} />
      </WrapperContentConfig>,

      node: <WrapperContentConfig title={t('Menu.Config.title_node')}>
        <MenuConfigurationNodeContext new_data={new_data} additional_menus={additional_menus} menu_for_style={false} />
      </WrapperContentConfig>,

      ...additional_menus.current.additional_menu_config_content.context

    },

    // Menus related to style config
    style: {
      DA: <WrapperContentConfig title={t('Menu.Config.title_graph')}>
        <>
          <DrawingAreaStyle new_data={new_data} extra_background_element={additional_menus.current.extra_background_element} />
          <LegendStyleConfig new_data={new_data} />
        </>
      </WrapperContentConfig>,

      flow: <WrapperContentConfig title={t('Menu.Config.title_flow')}>
        <MenuConfigurationLinksStyle new_data={new_data} additionMenus={additional_menus} menu_for_style={false} />
      </WrapperContentConfig>,

      node: <WrapperContentConfig title={t('Menu.Config.title_node')}>
        <MenuConfigurationNodeStyle new_data={new_data} additional_menus={additional_menus} menu_for_style={false} />
      </WrapperContentConfig>,
      ...additional_menus.current.additional_menu_config_content.style
    },
    ...additional_menus.current.additional_new_menu_config_content

  }
  const content_empty_config = elements_in_menu_configuration.length == 0 ?
    <>
      <Box layerStyle='empty_config_text' textStyle='h2'><span>{t('Menu.empty_config')}</span> </Box>
    </>
    : <></>
  return <>
    {content_empty_config}
    {elements_in_menu_configuration.map((el, i) => {
      return <React.Fragment key={'content_config_' + i}>{dict_config_windows[type_menu_configuration_selected][el]}</React.Fragment>
    })}
  </>
}


export type typeButtonElementConfigurable = { [x: string]: { text: string, icon: JSX.Element, disabled: boolean } }

/**
 * Component for selecting which configurable elements sub menu we want to display in <ConfigContent />
 *
 * @param {*} { new_data }
 * @return {*}
 */
const ConfigMenuElementToConfig: FunctionComponent<{ new_data: Type_GenericApplicationData, additional_menus: MutableRefObject<Type_AdditionalMenus> }> = ({ new_data, additional_menus }) => {
  const { t } = new_data
  const { type_menu_configuration_selected, style_config, ref_to_menu_config_updater } = new_data.menu_configuration
  const elements_buttons = style_config[type_menu_configuration_selected].elements_configurable

  const dict_buttons_element_to_config: typeButtonElementConfigurable = {
    'flow': { icon: new_data.icon_library.icon_flow, text: t('Menu.Config.element_flow'), disabled: false },
    'DA': { icon: new_data.icon_library.icon_graph, text: t('Menu.Config.element_graph'), disabled: false },
    'node': { icon: new_data.icon_library.icon_node, text: t('Menu.Config.element_node'), disabled: false },
    'data': { icon: new_data.icon_library.icon_tableau, text: t('Menu.Config.element_data'), disabled: false },
    ...additional_menus.current.additional_menu_button_element_configurable
  }

  return <ButtonGroup spacing='0.2rem' orientation='vertical' style={{
    border: 'none',
    borderRadius: '4px',
    background: 'white',
    width: '3.5rem',
    padding: '0.2rem',
  }}>
    {
      elements_buttons.filter(el => el in dict_buttons_element_to_config).map((el, i) => {
        const element_typed = el as keyTypeElements
        const activated = new_data.menu_configuration.elements_configurable_selected[type_menu_configuration_selected].includes(element_typed)
        return <Button
          key={'btn_element_' + i}
          isDisabled={dict_buttons_element_to_config[el].disabled}
          variant={activated ? 'button_config_element_activated' : 'button_config_element'}
          onClick={() => {
            new_data.menu_configuration.toggleElementInConfigEdition(type_menu_configuration_selected, element_typed)
            ref_to_menu_config_updater.current()
          }}
        >
          {dict_buttons_element_to_config[el].icon}
          <Box
            as='span'
            padding='0.2rem 0.1rem 0rem 0.1rem'
          >
            {dict_buttons_element_to_config[el].text}
          </Box>
        </Button>
      })
    }
  </ButtonGroup>
}

/**
 *
 *
 * @param {*} {
 *   dict_hook_ref_setter_show_dialog_components,
 *   dialog_name,
 *   content,
 *   title }
 * @return {*}
 */
export const MenuDraggable: FunctionComponent<FCType_MenuDraggable> = ({
  dict_hook_ref_setter_show_dialog_components,
  dialog_name,
  content,
  title,
  maxW = '40vw',
  customPos,
}
) => {
  const [display_menu, set_display_menu] = useState(false)
  const nodeRef = useRef(null) // nodeRef as node from DOM (not Sankey node)
  dict_hook_ref_setter_show_dialog_components[dialog_name].current = set_display_menu
  return <Draggable
    nodeRef={nodeRef}
    handle='.title_menu'
    defaultPosition={customPos !== undefined ? customPos : { x: window.innerWidth / 4, y: window.innerHeight / 4 }}
    bounds={{ left: 0, top: 0 }}
  >
    <Box
      ref={nodeRef}
      layerStyle='menu_draggable_layout'
      hidden={!display_menu}
      position='absolute'
      maxW={maxW}
      zIndex='2'
    >
      <Box
        className='title_menu'
        layerStyle='menu_draggable_title_layout'
      >
        <Text
          justifySelf='start'
          fontStyle='h1'
          margin='0'
        >
          {title}
        </Text>
        <CloseButton
          justifySelf='end'
          onClick={() => { set_display_menu(false) }}
        />
      </Box>
      <Box layerStyle='menu_draggable_content_layout'>
        {content}
      </Box>
    </Box>
  </Draggable>
}

