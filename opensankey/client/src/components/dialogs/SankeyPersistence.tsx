// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

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
import type { Type_JSON } from '../../types/Utils'
import type { Type_GenericApplicationData } from '../../types/Types'
import type { FCType_SankeyLoad } from '../../types/FunctionTypes'

declare global {
  interface Window {
    pako?: {
      // Surcharges pour deflate
      deflate(data: Uint8Array | string, options: PakoDeflateOptions & { to: 'string' }): string
      deflate(data: Uint8Array | string, options?: PakoDeflateOptions): Uint8Array

      // Surcharges pour inflate
      inflate(data: Uint8Array, options: PakoInflateOptions & { to: 'string' }): string
      inflate(data: Uint8Array, options?: PakoInflateOptions): Uint8Array

      // Surcharges pour gzip
      gzip(data: Uint8Array | string, options: PakoDeflateOptions & { to: 'string' }): string
      gzip(data: Uint8Array | string, options?: PakoDeflateOptions): Uint8Array

      // Surcharges pour ungzip (le plus important pour votre cas)
      ungzip(data: Uint8Array, options: PakoInflateOptions & { to: 'string' }): string
      ungzip(data: Uint8Array, options?: PakoInflateOptions): Uint8Array

      // Fonctions de streaming
      Deflate: new (options?: PakoDeflateOptions) => PakoDeflate
      Inflate: new (options?: PakoInflateOptions) => PakoInflate
    }
  }
}

// Interfaces pour les options
interface PakoDeflateOptions {
  level?: number          // Niveau de compression (0-9)
  windowBits?: number     // Taille de la fenêtre
  memLevel?: number       // Niveau mémoire
  strategy?: number       // Stratégie de compression
  dictionary?: Uint8Array // Dictionnaire
  raw?: boolean          // Mode raw
  to?: 'string'          // Format de sortie
}

interface PakoInflateOptions {
  windowBits?: number     // Taille de la fenêtre
  raw?: boolean          // Mode raw
  to?: 'string'          // Format de sortie ('string' pour text)
  chunkSize?: number     // Taille des chunks
}

// Classes de streaming
interface PakoDeflate {
  push(data: Uint8Array | string, flush?: boolean): boolean
  result: Uint8Array
}

interface PakoInflate {
  push(data: Uint8Array, flush?: boolean): boolean
  result: Uint8Array | string
}

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
    const url = path + url_prefix + 'excel/upload/retrieve_results'
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
      variant='modal_dialog'
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
                  <Button variant="menuconfigpanel_option_button_tertiary_activated">
                    <span className="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span>
                    {t('Menu.load_file')}
                  </Button>) : (
                  failure.current ? (
                    <Button
                      variant="menuconfigpanel_del_button" onClick={reset}>{failure_status}</Button>) : <>
                    {
                      is_computing ? (
                        <Button
                          variant='menuconfigpanel_option_button_secondary_activated'
                          size='sizeButtonDialog'
                        >
                          {t('Menu.compute_file')}
                        </Button>) : (
                        <Button
                          variant="menuconfigpanel_option_button_primary_activated"
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
              <Button onClick={evt => handleChange(evt as unknown as MouseEvent)} value={1} variant={value.includes(1) ? 'menuconfigpanel_option_button_primary_activated' : 'menuconfigpanel_option_button_primary'} size='sizeButtonDialog'>Infos</Button>
              <Button onClick={evt => handleChange(evt as unknown as MouseEvent)} value={2} variant={value.includes(2) ? 'menuconfigpanel_option_button_secondary_activated' : 'menuconfigpanel_option_button_secondary'} size='sizeButtonDialog'>Erreurs</Button>
              <Button onClick={evt => handleChange(evt as unknown as MouseEvent)} value={3} variant={value.includes(3) ? 'menuconfigpanel_option_button_tertiary_activated' : 'menuconfigpanel_option_button_tertiary'} size='sizeButtonDialog'>Debug</Button>
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
      const url = root + url_prefix + 'excel/upload/check_process'
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
  file_name,
  save_options
) => {

  let root = window.location.origin
  if (root.includes('dashboard')) {
    root = root.replace('dashboard', '')
  }
  let url = root + url_prefix + 'excel/save'
  const options_save_excel: string = JSON.stringify(save_options)

  const form_data = new FormData()
  form_data.append(
    'data', JSON.stringify(data_as_json))

  form_data.append('options', options_save_excel)
  const fetchData = {
    method: 'POST',
    body: form_data
  }

  const showFile = (blob: BlobPart) => {
    const newBlob = new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    FileSaver.saveAs(newBlob, file_name + '.xlsx')
  }

  const cleanFile = () => {
    const fetchData = {
      method: 'POST'
    }
    url = root + url_prefix + 'excel/save/post_clean'
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
  const url = root + the_url_prefix + 'excel/upload/launch'
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
  data_as_json['version'] = new_data.version // Avoid converter process
  // Extract sankey datas from JSON
  new_data.fromJSON(data_as_json, false)
  new_data.drawing_area.sankey.nodes_list.forEach(n => {
    const tagg = new_data.drawing_area.sankey.node_taggs_dict['type de noeud']
    if (!tagg) {
      return
    }
    const product_tag = tagg.tags_dict['produit']
    const sector_tag = tagg.tags_dict['secteur']
    //const echange_tag = tagg.tags_dict['echange']
    if (n.hasGivenTag(product_tag) && n.style.some(s => s.id === 'default')) {
      n.style = [new_data.drawing_area.sankey.node_styles_dict['NodeProductStyle']]
    } else if (n.hasGivenTag(sector_tag) && n.style.some(s => s.id === 'default')) {
      n.style = [new_data.drawing_area.sankey.node_styles_dict['NodeSectorStyle']]
    }
  })
  // Case 1 : Apply extracted layout if present -> contains positions
  if (data_as_json['layout']) {
    new_data.updateFromJSON(data_as_json)
  }
  // Case 2 :: No layout -> compute default positions & characteristics
  else {
    // Recompute all positions
    new_data.computeAutoFullSankey()
  }
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
  const url = root + '/opensankey/example/download'
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


function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'Erreur inconnue'
}

function logError(message: string, error: unknown): void {
  console.error(message, error)
  if (error instanceof Error) {
    console.error('Stack trace:', error.stack)
  }
}

function getErrorDetails(error: unknown): { name: string; message: string; toString: string } {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      toString: error.toString()
    }
  }
  if (typeof error === 'string') {
    return {
      name: 'StringError',
      message: error,
      toString: error
    }
  }
  return {
    name: 'UnknownError',
    message: 'Erreur de type inconnu',
    toString: String(error)
  }
}

/**
 *
 *
 * @param {string} file_name
 * @param {Type_GenericApplicationData} new_data
 */
export const UploadExemple: FType_UploadExemple = (
  file_name: string,
  new_data: Type_GenericApplicationData
): void => {
  let root = window.location.origin
  if (root.includes('dashboard')) {
    root = root.replace('dashboard', '')
  }
  const url = root + new_data.url_prefix + '/example/upload'
  const fetchData = {
    method: 'POST',
    body: file_name
  }

  fetch(url, fetchData).then(async (response) => {
    try {
      // Vérifier le type de contenu retourné par le serveur
      const contentType = response.headers.get('content-type')
      const originalContentType = response.headers.get('x-original-content-type')
      const compressionMethod = response.headers.get('x-compression-method')

      console.log('🔍 Headers reçus:')
      console.log('  Content-Type:', contentType)
      console.log('  X-Original-Content-Type:', originalContentType)
      console.log('  X-Compression-Method:', compressionMethod)

      // NOUVELLE LOGIQUE : Détecter selon les nouveaux headers
      const isCompressedFile = (
        contentType === 'application/octet-stream'
      )

      if (isCompressedFile) {
        console.log('📦 Fichier compressé détecté (nouveaux headers)')
        await handleCompressedFile(response, file_name, new_data)
      } else {
        console.log('📄 Réponse JSON classique')
        const text = await response.text()
        const JSON_data = JSON.parse(text)

        const error = JSON_data['error']
        if (error && error.length != 0) {
          alert(error)
          return
        }

        if (!file_name.includes('.xlsx')) {
          new_data.fromJSON(JSON_data as Type_JSON)
        }
      }

    } catch (error) {
      console.error('❌ Erreur lors du traitement de la réponse:', error)
      alert('Erreur lors du chargement du fichier: ' + getErrorMessage(error))
    }
  }).catch((error) => {
    console.error('❌ Erreur fetch:', error)
    alert('Erreur lors de la communication avec le serveur')
  })
}

async function handleCompressedFile(
  response: Response,
  file_name: string,
  new_data: Type_GenericApplicationData
): Promise<void> {
  try {
    console.log('🔄 Traitement de la réponse compressée...')

    // Récupérer les données binaires
    const arrayBuffer = await response.arrayBuffer()
    const compressedSize = arrayBuffer.byteLength

    console.log(`📦 Données reçues: ${(compressedSize / 1024).toFixed(1)}KB`)

    // Vérification IMPORTANTE des magic bytes GZIP
    const uint8Array = new Uint8Array(arrayBuffer)
    if (uint8Array.length >= 2) {
      const byte1 = uint8Array[0]
      const byte2 = uint8Array[1]
      console.log(`🔍 Magic bytes: 0x${byte1.toString(16).padStart(2, '0')} 0x${byte2.toString(16).padStart(2, '0')}`)

      // GZIP doit commencer par 0x1f 0x8b
      if (byte1 !== 0x1f || byte2 !== 0x8b) {
        console.error('❌ Magic bytes GZIP invalides!')
        console.log('Premiers 20 bytes:', Array.from(uint8Array.slice(0, 20)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '))

        // Essayer d'interpréter comme texte pour debug
        try {
          const textContent = new TextDecoder().decode(arrayBuffer)
          console.log('Contenu comme texte:', textContent.substring(0, 200))
        } catch (e) {
          console.log('Pas du texte UTF-8')
        }

        throw new Error('Les données reçues ne sont pas du GZIP valide')
      }

      console.log('✅ Magic bytes GZIP valides')
    }

    // Décompresser avec la méthode corrigée
    const decompressedData = await decompressGzipDataFixed(arrayBuffer)

    console.log(`📄 Données décompressées: ${(decompressedData.length / 1024).toFixed(1)}KB`)

    // Parser le JSON décompressé
    const jsonData = JSON.parse(decompressedData)

    // Vérifier les erreurs
    if (jsonData.error && jsonData.error.length > 0) {
      alert(jsonData.error)
      return
    }

    // Appliquer les données
    new_data.fromJSON(jsonData as Type_JSON)

    console.log('✅ Fichier JSON.GZ traité avec succès')

  } catch (error) {
    logError('❌ Erreur décompression détaillée:', error)
    alert('Erreur lors de la décompression du fichier: ' + getErrorMessage(error))
  }
}

async function decompressGzipDataFixed(compressedData: ArrayBuffer): Promise<string> {
  console.log('🗜️ Début décompression...')

  // S'assurer que pako est chargé
  if (!window.pako) {
    console.log('📥 Chargement de pako...')
    await loadPakoFromCDN()
  }

  // Méthode 1: Pako (recommandé)
  if (window.pako) {
    try {
      console.log('🔧 Décompression avec pako...')
      const uint8Array = new Uint8Array(compressedData)

      // OPTION A: Décompression simple
      const decompressed = window.pako.ungzip(uint8Array, { to: 'string' })
      console.log('✅ Pako décompression réussie')
      return decompressed

    } catch (pakoError) {
      // ✅ CORRECTION: Utiliser getErrorDetails au lieu d'accès direct
      const errorDetails = getErrorDetails(pakoError)
      console.error('❌ Erreur pako détaillée:', errorDetails)

      // Essayer avec des options différentes
      try {
        console.log('🔄 Tentative pako avec options alternatives...')
        const uint8Array = new Uint8Array(compressedData)
        const decompressed = window.pako.inflate(uint8Array, { to: 'string' })
        console.log('✅ Pako inflate réussi')
        return decompressed
      } catch (inflateError) {
        console.error('❌ Pako inflate aussi échoué:', getErrorMessage(inflateError))
      }
    }
  }

  // Méthode 2: DecompressionStream (fallback)
  if ('DecompressionStream' in window) {
    try {
      console.log('🔧 Fallback vers DecompressionStream...')

      const readable = new Response(compressedData).body
      if (!readable) {
        throw new Error('Impossible de créer un stream lisible')
      }

      const decompressedStream = readable.pipeThrough(new DecompressionStream('gzip'))
      const decompressed = await new Response(decompressedStream).text()

      console.log('✅ DecompressionStream réussi')
      return decompressed

    } catch (streamError) {
      console.error('❌ Erreur DecompressionStream:', getErrorMessage(streamError))
    }
  }

  throw new Error('Toutes les méthodes de décompression ont échoué')
}

function loadPakoFromCDN(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.pako) {
      resolve()
      return
    }

    console.log('📥 Chargement de pako depuis CDN...')
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js'

    script.onload = () => {
      if (window.pako) {
        console.log('✅ Pako chargé avec succès')
        resolve()
      } else {
        reject(new Error('Pako chargé mais non disponible'))
      }
    }

    script.onerror = () => {
      console.error('❌ Échec du chargement de pako')
      reject(new Error('Impossible de charger pako depuis le CDN'))
    }

    document.head.appendChild(script)
  })
}

// === FONCTION DE TEST SIMPLE ===

async function _testDecompression(fileName: string): Promise<void> {
  try {
    console.log('🧪 Test de décompression pour:', fileName)

    const response = await fetch('/example/upload', {
      method: 'POST',
      body: fileName
    })

    console.log('📊 Réponse:', {
      status: response.status,
      contentType: response.headers.get('content-type'),
      contentEncoding: response.headers.get('content-encoding'),
      contentLength: response.headers.get('content-length')
    })

    const arrayBuffer = await response.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    console.log('📦 Données:', {
      size: arrayBuffer.byteLength,
      magicBytes: `0x${uint8Array[0]?.toString(16).padStart(2, '0')} 0x${uint8Array[1]?.toString(16).padStart(2, '0')}`,
      isValidGzip: uint8Array[0] === 0x1f && uint8Array[1] === 0x8b
    })

    if (uint8Array[0] === 0x1f && uint8Array[1] === 0x8b) {
      const decompressed = await decompressGzipDataFixed(arrayBuffer)
      console.log('✅ Test réussi! Taille décompressée:', decompressed.length)
      console.log('📄 Aperçu:', decompressed.substring(0, 100) + '...')
    } else {
      console.error('❌ Pas du GZIP valide')
    }

  } catch (error) {
    console.error('❌ Test échoué:', error)
  }
}


