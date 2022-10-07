/* eslint @typescript-eslint/no-var-requires: "off" */
import * as d3 from 'd3'
import { textwrap } from 'd3-textwrap'
import React, { FunctionComponent, useEffect, useState } from 'react'
import { SankeyNode, SankeyLink, SankeyDataPropTypes, TagsCatalog, SankeyData, SankeyNodePropTypes, SankeyLinkPropTypes, SankeyLabelPropTypes, SankeyLinkValueDict, SankeyLinkValue } from './types'
import PropTypes, { InferProps } from 'prop-types'
import * as SankeyShapes from './SankeyShapes'
import { compute_total_offsets, getLinkValue, setSelectedTags, default_node, default_link } from './SankeyUtils'
import { desagregation, agregation, AgregationModal } from './SankeyLayout'
import LZString from 'lz-string'


window.d3 = d3

const SankeyDrawPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  select_node: PropTypes.func.isRequired,
  node_arrow_visible: PropTypes.func.isRequired,

  select_link: PropTypes.func.isRequired,
  link_text: PropTypes.func.isRequired,
  test_link_value: PropTypes.func.isRequired,

  button_ref: PropTypes.shape({current:PropTypes.instanceOf(HTMLLabelElement)}),
  accordion_ref: PropTypes.shape({current:PropTypes.instanceOf(HTMLDivElement)}),
  nodes_accordion_ref: PropTypes.shape({current:PropTypes.instanceOf(HTMLDivElement)}),
  links_accordion_ref: PropTypes.shape({current:PropTypes.instanceOf(HTMLDivElement)}),

  multi_selected_nodes: PropTypes.shape({current:PropTypes.arrayOf(PropTypes.shape(SankeyNodePropTypes).isRequired).isRequired}).isRequired,
  multi_selected_links: PropTypes.shape({current:PropTypes.arrayOf(PropTypes.shape(SankeyLinkPropTypes).isRequired).isRequired}).isRequired,
  multi_selected_label: PropTypes.shape({current:PropTypes.arrayOf(PropTypes.shape(SankeyLabelPropTypes).isRequired).isRequired}).isRequired,

  nodeTooltipsContent: PropTypes.func.isRequired,
  linkTooltipsContent: PropTypes.func.isRequired,

  set_show_toast: PropTypes.func.isRequired,
  current: PropTypes.bool.isRequired,

  mode_selection: PropTypes.string.isRequired,
  set_mode_selection: PropTypes.func.isRequired,

  view: PropTypes.string.isRequired,
  set_view: PropTypes.func.isRequired,

  mode_visualisation:PropTypes.bool.isRequired,
}

export const SankeyDrawDefaultProps = {
  set_data: () => null,
  select_node: () => null,
  node_arrow_visible: () => true,

  select_link: () => null,

  // set_show_nav: () => null,
  // set_nav_item_active: () => null,
  // set_sub_nav_item_active: () => null,
  button_ref: null,
  accordion_ref: null,
  nodes_accordion_ref: null,
  links_accordion_ref: null,

  nodeTooltipsContent: () => null,
  linkTooltipsContent: () => null,

  multi_selected_nodes: {current : []},
  multi_selected_links: {current : []},
  multi_selected_label: {current : []},

  set_show_toast: () => null,
  current: true,

  mode_selection: '',
  set_mode_selection: () => null,

  view: '',
  set_view: () => null,

  mode_visualisation:false,

}

type SankeyDrawTypes = InferProps<typeof SankeyDrawPropTypes>

const SankeyDraw: FunctionComponent<SankeyDrawTypes> = ({
  data,
  link_text,
  test_link_value,
  set_data = SankeyDrawDefaultProps.set_data,
  select_node = SankeyDrawDefaultProps.select_node,
  node_arrow_visible = SankeyDrawDefaultProps.node_arrow_visible,
  select_link = SankeyDrawDefaultProps.select_link,
  button_ref = SankeyDrawDefaultProps.button_ref,
  accordion_ref = SankeyDrawDefaultProps.accordion_ref,
  nodes_accordion_ref = SankeyDrawDefaultProps.nodes_accordion_ref,
  links_accordion_ref = SankeyDrawDefaultProps.links_accordion_ref,

  nodeTooltipsContent = SankeyDrawDefaultProps.nodeTooltipsContent,
  linkTooltipsContent = SankeyDrawDefaultProps.linkTooltipsContent,
  multi_selected_nodes = SankeyDrawDefaultProps.multi_selected_nodes,
  multi_selected_links = SankeyDrawDefaultProps.multi_selected_links,
  multi_selected_label = SankeyDrawDefaultProps.multi_selected_label,
  set_show_toast,
  current,
  mode_selection,
  view, set_view,
  mode_visualisation

}) => {

  const [show_agregation, set_show_agregation] = useState(false)
  const [agregation_parent_names, set_agregation_parent_names] = useState<string[]>([])
  const [agregation_dimension_names, set_agregation_dimension_names] = useState<string[]>([])
  const [is_agregation, set_is_agregation] = useState(true)

  // const default_node_size = data.node_width
  const default_handle_size = 10
  const default_horiz_shift = 50
  const min_thickness = 1

  const display_nodes = data.nodes
  const display_links = data.links

  // const diff=require('deep-diff')

  // Il faut détruire les tooltips à chaque passage dans le draw
  d3.selectAll('.sankey-tooltip').remove()

  const sankeyTooltip = d3.select('body')
    .append('div')
    .style('opacity', 0)
    .attr('class', 'sankey-tooltip')

  let alt_key_pressed = false

  setSelectedTags(data)

  const min_width_and_height = () => {
    let height = 0
    let width = 0
    Object.values(data.nodes).filter(n => n.node_visible).forEach(n => {
      height = (n.y && n.node_visible) ? Math.max(height, n.y) : height
      width = (n.x && n.node_visible) ? Math.max(width, n.x) : width
    })

    Object.values(data.labels).forEach(n => {
      height = (n.y) ? Math.max(height, n.y) : height
      width = (n.x ) ? Math.max(width, n.x) : width
    })

    height = height + 200
    width = width + 200
    Object.values(data.links).forEach(l => {
      if (l.recycling) {
        height = (l.vert_shift && data.nodes[l.idSource].node_visible && data.nodes[l.idTarget].node_visible) ? Math.max(data.nodes[l.idSource].y + l.vert_shift + 100, data.nodes[l.idTarget].y + l.vert_shift + 100, height) : height
      }
    })

    Object.values(data.links).forEach(l => {
      if (l.recycling) {
        width = (data.nodes[l.idTarget].x && data.nodes[l.idTarget].node_visible && l.right_horiz_shift) ? Math.max(width, data.nodes[l.idSource].x + l.right_horiz_shift + default_horiz_shift + 150) : width
      }
    })
    return [Math.max(width, window.innerWidth - 40), Math.max(height, window.innerHeight - 40)]
  }
  const node_color = (n: SankeyNode) => {
    let colorNode
    if (n.colorParameter === 'groupTag' || data.show_structure) {
      //Le couleur est définie dans les parametres du groupTag pour le favoriteTag
      //on controle ici qu'il y a bien un favorite tag
      if (n.colorTag !== undefined && n.colorTag !== '') {
        const tagGroup = n.colorTag
        if (n.tags[tagGroup] === undefined) {
          colorNode = 'grey'
        } else if (n.tags[tagGroup].length > 0) {
          if (data.nodeTags[tagGroup].tags[n.tags[tagGroup][0]]) {
            colorNode = data.nodeTags[tagGroup].tags[n.tags[tagGroup][0]].color
          } else {
            colorNode = 'grey'
          }
        } else {
          colorNode = 'grey'
        }
      } else {
        colorNode = 'grey'
      }
    }
    if (n.colorParameter === 'local') {
      // Le couleur est définie dans les parametres locaux du noeud
      colorNode = n.color
    }

    return colorNode
  }
  const link_visible = (l: SankeyLink, data_s: SankeyData) => {
    const { dataTags, fluxTags } = data_s
    if (data_s.show_structure) {
      if (data_s.nodes[l.idSource].position === 'relative' || data_s.nodes[l.idTarget].position === 'relative') {
        return false
      }
    }
    if (!data_s.nodes[l.idSource].node_visible || !data_s.nodes[l.idTarget].node_visible) {
      return false
    }
    let val = ((l.value as unknown) as { [key: string]: SankeyLinkValueDict })
    const listKey = [] as string[]
    let missing_key = false
    Object.values(dataTags).filter(dataTag => { return (Object.keys(dataTag.tags).length != 0) ? true : false }).map(dataTag => {
      const selected_tags = Object.entries(dataTag.tags).filter(([, tag]) => { return tag.selected })
      if (selected_tags.length == 0 || missing_key) {
        missing_key = true
        return
      }
      listKey.push(Object.entries(dataTag.tags).filter(([, tag]) => { return tag.selected })[0][0])
    })
    if (missing_key) {
      return false
    }

    for (const i in listKey) {
      val = ((val as unknown) as { [key: string]: SankeyLinkValueDict })[listKey[i]]
    }
    const v = (val as unknown) as SankeyLinkValue
    let visible = true
    Object.keys(v.tags).forEach(tag_group => {
      const selected_tag = v.tags[tag_group]
      if (selected_tag && tag_group in fluxTags && !fluxTags[tag_group].tags[selected_tag].selected) {
        visible = false
      }
    })
    if (!visible) {
      return false
    }
    if (test_link_value(data_s, data_s.nodes, l, data_s.nodeTags) === 0) {
      if (data_s.display_style.null_flux) {
        return true
      }
      return false
    }
    return true
  }
  const link_color = (l: SankeyLink) => {
    let colorNode
    if (l.colorParameter === 'groupTag') {
      //Le couleur est définie dans les parametres du groupTag pour le favoriteTag
      //on controle ici qu'il y a bien un favorite tag
      if (l.colorTag !== undefined && l.colorTag !== '') {
        if (l.colorTag !== 'no_colormap') {
          const tagGroup = l.colorTag
          const v = getLinkValue(data, l.idLink)
          if (v === undefined) {
            return l.color
          }
          if (tagGroup in data.fluxTags && v.tags[tagGroup] in data.fluxTags[tagGroup].tags) {
            colorNode = data.fluxTags[tagGroup].tags[v.tags[tagGroup]].color
          } else {
            colorNode = l.color
          }
        } else {
          const source_node = data.nodes[l.idSource]
          const target_node = data.nodes[l.idTarget]
          let selected_tag = ''
          if (source_node.colorParameter !== 'local' && target_node.colorParameter !== 'local' && source_node.colorTag in source_node.tags && target_node.colorTag in target_node.tags) {
            const common_tags = source_node.tags[source_node.colorTag].filter(value => target_node.tags[target_node.colorTag].includes(value))
            if (common_tags.length > 0) {
              return data.nodeTags[source_node.colorTag].tags[common_tags[0]].color
            }
          }
          if (source_node.tags['Type de noeud'] && source_node.tags['Type de noeud'].length > 0 && source_node.tags['Type de noeud'][0] === 'produit' && source_node.colorParameter !== 'local' && source_node.colorTag in source_node.tags && source_node.tags[source_node.colorTag].length === 1) {
            selected_tag = source_node.tags[source_node.colorTag][0]
            if (selected_tag in data.nodeTags[source_node.colorTag].tags) {
              return data.nodeTags[source_node.colorTag].tags[selected_tag].color
            } else {
              return l.color
            }
          } else if (target_node.tags['Type de noeud'] && target_node.tags['Type de noeud'].length > 0 && target_node.tags['Type de noeud'][0] === 'produit' && target_node.colorParameter !== 'local' && target_node.colorTag in target_node.tags && target_node.tags[target_node.colorTag].length === 1) {
            selected_tag = target_node.tags[target_node.colorTag][0]
            if (selected_tag in data.nodeTags[target_node.colorTag].tags) {
              return data.nodeTags[target_node.colorTag].tags[selected_tag].color
            } else {
              return l.color
            }
          } else if ((!source_node.tags['Type de noeud'] || (source_node.tags['Type de noeud'].length > 0 && source_node.tags['Type de noeud'][0] === 'secteur')) && source_node.colorParameter !== 'local' && source_node.colorTag in source_node.tags && source_node.tags[source_node.colorTag].length === 1) {
            selected_tag = source_node.tags[source_node.colorTag][0]
            if (selected_tag in data.nodeTags[source_node.colorTag].tags) {
              return data.nodeTags[source_node.colorTag].tags[selected_tag].color
            } else {
              return l.color
            }
          } else if ((!target_node.tags['Type de noeud'] || (target_node.tags['Type de noeud'].length > 0 && target_node.tags['Type de noeud'][0] === 'secteur')) && target_node.colorParameter !== 'local' && target_node.colorTag in target_node.tags && target_node.tags[target_node.colorTag].length === 1) {
            selected_tag = target_node.tags[target_node.colorTag][0]
            if (data.nodeTags[target_node.colorTag].tags[selected_tag]) {
              return data.nodeTags[target_node.colorTag].tags[selected_tag].color
            } else {
              return l.color
            }
          } else if (source_node.tags['Type de noeud'] && source_node.tags['Type de noeud'].length > 0 && source_node.tags['Type de noeud'][0] === 'produit') {
            return source_node.color
          } else if (target_node.tags['Type de noeud'] && target_node.tags['Type de noeud'].length > 0 && target_node.tags['Type de noeud'][0] === 'produit') {
            return target_node.color
          } else {
            return l.color
          }
        }
      } else {
        colorNode = l.color
      }
    }
    if (l.colorParameter === 'local') {
      // Le couleur est définie dans les parametres locaux du noeud
      colorNode = l.color
    }

    return colorNode
  }

  const add_links = (
    static_sankey: boolean,
    remove_previous_links = false
  ) => {
    // Structure svg du link
    //- link : 
    //- text : 
    //- rect :
    //- rect :
    //- arrow :       
    d3.selectAll('#svg #sankey_def').remove()
    const defGradient = d3.select('#svg').append('defs').attr('id', 'sankey_def')


    const { display_style } = data
    if (remove_previous_links) {
      d3.select('#g_links').selectAll('.gg_links').remove()
    }
    d3.select('#svg').selectAll('.link_value').remove()

    if (display_links === undefined) {
      return
    }
    const gg_links = d3
      .select('#g_links')
      .selectAll('.gg_links')
      .data(Object.values(display_links).filter(l=>data.nodes[l.idSource].display && data.nodes[l.idTarget].display))
      .enter()
      .append('g')
      .attr('id', d => 'gg_' + d.idLink)
      .attr('class', 'gg_links')
      // On gere la visibilité directement sur gg_nodes avec un display <inline />
      .style('display', (d) => {
        let display: string
        if (link_visible(d, data)) { display = 'inline' } else { display = 'none' }
        return display
      })
      .attr('pointer-events', 'auto')
      .attr('cursor', (mode_selection == 's')? 'pointer' : 'unset')
      .attr('stroke-dasharray', d => {
        const link_value = getLinkValue(data, d.idLink)
        if (link_value === undefined) {
          return ''
        }
        const display_value = getLinkValue(data, d.idLink).display_value
        if (display_value.includes('*') && !data.show_structure) {
          return '40, 5'
        } 
        if (d.dashed) {
          return '40, 5'
        } else {
          return ''
        }
      })

    const paths = gg_links.append('path')
    if (!static_sankey && !mode_visualisation) {
      let error_msg: { text: string | undefined } | undefined
      paths.call(d3.drag<SVGPathElement, SankeyLink>()
        .subject(Object)
        .on('drag', function (event,l) {
          if(multi_selected_links.current.includes(l)){
            drag_link(display_nodes, display_links, display_style, data.nodeTags, this, event)
            Object.values(display_links).forEach(
              (link: SankeyLink) => {
                d3.select('#' + link.idLink).attr('d',
                  () => {
                    return drawCurve(data,
                      display_nodes, display_links, display_style,
                      data.nodeTags, link,
                      error_msg
                    )
                  }
                )
              }
            )
          }
        })
      )

    }
    gg_links
      .filter(
        d => d.label_position !== 'frozen' && d.label_on_path === true
      )
      .append('text')
      .attr('pointer-events', 'none')
      // .attr('style', 'font-weight: bold;font-family:Arial; font-size:' + display_style.font_size + 'px;')
      .attr('style', 'font-weight: bold; font-size:' + display_style.link_font_size + 'px;')
      .attr('fill', l => {
        if (l.text_color === l.color) {
          return link_color(l) as string
        }
        return l.text_color
      })
      .attr('dy', l => {
        if (l.orthogonal_label_position === 'middle') {
          return '0.3em'
        } else if (l.orthogonal_label_position === 'below') {
          return scale(getLinkValue(data, l.idLink).value) / 2 + 10 + 'px'
        } else if (l.orthogonal_label_position === 'above') {
          return -scale(getLinkValue(data, l.idLink).value) / 2 + 'px'
        }
        return '0.3em'
      })
      .append('textPath')
      .attr('id', d => d.idLink + '_text')
      .attr('side', link => {
        if (link.recycling) {
          if (data.nodes[link.idSource].x < data.nodes[link.idTarget].x) {
            return 'left'
          } else if (link.label_position === 'middle' && link.orientation === 'hh') {
            return 'right'
          }
          return 'left'
        } else {
          if (data.nodes[link.idSource].x < data.nodes[link.idTarget].x) {
            return 'left'
          } else {
            return 'right'
          }
          return 'left'
        }
      })
      .attr('class', 'link_value')
      .attr('href', d => '#' + d.idLink)


    const select2 = gg_links
      .filter(d => d.label_position === 'frozen' || !d.label_on_path || d.label_on_path === undefined)
      .append('text')


    select2
      .attr('href', d => '#' + d.idLink)
      .attr('id', d => d.idLink + '_text')
      .attr('pointer-events',d=>(d.label_position!=='frozen')?'none':'auto')
      .attr('class', 'link_value')
      .attr('style', 'font-weight: bold;font-size:' + display_style.link_font_size + 'px;')
      .attr('fill', l => {
        if (l.text_color === l.color && l.orthogonal_label_position === 'middle') {
          return 'white'
        }
        return l.text_color
      })
      .attr('visibility', d => link_visible(d, data) && getLinkValue(data, d.idLink).value >= Math.max(data.display_style.filter, data.display_style.filter_label) ? 'visible' : 'hidden')

    if (!static_sankey && !mode_visualisation) {
      // A voir avec Julien
      select2.call(d3.drag<SVGTextElement, SankeyLink>()
        .subject(Object).on('drag', function (event, link) {
          if (alt_key_pressed) {
            drag_link_text(link, event)
          }
        })
      )
        .on('click', (event, d) => {
          const source_node = display_nodes[d.idSource]
          const target_node = display_nodes[d.idTarget]
          select_link(d)
          // if classic link
          if (d.orientation === 'hh' && source_node.x < target_node.x) {
            d3.select('#link_center' + d.idLink).attr('fill-opacity', 0.7)
          }
        })
    }

    if (!static_sankey) {
      
      select2.call(d3.drag<SVGTextElement, SankeyLink>()
        .subject(Object).on('drag', function (event, link) {
          if (alt_key_pressed) {
            drag_link_text(link, event)
          }
          //Je ne sais pas à quoi ca sert mais cela fait planter le programme quand on essaye de drag le text d'un link sans utiliser alt
          // else {
          //   const text_id = d3.select(this).attr('id')
          //   const link_to_drag = text_id.substring(text_id.length - 5)
          //   drag_link(display_nodes, display_links, display_style, data.nodeTags, (d3.select(link_to_drag).node() as SVGPathElement), event)
          // }
        })
      )
    }
    let error_msg: { text?: string | undefined } | undefined
    paths
      .attr('class', 'link')
      .attr('id', d => d.idLink)
      .attr('fill', 'none')
      .attr('stroke-opacity', d => data.nodes[d.idSource].node_visible && data.nodes[d.idTarget].node_visible && getLinkValue(data, d.idLink).value >= display_style.filter ? (!((data as unknown) as { show_uncert: boolean }).show_uncert && (String(getLinkValue(data, d.idLink).display_value).includes('[')) ? 0.85 : 0.85) : 0)
      .attr('stroke-width', l => {


        const node = data.nodes[l.idSource]
        // const links = data.links
        const nodes = data.nodes
        // const stream_io = node.inputLinksId.concat(node.outputLinksId)
        //Met les flux entre les noeuds qui sont 'invalides' en mode fin pour afficehr erreurs

        //position noeud source ou target
        let pos_x_src, pos_y_src
        if (node.idNode == nodes[l.idSource].idNode) {
          pos_x_src = nodes[l.idTarget].x
          pos_y_src = nodes[l.idTarget].y
        } else {
          pos_x_src = nodes[l.idSource].x
          pos_y_src = nodes[l.idSource].y
        }


        const link_value = test_link_value(data, nodes, l, data.nodeTags)
        //Zones limite à ne pas êtres
        const limit_x = [pos_x_src - scale(link_value / 2), pos_x_src + node.node_width + scale(link_value / 2)]
        const limit_y = [pos_y_src - scale(link_value / 2), pos_y_src + scale(link_value / 2)]

        let draw_warning = false

        //verifie que la position du noeud drag n'est pas au même niveau que ses noeuds traget
        //si partie gauche du noeud ne se situe pas dans les coord du noeud source
        const left_in_src = node.x > limit_x[0] && node.x < limit_x[1]
        //si partie droite du noeud ne se situe pas dans le noeud source
        const right_in_src = node.x + node.node_width > limit_x[0] && node.x + node.node_width < limit_x[1]
        //si partie haute du noeud ne se situe pas dans le noeud source
        const top_in_src = node.y > limit_y[0] && node.y < limit_y[1]
        // const bottom_in_src = node.y + scale(link_value) > limit_y[0] && node.y + scale(link_value) < limit_y[1]

        if (l.orientation == 'hh') {
          //orientation hh
          draw_warning = left_in_src || right_in_src
        } else if (l.orientation == 'vv') {
          //orientation vv
          draw_warning = top_in_src
        } else if (l.orientation == 'vh') {
          draw_warning = left_in_src || right_in_src || top_in_src
        } else {
          //orientation hv 
          //draw_warning = node_in_src_hh || node_in_src_vv
          draw_warning = left_in_src || right_in_src || top_in_src
        }

        if (draw_warning && !l.recycling) {
          return '1px'
        } else {

          const link_value = test_link_value(data, display_nodes, l, data.nodeTags)
          return scale(Math.max(inv_scale(min_thickness), link_value ? link_value : 0))

        }

      })

      .attr('stroke', l => {
        const width_src = +d3.select('#' + l.idSource).attr('width')
        const height_src = +d3.select('#' + l.idSource).attr('height')
        const width_trgt = +d3.select('#' + l.idTarget).attr('width')
        // const height_trgt = +d3.select('#' + l.idTarget).attr('height')

        const gradient = defGradient.append('defs')
          .append('linearGradient')
          .attr('id', 'gradient-' + l.idSource + '-' + l.idTarget)
          .attr('gradientUnits', 'userSpaceOnUse')



        gradient.append('stop')
          .attr('id', 'stop-start')
          .attr('offset', '0%')
          .attr('stop-color', () => {

            if (data.nodes[l.idSource].x <= data.nodes[l.idTarget].x) {
              const n = data.nodes[l.idSource]
              if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data.nodeTags[n.colorTag].tags[selected_tag]
                if (tag) {
                  return tag.color as string
                }
              }
              if (n.shape_visible || n.iconName === 'none') {
                return n.color
              } else {
                return n.iconColor
              }
            } else {
              const n = data.nodes[l.idTarget]
              if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data.nodeTags[n.colorTag].tags[selected_tag]
                if (tag) {
                  return tag.color as string
                }
              }
              if (n.shape_visible || n.iconName === 'none') {
                return n.color
              } else {
                return n.iconColor
              }
            }
          })
          .attr('stop-opacity', 1)

        gradient.append('stop')
          .attr('id', 'stop-end')
          .attr('offset', '100%')
          .attr('stop-color', () => {
            if (data.nodes[l.idSource].x <= data.nodes[l.idTarget].x) {
              const n = data.nodes[l.idTarget]
              if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data.nodeTags[n.colorTag].tags[selected_tag]
                if (tag) {
                  return tag.color as string
                }
              }
              if (n.shape_visible || n.iconName === 'none') {
                return n.color
              } else {
                return n.iconColor
              }
            } else {
              const n = data.nodes[l.idSource]
              if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data.nodeTags[n.colorTag].tags[selected_tag]
                if (tag) {
                  return tag.color as string
                }
              }
              if (n.shape_visible || n.iconName === 'none') {
                return n.color
              } else {
                return n.iconColor
              }
            }
          })
          .attr('stop-opacity', 1)


        const nodes = data.nodes

        if (l.orientation == 'hh' || l.orientation == 'hv') {
          d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-start').attr('stop-color', () => {
            if (nodes[l.idSource].x < nodes[l.idTarget].x) {
              d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
                .attr('x1', data.nodes[l.idSource].x + width_src)
                .attr('y1', '0')
                .attr('x2', nodes[l.idTarget].x)
                .attr('y2', 0)
              const n = data.nodes[l.idSource]
              if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data.nodeTags[n.colorTag].tags[selected_tag]
                if (tag) {
                  return tag.color as string
                }
              }
              if (n.shape_visible || n.iconName === 'none') {
                return n.color
              } else {
                return n.iconColor
              }
            } else {
              d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
                .attr('x1', data.nodes[l.idTarget].x + width_trgt)
                .attr('y1', '0')
                .attr('x2', nodes[l.idSource].x)
                .attr('y2', 0)
              const n = nodes[l.idTarget]
              if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data.nodeTags[n.colorTag].tags[selected_tag]
                if (tag) {
                  return tag.color as string
                }
              }
              if (n.shape_visible || n.iconName === 'none') {
                return n.color
              } else {
                return n.iconColor
              }
            }
          }
          )

          d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-end').attr('stop-color', () => {
            if (nodes[l.idSource].x > nodes[l.idTarget].x) {
              const n = nodes[l.idSource]
              if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data.nodeTags[n.colorTag].tags[selected_tag]
                if (tag) {
                  return tag.color as string
                }
              }
              if (n.shape_visible || n.iconName === 'none') {
                return n.color
              } else {
                return n.iconColor
              }
            } else {
              const n = nodes[l.idTarget]
              if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data.nodeTags[n.colorTag].tags[selected_tag]
                if (tag) {
                  return tag.color as string
                }
              }
              if (n.shape_visible || n.iconName === 'none') {
                return n.color
              } else {
                return n.iconColor
              }
            }
          }
          )
        } else if (l.orientation == 'vv' || l.orientation == 'hv') {
          //orientation vert-vert
          d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-start').attr('stop-color', () => {
            if (nodes[l.idSource].y < nodes[l.idTarget].y) {
              d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
                .attr('x1', 0)
                .attr('y1', data.nodes[l.idSource].y + height_src)
                .attr('x2', 0)
                .attr('y2', data.nodes[l.idTarget].y)

              const n = nodes[l.idSource]
              if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data.nodeTags[n.colorTag].tags[selected_tag]
                if (tag) {
                  return tag.color as string
                }
              }
              if (n.shape_visible || n.iconName === 'none') {
                return n.color
              } else {
                return n.iconColor
              }
            } else {
              d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
                .attr('x1', 0)
                .attr('y1', data.nodes[l.idTarget].y + height_src)
                .attr('x2', 0)
                .attr('y2', data.nodes[l.idSource].y)

              const n = nodes[l.idTarget]
              if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data.nodeTags[n.colorTag].tags[selected_tag]
                if (tag) {
                  return tag.color as string
                }
              }
              if (n.shape_visible || n.iconName === 'none') {
                return n.color
              } else {
                return n.iconColor
              }
            }
          }
          )

          d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-end').attr('stop-color', () => {
            if (nodes[l.idSource].y > nodes[l.idTarget].y) {
              const n = nodes[l.idSource]
              if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data.nodeTags[n.colorTag].tags[selected_tag]
                if (tag) {
                  return tag.color as string
                }
              }
              if (n.shape_visible || n.iconName === 'none') {
                return n.color
              } else {
                return n.iconColor
              }
            } else {
              const n = nodes[l.idTarget]
              if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data.nodeTags[n.colorTag].tags[selected_tag]
                if (tag) {
                  return tag.color as string
                }
              }
              if (n.shape_visible || n.iconName === 'none') {
                return n.color
              } else {
                return n.iconColor
              }
            }
          }
          )
        } else if (l.orientation == 'vh') {

          d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-start').attr('stop-color', () => {
            if (nodes[l.idSource].x < nodes[l.idTarget].x) {
              d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
                .attr('x1', data.nodes[l.idSource].x + width_src - 10)
                .attr('y1', '0')
                .attr('x2', nodes[l.idTarget].x)
                .attr('y2', 0)
              const n = nodes[l.idSource]
              if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data.nodeTags[n.colorTag].tags[selected_tag]
                if (tag) {
                  return tag.color as string
                }
              }
              if (n.shape_visible || n.iconName === 'none') {
                return n.color
              } else {
                return n.iconColor
              }
            } else {
              d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
                .attr('x1', data.nodes[l.idTarget].x + width_trgt + 10)
                .attr('y1', '0')
                .attr('x2', nodes[l.idSource].x)
                .attr('y2', 0)
              const n = nodes[l.idTarget]
              if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data.nodeTags[n.colorTag].tags[selected_tag]
                if (tag) {
                  return tag.color as string
                }
              }
              if (n.shape_visible || n.iconName === 'none') {
                return n.color
              } else {
                return n.iconColor
              }
            }
          }
          )

          d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-end').attr('stop-color', () => {
            if (nodes[l.idSource].x > nodes[l.idTarget].x) {
              const n = nodes[l.idSource]
              if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data.nodeTags[n.colorTag].tags[selected_tag]
                if (tag) {
                  return tag.color as string
                }
              }
              if (n.shape_visible || n.iconName === 'none') {
                return n.color as string
              } else {
                return n.iconColor as string
              }
            } else {
              const n = nodes[l.idTarget]
              if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data.nodeTags[n.colorTag].tags[selected_tag]
                if (tag) {
                  return tag.color as string
                }
              }
              if (n.shape_visible || n.iconName === 'none') {
                return n.color as string
              } else {
                return n.iconColor as string
              }
            }
          }
          )

        }

        return (l.gradient) ? 'url(#gradient-' + l.idSource + '-' + l.idTarget + ')' : link_color(l) as string
      }
      )
      .on('mouseover', function (event, d) {
        if (!event.shiftKey && !static_sankey) {
          return
        }
        sankeyTooltip
          .html(linkTooltipsContent(data, d))
        if (data.nodes[d.idSource].node_visible && data.nodes[d.idTarget].node_visible && getLinkValue(data, d.idLink).value >= display_style.filter) {
          return d3.select(this).attr('stroke-opacity', '0.5')
        }
      })
      .on('mousemove', (event) => {
        if (!event.shiftKey && !static_sankey) {
          return
        }
        sankeyTooltip
          .style('opacity', 1)
          .style('top', Math.max(margin_top + 50, event.pageY - 10) + 'px')
          .style('left', (event.pageX + 30) + 'px')
      })
      .on('mouseout', function (event, d) {
        sankeyTooltip.style('opacity', 0)
        if (data.nodes[d.idSource].node_visible && data.nodes[d.idTarget].node_visible && getLinkValue(data, d.idLink).value >= display_style.filter) {
          const opacity = String(getLinkValue(data, d.idLink).display_value).includes('[') ? 0.85 : 0.85
          return d3.select(this).attr('stroke-opacity', opacity)
        }
      })

    paths.on('click', function (event, d) {
      if ((event.ctrlKey || event.metaKey) && !mode_visualisation) {
        sankeyTooltip.style('opacity', 0)
        if ( button_ref && button_ref.current && accordion_ref && accordion_ref.current==null) {
          button_ref.current.click()
        }

        multi_selected_links.current = multi_selected_links.current.filter(d => (d != null && d.idLink != ''))

        if (multi_selected_links.current.includes(d)) {
          multi_selected_links.current.splice(multi_selected_links.current.indexOf(d), 1)
          d3.selectAll('#gg_' + d.idLink + ' rect').attr('fill-opacity', '0')
        } else {
          multi_selected_links.current.push(d)
          d3.selectAll('#gg_' + d.idLink + ' rect').attr('fill-opacity', '1')
        }

        if ( accordion_ref && accordion_ref.current) {
          for ( const child in accordion_ref.current.children) {
            if (accordion_ref.current.children[child].id === 'Flux') {
              (accordion_ref.current.children[0] as HTMLLabelElement).click();
              (accordion_ref.current.children[child] as HTMLLabelElement).click()
            }
          }
        }
        if ( links_accordion_ref && links_accordion_ref.current) {
          (links_accordion_ref.current.children[0] as HTMLLabelElement).click();
          (links_accordion_ref.current.children[1] as HTMLLabelElement).click()
        }

        select_link(d)

      }

    })
    const arrowVisible=(l :SankeyLink)=>{
      return  data.nodes[l.idSource].display && data.nodes[l.idTarget].display && l.arrow

    }
    //Creation des Arrows associés au link
    d3.selectAll('.ggg_nodes')
      .filter(n => node_arrow_visible(n))      
    //   .each(function (n) {
    //     drawArrows(data, n as SankeyNode, display_nodes, display_links, display_style, data.nodeTags)
    //   })


    d3.selectAll('.gg_links')
      .filter(l=>arrowVisible(l as SankeyLink))
      .each(function (l) {
        const n =data.nodes[(l as SankeyLink).idTarget]
        drawArrows(data, n as SankeyNode, display_nodes, display_links, display_style, data.nodeTags)
      })

    paths.attr('d', d => {
      setNodesHeight(display_nodes, display_links, d, data.nodeTags)
      return drawCurve(data,
        display_nodes, display_links, display_style,
        data.nodeTags, d, error_msg
      )
    })
    if (error_msg && error_msg.text) {
      alert(error_msg.text)
    }
  }



  const update_scale = (user_scale: number) => {
    scale.domain([0, user_scale])
    inv_scale.range([0, user_scale])
  }

  const drag_nodes = (
    nodes: { [node_id: string]: SankeyNode },
    links: { [link_id: string]: SankeyLink },
    display_style: { italic?: boolean; bold?: boolean; node_font_size: number; link_font_size: number; uppercase?: boolean; trade_close?: boolean; filter: number; filter_label: number },
    nodeTags: TagsCatalog,
    event: { dx: number; dy: number }
  ) => {
    const { width } = data
    removeAnimate()
    multi_selected_nodes.current.forEach(node=>{
      const old_x = +node.x
      const old_y = +node.y
      const new_x = old_x + event.dx
      const new_y = old_y + event.dy
  
  
      if (new_x < 0 || new_x > (width - node.node_width) || new_y < 0 || new_y > (data.height - node.node_height)) {
        return
      }
  
      node.x = new_x
      node.y = new_y;
  
  
  
      [data.width, data.height] = min_width_and_height()
      if (data.fit_screen) {
        const svgSankey = d3.select('#svg')
        svgSankey.attr('viewBox', [0, 0, data.width, data.height] as unknown as string)
      } else {
        d3.select('#svg').style('width', data.width + 'px')
      }
  
  
  
      d3.select('#svg').style('height', data.height + 'px')
      drawGrid()
  
      const stream_io = node.inputLinksId.concat(node.outputLinksId)
      //Met les flux entre les noeuds qui sont 'invalides' en mode fin pour afficehr erreurs
      for (const i in stream_io) {
        const l = links[stream_io[i]]
        if ( !data.nodes[l.idSource].display && !data.nodes[l.idTarget].display) {
          continue
        }
  
        //position noeud source ou target
        let pos_x_src, pos_y_src
        if (node.idNode == nodes[l.idSource].idNode) {
          pos_x_src = nodes[l.idTarget].x
          pos_y_src = nodes[l.idTarget].y
        } else {
          pos_x_src = nodes[l.idSource].x
          pos_y_src = nodes[l.idSource].y
        }
  
  
        const link_value = test_link_value(data, nodes, l, nodeTags)
        //Zones limite à ne pas êtres
        const limit_x = [pos_x_src - scale(link_value), pos_x_src + node.node_width + scale(link_value)]
        const limit_y = [pos_y_src - scale(link_value), pos_y_src + scale(link_value)]
  
        let draw_warning = false
  
        //verifie que la position du noeud drag n'est pas au même niveau que ses noeuds traget
        //si partie gauche du noeud ne se situe pas dans les coord du noeud source
        const left_in_src = node.x > limit_x[0] && node.x < limit_x[1]
        //si partie droite du noeud ne se situe pas dans le noeud source
        const right_in_src = node.x + node.node_width > limit_x[0] && node.x + node.node_width < limit_x[1]
        //si partie haute du noeud ne se situe pas dans le noeud source
        const top_in_src = node.y > limit_y[0] && node.y < limit_y[1]
        //const bottom_in_src = node.y + scale(link_value) > limit_y[0] && node.y + scale(link_value) < limit_y[1]
  
        if (l.orientation == 'hh') {
          //orientation hh
          draw_warning = left_in_src || right_in_src
        } else if (l.orientation == 'vv') {
          //orientation vv
          draw_warning = top_in_src
        } else if (l.orientation == 'vh') {
          draw_warning = left_in_src || right_in_src || top_in_src
        } else {
          //orientation hv 
          draw_warning = left_in_src || right_in_src || top_in_src
        }
  
        if (draw_warning && !l.recycling) {
          d3.select('#' + l.idLink).attr('stroke-width', '1px')
        } else {
          //retour à la normal
          d3.select('#' + l.idLink).attr('stroke-width', d => {
            const link_value = test_link_value(data, display_nodes, d, data.nodeTags)
            return scale(Math.max(inv_scale(min_thickness), link_value ? link_value : 0))
          })
        }
      }
  
      sankeyTooltip.style('opacity', 0) // Fermeture de la tooltip au click
  
      d3.select('#ggg_'+node.idNode).attr('transform', 'translate(' + new_x + ',' + new_y + ')')
      d3.select('#tooltip_node' + node.idNode).attr('transform', 'translate(' + (new_x + 50) + ',' + (new_y + 20) + ')')
      const error_msg: { [text: string]: string } = {}
      Object.values(links).filter(l=>data.nodes[l.idSource].display && data.nodes[l.idTarget].display).forEach(
        link => {
  
  
          //Redessine les gradients correctement si la pos du noeud source passe de l'autre coté du noeud target
          if (link.gradient) {
            const width_src = +d3.select('#' + link.idSource).attr('width')
            const height_src = +d3.select('#' + link.idSource).attr('height')
            const width_trgt = +d3.select('#' + link.idTarget).attr('width')
            //const height_trgt = +d3.select('#' + link.idTarget).attr('height')
  
  
            if (link.orientation == 'hh' || link.orientation == 'hv') {
              d3.select('#gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode + ' #stop-start').attr('stop-color', () => {
                if (nodes[link.idSource].x < nodes[link.idTarget].x) {
                  d3.select('#gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode)
                    .attr('x1', data.nodes[link.idSource].x + width_src)
                    .attr('y1', '0')
                    .attr('x2', nodes[link.idTarget].x)
                    .attr('y2', 0)
                  const n = nodes[link.idSource]
                  if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
                    const selected_tag = n.tags[n.colorTag][0]
                    const tag = data.nodeTags[n.colorTag].tags[selected_tag]
                    if (tag) {
                      return tag.color as string
                    }
                  }
                  if (n.shape_visible || n.iconName === 'none') {
                    return n.color
                  } else {
                    return n.iconColor
                  }
                } else {
                  d3.select('#gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode)
                    .attr('x1', data.nodes[link.idTarget].x + width_trgt)
                    .attr('y1', '0')
                    .attr('x2', nodes[link.idSource].x)
                    .attr('y2', 0)
                  const n = nodes[link.idTarget]
                  if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
                    const selected_tag = n.tags[n.colorTag][0]
                    const tag = data.nodeTags[n.colorTag].tags[selected_tag]
                    if (tag) {
                      return tag.color as string
                    }
                  }
                  if (n.shape_visible || n.iconName === 'none') {
                    return n.color
                  } else {
                    return n.iconColor
                  }
                }
              }
              )
  
              d3.select('#gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode + ' #stop-end').attr('stop-color', () => {
                if (nodes[link.idSource].x > nodes[link.idTarget].x) {
                  const n = nodes[link.idSource]
                  if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
                    const selected_tag = n.tags[n.colorTag][0]
                    const tag = data.nodeTags[n.colorTag].tags[selected_tag]
                    if (tag) {
                      return tag.color as string
                    }
                  }
                  if (n.shape_visible || n.iconName === 'none') {
                    return n.color
                  } else {
                    return n.iconColor
                  }
                } else {
                  const n = nodes[link.idTarget]
                  if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
                    const selected_tag = n.tags[n.colorTag][0]
                    const tag = data.nodeTags[n.colorTag].tags[selected_tag]
                    if (tag) {
                      return tag.color as string
                    }
                  }
                  if (n.shape_visible || n.iconName === 'none') {
                    return n.color
                  } else {
                    return n.iconColor
                  }
                }
              }
              )
            } else if (link.orientation == 'vv' || link.orientation == 'hv') {
              //orientation vert-vert
              d3.select('#gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode + ' #stop-start').attr('stop-color', () => {
                if (nodes[link.idSource].y < nodes[link.idTarget].y) {
                  d3.select('#gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode)
                    .attr('x1', 0)
                    .attr('y1', data.nodes[link.idSource].y + height_src)
                    .attr('x2', 0)
                    .attr('y2', data.nodes[link.idTarget].y)
  
                  return nodes[link.idSource].color
                } else {
                  d3.select('#gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode)
                    .attr('x1', 0)
                    .attr('y1', data.nodes[link.idTarget].y + height_src)
                    .attr('x2', 0)
                    .attr('y2', data.nodes[link.idSource].y)
  
                  return nodes[link.idTarget].color
                }
              }
              )
  
              d3.select('#gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode + ' #stop-end').attr('stop-color', () => {
                if (nodes[link.idSource].y > nodes[link.idTarget].y) {
                  return nodes[link.idSource].color
                } else {
                  return nodes[link.idTarget].color
                }
              }
              )
            } else if (link.orientation == 'vh') {
  
              d3.select('#gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode + ' #stop-start').attr('stop-color', () => {
                if (nodes[link.idSource].x < nodes[link.idTarget].x) {
                  d3.select('#gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode)
                    .attr('x1', data.nodes[link.idSource].x + width_src - 10)
                    .attr('y1', '0')
                    .attr('x2', nodes[link.idTarget].x)
                    .attr('y2', 0)
                  const n = nodes[link.idSource]
                  if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
                    const selected_tag = n.tags[n.colorTag][0]
                    const tag = data.nodeTags[n.colorTag].tags[selected_tag]
                    if (tag) {
                      return tag.color as string
                    }
                  }
                  if (n.shape_visible || n.iconName === 'none') {
                    return n.color
                  } else {
                    return n.iconColor
                  }
                } else {
                  d3.select('#gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode)
                    .attr('x1', data.nodes[link.idTarget].x + width_trgt + 10)
                    .attr('y1', '0')
                    .attr('x2', nodes[link.idSource].x)
                    .attr('y2', 0)
                  const n = nodes[link.idTarget]
                  if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
                    const selected_tag = n.tags[n.colorTag][0]
                    const tag = data.nodeTags[n.colorTag].tags[selected_tag]
                    if (tag) {
                      return tag.color as string
                    }
                  }
                  if (n.shape_visible || n.iconName === 'none') {
                    return n.color
                  } else {
                    return n.iconColor
                  }
                }
              }
              )
  
              d3.select('#gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode + ' #stop-end').attr('stop-color', () => {
                if (nodes[link.idSource].x > nodes[link.idTarget].x) {
                  const n = nodes[link.idSource]
                  if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
                    const selected_tag = n.tags[n.colorTag][0]
                    const tag = data.nodeTags[n.colorTag].tags[selected_tag]
                    if (tag) {
                      return tag.color as string
                    }
                  }
                  if (n.shape_visible || n.iconName === 'none') {
                    return n.color
                  } else {
                    return n.iconColor
                  }
                } else {
                  const n = nodes[link.idTarget]
                  if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
                    const selected_tag = n.tags[n.colorTag][0]
                    const tag = data.nodeTags[n.colorTag].tags[selected_tag]
                    if (tag) {
                      return tag.color as string
                    }
                  }
                  if (n.shape_visible || n.iconName === 'none') {
                    return n.color
                  } else {
                    return n.iconColor
                  }
                }
              }
              )
  
            }
  
          }
  
          if (link.label_on_path) {
            if (link.recycling) {
              if (data.nodes[link.idSource].x < data.nodes[link.idTarget].x) {
                d3.select('#' + link.idLink + '_text').attr('side', 'left')
              } else if (link.label_position === 'middle' && link.orientation === 'hh') {
                d3.select('#' + link.idLink + '_text').attr('side', 'right')
              }
            } else {
              if (data.nodes[link.idSource].x < data.nodes[link.idTarget].x) {
                d3.select('#' + link.idLink + '_text').attr('side', 'left')
              } else if (link.label_position === 'middle' /*&& link.orientation === 'hh'*/) {
                d3.select('#' + link.idLink + '_text').attr('side', 'right')
              }
            }
           
            if (link.orthogonal_label_position === 'middle') {
              d3.select('#' + link.idLink + '_text').attr('dy', '0.3em')
            } else if (link.orthogonal_label_position === 'below') {
              // return scale(getLinkValue(data, link.idLink).value) / 2 + 10 + 'px'
              d3.select('#' + link.idLink + '_text').attr('dy',scale(getLinkValue(data, link.idLink).value) / 2 + 10 + 'px')
              d3.select('#' + link.idLink + '_text').attr('dy',scale(getLinkValue(data, link.idLink).value) / 2 + 10 + 'px')
  
            } else if (link.orthogonal_label_position === 'above') {
              // return -scale(getLinkValue(data, link.idLink).value) / 2 + 'px'
              d3.select('#' + link.idLink + '_text').attr('dy',scale(getLinkValue(data, link.idLink).value) / 2 + 'px')
  
            }
          
          }
  
          if (link.idSource === node.idNode || link.idTarget === node.idNode) {
            // Redraw link
            const old_x_pos = +d3.select('#' + link.idLink + '_text').attr('x')
            const old_y_pos = +d3.select('#' + link.idLink + '_text').attr('y')
            if (!(link.label_position === 'frozen')) {
              d3.select('#' + link.idLink + '_text').attr('x', old_x_pos + 1 / 2 * (new_x - old_x))
              d3.select('#' + link.idLink + '_text').attr('y', old_y_pos + 1 / 2 * (new_y - old_y))
            }
            // select allows to redraw directly without refreshing
            d3.select('#' + link.idLink)
              .attr('d', () => {
                return drawCurve(data,
                  nodes, links, display_style,
                  data.nodeTags,
                  link,
                  error_msg
                )
              })
            const target_node = nodes[link.idTarget]
            if (link.arrow) {
              drawArrows(data, target_node, nodes, links, display_style, nodeTags)
            }
            for (let i = 0; i < target_node.inputLinksId.length; i++) {
              d3.select('#' + target_node.inputLinksId[i])
                .attr('d', (link => {
                  return drawCurve(data,
                    nodes, links, display_style,
                    nodeTags,
                    link as SankeyLink,
                    error_msg
                  )
                }))
            }
            for (let i = 0; i < target_node.outputLinksId.length; i++) {
              d3.select('#' + target_node.outputLinksId[i])
                .attr('d', link => {
                  return drawCurve(data,
                    nodes, links, display_style,
                    nodeTags,
                    link as SankeyLink,
                    error_msg
                  )
                })
  
            }
          }
        })
  
      if (error_msg.text !== undefined) {
        alert(error_msg)
      }

    })
   
  }

  const drag_link = (
    nodes: { [node_id: string]: SankeyNode },
    links: { [link_id: string]: SankeyLink },
    display_style: { node_font_size: number; link_font_size: number; filter: number; filter_label: number },
    nodeTags: TagsCatalog,
    dragged: SVGPathElement | null,
    event: d3.D3DragEvent<Element, SankeyLink, unknown>
  ) => {
    const idLink = d3.select(dragged).attr('id')
    const p2 = d3.pointer(event, (d3.select('#g_links').node() as SVGGElement))
    const linked_node = identify_node(nodes, links, links[idLink], p2)
    if (linked_node === undefined) {
      return
    }
    const node = nodes[linked_node.node_id]

    if (linked_node.type === 'source') {
      const source_order = node.outputLinksId.indexOf(idLink)
      let output_offset = 0
      for (let i = 1; i < node.outputLinksId.length; i++) {
        const link = links[node.outputLinksId[i - 1]]
        if (i > source_order) {
          break
        }
        output_offset += getLinkValue(data, link.idLink).value
      }
      const number_of_links = node.outputLinksId.length
      const value = getLinkValue(data, idLink).value
      if (links[idLink].orientation === 'hh' || links[idLink].orientation === 'hv') {
        if (source_order < number_of_links - 1 && d3.pointer(event, (d3.select('#g_links').node() as SVGGElement))[1] + event.dy >= linked_node.origin + scale(output_offset + value)) {
          swap(node.outputLinksId, source_order, source_order + 1)
        }
        if (source_order > 0 && d3.pointer(event, (d3.select('#g_links').node() as SVGGElement))[1] + event.dy <= linked_node.origin + scale(output_offset)) {
          swap(node.outputLinksId, source_order, source_order - 1)
        }
      } else if (links[idLink].orientation === 'vv') {
        if (source_order < number_of_links - 1 && d3.pointer(event, (d3.select('#g_links').node() as SVGGElement))[0] + event.dx >= linked_node.origin + scale(output_offset + value)) {
          swap(node.outputLinksId, source_order, source_order + 1)
        }
        if (source_order > 0 && d3.pointer(event, (d3.select('#g_links').node() as SVGGElement))[0] + event.dx <= linked_node.origin + scale(output_offset)) {
          swap(node.outputLinksId, source_order, source_order - 1)
        }
      }
    }
    if (linked_node.type === 'target') {
      const target_order = node.inputLinksId.indexOf(idLink)
      let input_offset = 0
      for (let i = 1; i < node.inputLinksId.length; i++) {
        if (i > target_order) {
          break
        }
        input_offset += getLinkValue(data, node.inputLinksId[i - 1]).value
      }
      const number_of_links = node.inputLinksId.length
      const value = getLinkValue(data, idLink).value
      if (links[idLink].orientation === 'hh') {
        if (target_order < number_of_links - 1 && d3.pointer(event, (d3.select('#g_links').node() as SVGGElement))[1] + event.dy >= linked_node.origin + scale(input_offset + value)) {
          swap(node.inputLinksId, target_order, target_order + 1)
        }
        if (target_order > 0 && d3.pointer(event, (d3.select('#g_links').node() as SVGGElement))[1] + event.dy <= linked_node.origin + scale(input_offset)) {
          swap(node.inputLinksId, target_order, target_order - 1)
        }
      } else if (links[idLink].orientation === 'vv') {
        if (target_order < number_of_links - 1 && d3.pointer(event, (d3.select('#g_links').node() as SVGGElement))[0] + event.dx >= linked_node.origin + scale(input_offset + value)) {
          swap(node.inputLinksId, target_order, target_order + 1)
        }
        if (target_order > 0 && d3.pointer(event, (d3.select('#g_links').node() as SVGGElement))[0] + event.dx <= linked_node.origin + scale(input_offset)) {
          swap(node.inputLinksId, target_order, target_order - 1)
        }
      }
      drawArrows(data, node, nodes, links, display_style, nodeTags)
    }
  }

  const drag_handle = (
    link: SankeyLink,
    nodes: { [node_id: string]: SankeyNode },
    links: { [link_id: string]: SankeyLink },
    display_style: { node_font_size: number; link_font_size: number; filter: number; filter_label: number },
    selected_tags: { [tag_group: string]: string[] },
    dragged: Element,
    handle_type: string,
    the_event: d3.D3DragEvent<Element, unknown, unknown>
  ) => {

    const old_x = +d3.select(dragged).attr('transform').split(',')[0].substring(10)
    const old_y_str = d3.select(dragged).attr('transform').split(',')[1]
    const old_y = +old_y_str.substring(0, old_y_str.length - 1)
    const new_x = old_x + the_event.dx
    const new_y = old_y + the_event.dy
    const d: SankeyLink = d3.select(dragged).data()[0] as SankeyLink
    let u_center_new = -1
    const source_node = nodes[d.idSource]
    const target_node = nodes[d.idTarget]

    const [xs, ys, xt, yt] = compute_end_points(source_node, target_node, link, nodes, links, selected_tags)

    if (!d.recycling) {
      if (d.orientation === 'hh') {
        const link_x_length = Math.abs(xt - xs)
        u_center_new = Math.abs(new_x - xs) / link_x_length
      } else if (d.orientation === 'vv') {
        const link_y_length = Math.abs(yt - ys)
        u_center_new = Math.abs(new_y - ys) / link_y_length
      }
      if (u_center_new >= 0 && u_center_new <= 1) {
        if (handle_type === 'left') {
          d.left_horiz_shift = u_center_new
          if (d.right_horiz_shift && d.left_horiz_shift && d.right_horiz_shift < d.left_horiz_shift) {
            d.right_horiz_shift = d.left_horiz_shift
          }
        } else {
          d.right_horiz_shift = u_center_new
          if (d.right_horiz_shift && d.left_horiz_shift && d.right_horiz_shift < d.left_horiz_shift) {
            d.left_horiz_shift = d.right_horiz_shift
          }
        }
      } else {
        return
      }
    } else if (handle_type === 'vert') {
      const vert_shift = d.vert_shift ? d.vert_shift : 0
      d.vert_shift = vert_shift + the_event.dy
      if (data.height < d.vert_shift + Math.max(data.nodes[d.idSource].y, data.nodes[d.idTarget].y) + 100) {
        data.height = d.vert_shift + Math.max(data.nodes[d.idSource].y, data.nodes[d.idTarget].y) + 100
        d3.select('#svg').style('height', data.height + 'px')
        drawGrid()
      }
      const [, min_height] = min_width_and_height()
      if (data.height > min_height) {
        data.height = min_height
        d3.select('#svg').style('height', data.height + 'px')
        drawGrid()
      }
    } else if (handle_type === 'left') {
      const left_horiz_shift = d.left_horiz_shift ? d.left_horiz_shift : 0
      if (left_horiz_shift + the_event.dx < default_horiz_shift && new_x > scale(getLinkValue(data, d.idLink).value) / 2) {
        d.left_horiz_shift = left_horiz_shift + the_event.dx
      } else {
        return
      }
    } else if (handle_type === 'right') {
      const right_horiz_shift = d.right_horiz_shift ? d.right_horiz_shift : 0
      if (right_horiz_shift + the_event.dx > -default_horiz_shift) {
        d.right_horiz_shift = right_horiz_shift + the_event.dx
        if (data.width < d.right_horiz_shift + data.nodes[d.idSource].x + 200) {
          data.width = d.right_horiz_shift + data.nodes[d.idSource].x + 200
          d3.select('#svg').style('width', data.width + 'px')
          drawGrid()
        }
        const [min_width,] = min_width_and_height()
        if (data.width > min_width) {
          data.width = min_width
          d3.select('#svg').style('width', data.width + 'px')
          drawGrid()
        }
      } else {
        return
      }
    }
    d3.select('#' + d.idLink).attr('d', () => {
      let error_msg
      return drawCurve(data,
        nodes, links, display_style,
        data.nodeTags, d, error_msg
      )
    })
  }

  // Identify the node that is the closest from mouse click (either source or target).
  const identify_node = (
    nodes: { [node_id: string]: SankeyNode },
    links: { [link_id: string]: SankeyLink },
    link: SankeyLink,
    mouse_coord: number[]
  ) => {
    const source_node = nodes[link.idSource]
    const target_node = nodes[link.idTarget]

    const source_x_min = source_node.x
    const source_x_max = source_x_min + parseInt(d3.select('#' + source_node.idNode).attr('width'))
    const source_y_min = source_node.y
    const source_y_max = source_y_min + parseInt(d3.select('#' + source_node.idNode).attr('height'))
    const target_x_min = target_node.x
    const target_x_max = target_x_min + parseInt(d3.select('#' + target_node.idNode).attr('width'))
    const target_y_min = target_node.y
    const target_y_max = target_y_min + parseInt(d3.select('#' + target_node.idNode).attr('height'))
    const tolerance = 3 * source_node.node_width

    if ((link.orientation === 'hh' || link.orientation === 'hv') && mouse_coord[1] >= source_y_min && mouse_coord[1] <= source_y_max && (mouse_coord[0] <= source_x_max + tolerance)) {
      return { 'node_id': source_node.idNode, 'type': 'source', 'origin': source_y_min }
    }
    if ((link.orientation === 'hh' || link.orientation === 'hv') && mouse_coord[1] >= target_y_min && mouse_coord[1] <= target_y_max && (mouse_coord[0] >= target_x_min - tolerance)) {
      return { 'node_id': target_node.idNode, 'type': 'target', 'origin': target_y_min }
    }
    if ((link.orientation === 'vv' || link.orientation === 'vh') && mouse_coord[0] >= source_x_min && mouse_coord[0] <= source_x_max && (mouse_coord[1] <= source_y_max + tolerance)) {
      return { 'node_id': source_node.idNode, 'type': 'source', 'origin': source_x_min }
    }
    if ((link.orientation === 'vv' || link.orientation === 'vh') && mouse_coord[0] >= target_x_min && mouse_coord[0] <= target_x_max && (mouse_coord[1] >= target_y_min - tolerance)) {
      return { 'node_id': target_node.idNode, 'type': 'target', 'origin': target_x_min }
    }
  }

  const add_shift_handle = (
    link: SankeyLink,
    nodes: { [node_id: string]: SankeyNode },
    links: { [link_id: string]: SankeyLink },
    display_style: { node_font_size: number; link_font_size: number; filter: number; filter_label: number },
    selected_tags: { [tag_group: string]: string[] },
    shift_name: string,
    position: string
  ) => {
    if (Object.values(data.links).map(d => d.idLink).includes(link.idLink)) {
      d3.select('#gg_' + link.idLink)
        .append('rect')
        .attr('id', shift_name + link.idLink)
        .attr('fill-opacity', (multi_selected_links.current.includes(link) && !mode_visualisation)?1:0)
        .attr('width', default_handle_size)
        .attr('height', default_handle_size)
        // .on('mouseover', function () {
        //   d3.select(this).attr('cursor', 'grab')
        //   d3.select(this).attr('fill-opacity', '0.7')
        // })
        // .on('mouseout', function () {
        //   d3.select(this).attr('fill-opacity', '1')
        // })
        .attr('cursor', 'ew-resize')
        .call(d3.drag<SVGRectElement, unknown>()
          .subject(Object).on('drag', function (event) {
            if(multi_selected_links.current.includes(link) && !mode_visualisation){
              drag_handle(
                link, nodes, links, display_style,
                selected_tags,
                this, position, event
              )
            }
            
          })
        )
    }

  }

  const add_shift_handles = (
    link: SankeyLink,
    nodes: { [node_id: string]: SankeyNode },
    links: { [link_id: string]: SankeyLink },
    display_style: { node_font_size: number; link_font_size: number; filter: number; filter_label: number },
    selected_tags: { [tag_group: string]: string[] },
    xs: number,
    ys: number,
    xt: number,
    yt: number
  ) => {
    let shift_handles
    if (link.recycling) {
      shift_handles = [
        ['vert_shift', 'vert'],
        ['left_horiz_shift', 'left'],
        ['right_horiz_shift', 'right']
      ]
    } else {
      shift_handles = [
        ['left_horiz_shift', 'left'],
        ['right_horiz_shift', 'right']
      ]
    }
    for (let i = 0; i < shift_handles.length; i++) {
      const selection = d3.select('#' + shift_handles[i][0] + link.idLink)
      if (selection.empty()) { // if the handle do not exist, create it
        add_shift_handle(
          link, nodes, links, display_style, selected_tags, shift_handles[i][0], shift_handles[i][1]
        )
      }
    }
    for (let i = 0; i < shift_handles.length; i++) {
      // Draw handle at the correct position
      d3.select('#' + shift_handles[i][0] + link.idLink)
        .attr('transform', () => {
          const handle_pos = handles_positions(links, link, xs, ys, xt, yt)
          return handle_pos[i] // 0 => vertical handle
        })
    }
  }

  // drawLinkText
  // Affichage de la valeur du flux dans le link en fonction des options
  // Position latérale ; middle, beginning, end et frozen
  const drawLinkText = (
    data: SankeyData,
    link: SankeyLink,
    links: { [link_id: string]: SankeyLink },
    link_value: number,
    display_style: { node_font_size: number; link_font_size: number; filter: number; filter_label: number },
    xs: number,
    ys: number,
    xt: number,
    yt: number
  ) => {
    let x_pos = 0
    let y_pos = 0

    // middle : valeur par défault
    // est-ce necessaire car on force l'option middle à la création du flux
    if (!link.label_position) {
      link.label_position = 'middle'
    }

    if (link.label_position === 'beginning') {
      x_pos = xs + (xt - xs) / 10
    } else if (link.label_position === 'middle') {
      const handles = handles_positions(links, link, xs, ys, xt, yt)
      if (handles.length >= 2) {
        const left_xpos = +handles[0].split(',')[0].substring(10)
        const right_xpos = +handles[1].split(',')[0].substring(10)
        x_pos = (left_xpos + right_xpos) / 2 - 5
      } else {
        x_pos = +handles[0].split(',')[0].substring(10)
      }
    } else if (link.label_position === 'end') {//end
      x_pos = xt - (xt - xs) / 10
    }

    if (link.label_position === 'beginning') {
      y_pos = ys - 6
    } else if (link.label_position === 'middle') {
      const handles = handles_positions(links, link, xs, ys, xt, yt)
      if (handles.length >= 2) {
        const left_y_pos_str = handles[0].split(',')[1]
        const left_y_pos = +left_y_pos_str.substring(0, left_y_pos_str.length - 1)
        const right_y_pos_str = handles[1].split(',')[1]
        const right_y_pos = +right_y_pos_str.substring(0, right_y_pos_str.length - 1)
        y_pos = (left_y_pos + right_y_pos) / 2
      } else {
        const y_pos_str = handles[0].split(',')[1]
        y_pos = +y_pos_str.substring(0, y_pos_str.length - 1)
      }
    } else if (link.label_position === 'end') { //end
      y_pos = yt - 6
    }
    if (link.label_position !== 'frozen') {
      link.x_label = x_pos
      link.y_label = y_pos
    }
    
    scale(Math.max(inv_scale(min_thickness), link_value ? link_value : 0))
    if(link.orthogonal_label_position=='above'){
      y_pos-=scale(link_value)/2
    }else if(link.orthogonal_label_position=='below'){
      y_pos+=scale(link_value)/2
    }

    if (link.label_position === 'frozen' && link.x_label ||
      !link.label_on_path || link.label_on_path === undefined) {
        
      (d3.select('#' + link.idLink + '_text') as d3.Selection<SVGSVGElement, SankeyLink, HTMLElement, SankeyLink>)
        .attr('x', () => link.label_position === 'frozen' && link.x_label ? link.x_label : x_pos)
        // .attr('y', () => link.label_position === 'frozen' && link.y_label ? link.y_label + default_handle_size : y_pos + default_handle_size)
        .attr('y', () => link.label_position === 'frozen' && link.y_label ? link.y_label + default_handle_size : y_pos + default_handle_size)
        .text(d => link_text(data, d, link_value, display_style))
        .attr('visibility', link.label_visible ? 'visible' : 'hidden');
      (d3.select('#' + link.idLink + '_text') as d3.Selection<SVGSVGElement, SankeyLink, HTMLElement, SankeyLink>).attr('dy',()=>{
        if(link.orthogonal_label_position=='above'){
          return '-1em'
        }else if(link.orthogonal_label_position=='below'){
          return '0.3em'
        }
        return '0em'
      })
    } else {
      const positions: { [label_position: string]: string[] } = {
        'frozen': ['50%', 'start'],
        'beginning': ['10px', 'start'],
        'middle': ['50%', 'start'],
        'end': ['100%', 'end']
      };

      (d3.select('#' + link.idLink + '_text') as d3.Selection<SVGSVGElement, SankeyLink, HTMLElement, SankeyLink>)
        .attr('startOffset', positions[link.label_position][0])
        .attr('text-anchor', positions[link.label_position][1])
        .text(d => link_text(data, d, link_value, display_style))
        .attr('visibility', link.label_visible ? 'visible' : 'hidden')
    }
  }

  const setNodeHeight = (
    n: SankeyNode,
    nodes: { [node_id: string]: SankeyNode },
    links: { [link_id: string]: SankeyLink },
    selected_tags: TagsCatalog
  ) => {
    const res = compute_total_offsets(n, data, selected_tags, test_link_value)

    const [total_offset_height_left, total_offset_height_right, total_offset_width_top, total_offset_width_bottom] = res
    let node_size_s_height = Math.max(
      inv_scale(n.node_height), total_offset_height_left, total_offset_height_right
    )

    let node_size_s_width = Math.max(
      inv_scale(n.node_width), total_offset_width_top, total_offset_width_bottom
    )
    //Hauteur des noeuds
    if (res[0] === 0 && res[1] === 0 && res[2] === 0 && res[3] === 0 || data.show_structure) {
      // Hauteur des noeuds
      node_size_s_height = inv_scale(n.node_height)
      node_size_s_width = inv_scale(n.node_width)
    }

    d3.select('#' + n.idNode).attr('width', scale(node_size_s_width))

    d3.select('#' + n.idNode).attr('height', scale(node_size_s_height))

    if (n.tags['Type de noeud'] && n.tags['Type de noeud'].length > 0 && data.nodeTags['Type de noeud'].tags[n.tags['Type de noeud'][0]].shape === 'ellipse') {
      d3.select('#' + n.idNode).attr('rx', scale(node_size_s_width / 2))
      d3.select('#' + n.idNode).attr('cx', scale(node_size_s_width / 2))
      d3.select('#' + n.idNode).attr('ry', scale(node_size_s_height / 2))
      d3.select('#' + n.idNode).attr('cy', scale(node_size_s_height / 2))
    }
  }

  const setNodesHeight = (
    nodes: { [node_id: string]: SankeyNode },
    links: { [link_id: string]: SankeyLink },
    d: SankeyLink,
    nodeTags: TagsCatalog
  ) => {
    let source_node = nodes[d.idSource]
    let target_node = nodes[d.idTarget]
    if (target_node === undefined) {
      target_node = nodes[d.idTarget]
    }
    if (source_node === undefined) {
      const filter_idSource = d.idSource
      source_node = nodes[filter_idSource]
    }

    const res_source = compute_total_offsets(source_node, data, nodeTags, test_link_value)
    const [s_total_offset_height_left, s_total_offset_height_right, s_total_offset_width_top, s_total_offset_width_bottom] = res_source
    const res_target = compute_total_offsets(target_node, data, nodeTags, test_link_value)
    const [t_total_offset_height_left, t_total_offset_height_right, t_total_offset_width_top, t_total_offset_width_bottom] = res_target

    let node_size_s_height = Math.max(
      inv_scale(source_node.node_height), s_total_offset_height_left, s_total_offset_height_right
    )
    let node_size_t_height = Math.max(
      inv_scale(target_node.node_height), t_total_offset_height_left, t_total_offset_height_right
    )
    let node_size_s_width = Math.max(
      inv_scale(source_node.node_width), s_total_offset_width_top, s_total_offset_width_bottom
    )
    let node_size_t_width = Math.max(
      inv_scale(target_node.node_width), t_total_offset_width_top, t_total_offset_width_bottom
    )
    // Hauteur des noeuds
    if ((res_source[0] === 0 && res_source[1] === 0 && res_source[2] === 0 && res_source[3] === 0) || data.show_structure) {
      node_size_s_height = inv_scale(source_node.node_height)
      node_size_s_width = inv_scale(source_node.node_width)
    }
    if ((res_target[0] === 0 && res_target[1] === 0 && res_target[2] === 0 && res_target[3] === 0) || data.show_structure) {
      node_size_t_height = inv_scale(target_node.node_height)
      node_size_t_width = inv_scale(target_node.node_width)
    }

    d3.select('#' + source_node.idNode).attr('width', scale(node_size_s_width))
    d3.select('#' + source_node.idNode).attr('height', scale(node_size_s_height))
    if (source_node.tags['Type de noeud'] && source_node.tags['Type de noeud'].length > 0 && data.nodeTags['Type de noeud'].tags[source_node.tags['Type de noeud'][0]].shape === 'ellipse' || !source_node.tags['Type de noeud'] && source_node.shape=='ellipse' ) {
      d3.select('#' + source_node.idNode).attr('rx', scale(node_size_s_width / 2))
      d3.select('#' + source_node.idNode).attr('cx', scale(node_size_s_width / 2))
      d3.select('#' + source_node.idNode).attr('ry', scale(node_size_s_height / 2))
      d3.select('#' + source_node.idNode).attr('cy', scale(node_size_s_height / 2))
    }

    d3.select('#' + target_node.idNode).attr('width', scale(node_size_t_width))
    d3.select('#' + target_node.idNode).attr('height', scale(node_size_t_height))
    if (target_node.tags['Type de noeud'] && target_node.tags['Type de noeud'].length > 0 && data.nodeTags['Type de noeud'].tags[target_node.tags['Type de noeud'][0]].shape === 'ellipse'|| !target_node.tags['Type de noeud'] && target_node.shape=='ellipse') {
      d3.select('#' + target_node.idNode).attr('rx', scale(node_size_t_width / 2))
      d3.select('#' + target_node.idNode).attr('cx', scale(node_size_t_width / 2))
      d3.select('#' + target_node.idNode).attr('ry', scale(node_size_t_height / 2))
      d3.select('#' + target_node.idNode).attr('cy', scale(node_size_t_height / 2))
    }
  }

  const compute_end_points = (
    source_node: SankeyNode,
    target_node: SankeyNode,
    link: SankeyLink,
    nodes: { [node_id: string]: SankeyNode },
    links: { [link_id: string]: SankeyLink },
    selected_tags: { [tag_group: string]: string[] },

  ) => {
    if (!links) {
      return [0, 0, 0, 0]
    }

    const link_value = test_link_value(data, nodes, link, selected_tags)
    if (link_value === undefined) {
      return [0, 0, 0, 0]
    }
    let res = compute_total_offsets(source_node, data, selected_tags, test_link_value)
    const [s_total_offset_height_left, s_total_offset_height_right, s_total_offset_width_top, s_total_offset_width_bottom] = res

    res = compute_total_offsets(target_node, data, selected_tags, test_link_value)
    const [t_total_offset_height_left, t_total_offset_height_right, t_total_offset_width_top, t_total_offset_width_bottom] = res

    let node_size_s_width = inv_scale(source_node.node_width)
    let node_size_t_width = inv_scale(target_node.node_width)
    if (!data.show_structure) {
      node_size_s_width = Math.max(
        inv_scale(source_node.node_width), s_total_offset_width_bottom, s_total_offset_width_top
      )
      node_size_t_width = Math.max(
        inv_scale(target_node.node_width), t_total_offset_width_bottom, t_total_offset_width_top
      )
    }
    let node_size_s_height = inv_scale(source_node.node_width)
    let node_size_t_height = inv_scale(target_node.node_width)
    if (!data.show_structure) {
      node_size_s_height = Math.max(
        inv_scale(source_node.node_height), s_total_offset_height_left, s_total_offset_height_right
      )
      node_size_t_height = Math.max(
        inv_scale(target_node.node_height), t_total_offset_height_left, t_total_offset_height_right
      )
    }

    res = compute_total_offsets(source_node, data, selected_tags, test_link_value, link)
    const [s_offset_height_left, s_offset_height_right, s_offset_width_top, s_offset_width_bottom] = res
    res = compute_total_offsets(target_node, data, selected_tags, test_link_value, link)
    const [t_offset_height_left, t_offset_height_right, t_offset_width_top, t_offset_width_bottom] = res

    const delta_s_width_bottom = Math.max(0, (node_size_s_width - s_total_offset_width_bottom) / 2)
    const delta_s_width_top = Math.max(0, (node_size_s_width - s_total_offset_width_top) / 2)
    const delta_s_height_right = Math.max(0, (node_size_s_height - s_total_offset_height_right) / 2)
    const delta_s_height_left = Math.max(0, (node_size_s_height - s_total_offset_height_left) / 2)

    const delta_t_width_bottom = Math.max(0, (node_size_t_width - t_total_offset_width_bottom) / 2)
    const delta_t_width_top = Math.max(0, (node_size_t_width - t_total_offset_width_top) / 2)
    const delta_t_height_right = Math.max(0, (node_size_t_height - t_total_offset_height_right) / 2)
    const delta_t_height_left = Math.max(0, (node_size_t_height - t_total_offset_height_left) / 2)

    const source_node_x = source_node.position === 'absolute' ? +source_node.x : +target_node.x + +source_node.x - +d3.select('#' + source_node.idNode).attr('width')
    const source_node_y = source_node.position === 'absolute' ? +source_node.y : +target_node.y + +source_node.y - +d3.select('#' + source_node.idNode).attr('height')
    const target_node_x = target_node.position === 'absolute' ? +target_node.x : +source_node.x + +target_node.x + +d3.select('#' + source_node.idNode).attr('width')
    const target_node_y = target_node.position === 'absolute' ? +target_node.y : +source_node.y + +target_node.y + +d3.select('#' + source_node.idNode).attr('height')

    let xs = source_node_x
    let ys = source_node_y
    let xt = target_node_x
    let yt = target_node_y

    if (link.orientation === 'hh') {
      //side to side
      if (source_node_x > target_node_x && !link.recycling || source_node_x < target_node_x && link.recycling) {
        // source is after target arrow point leftward. Start is on the left of side of source
        // source -> left
        ys += scale(delta_s_height_left + s_offset_height_left + link_value / 2)
        // target -> right
        xt += scale(node_size_t_width)
        yt += scale(delta_t_height_right + t_offset_height_right + link_value / 2)
        if (link.arrow) {
          xt = xt + 10
        }
      } else {
        // source is before target arrow point rightward. Start is on the right of side of source
        const delta_s_height_right = Math.max(0, (node_size_s_height - s_total_offset_height_right) / 2)
        xs += scale(node_size_s_width)
        ys += scale(delta_s_height_right + s_offset_height_right + link_value / 2)
        yt += scale(delta_t_height_left + t_offset_height_left + link_value / 2)
        if (link.arrow) {
          xt = xt - 10
        }
      }
    }

    if (link.orientation === 'vv') {
      //side to side
      if (source_node_y > target_node_y) {
        // source is bottom target. Flux goes up
        xs += scale(delta_s_width_top + s_offset_width_top + link_value / 2)
        //ys = ys
        xt += scale(delta_t_width_bottom + t_offset_width_bottom + link_value / 2)
        yt += scale(node_size_t_height)
        if (link.arrow) {
          yt = yt + 10
        }
      } else {
        // source is top target. Flux goes down
        xs += scale(delta_s_width_bottom + s_offset_width_bottom + link_value / 2)
        ys += scale(node_size_s_height)
        xt += scale(delta_t_width_top + t_offset_width_top + link_value / 2)
        if (link.arrow) {
          yt = yt - 10
        }
      }
    }

    if (link.orientation === 'hv') {
      //vertical to horizontal
      if (source_node_x > target_node_x) {
        if (source_node_y > target_node_y) {
          //source is bottom right target. left and up  
          ys += scale(delta_s_height_left + s_offset_height_left + link_value / 2)

          xt += scale(delta_t_width_bottom + t_offset_width_bottom + link_value / 2)
          yt += scale(node_size_t_height)

          if (link.arrow) {
            yt = yt + 10
          }
        } else {
          //source is top right target. left and down
          ys += scale(delta_s_height_left + s_offset_height_left + link_value / 2)

          xt += scale(delta_t_width_top + t_offset_width_top + link_value / 2)

          if (link.arrow) {
            yt = yt - 10
          }
        }
      } else {
        if (source_node_y > target_node_y) {
          //source is bottom left target. right and up
          xs += scale(node_size_s_width)
          ys += scale(delta_s_height_right + s_offset_height_right + link_value / 2)

          xt += scale(delta_t_width_bottom + t_offset_width_bottom + link_value / 2)
          yt += scale(node_size_t_height)

          if (link.arrow) {
            yt = yt + 10
          }
        } else {
          //source is top left target. right and down
          xs += scale(node_size_s_width)
          ys += scale(delta_s_height_right + s_offset_height_right + link_value / 2)

          xt += scale(delta_t_width_top + t_offset_width_top + link_value / 2)

          if (link.arrow) {
            yt = yt - 10
          }
        }
      }
    }

    if (link.orientation === 'vh') {
      //vertical to horizontal
      if (source_node_x > target_node_x) {
        if (source_node_y > target_node_y) {
          //source is bottom right target. up and left
          xs += scale(delta_s_width_top + s_offset_width_top + link_value / 2)
          xt += scale(node_size_t_width)
          yt += scale(delta_t_height_right + t_offset_height_right + link_value / 2)
          if (link.arrow) {
            xt += 10
          }
        } else {
          //source is top right target. down and left
          xs += scale(delta_s_width_bottom + s_offset_width_bottom + link_value / 2)
          ys += scale(node_size_s_height)
          xt += scale(node_size_t_width)
          yt += scale(delta_t_height_right + t_offset_height_right + link_value / 2)
          if (link.arrow) {
            xt += 10
          }
        }
      } else {
        if (source_node_y > target_node_y) {
          //source is bottom left target. Arrow goes left and go down to the top side 
          xs += scale(delta_s_width_top + s_offset_width_top + link_value / 2)

          yt += scale(delta_t_height_left + t_offset_height_left + link_value / 2)
          if (link.arrow) {
            xt = xt - 10
          }
        } else {
          //source is top left target. Arrow goes left and go down to the top side 
          xs += scale(delta_s_width_bottom + s_offset_width_bottom + link_value / 2)
          ys += scale(node_size_s_height)
          yt += scale(delta_t_height_left + t_offset_height_left + link_value / 2)
          if (link.arrow) {
            xt = xt - 10
          }
        }
      }
    }
    return [xs, ys, xt, yt]
  }

  const node_value_and_text_same_pos=(node :SankeyNode)=>{
    return (node.label_visible && node.display_style.label_horiz_valeur==node.display_style.label_horiz && node.display_style.label_vert_valeur==node.display_style.label_vert)
  }

  // DRAW LINK   
  const drawCurve = (
    data: SankeyData,
    nodes: { [node_id: string]: SankeyNode },
    links: { [link_id: string]: SankeyLink },
    display_style: { node_font_size: number; link_font_size: number; filter: number; filter_label: number; italic?: boolean; bold?: boolean; uppercase?: boolean; },
    nodeTags: TagsCatalog,
    link: SankeyLink,
    error_msg: { text?: string } | undefined
  ): string => {
    if (!link_visible(link, data)) {
      return ''
    }
    const link_value = test_link_value(data, nodes, link, nodeTags)

    const source_node = nodes[link.idSource]
    const target_node = nodes[link.idTarget]

    const inputLinksId = target_node.inputLinksId
    const outputLinksId = source_node.outputLinksId
    if (outputLinksId === undefined || inputLinksId === undefined) {
      return ''
    }

    let [xs, ys, xt, yt] = compute_end_points(source_node, target_node, link, nodes, links, nodeTags)
    handles_positions(links, link, xs, ys, xt, yt)

    add_shift_handles(
      link, nodes, links,
      display_style, nodeTags, xs, ys, xt, yt
    )

    if (link_value > display_style.filter_label) {
      drawLinkText(data, link, links, link_value, display_style, xs, ys, xt, yt)
    }

    if (link.orientation === 'vh' && !link.recycling) {
      if (data.show_structure) {
        [xs, yt] = [source_node.x + source_node.node_height / 2, target_node.y + target_node.node_height / 2]
        if (source_node.x > target_node.x) {
          xt = xt + 30
        }
      }
      return SankeyShapes.bezier_link_classic_hv(
        link.idSource, link.idTarget,
        [xs, ys], [xt, yt],
        link.curvature !== undefined ? link.curvature : 0.5,
        link.curved,
        error_msg
      )
    }
    if (link.orientation === 'hv' && !link.recycling) {
      if (data.show_structure) {
        [ys, xt] = [source_node.y + 20, target_node.x + 20]
        if (source_node.y > target_node.y) {
          yt = yt + 30
        }
      }
      return SankeyShapes.bezier_link_classic_vh(
        link.idSource, link.idTarget,
        [xs, ys], [xt, yt],
        link.curvature !== undefined ? link.curvature : 0.5,
        link.curved,
        error_msg
      )
    }
    if (link.orientation === 'hh' && !link.recycling) {
      if (data.show_structure) {
        [ys, yt] = [source_node.y + source_node.node_height / 2, target_node.y + target_node.node_height / 2]
        if (source_node.x > target_node.x) {
          xt = xt + target_node.node_width
        }
      }
      const left_horiz_shift = link.left_horiz_shift ? link.left_horiz_shift : 0
      const right_horiz_shift = link.right_horiz_shift ? link.right_horiz_shift : 0
      return SankeyShapes.bezier_link_classic_vv(
        link.idSource, link.idTarget,
        [xs, ys], [xt, yt],
        left_horiz_shift,
        right_horiz_shift,
        link.curvature !== undefined ? link.curvature : 0.5,
        false,
        link.curved,
        error_msg
      )
    }
    if (link.orientation === 'vv' && !link.recycling) {
      if (data.show_structure) {
        [xs, xt] = [source_node.x + source_node.node_width / 2, target_node.x + target_node.node_width / 2]
        if (source_node.y > target_node.y) {
          yt = yt + 30
        }
      }
      const left_horiz_shift = link.left_horiz_shift ? link.left_horiz_shift : 0
      const right_horiz_shift = link.right_horiz_shift ? link.right_horiz_shift : 0
      return SankeyShapes.bezier_link_classic_vv(
        link.idSource, link.idTarget,
        [xs, ys], [xt, yt],
        left_horiz_shift, right_horiz_shift,
        link.curvature !== undefined ? link.curvature : 0.5,
        true,
        link.curved,
        error_msg
      )
    }
    if (link.recycling) {
      const left_horiz_shift = link.left_horiz_shift ? link.left_horiz_shift : 0
      const right_horiz_shift = link.right_horiz_shift ? link.right_horiz_shift : 0
      const vert_shift = link.vert_shift ? link.vert_shift : 0
      if (data.show_structure) {
        [ys, yt] = [source_node.y + 20, target_node.y + 20]
      }
      return SankeyShapes.bezier_link_classic_recycling(
        link.idSource, link.idTarget,
        link_value,
        [xs, ys], [xt, yt],
        left_horiz_shift, right_horiz_shift, vert_shift,
        data.show_structure ? false : link.curved,
        link.orientation === 'vv',
        error_msg, scale
      )
    }
    return ''
  }

  // Returns the x/y position of link_center / left/right/vert_shift
  const handles_positions = (
    links: { [link_id: string]: SankeyLink },
    link: SankeyLink,
    xs: number,
    ys: number,
    xt: number,
    yt: number
  ) => {


    if (link.orientation === 'hh' && link.recycling) {
      // Recycling: 3 handles = left_horiz_shift, right_horiz_shif, vert_shift
      if (!link.left_horiz_shift) {
        link.left_horiz_shift = 0
      }
      if (!link.right_horiz_shift) {
        link.right_horiz_shift = 0
      }
      if (!link.vert_shift) {
        link.vert_shift = 0
      }
      if (xt < xs) {
        const x_left = xt - default_horiz_shift + link.left_horiz_shift // x14 
        const x_right = xs + default_horiz_shift + link.right_horiz_shift  // x2 
        const y_vert = Math.max(ys, yt) + scale(2 * getLinkValue(data, link.idLink).value) + link.vert_shift // y8 
        const vert = 'translate(' + (x_left + (x_right - x_left) / 2 - default_handle_size / 2) + ', ' + (y_vert - default_handle_size / 2) + ')'
        const left = 'translate(' + (x_left - default_handle_size / 2) + ' ,' + (yt + (y_vert - yt) / 2 - default_handle_size / 2) + ')'
        const right = 'translate(' + (x_right - default_handle_size / 2) + ' ,' + (ys + (y_vert - ys) / 2 - default_handle_size / 2) + ')'
        return [vert, left, right]
      } else {
        const x_right = xt + default_horiz_shift + link.right_horiz_shift  // x14 
        const x_left = xs - default_horiz_shift + link.left_horiz_shift // x2 
        const y_vert = Math.max(ys, yt) + scale(2 * getLinkValue(data, link.idLink).value) + link.vert_shift // y8 
        const vert = 'translate(' + (x_left + (x_right - x_left) / 2 - default_handle_size / 2) + ', ' + (y_vert - default_handle_size / 2) + ')'
        const left = 'translate(' + (x_left - default_handle_size / 2) + ' ,' + (ys + (y_vert - ys) / 2 - default_handle_size / 2) + ')'
        const right = 'translate(' + (x_right - default_handle_size / 2) + ' ,' + (yt + (y_vert - yt) / 2 - default_handle_size / 2) + ')'
        return [vert, left, right]
      }
    } else if (link.orientation === 'vv' && link.recycling) {
      // Recycling: 3 handles = left_horiz_shift, right_horiz_shif, vert_shift
      if (!link.left_horiz_shift) {
        link.left_horiz_shift = 0
      }
      if (!link.right_horiz_shift) {
        link.right_horiz_shift = 0
      }
      if (!link.vert_shift) {
        link.vert_shift = 0
      }
      const y_left = yt - default_horiz_shift + link.left_horiz_shift - scale(getLinkValue(data, link.idLink).value) // x14 
      const y_right = ys + default_horiz_shift + link.right_horiz_shift + scale(getLinkValue(data, link.idLink).value) // x2 
      const x_vert = Math.max(xs, xt) + scale(2 * getLinkValue(data, link.idLink).value) + link.vert_shift // y8 
      const vert = 'translate(' + (x_vert - default_handle_size / 2) + ', ' + (y_left + (y_right - y_left) / 2 - default_handle_size / 2) + ')'
      const left = 'translate(' + (xt + (x_vert - xt) / 2 - default_handle_size / 2) + ' ,' + (y_left - default_handle_size / 2) + ')'
      const right = 'translate(' + (xs + (x_vert - xs) / 2 - default_handle_size / 2) + ' ,' + (y_right - default_handle_size / 2) + ')'
      return [vert, left, right]
    } else if (link.orientation === 'hh') {
      if (!link.left_horiz_shift) {
        link.left_horiz_shift = 1 / 3
      }
      if (!link.right_horiz_shift) {
        link.right_horiz_shift = 2 / 3
      }
      const shift_left = 'translate(' + (xs + (xt - xs) * link.left_horiz_shift) + ', ' + (ys - default_handle_size / 2) + ')'
      const shift_right = 'translate(' + (xs + (xt - xs) * link.right_horiz_shift) + ', ' + (yt - default_handle_size / 2) + ')'
      return [shift_left, shift_right]
    } else if (link.orientation === 'vv') {
      if (!link.left_horiz_shift) {
        link.left_horiz_shift = 1 / 3
      }
      if (!link.right_horiz_shift) {
        link.right_horiz_shift = 2 / 3
      }
      const shift_left = 'translate(' + (xs - default_handle_size / 2) + ', ' + (ys + (yt - ys) * link.left_horiz_shift) + ')'
      const shift_right = 'translate(' + (xt - default_handle_size / 2) + ', ' + (ys + (yt - ys) * link.right_horiz_shift) + ')'
      return [shift_left, shift_right]

    } else if (link.orientation === 'vh') {
      const x_center_draw = xs
      const y_center_draw = yt
      return ['translate(' + x_center_draw + ', ' + y_center_draw + ')']
    } else if (link.orientation === 'hv') {
      const x_center_draw = xt
      const y_center_draw = ys
      return ['translate(' + x_center_draw + ', ' + y_center_draw + ')']
    }
    return ['']
  }

  const swap = (array: string[], x: number, y: number) => {
    const temp = array[x]
    array[x] = array[y]
    array[y] = temp
  }

  const drag_node_text = (
    node: SankeyNode,
    event: d3.D3DragEvent<Element, unknown, unknown>
  ) => {
    const old_x = +d3.select('#' + node.idNode + '_text').attr('x'),
      old_y = +d3.select('#' + node.idNode + '_text').attr('y'),
      new_x = old_x + event.dx,
      new_y = old_y + event.dy
    d3.select('#' + node.idNode + '_text').attr('x', new_x)
    d3.select('#' + node.idNode + '_text').attr('y', new_y)

    node.x_label = new_x
    node.y_label = new_y
    d3.select('#' + node.idNode + '_text').selectAll('tspan').attr('x', new_x)
  }

  const drag_link_text = (
    link: SankeyLink,
    event: d3.D3DragEvent<Element, unknown, unknown>
  ) => {
    const old_x = +d3.select('#' + link.idLink + '_text').attr('x'),
      old_y = +d3.select('#' + link.idLink + '_text').attr('y'),
      new_x = old_x + event.dx,
      new_y = old_y + event.dy
    d3.select('#' + link.idLink + '_text').attr('x', new_x)
    d3.select('#' + link.idLink + '_text').attr('y', new_y)
    link.x_label = new_x
    link.y_label = new_y
    link.label_position = 'frozen'
  }

  const add_nodes = (
    static_sankey: boolean,
    remove_previous_nodes = false
  ) => {
    const { display_style } = data
    if (remove_previous_nodes) {
      d3.selectAll('.gg_nodes').remove()
    }
    const gg_nodes = d3.select('#g_nodes').selectAll('.gg_nodes').data(Object.values(display_nodes).filter(n=>n.display)).enter().append('g')
      .attr('id', d => {
        return 'gg_' + d.idNode
      })
      .attr('class', 'gg_nodes')
      // On gere la visibilité directement sur gg_nodes avec un display <inline />
      // Cela permettra de mieux gérer des zooms sur les éléments visibles
      .style('display', (d) => {
        let display: string
        if (d.node_visible && d.position === 'absolute' ) { display = 'inline' } else { display = 'none' }
        return display
      })
      .style('font-family', d => d.display_style.font_family)

    const ggg_nodes = gg_nodes.append('g')
      .attr('id', d => 'ggg_' + d.idNode)
      .attr('class', 'ggg_nodes')
      .attr('transform', d => {
        if (d.position === 'relative') {
          if (d.inputLinksId.length > 0) {
            const source_node = display_nodes[display_links[d.inputLinksId[0]].idSource]
            const x = source_node.x + d.x
            const y = source_node.y + d.y
            return 'translate(' + x + ', ' + y + ')'
          } else {
            const target_node = display_nodes[display_links[d.outputLinksId[0]].idTarget]
            const x = target_node.x + d.x
            const y = target_node.y + d.y
            return 'translate(' + x + ', ' + y + ')'            
          }
        } else {
          return 'translate(' + d.x + ', ' + d.y + ')'
        }
      })

    // Gestion du drag 
    //Est activé que lorsque le mode 'sélection' est sélectionné
    if (mode_selection == 's') {
      ggg_nodes.call(d3.drag<SVGGElement, SankeyNode>()
        .subject(Object).on('drag', function (event) {
          if (!static_sankey && multi_selected_nodes.current.length!=0) {
            drag_nodes(
              display_nodes, display_links,
              display_style,
              data.nodeTags,
              event
            )
            // try {

            //   // localStorage.setItem('data', JSON.stringify(data))
            //   if (current) {
            //     get_diff()
            //     localStorage.setItem('data', JSON.stringify(data))

            //   }

            // } catch (e) {
            //   localStorage.clear()
            // }
          }
        })
      )
    }



    // Gestion du click  
    ggg_nodes.on('click', (event, d) => {
      if (!static_sankey && !mode_visualisation &&  (event.ctrlKey || event.metaKey)) {
        sankeyTooltip.style('opacity', 0)
        if ( button_ref && button_ref.current && accordion_ref && accordion_ref.current==null) {
          button_ref.current.click()
        }
        multi_selected_nodes.current = multi_selected_nodes.current.filter(d => (d != null && d.name != ''))

        if (multi_selected_nodes.current.includes(d)) {
          multi_selected_nodes.current.splice(multi_selected_nodes.current.indexOf(d), 1)
          d3.select('#' + d.idNode).attr('stroke-width',0)
        } else {
          multi_selected_nodes.current.push(d)
          d3.select('#' + d.idNode).attr('stroke-width',2)
        }
        select_node(d)
        if ( accordion_ref && accordion_ref.current) {
          for ( const child in accordion_ref.current.children) {
            if (accordion_ref.current.children[child].id === 'Nodes') {
              (accordion_ref.current.children[0] as HTMLLabelElement).click();
              (accordion_ref.current.children[child] as HTMLLabelElement).click()
            }
          }
        }
        if ( nodes_accordion_ref && nodes_accordion_ref.current) {
          (nodes_accordion_ref.current.children[0] as HTMLLabelElement).click();
          (nodes_accordion_ref.current.children[1] as HTMLLabelElement).click()
        }
      }
    })

    if (mode_selection == 'ln') {
      let first_selected_node = {}
      ggg_nodes.on('mousedown', function (event, d) {
        if (!event.ctrlKey && !event.metaKey) {
          // console.log(event, d)
          first_selected_node = d
        }
      })
        .on('mouseup', function (event, d) {
          if ((!event.ctrlKey && !event.metaKey)&& Object.keys(first_selected_node).length != 0) {
            d3.selectAll('#svg #path-flux').remove()
            const n_link = default_link(data)
            const { links } = data
            const fsn = (first_selected_node as SankeyNode)
            const listId: number[] = []
            Object.keys(data.links).forEach(elt => listId.push(Number(elt.replace('link', ''))))

            const idLink = listId.length > 0 ? Math.max(...listId) + 1 : 0
            n_link.idLink = 'link' + idLink
            links[n_link.idLink] = n_link

            n_link.idSource = fsn.idNode
            n_link.idTarget = d.idNode
            if (n_link.idSource === n_link.idTarget) {
              n_link.recycling = true
            }

            fsn.outputLinksId.push(n_link.idLink)
            d.inputLinksId.push(n_link.idLink)

            set_data({ ...data })
          }
        })

      d3.select('#svg')
        .on('mousemove', function () {
          if (Object.keys(first_selected_node).length != 0) {
            const pos = d3.pointer(event)
            const fsn = (first_selected_node as SankeyNode)

            if (d3.selectAll('#svg #path-flux').nodes().length == 0) {
              d3.select('#svg').append('line').attr('id', 'path-flux')
                .attr('x1', fsn.x + fsn.node_width / 2)
                .attr('y1', fsn.y + fsn.node_height / 2)
                .attr('x2', pos[0])
                .attr('y2', pos[1])
                .style('stroke', 'red')
                .style('stroke-width', '2px')
            } else {
              d3.selectAll('#svg #path-flux')
                .attr('x2', pos[0])
                .attr('y2', pos[1] - 5)
            }
          }
        })
        .on('mouseup', function () {
          d3.selectAll('#svg #path-flux').remove()
          first_selected_node = {}
        })
    }



    ggg_nodes.on('contextmenu', (ev, n) => {
      ev.preventDefault()
      if (!n.dimensions) {
        return
      }
      if (ev.altKey) {
        const child_names: string[] = []
        const dim_names: string[] = []
        Object.values(data.nodes).forEach(n2 => {
          for (const dim in n2.dimensions) {
            if (n2.dimensions[dim].parent_name == n.idNode) {
              if (dim_names.indexOf(dim) === -1) {
                child_names.push(n2.idNode)
                dim_names.push(dim)
              }
            }
          }
          return false
        })
        if (child_names.length === 0) {
          return
        }
        if (child_names.length > 1) {
          set_agregation_parent_names(child_names)
          set_agregation_dimension_names(dim_names)
          set_is_agregation(false)
          set_show_agregation(true)
        } else {
          desagregation(data, child_names[0], dim_names[0])
        }
      } else {
        const parent_names: string[] = []
        const dim_names: string[] = []
        Object.keys(n.dimensions).forEach(
          dim => {
            if (n.dimensions[dim].parent_name) {
              parent_names.push(n.dimensions[dim].parent_name as string)
              dim_names.push(dim)
            }
          }
        )
        if (parent_names.length === 0) {
          return
        }
        if (parent_names.length > 1) {
          set_agregation_parent_names(parent_names)
          set_agregation_dimension_names(dim_names)
          set_is_agregation(true)
          set_show_agregation(true)
        } else {
          agregation(data, parent_names[0], dim_names[0])
        }
      }
      set_data({ ...data })
    })

    if ( data.nodeTags['Type de noeud'] ) {
      Object.entries(data.nodeTags['Type de noeud'].tags).forEach( ([key,tag])=> {
        ggg_nodes
          .filter(d =>d.tags['Type de noeud'].includes(key))
          .append(tag.shape as string)
          .classed('node', true)
          .classed('node_shape', true)
        //   .attr('height', d => d.node_height)
        //   .attr('width', d => d.node_width)
        // if ( tag.shape === 'ellipse' ) {
        //   current_selection
        //     .attr('cx', d => d.node_width / 2)
        //     .attr('cy', d => d.node_height / 2)
        //     .attr('rx', d => d.node_width / 2)
        //     .attr('ry', d => d.node_height / 2)
        // }
      })
      ggg_nodes
        .filter(d =>d.tags['Type de noeud'].length === 0)
        .append('rect')
        .classed('node', true)
        .classed('node_shape', true)
        // .attr('height', d => d.node_height)
        // .attr('width', d => d.node_width)
    } else {
      ggg_nodes
        .filter(d => d.shape === 'rect')
        .append('rect')
        .classed('node', true)
        .classed('node_shape', true)
        // .attr('height', d => d.node_height)
        // .attr('width', d => d.node_width)      

      ggg_nodes
        .filter(d => d.shape === 'ellipse')
        .append('ellipse')
        .classed('node', true)
        .classed('node_shape', true)
        .attr('cx', d => d.node_width / 2)
        .attr('cy', d => d.node_height / 2)
        .attr('rx', d => d.node_width / 2)
        .attr('ry', d => d.node_height / 2)
       
    }

    d3.selectAll('.node')
      .attr('id', d => (d as SankeyNode).idNode)
      // .attr('visibility', d => (d as SankeyNode).node_visible && (d as SankeyNode).shape_visible ? 'visible' : 'hidden')
      .attr('fill-opacity', d => (d as SankeyNode).node_visible && (d as SankeyNode).shape_visible ? '1' : '0')
      .attr('fill', d => node_color(d as SankeyNode) as string)
      .attr('stroke', 'black')
      .attr('stroke-width', d => {
        d = (d as SankeyNode)
        if (multi_selected_nodes.current.map(d => { if (d != undefined) { return d.idNode } else { return '' } }).includes((d as SankeyNode).idNode)) {
          return 2
        } else {
          return 0
        }
      }

      )
      // Gestion de la tooltip
      .on('mouseover', function (event, d) {
        //d3.select(this).attr('cursor', 'grab')
        d3.select(this).attr('cursor', (mode_selection == 's')? 'pointer' : 'unset')
        if ((d as SankeyNode).shape_visible && (static_sankey || event.shiftKey)) {
          sankeyTooltip
            .style('opacity', 1)
            .html(nodeTooltipsContent(data, d as SankeyNode))
        }
      })
      .on('mousemove', function (event, d) {
        if ((d as SankeyNode).shape_visible && (static_sankey || event.shiftKey)) {
          sankeyTooltip

            .style('top', Math.max(margin_top + 50, event.pageY - 10) + 'px')
            .style('left', (event.pageX + 30) + 'px')
        }
      })
      .on('mouseout', function (event, d) {
        if ((d as SankeyNode).shape_visible) {
          sankeyTooltip.style('opacity', 0)
        }
      })
      .on('click', (event, d) => {

        if (!data.static_sankey && event.shiftKey || data.static_sankey) {
          event.preventDefault()
          // Animation des flux du Sankey
          sankeyTooltip.style('opacity', 0)
          //d3.selectAll('#svg .tmp').remove()
          // on donne ici un style temporaire, les parametres initiaux restent dans le attr que l'on pourra récupérer plus tard pour la remise en état du sankey       


          // d3.select('#svg').selectAll('.arrow').style('fill', '#dddddd')
          d3.select('#svg').selectAll('.defsArrow path').style('fill', '#dddddd')


          // d3.select('#svg').selectAll('.link').style('stroke-opacity', '0.2')
          d3.select('#svg').selectAll('.link').style('stroke', '#dddddd')
          d3.select('#svg').selectAll('.node').style('fill', '#dddddd')
          d3.select('#svg').selectAll('.link_value').style('display', 'none')
          const nodeDisplay = [(d as SankeyNode).idNode]
          branchAnimate((d as SankeyNode), nodeDisplay)
        }
      })




    //---------VERSION AVEC STYLE PROPRE A CHAQUE NOEUD---------------

    Object.values(display_nodes).map(n => setNodeHeight(n, display_nodes, display_links, data.nodeTags))

    //----------------ICON-----------------


    ggg_nodes
      .filter(d => d.iconName != 'none' && d.iconVisible)
      .append('svg')
      .attr('viewBox', '0, 0, 1000, 1000')
      .attr('transform', n => {
        const shiftV = (+d3.select('#' + n.idNode).attr('height') * (100 - n.iconRatio) / 100) / 2
        const shiftH = (+d3.select('#' + n.idNode).attr('width') * (100 - n.iconRatio) / 100) / 2
        return 'translate(' + shiftH + ',' + shiftV + ')'
      })
      .attr('height', n => +d3.select('#' + n.idNode).attr('height') * (n.iconRatio) / 100)
      .attr('width', n => +d3.select('#' + n.idNode).attr('width') * (n.iconRatio) / 100)
      .attr('x', 0)
      .append('g')
      .append('path')
      .on('mouseover', function (event, d) {
        //d3.select(this).attr('cursor', 'grab')
        d3.select(this).attr('cursor', (mode_selection == 's')? 'pointer' : 'unset')
        if ((static_sankey || event.shiftKey)) {
          sankeyTooltip
            .style('opacity', 1)
            .html(nodeTooltipsContent(data, d as SankeyNode))
        }
      })
      .on('mousemove', function (event,) {
        if ((static_sankey || event.shiftKey)) {
          sankeyTooltip
            .style('top', Math.max(margin_top + 50, event.pageY - 10) + 'px')
            .style('left', (event.pageX + 30) + 'px')
        }
      })
      .on('mouseout', function () {
        sankeyTooltip.style('opacity', 0)
      })
      .style('fill', n => {
        if (n.colorTag in n.tags && n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag && !n.shape_visible) {
            return tag.color as string
          } else {
            //console.log('tutu')
          }
        }
        return n.iconColor
      })
      .attr('d', n => {
        const icon = data.icon_catalog[n.iconName]
        if (icon != undefined) {
          return icon
        } else {
          return ''
        }
      })

    //------------------LABEL------------------------
    const select = ggg_nodes
      .append('text')
      .classed('node', true)
      .classed('node_text', true)
      .attr('id', n => n.idNode + '_text')
      .attr('x', (n) => {
        const width = +d3.select('#' + n.idNode).attr('width')
        if (n.x_label) {
          return n.x_label
        } else if (n.display_style.label_horiz == 'milieu') {
          return width / 2
        } else if (n.display_style.label_horiz == 'gauche') {
          return 0
        } else if (n.display_style.label_horiz == 'droite') {
          return n.display_style.label_vert == 'milieu' ? width : 0
        } else {
          return 0
        }
      })
      .attr('y', n => {
        const height = +d3.select('#' + n.idNode).attr('height')
        if (n.y_label && !data.show_structure) {
          return n.y_label
        } else if (n.display_style.label_vert == 'milieu') {
          return height / 2
        } else if (n.display_style.label_vert == 'haut') {
          return -4
        } else if (n.display_style.label_vert == 'bas') {
          return height
        } else {
          return 0
        }
      })
      .attr('text-anchor', n => {
        if (n.x_label && !data.show_structure) {
          return 'center'
        } else if (n.display_style.label_horiz == 'milieu') {
          return 'middle'
        } else if (n.display_style.label_horiz == 'gauche') {
          return 'end'
        } else if (n.display_style.label_horiz == 'droite') {
          return 'start'
        } else {
          return 'start'
        }
      })
      .attr('visibility', n => n.node_visible && n.label_visible ? 'visible' : 'hidden')
      .style('text-align', 'center')
      .style('font-weight', d => (d.display_style.bold) ? 'bold' : 'normal')
      .style('font-style', d => (d.display_style.italic) ? 'italic' : 'normal')
      .style('font-size', d => d.display_style.font_size + 'px')
      .style('text-transform', d => (d.display_style.uppercase) ? 'uppercase' : 'none')
      .text(d => {

        return d.name.split(' - ')[0].replace('-', ' ')
      })
      .each(d => {

        const wrap = textwrap()
          .bounds({ height: 100, width: (d.display_style.label_box_width != 0) ? d.display_style.label_box_width : 110 })
          .method('tspans')
        d3.select('#ggg_' + d.idNode + ' text')
          .call(wrap)
        if (!d.x_label || data.show_structure) {
          d3.selectAll('#ggg_' + d.idNode + ' text tspan').attr('dx', 0).attr('x', () => {
            const width = +d3.select('#' + d.idNode).attr('width')

            if (d.display_style.label_horiz == 'milieu') {
              return width / 2
            } else if (d.display_style.label_horiz == 'droite') {
              return d.display_style.label_vert == 'milieu' ? width : 0
            } else {
              return 0
            }
          })
        }

        d3.selectAll('#ggg_' + d.idNode + ' text tspan').attr('dx', 0).attr('x', () => {
          const width = +d3.select('#' + d.idNode).attr('width')
          if (d.x_label) {
            return d.x_label
          } else if (d.display_style.label_horiz == 'milieu') {
            return width / 2
          } else if (d.display_style.label_horiz == 'droite') {
            return width
          } else {
            return 0
          }
        })
        //Nombre de tspan dans la balise text
        const nb_tspan = d3.selectAll('#ggg_' + d.idNode + ' text tspan').nodes().length
        if (d.display_style.label_vert == 'milieu') {
          d3.select('#ggg_' + d.idNode + ' .node_text').style('transform', 'translateY(' + (0.25 - 0.5 * (nb_tspan - 1)) + 'em)')
        } else if (d.display_style.label_vert == 'bas') {
          d3.select('#ggg_' + d.idNode + ' .node_text').style('transform', 'translateY(1em)')
        } else if (d.display_style.label_vert == 'haut') {
          d3.select('#ggg_' + d.idNode + ' .node_text').style('transform', 'translateY(' + (-(nb_tspan - 1)) + 'em)')

        }

      })

    //Affiche valueur Noeud
    ggg_nodes.append('text')
      .classed('node', true)
      .classed('node_text_value', true)
      .attr('id', n => n.idNode + '_text_value')
      .attr('x', (n) => {
        const width = +d3.select('#' + n.idNode).attr('width')
        const _text = document.getElementById(n.idNode + '_text')
        const width_text = (_text) ? _text.getBoundingClientRect().width : 0
        if (n.display_style.label_horiz_valeur == 'milieu') {
          return width / 2
        } else if (n.display_style.label_horiz_valeur == 'gauche') {
          return -width / 2
        } else if (n.display_style.label_horiz_valeur == 'droite') {
          return width + width_text / 2
        } else {
          return 0
        }
      })
      .attr('y', n => {
        const height = +d3.select('#' + n.idNode).attr('height')
        const _text = document.getElementById(n.idNode + '_text')
        const height_text = (_text) ? _text.getBoundingClientRect().height : 0
        if (n.display_style.label_vert_valeur == 'milieu') {
          // return height / 2 + height_text / 2
          return height / 2 + ((node_value_and_text_same_pos(n))?n.display_style.font_size:0)
        } else if (n.display_style.label_vert_valeur == 'haut') {
          return -n.display_style.font_size+ ((node_value_and_text_same_pos(n))?-height_text*1.5:0)
        } else if (n.display_style.label_vert_valeur == 'bas') {
          return height+((node_value_and_text_same_pos(n))?height_text*1.8:n.display_style.font_size)
        } else {
          return 0
        }
      })
      .attr('text-anchor', () => 'middle')
      .attr('visibility', n => n.node_visible && n.show_value ? 'visible' : 'hidden')
      // .style('text-align', 'center')
      // .style('font-weight', d => (d.display_style.bold) ? 'bold' : 'normal')
      // .style('font-style', d => (d.display_style.italic) ? 'italic' : 'normal')
      .style('font-size', d => d.display_style.value_font_size + 'px')
      // .style('text-transform', d => (d.display_style.uppercase) ? 'uppercase' : 'none')
      .text(d => {
        let total = 0

        if (d.show_value) {
          if (d.outputLinksId.length > 0) {
            for (let i = 0; i < d.outputLinksId.length; i++) {
              const link = display_links[d.outputLinksId[i]]
              if (link === undefined) {
                //alert('Corruption du diagramme')
                return ''
              }
              if (display_nodes[link.idSource].node_visible && display_nodes[link.idTarget].node_visible) {
                total += getLinkValue(data, link.idLink).value
              }
            }
          }
          if (total === 0) {
            if (d.inputLinksId.length > 0) {
              for (let i = 0; i < d.inputLinksId.length; i++) {
                const link = display_links[d.inputLinksId[i]]
                if (link === undefined) {
                  //alert('Corruption du diagramme')
                  return ''
                }
                if (display_nodes[link.idSource].node_visible && display_nodes[link.idTarget].node_visible) {
                  total += getLinkValue(data, link.idLink).value
                }
              }
            }
          }
          return total

        } else {
          return ''
        }

      })



    if (!static_sankey) {
      select
        .call(d3.drag<SVGTextElement, SankeyNode>()
          .subject(Object).on('drag', function (event, node) {
            if (alt_key_pressed === true && multi_selected_nodes.current.includes(node)) {
              drag_node_text(node, event)
            }
            else {
              const node_to_drag = 'ggg_node' + d3.select(this).attr('id').substring(4, 6)
              const el = document.getElementById(node_to_drag)
              if (el) {
                drag_nodes(
                  display_nodes, display_links,
                  display_style,
                  data.nodeTags,
                  event
                )
              }
            }
          })
        )
    }



  }


  const animate_view_changement = (
    data_v1: SankeyData,
    data_v2: SankeyData,
  ) => {
    //Cette fonction reprend le code executé pour l'affichage des noeuds et lien tout en  ajoutant une animation
    //Elle est executé avant de changé de vue (variable view) afin de pouvoir faire les animations puis ensuites 



    // Supprime les noeuds non présent dans la vu suivante avec une transition
    Object.keys(data_v1.nodes).filter(d => !Object.keys(data_v2.nodes).includes(d)).map(d => {
      d3.select('#gg_' + d).transition().duration(500).style('opacity', 0).remove()

    })


    // Supprime les liens non présent dans la vu suivante avec une transition
    Object.keys(data_v1.links).filter(d => !Object.keys(data_v2.links).includes(d)).map(d => {
      d3.select('#gg_' + d).transition().duration(500).style('opacity', 0).remove()
    })

    //Récupère les noeuds et liens présent uniquement dans la nouvelle data 
    const new_nodes = Object.fromEntries(Object.entries(data_v2.nodes).filter(d => !Object.keys(data_v1.nodes).includes(d[0])))
    const new_links = Object.fromEntries(Object.entries(data_v2.links).filter(d => !Object.keys(data_v1.links).includes(d[0])))
    const k_links = Object.keys(new_links)


    //=================AJOUT NOUEVEAUX NOEUDS========================================
    const gg_nodes = d3.select('#view_div #g_nodes').selectAll('.gg_nodes').data(Object.values(data_v2.nodes)).enter().filter(d => Object.keys(new_nodes).includes(d.idNode)).append('g')
      .attr('id', d => {
        return 'gg_' + d.idNode
      })
      .attr('class', 'gg_nodes')
      // On gere la visibilité directement sur gg_nodes avec un display <inline />
      // Cela permettra de mieux gérer des zooms sur les éléments visibles
      .style('display', (d) => {
        let display: string
        if (d.node_visible) { display = 'inline' } else { display = 'none' }
        return display
      })
      .style('font-family', d => d.display_style.font_family)


    const ggg_nodes = gg_nodes.append('g')
      .attr('id', d => 'ggg_' + d.idNode)
      .attr('class', 'ggg_nodes')
      .attr('transform', d => {
        return 'translate(' + d.x + ', ' + d.y + ')'

      })


    if ( data.nodeTags['Type de noeud'] ) {
      Object.entries(data.nodeTags['Type de noeud'].tags).forEach( ([key,tag])=> {
        const current_selection = ggg_nodes
          .filter(d =>d.tags['Type de noeud'].includes(key))
          .append(tag.shape as string)
          .classed('node', true)
          .classed('node_shape', true)
          .attr('height', d => d.node_height)
          .attr('width', d => d.node_width)
        if ( tag.shape === 'ellipse' ) {
          current_selection
            .attr('cx', d => d.node_width / 2)
            .attr('cy', d => d.node_height / 2)
            .attr('rx', d => d.node_width / 2)
            .attr('ry', d => d.node_height / 2)
        }
      })
      ggg_nodes
        .filter(d =>d.tags['Type de noeud'].length === 0)
        .append('rect')
        .classed('node', true)
        .classed('node_shape', true)
        .attr('height', d => d.node_height)
        .attr('width', d => d.node_width)
    } else {
      ggg_nodes
        .filter(d => d.shape === 'rect')
        .append('rect')
        .classed('node', true)
        .classed('node_shape', true)
        .attr('height', d => d.node_height)
        .attr('width', d => d.node_width)      

      ggg_nodes
        .filter(d => d.shape === 'ellipse')
        .append('ellipse')
        .classed('node', true)
        .classed('node_shape', true)
        .attr('cx', d => d.node_width / 2)
        .attr('cy', d => d.node_height / 2)
        .attr('rx', d => d.node_width / 2)
        .attr('ry', d => d.node_height / 2)
        .attr('height', d => d.node_height)
        .attr('width', d => d.node_width)
    }


    d3.selectAll('.node')
      .filter(d => Object.keys(new_nodes).includes((d as SankeyNode).idNode))
      .attr('id', d => (d as SankeyNode).idNode)
      // // .attr('visibility', d => (d as SankeyNode).node_visible && (d as SankeyNode).shape_visible ? 'visible' : 'hidden')
      // .style('opacity', d => (d as SankeyNode).node_visible && (d as SankeyNode).shape_visible ? '1' : '0')
      .style('opacity', 0)
      .attr('fill', d => node_color(d as SankeyNode) as string)
      .attr('stroke', 'black')
      .attr('stroke-width', d => {
        d = (d as SankeyNode)
        if (multi_selected_nodes.current.map(d => { if (d != undefined) { return d.idNode } else { return '' } }).includes((d as SankeyNode).idNode)) {
          return 2
        } else {
          return 0
        }
      }

      )

    //---------VERSION AVEC STYLE PROPRE A CHAQUE NOEUD---------------

    Object.values(new_nodes).map(n => setNodeHeight(n, data_v2.nodes, data_v2.links, data_v2.nodeTags))

    //----------------ICON-----------------


    ggg_nodes
      .filter(d => d.iconName != 'none' && d.iconVisible)
      .append('svg')
      .attr('viewBox', '0, 0, 1000, 1000')
      .attr('transform', n => {
        const shiftV = (+d3.select('#' + n.idNode).attr('height') * (100 - n.iconRatio) / 100) / 2
        const shiftH = (+d3.select('#' + n.idNode).attr('width') * (100 - n.iconRatio) / 100) / 2
        return 'translate(' + shiftH + ',' + shiftV + ')'
      })
      .attr('height', n => +d3.select('#' + n.idNode).attr('height') * (n.iconRatio) / 100)
      .attr('width', n => +d3.select('#' + n.idNode).attr('width') * (n.iconRatio) / 100)
      .attr('x', 0)
      .append('g')
      .append('path')
      .style('fill', (n) => {
        if (n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
          if (tag && !n.shape_visible) {
            return tag.color as string
          } else {
            //console.log('tutu')
          }
        }
        return n.iconColor
      })
      .attr('d', n => {
        const icon = data_v2.icon_catalog[n.iconName]
        if (icon != undefined) {
          return icon
        } else {
          return ''
        }
      })

    //------------------LABEL------------------------
    ggg_nodes
      .append('text')
      .classed('node', true)
      .classed('node_text', true)
      .attr('id', n => n.idNode + '_text')
      .attr('x', (n) => {
        const width = +d3.select('#' + n.idNode).attr('width')
        if (n.x_label) {
          return n.x_label
        } else if (n.display_style.label_horiz == 'milieu') {
          return width / 2
        } else if (n.display_style.label_horiz == 'gauche') {
          return 0
        } else if (n.display_style.label_horiz == 'droite') {
          return n.display_style.label_vert == 'milieu' ? width : 0
        } else {
          return 0
        }
      })
      .attr('y', n => {
        const height = +d3.select('#' + n.idNode).attr('height')
        if (n.y_label && !data_v2.show_structure) {
          return n.y_label
        } else if (n.display_style.label_vert == 'milieu') {
          return height / 2
        } else if (n.display_style.label_vert == 'haut') {
          return -4
        } else if (n.display_style.label_vert == 'bas') {
          return height
        } else {
          return 0
        }
      })
      .attr('text-anchor', n => {
        if (n.x_label && !data_v2.show_structure) {
          return 'center'
        } else if (n.display_style.label_horiz == 'milieu') {
          return 'middle'
        } else if (n.display_style.label_horiz == 'gauche') {
          return 'end'
        } else if (n.display_style.label_horiz == 'droite') {
          return 'start'
        } else {
          return 'start'
        }
      })
      .attr('visibility', n => n.node_visible && n.label_visible ? 'visible' : 'hidden')
      .style('text-align', 'center')
      .style('font-weight', d => (d.display_style.bold) ? 'bold' : 'normal')
      .style('font-style', d => (d.display_style.italic) ? 'italic' : 'normal')
      .style('font-size', d => d.display_style.font_size + 'px')
      .style('text-transform', d => (d.display_style.uppercase) ? 'uppercase' : 'none')
      .text(d => {
        return d.name.split(' - ')[0].replace('-', ' ')
      })
      .each(d => {

        const wrap = textwrap()
          .bounds({ height: 100, width: (d.display_style.label_box_width != 0) ? d.display_style.label_box_width : 110 })
          .method('tspans')
        d3.select('#ggg_' + d.idNode + ' text')
          .call(wrap)
        if (!d.x_label || data_v2.show_structure) {
          d3.selectAll('#ggg_' + d.idNode + ' text tspan').attr('dx', 0).attr('x', () => {
            const width = +d3.select('#' + d.idNode).attr('width')

            if (d.display_style.label_horiz == 'milieu') {
              return width / 2
            } else if (d.display_style.label_horiz == 'droite') {
              return d.display_style.label_vert == 'milieu' ? width : 0
            } else {
              return 0
            }
          })
        }

        d3.selectAll('#ggg_' + d.idNode + ' text tspan').attr('dx', 0).attr('x', () => {
          const width = +d3.select('#' + d.idNode).attr('width')
          if (d.x_label) {
            return d.x_label
          } else if (d.display_style.label_horiz == 'milieu') {
            return width / 2
          } else if (d.display_style.label_horiz == 'droite') {
            return width
          } else {
            return 0
          }
        })
        //Nombre de tspan dans la balise text
        const nb_tspan = d3.selectAll('#ggg_' + d.idNode + ' text tspan').nodes().length
        if (d.display_style.label_vert == 'milieu') {
          d3.select('#ggg_' + d.idNode + ' .node_text').style('transform', 'translateY(' + (0.25 - 0.5 * (nb_tspan - 1)) + 'em)')
        } else if (d.display_style.label_vert == 'bas') {
          d3.select('#ggg_' + d.idNode + ' .node_text').style('transform', 'translateY(1em)')
        } else if (d.display_style.label_vert == 'haut') {
          d3.select('#ggg_' + d.idNode + ' .node_text').style('transform', 'translateY(' + (-(nb_tspan - 1)) + 'em)')

        }

      })

    //Affiche valueur Noeud
    ggg_nodes.append('text')
      .classed('node', true)
      .classed('node_text_value', true)
      .attr('id', n => n.idNode + '_text_value')
      .attr('x', (n) => {
        const width = +d3.select('#' + n.idNode).attr('width')
        const _text = document.getElementById(n.idNode + '_text')
        const width_text = (_text) ? _text.getBoundingClientRect().width : 0
        if (n.display_style.label_horiz == 'milieu') {
          return width / 2
        } else if (n.display_style.label_horiz == 'gauche') {
          return -width / 2
        } else if (n.display_style.label_horiz == 'droite') {
          return width + width_text / 2
        } else {
          return 0
        }
      })
      .attr('y', n => {
        const height = +d3.select('#' + n.idNode).attr('height')
        const _text = document.getElementById(n.idNode + '_text')
        const height_text = (_text) ? _text.getBoundingClientRect().height : 0
        if (n.display_style.label_vert == 'milieu') {
          return height / 2 + height_text / 2
        } else if (n.display_style.label_vert == 'haut') {
          return '-2em'
        } else if (n.display_style.label_vert == 'bas') {
          return height + height_text * 0.8
        } else {
          return 0
        }
      })
      .attr('text-anchor', () => 'middle')
      .attr('visibility', n => n.node_visible && n.label_visible ? 'visible' : 'hidden')
      // .style('text-align', 'center')
      // .style('font-weight', d => (d.display_style.bold) ? 'bold' : 'normal')
      // .style('font-style', d => (d.display_style.italic) ? 'italic' : 'normal')
      .style('font-size', d => d.display_style.font_size + 'px')
      // .style('text-transform', d => (d.display_style.uppercase) ? 'uppercase' : 'none')
      .text(d => {
        let total = 0

        if (d.show_value) {
          if (d.outputLinksId.length > 0) {
            for (let i = 0; i < d.outputLinksId.length; i++) {
              const link = new_links[d.outputLinksId[i]]
              if (link === undefined) {
                //alert('Corruption du diagramme')
                return ''
              }
              if (new_nodes[link.idSource].node_visible && new_nodes[link.idTarget].node_visible) {
                total += getLinkValue(data_v2, link.idLink).value
              }
            }
          }

          if (total === 0) {
            if (d.inputLinksId.length > 0) {
              for (let i = 0; i < d.inputLinksId.length; i++) {
                const link = new_links[d.inputLinksId[i]]
                if (link === undefined) {
                  //alert('Corruption du diagramme')
                  return ''
                }
                if (new_nodes[link.idSource].node_visible && new_nodes[link.idTarget].node_visible) {
                  total += getLinkValue(data_v2, link.idLink).value
                }
              }
            }
          }
          return total

        } else {
          return ''
        }

      })

    Object.values(new_nodes).map(d => {
      d3.select('#gg_' + d.idNode).selectAll('*').transition().duration(500).style('opacity', 1)
    })





    //==================MODIFICATION NOEUD========================================
    const edit_nodes = Object.fromEntries(Object.entries(data_v2.nodes).filter(d => Object.keys(data_v1.nodes).includes(d[0])))

    Object.values(edit_nodes).map(d => {
      d3.select('#ggg_' + d.idNode).transition().duration(500).attr('transform', 'translate(' + d.x + ',' + d.y + ')')
    })




    //====================AJOUT LIENS============================================

    d3.selectAll('#svg #sankey_def').remove()
    const defGradient = d3.select('#svg').append('defs').attr('id', 'sankey_def')





    const gg_links = d3
      .select('#g_links')
      .selectAll('.gg_links')
      .data(Object.values(data_v2.links))
      .enter()
      .filter(l => Object.keys(new_links).includes(l.idLink))
      .append('g')
      .attr('id', d => 'gg_' + d.idLink)
      .attr('class', 'gg_links')
      // On gere la visibilité directement sur gg_nodes avec un display <inline />
      .style('display', (d) => {
        let display: string
        if (link_visible(d, data_v2)) { display = 'inline' } else { display = 'none' }
        return display
      })
      .attr('pointer-events', 'auto')
      .attr('stroke-dasharray', d => {
        const link_value = getLinkValue(data_v2, d.idLink)
        if (link_value === undefined) {
          return ''
        }
        //const display_value = getLinkValue(data_v2, d.idLink).display_value
        if (d.dashed) {
          return '40, 5'
        } else {
          return ''
        }
      })

    const paths = gg_links.append('path')
    const positions: { [label_position: string]: string[] } = {
      'frozen': ['50%', 'start'],
      'beginning': ['10px', 'start'],
      'middle': ['50%', 'start'],
      'end': ['100%', 'end']
    }
    gg_links
      .filter(
        d => d.label_position !== 'frozen' 
      )
      .append('text')
      .attr('pointer-events', 'none')
      // .attr('style', 'font-weight: bold;font-family:Arial; font-size:' + data_v2.display_style.font_size + 'px;')
      .attr('style', 'font-weight: bold; font-size:' + data_v2.display_style.link_font_size + 'px;')
      .attr('fill', l => {

        return l.text_color
      })
      .attr('dy', l => {
        if (l.orthogonal_label_position === 'middle') {
          return '0.3em'
        } else if (l.orthogonal_label_position === 'below') {
          return scale(getLinkValue(data_v2, l.idLink).value) / 2 + 10 + 'px'
        } else if (l.orthogonal_label_position === 'above') {
          return -scale(getLinkValue(data_v2, l.idLink).value) / 2 + 'px'
        }
        return '0.3em'
      })
      .append('textPath')
      .attr('id', d => d.idLink + '_text')
      .attr('side', link => {
        if (link.recycling) {
          if (data_v2.nodes[link.idSource].x < data_v2.nodes[link.idTarget].x) {
            return 'left'
          } else if (link.label_position === 'middle' && link.orientation === 'hh') {
            return 'right'
          }
          return 'left'
        } else {
          if (data_v2.nodes[link.idSource].x < data_v2.nodes[link.idTarget].x) {
            return 'left'
          } else {
            return 'right'
          }
          return 'left'
        }
      })
      .attr('class', 'link_value')
      .attr('href', d => '#' + d.idLink)
      .attr('startOffset', l=>positions[l.label_position][0])
      .attr('text-anchor', l=>positions[l.label_position][1])


    const select2 = gg_links
      .filter(d => d.label_position === 'frozen' || !d.label_on_path || d.label_on_path === undefined)
      .append('text')


    select2
      .attr('href', d => '#' + d.idLink)
      .attr('id', d => d.idLink + '_text')
      .attr('class', 'link_value')
      .attr('style', 'font-weight: bold;font-size:' + data_v2.display_style.link_font_size + 'px;')
      .attr('fill', l => {
        if (l.text_color === l.color && l.orthogonal_label_position === 'middle') {
          return 'white'
        }
        return l.text_color
      })
      .attr('visibility', d => link_visible(d, data_v2) && getLinkValue(data_v2, d.idLink).value >= Math.max(data_v2.display_style.filter, data_v2.display_style.filter_label) ? 'visible' : 'hidden')

    let error_msg: { text?: string | undefined } | undefined
    paths
      .attr('class', 'link')
      .attr('id', d => d.idLink)
      .attr('fill', 'none')
      // .attr('stroke-opacity', d => data_v2.nodes[d.idSource].node_visible && data_v2.nodes[d.idTarget].node_visible && getLinkValue(data_v2, d.idLink).value >= data_v2.display_style.filter ? (!((data_v2 as unknown) as { show_uncert: boolean }).show_uncert && (String(getLinkValue(data_v2, d.idLink).display_value).includes('[')) ? 0.85 : 0.85) : 0)
      .attr('stroke-opacity', d => data_v2.nodes[d.idTarget].node_visible && getLinkValue(data_v2, d.idLink).value >= data_v2.display_style.filter ? 0.5 : 0)
      .attr('stroke-width', l => {


        const node = data_v2.nodes[l.idSource]
        // const links = data_v2.links
        const nodes = data_v2.nodes
        // const stream_io = node.inputLinksId.concat(node.outputLinksId)
        //Met les flux entre les noeuds qui sont 'invalides' en mode fin pour afficehr erreurs

        //position noeud source ou target
        let pos_x_src, pos_y_src
        if (node.name == nodes[l.idSource].name) {
          pos_x_src = nodes[l.idTarget].x
          pos_y_src = nodes[l.idTarget].y
        } else {
          pos_x_src = nodes[l.idSource].x
          pos_y_src = nodes[l.idSource].y
        }


        const link_value = test_link_value(data, nodes, l, data_v2.nodeTags)
        //Zones limite à ne pas êtres
        const limit_x = [pos_x_src - scale(link_value), pos_x_src + node.node_width + scale(link_value)]
        const limit_y = [pos_y_src - scale(link_value), pos_y_src + scale(link_value)]

        let draw_warning = false

        //verifie que la position du noeud drag n'est pas au même niveau que ses noeuds traget
        //si partie gauche du noeud ne se situe pas dans les coord du noeud source
        const left_in_src = node.x > limit_x[0] && node.x < limit_x[1]
        //si partie droite du noeud ne se situe pas dans le noeud source
        const right_in_src = node.x + node.node_width > limit_x[0] && node.x + node.node_width < limit_x[1]
        //si partie haute du noeud ne se situe pas dans le noeud source
        const top_in_src = node.y > limit_y[0] && node.y < limit_y[1]
        // const bottom_in_src = node.y + scale(link_value) > limit_y[0] && node.y + scale(link_value) < limit_y[1]

        if (l.orientation == 'hh') {
          //orientation hh
          draw_warning = left_in_src || right_in_src
        } else if (l.orientation == 'vv') {
          //orientation vv
          draw_warning = top_in_src
        } else if (l.orientation == 'vh') {
          draw_warning = left_in_src || right_in_src || top_in_src
        } else {
          //orientation hv 
          //draw_warning = node_in_src_hh || node_in_src_vv
          draw_warning = left_in_src || right_in_src || top_in_src
        }

        if (draw_warning && !l.recycling) {
          return '1px'
        } else {

          const link_value = test_link_value(data_v2, data_v2.nodes, l, data_v2.nodeTags)
          return scale(Math.max(inv_scale(min_thickness), link_value ? link_value : 0))

        }

      })

      .attr('stroke', l => {
        const width_src = +d3.select('#' + l.idSource).attr('width')
        const height_src = +d3.select('#' + l.idSource).attr('height')
        const width_trgt = +d3.select('#' + l.idTarget).attr('width')
        //const height_trgt = +d3.select('#' + l.idTarget).attr('height')

        const gradient = defGradient.append('defs')
          .append('linearGradient')
          .attr('id', 'gradient-' + l.idSource + '-' + l.idTarget)
          .attr('gradientUnits', 'userSpaceOnUse')



        gradient.append('stop')
          .attr('id', 'stop-start')
          .attr('offset', '0%')
          .attr('stop-color', () => {

            if (data_v2.nodes[l.idSource].x <= data_v2.nodes[l.idTarget].x) {
              const n = data_v2.nodes[l.idSource]
              if (n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
                if (tag) {
                  return tag.color as string
                }
              }
              if (n.shape_visible || n.iconName === 'none') {
                return n.color
              } else {
                return n.iconColor
              }
            } else {
              const n = data_v2.nodes[l.idTarget]
              if (n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
                if (tag) {
                  return tag.color as string
                }
              }
              if (n.shape_visible || n.iconName === 'none') {
                return n.color
              } else {
                return n.iconColor
              }
            }
          })
          .attr('stop-opacity', 1)

        gradient.append('stop')
          .attr('id', 'stop-end')
          .attr('offset', '100%')
          .attr('stop-color', () => {
            if (data_v2.nodes[l.idSource].x <= data_v2.nodes[l.idTarget].x) {
              const n = data_v2.nodes[l.idTarget]
              if (n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
                if (tag) {
                  return tag.color as string
                }
              }
              if (n.shape_visible || n.iconName === 'none') {
                return n.color
              } else {
                return n.iconColor
              }
            } else {
              const n = data_v2.nodes[l.idSource]
              if (n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
                if (tag) {
                  return tag.color as string
                }
              }
              if (n.shape_visible || n.iconName === 'none') {
                return n.color
              } else {
                return n.iconColor
              }
            }
          })
          .attr('stop-opacity', 1)


        const nodes = data_v2.nodes

        if (l.orientation == 'hh' || l.orientation == 'hv') {
          d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-start').attr('stop-color', () => {
            if (nodes[l.idSource].x < nodes[l.idTarget].x) {
              d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
                .attr('x1', data_v2.nodes[l.idSource].x + width_src)
                .attr('y1', '0')
                .attr('x2', nodes[l.idTarget].x)
                .attr('y2', 0)
              const n = data_v2.nodes[l.idSource]
              if (n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
                if (tag) {
                  return tag.color as string
                }
              }
              if (n.shape_visible || n.iconName === 'none') {
                return n.color
              } else {
                return n.iconColor
              }
            } else {
              d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
                .attr('x1', data_v2.nodes[l.idTarget].x + width_trgt)
                .attr('y1', '0')
                .attr('x2', nodes[l.idSource].x)
                .attr('y2', 0)
              const n = nodes[l.idTarget]
              if (n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
                if (tag) {
                  return tag.color as string
                }
              }
              if (n.shape_visible || n.iconName === 'none') {
                return n.color
              } else {
                return n.iconColor
              }
            }
          }
          )

          d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-end').attr('stop-color', () => {
            if (nodes[l.idSource].x > nodes[l.idTarget].x) {
              const n = nodes[l.idSource]
              if (n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
                if (tag) {
                  return tag.color as string
                }
              }
              if (n.shape_visible || n.iconName === 'none') {
                return n.color
              } else {
                return n.iconColor
              }
            } else {
              const n = nodes[l.idTarget]
              if (n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
                if (tag) {
                  return tag.color as string
                }
              }
              if (n.shape_visible || n.iconName === 'none') {
                return n.color
              } else {
                return n.iconColor
              }
            }
          }
          )
        } else if (l.orientation == 'vv' || l.orientation == 'hv') {
          //orientation vert-vert
          d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-start').attr('stop-color', () => {
            if (nodes[l.idSource].y < nodes[l.idTarget].y) {
              d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
                .attr('x1', 0)
                .attr('y1', data_v2.nodes[l.idSource].y + height_src)
                .attr('x2', 0)
                .attr('y2', data_v2.nodes[l.idTarget].y)

              const n = nodes[l.idSource]
              if (n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
                if (tag) {
                  return tag.color as string
                }
              }
              if (n.shape_visible || n.iconName === 'none') {
                return n.color
              } else {
                return n.iconColor
              }
            } else {
              d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
                .attr('x1', 0)
                .attr('y1', data_v2.nodes[l.idTarget].y + height_src)
                .attr('x2', 0)
                .attr('y2', data_v2.nodes[l.idSource].y)

              const n = nodes[l.idTarget]
              if (n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
                if (tag) {
                  return tag.color as string
                }
              }
              if (n.shape_visible || n.iconName === 'none') {
                return n.color
              } else {
                return n.iconColor
              }
            }
          }
          )

          d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-end').attr('stop-color', () => {
            if (nodes[l.idSource].y > nodes[l.idTarget].y) {
              const n = nodes[l.idSource]
              if (n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
                if (tag) {
                  return tag.color as string
                }
              }
              if (n.shape_visible || n.iconName === 'none') {
                return n.color
              } else {
                return n.iconColor
              }
            } else {
              const n = nodes[l.idTarget]
              if (n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
                if (tag) {
                  return tag.color as string
                }
              }
              if (n.shape_visible || n.iconName === 'none') {
                return n.color
              } else {
                return n.iconColor
              }
            }
          }
          )
        } else if (l.orientation == 'vh') {

          d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-start').attr('stop-color', () => {
            if (nodes[l.idSource].x < nodes[l.idTarget].x) {
              d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
                .attr('x1', data_v2.nodes[l.idSource].x + width_src - 10)
                .attr('y1', '0')
                .attr('x2', nodes[l.idTarget].x)
                .attr('y2', 0)
              const n = nodes[l.idSource]
              if (n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
                if (tag) {
                  return tag.color as string
                }
              }
              if (n.shape_visible || n.iconName === 'none') {
                return n.color
              } else {
                return n.iconColor
              }
            } else {
              d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
                .attr('x1', data_v2.nodes[l.idTarget].x + width_trgt + 10)
                .attr('y1', '0')
                .attr('x2', nodes[l.idSource].x)
                .attr('y2', 0)
              const n = nodes[l.idTarget]
              if (n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
                if (tag) {
                  return tag.color as string
                }
              }
              if (n.shape_visible || n.iconName === 'none') {
                return n.color
              } else {
                return n.iconColor
              }
            }
          }
          )

          d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-end').attr('stop-color', () => {
            if (nodes[l.idSource].x > nodes[l.idTarget].x) {
              const n = nodes[l.idSource]
              if (n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
                if (tag) {
                  return tag.color as string
                }
              }
              if (n.shape_visible || n.iconName === 'none') {
                return n.color as string
              } else {
                return n.iconColor as string
              }
            } else {
              const n = nodes[l.idTarget]
              if (n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
                if (tag) {
                  return tag.color as string
                }
              }
              if (n.shape_visible || n.iconName === 'none') {
                return n.color as string
              } else {
                return n.iconColor as string
              }
            }
          }
          )

        }

        return (l.gradient) ? 'url(#gradient-' + l.idSource + '-' + l.idTarget + ')' : link_color(l) as string
      }
      )


    //Creation des Arrows associés au link
    d3.selectAll('.ggg_nodes')
      .filter(m => {
        const n = Object.values(data_v2.nodes).filter(d => d.idNode === (m as SankeyNode).idNode)[0]
        //test si les noeuds ont des les flux sortant, qu'il y a des flux sortant et que les noeuds sont présents dans la vue suivantes
        //car les noeuds sélectionnés par d3.selectAll('.ggg_nodes') contient les noeuds qui sont en train d'être supprimé (cela est dût à la transition au debut de la fonction)
        if (n !== undefined && n.inputLinksId.length != 0 && Object.keys(data_v2.links).length != 0 && Object.values(data_v2.nodes).map(d => d.idNode).includes(n.idNode)) {
          return !n.node_visible || (!data_v2.links[n.inputLinksId[0]].arrow) ? false : true
        } else {
          return false
        }
      })
      .each(function (m) {
        const n = Object.values(data_v2.nodes).filter(d => d.idNode === (m as SankeyNode).idNode)[0]
        drawArrows(data_v2, n as SankeyNode, data_v2.nodes, data_v2.links, data_v2.display_style, data_v2.nodeTags)
      })

    gg_links.filter(d => k_links.includes(d.idLink)).selectAll('.arrow').style('opacity', '0')



    paths.attr('d', d => {
      setNodesHeight(data_v2.nodes, new_links, d, data_v2.nodeTags)
      return drawCurve(data_v2,
        data_v2.nodes, new_links, data_v2.display_style,
        data_v2.nodeTags, d, error_msg
      )
    })
    if (error_msg && error_msg.text) {
      alert(error_msg.text)
    }

    //===================MODIFICATION FLUX NOUVELLE VUE =======================
    const edit_links = Object.fromEntries(Object.entries(data_v2.links).filter(d => Object.keys(data_v1.links).includes(d[0])))
    const edit_arrow = d3.selectAll('.ggg_nodes')
      .filter(m => {
        const incl = (el: string) => Object.values(edit_links).map(d => d.idLink).includes(el)

        const n = m as SankeyNode
        if (n.inputLinksId.length != 0 && Object.keys(data_v2.links).length != 0 && Object.values(data_v2.nodes).map(d => d.idNode).includes(n.idNode) && n.inputLinksId.some(incl)) {
          return !n.node_visible || (!data_v2.links[n.inputLinksId[0]].arrow) ? false : true
        } else {
          return false
        }
      })

    // edit_arrow.selectAll('.arrow').remove()
    //Déplace les flêchesdéjà existant vers leur nouvelle position
    edit_arrow
      .each(n => {
        const new_n = Object.values(data_v2.nodes).filter(d => d.idNode === (n as SankeyNode).idNode)[0]
        drawArrows(data_v2, new_n as SankeyNode, data_v2.nodes, data_v2.links, data_v2.display_style, data_v2.nodeTags)
      })

    //Déplace les flux déjà existant vers leur nouvelle position
    Object.values(edit_links).map(d => {
      d3.select('#' + d.idLink).transition().duration(500).attr('d', l => {
        const d = l as SankeyLink
        const p = drawCurve(data_v2, data_v2.nodes, edit_links, data_v2.display_style, data_v2.nodeTags, d, error_msg)
        return p
      })
    })



    //Récupère parmi les noeuds, tous ceux qui emettent un nouveau flux sans en recevoir de nouveau
    const start_point = Object.values(data_v2.nodes).filter(f => (f.inputLinksId.filter(i => k_links.includes(i)).length == 0) && (f.outputLinksId.filter(i => k_links.includes(i)).length > 0))
    let time_to_animate = 500
    //calcul la profondeur max de nouveau flux (le nombre de nouveau flux consecutif ) afin de calculer le temps qu'il faut avant de changer la variable set_view
    if (start_point.length > 0) {
      let nb_animation = calcPath(data_v2.nodes, start_point[0], new_links)

      nb_animation = (nb_animation !== undefined) ? nb_animation : 0
      time_to_animate += nb_animation * 2000
    }
    const glinks = (d3.select('#svg').selectAll('.gg_links') as d3.Selection<SVGElement, SankeyLink, HTMLElement, SankeyLink>)
      .filter(function (d) {
        return k_links.includes(d.idLink)
      })

    glinks.selectAll('.link').style('stroke-opacity', 0)
    glinks.selectAll('text').style('opacity', 0)

    setTimeout(function () {
      start_point.map(s => {
        branchAnimateForView(data_v2, s, [s.idNode], new_links)
      })
    }, 500)

    return time_to_animate

  }

  //Fonction permettant de calculer la profondeur max de nouveaux liens
  const calcPath = (
    nodes: { [node_id: string]: SankeyNode },
    node: SankeyNode,
    new_links: { [link_id: string]: SankeyLink },
  ) => {
    const keys_links = Object.keys(new_links)
    // let number_new_path=0
    let long = 0
    const links_present = node.outputLinksId.filter(o => keys_links.includes(o))

    if (links_present.length > 0) {
      long += 1
      links_present.map(d => {
        const n = nodes[new_links[d].idTarget]
        const lng = calcPath(nodes, n, new_links) as number
        long += isNaN(lng) ? 0 : lng

      })
      return long
    }
  }

  //fonction pour animer que les nouveaux liens 
  const branchAnimateForView = (
    data: SankeyData,
    nodeData: SankeyNode,
    nodeDisplay: string[],
    new_links: { [link_id: string]: SankeyLink },
  ) => {

    // console.log('branchAnimate')


    // Permet la progation de l'animation sur l'ensemble du Sankey
    const nodeStart = nodeData.idNode
    const keys_links = Object.keys(new_links)

    // on pourrait aussi evnetuellement faire un clone des noeuds
    d3.select('#' + nodeData.idNode).style('fill', d3.select('#' + nodeData.idNode).attr('fill'))
    d3.select('#' + nodeData.idNode + '_text').style('fill', d3.select('#' + nodeData.idNode).attr('fill'))

    const glinks = (d3.select('#svg').selectAll('.gg_links') as d3.Selection<SVGElement, SankeyLink, HTMLElement, SankeyLink>)
      .filter(function (d) {
        return d.idSource == nodeStart && keys_links.includes(d.idLink)
      })
    // console.log('gLink', glinks)
    // glinks.select('.link').style('stroke-opacity',0.2)
    // On fait une copie du link pour son animation, celle-ci sera supprimé après l'animation  (classe .tmp)
    const tmpLinks = glinks.clone(true).raise().attr('class', 'tmp')


    tmpLinks.selectAll('.link').style('stroke-opacity', 1)
    tmpLinks.selectAll('text').style('opacity', 0)


    tmpLinks.selectAll('.link')
      .each(function (this) {
        const totalLength = (this as SVGGeometryElement).getTotalLength()

        d3.select(this)
          .attr('stroke-dasharray', totalLength + ' ' + totalLength)
          .attr('stroke-dashoffset', totalLength)
          .style('stroke', function (this) {
            // on recupere les paramêtres initiaux du stroke
            return d3.select(this).attr('stroke')
          })
          .style('stroke-opacity', 1)


      })
      .transition()
      .duration(2000)
      .attr('stroke-dashoffset', 0)
      .on('end', function (this) {
        const idLink = d3.select(this).attr('id')
        const idTarget = data.links[idLink].idTarget
        // Modification des arrows après l'animation
        // console.log(d3.select(((this as unknown) as { parentNode: d3.BaseType }).parentNode).select('.arrow').node())
        const arrowInitColor = d3.select(((this as unknown) as { parentNode: d3.BaseType }).parentNode).select('.arrow').attr('fill')
        d3.select(((this as unknown) as { parentNode: d3.BaseType }).parentNode).select('.arrow')
          .style('fill', arrowInitColor)
          .style('opacity', 1)

        // reaffichage des link value après l'animation
        d3.select(((this as unknown) as { parentNode: d3.BaseType }).parentNode).select('.link_value')
          .style('display', 'inline')
        //Propagration de l'animation sur les flux sortant du target_node
        // on teste si le noeud est déjà passé cela permet de régler le problème des links à 'recycling'
        if (!nodeDisplay.includes(idTarget)) {
          nodeDisplay.push(idTarget)
          branchAnimateForView(data, data.nodes[idTarget], nodeDisplay, new_links)
        }
      })
  }


  const branchAnimate = (
    nodeData: SankeyNode,
    nodeDisplay: string[]
  ) => {

    // Permet la progation de l'animation sur l'ensemble du Sankey
    const nodeStart = nodeData.idNode

    // on pourrait aussi evnetuellement faire un clone des noeuds
    d3.select('#' + nodeData.idNode).style('fill', d3.select('#' + nodeData.idNode).attr('fill'))
    d3.select('#' + nodeData.idNode + '_text').style('fill', d3.select('#' + nodeData.idNode).attr('fill'))

    const glinks = (d3.select('#svg').selectAll('.gg_links') as d3.Selection<SVGElement, SankeyLink, HTMLElement, SankeyLink>)
      .filter(function (d) {
        return d.idSource == nodeStart
      })

    // On fait une copie du link pour son animation, celle-ci sera supprimé après l'animation  (classe .tmp)
    const tmpLinks = glinks.clone(true).raise().attr('class', 'tmp')
    tmpLinks.selectAll('.link')
      .each(function (this) {
        const totalLength = (this as SVGGeometryElement).getTotalLength()

        d3.select(this)
          .attr('stroke-dasharray', totalLength + ' ' + totalLength)
          .attr('stroke-dashoffset', totalLength)
          .style('stroke', function (this) {
            // on recupere les paramêtres initiaux du stroke
            return d3.select(this).attr('stroke')
          })

      })
      .transition()
      .duration(2000)
      .attr('stroke-dashoffset', 0)
      .on('end', function (this) {
        const idLink = d3.select(this).attr('id')
        const idTarget = data.links[idLink].idTarget
        // Modification des arrows après l'animation
        const arrow=d3.select('#arrow_'+idLink)
        if(arrow!==undefined && arrow!= null){        
          arrow.select('path').style('fill',(data.links[idLink].gradient)?data.nodes[idTarget].color:d3.select(this).attr('stroke'))
        }
        // reaffichage des link value après l'animation
        d3.select(((this as unknown) as { parentNode: d3.BaseType }).parentNode).select('.link_value')
          .style('display', 'inline')
        //Propagration de l'animation sur les flux sortant du target_node
        // on teste si le noeud est déjà passé cela permet de régler le problème des links à 'recycling'
        if (!nodeDisplay.includes(idTarget)) {
          nodeDisplay.push(idTarget)
          branchAnimate(data.nodes[idTarget], nodeDisplay)
        }
      })
  }

  const removeAnimate = () => {
    // Si il y a des .tmp (notamment issus des animations)
    if (d3.selectAll('.tmp').nodes().length > 0) {
      // On remove tous les éléments temporaires
      d3.selectAll('.tmp').remove()
      // Et on supprime tous les styles pour retrouver les valeurs par default qui sont dans attr
      d3.select('#svg').selectAll('.node_shape').style('fill', null)
      d3.select('#svg').selectAll('.link').style('stroke', null)
      d3.select('#svg').selectAll('.arrow').style('fill', null)
      d3.select('#svg').selectAll('.link_value').style('display', null)
      d3.select('#svg').selectAll('.node_text').style('fill', null)
    }
  }


  //Code issu de https://codepen.io/Saqoosha/pen/wpBaYw 
  // Algorithme de Sutherland-Hodgman pour coupure de polygone
  const intersection = function (cp1: number[], cp2: number[], e: number[], s: number[]) {
    const dc = [cp1[0] - cp2[0], cp1[1] - cp2[1]],
      dp = [s[0] - e[0], s[1] - e[1]],
      n1 = cp1[0] * cp2[1] - cp1[1] * cp2[0],
      n2 = s[0] * e[1] - s[1] * e[0],
      n3 = 1.0 / (dc[0] * dp[1] - dc[1] * dp[0])
    return [(n1 * dp[0] - n2 * dc[0]) * n3, (n1 * dp[1] - n2 * dc[1]) * n3]
  }

  const inside = function (p: number[], cp1: number[], cp2: number[]) {
    return (
      (cp2[0] - cp1[0]) * (p[1] - cp1[1]) > (cp2[1] - cp1[1]) * (p[0] - cp1[0])
    )
  }
  const clip = (subjectPolygon: number[][], clipPolygon: number[][]) => {
    let outputList = subjectPolygon
    let cp1 = clipPolygon[clipPolygon.length - 1]
    for (const j in clipPolygon) {
      const cp21 = clipPolygon[j]
      const inputList = outputList
      outputList = []
      let s = inputList[inputList.length - 1] //last on the input list
      for (const i in inputList) {
        const e2 = inputList[i]
        if (inside(e2, cp1, cp21)) {
          if (!inside(s, cp1, cp21)) {
            outputList.push(intersection(cp1, cp21, e2, s))
          }
          outputList.push(e2)
        } else if (inside(s, cp1, cp21)) {
          outputList.push(intersection(cp1, cp21, e2, s))
        }
        s = e2
      }
      cp1 = cp21
    }
    return outputList
  }


  const drawArrows = (
    data: SankeyData,
    n: SankeyNode,
    nodes: { [node_id: string]: SankeyNode },
    links: { [link_id: string]: SankeyLink },
    display_style: { node_font_size: number; link_font_size: number; filter?: number; filter_label?: number; italic?: boolean; bold?: boolean; uppercase?: boolean; },
    nodeTags: TagsCatalog
  ) => {
    //Cette version de drawArrows ne calcul plus les formes de morceau de flêche mais utilise l'algorithme de 
    //Sutherland-Hodgman pour couper les morceau de flêche


    Object.values(links).filter(l=>n.inputLinksId.includes(l.idLink)).map(l=>{
      //console.log(l)
      d3.selectAll('.defsArrow marker#arrow_'+l.idLink).remove()
    })
    

    const res = compute_total_offsets(n, data, nodeTags, test_link_value)
    // const [total_height_left, total_height_right, total_width_top, total_width_bottom] = res

    const arr = d3.select('#svg .defsArrow')
    const left_height = res[0] / (data.user_scale / 100)
    const right_height = res[1] / (data.user_scale / 100)
    const top_height = res[2] / (data.user_scale / 100)
    const bottom_height = res[3] / (data.user_scale / 100)

    const arrow_int_left = [[0, 0], [0, left_height], [10, left_height / 2]]
    const arrow_int_right = [[10, 0], [10, right_height], [0, right_height / 2]]
    const arrow_int_top = [[10, 0], [10, top_height], [0, top_height / 2]]
    const arrow_int_bottom = [[0, 0], [0, bottom_height], [10, bottom_height / 2]]

    const nb_input_tot = n.inputLinksId.length

    let start_point_left = 0
    let start_point_right = 0
    let start_point_top = 0
    let start_point_bottom = 0

    for (let i = 0; i < nb_input_tot; i++) {
      const l = links[n.inputLinksId[i]]
      if (!data.nodes[l.idSource].node_visible && data.nodes[l.idTarget].node_visible) {
        continue
      }
      if (!data.nodes[l.idSource].display && !data.nodes[l.idTarget].display) {
        continue
      }
      const link_value = test_link_value(data,nodes, l, nodeTags)
      if (link_value === undefined) {
        continue
      }

      const source_node = nodes[l.idSource]
      const source_node_x = source_node.position === 'absolute' ? source_node.x : +n.x + +source_node.x
      const source_node_y = source_node.position === 'absolute' ? source_node.y : +n.y + +source_node.y
      const node_x = n.position === 'absolute' ? n.x : +source_node.x + +n.x + +d3.select('#' + source_node.idNode).attr('width')
      const node_y = n.position === 'absolute' ? n.y : +source_node.y + +n.y + +d3.select('#' + source_node.idNode).attr('height')
      let refX = 0
      let orient = 'auto-start-reverse'

      //Épaisseur du flux déssiné selon l'échelle de data
      const thickness_link = link_value / (data.user_scale / 100)

      let clipped = [] as number[][]
      if ((l.orientation === 'hh' || l.orientation === 'vh') && (node_x <= source_node_x && l.recycling || node_x > source_node_x && !l.recycling)) {
        //Si le lien entre à gauche
        const zone_arrow = [[0, start_point_left], [20, start_point_left], [20, start_point_left + thickness_link], [0, start_point_left + thickness_link]]
        clipped = clip(JSON.parse(JSON.stringify(arrow_int_left)), zone_arrow)
        clipped.map(d => d[1] = d[1] - start_point_left)
        start_point_left += thickness_link
      } else if ((l.orientation === 'hh' || l.orientation === 'vh') && (node_x >= source_node_x && l.recycling || node_x < source_node_x && !l.recycling)) {
        const zone_arrow = [[0, start_point_right], [20, start_point_right], [20, start_point_right + thickness_link], [0, start_point_right + thickness_link]]
        clipped = clip(arrow_int_right, zone_arrow)
        clipped.map(d => {
          d[1] = d[1] - start_point_right
          return d
        })
        refX = 10
        orient = '0'
        start_point_right += thickness_link
      } else if ((l.orientation === 'vv' || l.orientation === 'hv') && (node_y > source_node_y)) {
        //Si le lien entre en haut
        const zone_arrow = [[0, start_point_top], [20, start_point_top], [20, start_point_top + thickness_link], [0, start_point_top + thickness_link]]
        clipped = clip(JSON.parse(JSON.stringify(arrow_int_top)), zone_arrow)
        clipped.map(d => d[1] = d[1] - start_point_top)
        start_point_top += thickness_link
        refX = 10
        orient = '270'

      } else if ((l.orientation === 'vv' || l.orientation === 'hv') && (node_y < source_node_y)) {
        //Si le lien entre en bas
        const zone_arrow = [[0, start_point_bottom], [20, start_point_bottom], [20, start_point_bottom + thickness_link], [0, start_point_bottom + thickness_link]]
        clipped = clip(JSON.parse(JSON.stringify(arrow_int_bottom)), zone_arrow)
        clipped.map(d => d[1] = d[1] - start_point_bottom)
        start_point_bottom += thickness_link

      }

      if (!display_style.filter || link_value >= display_style.filter) {

        const n = JSON.parse(JSON.stringify(clipped))

        const point = d3.line()(n)
        arr.append('marker').attr('id', 'arrow_' + l.idLink)
          .attr('viewBox', [0, 0, thickness_link, thickness_link])
          .attr('refY', thickness_link / 2)
          .attr('refX', refX)
          .attr('markerWidth', 1)
          .attr('markerHeight', 1)
          .attr('orient', orient)
          .append('path')
          .attr('d', point)
          .attr('stroke', 'none')
          .attr('fill', () => {
            if (l.gradient) {
              const n = nodes[l.idTarget]
              if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data.nodeTags[n.colorTag].tags[selected_tag]
                if (tag) {
                  return tag.color as string
                }
              }
              if (n.shape_visible || n.iconName === 'none') {
                return n.color
              } else {
                return n.iconColor
              }
            }
            return link_color(l) as string
          })
          .attr('stroke-width', '0px')
          .attr('stroke-opacity', 0.85)
          .attr('opacity', 0.85)

        d3.select('#' + l.idLink)
          .attr('marker-end', () => 'url(#arrow_' + l.idLink + ')')
      }
    }
  }

  const scale = d3.scaleLinear()
    .domain([0, 100])
    .range([0, 100])

  const inv_scale = d3.scaleLinear()
    .domain([0, 100])
    .range([0, 100])

  // ALT KEY INTERACTION: MOVE LABELS
  alt_key_pressed = false

  window.focus()
  d3.select(window).on('keydown', (event) => {
    if (event.keyCode === 18) {
      alt_key_pressed = true
      window.focus()
    }
  })
  d3.select(window).on('keyup', (event) => {
    if (event.keyCode === 18) {
      alt_key_pressed = false
      window.focus()
    }
  })

  const drawLegend = () => {
    // Dans le menu tags, les éléments affichés dans la légende sont :
    // les tagGroup pour lesquelles Legend est à true 
    // le selected du tags à true
    // dx permet de faire en décalage vers la gauche lorsque l'on change de groupTags
    let dx = 0
    const pas = 180


    d3.select('#g_legend').selectAll('*').remove()

    const legend = d3.select('#g_legend').style('transform', 'translate(' + (data.legend_position[0] + 25) + 'px,' + data.legend_position[1] + 'px)').append('g')

    const wrap = textwrap()
      .bounds({ height: 100, width: pas - 40 })
      .method('tspans')

    const all_tags = Object.values(data.nodeTags).concat(Object.values(data.fluxTags))
    all_tags.filter(tag_group => tag_group.show_legend).forEach(tag_group => {

      // Ajout du tagGroup.name  
      legend.append('text')
        .attr('transform', function () {
          return 'translate(' + dx + ', 0 )'
        })
        .attr('x', 0)
        .attr('y', 20)
        .text(tag_group.group_name)
        .attr('style', 'font-weight:bold')
        .call(wrap)

      const legendElements = legend.append('g')
        .selectAll('g')
        // je comprends pas trop avant on utilisait d3.entries il semble etre remplacé par Object.entries(), mais ca ne donne pas la même chose
        .data(Object.entries(tag_group.tags))
        .enter()
        .append('svg:g')
        // on filtre les tags avec selected à true (Visible)
        .filter(function (d) { return d[1].selected })
        .attr('transform', function (d, i) {
          return 'translate(' + dx + ',' + (i * 30 + 30) + ')'
        })

      // Ajout du shape  
      legendElements.append('rect')
        .attr('width', 20)
        .attr('height', 20)
        .attr('x', 0)
        .attr('y', 10)
        .attr('rx', 3)
        .attr('ry', 3)
        .style('fill', (d) => { return (d as [string, { color: string }])[1].color })
        .style('fill-opacity', 1)
      // Ajout du label
      legendElements.append('text')
        .attr('x', 35)
        .attr('y', 20)
        .text(function (d) { return d[1].name })
        .call(wrap)

      dx = dx + pas

    })
  }

  const add_labels = () => {
    d3.selectAll('#svg #g_label g').remove()
    const g_label = d3.select('#svg #g_label')
    Object.values(data.labels).map(d => {
      const gg_label = g_label.append('g').attr('x', d.x).attr('y', d.y)
        .attr('id', d.idLabel)
        .attr('class', 'gg_label')
        .attr('transform', 'translate(' + d.x + ',' + d.y + ')')

      gg_label.append('rect')
        .attr('width', d.label_width).attr('height', d.label_height)
        .attr('fill', d.color)
        .style('fill-opacity', d.transparent ? 0 : 1)
        .attr('stroke', d.color_border)
        .attr('stroke-opacity', (d.transparent_border && !multi_selected_label.current.includes(d)) ? 0 : 1)
        .attr('stroke-width', (multi_selected_label.current.includes(d))?3:1)
        .attr('rx', 5)



      gg_label.on('click', (event) => {
        if ((event.ctrlKey || event.metaKey )&& !mode_visualisation) {
          sankeyTooltip.style('opacity', 0)
          if ( button_ref && button_ref.current && accordion_ref && accordion_ref.current==null) {
            button_ref.current.click()
          }
          d3.select(d.idLabel+ ' rect').attr('stroke-width',(multi_selected_label.current.includes(d))?3:1)
          if (multi_selected_label.current.includes(d)) {
            multi_selected_label.current.splice(multi_selected_label.current.indexOf(d), 1)
          } else {
            multi_selected_label.current.push(d)
          }

          //set_multi_selected_label(multi_selected_label)
          set_data({ ...data })
          if ( accordion_ref && accordion_ref.current) {
            let index_LL=-1
            //Loop sur le tableau d'item via un for car les HTMLCollection ressemblent à des tableaux mais n'en sont pas (on peut pas faire de map,filter,join ...)
            for (let i = 0; i < accordion_ref.current.children.length; i++) {
              index_LL=(accordion_ref.current.children[i]==(accordion_ref.current.children as HTMLCollection).namedItem('LL'))?i:index_LL
            }
            if(index_LL!=-1){
              (accordion_ref.current.children[index_LL] as HTMLLabelElement).click()
            }
          }
          // set_nav_item_active('7')
          // set_show_nav(true)
        }
      })

      const label_text = gg_label.append('text')
        .attr('id', d.idLabel + '_text')
        .attr('x', d.x_label)
        .attr('y', d.y_label)
        .style('text-anchor', 'middle')
        .style('font-weight', () => (d.font_weight) ? 'bold' : 'normal')
        .style('font-style', () => (d.font_style) ? 'italic' : 'normal')
        .style('font-size', () => d.font_size + 'px')
        .style('text-transform', () => (d.font_uppercase) ? 'uppercase' : 'none')
        .style('text-align', 'center')
        .text(d.name)


      label_text.call(d3.drag<SVGTextElement, unknown>()
        .subject(Object).on('drag', function (event) {
          if (alt_key_pressed) {
            d.position_vert = ''
            d.position_horiz = ''
            // const old_x = +d3.select('#' + d.idLabel + '_text').attr('x'),
            //   old_y = +d3.select('#' + d.idLabel + '_text').attr('y'),
            //   new_x = old_x + event.dx,
            //   new_y = old_y + event.dy
            const new_x=event.x,
              new_y=event.y
            d3.select('#' + d.idLabel + '_text').attr('x', new_x)
            d3.select('#' + d.idLabel + '_text').attr('y', new_y)

            d.x_label = new_x
            d.y_label = new_y

            d3.select('#' + d.idLabel + '_text').selectAll('tspan').attr('x', new_x)
          }
        })
      )

      const wrap = textwrap()
        .bounds({ height: 100, width: d.label_width })
        .method('tspans')

      if(d.position_horiz!==''&&d.position_vert!==''){
        //Appel wrap seulement si le label n'a pas été drag 
        //pour éviter que cela cause quelques probleme de position de label drag
        d3.select('#' + d.idLabel + ' text').call(wrap)
      }

      d3.select('#' + d.idLabel + ' text').select('tspan')
        .attr('dy',()=>{
          if((d.position_vert=='bas') && d3.select('#' + d.idLabel + ' text').selectAll('tspan').nodes().length >0){
            const tmp=d3.select('#' + d.idLabel + ' text').selectAll('tspan').nodes().length -1
            return -tmp+'em'
          }else if((d.position_vert=='milieu') && d3.select('#' + d.idLabel + ' text').selectAll('tspan').nodes().length >0){
            const tmp=d3.select('#' + d.idLabel + ' text').selectAll('tspan').nodes().length -1
            return -tmp/2+'em'
          }
          return 0
        })

      d3.select('#' + d.idLabel + ' text').selectAll('tspan').attr('dx',2)
        .attr('x',()=>{
          let tmp=0

          switch(d.position_horiz){
          case 'gauche':
            tmp= 0
            break
          case 'centre':
            tmp=d.label_width/2
            break
          case 'droite':
            tmp=d.label_width
            break
          }
          return tmp
        })
        .attr('text-anchor',()=>{
          let tmp='gauche'

          switch(d.position_horiz){
          case 'gauche':
            tmp= 'start'
            break
          case 'centre':
            tmp='middle'
            break
          case 'droite':
            tmp='end'
            break
          }
          return tmp
        })


      gg_label.call(d3.drag<SVGGElement, unknown>()
        .subject(Object).on('drag', function (event) {
          if(multi_selected_label.current.length!=0 && multi_selected_label.current.includes(d)){
            multi_selected_label.current.map(l=>{
              const new_pos_x = l.x + event.dx
              const new_pos_y = l.y + event.dy
              l.x = new_pos_x
              l.y = new_pos_y
              d3.select('#' + l.idLabel).attr('transform', 'translate(' + l.x + ',' + l.y + ')');


              [data.width, data.height] = min_width_and_height()
              if (data.fit_screen) {
                const svgSankey = d3.select('#svg')
                svgSankey.attr('viewBox', [0, 0, data.width, data.height] as unknown as string)
              } else {
                d3.select('#svg').style('width', data.width + 'px')
              }
          
          
          
              d3.select('#svg').style('height', data.height + 'px')
              drawGrid()
            })
          }
          
          

        })
      )
    })
  }

  const drawGrid = () => {

    d3.select('#svg #grid').selectAll('.line').remove()
    if (data.grid_visible && !data.static_sankey && !mode_visualisation) {
      const numberLineH = data.height / data.grid_square_size
      for (let row = 0; row < numberLineH; row++) {
        d3.select('#svg #grid').append('line')
          .attr('class', 'line line-horiz')
          .style('stroke', '#d3d3d3')
          .style('stroke-dasharray', 4)
          .attr('x1', '0')
          .attr('x2', data.width)
          .attr('y1', row * data.grid_square_size)
          .attr('y2', row * data.grid_square_size)

      }

      const numberLineV = data.width / data.grid_square_size

      for (let column = 0; column < numberLineV; column++) {
        d3.select('#svg #grid').append('line')

          .attr('class', 'line line-vert')
          .style('stroke-dasharray', 4)
          .style('stroke', '#d3d3d3')
          .attr('x1', column * data.grid_square_size)
          .attr('x2', column * data.grid_square_size)
          .attr('y1', 0)
          .attr('y2', data.height)
      }
    }

  }

  const position = data.static_sankey ? 'relative' : 'absolute'
  //const node_font = data.display_style.node_font_family_selected
  const link_font = data.display_style.link_font_family_selected
  const test = document.getElementsByClassName('navbar')
  let margin_top = 0
  if (test && test.length > 0) {
    margin_top = test[0].getBoundingClientRect().height
  }

  const keyHandler = (e: KeyboardEvent) => {
    if (current) {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (e.key == 'ArrowUp') {
          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => {
            if (d != undefined) {
              return d.name
            }
          }).includes(f.name)).map(d => {
            if (d.position === 'relative') {
              return
            }
            if (e.shiftKey) {
              d.y = d.y - data.grid_square_size
            } else {
              const n_pos = Math.trunc(d.y / data.grid_square_size)
              d.y = (n_pos * data.grid_square_size == d.y) ? (n_pos - 1) * data.grid_square_size : n_pos * data.grid_square_size
            }


            let y_max = 0
            Object.values(data.nodes).map(d => {
              y_max = (d.y > y_max) ? d.y : y_max
            })

            //Diminue hauteur svg si le noeud est près du bord
            if (y_max < data.height - 100 && data.height - 100 >= window.innerHeight) {
              data.height -= 90
            }


          })
        } else if (e.key == 'ArrowDown') {
          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => {
            if (d != undefined) {
              return d.name
            }
          }).includes(f.name)).map(d => {
            if (d.position === 'relative') {
              return
            }
            if (e.shiftKey) {
              d.y = d.y + data.grid_square_size
            } else {
              const n_pos = Math.trunc(d.y / data.grid_square_size)
              d.y = (n_pos + 1) * data.grid_square_size
            }

            //Augumente hauteur svg si le noeud est près du bord
            if (d.y > data.height - 100) {
              data.height += 100
            }
          })
        } else if (e.key == 'ArrowLeft') {
          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => {
            if (d != undefined) {
              return d.name
            }
          }).includes(f.name)).map(d => {
            if (d.position === 'relative') {
              return
            }
            if (e.shiftKey) {
              d.x = d.x - data.grid_square_size
            } else {
              const n_pos = Math.trunc(d.x / data.grid_square_size)
              d.x = (n_pos * data.grid_square_size == d.x) ? (n_pos - 1) * data.grid_square_size : n_pos * data.grid_square_size
            }
            //Diminue largeur svg si le noeud est près du bord
            if (d.x < data.width - 100 && data.width - 100 >= window.innerWidth - 40) {
              data.width -= 50
            }

          })
        } else if (e.key == 'ArrowRight') {
          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => {
            if (d != undefined) {
              return d.name
            }
          }).includes(f.name)).map(d => {
            if (d.position === 'relative') {
              return
            }
            if (e.shiftKey) {
              d.x = d.x + data.grid_square_size
            } else {
              const n_pos = Math.trunc(d.x / data.grid_square_size)
              d.x = (n_pos + 1) * data.grid_square_size
            }

            //Augumente largeur svg si le noeud est près du bord
            if (d.x > data.width - 100) {
              data.width += 100
            }
          })
        }
        set_data({ ...data })
      } else if (e.key == 'Escape') {
        if ( button_ref && button_ref.current && accordion_ref ) {
          button_ref.current.click()
        }
        //set_show_nav(false)
      } else if (e.key == 's' && (e.ctrlKey||e.metaKey)) {
        e.preventDefault()
        if (current) {
          const new_ind = 'view_' + String(new Date().getTime())
          const copy = JSON.parse(JSON.stringify(data))
          copy.view = []
          data.view.push({
            id: new_ind,
            view_data: copy,
            nom: 'data_' + new_ind,
            details: ''
          })
          set_show_toast(true)
          setTimeout(function () {
            set_show_toast(false)
          }, 3000)
        }

      } else if (e.key == 'z' && (e.ctrlKey||e.metaKey)) {
        e.preventDefault()
        //va chercher les différences sauvegardées dans le localStorage
        // const differences = JSON.parse(localStorage.getItem('diff') as string)

        const differences_str = LZString.decompress(localStorage.getItem('diff') as string) as string
        const differences = (differences_str != '') ? JSON.parse(differences_str) : undefined

        //Si il y a des différences, prend la dernière effectuée
        if (differences !== undefined && differences.length != 0) {
          type difference_type = {
            kind: string,
            path: string[],
            item: {
              rhs: string,
              kind: string
            },
            rhs: string,
            index: string
          }
          const difference = differences.pop() as difference_type[]


          //On crée une copie de data que l'on utilise ensuite pour pouvoir le parcourir et modifié
          //La copie nous permet de reffecter une variable avec d'autre type d'objet
          //Nous ne pouvons pas prendre ddirectement data car c'est un composant régis par des paramètre obligatoire
          //element_to_delete change de type au fur et à mesure qu'il parcours les chemins des différences
          let dt = JSON.parse(JSON.stringify(data))

          //Parcours les dernières modifications à effectuer
          //D : Supprime un objet qui a été ajouté
          //N : Rajoute un objet qui a été supprimé avec les mêmes propriétés
          //A : Annule des moddification faites à des array
          //E : Annule des modifications faites à des propriétées de l'objet

          //path : Tableau contenant le chemin vers la propriété modifié/ajouté/supprimé 
          // Exemple : path=['P1','P2'] --> {P1:{P2:Propriété modifié}}

          difference.map(d => {
            let element_to_delete = dt
            if (d['kind'] == 'D') {
              let cpt = 0
              d.path.map(dd => {
                cpt++
                if (cpt == d['path'].length) {
                  delete element_to_delete[dd]
                } else {
                  element_to_delete = element_to_delete[dd]
                }
              })

            } else if (d['kind'] == 'N') {
              let cpt = 0
              d.path.map(dd => {
                cpt++
                if (cpt == d['path'].length) {
                  element_to_delete[dd] = d['rhs']
                } else {
                  element_to_delete = element_to_delete[dd]
                }
              })
            } else if (d['kind'] == 'A') {
              let cpt = 0
              d.path.map(dd => {
                cpt++
                if (cpt == d['path'].length) {
                  if (d['item']['kind'] == 'N') {
                    element_to_delete[dd].splice(d['index'], 0, d['item']['rhs'])
                  } else if (d['item']['kind'] == 'D') {
                    element_to_delete[dd].splice(d['index'], 1)
                  }
                } else {
                  element_to_delete = element_to_delete[dd]
                }
              })
            } else if (d['kind'] == 'E') {
              let cpt = 0
              if (d.path !== null && d.path !== undefined) {
                d.path.map(dd => {
                  cpt++

                  if (cpt == d['path'].length) {
                    element_to_delete[dd] = d['rhs']
                  } else {
                    element_to_delete = element_to_delete[dd]
                  }
                })
              } else {
                dt = d['rhs']
              }

            }
          })


          data = dt
          localStorage.setItem('diff', JSON.stringify(differences))
          try {
            //Permet d'éviter qu'une vue soit stocké en tant que données dans la naviguateur 
            if (current) {
              localStorage.setItem('data', LZString.compress(JSON.stringify(data)))
            }
          } catch (e) {
            localStorage.clear()
          }
          set_data({ ...data })



        } else {
          console.log('Aucune action en mémoire pour un retour en arrière')
        }

      }
    } else {
      //Si nous somme dans une vue les action du clavier sont différentes :
      //-Flêche du haut : Anime la vue vers la vue précédente
      //-Flêche du bas : Anime la vue vers la suivante
      //-P : Parcours les vues suvants tout en les animants
      if (['ArrowUp', 'ArrowDown', 'p'].includes(e.key)) {
        if (e.key == 'ArrowUp') {
          //Cherche la position de la vue sélectionné dans le tableau de vue
          const v1 = data.view.filter(d => d.id == view)[0].id
          let ind = -1
          data.view.map((v, i) => {
            ind = (v.id == v1) ? i : ind
          })
          //si la vue est trouvé alors on lance l'animation entre cette vue et la précédente
          if (ind > 0) {
            const copy = data.view[ind - 1].view_data as SankeyData
            const time_to_set_view = animate_view_changement(data, copy)
            setTimeout(function () {
              set_view(data.view[ind - 1].id)
            }, time_to_set_view)
          }

        } else if (e.key == 'ArrowDown') {
          //Cherche la position de la vue sélectionné dans le tableau de vue
          const v1 = data.view.filter(d => d.id == view)[0].id
          let ind = -1
          data.view.map((v, i) => {
            ind = (v.id == v1) ? i : ind
          })
          //si la vue est trouvé alors on lance l'animation entre cette vue et la suivante

          if (ind < Object.keys(data.view).length - 1) {
            const copy = data.view[ind + 1].view_data as SankeyData
            const time_to_set_view = animate_view_changement(data, copy)

            setTimeout(function () {
              set_view(data.view[ind + 1].id)
            }, time_to_set_view)
          }
        } else if (e.key == 'p') {
          //appelle une fonction qui anime la vue suivante puis s'appelle recursivement jusqu'a ce qu'il n'y ai plus de vue
          nextView(data, (data.view as { id: string, view_data: SankeyData, nom: string }[]), view)
        }

        set_data({ ...data })
      }
    }

  }
  // const get_diff = () => {
  //   const diff = require('deep-diff')
  //   const old_data_str = LZString.decompress(localStorage.getItem('data') as string) as string
  //   //Si data existe dans le localStorage 
  //   if (old_data_str != '') {
  //     //On le parse en JSON
  //     const old_data = JSON.parse(old_data_str)
  //     //on va chercher les anciennes différences
  //     // let old_diff = JSON.parse(localStorage.getItem('diff') as string)
  //     const old_diff_str = LZString.decompress(localStorage.getItem('diff') as string) as string
  //     let old_diff = (old_diff_str != '') ? JSON.parse(old_diff_str) : null
  //     const difference = diff(data, old_data)

  //     //Si il y des différences et que le tableau des anciennes différences existes alors on push dedans la nouvelles différence
  //     //sinon on créer un tableau ne contenant que la nouvelle différence
  //     if (difference !== undefined) {
  //       if (old_diff !== undefined && old_diff !== null) {
  //         old_diff.push(difference)
  //       } else {
  //         old_diff = [difference]
  //       }
  //     }

  //     const cmp = LZString.compress(JSON.stringify(old_diff))
  //     if (old_diff !== undefined) {
  //       localStorage.setItem('diff', cmp)
  //     }
  //   }

  // }

  //Fonction appelé lorsque les vue s'enchaien automatiquement (via le bouton play ou lorsqu'on appuye sur la touche 'p')
  const nextView = (data: SankeyData, views: { id: string, view_data: SankeyData, nom: string }[], new_view: string) => {
    const v1 = views.filter(d => d.id == new_view)[0].id
    let ind = -1
    views.map((v, i) => {
      ind = (v.id == v1) ? i : ind
    })
    if (ind < Object.keys(views).length - 1) {
      const copy = views[ind + 1].view_data as SankeyData
      const time_to_set_view = animate_view_changement(data, copy)

      setTimeout(function () {
        set_view(views[ind + 1].id)
        set_data({ ...data })
      }, time_to_set_view)
      setTimeout(function () {
        nextView(copy, views, views[ind + 1].id)
      }, time_to_set_view + 1000)
    }
  }

  useEffect(() => {
    [data.width, data.height] = min_width_and_height()
    removeAnimate()
    // let isDown = false
    // Permet d'affecter une class au svg selon le mode
    if (mode_selection=='s') {
      d3.select('#svg').attr('class','mode_selection')
    }
    if (mode_selection=='n') {
      d3.select('#svg').attr('class','mode_add_node')
    }
    if (mode_selection=='nl') {
      d3.select('#svg').attr('class','mode_add_node_flux')
    }
    if (mode_selection=='ln') {
      d3.select('#svg').attr('class','mode_add_flux')
    }

    const svgSankey = d3.select('#svg')
    if (data.fit_screen) {
      svgSankey.attr('viewBox', [0, 0, data.width , data.height] as unknown as string)
      svgSankey.style('width', '98.5%')
    } else {
      svgSankey.attr('viewBox', null)
      svgSankey.style('width', data.width + 'px')
    }
    svgSankey.style('height', data.height + 'px');
    (svgSankey as d3.Selection<Element, unknown, HTMLElement, unknown>)
      .call(d3.zoom()
        .filter(ev => { // Permet d'obliger Crtl pour activer le zoom
          return (ev.ctrlKey || ev.metaKey) && ev.buttons == 0
        })
        .wheelDelta(ev => { // Permet de regler la vitesse du zoom
          return -ev.deltaY * (ev.deltaMode === 1 ? 0.05 : ev.deltaMode ? 1 : 0.002)
        })
        .on('zoom', function (evt) {
          data.fit_screen = false
          evt.transform.x = 0
          evt.transform.y = 0
          d3.select('#svg')
            .attr('transform', evt.transform).attr('transform-origin', '0 0')
          svgSankey.attr('viewBox', null)
          if (evt.transform.k < 1 && !data.fit_screen) {
            d3.select('#svg')
              .style('border', Math.round(2 / evt.transform.k) + 'px solid #78c2ad')
              .style('width', data.width + 'px')
          } else {
            d3.select('#svg')
              .style('border', Math.max(1,Math.round(2 / evt.transform.k)) + 'px solid #78c2ad')        
          }
          
          // data.width=data.width / evt.transform.k
          // data.height=data.height/ evt.transform.k
          // drawGrid()
        })).on('dblclick.zoom', null)

    //Ajout des events sur les l'ajout des noeuds aux click 
    svgSankey.on('click', ev => {
      if ((!ev.ctrlKey && !ev.metaKey)&& mode_selection == 'n' && current) {
        const new_node1 = default_node(data)
        const listId: number[] = []
        Object.keys(data.nodes).forEach(elt => listId.push(Number(elt.replace('node', ''))))
        const idNode = listId.length > 0 ? Math.max(...listId) + 1 : 0
        new_node1.idNode = 'node' + idNode
        new_node1.name = new_node1.idNode
        if (Object.keys(data.nodes).length < 5) {
          new_node1.x = Object.keys(data.nodes).length * 200 + 200
        } else {
          new_node1.x = 200
        }
        data.nodes[new_node1.idNode] = new_node1
        for (const tag_group_key in data.nodeTags) {
          new_node1.tags[tag_group_key] = []
          if (tag_group_key === 'Dimensions' ) {
            for ( const tag in data.nodeTags.Dimensions.tags) {
              new_node1.dimensions[tag] = {level:1}
            }
          }
        }
        // console.log(d3.event.pageX - document.getElementById('svg').getBoundingClientRect().x + 10)
        const pos = d3.pointer(event)
        new_node1.x = pos[0]
        new_node1.y = pos[1]
        set_data({...data})
      } else { ev.preventDefault() }
    })
      .on('mousedown', evt => {
        //si le mode de souris est noeud+liens alors crée le premier noeuds 
        if ((!evt.ctrlKey && !evt.metaKey) && mode_selection == 'nl' && current) {
          // isDown = true

          // creation nouveau noeud
          const new_node1 = default_node(data)
          const listId: number[] = []
          Object.keys(data.nodes).forEach(elt => listId.push(Number(elt.replace('node', ''))))
          const idNode = listId.length > 0 ? Math.max(...listId) + 1 : 0
          new_node1.idNode = 'node' + idNode
          new_node1.name = 'node_tmp'

          data.nodes[new_node1.idNode] = new_node1
          for (const tag_group_key in data.nodeTags) {
            new_node1.tags[tag_group_key] = []
          }
          // console.log(d3.event.pageX - document.getElementById('svg').getBoundingClientRect().x + 10)
          const pos = d3.pointer(event)
          new_node1.x = pos[0]
          new_node1.y = pos[1]
          set_data({ ...data })
        }
      })
      .on('mousemove', evt => {
        //si le mode de souris est noeud+liens et que le bouton de la souris est toujours pressé
        // alors crée une droite entre le premier noeud clické et le pointeur du curseur
        if ((!evt.ctrlKey && !evt.metaKey) && mode_selection == 'nl' && Object.values(data.nodes).filter(d => d.name == 'node_tmp').length > 0) {
          const pos = d3.pointer(event)
          const node_keys = Object.keys(data.nodes)
          const last_node = data.nodes[node_keys[node_keys.length - 1]]
          if (d3.selectAll('#svg #path-flux').nodes().length == 0) {
            d3.select('#svg').append('line').attr('id', 'path-flux')
              .attr('x1', last_node.x + last_node.node_width / 2)
              .attr('y1', last_node.y + last_node.node_height / 2)
              .attr('x2', pos[0])
              .attr('y2', pos[1])
              .style('stroke', '#d9af58')
              .style('stroke-width', '2px')
          } else {
            d3.selectAll('#svg #path-flux')
              .attr('x2', pos[0])
              .attr('y2', pos[1])
          }

        }
      })
      .on('mouseup', evt => {
        //si le mode de souris est noeud+liens alors crée un second noeud au relachement 
        //et crée un lien entre le premier noeud crée lors du click et ce dernier 
        if ((!evt.ctrlKey && !evt.metaKey) && mode_selection == 'nl' && current && Object.values(data.nodes).filter(d => d.name == 'node_tmp').length > 0) {
          // isDown = false
          d3.selectAll('#svg #path-flux').remove()
          Object.values(data.nodes).filter(d => d.name == 'node_tmp').map(d => d.name = d.idNode)

          //Création second noeud
          const new_node1 = default_node(data)
          const listId: number[] = []
          Object.keys(data.nodes).forEach(elt => listId.push(Number(elt.replace('node', ''))))
          const idNode = listId.length > 0 ? Math.max(...listId) + 1 : 0
          new_node1.idNode = 'node' + idNode
          new_node1.name = new_node1.idNode
          if (Object.keys(data.nodes).length < 5) {
            new_node1.x = Object.keys(data.nodes).length * 200 + 200
          } else {
            new_node1.x = 200
          }
          data.nodes[new_node1.idNode] = new_node1
          for (const tag_group_key in data.nodeTags) {
            new_node1.tags[tag_group_key] = []
          }
          // console.log(d3.event.pageX - document.getElementById('svg').getBoundingClientRect().x + 10)
          const pos = d3.pointer(event)
          new_node1.x = pos[0]
          new_node1.y = pos[1]



          //Ajout du lien entre les deux noeuds créés
          const new_link = default_link(data)
          const listIdLink: number[] = []
          Object.keys(data.links).forEach(elt => listIdLink.push(Number(elt.replace('link', ''))))
          const idLink = listIdLink.length > 0 ? Math.max(...listIdLink) + 1 : 0
          new_link.idLink = 'link' + idLink
          data.links[new_link.idLink] = new_link
          const node_keys = Object.keys(data.nodes)
          new_link.idSource = data.nodes[node_keys[node_keys.length - 2]].idNode
          new_link.idTarget = data.nodes[node_keys[node_keys.length - 1]].idNode
          if (new_link.idSource === new_link.idTarget) {
            new_link.recycling = true
          }

          data.nodes[node_keys[node_keys.length - 2]].outputLinksId.push(new_link.idLink)
          data.nodes[node_keys[node_keys.length - 1]].inputLinksId.push(new_link.idLink)

          set_data({...data})

        }
      })

    drawGrid()

    //const div = document.getElementById('svg-container') as any
    //let old_pos = div.getBoundingClientRect()
    //const div_banner = document.getElementById('react-container') as any
    //const height_banner = div_banner.getBoundingClientRect().height


    //Event listener sur les touche du clavier
    //Réagis à :
    //-Flêches qui déplace les noeuds sélectionnés
    //-Echape qui ferme la navbar
    //-Ctrl+S qui sauvegarde une vue 
    document.onkeydown = keyHandler



    update_scale(data.user_scale)
    if (data.fit_screen) {
      d3.select('#svg').attr('transform', 'scale(1)')
    }

    d3.select('#svg').selectAll('.defsArrow').remove()
    d3.select('#svg').append('defs').attr('class', 'defsArrow')


    add_nodes(data.static_sankey, true)
    add_links(data.static_sankey, true)
    add_labels()

    drawLegend()
    // try {
    //   //Permet d'éviter qu'une vue soit stocké en tant que données dans la naviguateur 
    //   if (current) {
    //     get_diff()
    //     const cmp = LZString.compress(JSON.stringify(data))
    //     localStorage.setItem('data', cmp)
    //   }
    // } catch (e) {
    //   console.log(e)
    //   localStorage.clear()
    // }


  })
  let border = '0px'
  if (!data.static_sankey) {
    border = (current) ? '2px solid #78c2ad' : '2px solid red'
  }



  return (
    <>
      <div className="span12" style={{ 'color': 'black', 'marginLeft': '10px', 'display': 'inline' }} id={(current) ? 'visualization_div' : 'view_div'} >
        <div id="svg-container" style={{ 'position': position, 'marginTop': margin_top + 'px' }}>
          <svg id='svg' style={{ 'margin': '20px', 'height': data.height, 'width': data.fit_screen ? '98.5%' : data.width, 'border': border }} preserveAspectRatio="xMidYMin meet" onClick={(ev) => {
            if ((!ev.ctrlKey && !ev.metaKey) && !ev.shiftKey) {
              removeAnimate()
              multi_selected_nodes.current = []
              multi_selected_links.current = []
              multi_selected_label.current = []
              Object.values(data.nodes).filter(n=>n.node_visible).forEach(n=>d3.select('#' + n.idNode).attr('stroke-width',0))
              Object.values(data.labels).forEach(l=>d3.select('#' + l.idLabel + ' rect').attr('stroke-width',(l.transparent_border)?0:1))
              const visible_links = Object.values(data.links)
              visible_links.forEach(l=> {
                const sel = d3.selectAll('#gg_' + l.idLink+ ' rect')
                sel.attr('fill-opacity', '0')
              })
              if ( button_ref && button_ref.current && accordion_ref && accordion_ref.current!==null) {
                button_ref.current.click()
              }
            }
          }}>
            <g className='grid' id='grid'></g>
            <g className='g_label' id='g_label'></g>

            <g className='g_legend' id='g_legend'></g>
            <g className='g_links' id='g_links' style={{ 'position': position, 'marginTop': margin_top + 'px', 'fontFamily': link_font }} ></g>
            <g className='g_nodes' id='g_nodes' style={{ 'position': position, 'marginTop': margin_top + 'px', /*'fontFamily': node_font */ }} ></g>

          </svg>
        </div>
      </div>

      <AgregationModal
        show_agregation={show_agregation}
        data={data}
        set_data={set_data}
        parent_names={agregation_parent_names}
        dimension_names={agregation_dimension_names}
        set_show_agregation={set_show_agregation}
        is_agregation={is_agregation}
      />
    </>
  )
}

SankeyDraw.propTypes = SankeyDrawPropTypes
SankeyDraw.defaultProps = SankeyDrawDefaultProps

export default SankeyDraw
