import { tableToXlsx } from '../Charts/TableExport'
import { gridFromXlsx, xlsxColumnIndex } from './xlsxGrid'
import { gridToCrosstabText, parseCrosstabText, transposeCrosstabText } from './crosstabFormat'

describe('xlsxColumnIndex — sa#675', () => {
  it('lit les lettres de colonne', () => {
    expect(xlsxColumnIndex('A1')).toBe(0)
    expect(xlsxColumnIndex('Z9')).toBe(25)
    expect(xlsxColumnIndex('AA2')).toBe(26)
    expect(xlsxColumnIndex('AB12')).toBe(27)
  })
})

describe('gridFromXlsx — sa#675', () => {
  it('relit la feuille ecrite par notre propre ecrivain, textes et nombres', async () => {
    const bytes = await tableToXlsx({
      title: 'Budget',
      columns: [
        { label: '', kind: 'text' }, { label: 'Housing', kind: 'number', decimals: 0 }, { label: 'Food', kind: 'number', decimals: 1 },
      ],
      rows: [
        { cells: ['Wages', 420, 300.5] },
        { cells: ['Other income', null, 100] },
      ],
    })
    const grid = await gridFromXlsx(bytes)
    expect(grid).toEqual([
      ['', 'Housing', 'Food'],
      ['Wages', '420', '300.5'],
      ['Other income', '', '100'],
    ])
    // Et la grille se relit en tableau croise par le meme chemin que le collage.
    const parsed = parseCrosstabText(gridToCrosstabText(grid))
    expect(parsed.flows).toEqual([
      { source: 'Wages', target: 'Housing', value: 420 },
      { source: 'Wages', target: 'Food', value: 300.5 },
      { source: 'Other income', target: 'Food', value: 100 },
    ])
  })
})

describe('transposeCrosstabText — sa#675', () => {
  it('echange lignes et colonnes, cellule d angle comprise', () => {
    const text = '\tA\tB\nX\t1\t2\nY\t3\t4'
    expect(transposeCrosstabText(text)).toBe('\tX\tY\nA\t1\t3\nB\t2\t4')
    const parsed = parseCrosstabText(transposeCrosstabText(text))
    expect(parsed.rows).toEqual(['A', 'B'])
    expect(parsed.cols).toEqual(['X', 'Y'])
  })

  it('complete une ligne courte et protege une cellule qui porte un guillemet', () => {
    expect(transposeCrosstabText('\tA\tB\nX\t1')).toBe('\tX\nA\t1\nB\t')
    expect(transposeCrosstabText('\tA "b"\nX\t1')).toBe('\tX\n"A ""b"""\t1')
  })
})
