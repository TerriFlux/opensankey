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

import React, { useState } from 'react'

import {
  Box,
  Button,
  Input,
  InputGroup,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  useBoolean
} from '@chakra-ui/react'
import { DragDropContext, Draggable, DraggingStyle, Droppable, NotDraggingStyle } from 'react-beautiful-dnd'
import {
  CutName
} from '../../types/Utils'

import { MenuDraggable } from '../topmenus/SankeyMenus'
import { default_style_id } from '../../types/Utils'
import { MenuConfigurationAppearance } from '../configmenus/MenuElementsAppearance'

import { isElementAttributeOverloaded, MenuResetAttrLocal, OSMultiSelect, OSTooltip, typeElementSelectable, WrapperBoxSubSectionMenu } from '../configmenus/MenuCommon'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { Class_LinkElement } from '../../Elements/Link'
import { Class_NodeElement } from '../../Elements/Node'
import { Class_ElementStyle } from '../../Elements/Element'
import { Class_ContainerElement } from '../../Elements/TextZone'
import { ALL_ATTRIBUTES_CONFIG } from '../../Elements/ElementsAttributesConfig'
import { elementStyleConfigs } from '../../Elements/ElementStyle'

export const GenericModalStyle = ({
  app_data
}: {
  app_data: Class_ApplicationData
}) => {
  const { t } = app_data
  const [, setForceUpdate] = useBoolean()
  const [selectedStyleId, setSelectedStyleId] = useState(default_style_id)

  app_data.menu_configuration.ref_to_menu_config_styles_editor_updater.current = setForceUpdate.toggle

  // Failsafe
  if (!(selectedStyleId in app_data.drawing_area.sankey.styles_dict)) {
    setSelectedStyleId(default_style_id)
  }

  const content_style_shape = (
    <GenericStyleSelector app_data={app_data}>
      <>
        <MenuConfigurationAppearance
          app_data={app_data}
          menu_for_style={true}
        />
      </>
    </GenericStyleSelector>
  )

  return (
    <>
      <MenuDraggable
        dict_hook_ref_setter_show_dialog_components={app_data.menu_configuration.dict_setter_show_dialog}
        dialog_name={'ref_setter_show_modal_styles'}
        content={content_style_shape}
        title={t('Menu.esn')}
        maxW='20%'
        customPos={{ x: window.innerWidth * 0.59, y: window.innerHeight * 0.2 }}
      />
    </>
  )
}

// ✅ COMPOSANT GÉNÉRIQUE POUR LE WRAPPER DE SÉLECTEUR DE STYLE
export const GenericStyleSelector = ({ app_data, children }: React.PropsWithChildren<{
  app_data: Class_ApplicationData
  children: JSX.Element
}>) => {
  const { t, icon_library } = app_data
  const { icon_add_element, icon_remove_element, icon_open_selector } = icon_library
  const [update, setUpdate] = useState(false)

  const styles_dict = app_data.drawing_area.sankey.styles_dict
  const selected_style_id = (app_data.menu_configuration.ref_selected_style.current in styles_dict)
    ? app_data.menu_configuration.ref_selected_style.current
    : default_style_id
  const selected_style = styles_dict[selected_style_id]

  // Familles de styles. Pour l'instant deux familles : les styles prédéfinis de
  // l'application (définis dans ElementStyle.tsx + style par défaut) et les styles
  // créés par l'utilisateur. À terme on pourra en ajouter d'autres ici.
  const isPredefinedStyle = (id: string) => id === default_style_id || (id in elementStyleConfigs)
  const style_families = [
    { key: 'predefined' as const, label: t('ElementStyle.family_predefined'), match: (id: string) => isPredefinedStyle(id) },
    { key: 'user' as const, label: t('ElementStyle.family_user'), match: (id: string) => !isPredefinedStyle(id) }
  ]
  const [selected_family, setSelectedFamily] = useState<'predefined' | 'user'>(
    isPredefinedStyle(selected_style_id) ? 'predefined' : 'user'
  )
  const current_family = style_families.find(f => f.key === selected_family) ?? style_families[0]

  // Si le style sélectionné a changé en dehors de ce menu (clic sur un nœud, ajout…)
  // et n'appartient pas à la famille courante, on recale la famille affichée.
  if (!current_family.match(selected_style_id)) {
    const fam = isPredefinedStyle(selected_style_id) ? 'predefined' : 'user'
    if (fam !== selected_family) setSelectedFamily(fam)
  }

  const filtered_style_ids = Object.keys(styles_dict).filter(id => current_family.match(id))

  // Surcharges du style sélectionné par rapport au style par défaut (pour le menu de reset).
  // Recalculé à la volée par MenuResetAttrLocal (à l'ouverture / après reset) car l'édition
  // d'un attribut via le menu d'apparence ne re-rend pas ce composant.
  const lang = (app_data.language ?? 'fr') as 'fr' | 'en'
  const computeOverloadedAttr = () => {
    const dict: { [_: string]: { overloaded: boolean, name: string } } = {}
    Object.entries(ALL_ATTRIBUTES_CONFIG).forEach(([key, cfg]) => {
      if (selected_style.isAttributeOverloaded(key as keyof typeof ALL_ATTRIBUTES_CONFIG)) {
        dict[key] = {
          overloaded: true,
          name: (cfg as { labels?: { fr: string, en: string } }).labels?.[lang] ?? key
        }
      }
    })
    return dict
  }

  // const config = elementType === 'nodes' ? {
  //   selectedRef: app_data.menu_configuration.ref_selected_style,
  const updateAll = () => {
    //app_data.menu_configuration.ref_to_menu_config_styles_editor_updater.current

    app_data.menu_configuration.updateAllComponentsRelatedToNodes()
    app_data.menu_configuration.updateComponentRelatedToStyles()
    app_data.menu_configuration.updateAllComponentsRelatedToContainers()
    app_data.menu_configuration.updateComponentRelatedToApparence()
  }


  return (
    <Box layerStyle='menuconfigpanel_grid'>
      {/* Sélecteur de famille de styles (prédéfinis de l'application / utilisateur) */}
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' display='flex' gap='0.4rem'>
        <Box layerStyle='menuconfigpanel_option_name' textStyle='h3'>
          {t('ElementStyle.family')}
        </Box>
        <Box flex='auto'>
          <Menu>
            <MenuButton
              as={Button}
              w='100%'
              variant='menuconfigpanel_option_button'
              rightIcon={icon_open_selector}
            >
              {current_family.label}
            </MenuButton>
            <MenuList>
              {style_families.map(fam => (
                <MenuItem
                  key={fam.key}
                  onClick={() => {
                    setSelectedFamily(fam.key)
                    const ids = Object.keys(styles_dict).filter(fam.match)
                    if (!ids.includes(selected_style_id)) {
                      app_data.menu_configuration.ref_selected_style.current = ids[0] ?? default_style_id
                    }
                    updateAll()
                    setUpdate(!update)
                  }}
                >
                  {fam.label}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
        </Box>
      </Box>

      <Box as='span' layerStyle='menustylepanel_row_droplist'>
        {/* Bouton pour ajouter un style */}
        <Button
          variant='menuconfigpanel_add_button'
          size='sizeConfigButton'
          onClick={() => {
            const new_style = app_data.drawing_area.sankey.addNewDefaultElementStyle()
            app_data.menu_configuration.ref_selected_style.current = new_style.id
            setSelectedFamily('user')
            updateAll()
            app_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
            setUpdate(!update)
          }}
        >
          {icon_add_element}
        </Button>

        {/* Liste déroulante pour sélectionner un style */}
        <Menu>
          <MenuButton
            as={Button}
            variant='menuconfigpanel_option_button'
            rightIcon={icon_open_selector}
          >
            {CutName(t(selected_style.name), 30)}
          </MenuButton>
          <MenuList>
            {filtered_style_ids.map(id => (
              <MenuItem
                key={id}
                onClick={() => {
                  app_data.menu_configuration.ref_selected_style.current = id
                  updateAll()
                  setUpdate(!update)
                }}
              >
                {t(app_data.drawing_area.sankey.styles_dict[id].name)}
              </MenuItem>
            ))}
          </MenuList>
        </Menu>

        {/* Bouton pour supprimer le style sélectionné */}
        <Button
          variant='menuconfigpanel_del_button'
          size='sizeConfigButton'
          isDisabled={selected_style_id === default_style_id}
          onClick={() => {
            app_data.drawing_area.sankey.deleteElementStyle(selected_style)
            app_data.menu_configuration.ref_selected_style.current = default_style_id
            updateAll()
            app_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
          }}
        >
          {icon_remove_element}
        </Button>

        {/* Menu pour enlever les surcharges du style par rapport au style par défaut */}
        <OSTooltip label={t('Noeud.tooltips.AS')}>
          <MenuResetAttrLocal
            new_data={app_data}
            dict_overwritted_attr={computeOverloadedAttr()}
            computeOverloadedAttr={computeOverloadedAttr}
            is_disabled={selected_style_id === default_style_id}
            onResetAll={() => {
              app_data.drawing_area.sankey.resetAttrStyle(selected_style)
              updateAll()
              app_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
              setUpdate(!update)
            }}
            onResetLocal={(k) => {
              app_data.drawing_area.sankey.deleteLocalAttrStyle(selected_style, k as keyof typeof ALL_ATTRIBUTES_CONFIG)
              updateAll()
              app_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
              setUpdate(!update)
            }}
          />
        </OSTooltip>
      </Box>

      <Box as='span' layerStyle='menuconfigpanel_row_2cols' display='flex' gap='0.4rem'>
        <Box layerStyle='menuconfigpanel_option_name' textStyle='h3'>
          {t('Menu.ns')}
        </Box>
        <Box flex='auto'>
          <InputGroup variant='menuconfigpanel_option_input'>
            <Input
              variant='menuconfigpanel_option_input'
              disabled={selected_style_id === default_style_id}
              defaultValue={t(selected_style.name)}
              key={selected_style_id}
              onChange={(evt) => {
                selected_style.name = evt.target.value
              }}
              onBlur={() => {
                updateAll()
                app_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
              }}
            />
          </InputGroup>
        </Box>
      </Box>

      {children}
    </Box>
  )
}

export const ConfigMenuStyleElement = ({
  app_data,
  selected_elements,
  config,
  categories
}: {
  app_data: Class_ApplicationData
  selected_elements: Class_LinkElement[] | Class_NodeElement[] | Class_ContainerElement[]
  config: typeof ALL_ATTRIBUTES_CONFIG
  categories: string[]
}) => {
  const { t, icon_library, drawing_area, menu_configuration } = app_data
  const { sankey } = drawing_area
  const { ref_selected_style, dict_setter_show_dialog } = menu_configuration
  const { ref_setter_show_modal_styles } = dict_setter_show_dialog

  const element_ref = selected_elements[0]

  const updateStyles = () => {
    menu_configuration.updateComponentRelatedToStyles()
  }

  const dict_overwritted_attr: { [_: string]: { overloaded: boolean, name: string } } = {}
  Object.entries(config).forEach(([key, config]) => {
    if (categories.some(_ => _ === config.category)) {
      const label_text = config.labels[(app_data.language ?? 'fr') as 'fr' | 'en']
      dict_overwritted_attr[key] = {
        //@ts-expect-error xxx
        overloaded: isElementAttributeOverloaded(selected_elements, key, config),
        name: label_text
      }
    }
  })

  const options_selector: typeElementSelectable = sankey.styles_list.map(style => {
    return {
      value: style.id,
      label: t(style.name),
      selected: element_ref?.style.includes(style) ?? false,
      disabled: style.id == default_style_id,
    }
  })

  return (
    <WrapperBoxSubSectionMenu new_data={app_data} title={t('Noeud.Style')} is_open={false}>
      <>
        <Box layerStyle='menuconfigpanel_row_stylechoice'>
          <OSTooltip label={t('Noeud.tooltips.AS')}>
            <MenuResetAttrLocal
              new_data={app_data}
              dict_overwritted_attr={dict_overwritted_attr}
            />
          </OSTooltip>

          <Button
            variant='menuconfigpanel_option_button'
            onClick={() => {
              if (selected_elements.length !== 0) {
                const style = selected_elements[0].style
                const list_id_style = style.map(s => s.id)
                let unchanged = true

                selected_elements.forEach(el => {
                  unchanged = el.style.every(style => list_id_style.includes(style.id)) ? unchanged : false
                })

                if (unchanged) {
                  ref_selected_style.current = [...style].reverse()[0].id
                }
              }

              updateStyles()
              ref_setter_show_modal_styles.current(true)
            }}
          >
            {icon_library.icon_edit_style}
          </Button>

          <OSMultiSelect
            t={t}
            elements={options_selector}
            onClick={(entries) => {
              const entries_values = entries.map(d => d.value)
              sankey.styles_list.forEach(style => {
                sankey.switchElementStyle(style, entries_values.includes(style.id))
              })
            }}
          />
        </Box>

        <MenuOrderStylesOfSelectedElements app_data={app_data} />
      </>
    </WrapperBoxSubSectionMenu>
  )
}

const style_TableLineDragging = (isDisabled: boolean, draggableStyle: DraggingStyle | NotDraggingStyle | undefined) => ({
  background: isDisabled ? 'lightgrey' : 'unset',
  ...draggableStyle
})

/**
 * ✅ Composant unifié pour modifier l'ordre des styles (nodes, links, containers)
 */
export const MenuOrderStylesOfSelectedElements = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const { drawing_area, t, icon_library, menu_configuration } = app_data
  const { icon_move_element_down, icon_move_element_up } = icon_library

  // ✅ Sélection des éléments selon le type
  const elements = drawing_area.selected_elements_list

  const style_list_to_use = elements[0]?.style?.slice().reverse() ?? []

  if (style_list_to_use.length === 0) {
    return <></>
  }

  // ✅ Configuration des fonctions selon le type
  const moveOrderStyle = (style_src: Class_ElementStyle, style_trgt: Class_ElementStyle) => {
    drawing_area.moveOrderStyleInSelectedElements(style_src, style_trgt)
    menu_configuration.updateComponentRelatedToApparence()
  }

  return (
    <WrapperBoxSubSectionMenu is_open={false} new_data={app_data} title={t('Noeud.OrderStyle')}>
      <DragDropContext onDragEnd={(evt) => {
        if (evt.destination?.index == undefined) return

        // On ne peut pas mettre un style avant le style par défaut
        let dest_to_use = evt.destination.index
        if (dest_to_use == style_list_to_use.length - 1) {
          dest_to_use = style_list_to_use.length - 2
        }

        const style_src = style_list_to_use[evt.source.index]
        const style_trgt = style_list_to_use[dest_to_use]
        moveOrderStyle(style_src, style_trgt)
      }}>
        <Droppable droppableId="droppable">
          {(provided) => (
            <Box
              {...provided.droppableProps}
              ref={provided.innerRef}
              style={{ display: 'grid', gridRowGap: '0.2rem' }}
            >
              {style_list_to_use.map((style, element_idx) => {
                const draggDisabled = style.id == default_style_id

                return (
                  <Draggable
                    isDragDisabled={draggDisabled}
                    key={style.id}
                    index={element_idx}
                    draggableId={'line_drag_' + style.id}
                  >
                    {(provided) => (
                      <Box
                        key={style.id}
                        layerStyle='drag_line_element_order'
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={style_TableLineDragging(draggDisabled, provided.draggableProps.style)}
                      >
                        <Box className='name_element'>{t(style.name)}</Box>
                        <Box layerStyle="options_2cols">
                          <Button
                            isDisabled={draggDisabled || element_idx == 0}
                            variant='menuconfigpanel_move_order_node_io'
                            minWidth='0'
                            onClick={() => {
                              const style_src = style_list_to_use[element_idx]
                              const style_trgt = style_list_to_use[element_idx - 1]
                              moveOrderStyle(style_src, style_trgt)
                            }}
                          >
                            {icon_move_element_up}
                          </Button>
                          <Button
                            isDisabled={element_idx == style_list_to_use.length - 2 || draggDisabled}
                            variant='menuconfigpanel_move_order_node_io'
                            minWidth='0'
                            onClick={() => {
                              const style_src = style_list_to_use[element_idx]
                              const style_trgt = style_list_to_use[element_idx + 1]
                              moveOrderStyle(style_src, style_trgt)
                            }}
                          >
                            {icon_move_element_down}
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </Draggable>
                )
              })}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      </DragDropContext>
    </WrapperBoxSubSectionMenu>
  )
}