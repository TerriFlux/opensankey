// External lib
import React, { ChangeEvent, useState, useRef, FunctionComponent } from 'react'

import {
  Box,
  Button,
  Checkbox,
  Input,
  InputGroup,
  InputRightElement
} from '@chakra-ui/react'

// Local imports
import {
  FCType_ButtonNodeContextShowTagMenu,
  FCType_NodeHyperLinkOSP,
  FCType_NodeIconOSP
} from './types/SankeyPlusNodesTypes'

// OpenSankey ts-code
import {
  CustomFaEyeCheckIcon,
  OSTooltip
} from '../../deps/OpenSankey/types/Utils'
import { WrapperBoxSubSectionMenu } from '../../deps/OpenSankey/components/configmenus/SankeyMenuComponents'
import { OSColorPicker } from '../../deps/OpenSankey/components/configmenus/OSColorPicker'




declare const window: Window &
  typeof globalThis & {
    SankeyToolsStatic: boolean
  }

export const NodeIconOSP: FunctionComponent<FCType_NodeIconOSP> = ({
  new_data_plus,
}) => {
  const { t, icon_library } = new_data_plus
  const { icon_locked, icon_unlocked, icon_import_file_image } = icon_library
  const is_activated = new_data_plus.has_sankey_plus

  const [, set_show_menu_node_icon] = useState(false)
  const [, setForceUpdate] = useState(false)
  const selected_nodes = new_data_plus.drawing_area.selected_nodes_list
  new_data_plus.menu_configuration.dict_setter_show_dialog_plus.ref_setter_show_menu_node_icon.current = set_show_menu_node_icon
  new_data_plus.menu_configuration.ref_to_menu_config_node_icon_updater.current = () => setForceUpdate(b => !b)

  // Update this component & component node appareance because we modify shape visibility
  const redrawAndRefresh = () => {
    new_data_plus.menu_configuration.updateComponentRelatedToNodesApparence()
    setForceUpdate(b => !b)
    selected_nodes.forEach(zdt => zdt.draw())
  }

  const _load_image = useRef<HTMLInputElement>(null)


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

  // Functions we can undo ==========================================

  /**
   *Update icon visibility of selected nodes & save it's undo
   *
   */
  const updateNodeIconVisibility = () => {
    const dict_old_value: { [x: string]: [boolean, boolean] } = {}
    selected_nodes.forEach(n => {
      dict_old_value[n.id] = [n.is_image, n.iconVisible]
    })
    const _updateNodeIconVisibility = () => {
      selected_nodes.forEach(n => {
        n.is_image = false
        n.iconVisible = true

      })
      redrawAndRefresh()
    }

    const inv_updateNodeIconVisibility = () => {
      selected_nodes.forEach(n => {
        n.is_image = dict_old_value[n.id][0]
        n.iconVisible = dict_old_value[n.id][1]
      })
      redrawAndRefresh()
    }
    // Save undo/redo in data history
    new_data_plus.history.saveUndo(inv_updateNodeIconVisibility)
    new_data_plus.history.saveRedo(_updateNodeIconVisibility)
    // Execute original attr mutation
    _updateNodeIconVisibility()
  }

  /**
   *Update icon color of selected nodes & save it's undo
   *
   * @param {string} _
   */
  const updateNodeIconColor = (_: string) => {
    const dict_old_value: { [x: string]: string } = {}
    selected_nodes.forEach(n => {
      dict_old_value[n.id] = n.iconColor
    })
    const _updateNodeIconColor = () => {
      selected_nodes.forEach(n => {
        n.iconColor = _
      })
      redrawAndRefresh()
    }

    const inv_updateNodeIconColor = () => {
      selected_nodes.forEach(n => {
        n.iconColor = dict_old_value[n.id]
      })
      redrawAndRefresh()
    }
    // Save undo/redo in data history
    new_data_plus.history.saveUndo(inv_updateNodeIconColor)
    new_data_plus.history.saveRedo(_updateNodeIconColor)
    // Execute original attr mutation
    _updateNodeIconColor()
  }

  /**
   *Update icon color sustainability of selected nodes & save it's undo
   *
   * @param {boolean} _
   */
  const updateNodeIconColorSustainable = (_: boolean) => {
    const dict_old_value: { [x: string]: boolean } = {}
    selected_nodes.forEach(n => {
      dict_old_value[n.id] = n.iconColorSustainable
    })
    const _updateNodeIconColorSustainable = () => {
      selected_nodes.forEach(n => {
        n.iconColorSustainable = _
      })
      redrawAndRefresh()
    }

    const inv_updateNodeIconColorSustainable = () => {
      selected_nodes.forEach(n => {
        n.iconColorSustainable = dict_old_value[n.id]
      })
      redrawAndRefresh()
    }
    // Save undo/redo in data history
    new_data_plus.history.saveUndo(inv_updateNodeIconColorSustainable)
    new_data_plus.history.saveRedo(_updateNodeIconColorSustainable)
    // Execute original attr mutation
    _updateNodeIconColorSustainable()
  }

  /**
   *Update illustration type to none of selected nodes & save it's undo
   *
   *
   */
  const setIllustrationVisibilityToNone = () => {
    const dict_old_value: { [x: string]: [boolean, boolean] } = {}
    selected_nodes.forEach(n => {
      dict_old_value[n.id] = [n.is_image, n.iconVisible]
    })
    const _setIllustrationVisibilityToNone = () => {
      selected_nodes.forEach(n => {
        n.is_image = false
        n.iconVisible = false

      })
      redrawAndRefresh()
    }

    const inv_setIllustrationVisibilityToNone = () => {
      selected_nodes.forEach(n => {
        n.is_image = dict_old_value[n.id][0]
        n.iconVisible = dict_old_value[n.id][1]
      })
      redrawAndRefresh()
    }
    // Save undo/redo in data history
    new_data_plus.history.saveUndo(inv_setIllustrationVisibilityToNone)
    new_data_plus.history.saveRedo(_setIllustrationVisibilityToNone)
    // Execute original attr mutation
    _setIllustrationVisibilityToNone()
  }

  /**
   *Update image of selected nodes & save it's undo
   *
   *
   */
  const updateNodeImageVisibility = () => {
    const dict_old_value: { [x: string]: [boolean, boolean] } = {}
    selected_nodes.forEach(n => {
      dict_old_value[n.id] = [n.is_image, n.iconVisible]
    })
    const _updateNodeImageVisibility = () => {
      selected_nodes.forEach(n => {
        n.is_image = true
        n.iconVisible = false

      })
      redrawAndRefresh()
    }

    const inv_updateNodeImageVisibility = () => {
      selected_nodes.forEach(n => {
        n.is_image = dict_old_value[n.id][0]
        n.iconVisible = dict_old_value[n.id][1]
      })
      redrawAndRefresh()
    }
    // Save undo/redo in data history
    new_data_plus.history.saveUndo(inv_updateNodeImageVisibility)
    new_data_plus.history.saveRedo(_updateNodeImageVisibility)
    // Execute original attr mutation
    _updateNodeImageVisibility()
  }

  /**
   *Update image source of selected nodes & save it's undo
   *
   * @param {string} _
   */
  const updateNodeImageSrc = (_: string) => {
    const dict_old_value: { [x: string]: string } = {}
    selected_nodes.forEach(n => {
      dict_old_value[n.id] = n.image_src
    })
    const _updateNodeImageSrc = () => {
      selected_nodes.forEach(n => {
        n.image_src = _
      })
      redrawAndRefresh()
    }

    const inv_updateNodeImageSrc = () => {
      selected_nodes.forEach(n => {
        n.image_src = dict_old_value[n.id]
      })
      redrawAndRefresh()
    }
    // Save undo/redo in data history
    new_data_plus.history.saveUndo(inv_updateNodeImageSrc)
    new_data_plus.history.saveRedo(_updateNodeImageSrc)
    // Execute original attr mutation
    _updateNodeImageSrc()
  }

  /**
   *Delete image of selected nodes & save it's undo
   *
   *
   */
  const resetNodeImageSrc = () => {
    const dict_old_value: { [x: string]: string } = {}
    selected_nodes.forEach(n => {
      dict_old_value[n.id] = n.image_src
    })
    const _resetNodeImageSrc = () => {
      selected_nodes.forEach(n => {
        n.image_src = ''
      })
      redrawAndRefresh()
    }

    const inv_resetNodeImageSrc = () => {
      selected_nodes.forEach(n => {
        n.image_src = dict_old_value[n.id]
      })
      redrawAndRefresh()
    }
    // Save undo/redo in data history
    new_data_plus.history.saveUndo(inv_resetNodeImageSrc)
    new_data_plus.history.saveRedo(_resetNodeImageSrc)
    // Execute original attr mutation
    _resetNodeImageSrc()
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
                {new_data_plus.icon_library.icon_open_modal_icon}
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
              <OSTooltip label={!new_data_plus.has_sankey_plus ? t('Menu.sankeyOSPDisabled') : ''}>
                <Box>
                  <OSColorPicker
                    isDisabled={new_data_plus.has_sankey_plus}
                    initialColor={(selected_nodes.length === 1) ?
                      selected_nodes[0].iconColor :
                      '#ffffff'}
                    functionOnBlur={(new_color) => {
                      updateNodeIconColor(new_color)
                    }}
                  />
                </Box>
                </OSTooltip>
                <Button
                  //Si la valeur est a true alors la couleur des noeuds reste celle sélectionné loreque que l'on affiche les flux celon leur étiquettes
                  variant={
                    (selected_nodes.length === 1 && selected_nodes[0].iconColorSustainable) ?
                      'menuconfigpanel_option_button_activated' :
                      'menuconfigpanel_option_button'}
                  onClick={() => {
                    let value = false
                    value = selected_nodes[0]?.iconColorSustainable ?? ''
                    updateNodeIconColorSustainable(value)
                  }}
                >
                  {(selected_nodes.length === 1 && selected_nodes[0].iconColorSustainable) ? icon_locked : icon_unlocked}
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
                {icon_import_file_image}
              </Button>
              <Button
                variant='menuconfigpanel_option_button_right'
                onClick={resetNodeImageSrc}
              >
                {new_data_plus.icon_library.icon_delete}
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
                    updateNodeImageSrc(res as string)
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
  const content_component = <Box layerStyle='menu_sub_section' >
    <Box as='span' layerStyle='menu_sub_section_title' >
      <Checkbox
        variant='menuconfigpanel_part_title_1_checkbox'
        icon={<CustomFaEyeCheckIcon />}
        isChecked={button_icon_or_image !== 'none'}
        onChange={(evt) => {
          if (evt.target.checked)
            updateNodeIconVisibility()
          else
            setIllustrationVisibilityToNone()
        }}
      >
        <OSTooltip label={t('Noeud.apparence.tooltips.Visibilité')}>
          {t('Noeud.illustration')}
        </OSTooltip>
      </Checkbox>
    </Box>
    {button_icon_or_image !== 'none' ? <>
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
            layerStyle='options_2cols'
          >
            <Button
              variant={
                button_icon_or_image !== 'icon' ?
                  'menuconfigpanel_option_button_center' :
                  'menuconfigpanel_option_button_activated_center'
              }
              isDisabled={!is_activated}
              onClick={updateNodeIconVisibility}
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
              onClick={updateNodeImageVisibility}
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
    </> : <></>}
  </Box>
  return content_component
}

export const NodeHyperLinkOSP: FunctionComponent<FCType_NodeHyperLinkOSP> = ({
  new_data_plus,
}) => {
  const { drawing_area, t, menu_configuration } = new_data_plus
  const selected_nodes = drawing_area.selected_nodes_list
  const is_activated = new_data_plus.has_sankey_plus

  const [, setCount] = useState(0)
  menu_configuration.ref_to_node_hyperlink_updater.current = () => setCount(a => a + 1)
  if (selected_nodes.length == 0)
    return <></>

  const hasHyperLink = () => {
    let visible = ''
    visible = selected_nodes[0]?.hyperlink ?? ''
    return visible
  }

  const updateHyperlinkValue = (_: string) => {
    const dict_old_value: { [x: string]: string } = {}
    selected_nodes.forEach(n => {
      dict_old_value[n.id] = n.hyperlink
    })
    const _updateHyperlinkValue = () => {
      selected_nodes.forEach(n => {
        n.hyperlink = _
      })
      setCount(a => a + 1)

    }

    const inv_updateHyperlinkValue = () => {
      selected_nodes.forEach(n => {
        n.hyperlink = dict_old_value[n.id]
      })
      setCount(a => a + 1)
    }
    // Save undo/redo in data history
    new_data_plus.history.saveUndo(inv_updateHyperlinkValue)
    new_data_plus.history.saveRedo(_updateHyperlinkValue)
    // Execute original attr mutation
    _updateHyperlinkValue()
  }

  const node_hyperlink = hasHyperLink()
  // const data_plus = data as OSPData
  const content_image_tab = selected_nodes.length > 0 ?
    <Box
      layerStyle='menuconfigpanel_grid'
    >
      <OSTooltip label={!is_activated ? t('Menu.sankeyOSPDisabled') : ''} >

        <Box
          layerStyle='menuconfigpanel_grid'
        >
          <InputGroup
            variant='menuconfigpanel_option_input'
          >
            <Input
              placeholder={node_hyperlink}
              isDisabled={!is_activated}
              onChange={(evt) => {
                updateHyperlinkValue(evt.target.value)
              }}
            />
            <InputRightElement >
              <Button
                variant='menuconfigpanel_option_button'
                onClick={() => {
                  window.open(node_hyperlink)
                }}
              >
                {new_data_plus.icon_library.icon_popup_menu}
              </Button>
            </InputRightElement>
          </InputGroup>
        </Box>
      </OSTooltip>
    </Box> :
    <></>

  return <WrapperBoxSubSectionMenu new_data={new_data_plus} title={t('Noeud.HL')}>
    {content_image_tab}
  </WrapperBoxSubSectionMenu>

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
    rightIcon={new_data.icon_library.icon_popup_menu}
  >
    {t('Menu.Etiquettes')}
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
    rightIcon={new_data.icon_library.icon_popup_menu}
  >
    {t('Noeud.IS')}
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