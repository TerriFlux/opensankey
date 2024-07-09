import React, { FunctionComponent, MutableRefObject, useRef, useState } from 'react'
import {
  FaAlignCenter,
  FaAlignLeft,
  FaAlignRight,
  FaArrowDown,
  FaArrowLeft,
  FaArrowRight,
  FaArrowUp,
  FaBold,
  FaEye,
  FaEyeSlash,
  FaItalic,
  FaLock,
  FaLockOpen,
  FaChevronDown,
  FaUndo
} from 'react-icons/fa'
import { TFunction } from 'i18next'

import {
  Box,
  Button,
  Checkbox,
  Input,
  InputGroup,
  InputRightAddon,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Select,
  Slider,
  SliderFilledTrack,
  SliderMark,
  SliderThumb,
  SliderTrack,
  TabPanel,
} from '@chakra-ui/react'

import { SankeyData, SankeyNode, SankeyNodeAttrLocal, SankeyNodeStyle } from '../types/Types'
import {
  ApplyStyleToNodes,
  AssignNodeValueToCorrectVar,
  CutName,
  IsAllNodeAttrSameValue,
  IsNodeDisplayingValueLocal,
  OSTooltip,
  ReturnCorrectNodeAttributeValue,
  ReturnValueNode,
  TooltipValueSurcharge,
} from './SankeyUtils'
import { OpenSankeyConfigurationNodesAttributesFType, SankeyWrapperConfigInModalOrMenuType } from './types/SankeyMenuConfigurationNodesAttributesTypes'

export const OpenSankeyConfigurationNodesAttributes : FunctionComponent<OpenSankeyConfigurationNodesAttributesFType> = ({
  applicationContext,
  applicationData,
  applicationState,
  menu_for_style,
  ref_selected_style_node,
  advanced_appearence_content,
  advanced_label_content,
  advanced_label_value_content,
  link_function,
  ComponentUpdater,
  updateMenus,
  node_function
}) => {
  const { t } = applicationContext
  const { data } = applicationData
  const { multi_selected_nodes } = applicationState
  const [forceUpdate,setForceUpdate]=useState(false)
  const parameter_to_modify=(menu_for_style)?data.style_node:data.nodes
  const selected_parameter=(menu_for_style)?[data.style_node[ref_selected_style_node.current]]:multi_selected_nodes.current
  const {updateComponentMenuConfigNodeAppearence,updateComponentMenuConfigNode}= ComponentUpdater
  const {RedrawNodes}=node_function
  const {RedrawLinks}=link_function
  updateComponentMenuConfigNodeAppearence.current=()=>setForceUpdate(!forceUpdate)

  const element_to_update=menu_for_style?Object.values(applicationData.display_nodes):multi_selected_nodes.current

  const updateMenuConfigNode=()=>{
    ComponentUpdater.updateComponenSaveInCache.current(false)
    RedrawNodes(element_to_update)
    if(!menu_for_style){
      updateComponentMenuConfigNode.current()
    }
    ComponentUpdater.updateComponenSaveInCache.current(false)
    setForceUpdate(!forceUpdate)
  }

  const updateLinkAttachedToNodes=()=>{
    if(!menu_for_style){
      // Redraw link attached to modified node when the modification to the node
      // modify links path
      let link_to_update:string[]=[]
      multi_selected_nodes.current.forEach(n=>{
        link_to_update=link_to_update.concat(n.outputLinksId)
        link_to_update=link_to_update.concat(n.inputLinksId)
      })
      link_to_update=[...new Set(link_to_update)]
      const list_links=link_to_update.map(lid=>data.links[lid])
      RedrawLinks(list_links)
    } else {
      RedrawLinks(Object.values(applicationData.display_links))
    }
  }

  const list_of_key = [
    'shape_visible',
    'colorSustainable',
    'label_visible',
    'label_color',
    'label_background',
    'show_value',
    'font_family',
    'bold',
    'uppercase',
    'italic',
    'label_vert',
    'label_horiz',
    'label_vert_valeur',
    'label_horiz_valeur',
    'shape',
    'node_arrow_angle_factor',
    'node_arrow_angle_direction',
    'color'
  ] as (keyof SankeyNodeAttrLocal)[]

  const list_value=IsAllNodeAttrSameValue(data,selected_parameter, list_of_key, menu_for_style)

  const style_of_selected_nodes = () => {
    let style_to_display = 'Aucun'
    if (multi_selected_nodes.current.length != 0) {
      style_to_display = multi_selected_nodes.current[0].style
      let inchangee = true
      multi_selected_nodes.current.map(d => {
        inchangee = (d.style == style_to_display) ? inchangee : false
      })
      if (style_to_display != '' && style_to_display !== undefined) {
        return (inchangee) ? CutName(data.style_node[style_to_display].name,20 ) : t('Noeud.multi_style')
      } else {
        return 'Aucun'
      }
    } else {
      return style_to_display
    }
  }

  // Check if the 1st selected node has a tag selected from the group tag 'Type de noeud' so we can disable the selection of the node shape
  const content_appearence=<Box layerStyle='menuconfigpanel_grid' >

    {/* Visibilite du noeud */}
    <Box as='span' layerStyle='menuconfigpanel_part_title_1' >
      <Checkbox
        variant='menuconfigpanel_part_title_1_checkbox'
        icon={(list_value['shape_visible'][0] as boolean)?<FaEye/>:<FaEyeSlash/>}
        isChecked={list_value['shape_visible'][0] as boolean}
        isIndeterminate={list_value['shape_visible'][1]}
        onChange={(evt) => {
          Object.values(parameter_to_modify)
            .filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode))
            .forEach(d => AssignNodeValueToCorrectVar(d,'shape_visible',evt.target.checked,menu_for_style))
          updateMenus[1](!updateMenus[0])
        }}
      >
        <OSTooltip label={t('Noeud.apparence.tooltips.Visibilité')}>
          {t('Noeud.apparence.Visibilité')}
        </OSTooltip>
        {
          IsNodeDisplayingValueLocal(multi_selected_nodes, 'shape_visible', menu_for_style)?
            TooltipValueSurcharge('node_var',t):
            <></>
        }

      </Checkbox>
    </Box>

    {/* In this position of the array, there is an input who can change the node visibility (hide if intermediary)(dev) */}
    {advanced_appearence_content.splice(1,1)}

    <Box as='span' layerStyle='menuconfigpanel_part_title_2' >
      {t('Menu.edition')}
    </Box>

    {/* Couleur du noeud */}
    <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('Noeud.apparence.Couleur')}
        {
          IsNodeDisplayingValueLocal(multi_selected_nodes,'color',menu_for_style)?(
            <>{TooltipValueSurcharge('node_var_',t)}</>
          ):(
            <></>
          )
        }
      </Box>
      <Box layerStyle='option_with_activation'>
        <OSTooltip label={t('Noeud.apparence.tooltips.Couleur')}>
          <Input
            variant='menuconfigpanel_option_input_color'
            type='color'
            value={
              (!list_value['color'][1]) ? (
                list_value['color'][0]) as string : (
                '#ffffff'
              )
            }
            onChange={evt=>{
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).forEach(d => AssignNodeValueToCorrectVar(d,'color',evt.target.value,menu_for_style))
              updateMenuConfigNode()
              updateLinkAttachedToNodes()

            }}
          />
        </OSTooltip>
        <OSTooltip label={t('Noeud.apparence.tooltips.CouleurPérenne')}>
          <Button
          //Si la valeur est a true alors la couleur des noeuds reste celle sélectionné loreque que l'on affiche les flux celon leur étiquettes
            variant={
              list_value['colorSustainable'][0]?
                'menuconfigpanel_option_button_activated':
                'menuconfigpanel_option_button'}
            onClick={() => {
              Object
                .values(parameter_to_modify)
                .filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode))
                .forEach(d => AssignNodeValueToCorrectVar(d,'colorSustainable',!list_value['colorSustainable'][0],menu_for_style))
              updateMenuConfigNode()
              updateMenuConfigNode()
            }}
          >
            {list_value['colorSustainable'][0]?<FaLock/>:<FaLockOpen/>}
          </Button>
        </OSTooltip>
      </Box>
    </Box>

    {/* Forme du noeud */}
    <OSTooltip label={t('Noeud.apparence.tooltips.Forme')}>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name' >
          {t('Noeud.apparence.Forme')}
          {(IsNodeDisplayingValueLocal(multi_selected_nodes,'shape',menu_for_style)?
            <>{TooltipValueSurcharge('node_var_',t)}</>:
            <></>)}
        </Box>
        <Box layerStyle='options_3cols' >
          <Button
            value="ellipse"
            variant={
              list_value['shape'][0]==='ellipse'?
                'menuconfigpanel_option_button_activated':
                'menuconfigpanel_option_button'}
            onClick={() => {
              Object
                .values(parameter_to_modify)
                .filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode))
                .forEach(d =>AssignNodeValueToCorrectVar(d,'shape','ellipse',menu_for_style))
              updateMenuConfigNode()
              updateLinkAttachedToNodes()
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill='#78C2AD'
              stroke='currentColor'
              viewBox='0 0 17 17'
              width="1.5rem"
              height="1.5rem"
            >
              <path d="M 16.440445,8.4666672 A 7.9737778,7.9737773 0 0 1 8.4666672,16.440444 7.9737778,7.9737773 0 0 1 0.4928894,8.4666672 7.9737778,7.9737773 0 0 1 8.4666672,0.49288988 7.9737778,7.9737773 0 0 1 16.440445,8.4666672 Z"/>
            </svg>
            {/* {t('Noeud.apparence.Cercle')} */}
          </Button>

          <Button
            variant={
              list_value['shape'][0]==='rect'?
                'menuconfigpanel_option_button_activated':
                'menuconfigpanel_option_button'}
            onClick={() => {
              Object
                .values(parameter_to_modify)
                .filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode))
                .forEach(d =>AssignNodeValueToCorrectVar(d,'shape','rect',menu_for_style))
              updateMenuConfigNode()
              updateLinkAttachedToNodes()

            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill='#78C2AD'
              stroke='currentColor'
              viewBox='0 0 17 17'
              width="1.5rem"
              height="1.5rem"
            >
              <path d="M 0.385555,0.385555 H 16.547779 V 16.547779 H 0.385555 Z"/>
            </svg>
            {/* {t('Noeud.apparence.Rectangle')} */}
          </Button>

          <Button
            variant={
              list_value['shape'][0]==='arrow'?
                'menuconfigpanel_option_button_activated':
                'menuconfigpanel_option_button'
            }
            onClick={() => {
              Object
                .values(parameter_to_modify)
                .filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode))
                .forEach(d =>AssignNodeValueToCorrectVar(d,'shape','arrow',menu_for_style))
              updateMenuConfigNode()
              updateLinkAttachedToNodes()
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill='#78C2AD'
              stroke='currentColor'
              viewBox='0 0 17 17'
              width="1.5rem"
              height="1.5rem"
            >
              <path d="M 0.11499051,0.11500028 H 10.015883 L 16.844087,8.5149428 10.015883,16.818334 H 0.11499051 L 6.601784,8.5149428 Z"/>
            </svg>
            {/* {t('Noeud.apparence.arrow')} */}
          </Button>
        </Box>
      </Box>
    </OSTooltip>

    {
      /* Change the angle of the arrow shaped node */
      list_value['shape'][0]==='arrow'?
        <Box layerStyle='menuconfigpanel_grid'>
          <OSTooltip label={t('Noeud.apparence.tooltips.arrow_angle')}>
            <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
              <Box layerStyle='menuconfigpanel_option_name' >
                {t('Noeud.apparence.arrow_angle')}
                {(IsNodeDisplayingValueLocal(multi_selected_nodes, 'node_arrow_angle_factor', menu_for_style)?
                  <>{TooltipValueSurcharge('node_var_',t)}</>:
                  <></>
                )}
              </Box>
              <Slider
                min={0}
                max={45}
                step={5}
                value={list_value['node_arrow_angle_factor'][0] as number}
                onChange={(value)=>{
                  Object
                    .values(parameter_to_modify)
                    .filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode))
                    .forEach(d =>AssignNodeValueToCorrectVar(d,'node_arrow_angle_factor', value, menu_for_style))
                  updateMenuConfigNode()
                  // Redraw only sabot of link attached to the node already shaped as an arrow
                  updateLinkAttachedToNodes()
                  //link_function.reDrawLinkStartSabot(multi_selected_nodes.current.filter(n=>ReturnValueNode(data,n,'shape')==='arrow'))
                }}
              >
                <SliderMark
                  value={list_value['node_arrow_angle_factor'][0] as number}
                >
                  {list_value['node_arrow_angle_factor'][0]}°
                </SliderMark>
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
            </Box>
          </OSTooltip>

          <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
            <Box layerStyle='menuconfigpanel_option_name' >
              {t('Noeud.apparence.angle_orientation')}
            </Box>
            <Box layerStyle='options_4cols' >
              <Button
                variant={
                  list_value['node_arrow_angle_direction'][0]==='left'?
                    'menuconfigpanel_option_button_activated':
                    'menuconfigpanel_option_button'
                }
                minWidth={0}
                onClick={() => {
                  Object
                    .values(parameter_to_modify)
                    .filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode))
                    .forEach(d =>AssignNodeValueToCorrectVar(d,'node_arrow_angle_direction','left',menu_for_style))
                  updateMenuConfigNode()
                  // Redraw only sabot of link attached to the node already shaped as an arrow
                  link_function.reDrawLinkStartSabot(multi_selected_nodes.current.filter(n=>ReturnValueNode(data,n,'shape')==='arrow'))
                  
                }}
              >
                <FaArrowLeft/>
              </Button>
              <Button
                variant={
                  list_value['node_arrow_angle_direction'][0]==='right'?
                    'menuconfigpanel_option_button_activated':
                    'menuconfigpanel_option_button'
                }
                minWidth={0}
                onClick={() => {
                  Object
                    .values(parameter_to_modify)
                    .filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode))
                    .forEach(d =>AssignNodeValueToCorrectVar(d,'node_arrow_angle_direction','right',menu_for_style))
                  updateMenuConfigNode()
                  // Redraw only sabot of link attached to the node already shaped as an arrow
                  link_function.reDrawLinkStartSabot(multi_selected_nodes.current.filter(n=>ReturnValueNode(data,n,'shape')==='arrow'))
                }}
              >
                <FaArrowRight/>
              </Button>
              <Button
                variant={
                  list_value['node_arrow_angle_direction'][0]==='top'?
                    'menuconfigpanel_option_button_activated':
                    'menuconfigpanel_option_button'
                }
                minWidth={0}
                onClick={() => {
                  Object
                    .values(parameter_to_modify)
                    .filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode))
                    .forEach(d =>AssignNodeValueToCorrectVar(d,'node_arrow_angle_direction','top',menu_for_style))
                  updateMenuConfigNode()
                  // Redraw only sabot of link attached to the node already shaped as an arrow
                  link_function.reDrawLinkStartSabot(multi_selected_nodes.current.filter(n=>ReturnValueNode(data,n,'shape')==='arrow'))
                }}
              >
                <FaArrowUp/>
              </Button>
              <Button
                variant={
                  list_value['node_arrow_angle_direction'][0]==='bottom'?
                    'menuconfigpanel_option_button_activated':
                    'menuconfigpanel_option_button'
                }
                minWidth={0}
                onClick={() => {
                  Object
                    .values(parameter_to_modify)
                    .filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode))
                    .forEach(d =>AssignNodeValueToCorrectVar(d,'node_arrow_angle_direction','bottom',menu_for_style))
                  updateMenuConfigNode()
                  // Redraw only sabot of link attached to the node already shaped as an arrow
                  link_function.reDrawLinkStartSabot(multi_selected_nodes.current.filter(n=>ReturnValueNode(data,n,'shape')==='arrow'))
                }}
              >
                <FaArrowDown/>
              </Button>
            </Box>
          </Box>
        </Box>:
        <></>
    }

    <Box as='span' layerStyle='menuconfigpanel_part_title_2' >
      {t('Noeud.size')}
    </Box>

    {/* Largeur minimale du noeud */}
    <OSTooltip label={t('Noeud.apparence.tooltips.TML')}>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name' >
          {t('Noeud.apparence.TML')}
        </Box>
        <ConfigNodeAttributeNumberInput
          data={applicationData.data}
          parameter_to_modify={parameter_to_modify}
          selected_parameter={selected_parameter}
          menu_for_style={menu_for_style}
          local_var_of_node='node_width'
          function_onBlur={()=>{
            updateMenuConfigNode()
            updateLinkAttachedToNodes()
          }}
          stepper={true}
          minimum_value={1}
          unitText='pixels'
        />

      </Box>
    </OSTooltip>

    {/* Hauteur minimale du noeud */}
    <OSTooltip label={t('Noeud.apparence.tooltips.TMH')}>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name' >
          {t('Noeud.apparence.TMH')}
        </Box>
        <ConfigNodeAttributeNumberInput
          data={applicationData.data}
          parameter_to_modify={parameter_to_modify}
          selected_parameter={selected_parameter}
          menu_for_style={menu_for_style}
          local_var_of_node='node_height'
          function_onBlur={()=>{
            updateMenuConfigNode()
            updateLinkAttachedToNodes()
          }}
          stepper={true}
          minimum_value={1}
          unitText='pixels'
        />
      </Box>
    </OSTooltip>
    {advanced_appearence_content}
  </Box>

  const svg_label_top=<svg xmlns="http://www.w3.org/2000/svg" viewBox='0 0 24 24' width="12" height="12"><path d="M19.5,0H4.5c-.829,0-1.5,.671-1.5,1.5s.671,1.5,1.5,1.5h7.247c-.143,.042-.278,.12-.391,.234l-5.087,5.191c-.574,.581-.167,1.575,.644,1.575h3.587v12.5c0,.829,.671,1.5,1.5,1.5s1.5-.671,1.5-1.5V10h3.587c.811,0,1.218-.994,.644-1.575L12.644,3.234c-.113-.114-.248-.192-.391-.234h7.247c.828,0,1.5-.671,1.5-1.5s-.672-1.5-1.5-1.5Z"/></svg>
  const svg_label_bottom=<svg xmlns="http://www.w3.org/2000/svg" viewBox='0 0 24 24' width="12" height="12"><path d="M19.5,21h-7.247c.143-.042,.278-.12,.391-.234l5.087-5.191c.574-.581,.167-1.575-.644-1.575h-3.587V1.5c0-.829-.672-1.5-1.5-1.5s-1.5,.671-1.5,1.5V14h-3.587c-.811,0-1.218,.994-.644,1.575l5.087,5.191c.113,.114,.248,.192,.391,.234H4.5c-.828,0-1.5,.671-1.5,1.5s.672,1.5,1.5,1.5h15c.828,0,1.5-.671,1.5-1.5s-.672-1.5-1.5-1.5Z"/></svg>
  const svg_label_center=<svg xmlns="http://www.w3.org/2000/svg" viewBox='0 0 24 24' width="12" height="12"><path d="M24,12c0,.553-.448,1-1,1H1c-.552,0-1-.447-1-1s.448-1,1-1H23c.552,0,1,.447,1,1Zm-13.414-3.586c.39,.39,.902,.585,1.414,.585s1.024-.195,1.414-.585l3.293-3.293c.391-.391,.391-1.023,0-1.414s-1.023-.391-1.414,0l-2.293,2.293V1c0-.553-.448-1-1-1s-1,.447-1,1V6l-2.293-2.293c-.391-.391-1.023-.391-1.414,0s-.391,1.023,0,1.414l3.293,3.293Zm2.828,7.172c-.779-.779-2.049-.779-2.828,0l-3.293,3.293c-.391,.391-.391,1.023,0,1.414s1.023,.391,1.414,0l2.293-2.293v5c0,.553,.448,1,1,1s1-.447,1-1v-5l2.293,2.293c.195,.195,.451,.293,.707,.293s.512-.098,.707-.293c.391-.391,.391-1.023,0-1.414l-3.293-3.293Z"/></svg>
  const svg_label_upper=<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12"><g><path d="M22,8V9.026A4.948,4.948,0,0,0,19,8a5,5,0,0,0,0,10,4.948,4.948,0,0,0,3-1.026V18h2V8Zm-3,8a3,3,0,1,1,3-3A3,3,0,0,1,19,16Z"/><path d="M12,18h2.236L7.118,3.764,0,18H2.236l2-4H10ZM5.236,12,7.118,8.236,9,12Z"/></g></svg>

  const content_label=<Box layerStyle='menuconfigpanel_grid' >
    {/* Checkbox visibilité noeud */}

    <Box as='span' layerStyle='menuconfigpanel_part_title_1' >
      <Checkbox
        variant='menuconfigpanel_part_title_1_checkbox'
        icon={(list_value['label_visible'][0] as boolean)?<FaEye/>:<FaEyeSlash/>}
        isIndeterminate={list_value['label_visible'][1]}
        isChecked={list_value['label_visible'][0] as boolean}
        onChange={(evt) => {
          Object.values(parameter_to_modify)
            .filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode))
            .forEach(d => AssignNodeValueToCorrectVar(d,'label_visible',evt.target.checked,menu_for_style))
          updateMenuConfigNode()
        }}
      >
        <OSTooltip label={t('Noeud.labels.tooltips.vdb')}>
          {t('Noeud.labels.vdb')}
        </OSTooltip>
        {(IsNodeDisplayingValueLocal(multi_selected_nodes,'label_visible',menu_for_style)?
          TooltipValueSurcharge('node_var',t):
          <></>
        )}
      </Checkbox>
    </Box>

    {
      list_value['label_visible'][0] as boolean?
        <Box layerStyle='menuconfigpanel_grid' >
          <Box as='span' layerStyle='menuconfigpanel_part_title_2' >
            {t('Menu.edition')}
          </Box>

          <Box as='span' layerStyle='menuconfigpanel_part_title_3' >
            {t('Noeud.text')}
          </Box>

          {/* Label en blanc ou noir */}
          <Checkbox
            variant='menuconfigpanel_option_checkbox'
            isIndeterminate={list_value['label_color'][1]}
            isChecked={list_value['label_color'][0] as boolean}
            onChange={(evt) => {
              Object.values(parameter_to_modify)
                .filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode))
                .forEach(d => AssignNodeValueToCorrectVar(d,'label_color',evt.target.checked,menu_for_style))
              updateMenuConfigNode()
            }}>
            <OSTooltip label={t('Noeud.labels.tooltips.lb')}>
              {t('Noeud.labels.lb')}
            </OSTooltip>
            {(IsNodeDisplayingValueLocal(multi_selected_nodes,'label_color',menu_for_style)?TooltipValueSurcharge('node_var',t):<></>)}
          </Checkbox>

          <Box as='span' layerStyle='menuconfigpanel_part_title_3' >
            Police
          </Box>

          {/* Police et taille du texte de label */}
          <Box layerStyle='options_3cols' >
            <Box layerStyle='options_3cols' >
              {/* Gras */}
              <Button
                variant={
                  list_value['bold'][0]?
                    'menuconfigpanel_option_button_activated_left':
                    'menuconfigpanel_option_button_left'
                }
                paddingStart='0'
                paddingEnd='0'
                minWidth='0'
                onClick={() => {
                  Object
                    .values(parameter_to_modify)
                    .filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode))
                    .map(d => {AssignNodeValueToCorrectVar(d,'bold',!list_value['bold'][0],menu_for_style)})
                  updateMenuConfigNode()
                }}
              >
                <FaBold/>
              </Button>

              {/* en majuscule */}
              <Button
                variant={
                  list_value['uppercase'][0]?
                    'menuconfigpanel_option_button_activated_center':
                    'menuconfigpanel_option_button_center'
                }
                paddingStart='0'
                paddingEnd='0'
                minWidth='0'
                onClick={() => {
                  Object
                    .values(parameter_to_modify)
                    .filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode))
                    .map(d => {AssignNodeValueToCorrectVar(d,'uppercase',!list_value['uppercase'][0],menu_for_style)})
                  updateMenuConfigNode()
                }}
              >
                {svg_label_upper}
              </Button>

              {/* En italique */}
              <Button
                variant={
                  list_value['italic'][0]?
                    'menuconfigpanel_option_button_activated_right':
                    'menuconfigpanel_option_button_right'
                }
                paddingStart='0'
                paddingEnd='0'
                minWidth='0'
                onClick={() => {
                  Object
                    .values(parameter_to_modify)
                    .filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode))
                    .map(d => {AssignNodeValueToCorrectVar(d,'italic',!list_value['italic'][0],menu_for_style)})
                  updateMenuConfigNode()
                }}
              >
                <FaItalic/>
              </Button>
            </Box>

            <Select
              variant='menuconfigpanel_option_select'
              value={
                list_value['font_family'][0]?
                  (ReturnCorrectNodeAttributeValue(data,selected_parameter[0],'font_family',menu_for_style) as string):
                  ''
              }
              onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
                Object
                  .values(parameter_to_modify)
                  .filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode))
                  .forEach(d => AssignNodeValueToCorrectVar(d,'font_family', evt.target.value,menu_for_style))
                updateMenuConfigNode()
              }}
            >
              {
                data
                  .display_style
                  .font_family
                  .map((d) => {
                    return <option
                      style={{fontFamily:d}}
                      key={'ff-' + d}
                      value={d}
                    >{d}</option>})
              }
            </Select>
            <ConfigNodeAttributeNumberInput
              data={applicationData.data}
              parameter_to_modify={parameter_to_modify}
              selected_parameter={selected_parameter}
              menu_for_style={menu_for_style}
              local_var_of_node='font_size'
              function_onBlur={()=>{
                updateMenuConfigNode()
              }}
              stepper={true}
              unitText='pixels'
            />
          </Box>

          {/* Ajout fond coloré pour meilleur visibilité si label sur flux */}

          <Checkbox
            variant='menuconfigpanel_option_checkbox'
            isIndeterminate={list_value['label_background'][1]}
            isChecked={list_value['label_background'][0] as boolean}
            onChange={(evt) => {
              Object
                .values(parameter_to_modify)
                .filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode))
                .forEach(d => AssignNodeValueToCorrectVar(d,'label_background',evt.target.checked,menu_for_style))
              updateMenuConfigNode()
            }}
          >
            <OSTooltip label={t('Noeud.labels.tooltips.l_bg')}>
              {t('Noeud.labels.l_bg')}
            </OSTooltip>

            {(IsNodeDisplayingValueLocal(multi_selected_nodes,'label_background',menu_for_style)?
              TooltipValueSurcharge('node_var',t):
              <></>)}
          </Checkbox>

          <Box as='span' layerStyle='menuconfigpanel_part_title_2' >
            {t('MEP.leg_pos')}
          </Box>

          {/* Largeur de la zone de texte du label */}
          <OSTooltip label={t('Noeud.labels.tooltips.cl')}>
            <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
              <Box layerStyle='menuconfigpanel_option_name' >
                {t('Menu.larg')}
                {(IsNodeDisplayingValueLocal(multi_selected_nodes,'label_box_width',menu_for_style)?
                  <>{TooltipValueSurcharge('node_var_',t)}</>:
                  <></>)}
              </Box>

              <ConfigNodeAttributeNumberInput
                data={applicationData.data}
                parameter_to_modify={parameter_to_modify}
                selected_parameter={selected_parameter}
                menu_for_style={menu_for_style}
                local_var_of_node='label_box_width'
                function_onBlur={()=>updateMenuConfigNode()}
                stepper={true}
                minimum_value={0}
                maximum_value={500}
                unitText='pixels'
              />
            </Box>
          </OSTooltip>

          {/* Position  du label par rapport au noeud */}
          <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
            <Box layerStyle='menuconfigpanel_option_name' >
              Position
            </Box>

            <Box layerStyle='options_2cols' >
              {/* Position horizontale */}
              <Box layerStyle='options_3cols' >
                {/* A gauche  */}
                <OSTooltip label={t('Noeud.labels.tooltips.gauche')}>
                  <Button
                    variant={
                      list_value['label_horiz'][0]=== 'left'?
                        'menuconfigpanel_option_button_activated_left':
                        'menuconfigpanel_option_button_left'}
                    paddingStart='0'
                    paddingEnd='0'
                    minWidth='0'
                    onClick={() => {
                      Object
                        .values(parameter_to_modify)
                        .filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode))
                        .map(d => {
                          AssignNodeValueToCorrectVar(d,'label_horiz','left',menu_for_style)
                          delete d.x_label
                          delete d.y_label
                        })
                      updateMenuConfigNode()
                    }}
                  >
                    <FaAlignLeft/>
                  </Button>
                </OSTooltip>

                {/* Au milieu */}
                <OSTooltip label={t('Noeud.labels.tooltips.Milieu_ph')}>
                  <Button
                    variant={
                      list_value['label_horiz'][0]=== 'middle'?
                        'menuconfigpanel_option_button_activated_center':
                        'menuconfigpanel_option_button_center'
                    }
                    paddingStart='0'
                    paddingEnd='0'
                    minWidth='0'
                    onClick={() => {
                      Object
                        .values(parameter_to_modify)
                        .filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode))
                        .map(d => {
                          AssignNodeValueToCorrectVar(d,'label_horiz','middle',menu_for_style)
                          delete d.x_label
                          delete d.y_label
                        })
                      updateMenuConfigNode()
                    }}
                  >
                    <FaAlignCenter/>
                  </Button>
                </OSTooltip>

                {/* A droite */}
                <OSTooltip label={t('Noeud.labels.tooltips.droite')}>
                  <Button
                    variant={
                      list_value['label_horiz'][0]==='right'?
                        'menuconfigpanel_option_button_activated_right':
                        'menuconfigpanel_option_button_right'
                    }
                    paddingStart='0'
                    paddingEnd='0'
                    minWidth='0'
                    onClick={() => {
                      Object
                        .values(parameter_to_modify)
                        .filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode))
                        .map(d => {
                          AssignNodeValueToCorrectVar(d,'label_horiz','right',menu_for_style)
                          delete d.x_label
                          delete d.y_label
                        })
                      updateMenuConfigNode()
                    }}
                  >
                    <FaAlignRight/>
                  </Button>
                </OSTooltip>
              </Box>

              {/* Position verticale */}
              <Box layerStyle='options_3cols' >
                {/* En haut */}
                <OSTooltip label={t('Noeud.labels.tooltips.haut')}>
                  <Button
                    variant={
                      list_value['label_vert'][0]==='top'?
                        'menuconfigpanel_option_button_activated_left':
                        'menuconfigpanel_option_button_left'
                    }
                    paddingStart='0'
                    paddingEnd='0'
                    minWidth='0'
                    onClick={() => {
                      Object
                        .values(parameter_to_modify)
                        .filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode))
                        .map(d => {
                          AssignNodeValueToCorrectVar(d,'label_vert','top',menu_for_style)
                          delete d.x_label
                          delete d.y_label
                        })
                      updateMenuConfigNode()
                    }}
                  >
                    {svg_label_top}
                  </Button>
                </OSTooltip>

                {/* au Milieu */}
                <OSTooltip label={t('Noeud.labels.tooltips.Milieu_pv')}>
                  <Button
                    variant={
                      list_value['label_vert'][0]==='middle'?
                        'menuconfigpanel_option_button_activated_center':
                        'menuconfigpanel_option_button_center'
                    }
                    paddingStart='0'
                    paddingEnd='0'
                    minWidth='0'
                    onClick={() => {
                      Object
                        .values(parameter_to_modify)
                        .filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode))
                        .map(d => {
                          AssignNodeValueToCorrectVar(d,'label_vert','middle',menu_for_style)
                          delete d.x_label
                          delete d.y_label
                        })
                      updateMenuConfigNode()
                    }}
                  >
                    {svg_label_center}
                  </Button>
                </OSTooltip>

                {/* En bas */}
                <OSTooltip label={t('Noeud.labels.tooltips.Bas')}>
                  <Button
                    variant={
                      list_value['label_vert'][0]==='bottom'?
                        'menuconfigpanel_option_button_activated_right':
                        'menuconfigpanel_option_button_right'
                    }
                    paddingStart='0'
                    paddingEnd='0'
                    minWidth='0'
                    onClick={() => {
                      Object
                        .values(parameter_to_modify)
                        .filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode))
                        .map(d => {
                          AssignNodeValueToCorrectVar(d,'label_vert','bottom',menu_for_style)
                          delete d.x_label
                          delete d.y_label
                        })
                      updateMenuConfigNode()
                    }}
                  >
                    {svg_label_bottom}
                  </Button>
                </OSTooltip>
              </Box>
            </Box>
          </Box>

          {advanced_label_content}
        </Box>:
        <></>
    }
  </Box>

  const content_label_value=<Box layerStyle='menuconfigpanel_grid' >

    <Box as='span' layerStyle='menuconfigpanel_part_title_1' >
      <Checkbox
        variant='menuconfigpanel_part_title_1_checkbox'
        icon={(list_value['show_value'][0] as boolean)?<FaEye/>:<FaEyeSlash/>}
        isIndeterminate={list_value['show_value'][1]}
        isChecked={list_value['show_value'][0] as boolean}
        onChange={(evt) => {
          Object
            .values(parameter_to_modify)
            .filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode))
            .forEach(d => AssignNodeValueToCorrectVar(d,'show_value',evt.target.checked,menu_for_style))
          updateMenuConfigNode()
        }}
      >
        <OSTooltip label={t('Noeud.labels.tooltips.vdv')}>
          {t('Noeud.labels.vdv')}
        </OSTooltip>
        {(IsNodeDisplayingValueLocal(multi_selected_nodes,'show_value',menu_for_style)?
          TooltipValueSurcharge('node_var',t):
          <></>)}
      </Checkbox>
    </Box>

    {
      list_value['show_value'][0] as boolean?
        <Box layerStyle='menuconfigpanel_grid' >
          <Box as='span' layerStyle='menuconfigpanel_part_title_2' >
            {t('Menu.edition')}
          </Box>

          {/* Taille de la police du texte de la valeur */}
          <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
            <Box layerStyle='menuconfigpanel_option_name' >
              Police
            </Box>

            <ConfigNodeAttributeNumberInput
              data={applicationData.data}
              parameter_to_modify={parameter_to_modify}
              selected_parameter={selected_parameter}
              menu_for_style={menu_for_style}
              local_var_of_node='value_font_size'
              function_onBlur={()=>updateMenuConfigNode()}
              stepper={true}
              minimum_value={11}
              unitText='pixels'
            />
          </Box>

          {/* Position de l'affichage des données par rapport au noeud */}
          <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
            <Box layerStyle='menuconfigpanel_option_name' >
              Position
            </Box>
            <Box layerStyle='options_2cols' >
              {/* Horizontale */}
              <Box layerStyle='options_3cols' >
                {/* A gauche */}
                <OSTooltip label={t('Noeud.labels.tooltips.gauche_val')}>
                  <Button
                    variant={
                      list_value['label_horiz_valeur'][0]==='left'?
                        'menuconfigpanel_option_button_activated_left':
                        'menuconfigpanel_option_button_left'
                    }
                    paddingStart='0'
                    paddingEnd='0'
                    minWidth='0'
                    onClick={() => {
                      Object
                        .values(parameter_to_modify)
                        .filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode))
                        .map(d => {AssignNodeValueToCorrectVar(d,'label_horiz_valeur','left',menu_for_style)})
                      updateMenuConfigNode()
                    }}
                  >
                    <FaAlignLeft/>
                  </Button>
                </OSTooltip>

                {/* Au milieu */}
                <OSTooltip label={t('Noeud.labels.tooltips.Milieu_ph_val')}>
                  <Button
                    variant={
                      list_value['label_horiz_valeur'][0]==='middle'?
                        'menuconfigpanel_option_button_activated_center':
                        'menuconfigpanel_option_button_center'
                    }
                    paddingStart='0'
                    paddingEnd='0'
                    minWidth='0'
                    onClick={() => {
                      Object
                        .values(parameter_to_modify)
                        .filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode))
                        .map(d => {AssignNodeValueToCorrectVar(d,'label_horiz_valeur','middle',menu_for_style)})
                      updateMenuConfigNode()
                    }}
                  >
                    <FaAlignCenter/>
                  </Button>
                </OSTooltip>

                {/* A droite */}
                <OSTooltip label={t('Noeud.labels.tooltips.droite_val')}>
                  <Button
                    variant={
                      list_value['label_horiz_valeur'][0]==='right'?
                        'menuconfigpanel_option_button_activated_right':
                        'menuconfigpanel_option_button_right'
                    }
                    paddingStart='0'
                    paddingEnd='0'
                    minWidth='0'
                    onClick={() => {
                      Object
                        .values(parameter_to_modify)
                        .filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode))
                        .map(d => {AssignNodeValueToCorrectVar(d,'label_horiz_valeur','right',menu_for_style)})
                      updateMenuConfigNode()
                    }}
                  >
                    <FaAlignRight/>
                  </Button>
                </OSTooltip>
              </Box>

              {/* Verticale */}
              <Box layerStyle='options_3cols' >
                {/* en haut */}
                <OSTooltip label={t('Noeud.labels.tooltips.haut_val')}>
                  <Button
                    variant={
                      list_value['label_vert_valeur'][0]==='top'?
                        'menuconfigpanel_option_button_activated_left':
                        'menuconfigpanel_option_button_left'
                    }
                    paddingStart='0'
                    paddingEnd='0'
                    minWidth='0'
                    onClick={() => {
                      Object
                        .values(parameter_to_modify)
                        .filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode))
                        .map(d => {AssignNodeValueToCorrectVar(d,'label_vert_valeur','top',menu_for_style)})
                      updateMenuConfigNode()
                    }}
                  >
                    {svg_label_top}
                  </Button>
                </OSTooltip>

                {/* Au milieu */}
                <OSTooltip label={t('Noeud.labels.tooltips.Milieu_pv_val')}>
                  <Button
                    variant={
                      list_value['label_vert_valeur'][0]==='middle'?
                        'menuconfigpanel_option_button_activated_center':
                        'menuconfigpanel_option_button_center'
                    }
                    paddingStart='0'
                    paddingEnd='0'
                    minWidth='0'
                    onClick={() => {
                      Object
                        .values(parameter_to_modify)
                        .filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode))
                        .map(d => {AssignNodeValueToCorrectVar(d,'label_vert_valeur','middle',menu_for_style)})
                      updateMenuConfigNode()
                    }}
                  >
                    {svg_label_center}
                  </Button>
                </OSTooltip>

                {/* En bas */}
                <OSTooltip label={t('Noeud.labels.tooltips.Bas_val')}>
                  <Button
                    variant={
                      list_value['label_vert_valeur'][0]==='bottom'?
                        'menuconfigpanel_option_button_activated_right':
                        'menuconfigpanel_option_button_right'
                    }
                    minWidth='0'
                    paddingStart='0'
                    paddingEnd='0'
                    onClick={() => {
                      Object
                        .values(parameter_to_modify)
                        .filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode))
                        .map(d => {AssignNodeValueToCorrectVar(d,'label_vert_valeur','bottom',menu_for_style)})
                      updateMenuConfigNode()
                    }}
                  >
                    {svg_label_bottom}
                  </Button>
                </OSTooltip>
              </Box>
            </Box>
            {advanced_label_value_content}
          </Box>
        </Box>:
        <></>
    }
  </Box>
  const has_product_or_sector = Object.values(data.nodes).filter(n=> 'Type de noeud' in n.tags).length > 0
  const style_node=!menu_for_style? <Box layerStyle='menuconfigpanel_row_stylechoice' >
    <Box layerStyle='menuconfigpanel_option_name' textStyle='h3' >
      {t('Noeud.Style')}
    </Box>
    <Menu>
      <MenuButton
        as={Button}
        variant='menuconfigpanel_option_button'
        rightIcon={<FaChevronDown />}>
        {style_of_selected_nodes()}
      </MenuButton>
      <MenuList>
        {Object.keys(data.style_node)
          .filter(key=>has_product_or_sector ? true : data.style_node[key].idNode !== 'NodeSectorStyle' && data.style_node[key].idNode !== 'NodeProductStyle' )
          .map((d,i)=> {
            return (
              <MenuItem
                key={i}
                onClick={() => {
                  ref_selected_style_node.current = d
                  multi_selected_nodes.current.map(n => {
                    n.style = d
                  })
                  ApplyStyleToNodes(multi_selected_nodes,node_function)
                  setForceUpdate(!forceUpdate)
                  ComponentUpdater.updateComponenSaveInCache.current(false)
                }}
              >
                {data.style_node[d].name}
              </MenuItem>
            )
          })}
      </MenuList>
    </Menu>
    <OSTooltip label={t('Noeud.tooltips.AS')}>
      <Button
        variant='menuconfigpanel_option_button'
        onClick={() => {
          ApplyStyleToNodes(multi_selected_nodes,node_function)
          ComponentUpdater.updateComponenSaveInCache.current(false)
        }}
      >
        <FaUndo />
        {/* {t('Noeud.AS')} */}
      </Button>
    </OSTooltip>
  </Box>:<></>

  // Tableau d'elements de sous-menu attribut de noeuds
  return <>
    <React.Fragment key={'style_node'}>{style_node}</React.Fragment>
    <React.Fragment key={'sep_1'}><hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} /></React.Fragment>
    <React.Fragment key={'app'}>{content_appearence}</React.Fragment>
    <React.Fragment key={'sep_2'}><hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} /></React.Fragment>
    <React.Fragment key={'lab'}>{content_label}</React.Fragment>
    <React.Fragment key={'sep_3'}><hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} /></React.Fragment>
    <React.Fragment key={'val'}>{content_label_value}</React.Fragment>
  </>
}

export const SankeyMenuConfigurationNodesAttributes = (
  t:TFunction,
  menu_configuration_nodes_attributes:JSX.Element[],
  for_modal = false
) => {
  //Function that check if all selected nodes have the same value for some parameter
  return for_modal ?
    <Box layerStyle='menuconfigpanel_grid' >
      {menu_configuration_nodes_attributes}
    </Box>
    :
  // <Tab>
  //   <Box layerStyle='submenuconfig_tab' >
  //     {t('Noeud.tabs.apparence')}
  //   </Box>
  // </Tab>,
    <TabPanel
      id='nodes_desc'
    >
      <Box layerStyle='menuconfigpanel_grid'>
        {menu_configuration_nodes_attributes}
      </Box>
    </TabPanel>
    
}

export const SankeyWrapperConfigInModalOrMenu : FunctionComponent<SankeyWrapperConfigInModalOrMenuType> = ({
  menu_to_wrap,
  for_modal,
  idTab=''
}) => {
  //Function that check if all selected nodes have the same value for some parameter
  return for_modal ?
    <Box layerStyle='menuconfigpanel_grid' >
      {menu_to_wrap}
    </Box>
    :
  // <Tab> 
  //   <Box layerStyle='submenuconfig_tab' >
  //     {/* {SankeyWrapperConfigInModalOrMenu} */}
  //     {title_tab}
  //   </Box>
  // </Tab>,
    <TabPanel
      id={idTab}
    >
      <Box layerStyle='menuconfigpanel_grid'>
        {menu_to_wrap}
      </Box>
    </TabPanel>
    
}

type ConfigLayoutNumberInputType={
  data:SankeyData
  local_var_of_node: keyof SankeyNodeAttrLocal
  parameter_to_modify: {[_: string]: SankeyNodeStyle;} | {[_: string]: SankeyNode;}
  selected_parameter: SankeyNodeStyle[] | SankeyNode[]
  menu_for_style:boolean
  minimum_value?:number
  maximum_value?:number
  stepper?:boolean
  unitText?:string
  function_onBlur:()=>void
}
/**
 * Component developped for number input of the nodes attributs config menu
 * 
 * @param {applicationDataType} applicationData
 * @param {keyof SankeyNodeAttrLocal} var_of_data keyof of the variable we want to reference in the inputn the variable in SankeyData need to be a number
 * @param {{[_: string]: SankeyNodeStyle;} | {[_: string]: SankeyNode;}} parameter_to_modify multi_selected_nodes or dict of node style
 * @param {SankeyNodeStyle[] | SankeyNode[]} selected_parameter either modify node style or selected node depending on if we are in the edition of style or configuration menu
 * @param {boolean} menu_for_style Modify either the style of node or the multi_selected_nodes
 * @param {number} minimum_value (optional, if not specified it mean the value can be undefined )
 * @param {number} maximum_value (optional, if not specified it mean the value can be undefined )
 * @param {boolean} stepper (default:false) add stepper to the input to increase or decrease the value
 * @param {string} unitText (default:'') text of the addon
 * @param {function} function_onBlur function called when we leave the input, it is generally used to update the draw area
 * 
 * @return {JSX.Elmement}
 */
export const ConfigNodeAttributeNumberInput:FunctionComponent<ConfigLayoutNumberInputType>=({
  data,
  local_var_of_node,
  parameter_to_modify,
  selected_parameter,
  menu_for_style,
  minimum_value,
  maximum_value,
  stepper=false,
  unitText,
  function_onBlur
})=>{
  const [update,setUpdate]=useState(false)
  const ref_input=useRef<HTMLInputElement>(null)
  const isModifying:MutableRefObject<NodeJS.Timeout|undefined>=useRef<NodeJS.Timeout>()
  let val=0
  const variantOfInput=unitText?'menuconfigpanel_option_numberinput_with_right_addon':'menuconfigpanel_option_numberinput'
  
  if(selected_parameter[0]){
    val=ReturnCorrectNodeAttributeValue(data,selected_parameter[0],local_var_of_node,menu_for_style) as number
  }

  // Add stepper addon if specified
  const stepperBtn=stepper?<NumberInputStepper>
    <NumberIncrementStepper/>
    <NumberDecrementStepper/>
  </NumberInputStepper>:<></>

  // Add unit addon if specified
  const inputUnit=unitText?<InputRightAddon>{unitText}</InputRightAddon>:<></>

  return <InputGroup variant='menuconfigpanel_option_input' >
    <NumberInput allowMouseWheel variant={variantOfInput} min={minimum_value} max={maximum_value} step={1} 
      value={val}
      onChange={(_,value)=>{
        Object
          .values(parameter_to_modify)
          .filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode))
          .forEach(d => AssignNodeValueToCorrectVar(d,local_var_of_node, Number(value), menu_for_style))

        if(!menu_for_style){
          // reset timeout if exist
          if(isModifying.current){
            clearTimeout(isModifying.current)
          }
          // launch timeout that automatically blur the input
          isModifying.current=setTimeout(()=>{
            function_onBlur()
            ref_input.current?.blur()
          },2000)
        }
       
        setUpdate(!update)
      }}
      onBlur={()=>{
        if(!menu_for_style)clearTimeout(isModifying.current)
        function_onBlur()
      }}
    >
      <NumberInputField ref={ref_input}/>
      {stepperBtn}
    </NumberInput>
    {inputUnit}
  </InputGroup>
}
