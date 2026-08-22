import { TextDecoder as NodeTextDecoder } from 'util'

import pako from 'pako'

import {
  decompressUploadedFileUniversal,
  detectCompressionType,
  detectCompressionTypeFromBytes,
  resolveCompressionType
} from './UniversalJSONCompression'

// #381 — Un diagramme gzippé dont le nom a perdu son `.gz` (renommage, copie,
// téléchargement) ne s'ouvrait pas : la détection ne regardait que l'extension,
// concluait « non compressé », et décodait les octets gzip en UTF-8 brut.
// Le contenu doit faire foi ; l'extension n'est qu'un repli.

const DIAGRAM = { version: '1.1.5', nodes: {}, links: {} }

// L'environnement jsdom de react-scripts n'expose pas TextDecoder, dont se sert
// le chemin « non compressé » de decompressData ; tout navigateur l'a nativement.
if (typeof globalThis.TextDecoder === 'undefined') {
  (globalThis as unknown as { TextDecoder: unknown }).TextDecoder = NodeTextDecoder
}

// `TextEncoder` n'est pas exposé par l'environnement jsdom de react-scripts ;
// les chaînes de ce fichier sont ASCII, un encodage par code point suffit.
const utf8 = (text: string): Uint8Array => Uint8Array.from(text, c => c.charCodeAt(0))

const gzipBytes = (obj: unknown): Uint8Array => pako.gzip(JSON.stringify(obj))
const plainBytes = (obj: unknown): Uint8Array => utf8(JSON.stringify(obj))

const asArrayBuffer = (bytes: Uint8Array): ArrayBuffer =>
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer

describe('#381 detectCompressionTypeFromBytes', () => {
  it('reconnaît le gzip à ses octets magiques 1f 8b', () => {
    const bytes = gzipBytes(DIAGRAM)
    expect(bytes[0]).toBe(0x1f)
    expect(bytes[1]).toBe(0x8b)
    expect(detectCompressionTypeFromBytes(asArrayBuffer(bytes))).toBe('gzip')
  })

  it('reconnaît le zip à « PK »', () => {
    expect(detectCompressionTypeFromBytes(asArrayBuffer(new Uint8Array([0x50, 0x4b, 0x03, 0x04])))).toBe('zip')
  })

  it('reconnaît un flux zlib (deflate encapsulé)', () => {
    expect(detectCompressionTypeFromBytes(asArrayBuffer(pako.deflate(JSON.stringify(DIAGRAM))))).toBe('deflate')
  })

  it('ne reconnaît rien dans du JSON clair — y compris avec BOM ou blancs', () => {
    expect(detectCompressionTypeFromBytes(asArrayBuffer(plainBytes(DIAGRAM)))).toBeUndefined()
    expect(detectCompressionTypeFromBytes(asArrayBuffer(utf8('\n  [1,2]')))).toBeUndefined()
    expect(detectCompressionTypeFromBytes(asArrayBuffer(new Uint8Array([0xef, 0xbb, 0xbf, 0x7b, 0x7d])))).toBeUndefined()
  })
})

describe('#381 resolveCompressionType — le contenu fait foi', () => {
  it('voit le gzip malgré une extension .json', () => {
    // Le cas du ticket : `personal_budget_with_tags.json.gz` renommé en `.json`.
    expect(detectCompressionType('diagramme.json')).toBe('none')
    expect(resolveCompressionType(asArrayBuffer(gzipBytes(DIAGRAM)), 'diagramme.json')).toBe('gzip')
  })

  it('traite le cas miroir : nom en .gz sur un contenu JSON clair', () => {
    expect(resolveCompressionType(asArrayBuffer(plainBytes(DIAGRAM)), 'diagramme.json.gz')).toBe('none')
  })

  it('laisse l\'extension trancher quand aucune signature n\'est reconnaissable', () => {
    // Brotli n'a pas d'octets magiques : le nom reste le seul indice.
    expect(resolveCompressionType(asArrayBuffer(new Uint8Array([0x21, 0x2c, 0x00])), 'x.br')).toBe('brotli')
    expect(resolveCompressionType(asArrayBuffer(plainBytes(DIAGRAM)), 'x.json')).toBe('none')
  })

  it('ne se trompe pas sur un contenu vide ou d\'un seul octet', () => {
    expect(resolveCompressionType(new ArrayBuffer(0), 'x.json')).toBe('none')
    expect(resolveCompressionType(asArrayBuffer(new Uint8Array([0x7b])), 'x.json')).toBe('none')
  })
})

describe('#381 decompressUploadedFileUniversal', () => {
  const fileOf = (bytes: Uint8Array, name: string): File => new File([asArrayBuffer(bytes)], name)

  it('ouvre un diagramme gzippé nommé .json', async () => {
    const file = fileOf(gzipBytes(DIAGRAM), 'cas-repro-gzip-nomme-json.json')
    await expect(decompressUploadedFileUniversal(file)).resolves.toEqual(DIAGRAM)
  })

  it('ouvre toujours un .json.gz et un .json clair', async () => {
    await expect(decompressUploadedFileUniversal(fileOf(gzipBytes(DIAGRAM), 'd.json.gz')))
      .resolves.toEqual(DIAGRAM)
    await expect(decompressUploadedFileUniversal(fileOf(plainBytes(DIAGRAM), 'd.json')))
      .resolves.toEqual(DIAGRAM)
  })

  it('rejette — et ne se tait pas — sur un fichier illisible', async () => {
    // Le second attendu du ticket : l'échec doit remonter, pour que l'appelant
    // puisse l'afficher au lieu de laisser croire à un clic sans effet.
    const file = fileOf(utf8('ceci n\'est pas un diagramme'), 'd.json')
    await expect(decompressUploadedFileUniversal(file)).rejects.toBeDefined()
  })
})
