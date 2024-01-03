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
import {  SankeyData, TagsGroup} from '../types/Types'
import { MultiSelect } from 'react-multi-select-component'
import { FindMaxLinkValue,AdjustSankeyZone } from './SankeyUtils'
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
  faSliders} from '@fortawesome/free-solid-svg-icons'
import { selected_type } from './SankeyMenuTop'
import { TFunction } from 'i18next'
import { ConvertDataFuncType } from '../types/SankeyConvertTypes'
import { 
  addAllDropDownNodeFType, addSimpleLevelDropDownFType, col_title_level_filterFType, 
  setDiagramFuncType, stretchButtonsFType, ToolbarBuilderFType 
} from '../types/SankeyMenuBannerTypes'
import { DefaultSankeyDataFuncType, GetSankeyMinWidthAndHeightFuncType } from '../types/SankeyUtilsTypes'

// Delete all local node variable : local_aggregation when we switch general aggregation 
const delete_local_aggregation=(data:SankeyData)=>{
  Object.values(data.nodes).filter(n=>n.local!==undefined).forEach(n=>{
    if(n.local){
      delete n.local.local_aggregation
    }
  })
}

export const addSimpleLevelDropDown : addSimpleLevelDropDownFType = (
  t:TFunction,
  data:SankeyData,
  set_data:(d:SankeyData)=>void
) => {
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
            {<Form.Select style={{ width: '200px', color: 'black' }} key={levelTags['Primaire'].group_name} value={selected} placeholder='all' onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => { 
            
              delete_local_aggregation(data)
              handleSimpleDropdown(evt, levelTags['Primaire'], data, set_data) 
          
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
  level:boolean
) => {
  const color = 'black'
  const {nodeTags,levelTags} = data
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
                  placeholder='all'
                  onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
                    handleSimpleDropdown(evt, tags_group, data, set_data) }}>{
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
                    set_data({ ...data })
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
            <Col xs={7}>
              <Form.Select
                style={{color: 'black' }}
                key={tags_group.group_name}
                value={selected}
                placeholder='all'
                onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
                  delete_local_aggregation(data)
                  handleSimpleDropdown(evt, tags_group, data, set_data) 
                    
                }}>{
                  Object.entries(tags_group.tags).map(([tag_key, tag],i) => {
                    return (<option key={i} value={tag_key}>{tag.name}</option>)
                  })}
              </Form.Select>
            </Col>
            {tags_group.siblings !== undefined && tags_group.siblings.length > 0 ?
              <Col xs={3} style={{margin:'auto'}}>
                <FormCheck inline
                  type='switch'
                  checked={tags_group.activated}
                  onChange={evt => {
                    tags_group.activated = evt.target.checked
                    const first_antagonist_tag = data.levelTags[tags_group.siblings[0]]
                    // Respectively activate and desactivate in the two antagonist tags  group
                    // Same as of current tag group
                    first_antagonist_tag.siblings.forEach(sibling=>data.levelTags[sibling].activated = tags_group.activated)
                    // Opposed to current tag group
                    tags_group.siblings.forEach(sibling=>data.levelTags[sibling].activated = !tags_group.activated)
                    set_data({ ...data })
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
                    HandleMultiDropdown(selected, tags_group, data, set_data)
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
                    set_data({ ...data })
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
  data: SankeyData, 
  set_data: (data: SankeyData) => void
) => {
  const val = evt.target.value
  Object.entries(tags_group.tags).forEach(tag => tag[1].selected = val === tag[0])
  set_data({ ...data })
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
const HandleMultiDropdown = (selected: [{ label: string, value: string }], tags_group: TagsGroup, data: SankeyData, set_data: (data: SankeyData) => void) => {
  const tab_sel = selected.map((d) => {
    return d.value
  })
  Object.entries(tags_group.tags).forEach(tag => tag[1].selected = tab_sel.includes(tag[1].name))
  // Permet d'eviter de désélectionner tous les dataTags ce qui créerait une erreur
  if(tab_sel.length==0 && Object.values(data.dataTags).map(dt=>dt.group_name).includes(tags_group.group_name)){
    Object.entries(tags_group.tags)[0][1].selected=true
  }
  set_data({ ...data })
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

export const ToolbarBuilder : ToolbarBuilderFType = (
  t:TFunction,
  data: SankeyData,
  set_data: (d:SankeyData)=>void,
  mode_selection:{current:string},
  userScaleRef:{current:number},
  filter:number,
  set_current_filter:(n:number)=>void,
  detail_level: React.ReactElement,
  url_prefix: string,
  first_selected_node,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  setDiagram: setDiagramFuncType,
  set_show_modal_welcome:(b:boolean)=>void,
  set_never_see_again:(b:boolean)=>void,
  convert_data:ConvertDataFuncType,
  maximum_flux:number | null | undefined,
  set_maximum_flux:(n:number)=>void,
  minimum_flux:number | null | undefined,
  set_minimum_flux:(n:number)=>void,
  DefaultSankeyData: DefaultSankeyDataFuncType,
) => {
  const level_filter = Object.entries(data.levelTags).length > 0
  const [show_link_threshold,set_show_link_threshold]=useState(false)
  const target_link_threshold=useRef(null)
  const [show_detail_level,set_show_detail_level]=useState(false)
  const target_detail_level=useRef(null)
  const [,set_user_scale]=useState(data.user_scale)
  /**
   * Change the mouse behavior
   *
   * @param {string} val
   */
  const setSelectionMode = (val: string) => {
    mode_selection.current = val
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
  let sous_filieres = undefined

  if (window.sankey && window.sankey.sous_filieres) {
    sous_filieres = window.sankey.sous_filieres
  }

  let is_split = false
  const diagrams : { [keys :string] : string[] } = {}

  if ( sous_filieres ) {
    is_split = Object.keys(sous_filieres)[0].includes('/')
    if (is_split ) {
      Object.keys(sous_filieres).forEach(s=> {
        const path = s.split('/')
        if ( !(path[0] in diagrams)) {
          diagrams[path[0]] = [path[1]]
        } else {
          diagrams[path[0]].push(path[1])
        }
      })
    } else {
      Object.keys(sous_filieres).forEach(s=>diagrams[s]=[s])
    }
  }

  const [diagram, set_diagram] = useState(Object.keys(diagrams).length > 0 ? Object.keys(diagrams)[0] : '')
  const [diagram2, set_diagram2] = useState(Object.keys(diagrams).length > 0 ? Object.values(diagrams)[0][0] : '')




  let max_link_value = 0

  Object.values(data.links).forEach(link => {
    const new_max_link_value = FindMaxLinkValue(
      max_link_value,
      link.value
    )
    max_link_value = new_max_link_value > max_link_value ? new_max_link_value : max_link_value
  })

  max_link_value += 1
  // Create the differents popover of tag filter  and link value filter
  //Popover element to handle filter on links, it contians :
  // - scale of link
  // - filter on link (if value of link is inferior to filter then the link is not displayed)
  // - filter on link label
  // - filter on null link (if link value is null (0), we can display it or not)
  const link_filter=
  <Popover id="popover-link-filter" style={{maxWidth:'100%',maxHeight:'600px','overflowY':'auto'}}>
    <Popover.Header as="h3">{t('Banner.p_aff')}</Popover.Header>
    <Popover.Body >
      <Form>
        <h5>{t('Banner.p_aff_aff_links')}</h5>
        <Form.Group as={Row} >
          <Col xs={7}>
            <FormLabel >{t('MEP.Echelle')}</FormLabel>
          </Col>
          <Col xs={5}>
            <FormControl
              type="text"
              value={  userScaleRef.current }
              isInvalid={userScaleRef.current!=data.user_scale}

              onChange={evt => {
                userScaleRef.current =+evt.target.value
                set_user_scale(+evt.target.value)
              }}
              onBlur={() => {
                data.user_scale = userScaleRef.current
                set_data({ ...data })
              }}
            />
            <FormControl.Feedback type='invalid'>{t('MEP.onBlur')}</FormControl.Feedback>
            <Form.Text>    ({t('MEP.vp100')})</Form.Text>
          </Col>
        </Form.Group>

        {/* Taille maximale du flux */}
        <Form.Group as={Row} >
          <Col xs={7}>
            <FormLabel >{t('MEP.MaxFlux')}</FormLabel>
          </Col>
          <Col xs={5}>
            <OverlayTrigger
              key={'MEP.tooltips.MaxFlux'}
              placement={'top'}
              delay={500}
              rootClose
              overlay={<Tooltip id={'MEP.tooltips.MaxFlux'}>{t('MEP.tooltips.MaxFlux')} </Tooltip>}>
              <FormControl
                type="text"
                value={maximum_flux == null ? undefined : maximum_flux}
                onChange={evt => {
                  set_maximum_flux(+evt.target.value)
                }}
                onBlur={() => {
                  data.maximum_flux = isNaN(Number(maximum_flux))?undefined:maximum_flux
                  set_data({ ...data })
                }}/>
            </OverlayTrigger>
          </Col>
        </Form.Group>

        {/* Taille maximale du flux */}
        <Form.Group as={Row} >
          <Col xs={7}>
            <FormLabel >{t('MEP.MinFlux')}</FormLabel>
          </Col>
          <Col xs={5}>
            <OverlayTrigger
              key={'MEP.tooltips.MinFlux'}
              placement={'top'}
              delay={500}
              rootClose
              overlay={<Tooltip id={'MEP.tooltips.MinFlux'}>{t('MEP.tooltips.MinFlux')} </Tooltip>}>
              <FormControl
                type="text"
                value={minimum_flux == null ? undefined : minimum_flux}
                onChange={evt => {
                  set_minimum_flux(+evt.target.value)
                }}
                onBlur={() => {
                  data.minimum_flux = isNaN(Number(minimum_flux))?undefined:minimum_flux
                  set_data({ ...data })
                }}/>
            </OverlayTrigger>
          </Col>
        </Form.Group>


        <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />
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
                set_data({ ...data })
              }}
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
                set_data({...data})
              }}
            />
          </Col>
        </Form.Group>
        <Form.Group as={Row} >
          <Col>
            <FormLabel >{t('Banner.fn')}:</FormLabel>
          </Col>
          <Col >
            <FormCheck
              type='checkbox'
              label={t('Banner.visible')}
              onChange={evt => {
                data.display_style.null_flux = evt.target.checked
                set_data({ ...data })
              }}
            />
          </Col>
        </Form.Group>

      </Form>
    </Popover.Body>
  </Popover>

  let diagrams_element = <React.Fragment key={'1'}></React.Fragment>
  if (window.SankeyToolsStatic && sous_filieres && !is_split) {
    diagrams_element =
        <Form.Group key={'1'} as={Col} style={{ marginLeft: '10px' }} lg="auto">
          <Form.Select style={{ width: '200px', color:'black' }}
            onChange={evt=> {
              set_diagram(evt.target.value)
              setDiagram(evt.target.value, set_data, convert_data,DefaultSankeyData)
            }}
            value={diagram}>
            {Object.keys(sous_filieres).map((name, i) => <option key={i} value={name} >{name}</option>)}
          </Form.Select>
        </Form.Group>
  }
  if (window.SankeyToolsStatic && sous_filieres && is_split) {
    diagrams_element =
      <Form.Group key={'2'} as={Col} style={{ marginLeft: '10px' }} lg="auto">
        <Form.Select style={{ width: '200px', color:'black' }}
          onChange={(evt:React.ChangeEvent<HTMLSelectElement>)=>{
            set_diagram(evt.target.value)
            const diagram_path = evt.target.value+'/'+diagrams[evt.target.value][0]
            setDiagram(diagram_path, set_data,convert_data,DefaultSankeyData)
          }}
          value={diagram}>
          {Object.keys(diagrams).map((name, i) => <option key={i} value={name} >{name}</option>)}
        </Form.Select>
        {is_split ?
          (<Form.Select style={{ width: '200px', color:'black' }}
            onChange={(evt:React.ChangeEvent<HTMLSelectElement>) => {
              set_diagram2(evt.target.value)
              const diagram_path = diagram+'/'+evt.target.value
              setDiagram(diagram_path, set_data,convert_data,DefaultSankeyData)
            }}
            value={diagram2}>
            {diagrams[diagram] ? (Object.values(diagrams[diagram]).map((name, i) => <option key={i} value={name} >{name}</option>)):(<React.Fragment></React.Fragment>)}
          </Form.Select>) :(<React.Fragment></React.Fragment>)
        }
      </Form.Group>
  }

  const excel_element = window.sankey && window.sankey.excel ? (
    <Form.Group key={'3'} as={Col} lg="auto" style={{marginRight:'10px'}} >
      <Button variant='link' href={window.sankey.excel}>{t('Banner.tl')}</Button>
    </Form.Group>) : (<React.Fragment key={'3'}></React.Fragment>)

  const struc_data_reconciled=
  <Popover id='popover-details-level' style={{maxWidth:'100%'}}>
    <Popover.Header as="h3">{t('Banner.sdr')}</Popover.Header>
    <Popover.Body>
      <FormGroup as={Row}>
        <Col xs={10}>
          <Form.Select
            style={{ width: '200px', color: 'black' }}
            placeholder='all'
            value={data.show_structure}
            onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
              data.show_structure = evt.target.value as 'data' | 'structure' | 'reconciled' | 'free_value' | 'free_interval'
              set_data({...data})
            }}>
            <option key='structure'  value='structure' >Structure</option>
            <option key='data'       value='data'      >Données collectées</option>
            <option key='reconciled' value='reconciled'>Données réconciliées</option>
            <option key='free_interval' value='free_interval' >Données réconciliées+flux indéterminés (intervalles)</option>
            <option key='free_value' value='free_value' >Données réconciliées+flux indéterminés (valeurs)</option>
          </Form.Select>
        </Col>
      </FormGroup>
    </Popover.Body>
  </Popover>

  const ui :{[s:string]:JSX.Element}= {}
  if ((Object.keys(diagrams).length > 0)) {
    ui['diagramme']=diagrams_element
  }
  if (window.sankey && window.sankey.excel) {
    ui['excel']=(excel_element)
  }

  let mouse_mode_edition=<></>

  // Add button for the edition of the sankey
  if(!window.SankeyToolsStatic){
    mouse_mode_edition=<>
      {/* Boutons permettant soit de passer la souris en mode sélection soit en mode création noeud/flux */}
      <OverlayTrigger
        key={'tooltip-liaison'}
        placement={'left'}
        delay={500}
        overlay={<Tooltip id={'tooltip-liason'}>{(mode_selection.current == 'ln')?t('Banner.tooltipLiason'):t('Banner.tooltipSelection')} </Tooltip>}>
        <Button variant={(!(mode_selection.current == 'ln')) ? 'secondary' : 'secondary'} onClick={() => {
          if(mode_selection.current=='ln'){
            setSelectionMode('s') 
          }else{
            setSelectionMode('ln') 
          }
        }} >
          <Col><FontAwesomeIcon icon={(mode_selection.current == 'ln')?faShareNodes:faArrowPointer}/></Col>
        </Button>
      </OverlayTrigger>
    </>

  }


  ui['toolbar']=(
    <>
      {mouse_mode_edition}

      {/* Add the button to choose the aggregation level  */}
      {(level_filter)?<>
        <OverlayTrigger
          key={'tooltip-nodes-level'}
          placement={'left'}
          rootClose
          overlay={<Tooltip id={'tooltip-nodes-level'}>{t('Banner.hlp_1_txt_2')} </Tooltip>}>
          <Button ref={target_detail_level} variant='warning' id='button-details-level' onClick={()=>{set_show_detail_level(!show_detail_level)}} >
            <Col><FontAwesomeIcon icon={faFolderTree} /></Col>
          </Button>
        </OverlayTrigger>
        <Overlay
          key={'popover-nodes-level'}
          placement={'left'}
          target={target_detail_level}
          rootClose
          show={show_detail_level}
          onHide={()=>{set_show_detail_level(false)}}
        >
          {detail_level}
        </Overlay></>
        :
        <></>
      }
      {/* Tooltip for level filter */}
      <OverlayTrigger
        key={'tooltip-link-filter2'}
        placement={'left'}
        delay={500}
        overlay={<Tooltip id={'tooltip-link-filter2'}>{t('Banner.hlp_1_txt_8')} </Tooltip>}
      >
        <Button ref={target_link_threshold} variant='danger' id='button-filter-link'
          onClick={()=>{
            set_show_link_threshold(!show_link_threshold)
          }}
        >
          <Col><FontAwesomeIcon icon={faSliders} /></Col>
        </Button>
      </OverlayTrigger>

      {/* Popover to display the link-filter */}
      <Overlay
        key={'popover-link-filter'}
        placement={'left'}
        target={target_link_threshold}
        rootClose
        show={show_link_threshold}
        onHide={()=>{set_show_link_threshold(false)}}
      >
        {link_filter}
      </Overlay>


      {stretchButtons(data,GetSankeyMinWidthAndHeight,t)}

      { url_prefix !== '' ?
        <OverlayTrigger
          key={'tooltip-structur'}
          placement={'left'}
          trigger={'click'}
          rootClose
          overlay={struc_data_reconciled}>
          <Button variant='success'>
            <Col><FontAwesomeIcon icon={faDiagramProject} /></Col>

          </Button>
        </OverlayTrigger>
        :
        <OverlayTrigger
          key={'tooltip-structur'}
          placement={'left'}
          delay={500}
          overlay={<Tooltip id={'tooltip-structur'}>{t('Banner.tooltipStructure')} </Tooltip>}>
          <Button variant={'success'} onClick={() => {
            data.show_structure = data.show_structure == 'reconciled' ? 'structure' : 'reconciled'
            set_data({ ...data })
          }} >
            <Col><FontAwesomeIcon icon={faCodeBranch} /></Col>
          </Button>
        </OverlayTrigger>}
      {window.SankeyToolsStatic ? <OverlayTrigger
        key={'tooltip-help'}
        placement={'left'}
        delay={500}
        overlay={<Tooltip id={'tooltip-help'}>{t('Banner.tooltipHelp')}</Tooltip>
        }
      >
        <Button variant='info' onClick={() => { set_never_see_again(false);localStorage.removeItem('dontSeeAggainWelcome'),set_show_modal_welcome(true) }} >
          <Col> ? </Col>
        </Button>
      </OverlayTrigger> : <></>}
    </>
  )

  return ui
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
    overlay={<Tooltip id={'tooltip-adjust-h'}>{t('Banner.tooltipAdjust')} </Tooltip>}>
    <Button variant='dark' onClick={() => {AdjustSankeyZone(data,GetSankeyMinWidthAndHeight)}} >
      <Col><FontAwesomeIcon icon={faArrowsLeftRight} /></Col>
    </Button>
  </OverlayTrigger>
  <OverlayTrigger
    key={'tooltip-adjust-v'}
    placement={'left'}
    delay={500}
    overlay={<Tooltip id={'tooltip-adjust-v'}>{t('Banner.tooltipAdjust')} </Tooltip>}>
    <Button variant='dark' onClick={() => {AdjustSankeyZone(data,GetSankeyMinWidthAndHeight,false,true)}} >
      <Col><FontAwesomeIcon icon={faArrowsUpDown} /></Col>
    </Button>
  </OverlayTrigger></>
}