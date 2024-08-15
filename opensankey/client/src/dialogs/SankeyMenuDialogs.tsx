import React, { ChangeEvent, FunctionComponent, useState,  } from 'react'

import { dict_hook_ref_setter_show_dialog_componentsType, applicationDataType, applicationStateType, } from '../types/Types'
import { complete_sankey_data } from '../configmenus/SankeyConvert'
import { DefaultLink, DefaultNode, OSTooltip, ReturnValueNode } from '../configmenus/SankeyUtils'
import { NodeVisibleOnsSvg } from '../draw/SankeyDrawFunction'
import { arrangeNodes, ComputeAutoSankey, ComputeParametrization } from '../draw/SankeyDrawLayout'
import { MenuDraggable } from '../topmenus/SankeyMenuTop'
import { FaCheck } from 'react-icons/fa'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { TFunction } from 'i18next'
import { Box, Checkbox, Button, NumberInput, Input, NumberDecrementStepper, NumberIncrementStepper, NumberInputField, NumberInputStepper, InputGroup, InputRightAddon, TabList, Tab, Tabs, TabPanels, TabPanel, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton } from '@chakra-ui/react'
import { UploadExcelImplFuncType } from './types/SankeyPersistenceTypes'
import { ClickSaveDiagramFuncType } from './types/SankeyPersistenceTypes'
import { ApplyLayoutDialogTypes, OpenSankeyDiagramSelectorFType } from './types/SankeyMenuDialogsTypes'

export   const os_all_element_to_transform = [
  'addNode', 'addFlux', 'removeNode', 'removeFlux',
  'posNode', 'posFlux',
  'Values',
  'attrNode', 'attrFlux',
  'tagNode', 'tagFlux', 'tagData', 'tagLevel',
  'attrGeneral'
]

/**
 *
 * @param {ApplyLayoutDialogTypes} { ref_setter_show_apply_layout, set_show_apply_layout, sankey_data, set_sankey_data }
 * @returns {*}
 */
export const ApplyLayoutDialog : FunctionComponent<ApplyLayoutDialogTypes> = ({
  t,dict_hook_ref_setter_show_dialog_components,
  applicationData,
  applicationDraw,convert_data,
  diagramSelector,
  apply_transformation_additional_elements,
  DefaultSankeyData,
  ComponentUpdater
}) => {
  const {updateLayout,all_element_UpdateLayout}=applicationDraw
  const {data,set_data,dataVarToUpdate}=applicationData
  const [prev_sankey_data,set_prev_sankey_data] = useState(data)
  const [forceUpdate,setForceUpdate] = useState(true)
  const [stretchFactorH,set_stretchFactorH]=useState(1)
  const [stretchFactorV,set_stretchFactorV]=useState(1)
  const [mode_trans,set_mode_trans]=useState('simple')
  const [node_hspace,set_node_hspace] = useState(data.h_space)
  const [node_vspace,set_node_vspace] = useState(data.v_space)
  if ( node_hspace !== data.h_space) {
    set_node_hspace(data.h_space)
  }
  if ( node_vspace !== data.v_space) {
    set_node_vspace(data.v_space)
  }
  const node_visible=NodeVisibleOnsSvg()
  const simple_element_to_transform = [
    'posNode', 'posFlux',
    'attrNode', 'attrFlux',
    'attrGeneral'
  ]
  const default_element_to_transform = [
    'posNode', 'posFlux',
    'attrNode', 'attrFlux',
    'attrGeneral'
  ]

  const applyStretch=(param:string)=>{
    const attr=param=='h'?'x':'y'
    const stretchFactor=param=='h'?stretchFactorH:stretchFactorV
    let min=Object.values(data.nodes)[0][attr]
    // Cheche la position en y du noeud le plus en haut à gauche
    Object.values(data.nodes).filter(n=>node_visible.includes(n.idNode) && ReturnValueNode(data,n,'position')!='relative').forEach(n=>{
      min=(n[attr]<min)?n[attr]:min
    })

    // Parcours les noeuds --> calcule le delta des position en y entre ceux-ci --> multiplie le delta par le facteur du input -->
    // applique le delta mutiplié par le facteur au noeud
    Object.values(data.nodes).filter(n=>node_visible.includes(n.idNode) && ReturnValueNode(data,n,'position')!='relative').forEach(n=>{
      const delta=n[attr]-min
      n[attr]=min+(delta*stretchFactor)
    })
    set_data({...data})
  }
  const content_modal_layout=  <Tabs>
    <TabList>
      <Box layerStyle='submenuconfig_tab' >
        <Tab>{t('Menu.Transformation.amp_import')}</Tab>
      </Box>
      <Box layerStyle='submenuconfig_tab' >
        <Tab>{t('Menu.Transformation.amp_manuelle')}</Tab>
      </Box>
    </TabList>

    <TabPanels>
      {/* Import data */}
      <TabPanel >
        <Box layerStyle='menuconfigpanel_grid' >

          {diagramSelector(
            t, convert_data, data,set_data, prev_sankey_data, set_prev_sankey_data,
            updateLayout, dataVarToUpdate,DefaultSankeyData
          )}

          <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />

          <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
            <Box layerStyle='menuconfigpanel_option_name'>
              {t('Menu.choseTransforDifficulty')}
            </Box>
            <Box layerStyle='options_3cols' >
              <Button variant={mode_trans=='simple'?'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'} onClick={()=>{set_mode_trans('simple')}}>Basiques</Button>
              <Button variant={mode_trans=='expert'?'menuconfigpanel_option_button_tertiary_activated' : 'menuconfigpanel_option_button_tertiary'} onClick={()=>{set_mode_trans('expert')}}>Tous</Button>
            </Box>
          </Box>

          <OSTooltip label={t('Menu.Transformation.tooltips.Shortcuts')}>
            <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
              <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.Shortcuts')}</Box>
              <Box layerStyle='options_4cols' >

                <Button
                  variant='menuconfigpanel_option_button'
                  onClick={() => {
                    dataVarToUpdate.current.length = 0
                    ComponentUpdater.updateComponentBtnUpdateLayout.current()
                    setForceUpdate(!forceUpdate)
                  }}
                >{t('Menu.Transformation.unSelectAll')}</Button>
                <Button
                  variant='menuconfigpanel_option_button'
                  onClick={() => {
                    dataVarToUpdate.current.length = 0
                    if(mode_trans==='simple'){
                      simple_element_to_transform.forEach(el=>dataVarToUpdate.current.push(el))
                    }else{
                      all_element_UpdateLayout.forEach(el=>dataVarToUpdate.current.push(el))
                    }
                    ComponentUpdater.updateComponentBtnUpdateLayout.current()
                    setForceUpdate(!forceUpdate)
                  }}
                >{t('Menu.Transformation.selectAll')}</Button>
                <Button
                  variant='menuconfigpanel_option_button'
                  onClick={() => {
                    dataVarToUpdate.current.length = 0
                    default_element_to_transform.forEach(el=>dataVarToUpdate.current.push(el))
                    ComponentUpdater.updateComponentBtnUpdateLayout.current()
                    setForceUpdate(!forceUpdate)
                  }}
                >{t('Menu.Transformation.selectDefault')}</Button>

              </Box>
            </Box>
          </OSTooltip>

          {mode_trans!='simple'?
            <OSTooltip label={t('Menu.Transformation.tooltips.Topology')}>
              <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
                <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.Topology')}</Box>
                <Box layerStyle='options_4cols' >
                  <Button
                    variant={ dataVarToUpdate.current.includes('addNode')?'menuconfigpanel_option_button_activated':'menuconfigpanel_option_button'}
                    onClick={() => {
                      if(!dataVarToUpdate.current.includes('addNode')){
                        dataVarToUpdate.current.push('addNode')
                        setForceUpdate(!forceUpdate)
                      }else{
                        dataVarToUpdate.current.splice(dataVarToUpdate.current.indexOf('addNode'),1)
                        setForceUpdate(!forceUpdate)
                      }}
                    }
                  >{t('Menu.Transformation.addNode')}</Button>
                  <Button
                    variant={ dataVarToUpdate.current.includes('removeNode')?'menuconfigpanel_option_button_activated':'menuconfigpanel_option_button'}
                    onClick={() => {
                      if(!dataVarToUpdate.current.includes('removeNode')){
                        dataVarToUpdate.current.push('removeNode')
                        setForceUpdate(!forceUpdate)
                      }else{
                        dataVarToUpdate.current.splice(dataVarToUpdate.current.indexOf('removeNode'),1)
                        setForceUpdate(!forceUpdate)
                      }}
                    }
                  >{t('Menu.Transformation.removeNode')}</Button>
                  <Button
                    variant={ dataVarToUpdate.current.includes('addFlux')?'menuconfigpanel_option_button_activated':'menuconfigpanel_option_button'}
                    onClick={() => {
                      if(!dataVarToUpdate.current.includes('addFlux')){
                        dataVarToUpdate.current.push('addFlux')
                        setForceUpdate(!forceUpdate)
                      }else{
                        dataVarToUpdate.current.splice(dataVarToUpdate.current.indexOf('addFlux'),1)
                        setForceUpdate(!forceUpdate)
                      }}
                    }>{t('Menu.Transformation.addFlux')}</Button>
                  <Button
                    variant={ dataVarToUpdate.current.includes('removeFlux')?'menuconfigpanel_option_button_activated':'menuconfigpanel_option_button'}
                    onClick={() => {
                      if(!dataVarToUpdate.current.includes('removeFlux')){
                        dataVarToUpdate.current.push('removeFlux')
                        setForceUpdate(!forceUpdate)
                      }else{
                        dataVarToUpdate.current.splice(dataVarToUpdate.current.indexOf('removeFlux'),1)
                        setForceUpdate(!forceUpdate)
                      }}
                    }>{t('Menu.Transformation.removeFlux')}</Button>
                </Box>
              </Box></OSTooltip>:<></>}

          {/* Taille et pos des noeud/flux */}
          <OSTooltip label={t('Menu.Transformation.tooltips.Geometry')}  >
            <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
              <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.Geometry')}</Box>
              <Box layerStyle='options_4cols' >
                <Button
                  variant={ dataVarToUpdate.current.includes('posNode')?'menuconfigpanel_option_button_activated':'menuconfigpanel_option_button'}
                  onClick={() => {
                    if(!dataVarToUpdate.current.includes('posNode')){
                      dataVarToUpdate.current.push('posNode')
                      setForceUpdate(!forceUpdate)
                    }else{
                      dataVarToUpdate.current.splice(dataVarToUpdate.current.indexOf('posNode'),1)
                      setForceUpdate(!forceUpdate)
                    }}
                  }>{t('Menu.Transformation.PosNoeud')}</Button>
                <Button
                  variant={ dataVarToUpdate.current.includes('posFlux')?'menuconfigpanel_option_button_activated':'menuconfigpanel_option_button'}
                  onClick={() => {
                    if(!dataVarToUpdate.current.includes('posFlux')){
                      dataVarToUpdate.current.push('posFlux')
                      setForceUpdate(!forceUpdate)
                    }else{
                      dataVarToUpdate.current.splice(dataVarToUpdate.current.indexOf('posFlux'),1)
                      setForceUpdate(!forceUpdate)
                    }}
                  }> {t('Menu.Transformation.posFlux')}</Button>
              </Box>

            </Box>
          </OSTooltip>

          {/* Valeur des flux */}
          {mode_trans!='simple'?
            <OSTooltip label={t('Menu.Transformation.tooltips.Values')}>
              <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
                <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.Values')}</Box>
                <Box layerStyle='options_4cols' >
                  <Button
                    variant={ dataVarToUpdate.current.includes('Values')?'menuconfigpanel_option_button_activated':'menuconfigpanel_option_button'}
                    onClick={() => {
                      if(!dataVarToUpdate.current.includes('Values')){
                        dataVarToUpdate.current.push('Values')
                        // Also need dataTags because we can't only import values without the structur of dataTags
                        // (but we can import dataTags without values)
                        if(!dataVarToUpdate.current.includes('tagData')){
                          dataVarToUpdate.current.push('tagData')
                        }
                        setForceUpdate(!forceUpdate)
                      }else{
                        dataVarToUpdate.current.splice(dataVarToUpdate.current.indexOf('Values'),1)
                        setForceUpdate(!forceUpdate)
                      }}
                    }
                  >{dataVarToUpdate.current.includes('Values')?<FaCheck/>:<FontAwesomeIcon icon={faXmark}/>}</Button>
                </Box>
              </Box></OSTooltip>:<></>}

          <OSTooltip label={t('Menu.Transformation.tooltips.Attribut')} >
            <Box as='span' layerStyle='menuconfigpanel_row_2cols'><Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.Attribut')}</Box>
              <Box layerStyle='options_4cols' >
                <Button
                  variant={dataVarToUpdate.current.includes('attrNode')?'menuconfigpanel_option_button_activated':'menuconfigpanel_option_button'}
                  onClick={() => {
                    if(!dataVarToUpdate.current.includes('attrNode')){
                      dataVarToUpdate.current.push('attrNode')
                      setForceUpdate(!forceUpdate)

                    }else{
                      dataVarToUpdate.current.splice(dataVarToUpdate.current.indexOf('attrNode'),1)
                      setForceUpdate(!forceUpdate)
                    }}
                  }
                >{t('Menu.Transformation.attrNode')}</Button>
                <Button
                  variant={dataVarToUpdate.current.includes('attrFlux')?'menuconfigpanel_option_button_activated':'menuconfigpanel_option_button'}
                  onClick={() =>{
                    if(!dataVarToUpdate.current.includes('attrFlux')){
                      dataVarToUpdate.current.push('attrFlux')
                      setForceUpdate(!forceUpdate)
                    }else{
                      dataVarToUpdate.current.splice(dataVarToUpdate.current.indexOf('attrFlux'),1)
                      setForceUpdate(!forceUpdate)
                    }}
                  }
                >{t('Menu.Transformation.attrFlux')}</Button>
              </Box>
            </Box></OSTooltip>

          {/* Etiquette */}
          {mode_trans=='expert'?
            <OSTooltip label={t('Menu.Transformation.tooltips.Tags')} >
              <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
                <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.Tags')}</Box>
                <Box layerStyle='options_4cols' >
                  <Button
                    variant={dataVarToUpdate.current.includes('tagNode')?'menuconfigpanel_option_button_activated':'menuconfigpanel_option_button'}
                    onClick={() =>{
                      if(!dataVarToUpdate.current.includes('tagNode')){
                        dataVarToUpdate.current.push('tagNode')
                        setForceUpdate(!forceUpdate)
                      }else{
                        dataVarToUpdate.current.splice(dataVarToUpdate.current.indexOf('tagNode'),1)
                        setForceUpdate(!forceUpdate)

                      }}
                    }
                  >{t('Menu.Transformation.tagNode')}</Button>
                  <Button
                    variant={dataVarToUpdate.current.includes('tagFlux')?'menuconfigpanel_option_button_activated':'menuconfigpanel_option_button'}
                    onClick={() => {
                      if(!dataVarToUpdate.current.includes('tagFlux')){
                        dataVarToUpdate.current.push('tagFlux')
                        setForceUpdate(!forceUpdate)
                      }else{
                        dataVarToUpdate.current.splice(dataVarToUpdate.current.indexOf('tagFlux'),1)
                        setForceUpdate(!forceUpdate)
                      }}
                    }
                  >{t('Menu.Transformation.tagFlux')}</Button>
                  <Button
                    variant={dataVarToUpdate.current.includes('tagData')?'menuconfigpanel_option_button_activated':'menuconfigpanel_option_button'}
                    onClick={() => {
                      if(!dataVarToUpdate.current.includes('tagData')){
                        dataVarToUpdate.current.push('tagData')
                        setForceUpdate(!forceUpdate)
                      }else if(!dataVarToUpdate.current.includes('Values')){
                        dataVarToUpdate.current.splice(dataVarToUpdate.current.indexOf('tagData'),1)
                        setForceUpdate(!forceUpdate)
                      }}
                    }
                  >{t('Menu.Transformation.tagData')}</Button>
                </Box>
              </Box></OSTooltip>:<></>}

          {/* Aggrégation */}
          {mode_trans=='expert'?
            <OSTooltip label={t('Menu.Transformation.tooltips.tagLevel')} >
              <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
                <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.tagLevel')}</Box>
                <Box layerStyle='options_4cols' >
                  <Button
                    variant={dataVarToUpdate.current.includes('tagLevel')?'menuconfigpanel_option_button_activated':'menuconfigpanel_option_button'}
                    onClick={() => {
                      if(!dataVarToUpdate.current.includes('tagLevel')){
                        dataVarToUpdate.current.push('tagLevel')
                        setForceUpdate(!forceUpdate)
                      }else{
                        dataVarToUpdate.current.splice(dataVarToUpdate.current.indexOf('tagLevel'),1)
                        setForceUpdate(!forceUpdate)
                      }}
                    }
                  >{dataVarToUpdate.current.includes('tagLevel')?<FaCheck/>:<FontAwesomeIcon icon={faXmark}/>}</Button>
                </Box>
              </Box></OSTooltip>:<></>}

          <OSTooltip label={t('Menu.Transformation.tooltips.attrGeneral')} >
            <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
              <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.attrGeneral')}</Box>
              <Box layerStyle='options_4cols' >
                <Button
                  variant={dataVarToUpdate.current.includes('attrGeneral')?'menuconfigpanel_option_button_activated':'menuconfigpanel_option_button'}
                  onClick={() =>{
                    if(!dataVarToUpdate.current.includes('attrGeneral')){
                      dataVarToUpdate.current.push('attrGeneral')
                      setForceUpdate(!forceUpdate)
                    }else{
                      dataVarToUpdate.current.splice(dataVarToUpdate.current.indexOf('attrGeneral'),1)
                      setForceUpdate(!forceUpdate)
                    }}
                  }
                >{dataVarToUpdate.current.includes('attrGeneral')?<FaCheck/>:<FontAwesomeIcon icon={faXmark}/>}</Button>
              </Box>
            </Box></OSTooltip>
          {mode_trans=='expert'? apply_transformation_additional_elements.map((c:JSX.Element,i:number)=>{
            return <React.Fragment key={i}>{c}</React.Fragment>
          }) : <></>}
        </Box>
      </TabPanel>

      {/* Geometry */}
      <TabPanel>
        <Box layerStyle='menuconfigpanel_grid' >
          {/* Positionnement vertical automatique */}
          <Box as='span' layerStyle='menuconfigpanel_row_3cols'>
            {/* <Checkbox
              variant='menuconfigpanel_option_checkbox'
              isChecked={data.parametric_mode}
              onChange={(evt) => {
                data.parametric_mode = evt.target.checked
                setForceUpdate(!forceUpdate)
              }}
            >
              <OSTooltip label={'Positionnement vertical ajusté'}>
                {'Positionnement vertical ajusté'}
              </OSTooltip>
            </Checkbox> */}
            <Button
              variant='menuconfigpanel_option_button'
              onClick={()=>{
                ComputeParametrization(applicationData)
                applicationData.set_data(JSON.parse(JSON.stringify(data)))
              }}>
              {t('MEP.defaultParametric')}
            </Button>
            {/* <Button
              variant='menuconfigpanel_option_button'
              onClick={()=>{
                Object.values(applicationData.data.nodes)
                .filter(n=> n.position !== 'relative' )
                .forEach(n=> n.dy = 0 )
                applicationData.set_data(JSON.parse(JSON.stringify(data)))
              }}>
              {t('MEP.resetVerticalIntervals')}
            </Button> */}
          </Box>
          {/* Ecart horizontal */}
          <OSTooltip label={t('MEP.tooltips.EEN_h')} >
            <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
              <Box layerStyle='menuconfigpanel_option_name'>{t('MEP.Horizontal')}</Box>
              <NumberInput
                variant='menuconfigpanel_option_numberinput'
                step={1}
                min={0}
                allowMouseWheel
                value={node_hspace}
                onChange={evt => {
                  set_node_hspace(+evt)
                  data.h_space = +evt
                  set_data({ ...data })
                }}>
                <NumberInputField/>
                <NumberInputStepper>
                  <NumberIncrementStepper/>
                  <NumberDecrementStepper/>
                </NumberInputStepper>

              </NumberInput>
            </Box>
          </OSTooltip>

          {/* Ecart Vertical */}
          <OSTooltip label={t('MEP.tooltips.EEN_v')} >
            <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
              <Box layerStyle='menuconfigpanel_option_name'>{t('MEP.Vertical')}</Box>
              <NumberInput
                variant='menuconfigpanel_option_numberinput'
                step={1}
                min={0}
                allowMouseWheel
                value={node_vspace}
                onChange={evt => {
                  set_node_vspace(+evt)
                  data.v_space = +evt
                  set_data({ ...data })
                }}>
                <NumberInputField/>
                <NumberInputStepper>
                  <NumberIncrementStepper/>
                  <NumberDecrementStepper/>
                </NumberInputStepper>
              </NumberInput>
            </Box>
          </OSTooltip>

          <OSTooltip label={t('MEP.tooltips.factExpH')} >
            <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
              <Box layerStyle='menuconfigpanel_option_name'>{t('MEP.factExpH')}</Box>
              <InputGroup>
                <NumberInput
                  variant='menuconfigpanel_option_numberinput_with_right_addon'
                  step={0.1}
                  min={0}
                  allowMouseWheel
                  value={stretchFactorH}
                  onChange={evt=>{
                    set_stretchFactorH(evt as unknown as number)
                  }}>
                  <NumberInputField/>
                  <NumberInputStepper>
                    <NumberIncrementStepper/>
                    <NumberDecrementStepper/>
                  </NumberInputStepper>
                </NumberInput>
                <InputRightAddon>
                  <Button
                    variant='menuconfigpanel_option_button'
                    onClick={()=>applyStretch('h')}>
                    {t('MEP.stretchH')}
                  </Button>
                </InputRightAddon>
              </InputGroup>
            </Box>
          </OSTooltip>

          <OSTooltip label={t('MEP.tooltips.factExpV')} >
            <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
              <Box layerStyle='menuconfigpanel_option_name'>{t('MEP.factExpV')}</Box>
              <InputGroup>
                <NumberInput
                  variant='menuconfigpanel_option_numberinput_with_right_addon'
                  step={0.1}
                  min={0}
                  allowMouseWheel
                  value={stretchFactorV}
                  onChange={evt=>{
                    set_stretchFactorV(evt as unknown as number)
                  }}>
                  <NumberInputField/>
                  <NumberInputStepper>
                    <NumberIncrementStepper/>
                    <NumberDecrementStepper/>
                  </NumberInputStepper>
                </NumberInput>
                <InputRightAddon>
                  <Button
                    variant='menuconfigpanel_option_button'
                    onClick={()=>applyStretch('v')}>
                    {t('MEP.stretchV')}
                  </Button>
                </InputRightAddon>
              </InputGroup>
            </Box>
          </OSTooltip>

          <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />


          { /* Positionnement des noeuds */}
          <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
            { /* Mise en forme automatique */}
            <OSTooltip label={t('MEP.tooltips.PA')} >
              <Button
                variant={'menuconfigpanel_option_button'}
                onClick={() => {
                  applicationData.function_on_wait.current=()=>{
                    ComputeAutoSankey(applicationData, node_hspace,false)
                    set_data({ ...data })
                  }
                  dict_hook_ref_setter_show_dialog_components.ref_lauchToast.current()

                }}>
                {t('MEP.PA')}
              </Button>
            </OSTooltip>{/* Arranger les noeud */}
            <OSTooltip label={t('MEP.tooltips.AN')}>
              <Button
                variant={'menuconfigpanel_option_button'}
                onClick={() => {
                  arrangeNodes(data)
                  set_data({ ...data })
                }}>
                {t('MEP.AN')}
              </Button>
            </OSTooltip>

          </Box>
        </Box>
      </TabPanel>

    </TabPanels>

  </Tabs>
  const dragLayout= MenuDraggable(
    dict_hook_ref_setter_show_dialog_components,
    'ref_setter_show_apply_layout',
    content_modal_layout,
    {current:[window.innerWidth/4,window.innerHeight/4]},
    t('Menu.Transformation.title')
  )
  return dragLayout

}

/**
 *
 * @type {{ ref_setter_show_save_json: any; set_show_save_json: any; sankey_data: any; set_sankey_data: any; ClickSaveDiagram: any; }}
 */
export type ApplySaveJSONTypes = {
  t : TFunction
  applicationData : applicationDataType,
  dict_hook_ref_setter_show_dialog_components:dict_hook_ref_setter_show_dialog_componentsType,
  applicationState:applicationStateType,
  additional_file_save_json_option:JSX.Element[],
  ClickSaveDiagram:ClickSaveDiagramFuncType
}

/**
 *
 * @param {ApplySaveJSONTypes} { ref_setter_show_save_json, set_show_save_json,sankey_data,set_sankey_data,ClickSaveDiagram }
 * @returns {*}
 */
export const ApplySaveJSONDialog : FunctionComponent<ApplySaveJSONTypes> = (
  {
    t,
    applicationData,
    dict_hook_ref_setter_show_dialog_components,
    applicationState,
    additional_file_save_json_option,
    ClickSaveDiagram
  }: ApplySaveJSONTypes
) => {
  const [mode_save,set_mode_save]=useState(true)
  const [mode_visible_element,set_mode_visible_element]=useState(false)
  const [show_save_json_modal,set_show_save_json_modal]=useState(false)
  dict_hook_ref_setter_show_dialog_components.ref_setter_show_save_json.current=set_show_save_json_modal
  return <Modal
    isOpen={show_save_json_modal}
    onClose={() => set_show_save_json_modal(false)}
  >
    <ModalContent
      maxWidth='inherit'
    >
      <ModalHeader>
        {t('Menu.SaveJSON')}
      </ModalHeader>
      <ModalCloseButton/>
      <ModalBody>
        <Box layerStyle='menuconfigpanel_grid' >

          <Checkbox
            variant='menuconfigpanel_option_checkbox'
            isChecked={mode_save}
            onChange={() => set_mode_save(!mode_save)}>
            {t('Menu.SaveValue')}
          </Checkbox>
          <Checkbox
            variant='menuconfigpanel_option_checkbox'
            isChecked={mode_visible_element}
            onChange={() => set_mode_visible_element(!mode_visible_element)}>
            {t('Menu.VisibleElement')}
          </Checkbox>
          {additional_file_save_json_option.map(el=>el)}
        </Box>
      </ModalBody>
      <ModalFooter>
        <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
          <span/>
          <Box layerStyle='options_2cols' >

            <Button
              variant='menuconfigpanel_option_button'
              onClick={
                () => {
                  ClickSaveDiagram(
                    applicationData,
                    applicationData.data,
                    applicationState,
                    {
                      mode_save,
                      mode_visible_element
                    }
                  )
                }
              }>{t('Menu.SaveJSON')}
            </Button>
            <Button
              variant='menuconfigpanel_del_button'
              onClick={
                () => {
                  set_show_save_json_modal(false)
                }
              }>{t('Menu.close')}
            </Button>
          </Box>
        </Box>
      </ModalFooter>
    </ModalContent>
  </Modal>
}

export type ExcelModalTypes = {
  t : TFunction,
  UploadExcelImpl: UploadExcelImplFuncType,
  url_prefix: string,
  launch: (path: string) => void,
  dict_hook_ref_setter_show_dialog_components:dict_hook_ref_setter_show_dialog_componentsType,
  Reinitialization:()=>void,
  pointer_pos:{current:number[]}
}

/**
 * Return the modal when we try to open an excel file
 *
 * @param {{ UploadExcelImpl: any; handleCloseDialog: any; set_data: any; data: any; set_show_excel_dialog: any; url_prefix: any; postProcessLoadExcel: any; launch: any; }} { UploadExcelImpl, handleCloseDialog, set_data, data, set_show_excel_dialog,url_prefix,postProcessLoadExcel,launch }
 * @returns
 */
export const ExcelModal: FunctionComponent<ExcelModalTypes> = ({ t,UploadExcelImpl, url_prefix,launch,dict_hook_ref_setter_show_dialog_components,Reinitialization,pointer_pos }) => {
  const [input_file_name, set_input_file_name] = useState<Blob | undefined>(undefined)
  const content =<Box
    layerStyle='menuconfigpanel_grid'
  >
    <Box>
      {t('Menu.input_file_excel')}
      <Input
        type="file"
        accept='.xlsx'
        onChange={(evt: ChangeEvent) => {
          set_input_file_name((evt.target as HTMLFormElement).files[0])
        }}
      />
    </Box>

    <Box layerStyle='menuconfigpanel_row_2cols'>
      <Box/>
      <Button
        variant="menuconfigpanel_option_button_secondary"
        onClick={
          () => {
            Reinitialization()
            launch((input_file_name as unknown as {[name:string]:string}).name)
            UploadExcelImpl(
              dict_hook_ref_setter_show_dialog_components.ref_setter_show_excel_dialog.current,input_file_name as Blob,url_prefix
            )
          }
        }
      >{t('Menu.ouvrir')}</Button>
    </Box>
  </Box>
  return MenuDraggable(dict_hook_ref_setter_show_dialog_components,'ref_setter_show_excel_dialog',content,pointer_pos,t('Menu.open_excel_file'))

}

export const OpenSankeyDiagramSelector : OpenSankeyDiagramSelectorFType = (
  t,
  convert_data,
  sankey_data,
  set_sankey_data,
  prev_sankey_data,
  set_prev_sankey_data,
  updateLayout,
  dataVarToUpdate,
  defaultData
) => {
  const [file_layout,set_file_layout] = useState<Blob[] | undefined>(undefined)
  return <Box>
    <Box as='span' layerStyle='menuconfigpanel_part_title_2' >
      {t('Menu.Transformation.fmep')}
    </Box>
    <Box layerStyle='menuconfigpanel_row_2cols'>
      <Input
        type="file"
        aria-label=''
        onChange={(evt: React.ChangeEvent) => set_file_layout((evt.target as HTMLFormElement).files)} />
      <Box layerStyle='options_2cols' >
        <Button
          variant='menuconfigpanel_option_button'
          onClick={() => {
            if (file_layout === undefined) {
              return
            }
            const reader = new FileReader()
            reader.onload = (() => {
              return (
                (e: ProgressEvent<FileReader>) => {
                  let result = (e.target as FileReader).result
                  if (result) {
                    result = String(result)
                    const new_layout = JSON.parse(result)
                    convert_data(new_layout,defaultData)
                    complete_sankey_data(new_layout, defaultData, DefaultNode, DefaultLink)
                    set_prev_sankey_data(JSON.parse(JSON.stringify(sankey_data)))
                    updateLayout(sankey_data, new_layout, dataVarToUpdate.current, true)
                    set_sankey_data({ ...sankey_data })
                  }
                }
              )
            })()
            reader.readAsText(file_layout[0])
          } }>{t('Menu.Transformation.ad')}
        </Button>
        <Button
          variant='menuconfigpanel_option_button'
          onClick={() => {
            set_sankey_data(JSON.parse(JSON.stringify(prev_sankey_data)))
          } }>{t('Menu.Transformation.undo')}
        </Button>
      </Box>
    </Box>
  </Box>
}

// export const PopoverSelectorDetailNodes:FunctionComponent<popoverSelectorDetailNodesFType>=({
//   applicationContext,
//   applicationData,
//   applicationDraw,
//   node_function,
//   link_function
// }
// )=>{
//   const redrawAllNodes=()=>node_function.RedrawNodes(Object.values(applicationData.display_nodes))
//   const redrawAllLinks=()=>link_function.RedrawLinks(Object.values(applicationData.display_links))

//   return <Popover id='popover-details-level' style={{maxWidth:'100%'}}>
//     <Popover.Header as="h3">{applicationContext.t('Banner.ndd')}</Popover.Header>
//     <Popover.Body style={{  marginLeft: '5px', width: '350px' }}>
//       <>{(Object.entries(applicationData.data.levelTags).length > 0) ? (<>
//         {addSimpleLevelDropDown(
//           applicationData,applicationDraw.reDrawLegend,redrawAllNodes,redrawAllLinks,node_function.recomputeDisplayedElement
//         )}</>
//       ) : (<>
//         <Form.Control placeholder="Pas de filtrage" style={{ opacity: !windowSankey.SankeyToolsStatic ? '0.3' : '0', color: '#6c757d' }} disabled /></>)}</>
//     </Popover.Body>
//   </Popover>
// }
// export default PopoverSelectorDetailNodes