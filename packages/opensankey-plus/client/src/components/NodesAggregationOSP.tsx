// import React from 'react'
// import { TFunction } from 'i18next'

// import { Box, Button, Checkbox, Select, TabPanel } from '@chakra-ui/react'

// import {
//   reorganize_node_outputLinksIdOSTyped, reorganize_node_inputLinksIdOSTyped
// } from './import/OpenSankey'
// import { FType_MenuConfigurationNodesAgregationOSP } from '../types/SankeyPlusNodesAggregationTypes'

// import { OSPData, OSPLink, OSPNode } from '../types/Types'

// export const menuConfigurationNodesAgregationOSP: FType_MenuConfigurationNodesAgregationOSP = (
//   t: TFunction,
//   data: OSPData,
//   set_data: (d: OSPData) => void,
//   multi_selected_nodes: { current: OSPNode[] },
//   parent_visible: boolean,
//   set_parent_visible: (_: boolean) => void,
//   cube_dimension: string,
//   set_cube_dimension: (_: string) => void,
//   OSPDefaultLink: (_: OSPData) => OSPLink
// ) => {

//   if (Object.values(data.levelTags).length > 0 && cube_dimension === 'Primaire') {
//     if (Object.values(data.levelTags).filter(tag => tag.group_name === 'Primaire').length === 0) {
//       set_cube_dimension(Object.entries(data.levelTags)[0][0])
//     }
//   }
//   return <TabPanel
//   //  key="agregation"
//   //  eventKey="agregation"
//   //  title={t('Noeud.agre.Agré')}
//   >
//     <Box >
//       <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
//         <Box layerStyle='menuconfigpanel_option_name'>{t('Noeud.agre.DC')}</Box>
//         <Select value={cube_dimension} onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => set_cube_dimension(evt.target.value)} >
//           {Object.entries(data.levelTags).map((tag, i) => {
//             return (<option key={i} value={tag[0]}>{tag[1].group_name}</option>)
//           })}
//         </Select>
//       </Box>
//       <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
//         <Checkbox
//           isDisabled={multi_selected_nodes.current.length === 0}
//           variant='menuconfigpanel_option_checkbox'
//           isChecked={multi_selected_nodes.current.length !== 0 && parent_visible}
//           onChange={
//             evt => set_parent_visible(evt.target.checked)
//           }
//         >{t('Noeud.agre.Parent')}</Checkbox>

//         {parent_visible ? (
//           <Select
//             onChange={(changeEvent: React.ChangeEvent<HTMLSelectElement>) => {
//               if (changeEvent.target.value === 'none') {
//                 multi_selected_nodes.current.forEach(n => {
//                   if (!(cube_dimension in n.dimensions)) {
//                     n.dimensions[cube_dimension] = {}
//                   }
//                   n.dimensions[cube_dimension].parent_name = undefined

//                 })
//               } else {
//                 multi_selected_nodes.current.forEach(n => {

//                   if (!(cube_dimension in n.dimensions)) {
//                     n.dimensions[cube_dimension] = {}
//                   }
//                   n.dimensions[cube_dimension].parent_name = changeEvent.target.value
//                 })
//               }
//             }}>
//             <option key={0} value='none' selected={multi_selected_nodes.current.length !== 0 && cube_dimension in multi_selected_nodes.current[0].dimensions && multi_selected_nodes.current[0].dimensions[cube_dimension].parent_name === undefined} >Pas de parent</option>
//             {
//               Object.values(data.nodes).map((n, i) => <option key={i + 1} value={n.idNode} selected={multi_selected_nodes.current.length !== 0 && cube_dimension in multi_selected_nodes.current[0].dimensions && multi_selected_nodes.current[0].dimensions[cube_dimension].parent_name === n.idNode} >{n.name}</option>)
//             }
//           </Select>
//         ) : (<></>)}
//       </Box>
//       <Button
//         style={{ 'marginBottom': '3px', 'marginRight': '3px' }}
//         onClick={
//           () => {
//             const listId: number[] = []
//             Object.keys(data.links).forEach(elt => listId.push(Number(elt.replace('link', ''))))
//             let idLink = listId.length > 0 ? Math.max(...listId) + 1 : 0
//             multi_selected_nodes.current.forEach(d => {
//               const child_nodes = Object.values(data.nodes).filter(n => cube_dimension in n.dimensions && n.dimensions[cube_dimension].parent_name === d.idNode)
//               const new_input_nodes: string[] = []
//               child_nodes.forEach(n1 => {
//                 const input_links = n1.inputLinksId.filter(idLink => new_input_nodes.includes(data.links[idLink].idSource) === false)
//                 input_links.forEach(idLink => new_input_nodes.push(data.links[idLink].idSource))
//               })
//               const new_output_nodes: string[] = []
//               child_nodes.forEach(n1 => {
//                 const output_links = n1.outputLinksId.filter(idLink => new_output_nodes.includes(data.links[idLink].idSource) === false)
//                 output_links.forEach(idLink => new_output_nodes.push(data.links[idLink].idTarget))
//               })
//               new_input_nodes.forEach(idSource => {
//                 const new_link = OSPDefaultLink(data)
//                 new_link.idSource = idSource
//                 new_link.idTarget = d.idNode
//                 new_link.idLink = 'link' + idLink
//                 data.links[new_link.idLink] = new_link
//                 data.linkZIndex.push(new_link.idLink)
//                 idLink = idLink + 1
//                 reorganize_node_outputLinksIdOSTyped(data, data.nodes[new_link.idSource], data.nodes, data.links)
//               })
//               new_output_nodes.forEach(() => {
//                 const new_link = OSPDefaultLink(data)
//                 new_link.idSource = d.idNode
//                 new_link.idLink = 'link' + idLink
//                 data.links[new_link.idLink] = new_link
//                 data.linkZIndex.push(new_link.idLink)
//                 idLink++
//                 reorganize_node_inputLinksIdOSTyped(data, data.nodes[new_link.idTarget], data.nodes, data.links)
//               })
//               reorganize_node_inputLinksIdOSTyped(data, d, data.nodes, data.links)
//               reorganize_node_outputLinksIdOSTyped(data, d, data.nodes, data.links)

//               set_data({ ...data })
//             })
//           }
//         }
//       >{t('Noeud.agre.CLE')}</Button>

//     </Box>
//   </TabPanel>
// }
