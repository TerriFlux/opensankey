// External libs
import React, {
  useEffect,
  useState,
  useRef,
  ChangeEvent,
  FunctionComponent
} from 'react'
import FileSaver from 'file-saver'

import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Checkbox,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader
} from '@chakra-ui/react'
import { Type_GenericApplicationDataOSP } from '../../types/TypesOSP'

export interface IType_SupplyUseModelisationProd {
  application_data_mfa: Type_GenericApplicationDataOSP,
  launch: (path: string) => void
}

/**
 *
 *
 * @param {*} {
 *   application_data_mfa,
 *   postProcessLoadExcel,
 *   launch
 * }
 * @return {*}
 */
export const SupplyUseModelisationProd: FunctionComponent<IType_SupplyUseModelisationProd> = ({
  application_data_mfa,
  launch
}) => {
  const { t } = application_data_mfa
  const { menu_configuration} = application_data_mfa
  const [result, setResult] = useState('')
  const [processing, setProcessing] = useState(false)
  const [failure, setFailure] = useState(false)
  const [not_started, setNotStarted] = useState(true)
  const [value, setValue] = useState([1, 2])
  const [regions, setRegions] = useState(false)
  const [uncertainty, setUncertainty] = useState(false)
  const [nb_realizations, setNbRealizations] = useState(100)
  const [input_file_name, setInputFileName] = useState('sankey.xlsx')
  const [layout_file, set_layout_file] = useState<Blob | undefined>(undefined)
  const [input_file, set_input_file] = useState<Blob | undefined>(undefined)
  const _load_excel = useRef<HTMLInputElement>(null)

  const [show_reconciliation, set_show_reconciliation] = useState(false)
  application_data_mfa.menu_configuration.dict_setter_show_dialog_afm.ref_setter_show_reconciliation.current = set_show_reconciliation

  let upper_level_file_ = useRef<HTMLInputElement>(null)

  const setNbRealisations = (e: ChangeEvent) => {
    setNbRealizations((e.target as HTMLFormElement).value)
  }

  const uncertaintyChange = (e: ChangeEvent) => {
    setUncertainty((e.target as HTMLFormElement).checked)
  }

  const handleChange = (evt: MouseEvent) => {
    const value_selected = +(evt.target as HTMLFormElement).value
    if (value.includes(value_selected)) {
      value.splice(value.indexOf(value_selected), 1)
    } else {
      value.push(+(evt.target as HTMLFormElement).value)
    }
    setValue([...value])
  }

  const regionChange = (evt: ChangeEvent) => {
    setRegions((evt.target as HTMLFormElement).checked)
  }

  const setInputFile = (evt: ChangeEvent) => {
    set_input_file((evt.target as HTMLFormElement).files[0])
  }

  const setLayoutFile = (evt: ChangeEvent) => {
    set_layout_file((evt.target as HTMLFormElement).files[0])
  }

  const setRegionFile = (evt: ChangeEvent) => {
    upper_level_file_ = (evt.target as HTMLFormElement).files[0]
  }

  // Define cleaning temporary dir function
  const CleanServer = () => {
    const path = window.location.origin
    const url_optimize_prod_clean = path + '/optimize/post_clean'
    const fetchData = {
      method: 'POST',
      body: ''
    }
    fetch(url_optimize_prod_clean, fetchData)
      .then(
        function (response) {
          if (!response.ok) {
            setResult(result + '\n ERROR: optimize_prod_clean a retourné une erreur qui n\'est pas en format json')
            setFailure(true)
          }
          else {
            setProcessing(false)
            setFailure(failure)
            setNotStarted(false)
          }
        })
      .catch(function () {
        setResult(result + '\n ERROR: optimize_prod_clean: erreur fatale.')
        setFailure(true)
      })
    return
  }

  // const GetRandomInt = (max: number) => {
  //   return Math.floor(Math.random() * max)
  // }

  // Function called to download the excel file from the reconciliation
  const RetrievesResults = () => {
    // Define download excel file function
    function DownloadFile(blob: BlobPart) {
      const root_input_file_name = input_file_name.split('.')[0]
      let suffix = '_reconciled.xlsx'
      if (menu_configuration.action_type === 'check_excel') {
        suffix = '_corrected.xlsx'
      }
      else if (menu_configuration.action_type === 'create_empty_ter') {
        suffix = '_ter_created.xlsx'
      }
      const output_file_name = root_input_file_name + suffix
      const newBlob = new Blob(
        [blob],
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      FileSaver.saveAs(newBlob, output_file_name)
      return newBlob
    }

    // Define Display Sankey function
    // Fetching results
    const path = window.location.origin
    const url_optimize_retrieves_results = path + '/optimize/retrieve_results'
    const form_data = new FormData()
    const fetchData = {
      method: 'POST',
      body: form_data
    }
    fetch(url_optimize_retrieves_results, fetchData).then(
      function (response) {
        if (response.ok) {
          if (menu_configuration.action_type === 'check_excel') {
            CleanServer()
          }
          else {
            response
              .blob()
              .then(DownloadFile)
          }
        }
        else {
          response
            .json()
            .then(data => {
              setResult(data.output)
              setFailure(true)
            })
            .then(CleanServer)
            .catch(() => {
              setResult(result + '\n ERROR: optimize_retrieves_result a retourné une erreur qui n\'est pas en format json')
              setFailure(true)
            })
          menu_configuration.action_type = ''
          setNotStarted(true)
        }
      }
    )
    return
  }

  // Function called to display the excel file from the reconciliation,
  // it open the file like a normal excel file
  const DisplayResults = () => {
    // Define Display Sankey function
    function DisplaySankey(value: Blob) {
      if (menu_configuration.action_type == 'optim') {
        launch((value as unknown as { [name: string]: string }).name)
        const root = window.location.origin
        const url = root + '/' + 'opensankey/excel/upload/launch'
        const form_data = new FormData()
        form_data.append(
          'file', value
        )
        const fetchData = {
          method: 'POST',
          body: form_data
        }
        fetch(url, fetchData)
        return
      }
      else {
        // Get Layout from file if asked
        if (layout_file !== undefined) {
          const reader = new FileReader()
          // Reader behavior on layout reading
          reader.onload = (() => {
            return (
              (e: ProgressEvent<FileReader>) => {
                let result = (e.target as FileReader).result
                if (result) {
                  result = String(result)
                  // const layout = JSON.parse(result) as Type_JSON
                  //(data as AFMSankeyData & { layout?: AFMSankeyData }).layout = layout
                }
              }
            )
          })
          // Read layout
          reader.readAsText(layout_file)
        }

        // Update displayed Sankey
        const root = window.location.origin
        const url_optimize_display_results = root + '/optimize/display_results'
        const form_data = new FormData()
        const fetchData = {
          method: 'POST',
          body: form_data
        }
        fetch(url_optimize_display_results, fetchData)
          .then(response => {
            response
              .text()
              .then(GetAndApplySankeyJson)
          })
      }

    }

    // Define get results function
    function GetAndApplySankeyJson(new_sankey_json_str: string) {
      try {
        // Extract data as JSON
        const new_sankey_json_obj = JSON.parse(new_sankey_json_str)
        // Check if we got any error
        const error = new_sankey_json_obj['error']
        if (error && error.length != 0) {
          alert(error)
          return
        }
        // Reconcilliation from current Sankey -> Apply current layout
        if (menu_configuration.action_type === 'optim_sankey') {
          application_data_mfa.drawing_area.fromJSON(new_sankey_json_obj)
          application_data_mfa.sendWaitingToast(
            () => {
              application_data_mfa.menu_configuration.ref_to_spreadsheet.current()
            }
          )
        }
        else {
          application_data_mfa.fromJSON(new_sankey_json_obj)
        }

        //const new_data = Object.assign(DefaultSankeyData(), new_sankey_json_obj) as AFMSankeyData

        // ProcessExample(
        //   application_data_mfa,
        //   postProcessLoadExcel
        // )
        // const default_nstyle = DefaultSankeyData().style_node['default']
        // const default_lstyle = DefaultSankeyData().style_link['default']
        // new_data.style_node['default'] = default_nstyle
        // new_data.style_link['default'] = default_lstyle
        //delete (new_data as SankeyData & { layout?: SankeyData }).layout
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
        //   Object.values(new_data.links).filter(l => l.local && l.local.color).length == 0
        // ) {
        //   const color_selected = list_palette_color[GetRandomInt(list_palette_color.length)]
        //   const n_keys = Object.keys(new_data.nodes)
        //   const size_color = n_keys.length

        //   for (const i in d3.range(size_color)) {
        //     AssignNodeLocalAttribute(new_data.nodes[n_keys[i]], 'color', (d3.color(color_selected(+i / size_color))?.formatHex() as string))
        //   }
        //}
        //set_data({ ...new_data })
      }
      catch (err) {
        alert('Could not display optimized Sankey : ' + err)
      }
      return
    }

    // Fetching results
    const path = window.location.origin
    const url_optimize_retrieves_results = path + '/optimize/retrieve_results'
    const form_data = new FormData()
    const fetchData = {
      method: 'POST',
      body: form_data
    }
    fetch(url_optimize_retrieves_results, fetchData).then(
      function (response) {
        if (response.ok) {
          if (menu_configuration.action_type === 'check_excel') {
            CleanServer()
          }
          else {
            response
              .blob()
              .then((value: Blob)=>{
                DisplaySankey(value)
              })
          }
        }
        else {
          response
            .json()
            .then(data => {
              setResult(data.output)
              setFailure(true)
            })
            .then(CleanServer)
            .catch(() => {
              setResult(result + '\n ERROR: optimize_retrieves_result a retourné une erreur qui n\'est pas en format json')
              setFailure(true)
            })
          menu_configuration.action_type = ''
          setNotStarted(true)
        }
      }
    )
    return
  }

  const reset = () => {
    setProcessing(false)
    setFailure(false)
    setNotStarted(true)
    setResult('')
  }

  const launchReconciliation = () => {
    if (!input_file && menu_configuration.action_type !== 'optim_sankey') {
      return
    }
    // Optimisation params
    const data_server = new FormData()
    data_server.append('input_file', input_file as Blob)
    data_server.append('optim_sankey', String(menu_configuration.action_type === 'optim_sankey'))
    data_server.append('create_empty_ter', String(menu_configuration.action_type === 'create_empty_ter'))
    data_server.append('check_excel', String(menu_configuration.action_type === 'check_excel'))
    data_server.append('uncertainty_analysis', String(uncertainty))
    data_server.append('nb_realizations', String(nb_realizations))
    data_server.append('upper_level_file', (upper_level_file_ as unknown as HTMLFormElement).name)
    if (menu_configuration.action_type === 'optim_sankey') {
      const new_sankey_json_obj = JSON.parse(JSON.stringify(application_data_mfa.drawing_area.toJSON()))
      new_sankey_json_obj.icon_catalog = {}
      data_server.append('sankey_data', JSON.stringify(application_data_mfa.drawing_area.toJSON()))
    }

    // POST request for optimisation
    const path = window.location.origin
    const url = path + '/optimize/launch'
    const fetchData = {
      method: 'POST',
      body: data_server
    }
    fetch(url, fetchData)

    // Set processing indicators
    setProcessing(true)
    setFailure(true)
    setNotStarted(false)
    setResult('')
    if (input_file) {
      setInputFileName((input_file as unknown as { name: string }).name)
    }
  }

  const FinishReconciliation = () => {
    // Retrieve results
    if (!failure) {
      RetrievesResults()
    }
    else {
      CleanServer()
    }
  }

  const infos = (result !== undefined) ? result.split('\n') : []
  let title = 'Réconciliation des données'
  if (menu_configuration.action_type === 'check_excel') {
    title = 'Vérification du fichier d\'entrée'
  }
  else if (menu_configuration.action_type === 'create_empty_ter') {
    title = 'Création de la table Ressources Emplois'
  }

  let success_status = t('ModalAFM.success_status_optim')
  if (menu_configuration.action_type === 'check_excel') {
    success_status = t('ModalAFM.success_status_check_excel')
  } else if (menu_configuration.action_type === 'create_empty_ter') {
    success_status = t('ModalAFM.success_status_create_ter')
  }

  let failure_status = t('ModalAFM.fail_status_optim')
  if (menu_configuration.action_type === 'check_excel') {
    failure_status = t('ModalAFM.fail_status_check_excel')
  }
  else if (menu_configuration.action_type === 'create_empty_ter') {
    failure_status = t('ModalAFM.fail_status_create_ter')
  }

  useEffect(() => {
    if (menu_configuration.action_type === '' && result !== '') {
      reset()
    }
  })
  if (show_reconciliation) {
    if (not_started && menu_configuration.action_type === 'optim_sankey') {
      launchReconciliation()
    } else if (menu_configuration.action_type === '') {
      setResult('')
    }
  }
  // if (show_reconciliation && menu_configuration.action_type === 'optim_sankey' && !not_started && !processing && !failure) {
  //   set_show_reconciliation(false)
  // }
  return (
    <Modal
      size="lg"
      scrollBehavior='inside'
      isOpen={show_reconciliation}
      onClose={() => {
        CleanServer()
        set_show_reconciliation(false)
        menu_configuration.action_type = ''
      }}>
      <ModalContent
        maxWidth='inherit'
      >
        <ModalHeader>
          {t('ModalAFM.title')}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {menu_configuration.action_type !== 'optim_sankey' ? (<>
            <Box as='span' layerStyle='menuconfigpanel_part_title_1'>
              {t('ModalAFM.input_parameter')}
            </Box>

            <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
              <Box layerStyle='menuconfigpanel_suboption_name'>
                {t('ModalAFM.input_excel')}
              </Box>
              <Input
                size='xs'
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                ref={_load_excel}
                onChange={setInputFile}
              />
            </Box>

            <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
              <Box layerStyle='menuconfigpanel_suboption_name'>
                {t('ModalAFM.input_layout')}
              </Box>

              <Input
                size='xs'
                type="file"
                onChange={setLayoutFile}
              />
            </Box></>
          ) : (<></>)}
          {menu_configuration.action_type === 'optim' ? (
            <Checkbox
              isChecked={regions}
              variant='menuconfigpanel_option_checkbox'
              onChange={regionChange}
            >
              {t('ModalAFM.check_scale_geo')}
            </Checkbox>
          ) : (<div></div>)}
          {regions && menu_configuration.action_type === 'optim' ? (
            <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
              <Box layerStyle='menuconfigpanel_suboption_name'>
                {t('ModalAFM.input_scale_geo')}
              </Box>
              <Input
                size='xs'
                type="file" name=""
                onChange={setRegionFile}
              />
            </Box>) : (<div></div>)}
          {menu_configuration.action_type === 'optim' ? (
            <Checkbox
              isChecked={uncertainty}
              variant='menuconfigpanel_option_checkbox'
              onChange={uncertaintyChange}>
              {t('ModalAFM.check_analyse_uncert')}

            </Checkbox>
          ) : (<div></div>)}
          {uncertainty && menu_configuration.action_type === 'optim' ? (
            <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
              <Box layerStyle='menuconfigpanel_suboption_name'>
                {t('ModalAFM.input_analyse_uncert')}
              </Box>
              <Input
                size='xs'
                isDisabled={!uncertainty}
                value={nb_realizations}
                type="text"
                onChange={setNbRealisations}
              />
            </Box>) : (<div></div>)}
          <hr />
          <Box
            as='span'
            layerStyle='menuconfigpanel_part_title_1'>
            {title}
          </Box>
          <Box
            layerStyle='menuconfigpanel_grid'
          >
            {input_file || menu_configuration.action_type === 'optim_sankey' ?
              (not_started ? (<Button variant="menuconfigpanel_option_button" onClick={launchReconciliation}>
                {t('ModalAFM.launch')}
              </Button>) :
                processing ? (
                  <Button variant="menuconfigpanel_option_button_secondary">
                    <span
                      className="glyphicon glyphicon-refresh glyphicon-refresh-animate">
                    </span>
                    {t('ModalAFM.processing')}

                  </Button>) : (
                  failure ?
                    <Button variant="menuconfigpanel_del_button" onClick={reset}>{failure_status}</Button> :
                    <Box as='span' layerStyle='options_3cols'>
                      <Button variant="menuconfigpanel_option_button" onClick={()=>{
                        set_show_reconciliation(false)
                        DisplayResults()
                      }}>{t('ModalAFM.open_file')}</Button>
                      <Button variant="menuconfigpanel_option_button_secondary" onClick={FinishReconciliation}>{success_status}</Button>
                      <Button variant="menuconfigpanel_del_button" onClick={reset}>{t('ModalAFM.reset')}</Button>
                    </Box>
                )) : (<Button variant="primary" disabled onClick={launchReconciliation}>{t('ModalAFM.launch')}</Button>)}
          </Box>
          {input_file === undefined && menu_configuration.action_type !== 'optim_sankey' ? <Alert status='warning'>
            <AlertIcon />
            {t('ModalAFM.waiting_file')}
          </Alert> : <></>}
          {!not_started && !processing && !failure ? (
            <Alert status='success'>
              <AlertIcon />
              {t('ModalAFM.success')}
            </Alert>
          ) : (<div />)}
          <hr />
          <Box
            as='span'
            layerStyle='menuconfigpanel_part_title_1'>
            Terminal
          </Box>
          <Box
            as='span'
            layerStyle='options_3cols'
          >
            <Button onClick={evt => handleChange(evt as unknown as MouseEvent)} value={1} variant={value.includes(1) ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'} >{t('ModalAFM.infos')}</Button>
            <Button onClick={evt => handleChange(evt as unknown as MouseEvent)} value={2} variant={value.includes(2) ? 'menuconfigpanel_option_button_secondary_activated' : 'menuconfigpanel_option_button_secondary'} >{t('ModalAFM.err')}</Button>
            <Button onClick={evt => handleChange(evt as unknown as MouseEvent)} value={3} variant={value.includes(3) ? 'menuconfigpanel_option_button_tertiary_activated' : 'menuconfigpanel_option_button_tertiary'} >{t('ModalAFM.debug')}</Button>
          </Box>
          {processing ? (
            <Counter
              value={value}
              result={result}
              setResult={setResult}
              setProcessing={setProcessing}
              setFailure={setFailure}
            />
          ) : (
            <>
              {infos.map(
                (info) => (
                  value.includes(2) && info.includes('ERROR') ?
                    (<div style={{ color: 'red' }}>{info.replace('ERROR', '')}</div>)
                    : value.includes(1) && info.includes('INFO') && !info.includes('POST') ?
                      (<div style={{ color: 'blue' }}>{info.replace('INFO', '')}</div>)
                      : value.includes(3) && (info.includes('DEBUG')) ?
                        (<div style={{ color: 'orange' }}>{info.replace('DEBUG', '')}</div>) : (null)
                ))}
            </>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

// ---------------------------------------------------------
const Counter = (
  {
    value,
    result,
    setResult,
    setProcessing,
    setFailure
  }: {
    value: number[],
    result: string,
    setResult: (x: string) => void,
    setProcessing: (x: boolean) => void,
    setFailure: (x: boolean) => void
  }
) => {
  useEffect(() => {
    // Get process status every 5ms ?
    const interval = setInterval(() => {
      const path = window.location.origin
      const url_optimize_prod_process = path + '/optimize/check_process'
      const fetchData = {
        method: 'POST',
        body: ''
      }
      fetch(url_optimize_prod_process, fetchData).then(
        function (response) {
          if (response.ok) {
            response.json().then(
              function (data) {
                setResult(data.output)
              }
            )
          }
        })
    }, 5000)
    return () => clearInterval(interval)
  })

  // Detect for log message the current status of reconciliation
  const infos = (result !== undefined) ? result.split('\n') : []
  if (infos.length > 2) {
    const info = infos[infos.length - 2]
    if (info.includes('[COMPLETED]')) {
      setProcessing(false)
      setFailure(false)
    } else if (info.includes('[FAILED]')) {
      setProcessing(false)
      setFailure(true)
    }
  }
  return (<>
    {infos.map(
      info => (
        value.includes(2) && info.includes('ERROR') ?
          (<div style={{ color: 'red' }}>{info.replace('ERROR', '')}</div>)
          : value.includes(1) && info.includes('INFO') && !info.includes('POST') ?
            (<div style={{ color: 'blue' }}>{info.replace('INFO', '')}</div>)
            : value.includes(3) && (info.includes('DEBUG')) ?
              (<div style={{ color: 'orange' }}>{info.replace('DEBUG', '')}</div>) : (null)))}
  </>)
}