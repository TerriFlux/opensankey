import { TFunction } from 'i18next'
import { SankeyNode, SankeyLink, SankeyData } from '../types/Types'
import { ToPrecision, LinkVisible, NodeDisplayed, ReturnValueNode, format_link_value } from '../configmenus/SankeyUtils'
import { GetLinkValueFuncType } from '../configmenus/types/SankeyUtilsTypes'
import { LinkTooltipsContentFType, NodeTooltipsContentFType } from './types/SankeyTooltipTypes'


/**
 * Function used to fill the tooltip of link
 * The tooltip is visible when we hover a link and press the key shift
 *
 * @param {SankeyData} data
 * @param {(SankeyLink | SankeyNode)} d
 * @returns {string}
 */
export const  LinkTooltipsContent : LinkTooltipsContentFType = (
  data,
  l,
  GetLinkValue,
  trad
) => {
  const {tooltip_names} = data
  const {  nodes } = data

  let t = '<p style=\'text-align: center;margin-bottom:0px\'><b>'+ nodes[l.idSource].name.split('\\n').join(' ') + ' -> ' + nodes[l.idTarget].name.split('\\n').join(' ') + '</b></p>'

  if (l.tooltip_text) {
    t += '<p>'+l.tooltip_text.split('\n').join('</br>')+ '</p>'
  }

  const link_info = GetLinkValue(data,l.idLink)
  t += '<table class="table" style="margin-bottom: 5px;">'
  t += '<tbody><tr><th>Valeur</th>'
  let the_value = link_info.value
  if ('display_value' in l && link_info.display_value !== '' && !link_info.display_value.includes('[')) {
    the_value = Number(String(link_info.display_value).replace('*',''))
  }
  t += '<td>' + format_link_value(data,l,(the_value)?the_value as number:0,trad) +'</td>'
  t += '</td>'
  t += '</tr>'
    if (Object.values(data.fluxTags).length>0) {
      Object.entries(link_info.tags).forEach(([tag_group_key,tags])=> {
        const names : string[]= []
        tags.forEach(link_info_tag=> {
          if (link_info_tag!== null) {
            names.push(data.fluxTags[tag_group_key].tags[link_info_tag].name)
          }
        })
        t+='<tr><th>'+data.fluxTags[tag_group_key].group_name+'</th><td>'+names.join()+'</td><tr>'
      })
    }
    t += '</tbody></table>'

  if ( l.tooltips ) {
    let title = false
    const count = tooltip_names.filter((tooltip_name,i) =>{
      return (l.tooltips && l.tooltips[i] !== undefined &&  l.tooltips[i] !== null)
    }).length
    const width = 100/count + 'px'
    tooltip_names.forEach((tooltip_name,i) =>{
      if (l.tooltips && l.tooltips[i] !== undefined &&  l.tooltips[i] !== null) {
        if (title === false) {
          t += '<p>Hypothèses</p>'
          t += '<table class="table table-striped " >'
          t +=   '<thead><tr>'
          title = true
        }
        t += '<th width="'+width+'">' + tooltip_name[0] +'</th>'
      }
    })
    t += '</tr></thead>'
    t += '<tr><tbody>'
    tooltip_names.forEach((_,i) =>{
      if (l.tooltips && l.tooltips[i] !== undefined &&  l.tooltips[i] !== null ) {
        if (typeof l.tooltips[i] === 'number' ) {
          if (tooltip_names[i].includes('%') ) {
            t += '<td>' + format_link_value(data,l,Number(l.tooltips[i])*100,trad) +'</td>'
          } else {
            t += '<td>' + format_link_value(data,l,+l.tooltips[i],trad) +'</td>'
          }
        } else {
          t += '<td>' + l.tooltips[i] +'</td>'
        }
      }
    })
    t += '</tr></tbody></table>'
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
export const NodeTooltipsContent: NodeTooltipsContentFType = (
  data,
  display_nodes,
  n,
  GetLinkValue,
  trad
) => {
  const {nodes,links} = data

  let t =  '<p class="title" style="margin-bottom: 5px;">'  + n.name.split('\\n').join(' ') + '</p>'
  // t += '<p class="title" style="margin-bottom: 5px;">'  + 'x: '+n.x + ' y: ' +n.y + '</p>'
  // t += '<p class="title" style="margin-bottom: 5px;">'  + 'relative_dx: ' + ReturnValueNode(data,n,'relative_dx') +'</p>'
  // t += '<p class="title" style="margin-bottom: 5px;">'  + 'relative_dy: ' + ReturnValueNode(data,n,'relative_dy') +'</p>'
  //t += '<p class="title" style="margin-bottom: 5px;">'  + 'u: '+n.u + ' v: ' +n.v + ' dy: ' + ReturnValueNode(data,n,'dy') + ' dy: ' + '</p>'

  t += '<div style="padding-left :5px;padding-right :5px">'

  if (n.tooltip_text) {
    t += '<p class="subtitle" style="	margin-bottom: 5px;">'+n.tooltip_text.split('\n').join('<br>') + '</p>'
  }

  let total=0
  if ( n.inputLinksId.length > 0 ) {
    for (let i=0;i<n.inputLinksId.length;i++) {
      const link = links[n.inputLinksId[i]]
      if ( link === undefined ) {
        //alert('Corruption du diagramme')
        return ''
      }
      if (!LinkVisible(link, data, display_nodes)) {
        continue
      }
      const link_info = GetLinkValue(data,link.idLink)
      let the_value = link_info.value
      if (NodeDisplayed(data,nodes[link.idSource]) && NodeDisplayed(data,nodes[link.idTarget]) ) {
        total += (the_value)?the_value as number:0
      }
    }
  }
  if ( n.inputLinksId.length > 0 ) {
    t += '<p class="tab-title" style="margin-bottom: 5px;">Entrées'+ '</p>'
    t += '<table class="table" style="margin-bottom: 5px;">'
    t +=   '<thead><tr>'
    t += '<table class="table" style="margin-bottom: 5px;">'
    t +=   '<thead><tr>'
    t +=      '<th width="150px"></th><th width="120px">Valeur</th><th width="120px">Pourcentage</th>'

    Object.values(data.fluxTags).forEach(tag=> t+='<th>'+tag.group_name+'</th>')
    t += '</tr></thead>'
    for (let i=0;i<n.inputLinksId.length;i++) {
      const link = links[n.inputLinksId[i]]
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
      if (NodeDisplayed(data,nodes[link.idSource]) && NodeDisplayed(data,nodes[link.idTarget]) ) {
        const source_name = nodes[link.idSource].name.split('\\n').join(' ')
        t += '<tr><td style="white-space: nowrap;" >' + source_name + '</td>'

        t +=  '<td>' + format_link_value(data,link,the_value,trad)
        if (n.inputLinksId.length>1) {
          const percent = Math.round(((the_value)?the_value as number :0)*100/total)
          t += '<td>'+ percent + '%</td>'
          Object.keys(data.fluxTags).forEach(tag_group_key=> {
            const names : string[]= []
            if (!link_info.tags[tag_group_key]) {
              return
            }
            link_info.tags[tag_group_key].filter(t=>t!==null && t!==undefined).forEach(tag=>{
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
    t += '</tr></tbody></table>'
  }
  total=0

  if ( n.outputLinksId.length > 0 ) {
    for (let i=0;i<n.outputLinksId.length;i++) {
      const link = links[n.outputLinksId[i]]
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
      t +=      '<th width="150px"></th><th width="120px">Valeur</th><th width="120px">Pourcentage</th>'
      Object.values(data.fluxTags).forEach(tag=> t+='<th>'+tag.group_name+'</th>')
      t += '</tr></thead>'
      for (let i=0;i<n.outputLinksId.length;i++) {
        const link = links[n.outputLinksId[i]]
        if (link === undefined ) {
          //alert('Corruption du diagramme')
          return ''
        }
        const link_info = GetLinkValue(data,link.idLink)
        if (!LinkVisible(link, data, display_nodes)) {
          continue
        }
        let the_value = link_info.value
        if (NodeDisplayed(data,nodes[link.idSource]) && NodeDisplayed(data,nodes[link.idTarget]) ) {
          const target_name = nodes[link.idTarget].name.split('\\n').join(' ')
          t += '<tr><td style="white-space: nowrap;">' + target_name + '</td>'
          t +=  '<td>' + format_link_value(data,link,the_value,trad)
          if (n.outputLinksId.length>1) {
            const percent = Math.round(((the_value)?the_value as number:0)*100/total)
            t += '<td>'+ percent + '%</td>'
            Object.keys(data.fluxTags).forEach(tag_group_key=> {
              const names : string[]= []
              if (!link_info.tags[tag_group_key]) {
                return
              }
              link_info.tags[tag_group_key].filter(t=>t!==null && t!==undefined).forEach(tag=>{
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
    }
    t += '<tr><th>Total</th><td>' + ToPrecision(total,trad) +'</td>'
    Object.keys(data.fluxTags).forEach(()=> t +='<td></td>')
    t += '</tr></tbody></table>'
  }
  if (!n.dimensions) {
    return t
  }

  t += '</tbody></table>'
  t += '</div>'
  return t
}
