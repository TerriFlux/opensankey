// External lib
import React, { ChangeEvent, useState, useRef, FunctionComponent } from 'react'

import {
  FaEyeSlash,
  FaFileImport,
  FaLock,
  FaLockOpen
} from 'react-icons/fa'
import {
  Box,
  Button,
  Checkbox,
  TabPanel,
  Input,
  InputGroup
} from '@chakra-ui/react'
import { faIcons, faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDeleteLeft } from '@fortawesome/free-solid-svg-icons'

// Local imports
import {
  FCType_ButtonNodeContextShowTagMenu,
  FCType_NodeHyperLinkOSP,
  FCType_NodeIconOSP
} from './types/SankeyPlusNodesTypes'

// OpenSankey ts-code
import {
  isAttributeOverloaded
} from '../../deps/OpenSankey/Elements/Node'
import {
  default_shape_visible
} from '../../deps/OpenSankey/Elements/NodeAttributes'
import {
  OSTooltip,
  TooltipValueSurcharge
} from '../../deps/OpenSankey/types/Utils'
import {
  icon_open_modal
} from '../../deps/OpenSankey/components/dialogs/SankeyMenuContextNode'



declare const window: Window &
  typeof globalThis & {
    SankeyToolsStatic: boolean
  }

export const NodeIconOSP: FunctionComponent<FCType_NodeIconOSP> = ({
  new_data_plus,
  menu_for_modal,
}) => {
  const { t } = new_data_plus
  const is_activated = new_data_plus.has_sankey_plus
  const [show_menu_node_icon, set_show_menu_node_icon] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(false)
  const selected_nodes = new_data_plus.drawing_area.selected_nodes_list
  new_data_plus.menu_configuration.dict_setter_show_dialog_plus.ref_setter_show_menu_node_icon.current = set_show_menu_node_icon
  new_data_plus.menu_configuration.ref_to_menu_config_node_icon_updater.current = () => setForceUpdate(b => !b)

  // Update this component & component node appareance because we modify shape visibility
  const redrawAndRefresh = () => {
    new_data_plus.menu_configuration.updateComponentRelatedToNodesApparence()
    selected_nodes.forEach(zdt => zdt.draw())
  }

  const _load_image = useRef<HTMLInputElement>(null)

  const isAllNodeVisible = (selected_nodes[0]?.shape_visible ?? default_shape_visible)

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
   *Update visibility of selected nodes & save it's undo
   *
   * @param {boolean} _
   */
  const updateNodeShapeVisibility = (_: boolean) => {
    const dict_old_value: { [x: string]: boolean } = {}
    selected_nodes.forEach(n => {
      dict_old_value[n.id] = n.shape_visible
    })
    const _updateNodeShapeVisibility = () => {
      selected_nodes.forEach(n => {
        n.shape_visible = _

      })
      redrawAndRefresh()
    }

    const inv_updateNodeShapeVisibility = () => {
      selected_nodes.forEach(n => {
        n.shape_visible = dict_old_value[n.id]
      })
      redrawAndRefresh()
    }
    // Save undo/redo in data history
    new_data_plus.history.saveUndo(inv_updateNodeShapeVisibility)
    new_data_plus.history.saveRedo(_updateNodeShapeVisibility)
    // Execute original attr mutation
    _updateNodeShapeVisibility()
  }

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
                <FontAwesomeIcon icon={faIcons} />
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
              <Input
                variant='menuconfigpanel_option_input_color'
                type='color'
                value={
                  (selected_nodes.length === 1) ?
                    selected_nodes[0].iconColor :
                    '#ffffff'
                }
                onChange={evt => {
                  const color = evt.target.value
                  updateNodeIconColor(color)
                }}
              />
              <Button
                //Si la valeur est a true alors la couleur des noeuds reste celle sélectionné loreque que l'on affiche les flux celon leur étiquettes
                variant={
                  (selected_nodes.length === 1) ?
                    'menuconfigpanel_option_button_activated' :
                    'menuconfigpanel_option_button'}
                onClick={() => {
                  let value = false
                  value = selected_nodes[0]?.iconColorSustainable ?? ''
                  updateNodeIconColorSustainable(value)
                }}
              >
                {(selected_nodes.length === 1 && selected_nodes[0].iconColorSustainable) ? <FaLock /> : <FaLockOpen />}
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
                <FaFileImport />
              </Button>
              <Button
                variant='menuconfigpanel_option_button_right'
                onClick={resetNodeImageSrc}
              >
                <FontAwesomeIcon icon={faDeleteLeft} />
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
  const content_tab = <Box
    layerStyle='menuconfigpanel_grid'
  >
    {/* Visibilite du noeud */}

    <Checkbox
      variant='menuconfigpanel_option_checkbox'
      // isIndeterminate={isAllNodeVisible[1]}
      isChecked={isAllNodeVisible}
      onChange={(evt) => updateNodeShapeVisibility(evt.target.checked)}
    >
      <OSTooltip label={t('Noeud.apparence.tooltips.Visibilité')} >
        {t('Noeud.apparence.Visibilité')}
      </OSTooltip>
      {
        isAttributeOverloaded(selected_nodes, 'shape_visible') ?
          TooltipValueSurcharge('node_var', t) :
          <></>
      }
    </Checkbox>

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
          layerStyle='options_3cols'
        >
          <Button
            variant={
              button_icon_or_image !== 'none' ?
                'menuconfigpanel_option_button_left' :
                'menuconfigpanel_option_button_activated_left'
            }
            isDisabled={!is_activated}
            onClick={setIllustrationVisibilityToNone}
          >
            <FaEyeSlash />
          </Button>
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

  </Box>

  if (menu_for_modal && !show_menu_node_icon) {
    return [<></>]
  }
  if (menu_for_modal && show_menu_node_icon) {
    return [content_tab]
  }

  return <TabPanel>
    {content_tab}
  </TabPanel>
}

export const NodeHyperLinkOSP: FunctionComponent<FCType_NodeHyperLinkOSP> = ({
  new_data_plus,
  is_activated,
}) => {
  const { drawing_area, t } = new_data_plus
  const selected_nodes = drawing_area.selected_nodes_list

  const [, setCount] = useState(0)

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
          as='span'
          layerStyle='menuconfigpanel_row_2cols'
        >
          <Box
            as='span'
            layerStyle='menuconfigpanel_option_name'
          >
            {t('Noeud.HL')}
          </Box>
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
          </InputGroup>
        </Box>
      </OSTooltip>

      {/* Open Hyperlink */}
      <OSTooltip label={!is_activated ? t('Menu.sankeyOSPDisabled') : ''} >
        <Box
          as='span'
          layerStyle='menuconfigpanel_row_2cols'
        >
          <Box
            as='span'
            layerStyle='menuconfigpanel_option_name'
          >
            {t('Noeud.open_HL')}
          </Box>
          <Button
            variant='menuconfigpanel_option_button'
            onClick={() => {
              window.open(node_hyperlink)
            }}
          >
            <FontAwesomeIcon icon={faUpRightFromSquare} />
          </Button>
        </Box>
      </OSTooltip>
    </Box> :
    <></>

  return <TabPanel>
    {content_image_tab}
  </TabPanel>
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
  >
    {t('Menu.Etiquettes')}
    {icon_open_modal}
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
  >
    {t('Noeud.IS')}
    {icon_open_modal}
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