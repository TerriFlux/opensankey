// External lib
import React, { ChangeEvent, useState, useRef, FunctionComponent } from 'react'

import {
  FaEyeSlash,
  FaFileImport,
  FaLock,
  FaLockOpen
} from 'react-icons/fa'
import {
  Box,
  Button,
  Checkbox,
  TabPanel,
  Input,
  InputGroup} from '@chakra-ui/react'
import { faIcons, faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDeleteLeft } from '@fortawesome/free-solid-svg-icons'

// Local imports
import {
  ContextNodeIconFType,
  OSPHyperLinkFType,
  // node_icon_fill_colorFType,
  // node_icon_pathFType,
  // OpposingDragElementsPlusFType,
  // OSPDragElementsFType,
  // OSPNodeClickEventFType,
  // OSPNodeDragEventFType,
  // OSPReturnOutOfBoundElementsFType,
  // OSPDrawNodesIllustrationFType,
  // OSPHyperLinkFType,
  OSPNodeIconFType,
} from '../types/SankeyPlusNodesTypes'
// import {
//   OSPReturnValueLink
// } from './SankeyPlusUtils'

// OpenSankey types
// import {
//   ComponentUpdaterType,
//   SankeyData,
//   SankeyNode,
//   applicationDrawType,
//   uiElementsRefType
// } from './deps/OpenSankey/types/Types'
// import {
//   GetLinkValueFuncType,
//   GetSankeyMinWidthAndHeightFuncType
// } from './deps/OpenSankey/configmenus/types/SankeyUtilsTypes'
// import { NodeTooltipsContentFType } from './deps/OpenSankey/draw/types/SankeyTooltipTypes'

// OpenSankey ts-code
// import { TooltipValueSurcharge } from './deps/OpenSankey/configmenus/SankeyUtils'
import { default_shape_visible, isAttributeOverloaded } from './deps/OpenSankey/types/Node'
import { OSTooltip, TooltipValueSurcharge } from './deps/OpenSankey/types/Utils'


declare const window: Window &
  typeof globalThis & {
    SankeyToolsStatic: boolean
  }

export const OSPNodeIcon: FunctionComponent<OSPNodeIconFType> = ({
  applicationData,
  menu_for_modal,
}) => {
  const { new_data } = applicationData
  const { t } = new_data
  const is_activated = new_data.has_sankey_plus
  const [show_menu_node_icon, set_show_menu_node_icon] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(false)
  const selected_nodes = new_data.drawing_area.sankey.nodes_list
  new_data.menu_configuration.dict_setter_show_dialog_plus.ref_setter_show_menu_node_icon.current = set_show_menu_node_icon

  const redrawIllustrationAndRefresh = () => {
    selected_nodes.forEach(zdt => zdt.drawIllustration())
    setForceUpdate(!forceUpdate)
  }

  const redrawAndRefresh = () => {
    new_data.menu_configuration.ref_to_menu_config_nodes_apparence_updater.current()
    selected_nodes.forEach(zdt => zdt.draw())
    setForceUpdate(!forceUpdate)
  }


  const _load_image = useRef<HTMLInputElement>(null)

  // const isAllNodeVisible = IsAllNodeAttrSameValue(data, selected_nodes, ['shape_visible'], false)['shape_visible'] as boolean[]
  const isAllNodeVisible = (selected_nodes[0]?.shape_visible ?? default_shape_visible)

  let all_are_icons = (
    selected_nodes.length > 0)
  let all_are_images = all_are_icons
  let all_are_none = all_are_icons
  selected_nodes
    .forEach(d => {
      all_are_icons = (all_are_icons && d.iconVisible)
      all_are_images = (all_are_images && d.is_image)
      all_are_none = (all_are_none && (!d.iconVisible && !d.is_image))
    })

  let button_icon_or_image = 'both'
  if (all_are_icons) {
    button_icon_or_image = 'icon'
  }
  if (all_are_images) {
    button_icon_or_image = 'image'
  }
  if (all_are_none) {
    button_icon_or_image = 'none'
  }

  // Content if we want to add icon to node
  const content_icon = <Box
    layerStyle='menuconfigpanel_grid'
  >
    {
      button_icon_or_image === 'icon' ?
        <Box
          layerStyle='menuconfigpanel_grid'
        >

          <OSTooltip label={!is_activated ? t('Menu.sankeyOSPDisabled') : ''} >

            <Box
              as='span'
              layerStyle='menuconfigpanel_row_2cols'
            >
              <Box
                as='span'
                layerStyle='menuconfigpanel_option_name'
              >
                {t('Noeud.icon.icon_catalog')}
              </Box>
              <Button
                variant='menuconfigpanel_option_button'
                disabled={!is_activated}
                onClick={() => {
                  new_data.menu_configuration.dict_setter_show_dialog_plus.ref_setter_show_modal_import_icons.current!(true)
                }}
              >
                <FontAwesomeIcon icon={faIcons} />
              </Button>
            </Box>
          </OSTooltip>

          <OSTooltip label={!is_activated ? t('Menu.sankeyOSPDisabled') : ''} >
            <Box
              as='span'
              layerStyle='menuconfigpanel_row_3cols'
            >
              <Box
                as='span'
                layerStyle='menuconfigpanel_option_name'
              >
                {t('Noeud.apparence.Couleur')}
              </Box>
              <Input
                variant='menuconfigpanel_option_input_color'
                type='color'
                value={
                  (selected_nodes.length === 1) ?
                    selected_nodes[0].iconColor :
                    '#ffffff'
                }
                onChange={evt => {
                  const color = evt.target.value
                  selected_nodes.map(d => d.iconColor = color)
                  redrawIllustrationAndRefresh()
                }}
              />
              <Button
                //Si la valeur est a true alors la couleur des noeuds reste celle sélectionné loreque que l'on affiche les flux celon leur étiquettes
                variant={
                  (selected_nodes.length === 1) ?
                    'menuconfigpanel_option_button_activated' :
                    'menuconfigpanel_option_button'}
                onClick={() => {
                  selected_nodes.forEach(d => d.iconColorSustainable = !d.iconColorSustainable)
                  redrawIllustrationAndRefresh()
                }}
              >
                {(selected_nodes.length === 1 && selected_nodes[0].iconColorSustainable) ? <FaLock /> : <FaLockOpen />}
              </Button>
            </Box>
          </OSTooltip>
        </Box> :
        <></>
    }
  </Box>

  // Content if we want to add image to node
  const content_image = <Box
    layerStyle='menuconfigpanel_grid'
  >
    {/* Import image */}
    {
      (button_icon_or_image === 'image') ?
        <OSTooltip label={!is_activated ? t('Menu.sankeyOSPDisabled') : ''} >

          <Box
            as='span'
            layerStyle='menuconfigpanel_row_2cols'
          >
            <Box
              as='span'
              layerStyle='menuconfigpanel_option_name'
            >
              {t('Noeud.img_src')}
            </Box>
            <Box
              as='span'
              layerStyle='options_2cols'
            >
              <Button
                variant='menuconfigpanel_option_button_left'
                onClick={() => {
                  if (_load_image.current) {
                    _load_image.current.name = ''
                    _load_image.current.click()
                  }
                }}
              >
                <FaFileImport />
              </Button>
              <Button
                variant='menuconfigpanel_option_button_right'
                onClick={() => {
                  selected_nodes.forEach(n => n.image_src = '')
                  redrawIllustrationAndRefresh()
                }}
              >
                <FontAwesomeIcon icon={faDeleteLeft} />
              </Button>
            </Box>
            <Input
              ref={_load_image}
              style={{ display: 'none' }}
              accept='image/*'
              type="file"
              disabled={!is_activated}
              onChange={(evt: ChangeEvent) => {
                const files = (evt.target as HTMLFormElement).files
                const reader = new FileReader()
                reader.onload = (() => {
                  return (e: ProgressEvent<FileReader>) => {
                    const resultat = (e.target as FileReader).result
                    const res = resultat?.toString().replaceAll('=', '')
                    selected_nodes.forEach(n => n.image_src = (res as string))
                    redrawIllustrationAndRefresh()

                  }
                })()
                reader.readAsDataURL(files[0])
              }}
            />
          </Box>
        </OSTooltip>
        : <></>
    }
  </Box>

  // Content of the tab that change depending on the illustration we want to make
  const content_tab = <Box
    layerStyle='menuconfigpanel_grid'
  >
    {/* Visibilite du noeud */}

    <Checkbox
      variant='menuconfigpanel_option_checkbox'
      // isIndeterminate={isAllNodeVisible[1]}
      isChecked={isAllNodeVisible}
      onChange={(evt) => {
        selected_nodes.forEach(element => (element.shape_visible = evt.target.checked))

        redrawAndRefresh()
      }}
    >
      <OSTooltip label={t('Noeud.apparence.tooltips.Visibilité')} >
        {t('Noeud.apparence.Visibilité')}
      </OSTooltip>
      {
        isAttributeOverloaded(selected_nodes, 'shape_visible') ?
          TooltipValueSurcharge('node_var', t) :
          <></>
      }
    </Checkbox>

    <OSTooltip label={!is_activated ? t('Menu.sankeyOSPDisabled') : ''} >

      <Box
        as='span'
        layerStyle='menuconfigpanel_row_2cols'
      >
        <Box
          as='span'
          layerStyle='menuconfigpanel_option_name'
        >
          {t('Noeud.illustration_type')}
        </Box>
        <Box
          as='span'
          layerStyle='options_3cols'
        >
          <Button
            variant={
              button_icon_or_image !== 'none' ?
                'menuconfigpanel_option_button_left' :
                'menuconfigpanel_option_button_activated_left'
            }
            isDisabled={!is_activated}
            onClick={() => {
              selected_nodes.forEach(d => {
                d.iconVisible = false
                d.is_image = false
              })
              redrawIllustrationAndRefresh()
            }}
          >
            <FaEyeSlash />
          </Button>
          <Button
            variant={
              button_icon_or_image !== 'icon' ?
                'menuconfigpanel_option_button_center' :
                'menuconfigpanel_option_button_activated_center'
            }
            isDisabled={!is_activated}
            onClick={() => {
              selected_nodes.forEach(d => {
                d.is_image = false
                d.iconVisible = true
              })
              redrawIllustrationAndRefresh()
            }}
          >
            {t('Noeud.icon.icon')}
          </Button>
          <Button
            variant={
              button_icon_or_image !== 'image' ?
                'menuconfigpanel_option_button_right' :
                'menuconfigpanel_option_button_activated_right'
            }
            isDisabled={!is_activated}
            onClick={() => {
              selected_nodes.forEach(d => {
                d.is_image = true
                d.iconVisible = false
              })
              redrawIllustrationAndRefresh()
            }}
          >
            Image
          </Button>
        </Box>
      </Box>
    </OSTooltip>

    {
      button_icon_or_image === 'icon' ?
        content_icon :
        button_icon_or_image === 'image' ?
          content_image :
          <></>
    }

  </Box>

  if (menu_for_modal && !show_menu_node_icon) {
    return [<></>]
  }
  if (menu_for_modal && show_menu_node_icon) {
    return [content_tab]
  }

  return <TabPanel>
    {content_tab}
  </TabPanel>
}

export const OSPHyperLink: FunctionComponent<OSPHyperLinkFType> = ({
  applicationData,
  is_activated,
}) => {
  const {new_data}=applicationData
  const {drawing_area,t}=new_data
  const selected_nodes=drawing_area.selected_nodes_list

  const [,setCount]=useState(0)

  const hasHyperLink = () => {
    let visible = ''
    visible = selected_nodes[0]?.hyperlink ?? ''
    return visible
  }
  const node_hyperlink = hasHyperLink()
  // const data_plus = data as OSPData
  const content_image_tab = selected_nodes.length > 0 ?
    <Box
      layerStyle='menuconfigpanel_grid'
    >
      <OSTooltip label={!is_activated ? t('Menu.sankeyOSPDisabled') : ''} >

        <Box
          as='span'
          layerStyle='menuconfigpanel_row_2cols'
        >
          <Box
            as='span'
            layerStyle='menuconfigpanel_option_name'
          >
            {t('Noeud.HL')}
          </Box>
          <InputGroup
            variant='menuconfigpanel_option_input'
          >
            <Input
              placeholder={node_hyperlink}
              onChange={(evt) => {
                selected_nodes
                  .forEach(d => d.hyperlink = evt.target.value)
                setCount(a=>a+1)
              }}
            />
          </InputGroup>
        </Box>
      </OSTooltip>

      {/* Open Hyperlink */}
      <OSTooltip label={!is_activated ? t('Menu.sankeyOSPDisabled') : ''} >
        <Box
          as='span'
          layerStyle='menuconfigpanel_row_2cols'
        >
          <Box
            as='span'
            layerStyle='menuconfigpanel_option_name'
          >
            {t('Noeud.open_HL')}
          </Box>
          <Button
            variant='menuconfigpanel_option_button'
            onClick={() => {
              window.open(node_hyperlink)
            }}
          >
            <FontAwesomeIcon icon={faUpRightFromSquare} />
          </Button>
        </Box>
      </OSTooltip>
    </Box> :
    <></>

  return <TabPanel>
    {content_image_tab}
  </TabPanel>
}


// const node_mouse_click = (
//   applicationData: OSPApplicationDataType,
//   applicationState: OSPElementsSelectedType,
//   uiElementsRef: uiElementsRefType,
//   animating: MutableRefObject<boolean>,
//   event: React.MouseEvent<HTMLButtonElement>,
//   d: SankeyNode,
//   accept_simple_click: { current: boolean },
//   GetLinkValue: GetLinkValueFuncType,
//   ComponentUpdater: ComponentUpdaterType,
// ) => {
//   const { data, display_nodes } = applicationData

//   const sankeyTooltip = d3.select('.sankey-tooltip')
//   // shift + click on a node launch a animation that show all sub path from this node
//   if (event.shiftKey) {
//     event.preventDefault()
//     animating.current = true
//     // Animation des flux du Sankey
//     sankeyTooltip.style('opacity', 0)
//     // on donne ici un style temporaire, les parametres initiaux restent dans le attr que l'on pourra récupérer plus tard pour la remise en état du sankey
//     d3.select(' .opensankey #svg').selectAll('.arrow').attr('fill', '#dddddd')

//     d3.select(' .opensankey #svg').selectAll('.link').style('stroke', '#dddddd')
//     d3.select(' .opensankey #svg').selectAll('.node').style('fill', '#dddddd')
//     d3.select(' .opensankey #svg').selectAll('.link_value').style('display', 'none')
//     const nodeDisplay = [d.idNode]
//     const node_visible = Object.values(display_nodes).map(n => n.idNode)

//     branchAnimate(data, d, nodeDisplay, node_visible, GetLinkValue)
//     let time_to_animate = 500
//     //calcul la profondeur max de nouveau flux (le nombre de nouveau flux consecutif ) afin de calculer le temps qu'il faut avant de changer la variable set_view
//     const horizontal_indexes_per_nodes_ids: { [node_id: string]: number } = {}
//     const possible_recycling_links_ids: string[] = []

//     computeHorizontalIndex(
//       d,
//       0,
//       Object.keys(display_nodes),
//       [],
//       possible_recycling_links_ids,
//       horizontal_indexes_per_nodes_ids,
//       data.links,
//       data.nodes)

//     // Get longest path to animate possible (number of path before we get to a node without output link  )
//     // so we can determinate a timeout before reseting the sankey
//     let nb_animation = Object.values(horizontal_indexes_per_nodes_ids).reduce((a, b) => Math.max(a, b), -Infinity)
//     nb_animation = (nb_animation !== undefined) ? nb_animation : 0
//     time_to_animate += nb_animation * 2000

//     setTimeout(function () {
//       animating.current = false
//       applicationData.set_data({ ...data })
//     }, time_to_animate)
//   } else if (window.SankeyToolsStatic === true) {
//     const n = d as OSPNode
//     if (n.hyperlink !== undefined && n.hyperlink !== '') {
//       window.open(n.hyperlink)
//     }
//   } else if (!window.SankeyToolsStatic && event.altKey) {
//     const n = d as OSPNode
//     if (n.hyperlink !== undefined && n.hyperlink !== '') {
//       window.open(n.hyperlink)
//     }
//   } else {
//     SimpleGNodeClick(
//       uiElementsRef,
//       applicationState,
//       event,
//       d,
//       accept_simple_click,
//       ComponentUpdater
//     )

//   }
// }

// const branchAnimate = (
//   data: SankeyData,
//   nodeData: SankeyNode,
//   nodeDisplay: string[],
//   node_visible: string[],
//   GetLinkValue: GetLinkValueFuncType
// ) => {
//   const data_plus = data as OSPData

//   // Permet la progation de l'animation sur l'ensemble du Sankey
//   const nodeStart = nodeData.idNode

//   // on pourrait aussi evnetuellement faire un clone des noeuds
//   d3.select(' .opensankey #shape_' + nodeData.idNode).style('fill', d3.select(' .opensankey #shape_' + nodeData.idNode).attr('fill'))
//   d3.select(' .opensankey #text_' + nodeData.idNode).style('fill', d3.select(' .opensankey #shape_' + nodeData.idNode).attr('fill'))

//   const glinks = (d3.select(' .opensankey #svg').selectAll('.gg_links') as d3.Selection<SVGElement, OSPLink, HTMLElement, OSPLink>)
//     .filter(function (d) {
//       return d.idSource === nodeStart
//     })
//   // On fait une copie du link pour son animation, le flux originel reste en claire et la copie 'remplie' le path
//   const tmpLinks = glinks.clone(true).raise()
//   tmpLinks.selectAll('.link')
//     .each(function () {
//       const totalLength = (this as SVGGeometryElement).getTotalLength()

//       d3.select(this)
//         .attr('stroke-dasharray', totalLength + ' ' + totalLength)
//         .attr('stroke-dashoffset', totalLength)
//         .style('stroke', function (this) {
//           // on recupere les paramêtres initiaux du stroke
//           return d3.select(this).attr('stroke')
//         })

//     })
//     .transition()
//     .duration(2000)
//     .attr('stroke-dashoffset', 0)
//     .on('end', function (this) {
//       const idLink = d3.select(this).attr('id').replace('path_', '')
//       const idTarget = data.links[idLink].idTarget
//       // Modification des arrows après l'animation
//       const arrow = d3.selectAll(' .opensankey #path_' + idLink + '_arrow')
//       if (arrow !== undefined && arrow != null) {
//         const colorTarget = (ReturnValueNode(data, data.nodes[idTarget], 'shape_visible')) ? NodeColor(data.nodes[idTarget], data) : ((data_plus.nodes[idTarget].iconVisible) ? data_plus.nodes[idTarget].iconColor : 'grey')
//         // const t=(data.links[idLink].gradient && data.colorMap=='no_colormap')?colorTarget:d3.select(this).attr('stroke')
//         const l_grad = OSPReturnValueLink(data_plus, data_plus.links[idLink], 'gradient')
//         const t = (l_grad) ? colorTarget : LinkStrokeOSTyped(data.links[idLink], data, GetLinkValue)
//         if (t) {
//           arrow.attr('fill', t)
//           arrow.attr('opacity', 0.85)
//         }
//       }

//       // reaffichage des link value après l'animation
//       d3.select(((this as unknown) as { parentNode: d3.BaseType }).parentNode).select('.link_value')
//         .style('display', 'inline')
//       //Propagration de l'animation sur les flux sortant du target_node
//       // on teste si le noeud est déjà passé cela permet de régler le problème des links à 'recycling'
//       if (!nodeDisplay.includes(idTarget)) {
//         nodeDisplay.push(idTarget)
//         let max = 0
//         const tmp = direct_son_as_distant_sibling(data, nodeData, data_plus.nodes[idTarget], 0, [idLink], node_visible)

//         max = (tmp > max) ? tmp : max
//         setTimeout(() => {
//           branchAnimate(data, data_plus.nodes[idTarget], nodeDisplay, node_visible, GetLinkValue)
//         }, max * 2000)
//       }
//     })
// }

// const direct_son_as_distant_sibling = (
//   data: SankeyData,
//   n: SankeyNode,
//   target: SankeyNode,
//   deep: number,
//   link_to_avoid: string[],
//   display_nodes_id: string[],
// ) => {
//   //Cherche à savoir si un noeud qui recoit directement le flux de n ai aussi un path inderectement vers ce meme noeud
//   //exemple : n0 -> n1  et n0 -> n2 -> n1
//   //fonction utilisé pour que le noeud qui recoit le flux direct attend les chemin indirect avant de lancer les animations suivantes
//   const next_link = n.outputLinksId.filter(f => (!ReturnValueLink(data, data.links[f], 'recycling') && !Object.values(link_to_avoid).includes(f) && display_nodes_id.includes(data.links[f].idTarget)))
//   let max = 0
//   const data_plus = data as OSPData

//   if (n.idNode === target.idNode) {
//     return deep - 1
//   } else if (next_link.length > 0) {
//     next_link.map(id => {
//       const next_node = data_plus.nodes[data.links[id].idTarget]
//       //utilise array.concat pour ne pas modifier le tableau original (contrairement a .push)
//       const to_avoid = link_to_avoid.concat([id])
//       const tmp = direct_son_as_distant_sibling(data, next_node, target, deep + 1, to_avoid, display_nodes_id)
//       max = (tmp > max) ? tmp : max
//     })
//   }
//   return max

export const ContextNodeIcon: ContextNodeIconFType = (
  application_data
) => {
  const icon_open_modal = <FontAwesomeIcon style={{ float: 'right' }} icon={faUpRightFromSquare} />
  return <Button
    variant='menuconfigpanel_option_button'
    onClick={() => {
      application_data.new_data.menu_configuration.dict_setter_show_dialog_plus.ref_setter_show_menu_node_icon.current!(true)
      application_data.new_data.drawing_area.node_contextualised=undefined // unselect contextualised node
      application_data.new_data.menu_configuration.ref_to_menu_context_nodes_updater.current() // update context menu node, it should close because there no more contextualised node
    }}
  >
    {application_data.new_data.t('Noeud.icon.icon')}
    {icon_open_modal}
  </Button>
}
// /**
//  * Shift all elements (ZDT/Nodes) not selected to the opposing direction of the event
//  *
//  * @param {((SankeyNode|OSPLabel)[])} out_of_zone_item
//  * @param {{ dx: number; dy: number,x:number,y:number }} event
//  * @param {(SankeyNode|OSPLabel)} dragged
//  * @param {SankeyData} data
//  * @param {{current:SankeyNode[]}} multi_selected_nodes
//  * @param {{current:OSPLabel[]}} multi_selected_label
//  */
// export const OpposingDragElementsPlus: OpposingDragElementsPlusFType = (
//   out_of_zone_item: (SankeyNode | OSPLabel)[],
//   event: { dx: number; dy: number, x: number, y: number },
//   dragged: SankeyNode | OSPLabel,
//   applicationData,
//   applicationState,

// ) => {
//   const { data } = applicationData
//   const { multi_selected_label } = applicationState
//   OpposingDragElements(out_of_zone_item as SankeyNode[], event, dragged as SankeyNode, applicationData, applicationState)

//   if ((out_of_zone_item[0].x <= 0 && event.x < 0) || (out_of_zone_item[0].x <= 0 && event.dx < 0)) {
//     // Shift not selected zdt to opposing direction
//     Object.values((data as unknown as { labels: OSPLabel[] }).labels).forEach(lb => {
//       if (!multi_selected_label.current.includes(lb)) {
//         const new_pos_x = lb.x - event.dx
//         lb.x = new_pos_x
//         d3.select(' .opensankey #' + lb.idLabel).attr('transform', 'translate(' + lb.x + ',' + lb.y + ')')
//         // shift handles of non dragged zdt
//         d3.selectAll(' .opensankey #g_label_handles #gg_zdt_handles_' + lb.idLabel + ' .zdt_handles').nodes().forEach(g_zdt_h => {
//           const x = +d3.select(g_zdt_h).attr('x')
//           d3.select(g_zdt_h).attr('x', x - event.dx)
//         })

//       }
//     })
//   }

//   if ((out_of_zone_item[0].y <= 0 && event.y < 0) || (out_of_zone_item[0].y <= 0 && event.dy < 0)) {
//     // Shift zdt to opposing direction
//     Object.values((data as unknown as { labels: OSPLabel[] }).labels).forEach(lb => {
//       if (!multi_selected_label.current.includes(lb)) {
//         const new_pos_y = lb.y - event.dy
//         lb.y = new_pos_y
//         d3.select(' .opensankey #' + lb.idLabel).attr('transform', 'translate(' + lb.x + ',' + lb.y + ')')
//         // shift handles of non dragged zdt
//         d3.selectAll(' .opensankey #g_label_handles #gg_zdt_handles_' + lb.idLabel + ' .zdt_handles').nodes().forEach(g_zdt_h => {
//           const y = +d3.select(g_zdt_h).attr('y')
//           d3.select(g_zdt_h).attr('y', y - event.dy)
//         })
//       }
//     })
//   }
// }

// export const OSPNodeDragEvent: OSPNodeDragEventFType = (
//   applicaTionData,
//   applicationState,
//   applicationContext,
//   alt_key_pressed: boolean,
//   ComponentUpdater,
//   node_function,
//   link_function,
//   applicationDraw
// ) => {
//   const { data } = applicaTionData
//   const { ref_getter_mode_selection } = applicationState

//   const inv_scale = d3.scaleLinear()
//     .domain([0, 100])
//     .range([0, data.user_scale])
//   const scale = d3.scaleLinear()
//     .range([0, 100])
//     .domain([0, data.user_scale])

//   if (ref_getter_mode_selection.current === 's' && window.SankeyToolsStatic !== true) {
//     (d3.selectAll('.ggg_nodes') as d3.Selection<SVGGElement, OSPNode, d3.BaseType, unknown>).call(
//       OSPDragGNodeEvent(applicaTionData, applicationState,
//         applicationContext,
//         alt_key_pressed, scale, inv_scale, ComponentUpdater, node_function, link_function,
//         applicationDraw
//       )
//     )
//   }
//   (d3.select('.opensankey #svg') as d3.Selection<Element, unknown, HTMLElement, unknown>).call(d3.drag<Element, unknown, HTMLElement>()
//     .subject(Object)
//     .filter(evt => {
//       evt.stopPropagation()
//       evt.preventDefault()

//       return d3.select(evt.target).attr('id') === 'svg' && evt.which === 2
//     })
//     .on('start', () => SvgDragMiddleMouseStart())
//     .on('drag', evt => {
//       SvgDragMiddleMouseMove(evt, data)
//       // Drag ZDT too
//       Object.values((data as unknown as { labels: OSPLabel[] }).labels).forEach(lb => {
//         const new_pos_x = lb.x + evt.dx
//         const new_pos_y = lb.y + evt.dy
//         lb.x = new_pos_x
//         lb.y = new_pos_y
//         d3.select(' .opensankey #' + lb.idLabel).attr('transform', 'translate(' + lb.x + ',' + lb.y + ')')
//       })
//     })
//     .on('end', function (_, n) {
//       setTimeout(() => {
//         const node = n as OSPNode

//         // update all nodes connected to dragged node & all links connected to these nodes
//         const node_to_update: SankeyNode[] = [node]
//         node.outputLinksId.forEach(lid => node_to_update.push(data.nodes[data.links[lid].idTarget]))
//         node.inputLinksId.forEach(lid => node_to_update.push(data.nodes[data.links[lid].idSource]))

//         let link_to_update: OSPLink[] = []
//         node_to_update.forEach(node => {
//           link_to_update = link_to_update.concat(node.outputLinksId.map(lid => data.links[lid]))
//           link_to_update = link_to_update.concat(node.inputLinksId.map(lid => data.links[lid]))
//         })
//         node_function.RedrawNodes(node_to_update)
//         link_function.RedrawLinks(link_to_update)
//         actualizeDrawAreaFrame(applicaTionData, applicationDraw.GetSankeyMinWidthAndHeight)
//       }, 100)
//     })
//   )
// }

// const OSPDragGNodeEvent = (
//   applicationData: OSPApplicationDataType,
//   applicationState: OSPElementsSelectedType,
//   applicationContext: OSPApplicationContextType,
//   alt_key_pressed: boolean,
//   scale: (t: number) => number,
//   inv_scale: (t: number) => number,
//   ComponentUpdater: ComponentUpdaterType,
//   node_function: OSPNodeFuntionType,
//   link_function: OSPLinkFuntionType,
//   applicationDraw: applicationDrawType
// ) => {
//   const { ref_getter_mode_selection } = applicationState
//   const node_visible = [] as string[]
//   return d3.drag<SVGGElement, OSPNode>()
//     .subject(Object)
//     .on('start', () => {
//       if (ref_getter_mode_selection.current === 's' && window.SankeyToolsStatic !== true) {
//         d3.selectAll('.node_shape').nodes().forEach(element => {
//           node_visible.push(d3.select(element).attr('id'))
//         })
//         hideLinkOnDragElement(applicationData)
//       }
//     })
//     .on('drag', function (event, node) {
//       if (ref_getter_mode_selection.current === 's') {
//         if (d3.select(event.subject.sourceEvent.target).node().tagName === 'tspan' && alt_key_pressed && !(window.SankeyToolsStatic ? window.SankeyToolsStatic : false)) {
//           drag_node_text(node, event)
//         } else {
//           OSPDragNodes(applicationData,
//             applicationState, applicationContext,
//             node,
//             event,
//             applicationDraw.GetSankeyMinWidthAndHeight,
//             scale, inv_scale, node_visible, ComponentUpdater, link_function
//           )
//         }
//       }
//     })
//     .on('end', () => {
//       if (ref_getter_mode_selection.current === 's') {
//         setTimeout(() => {
//           if (d3.select(document.activeElement).attr('class') !== 'input_label') {
//             node_function.RedrawNodes(Object.values(applicationData.display_nodes))
//             link_function.RedrawLinks(Object.values(applicationData.display_links))
//           }
//           applicationDraw.resizeCanvas()
//         }, 100)
//       }
//     })
// }

// const OSPDragNodes = (
//   applicationData: OSPApplicationDataType,
//   applicationState: OSPElementsSelectedType,
//   applicationContext: OSPApplicationContextType,
//   node: OSPNode,
//   event: { dx: number; dy: number, x: number, y: number },
//   GetSankeyMinWidthAndHeight: GetSankeyMinWidthAndHeightFuncType,
//   scale: (t: number) => number,
//   inv_scale: (t: number) => number,
//   node_visible: string[],
//   ComponentUpdater: ComponentUpdaterType,
//   link_function: OSPLinkFuntionType
// ) => {
//   RemoveAnimate()
//   const { data, } = applicationData
//   const { multi_selected_nodes } = applicationState

//   // Cherche si des element seront hors zone si on les drag
//   // Si c'est le cas, pousse les éléments qui ne sont pas sélectionnés dans la direction opposé
//   const out_of_zone_item = OSPReturnOutOfBoundElements(node, data, event, multi_selected_nodes, node_visible)

//   // Pousse les element non sélectionnés dans la direction opposé
//   if (out_of_zone_item.length > 0) {
//     OpposingDragElementsPlus(out_of_zone_item, event, node, applicationData, applicationState)
//   }
//   OSPDragElements(
//     applicationData, applicationState, applicationContext, node, event, GetSankeyMinWidthAndHeight, scale, inv_scale, ComponentUpdater, link_function
//   )
// }

// export const OSPDragElements: OSPDragElementsFType = (
//   applicationData,
//   applicationState,
//   applicationContext,
//   dragged: OSPNode | OSPLabel,
//   event: { dx: number; dy: number, x: number, y: number },
//   GetSankeyMinWidthAndHeight: GetSankeyMinWidthAndHeightFuncType,
//   scale: (t: number) => number,
//   inv_scale: (t: number) => number,
//   ComponentUpdater: ComponentUpdaterType,
//   link_function

// ) => {
//   const { multi_selected_label } = applicationState

//   DragElements(
//     dragged as SankeyNode, applicationData, applicationState, applicationContext, event, GetSankeyMinWidthAndHeight,
//     scale, inv_scale, ComponentUpdater, link_function
//   )

//   // Drag zdt too
//   multi_selected_label.current.map(l => {
//     const new_pos_x = l.x + event.dx
//     const new_pos_y = l.y + event.dy
//     l.x = (new_pos_x >= 0) ? new_pos_x : 0
//     l.y = (new_pos_y > 0) ? new_pos_y : 0

//     const pos_zdt = sizeOfZdtInDrawArea(l)
//     const margin = applicationData.data.grid_square_size * 2
//     if ((pos_zdt[0] + margin) > applicationData.data.width) {
//       const svgSankey = d3.select('.opensankey #svg')
//       svgSankey.style('width', (pos_zdt[0] + margin) + 'px')
//     }
//     if ((pos_zdt[1] + margin) > applicationData.data.height) {
//       const svgSankey = d3.select('.opensankey #svg')
//       svgSankey.style('height', (pos_zdt[1] + margin) + 'px')
//     }

//     d3.select(' .opensankey #' + l.idLabel).attr('transform', 'translate(' + l.x + ',' + l.y + ')')

//     d3.selectAll('.opensankey #gg_zdt_handles_' + l.idLabel + ' .zdt_handles').nodes().forEach(el => {
//       const new_cx = Number(d3.select(el).attr('x'))
//       const new_cy = Number(d3.select(el).attr('y'))
//       d3.select(el).attr('x', (l.x <= 0) ? new_cx : (new_cx + event.dx))
//       d3.select(el).attr('y', (l.y <= 0) ? new_cy : (new_cy + event.dy))
//     })
//   })
// }

// export const OSPReturnOutOfBoundElements: OSPReturnOutOfBoundElementsFType = (
//   dragged: SankeyNode | OSPLabel,
//   data: SankeyData,
//   event: { dx: number; dy: number, x: number, y: number },
//   multi_selected_nodes: { current: SankeyNode[] }, node_visible: string[]
// ) => {
//   // Cherche si des noeuds seront hors zone si on les drag
//   // Si c'est le cas, pousse les éléments qui ne sont pas sélectionnés dans la direction opposé
//   const out_of_zone_item: (OSPNode | OSPLabel)[] = ReturnOutOfBoundElement(dragged as SankeyNode, data, event, multi_selected_nodes, node_visible) as (OSPNode | OSPLabel)[]

//   Object.values((data as unknown as { labels: OSPLabel[] }).labels).filter(lb => {
//     return (lb.x <= 0 && event.dx < 0) || (lb.y <= 0 && event.dy < 0) || (lb.x <= 0 && event.x < 0) || (lb.y <= 0 && event.y < 0)
//   }).forEach(lb => out_of_zone_item.push(lb))

//   return out_of_zone_item
// }

// export const scale = d3.scaleLinear()
//   .domain([0, 100])
//   .range([0, 100])

// export const inv_scale = d3.scaleLinear()
//   .domain([0, 100])
//   .range([0, 100])


// export const sizeOfZdtInDrawArea = (n: OSPLabel) => {
//   return [(n.x + n.label_width), (n.y + n.label_height)]
// }