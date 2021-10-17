import { SankeyNode, SankeyLink, SankeyData } from './types'
import { cloneSelection, getLinkValue, getTotalLinks } from './SankeyUtils'
import * as d3 from 'd3'

export const nodeTooltipsContent = (
  data: SankeyData,
  node: SankeyNode,
) => {
  let content = '<p style=\'text-align: center;margin-bottom:0px\'><b>' + node.name + '</b></p>'
  if ((node.inputLinksId as any).length > 0) {
    content += '<b>Entrée</b><ul style=\'margin-bottom:0px\'>';
    (node.inputLinksId as any).forEach((element: any) => {
      const pcValue = d3.format('.1f')(100 * getLinkValue(data, element) / (getTotalLinks(data, (node as any).inputLinksId) as any))
      const value = getLinkValue(data, element)
      content += '<li>' + data.links.filter(element1 => { return element1.idLink == element })[0].source_name + ' : ' + value + ' (' + pcValue + '%)</li>' 
    })
    content += '</ul>Total : ' + getTotalLinks(data, (node as any).inputLinksId) + '<br>'
  }
  if ((node.outputLinksId as any).length > 0) {
    content += '<b>Sortie</b><ul style=\'margin-bottom:0px\'>';
    (node.outputLinksId as any).forEach((element: any) => {
      const pcValue = d3.format('.1f')(100 * getLinkValue(data, element) / (getTotalLinks(data, (node as any).outputLinksId) as any))
      const value = getLinkValue(data, element)
      content += '<li>' + data.links.filter(element1 => { return element1.idLink == element })[0].source_name + ' : ' + value + ' (' + pcValue + '%)</li>'
    })
    content += '</ul>Total : ' + getTotalLinks(data, (node as any).outputLinksId)
  }

  return content
}

export const linkTooltipsContent = (
  data: SankeyData,
  link: SankeyLink,
) => {
  const content = link.source_name + ' → ' + link.target_name + ' : ' + getLinkValue(data, link.idLink as string)
  return content
}