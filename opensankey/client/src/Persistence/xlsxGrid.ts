// ==================================================================================================
// sa#675 — LIRE LA PREMIÈRE FEUILLE D'UN .xlsx EN GRILLE DE TEXTE.
//
// Un classeur .xlsx est un zip de XML : la feuille (`xl/worksheets/sheetN.xml`) porte des
// cellules `<c r="B2" t="s"><v>3</v></c>` dont les textes vivent dans `xl/sharedStrings.xml`
// (`t="s"`) ou dans la cellule elle-même (`t="inlineStr"`, `t="str"`). On n'a besoin que de
// ça pour relire un tableau croisé : jszip est déjà embarqué (fichiers .esankey, export des
// tableaux), aucune bibliothèque de plus. Les formules ne sont pas évaluées : c'est leur
// dernière valeur calculée (`<v>`) qui est lue, comme le ferait un collage depuis Excel.
// ==================================================================================================

import JSZip from 'jszip'

const decodeXml = (s: string): string => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, '\'')
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
  .replace(/&amp;/g, '&')

/** Le texte d'un élément riche (`<si>`, `<is>`) : la concaténation de ses `<t>`. */
const richText = (xml: string): string =>
  Array.from(xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)).map(m => decodeXml(m[1])).join('')

/** L'index de colonne (base 0) d'une référence `AB12`. */
export const xlsxColumnIndex = (ref: string): number => {
  const letters = /^[A-Z]+/.exec(ref)?.[0] ?? 'A'
  let n = 0
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n - 1
}

/** Le chemin de la première feuille du classeur, d'après workbook.xml et ses relations. */
const firstSheetPath = async (zip: JSZip): Promise<string> => {
  const workbook = await zip.file('xl/workbook.xml')?.async('string')
  const rels = await zip.file('xl/_rels/workbook.xml.rels')?.async('string')
  if (workbook && rels) {
    const rid = /<sheet\b[^>]*\br:id="([^"]+)"/.exec(workbook)?.[1]
    if (rid) {
      const rel = new RegExp(`<Relationship\\b[^>]*\\bId="${rid}"[^>]*>`).exec(rels)?.[0]
      const target = rel && /\bTarget="([^"]+)"/.exec(rel)?.[1]
      if (target) return target.startsWith('/') ? target.slice(1) : 'xl/' + target.replace(/^\.\//, '')
    }
  }
  return 'xl/worksheets/sheet1.xml'
}

/**
 * La première feuille d'un .xlsx, en grille dense de textes (lignes puis colonnes, base A1).
 * Les lignes et colonnes vides en tête sont gardées (c'est la position qui compte pour un
 * tableau croisé), celles en queue sont retirées.
 */
export const gridFromXlsx = async (data: ArrayBuffer | Uint8Array): Promise<string[][]> => {
  const zip = await JSZip.loadAsync(data)
  const sheet = await zip.file(await firstSheetPath(zip))?.async('string')
  if (!sheet) throw new Error('xlsx: no worksheet found')
  const shared_xml = await zip.file('xl/sharedStrings.xml')?.async('string')
  const shared = shared_xml ? Array.from(shared_xml.matchAll(/<si>([\s\S]*?)<\/si>/g)).map(m => richText(m[1])) : []

  const grid: string[][] = []
  for (const cell of sheet.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
    const attrs = cell[1]
    const body = cell[2] ?? ''
    const ref = /\br="([A-Z]+)(\d+)"/.exec(attrs)
    if (!ref) continue
    const row = parseInt(ref[2], 10) - 1
    const col = xlsxColumnIndex(ref[1])
    const type = /\bt="([^"]+)"/.exec(attrs)?.[1] ?? 'n'
    let value = ''
    if (type === 's') {
      const i = parseInt(/<v>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? '', 10)
      value = shared[i] ?? ''
    }
    else if (type === 'inlineStr') value = richText(body)
    else {
      const v = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1]
      value = v === undefined ? '' : decodeXml(v)
      if (type === 'b') value = value === '1' ? 'TRUE' : 'FALSE'
    }
    while (grid.length <= row) grid.push([])
    const line = grid[row]
    while (line.length <= col) line.push('')
    line[col] = value
  }
  // Queue vide retirée : une feuille Excel traîne souvent des cellules formatées sans contenu.
  while (grid.length > 0 && grid[grid.length - 1].every(c => c === '')) grid.pop()
  const width = grid.reduce((w, line) => Math.max(w, line.reduce((k, c, i) => (c === '' ? k : i + 1), 0)), 0)
  return grid.map(line => Array.from({ length: width }, (_, i) => line[i] ?? ''))
}
