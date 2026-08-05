// utils/universalJsonCompression.tsx
import pako from 'pako'
import JSZip from 'jszip'

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

/**
 * #381 — Détecte le type de compression aux OCTETS MAGIQUES du contenu, sans
 * regarder le nom. Renvoie `undefined` quand aucune signature connue n'est
 * reconnue (contenu clair, deflate brut, brotli — qui n'a pas de signature).
 */
export const detectCompressionTypeFromBytes = (data: ArrayBuffer): CompressionType | undefined => {
  const bytes = new Uint8Array(data)
  if (bytes.length < 2) return undefined

  // gzip : 1f 8b (RFC 1952, obligatoire)
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) return 'gzip'
  // zip : « PK » (RFC/APPNOTE, obligatoire) — 03 04 archive, 05 06 vide, 07 08 spanned
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) return 'zip'
  // zlib (RFC 1950) : CM = 8 dans le quartet bas de CMF, et CMF/FLG multiple de 31.
  // Aucun début de JSON ne satisfait les deux ('{' = 0x7b, '[' = 0x5b, espaces, BOM).
  if ((bytes[0] & 0x0f) === 0x08 && (((bytes[0] << 8) | bytes[1]) % 31) === 0) return 'deflate'

  return undefined
}

/**
 * #381 — Premier octet significatif : saute le BOM UTF-8 et les blancs ASCII.
 */
const firstMeaningfulByte = (bytes: Uint8Array): number | undefined => {
  let i = 0
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) i = 3
  while (i < bytes.length && (bytes[i] === 0x20 || bytes[i] === 0x09 || bytes[i] === 0x0a || bytes[i] === 0x0d)) i++
  return i < bytes.length ? bytes[i] : undefined
}

/**
 * #381 — Type de compression effectif d'un contenu déjà en mémoire.
 *
 * **Le contenu fait foi, pas l'extension** : un diagramme gzippé dont le nom a
 * perdu son `.gz` (renommage, téléchargement, copie) doit s'ouvrir comme un
 * `.json.gz`. Le nom ne sert plus que de repli, pour les formats sans signature
 * reconnaissable (brotli, deflate brut).
 *
 * Cas miroir traité aussi : un nom qui annonce gzip/zip alors que le contenu est
 * du JSON clair (fichier déjà décompressé par le transport, ou renommé à
 * l'envers). La signature de ces deux formats étant obligatoire, son absence
 * devant un jeton JSON est une preuve, pas une supposition.
 */
export const resolveCompressionType = (data: ArrayBuffer, filename: string): CompressionType => {
  const sniffed = detectCompressionTypeFromBytes(data)
  if (sniffed !== undefined) return sniffed

  const by_name = detectCompressionType(filename)
  if (by_name === 'gzip' || by_name === 'zip') {
    const first = firstMeaningfulByte(new Uint8Array(data))
    if (first === 0x7b /* { */ || first === 0x5b /* [ */) return 'none'
  }

  return by_name
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Erreur inconnue'
}

/**
 * Décompresse un buffer gzip. Accepte aussi un flux zlib/deflate brut,
 * distingué par les octets magiques du gzip (0x1f 0x8b).
 */
export async function decompressGzipDataFixed(compressedData: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(compressedData)
  const is_gzip = bytes[0] === 0x1f && bytes[1] === 0x8b

  try {
    return is_gzip
      ? pako.ungzip(bytes, { to: 'string' })
      : pako.inflate(bytes, { to: 'string' })
  } catch (error) {
    throw new Error(`Décompression impossible: ${getErrorMessage(error)}`)
  }
}

/**
 * Décompresse des données selon le type de compression
 */
export const decompressData = async (data: ArrayBuffer, type: CompressionType, filename?: string): Promise<string> => {
  switch (type) {
  case 'gzip':
    return pako.ungzip(new Uint8Array(data), { to: 'string' })

  case 'deflate':
    return pako.inflate(new Uint8Array(data), { to: 'string' })

  case 'zip': {
    const zip = await JSZip.loadAsync(data)

    // Chercher le fichier JSON dans le ZIP, d'abord par nom si fourni
    let jsonFile = null
    if (filename) {
      const baseName = filename.replace(/\.(zip|gz|br|deflate)$/i, '')
      jsonFile = zip.file(`${baseName}.json`)
    }
    if (!jsonFile) {
      const jsonFiles = Object.keys(zip.files).filter(name => name.endsWith('.json'))
      if (jsonFiles.length > 0) {
        jsonFile = zip.file(jsonFiles[0])
      }
    }
    if (!jsonFile) {
      throw new Error('Aucun fichier JSON trouvé dans l\'archive ZIP')
    }

    return await jsonFile.async('string')
  }

  case 'brotli':
    // DecompressionStream ne connaît que gzip/deflate/deflate-raw, et aucune
    // implémentation brotli n'est embarquée : échouer explicitement.
    throw new Error('Décompression Brotli non supportée')

  case 'none':
    return new TextDecoder('utf-8').decode(data)

  default:
    throw new Error(`Type de compression non supporté: ${type}`)
  }
}

/**
 * Charge et décompresse automatiquement un fichier JSON
 */
export const loadUniversalJSON = async (url: string): Promise<DecompressedJSONData> => {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const data = await response.arrayBuffer()
  const decompressed = await decompressData(data, resolveCompressionType(data, url), url)

  return JSON.parse(decompressed) as DecompressedJSONData
}

/**
 * Décompresse un fichier uploadé par l'utilisateur (tous formats)
 */
export const decompressUploadedFileUniversal = (file: File): Promise<DecompressedJSONData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = async (e: ProgressEvent<FileReader>) => {
      try {
        const data = e.target!.result as ArrayBuffer
        // #381 — Le contenu fait foi : un gzip nommé `.json` s'ouvre comme un `.gz`.
        const compressionType = resolveCompressionType(data, file.name)

        const decompressed = await decompressData(data, compressionType, file.name)
        resolve(JSON.parse(decompressed) as DecompressedJSONData)
      } catch (error) {
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
 * Compresse des données JSON en format gzip
 */
export const compressJSONToGzip = (data: object): Uint8Array => {
  const jsonString = JSON.stringify(data, null, 2)
  return pako.gzip(jsonString)
}
