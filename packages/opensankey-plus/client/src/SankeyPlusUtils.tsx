
import { SankeyPlusData, SankeyPlusLinkStyle,SankeyPlusLabel,SankeyPlusNode,SankeyPlusLink,SankeyPlusLinkAttrLocal } from './types'
import { DefaultLinkStyle,ReturnValueLink,AssignLinkValueToCorrectVar } from 'open-sankey/src/lib/SankeyUtils'
import {drag_legend_g_element} from 'open-sankey/src/lib/SankeyDrawLegend'
import * as d3 from 'd3'
import { opposing_drag_elements_plus } from './SankeyPlusNodes'
import React,{ChangeEvent,useRef} from 'react'
import { OverlayTrigger,Tooltip,Form, InputGroup, Button} from 'react-bootstrap'
import { TFunction } from 'i18next'
import { FaFileImport} from 'react-icons/fa'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faDeleteLeft} from '@fortawesome/free-solid-svg-icons'
import { SankeyLinkAttrLocal,SankeyLinkStyle } from 'open-sankey/src/lib/types'
export const default_sankey_plus_style_link=()=>{
  const style=DefaultLinkStyle() as SankeyPlusLinkStyle
  style.gradient=false
  return style
}

export  const drag_legend_plus = (data:SankeyPlusData,
  set_data:(d:SankeyPlusData)=>void,
  multi_selected_label:{current:SankeyPlusLabel[]}
) => d3.drag<SVGGElement, unknown>()
  .subject(Object).on('drag', function (event) {

    if(d3.select('.opensankey #svg').nodes().length>0){
      drag_legend_g_element(data,event)
      if(data.legend_position[0]===0 ||data.legend_position[1]===0){
        opposing_drag_elements_plus([({x: data.legend_position[0], y:data.legend_position[1]} as SankeyPlusNode)],event,({} as SankeyPlusNode),data,{current:[]},multi_selected_label)
      }
    }
  }).on('end',()=>set_data({...data}))


export const import_image_as_svg_BG=(
  t:TFunction,
  data:SankeyPlusData,set_data:(d:SankeyPlusData)=>void,
  has_open_sankey_plus:boolean)=>{
  const _load_image = useRef<HTMLInputElement>(null)


  const content_image=<>
    {/* Import image */}
    <OverlayTrigger
      key={'imageDisabled2'}
      placement={'top'}
      delay={500}
      overlay={(!has_open_sankey_plus)?(<Tooltip id={'imageDisabled2'}>{t('Menu.sankeyPlusDisabled')} </Tooltip>):<></>}
    >
      <InputGroup>
        <InputGroup.Text
          style={{
            color:(!has_open_sankey_plus)?'#666666':'',
            backgroundColor:(!has_open_sankey_plus)?'#cccccc':'',
            width:'40%'}}
        >
          {t('Image')}
        </InputGroup.Text>
        <Button
          variant='outline-primary'
          style={{width:'30%'}}
          className='btn_menu_config'
          onClick={()=>{
            if (_load_image.current) {
              _load_image.current.name = ''
              _load_image.current.click()
            }
          }}
        ><FaFileImport/></Button>

        <Button
          variant='outline-primary'
          style={{width:'30%'}}
          className='btn_menu_config'
          onClick={()=>{
            data.background_image=''
            set_data({...data})
          }}
        ><FontAwesomeIcon icon={faDeleteLeft}/></Button>

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

      </InputGroup>
    </OverlayTrigger>
  </>
  return content_image
}

export const set_svg_bg=(data:SankeyPlusData)=>{
  d3.select('#svg')
    .filter(()=>data.background_image===undefined || data.background_image==='')
    .style('background-image',null)
    .style('background-size','contain')
    .style('background-repeat','no-repeat')

  d3.select('#svg')
    .filter(()=>data.background_image!==undefined && data.background_image!=='')
    .style('background-image','url('+data.background_image+')')
    .style('background-size','contain')
    .style('background-repeat','no-repeat')
}

export const is_all_zdt_attr_same_value=(data:SankeyPlusData,m_s_zdt:SankeyPlusLabel[],k:keyof SankeyPlusLabel)=>{
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
type ValueOf<T>=T[keyof T]
export const OSPIsAllNodeNotLocalAttrSameValue=(data:SankeyPlusData,m_s_n:SankeyPlusNode[],k_list:(keyof SankeyPlusNode)[])=>{
  // store_value : variable that contain an array forEach key we are looking for
  // Each array contain in first position the value of the selected nodes attribute 
  // In second position it contain a boolean that return true if all selected nodes have the same value for the key
  const store_value={} as {[x:string]:[ValueOf<SankeyPlusNode>,boolean]}

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

export const PlusReturnValueLink=(data:SankeyPlusData,l:SankeyPlusLink,k:keyof SankeyPlusLinkAttrLocal | keyof SankeyPlusLinkStyle)=>{
  return ReturnValueLink(data,l,((k as unknown) as (keyof SankeyLinkAttrLocal | keyof SankeyLinkStyle)))
}
export const PlusAssignLinkValueToCorrectVar=(l:SankeyPlusLink|SankeyPlusLinkStyle,k:keyof SankeyPlusLinkAttrLocal,v:boolean|string|number,menu_for_style:boolean)=>{
  return AssignLinkValueToCorrectVar(l,k as unknown as keyof SankeyLinkAttrLocal,v,menu_for_style)
}