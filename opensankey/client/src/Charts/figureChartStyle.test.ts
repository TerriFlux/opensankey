// os#1449 — LE TITRE D'UNE FIGURE, LU COMME UNE ZONE DE TEXTE.
//
// Ces tests gardent le critere du lot : une couronne enregistree se relit a l identique. Ils
// verifient donc d abord que, sans aucune cle neuve, la zone n 0 porte exactement ce que le
// traceur ecrivait en dur — #2D3748, centre, une ligne, pas d italique, la police de la page.

import {
  FIGURE_TEXT_DEFAULTS, figureExtraTextZones, figureTextsOf, figureTitleTextZone
} from './figureChartStyle'

describe('figureTitleTextZone', () => {

  it('ne rend rien quand le titre est eteint', () => {
    expect(figureTitleTextZone({}, 'Ble')).toBeNull()
    expect(figureTitleTextZone({ title_visible: false, title_text: 'Ecrit' }, 'Ble')).toBeNull()
  })

  it('ne rend rien quand il n y a ni texte propre ni nom de sujet', () => {
    expect(figureTitleTextZone({ title_visible: true }, '   ')).toBeNull()
  })

  it('prend le nom du sujet quand le titre n a pas de texte propre', () => {
    expect(figureTitleTextZone({ title_visible: true }, 'Ble')?.text).toBe('Ble')
    expect(figureTitleTextZone({ title_visible: true, title_text: '  ' }, 'Ble')?.text).toBe('Ble')
  })

  it('rend la mise en forme que le trace ecrivait en dur quand rien n est regle', () => {
    const zone = figureTitleTextZone({ title_visible: true, title_text: 'Filiere' }, 'Ble')
    expect(zone).toEqual({
      text: 'Filiere',
      position: 'top',
      font_size: 14,
      bold: true,
      italic: false,
      font_family: '',
      color: '#2D3748',
      align: 'middle',
      wrap: false
    })
  })

  it('honore les cles neuves quand l auteur les pose', () => {
    const zone = figureTitleTextZone({
      title_visible: true, title_text: 'Filiere', title_position: 'bottom', title_font_size: 20,
      title_bold: false, title_italic: true, title_font_family: 'Arial, sans-serif',
      title_color: '#112233', title_align: 'left', title_wrap: true
    }, 'Ble')
    expect(zone).toEqual({
      text: 'Filiere',
      position: 'bottom',
      font_size: 20,
      bold: false,
      italic: true,
      font_family: 'Arial, sans-serif',
      color: '#112233',
      align: 'left',
      wrap: true
    })
  })

  it('ignore une valeur d un type inattendu plutot que de casser', () => {
    const zone = figureTitleTextZone({
      title_visible: true, title_text: 'Filiere',
      title_align: 'diagonal', title_color: 42, title_wrap: 'oui', title_font_size: 'grand'
    }, 'Ble')
    expect(zone?.align).toBe(FIGURE_TEXT_DEFAULTS.align)
    expect(zone?.color).toBe(FIGURE_TEXT_DEFAULTS.color)
    expect(zone?.wrap).toBe(FIGURE_TEXT_DEFAULTS.wrap)
    expect(zone?.font_size).toBe(14)
  })
})

describe('figureExtraTextZones', () => {

  it('ne rend rien sans depot, ou sur un depot qui n est pas une liste', () => {
    expect(figureExtraTextZones(undefined)).toEqual([])
    expect(figureExtraTextZones({ text: 'a' })).toEqual([])
    expect(figureExtraTextZones('a')).toEqual([])
  })

  it('ecarte les zones qui n ecrivent rien : elles ne doivent pas manger de la hauteur', () => {
    expect(figureExtraTextZones([{ text: '' }, { text: '   ' }, {}, null])).toEqual([])
  })

  it('complete chaque zone par les defauts du trace', () => {
    expect(figureExtraTextZones([{ text: 'Source : Agreste' }])).toEqual([
      { ...FIGURE_TEXT_DEFAULTS, text: 'Source : Agreste' }
    ])
  })

  it('garde l ordre et la description de chaque zone', () => {
    const zones = figureExtraTextZones([
      { text: 'Haut' },
      { text: 'Bas', position: 'bottom', italic: true, align: 'right', font_size: 9 }
    ])
    expect(zones.map(z => z.text)).toEqual(['Haut', 'Bas'])
    expect(zones[1].position).toBe('bottom')
    expect(zones[1].italic).toBe(true)
    expect(zones[1].align).toBe('right')
    expect(zones[1].font_size).toBe(9)
  })
})

describe('figureTextsOf', () => {

  it('ne rend rien pour une figure enregistree qui n a jamais regle de titre', () => {
    expect(figureTextsOf({}, 'Ble')).toEqual([])
  })

  it('met le titre en premier, puis les zones ajoutees', () => {
    const texts = figureTextsOf(
      { title_visible: true, title_text: 'Filiere', text_zones: [{ text: 'Source' }] },
      'Ble'
    )
    expect(texts.map(t => t.text)).toEqual(['Filiere', 'Source'])
  })

  it('laisse les zones ajoutees vivre sans titre', () => {
    const texts = figureTextsOf({ text_zones: [{ text: 'Source', position: 'bottom' }] }, 'Ble')
    expect(texts).toHaveLength(1)
    expect(texts[0].position).toBe('bottom')
  })
})
