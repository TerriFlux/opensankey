// utils/universalJsonCompression.tsx
import pako from 'pako'
import JSZip from 'jszip'
import { useState, useEffect } from 'react'
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
// Types de compression supportés
export type CompressionType = 'none' | 'gzip' | 'zip' | 'brotli' | 'deflate'

// Type pour les données JSON décompressées
export interface DecompressedJSONData {
  [key: string]: unknown
}

/**
 * Détecte le type de compression d'un fichier basé sur son extension
 */
export const detectCompressionType = (filename: string): CompressionType => {
  const ext = filename.toLowerCase()
  
  if (ext.endsWith('.gz') || ext.endsWith('.gzip')) return 'gzip'
  if (ext.endsWith('.zip')) return 'zip'
  if (ext.endsWith('.br') || ext.endsWith('.brotli')) return 'brotli'
  if (ext.endsWith('.deflate')) return 'deflate'
  
  return 'none'
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

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'Erreur inconnue'
}

// function logError(message: string, error: unknown): void {
//   console.error(message, error)
//   if (error instanceof Error) {
//     console.error('Stack trace:', error.stack)
//   }
// }

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
/**
 * Décompresse des données selon le type de compression
 */
export const decompressData = async (data: ArrayBuffer, type: CompressionType, filename?: string): Promise<string> => {
  try {
    switch (type) {
    case 'gzip': {
      console.log('🗜️ Décompression GZIP...')
      return pako.ungzip(new Uint8Array(data), { to: 'string' })
    }
        
    case 'deflate': {
      console.log('🗜️ Décompression DEFLATE...')
      return pako.inflate(new Uint8Array(data), { to: 'string' })
    }
        
    case 'zip': {
      console.log('🗜️ Décompression ZIP...')
      const zip = await JSZip.loadAsync(data)
        
      // Chercher le fichier JSON dans le ZIP
      let jsonFile = null
        
      // Méthode 1: Chercher par nom de fichier si fourni
      if (filename) {
        const baseName = filename.replace(/\.(zip|gz|br|deflate)$/i, '')
        jsonFile = zip.file(`${baseName}.json`)
      }
        
      // Méthode 2: Chercher le premier .json
      if (!jsonFile) {
        const jsonFiles = Object.keys(zip.files).filter(name => name.endsWith('.json'))
        if (jsonFiles.length > 0) {
          jsonFile = zip.file(jsonFiles[0])
          console.log(`📄 Fichier JSON trouvé dans ZIP: ${jsonFiles[0]}`)
        }
      }
        
      if (!jsonFile) {
        throw new Error('Aucun fichier JSON trouvé dans l\'archive ZIP')
      }
        
      return await jsonFile.async('string')
    }
        
    case 'brotli': {
      console.log('🗜️ Décompression BROTLI...')
      // Utiliser l'API native du navigateur si disponible
      if ('DecompressionStream' in window) {
        const stream = new Response(data).body!.pipeThrough(new DecompressionStream('gzip'))
        return await new Response(stream).text()
      } else {
        throw new Error('Décompression Brotli non supportée par ce navigateur')
      }
    }
        
    case 'none': {
      console.log('📄 Pas de compression détectée')
      return new TextDecoder('utf-8').decode(data)
    }
        
    default:
      throw new Error(`Type de compression non supporté: ${type}`)
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la décompression ${type}:`, error)
    throw error
  }
}

/**
 * Charge et décompresse automatiquement un fichier JSON
 */
export const loadUniversalJSON = async (url: string): Promise<DecompressedJSONData> => {
  try {
    console.log(`📥 Chargement: ${url}`)
    
    // Fetch le fichier
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    // Récupérer les données
    const data = await response.arrayBuffer()
    const compressedSize = data.byteLength
    
    console.log(`📦 Fichier téléchargé: ${(compressedSize / 1024 / 1024).toFixed(1)}MB`)
    
    // Détecter et décompresser
    const compressionType = detectCompressionType(url)
    const decompressed = await decompressData(data, compressionType, url)
    
    const decompressedSize = decompressed.length
    
    if (compressionType !== 'none') {
      const ratio = ((1 - compressedSize / decompressedSize) * 100)
      console.log(`📊 Décompression: ${(decompressedSize / 1024 / 1024).toFixed(1)}MB (${ratio.toFixed(1)}% économie)`)
    }
    
    // Parser le JSON
    const jsonData = JSON.parse(decompressed) as DecompressedJSONData
    console.log('✅ JSON chargé avec succès')
    
    return jsonData
    
  } catch (error) {
    console.error(`❌ Erreur lors du chargement de ${url}:`, error)
    throw error
  }
}

/**
 * Charge un JSON avec fallback automatique sur plusieurs formats
 */
export const loadJSONWithFallback = async (baseName: string, extensions: string[] = ['json.gz', 'json.zip', 'json.br', 'json']): Promise<DecompressedJSONData> => {
  const errors: string[] = []
  
  for (const ext of extensions) {
    const url = `${baseName}.${ext}`
    
    try {
      console.log(`🔄 Tentative: ${url}`)
      return await loadUniversalJSON(url)
      
    } catch (error) {
      const errorMsg = `${url}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      errors.push(errorMsg)
      console.warn(`⚠️ ${errorMsg}`)
    }
  }
  
  throw new Error(`Impossible de charger ${baseName} avec aucun format testé:\n${errors.join('\n')}`)
}

/**
 * Décompresse un fichier uploadé par l'utilisateur (tous formats)
 */
export const decompressUploadedFileUniversal = (file: File): Promise<DecompressedJSONData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = async (e: ProgressEvent<FileReader>) => {
      try {
        console.log(`📁 Traitement du fichier uploadé: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`)
        
        const data = e.target!.result as ArrayBuffer
        const compressionType = detectCompressionType(file.name)
        
        const decompressed = await decompressData(data, compressionType, file.name)
        const jsonData = JSON.parse(decompressed) as DecompressedJSONData
        
        console.log('✅ Fichier uploadé traité avec succès')
        resolve(jsonData)
        
      } catch (error) {
        console.error('❌ Erreur lors du traitement du fichier uploadé:', error)
        reject(error)
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier'))
    }
    
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Interface pour le hook useUniversalJSON
 */
export interface UseUniversalJSONResult {
  data: DecompressedJSONData | null
  loading: boolean
  error: string | null
  compressionUsed: CompressionType
}

/**
 * Hook React pour charger un JSON avec fallback automatique
 */
export const useUniversalJSON = (baseName: string | null, extensions?: string[]): UseUniversalJSONResult => {
  const [data, setData] = useState<DecompressedJSONData | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [compressionUsed, setCompressionUsed] = useState<CompressionType>('none')
  
  useEffect(() => {
    if (!baseName) {
      setData(null)
      setError(null)
      setCompressionUsed('none')
      return
    }
    
    setLoading(true)
    setError(null)
    
    loadJSONWithFallback(baseName, extensions)
      .then(jsonData => {
        setData(jsonData)
        // On pourrait détecter le format qui a fonctionné ici
        setCompressionUsed(detectCompressionType(baseName))
      })
      .catch(err => {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
        setError(errorMessage)
      })
      .finally(() => {
        setLoading(false)
      })
      
  }, [baseName, extensions])
  
  return { data, loading, error, compressionUsed }
}

/**
 * Utilitaire pour compresser côté client (optionnel)
 */
export const compressJSON = (data: DecompressedJSONData, type: CompressionType = 'gzip'): Uint8Array => {
  const jsonString = JSON.stringify(data, null, 0) // JSON compact
  
  switch (type) {
  case 'gzip':
    return pako.gzip(jsonString)
      
  case 'deflate':
    return pako.deflate(jsonString)
      
  default:
    throw new Error(`Compression ${type} non implémentée côté client`)
  }
}

/**
 * Compresse des données JSON en format gzip
 */
export const compressJSONToGzip = (data: object): Uint8Array => {
  const jsonString = JSON.stringify(data, null, 2)
  return pako.gzip(jsonString)
}

