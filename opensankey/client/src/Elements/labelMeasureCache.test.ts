import {
  getWrapMeasure, labelFontTemplate, resetLabelMeasureCache, setWrapMeasure, textBBox, wrapMeasureKey
} from './labelMeasureCache'

// #588 — la mémoire des mesures de libellés ne doit rejouer QUE ce que le navigateur a mesuré dans
// les mêmes conditions, et jamais une mesure prise sans mise en page.

const SVG_NS = 'http://www.w3.org/2000/svg'

function makeText(attrs: Record<string, string> = {}, attach = true): SVGTextElement {
  const svg = document.createElementNS(SVG_NS, 'svg')
  const text = document.createElementNS(SVG_NS, 'text') as SVGTextElement
  const all: Record<string, string> = {
    'class': 'name_label name_label_text', 'font-size': '14px', 'font-family': 'Arial,sans-serif',
    'font-weight': 'normal', 'font-style': 'normal', ...attrs
  }
  Object.entries(all).forEach(([k, v]) => text.setAttribute(k, v))
  text.textContent = 'Lait cru'
  svg.appendChild(text)
  if (attach) document.body.appendChild(svg)
  return text
}

function stubBBox(text: SVGTextElement, box: { x: number, y: number, width: number, height: number }) {
  const spy = jest.fn(() => box)
  ;(text as unknown as { getBBox: () => typeof box }).getBBox = spy
  return spy
}

beforeEach(() => {
  resetLabelMeasureCache()
  document.body.innerHTML = ''
})

describe('#588 — césure mémorisée', () => {
  it('la clé distingue zone de dessin, échelle, largeur de césure, police et texte', () => {
    const owner = {}
    const text = makeText()
    const key = wrapMeasureKey(owner, text, 0.5, 300, 'Lait cru')
    expect(wrapMeasureKey(owner, text, 0.5, 300, 'Lait cru')).toBe(key)
    expect(wrapMeasureKey({}, text, 0.5, 300, 'Lait cru')).not.toBe(key)
    expect(wrapMeasureKey(owner, text, 0.25, 300, 'Lait cru')).not.toBe(key)
    expect(wrapMeasureKey(owner, text, 0.5, 200, 'Lait cru')).not.toBe(key)
    expect(wrapMeasureKey(owner, text, 0.5, 300, 'Lait écrémé')).not.toBe(key)
    expect(wrapMeasureKey(owner, makeText({ 'font-weight': 'bold' }), 0.5, 300, 'Lait cru')).not.toBe(key)
  })

  it('rejoue une césure mesurée', () => {
    const measure = { lines: [{ text: ' Lait', dx: '0', dy: '0' }, { text: 'cru', dx: '-30', dy: '1em' }], widths: [30, 20] }
    setWrapMeasure('k', measure)
    expect(getWrapMeasure('k')).toEqual(measure)
  })

  it('ne retient pas une césure mesurée sans mise en page (largeur nulle)', () => {
    setWrapMeasure('k', { lines: [{ text: ' Lait', dx: '0', dy: '0' }], widths: [0] })
    expect(getWrapMeasure('k')).toBeUndefined()
  })
})

describe('#588 — boîte du <text> mémorisée', () => {
  it('ne remesure pas un <text> identique à la même échelle', () => {
    const owner = {}
    const text = makeText()
    const spy = stubBBox(text, { x: 1, y: 2, width: 30, height: 12 })
    expect(textBBox(owner, text, 1)).toEqual({ x: 1, y: 2, width: 30, height: 12 })
    expect(textBBox(owner, text, 1)).toEqual({ x: 1, y: 2, width: 30, height: 12 })
    expect(spy).toHaveBeenCalledTimes(1)
    // Autre échelle, ou <text> modifié : nouvelle mesure.
    textBBox(owner, text, 2)
    text.setAttribute('x', '5')
    textBBox(owner, text, 1)
    expect(spy).toHaveBeenCalledTimes(3)
  })

  it('ne retient pas une boîte nulle (texte sans mise en page)', () => {
    const owner = {}
    const text = makeText()
    const spy = stubBBox(text, { x: 0, y: 0, width: 0, height: 0 })
    textBBox(owner, text, 1)
    textBBox(owner, text, 1)
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('remesure toujours un <textPath>, qui dépend du tracé qu’il suit', () => {
    const owner = {}
    const text = makeText()
    text.appendChild(document.createElementNS(SVG_NS, 'textPath'))
    const spy = stubBBox(text, { x: 0, y: 0, width: 40, height: 12 })
    textBBox(owner, text, 1)
    textBBox(owner, text, 1)
    expect(spy).toHaveBeenCalledTimes(2)
  })
})

describe('#588 — police calculée mémorisée', () => {
  const computed = { fontStyle: 'normal', fontWeight: '400', fontFamily: 'Arial, sans-serif' } as CSSStyleDeclaration

  it('lit le style calculé une fois par police portée par le <text>', () => {
    const spy = jest.spyOn(window, 'getComputedStyle').mockReturnValue(computed)
    const font = labelFontTemplate(makeText())
    expect(font).toBe('normal 400 {size}px Arial, sans-serif')
    expect(labelFontTemplate(makeText())).toBe(font)
    expect(spy).toHaveBeenCalledTimes(1)
    spy.mockRestore()
  })

  it('ne retient ni un <text> hors du document, ni une police héritée', () => {
    const spy = jest.spyOn(window, 'getComputedStyle').mockReturnValue(computed)
    labelFontTemplate(makeText({}, false))
    labelFontTemplate(makeText({}, false))
    expect(spy).toHaveBeenCalledTimes(2)
    const inherited = makeText()
    inherited.removeAttribute('font-family')
    labelFontTemplate(inherited)
    labelFontTemplate(inherited)
    expect(spy).toHaveBeenCalledTimes(4)
    spy.mockRestore()
  })
})
