import React,{ FunctionComponent, useEffect, useState, } from 'react'
import * as d3 from 'd3'

import {
  Box,
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner
} from '@chakra-ui/react'

import FileSaver from 'file-saver'

/*************************************************************************************************/

import {
  processFunctionsType,
  dict_hook_ref_setter_show_dialog_componentsType,
  applicationContextType,
  applicationDrawType,
  applicationDataType,
  SankeyData,
  postProcessLoadExcelFuncType,
} from '../types/Types'
import {
  ClickSaveDiagramFuncType,
  ClickSaveExcelFuncType,
  CounterType,
  DownloadExamplesFuncType,
  ProcessExampleFuncType,
  RetrieveExcelResultsFuncType,
  UploadExcelImplFuncType,
  UploadExempleFuncType
} from './types/SankeyPersistenceTypes'

import {
  ConvertDataFuncType
} from '../configmenus/types/SankeyConvertTypes'
import {
  DefaultSankeyDataFuncType
} from '../configmenus/types/SankeyUtilsTypes'
import {
  updateLayoutFuncType
} from '../draw/types/SankeyDrawLayoutTypes'

/*************************************************************************************************/

import {
  AdjustSankeyZone,
  AssignNodeLocalAttribute,
  DataSuiteType,
  DefaultLink,
  DefaultNode,
  DefaultSankeyData,
  GetRandomInt,
  SetNodeStyleToTypeNode,
  layout_type,
  list_palette_color
} from '../configmenus/SankeyUtils'
import {
  complete_sankey_data
} from '../configmenus/SankeyConvert'
import {
  ComputeAutoSankey,
  compute_default_input_outputLinksId
} from '../draw/SankeyDrawLayout'
import { Type_JSON } from '../types/Utils'


/* FILE LOADING COMPONENTS *************************************************************/

interface SankeyLoadProdTypes {
  applicationContext: applicationContextType,
  applicationDraw: applicationDrawType,
  applicationData: applicationDataType,
  successAction: () => void,
  dict_hook_ref_setter_show_dialog_components:dict_hook_ref_setter_show_dialog_componentsType,
  processFunctions:processFunctionsType,
  convert_data:ConvertDataFuncType,
  postProcessLoadExcel:postProcessLoadExcelFuncType
}

/**
 * Loading modal
 * @param {*} {
 *   applicationContext,
 *   applicationDraw,
 *   applicationData,
 *   successAction,
 *   processFunctions,
 *   dict_hook_ref_setter_show_dialog_components,
 *   convert_data,
 *   postProcessLoadExcel
 * }
 * @return {*}
 */
const SankeyLoad : FunctionComponent<SankeyLoadProdTypes> = ({
  applicationContext,
  applicationDraw,
  applicationData,
  successAction,
  processFunctions,
  dict_hook_ref_setter_show_dialog_components,
  convert_data,
  postProcessLoadExcel
}) => {
  const { t, url_prefix } = applicationContext
  const { ref_processing, ref_setter_processing, failure, ref_result, not_started, RetrieveExcelResults } = processFunctions

  const [value,setValue] = useState([1,2])
  const [show_load_dialog,set_show_load_dialog] = useState(false)
  dict_hook_ref_setter_show_dialog_components.ref_setter_show_load.current=set_show_load_dialog
  const [result,set_result] = useState('')
  ref_result.current = set_result
  const [processing,set_processing] = useState(false)
  ref_setter_processing.current = set_processing
  const [is_computing,set_is_computing] = useState(false)

  const reset = () => {
    set_processing(false)
    ref_processing.current = false
    failure.current = false
    set_is_computing(false)
    not_started.current = true
  }

  const handleChange = (evt:MouseEvent) => {
    if ( value.includes(+(evt.target as HTMLFormElement).value) ) {
      value.splice(value.indexOf((evt.target as HTMLFormElement).value))
    } else {
      value.push(+(evt.target as HTMLFormElement).value)
    }
    setValue([...value])
  }

  const infos = result !== undefined ? result.split('\n') : []
  const success_status = t('Menu.loaded_file')
  const failure_status = t('Menu.failure_file')
  const spinner=(processing || is_computing)? <Spinner thickness='2px' color='openSankey.200' />:<></>

  if (!not_started.current && !processing) {
    const path = window.location.href
    const url = path + applicationContext.url_prefix + 'loads_retrieves_result'
    const form_data = new FormData()
    const fetchData = {
      method: 'POST',
      body: form_data
    }
    fetch(url, fetchData).then(response => {
      response.text()
        .then(text => {
          try {
            RetrieveExcelResults(
              applicationData,
              text,
              applicationDraw.updateLayout,
              postProcessLoadExcel,
              applicationDraw.GetSankeyMinWidthAndHeight,
              convert_data,
              applicationData.get_default_data
            )
          }
          catch(err) {
            alert(err)
          }
        })
        .then(()=>{
          set_is_computing(false)
        })
    })
    set_processing(false)
    ref_processing.current = false
    failure.current = false
    not_started.current = true
  }

  return (
    <Modal
      isOpen={show_load_dialog}
      onClose={ () => set_show_load_dialog(false) }
    >
      <ModalOverlay />
      <ModalContent
        display='flex'
        justifyContent='center'
        alignItems='center'
        maxWidth='inherit'
      >
        <ModalHeader >
        Chargement du fichier {spinner}
        </ModalHeader>
        <ModalCloseButton/>
        <ModalBody>
          <Box
            layerStyle='menucontext_layout'
            width='60rem'
          >
            <Box>
              {
                processing ? (
                  <Button variant="menuconfigpanel_option_button_tertiary">
                    <span className="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span>
                    {t('Menu.load_file')}
                  </Button>):(
                  failure.current ? (
                    <Button
                      variant="menuconfigpanel_del_button" onClick={reset}>{failure_status}</Button>) : <>
                    {
                      is_computing ? (
                        <Button
                          variant='menuconfigpanel_option_button_secondary'>
                          {t('Menu.compute_file')}
                        </Button>):(
                        <Button
                          variant="menuconfigpanel_option_button"
                          onClick={()=>{
                            successAction()
                            set_show_load_dialog(false)
                          }}>
                          {success_status}
                        </Button>)
                    }</>
                )
              }
            </Box>

            <Box layerStyle='options_3cols'>
              <Button onClick={evt=>handleChange(evt as unknown as MouseEvent)} value={1} variant={value.includes(1) ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'} >Infos</Button>
              <Button onClick={evt=>handleChange(evt as unknown as MouseEvent)} value={2} variant={value.includes(2) ? 'menuconfigpanel_option_button_secondary_activated' : 'menuconfigpanel_option_button_secondary'} >Erreurs</Button>
              <Button onClick={evt=>handleChange(evt as unknown as MouseEvent)} value={3} variant={value.includes(3) ? 'menuconfigpanel_option_button_tertiary_activated' : 'menuconfigpanel_option_button_tertiary'} >Debug</Button>
            </Box>
            {processing ? (
              <Counter
                url_prefix={url_prefix}
                finishReconciliation={()=>{
                  set_processing(false)
                  ref_processing.current = false
                  set_is_computing(true)
                  failure.current = false
                }}
                value={value}
                result={result}
                set_result={set_result}
              />
            ) : (<>
              <Box
              >
                {infos.map(
                  (info) => (
                    value.includes(2) && info.includes('ERROR') ?
                      (<div style={{color:'red'}}>{info.replace('ERROR','')}</div>)
                      : value.includes(1) && info.includes('INFO') && !info.includes('POST') ?
                        (<div style={{color:'blue'}}>{info.replace('INFO','')}</div>)
                        : value.includes(3) && (info.includes('DEBUG') ) ?
                          (<div style={{color:'orange'}}>{info.replace('DEBUG','')}</div>) : (null)
                  )
                )
                }
              </Box>
            </>
            )}
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
export default SankeyLoad

/**
 * TODO Description
 *
 * @param {*} {
 *   url_prefix,
 *   finishReconciliation,
 *   value,
 *   result,
 *   set_result
 * }
 * @return {*}
 */
export const Counter:FunctionComponent<CounterType> = ({
  url_prefix,
  finishReconciliation,
  value,
  result,
  set_result
}) => {
  useEffect(() =>{
    const interval = setInterval(() => {
      const root = window.location.href
      const url = root + url_prefix + 'load_process'
      const fetchData = {
        method: 'POST',
        body: ''
      }
      fetch(url, fetchData).then(
        function(response) {
          if(response.ok) {
            response.json().then(
              function (data) {
                set_result(data.output)
              }
            )
          }
        })
    }, 5000)
    return () => clearInterval(interval)
  })
  const infos = result.split('\n')
  if ( infos.length > 2) {
    if (result.includes('FINISHED')) {
      finishReconciliation(false)
    } else if (result.includes('FAILED')) {
      finishReconciliation(true)
    }
  }
  return (
    <Box >
      {infos.map(
        info => (
          value.includes(2) && info.includes('ERROR') ?
            (<div style={{color:'red'}}>{info.replace('ERROR','')}</div>)
            : value.includes(1) && info.includes('INFO') && !info.includes('POST') ?
              (<div style={{color:'blue'}}>{info.replace('INFO','')}</div>)
              : value.includes(3) && (info.includes('DEBUG') ) ?
                (<div style={{color:'orange'}}>{info.replace('DEBUG','')}</div>) : (null)
        )
      )
      }
    </Box>
  )
}

/* EXCEL FILE SAVING PROCESSES *********************************************************/

/**
 * Triggers server side conversion JSON -> Excel
 * + launch download
 * @param {string} url_prefix
 * @param {Type_JSON} data
 * @param {string} [file_name='sankey']
 */
export const ClickSaveExcel: ClickSaveExcelFuncType = (
  url_prefix,
  data_as_JSON,
  file_name='sankey'
) => {
  let root = window.location.href
  if (root.includes('dashboard')) {
    root = root.replace('dashboard', '')
  }
  let url = root + url_prefix + 'sankey/save_excel'

  const fetchData = {
    method: 'POST',
    body: JSON.stringify(data_as_JSON)
  }

  const showFile = (blob: BlobPart) => {
    const newBlob = new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    FileSaver.saveAs(newBlob, file_name+'.xlsx')
  }

  const cleanFile = () => {
    const fetchData = {
      method: 'POST'
    }
    url = root + url_prefix + 'sankey/clean_excel'
    fetch(url, fetchData)
  }

  fetch(url, fetchData)
    .then(r => r.blob())
    .then(showFile)
    .then(cleanFile)
}

/**
 * Trigger server side conversion Excel -> JSON
 * @param {(b: boolean) => void} set_show_excel_dialog
 * @param {Blob} input_file
 * @param {string} the_url_prefix
 */
export const UploadExcelImpl: UploadExcelImplFuncType = (
  set_show_excel_dialog: (b: boolean) => void,
  input_file: Blob,
  the_url_prefix: string
): void => {
  const root = window.location.href
  const url = root + the_url_prefix + 'sankey/upload_excel'
  const form_data = new FormData()
  form_data.append(
    'file', input_file
  )
  const fetchData = {
    method: 'POST',
    body: form_data
  }
  fetch(url, fetchData)
  set_show_excel_dialog(false)
}

export const RetrieveExcelResults: RetrieveExcelResultsFuncType = (
  applicationData,
  text: string,
  updateLayout: updateLayoutFuncType,
  postProcessLoadExcel: (server_data: SankeyData) => void,
  GetSankeyMinWidthAndHeight,
  convert_data: ConvertDataFuncType,
  defaultData: () => SankeyData
) => {
  // Get data & reinit
  const { new_data } = applicationData
  new_data.fromJSON(JSON.parse(text) as Type_JSON)

  // TODO autocompute sankey
  // TODO adjust sankey zone

  // const { set_data } = applicationData
  // const default_data = defaultData()
  // const server_data = JSON.parse(text)
  // let default_nstyle = default_data.style_node['default']
  // let default_lstyle = default_data.style_link['default']
  // server_data.h_space = default_data.h_space
  // server_data.v_space = default_data.v_space
  // if ((default_data as SankeyData & { layout?: SankeyData} ).layout) {
  //   server_data.layout = (default_data as SankeyData & { layout?: SankeyData} ).layout
  // } else {
  //   default_nstyle = JSON.parse(JSON.stringify(default_data.style_node['default']))
  //   default_lstyle = JSON.parse(JSON.stringify(default_data.style_link['default']))
  // }
  // const new_data = Object.assign(default_data, server_data) as SankeyData
  // applicationData.data=new_data
  // ProcessExample(applicationData, updateLayout, convert_data, postProcessLoadExcel, DefaultSankeyData)
  // new_data.style_node['default'] = default_nstyle
  // new_data.style_link['default'] = default_lstyle
  // delete (new_data as SankeyData & { layout?: SankeyData} ).layout
  // if (Object.values(new_data.nodeTags).filter(tagg => tagg.show_legend).length > 0) {
  //   new_data.colorMap = Object.entries(new_data.nodeTags).filter(tagg => tagg[1].show_legend)[0][0]
  //   Object.values(new_data.nodes).forEach(el => {
  //     el.colorParameter = 'groupTag'
  //     el.colorTag = new_data.colorMap
  //   })
  // }
  // if (Object.keys(new_data.nodeTags).filter(t => new_data.nodeTags[t].show_legend).length == 0 &&
  //   Object.keys(new_data.fluxTags).filter(tag => tag === 'flux_type').length == 0 &&
  //   Object.values(new_data.nodes).filter(n => n.local && n.local.color).length == 0 &&
  //   Object.values(new_data.links).filter(l => l.local && l.local.color).length == 0) {
  //   const color_selected = list_palette_color[GetRandomInt(list_palette_color.length)]
  //   const n_keys = Object.keys(new_data.nodes)
  //   const size_color = n_keys.length

  //   for (const i in d3.range(size_color)) {
  //     AssignNodeLocalAttribute(new_data.nodes[n_keys[i]], 'color', (d3.color(color_selected(+i / size_color))?.formatHex() as string))
  //   }
  // }
  // set_data({ ...new_data })
  // setTimeout(() => {
  //   AdjustSankeyZone(applicationData, GetSankeyMinWidthAndHeight)
  // }, 100)
}


/* JSON FILE SAVING PROCESSES **********************************************************/

/**
 * Convert and download application data as a JSON file
 *
 * @param {*} ApplicationClass
 * @param {*} options
 */
export const ClickSaveDiagram: ClickSaveDiagramFuncType = (
  ApplicationClass,
  options
): void => {
  // Convert all datas as JSON
  const json_data = ApplicationClass.drawing_area.toJSON(
    options.mode_visible_element,
    options.mode_save
  )
  // Prepare JSON for saving
  const json_data_str = JSON.stringify(json_data)
  const blob = new Blob([json_data_str], { type: 'text/plain;charset=utf-8' })
  // Set name for file to download
  const dataAsSuite = (json_data as DataSuiteType)
  let name = 'Diagramme de Sankey'
  if (
    dataAsSuite.view &&
    dataAsSuite.view.length > 0 &&
    !dataAsSuite.is_catalog
  ) {
    name = 'Diagramme de Sankey avec vues'
  }
  else if (dataAsSuite.is_catalog === true) {
    name = 'Catalogue de vues de diagrammes de Sankey'
  }
  // Trigger file download
  FileSaver.saveAs(blob, name + '.json')
}

/* EXAMPLES PROCESSING *****************************************************************/

// TODO s'en occuper
export const ProcessExample: ProcessExampleFuncType = (
  applicationData,
  updateLayout: updateLayoutFuncType,
  convert_data: ConvertDataFuncType,
  postProcessLoadExcel: (server_data: SankeyData) => void,
  DefaultSankeyData: () => SankeyData

): SankeyData => {
  const {data}=applicationData
  complete_sankey_data(data, DefaultSankeyData, DefaultNode, DefaultLink)
  convert_data({data: data} as applicationDataType, DefaultSankeyData) // FIXME when new_data ready for it
  if ((data as SankeyData & layout_type).layout === undefined) {
    // Compute node position of all node according to their level tags
    const lvl_tag_keys=Object.keys(data.levelTags)
    // If data only have level Tag 'Primaire' then compute node position at each levle
    if( (lvl_tag_keys.length == 1) && lvl_tag_keys[0]==='Primaire' ){
      const prim=lvl_tag_keys[0]
      Object.values(data.levelTags[prim].tags).reverse().forEach(tag_prim=>{
      // Deselect all Primaire tags
        Object.values(data.levelTags[prim].tags).forEach(t=>t.selected=false)
        // Select current tag to compute position
        tag_prim.selected=true
        ComputeAutoSankey(applicationData, data.h_space ? data.h_space : 200,true)
      })
    }else if((lvl_tag_keys.length > 1)){
    // If data have multiple level Tag
    // then compute node position at each level of each level tag group
    // except 'Primaire'

      lvl_tag_keys.filter(kt=>kt!=='Primaire').forEach(kt=>{
        Object.values(data.levelTags[kt].tags).reverse().forEach(tag_prim=>{
        // Deselect all tags of the current grp tag
          Object.values(data.levelTags[kt].tags).forEach(t=>t.selected=false)
          // Select current tag to compute position
          tag_prim.selected=true
          ComputeAutoSankey(applicationData, data.h_space ? data.h_space : 200,true)
        })
      })

    }
    else{
      ComputeAutoSankey(applicationData, data.h_space ? data.h_space : 200,true)

    }
    postProcessLoadExcel(data)
    compute_default_input_outputLinksId(data.nodes, data.links)
    // Set sector/product style to node only when it come from an excel file and without a layout
    SetNodeStyleToTypeNode(data)
  } else {
    convert_data(
      {data: (data as SankeyData & layout_type).layout} as applicationDataType, // FIXME when new_data ready for it
      DefaultSankeyData
    )
    complete_sankey_data((data as SankeyData & layout_type).layout, DefaultSankeyData, DefaultNode, DefaultLink)// FIXME when new_data ready for it
    compute_default_input_outputLinksId(data.nodes, data.links)
    const data_layout = JSON.parse(JSON.stringify((data as SankeyData & { layout?: SankeyData} ).layout)) as SankeyData
    delete (data as SankeyData & { layout?: SankeyData} ).layout
    updateLayout(data, data_layout, ['posNode', 'attrNode', 'attrFlux', 'attrDrawingArea', 'freeLabels', 'Views','tagNode','tagFlux','icon_catalog'], true)
    postProcessLoadExcel(data)
  }
  d3.select('.loading_auto_compute').remove()

  return data
}

/**
 * Download examples from server
 *
 * @param {string} file_name
 * @param {string} the_url_prefix
 * @param {string} filetype
 */

export const DownloadExamples: DownloadExamplesFuncType = (
  file_name: string,
  the_url_prefix: string,
  filetype: string
): void => {
  const root = window.location.href
  const url = root + '/opensankey/sankey/download_examples'
  const fetchData = {
    method: 'POST',
    body: file_name
  }
  const showFile = (blob: BlobPart) => {
    const newBlob = new Blob([blob], { type: filetype })
    FileSaver.saveAs(newBlob, file_name)
  }
  fetch(url, fetchData).then(
    response => {
      if (response.ok) {
        response.blob().then(showFile)
      }
    })
}

/**
 *
 * @param {string} file_name
 * @param {string} the_url_prefix
 * @param {SankeyData} data
 * @param {(data: SankeyData) => void} set_data
 * @returns {void) => void}
 */
export const UploadExemple: UploadExempleFuncType = (
  file_name: string,
  the_url_prefix: string,
  data: SankeyData,
  set_data: (data: SankeyData) => void,
  Reinitialization: () => void,
  convert_data: ConvertDataFuncType,
  DefaultSankeyData: DefaultSankeyDataFuncType
): void => {
  let root = window.location.href
  if (root.includes('dashboard')) {
    root = root.replace('dashboard', '')
  }

  const url = root + the_url_prefix + '/sankey/upload_examples'
  const fetchData = {
    method: 'POST',
    body: file_name
  }

  fetch(url, fetchData).then((response) => {
    response.text().then((text) => {
      const server_data = JSON.parse(text)
      const error = server_data['error']
      if (error && error.length != 0) {
        alert(error)
        return
      }

      if (!file_name.includes('.xlsx')) {
        Reinitialization()
        complete_sankey_data(server_data, DefaultSankeyData, DefaultNode, DefaultLink)
        convert_data(server_data, DefaultSankeyData)
        set_data({ ...server_data })
      }
    })
  })
}


