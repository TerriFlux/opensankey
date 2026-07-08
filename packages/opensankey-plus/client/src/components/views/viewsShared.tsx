// Standard libs
import React from 'react'
import Draggable, { DraggableProps } from 'react-draggable'
import {
  Box,
  Button,
} from '@chakra-ui/react'

// OpenSankey Libs
import { Type_JSON } from '@terriflux/opensankey/src/types/Utils'
import { OSTooltip } from '@terriflux/opensankey/src/components/configmenus/MenuCommon'
import { mainZoneRightReservedPx } from '@terriflux/opensankey/src/components/spreadsheet/MainZoneTabs'
import { decompressGzipDataFixed } from '@terriflux/opensankey/src/Persistence/UniversalJSONCompression'
import { INPUT_ATTRIBUTES_CONFIG, OUTPUT_ATTRIBUTES_CONFIG, getDefaultInputOptions, getDefaultOutputOptions } from '@terriflux/opensankey/src/components/dialogs/PersistenceProcessDialogConfigs'
import { Class_ApplicationDataOSP } from '../../types/ApplicationDataOSP'

// react-draggable : les typings embarqués rendent les props optionnelles, mais
// @types/react-draggable (tiré par la résolution fraîche du CI) les rend requises.
// On relâche le type ici pour que le build passe quelle que soit la source des typings.
export const DraggableComponent = Draggable as unknown as React.ComponentClass<Partial<DraggableProps>>

/**
 * Bornes draggable contraintes à la zone de dessin gauche. Quand le tableur/doc occupe la droite
 * (menu_configuration.main_zone_right_reserved), empêche de glisser une modale de vue sous le
 * panneau de droite. `right`/`bottom` sont des offsets de position (react-draggable n'y soustrait
 * pas la taille du noeud), d'où le retrait de offsetWidth/Height. Re-calculé à chaque rendu : les
 * modales concernées s'abonnent à addMainZoneListener pour se re-rendre au toggle du tableur.
 */
export const drawingZoneDraggableBounds = (
  app_data: Class_ApplicationDataOSP,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nodeRef: React.MutableRefObject<any>
): { left: number; top: number; right: number; bottom: number } => {
  const reserved = mainZoneRightReservedPx(app_data)
  const node_w = nodeRef.current?.offsetWidth ?? 0
  const node_h = nodeRef.current?.offsetHeight ?? 0
  return {
    left: 0,
    top: 0,
    right: Math.max(0, window.innerWidth - reserved - node_w),
    bottom: Math.max(0, window.innerHeight - node_h)
  }
}

export interface BaseComponentPropsPlus {
  app_data: Class_ApplicationDataOSP
}

// ===========================================================================
// Chargement d'un fichier Excel comme une vue du catalogue
// ---------------------------------------------------------------------------
// Le parsing Excel se fait côté serveur (SankeyExcelParser) : on POST le fichier
// à convert/launch (qui lance un thread de conversion), on poll
// upload/check_process jusqu'au statut 'finished'/'failed', puis on récupère le
// JSON résultat (gzip) via upload/retrieve_result — exactement la séquence du
// convertisseur universel (PersistenceProcessDialog), mais sans modale ni options.
// Le serveur ne gère qu'UN process à la fois → les Excel du catalogue sont
// traités séquentiellement (cf. boucle d'import de input_loader_json_catalog).
// ===========================================================================
export const loadExcelFileAsSankeyJSON = async (
  app_data: Class_ApplicationDataOSP,
  file: File
): Promise<Type_JSON> => {
  const origin = window.location.origin
  const url_prefix = app_data.url_prefix

  // Options par défaut identiques à celles du convertisseur (onglets nœuds/
  // données/TER + layout lus, autocorrections au défaut), chargement silencieux.
  const input_options = {
    ...getDefaultInputOptions(INPUT_ATTRIBUTES_CONFIG['base']),
    ...getDefaultInputOptions(INPUT_ATTRIBUTES_CONFIG['excel'])
  }
  const output_options = {
    ...getDefaultOutputOptions(OUTPUT_ATTRIBUTES_CONFIG['base']),
    ...getDefaultOutputOptions(OUTPUT_ATTRIBUTES_CONFIG['json'])
  }

  // 1. Lancement de la conversion (le serveur répond aussitôt, le thread tourne).
  const form_data = new FormData()
  form_data.append('file', file)
  form_data.append('input_format', 'excel')
  form_data.append('output_format', 'json')
  form_data.append('input_options', JSON.stringify(input_options))
  form_data.append('output_options', JSON.stringify(output_options))
  form_data.append('process_label', file.name)
  const launch_resp = await fetch(origin + url_prefix + 'convert/launch', { method: 'POST', body: form_data })
  if (!launch_resp.ok) {
    throw new Error('Excel « ' + file.name + ' » : échec du lancement (HTTP ' + launch_resp.status + ')')
  }

  // 2. Attente de la fin via le statut machine <logname>.status renvoyé par
  //    upload/check_process. On n'honore 'finished'/'failed' qu'après avoir vu
  //    'running' (ou passé 2 s) pour ignorer un statut résiduel d'une conversion
  //    précédente — le serveur ne réinitialise le statut qu'au démarrage du thread.
  await new Promise<void>((resolve, reject) => {
    const start_time = Date.now()
    const MAX_MS = 5 * 60 * 1000
    let seen_running = false
    const poll = setInterval(() => {
      fetch(origin + url_prefix + 'upload/check_process', { method: 'POST', body: '' })
        .then(r => (r.ok ? r.json() : null))
        .then(data => {
          if (!data) return
          if (data.status === 'running') seen_running = true
          const elapsed = Date.now() - start_time
          const settled = seen_running || elapsed > 2000
          if (data.status === 'finished' && settled) {
            clearInterval(poll)
            resolve()
          } else if (data.status === 'failed' && settled) {
            clearInterval(poll)
            reject(new Error('Excel « ' + file.name + ' » : la conversion a échoué (voir le fichier)'))
          } else if (elapsed > MAX_MS) {
            clearInterval(poll)
            reject(new Error('Excel « ' + file.name + ' » : délai de conversion dépassé'))
          }
        })
        .catch(() => { /* erreur transitoire : on retentera au prochain tick */ })
    }, 1000)
  })

  // 3. Récupération du JSON résultat (gzip), comme handleFinish du convertisseur.
  const result_resp = await fetch(origin + url_prefix + 'upload/retrieve_result', { method: 'POST', body: new FormData() })
  if (!result_resp.ok) {
    throw new Error('Excel « ' + file.name + ' » : récupération du résultat impossible (HTTP ' + result_resp.status + ')')
  }
  const buffer = await result_resp.arrayBuffer()
  const decompressed = await decompressGzipDataFixed(buffer)
  return JSON.parse(decompressed) as Type_JSON
}

// ===========================================================================
// Extra tab for ApplyLayoutDialog — injected via menu_configuration.extra_apply_layout_tab
// ===========================================================================

/**
 * Render function for the OSP extra tab in UpdateModeGrid (inside the layout transfer dialog).
 * Provides copyViews and icon_catalog toggles.
 * Called as extra_tab.render(attrs, onToggle, t) — NOT a React component.
 */
export const renderApplyLayoutExtraTabOSP = (
  app_data: Class_ApplicationDataOSP,
  attrs: string[],
  onToggle: (key: string) => void,
  t: (key: string) => string
): React.ReactNode => {
  const has_licence = app_data.has_sankey_plus
  const is_in_view = !app_data.is_view_master
  const disabled = !has_licence || is_in_view
  const tooltip = !has_licence
    ? t('templates.need_osp')
    : is_in_view
      ? t('Menu.Transformation.disabled_view')
      : ''
  const btn = (key: string, label: string, dis = false) => (
    <Button
      key={key}
      isDisabled={dis}
      variant={attrs.includes(key) ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
      onClick={() => { if (!dis) onToggle(key) }}
    >{label}</Button>
  )
  return (
    <OSTooltip label={tooltip}>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' mb='1'>
        <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.Views')}</Box>
        <Box>{btn('copyViews', 'X', disabled)}</Box>
      </Box>
    </OSTooltip>
  )
}

export const logo_view = <svg
  xmlns='http://www.w3.org/2000/svg'
  viewBox='0 0 24 24'
  height='1.8rem'
  width='1.8rem'
>
  <path
    d='m17,15c-3.704,0-5.798,2.252-6.716,3.595-.376.55-.376,1.261,0,1.811.918,1.343,3.012,3.595,6.716,3.595s5.798-2.252,6.716-3.595c.376-.55.376-1.261,0-1.811-.918-1.343-3.012-3.595-6.716-3.595Zm5.891,4.841c-.807,1.18-2.646,3.159-5.891,3.159s-5.084-1.979-5.891-3.159c-.146-.214-.146-.468,0-.682.808-1.18,2.646-3.159,5.891-3.159s5.084,1.979,5.891,3.159c.146.214.146.468,0,.682Zm-5.891-2.341c-1.103,0-2,.897-2,2s.897,2,2,2,2-.897,2-2-.897-2-2-2Zm0,3c-.551,0-1-.448-1-1s.449-1,1-1,1,.448,1,1-.449,1-1,1ZM6,5.5c0,.552-.448,1-1,1s-1-.448-1-1,.448-1,1-1,1,.448,1,1Zm0,11c0,.552-.448,1-1,1s-1-.448-1-1,.448-1,1-1,1,.448,1,1Zm0-5.5c0,.552-.448,1-1,1s-1-.448-1-1,.448-1,1-1,1,.448,1,1Zm3-5.5c0-.276.224-.5.5-.5h10c.276,0,.5.224.5.5s-.224.5-.5.5h-10c-.276,0-.5-.224-.5-.5Zm10.5,6h-10c-.276,0-.5-.224-.5-.5s.224-.5.5-.5h10c.276,0,.5.224.5.5s-.224.5-.5.5Zm4.5-7v10c0,.276-.224.5-.5.5s-.5-.224-.5-.5V4.5c0-1.93-1.57-3.5-3.5-3.5H4.5c-1.93,0-3.5,1.57-3.5,3.5v13c0,1.93,1.57,3.5,3.5,3.5h3.5c.276,0,.5.224.5.5s-.224.5-.5.5h-3.5c-2.481,0-4.5-2.019-4.5-4.5V4.5C0,2.019,2.019,0,4.5,0h15c2.481,0,4.5,2.019,4.5,4.5Z'
  />
</svg>
