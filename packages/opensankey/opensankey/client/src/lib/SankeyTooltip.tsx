
import { SankeyNode,SankeyLink,SankeyData } from './types'
import { toPrecision,cloneSelection } from './SankeyUtils'
import * as d3 from 'd3'

export const add_tooltips = (
  data : SankeyData,
  gg_elements: d3.Selection<SVGGElement, SankeyNode & SankeyLink, SVGGElement,  SankeyNode & SankeyLink>,
  suffix: string,
  elements: SankeyNode[] | SankeyLink[],
  g_elements_origin: SVGGElement | null
) => {
  gg_elements
    .on('mouseover',(event,d) => {
      const element_id = elements.indexOf(d)
      if (!d.tooltip_text) {
        show_node_or_link_tooltip(data,d,suffix,element_id,suffix === 'node' ? default_node_tooltip : default_link_tooltip)
      }
      d3.select('#tooltip_'+suffix+element_id)
        .attr('transform','translate(' + String(d3.pointer(event,g_elements_origin)[0]+20) + ',' + String(d3.pointer(event,g_elements_origin)[1]+20) + ')')
      cloneSelection(d3.select('#tooltip_'+suffix+element_id), 1)
    })
    .on('mouseout',(_,d)=>{
      if (d.tooltip_text) {
        const id = elements.indexOf(d)
        const tooltip_lines = d.tooltip_text.split('\\n')
        tooltip_lines.forEach( (_,r) => d3.select('#text_tooltip_'+suffix+id+'span'+r).remove() )
        delete d.tooltip_text
      }
      d3.selectAll('#front-0').remove()
    })

  // .on('mouseover',(_,d)=>{
  //   if ( !d.visible ) {
  //     return
  //   }
  //   show_node_or_link_tooltip(data,d,'node',d.id,default_node_tooltip)
  //   d3.select('#tooltip_node'+d.id)
  //     .attr('transform','translate(' + (d.x+50) + ',' + (d.y+20) + ')')
  //   cloneSelection(d3.select('#tooltip_node'+d.id), 1)
  // })
  // .on('mouseout',(_,node)=> {
  //   if ( node.tooltip_text !== undefined ) {
  //     const tooltip_lines = node.tooltip_text.split('\\n')
  //     tooltip_lines.forEach( (_,r) => d3.selectAll('#text_tooltip_'+'node'+node.id+'span'+r).remove() )
  //     delete node.tooltip_text
  //   }
  //   d3.selectAll('#front-0').remove()
  // })    
 
  d3.selectAll('.'+suffix+'_value')
    .on('mouseover',(e,d) =>{
      const node_or_link = d as SankeyNode & SankeyLink
      const link_id = elements.indexOf(node_or_link)
      if (!node_or_link.tooltip_text ) {
        show_node_or_link_tooltip(data,node_or_link,suffix,link_id,suffix === 'node' ? default_node_tooltip : default_link_tooltip)
      }
      d3.select('#tooltip_link'+link_id)
        .attr('transform','translate(' + String(d3.pointer(e,g_elements_origin)[0]+20) + ',' + String(d3.pointer(e,g_elements_origin)[1]+20) + ')')
      cloneSelection(d3.select('#tooltip_'+suffix+link_id), 1)
    })
    .on('mouseout',(_,d)=>{
      const node_or_link = d as SankeyNode & SankeyLink
      if (node_or_link.tooltip_text ) {
        const id = elements.indexOf(node_or_link)
        const tooltip_lines = node_or_link.tooltip_text.split('\\n')
        tooltip_lines.forEach( (e,r) => d3.select('#text_tooltip_'+'link'+id+'span'+r).remove() )
        delete node_or_link.tooltip_text
      }
      d3.selectAll('#front-0').remove()
    })

  const tooltips = gg_elements.append('g')
    .attr('class','tooltip')
    .attr('id',(d,i) => {
      return 'tooltip_'+suffix + i 
    })
      
  tooltips.append('rect')
    .attr('class','rect_tooltip')
    .attr('id',(d,i)=>{
      return 'rect_tooltip_'+suffix+i
    })
    .attr('rx',5)
    .attr('height',(d)=>{
      if (d.tooltip_text===null || d.tooltip_text===undefined) { // null or undefined
        return 50
      }
      else {
        d.tooltip_text = d.tooltip_text.split('<br>').join('\\n')
        const count_br = (d.tooltip_text.match(/\\n/g) || []).length+1
        return Math.max(50,count_br*15)
      }
    })

  tooltips.append('text')
    .attr('class','text_tooltip')
    .attr('id',(d,i) => {
      return 'text_tooltip_'+suffix + i
    })
}

export const show_tooltip = (shift: string) => {
  d3.select('#main_tooltip'+shift)
    .attr('transform','translate(' + shift + ',' + 10 + ')')
  cloneSelection(
    d3.select('#main_tooltip'+shift), 1
  )
  //tooltip.attr('visibility', 'visible').attr('top',50).attr('left',50)
  //   .on('mouseover', () => {return tooltip.style('visibility', 'visible')})
}

export const hide_tooltip = () => {
  d3.selectAll('#front-0').remove()
}

export const show_node_or_link_tooltip = (
  data: SankeyData,
  d: SankeyNode | SankeyLink,
  suffix: string,
  id: number,
  default_tooltip_callback: (arg0: SankeyData,arg1 : SankeyLink | SankeyNode) => string
) => {
  let tooltip_text = d.tooltip_text
  if ( tooltip_text === undefined || tooltip_text === '') {
    tooltip_text = default_tooltip_callback(data,d)
    d.tooltip_text = tooltip_text
  }
  let max_text_length =  0
  const tooltip_lines : string[] = d.tooltip_text ? d.tooltip_text.split('\\n') : []
  let dy = '1em'
  tooltip_lines.forEach(
    (e:string, r: number) => {
      let tooltip_class = 'text_tooltip'
      if ( e.includes('<b>')) {
        e = e.substring(3)
        tooltip_class = 'text_tooltip_title'          
      }
      if (e === '') {
        dy = '2em'
        return
      }
      const el = d3.select('#text_tooltip_'+suffix + id)
        .append('tspan')
        .attr('id','text_tooltip_'+suffix+id+'span'+r)
        .attr('x',10)
        .attr('dy',dy)
        .attr('class',tooltip_class)
        .text(e)
      const el_node = el.node()
      const text_length = el_node ? el_node.getComputedTextLength() : 0
      if (text_length >= max_text_length){
        max_text_length = text_length
      }  
      dy = '1em'
    }
  )
  if ( tooltip_lines.length > 1 || tooltip_lines[0] !== '' ) {
    d3.select('#rect_tooltip_'+suffix+id)
      .attr('width',max_text_length+80)
      .attr('height',() => {
        const tooltip_text = d.tooltip_text ? d.tooltip_text.split('<br>').join('\\n') : ''
        const count_br = (tooltip_text.match(/\\n/g) || []).length
        return Math.max(50,count_br*15)
      })
  }
}

export const  default_link_tooltip = (
  data : SankeyData,
  d : SankeyLink | SankeyNode
) => {
  const l = d as SankeyLink
  const {tooltip_names,units_names} = data
  let t = '\\n<b>'+ l.source_name.split('\\n').join(' ') + ' VERS ' + l.target_name.split('\\n').join(' ') + '\\n\\n'

  let default_unit_name = ''
  if (units_names[0] ) {
    default_unit_name = units_names[0]
  }
  //- Données
  if (l.data) {
    if (l.agregated_data_value) {
      t += '<b>Donnée collectée \\n\\n'
      for (const idx in l.agregated_data_value) {
        if (typeof l.agregated_data_value[idx] === 'string') {
          const agregated_data_value_string = l.agregated_data_value[idx] as string
          t += ' ' + agregated_data_value_string.split(':')[0] + ': ' + toPrecision(Number(agregated_data_value_string.split(':')[1])) + ' ' + default_unit_name + '\\n'
        } else {
          t += ' ' + toPrecision(l.agregated_data_value[idx] as number) + ' ' + default_unit_name + '\\n'
          if ( l.conv  ) {
            if ( default_unit_name !== 'kt' || l.natural_unit !== 'tonne' ) { // REMOVE
              t += ' ' + toPrecision((l.agregated_data_value[idx] as number)*l.conv[1] ) + ' ' + l.natural_unit + '\\n'
            }
          }          
        }
      }

      // for (let i=2; i<units_names.length; i++){
      //   if (units_names[i] == l.natural_unit) {
      //     continue
      //   }
      //   if ( l.conv[i] !== null ) {
      //     t += ' ' + Math.round(l.data_value*l.conv[i]) + ' ' + units_names[i] + '\\n'
      //   }
      // }
      //}
    } else if (l.data_constraint) {
      t += '<b>Contraintes du modéle: % de '+l.source_name.split('\\n').join(' ')+' \\n\\n'
      for (const constraint in l.data_constraint) {
        t += ' ' + l.data_constraint[constraint] + '\\n'            
      }
    }

    if ( l.data_source ) {
      t += '\\n Source: '+ l.data_source + '\\n'
    }
    if ( l.data_period ) {
      t += ' Période: '+ l.data_period + '\\n'  
    }
    t += '\\n<b>Donnée réconciliée :\\n\\n'  
  }
  const unit_name = units_names.length != 0 ? default_unit_name : ''
  // Variables non libres
  if ( !String(l.display_value).includes('[') ) {
    if (!l.data) {
      t += '\\n<b>Donnée déterminée :\\n\\n'
    }
    let the_value = l.value
    if ('display_value' in d && l.display_value !== 'default') {
      the_value = Number(String(l.display_value).replace('*',''))
    } 
    t += ' ' + the_value + ' ' + default_unit_name
    if (l.mini && l.maxi && l.mini !== l.maxi) {
      t += ' ['+toPrecision(l.mini)+'  '+toPrecision(l.maxi)+']' + '\\n'
    } else {
      t += '\\n'
    }
    if ( l.conv  ) {
      if ( (default_unit_name !== 'kt' || l.natural_unit !== 'tonne') && l.natural_unit  ) {
        t += ' ' + toPrecision(the_value*l.conv[1]) + ' ' + l.natural_unit
        if (l.mini && l.maxi && l.mini !== l.maxi) {
          t += ' ['+toPrecision(l.mini*l.conv[1])+'  '+toPrecision(l.maxi*l.conv[1])+']' + '\\n'
        } else {
          t += '\\n'
        }
      }
      let unit_header = false
      for (let i=2; i<units_names.length; i++){
        if (units_names[i] == l.natural_unit) {
          continue
        }
        if ( l.conv[i] !== null ) {
          if (!unit_header) {
            t += '\\n<b>Autres Unités :\\n\\n'
            unit_header = true
          }
          t += ' ' + toPrecision(the_value*l.conv[i]) + ' ' + units_names[i]
          if (l.mini && l.maxi && l.mini !== l.maxi) {
            t += ' ['+toPrecision(l.mini*l.conv[i])+'  '+toPrecision(l.maxi*l.conv[i])+']' + '\\n'
          } else {
            t += '\\n'
          }
        }
      }
    }
  } else { 
    // Variables libres
    let tmp 
    if (l.display_value.includes('-')) {
      tmp = l.display_value.split('-')
    } else if (l.display_value.includes(',')) {
      tmp = l.display_value.split(',')                
    } else if (l.display_value.includes('...')) {
      tmp = l.display_value.split('...')           
    } else {
      tmp = l.display_value.split('  ')          
    }
    const mini = Number(tmp[0].substring(1))
    const maxi = Number(tmp[1].substring(0,tmp[1].length -1))
    if (mini !== maxi) {
      //t += '<b>!Variable libre, arbitraire dans l\'intervalle! \\n\\n'
      t += ' ['+toPrecision(mini)+'  '+toPrecision(maxi)+']' + ' ' + default_unit_name + '\\n'
      if ( l.conv  ) {
        if (l.natural_unit ) {
          t += ' ['+toPrecision(mini*l.conv[1])+'  '+toPrecision(maxi*l.conv[1])+']' + ' ' + l.natural_unit + '\\n'
        }
        let unit_header = false
        for (let i=2; i<units_names.length; i++){
          if (units_names[i] == l.natural_unit) {
            continue
          }
          if (!unit_header) {
            t += '\\n<b>Autres Unités :\\n\\n'
            unit_header = true
          }
          if ( l.conv[i] !== null ) {
            t += ' ['+toPrecision(mini*l.conv[i])+'  '+toPrecision(maxi*l.conv[i])+']' + ' ' + units_names[i] + '\\n'
          }
        }
      }          
    } else {
      t += ' '+ mini + ' ' + unit_name
      if ( l.conv  ) {
        t += ' '+toPrecision(mini*l.conv[1]) + ' ' + l.natural_unit + '\\n'
        for (let i=2; i<units_names.length; i++){
          if (units_names[i] == l.natural_unit) {
            continue
          }
          if ( l.conv[i] !== null ) {
            t += ' '+toPrecision(mini*l.conv[i]) + ' ' + units_names[i] + '\\n'
          }
        }
      } 
    }
  }

  if ( l.tooltips ) {
    let title = false
    tooltip_names.forEach((tooltip_name,i) =>{
      if (l.tooltips && l.tooltips[i]) {
        if (title === false) {
          t += '\\n\\n<b>Hypothèses\\n\\n'
          title = true
        }
        t += ' ' + tooltip_name +': ' + l.tooltips[i] + '\\n'
      }
    })
  }
  return t
}

export const default_node_tooltip = (
  data : SankeyData,
  d : SankeyNode | SankeyLink
) => {
  const n = d as SankeyNode
  const {links, units_names} = data
  let {region_name} = data
  const keys = Object.keys(links)
  if (!keys.includes(region_name)) {
    region_name = keys[0]
  }
  const reg_links = links[region_name]
  let t =  '<b>' + n.name.split('\\n').join(' ')
  let total=0
  if ( n.input_links.length > 0 ) {
    for (let i=0;i<n.input_links.length;i++) {
      const link = reg_links[n.input_links[i]]
      if ( link === undefined ) {
        //alert('Corruption du diagramme')
        return ''
      }
      if (link.visible || link.visible === undefined) {
        total += +link.value
      }
    }
  }
  if ( n.input_links.length > 0 ) {
    if (units_names.length != 0 ) {
      t += '\\n\\n<b>ENTREES en ' + units_names[0] + '\\n\\n '
    } else {
      t += '\\n\\n<b>ENTREES\\n\\n '        
    }
    for (let i=0;i<n.input_links.length;i++) {
      const link = reg_links[n.input_links[i]]
      if ( link === undefined ) {
        //alert('Corruption du diagramme')
        return ''
      }        
      if (link.visible || link.visible === undefined) {
        const source_name = link.source_name.split('\\n').join(' ')
        t += ' ' + source_name + ': ' +  toPrecision( link.value)
        if (n.input_links.length>1) {
          const percent = Math.round(link.value*100/total)
          t += ' ('+ percent + '%)\\n'
        } else {
          t += '\\n'          
        }
      }
    }
    t += ' Total: ' + toPrecision(total)
  }
  total=0
  if ( n.output_links.length > 0 ) {
    for (let i=0;i<n.output_links.length;i++) {
      const link = reg_links[n.output_links[i]]
      if (link === undefined ) {
        //alert('Corruption du diagramme')
        return ''
      }
      if (link.visible || link.visible === undefined) {
        total += +link.value
      }
    }
    if ( n.output_links.length > 0 ) {
      if (units_names.length != 0 ) {
        t += '\\n\\n<b>SORTIES en ' + units_names[0] + '\\n\\n '
      } else {
        t += '\\n\\n<b>SORTIES\\n\\n '        
      }
      for (let i=0;i<n.output_links.length;i++) {
        const link = reg_links[n.output_links[i]]
        if (link === undefined ) {
          //alert('Corruption du diagramme')
          return ''
        }
        if (link.visible || link.visible === undefined) {
          const target_name = link.target_name.split('\\n').join(' ')
          t += ' ' + target_name + ': ' +  toPrecision(link.value)
          if (n.output_links.length>1) {
            const percent = Math.round(link.value*100/total)
            t += ' ('+ percent + '%)\\n'
          } else {
            t += '\\n'          
          }
        }
      }
    }
    t += ' Total: ' + toPrecision(total)
  }
  return t
}

export const set_animation_tooltips = (animation_tooltips : any) => {
  Object.keys(animation_tooltips).forEach( 
    pos => {
      const svg = d3.select('#svg')
      const tooltip = svg.append('g')
        .attr('class','tooltip')
        .attr('id','main_tooltip'+pos)

      tooltip.append('rect')
        .attr('class','rect_tooltip')
        .attr('id','rect_main_tooltip'+pos)
        .attr('rx',5)
        .attr('height',50)
        .attr('width',100)

      tooltip.append('text')
        .attr('class','text_tooltip')
        .attr('id','text_main_tooltip'+pos)

      // d3.select('#text_main_tooltip'+pos)
      //   .append('tspan')
      //   .attr('id','main_tooltip'+'span')
      //   .attr('x',10)
      //   .attr('dy',10)
      //   .attr('class','text_tooltip')
      //   .text(animation_tooltips[pos])
      let max_text_length = 0
      const tooltip_lines = animation_tooltips[pos].split('\\n')
      let dy = '1em'
      tooltip_lines.forEach((e: string ,r: number)=>{
        let tooltip_class = 'text_tooltip'
        if ( e.includes('<b>')) {
          e = e.substring(3)
          tooltip_class = 'text_tooltip_title'          
        }
        if (e === '') {
          dy = '2em'
          return
        }
        d3.select('#text_main_tooltip'+pos)
          .append('tspan')
          .attr('id','text_main_tooltip_span'+r)
          .attr('x',10)
          .attr('dy',dy)
          .attr('class',tooltip_class)
          .text(e)
        dy = '1em'
        const tooltip_el = d3.select('#text_main_tooltip_span'+r).node()
        if (tooltip_el ) {
          const text_length = (tooltip_el as SVGTSpanElement).getComputedTextLength()
          if (text_length >= max_text_length){
            max_text_length = text_length
            //d3.select('#rect_tooltip_'+suffix+i)
          }
        }
      })
      if ( tooltip_lines.length > 1 || tooltip_lines[0] !== '' ) {
        d3.select('#rect_main_tooltip'+pos)
          .attr('width',max_text_length+80)
          .attr('height',() => {
            const tooltip_text = animation_tooltips[pos].split('<br>').join('\\n')
            const count_br = (tooltip_text.match(/\\n/g) || []).length
            return Math.max(50,count_br*20)
          })
      }
    }
  )
}  