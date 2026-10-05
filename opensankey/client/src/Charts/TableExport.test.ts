import JSZip from 'jszip'

import {
  csvDecimalOf, tableCsvBlob, tableFileName, tableToCsv, tableToXlsx, xlsxColumnName, xlsxSheetName
} from './TableExport'
import type { Type_ExportTable } from './TableExport'

// sa#593 — EXPORTER UN TABLEAU TEL QU'IL EST AFFICHE, en Excel (.xlsx) et en CSV, sans serveur.

const TABLE: Type_ExportTable = {
  title: 'Lait de vache · 2015',
  columns: [
    { label: 'Flux', kind: 'text' },
    { label: 'Unité', kind: 'text' },
    { label: 'Valeur', kind: 'number', decimals: 2 },
    { label: 'Part', kind: 'share' }
  ],
  rows: [
    { cells: ['Lait collecté', 'kt', 23456.789, 0.75] },
    { cells: ['Beurre; "doux"', 'kt MG', 1.5, null], depth: 1 },
    { cells: ['Total', 'kt', 31275.7, 1], strong: true }
  ]
}

const bytesOf = (blob: Blob): Promise<Uint8Array> => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer))
  reader.onerror = () => reject(reader.error)
  reader.readAsArrayBuffer(blob)
})

describe('export d un tableau (sa#593)', () => {
  test('le CSV : point-virgule, separateur decimal choisi, texte echappe, retrait, cellule vide', () => {
    const lines = tableToCsv(TABLE, { decimal: ',' }).split('\r\n')
    expect(lines[0]).toBe('Flux;Unité;Valeur;Part')
    expect(lines[1]).toBe('Lait collecté;kt;23456,789;0,75')
    expect(lines[2]).toBe('"  Beurre; ""doux""";kt MG;1,5;')
    expect(lines[3]).toBe('Total;kt;31275,7;1')
    expect(csvDecimalOf('fr')).toBe(',')
    expect(csvDecimalOf('en')).toBe('.')
  })

  test('le fichier CSV commence par le BOM UTF-8, pour qu Excel lise les accents', async () => {
    const bytes = await bytesOf(tableCsvBlob(TABLE, { decimal: ',' }))
    expect(Array.from(bytes.slice(0, 3))).toEqual([0xEF, 0xBB, 0xBF])
  })

  test('le classeur : les nombres sont des NOMBRES, l unite une colonne de texte, le format donne les decimales', async () => {
    const zip = await JSZip.loadAsync(await tableToXlsx(TABLE))
    expect(Object.keys(zip.files)).toEqual(expect.arrayContaining([
      '[Content_Types].xml', '_rels/.rels', 'xl/workbook.xml', 'xl/_rels/workbook.xml.rels',
      'xl/worksheets/sheet1.xml', 'xl/styles.xml'
    ]))
    const sheet = await zip.file('xl/worksheets/sheet1.xml')?.async('string') as string
    // Une valeur numérique : `<v>` sans `t=` (donc un nombre), à pleine précision.
    expect(sheet).toMatch(/<c r="C2"( s="\d+")?><v>23456\.789<\/v><\/c>/)
    expect(sheet).toMatch(/<c r="D2"( s="\d+")?><v>0\.75<\/v><\/c>/)
    // L'unité : du texte, dans sa colonne.
    expect(sheet).toContain('<c r="B3" t="inlineStr"')
    expect(sheet).toContain('kt MG')
    // Le texte est échappé ; la cellule absente n'est pas écrite.
    expect(sheet).toContain('Beurre; &quot;doux&quot;')
    expect(sheet).not.toContain('r="D3"')
    // L'en-tête est figé.
    expect(sheet).toContain('state="frozen"')
    const styles = await zip.file('xl/styles.xml')?.async('string') as string
    expect(styles).toContain('formatCode="#,##0.00"')
    expect(styles).toContain('formatCode="0.0%"')
    expect(styles).toContain('indent="1"')
    const workbook = await zip.file('xl/workbook.xml')?.async('string') as string
    expect(workbook).toContain('<sheet name="Lait de vache · 2015"')
  })

  test('les noms : colonnes A..Z puis AA, feuille de 31 caracteres sans caractere interdit, fichier sur', () => {
    expect([0, 25, 26, 51, 52, 701, 702].map(xlsxColumnName)).toEqual(['A', 'Z', 'AA', 'AZ', 'BA', 'ZZ', 'AAA'])
    expect(xlsxSheetName('Lait [kt] : 2015/2019 ? *')).toBe('Lait kt 2015 2019')
    expect(xlsxSheetName('x'.repeat(40))).toHaveLength(31)
    expect(xlsxSheetName('[]')).toBe('Table')
    expect(tableFileName('Lait : kt / MG', 'xlsx')).toBe('Lait _ kt _ MG.xlsx')
  })
})
