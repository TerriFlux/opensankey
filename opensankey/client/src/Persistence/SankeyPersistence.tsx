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
import { getBooleanFromJSON, type Type_JSON } from '../types/Utils'
import { ALL_ATTRIBUTES_CONFIG } from '../Elements/ElementsAttributesConfig'

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
export abstract class AttributeMappings {
  abstract getToJsonMapping(): { [key: string]: string} 
  abstract getFromJsonMapping(): { [key: string]: keyof typeof ALL_ATTRIBUTES_CONFIG} 
}
export class NodeAttributeMappings extends AttributeMappings {
  // Mapping principal: attribut interne -> clé JSON
  private readonly MAIN_MAPPING: { [key: string]: string}  = {
    // Shape mappings
    shape_type: 'shape',
    shape_min_width: 'node_width',
    shape_min_height: 'node_height',
    shape_color: 'color',
    shape_opacity: 'opacity',
    shape_color_sustainable: 'colorSustainable',
    // Icon attributes
    'iconName': 'icon_name',
    'iconColor': 'icon_color',
    'iconVisible': 'icon_visible',
    'iconViewBox': 'icon_view_box',
    'iconColorSustainable': 'icon_color_sustainable',

    // Foreign Object attributes
    'has_FO': 'has_fo',
    'is_FO_raw': 'is_fo_raw',
    'FO_content': 'fo_content',

    // Image attributes
    'is_image': 'is_image',
    'image_src': 'image_src',

    // Hyperlink attribute
    'hyperlink': 'hyperlink'
  };

  // Mapping legacy: ancienne clé JSON -> attribut interne
  private readonly LEGACY_MAPPING: { [key: string]: string}  = {
    // Name label legacy
    'label_visible': 'name_label_is_visible',
    'font_family': 'name_label_font_family',
    'font_size': 'name_label_font_size',
    'uppercase': 'name_label_uppercase',
    'bold': 'name_label_bold',
    'italic': 'name_label_italic',
    'label_color': 'name_label_color',
    'label_horiz': 'name_label_horiz',
    'label_vert': 'name_label_vert',
    'label_background': 'name_label_background',
    'label_background_color': 'name_label_background_color',
    'label_box_width': 'name_label_box_width',

    // Value label legacy
    'show_value': 'value_label_is_visible',
    'value_font_size': 'value_label_font_size',
    'label_horiz_valeur': 'value_label_horiz',
    'label_vert_valeur': 'value_label_vert',
    'to_precision': 'value_label_scientific_notation',
    'scientific_precision': 'value_label_significant_digits',
    'nb_scientific_precision': 'value_label_nb_significant_digits',
    'custom_digit': 'value_label_custom_digit',
    'nb_digit': 'value_label_nb_digit',
    'label_unit_visible': 'value_label_unit_visible',
    'label_unit': 'value_label_unit',
    'label_unit_factor': 'value_label_unit_factor',

    // Shape legacy (fusion avec MAIN_MAPPING)
    'shape': 'shape_type',
    'node_width': 'shape_min_width',
    'node_height': 'shape_min_height',
    'color': 'shape_color',
    'opacity': 'shape_opacity',
    'colorSustainable': 'shape_color_sustainable',
  };

  /**
   * Retourne le mapping pour toJSON (attribut -> JSON)
   */
  public getToJsonMapping(): { [key: string]: string}  {
    return { ...this.MAIN_MAPPING }
  }

  /**
   * Retourne le mapping pour fromJSON (JSON -> attribut)
   * Combine legacy + main mapping inversé
   */
  public getFromJsonMapping() {
    return { ...this.LEGACY_MAPPING } as unknown as { [key: string]: keyof typeof ALL_ATTRIBUTES_CONFIG} 
  }
}

export class LinkAttributeMappings extends AttributeMappings {
  private readonly LEGACY_MAPPING: { [key: string]: keyof typeof ALL_ATTRIBUTES_CONFIG}  = {
    'user_scale': 'shape_local_link_scale',
    'curved': 'shape_is_curved',
    'curvature': 'shape_curvature',
    'recycling': 'shape_is_recycling',
    'is_structur': 'shape_is_structure',
    'orientation': 'shape_orientation',
    'left_horiz_shift': 'shape_starting_curve',
    'right_horiz_shift': 'shape_ending_curve',
    'starting_tangeant': 'shape_starting_tangeant',
    'ending_tangeant': 'shape_ending_tangeant',
    'vert_shift': 'shape_middle_recycling',
    'arrow': 'shape_is_arrow',
    'arrow_size': 'shape_arrow_size',
    'dashed': 'shape_is_dashed',
    'color': 'shape_color',
    'color_rule': 'shape_color_rule',
    'opacity': 'shape_opacity',
  };

  private readonly MAIN_MAPPING: { [key: string]: string}  = {
    shape_local_link_scale: 'user_scale',
    shape_is_curved: 'curved',
    shape_type: 'shape_type',
    shape_curvature: 'curvature',
    shape_is_recycling: 'recycling',
    shape_is_structure: 'is_structur',
    shape_orientation: 'orientation',
    shape_starting_curve: 'left_horiz_shift',
    shape_ending_curve: 'right_horiz_shift',
    shape_starting_tangeant: 'starting_tangeant',
    shape_ending_tangeant: 'ending_tangeant',
    shape_middle_recycling: 'vert_shift',
    shape_is_arrow: 'arrow',
    shape_arrow_size: 'arrow_size',
    shape_is_dashed: 'dashed',
    shape_color: 'color',
    shape_color_rule: 'color_rule',
    shape_opacity: 'opacity',
  };
  /**
   * Retourne le mapping pour toJSON (attribut -> JSON)
   */
  public getToJsonMapping(): { [key: string]: string}  {
    return { ...this.MAIN_MAPPING }
  }

  /**
   * Retourne le mapping pour fromJSON (JSON -> attribut)
   * Combine legacy + main mapping inversé
   */
  public getFromJsonMapping() {
    return { ...this.LEGACY_MAPPING } as unknown as { [key: string]: keyof typeof ALL_ATTRIBUTES_CONFIG} 
  }


  protected fromLegacyJSON(json_local_object: Type_JSON) {
    if (json_local_object['version'] === undefined) {
      // Mapping legacy simplifié
      const legacyMapping: { [key: string]: string}  = {
        'label_visible': 'value_label_is_visible',
        'font_family': 'value_label_font_family',
        'label_font_size': 'value_label_font_size',
        'text_color': 'value_label_color',
        'label_position': 'value_label_horiz',
        'orthogonal_label_position': 'value_label_vert',
        'label_on_path': 'value_label_on_path',
        'label_pos_auto': 'value_label_pos_auto',
        'to_precision': 'value_label_scientific_notation',
        'scientific_precision': 'value_label_significant_digits',
        'nb_scientific_precision': 'value_label_nb_significant_digits',
        'custom_digit': 'value_label_custom_digit',
        'nb_digit': 'value_label_nb_digit',
        'label_unit_visible': 'value_label_unit_visible',
        'label_unit': 'value_label_unit',
        'label_unit_factor': 'value_label_unit_factor',
        'font_size': 'name_label_font_size',
        'uppercase': 'name_label_uppercase',
        'bold': 'name_label_bold',
        'italic': 'name_label_italic',
        'label_color': 'name_label_color',
        'label_horiz': 'name_label_horiz',
        'label_vert': 'name_label_vert'
      }
      const was_gradient = getBooleanFromJSON(json_local_object, 'gradient', false) as boolean
      if (was_gradient) {
        json_local_object['shape_color_rule'] = 'gradient'
      }
      Object.entries(legacyMapping).forEach(([oldKey, newKey]) => {
        if (json_local_object[oldKey] !== undefined) {
          //@ts-expect-error xxx
          this[newKey as AttributeKey] = json_local_object[oldKey]
        }
      })
    }
  }
}


