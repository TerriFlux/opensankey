import React, { FunctionComponent } from 'react'
import { ContextMenuLinkFType } from './types/SankeyMenuContextLinkTypes'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import { Box, Button, ButtonGroup, Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/react'
import { ChevronRightIcon } from '@chakra-ui/icons'
import { ConfigLinkDataNumberInput } from '../configmenus/SankeyMenuConfigurationLinksData'
import { useBoolean } from '@chakra-ui/react'



// TODO re implement file with class

const icon_open_modal = <FontAwesomeIcon style={{ float: 'right' }} icon={faUpRightFromSquare} />
const sep = <hr style={{ borderStyle: 'none', margin: '0px', color: 'grey', backgroundColor: 'grey', height: 2 }} />
const checked = (b: boolean) => <span style={{ float: 'right' }}>{b ? '✓' : ''}</span>

export const ContextMenuLink: FunctionComponent<ContextMenuLinkFType> = ({
  applicationContext,
  applicationData,
  dict_hook_ref_setter_show_dialog_components,
  ComponentUpdater
}) => {
  const [,setForceUpdate] = useBoolean()
  const { new_data} = applicationData
  const contextualised_link = new_data.drawing_area.link_contextualied
  const { t } = applicationContext
  const indicateSankeyToSaveInCache=()=>new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
  new_data.menu_configuration.update_components_menu_context_link.current=setForceUpdate.toggle
  const list_select_links = new_data.drawing_area.selected_links_list


  let style_c_l = '0px 0px auto auto'
  let is_top = true
  let pos_x = new_data.drawing_area.pointer_pos[0]
  let pos_y = new_data.drawing_area.pointer_pos[1]

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

  const context_link_label_visible = contextualised_link !== undefined ? contextualised_link.value_label_is_visible : false

  const has_flux_tags = Object.values(new_data.drawing_area.sankey.flux_taggs_dict).length > 0
  // Menu to change some pararmeter concerning the appearence of the node
  const dropdown_c_l_tag = (contextualised_link !== undefined && has_flux_tags) && has_flux_tags ? <Menu placement='end'>
    <MenuButton variant='contextmenu_button' as={Button} rightIcon={<ChevronRightIcon />} className="dropdown-basic">
      {t('Menu.Transformation.tagFlux_assign')}
    </MenuButton>

    <MenuList  >
      {Object.entries(new_data.drawing_area.sankey.flux_taggs_dict).filter(nt => Object.keys(nt[1].tags_dict).length > 0).map(nt => {
        return <Menu placement='end'>
          <MenuButton variant='contextmenu_button' as={Button} rightIcon={<ChevronRightIcon />} className="dropdown-basic">
            {nt[1].name}
          </MenuButton>
          <MenuList>
            {Object.values(nt[1].tags_dict).map(t => {
              // TODO reimplement file with class
              const has_tag = contextualised_link.hasGivenTag(t)

              return <MenuItem onClick={() => {
                // Assign tag to selected links
                if(has_tag){
                  list_select_links.forEach(l=>{
                    l.addTag(t)
                  })
                }else{
                  list_select_links.forEach(l=>{
                    l.removeTag(t)
                  })
                }
              }}>
                {t.name}{checked(has_tag)}
              </MenuItem>
            })}
          </MenuList>
        </Menu>
      })}

    </MenuList>
  </Menu> : <></>


  const button_open_link_appearence = contextualised_link !== undefined ? <Button onClick={() => {
    dict_hook_ref_setter_show_dialog_components.ref_setter_show_menu_link_appearence.current(true)
    new_data.drawing_area.link_contextualied=undefined
  }} variant='contextmenu_button'>{t('Flux.apparence.apparence')} {icon_open_modal}</Button> : <></>

  // Menu to change some pararmeter concerning the style of the node
  const dropdown_c_l_style_select = contextualised_link !== undefined ? <Menu placement='end'>
    <MenuButton variant='contextmenu_button' as={Button} rightIcon={<ChevronRightIcon />} className="dropdown-basic">
      {t('Noeud.SelectStyle')}
    </MenuButton>
    <MenuList >
      {
        new_data.drawing_area.sankey.link_styles_list.map(sl => {
          return <MenuItem onClick={() => {
            contextualised_link!.style = sl
          }}>
            {sl.name}
            {checked((contextualised_link?.style ?? '') == sl)}
          </MenuItem>
        })
      }
    </MenuList>
  </Menu> : <></>

  // Selector of style (we can also reset local link attribute) 
  const dropdown_c_l_style = contextualised_link !== undefined ? <Menu placement='end'>
    <MenuButton variant='contextmenu_button' as={Button} rightIcon={<ChevronRightIcon />} className="dropdown-basic">
      {t('Noeud.editStyle')}
    </MenuButton>
    <MenuList >
      <MenuItem as={Button} variant='contextmenu_button' onClick={() => {
        list_select_links.forEach(l => l.resetAttributes())
        indicateSankeyToSaveInCache()
      }}>{t('Noeud.AS')}</MenuItem>
      {dropdown_c_l_style_select}
    </MenuList>
  </Menu> : <></>


  // TODO : When we can choose order of link between one another re-implement this function (handleDownLink,handleUpLink,handleToBottomLink,handleToTopLink, )
  // const dropdown_c_l_layout = contextualised_link !== undefined ? <Menu placement='end'>
  //   <MenuButton variant='contextmenu_button' as={Button} rightIcon={<ChevronRightIcon />} className="dropdown-basic">
  //     {t('Flux.layout')}
  //   </MenuButton>
  //   <MenuList >

  //     <MenuItem onClick={() => {
  //       multi_selected_links.current.map(l => {
  //         const i = l.idLink
  //         const { links } = data
  //         const listElmt = Object.keys(links)
  //         const posElemt = listElmt.indexOf(i)
  //         listElmt.splice(posElemt, 1)
  //         listElmt.splice(listElmt.length, 0, i)
  //         const new_cat: { [key: string]: SankeyLink } = {}
  //         listElmt.forEach(elt => {
  //           new_cat[elt] = links[elt]
  //         })
  //         for (const member in links) delete links[member]
  //         Object.assign(links, new_cat)
  //       })
  //       remake_display_links()
  //     }}>{t('Flux.layoutTop')}</MenuItem>

  //     <MenuItem onClick={() => {
  //       multi_selected_links.current.forEach(n => handleDownLink(data, n.idLink))
  //       remake_display_links()
  //     }}>{t('Flux.layoutUp')}</MenuItem>

  //     <MenuItem onClick={() => {
  //       multi_selected_links.current.forEach(n => handleUpLink(data, n.idLink))
  //       remake_display_links()
  //     }}>{t('Flux.layoutDown')}</MenuItem>

  //     <MenuItem onClick={() => {
  //       multi_selected_links.current.map(l => {
  //         const i = l.idLink
  //         const { links } = data
  //         const listElmt = Object.keys(links)
  //         const posElemt = listElmt.indexOf(i)
  //         listElmt.splice(posElemt, 1)
  //         listElmt.splice(0, 0, i)
  //         const new_cat: { [key: string]: SankeyLink } = {}
  //         listElmt.forEach(elt => {
  //           new_cat[elt] = links[elt]
  //         })
  //         for (const member in links) delete links[member]
  //         Object.assign(links, new_cat)
  //       })
  //       remake_display_links()
  //     }}>{t('Flux.layoutBottom')}</MenuItem>

  //   </MenuList>
  // </Menu> : <></>

  const button_open_link_data = contextualised_link !== undefined ? <Button onClick={() => {
    dict_hook_ref_setter_show_dialog_components.ref_setter_show_menu_link_data.current(true)
    new_data.drawing_area.link_contextualied=undefined
  }} variant='contextmenu_button'>{t('Flux.data.données')} {icon_open_modal}</Button> : <></>

  const button_mask_link_label = contextualised_link !== undefined ? <Button onClick={() => {

    list_select_links.forEach(link=>{
      link.value_label_is_visible=!context_link_label_visible
    })
    setForceUpdate.toggle()
    indicateSankeyToSaveInCache()
  }} variant='light'>{context_link_label_visible?t('Flux.apparence.hide_link_lab'):t('Flux.apparence.display_link_lab')}</Button>:<></>

  const button_open_link_tooltip = contextualised_link !== undefined ? <Button onClick={() => {
    dict_hook_ref_setter_show_dialog_components.ref_setter_show_menu_link_tooltip.current(true)
    new_data.drawing_area.link_contextualied=undefined
  }} variant='contextmenu_button'>{t('Flux.IS')} {icon_open_modal}</Button> : <></>

  const btn_l_show_tags_menu = <Button onClick={() => {
    dict_hook_ref_setter_show_dialog_components.ref_setter_show_menu_link_tags.current(true)
    new_data.drawing_area.link_contextualied=undefined
  }} variant='contextmenu_button'>{t('Menu.Etiquettes')} {icon_open_modal}</Button>


  // Inverse source & target of the link
  const btn_edit_value = contextualised_link !== undefined ? <Menu placement='end'>
    <MenuButton variant='contextmenu_button' as={Button} rightIcon={<ChevronRightIcon />} className="dropdown-basic">{t('Flux.data.edit_value')}</MenuButton>
    <MenuList>
      <ConfigLinkDataNumberInput
        applicationData={applicationData}
        ComponentUpdater={ComponentUpdater}
      />
    </MenuList>
  </Menu> : <></>
  const btn_inverse_io = <Button variant='contextmenu_button'
    onClick={() => {
     
      list_select_links.forEach(l=>l.inverse())
      indicateSankeyToSaveInCache()

    }}>{t('Flux.if')}</Button>

  // Box that serve as context menu
  return contextualised_link !== undefined ? <Box layerStyle='context_menu'
    id="context_link_pop_over"
    className={'context_popover ' + (is_top ? '' : 'at_bot')}
    style={{ maxWidth: '100%', position: 'absolute', inset: style_c_l }}>
    <ButtonGroup orientation='vertical' isAttached>
      {btn_inverse_io}
      {sep}
      {dropdown_c_l_style}
      {sep}
      {/* {dropdown_c_l_layout} TODO decomment when link zindex re-implemented with classes */}
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