// ==================================================================================================
// Téléchargement d'une image (image de fond du diagramme ou image d'un nœud)
// vers un fichier local. Le contenu peut être une dataURL « data:image/...;base64,... »
// (cas usuel : image embarquée dans le JSON) ou une URL/chemin classique.
// ==================================================================================================

import FileSaver from 'file-saver'

// Déduit une extension de fichier à partir d'un type MIME image.
const _mimeToExt = (mime: string): string => {
  const map: { [k: string]: string } = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'image/bmp': 'bmp'
  }
  return map[mime] ?? 'png'
}

// Télécharge l'image `src` sous le nom `base_name` (sans extension :
// l'extension est déduite du type MIME pour une dataURL, sinon du chemin).
export const downloadImageSource = (src: string | undefined, base_name: string): void => {
  if (!src) return
  const safe_name = (base_name || 'image').replace(/[\\/:*?"<>|]/g, '_')
  // dataURL : on extrait le type MIME pour l'extension.
  const data_match = src.match(/^data:([^;,]+)[;,]/)
  if (data_match) {
    FileSaver.saveAs(src, `${safe_name}.${_mimeToExt(data_match[1])}`)
    return
  }
  // URL/chemin : on récupère l'extension du chemin (avant query string/fragment).
  const path = src.split(/[?#]/)[0]
  const ext_match = path.match(/\.([a-zA-Z0-9]+)$/)
  FileSaver.saveAs(src, `${safe_name}.${ext_match ? ext_match[1] : 'png'}`)
}
