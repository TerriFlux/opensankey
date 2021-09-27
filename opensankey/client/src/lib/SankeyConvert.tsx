import { SankeyData, SankeyLink } from './types'
import { normalize_name } from './SankeyUtils'

interface OldSankeyLink {
  visible?: boolean
  label_visible?: boolean
  text_same_color?:boolean | string
}

export const convert_data = (
  data: SankeyData 
) : void => {
  const {display_style,nodes,links,node_width,units_names} = data
  const region_names = Object.keys(links)

  if (display_style.filter === undefined ) {
    display_style.filter = 0        
  }
  if (display_style.global_curvature === undefined ) {
    display_style.global_curvature = 0.99       
  }
  if (display_style.trade_close === undefined && data.version !== '0.1' ) {
    display_style.trade_close = true
  }
  if ( data.version === '0.1' ) {
    display_style.sector_uppercase = true
    display_style.sector_bold = true
    display_style.trade_close = false
    if (node_width===undefined) {
      data.node_width = 40
    }
    data.show_uncert = false
  }
  if ( data.version === '0.2' ) {
    display_style.sector_uppercase = true
    display_style.sector_bold = true
    if (node_width===undefined) {
      data.node_width = 40
    }
    data.show_uncert = false
  }
  if ( data.version === '0.3' ) {
    data.show_uncert = false
  }

  if (data.node_width===undefined) {
    data.node_width = 10
  }

  if (Array.isArray(data.links) ) {
    const the_links = data.links
    data.links = {
      'no_region': the_links
    }
  }

  let flux_max = 0
  region_names.forEach(
    cur_region_name => { 
      links[cur_region_name].forEach(
        (l) => 
        { 
          l.value = +l.value
          if ( flux_max < l.value) {
            flux_max = l.value
          }
          const source_node = nodes.filter(n=> normalize_name(n.name) === normalize_name(l.source_name))[0]
          const target_node = nodes.filter(n=> normalize_name(n.name) === normalize_name(l.target_name))[0]
          if (!source_node || !target_node) {
            return
          }
          if ( !('orientation' in l)) {
            (l as SankeyLink).orientation = 'hh'
            if ( source_node.orientation === 'horizontal' && target_node.orientation === 'vertical' ) {
              (l as SankeyLink).orientation = 'vh'
            } else if ( source_node.orientation === 'vertical' && target_node.orientation === 'horizontal' ) {
              (l as SankeyLink).orientation = 'hv'
            }
          }
          if (!('arrow' in l)) {
            (l as SankeyLink).arrow = true
          }
          if (!('curved' in l)) {
            (l as SankeyLink).curved = true
          }
          if (!('label_on_path' in l)) {
            (l as SankeyLink).label_on_path = true
          }
          if ( l.frozen) {
            l.label_position = 'frozen'
          }
          if ( 'frozen' in l ) {
            delete l.frozen
          }
          if ( 'link_reverse' in l ) {
            delete l.link_reverse
          }
          if ( 'tooltip_text' in l ) {
            delete l.tooltip_text
          }
          if ( 'display_unit' in l ) {
            l.natural_unit = l.display_unit
            delete l.display_unit
          }
          if (!('agregated_data_value' in l )) {
            l.agregated_data_value = l.data_value                
          }
          if (!('visible' in (l as OldSankeyLink) )) {
            l.visible = true                
          }
          if (!('label_visible' in (l as OldSankeyLink))) {
            l.label_visible = true                
          }
          if ( l.type === 'short_link_arrow') {
            l.curved = false
            l.arrow = true
          } else if ( l.type === 'bezier_link_arrow') {
            l.curved = true
            l.arrow = true              
          } else if ( l.type === 'bezier_link_classic') {
            l.curved = true
            l.arrow = false              
          }
          if ( 'type' in l) {
            delete l.type
          }
          if (data.version === '0.1' ) { 
            const unit_index = l.natural_unit ? units_names.indexOf(l.natural_unit) : -1
            if ( l.conv && unit_index !== -1 ) {
              const natural_conv = l.conv[unit_index]
              l.conv.splice(1, 0, natural_conv)
            }
            l.curved = true
            l.curvature = 1
            if ((l as OldSankeyLink).text_same_color === true ) {
              l.text_color = l.color
            } else {
              l.text_color = 'white'
            } 
            delete (l as OldSankeyLink).text_same_color
            if ( target_node.x < source_node.x ) {
              l.recycling = true
            }            
          } else if (!('curvature' in l) ) {
            (l as SankeyLink).curvature = 0.5
          } 
          if (data.version === '0.2' ) {    
            if ( target_node.x < source_node.x ) {
              l.recycling = true
            }              
          } 
          if ( data.version === '0.1' ||  data.version === '0.2') {
            if ( l.natural_unit ) {
              if (l.natural_unit.includes('tonne')) {
                l.natural_unit = l.natural_unit.replace('tonne','t')
                if (l.natural_unit === 'k t') {
                  l.natural_unit = 'kt'
                }
              }
            }
          }     
          if (!('text_color' in l) || (l as OldSankeyLink).text_same_color === false ) {
            l.text_color = 'black'
          } else if ((l as OldSankeyLink).text_same_color === true ) {
            l.text_color = l.color
          } else if ((l as OldSankeyLink).text_same_color === 'same_color') {
            l.text_color = l.color
          } 
        }
      )
    }
  )
  if ( 'sankey_type' in data ){
    delete data.sankey_type
  }
  // if ( 'max_vertical_offset' in data ){
  //   delete data.max_vertical_offset
  // }
  if (display_style.filter_label === undefined ) {
    display_style.filter_label = flux_max/10      
  }
  if ( data.version === '0.1' ) {
    units_names.splice(1, 0, 'natural')
  }
  data.version = '0.4'
}