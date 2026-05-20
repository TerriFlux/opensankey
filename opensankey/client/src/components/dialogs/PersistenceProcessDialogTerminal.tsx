// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================

import React, { useEffect, useRef, useState } from 'react'
import { Box, Button } from '@chakra-ui/react'
import { WarningIcon } from '@chakra-ui/icons'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { TFunction } from 'i18next'

interface ProcessTerminalProps {
  url_prefix: string
  app_data: Class_ApplicationData
  handleFinish: () => void,
  downloadFileResult: () => void,
  loadFileResult: () => void,
  auto_load: boolean,
  failure: boolean,
  setFailure: (_:boolean)=>void,
  processing: boolean,
  setProcessing: (_:boolean)=>void,
  started: boolean,
  result: string,
  setResult: (_:string)=>void,
}

export const ProcessTerminal = ({
  url_prefix,
  app_data,
  handleFinish,
  failure,
  setFailure,
  processing,
  setProcessing,
  started,
  result,
  setResult,
}: ProcessTerminalProps) => {
  const { t } = app_data
  const [value, setValue] = useState([1, 2])

  const handleChange = (evt: MouseEvent) => {
    if (value.includes(+(evt.target as HTMLFormElement).value)) {
      value.splice(value.indexOf((evt.target as HTMLFormElement).value))
    } else {
      value.push(+(evt.target as HTMLFormElement).value)
    }
    setValue([...value])
  }

  const infos = result !== undefined ? result.split('\n') : []

  // ========== GESTION DE LA FIN DU TRAITEMENT ==========
  useEffect(() => {
    if (started && !processing && !failure) {
      handleFinish()
    }
  }, [started, processing, failure])


  const terminalContent = (
    <>


      {/* ========== FILTRES DE LOG ========== */}
      <LogFilters t={t} value={value} handleChange={handleChange} />

      {/* ========== LOGS ========== */}
      {started && processing ? (
        <Counter
          url_prefix={url_prefix}
          finishProcess={(failed: boolean) => {
            setProcessing(false)
            setFailure(failed)
          }}
          value={value}
          result={result}
          set_result={setResult}
        />
      ) : (
        <LogDisplay infos={infos} value={value} />
      )}
    </>
  )
  return terminalContent
}

// ========== SOUS-COMPOSANTS ==========

interface ActionButtonsProps {
  t: (key: string) => string
  reset: () => void
  downloadFileResult: () => void
  loadFileResult: () => void
  auto_load: boolean
  failure: boolean,
  processing: boolean
}

export const ActionButtons = ({
  t,
  reset,
  downloadFileResult,
  loadFileResult,
  auto_load,
  failure,
  processing,
}: ActionButtonsProps) => {
  if (processing) {
    return (
      <Button variant="menuconfigpanel_option_button_tertiary_activated">
        <span className="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span>
        {t('Menu.compute_file')}
      </Button>
    )
  }

  if (failure) {
    return (
      <Box layerStyle='options_3cols'>
        <Box></Box>
        <Box></Box>       
        <Button
          variant="menuconfigpanel_del_button"
          onClick={() => {
            reset()
          }}
          size='sizeButtonDialog'
        >
          {t('Menu.reinit')}
        </Button>
      </Box>
    )
  }

  // if (is_computing) {
  //   return (
  //     <Button
  //       variant='menuconfigpanel_option_button_secondary_activated'
  //       size='sizeButtonDialog'
  //     >
  //       {t('Menu.compute_file')}
  //     </Button>
  //   )
  // }

  // Boutons de fin
  if (!auto_load) {
    return (
      <Box layerStyle='options_3cols'>
        <Button
          variant="menuconfigpanel_option_button_primary_activated"
          onClick={loadFileResult}
          size='sizeButtonDialog'
        >
          {t('Menu.open_file')}
        </Button>
        <Button
          variant="menuconfigpanel_option_button_primary_activated"
          onClick={downloadFileResult}
          size='sizeButtonDialog'
        >
          {t('Menu.download_file') || 'Télécharger'}
        </Button>

        <Button
          variant="menuconfigpanel_del_button"
          onClick={() => {
            reset()
          }}
          size='sizeButtonDialog'
        >
          {t('Menu.reinit')}
        </Button>
      </Box>
    )
  }

  return <></>
  //   <Box layerStyle='options_3cols'>
  //     <Button
  //       variant="menuconfigpanel_option_button_primary_activated"
  //       onClick={() => {
  //         //successAction()
  //       }}
  //     >
  //       {success_status}
  //     </Button>
  //     <Button
  //       variant="menuconfigpanel_del_button"
  //       onClick={() => {
  //         reset()
  //       }}
  //       size='sizeButtonDialog'
  //     >
  //       {t('Menu.reinit')}
  //     </Button>
  //   </Box>
  // )
}

interface LogFiltersProps {
  t: TFunction,
  value: number[]
  handleChange: (evt: MouseEvent) => void
}

const LogFilters = ({ t, value, handleChange }: LogFiltersProps) => {
  return (
    <Box layerStyle='options_3cols'>
      <Button
        onClick={evt => handleChange(evt as unknown as MouseEvent)}
        value={1}
        variant={value.includes(1) ? 'menuconfigpanel_option_button_primary_activated' : 'menuconfigpanel_option_button_primary'}
        size='sizeButtonDialog'
      >
        {t('ProcessDialog.log_infos')}
      </Button>
      <Button
        onClick={evt => handleChange(evt as unknown as MouseEvent)}
        value={2}
        variant={value.includes(2) ? 'menuconfigpanel_option_button_secondary_activated' : 'menuconfigpanel_option_button_secondary'}
        size='sizeButtonDialog'
      >
        {t('ProcessDialog.log_errors')}
      </Button>
      <Button
        onClick={evt => handleChange(evt as unknown as MouseEvent)}
        value={3}
        variant={value.includes(3) ? 'menuconfigpanel_option_button_tertiary_activated' : 'menuconfigpanel_option_button_tertiary'}
        size='sizeButtonDialog'
      >
        {t('ProcessDialog.log_debug')}
      </Button>
    </Box>
  )
}

interface LogDisplayProps {
  infos: string[]
  value: number[]
}

const LogDisplay = ({ infos, value }: LogDisplayProps) => {
  const scroll_ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = scroll_ref.current
    if (el) el.scrollTop = el.scrollHeight
  }, [infos])
  return (
    <Box ref={scroll_ref} overflowY='auto' maxHeight='25vh'>
      {infos.map((info, index) => (
        <div key={index}>
          {value.includes(2) && info.includes('ERROR') ? (
            <div style={{ color: 'red' }}>{info.replace('ERROR', '')}</div>
          ) : value.includes(1) && info.includes('WARNING') ? (
            <div style={{ color: '#b7791f' }}><WarningIcon mr={1} />{info.replace('WARNING', '')}</div>
          ) : value.includes(1) && info.includes('INFO') && !info.includes('POST') ? (
            <div style={{ color: 'blue' }}>{info.replace('INFO', '')}</div>
          ) : value.includes(3) && info.includes('DEBUG') ? (
            <div style={{ color: 'orange' }}>{info.replace('DEBUG', '')}</div>
          ) : null}
        </div>
      ))}
    </Box>
  )
}

/**
 * Composant qui poll le serveur pour afficher les logs en temps réel
 */
const Counter = ({
  url_prefix,
  finishProcess,
  value,
  result,
  set_result
}: {
  url_prefix: string,
  finishProcess: (failed: boolean) => void,
  value: number[],
  result: string,
  set_result: (_: string) => void
}) => {
  useEffect(() => {
    const interval = setInterval(() => {
      const root = window.location.origin
      const url = root + url_prefix + 'upload/check_process'
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

  if (result) {
    if (result.includes('FINISHED') || result.includes('COMPLETED') || result.includes('TERMINÉ')) {
      finishProcess(false)
    } else if (result.includes('FAILED') ||  result.includes('ÉCHEC') || result.includes('UNEXPECTED ERROR') || result.includes('ÉCHOUÉE') || result.includes('ÉCHOUÉ')) {
      finishProcess(true)
    }
  }

  const scroll_ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = scroll_ref.current
    if (el) el.scrollTop = el.scrollHeight
  }, [result])

  if (!result) return <></>

  return (
    <Box ref={scroll_ref} overflowY='auto' maxHeight='25vh'>
      {result.split('\n').map(
        (info, index) => (
          <div key={index}>
            {value.includes(2) && info.includes('ERROR') ?
              (<div style={{ color: 'red' }}>{info.replace('ERROR', '')}</div>)
              : value.includes(1) && info.includes('WARNING') ?
                (<div style={{ color: '#b7791f' }}><WarningIcon mr={1} />{info.replace('WARNING', '')}</div>)
                : value.includes(1) && info.includes('INFO') && !info.includes('POST') ?
                  (<div style={{ color: 'blue' }}>{info.replace('INFO', '')}</div>)
                  : value.includes(3) && (info.includes('DEBUG')) ?
                    (<div style={{ color: 'orange' }}>{info.replace('DEBUG', '')}</div>) : (null)
            }
          </div>
        )
      )
      }
    </Box>
  )
}
