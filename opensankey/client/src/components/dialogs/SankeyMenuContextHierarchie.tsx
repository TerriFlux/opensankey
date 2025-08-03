import { ChevronRightIcon } from '@chakra-ui/icons'
import {
  Button, Menu,
  MenuButton, MenuList, MenuGroup
} from '@chakra-ui/react'
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
import { Class_NodeDimension } from '../../Elements/NodeDimension'
import { Class_LevelTag } from '../../types/Tag'
import { Class_LevelTagGroup } from '../../types/TagGroup'
import { aggregate, disaggregate, aggregationExpansion, disaggregationExpansion, EXPANSION_SUFFIXES, contract } from '../../Algorithms/Hierarchies'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { Class_LinkElement } from '../../Elements/Link'
import { Class_NodeElement } from '../../Elements/Node'

// const contractLegacy = (
//   new_data: Class_ApplicationData,
//   contextualised_node: Class_NodeElement
// ) => {
//   const expand_left = contextualised_node.id.includes(EXPANSION_SUFFIXES.LEFT)
//   const l = expand_left ? contextualised_node.output_links_list[0] : contextualised_node.input_links_list[0]
//   if (!l) return
//   let parent_node = expand_left ? l.target : l.source
//   const children = expand_left
//     ? parent_node.input_links_list.filter(l => l.is_visible)
//     : parent_node.output_links_list.filter(l => l.is_visible)
//   children.forEach((c) => {
//     new_data.drawing_area.sankey.deleteNode(expand_left ? c.source : c.target)
//   })
//   if (expand_left) {
//     parent_node.input_links_list.forEach(l => l.setVisible())
//   } else {
//     parent_node.output_links_list.forEach(l => l.setVisible())
//   }
// }
// ============================================================================
// UTILITAIRES POUR LES MENUS
// ============================================================================
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

  function addNewLinks(n: Class_NodeElement, extremity_node: Class_NodeElement, tagg: Class_LevelTagGroup) {
    const pdim = n.nodeDimensionAsParent(tagg)
    if (!pdim) {
      return
    }
    if (pdim.children.includes(pdim.parent)) {
      return
    }
    (pdim.children as Class_NodeElement[]).forEach(c => {
      const link2copy = (c as Class_NodeElement)[input_or_output_attr][0]
      const child_link = n.sankey.addNewLink(expand_left ? extremity_node : c, expand_left ? c : extremity_node);
      (child_link as Class_LinkElement).copyValues(link2copy)
      addNewLinks(c, extremity_node, tagg)
    })
  }

  function removeLinks(n: Class_NodeElement, tagg: Class_LevelTagGroup) {
    const pdim = n.nodeDimensionAsParent(tagg)
    if (!pdim) {
      return
    }
    if (pdim.children.includes(pdim.parent)) {
      return
    }
    (pdim.children as Class_NodeElement[]).forEach(c => {
      n.sankey.drawing_area.deleteLink((c as Class_NodeElement)[input_or_output_attr][0])
      removeLinks(c, tagg)
    })
  }

  function applyDimension(
    parent_level_tag: Class_LevelTag,
    root_node: Class_NodeElement,
    child_level_tag: Class_LevelTag,
    tagg: Class_LevelTagGroup
  ) {
    selected_nodes.forEach(n => {
      (parent_level_tag as Class_LevelTag).getOrCreateLowerDimension(root_node, n, child_level_tag as Class_LevelTag)
      n.dimensionsUpdated()
      const desagregation_links = n[input_or_output_attr].filter(l => l[source_or_target_attr].id == root_node.id)
      if (desagregation_links.length > 1) {
        return
      }
      const desagregation_link = desagregation_links[0]
      if (n.input_links_list.length == 0 || n.output_links_list.length == 0) {
        root_node[input_or_output_attr].forEach(supply_link => {
          if (!supply_link.valueCurrent) {
            return
          }
          const new_link = n.sankey.addNewLink(expand_left ? supply_link.source : n, expand_left ? n : supply_link.target);
          (new_link as Class_LinkElement).copyValues(desagregation_link)
          addNewLinks(n, expand_left ? supply_link.source : supply_link.target, tagg)
          supply_link[source_or_target_attr].reorganizeIOLinks()
        })
        removeLinks(n, tagg)
      }
      root_node.dimensionsUpdated()
      root_node.nodeDimensionAsParent(tagg)!.normalize()
      sankey.drawing_area.deleteLink(desagregation_link)
    })
    sankey.nodes_list.forEach(n => {
      n.dimensionsUpdated()
      n.updateVisibilityFingerprint()
      n.input_links_list.forEach(l => l.updateVisibilityFingerprint())
      n.output_links_list.forEach(l => l.updateVisibilityFingerprint())
    })
  }

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

      applyDimension(parent_level_tag, root_node, child_level_tag, tagg)
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
              new_data.drawing_area.bypass_redraws = true
              let this_parent_dim: Class_NodeDimension | null = null
              const this_child_dim: Class_NodeDimension | null = null

              selected_nodes.forEach(n => {
                this_parent_dim = n.nodeDimensionAsParent(tagg as Class_LevelTagGroup)
                if (this_parent_dim) {
                  this_parent_dim.shift_level_tags()
                }
              })
              const root_node = sankey.nodes_dict[[...possible_root_nodes][0]]

              const root_has_parent = root_node.dimensions_as_parent.filter(dim => dim.parent_level_tag.group.id == tagg.id).length !== 0
              let parent_level_tag: Class_LevelTag
              let child_level_tag: Class_LevelTag
              if (!root_has_parent && !this_child_dim) {
                parent_level_tag = tagg.tags_list[0]
                if (tagg.tags_list.length == 1) {
                  tagg.addTag(
                    String(+parent_level_tag.id + 1),
                    String(+parent_level_tag.id + 1)
                  )
                }
                child_level_tag = tagg.tags_list[1]
              } else {
                return
              }

              applyDimension(parent_level_tag, root_node, child_level_tag, tagg)

              tagg.tags_list[0].setSelected()
              new_data.menu_configuration.ref_to_leveltag_filter_updater.current()
              new_data.drawing_area.draw()
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
              new_data.drawing_area.bypass_redraws = true
              const parent_dim = selected_nodes[0].nodeDimensionAsParent(tagg)
              const child_level_tag = parent_dim ? parent_dim.parent_level_tag : tagg.tags_list[1]
              const parent_level_tag = tagg.tags_list[tagg.tags_list.indexOf(child_level_tag as Class_LevelTag) - 1]
              const parent = sankey.addNewNode(selected_nodes.map(n => n.id).join('-'), selected_nodes.map(n => n.name).join('+'))
              parent.position_x = selected_nodes[0].position_x
              parent.position_u = selected_nodes[0].position_u
              parent.position_v = selected_nodes[0].position_v
              let y = 0
              selected_nodes.forEach(n => y += n.position_y)
              parent.position_y = y / selected_nodes.length

              selected_nodes.forEach(c => parent_level_tag.getOrCreateLowerDimension(parent, c, child_level_tag as Class_LevelTag))
              tagg.tags_list[0].setSelected()
              new_data.menu_configuration.ref_to_leveltag_filter_updater.current()
              const source_nodes = new Set<Class_NodeElement>()
              selected_nodes.forEach(c => c.input_links_list.forEach(l => source_nodes.add(l.source)))
              const target_nodes = new Set<Class_NodeElement>()
              selected_nodes.forEach(c => c.output_links_list.forEach(l => target_nodes.add(l.target)));
              [...source_nodes].forEach(source => {
                const parent_link = sankey.addNewLink(source, parent)
                selected_nodes.forEach(c => c.input_links_list.filter(l => l.source == source).forEach(l => parent_link.addValues(l)))
              })
              new_data.drawing_area.draw()
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

  const btn_aggregate = (dim: Class_NodeDimension) => {
    const b = (selected_nodes.length === 1) &&
      (contextualised_node !== undefined) &&
      (selected_nodes.includes(contextualised_node)) &&
      (contextualised_node.is_child) &&
      (contextualised_node.sibling == undefined)
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

  const parent_dims = contextualised_node.dimensions_as_parent_pure
  let child_dims = contextualised_node.dimensions_as_child_pure
  const forced_dim = child_dims.filter(dim => dim.force_show_children)
  if (forced_dim.length > 0) {
    child_dims = forced_dim
  }

  const menu_agregation = (dim: Class_NodeDimension) => <>
    {btn_aggregate(dim)}
    {contextualised_node.sibling == undefined ?
      <Button
        variant='contextmenu_button'
        onClick={() => aggregationExpansion(new_data, contextualised_node, false, dim.related_level_tagg as Class_LevelTagGroup)}
      >
        {t('Noeud.context_agregate_right')}
      </Button> : <></>}
    {contextualised_node.sibling == undefined ?
      <Button
        variant='contextmenu_button'
        onClick={() => aggregationExpansion(new_data, contextualised_node, true, dim.related_level_tagg as Class_LevelTagGroup)}
      >
        {t('Noeud.context_agregate_left')}
      </Button> : <></>}
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
        {contextualised_node.sibling && contextualised_node.id.includes(EXPANSION_SUFFIXES.LEFT) ?
          <Button
            variant='contextmenu_button'
            onClick={() => contract(new_data, contextualised_node)}
          >
            {t('Noeud.context_contract_right')}
          </Button> : <></>}
        {contextualised_node.sibling && contextualised_node.id.includes(EXPANSION_SUFFIXES.RIGHT) ?
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
