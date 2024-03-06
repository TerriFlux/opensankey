/* eslint @typescript-eslint/no-var-requires: "off" */
import * as d3 from 'd3'
import { textwrap } from 'd3-textwrap'
import { SankeyNode, SankeyLink,  TagsCatalog, SankeyData,  SankeyLinkValue,SankeyDrawCurve, display_styleType, dict_variable_application_dataType, dict_variable_elements_selectedType, ComponentUpdaterType } from '../types/Types'
import { ComputeTotalOffsets,
  TestLinkValue,
  LinkColor,
  LinkVisible,
  GetVerticalMarginForSankeyZone,
  NodeDisplayed,
  ReturnValueNode,
  ReturnValueLink,
  AssignLinkLocalAttribute,
  ToPrecision} from '../configmenus/SankeyUtils'
import {DragLinkCenterHandleEvent,DragLinkShiftHandleEvent,AddDragLinkZone} from './SankeyDragLinks'
import { menu_config_width } from '../topmenus/SankeyMenuTop'
import * as SankeyShapes from './SankeyDrawShapes'
import { 
  DeselectVisualyLinksFType,
  DrawGridFType,
  LinkStrokeFType, 
  LinkStrokeWidthFType, 
  NodeLabeLTextFType, 
  NodeLabelValuePosXFType, 
  NodeLabelValuePosYFType, 
  NodeStrokeWidthFType, 
  PathNodeArrowShapeFType, 
  RepositionneSidebarFuncType, 
  SelectVisualyLinksFType, 
  SelectVisualyNodesFType, 
  SetNodesHeightFType, 
  SortOutputLinksIdByYPosFType, 
  StrokeDasharrayFType, 
  TextLinkPosDYFType, 
  TextLinkSideFType, 
  TextNodeValueFType, 
  TextNodeWrapFType, 
  ValueSelectedParameterFuncType, clipFType, nodeTransformFType, update_scaleFType
} from './types/SankeyDrawFunctionTypes'
import { 
  DeselectVisualyNodesFuncType,
  LinkVisibleOnsSvgFuncType, NodeVisibleOnsSvgFuncType, RemoveAnimateFuncType,
  SetNodeHeightFuncType,
  DrawArrowsType 
} from './types/SankeyDrawFunctionTypes'
import {
  GetLinkValueFuncType, GetSankeyMinWidthAndHeightFuncType, LinkTextFuncType
} from '../configmenus/types/SankeyUtilsTypes'
import { ComputeEndPoints } from './SankeyDrawShapes'
// Function that create the dashed pattern on links

const default_handle_size = 10
const default_horiz_shift = 50
const min_thickness = 2

declare const window: Window &
   typeof globalThis & {
    SankeyToolsStatic: boolean
  }

export const StrokeDasharray : StrokeDasharrayFType =(
  d:SankeyLink,
  data:SankeyData,
  GetLinkValue:GetLinkValueFuncType
)=>{
  const special_data_cast=data as unknown as {free_null_link_visible:boolean}

  if (data.show_structure === 'structure') {
    return '10, 2'
  }
  const link_values = GetLinkValue(data, d.idLink)
  if (link_values === undefined) {
    return ''
  }
  if (data.show_structure === 'data' ) {
    if (!(link_values as SankeyLinkValue & {extension: {data_value : string}} ).extension.data_value) {
      return '10, 2'
    }
  }

  const display_value = link_values.display_value
  if (display_value.includes('*') ) {
    return '40, 5'
  }
  const is_free = link_values.extension?.free_mini !== undefined &&
                 data.show_structure !== 'free_value' &&
                 data.show_structure !== 'free_interval'  &&
                 !special_data_cast.free_null_link_visible
  if (ReturnValueLink(data,d,'dashed') || link_values.value as unknown as string === '' || is_free || link_values.extension?.display_thin) {
    return '10, 2'
  } else {
    return ''
  }
}

// Function that return the Y position of link label
export const TextLinkPosDY : TextLinkPosDYFType  =(
  l:SankeyLink,
  data:SankeyData,
  scale:(t:number)=>number,
  GetLinkValue:GetLinkValueFuncType
)=>{
  const orth_pos=ReturnValueLink(data,l,'orthogonal_label_position')
  if (orth_pos === 'middle') {
    return '0.3em'
  } else if (orth_pos === 'below') {
    const tmp=GetLinkValue(data, l.idLink).value as number

    return scale((tmp)?tmp:0) / 2 + 10 + 'px'
  } else if (orth_pos === 'above') {
    const tmp=GetLinkValue(data, l.idLink).value as number

    return -scale((tmp)?tmp:0) / 2 + 'px'
  }
  return '0.3em'
}
// Function that return the side of link label
export const TextLinkSide : TextLinkSideFType = (
  link:SankeyLink,data:SankeyData
)=>{
  const recy=ReturnValueLink(data,link,'recycling')
  const lab_pos=ReturnValueLink(data,link,'label_position')
  const ori=ReturnValueLink(data,link,'orientation')

  if (recy) {
    if (data.nodes[link.idSource].x < data.nodes[link.idTarget].x) {
      return 'left'
    } else if (lab_pos === 'middle' && ori === 'hh') {
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
}

// Function that return the link color
// the color depend of if a tag is selected (nodeTAgs,linkTags or dataTags)
export const LinkStroke : LinkStrokeFType = (
  l:SankeyLink,data:SankeyData,
  GetLinkValue:GetLinkValueFuncType
)=>{
  return LinkColor(l,data,GetLinkValue) as string
}
// Function to place the node on the draw zone
export const nodeTransform : nodeTransformFType = (
  d:SankeyNode,
  display_nodes:{[node_id:string]:SankeyNode},
  display_links:{[ink_id:string]:SankeyLink}
)=>{
  if (d.position === 'relative') {
    if (d.inputLinksId.length > 0) {
      if ( !display_links[d.inputLinksId[0]]) {
        return 'translate(0,0)'
      }
      const source_node = display_nodes[display_links[d.inputLinksId[0]].idSource]
      if ( !source_node) {
        return 'translate(0,0)'
      }
      const x = source_node.x + d.x
      const y = source_node.y + d.y
      return 'translate(' + x + ', ' + y + ')'
    } else if (d.outputLinksId.length > 0) {
      if ( !display_links[d.outputLinksId[0]]) {
        return 'translate(0,0)'
      }
      const target_node = display_nodes[display_links[d.outputLinksId[0]].idTarget]
      if ( !target_node) {
        return 'translate(0,0)'
      }
      const x = target_node.x + d.x
      const y = target_node.y + d.y
      return 'translate(' + x + ', ' + y + ')'
    }
    return 'translate(' + 10 + ', ' + 10 + ')'
  } else {
    return 'translate(' + d.x + ', ' + d.y + ')'
  }
}
// Function that wrap node text when the length of the label exceed the limit
export const TextNodeWrap : TextNodeWrapFType = (
  d:SankeyNode,data:SankeyData
)=>{
  const wrap = textwrap()
    .bounds({ height: 100, width: ((ReturnValueNode(data,d,'label_box_width') as number) != 0) ? (ReturnValueNode(data,d,'label_box_width') as number) : 110 })
    .method('tspans')
  d3.select(' .opensankey #ggg_' + d.idNode + ' text')
    .call(wrap)
  if (!d.x_label || data.show_structure == 'structure') {
    d3.selectAll(' .opensankey #ggg_' + d.idNode + ' text tspan').attr('dx', 0).attr('x', () => {
      const width = +d3.select(' .opensankey #shape_' + d.idNode).attr('width')

      if (ReturnValueNode(data,d,'label_horiz')  == 'middle') {
        return width / 2
      } else if (ReturnValueNode(data,d,'label_horiz')  == 'right') {
        return ReturnValueNode(data,d,'label_vert')  == 'middle' ? width : 0
      } else {
        return 0
      }
    })
  }

  d3.selectAll(' .opensankey #ggg_' + d.idNode + ' text tspan').attr('dx', 0).attr('x', () => {
    const width = +d3.select(' .opensankey #shape_' + d.idNode).attr('width')
    if (d.x_label) {
      return d.x_label
    } else if (ReturnValueNode(data,d,'label_horiz')  == 'middle') {
      return width / 2
    } else if (ReturnValueNode(data,d,'label_horiz')  == 'right') {
      return width
    } else {
      return 0
    }
  })
  //Nombre de tspan dans la balise text
  const ts_span_void=(d3.selectAll(' .opensankey #ggg_' + d.idNode + ' text').html().indexOf('></tspan>')>0?1:0)
  const nb_tspan = d3.selectAll(' .opensankey #ggg_' + d.idNode + ' text tspan').nodes().length
  if (ReturnValueNode(data,d,'label_vert')  == 'middle') {
    d3.select(' .opensankey #ggg_' + d.idNode + ' .node_text').attr('transform',n=> {
      const size_text=(ReturnValueNode(data,(n as SankeyNode),'font_size') as number)
      const shift=(0.25 *(size_text))
      return'translate(0,' +(shift+(nb_tspan-1)*(-size_text/2)) + ')'})
  } else if (ReturnValueNode(data,d,'label_vert')  == 'bottom') {
    d3.select(' .opensankey #ggg_' + d.idNode + ' .node_text').attr('transform',n=> 'translate(0,'+((ReturnValueNode(data,(n as SankeyNode),'font_size') as number)*(1-ts_span_void))+')')
  } else if (ReturnValueNode(data,d,'label_vert')  == 'top') {
    d3.select(' .opensankey #ggg_' + d.idNode + ' .node_text').attr('transform',n=> 'translate(0,' + ((ReturnValueNode(data,(n as SankeyNode),'font_size') as number)*(-(nb_tspan - 1))) + ')')
  }

}

// Function that compute the height and width of the node
// if the sum of input/output links values is inferior to the min_height/min_width of the node then it return the min_width/height
// if the sum of input/output links values is supperior to the min_height/min_width of the node then it return the maximum between the outputs and inputs link values scaled to the graph
export const SetNodeHeight:SetNodeHeightFuncType = (
  n: SankeyNode,
  display_nodes: { [node_id: string]: SankeyNode },
  display_links: { [link_id: string]: SankeyLink },
  data:SankeyData,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  GetLinkValue:GetLinkValueFuncType

) => {
  const res = ComputeTotalOffsets(inv_scale,n, data, display_nodes, display_links, TestLinkValue,undefined,GetLinkValue)
  const [total_offset_height_left, total_offset_height_right, total_offset_width_top, total_offset_width_bottom] = res
  const n_w=ReturnValueNode(data,n,'node_width') as number
  const n_h=ReturnValueNode(data,n,'node_height') as number
  let node_size_s_height = Math.max(
    inv_scale(n_h), total_offset_height_left, total_offset_height_right
  )
  let node_size_s_width = Math.max(
    inv_scale(n_w), total_offset_width_top, total_offset_width_bottom
  )
  //Hauteur des noeuds
  if (res[0] === 0 && res[1] === 0 && res[2] === 0 && res[3] === 0 || data.show_structure == 'structure') {
    node_size_s_height = inv_scale(n_h)
    node_size_s_width = inv_scale(n_w)
  }
  d3.select(' .opensankey #shape_' + n.idNode).attr('width', scale(node_size_s_width))
  d3.select(' .opensankey #shape_' + n.idNode).attr('height', scale(node_size_s_height))
  const shape=ReturnValueNode(data, n, 'shape')
  if( shape=== 'ellipse'){
    d3.select(' .opensankey #shape_' + n.idNode)
      .attr('cx', () => scale(node_size_s_width) / 2)
      .attr('cy', () =>scale(node_size_s_height)/ 2)
      .attr('rx', () => scale(node_size_s_width) / 2)
      .attr('ry', () => scale(node_size_s_height)/ 2)
    
  }else if(shape==='arrow'){
    const k_angle = ReturnValueNode(data, n, 'node_arrow_angle_factor') as number
    const angle_direction = ReturnValueNode(data, n, 'node_arrow_angle_direction') as string
    const path = PathNodeArrowShape(n_w, n_h, k_angle, angle_direction)
    d3.select(' .opensankey #shape_' + n.idNode).attr('d',path)
  }
}


// Function that remove animation (shift+click on node)
export const RemoveAnimate:RemoveAnimateFuncType = () => {
  // Si il y a des .tmp (notamment issus des animations)
  if (d3.selectAll(' .opensankey .tmp').nodes().length > 0) {
    // On remove tous les éléments temporaires
    d3.selectAll(' .opensankey .tmp').remove()
    // Et on supprime tous les styles pour retrouver les valeurs par default qui sont dans attr
    d3.select(' .opensankey #svg').selectAll('.node_shape').style('fill', null)
    d3.select(' .opensankey #svg').selectAll('.link').style('stroke', null)
    d3.select(' .opensankey #svg').selectAll('.arrow').style('fill', null)
    d3.select(' .opensankey #svg').selectAll('.link_value').style('display', null)
    d3.select(' .opensankey #svg').selectAll('.node_text').style('fill', null)
  }
}
// Function used for the clipping of link arrow when there is multiple link incoming to a node
const Intersection = function (cp1: number[], cp2: number[], e: number[], s: number[]) {
  const dc = [cp1[0] - cp2[0], cp1[1] - cp2[1]],
    dp = [s[0] - e[0], s[1] - e[1]],
    n1 = cp1[0] * cp2[1] - cp1[1] * cp2[0],
    n2 = s[0] * e[1] - s[1] * e[0],
    n3 = 1.0 / (dc[0] * dp[1] - dc[1] * dp[0])
  return [(n1 * dp[0] - n2 * dc[0]) * n3, (n1 * dp[1] - n2 * dc[1]) * n3]
}

const Inside = function (p: number[], cp1: number[], cp2: number[]) {
  return (
    (cp2[0] - cp1[0]) * (p[1] - cp1[1]) > (cp2[1] - cp1[1]) * (p[0] - cp1[0])
  )
}
export const clip : clipFType = (
  subjectPolygon: number[][], clipPolygon: number[][]
) => {
  const outputList = JSON.parse(JSON.stringify(subjectPolygon))
  let outputList2 =[]
  let cp1 = JSON.parse(JSON.stringify(clipPolygon[clipPolygon.length - 1]))
  for (const j in clipPolygon) {
    const cp2 = JSON.parse(JSON.stringify(clipPolygon[j]))
    const inputList = JSON.parse(JSON.stringify(outputList))
    outputList2 = []
    let s = JSON.parse(JSON.stringify(inputList[inputList.length - 1])) //last on the input list
    for (const i in inputList) {
      const e2 = inputList[i]
      if (Inside(e2, cp1, cp2)) {
        if (!Inside(s, cp1, cp2)) {
          outputList2.push(Intersection(cp1, cp2, e2, s))
        }
        outputList2.push(e2)
      } else if (Inside(s, cp1, cp2)) {
        outputList2.push(Intersection(cp1, cp2, e2, s))
      }
      s = e2
    }
    cp1 = cp2
  }
  return outputList2
}

// Function that add marker at the end of links, those marker are arrow
export const DrawArrows : DrawArrowsType = (
  n: SankeyNode,
  data:SankeyData,
  display_nodes: { [node_id: string]: SankeyNode },
  display_links: { [link_id: string]: SankeyLink },
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  GetLinkValue:GetLinkValueFuncType,
  display_style: display_styleType
) => {
  let cum_v_left = 0
  let cum_h_top = 0
  let cum_v_right = 0
  let cum_h_bottom = 0
  let is_v = true
  const is_exportation_node=n.tags&& n.tags['Type de noeud'] && n.tags['Type de noeud'].includes('echange')
  const node_shape=ReturnValueNode(data,n,'shape')

  let node_angle_direction='right'
  let node_angle=0
  if(node_shape==='arrow'){
    node_angle=ReturnValueNode(data,n,'node_arrow_angle_factor') as number
    node_angle_direction=ReturnValueNode(data,n,'node_arrow_angle_direction') as string
  }
  const res = ComputeTotalOffsets(inv_scale,n, data, display_nodes, display_links, TestLinkValue,undefined,GetLinkValue)
  const [total_height_left, total_height_right, total_width_top, total_width_bottom] = res


  for (let i = 0; i < n.inputLinksId.length; i++) {
    const l = data.links[n.inputLinksId[i]]
    const ori=ReturnValueLink(data,l,'orientation')
    const recy=ReturnValueLink(data,l,'recycling')
    const l_arrow=ReturnValueLink(data,l,'arrow')
    let node_arrow_shift=0
    let arrow_length=ReturnValueLink(data,l,'arrow_size') as number

    const link_input_from_right=(data.nodes[l.idSource].x>n.x) && node_angle_direction==='left' && (ori === 'hh' || ori === 'vh')
    const link_input_from_left=(data.nodes[l.idSource].x<n.x) && node_angle_direction==='right' && (ori === 'hh' || ori === 'vh')
    const link_input_from_top=(data.nodes[l.idSource].y<n.y) && node_angle_direction==='bottom' && (ori === 'vv' || ori === 'hv')
    const link_input_from_from_bottom=(data.nodes[l.idSource].y<n.y) && node_angle_direction==='top' && (ori === 'vv' || ori === 'hv')

    const link_direction_same_as_node_arrow= link_input_from_right || link_input_from_left || link_input_from_top || link_input_from_from_bottom

    if (!LinkVisible(l, data,display_nodes,GetLinkValue)) {
      continue
    }
    if((!l_arrow) && !(node_shape!=='arrow')){
      continue
    }
    let link_value = TestLinkValue(data,data.nodes, l, GetLinkValue)
    if (link_value === undefined) {
      continue
    }
    link_value=(+link_value==0||(+link_value>=inv_scale(2)))?+link_value:inv_scale(2)
    const extension = GetLinkValue(data, n.inputLinksId[i]).extension
    if (extension) {
      const display_free_as_dashed = data.show_structure !== 'free_interval' && data.show_structure !== 'free_value'
      const special_data_cast=data as unknown as {free_null_link_visible:boolean}

      if (display_free_as_dashed) {
        // Generale settings: free link value are displayed dashed without text without witdh
        const link_value_is_free = extension?.free_mini !== undefined ??false
        if (link_value_is_free) {
          // Link value is free should be displayed dashed without text
          if (special_data_cast.free_null_link_visible) {
            //treated as not free
          } else {
            link_value = inv_scale(5)
          }
        }
      }
      if (extension.display_thin) {
        link_value = inv_scale(5)
      }
    }

    const source_node = data.nodes[l.idSource]
    if (ori === 'hh' || ori === 'vh') {
      is_v = true
    } else {
      is_v = false
    }

    

    if(node_shape==='arrow'){
      // If the incoming link go in the same direction as the node shaped as arrow then we 'imbricate' the link arrow in the node angle
      let node_face_size=total_height_left
      switch(node_angle_direction){
      case 'left':
        node_face_size=total_height_right
        break
      case 'top':
        node_face_size=total_width_bottom
        break
      case 'bottom':
        node_face_size=total_width_top
        break
      }

      if(link_direction_same_as_node_arrow){
        node_arrow_shift= scale(Math.tan(node_angle*Math.PI/180)*(node_face_size/2))
        // When the node target is in arrow shape, the link arrow length doesn't contribute to it shape
        arrow_length=0
      } 
    }


    if (!display_style.filter || link_value >= display_style.filter) {
      //selection
      d3.select('#gg_' + l.idLink + ' .arrow').remove() // supression dans le cas du drag notamment
      d3.select('#gg_' + l.idLink)
        .append('path')
        .attr('class', 'arrow')
        .attr('id', 'path_'+l.idLink + '_arrow')
        .attr('d', () => {
          let xt
          let yt
          let p5

          if (ori === 'hh' || ori === 'vh') {
            if (n.x <= source_node.x && recy || n.x > source_node.x && !recy) {
              xt = +n.x
              yt = +n.y + +d3.select('#shape_' + n.idNode).attr('height') / 2
              p5 = [xt, yt]
              is_v = true
              return SankeyShapes.draw_arrow(scale(total_height_left) / 2, p5, scale(+link_value), scale(cum_v_left), true, false,arrow_length,node_arrow_shift)
            } else {
              xt = +n.x + +d3.select('#shape_' + n.idNode).attr('width')
              yt = +n.y + +d3.select('#shape_' + n.idNode).attr('height') / 2
              p5 = [xt, yt]
              is_v = true
              return SankeyShapes.draw_arrow(scale(total_height_right) / 2, p5, scale(+link_value), scale(cum_v_right), true, true,arrow_length,node_arrow_shift)
            }
          } else if (ori === 'vv' || ori === 'hv') {
            if (n.y > source_node.y || is_exportation_node) {
              xt = +n.x + +d3.select('#shape_' + n.idNode).attr('width') / 2 +((is_exportation_node)?+source_node.x + +d3.select('#shape_' + source_node.idNode).attr('width'):0)
              yt = +n.y +((is_exportation_node)?+source_node.y+ +d3.select('#shape_' + source_node.idNode).attr('height'):0)
              p5 = [xt, yt]
              is_v = false
              return SankeyShapes.draw_arrow(scale(total_width_top) / 2, p5, scale(+link_value), scale(cum_h_top), false, false,arrow_length,node_arrow_shift)
            } else {
              xt = +n.x + +d3.select('#shape_' + n.idNode).attr('width') / 2
              yt = +n.y + +d3.select('#shape_' + n.idNode).attr('height')
              p5 = [xt, yt]
              is_v = false
              return SankeyShapes.draw_arrow(scale(total_width_bottom) / 2, p5, scale(+link_value), scale(cum_h_bottom), false, true,arrow_length,node_arrow_shift)
            }
          }
          return ''
        })
        .attr('fill', () => LinkColor(l, data,GetLinkValue))
        .attr('fill-opacity',  ReturnValueLink(data,l,'opacity'))
        .attr('stroke',LinkColor(l, data,GetLinkValue))
        .attr('stroke-width',0.1)
    }
    if ((is_v && !recy && n.x > source_node.x ) || (is_v && recy && n.x < source_node.x) ) {
      cum_v_left += link_value
    } else if ((is_v && !recy &&n.x < source_node.x) || (is_v && recy && n.x > source_node.x)) {
      cum_v_right += link_value
    } else if ((!is_v && !recy && n.y > source_node.y) || (!is_v && recy && n.y < source_node.y)) {
      cum_h_top += link_value
    } else if ((!is_v && !recy && n.y < source_node.y) || (!is_v && recy && n.y > source_node.y)) {
      cum_h_bottom += link_value
    }
  }
}



// Sort the outputLinksId tab of the node by using position of output node
export const SortOutputLinksIdByYPos : SortOutputLinksIdByYPosFType = (
  data:SankeyData,n:SankeyNode
)=>{
  return n.outputLinksId.filter(idL=>data.nodes[data.links[idL].idTarget].position!=='relative')
    .sort((a,b)=>data.nodes[data.links[a].idTarget].y - data.nodes[data.links[b].idTarget].y 
    )
}

export const scale = d3.scaleLinear()
  .domain([0, 100])
  .range([0, 100])

export const inv_scale = d3.scaleLinear()
  .domain([0, 100])
  .range([0, 100])



export const SetNodesHeight : SetNodesHeightFType = (
  data:SankeyData,
  display_nodes: { [node_id: string]: SankeyNode },
  display_links: { [link_id: string]: SankeyLink },
  d: SankeyLink,
  GetLinkValue:GetLinkValueFuncType

) => {
  let source_node = display_nodes[d.idSource]
  let target_node = display_nodes[d.idTarget]
  if (target_node === undefined) {
    target_node = display_nodes[d.idTarget]
  }
  if (source_node === undefined) {
    const filter_idSource = d.idSource
    source_node = display_nodes[filter_idSource]
  }

  const res_source = ComputeTotalOffsets(inv_scale,source_node, data, display_nodes, display_links, TestLinkValue,undefined,GetLinkValue)
  const [s_total_offset_height_left, s_total_offset_height_right, s_total_offset_width_top, s_total_offset_width_bottom] = res_source
  const res_target = ComputeTotalOffsets(inv_scale,target_node, data, display_nodes, display_links, TestLinkValue,undefined,GetLinkValue)
  const [t_total_offset_height_left, t_total_offset_height_right, t_total_offset_width_top, t_total_offset_width_bottom] = res_target

  let node_size_s_height = Math.max(
    inv_scale((ReturnValueNode(data,source_node,'node_height') as number)), s_total_offset_height_left, s_total_offset_height_right
  )
  let node_size_t_height = Math.max(
    inv_scale((ReturnValueNode(data,target_node,'node_height') as number)), t_total_offset_height_left, t_total_offset_height_right
  )
  let node_size_s_width = Math.max(
    inv_scale((ReturnValueNode(data,source_node,'node_width') as number)), s_total_offset_width_top, s_total_offset_width_bottom
  )
  let node_size_t_width = Math.max(
    inv_scale(ReturnValueNode(data,target_node,'node_width') as number), t_total_offset_width_top, t_total_offset_width_bottom
  )
  // Hauteur des noeuds
  if ((res_source[0] === 0 && res_source[1] === 0 && res_source[2] === 0 && res_source[3] === 0) || data.show_structure == 'structure') {
    node_size_s_height = inv_scale((ReturnValueNode(data,source_node,'node_height') as number))
    node_size_s_width = inv_scale((ReturnValueNode(data,source_node,'node_width') as number))
  }
  if ((res_target[0] === 0 && res_target[1] === 0 && res_target[2] === 0 && res_target[3] === 0) || data.show_structure == 'structure') {
    node_size_t_height = inv_scale((ReturnValueNode(data,target_node,'node_height') as number))
    node_size_t_width = inv_scale(ReturnValueNode(data,target_node,'node_width') as number)
  }

  d3.select(' .opensankey #shape_' + source_node.idNode).attr('width', scale(node_size_s_width))
  d3.select(' .opensankey #shape_' + source_node.idNode).attr('height', scale(node_size_s_height))


  // Is the node shape ellipse defined by the shape associated to it ?
  const source_shape=(ReturnValueNode(data,source_node,'shape'))
  const source_angle_direction=ReturnValueNode(data,source_node,'node_arrow_angle_direction') as string

  if ( source_shape==='ellipse' ) {
    d3.select(' .opensankey #shape_' + source_node.idNode).attr('rx', scale(node_size_s_width / 2))
    d3.select(' .opensankey #shape_' + source_node.idNode).attr('cx', scale(node_size_s_width / 2))
    d3.select(' .opensankey #shape_' + source_node.idNode).attr('ry', scale(node_size_s_height / 2))
    d3.select(' .opensankey #shape_' + source_node.idNode).attr('cy', scale(node_size_s_height / 2))
  }
  if(source_shape==='arrow'){
    const k_angle=ReturnValueNode(data,source_node,'node_arrow_angle_factor') as number
    const path_s=PathNodeArrowShape(node_size_s_width,node_size_s_height,k_angle,source_angle_direction)
    d3.select(' .opensankey #shape_' + source_node.idNode).attr('d', path_s)
  }

  d3.select(' .opensankey #shape_' + target_node.idNode).attr('width', scale(node_size_t_width))
  d3.select(' .opensankey #shape_' + target_node.idNode).attr('height', scale(node_size_t_height))

  // Is the node shape ellipse defined by the shape associated to it ?
  const target_shape=(ReturnValueNode(data,target_node,'shape'))
  const target_angle_direction=ReturnValueNode(data,target_node,'node_arrow_angle_direction') as string

  if (target_shape==='ellipse') {
    d3.select(' .opensankey #shape_' + target_node.idNode).attr('rx', scale(node_size_t_width / 2))
    d3.select(' .opensankey #shape_' + target_node.idNode).attr('cx', scale(node_size_t_width / 2))
    d3.select(' .opensankey #shape_' + target_node.idNode).attr('ry', scale(node_size_t_height / 2))
    d3.select(' .opensankey #shape_' + target_node.idNode).attr('cy', scale(node_size_t_height / 2))
  }
  
  if(target_shape==='arrow'){
    const k_angle=ReturnValueNode(data,target_node,'node_arrow_angle_factor') as number
    const path_t=PathNodeArrowShape(node_size_t_width,node_size_t_height,k_angle,target_angle_direction)
    d3.select(' .opensankey #shape_' + target_node.idNode).attr('d', path_t)
  }
}

export const PathNodeArrowShape : PathNodeArrowShapeFType = (
  node_width:number,
  node_height:number,
  k_angle:number,
  direction:string
  
)=>{
  let path=''
  if(direction==='right'){
    const opp=Math.tan((k_angle*Math.PI/180))*(node_height/2)
    const p0='0,0'
    const p1=scale(node_width-opp)+',0'
    const p2=scale(node_width)+','+scale(node_height/2)
    const p3=scale(node_width-opp)+','+scale(node_height)
    const p4='0,'+scale(node_height)
    const p5=scale(opp)+','+scale(node_height/2)
    path='M'+p0+'L'+p1+'L'+p2+'L'+p3+'L'+p4+'L'+p5+'z'

  }else if(direction==='left'){
    const opp=Math.tan((k_angle*Math.PI/180))*(node_height/2)

    const p0=scale(opp)+',0'
    const p1=scale(node_width)+',0'
    const p2=scale(node_width-opp)+','+scale(node_height/2)
    const p3=scale(node_width)+','+scale(node_height)
    const p4=scale(opp)+','+scale(node_height)
    const p5='0,'+scale(node_height/2)
    path='M'+p0+'L'+p1+'L'+p2+'L'+p3+'L'+p4+'L'+p5+'z'

  }else if(direction==='top'){
    const opp=Math.tan((k_angle*Math.PI/180))*(node_width/2)

    const p0='0,'+scale(opp)
    const p1=scale(node_width/2)+',0'
    const p2=scale(node_width)+','+scale(opp)
    const p3=scale(node_width)+','+scale(node_height)
    const p4=scale(node_width/2)+','+scale(node_height-opp)
    const p5='0,'+scale(node_height)
    path='M'+p0+'L'+p1+'L'+p2+'L'+p3+'L'+p4+'L'+p5+'z'

  }else if(direction==='bottom'){
    const opp=Math.tan((k_angle*Math.PI/180))*(node_width/2)
    const p0='0,0'
    const p1=scale(node_width/2)+','+scale(opp)
    const p2=scale(node_width)+',0'
    const p3=scale(node_width)+','+scale(node_height-opp)
    const p4=scale(node_width/2)+','+scale(node_height)
    const p5='0,'+scale(node_height-opp)
    path='M'+p0+'L'+p1+'L'+p2+'L'+p3+'L'+p4+'L'+p5+'z'
  }

  return path
}

// DrawLinkText
// Affichage de la valeur du flux dans le link en fonction des options
// Position latérale ; middle, beginning, end et frozen
const DrawLinkText = (
  data: SankeyData,
  link: SankeyLink,
  link_value: number,
  xs: number,
  ys: number,
  xt: number,
  yt: number,
  LinkText:LinkTextFuncType,
  GetLinkValue:GetLinkValueFuncType

) => {

  const lab_pos=ReturnValueLink(data,link,'label_position') as string
  const label_on_path=ReturnValueLink(data,link,'label_on_path')
  const label_text=LinkText(data, link,GetLinkValue )
  // middle : valeur par défault
  // est-ce necessaire car on force l'option middle à la création du flux
  if (!lab_pos) {
    AssignLinkLocalAttribute(link,'label_position','middle')
  }

  // If the label position is  either by the mouse when we drag it
  // or when it doesn't follow the link path
  // It is handled by link attribut that we have to process
  if (lab_pos === 'frozen' && link.x_label || !label_on_path || label_on_path === undefined) {

    const label_size=ReturnValueLink(data,link,'label_font_size') as number
    const orth_lab_pos=ReturnValueLink(data,link,'orthogonal_label_position')
    let x_pos = 0
    let y_pos = 0

    // Determinate the position in x and y of the label
    if (lab_pos === 'beginning') { 
      // pos x
      x_pos = xs 
      y_pos=ys
    } else if (lab_pos === 'middle' || lab_pos==='frozen') {
      const handles = HandlesPositions(data, link, xs, ys, xt, yt,GetLinkValue)
      if (handles.length >= 2) {
        // pos x
        const left_xpos = +handles[0].split(',')[0].substring(10)
        const right_xpos = +handles[1].split(',')[0].substring(10)
        x_pos = (left_xpos + right_xpos) / 2 - 5
    
        // pos y
        const left_y_pos_str = handles[0].split(',')[1]
        const left_y_pos = +left_y_pos_str.substring(0, left_y_pos_str.length - 1)
        const right_y_pos_str = handles[1].split(',')[1]
        const right_y_pos = +right_y_pos_str.substring(0, right_y_pos_str.length - 1)
        y_pos = (left_y_pos + right_y_pos) / 2
            
      } else {
        // pos x
        x_pos = +handles[0].split(',')[0].substring(10)
        // pos y 
        const y_pos_str = handles[0].split(',')[1]
        y_pos = +y_pos_str.substring(0, y_pos_str.length - 1)
      }
    } else if (lab_pos === 'end') {//end
      x_pos = xt -(label_size*label_text.length/2) -5
      y_pos = yt
    }
    
    
    // Shift sligthly the label so it's well aligned in the link
    if(orth_lab_pos=='above'){
      y_pos-=scale(link_value)/2
    }else if(orth_lab_pos=='below'){
      y_pos+=scale(link_value)/2
      y_pos+=label_size
    }else if(orth_lab_pos=='middle' || lab_pos==='frozen'){
      y_pos+=label_size/2
    }
    
    if(lab_pos==='middle' || lab_pos==='frozen'){
      x_pos-=(label_size*label_text.length)/4
    }

    // If the label is draggable & the var are undefined then we place the label at the middle (horizontally and vertically) of the link 
    if(lab_pos==='frozen' && ((link.x_label && link.x_label<=0)|| !link.x_label) ){
      link.x_label=x_pos
      link.y_label=y_pos
    }

    (d3.select(' .opensankey #text_' + link.idLink) as d3.Selection<SVGSVGElement, SankeyLink, HTMLElement, SankeyLink>)
      .attr('x', () => lab_pos === 'frozen' && link.x_label ? link.x_label : x_pos)
      .attr('y', () => lab_pos === 'frozen' && link.y_label ? link.y_label : y_pos)
      .text(()=> label_text)

  } else {
    // If the label follow the link path then it's not handles by absolute attr (x,y)
    // but by relative attr (startOffset)
    const positions: { [label_position: string]: string[] } = {
      'frozen': ['50%', 'start'],
      'beginning': ['10px', 'start'],
      'middle': ['50%', 'middle'],
      'end': ['100%', 'end']
    };

    (d3.select(' .opensankey #text_' + link.idLink) as d3.Selection<SVGSVGElement, SankeyLink, HTMLElement, SankeyLink>)
      .attr('startOffset', positions[lab_pos][0])
      .attr('text-anchor', positions[lab_pos][1])
      .text(() => label_text)
  }
}



// Draw the center handle of each selected links
const AddCenterHandle=(
  dict_variable_application_data:dict_variable_application_dataType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  link:SankeyLink,
  selected_tags: TagsCatalog,
  LinkText:LinkTextFuncType,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  GetLinkValue:GetLinkValueFuncType,
  ComponentUpdater:ComponentUpdaterType

)=>{
  const {data,display_nodes,display_links}=dict_variable_application_data
  const {multi_selected_links}=dict_variable_elements_selected
  const recy=ReturnValueLink(data,link,'recycling') as boolean
  const ori=ReturnValueLink(data,link,'orientation')

  d3.selectAll(' .opensankey #center_handle_' + link.idLink).remove()
  if (Object.values(display_links).map(d => d.idLink).includes(link.idLink)  && !recy ) {

    const source_node=data.nodes[link.idSource]
    const target_node=data.nodes[link.idTarget]
    if (isNaN(source_node.x)) {
      source_node.x = 100
    }
    if (isNaN(source_node.y)) {
      source_node.y = 100
    }
    if (isNaN(target_node.x)) {
      target_node.x = 100
    }
    if (isNaN(target_node.y)) {
      target_node.y = 100
    }
    const res = ComputeEndPoints(
      source_node, target_node, link, display_nodes, display_links, 
      data.nodeTags,
      data,scale,inv_scale,GetLinkValue
    )
    const [, ys, xt, ] = res
    let [xs, , , yt] = res
    if (data.show_structure == 'structure') {
      [xs, yt] = [source_node.x + (ReturnValueNode(data,source_node,'node_height') as number) / 2, target_node.y + (ReturnValueNode(data,target_node,'node_height') as number) / 2]
    }
    const pos_d=CenterHandlePosition(data,link,xs,ys,xt,yt,GetLinkValue)
    d3.select(' .opensankey #gg_link_handle_'+link.idLink)
      .append('circle')
      .attr('id', 'center_handle_' + link.idLink)
      .attr('class','center_handle')
      .attr('fill-opacity', (multi_selected_links.current.includes(link) && !(window.SankeyToolsStatic ? window.SankeyToolsStatic : false))?1:0)
      .attr('r','5')
      .attr('stroke','black')
      .attr('stroke-opacity',(multi_selected_links.current.includes(link))?1:0)
      .attr('fill','black')
      .attr('transform',pos_d[0])
      .attr('cursor',(multi_selected_links.current.includes(link) && (ori=='vv' ||ori=='hh'))?'ew-resize':'pointer')
      .call(
        DragLinkCenterHandleEvent(
          link,dict_variable_application_data,dict_variable_elements_selected,selected_tags,
          GetSankeyMinWidthAndHeight,default_horiz_shift,DrawGrid,scale,inv_scale,drawCurveFunction,LinkText,GetLinkValue,ComponentUpdater
        )
      )
  }

}

// Compute the position of the center handle of links
const CenterHandlePosition=(data:SankeyData,link:SankeyLink,
  xs: number,
  ys: number,
  xt: number,
  yt: number,
  GetLinkValue:GetLinkValueFuncType

)=>{
  const center_handle = 1/2
  
  const handle_pos = HandlesPositions(data, link, xs, ys, xt, yt,GetLinkValue)
  const ori=ReturnValueLink(data,link,'orientation')

  if((ori=='hh' || ori=='vv')){
    const [xs2,ys2]=handle_pos[0].replace('translate(','').replace(')','').split(',')
    const [xt2,yt2]=(handle_pos[1].replace('translate(','').replace(')','').split(','))
    const sx=Number(xs2)
    const sy=Number(ys2)
    const tx=Number(xt2)
    const ty=Number(yt2)
    if (ori === 'hh') {

      const shift_left = 'translate(' + (sx + (tx - sx) * center_handle) + ', ' + (sy + (ty - sy) * center_handle+default_handle_size/2) + ')'
      return [shift_left]
    } else if (ori === 'vv') {

      const shift_left = 'translate(' + (sx + (tx - sx) * center_handle+default_handle_size/2) + ', ' + (sy + (ty - sy) * center_handle) + ')'
      return [shift_left]

    }
  }else{
    const [xs2,ys2]=handle_pos[0].replace('translate(','').replace(')','').split(',')
    const sx=Number(xs2)
    const sy=Number(ys2)

    const center = 'translate(' + (sx ) + ', ' + (sy) + ')'
    return [center]

  }

  return ['']
}


// Draw the shift handle of each selected links
const AddShiftHandle = (
  dict_variable_application_data:dict_variable_application_dataType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  link: SankeyLink,
  display_style: display_styleType,
  selected_tags: TagsCatalog,
  shift_name: string,
  position: string,
  LinkText:LinkTextFuncType,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  GetLinkValue:GetLinkValueFuncType,
  ComponentUpdater:ComponentUpdaterType


) => {
  const {data}=dict_variable_application_data
  const {multi_selected_links}=dict_variable_elements_selected
  if (Object.values(data.links).map(d => d.idLink).includes(link.idLink)) {
    d3.select(' .opensankey #gg_link_handle_'+link.idLink)
      .append('rect')
      .attr('id', shift_name + link.idLink)
      .attr('class','handle')
      .attr('fill-opacity', (multi_selected_links.current.includes(link) && !(window.SankeyToolsStatic ? window.SankeyToolsStatic : false))?1:0)
      .attr('width', default_handle_size)
      .attr('height', default_handle_size)
      .attr('cursor',(multi_selected_links.current.includes(link)&& !(window.SankeyToolsStatic ? window.SankeyToolsStatic : false))?'ew-resize':'pointer')
      .call(DragLinkShiftHandleEvent(dict_variable_application_data,dict_variable_elements_selected,link,display_style,selected_tags,position,GetSankeyMinWidthAndHeight,default_horiz_shift,DrawGrid,scale,inv_scale,drawCurveFunction,LinkText,GetLinkValue,ComponentUpdater)
      )
  }

}

// Function that change the scale of the graph
export const update_scale : update_scaleFType  = (user_scale: number) => {
  scale.domain([0, user_scale])
  inv_scale.range([0, user_scale])
}

// Function that call AddShiftHandle for the shift handle of each side of the links
const add_shift_handles = (
  dict_variable_application_data:dict_variable_application_dataType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  link: SankeyLink,
  display_style: display_styleType,
  selected_tags: TagsCatalog,
  xs: number,
  ys: number,
  xt: number,
  yt: number,
  LinkText:LinkTextFuncType,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  GetLinkValue:GetLinkValueFuncType,
  ComponentUpdater:ComponentUpdaterType


) => {
  const {data}=dict_variable_application_data
  const recy=ReturnValueLink(data,link,'recycling') as boolean
  d3.select('.opensankey #g_link_handles').append('g').attr('class','gg_link_handles').attr('id','gg_link_handle_'+link.idLink)
  let shift_handles
  if (recy) {
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
    const selection = d3.select(' .opensankey #' + shift_handles[i][0] + link.idLink)
    if (selection.empty()) { // if the handle do not exist, create it
      AddShiftHandle(dict_variable_application_data,dict_variable_elements_selected,link, display_style, selected_tags, shift_handles[i][0], shift_handles[i][1],LinkText,GetSankeyMinWidthAndHeight,GetLinkValue,ComponentUpdater
      )
    }
  }
  for (let i = 0; i < shift_handles.length; i++) {
    // Draw handle at the correct position
    d3.select(' .opensankey #' + shift_handles[i][0] + link.idLink)
      .attr('transform', () => {
        const handle_pos = HandlesPositions(data, link, xs, ys, xt, yt,GetLinkValue)
        return handle_pos[i] // 0 => vertical handle
      })
  }


}

// DRAW LINK
const DrawCurve = (
  dict_variable_application_data:dict_variable_application_dataType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  display_style: display_styleType,
  nodeTags: TagsCatalog,
  link: SankeyLink,
  error_msg: { text?: string | undefined; } | undefined,
  LinkText:LinkTextFuncType,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  GetLinkValue:GetLinkValueFuncType,
  DrawArrows:DrawArrowsType,
  ComponentUpdater:ComponentUpdaterType

): string => {
  const {data,display_nodes,display_links}=dict_variable_application_data
  const special_data_cast=data as unknown as {free_null_link_visible:boolean}

  if (!LinkVisible(link, data, display_nodes,GetLinkValue)) {
    return ''
  }
  const link_value = TestLinkValue(data, display_nodes, link,GetLinkValue)
  const val=GetLinkValue(data,link.idLink)
  const recy=ReturnValueLink(data,link,'recycling') as boolean
  const curved=ReturnValueLink(data,link,'curved') as boolean
  const ori=ReturnValueLink(data,link,'orientation')
  const curvature=ReturnValueLink(data,link,'curvature') as number
  const l_h_s=ReturnValueLink(data,link,'left_horiz_shift') as number
  const r_h_s=ReturnValueLink(data,link,'right_horiz_shift') as number
  const v_s=ReturnValueLink(data,link,'vert_shift') as number
  const label_visible=ReturnValueLink(data,link,'label_visible')

  const source_node = display_nodes[link.idSource]
  const target_node = display_nodes[link.idTarget]
  if (isNaN(source_node.x)) {
    source_node.x = 100
  }
  if (isNaN(source_node.y)) {
    source_node.y = 100
  }
  if (isNaN(target_node.x)) {
    target_node.x = 100
  }
  if (isNaN(target_node.y)) {
    target_node.y = 100
  }

  const inputLinksId = target_node.inputLinksId
  const outputLinksId = source_node.outputLinksId
  if (outputLinksId === undefined || inputLinksId === undefined) {
    return ''
  }

  let [xs, ys, xt, yt] = ComputeEndPoints(source_node, target_node, link, display_nodes, display_links, nodeTags,data,scale,inv_scale,GetLinkValue)
  if(ori=='vv' ||ori=='hh'){
    add_shift_handles(dict_variable_application_data,dict_variable_elements_selected,link,display_style, nodeTags, xs, ys, xt, yt,LinkText,GetSankeyMinWidthAndHeight,GetLinkValue,ComponentUpdater)
    AddDragLinkZone(link,dict_variable_application_data,dict_variable_elements_selected,default_handle_size,default_horiz_shift,scale,inv_scale,min_thickness,drawCurveFunction,LinkText,GetLinkValue,DrawArrows,ComponentUpdater)
    AddCenterHandle(dict_variable_application_data,dict_variable_elements_selected,link,nodeTags,LinkText,GetSankeyMinWidthAndHeight,GetLinkValue,ComponentUpdater)
  }


  if (label_visible && (+link_value > display_style.filter_label || (special_data_cast.free_null_link_visible && val.extension?.free_mini)) ) {
    DrawLinkText(data, link, +link_value, xs, ys, xt, yt,LinkText,GetLinkValue)
  }

  if (ori === 'vh' && !recy) {
    if (data.show_structure == 'structure') {
      [xs, yt] = [source_node.x + (ReturnValueNode(data,source_node,'node_height') as number) / 2, target_node.y + (ReturnValueNode(data,target_node,'node_height') as number) / 2]
      if (source_node.x > target_node.x) {
        xt = xt + 30
      }
    }
    return SankeyShapes.bezier_link_classic_hv(
      link.idSource, link.idTarget,
      [xs, ys], [xt, yt],
      curvature !== undefined ? curvature : 0.5,
      curved,
      error_msg
    )
  }
  if (ori === 'hv' && !recy) {
    if (data.show_structure == 'structure') {
      [ys, xt] = [source_node.y + 5, target_node.x + 5]
      if (source_node.y > target_node.y) {
        yt = yt + 30
      }
    }
    return SankeyShapes.bezier_link_classic_vh(
      link.idSource, link.idTarget,
      [xs, ys], [xt, yt],
      curvature !== undefined ? curvature : 0.5,
      curved,
      error_msg
    )
  }
  if (ori === 'hh' && !recy) {
    if (data.show_structure == 'structure' ) {
      [ys, yt] = [source_node.y + (ReturnValueNode(data,source_node,'node_height') as number) / 2, target_node.y + (ReturnValueNode(data,target_node,'node_height') as number) / 2]
      if (source_node.x > target_node.x) {
        xt = xt + (ReturnValueNode(data,target_node,'node_width') as number)
      }
    }
    const left_horiz_shift = l_h_s ? l_h_s : 0
    const right_horiz_shift = r_h_s ? r_h_s : 0
    return SankeyShapes.bezier_link_classic_vv(
      link.idSource, link.idTarget,
      [xs, ys], [xt, yt],
      left_horiz_shift,
      right_horiz_shift,
      curvature !== undefined ? curvature : 0.5,
      false,
      curved,
      error_msg
    )
  }
  if (ori === 'vv' && !recy) {
    if (data.show_structure == 'structure' ) {
      [xs, xt] = [source_node.x + (ReturnValueNode(data,source_node,'node_width') as number) / 2, target_node.x + (ReturnValueNode(data,target_node,'node_width') as number / 2)]
      if (source_node.y > target_node.y) {
        yt = yt + 30
      }
    }
    const left_horiz_shift = l_h_s ? l_h_s : 0
    const right_horiz_shift = r_h_s ? r_h_s : 0
    return SankeyShapes.bezier_link_classic_vv(
      link.idSource, link.idTarget,
      [xs, ys], [xt, yt],
      left_horiz_shift, right_horiz_shift,
      curvature !== undefined ? curvature : 0.5,
      true,
      curved,
      error_msg
    )
  }
  if (recy) {
    const left_horiz_shift = l_h_s ? l_h_s : 0
    const right_horiz_shift = r_h_s ? r_h_s : 0
    const vert_shift = v_s ? v_s : 0
    if (data.show_structure == 'structure' ) {
      [ys, yt] = [source_node.y + 5, target_node.y + 5]
    }
    return SankeyShapes.bezier_link_classic_recycling(
      link.idSource, link.idTarget,
      +link_value,
      [xs, ys], [xt, yt],
      left_horiz_shift, right_horiz_shift, vert_shift,
      data.show_structure == 'structure' ? false : curved,
      ori === 'vv',
      error_msg, scale
    )
  }
  return ''
}

export const drawCurveFunction : SankeyDrawCurve = {curve:DrawCurve}

// Returns the x/y position of link_center / left/right/vert_shift
const HandlesPositions = (
  data:SankeyData,
  link: SankeyLink,
  xs: number,
  ys: number,
  xt: number,
  yt: number,
  GetLinkValue:GetLinkValueFuncType

) => {
  let tmp=GetLinkValue(data, link.idLink).value as number
  tmp=(tmp)?tmp:0
  const recy=ReturnValueLink(data,link,'recycling') as boolean
  const ori=ReturnValueLink(data,link,'orientation')
  const l_h_s=ReturnValueLink(data,link,'left_horiz_shift') as number
  const r_h_s=ReturnValueLink(data,link,'right_horiz_shift') as number
  const v_s=ReturnValueLink(data,link,'vert_shift') as number

  if (ori === 'hh' && recy) {
    // Recycling: 3 handles = left_horiz_shift, right_horiz_shif, vert_shift
    if (!l_h_s) {
      AssignLinkLocalAttribute(link,'left_horiz_shift',0)
    }
    if (!r_h_s) {
      AssignLinkLocalAttribute(link,'right_horiz_shift',0)
    }
    if (!v_s) {
      AssignLinkLocalAttribute(link,'vert_shift',0)

    }
    const thickness=LinkStrokeWidth(link,data,scale,inv_scale,min_thickness,data.nodes,GetLinkValue)
    if (xt < xs) {
      const x_left = xt - default_horiz_shift + l_h_s - (thickness) // x14
      const x_right = xs + default_horiz_shift + r_h_s  + (thickness) // x2
      const y_vert = Math.max(ys, yt) + scale(2 * tmp) + v_s // y8
      const vert = 'translate(' + (x_left + (x_right - x_left) / 2 - default_handle_size / 2) + ', ' + (y_vert - default_handle_size / 2) + ')'
      const left = 'translate(' + (x_left - (default_handle_size / 2) ) + ' ,' + (yt + (y_vert - yt) / 2 - default_handle_size / 2) + ')'
      const right = 'translate(' + (x_right + (default_handle_size / 2) ) + ' ,' + (ys + (y_vert - ys) / 2 - default_handle_size / 2) + ')'
      return [vert, left, right]
    } else {
      const x_right = xt + default_horiz_shift + r_h_s  + (thickness)// x14
      const x_left = xs - default_horiz_shift + l_h_s - (thickness) // x2
      const y_vert = Math.max(ys, yt) + scale(2 * tmp) + v_s // y8
      const vert = 'translate(' + (x_left + (x_right - x_left) / 2 - default_handle_size / 2) + ', ' + (y_vert - default_handle_size / 2) + ')'
      const left = 'translate(' + (x_left ) + ' ,' + (ys + (y_vert - ys) / 2 - default_handle_size / 2) + ')'
      const right = 'translate(' + (x_right ) + ' ,' + (yt + (y_vert - yt) / 2 - default_handle_size / 2) + ')'
      return [vert, left, right]
    }
  } else if (ori === 'vv' && recy) {
    // Recycling: 3 handles = left_horiz_shift, right_horiz_shif, vert_shift
    if (!l_h_s) {
      AssignLinkLocalAttribute(link,'left_horiz_shift',0)
    }
    if (!r_h_s) {
      AssignLinkLocalAttribute(link,'right_horiz_shift',0)
    }
    if (!v_s) {
      AssignLinkLocalAttribute(link,'vert_shift',0)
    }
    const y_left = yt - default_horiz_shift + l_h_s - scale(tmp) // x14
    const y_right = ys + default_horiz_shift + r_h_s + scale(tmp) // x2
    const x_vert = Math.max(xs, xt) + scale(2 * tmp) + v_s // y8
    const vert = 'translate(' + (x_vert - default_handle_size / 2) + ', ' + (y_left + (y_right - y_left) / 2 - default_handle_size / 2) + ')'
    const left = 'translate(' + (xt + (x_vert - xt) / 2 - default_handle_size / 2) + ' ,' + (y_left - default_handle_size / 2) + ')'
    const right = 'translate(' + (xs + (x_vert - xs) / 2 - default_handle_size / 2) + ' ,' + (y_right - default_handle_size / 2) + ')'
    return [vert, left, right]
  } else if (ori === 'hh') {
    if (l_h_s === undefined) {
      AssignLinkLocalAttribute(link,'left_horiz_shift',0)
    }
    if (!r_h_s) {
      AssignLinkLocalAttribute(link,'right_horiz_shift',1)
    }
    const shift_left = 'translate(' + (xs + (xt - xs) * l_h_s) + ', ' + (ys - default_handle_size / 2) + ')'
    const shift_right = 'translate(' + (xs + (xt - xs) * r_h_s) + ', ' + (yt - default_handle_size / 2) + ')'
    return [shift_left, shift_right]
  } else if (ori === 'vv') {
    if (l_h_s === undefined) {
      AssignLinkLocalAttribute(link,'left_horiz_shift',0)
    }
    if (!r_h_s) {
      AssignLinkLocalAttribute(link,'right_horiz_shift',1)
    }
    const shift_left = 'translate(' + (xs - default_handle_size / 2) + ', ' + (ys + (yt - ys) * l_h_s) + ')'
    const shift_right = 'translate(' + (xt - default_handle_size / 2) + ', ' + (ys + (yt - ys) * r_h_s) + ')'
    return [shift_left, shift_right]

  } else if (ori === 'vh') {
    const x_center_draw = xs
    const y_center_draw = yt
    return ['translate(' + x_center_draw + ', ' + y_center_draw + ')']
  } else if (ori === 'hv') {
    const x_center_draw = xt
    const y_center_draw = ys
    return ['translate(' + x_center_draw + ', ' + y_center_draw + ')']
  }
  return ['']
}

// Function that compute the size of the snakey zone,it has minimum height and width but can grow if the node or free labels are too close of the border
export const GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType = (data:SankeyData): number[] => {
  let height = 0
  let width = 0
  Object.values(data.nodes).filter(n => NodeDisplayed(data,n)).forEach(n => {
    // Get the width of the node's label then proceed to apply a value modification according to the label postion from the node
    let width_label=(d3.select('#ggg_'+n.idNode+ ' text').node() as SVGTextElement)?.getBoundingClientRect().width??0
    if((ReturnValueNode(data,n,'label_horiz') as string)=='left'){
      width_label/=2
    }else if((ReturnValueNode(data,n,'label_horiz') as string)=='middle'){
      width_label=0
    }
    let node_height = 0
    let node_width = 0
    if (!d3.select(' .opensankey #shape_' + n.idNode).empty()) {
      node_height = +d3.select(' .opensankey #shape_' + n.idNode).attr('height')
      node_width = +d3.select(' .opensankey #shape_' + n.idNode).attr('width')
    }

    height = (n.y ) ? Math.max(height, n.y + node_height) : height
    width = (n.x ) ? Math.max(width, n.x+node_width+width_label) : width
  })


  height = height + 100
  width = width + 100
  Object.values(data.links).forEach(l => {
    const recy=ReturnValueLink(data,l,'recycling') as boolean
    if (recy) {
      const v_s=ReturnValueLink(data,l,'vert_shift') as number
      const r_h_s=ReturnValueLink(data,l,'right_horiz_shift') as number
      height = (v_s && NodeDisplayed(data,data.nodes[l.idSource]) && NodeDisplayed(data,data.nodes[l.idTarget]) ) ? Math.max(data.nodes[l.idSource].y + v_s + 100, data.nodes[l.idTarget].y + v_s + 100, height) : height
      width = (data.nodes[l.idTarget].x && NodeDisplayed(data,data.nodes[l.idTarget]) && r_h_s) ? Math.max(width, data.nodes[l.idSource].x + r_h_s + default_horiz_shift + 150) : width
    }
  })
  const vertical_shift=  GetVerticalMarginForSankeyZone()
  const has_scroll_bar=window.innerHeight-document.getElementsByTagName('html')[0].clientHeight
  return [Math.max(width, window.innerWidth - 60 - has_scroll_bar), Math.max(height, window.innerHeight - 20 - (vertical_shift))]
}

// Function that draw the grid in the background of the sankey zone
// The grid help to align sankey elements and the step of nodes shift when we press arrow  on the keyboard
export const DrawGrid : DrawGridFType= (data:SankeyData) => {

  d3.select(' .opensankey #svg #grid').selectAll('.line').remove()
  if (data.grid_visible && !window.SankeyToolsStatic ) {
    const numberLineH = data.height / data.grid_square_size
    for (let row = 0; row < numberLineH; row++) {
      d3.select(' .opensankey #svg #grid').append('line')
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
      d3.select(' .opensankey #svg #grid').append('line')

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
export const NodeStrokeWidth : NodeStrokeWidthFType =(
  d:SankeyNode,multi_selected_nodes:{current:SankeyNode[]}
)=>{
  if (multi_selected_nodes.current.map(d => { if (d != undefined) { return d.idNode } else { return '' } }).includes((d as SankeyNode).idNode)) {
    return 2
  } else {
    return 0
  }
}

export const TextNodeValue : TextNodeValueFType =(
  d:SankeyNode,data:SankeyData,
  display_links:{[link_id:string]:SankeyLink},
  display_nodes:{[nodes_id:string]:SankeyNode},
  GetLinkValue:GetLinkValueFuncType
)=>{
  let total = 0
  const node_visible=NodeVisibleOnsSvg()
  if (ReturnValueNode(data,d,'show_value')) {
    let scientific_precision = 0
    let unit = ''
    if (d.outputLinksId.length > 0) {
      for (let i = 0; i < d.outputLinksId.length; i++) {
        const link = display_links[d.outputLinksId[i]]
        if (link === undefined) {
          return ''
        }
        if (scientific_precision === 0 && ReturnValueLink(data,link,'to_precision')) {
          scientific_precision = ReturnValueLink(data,link,'scientific_precision') as number
        }
        if (unit == '') {
          unit=ReturnValueLink(data,link,'label_unit_visible')?ReturnValueLink(data,link,'label_unit') as string:''
        }
        let tmp=GetLinkValue(data, link.idLink).value as number
        tmp=(tmp)?tmp:0
        if (node_visible.includes(link.idSource) && node_visible.includes(link.idTarget) ) {
          total += tmp
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
          if (scientific_precision === 0 && ReturnValueLink(data,link,'to_precision')) {
            scientific_precision = ReturnValueLink(data,link,'scientific_precision') as number
          }
          if (unit == '') {
            unit=ReturnValueLink(data,link,'label_unit_visible')?ReturnValueLink(data,link,'label_unit') as string:''
          }
          let tmp=GetLinkValue(data, link.idLink).value as number
          tmp=(tmp)?tmp:0
          if (node_visible.includes(link.idSource) && node_visible.includes(link.idTarget) ) {
            total += tmp
          }
        }
      }
    }
    if (scientific_precision !==0) {
      return ToPrecision(total,scientific_precision)+unit
    }
    return total+unit
  } else {
    return ''
  }
}

export const NodeLabelPosX : NodeLabelValuePosXFType =(
  data:SankeyData,n:SankeyNode
)=>{
  if (d3.select(' .opensankey #shape_' + n.idNode).empty()) {
    return 0
  }
  const width = +d3.select(' .opensankey #shape_' + n.idNode).attr('width')
  if (n.x_label) {
    return n.x_label
  } else if ((ReturnValueNode(data,n,'label_horiz') as string) == 'middle') {
    return width / 2
  } else if ((ReturnValueNode(data,n,'label_horiz') as string) == 'left') {
    return 0
  } else if ((ReturnValueNode(data,n,'label_horiz') as string) == 'right') {
    return (ReturnValueNode(data,n,'label_vert') as string) == 'middle' ? width : 0
  } else {
    return 0
  }
}
export const NodeLabelPosY : NodeLabelValuePosYFType = (
  data:SankeyData,n:SankeyNode
)=>{
  if (d3.select(' .opensankey #shape_' + n.idNode).empty()) {
    return 0
  }
  const height = +d3.select(' .opensankey #shape_' + n.idNode).attr('height')
  if (n.y_label && data.show_structure !== 'structure') {
    return n.y_label
  } else if ((ReturnValueNode(data,n,'label_vert') as string) == 'middle') {
    return height / 2
  } else if ((ReturnValueNode(data,n,'label_vert') as string) == 'top') {
    return -4
  } else if ((ReturnValueNode(data,n,'label_vert') as string) == 'bottom') {
    return height
  } else {
    return 0
  }
}
export const NodeLabelValuePosX : NodeLabelValuePosXFType = (
  data:SankeyData,n:SankeyNode
)=>{
  const width = +d3.select(' .opensankey #shape_' + n.idNode).attr('width')
  const val=(ReturnValueNode(data,n,'label_horiz_valeur') as string)
  if (val== 'middle') {
    return width / 2
  } else if (val == 'left') {
    return 0
  } else if (val == 'right') {
    return width 
  } else {
    return 0
  }
}

export const NodeLabelValuePosY : NodeLabelValuePosYFType = (
  data:SankeyData,n:SankeyNode
)=>{
  const height = +d3.select(' .opensankey #shape_' + n.idNode).attr('height')
  const _text = document.getElementById('text_'+n.idNode)
  const height_text = (_text) ? _text.getBoundingClientRect().height : 0
  const val=(ReturnValueNode(data,n,'label_vert_valeur') as string)
  const val_font_size=(ReturnValueNode(data,n,'font_size') as number)
  const is_same_pos=NodeValueAndTextSamePos(data,n)
  if (val == 'middle') {
    return height / 2 + ((is_same_pos)?val_font_size:0)
  } else if (val == 'top') {
    return 0+ ((is_same_pos)?-height_text*1.5:0)
  } else if (val == 'bottom') {
    return height+((is_same_pos)?height_text*1.8:val_font_size)
  } else {
    return 0
  }
}

const NodeValueAndTextSamePos = (
  data:SankeyData,node :SankeyNode
)=>{
  const val_visible=(ReturnValueNode(data,node,'label_visible') as number)
  const val_l_h_v=(ReturnValueNode(data,node,'label_horiz_valeur') as string)
  const val_l_h=(ReturnValueNode(data,node,'label_horiz') as string)
  const val_l_v_v=(ReturnValueNode(data,node,'label_vert_valeur') as string)
  const val_l_v=(ReturnValueNode(data,node,'label_vert') as string)

  return (val_visible && val_l_h_v==val_l_h && val_l_v_v==val_l_v)
}

export const NodeLabeLText : NodeLabeLTextFType = (
  data:SankeyData,
  d:SankeyNode
)=>{
  if (data.node_label_separator && data.node_label_separator!=='') {
    return d.name.split(data.node_label_separator)[0]
  }
  return d.name
}

export const ValueSelectedParameter:ValueSelectedParameterFuncType = (
  dict_variable_application_data,
  multi_selected_links,
  tags_selected
): SankeyLinkValue => {
  const {data}=dict_variable_application_data
  if(multi_selected_links.current.length==0){
    return ({} as SankeyLinkValue)
  }else{
    if ( Object.keys(data.links).length === 0 || !(multi_selected_links.current[0].idLink in data.links) ) {
      let val = JSON.parse(JSON.stringify(Object(multi_selected_links.current[0].value)))
      Object.values(tags_selected).map(tag_selected => {
        if (val[tag_selected] === undefined) {
          val[tag_selected] = {}
        }
        val = val[tag_selected]
      })
      return val
    }
    let val = JSON.parse(JSON.stringify(Object(data.links[multi_selected_links.current[0].idLink].value)))
    Object.values(tags_selected).map(tag_selected => {
      if (val[tag_selected] === undefined) {
        val[tag_selected] = {'display_value': '',tags:{},value:0}
      }
      val = val[tag_selected]
    })
    return val
  }

}

export const DeselectVisualyLinks : DeselectVisualyLinksFType = (
  d:SankeyLink
)=>{
  d3.selectAll(' .opensankey #gg_link_handle_'+d.idLink + ' rect.handle').attr('fill-opacity', '0')
  d3.selectAll(' .opensankey #gg_link_handle_'+d.idLink + ' rect.handle').attr('cursor', 'pointer')
  d3.selectAll(' .opensankey #gg_link_handle_'+d.idLink + ' .drag_zone').attr('cursor', 'pointer')
  d3.selectAll(' .opensankey #gg_link_handle_'+d.idLink + ' .drag_zone').attr('stroke-opacity', '0')
  d3.selectAll(' .opensankey #gg_link_handle_'+d.idLink + ' .center_handle').attr('stroke-opacity', '0')
  d3.selectAll(' .opensankey #gg_link_handle_'+d.idLink + ' .center_handle').attr('fill-opacity', '0')
  
}
export const SelectVisualyLinks : SelectVisualyLinksFType=(d:SankeyLink)=>{
  d3.selectAll(' .opensankey #gg_link_handle_'+d.idLink + ' rect.handle').attr('fill-opacity', '1')
  d3.selectAll(' .opensankey #gg_link_handle_'+d.idLink + ' .drag_zone').attr('stroke-opacity', '1')
  d3.selectAll(' .opensankey #gg_link_handle_'+d.idLink + ' .center_handle').attr('stroke-opacity', '1')
  d3.selectAll(' .opensankey #gg_link_handle_'+d.idLink + ' .center_handle').attr('fill-opacity', '1')
}

export const DeselectVisualyNodes:DeselectVisualyNodesFuncType=(n:SankeyNode)=>{
  d3.select(' .opensankey #shape_' + n.idNode).style('stroke-width',0)
  d3.select(' .opensankey #ggg_' + n.idNode+' .box_width_threshold').attr('visibility','hidden')
}
export const SelectVisualyNodes : SelectVisualyNodesFType=(
  n:SankeyNode
)=>{
  d3.select(' .opensankey #shape_' + n.idNode).style('stroke-width',2)
}

export const RepositionneSidebar:RepositionneSidebarFuncType =(show_nav:boolean)=>{
  d3.select('.sideBar').style('right',((show_nav?menu_config_width:0))+'px')  
}

// Function that compute the link width
export const LinkStrokeWidth : LinkStrokeWidthFType = (
  l:SankeyLink,
  data:SankeyData,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  min_thickness:number,
  display_nodes:{ [node_id: string]: SankeyNode},
  GetLinkValue:GetLinkValueFuncType,
)=>{
  const node = data.nodes[l.idSource]
  const nodes = data.nodes
  //Met les flux entre les noeuds qui sont 'invalides' en mode fin pour afficehr erreurs
  //position noeud source ou target
  const transform_svg=d3.select('.opensankey #svg')?.attr('transform')??''
  const scale_svg=(transform_svg)?+transform_svg.split('scale(')[1].replace(')',''):1
  let pos_x_src, pos_y_src
  if (node.idNode == nodes[l.idSource].idNode) {
    pos_x_src = nodes[l.idTarget].x
    pos_y_src = nodes[l.idTarget].y
  } else {
    pos_x_src = nodes[l.idSource].x
    pos_y_src = nodes[l.idSource].y
  }
  const link_values = GetLinkValue(data, l.idLink)
  const display_free_as_dashed = data.show_structure !== 'free_interval' && data.show_structure !== 'free_value'
  if (display_free_as_dashed) {
    // Generale settings: free link value are displayed dashed without text without witdh
    const link_value_is_free = link_values.extension && link_values.extension?.free_mini !== undefined
    if (link_value_is_free) {
      const special_data_cast=data as unknown as {free_null_link_visible:boolean}

      if (special_data_cast.free_null_link_visible && link_values.value === 0 ) {
        // zero value of free variables are displayed when free_visible is set to true
        return 5
      } else if (special_data_cast.free_null_link_visible && link_values.value !== 0 ) {
        // Not treated as free
      } else if (!special_data_cast.free_null_link_visible) {
        // Link value is free should be displayed dashed without text without witdh
        return 5
      }
    }
  }
  if (link_values.extension && link_values.extension?.display_thin) {
    // if flux is displayed thin
    return 5
  }
  let link_value = TestLinkValue(data, nodes, l,GetLinkValue)
  link_value=(+link_value==0||(+link_value>=inv_scale(2)))?+link_value:inv_scale(2)
  const width_n=(document.getElementById('shape_'+node.idNode)?.getBoundingClientRect().width??0)/scale_svg
  //Zones limite à ne pas êtres
  // La limite à ne pas être(fixé arbitrairement) ce situe à : largeur/hauteur du noeud + 1/4 de l'épaisseur du flux 
  const limit_x = [pos_x_src - scale(link_value / 4), pos_x_src + width_n + scale(link_value / 4)]
  const limit_y = [pos_y_src - scale(link_value / 4), pos_y_src + scale(link_value / 4)]
  let draw_warning = false
  //verifie que la position du noeud drag n'est pas au même niveau que ses noeuds traget
  //si partie gauche du noeud ne se situe pas dans les coord du noeud source
  const left_in_src = node.x > limit_x[0] && node.x < limit_x[1]
  //si partie droite du noeud ne se situe pas dans le noeud source
  const right_in_src = node.x + (ReturnValueNode(data,node,'node_width') as number) > limit_x[0] && node.x + (ReturnValueNode(data,node,'node_width') as number) < limit_x[1]
  //si partie haute du noeud ne se situe pas dans le noeud source
  const top_in_src = node.y > limit_y[0] && node.y < limit_y[1]
  if (ReturnValueLink(data,l,'orientation') == 'hh') {
    //orientation hh
    draw_warning = left_in_src || right_in_src
  } else if (ReturnValueLink(data,l,'orientation') == 'vv') {
    draw_warning = top_in_src
  } else if (ReturnValueLink(data,l,'orientation') == 'vh') {
    draw_warning = left_in_src || right_in_src || top_in_src
  } else {
    draw_warning = left_in_src || right_in_src || top_in_src
  }
  if (draw_warning && !ReturnValueLink(data,l,'recycling')) {
    return 1
  } else {
    const link_value = TestLinkValue(data, display_nodes, l,GetLinkValue)
    const tmp =(link_value=='')?1:link_value as number
    return scale(Math.max(inv_scale(min_thickness), tmp ? tmp : 0))
  }
}

export const NodeVisibleOnsSvg:NodeVisibleOnsSvgFuncType=()=>d3.selectAll('.node_shape').nodes().map(element => {
  return d3.select(element).attr('id').replace('shape_','')
})
export const LinkVisibleOnSvg:LinkVisibleOnsSvgFuncType=()=>d3.selectAll('.link').nodes().map(element => {
  return d3.select(element).attr('id').replace('path_','')
})

