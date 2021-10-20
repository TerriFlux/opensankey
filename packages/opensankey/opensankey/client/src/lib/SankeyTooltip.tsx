import { SankeyNode, SankeyLink, SankeyData } from './types'
import { getLinkValue, getTotalLinks } from './SankeyUtils'
import * as d3 from 'd3'

export const nodeTooltipsContent = (
  data: SankeyData,
  node: SankeyNode,
) => {
  if (node.tooltip_text) {
    return node.tooltip_text
  }
  if (data.nodes.length === 0) {
    return ''
  }
  let content = '<p style=\'text-align: center;margin-bottom:0px\'><b>' + node.name + '</b></p>'
  if (node.inputLinksId && node.inputLinksId.length > 0) {
    content += '<b>Entrée</b><ul style=\'margin-bottom:0px\'>'
    node.inputLinksId.forEach(element => {
      const pcValue = d3.format('.1f')(100 * getLinkValue(data, element) / (getTotalLinks(data, (node.inputLinksId as string[])) as number))
      const value = getLinkValue(data, element)
      content += '<li>' + data.links.filter(element1 => { return element1.idLink == element })[0].source_name + ' : ' + value + ' (' + pcValue + '%)</li>' 
    })
    content += '</ul>Total : ' + getTotalLinks(data, node.inputLinksId) + '<br>'
  }
  if (node.outputLinksId && node.outputLinksId.length > 0) {
    content += '<b>Sortie</b><ul style=\'margin-bottom:0px\'>'
    node.outputLinksId.forEach(element => {
      const pcValue = d3.format('.1f')(100 * getLinkValue(data, element) / (getTotalLinks(data, (node.outputLinksId as string[]))as number)) 
      const value = getLinkValue(data, element)
      content += '<li>' + data.links.filter(element1 => { return element1.idLink == element })[0].source_name + ' : ' + value + ' (' + pcValue + '%)</li>'
    })
    content += '</ul>Total : ' + getTotalLinks(data, node.outputLinksId)
  }
  return content
}

// export const default_node_tooltip = (
//   data: SankeyData,
//   d: SankeyNode | SankeyLink
// ) => {
//   if (d.tooltip_text) {
//     return d.tooltip_text
//   }
//   let region_index = 0
//   const tags_group = data.tags.filter(tag => tag.tags_group_name === 'Regions')
//   if (tags_group.length > 1) {
//     region_index = tags_group[0].tags_group.indexOf(data.selected_tags['Regions'][0])
//   }
//   const n = d as SankeyNode
//   const { links } = data
//   let t = '<b>' + n.name.split('\\n').join(' ')
//   let total = 0
//   if (n.input_links.length > 0) {
//     for (let i = 0; i < n.input_links.length; i++) {
//       const link = links[n.input_links[i]]
//       if (link === undefined) {
//         //alert('Corruption du diagramme')
//         return ''
//       }
//       if (link.visible) {
//         total += +link.value[region_index]
//       }
//     }
//   }
//   if (n.input_links.length > 0) {
//     t += '\\n\\n<b>ENTREES\\n\\n '
//     for (let i = 0; i < n.input_links.length; i++) {
//       const link = links[n.input_links[i]]
//       if (link === undefined) {
//         //alert('Corruption du diagramme')
//         return ''
//       }
//       if (link.visible || link.visible === undefined) {
//         const source_name = link.source_name.split('\\n').join(' ')
//         t += ' ' + source_name + ': ' + toPrecision(link.value[region_index])
//         if (n.input_links.length > 1) {
//           const percent = Math.round(link.value[region_index] * 100 / total)
//           t += ' (' + percent + '%)\\n'
//         } else {
//           t += '\\n'
//         }
//       }
//     }
//     t += ' Total: ' + toPrecision(total)
//   }
//   total = 0
//   if (n.output_links.length > 0) {
//     for (let i = 0; i < n.output_links.length; i++) {
//       const link = links[n.output_links[i]]
//       if (link === undefined) {
//         //alert('Corruption du diagramme')
//         return ''
//       }
//       if (link.visible) {
//         total += +link.value[region_index]
//       }
//     }
//     if (n.output_links.length > 0) {
//       t += '\\n\\n<b>SORTIES\\n\\n '
//       for (let i = 0; i < n.output_links.length; i++) {
//         const link = links[n.output_links[i]]
//         if (link === undefined) {
//           //alert('Corruption du diagramme')
//           return ''
//         }
//         if (link.visible) {
//           const target_name = link.target_name.split('\\n').join(' ')
//           t += ' ' + target_name + ': ' + toPrecision(link.value[region_index])
//           if (n.output_links.length > 1) {
//             const percent = Math.round(link.value[region_index] * 100 / total)
//             t += ' (' + percent + '%)\\n'
//           } else {
//             t += '\\n'
//           }
//         }
//       }
//     }
//     t += ' Total: ' + toPrecision(total)
//   }
//   d.tooltip_text = t
//   return d.tooltip_text
// }

export const linkTooltipsContent = (
  data: SankeyData,
  link: SankeyLink,
) => {
  if (link.tooltip_text) {
    return link.tooltip_text
  }
  if (data.links.length === 0) {
    return ''
  }
  const content = link.source_name + ' → ' + link.target_name + ' : ' + getLinkValue(data, link.idLink as string)
  return content
}