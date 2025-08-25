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
import React from 'react'
import { ChevronRightIcon } from '@chakra-ui/icons'
import {
  Button, Menu,
  MenuButton, MenuList, MenuGroup
} from '@chakra-ui/react'
import { Class_NodeDimension } from '../../Elements/NodeDimension'
import { Class_LevelTagGroup } from '../../types/TagGroup'
import { 
  aggregate, disaggregate, aggregationExpansion, disaggregationExpansion, EXPANSION_SUFFIXES, 
  contract, create_parent, set_child, applyDimension 
} from '../../Algorithms/Hierarchies'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { Class_NodeElement } from '../../Elements/Node'


const sep = <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />
// ============================================================================
// MENUS CONTEXTUELS
// ============================================================================

export const hierarchyEditionMenu = (
  new_data: Class_ApplicationData,
  contextualised_node: Class_NodeElement,
  selected_nodes: Class_NodeElement[],
  refreshThisAndToggleSaving: () => void
) => {
  const { t } = new_data

  const btn_create_flux_on_children = (
    (selected_nodes.length === 1) &&
    (contextualised_node !== undefined) &&
    (selected_nodes.includes(contextualised_node)) &&
    (contextualised_node.is_parent)
  ) ?
    <Button
      variant='contextmenu_button'
      onClick={() => {
        function addNewLinks(n: Class_NodeElement) {
          n.dimensions_as_parent.forEach(dim => {
            dim.children.forEach(c => {
              if (c.input_links_list.length === 0) {
                n.input_links_list.forEach(l => sankey.addNewLink(l.source, c as Class_NodeElement))
              }
              if (c.output_links_list.length === 0) {
                n.output_links_list.forEach(l => sankey.addNewLink(c as Class_NodeElement, l.target))
              }
            })
            dim.children.forEach(c => {
              addNewLinks(c as Class_NodeElement)
            })
          })
        }
        addNewLinks(contextualised_node)
        new_data.drawing_area.purgeSelection()
        new_data.drawing_area.node_contextualised = undefined
        new_data.drawing_area.areaAutoFit(false)
        refreshThisAndToggleSaving()
      }}
    >
      {t('Noeud.context_create_flux')}
    </Button> : <></>

  const sankey = new_data.drawing_area.sankey
  const expand_left = selected_nodes.length > 0 ? selected_nodes[0].output_links_list.length == 0 : true
  const input_or_output_attr = expand_left ? 'input_links_list' : 'output_links_list'
  const source_or_target_attr = expand_left ? 'source' : 'target'
  let possible_root_nodes: Set<string> = new Set
  selected_nodes.forEach(n => {
    if (possible_root_nodes.size !== 0) {
      possible_root_nodes = new Set(n[input_or_output_attr].map(l => l[source_or_target_attr].id)).intersection(possible_root_nodes)
    } else {
      possible_root_nodes = new Set(n[input_or_output_attr].map(l => l[source_or_target_attr].id))
    }
  })

  const btn_set_child_ok = [...possible_root_nodes].length > 0 && contextualised_node

  const btn_create_dim = <Button
    variant='contextmenu_button'
    onClick={() => {
      new_data.drawing_area.bypass_redraws = true

      const tagg_idx = sankey.level_taggs_list.length + 1
      const tagg = sankey.addLevelTagGroup('dimension_' + tagg_idx, 'Dimension ' + tagg_idx) as Class_LevelTagGroup
      tagg.activated = true
      tagg.addTag('1', '1')
      tagg.addTag('2', '2')
      const parent_level_tag = tagg.tags_list[0]
      const child_level_tag = tagg.tags_list[1]
      const root_node = sankey.nodes_dict[[...possible_root_nodes][0]]

      applyDimension(new_data,selected_nodes,parent_level_tag, root_node, child_level_tag, tagg,expand_left)
      tagg.tags_list[0].setSelected()
      new_data.menu_configuration.ref_to_leveltag_filter_updater.current()
      new_data.drawing_area.draw()
    }}
  >{'Nouvelle dimension'}</Button>

  return <Menu placement='end'>
    <MenuButton
      variant='contextmenu_button'
      as={Button}
      rightIcon={<ChevronRightIcon />}
      className="dropdown-basic"
    >
      {t('Menu.EditionHierarchy')}
    </MenuButton>
    <MenuList>
      {btn_create_flux_on_children}
      {btn_set_child_ok ? <Menu placement='end'>
        <MenuButton
          variant='contextmenu_button'
          as={Button}
          rightIcon={<ChevronRightIcon />}
          className="dropdown-basic"
        >
          {t('Noeud.context_set_child')}
        </MenuButton>

        <MenuList>
          {sankey.level_taggs_list.map((tagg, index) => <Button
            key={index}
            variant='contextmenu_button'
            onClick={() => {
              set_child(new_data, selected_nodes,possible_root_nodes, tagg as Class_LevelTagGroup,expand_left)
            }}
          >{tagg.name}</Button>)}
          {btn_create_dim}
        </MenuList></Menu> : <></>}
      <Menu placement='end'>
        <MenuButton
          variant='contextmenu_button'
          as={Button}
          rightIcon={<ChevronRightIcon />}
          className="dropdown-basic"
        >
          {t('Noeud.context_create_parent')}
        </MenuButton><MenuList>
          {sankey.level_taggs_list.map((tagg, index) => <Button
            key={index}
            variant='contextmenu_button'
            onClick={() => {
              create_parent(new_data, selected_nodes, tagg as Class_LevelTagGroup)
            }}
          >{tagg.name}</Button>)}
          {btn_create_dim}
        </MenuList></Menu>
    </MenuList>
  </Menu>
}

export const hierarchyManipulationMenu = (
  new_data: Class_ApplicationData,
  contextualised_node: Class_NodeElement,
  selected_nodes: Class_NodeElement[],
  refreshThisAndToggleSaving: () => void
) => {
  const { t } = new_data
  const parent_dims = (contextualised_node.master_node ? 
    contextualised_node.master_node.dimensions_as_parent_pure : 
    contextualised_node.dimensions_as_parent_pure) as Class_NodeDimension[]
  let child_dims = (contextualised_node.master_node ? 
    contextualised_node.master_node.dimensions_as_child_pure : 
    contextualised_node.dimensions_as_child_pure) as Class_NodeDimension[]
  const forced_dim = child_dims.filter(dim => dim.force_show_children)
  if (forced_dim.length > 0) {
    child_dims = forced_dim
  }

  const btn_aggregate = (dim: Class_NodeDimension) => {
    const b = (selected_nodes.length === 1) &&
      (contextualised_node !== undefined) &&
      (selected_nodes.includes(contextualised_node)) &&
      (contextualised_node.is_child)
      ?
      <Button
        variant='contextmenu_button'
        onClick={() => {
          aggregate(new_data, contextualised_node, dim.related_level_tagg as Class_LevelTagGroup)
          new_data.drawing_area.draw()
          new_data.drawing_area.purgeSelection()
          new_data.drawing_area.node_contextualised = undefined
          new_data.drawing_area.areaAutoFit(false)
          refreshThisAndToggleSaving()
        }}
      >
        {t('Noeud.context_agregate')}</Button> : <></>
    return b
  }

  const btn_desagregate = (dim: Class_NodeDimension) => {
    const b = contextualised_node.nodeDimensionAsParent(dim.related_level_tagg as Class_LevelTagGroup) ?
      <Button
        variant='contextmenu_button'
        onClick={() => {
          disaggregate(new_data, contextualised_node, dim.related_level_tagg as Class_LevelTagGroup)
          new_data.drawing_area.draw()
          new_data.drawing_area.purgeSelection()
          new_data.drawing_area.node_contextualised = undefined
          new_data.drawing_area.areaAutoFit(false)
          refreshThisAndToggleSaving()
        }}
      >{t('Noeud.context_desagregate')}</Button> : <></>
    return b
  }

  const menu_agregation = (dim: Class_NodeDimension) => <>
    {btn_aggregate(dim)}
      <Button
        variant='contextmenu_button'
        onClick={() => aggregationExpansion(new_data, contextualised_node, false, dim.related_level_tagg as Class_LevelTagGroup)}
      >
        {t('Noeud.context_agregate_right')}
      </Button>
    {/* {contextualised_node.master_node == undefined ? */}
      <Button
        variant='contextmenu_button'
        onClick={() => aggregationExpansion(new_data, contextualised_node, true, dim.related_level_tagg as Class_LevelTagGroup)}
      >
        {t('Noeud.context_agregate_left')}
      </Button>
  </>

  const menu_desagregation = (dim: Class_NodeDimension) => <>
    {btn_desagregate(dim)}
    <Button
      variant='contextmenu_button'
      onClick={() => disaggregationExpansion(new_data, contextualised_node, false, dim.related_level_tagg as Class_LevelTagGroup)}
    >
      {t('Noeud.context_expand_right')}
    </Button>
    <Button
      variant='contextmenu_button'
      onClick={() => disaggregationExpansion(new_data, contextualised_node, true, dim.related_level_tagg as Class_LevelTagGroup)}
    >
      {t('Noeud.context_expand_left')}
    </Button>
  </>

  return <Menu placement='end'>
    <MenuButton
      variant='contextmenu_button'
      as={Button}
      rightIcon={<ChevronRightIcon />}
      className="dropdown-basic"
    >
      {t('Menu.NavHierarchy')}
    </MenuButton>
    <MenuList>
      <MenuGroup title="Agrégation">
        {child_dims.length == 1 ? menu_agregation(child_dims[0]) : <>{child_dims.map((dim, index) => {
          return <Menu key={index} placement='end'>
            <MenuButton
              variant='contextmenu_button'
              as={Button}
              rightIcon={<ChevronRightIcon />}
              className="dropdown-basic"
            >
              {'-> ' + dim.parent.name}
            </MenuButton><MenuList>{menu_agregation(dim)}</MenuList></Menu>
        })}</>}
        {contextualised_node.master_node && contextualised_node.id.includes(EXPANSION_SUFFIXES.LEFT) ?
          <Button
            variant='contextmenu_button'
            onClick={() => contract(new_data, contextualised_node)}
          >
            {t('Noeud.context_contract_right')}
          </Button> : <></>}
        {contextualised_node.master_node && contextualised_node.id.includes(EXPANSION_SUFFIXES.RIGHT) ?
          <Button
            variant='contextmenu_button'
            onClick={() => contract(new_data, contextualised_node)}
          >
            {t('Noeud.context_contract_left')}
          </Button> : <></>}
      </MenuGroup>
      {sep}
      <MenuGroup title="Désagrégation">
        {parent_dims.length == 1 ? menu_desagregation(parent_dims[0]) : <>{parent_dims.map((dim, index) => {
          return <Menu key={index} placement='end'>
            <MenuButton
              variant='contextmenu_button'
              as={Button}
              rightIcon={<ChevronRightIcon />}
              className="dropdown-basic"
            >
              {'-> ' + dim.children_name}
            </MenuButton><MenuList>{menu_desagregation(dim)}</MenuList></Menu>
        })}</>}
      </MenuGroup>
    </MenuList>
  </Menu>
}
