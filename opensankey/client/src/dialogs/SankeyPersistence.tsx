import React, { FunctionComponent, useEffect, useState, } from 'react'

import FileSaver from 'file-saver'

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

/*************************************************************************************************/

import type {
  FType_ClickSaveDiagram,
  FCType_Counter,
  FType_DownloadExamples,
  FType_RetrieveExcelResults,
  FType_UploadExcelImpl,
  FType_UploadExemple,
  FType_JSONtoExcel
} from './types/SankeyPersistenceTypes'
import type { Type_JSON } from '../types/Utils'
import type { Type_GenericApplicationDataOS } from '../types/TypesOS'
import type { FCType_SankeyLoad } from '../types/FunctionTypes'


/* FILE LOADING COMPONENTS *************************************************************/
/**
 * Loading modal
 * @param {*} {
 *   new_data,
 *   successAction,
 *   processFunctions
 * }
 * @return {*}
 */
const SankeyLoad: FunctionComponent<FCType_SankeyLoad> = ({
  new_data,
  successAction,
  processFunctions,
  // postProcessLoadExcel
}) => {
  const { t, url_prefix } = new_data
  const { ref_processing, ref_setter_processing, failure, ref_result, not_started } = processFunctions

  const [value, setValue] = useState([1, 2])
  const [show_load_dialog, set_show_load_dialog] = useState(false)
  new_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_modal_excel_reading_process.current = set_show_load_dialog
  const [result, set_result] = useState('')
  ref_result.current = set_result
  const [processing, set_processing] = useState(false)
  ref_setter_processing.current = set_processing
  const [is_computing, set_is_computing] = useState(false)

  const reset = () => {
    set_processing(false)
    ref_processing.current = false
    failure.current = false
    set_is_computing(false)
    not_started.current = true
  }

  const handleChange = (evt: MouseEvent) => {
    if (value.includes(+(evt.target as HTMLFormElement).value)) {
      value.splice(value.indexOf((evt.target as HTMLFormElement).value))
    } else {
      value.push(+(evt.target as HTMLFormElement).value)
    }
    setValue([...value])
  }

  const infos = result !== undefined ? result.split('\n') : []
  const success_status = t('Menu.loaded_file')
  const failure_status = t('Menu.failure_file')
  const spinner = (processing || is_computing) ? <Spinner thickness='2px' color='openSankey.200' /> : <></>

  if (!not_started.current && !processing) {
    const path = window.location.origin
    const url = path + url_prefix + 'loads_retrieves_result'
    const form_data = new FormData()
    const fetchData = {
      method: 'POST',
      body: form_data
    }
    fetch(url, fetchData).then(response => {
      response.text()
        .then(text => {
          retrieveExcelResults(
            new_data,
            text
          )
        })
        .then(() => {
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
      onClose={() => set_show_load_dialog(false)}
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
        <ModalCloseButton />
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
                  </Button>) : (
                  failure.current ? (
                    <Button
                      variant="menuconfigpanel_del_button" onClick={reset}>{failure_status}</Button>) : <>
                    {
                      is_computing ? (
                        <Button
                          variant='menuconfigpanel_option_button_secondary'>
                          {t('Menu.compute_file')}
                        </Button>) : (
                        <Button
                          variant="menuconfigpanel_option_button"
                          onClick={() => {
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
              <Button onClick={evt => handleChange(evt as unknown as MouseEvent)} value={1} variant={value.includes(1) ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'} >Infos</Button>
              <Button onClick={evt => handleChange(evt as unknown as MouseEvent)} value={2} variant={value.includes(2) ? 'menuconfigpanel_option_button_secondary_activated' : 'menuconfigpanel_option_button_secondary'} >Erreurs</Button>
              <Button onClick={evt => handleChange(evt as unknown as MouseEvent)} value={3} variant={value.includes(3) ? 'menuconfigpanel_option_button_tertiary_activated' : 'menuconfigpanel_option_button_tertiary'} >Debug</Button>
            </Box>
            {processing ? (
              <Counter
                url_prefix={url_prefix}
                finishReconciliation={() => {
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
                      (<div style={{ color: 'red' }}>{info.replace('ERROR', '')}</div>)
                      : value.includes(1) && info.includes('INFO') && !info.includes('POST') ?
                        (<div style={{ color: 'blue' }}>{info.replace('INFO', '')}</div>)
                        : value.includes(3) && (info.includes('DEBUG')) ?
                          (<div style={{ color: 'orange' }}>{info.replace('DEBUG', '')}</div>) : (null)
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
export const Counter: FunctionComponent<FCType_Counter> = ({
  url_prefix,
  finishReconciliation,
  value,
  result,
  set_result
}) => {
  useEffect(() => {
    const interval = setInterval(() => {
      const root = window.location.origin
      const url = root + url_prefix + 'load_process'
      const fetchData = {
        method: 'POST',
        body: ''
      }
      fetch(url, fetchData).then(
        function (response) {
          if (response.ok) {
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
  if (infos.length > 2) {
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
            (<div style={{ color: 'red' }}>{info.replace('ERROR', '')}</div>)
            : value.includes(1) && info.includes('INFO') && !info.includes('POST') ?
              (<div style={{ color: 'blue' }}>{info.replace('INFO', '')}</div>)
              : value.includes(3) && (info.includes('DEBUG')) ?
                (<div style={{ color: 'orange' }}>{info.replace('DEBUG', '')}</div>) : (null)
        )
      )
      }
    </Box>
  )
}

/* EXCEL FILE SAVING PROCESSES *********************************************************/

/**
 * Convert JSON data to Excel file on server side
 * @param {*} data_as_json
 * @param {*} url_prefix
 * @param {string} [file_name='sankey']
 */
export const JSONtoExcel: FType_JSONtoExcel = (
  data_as_json,
  url_prefix,
  file_name = 'sankey'
) => {

  let root = window.location.origin
  if (root.includes('dashboard')) {
    root = root.replace('dashboard', '')
  }
  let url = root + url_prefix + 'sankey/save_excel'

  const fetchData = {
    method: 'POST',
    body: JSON.stringify(data_as_json)
  }

  const showFile = (blob: BlobPart) => {
    const newBlob = new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    FileSaver.saveAs(newBlob, file_name + '.xlsx')
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
export const uploadExcelImpl: FType_UploadExcelImpl = (
  set_show_excel_dialog: (b: boolean) => void,
  input_file: Blob,
  the_url_prefix: string
): void => {
  const root = window.location.origin
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

/**
 * Reset Drawing area with extracted json data from an excel file
 *
 * @param {*} applicationData
 * @param {string} text
 */
export const retrieveExcelResults: FType_RetrieveExcelResults = (
  new_data,
  text: string,
) => {
  // Failsafe
  if (text === '{}')
    return
  // Extract JSON struct
  const data_as_json = JSON.parse(text) as Type_JSON
  data_as_json['version'] = '0.9' // Avoid converter process
  // Extract sankey datas from JSON
  new_data.fromJSON(data_as_json, false)
  // Case 1 : Apply extracted layout if present -> contains positions
  if (data_as_json['layout']) {
    new_data.updateFromJSON(data_as_json)
  }
  // Case 2 :: No layout -> compute default positions & characteristics
  else {
    // Recompute all positions
    new_data.drawing_area.computeAutoFullSankey()
  }
  // Redraw
  new_data.draw()
}


/* JSON FILE SAVING PROCESSES **********************************************************/

/**
 * Convert and download application data as a JSON file
 *
 * @param {*} new_data
 * @param {*} options
 */
export const ClickSaveDiagram: FType_ClickSaveDiagram = (
  new_data
): void => {
  // Convert all datas as JSON
  new_data.saveToJSON()
}

/* EXAMPLES PROCESSING *****************************************************************/

/**
 * Download examples from server
 *
 * @param {string} file_name
 * @param {string} the_url_prefix
 * @param {string} filetype
 */

export const DownloadExamples: FType_DownloadExamples = (
  file_name: string,
  filetype: string
): void => {
  const root = window.location.origin
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
 *
 * @param {string} file_name
 * @param {Type_GenericApplicationDataOS} new_data
 */
export const UploadExemple: FType_UploadExemple = (
  file_name: string,
  new_data: Type_GenericApplicationDataOS
  // Reinitialization: () => void,
  // convert_data: ConvertDataFuncType,
  // DefaultSankeyData: DefaultSankeyDataFuncType
): void => {
  let root = window.location.origin
  if (root.includes('dashboard')) {
    root = root.replace('dashboard', '')
  }

  const url = root + new_data.url_prefix + '/sankey/upload_examples'
  const fetchData = {
    method: 'POST',
    body: file_name
  }

  fetch(url, fetchData).then((response) => {
    response.text().then((text) => {
      const JSON_data = JSON.parse(text)
      const error = JSON_data['error']
      if (error && error.length != 0) {
        alert(error)
        return
      }
      if (!file_name.includes('.xlsx')) {
        // Clear datas & apply read datas
        new_data.fromJSON(JSON_data as Type_JSON, false)
      }
    })
  })
}


