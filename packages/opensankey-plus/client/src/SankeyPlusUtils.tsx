
import React, { ChangeEvent, useRef } from 'react'
import { OverlayTrigger, Tooltip, Form} from 'react-bootstrap'
import { TFunction } from 'i18next'
import { FaEye, FaEyeSlash, FaFileImport} from 'react-icons/fa'
import * as d3 from 'd3'

import {
  Box,
  Button,
  Checkbox
} from '@chakra-ui/react'

import {
  SankeyPlusData,
  SankeyPlusLabel,
  SankeyPlusLink,
  SankeyPlusLinkAttrLocal,
  SankeyPlusLinkStyle,
  SankeyPlusNode,
} from '../types/Types'
import {
  DefaultSankeyPlusStyleLinkFType,
  DragLegendPlusFType,
  ImportImageAsSvgBgFType,
  IsAllZdtAttrSameValueFType,
  OSPIsAllNodeNotLocalAttrSameValueFType,
  PlusAssignLinkValueToCorrectVarFType,
  PlusLinkSabotColorFType,
  PlusReturnValueLinkFType,
  SetSvgBgFType,
  ValueOf,
} from '../types/SankeyPlusUtilsTypes'
import { OpposingDragElementsPlus } from './SankeyPlusNodes'
import {
  AssignLinkValueToCorrectVar,
  DefaultLinkStyle,
  DragLegendGElementOSTyped,
  LinkColor,
  NodeColor,
  ReturnValueLink,
} from './import/OpenSankey'

import { SankeyLinkAttrLocal, SankeyLinkStyle } from 'open-sankey/src/types/Types'
import { GetLinkValueFuncType } from 'open-sankey/src/configmenus/types/SankeyUtilsTypes'


export const DefaultSankeyPlusStyleLink : DefaultSankeyPlusStyleLinkFType = () => {
  const style=DefaultLinkStyle() as SankeyPlusLinkStyle
  style.gradient=false
  return style
}

export  const DragLegendPlus : DragLegendPlusFType = (data:SankeyPlusData,
  set_data:(d:SankeyPlusData)=>void,
  multi_selected_label:{current:SankeyPlusLabel[]}
) => d3.drag<SVGGElement, unknown>()
  .subject(Object).on('drag', function (event) {

    if(d3.select('.opensankey #svg').nodes().length>0){
      DragLegendGElementOSTyped(data,event)
      if(data.legend_position[0]===0 ||data.legend_position[1]===0){
        OpposingDragElementsPlus([({x: data.legend_position[0], y:data.legend_position[1]} as SankeyPlusNode)],event,({} as SankeyPlusNode),data,{current:[]},multi_selected_label)
      }
    }
  }).on('end',()=>set_data({...data}))


export const ImportImageAsSvgBg : ImportImageAsSvgBgFType = (
  t:TFunction,
  data:SankeyPlusData,set_data:(d:SankeyPlusData)=>void,
  has_open_sankey_plus:boolean)=>{
  const _load_image = useRef<HTMLInputElement>(null)


  const content_image=<>
    {/* Import image */}
    <Box
      as='span'
      layerStyle='menuconfigpanel_row_2cols'
    >
      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isChecked={data.show_background_image}
        isDisabled={!has_open_sankey_plus}
        icon={data.show_background_image?<FaEye/>:<FaEyeSlash/>}
        onChange={(evt) => {
          data.show_background_image = evt.target.checked
          set_data({ ...data })
        }}
      >
        {t('MEP.show_image')}
      </Checkbox>
      <OverlayTrigger
        key={'imageDisabled2'}
        placement={'top'}
        delay={500}
        overlay={
          (!has_open_sankey_plus)?
          <Tooltip id={'imageDisabled2'}>{t('Menu.sankeyPlusDisabled')} </Tooltip>:
          <></>}
      >
        <Box>
          <Button
            variant='menuconfigpanel_option_button'
            isDisabled={!data.show_background_image || !has_open_sankey_plus}
            onClick={()=>{
              if (_load_image.current) {
                _load_image.current.name = ''
                _load_image.current.click()
              }
            }}
          >
            <FaFileImport/>
          </Button>
          <Form.Control
            ref={_load_image}
            style={{display:'none'}}
            accept='image/*'
            type="file"
            value={''}
            disabled={!has_open_sankey_plus}
            onChange={(evt: ChangeEvent) => {
              const files = (evt.target as HTMLFormElement).files
              const reader = new FileReader()
              reader.onload = (() => {
                return (e: ProgressEvent<FileReader>) => {
                  const resultat = (e.target as FileReader).result
                  const res=resultat?.toString().replaceAll('=','')
                  data.background_image=(res as string)
                  set_data({...data})
                }
              })()
              reader.readAsDataURL(files[0])
            }}
          />
        </Box>
      </OverlayTrigger>
    </Box>
  </>
  return content_image
}

export const SetSvgBg : SetSvgBgFType =(data:SankeyPlusData)=>{

  d3.select('#svg')
    .filter(()=> !data.show_background_image ||data.background_image===undefined || data.background_image==='')
    .style('background-image',null)
    .style('background-size','contain')
    .style('background-repeat','no-repeat')

  d3.select('#svg')
    .filter(()=> data.show_background_image && data.background_image!==undefined && data.background_image!=='')
    .style('background-image','url('+data.background_image+')')
    .style('background-size','contain')
    .style('background-repeat','no-repeat')
}

export const IsAllZdtAttrSameValue  : IsAllZdtAttrSameValueFType = (
  data:SankeyPlusData,
  m_s_zdt:SankeyPlusLabel[],
  k:keyof SankeyPlusLabel
)=>{
  if(m_s_zdt.length===0){
    return [null,null]
  }
  const first_value=m_s_zdt[0][k]
  let all_same=true
  m_s_zdt.forEach(l=>{
    all_same=l[k]!==first_value?false:all_same
  })
  return (all_same?[first_value,false]:[0,true])
}
// export const PlusIsAllNodeNotLocalAttrSameValue=(data:SankeyPlusData,m_s_n:SankeyPlusNode[],k_list:(keyof SankeyPlusNode)[])=>{
// return IsAllNodeNotLocalAttrSameValue(data,m_s_n,k_list)
// }
export const OSPIsAllNodeNotLocalAttrSameValue : OSPIsAllNodeNotLocalAttrSameValueFType = (
  data:SankeyPlusData,
  m_s_n:SankeyPlusNode[],
  k_list:(keyof SankeyPlusNode)[]
)=>{
  // store_value : variable that contain an array forEach key we are looking for
  // Each array contain in first position the value of the selected nodes attribute
  // In second position it contain a boolean that return true if all selected nodes have the same value for the key
  const store_value={} as {[x:string]:[ValueOf<SankeyPlusNode>|false,boolean]}

  if(m_s_n.length>0){
    // For each selected nodes
    m_s_n.forEach((node,i)=>{
      // For each attributes we want to check
      k_list.forEach(k => {
        // Get the value of the node attribute(k)
        const val=node[k]

        // Store first value of each node attribute
        if(i===0){
          store_value[k]=[val,false]
        }else{
          // Check if other nodes selected have the same value, if not we set the 2nd value of the array at true
          store_value[k][1]=val!==store_value[k][0]?true:store_value[k][1]
        }
      })
    })
  }else{
    k_list.forEach(k => {
      store_value[k]=[false,false]
    })
  }
  return store_value
}

export const PlusReturnValueLink : PlusReturnValueLinkFType = (
  data:SankeyPlusData,
  l:SankeyPlusLink,
  k:keyof SankeyPlusLinkAttrLocal | keyof SankeyPlusLinkStyle
)=>{
  return ReturnValueLink(data,l,((k as unknown) as (keyof SankeyLinkAttrLocal | keyof SankeyLinkStyle)))
}
export const PlusAssignLinkValueToCorrectVar : PlusAssignLinkValueToCorrectVarFType =(l:SankeyPlusLink|SankeyPlusLinkStyle,k:keyof SankeyPlusLinkAttrLocal,v:boolean|string|number,menu_for_style:boolean)=>{
  return AssignLinkValueToCorrectVar(l,k as unknown as keyof SankeyLinkAttrLocal,v,menu_for_style)
}

export const PlusLinkSabotColor : PlusLinkSabotColorFType = (
  l: SankeyPlusLink,
  data:SankeyPlusData,
  GetLinkValue:GetLinkValueFuncType
) => {
  return PlusReturnValueLink(data,l,'gradient')===true ? NodeColor(data.nodes[l.idSource],data) : LinkColor(l,data,GetLinkValue)
}