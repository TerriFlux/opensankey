import { crosstabToSankeymaticText, parseCellNumber, parseCrosstabText } from './crosstabFormat'

describe('parseCellNumber — sa#671', () => {
  it('lit les formes usuelles d Excel', () => {
    expect(parseCellNumber('420')).toBe(420)
    expect(parseCellNumber('1 234,5')).toBe(1234.5)
    expect(parseCellNumber('1 234,5')).toBe(1234.5)
    expect(parseCellNumber('1,234.5')).toBe(1234.5)
    expect(parseCellNumber('1.234,5')).toBe(1234.5)
    expect(parseCellNumber('12 %')).toBe(12)
    expect(parseCellNumber('-3')).toBe(-3)
  })

  it('refuse ce qui n est pas un nombre', () => {
    expect(parseCellNumber('')).toBeNull()
    expect(parseCellNumber('n/a')).toBeNull()
    expect(parseCellNumber('12a')).toBeNull()
  })
})

describe('parseCrosstabText — sa#671', () => {
  const tsv = [
    '\tHousing\tFood\tTransport',
    'Wages\t420\t300\t200',
    'Other income\t0\t100\t',
    'Total\t420\t400\t200',
  ].join('\n')

  it('lit une grille collee depuis Excel : lignes vers colonnes, totaux ecartes', () => {
    const p = parseCrosstabText(tsv)
    expect(p.cols).toEqual(['Housing', 'Food', 'Transport'])
    expect(p.rows).toEqual(['Wages', 'Other income'])
    expect(p.flows).toEqual([
      { source: 'Wages', target: 'Housing', value: 420 },
      { source: 'Wages', target: 'Food', value: 300 },
      { source: 'Wages', target: 'Transport', value: 200 },
      { source: 'Other income', target: 'Food', value: 100 },
    ])
    // Le 0 est une cellule ignoree, la cellule vide n en est pas une.
    expect(p.ignored_cells).toBe(1)
  })

  it('ecarte aussi une colonne de totaux et une cellule d angle nommee', () => {
    const p = parseCrosstabText('Poste;Jan;Fev;Total\nLoyer;800;800;1600\nCourses;300;350;650')
    expect(p.cols).toEqual(['Jan', 'Fev'])
    expect(p.flows.map(f => f.value)).toEqual([800, 800, 300, 350])
  })

  it('lit un CSV a virgules et des nombres entre guillemets', () => {
    const p = parseCrosstabText(',A,B\nX,"1,5",2\nY,3,"4"')
    // Avec la virgule pour separateur, "1,5" entre guillemets reste une seule cellule.
    expect(p.flows).toEqual([
      { source: 'X', target: 'A', value: 1.5 },
      { source: 'X', target: 'B', value: 2 },
      { source: 'Y', target: 'A', value: 3 },
      { source: 'Y', target: 'B', value: 4 },
    ])
  })

  it('ne rend rien sans en-tete ni ligne de donnees', () => {
    expect(parseCrosstabText('').flows).toEqual([])
    expect(parseCrosstabText('\tA\tB').flows).toEqual([])
  })

  it('compte les cellules non numeriques ou negatives sans les garder', () => {
    const p = parseCrosstabText('\tA\tB\nX\tn/a\t-2\nY\t1\t1')
    expect(p.ignored_cells).toBe(2)
    expect(p.flows).toHaveLength(2)
  })
})

describe('crosstabToSankeymaticText — sa#671', () => {
  it('ecrit une ligne SankeyMATIC par flux, crochets neutralises', () => {
    const p = parseCrosstabText('\tA [1]\nX\t5')
    expect(crosstabToSankeymaticText(p)).toBe('X [5] A (1)')
  })
})
