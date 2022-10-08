import { SankeyNode, SankeyLink, SankeyData } from './types'
import { getLinkValue, toPrecision } from './SankeyUtils'

function write_children_table(
  desagregate_source_nodes : SankeyNode[], 
  desagregate_target_nodes : SankeyNode[], 
  data: SankeyData,
  t: string, 
  l: SankeyLink
) {
  let header_written = false
  desagregate_source_nodes.forEach(n1 => {
    desagregate_target_nodes.forEach(
      n2 => {
        const desagregated_link = Object.values(data.links).filter(l => l.idSource === n1.idNode && l.idTarget === n2.idNode)[0]
        if (desagregated_link === undefined || desagregated_link === l) {
          return
        }
        const desagregated_link_info = getLinkValue(data,desagregated_link.idLink)
        if (!header_written) {
          t += '<p>Flux désagrégés </p>'
          t += '<table class="table table-striped " >'
          t += '<thead><tr>'
          t += '<th>Flux désagrégés</th>'
          t += '<th>Valeur</th>'
          t += '</tr></thead>'
          t += '<tbody>'
          header_written = true
        }
        //const value_field = is_data ? 'data_value' : 'value'
        let value_to_display = desagregated_link_info['value']  
        if (desagregated_link_info.display_value && desagregated_link_info.display_value.includes('*')) {
          value_to_display = +String(getLinkValue(data,desagregated_link.idLink).display_value).replace('*','')
        }
        t += '<tr>'
        t += '<td>' + data.nodes[desagregated_link.idSource].name + '->' + data.nodes[desagregated_link.idTarget].name + '</td>'
        t += '<td>' + toPrecision(value_to_display) + '</td>'
        t += '</tr>'
      }
    )
  }
  )
  if (header_written) {
    t += '</tr></tbody></table>'
  }
  return t
}

export const  linkTooltipsContent = (
  data : SankeyData,
  d : SankeyLink | SankeyNode
) => {  
  const l = d as SankeyLink
  let t = '<p class="title" style="margin-bottom: 5px;">'+ data.nodes[l.idSource].name.split('\\n').join(' ') + ' → ' + data.nodes[l.idTarget].name.split('\\n').join(' ') + '</p>'

  if (l.tooltip_text) {
    //t += '<p><b>Définition'+ '</b></p>' 
    t += '<p>'+l.tooltip_text.split('\n').join('</br>')+ '</p>' 
  }

  //- Données
  let children = false
  let desagregate_source_nodes : SankeyNode[] = []
  let desagregate_target_nodes : SankeyNode[] = []
  const link_info = getLinkValue(data,l.idLink)
  t += '<table class="table" style="margin-bottom: 5px;">'
  t += '<tbody><tr><th>Valeur</th>'
  let the_value = link_info.value

  if ('display_value' in d && link_info.display_value !== '' && !link_info.display_value.includes('[')) {
    the_value = Number(String(link_info.display_value).replace('*',''))
  } 
  t += '<td>' + toPrecision(the_value) +'</td>'
  t += '</td>'
  t += '</tr>'
  t += '</tbody></table>'

  const source_node = data.nodes[l.idSource]
  const target_node = data.nodes[l.idTarget]
  desagregate_source_nodes = Object.values(data.nodes).filter( 
    n => {
      for (const dim in n.dimensions) {
        if (n.dimensions[dim] !== undefined && n.dimensions[dim].parent_name) {
          if (n.dimensions[dim].parent_name === source_node.idNode) {
            return true
          } /*else {
            const parent_node = Object.values(data.nodes).filter(n2=> n.dimensions[dim].parent_name && (n2.idNode === n.dimensions[dim].parent_name) )[0] 
            if (parent_node && parent_node.dimensions[dim] && parent_node.dimensions[dim].parent_name === source_node.idNode) {
              return true
            }
          }*/
        }
        return false
      }
    }
  )
  desagregate_target_nodes = Object.values(data.nodes).filter( n => {
    for (const dim in n.dimensions) {
      if (n.dimensions[dim] !== undefined && n.dimensions[dim].parent_name) {
        const parent_name = n.dimensions[dim].parent_name
        console.log('__')

        if ( parent_name === target_node.idNode) {
          return true
        } /*else {
          const parent_node = Object.values(data.nodes).filter( n2=> n2.idNode === parent_name )[0] 
          if (parent_node && parent_node.dimensions[dim] && parent_node.dimensions[dim].parent_name === target_node.idNode) {
            return true
          }
        }*/
      }
    }
    return false
  })
  children = desagregate_source_nodes.length > 0 || desagregate_target_nodes.length > 0
  if ( desagregate_target_nodes.length === 0 ) {
    desagregate_target_nodes.push(target_node)
  }
  if ( desagregate_source_nodes.length === 0 ) {
    desagregate_source_nodes.push(source_node)
  }
  if (children) {
    t = write_children_table(desagregate_source_nodes, desagregate_target_nodes, data, t, l)
  }

  return t
}

export const nodeTooltipsContent = (
  data : SankeyData,
  d : SankeyNode
) => {
  const n = d as SankeyNode
  const {nodes} = data
  const display_links = data.links

  let t =  '<p class="title" style="margin-bottom: 5px;">'  + n.name.split('\\n').join(' ') + '</p>'
  
  t += '<div style="padding-left :5px;padding-right :5px">'

  if (n.tooltip_text) {
    //t += '<p><b>Définition'+ '</b></p>' 
    //t += '<p class="subtitle">'+n.tooltip_text.split('\n').join('</br>')+ '</p>' 
    t += '<p class="subtitle" style="	margin-bottom: 5px;">'+n.tooltip_text.split('\n') + '</p>' 
  }

  let total=0
  if ( n.inputLinksId.length > 0 ) {
    for (let i=0;i<n.inputLinksId.length;i++) {
      const link = display_links[n.inputLinksId[i]]
      if ( link === undefined ) {
        //alert('Corruption du diagramme')
        return ''
      }
      const link_info = getLinkValue(data,link.idLink)
      let the_value = link_info.value
      if ('display_value' in link_info && link_info.display_value !== '' && !link_info.display_value.includes('[')) {
        the_value = Number(String(link_info.display_value).replace('*',''))
      } 
      if (nodes[link.idSource].node_visible && nodes[link.idTarget].node_visible) {
        total += the_value
      }
    }
  }
  //t += '<br>'
  if ( n.inputLinksId.length > 0 ) {
    t += '<ul><li><p class="tab-title" style="margin-bottom: 5px;">Entrées'+ '</p></li></ul>' 
    t += '<table class="table" style="margin-bottom: 5px;">'
    t +=   '<thead><tr>'
    t +=      '<th></th><th>Valeur</th><th>Pourcentage</th>'      
    t += '</tr></thead>'
    for (let i=0;i<n.inputLinksId.length;i++) {
      const link = display_links[n.inputLinksId[i]]
      if ( link === undefined ) {
        //alert('Corruption du diagramme')
        return ''
      }
      const link_info = getLinkValue(data,link.idLink)
      let the_value = link_info.value
      if ('display_value' in link_info && link_info.display_value !== '' && !link_info.display_value.includes('[')) {
        the_value = Number(String(link_info.display_value).replace('*',''))
      } 
      if (nodes[link.idSource].node_visible && nodes[link.idTarget].node_visible) {
        const source_name = data.nodes[link.idSource].name.split('\\n').join(' ')
        t += '<tr><td>' + source_name + '</td>'
        t +=  '<td>' + toPrecision( the_value)
        if (n.inputLinksId.length>1) {
          const percent = Math.round(the_value*100/total)
          t += '</td><td>'+ percent + '%</td></tr>'
        } else {
          t += '</td></tr>'          
        }
      }
    }
    t += '<tr><th>Total</th><td>' + toPrecision(total) +'</td><td></td></tr></tbody></table>'
  }
  total=0
  if ( n.outputLinksId.length > 0 ) {
    for (let i=0;i<n.outputLinksId.length;i++) {
      const link = data.links[n.outputLinksId[i]]
      if (link === undefined ) {
        //alert('Corruption du diagramme')
        return ''
      }
      const link_info = getLinkValue(data,link.idLink)
      let the_value = link_info.value
      if ('display_value' in link_info && link_info.display_value !== '' && !link_info.display_value.includes('[')) {
        the_value = Number(String(link_info.display_value).replace('*',''))
      } 

      if (nodes[link.idSource].node_visible && nodes[link.idTarget].node_visible) {
        total += the_value
      }
    }
    if ( n.outputLinksId.length > 0 ) {
      t += '<ul><li><p class="tab-title" style="margin-bottom: 5px;">Sorties</p></li></ul>'        
      t += '<table class="table" style="margin-bottom: 5px;">'
      t +=   '<thead><tr>'
      t +=      '<th></th><th>Valeur</th><th>Pourcentage</th>'  
      t += '</tr></thead>'    
      for (let i=0;i<n.outputLinksId.length;i++) {
        const link = data.links[n.outputLinksId[i]]
        if (link === undefined ) {
          //alert('Corruption du diagramme')
          return ''
        }
        const link_info = getLinkValue(data,link.idLink)
        let the_value = link_info.value
        if ('display_value' in link_info && link_info.display_value !== '' && !link_info.display_value.includes('[')) {
          the_value = Number(String(link_info.display_value).replace('*',''))
        }
        if (nodes[link.idSource].node_visible && nodes[link.idTarget].node_visible) {
          const target_name = data.nodes[link.idTarget].name.split('\\n').join(' ')
          t += '<tr><td>' + target_name + '</td>'
          t +=  '<td>' + toPrecision( the_value)
          if (n.outputLinksId.length>1) {
            const percent = Math.round(the_value*100/total)
            t += '</td><td>'+ percent + '%</td></tr>'
          } else {
            t += '</td></tr>'          
          }
        }
      }
    }
    t += '<tr><th>Total</th><td>' + toPrecision(total) +'</td><td></td></tr></tbody></table>'
  }
  if (!n.dimensions) {
    return t
  }
  let header_written = false
  Object.keys(n.dimensions).forEach( dim=> {
    let has_parent = false
    if (n.dimensions[dim].parent_name) {
      if (! header_written) {
        t += '<br><p><b>Noeuds agrégés et désagrégés<b></p>'
        t += '<table class="table table-striped " ><thead><tr><th width="50%">Produit agrégé</th><th width="50%">Produits désagrégés</th></tr></thead><tbody><tr>'
        header_written = true        
      }
      has_parent = true
      t += '<td>' + data.nodes[n.dimensions[dim].parent_name as string].name +'</td>'
    }
    const desagregate_nodes = Object.values(data.nodes).filter( node => node.dimensions[dim] && node.dimensions[dim].parent_name === n.idNode )
    if (desagregate_nodes.length>0) {
      if (! header_written) {
        t += '<br><p><b>Noeuds agrégés et désagrégés</b></p>'
        t += '<table class="table table-striped " ><thead><tr><th width="50%">Produit agrégé</th><th width="50%">Produits désagrégés</th></tr></thead><tbody><tr>'
        header_written = true        
      }
      if (!has_parent) {
        t += '<td></td>'        
      }
      t += '<td>'
      desagregate_nodes.forEach(n=> t+=n.name+'<br>')
      t += '</td>'
    } else {
      t += '<td></td>'
    }
    t += '</tr>'
  })
  t += '</tbody></table>'
  t += '</div>'
  return t
}