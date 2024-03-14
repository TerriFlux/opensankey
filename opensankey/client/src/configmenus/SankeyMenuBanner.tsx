import React, {  useRef, useState } from 'react'
import { Row,
  Col,
  Form,
  FormLabel,
  Button,
  FormGroup,
  OverlayTrigger,
  Tooltip,
  FormCheck,
  Popover,
  FormControl,
  Overlay } from 'react-bootstrap'
import {  SankeyData, SankeyLink, TagsCatalog, TagsGroup, dict_variable_application_dataType} from '../types/Types'
import { MultiSelect } from 'react-multi-select-component'
import {
  FindMaxLinkValue,
  AdjustSankeyZone,
  RecursionDataTag,
  IsAllLinkNotLocalAttrSameValue,
  SmoothClasses} from './SankeyUtils'
import * as d3 from 'd3'
// import { FaNotesMedical } from 'react-icons/fa'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShareNodes,
  faArrowPointer,
  faCodeBranch,
  faFolderTree,
  faDiagramProject,
  faArrowsLeftRight,
  faArrowsUpDown,
  faSliders,
  faExpand,
  faCompress,
  faDatabase} from '@fortawesome/free-solid-svg-icons'
import { selected_type } from '../topmenus/SankeyMenuTop'
import { TFunction } from 'i18next'
import { ConvertDataFuncType } from './types/SankeyConvertTypes'
import {
  addAllDropDownNodeFType, addSimpleLevelDropDownFType, col_title_level_filterFType,
  setDiagramFuncType, stretchButtonsFType, ToolbarBuilderFType
} from './types/SankeyMenuBannerTypes'
import { GetSankeyMinWidthAndHeightFuncType } from './types/SankeyUtilsTypes'
import { AddAllDropDownFluxFType } from '../topmenus/types/SankeyMenuTopTypes'
import { Checkbox } from '@chakra-ui/react'
import { FaEye, FaEyeSlash } from 'react-icons/fa'



const logo_btn_node=<svg  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 1000 1000"
>
  <g>
    <path fill='white'
      d="M 435.70361,960.79501 C 350.22649,949.82238 261.96589,915.39353 193.9882,866.50597 163.20037,844.36434 110.42254,791.79542 88.305497,761.24143 49.96462,708.2749 20.606804,641.3553 8.7012843,579.78731 1.1564833,540.77059 2.1056594,451.27991 10.483615,411.75451 30.112374,319.14968 74.774594,242.06005 149.02313,172.62714 222.44528,103.96702 301.98959,64.109696 406.48828,43.619095 c 44.96331,-8.816681 140.529,-8.838777 188.04918,-0.04116 99.52543,18.420444 182.06463,59.983275 256.52561,129.174095 98.18988,91.23994 145.35936,197.4015 145.35936,327.15153 0,98.99093 -23.71782,173.08006 -82.53285,257.81431 -26.22705,37.78513 -92.88087,100.73366 -133.44443,126.02608 -55.61062,34.6748 -121.23357,60.33256 -184.48001,72.12931 -35.81933,6.68106 -125.18544,9.42686 -160.26153,4.92423 z M 544.61248,668.63813 c 99.75914,-24.22166 161.76345,-119.49651 136.53287,-209.79385 -26.1424,-93.5601 -128.0682,-151.41024 -225.21172,-127.8236 -34.4769,8.37091 -60.6477,22.50957 -86.81216,46.89947 -74.79093,69.71819 -74.83819,174.84659 -0.10308,243.55666 49.55119,45.56053 112.53023,62.4749 175.60067,47.16132 z"
    />
  </g>
</svg>

const logo_btn_filter_link=<svg   xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 1000 1000"
>
  <g>
    <path fill='white'
      d="m 839.13562,990.34075 c -29.57916,-9.80167 -47.77206,-22.51396 -66.75179,-46.64282 l -7.83282,-9.95778 -292.2135,-1.08702 C 181.46009,931.57107 180.00752,931.52649 154.64689,922.90111 89.784105,900.84066 37.048095,848.14524 14.695818,783.05761 2.0661707,746.28139 2.0661707,686.55501 14.695818,649.77879 36.825233,585.34017 86.869331,534.59283 152.12462,510.41885 l 24.12285,-8.93639 320.02259,-2.04433 320.02255,-2.04437 29.28674,-14.47779 c 35.27426,-17.43768 57.25443,-39.89067 74.32581,-75.92461 11.09419,-23.4174 12.26739,-29.41576 12.26739,-62.72089 0,-33.30513 -1.1732,-39.30349 -12.26739,-62.72088 -17.07235,-36.03604 -39.0514,-58.48713 -74.32829,-75.92461 l -29.28919,-14.47779 -290.29503,-1.08752 -290.29505,-1.08749 -8.01866,10.19406 c -14.95065,19.00667 -28.11301,29.60621 -49.4932,39.8564 C 148.1947,253.40107 107.7417,253.48387 77.39573,239.22887 47.498505,225.18475 34.179573,212.71691 18.997457,184.56235 6.9677052,162.25364 5.8251341,157.27659 5.8251341,127.18419 5.8251341,97.091777 6.9677052,92.114727 18.997457,69.806022 33.666242,42.60338 45.828841,30.856071 75.040965,15.676166 91.925346,6.9022401 99.691061,5.3875989 127.79073,5.3875989 c 28.09968,0 35.86539,1.5146412 52.74977,10.2885671 10.88959,5.6587 25.18002,14.81617 31.75653,20.349929 14.68863,12.359685 34.36245,50.741761 37.81695,73.777935 l 2.56395,17.09767 285.47577,1.11036 285.47576,1.11039 25.66102,9.99582 c 51.30801,19.98615 84.06821,46.1781 112.20134,89.70554 44.37948,68.66358 44.37948,162.22951 0,230.89309 -28.51458,44.11761 -69.75657,75.79552 -120.41793,92.49278 -19.66774,6.4822 -45.96913,7.18439 -339.19715,9.0561 l -317.87619,2.02902 -25.89377,12.26739 c -36.03987,17.07417 -58.487435,39.05116 -75.92461,74.33286 -13.680849,27.68132 -14.477787,31.34314 -14.477787,66.52304 0,35.1799 0.796938,38.84171 14.477787,66.52303 17.437175,35.2817 39.88474,57.25869 75.92461,74.33286 l 25.89377,12.26739 281.56,1.08946 281.55999,1.08943 2.73785,-18.53385 c 3.40449,-23.04719 22.82808,-60.33283 38.14285,-73.21937 6.34477,-5.33877 20.4456,-14.33672 31.33519,-19.99542 16.82437,-8.74272 24.74999,-10.30128 52.74977,-10.37308 30.17439,-0.0775 35.00867,1.02527 57.37816,13.08782 28.15456,15.18212 40.6224,28.50105 54.66652,58.39827 20.81192,44.30469 10.29799,102.23813 -24.95176,137.48793 -29.47651,29.47646 -83.6751,43.81954 -120.0435,31.76808 z"
    />
  </g>
</svg>

// Delete all local node variable : local_aggregation when we switch general aggregation
const delete_local_aggregation=(data:SankeyData)=>{
  Object.values(data.nodes).filter(n=>n.local!==undefined).forEach(n=>{
    if(n.local){
      delete n.local.local_aggregation
    }
  })
}

export const addSimpleLevelDropDown : addSimpleLevelDropDownFType = (
  dict_variable_application_data,
  reDrawLegend,
  redrawAllNodes,
  redrawAllLinks,
  recomputeDisplayedElement
) => {
  const {data}=dict_variable_application_data
  const {levelTags} = data

  if(Object.keys(levelTags).includes('Primaire')){

    if (Object.keys(levelTags['Primaire'].tags).length < 2) {
      return <></>
    }
    const tmp = Object.entries(levelTags['Primaire'].tags).filter(tag=>tag[1].selected)
    const selected = tmp.length > 0 ? tmp[0][0] : ''
    return (
      <>
        <tr>
          <td >
            {<Form.Select style={{ width: '200px', color: 'black' }} key={levelTags['Primaire'].group_name} value={selected}  onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {

              delete_local_aggregation(data)
              handleSimpleDropdown(evt, levelTags['Primaire'])
              recomputeDisplayedElement()
              redrawAllNodes()
              redrawAllLinks()    
              reDrawLegend()

            }}>{
                Object.entries(levelTags['Primaire'].tags).map(([tag_key, tag],i) => {
                  return (<option key={i} value={tag_key}>{tag.name}</option>)
                })}
            </Form.Select>}
          </td>
        </tr>
      </>)
  }else{
    return <></>
  }

}
export const col_title_level_filter : col_title_level_filterFType = (
  t:TFunction,
  data:SankeyData
)=>{
  const {levelTags}=data
  let banner_grouptag = Object.entries(levelTags).filter(([, tags_group]) => tags_group.banner !== 'none')

  const nb_level_tag = Object.values(levelTags).filter(tags_group=>(Object.keys(tags_group.tags).length > 0 )).length
  if (nb_level_tag > 1) {
    banner_grouptag = Object.entries(levelTags).filter(([, tags_group]) => tags_group.group_name !== 'Primaire' && Object.keys(tags_group.tags).length > 0)
  } else {
    banner_grouptag = Object.entries(levelTags).filter(([, tags_group]) => Object.keys(tags_group.tags).length > 1)
  }

  const levelTags_has_siblings=banner_grouptag.filter(([,tagGroup])=>tagGroup.siblings !== undefined && tagGroup.siblings.length > 0).length>0
  return <FormGroup as={Row}><Col xs={6}>{t('Menu.group')}</Col>{levelTags_has_siblings?<Col xs={6}>{t('Banner.select_sibling')}</Col>:<></>}</FormGroup>

}

export const addAllDropDownNode : addAllDropDownNodeFType = (
  t:TFunction,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  level:boolean,
  reDrawLegend,
  redrawAllNodes,
  redrawAllLinks,
  recomputeDisplayedElement
) => {
  const color = 'black'
  const {nodeTags,levelTags} = data
  const [forceUpdate,setForceUpdate]=useState(false)
  let banner_grouptag = Object.entries(nodeTags).filter(([, tags_group]) => tags_group.banner !== 'none')
  if (level) {
    const nb_level_tag = Object.values(levelTags).filter(tags_group=>(Object.keys(tags_group.tags).length > 0 )).length
    if (nb_level_tag > 1) {
      banner_grouptag = Object.entries(levelTags).filter(([, tags_group]) => tags_group.group_name !== 'Primaire' && Object.keys(tags_group.tags).length > 0)
    } else {
      banner_grouptag = Object.entries(levelTags).filter(([, tags_group]) => Object.keys(tags_group.tags).length > 1)
    }
  }
  const allDD = banner_grouptag.map(([, tags_group]) => {
    const tags_selected=Object.entries(data['nodeTags']).filter((k)=>{return k[1]==tags_group})[0]

    if (tags_group.banner == 'one' ) {
      return (
        <FormGroup as={Row}>
          <Row>
            <Col xs={10}>
              <FormLabel style={{ color: color }}>
                {tags_group.group_name}
              </FormLabel>
            </Col>
          </Row>
          <Row>
            <OverlayTrigger
              key={'Banner.ndd_lst.5'}
              placement={'bottom'}
              delay={500}
              overlay={<Tooltip id={'Banner.ndd_lst.5'}>{t('Banner.ndd_lst')} </Tooltip>}>
              <Col xs={10}>
                {<Form.Select
                  style={{ width: '200px', color: 'black' }}
                  key={tags_group.group_name}
                  onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
                    handleSimpleDropdown(evt, tags_group) 
                    recomputeDisplayedElement()
                    setForceUpdate(!forceUpdate)
                    redrawAllNodes()
                    redrawAllLinks()    
                    reDrawLegend()
                  
                  }}>{
                    Object.entries(tags_group.tags).map(([tag_key, tag],i) => {
                      return (<option key={i} value={tag_key}>{tag.name}</option>)
                    })}
                </Form.Select>}
              </Col>
            </OverlayTrigger>
            <Col xs={2}>
              <OverlayTrigger
                key={'Banner.ndd_chk.5'}
                placement={'bottom'}
                delay={500}
                overlay={<Tooltip id={'Banner.ndd_chk.5'}>{t('Banner.ndd_chk')} </Tooltip>}>
                <FormCheck
                  inline
                  type='switch'
                  checked={data.colorMap==tags_selected[0]}
                  onChange={evt => {
                    Object.values(data.nodeTags).forEach(tags_group => tags_group.show_legend = false)
                    Object.values(data.fluxTags).forEach(tags_group => tags_group.show_legend = false)
                    Object.values(data.dataTags).forEach(tags_group => tags_group.show_legend = false)
                    Object.values(data.nodes).forEach(el => {
                      el.colorParameter = 'local'
                      el.colorTag = 'no_colormap'
                    })
                    Object.values(data.links).forEach(el => {
                      el.colorTag = 'no_colormap'
                    })
                    data.colorMap = 'no_colormap'
                    if(evt.target.checked){
                      Object.values(data.nodes).forEach(el => {
                        el.colorParameter = 'groupTag'
                        el.colorTag = tags_selected[0]
                      })
                      Object.values(data.links).forEach(el => {
                        el.colorTag = 'no_colormap'
                      })
                      data.colorMap = tags_selected[0]
                      data['nodeTags'][tags_selected[0]].show_legend = true
                    }
                    setForceUpdate(!forceUpdate)
                    redrawAllNodes()
                    redrawAllLinks()
                    reDrawLegend()

                  }}
                />
              </OverlayTrigger>
            </Col>
          </Row>
        </FormGroup>)
    }
    else if (tags_group.banner === 'level' && Object.values(tags_group.tags).length > 0) {
      if (Object.keys(tags_group.tags).length < 1 ) {
        return <></>
      }
      const tmp = Object.entries(tags_group.tags).filter(tag=>tag[1].selected)
      const selected = tmp.length > 0 ? tmp[0][0] : ''
      return (
        <FormGroup as={Row}>
          <Row>
            {banner_grouptag.length > 1 ? <FormLabel style={{ color: color }}>{tags_group.group_name}</FormLabel> : <></>}
          </Row>
          <Row>
            <Col xs={11}>
              <Form.Select
                style={{color: 'black' }}
                key={tags_group.group_name}
                value={selected}
                onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
                  delete_local_aggregation(data)
                  handleSimpleDropdown(evt, tags_group)

                  recomputeDisplayedElement()
                  setForceUpdate(!forceUpdate)
                  redrawAllNodes()
                  redrawAllLinks()    
                  reDrawLegend()

                }}>{
                  Object.entries(tags_group.tags).map(([tag_key, tag],i) => {
                    return (<option key={i} value={tag_key}>{tag.name}</option>)
                  })}
              </Form.Select>
            </Col>
            {tags_group.siblings !== undefined && tags_group.siblings.length > 0 ?
              <Col xs={1} style={{margin:'auto'}}>
                <Checkbox
                  isChecked={tags_group.activated}
                  icon={tags_group.activated?<FaEye style={{fill:'rgb(120, 194, 173)'}}/>:<FaEyeSlash/>}
                  onChange={evt => {
                    tags_group.activated = evt.target.checked
                    const first_antagonist_tag = data.levelTags[tags_group.siblings[0]]
                    // Respectively activate and desactivate in the two antagonist tags  group
                    // Same as of current tag group
                    first_antagonist_tag.siblings.forEach(sibling=>data.levelTags[sibling].activated = tags_group.activated)
                    // Opposed to current tag group
                    tags_group.siblings.forEach(sibling=>data.levelTags[sibling].activated = !tags_group.activated)
                    setForceUpdate(!forceUpdate)
                    redrawAllNodes()
                    redrawAllLinks()
                    reDrawLegend()
                  }}
                />
              </Col> : <></>
            }
          </Row>
        </FormGroup>)
    }
    else if (tags_group.banner == 'multi') {
      const options = Object.entries(tags_group.tags).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name } })
      const selected = Object.entries(tags_group.tags).filter(d => d[1].selected).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name } })

      return (
        <FormGroup as={Row}>
          <Row>
            <Col xs={10}>
              <FormLabel style={{ color: color }}>{tags_group.group_name}
              </FormLabel>
            </Col>
          </Row>
          <Row>
            <OverlayTrigger
              key={'Banner.ndd_lst.3'}
              placement={'bottom'}
              delay={500}
              overlay={<Tooltip id={'Banner.ndd_lst.3'}>{t('Banner.ndd_lst')} </Tooltip>}>
              <Col xs={10}>
                <MultiSelect
                  className={'multidropdown_filter_node_link'}
                  style={{widthMax:'200px', color: 'black' }}
                  valueRenderer={(selected:selected_type[]) => {
                    return selected.length ? selected.map(({ label }) => label + ', ') : 'Aucun tag sélectionné'
                  }}
                  labelledBy={'dropdown_node_filter'}
                  overrideStrings={{
                    'selectAll': 'Tout sélectionner',
                  }}
                  value={selected}
                  options={options}
                  onChange={(selected: [{ label: string, value: string }]) => {
                    HandleMultiDropdown(selected, tags_group, data)
                    setForceUpdate(!forceUpdate)
                    redrawAllNodes()
                    redrawAllLinks()
                    reDrawLegend()
                  }}
                />
              </Col>
            </OverlayTrigger>
            <Col xs={2}>
              <OverlayTrigger
                key={'Banner.ndd_chk.3'}
                placement={'bottom'}
                delay={500}
                overlay={<Tooltip id={'Banner.ndd_chk.3'}>{t('Banner.ndd_chk')} </Tooltip>}>
                <FormCheck
                  inline
                  type='switch'
                  checked={data.colorMap==tags_selected[0]}
                  onChange={evt => {
                    Object.values(data.nodeTags).forEach(tags_group => tags_group.show_legend = false)
                    Object.values(data.fluxTags).forEach(tags_group => tags_group.show_legend = false)
                    Object.values(data.dataTags).forEach(tags_group => tags_group.show_legend = false)
                    Object.values(data.nodes).forEach(el => {
                      el.colorParameter = 'local'
                      el.colorTag = 'no_colormap'
                    })
                    Object.values(data.links).forEach(el => {
                      el.colorTag = 'no_colormap'
                    })
                    data.colorMap = 'no_colormap'
                    if(evt.target.checked){
                      Object.values(data.nodes).forEach(el => {
                        el.colorParameter = 'groupTag'
                        el.colorTag = tags_selected[0]
                      })
                      Object.values(data.links).forEach(el => {
                        el.colorTag = 'no_colormap'
                      })
                      data.colorMap = tags_selected[0]
                      data['nodeTags'][tags_selected[0]].show_legend = true
                    }
                    setForceUpdate(!forceUpdate)
                    redrawAllNodes()
                    redrawAllLinks()
                    reDrawLegend()

                  }}
                />
              </OverlayTrigger>
            </Col>
          </Row>
        </FormGroup>)
    }
  })
  return (<>{allDD}</>)
}

/**
 *
 *
 * @param {React.ChangeEvent<HTMLSelectElement>} evt
 * @param {TagsGroup} tags_group
 * @param {SankeyData} data
 * @param {(data: SankeyData) => void} set_data
 * @returns {(void) => void}
 */
const handleSimpleDropdown  = (
  evt: React.ChangeEvent<HTMLSelectElement>,
  tags_group: TagsGroup,
) => {
  const val = evt.target.value
  Object.entries(tags_group.tags).forEach(tag => tag[1].selected = val === tag[0])
}

/**
 *
 *
 * @param {[{ label: string, value: string }]} selected
 * @param {TagsGroup} tags_group
 * @param {SankeyData} data
 * @param {(data: SankeyData) => void} set_data
 * @returns {(void) => void}
 */
const HandleMultiDropdown = (selected: [{ label: string, value: string }], tags_group: TagsGroup, data: SankeyData,
) => {
  const tab_sel = selected.map((d) => {
    return d.value
  })
  Object.entries(tags_group.tags).forEach(tag => tag[1].selected = tab_sel.includes(tag[1].name))
  // Permet d'eviter de désélectionner tous les dataTags ce qui créerait une erreur
  if(tab_sel.length==0 && Object.values(data.dataTags).map(dt=>dt.group_name).includes(tags_group.group_name)){
    Object.entries(tags_group.tags)[0][1].selected=true
  }
}



declare const window: Window &
  typeof globalThis & {
    SankeyToolsStatic: boolean
    sankey: {
      sous_filieres: { [key: string]: string }
      help: { [key: string]: string }
      excel: string
      structure: boolean,
      advanced: boolean
    } & { [key: string]: SankeyData }
  }

export const setDiagram:setDiagramFuncType = (
  the_diagram : string,
  set_data : (d:SankeyData)=>void,
  convert_data:ConvertDataFuncType,
  DefaultSankeyData: ()=>SankeyData,
) => {
  const sous_filieres = window.sankey.sous_filieres

  const new_data = JSON.parse(
    JSON.stringify(
      window.sankey[sous_filieres[the_diagram]]
    )
  ) as SankeyData
  convert_data(new_data,DefaultSankeyData)
  d3.select(' .opensankey #svg').on('.zoom', null)
  set_data({ ...new_data })
}

/**
 * Fucntion to create the toolbar component, the toolbar is used to edit the sankey quicly
 */
export const ToolbarBuilder : ToolbarBuilderFType = (
  t:TFunction,
  dict_variable_application_data,
  dict_variable_elements_selected,
  filter,
  set_current_filter,
  detail_level,
  url_prefix,
  first_selected_node,
  GetSankeyMinWidthAndHeight,
  dict_hook_ref_setter_show_dialog_components,
  never_see_again,
  additional_link_visual_filter_content,
  reDrawLegend,
  redrawAllNodes,
  redrawAllLinks,
  recomputeDisplayedElement,
  ComponentUpdater
) => {

  const {data,set_data}=dict_variable_application_data
  const { ref_getter_mode_selection,ref_setter_mode_selection } = dict_variable_elements_selected
  const {updateComponentToolbar} =ComponentUpdater
  // ===================Create hooks used in this component========================

  const target_link_threshold=useRef(null)
  const target_detail_level=useRef(null)
  const node_tag_filter=useRef(null)
  const link_tag_filter=useRef(null)
  const data_tag_filter=useRef(null)

  const [s_show_node_tag_filter,sShowNodeTagFilter]=useState(false)
  const [s_show_link_tag_filter,sShowLinkTagFilter]=useState(false)
  const [s_show_data_tag_filter,sShowDataTagFilter]=useState(false)
  const [s_show_link_threshold,sShowLinkThreshold]=useState(false)
  const [s_show_detail_level,sShowDetailLevel]=useState(false)
  const [s_show_data_type,sShowDataType]=useState(false)

  const [s_is_data_type_reconcilied,sIsDataTypeReconcilied]=useState(['reconciled', 'free_value','free_interval'].includes(data.show_structure))
  const [s_force_update,sforceUpdate]=useState(false)
  updateComponentToolbar.current=()=>setForceUpdate(!s_force_update)
  const data_type_not_reconcilied= ['data', 'structure', 'free_value', 'free_interval'].includes(data.show_structure)
  const [s_type_value,sTypeValue]=useState<'data' | 'structure' | 'reconciled'>(data_type_not_reconcilied?(data.show_structure as 'data' | 'structure' | 'reconciled') :'reconciled')
  const [mode_selection,sModeSelection]=useState('ln')
  const [forceUpdate,setForceUpdate]=useState(false)

  ref_getter_mode_selection.current=mode_selection
  ref_setter_mode_selection.current=sModeSelection

  const node_filter = Object.entries(data.nodeTags).filter(([, v]) => v.banner !== 'none' && v.banner !== 'level').length > 0
  const flux_filter = Object.entries(data.fluxTags).filter(([, v]) => v.banner !== 'none').length > 0
  const level_filter = Object.entries(data.levelTags).length > 0
  const DT_length=Object.keys(data.dataTags).length
  const opacity_advanced =  !window.SankeyToolsStatic ? '0.3' : '0'

  /**
   * Change the mouse behavior
   */
  const setSelectionMode = (val: string) => {
    sModeSelection(val)
    //- trigger update
    const tutu = filter
    set_current_filter(filter+1)
    set_current_filter(tutu)
    d3.selectAll(' .opensankey #svg #path-flux').remove()
    if(val=='s' && (Object.values(data.nodes).filter(d => d.name == 'node_tmp').length > 0 || first_selected_node.current)){
      data.nodes=Object.fromEntries(Object.entries(data.nodes).filter(n=>n[1].name!='node_tmp'))
      first_selected_node.current = undefined
    }
  }


  // Get the maximum value a link can have, so it is used as maximum value we wan filter in popover_link_visual_filter
  let max_link_value = 0
  Object.values(data.links).forEach(link => {
    const new_max_link_value = FindMaxLinkValue(
      max_link_value,
      link.value
    )
    max_link_value = new_max_link_value > max_link_value ? new_max_link_value : max_link_value
  })
  max_link_value += 1



  const legend_filter=<FormGroup as={Row}>
    <Col xs={9}>
      {t('Menu.group')}
    </Col>
    <Col xs={3}>
      {t('Menu.color')}
    </Col>
  </FormGroup>

  const logo_btn_fs=s_force_update ? faCompress : faExpand

  // ===================Create the popover diplayed near the buttons========================
  // Checkbox that adjust the label position according to the link stroke width
  const isAllLinksLabelPosOrthAuto=IsAllLinkNotLocalAttrSameValue(data,Object.values(data.links),['label_pos_auto'])
  const content_adjust_label_pos =<>
    {/* Button to adjust label position in case the label is bigger than the link */}
    <OverlayTrigger
      key={'Menu.tooltips.flux.ajust_label'}
      placement={'top'}
      delay={500}
      overlay={<Tooltip id={'Menu.tooltips.flux.if'}>{t('Flux.tooltips.ajust_label')} </Tooltip>}>
      <Form.Group as={Row}>
        <Col>
          <Checkbox

            sx={SmoothClasses({})}
            className='btn_menu_config'
            isChecked={isAllLinksLabelPosOrthAuto['label_pos_auto'][0] as boolean}
            isIndeterminate={isAllLinksLabelPosOrthAuto['label_pos_auto'][1]}
            iconColor={isAllLinksLabelPosOrthAuto['label_pos_auto'][1]?'#78C2AD':'white'}
            maxW={'100%'}
            onChange={
              (evt) => {
                Object.entries(data.links).map(d => {
                  d[1].label_pos_auto=evt.target.checked
                })
                setForceUpdate(!forceUpdate)

                redrawAllNodes()
                redrawAllLinks()
                reDrawLegend()              }}>{t('Flux.ajust_label')}</Checkbox></Col>
      </Form.Group></OverlayTrigger>
  </>
  //Popover element to handle filter on links, it contians :
  // - filter on link (if value of link is inferior to filter then the link is not displayed)
  // - filter on link label
  const popover_link_visual_filter=<Popover id="popover-link-filter" style={{maxWidth:'100%',maxHeight:'600px'}}>
    <Popover.Header as="h3">{t('Banner.p_aff')}</Popover.Header>
    <Popover.Body >
      <Form>
        <h5>{t('Banner.p_aff_filtre_links')}</h5>

        <Form.Group as={Row} >
          <Col>
            <FormLabel >{t('Banner.filtre')}</FormLabel>
          </Col>
          <Col>
            <Form.Range
              min="0"
              max={max_link_value}
              value={filter}
              onChange={evt => set_current_filter(Number(evt.target.value))} />
          </Col>
          <Col>
            <FormControl
              size='sm'
              type='number'
              min={0}
              max={filter}
              value={filter}
              onChange={(evt)=>{
                let tmp=+evt.target.value
                if(tmp>max_link_value){
                  tmp=max_link_value
                }
                set_current_filter(tmp)
              }}
            />
          </Col>
        </Form.Group>
        <Form.Group as={Row} >
          <Col>
            <FormLabel>{t('Banner.fl')}</FormLabel>
          </Col>
          <Col >
            <Form.Range
              min="0"
              max={max_link_value}
              value={data.display_style.filter_label}
              onChange={evt => {
                data.display_style.filter_label = +evt.target.value
                setForceUpdate(!forceUpdate)

                redrawAllNodes()
                redrawAllLinks()
                reDrawLegend()              }}
            />
          </Col>
          <Col>
            <FormControl
              size='sm'
              type='number'
              min={0}
              max={max_link_value}
              value={data.display_style.filter_label}
              onChange={(evt)=>{
                let tmp=+evt.target.value
                if(tmp>max_link_value){
                  tmp=max_link_value
                }
                data.display_style.filter_label = tmp
                setForceUpdate(!forceUpdate)

                redrawAllNodes()
                redrawAllLinks()
                reDrawLegend()
              }}
            />
          </Col>
        </Form.Group>
        {content_adjust_label_pos}
        {additional_link_visual_filter_content}
      </Form>
    </Popover.Body>
  </Popover>





  const struc_data_reconciled=<Popover id='popover-details-level'>
    <Popover.Header as="h3">{t('Banner.sdr')}</Popover.Header>
    <Popover.Body>
      <FormGroup as={Row}>
        <Form.Label>{t('Banner.type_value')}</Form.Label>

        <Form.Select
          value={s_type_value}
          onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
            data.show_structure = evt.target.value as 'data' | 'structure' | 'reconciled'
            sTypeValue(evt.target.value as 'data' | 'structure' | 'reconciled')
            if(evt.target.value==='reconciled'){
              sIsDataTypeReconcilied(true)
            }else{
              sIsDataTypeReconcilied(false)
            }
            setForceUpdate(!forceUpdate)
            redrawAllNodes()
            redrawAllLinks()
            reDrawLegend()
          }}>
          <option key='structure'  value='structure' >{t('Banner.t_v_s')}</option>
          <option key='data'       value='data'      >{t('Banner.t_v_c')}</option>
          <option key='reconciled' value='reconciled'>{t('Banner.t_v_r')}</option>
          {/* <option key='free_interval' value='free_interval' >Données réconciliées+flux indéterminés (intervalles)</option> */}
          {/* <option key='free_value' value='free_value' >Données réconciliées+flux indéterminés (valeurs)</option> */}
        </Form.Select>
      </FormGroup>

      <Form.Group style={{ display:s_is_data_type_reconcilied?'':'none'}}  as={Row}>
        <Form.Label>{t('Banner.indetermined_value')}</Form.Label>
        <Form.Select
          value={data.show_structure}
          onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
            data.show_structure = evt.target.value as 'reconciled' | 'free_value' | 'free_interval'
            setForceUpdate(!forceUpdate)
            redrawAllNodes()
            redrawAllLinks()
            reDrawLegend()
          }}>
          <option key='none'  value='reconciled' >{t('Banner.t_v_s')}</option>
          <option key='free_interval' value='free_interval' >{t('Banner.t_v_i')}</option>
          <option key='free_value' value='free_value' >{t('Banner.t_v_pv')}</option>
        </Form.Select>
      </Form.Group>
    </Popover.Body>
  </Popover>
  const node_tag_filter_content=addAllDropDownNode(t,data,set_data,false,reDrawLegend,redrawAllNodes,redrawAllLinks,recomputeDisplayedElement)
  //Popover element to handle node tags
  // Its a list of dropdown for each groupNodeTag where we can choose wiche group to apply and wiche tag from these group to display when selected
  const filter_color_node=<Popover id='tooltip-link-color-filter' style={{minWidth:'350px'}}>
    <Popover.Header as="h3">{t('Banner.fdn')}</Popover.Header>
    <Popover.Body style={{  marginLeft: '5px'}}>
      {legend_filter}
      <>{ (Object.entries(data.nodeTags).filter(([, v]) => v.banner !== 'none').length > 0) ? (<>
        {node_tag_filter_content}</>
      ) : (<>
        <Form.Control placeholder="Pas de filtrage" style={{ opacity: opacity_advanced, color: '#6c757d' }} disabled /></>)
      }</>
    </Popover.Body>
  </Popover>

  //Popover element to handle the display of data tags
  const filter_data=<Popover id='tooltip-data-color-filter' style={{minWidth:'350px'}}>
    <Popover.Header as="h3">{t('Banner.sdd')}</Popover.Header>
    <Popover.Body>
      {legend_filter}
      <FormGroup as={Row}>
        <Col xs={10}>
          {addAllDropDownLinks(dict_variable_application_data,reDrawLegend,redrawAllNodes,redrawAllLinks,recomputeDisplayedElement)}
        </Col>
        <Col xs={2}>
          <FormCheck
            type='switch'
            style={{marginLeft: '-2em'}}
            checked={(DT_length>0)?(Object.values(data.dataTags).slice(DT_length-1,DT_length)[0].show_legend):false}
            onChange={evt=> {
              //Déselecitonne tous les type de tag
              Object.values(data.nodeTags).forEach(tags_group => tags_group.show_legend = false)
              Object.values(data.fluxTags).forEach(tags_group => tags_group.show_legend = false)
              Object.values(data.dataTags).forEach(tags_group => tags_group.show_legend = false)

              Object.values(data.nodes).forEach(el => {
                el.colorParameter = 'local'
                el.colorTag = 'no_colormap'
              })

              Object.values(data.links).forEach(el => {
                el.colorTag = 'no_colormap'
              })

              data.colorMap = 'no_colormap'

              //Met le dernier dataTag en tant que couleur a suivre pour les flux
              if(evt.target.checked){
                Object.values(data.nodes).forEach(el => {
                  el.colorParameter = 'groupTag'
                  el.colorTag = 'no_colormap'
                })
                Object.values(data.links).forEach(el => {
                  el.colorTag = 'no_colormap'
                })
                data.colorMap = 'dataTags_'+Object.keys(data.dataTags).slice(DT_length-1,DT_length)[0]
                Object.values(data.dataTags).slice(DT_length-1,DT_length)[0].show_legend=evt.target.checked
              }

              setForceUpdate(!forceUpdate)
              redrawAllNodes()
              redrawAllLinks()
              reDrawLegend()
            }}
          />
        </Col>
      </FormGroup>
    </Popover.Body>
  </Popover>

  //Popover element to handle the display of link tags
  const filter_color_link=<Popover id='tooltip-node-color-filter' style={{minWidth:'350px'}}>
    <Popover.Header as="h3">{t('Banner.fdf')}</Popover.Header>
    <Popover.Body style={{  marginLeft: '5px'}}>
      {legend_filter}
      {AddAllDropDownFlux(t, data.fluxTags, data, set_data,reDrawLegend,redrawAllNodes,redrawAllLinks,recomputeDisplayedElement)}
    </Popover.Body>
  </Popover>


  // ===========Creation Button to show popover========================

  const button_fullscreen=<>
    <OverlayTrigger
      key={'tooltip-fullscreen'}
      placement={'left'}
      delay={500}
      overlay={<Tooltip id={'tooltip-fullscreen'}>{s_force_update?t('Banner.quit_fullscreen'):t('Banner.fullscreen')} </Tooltip>}
    >
      <Button variant='light' id='button-fullscreen'
        onClick={()=>{
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
          } else if (document.exitFullscreen) {
            document.exitFullscreen()
          }
          sforceUpdate(!s_force_update)
        }}
      >
        <Col><FontAwesomeIcon icon={logo_btn_fs} /></Col>
      </Button>
    </OverlayTrigger>
  </>

  let btn_mouse_mode_edition=<></>

  // Add button for the edition of the sankey
  if(!window.SankeyToolsStatic){
    btn_mouse_mode_edition=<>
      {/* Boutons permettant soit de passer la souris en mode sélection soit en mode création noeud/flux */}
      <OverlayTrigger
        key={'tooltip-liaison'}
        placement={'left'}
        delay={500}
        overlay={<Tooltip id={'tooltip-liason'}>{(mode_selection == 's')?t('Banner.tooltipLiason'):t('Banner.tooltipSelection')} </Tooltip>}>
        <Button variant={(!(mode_selection == 'ln')) ? 'secondary' : 'secondary'} onClick={() => {
          if(mode_selection=='ln'){
            setSelectionMode('s')
          }else{
            setSelectionMode('ln')
          }
        }} >
          <Col><FontAwesomeIcon icon={(mode_selection == 's')?faShareNodes:faArrowPointer}/></Col>
        </Button>
      </OverlayTrigger>
    </>

  }

  const btn_aggrega_level=(level_filter)?<>
    <OverlayTrigger
      key={'tooltip-nodes-level'}
      placement={'left'}
      rootClose
      overlay={<Tooltip id={'tooltip-nodes-level'}>{t('Banner.hlp_1_txt_2')} </Tooltip>}>
      <Button ref={target_detail_level} variant='warning' id='button-details-level' onClick={()=>{sShowDetailLevel(!s_show_detail_level)}} >
        <Col><FontAwesomeIcon icon={faFolderTree} /></Col>
      </Button>
    </OverlayTrigger>
    <Overlay
      key={'popover-nodes-level'}
      placement={'left'}
      target={target_detail_level}
      rootClose
      show={s_show_detail_level}
      onHide={()=>{sShowDetailLevel(false)}}
    >
      {detail_level}
    </Overlay></>
    :
    <></>

  const btn_link_display=<><OverlayTrigger
    key={'tooltip-link-filter2'}
    placement={'left'}
    delay={500}
    overlay={<Tooltip id={'tooltip-link-filter2'}>{t('Banner.hlp_1_txt_8')} </Tooltip>}
  >
    <Button ref={target_link_threshold} variant='danger' id='button-filter-link'
      onClick={()=>{
        sShowLinkThreshold(!s_show_link_threshold)
      }}
    >
      <Col><FontAwesomeIcon icon={faSliders} /></Col>
    </Button>
  </OverlayTrigger>
  {/* Popover to display the link-filter */}
  <Overlay
    key={'overlay-popover-link-filter'}
    placement={'left'}
    target={target_link_threshold}
    rootClose
    show={s_show_link_threshold}
    onHide={()=>{sShowLinkThreshold(false)}}
  >
    {popover_link_visual_filter}
  </Overlay></>


  const btn_show_data_type=url_prefix !== '' ?<><OverlayTrigger
    key={'tooltip-structur'}
    placement={'left'}
    rootClose
    overlay={<Tooltip id={'tooltip-datatype'}>{t('Banner.sdr')} </Tooltip>}>
    <Button variant='success'
      onClick={()=>{
        sShowDataType(!s_show_data_type)
      }}
    >
      <Col><FontAwesomeIcon icon={faDiagramProject} /></Col>

    </Button>
  </OverlayTrigger>
  {/* Popover to display selector of datatype */}
  <Overlay
    key={'overlay-popover-data-type'}
    placement={'left'}
    target={target_link_threshold}
    rootClose
    show={s_show_data_type}
    onHide={()=>{sShowDataType(false)}}
  >
    {struc_data_reconciled}
  </Overlay>
  </>
    :
    <OverlayTrigger
      key={'tooltip-structur'}
      placement={'left'}
      delay={500}
      overlay={<Tooltip id={'tooltip-structur'}>{t('Banner.tooltipStructure')} </Tooltip>}>
      <Button variant={'success'} onClick={() => {
        data.show_structure = data.show_structure == 'reconciled' ? 'structure' : 'reconciled'
        setForceUpdate(!forceUpdate)
        redrawAllNodes()
        redrawAllLinks()
        reDrawLegend()
        
      }} >
        <Col><FontAwesomeIcon icon={faCodeBranch} /></Col>
      </Button>
    </OverlayTrigger>

  const btn_show_node_filter=(node_filter)?<>
    <OverlayTrigger
      key={'tooltip-node-tag'}
      placement={'left'}
      overlay={<Tooltip id={'tooltip-node-tag-filter'}>{t('Banner.hlp_node_tag_filter')} </Tooltip>}
      rootClose
    >
      <Button ref={node_tag_filter} size='sm' variant='info'
        onClick={()=>{
          sShowNodeTagFilter(!s_show_node_tag_filter)
        }}
      >
        {logo_btn_node}
      </Button>
    </OverlayTrigger>
    {/* Popover to display the node tag filter */}
    <Overlay
      key={'overlay-popover-node-tag-filter'}
      placement={'left'}
      target={target_link_threshold}
      rootClose
      show={s_show_node_tag_filter}
      onHide={()=>{sShowNodeTagFilter(false)}}
    >
      {filter_color_node}
    </Overlay>
  </>
    :
    <></>

  const btn_show_link_filter=(flux_filter)?<>

    <OverlayTrigger
      key={'tooltip-link-tag'}
      placement={'left'}
      rootClose
      overlay={<Tooltip id={'tooltip-link-tag-filter'}>{t('Banner.hlp_link_tag_filter')} </Tooltip>}>

      <Button ref={link_tag_filter} size='sm' variant='info'
        onClick={()=>{
          sShowLinkTagFilter(!s_show_link_tag_filter)
        }}
      >{logo_btn_filter_link}</Button>

    </OverlayTrigger>

    <Overlay
      key={'popover-link-tag-filter'}
      placement={'left'}
      target={link_tag_filter}
      rootClose
      show={s_show_link_tag_filter}
      onHide={()=>{sShowLinkTagFilter(false)}}
    >
      {filter_color_link}
    </Overlay></>
    :
    <></>

  const btn_show_data_filter=(Object.values(data.dataTags).length>0)?<>
    <OverlayTrigger
      key={'tooltip-data-filter'}
      placement={'left'}
      rootClose
      overlay={<Tooltip id={'tooltip-data-tag-filter'}>{t('Banner.hlp_data_tag_filter')} </Tooltip>}>
      <Button ref={data_tag_filter} size='sm' style={{color:'#fff',background:'#B13F06',borderColor:'#B13F06'}}
        onClick={()=>{
          sShowDataTagFilter(!s_show_data_tag_filter)
        }}
      >
        <FontAwesomeIcon icon={faDatabase} />
      </Button>
    </OverlayTrigger>
    <Overlay
      key={'popover-data-tag-filter'}
      placement={'left'}
      target={data_tag_filter}
      rootClose
      show={s_show_data_tag_filter}
      onHide={()=>{sShowDataTagFilter(false)}}
    >
      {filter_data}
    </Overlay></>
    :
    <></>
  const btn_show_help_in_static=window.SankeyToolsStatic ? <OverlayTrigger
    key={'tooltip-help'}
    placement={'left'}
    delay={500}
    overlay={<Tooltip id={'tooltip-help'}>{t('Banner.tooltipHelp')}</Tooltip>
    }
  >
    <Button variant='info' onClick={() => { never_see_again.current = false;localStorage.removeItem('dontSeeAggainWelcome'),dict_hook_ref_setter_show_dialog_components.ref_setter_show_modal_welcome.current!(true) }} >
      <Col> ? </Col>
    </Button>
  </OverlayTrigger> : <></>


  // ===================Assemble different item for the toolbar========================

  return <>
    {btn_mouse_mode_edition}

    {/* Add the button to choose the aggregation level  */}
    {btn_aggrega_level}

    {/* Popover to display the link visual filter */}
    {btn_link_display}

    {/* Button to display node, link & data Tags filter */}
    {btn_show_node_filter}
    {btn_show_link_filter}
    {btn_show_data_filter}
    { btn_show_data_type}

    {stretchButtons(data,GetSankeyMinWidthAndHeight,t)}

    {btn_show_help_in_static}

    {button_fullscreen}
  </>



}


export const stretchButtons : stretchButtonsFType =(
  data:SankeyData,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  t:TFunction
)=>{
  return <> <OverlayTrigger
    key={'tooltip-adjust-h'}
    placement={'left'}
    delay={500}
    overlay={<Tooltip id={'tooltip-adjust-h'}>{t('Banner.tooltipAdjustH')} </Tooltip>}>
    <Button variant='dark' onClick={() => {AdjustSankeyZone(data,GetSankeyMinWidthAndHeight)}} >
      <Col><FontAwesomeIcon icon={faArrowsLeftRight} /></Col>
    </Button>
  </OverlayTrigger>
  <OverlayTrigger
    key={'tooltip-adjust-v'}
    placement={'left'}
    delay={500}
    overlay={<Tooltip id={'tooltip-adjust-v'}>{t('Banner.tooltipAdjustV')} </Tooltip>}>
    <Button variant='dark' onClick={() => {AdjustSankeyZone(data,GetSankeyMinWidthAndHeight,false,true)}} >
      <Col><FontAwesomeIcon icon={faArrowsUpDown} /></Col>
    </Button>
  </OverlayTrigger></>
}

/**
 * Function that generate dropdown for each groupTag of linkTags
 */
export const AddAllDropDownFlux : AddAllDropDownFluxFType = (
  t:TFunction,
  fluxTags: TagsCatalog,
  data: SankeyData,
  set_data: (data: SankeyData) => void,
  reDrawLegend,
  redrawAllNodes,redrawAllLinks,
  recomputeDisplayedElement
) =>
{
  const [forceUpdate,setForceUpdate]=useState(false)

  const banner_grouptag = Object.values(fluxTags).filter(tags_group => { return ((tags_group as TagsGroup).banner == 'one' || (tags_group as TagsGroup).banner == 'multi') })
  const allDD = banner_grouptag.map(tags_group => {
    const the_tags_group = tags_group as TagsGroup
    const tags_selected=Object.entries(data['fluxTags']).filter((k)=>{return k[1]==the_tags_group})[0]

    if (the_tags_group.banner == 'one') {
      return (
        <FormGroup as={Row}>
          <Row>
            <Col xs={10}>
              <FormLabel>{the_tags_group.group_name}</FormLabel>
            </Col>
          </Row>
          <Row>
            <OverlayTrigger
              key={'Banner.ndd_lst.1'}
              placement={'bottom'}
              delay={500}
              overlay={<Tooltip id={'Banner.ndd_lst.1'}>{t('Banner.ndd_lst')} </Tooltip>}>
              <Col xs={10}>
                {<Form.Select
                  key={the_tags_group.group_name}
                  onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
                    handleSimpleDropdown(evt, the_tags_group) 
                    recomputeDisplayedElement()
                    setForceUpdate(!forceUpdate)
                    redrawAllNodes()
                    redrawAllLinks()    
                    reDrawLegend()                  
                  }}>{
                    Object.entries(the_tags_group.tags).map(([tag_key, tag],i) => {
                      return (<option key={i} value={tag_key}>{tag.name}</option>)
                    })}
                </Form.Select>}
              </Col>
            </OverlayTrigger>
            <Col xs={2} >
              <OverlayTrigger
                key={'Banner.ndd_chk.1'}
                placement={'bottom'}
                delay={500}
                overlay={<Tooltip id={'Banner.ndd_chk.1'}>{t('Banner.ndd_chk')} </Tooltip>}>
                <FormCheck
                  inline
                  type='switch'
                  checked={data.colorMap==tags_selected[0]}
                  onChange={evt => {
                    Object.values(data.nodeTags).forEach(tags_group => tags_group.show_legend = false)
                    Object.values(data.fluxTags).forEach(tags_group => tags_group.show_legend = false)
                    Object.values(data.dataTags).forEach(tags_group => tags_group.show_legend = false)

                    Object.values(data.nodes).forEach(el => {
                      el.colorParameter = 'local'
                      el.colorTag = 'no_colormap'
                    })

                    Object.values(data.links).forEach(el => {
                      el.colorTag = 'no_colormap'
                    })
                    data.colorMap = 'no_colormap'

                    if(evt.target.checked){
                      Object.values(data.nodes).forEach(el => {
                        el.colorParameter = 'groupTag'
                        el.colorTag ='no_colormap'
                      })
                      Object.values(data.links).forEach(el => {
                        el.colorTag = tags_selected[0]
                      })
                      data.colorMap = tags_selected[0]
                      data.fluxTags[tags_selected[0]].show_legend = true
                    }
                    redrawAllNodes()
                    redrawAllLinks()
                  }}
                />
              </OverlayTrigger>
            </Col>
          </Row>
        </FormGroup>)
    }
    else if (the_tags_group.banner == 'multi') {
      const options = Object.entries(the_tags_group.tags).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name } })
      const selected = Object.entries(the_tags_group.tags).filter(d => d[1].selected).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name } })
      return (
        <FormGroup as={Row}>

          <Row>
            <Col xs={10}>
              <FormLabel>{the_tags_group.group_name}</FormLabel>
            </Col>
          </Row>

          {/* Liste déroulante des groupe de filtre  */}
          <Row>
            <OverlayTrigger
              key={'Banner.ndd_lst.2'}
              placement={'bottom'}
              delay={500}
              overlay={<Tooltip id={'Banner.ndd_lst.2'}>{t('Banner.ndd_lst')} </Tooltip>}>
              <Col xs={10}>
                <MultiSelect
                  className={'multidropdown_filter_node_link'}
                  style={{ color: 'black',width:'200px' }}
                  valueRenderer={(selected: selected_type[]) => {
                    return selected.length ? selected.map(({ label }) => label + ', ') : 'Aucun tag sélectionné'
                  }}
                  labelledBy={'dropdown_node_filter'}
                  overrideStrings={{
                    'selectAll': 'Tout sélectionner',
                  }}
                  value={selected}
                  options={options}
                  onChange={(selected: [{ label: string, value: string }]) => {
                    HandleMultiDropdown(selected, the_tags_group, data)
                    setForceUpdate(!forceUpdate)
                    redrawAllNodes()
                    redrawAllLinks()
                    reDrawLegend()
                  }}
                />
              </Col>
            </OverlayTrigger>

            {/* Appliquer le filtrage  */}
            <Col xs={2}>
              <OverlayTrigger
                key={'Banner.ndd_chk.2'}
                placement={'bottom'}
                delay={500}
                overlay={<Tooltip id={'Banner.ndd_chk.2'}>{t('Banner.ndd_chk')} </Tooltip>}>
                <FormCheck
                  inline
                  type='switch'
                  checked={data.colorMap==tags_selected[0]}
                  onChange={evt => {
                    Object.values(data.nodeTags).forEach(tags_group => tags_group.show_legend = false)
                    Object.values(data.fluxTags).forEach(tags_group => tags_group.show_legend = false)
                    Object.values(data.dataTags).forEach(tags_group => tags_group.show_legend = false)

                    Object.values(data.nodes).forEach(el => {
                      el.colorParameter = 'local'
                      el.colorTag = 'no_colormap'
                    })

                    Object.values(data.links).forEach(el => {
                      el.colorTag = 'no_colormap'
                    })
                    data.colorMap = 'no_colormap'
                    if(evt.target.checked){
                      Object.values(data.nodes).forEach(el => {
                        el.colorParameter = 'groupTag'
                        el.colorTag ='no_colormap'
                      })
                      Object.values(data['links']).forEach(el => {
                        el.colorTag = tags_selected[0]
                      })
                      data.colorMap = tags_selected[0]
                      data['fluxTags'][tags_selected[0]].show_legend = true
                    }
                    setForceUpdate(!forceUpdate)
                    redrawAllNodes()
                    redrawAllLinks()
                    reDrawLegend()
                  }}
                />
              </OverlayTrigger>
            </Col>
          </Row>
        </FormGroup>)
    }
  })
  return (<>{allDD.map((c,i)=>{return <React.Fragment key={i}>{c}</React.Fragment>})}</>)
}

/** Function that return a simple or multiple dropdown of groupTag of data and links
 This allow us to choose wich grouptag to select and wich tag of these group to display*/
const addAllDropDownLinks = (
  dict_variable_application_data:dict_variable_application_dataType,
  reDrawLegend:()=>void,
  redrawAllNodes:()=>void,
  redrawAllLinks:()=>void,
  recomputeDisplayedElement:()=>void

) => {
  const {data}=dict_variable_application_data
  const [forceUpdate,setForceUpdate]=useState(false)
  
  const banner_grouptag = Object.entries(data.dataTags).filter(([, tags_group]) => { return (tags_group.banner == 'one' || tags_group.banner == 'multi') })
  const allDD = banner_grouptag.map(([, tags_group]) => {
    if (tags_group.banner == 'one') {
      let selected = ''
      if ( Object.entries(tags_group.tags).filter(([,v])=>v.selected).length>0 ) {
        selected = Object.entries(tags_group.tags).filter(([,v])=>v.selected)[0][0]
      }
      return (
        <>
          <FormLabel>{tags_group.group_name}</FormLabel>
          <FormGroup as={Row}>
            <Col xs={10}>
              {<Form.Select key={tags_group.group_name} value={selected} onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
                let had_suffix=false
                const pl=Object.entries(data.links).map(l=>{
                  const suffixeStart= l[0].indexOf('_')
                  if(suffixeStart>=0){
                    had_suffix=true
                    l[0]=l[0].slice(0,suffixeStart)
                    l[1].idLink=l[0]
                    data.nodes[l[1].idSource].outputLinksId=data.nodes[l[1].idSource].outputLinksId.filter(nl=>nl.indexOf('_')==-1)
                    data.nodes[l[1].idTarget].inputLinksId=data.nodes[l[1].idTarget].inputLinksId.filter(nl=>nl.indexOf('_')==-1)

                    //Ajoute dans les noeuds source/target les id de flux
                    const ind_in_src=data.nodes[l[1].idSource].outputLinksId.indexOf(l[1].idLink)
                    if(ind_in_src==-1){
                      data.nodes[l[1].idSource].outputLinksId.push(l[0])
                    }
                    const ind_in_trgt=data.nodes[l[1].idTarget].inputLinksId.indexOf(l[1].idLink)
                    if(ind_in_trgt==-1){
                      data.nodes[l[1].idTarget].inputLinksId.push(l[0])
                    }
                  }
                  return l
                })
                // Reforme les flux originel (sans suffixe) et supprime les doublons par la méme occasions
                const pureLinks=Object.fromEntries(pl)
                data.links=pureLinks
                if(had_suffix){
                  data.linkZIndex=Object.keys(pureLinks)
                }
                handleSimpleDropdown(evt, tags_group)
                recomputeDisplayedElement()
                setForceUpdate(!forceUpdate)
                redrawAllNodes()
                redrawAllLinks()    
                reDrawLegend()
              }}>
                {
                  Object.entries(tags_group.tags).map(([tag_key, tag],i) => {
                    return (<option key={i} value={tag_key} >{tag.name}</option>)
                  })}
              </Form.Select>}
            </Col>
          </FormGroup>
        </>)
    }
    else if (tags_group.banner == 'multi') {
      const selected = Object.entries(tags_group.tags).filter(d => d[1].selected).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name } })
      const options = Object.entries(tags_group.tags).map((tag) => { return { 'label': tag[1].name, 'value': tag[1].name ,'disabled':((selected.length<2 && tag[1].name==selected[0].label))} })
      return (
        <>
          <FormLabel>{tags_group.group_name}</FormLabel>
          <MultiSelect
            className={'multidropdown_filter_node_link'}
            style={{ color: 'black',width:'200px' }}
            labelledBy={'dropdown_link_filter'}
            overrideStrings={{
              'selectAll': 'Tout sélectionner',
            }}
            value={selected}
            options={options}
            onChange={(selected: [{ label: string, value: string }]) => {
              HandleMultiDropdown(selected, tags_group, data)

              //Multiplie les flux par le nombre de dataTags Sélectionné ( et si le lien à une valeur pour ce dataTags)
              if(Object.keys(data.dataTags).length>0){

                const pl=Object.entries(data.links).map(l=>{
                  const suffixeStart= l[0].indexOf('_')
                  if(suffixeStart>=0){
                    l[0]=l[0].slice(0,suffixeStart)
                    l[1].idLink=l[0]
                    data.nodes[l[1].idSource].outputLinksId=data.nodes[l[1].idSource].outputLinksId.filter(nl=>nl.indexOf('_')==-1)
                    data.nodes[l[1].idTarget].inputLinksId=data.nodes[l[1].idTarget].inputLinksId.filter(nl=>nl.indexOf('_')==-1)
                  }
                  return l
                })
                // Reforme les flux originel (sans suffixe) et supprime les doublons par la méme occasions
                const pureLinks=Object.fromEntries(pl)

                const new_links={} as { [link_id: string]: SankeyLink }

                Object.values(pureLinks).forEach(l=>{
                  const suffix=''
                  RecursionDataTag(data,data.dataTags,0,suffix,(l as SankeyLink),new_links)
                })
                data.links=new_links
                data.linkZIndex=Object.keys(new_links)
                
                setForceUpdate(!forceUpdate)

                redrawAllNodes()
                redrawAllLinks()
                reDrawLegend()
              }
            }} />
        </>)
    }
  })
  return allDD
}