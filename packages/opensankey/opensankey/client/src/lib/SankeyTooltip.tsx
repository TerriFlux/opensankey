import { SankeyNode, SankeyLink, SankeyData } from './types'
import { getLinkValue, getTotalLinks } from './SankeyUtils'
import * as d3 from 'd3'

export const nodeTooltipsContent = (
  data: SankeyData,
  node: SankeyNode
) => {
  if (node.tooltip_text) {
    return node.tooltip_text
  }
  if (Object.keys(data.nodes).length === 0) {
    return ''
  }
  let content = '<p style=\'text-align: center;margin-bottom:0px\'><b>' + node.name.split('\\n').join(' ') + '</b></p>'
  if (node.inputLinksId && node.inputLinksId.length > 0) {
    content += '<b>Entrées</b><ul style=\'margin-bottom:0px\'>'
    node.inputLinksId.forEach(element => {
      if (data.nodes[data.links[element].idSource].node_visible) {
        const pcValue = d3.format('.1f')(100 * getLinkValue(data, element).value / (getTotalLinks(data, (node.inputLinksId as string[])) as number))
        const value = getLinkValue(data, element).value
        content += '<li>' + data.nodes[data.links[element].idSource].name.split('\\n').join(' ') + ' : ' + value + ' (' + pcValue + '%)</li>'
      }
    })
    content += '</ul>Total : ' + getTotalLinks(data, node.inputLinksId) + '<br>'
  }
  if (node.outputLinksId && node.outputLinksId.length > 0) {
    content += '<b>Sorties</b><ul style=\'margin-bottom:0px\'>'
    node.outputLinksId.forEach(element => {
      if (data.nodes[data.links[element].idTarget].node_visible) {
        const pcValue = d3.format('.1f')(100 * getLinkValue(data, element).value / (getTotalLinks(data, (node.outputLinksId as string[])) as number))
        const value = getLinkValue(data, element).value
        content += '<li>' + data.nodes[data.links[element].idTarget].name.split('\\n').join(' ') + ' : ' + value + ' (' + pcValue + '%)</li>'
      }
    })
    content += '</ul>Total : ' + getTotalLinks(data, node.outputLinksId)
  }
  // const dimensions_tags = data.dimensions
  // if (!dimensions_tags) {
  //   return
  // }
  // let header_written = false
  // dimensions_tags.forEach(tag=> {
  //   let has_parent = false
  //   if (node.dimensions[tag]) {
  //     if (node.dimensions[tag].parent_name) {
  //       if (! header_written) {
  //         content += '<br><b>Noeuds parents et enfants</b>'
  //         content += '<table class="table table-striped table-dark" ><thead><tr><th>Dimension</th><th>Parent</th><th>Enfants</th></tr></thead><tbody>'
  //         header_written = true        
  //       }
  //       has_parent = true
  //       content += '<tr><td>' + tag +'</td>'
  //       content += '<td>' + node.dimensions[tag].parent_name +'</td>'
  //     }
  //     const desagregate_nodes = Object.values(data.nodes).filter( n => n.dimensions[tag] && n.dimensions[tag].parent_name === node.name )
  //     if (desagregate_nodes.length>0) {
  //       if (! header_written) {
  //         content += '<br><b>Noeuds parents et enfants</b>'
  //         content += '<table class="table table-striped table-dark" ><thead><tr><th>Dimension</th><th>Parent</th><th>Enfants</th></tr></thead><tbody>'
  //         header_written = true        
  //       }
  //       if (!has_parent) {
  //         content += '<tr><td>' + tag +'</td>'
  //         content += '<td>NA</td>'        
  //       }
  //       content += '<td>'
  //       desagregate_nodes.forEach(n=> content += n.name+'<br>')
  //       content += '</td>'
  //     } else if ( header_written) {
  //       content += '<td>NA</td>'
  //     }
  //     if ( header_written) {
  //       content += '</tr>'
  //     }
  //   }
  // })
  content += '</tbody></table>'
  return content
}

export const linkTooltipsContent = (
  data: SankeyData,
  link: SankeyLink
) => {
  if (link.tooltip_text) {
    return link.tooltip_text
  }
  if (Object.keys(data.links).length === 0) {
    return ''
  }
  const content = data.nodes[link.idSource].name + ' → ' + data.nodes[link.idTarget].name + ' : ' + getLinkValue(data, link.idLink).value
  return content
}