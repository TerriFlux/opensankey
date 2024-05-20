import React, { FunctionComponent, useRef, useState } from 'react'
import {
  FaPlus,
  FaMinus,
  FaChevronDown,
} from 'react-icons/fa'

import {
  Box,
  Button,
  Input,
  InputGroup,
  Menu,
  MenuButton,
  MenuItem,
  MenuList
} from '@chakra-ui/react'

import {
  CutName,
  DefaultNodeStyle,
  DefaultLinkStyle
} from '../configmenus/SankeyUtils'
import { SankeyWrapperConfigInModalOrMenu } from '../configmenus/SankeyMenuConfigurationNodesAttributes'
import { MenuConfigurationLinksAppearence } from '../configmenus/SankeyMenuConfigurationLinksAppearence'
import { SankeyModalStyleLinkFType, SankeyModalStyleNodeFType } from './types/SankeyStyleTypes'
import { MenuDraggable } from '../topmenus/SankeyMenuTop'


export const SankeyModalStyleNode : FunctionComponent<SankeyModalStyleNodeFType> = ({
  applicationContext,
  dict_variable_application_data,
  dict_hook_ref_setter_show_dialog_components,
  ref_selected_style_node,
  ComponentUpdater,
  node_function,
  pointer_pos,
  node_attribute_tab
}) => {
  const { t } = applicationContext
  const { data } = dict_variable_application_data
  const { updateComponentMenuConfigNodeAppearence } = ComponentUpdater
  const { RedrawNodes } = node_function

  const [ forceUpdate, setForceUpdate ] = useState(false)
  const [ selected_style_node, set_selected_style_node ] = useState('default')
  ref_selected_style_node.current = selected_style_node
  if (data.style_node && !Object.keys(data.style_node).includes(selected_style_node)) {
    set_selected_style_node('default')
  }
  const ref_input_name= useRef<HTMLInputElement>(null)
  const content = <Box layerStyle='menuconfigpanel_grid'>
    <Box
      as='span'
      layerStyle='menustylepanel_row_droplist'
    >
      {/* Boutton pour ajouter un style */}
      <Button
        variant='menuconfigpanel_add_button'
        onClick={() => {
          const new_style = DefaultNodeStyle()
          new_style.name = 'New Style'
          const new_id = 'style_node_' + String(new Date().getTime())
          new_style.idNode=new_id
          data.style_node[new_id] = new_style
          updateComponentMenuConfigNodeAppearence.current()
          ref_selected_style_node.current = new_style.idNode
          set_selected_style_node(new_style.idNode)
          setForceUpdate(!forceUpdate)
          ref_input_name.current!.value=data.style_node[new_id].name

        }}>
        <FaPlus/>
      </Button>

      {/* Liste déroulante pour selectionner un style */}
      <Menu>
        <MenuButton
          as={Button}
          variant='menuconfigpanel_option_button'
          rightIcon={<FaChevronDown />}>
          {
            (selected_style_node !== '') ?
              CutName(data.style_node[selected_style_node].name, 30) :
              'Choix Style'
          }
        </MenuButton>
        <MenuList>
          {
            Object
              .keys(data.style_node)
              .map((d,i) => {
                return (
                  <MenuItem
                    key={i}
                    onClick={() => {
                      ref_selected_style_node.current = d
                      set_selected_style_node(d)
                      ref_input_name.current!.value=data.style_node[d].name
                      setForceUpdate(!forceUpdate)
                    }}
                  >
                    {data.style_node[d].name}
                  </MenuItem>)
              })
          }
        </MenuList>
      </Menu>

      {/* Boutton pour supprimer le noeud selectionné */}
      <Button
        variant='menuconfigpanel_del_button'
        isDisabled={(selected_style_node === 'default')}
        onClick={() => {
          Object.values(data.nodes).filter(n=>n.style==selected_style_node).forEach(n=>n.style='default')
          delete data.style_node[selected_style_node]
          const new_style=(Object.keys(data.style_node).length > 0) ? Object.keys(data.style_node)[0] : ''
          set_selected_style_node(new_style)
          ref_selected_style_node.current=new_style
          updateComponentMenuConfigNodeAppearence.current()
          RedrawNodes(Object.values(dict_variable_application_data.display_nodes))
          ComponentUpdater.updateComponenSaveInCache.current(false)
          setForceUpdate(!forceUpdate)
        }}
      >
        <FaMinus />
      </Button>
    </Box>

    <Box
      as='span'
      layerStyle='menuconfigpanel_row_2cols'
      gridTemplateColumns='1fr 7fr'
    >
      <Box
        layerStyle='menuconfigpanel_option_name'
        textStyle='h3'
      >
        {t('Menu.ns')}
      </Box>
      <Box>
        <InputGroup
          variant='menuconfigpanel_option_input'
        >
          <Input
            variant='menuconfigpanel_option_input'
            disabled={(selected_style_node === 'default')? true: false}
            ref={ref_input_name}
            defaultValue={data.style_node[selected_style_node].name}
            onBlur={() => {
              data.style_node[selected_style_node].name = ref_input_name.current?.value??''
              setForceUpdate(!forceUpdate)
              updateComponentMenuConfigNodeAppearence.current()
              ComponentUpdater.updateComponenSaveInCache.current(false)
            }}
          />
        </InputGroup>
      </Box>
    </Box>

    {
      <SankeyWrapperConfigInModalOrMenu
        menu_to_wrap = {node_attribute_tab}
        for_modal = {true}
        idTab={'node_attr'}
      />
    }
  </Box>

  return MenuDraggable(
    dict_hook_ref_setter_show_dialog_components,
    'ref_setter_show_style_node',
    content,pointer_pos,
    t('Menu.esn')
  )
}


//Modal et fonctions pour l'edition et affectation des style de flux
export const SankeyModalStyleLink : FunctionComponent<SankeyModalStyleLinkFType>= ({
  applicationContext,
  dict_variable_application_data,
  dict_variable_elements_selected,
  dict_hook_ref_setter_show_dialog_components,
  pointer_pos,
  additional_link_appearence_items,
  link_function,
  ComponentUpdater
}) => {
  const {data}=dict_variable_application_data
  const {t}=applicationContext
  const {ref_selected_style_link}=dict_variable_elements_selected
  const {updateComponentMenuConfigLink}=ComponentUpdater

  const [selected_style_link,set_selected_style_link] = useState('default')
  const [forceUpdate,setForceUpdate]=useState(false)
  const ref_input_name= useRef<HTMLInputElement>(null)
  ref_selected_style_link.current = selected_style_link

  if(data.style_link && !Object.keys(data.style_link).includes(selected_style_link)) {
    // Protection if style is not existing (issue with old files)
    set_selected_style_link('default')
  }

  const content= <Box layerStyle='menuconfigpanel_grid'>
    <Box
      as='span'
      layerStyle='menustylepanel_row_droplist'
    >
      {/* Boutton pour ajouter un style */}
      <Button
        variant='menuconfigpanel_add_button'
        onClick={() => {
          const new_style = DefaultLinkStyle()
          new_style.name = 'New Style'
          const new_id = 'style_link_' + String(new Date().getTime())
          new_style.idLink = new_id
          data.style_link[new_id] = new_style
          setForceUpdate(!forceUpdate)
          updateComponentMenuConfigLink.current()
          set_selected_style_link(new_style.idLink)
          ref_input_name.current!.value=data.style_link[new_id].name
        }}>
        <FaPlus/>
      </Button>

      {/* Liste déroulante pour selectionner un style */}
      <Menu>
        <MenuButton
          as={Button}
          variant='menuconfigpanel_option_button'
          rightIcon={<FaChevronDown />}>
          {
            (selected_style_link !== '') ?
              CutName(data.style_link[selected_style_link].name, 30) :
              'Choix Style'
          }
        </MenuButton>
        <MenuList>
          {
            Object
              .keys(data.style_link)
              .map((d,i) => 
                <MenuItem
                  key={i}
                  onClick={() => {
                      ref_input_name.current!.value=data.style_link[d].name
                      set_selected_style_link(d)
                  }}
                >
                  {data.style_link[d].name}
                </MenuItem>
              )
          }
        </MenuList>
      </Menu>

      {/* Boutton pour supprimer le noeud selectionné */}
      <Button
        variant='menuconfigpanel_del_button'
        isDisabled={(selected_style_link === 'default')}
        onClick={ () => {
          Object.values(data.links).filter(l=>l.style==selected_style_link).forEach(l=>l.style='default')
          delete data.style_link[selected_style_link]
          set_selected_style_link('default')
          ref_selected_style_link.current='default'
          setForceUpdate(!forceUpdate)
          updateComponentMenuConfigLink.current()
          link_function.RedrawLinks(Object.values(dict_variable_application_data.display_links))
        }}
      >
        <FaMinus />
      </Button>
    </Box>

    <Box
      as='span'
      layerStyle='menuconfigpanel_row_2cols'
      gridTemplateColumns='1fr 7fr'
    >
      <Box
        layerStyle='menuconfigpanel_option_name'
        textStyle='h3'
      >
        {t('Menu.ns')}
      </Box>
      <Box>
        <InputGroup variant='menuconfigpanel_option_input' >
          <Input
            ref={ref_input_name}
            variant='menuconfigpanel_option_input'
            disabled={(selected_style_link === 'default')? true: false}
            defaultValue={
              (selected_style_link !== '') ? data.style_link[selected_style_link].name : ''
            }
            onBlur={() => {
              data.style_link[selected_style_link].name = ref_input_name.current?.value??''
              setForceUpdate(!forceUpdate)
              updateComponentMenuConfigLink.current()
            }}
          />
        </InputGroup>
      </Box>
    </Box>

    {
      <MenuConfigurationLinksAppearence
        dict_variable_application_data={dict_variable_application_data}
        dict_variable_elements_selected={dict_variable_elements_selected}
        applicationContext={applicationContext}
        additional_link_appearence_items={additional_link_appearence_items}
        menu_for_style={true}
        link_function={link_function}
        ComponentUpdater={ComponentUpdater}
      />
    }
  </Box>

  return MenuDraggable(
    dict_hook_ref_setter_show_dialog_components,
    'ref_setter_show_style_link',
    content,pointer_pos,
    t('Menu.esf')
  )
}
