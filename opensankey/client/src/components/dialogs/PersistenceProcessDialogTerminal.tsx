// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================

import React, { useEffect, useState } from 'react'
import { Box, Button } from '@chakra-ui/react'
import { FType_ProcessFunctions } from '../../Modules'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { TFunction } from 'i18next'

interface ProcessTerminalProps {
  processFunctions: FType_ProcessFunctions
  url_prefix: string
  app_data: Class_ApplicationData
  reset: () => void
  handleFinish: () => void,
  downloadFileResult: () => void,
  loadFileResult: () => void,
  auto_load: boolean
}

export const ProcessTerminal = ({
  processFunctions,
  url_prefix,
  app_data,
  reset,
  handleFinish,
  downloadFileResult,
  loadFileResult,
  auto_load,
}: ProcessTerminalProps) => {
  const { t } = app_data
  const [value, setValue] = useState([1, 2])
  const { ref_processing, failure, ref_result, not_started } = processFunctions
  const [result, set_result] = useState('')
  ref_result.current = set_result
  const [update, setUpdate] = useState(0)

  const handleChange = (evt: MouseEvent) => {
    if (value.includes(+(evt.target as HTMLFormElement).value)) {
      value.splice(value.indexOf((evt.target as HTMLFormElement).value))
    } else {
      value.push(+(evt.target as HTMLFormElement).value)
    }
    setValue([...value])
  }

  const failure_status = t('Menu.failure_file')
  const success_status = t('Menu.loaded_file')
  const infos = result !== undefined ? result.split('\n') : []

  // ========== GESTION DE LA FIN DU TRAITEMENT ==========
  useEffect(() => {
    if (!not_started.current && !ref_processing.current) {
      handleFinish()
    }
  }, [not_started.current, ref_processing.current])


  const terminalContent = (
    <>
      {/* ========== BOUTONS D'ACTION ========== */}
      <ActionButtons
        processFunctions={processFunctions}
        t={t}
        failure_status={failure_status}
        success_status={success_status}
        reset={reset}
        downloadFileResult={downloadFileResult}
        loadFileResult={loadFileResult}
        auto_load={auto_load}
      />

      {/* ========== FILTRES DE LOG ========== */}
      <LogFilters t={t} value={value} handleChange={handleChange} />

      {/* ========== LOGS ========== */}
      {!not_started.current && processFunctions.ref_processing.current ? (
        <Counter
          url_prefix={url_prefix}
          finishProcess={(failed: boolean) => {
            const to_update = processFunctions.ref_processing.current
            processFunctions.ref_processing.current = false
            //not_started.current = true
            failure.current = failed
            if (to_update) setUpdate(a => a + 1)
          }}
          value={value}
          result={result}
          set_result={set_result}
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
  processFunctions: FType_ProcessFunctions
  t: (key: string) => string
  failure_status: string
  success_status: string
  reset: () => void
  downloadFileResult: () => void
  loadFileResult: () => void
  auto_load: boolean
}

const ActionButtons = ({
  processFunctions,
  t,
  failure_status,
  success_status,
  reset,
  downloadFileResult,
  loadFileResult,
  auto_load
}: ActionButtonsProps) => {
  if (processFunctions.ref_processing.current) {
    return (
      <Button variant="menuconfigpanel_option_button_tertiary_activated">
        <span className="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span>
        {t('Menu.compute_file')}
      </Button>
    )
  }

  if (processFunctions.failure.current) {
    return (
      <Box layerStyle='options_3cols'>
        <Button variant="menuconfigpanel_del_button" onClick={reset} size='sizeButtonDialog'>
          {failure_status}
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

  return (
    <Box layerStyle='options_3cols'>
      <Button
        variant="menuconfigpanel_option_button_primary_activated"
        onClick={() => {
          //successAction()
        }}
      >
        {success_status}
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
  return (
    <Box overflowY='auto' maxHeight='25vh'>
      {infos.map((info, index) => (
        <div key={index}>
          {value.includes(2) && info.includes('ERROR') ? (
            <div style={{ color: 'red' }}>{info.replace('ERROR', '')}</div>
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

  if (result && result.split('\n').length > 2) {
    if (result.includes('FINISHED') || result.includes('COMPLETED') || result.includes('CONVERSION TERMINÉE')) {
      finishProcess(false)
    } else if (result.includes('FAILED') || result.includes('ÉCHEC') || result.includes('UNEXPECTED ERROR')) {
      finishProcess(true)
    }
  }

  if (!result) return <></>

  return (
    <Box overflowY='auto' maxHeight='25vh'>
      {result.split('\n').map(
        (info, index) => (
          <div key={index}>
            {value.includes(2) && info.includes('ERROR') ?
              (<div style={{ color: 'red' }}>{info.replace('ERROR', '')}</div>)
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
