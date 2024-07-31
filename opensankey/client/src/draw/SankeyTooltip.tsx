import { SankeyNode, SankeyLink, SankeyData } from '../types/Types'
import { ToPrecision, LinkVisible, NodeDisplayed, ReturnValueLink } from '../configmenus/SankeyUtils'
import { GetLinkValueFuncType } from '../configmenus/types/SankeyUtilsTypes'
import { TFunction } from 'i18next'


/**
 * Description placeholder
 *
 * @param {SankeyNode[]} desagregate_source_nodes
 * @param {SankeyNode[]} desagregate_target_nodes
 * @param {SankeyData} data
 * @param {string} t
 * @param {SankeyLink} l
 * @returns {string}
 */
function WriteChildrenTable(
  desagregate_source_nodes : SankeyNode[],
  desagregate_target_nodes : SankeyNode[],
  data: SankeyData,
  t: string,
  l: SankeyLink,
  GetLinkValue:GetLinkValueFuncType,
  trad:TFunction
) {
  let header_written = false
  desagregate_source_nodes.forEach(n1 => {
    desagregate_target_nodes.forEach(
      n2 => {
        const desagregated_link = Object.values(data.links).filter(l => l.idSource === n1.idNode && l.idTarget === n2.idNode)[0]
        if (desagregated_link === undefined || desagregated_link === l) {
          return
        }
        const desagregated_link_info = GetLinkValue(data,desagregated_link.idLink)
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
          value_to_display = +String(GetLinkValue(data,desagregated_link.idLink).display_value).replace('*','')
        }
        t += '<tr>'
        t += '<td>' + data.nodes[desagregated_link.idSource].name + '->' + data.nodes[desagregated_link.idTarget].name + '</td>'
        t += '<td>' + ToPrecision((value_to_display)?value_to_display as number:0,trad) + '</td>'
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


const TooltipLinkToPrecision=(data : SankeyData,
  l : SankeyLink,value:number,trad:TFunction)=>{
  const tmp=ReturnValueLink(data,l,'to_precision')?ToPrecision(value,trad):value
  return String(tmp).replace('.',trad('sep_decimal'))
}
/**
 * Function used to fill the tooltip of link
 * The tooltip is visible when we hover a link and press the key shift
 *
 * @param {SankeyData} data
 * @param {(SankeyLink | SankeyNode)} d
 * @returns {string}
 */
export const  LinkTooltipsContent = (
  data : SankeyData,
  d : SankeyLink | SankeyNode,
  GetLinkValue:GetLinkValueFuncType,
  trad:TFunction
) => {
  const l = d as SankeyLink
  let t = '<p class="title" style="margin-bottom: 5px;">'+ data.nodes[l.idSource].name.split('\\n').join(' ') + ' → ' + data.nodes[l.idTarget].name.split('\\n').join(' ') + '</p>'

  if (l.tooltip_text) {
    t += '<p>'+l.tooltip_text.split('\n').join('</br>')+ '</p>'
  }

  //- Données
  let children = false
  let desagregate_source_nodes : SankeyNode[] = []
  let desagregate_target_nodes : SankeyNode[] = []
  const link_info = GetLinkValue(data,l.idLink)
  t += '<table class="table" style="margin-bottom: 5px;">'
  t += '<tbody><tr><th>Valeur</th>'
  let the_value = link_info.value
  if ('display_value' in d && link_info.display_value !== '' && !link_info.display_value.includes('[')) {
    the_value = Number(String(link_info.display_value).replace('*',''))
  }
  t += '<td>' + TooltipLinkToPrecision(data,l,(the_value)?the_value as number:0,trad) +'</td>'
  t += '</td>'
  t += '</tr>'
  Object.entries(link_info.tags).forEach(([tag_group_key,tags])=> {
    const names : string[]= []
    tags.forEach(link_info_tag=> {
      if (link_info_tag!== null) {
        names.push(data.fluxTags[tag_group_key].tags[link_info_tag].name)
      }
    })
    t+='<tr><th>'+data.fluxTags[tag_group_key].group_name+'</th><td>'+names.join()+'</td><tr>'
  })
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
    t = WriteChildrenTable(desagregate_source_nodes, desagregate_target_nodes, data, t, l,GetLinkValue,trad)
  }

  return t
}

/**
 * Function used to fill the tooltip of node
 * The tooltip is visible when we hover a node and press the key shift
 *
 * @param {SankeyData} data
 * @param {SankeyNode} d
 * @returns {string}
 */
export const NodeTooltipsContent = (
  data : SankeyData,
  display_nodes : { [node_id: string]: SankeyNode },
  d : SankeyNode,
  GetLinkValue:GetLinkValueFuncType,
  trad:TFunction
) => {
  const n = d as SankeyNode
  const {nodes} = data
  const display_links = data.links

  let t =  '<p class="title" style="margin-bottom: 5px;">'  + n.name.split('\\n').join(' ') + '</p>'

  t += '<div style="padding-left :5px;padding-right :5px">'

  t += '<p class="subtitle" style="	margin-bottom: 5px;">'+n.u + ' ' +n.v + ' ' +n.dy + '</p>'

  if (n.tooltip_text) {
    t += '<p class="subtitle" style="	margin-bottom: 5px;">'+n.tooltip_text.split('\n').join('<br>') + '</p>'
  }

  let total=0
  if ( n.inputLinksId.length > 0 ) {
    for (let i=0;i<n.inputLinksId.length;i++) {
      const link = display_links[n.inputLinksId[i]]
      if ( link === undefined ) {
        //alert('Corruption du diagramme')
        return ''
      }
      if (!LinkVisible(link, data, display_nodes)) {
        continue
      }
      const link_info = GetLinkValue(data,link.idLink)
      let the_value = link_info.value
      if ('display_value' in link_info && link_info.display_value !== '' && !link_info.display_value.includes('[')) {
        the_value = Number(String(link_info.display_value).replace('*',''))
      }
      if (NodeDisplayed(data,nodes[link.idSource]) && NodeDisplayed(data,nodes[link.idTarget]) ) {
        total += (the_value)?the_value as number:0
      }
    }
  }
  if ( n.inputLinksId.length > 0 ) {
    t += '<p class="tab-title" style="margin-bottom: 5px;">Entrées'+ '</p>'
    t += '<table class="table" style="margin-bottom: 5px;">'
    t +=   '<thead><tr>'
    t +=      '<th></th><th>Valeur</th>'
    t +='<th>Pourcentage</th>'
    Object.values(data.fluxTags).forEach(tag=> t+='<th>'+tag.group_name+'</th>')
    t += '</tr></thead>'
    for (let i=0;i<n.inputLinksId.length;i++) {
      const link = display_links[n.inputLinksId[i]]
      if ( link === undefined ) {
        //alert('Corruption du diagramme')
        return ''
      }
      const link_info = GetLinkValue(data,link.idLink)
      let the_value = link_info.value
      if (link_info.display_value == 'missing') {
        continue
      }
      if (!LinkVisible(link, data, display_nodes)) {
        continue
      }

      if ('display_value' in link_info && link_info.display_value !== '' && !link_info.display_value.includes('[')) {
        the_value = Number(String(link_info.display_value).replace('*',''))
      }
      if (NodeDisplayed(data,nodes[link.idSource]) && NodeDisplayed(data,nodes[link.idTarget]) ) {
        const source_name = data.nodes[link.idSource].name.split('\\n').join(' ')
        t += '<tr><td style="white-space: nowrap;">' + source_name + '</td>'
        t +=  '<td>' + ToPrecision( (the_value)?the_value as number:0,trad)+'</td>'
        if (n.inputLinksId.length>1) {
          const percent = Math.round(((the_value)?the_value as number :0)*100/total)
          t += '<td>'+ percent + '%</td>'
          Object.keys(data.fluxTags).forEach(tag_group_key=> {
            const names : string[]= []
            link_info.tags[tag_group_key].forEach(tag=>{
              if (tag==null) {
                return
              }
              names.push(data.fluxTags[tag_group_key].tags[tag].name)
          })
            t += '<td style="white-space: nowrap;">'+names.join()+'</td></tr>'
          })
        } else {
          t += '<td></td></tr>'
        }
      }
    }
    t += '<tr><th>Total</th><td>' + ToPrecision(total,trad) +'</td>'
    Object.keys(data.fluxTags).forEach(()=> t +='<td></td>')
    t += '<td></td></tr></tbody></table>'
  }
  total=0
  if ( n.outputLinksId.length > 0 ) {
    for (let i=0;i<n.outputLinksId.length;i++) {
      const link = data.links[n.outputLinksId[i]]
      if (link === undefined ) {
        //alert('Corruption du diagramme')
        return ''
      }
      if (!LinkVisible(link, data, display_nodes)) {
        continue
      }
      const link_info = GetLinkValue(data,link.idLink)
      if (link_info.display_value == 'missing') {
        continue
      }
      let the_value = link_info.value
      if ('display_value' in link_info && link_info.display_value !== '' && !link_info.display_value.includes('[')) {
        the_value = Number(String(link_info.display_value).replace('*',''))
      }

      if (NodeDisplayed(data,nodes[link.idSource]) && NodeDisplayed(data,nodes[link.idTarget]) ) {
        total += (the_value)?the_value as number:0
      }
    }
    if ( n.outputLinksId.length > 0 ) {
      t += '<p class="tab-title" style="margin-bottom: 5px;">Sorties</p>'
      t += '<table class="table" style="margin-bottom: 5px;">'
      t +=   '<thead><tr>'
      t +=      '<th></th><th>Valeur</th>'
      t +='<th>Pourcentage</th>'
      Object.values(data.fluxTags).forEach(tag=> t+='<th>'+tag.group_name+'</th>')
      t += '</tr></thead>'
      for (let i=0;i<n.outputLinksId.length;i++) {
        const link = data.links[n.outputLinksId[i]]
        if (link === undefined ) {
          //alert('Corruption du diagramme')
          return ''
        }
        const link_info = GetLinkValue(data,link.idLink)
        if (!LinkVisible(link, data, display_nodes)) {
          continue
        }
        let the_value = link_info.value
        if ('display_value' in link_info && link_info.display_value !== '' && !link_info.display_value.includes('[')) {
          the_value = Number(String(link_info.display_value).replace('*',''))
        }
        if (NodeDisplayed(data,nodes[link.idSource]) && NodeDisplayed(data,nodes[link.idTarget]) ) {
          const target_name = data.nodes[link.idTarget].name.split('\\n').join(' ')
          t += '<tr><td style="white-space: nowrap;">' + target_name + '</td>'
          t +=  '<td>' + ToPrecision( (the_value)?the_value as number:0,trad)+'</td>'
          if (n.outputLinksId.length>1) {
            const percent = Math.round(((the_value)?the_value as number:0)*100/total)
            t += '<td>'+ percent + '%</td>'
            Object.keys(data.fluxTags).forEach(tag_group_key=> {
              const names : string[]= []
              link_info.tags[tag_group_key].forEach(tag=>{
                if (tag==null) {
                  return
                }
                names.push(data.fluxTags[tag_group_key].tags[tag].name)
                t += '<td style="white-space: nowrap;">'+names.join()+'</td></tr>'
            })
          })

          } else {
            t += '<td></td></tr>'
          }
        }
      }
    }
    t += '<tr><th>Total</th><td>' + ToPrecision(total,trad) +'</td>'
    Object.keys(data.fluxTags).forEach(()=> t +='<td></td>')
    t += '<td></td></tr></tbody></table>'
  }
  if (!n.dimensions) {
    return t
  }
  // let header_written = false
  // Object.keys(n.dimensions).forEach( dim=> {
  //   let has_parent = false
  //   if (n.dimensions[dim].parent_name) {
  //     if (! header_written) {
  //       t += '<br><p><b>Noeuds agrégés et désagrégés<b></p>'
  //       t += '<table class="table table-striped " ><thead><tr><th width="50%">Produit agrégé</th><th width="50%">Produits désagrégés</th></tr></thead><tbody><tr>'
  //       header_written = true
  //     }
  //     has_parent = true
  //     t += '<td style="white-space: nowrap;">' + data.nodes[n.dimensions[dim].parent_name as string].name +'</td>'
  //   }
  //   const desagregate_nodes = Object.values(data.nodes).filter( node => node.dimensions[dim] && node.dimensions[dim].parent_name === n.idNode )
  //   if (desagregate_nodes.length>0) {
  //     if (! header_written) {
  //       t += '<br><p><b>Noeuds agrégés et désagrégés</b></p>'
  //       t += '<table class="table table-striped " ><thead><tr><th width="50%">Produit agrégé</th><th width="50%">Produits désagrégés</th></tr></thead><tbody><tr>'
  //       header_written = true
  //     }
  //     if (!has_parent) {
  //       t += '<td></td>'
  //     }
  //     t += '<td style="white-space: nowrap;">'
  //     desagregate_nodes.forEach(n=> t+=n.name+'<br>')
  //     t += '</td>'
  //   } else {
  //     t += '<td></td>'
  //   }
  //   t += '</tr>'
  // })
  t += '</tbody></table>'
  t += '</div>'
  return t
}