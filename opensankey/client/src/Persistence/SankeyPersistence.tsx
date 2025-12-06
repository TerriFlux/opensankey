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

import FileSaver from 'file-saver'
import { type Type_JSON } from '../types/Utils'
import { Class_ApplicationData } from '../types/ApplicationData'

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

/**
 * Download examples from server
 *
 * @param {string} file_name
 * @param {string} the_url_prefix
 * @param {string} filetype
 */

export const DownloadExamples = (
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

async function handleCompressedFile(
  response: Response,
  file_name: string,
  new_data: Class_ApplicationData
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

export async function decompressGzipDataFixed(compressedData: ArrayBuffer): Promise<string> {
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


