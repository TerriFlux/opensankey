// os#1449 — LE TRACEUR COMMUN DES ZONES DE TEXTE D UNE FIGURE.
//
// Le premier bloc de tests est le GARDE-FOU D IDENTITE : pour une figure qui n a qu un titre —
// c est a dire pour toutes celles enregistrees a ce jour — le DOM pose doit etre celui que
// `Charts/figureTitle.mountFigureTitle` posait, classe par classe et style par style. Les valeurs
// attendues sont recopiees de ce traceur, a la main : si l un des deux bouge, ce test le dit.

import { FIGURE_TEXT_DEFAULTS } from '../Charts/figureChartStyle'
import type { Type_FigureText } from '../Charts/figureChartStyle'
import { mountFigureTextZones } from './figureTextZones'

const text = (over: Partial<Type_FigureText> = {}): Type_FigureText =>
  ({ ...FIGURE_TEXT_DEFAULTS, text: 'Filiere', ...over })

const host = () => document.createElement('div')

describe('mountFigureTextZones sans texte', () => {

  it('rend le conteneur lui meme et ne lui ajoute rien', () => {
    const container = host()
    expect(mountFigureTextZones(container, [])).toBe(container)
    expect(container.childNodes).toHaveLength(0)
  })

  it('ignore une zone dont le texte est vide', () => {
    const container = host()
    expect(mountFigureTextZones(container, [text({ text: '' })])).toBe(container)
    expect(container.childNodes).toHaveLength(0)
  })
})

describe('mountFigureTextZones avec le seul titre', () => {

  it('pose exactement le DOM que le traceur du titre posait', () => {
    const container = host()
    const body = mountFigureTextZones(container, [text({ bold: true })])

    const wrap = container.firstElementChild as HTMLElement
    expect(wrap.className).toBe('figure_titled')
    expect(wrap.style.display).toBe('flex')
    expect(wrap.style.width).toBe('100%')
    expect(wrap.style.height).toBe('100%')
    expect(wrap.style.minHeight).toBe('0')

    const block = wrap.children[0] as HTMLElement
    // La classe du titre reste sur la premiere zone : ce qui le visait le trouve encore.
    expect(block.classList.contains('figure_title')).toBe(true)
    expect(block.classList.contains('figure_text')).toBe(true)
    expect(block.textContent).toBe('Filiere')
    expect(block.title).toBe('Filiere')
    expect(block.style.flex).toBe('0 0 auto')
    expect(block.style.textAlign).toBe('center')
    expect(block.style.padding).toBe('0.15rem 0.4rem')
    expect(block.style.fontSize).toBe('14px')
    expect(block.style.fontWeight).toBe('700')
    expect(block.style.lineHeight).toBe('1.25')
    expect(block.style.color).toBe('rgb(45, 55, 72)')
    expect(block.style.overflow).toBe('hidden')
    expect(block.style.textOverflow).toBe('ellipsis')
    expect(block.style.whiteSpace).toBe('nowrap')
    // La police de la page : rien n est pose.
    expect(block.style.fontFamily).toBe('')

    expect(body.className).toBe('figure_body')
    expect(body.style.flex).toBe('1 1 auto')
    expect(body.style.minHeight).toBe('0')
    expect(body.style.minWidth).toBe('0')
    expect(body.style.width).toBe('100%')
    expect(body.style.position).toBe('relative')
    expect(body.parentElement).toBe(wrap)
  })

  it('ecrit un titre non gras en poids normal', () => {
    const container = host()
    mountFigureTextZones(container, [text({ bold: false })])
    expect((container.querySelector('.figure_title') as HTMLElement).style.fontWeight).toBe('400')
  })

  it('pose le titre APRES le dessin quand il va dessous', () => {
    const container = host()
    mountFigureTextZones(container, [text({ position: 'bottom' })])
    const wrap = container.firstElementChild as HTMLElement
    expect(Array.from(wrap.children).map(c => c.className))
      .toEqual(['figure_body', 'figure_text figure_title'])
    // Une colonne ordinaire : c est l ordre du DOM qui dit le haut et le bas.
    expect(wrap.style.flexDirection).toBe('column')
  })
})

describe('mountFigureTextZones avec plusieurs zones', () => {

  it('pose les zones du haut avant le dessin et celles du bas apres, dans l ordre recu', () => {
    const container = host()
    mountFigureTextZones(container, [
      text({ text: 'Titre' }),
      text({ text: 'Sous-titre' }),
      text({ text: 'Source', position: 'bottom' }),
      text({ text: 'Note', position: 'bottom' })
    ])
    const wrap = container.firstElementChild as HTMLElement
    expect(Array.from(wrap.children).map(c => c.textContent))
      .toEqual(['Titre', 'Sous-titre', '', 'Source', 'Note'])
    expect((wrap.children[2] as HTMLElement).className).toBe('figure_body')
  })

  it('ne donne la classe du titre qu a la premiere zone', () => {
    const container = host()
    mountFigureTextZones(container, [text({ text: 'Titre' }), text({ text: 'Autre' })])
    expect(container.querySelectorAll('.figure_title')).toHaveLength(1)
    expect(container.querySelectorAll('.figure_text')).toHaveLength(2)
  })

  it('enveloppe le texte quand la zone le demande, et pose sa police', () => {
    const container = host()
    mountFigureTextZones(container, [
      text({ wrap: true, italic: true, align: 'right', font_family: 'Arial, sans-serif' })
    ])
    const block = container.querySelector('.figure_text') as HTMLElement
    expect(block.style.whiteSpace).toBe('pre-wrap')
    expect(block.style.textOverflow).toBe('')
    expect(block.style.fontStyle).toBe('italic')
    expect(block.style.textAlign).toBe('right')
    expect(block.style.fontFamily).toBe('Arial, sans-serif')
  })
})
