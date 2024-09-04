import React, { FunctionComponent, useState } from 'react'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'

import {
  Box,
  Button,
  ButtonGroup,
  Menu,
  MenuButton,
  MenuItem,
  MenuList
} from '@chakra-ui/react'
import { ChevronRightIcon } from '@chakra-ui/icons'

/*************************************************************************************************/

import { ContextMenuLinkFType } from './types/SankeyMenuContextLinkTypes'
import { MenuContextLinksData } from '../configmenus/SankeyMenuConfigurationLinksData'

/*************************************************************************************************/

const icon_open_modal = <FontAwesomeIcon style={{ float: 'right' }} icon={faUpRightFromSquare} />
const sep = <hr style={{ borderStyle: 'none', margin: '0px', color: 'grey', backgroundColor: 'grey', height: 2 }} />
const checked = (b: boolean) => <span style={{ float: 'right' }}>{b ? '✓' : ''}</span>

// MENU COMPONENT ***********************************************************************

export const ContextMenuLink: FunctionComponent<ContextMenuLinkFType> = ({
  applicationData,
}) => {

  // Datas ------------------------------------------------------------------------------

  const { new_data } = applicationData
  const { t } = new_data
  const { ref_setter_show_menu_link_appearence, ref_setter_show_menu_link_data, ref_setter_show_menu_link_tooltip, ref_setter_show_menu_link_tags
  } = new_data.menu_configuration.dict_setter_show_dialog
  // Link on which this menu applies ----------------------------------------------------

  const contextualised_link = new_data.drawing_area.link_contextualised

  let style_c_l = '0px 0px auto auto'
  let is_top = true
  let pos_x = new_data.drawing_area.pointer_pos[0]
  let pos_y = new_data.drawing_area.pointer_pos[1]

  const context_link_label_visible = (contextualised_link !== undefined) ? contextualised_link.value_label_is_visible : false

  // The limit value of the mouse position that engages the shift of the context menu
  // is arbitrary and taken by hand because it is not possible to know the dimensions of the menu before it is render
  if (contextualised_link) {
    if (new_data.drawing_area.pointer_pos[0] + 240 > window.innerWidth) {
      pos_x = new_data.drawing_area.pointer_pos[0] - 245
    }

    if (new_data.drawing_area.pointer_pos[1] + 360 > window.innerHeight) {
      pos_y = new_data.drawing_area.pointer_pos[1] - 340
      is_top = false
    }
    style_c_l = pos_y + 'px auto auto ' + pos_x + 'px'
  }

  const selected_links = new_data.drawing_area.visible_and_selected_links_list

  const has_flux_tags = Object.values(new_data.drawing_area.sankey.flux_taggs_dict).length > 0

  // Menu updaters ----------------------------------------------------------------------

  // Boolean used to force this component to reload
  const [, setCount] = useState(0)

  // Link this menu's update function
  new_data.menu_configuration.ref_to_menu_context_links_updater.current = ()=>setCount(a=>a+1)

  // Functions used to reset menu UI ----------------------------------------------------

  const refreshThisAndToggleSaving = () => {
    // Toogle saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    // Refresh this menu
    setCount(a=>a+1)
  }

  // JSX Components ---------------------------------------------------------------------

  // Menu to change some pararmeter concerning the appearence of the node
  const dropdown_c_l_tag = (
    (contextualised_link !== undefined) &&
    (has_flux_tags)
  ) ?
    <Menu placement='end'>
      <MenuButton
        variant='contextmenu_button'
        as={Button}
        rightIcon={<ChevronRightIcon />}
        className="dropdown-basic"
      >
        {t('Menu.Transformation.tagFlux_assign')}
      </MenuButton>

      <MenuList>
        {
          new_data.drawing_area.sankey.flux_taggs_list
            .filter(tagg => tagg.has_tags)
            .map((tagg, i) => {
              return <Menu key={i} placement='end'>
                <MenuButton
                  variant='contextmenu_button'
                  as={Button}
                  rightIcon={<ChevronRightIcon />}
                  className="dropdown-basic"
                >
                  {tagg.name}
                </MenuButton>
                <MenuList>
                  {
                    tagg.tags_list
                      .map(tag => {
                        const has_tag = contextualised_link.hasGivenTag(tag)
                        return <MenuItem
                          onClick={() => {
                            // Assign tag to selected links
                            if (has_tag) {
                              selected_links.forEach(l => l.addTag(tag))
                            }
                            else {
                              selected_links.forEach(l => l.removeTag(tag))
                            }
                            refreshThisAndToggleSaving()
                          }}
                        >
                          {t.name}
                          {checked(has_tag)}
                        </MenuItem>
                      })
                  }
                </MenuList>
              </Menu>
            })
        }
      </MenuList>
    </Menu> :
    <></>


  const button_open_link_appearence = (contextualised_link !== undefined) ?
    <Button
      onClick={() => {
        ref_setter_show_menu_link_appearence.current(true)
        new_data.drawing_area.link_contextualised = undefined
      }}
      variant='contextmenu_button'
    >
      {t('Flux.apparence.apparence')}
      {icon_open_modal}
    </Button> :
    <></>

  // Menu to change some pararmeter concerning the style of the node
  const dropdown_c_l_style_select = (contextualised_link !== undefined) ?
    <Menu placement='end'>
      <MenuButton
        variant='contextmenu_button'
        as={Button}
        rightIcon={<ChevronRightIcon />}
        className="dropdown-basic"
      >
        {t('Noeud.SelectStyle')}
      </MenuButton>
      <MenuList >
        {
          new_data.drawing_area.sankey.link_styles_list
            .map(sl => {
              return <MenuItem
                onClick={() => {
                  contextualised_link!.style = sl
                  refreshThisAndToggleSaving()
                }}
              >
                {sl.name}
                {checked((contextualised_link?.style ?? '') == sl)}
              </MenuItem>
            })
        }
      </MenuList>
    </Menu> :
    <></>

  // Selector of style (we can also reset local link attribute)
  const dropdown_c_l_style = (contextualised_link !== undefined) ?
    <Menu placement='end'>
      <MenuButton
        variant='contextmenu_button'
        as={Button}
        rightIcon={<ChevronRightIcon />}
        className="dropdown-basic"
      >
        {t('Noeud.editStyle')}
      </MenuButton>
      <MenuList >
        <MenuItem
          as={Button}
          variant='contextmenu_button'
          onClick={() => {
            selected_links.forEach(l => l.resetAttributes())
            refreshThisAndToggleSaving()
          }}
        >
          {t('Noeud.AS')}
        </MenuItem>
        {dropdown_c_l_style_select}
      </MenuList>
    </Menu> :
    <></>

  // Set stacking order of links
  const dropdown_c_l_layout = (contextualised_link !== undefined) ?
    <Menu placement='end'>
      <MenuButton
        variant='contextmenu_button'
        as={Button}
        rightIcon={<ChevronRightIcon />}
        className="dropdown-basic"
      >
        {t('Flux.layout')}
      </MenuButton>
      <MenuList >
        <MenuItem
          onClick={() => selected_links.forEach(l => l.setTopDisplayOrder())}
        >
          {t('Flux.layoutTop')}
        </MenuItem>

        <MenuItem
          onClick={() => selected_links.forEach(l => l.increaseDisplayOrder())}
        >
          {t('Flux.layoutUp')}
        </MenuItem>

        <MenuItem
          onClick={() => selected_links.forEach(l => l.decreaseDisplayOrder())}
        >
          {t('Flux.layoutDown')}
        </MenuItem>

        <MenuItem
          onClick={() => selected_links.forEach(l => l.setDownDisplayOrder())}
        >
          {t('Flux.layoutBottom')}
        </MenuItem>

      </MenuList>
    </Menu> : <></>

  const button_open_link_data = (contextualised_link !== undefined) ?
    <Button
      onClick={() => {
        ref_setter_show_menu_link_data.current(true)
        new_data.drawing_area.link_contextualised = undefined
      }}
      variant='contextmenu_button'
    >
      {t('Flux.data.données')}
      {icon_open_modal}
    </Button> :
    <></>

  const button_mask_link_label = (contextualised_link !== undefined) ?
    <Button onClick={() => {
      selected_links
        .forEach(link => {
          link.value_label_is_visible = !context_link_label_visible
        })
      refreshThisAndToggleSaving()
    }}
    variant='light'
    >
      {
        context_link_label_visible ?
          t('Flux.apparence.hide_link_lab') :
          t('Flux.apparence.display_link_lab')
      }
    </Button> :
    <></>

  const button_open_link_tooltip = (contextualised_link !== undefined) ?
    <Button
      onClick={() => {
        ref_setter_show_menu_link_tooltip.current(true)
        new_data.drawing_area.link_contextualised = undefined
      }}
      variant='contextmenu_button'
    >
      {t('Flux.IS')}
      {icon_open_modal}
    </Button> :
    <></>

  const btn_l_show_tags_menu = <Button
    onClick={() => {
      ref_setter_show_menu_link_tags.current(true)
      new_data.drawing_area.link_contextualised = undefined
    }}
    variant='contextmenu_button'
  >
    {t('Menu.Etiquettes')}
    {icon_open_modal}
  </Button>

  // Inverse source & target of the link
  const btn_edit_value = (contextualised_link !== undefined) ?
    <Menu placement='end'>
      <MenuButton
        variant='contextmenu_button'
        as={Button}
        rightIcon={<ChevronRightIcon />}
        className="dropdown-basic"
      >
        {t('Flux.data.edit_value')}
      </MenuButton>
      <MenuList>
        <MenuContextLinksData
          applicationData={applicationData}
        />
      </MenuList>
    </Menu> : <></>

  const btn_inverse_io = <Button
    variant='contextmenu_button'
    onClick={() => {
      selected_links.forEach(l => l.inverse())
      refreshThisAndToggleSaving()
    }}
  >
    {t('Flux.if')}
  </Button>

  // Box that serve as context menu
  return (contextualised_link !== undefined) ?
    <Box
      layerStyle='context_menu'
      id="context_link_pop_over"
      className={'context_popover ' + (is_top ? '' : 'at_bot')}
      style={{ maxWidth: '100%', position: 'absolute', inset: style_c_l }}
    >
      <ButtonGroup orientation='vertical' isAttached>
        {btn_inverse_io}
        {sep}
        {dropdown_c_l_style}
        {sep}
        {dropdown_c_l_layout}
        {button_mask_link_label}
        {btn_edit_value}
        {has_flux_tags && sep}
        {dropdown_c_l_tag}
        {sep}
        {button_open_link_data}
        {button_open_link_appearence}
        {btn_l_show_tags_menu}
        {button_open_link_tooltip}
      </ButtonGroup>
    </Box> : <></>
}