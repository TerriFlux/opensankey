// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================

import React, { useEffect, useRef } from 'react'
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
  value: number[],
  setValue: (_:number[])=>void,
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
  value,
  setValue,
}: ProcessTerminalProps) => {
  const { t } = app_data

  // Bascule un filtre de log (1=Infos, 2=Erreurs, 3=Debug, 4=Warnings).
  const handleChange = (filter_id: number) => {
    setValue(
      value.includes(filter_id)
        ? value.filter(v => v !== filter_id)
        : [...value, filter_id]
    )
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
  handleChange: (filter_id: number) => void
}

const LogFilters = ({ t, value, handleChange }: LogFiltersProps) => {
  return (
    <Box layerStyle='options_4cols'>
      <Button
        onClick={() => handleChange(1)}
        variant={value.includes(1) ? 'menuconfigpanel_option_button_primary_activated' : 'menuconfigpanel_option_button_primary'}
        size='sizeButtonDialog'
      >
        {t('ProcessDialog.log_infos')}
      </Button>
      <Button
        onClick={() => handleChange(4)}
        variant={value.includes(4) ? 'menuconfigpanel_option_button_tertiary_activated' : 'menuconfigpanel_option_button_tertiary'}
        size='sizeButtonDialog'
      >
        {t('ProcessDialog.log_warnings')}
      </Button>
      <Button
        onClick={() => handleChange(2)}
        variant={value.includes(2) ? 'menuconfigpanel_option_button_secondary_activated' : 'menuconfigpanel_option_button_secondary'}
        size='sizeButtonDialog'
      >
        {t('ProcessDialog.log_errors')}
      </Button>
      <Button
        onClick={() => handleChange(3)}
        variant={value.includes(3) ? 'menuconfigpanel_option_button_tertiary_activated' : 'menuconfigpanel_option_button_tertiary'}
        size='sizeButtonDialog'
      >
        {t('ProcessDialog.log_debug')}
      </Button>
    </Box>
  )
}

// Classe une ligne de log par priorité ERROR > WARNING > INFO > DEBUG.
// Important : une ligne warning est aussi loggée au niveau « info » côté backend
// (elle contient le mot INFO) ; on la classe donc en 'warning' AVANT 'info' pour
// qu'elle ne réapparaisse pas sous le filtre Infos quand Warnings est décoché.
const classifyLog = (info: string): 'error' | 'warning' | 'info' | 'debug' | null => {
  if (info.includes('ERROR')) return 'error'
  if (info.includes('WARNING')) return 'warning'
  if (info.includes('INFO') && !info.includes('POST')) return 'info'
  if (info.includes('DEBUG')) return 'debug'
  return null
}

// Filtre actif requis pour afficher chaque type (1=Infos, 2=Erreurs, 3=Debug, 4=Warnings).
const FILTER_BY_KIND = { info: 1, error: 2, debug: 3, warning: 4 } as const

const LogLine = ({ info, value }: { info: string, value: number[] }) => {
  const kind = classifyLog(info)
  if (!kind || !value.includes(FILTER_BY_KIND[kind])) return null
  switch (kind) {
  case 'error':
    return <div style={{ color: 'red' }}>{info.replace('ERROR', '')}</div>
  case 'warning':
    return <div style={{ color: '#b7791f' }}><WarningIcon mr={1} />{info.replace('WARNING', '')}</div>
  case 'info':
    return <div style={{ color: 'blue' }}>{info.replace('INFO', '')}</div>
  case 'debug':
    return <div style={{ color: 'orange' }}>{info.replace('DEBUG', '')}</div>
  }
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
          <LogLine info={info} value={value} />
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
  // Garde-fou : ne déclencher finishProcess qu'une seule fois (l'intervalle
  // peut encore tirer une requête avant que le démontage du Counter ne soit
  // effectif côté React).
  const finished_ref = useRef(false)
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
                if (data.output !== undefined) set_result(data.output)
                // Arrêt piloté par le statut machine renvoyé par le serveur
                // (fichier <logname>.status), et non plus par le grep du texte
                // localisé du log (FINISHED/TERMINÉ/ÉCHOUÉ…) qui était fragile.
                if (!finished_ref.current) {
                  if (data.status === 'finished') {
                    finished_ref.current = true
                    finishProcess(false)
                  } else if (data.status === 'failed') {
                    finished_ref.current = true
                    finishProcess(true)
                  }
                }
              }
            )
          }
        })
    }, 5000)
    return () => clearInterval(interval)
  })

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
            <LogLine info={info} value={value} />
          </div>
        )
      )
      }
    </Box>
  )
}
