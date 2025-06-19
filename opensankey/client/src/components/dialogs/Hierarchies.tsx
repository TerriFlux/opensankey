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
  MenuButton, MenuList,MenuGroup
} from '@chakra-ui/react'
import { Class_NodeDimension } from '../../Elements/NodeDimension'
import { Class_LevelTag, Class_LevelTagGroup } from '../../types/Tag'
import { Type_GenericNodeElement, Type_GenericApplicationData, Type_GenericLinkElement } from '../../types/Types'
import { default_style_id } from '../../types/Utils'
import { sep } from './SankeyMenuContextLink'

export const contract = (
  new_data: Type_GenericApplicationData,
  contextualised_node: Type_GenericNodeElement
) => {
  const expand_left = contextualised_node.id.includes('expandleft')
  const l = expand_left ? contextualised_node.output_links_list[0]: contextualised_node.input_links_list[0]

  let parent_node = expand_left ? l.target : l.source
  new_data.drawing_area.bypass_redraws = true
  const children = expand_left ? parent_node.input_links_list.filter(l => l.is_visible) : parent_node.output_links_list.filter(l => l.is_visible)
  children.forEach((c, i) => {
    new_data.drawing_area.sankey.deleteNode(expand_left ? c.source : c.target)
  })
  if (expand_left) {
    parent_node.input_links_list.forEach(l => l.setVisible())
  } else {
    parent_node.output_links_list.forEach(l => l.setVisible())
  }
  new_data.drawing_area.draw()
}

export const expand = (
  new_data: Type_GenericApplicationData,
  contextualised_node: Type_GenericNodeElement,
  expand_left: boolean,
  tagg: Class_LevelTagGroup) => {
  new_data.drawing_area.bypass_redraws = true
  //do not draw until all nodes and links have been created
  const parent_dim = contextualised_node.nodeDimensionAsParent(tagg)
  if (!parent_dim) {
    return
  }
  const children = parent_dim.children as Type_GenericNodeElement[]
  const new_nodes: Type_GenericNodeElement[] = []
  //const original_node = contextualised_node.sibling ?? contextualised_node
  //const original_node = contextualised_node
  const original_node = contextualised_node.sibling ?? contextualised_node
  // the new node is intimely linked to the original child node
  let links_aggregate: Type_GenericLinkElement[] = []
  // Si on étend à droite ce sont les flux qui vont à droite du noeud que l'on expand et qui additionnent les flux à droite des neouds enfants expandus 
  // Si on étend à gauche ce sont les flux qui viennent de gauche du noeud que l'on expand
  //let links_copy: Type_GenericLinkElement[] = []
  // Si on étend à gauche ce sont les flux qui viennent de gauche
  // Si on étend à droite ce sont les flux qui vont à droite des neouds enfants expandus copié depuis le sibling
  let is_extremity = true
  if (expand_left) {
    if ( original_node.input_links_list.length > 0) {
      links_aggregate = original_node.input_links_list.filter(l => l.source.is_visible) as Type_GenericLinkElement[]
      contextualised_node.input_links_list.filter(l => l.setInvisible()) as Type_GenericLinkElement[]
      is_extremity = false
    } else {
      links_aggregate = original_node.output_links_list.filter(l => l.target.is_visible) as Type_GenericLinkElement[]
    }
    contextualised_node.input_links_list.filter(l => l.setInvisible()) as Type_GenericLinkElement[]
  } else {
    if ( original_node.output_links_list.length > 0) {
      links_aggregate = original_node.output_links_list.filter(l => l.target.is_visible) as Type_GenericLinkElement[]
      is_extremity = false
    } else {
      links_aggregate = original_node.input_links_list.filter(l => l.source.is_visible) as Type_GenericLinkElement[]
    }
    contextualised_node.output_links_list.filter(l => l.setInvisible()) as Type_GenericLinkElement[]
  }
  const suffix = expand_left ? 'expandleft' : 'expandright'
  children.forEach((c, i) => {
    const n = new_data.drawing_area.sankey.addNewNode(c.id + suffix, c.name)
    new_nodes.push(n)
    n.sibling = c
    n.copyFrom(c)
    n.shape_color = contextualised_node.shape_color
    n.shape_opacity = (contextualised_node.shape_opacity > 0.3) ? contextualised_node.shape_opacity - 0.2 : contextualised_node.shape_opacity
    if (contextualised_node.dimensions_as_child.length == 0) {
      // n is no more a child (contrary to its sibling)
      n.dimensions_as_child.forEach(cdim => n.removeDimensionAsChild(cdim))
    } else {
      const dim_as_child = contextualised_node.nodeDimensionAsChild(tagg)
      const n_dim_as_child = n.nodeDimensionAsChild(tagg)
      if (dim_as_child) {
        n_dim_as_child!.force_child_level_tag(dim_as_child!.child_level_tag)
        n_dim_as_child!.force_parent_level_tag(dim_as_child!.parent_level_tag)
        n_dim_as_child!.setForceToShowChildren(true)
      } else {
        n.removeDimensionAsChild(n_dim_as_child!)
      }
      contextualised_node.dimensions_as_child.forEach(dim=>{
        if (dim.force_show_children) {
          const ndim = n.nodeDimensionAsChild(dim.related_level_tagg as Class_LevelTagGroup)
          if (ndim) {
            ndim.setForceToShowChildren(true)
          }
        }
      })
    }
    if (n.dimensions_as_parent.length !== 0) {
      // the dimension as parent go up one level
      const dim_as_parent = contextualised_node.nodeDimensionAsParent(tagg)
      const n_dim_as_parent = n.nodeDimensionAsParent(tagg)
      if (n_dim_as_parent) {
        n_dim_as_parent!.force_parent_level_tag(dim_as_parent!.parent_level_tag)
        n_dim_as_parent!.force_child_level_tag(dim_as_parent!.child_level_tag)
      }
    }
    let lchild: Type_GenericLinkElement
    if (expand_left) {
      lchild = new_data.drawing_area.sankey.addNewLink(n, contextualised_node)
    } else {
      lchild = new_data.drawing_area.sankey.addNewLink(contextualised_node, n)
    }
    lchild.shape_color_rule = 'source'
    lchild.shape_opacity = n.shape_opacity

    links_aggregate.forEach(laggregate => {
      if (expand_left) {
        if (!is_extremity) {
          let laggregate_child = laggregate.source.output_links_list.filter(l => l.target == n.sibling)[0]
          if (!laggregate_child) {
            laggregate_child = laggregate.source.output_links_list.filter(l => l.target == n)[0]          
          }
          if (laggregate_child) {
            lchild.addValues(laggregate_child)
          }
          const copy_link = new_data.drawing_area.sankey.addNewLink(laggregate.source, n)
          //const lcopy_child = laggregate.source.output_links_list.filter(l => l.target == n.sibling)[0]
          if (laggregate_child) {
            copy_link.copyValues(laggregate_child)
          }
          laggregate.setInvisible()
        } else {
          let laggregate_child = laggregate.target.input_links_list.filter(l => l.source == n.sibling)[0]
          if (!laggregate_child) {
            laggregate_child = laggregate.target.input_links_list.filter(l => l.source == n)[0]       
          }
          if (laggregate_child) {
            lchild.addValues(laggregate_child)
          }          
        }
      } else {
        if (!is_extremity) {
          let laggregate_child = laggregate.target.input_links_list.filter(l => l.source == n.sibling)[0]
          if (!laggregate_child) {
            laggregate_child = laggregate.target.input_links_list.filter(l => l.source == n)[0]       
          }
          if (laggregate_child) {
            lchild.addValues(laggregate_child)
          }
          if (!is_extremity) {
            const copy_link = new_data.drawing_area.sankey.addNewLink(n,laggregate.target)
            //const lcopy_child = laggregate.target.input_links_list.filter(l => l.source == n.sibling)[0]
            if (laggregate_child) {
              copy_link.copyValues(laggregate_child)
            }
            laggregate.setInvisible()
          }
        } else {
          let laggregate_child = laggregate.source.output_links_list.filter(l => l.target == n.sibling)[0]
          if (!laggregate_child) {
            laggregate_child = laggregate.source.output_links_list.filter(l => l.target == n)[0]          
          }
          if (laggregate_child) {
            lchild.addValues(laggregate_child)
          }          
        }
      }
    })
    n.position_x = contextualised_node.position_x
    // if (expand_left) {
    //   n.position_x = contextualised_node.position_x - new_data.drawing_area.horizontal_spacing
    // } else {
    //   n.position_x = contextualised_node.position_x + new_data.drawing_area.horizontal_spacing
    // }
    //n.position_u = contextualised_node.position_u+1
    n.position_v = -1
  })
  new_data.drawing_area.sankey.nodes_list.filter(n2=>n2.position_u>=contextualised_node.position_u+1).forEach(n2=>{
    if (expand_left) n2.position_u-=1
    else n2.position_u+=1
  })

  let total_height = (new_nodes.length - 1) * new_data.drawing_area.vertical_spacing
  new_nodes.forEach(c => total_height += c.getShapeHeightToUse())
  const shift_y = total_height / 2
  new_nodes.forEach((n, i) => {
    if (new_data.drawing_area.sankey.node_styles_dict[default_style_id].position.type == 'parametric' && i == 0) {
      n.position_y = contextualised_node.position_y + contextualised_node.getShapeHeightToUse() / 2 - shift_y
    }
  })


  // ready to draw in parametric mode
  // new_data.drawing_area.computeParametrization()
  new_nodes.forEach(n => {
    n.resetPositionAttribute('dy')
    if (expand_left) n.position_u = contextualised_node.position_u-1
    else n.position_u = contextualised_node.position_u+1
  })
  new_data.drawing_area.draw()
  new_nodes.forEach(n => {
    n.input_links_list.forEach(l => l.source.reorganizeIOLinks())
    n.output_links_list.forEach(l => l.target.reorganizeIOLinks())
    n.reorganizeIOLinks()
  })
}

export const agregate_side = (
  new_data: Type_GenericApplicationData,
  contextualised_node: Type_GenericNodeElement,
  expand_left: boolean,
  tagg: Class_LevelTagGroup) => {
  new_data.drawing_area.bypass_redraws = true
  //do not draw until all nodes and links have been created

  const child_dim = contextualised_node.nodeDimensionAsChild(tagg)
  if (!child_dim) {
    return
  }

  const parent = child_dim.parent as Type_GenericNodeElement
  const children = parent.nodeDimensionAsParent(tagg)?.children
  const suffix = expand_left ? 'expandleft' : 'expandright'
  const new_node = new_data.drawing_area.sankey.addNewNode(parent.id + suffix, parent.name)
  new_node.sibling = parent
  new_node.copyFrom(parent)
  new_node.shape_color = contextualised_node.shape_color
  new_node.shape_opacity = (contextualised_node.shape_opacity > 0.3) ? contextualised_node.shape_opacity - 0.2 : contextualised_node.shape_opacity
  //n.position_type = 'parametric'
  // n is no more a child (contrary to its sibling)
  //if (i==0) {
  // if (contextualised_node.dimensions_as_child.length == 0) {
  //   new_node.dimensions_as_child.forEach(cdim => n.removeDimensionAsChild(cdim))
  // } else {
  //   const dim_as_child = contextualised_node.nodeDimensionAsChild(tagg)
  //   const n_dim_as_child = new_node.nodeDimensionAsChild(tagg)
  //   n_dim_as_child!.force_child_level_tag(dim_as_child!.child_level_tag)
  //   n_dim_as_child!.force_parent_level_tag(dim_as_child!.parent_level_tag)
  //   n_dim_as_child!.setForceToShowChildren(true)
  // }
  // if (n.dimensions_as_parent.length !== 0) {
    // the dimension as parent go up one level
  // const dim_as_child = contextualised_node.nodeDimensionAsChild(tagg)
  // const n_dim_as_parent = new_node.nodeDimensionAsParent(tagg)
  // if (n_dim_as_parent) {
  //   n_dim_as_parent!.force_parent_level_tag(dim_as_child!.parent_level_tag)
  //   n_dim_as_parent!.force_child_level_tag(dim_as_child!.child_level_tag)
  // }
  //}
  new_node.removeDimensionAsParent(parent.nodeDimensionAsParent(tagg)!)


  //const new_node: Type_GenericNodeElement
  //const original_node = contextualised_node.sibling ?? contextualised_node
  const original_node = contextualised_node
  const original_node_sibling = contextualised_node.sibling ?? contextualised_node
  // the new node is intimely linked to the original child node
  // let links_aggregate: Type_GenericLinkElement[] = []
  // // Si on étend à droite ce sont les flux qui vont à droite du noeud que l'on expand et qui additionnent les flux à droite des neouds enfants expandus 
  // // Si on étend à gauche ce sont les flux qui viennent de gauche du noeud que l'on expand
  // let links_copy: Type_GenericLinkElement[] = []
  // // Si on étend à gauche ce sont les flux qui viennent de gauche
  // // Si on étend à droite ce sont les flux qui vont à droite des neouds enfants expandus copié depuis le sibling
  // let copy_left = expand_left
  // if (expand_left) {
  //   links_aggregate = original_node_sibling.output_links_list /*.filter(l => l.is_visible)*/ as Type_GenericLinkElement[]
  //   links_copy = original_node.input_links_list /*.filter(l => l.is_visible)*/ as Type_GenericLinkElement[]
  // } else {
  //   // expand right
  //   if (original_node_sibling.output_links_list.length == 0) {
  //     links_aggregate = original_node_sibling.input_links_list /*.filter(l => l.is_visible)*/ as Type_GenericLinkElement[]
  //   } else {
  //     copy_left = true
  //     links_aggregate = original_node_sibling.output_links_list.filter(l => l.target.is_visible) as Type_GenericLinkElement[]
  //   }
  //   links_copy = original_node.output_links_list /*.filter(l => l.is_visible)*/ as Type_GenericLinkElement[]
  // }

  children!.forEach((c, i) => {
    const links_aggregate = c.input_links_list.filter(l => l.is_visible) as Type_GenericLinkElement[]
    links_aggregate.forEach(laggregate => {
      let lchild: Type_GenericLinkElement
      // if (expand_left) {
      //   lchild = new_data.drawing_area.sankey.addNewLink(n, contextualised_node)
      // } else {
      lchild = new_data.drawing_area.sankey.addNewLink(c as Type_GenericNodeElement, new_node)
      //}
      lchild.shape_color_rule = 'source'
      //lchild.shape_opacity = n.shape_opacity
      lchild.sibling = laggregate
      // if (copy_left) {
      //   //const l2copy = lparent.target.input_links_list.filter(l => l.source == n.sibling)[0]
      //   let laggregate_child = laggregate.target.input_links_list.filter(l => l.source == n.sibling)[0]
      //   if (!laggregate_child) {
      //     laggregate_child = laggregate.target.input_links_list.filter(l => l.source == n)[0]
      //   }
      //   if (laggregate_child) {
      lchild.copyValues(laggregate)
      //   }
      // } else {
      //   const laggregate_child = laggregate.source.output_links_list.filter(l => l.target == n.sibling)[0]
      //   if (laggregate_child) {
      //     lchild.copyValues(laggregate_child)
      //   }
      // }
    })
  })

    // links_copy.forEach(lcopy => {
    //   let lchild: Type_GenericLinkElement
    //   if (expand_left) {
    //     lchild = new_data.drawing_area.sankey.addNewLink(lcopy.source, n)
    //     const lcopy_child = lcopy.source.output_links_list.filter(l => l.target == n.sibling)[0]
    //     if (lcopy_child) {
    //       lchild.copyValues(lcopy_child)
    //     }
    //     lcopy.setInvisible()
    //   } else {
    //     lchild = new_data.drawing_area.sankey.addNewLink(n, lcopy.target)
    //     const lcopy_child = lcopy.target.input_links_list.filter(l => l.source == n.sibling)[0]
    //     if (lcopy_child) {
    //       lchild.copyValues(lcopy_child)
    //     }
    //     lcopy.setInvisible()
    //   }
    // })

    if (new_data.drawing_area.sankey.node_styles_dict[default_style_id].position.type == 'parametric') {
    if (expand_left) {
      new_node.position_x = contextualised_node.position_x - new_data.drawing_area.horizontal_spacing / 2
    } else {
      new_node.position_x = contextualised_node.position_x + new_data.drawing_area.horizontal_spacing / 2
    }
    }
    new_node.position_v = -1
  //})
  // let total_height = (new_nodes.length - 1) * new_data.drawing_area.vertical_spacing
  // new_nodes.forEach(c => total_height += c.getShapeHeightToUse())
  // const shift_y = total_height / 2
  // new_nodes.forEach((n, i) => {
  //   if (new_data.drawing_area.sankey.node_styles_dict[default_style_id].position.type == 'parametric' && i == 0) {
  //     n.position_y = contextualised_node.position_y + contextualised_node.getShapeHeightToUse() / 2 - shift_y
  //   }
  // })

  // new_data.drawing_area.bypass_redraws = false
  // // ready to draw in parametric mode
  // new_data.drawing_area.computeParametrization()
  // new_nodes.forEach(n => {
  //   n.resetPositionAttribute('dy')
  //   n.applyPosition()
  new_node.input_links_list.forEach(l => l.source.reorganizeIOLinks())
  new_node.output_links_list.forEach(l => l.target.reorganizeIOLinks())
  new_node.reorganizeIOLinks()
  //   n.draw()
  // })
  new_data.drawing_area.bypass_redraws = false
  // ready to draw in parametric mode
  new_data.drawing_area.computeParametrization()
  new_data.drawing_area.draw()
}

export const hierarchyEditionMenu = (
  new_data: Type_GenericApplicationData,
  contextualised_node: Type_GenericNodeElement,
  selected_nodes: Type_GenericNodeElement[],
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
        function addNewLinks(n: Type_GenericNodeElement) {
          n.dimensions_as_parent.forEach(dim => {
            dim.children.forEach(c => {

              if (c.input_links_list.length === 0) {
                //already treated
                n.input_links_list.forEach(l => sankey.addNewLink(l.source, c as Type_GenericNodeElement))
              }
              if (c.output_links_list.length === 0) {
                //already treated
                n.output_links_list.forEach(l => sankey.addNewLink(c as Type_GenericNodeElement, l.target))
              }
            })
            dim.children.forEach(c => {
              addNewLinks(c as Type_GenericNodeElement)
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
    </Button> :
    <></>

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

  function addNewLinks(n: Type_GenericNodeElement, extremity_node: Type_GenericNodeElement, tagg: Class_LevelTagGroup) {
    const pdim = n.nodeDimensionAsParent(tagg)
    if (!pdim) {
      return
    }
    if (pdim.children.includes(pdim.parent)) {
      return
    }
    (pdim.children as Type_GenericNodeElement[]).forEach(c => {
      const link2copy = (c as Type_GenericNodeElement)[input_or_output_attr][0]
      const child_link = n.sankey.addNewLink(expand_left ? extremity_node : c, expand_left ? c : extremity_node);
      (child_link as Type_GenericLinkElement).copyValues(link2copy)
      //n.sankey.drawing_area.deleteLink(link2copy)
      addNewLinks(c, extremity_node, tagg)
    })
  }

  function removeLinks(n: Type_GenericNodeElement, tagg: Class_LevelTagGroup) {
    const pdim = n.nodeDimensionAsParent(tagg)
    if (!pdim) {
      return
    }
    if (pdim.children.includes(pdim.parent)) {
      return
    }
    (pdim.children as Type_GenericNodeElement[]).forEach(c => {
      n.sankey.drawing_area.deleteLink((c as Type_GenericNodeElement)[input_or_output_attr][0])
      removeLinks(c, tagg)
    })
  }
  function applyDimension(
    parent_level_tag: Class_LevelTag,
    root_node: Type_GenericNodeElement,
    child_level_tag: Class_LevelTag,
    tagg: Class_LevelTagGroup) {
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
          if (!supply_link.value?.valueData) {
            return
          }
          const new_link = n.sankey.addNewLink(expand_left ? supply_link.source : n, expand_left ? n : supply_link.target);
          (new_link as Type_GenericLinkElement).copyValues(desagregation_link)
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
      let parent_level_tag = tagg.tags_list[0]
      let child_level_tag = tagg.tags_list[1]
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
          {sankey.level_taggs_list.map(tagg => <Button
            variant='contextmenu_button'
            onClick={() => {
              new_data.drawing_area.bypass_redraws = true
              let this_parent_dim: Class_NodeDimension | null = null
              let this_child_dim: Class_NodeDimension | null = null

              let root_node: Type_GenericNodeElement
              selected_nodes.forEach(n => {
                // If node being set as child is set as parent we must create a new level
                this_parent_dim = n.nodeDimensionAsParent(tagg as Class_LevelTagGroup)
                if (this_parent_dim) {
                  this_parent_dim.shift_level_tags()
                }
              })
              root_node = sankey.nodes_dict[[...possible_root_nodes][0]]

              let root_has_parent = root_node.dimensions_as_parent.filter(dim => dim.parent_level_tag.group.id == tagg.id).length !== 0
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
          {sankey.level_taggs_list.map(tagg => <Button
            variant='contextmenu_button'
            onClick={() => {
              new_data.drawing_area.bypass_redraws = true
              const parent_dim = selected_nodes[0].nodeDimensionAsParent(tagg)
              let child_level_tag = parent_dim ? parent_dim.parent_level_tag : tagg.tags_list[1]
              let parent_level_tag = tagg.tags_list[tagg.tags_list.indexOf(child_level_tag as Class_LevelTag) - 1]
              const parent = sankey.addNewNode(selected_nodes.map(n => n.id).join('-'), selected_nodes.map(n => n.name).join('+'))
              parent.position_x = selected_nodes[0].position_x
              parent.position_u = selected_nodes[0].position_u
              parent.position_v = selected_nodes[0].position_v
              let y = 0
              selected_nodes.forEach(n=>y+=n.position_y)
              parent.position_y = y/selected_nodes.length

              selected_nodes.forEach(c => parent_level_tag.getOrCreateLowerDimension(parent, c, child_level_tag as Class_LevelTag))
              tagg.tags_list[0].setSelected()
              new_data.menu_configuration.ref_to_leveltag_filter_updater.current()
              const source_nodes = new Set<Type_GenericNodeElement>()
              selected_nodes.forEach(c => c.input_links_list.forEach(l => source_nodes.add(l.source)))
              const target_nodes = new Set<Type_GenericNodeElement>()
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
  new_data: Type_GenericApplicationData,
  contextualised_node: Type_GenericNodeElement,
  selected_nodes: Type_GenericNodeElement[],
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
          contextualised_node.drawParent(dim.id)
          new_data.drawing_area.draw()
          new_data.drawing_area.purgeSelection()
          new_data.drawing_area.node_contextualised = undefined
          new_data.drawing_area.areaAutoFit(false)
          refreshThisAndToggleSaving()
        }
      }
    >
      {t('Noeud.context_agregate')}</Button> :<></>
    return b
  }

  const btn_desagregate = (dim: Class_NodeDimension) => {
    const b = contextualised_node.nodeDimensionAsParent(dim.related_level_tagg as Class_LevelTagGroup) ?
      <Button
        variant='contextmenu_button'
        onClick={() => {
          contextualised_node.drawChildren(
            dim.id
          )
          new_data.drawing_area.draw()//Redraw all node visible because some link position where not computed before disaggregation
          new_data.drawing_area.purgeSelection()
          new_data.drawing_area.node_contextualised = undefined
          new_data.drawing_area.areaAutoFit(false)
          refreshThisAndToggleSaving()
        }
        }
      >{t('Noeud.context_desagregate')}</Button> : <></>
    return b
  }

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

  const parent_dims = contextualised_node.dimensions_as_parent_pure
  let child_dims = contextualised_node.dimensions_as_child_pure
  let forced_dim = child_dims.filter(dim=>dim.force_show_children)
  if (forced_dim.length>0) {
    child_dims = forced_dim
  }
  let hierarchy_button = <></>
  
  const menu_agregation = (dim: Class_NodeDimension) => <>
    {btn_aggregate(dim)}
    {contextualised_node.sibling == undefined ?
    <Button
      variant='contextmenu_button'
      onClick={() => agregate_side(new_data, contextualised_node, false, dim.related_level_tagg as Class_LevelTagGroup)}
    >
      {t('Noeud.context_agregate_right')}
    </Button>:<></>}
    {contextualised_node.sibling == undefined ?
    <Button
      variant='contextmenu_button'
      onClick={() => agregate_side(new_data, contextualised_node, false, dim.related_level_tagg as Class_LevelTagGroup)}
    >
      {t('Noeud.context_agregate_left')}
    </Button>:<></>}
  </>

  const menu_desagregation = (dim: Class_NodeDimension) => <>
    {btn_desagregate(dim)}
    <Button
      variant='contextmenu_button'
      onClick={() => expand(new_data, contextualised_node, false, dim.related_level_tagg as Class_LevelTagGroup)}
    >
      {t('Noeud.context_expand_right')}
    </Button>
    <Button
      variant='contextmenu_button'
      onClick={() => expand(new_data, contextualised_node, true, dim.related_level_tagg as Class_LevelTagGroup)}
    >
      {t('Noeud.context_expand_left')}
    </Button>
  </>

  hierarchy_button = <Menu placement='end'>
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
        {child_dims.length == 1 ? menu_agregation(child_dims[0]) : <>{child_dims.map(dim => {
          return <Menu placement='end'>
            <MenuButton
              variant='contextmenu_button'
              as={Button}
              rightIcon={<ChevronRightIcon />}
              className="dropdown-basic"
            >
              {'-> ' + dim.parent.name}
            </MenuButton><MenuList>{menu_agregation(dim)}</MenuList></Menu>
        })}</>}
      {contextualised_node.sibling && contextualised_node.id.includes('expandleft') ?
      <Button
        variant='contextmenu_button'
        onClick={() => contract(new_data,contextualised_node)}
      >
        {t('Noeud.context_contract_right')}
      </Button>:<></>}
      {contextualised_node.sibling && contextualised_node.id.includes('expandright') ?
      <Button
        variant='contextmenu_button'
        onClick={() => contract(new_data,contextualised_node)}
      >
        {t('Noeud.context_contract_left')}
      </Button>:<></>}
      </MenuGroup>
      {sep}
      <MenuGroup title="Désagrégation">
        {parent_dims.length == 1 ? menu_desagregation(parent_dims[0]) : <>{parent_dims.map(dim => {
          return <Menu placement='end'>
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

  return hierarchy_button
}


