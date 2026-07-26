// ==================================================================================================
// FOREIGN OBJECT -> SVG TEXT (rich text)
// --------------------------------------------------------------------------------------------
// Convertit les labels rich-text (HTML Quill dans un <foreignObject>) en <text>/<tspan> SVG
// natifs, pour que le SVG produit soit AUTONOME : il se rend alors sans la feuille de style de
// la page, ce qu'exigent la rasterisation via <img> + canvas (export PNG/PDF, vignettes de vues)
// et le fichier .svg exporté.
//
// MODULE FEUILLE VOLONTAIRE — que des utilitaires DOM purs, aucun import du graphe applicatif.
// Ces fonctions vivaient dans ApplicationData.tsx ; les en sortir permet à un service bas niveau
// (ex. les vignettes de vues, OSP#199) de les réutiliser sans créer d'arête d'import vers ce
// module lourd, donc sans risquer de perturber l'ordre d'initialisation (cf. cycle TDZ
// Element -> Handler).
// ==================================================================================================


type FOSpanStyle = {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  color?: string
  fontSize?: string
  fontFamily?: string
  align?: 'left' | 'center' | 'right'
}
type FOSpan = FOSpanStyle & { text: string }

const FO_BLOCK_TAGS = new Set(['p', 'div', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'])

function deriveFOStyle(el: HTMLElement, inherited: FOSpanStyle): FOSpanStyle {
  const style: FOSpanStyle = { ...inherited }
  const tag = el.tagName.toLowerCase()
  if (tag === 'b' || tag === 'strong') style.bold = true
  if (tag === 'i' || tag === 'em') style.italic = true
  if (tag === 'u' || tag === 'ins') style.underline = true
  const inline = el.getAttribute('style') || ''
  const colorMatch = inline.match(/(^|;)\s*color\s*:\s*([^;]+)/i)
  if (colorMatch) style.color = colorMatch[2].trim()
  const sizeMatch = inline.match(/(^|;)\s*font-size\s*:\s*([^;]+)/i)
  if (sizeMatch) style.fontSize = sizeMatch[2].trim()
  const familyMatch = inline.match(/(^|;)\s*font-family\s*:\s*([^;]+)/i)
  if (familyMatch) style.fontFamily = familyMatch[2].trim()
  const weightMatch = inline.match(/(^|;)\s*font-weight\s*:\s*([^;]+)/i)
  if (weightMatch) {
    const w = weightMatch[2].trim()
    if (w === 'bold' || (/^\d+$/.test(w) && parseInt(w) >= 700)) style.bold = true
    else if (w === 'normal' || (/^\d+$/.test(w) && parseInt(w) < 700)) style.bold = false
  }
  if (/font-style\s*:\s*italic/i.test(inline)) style.italic = true
  if (/text-decoration[^;]*underline/i.test(inline)) style.underline = true
  if (FO_BLOCK_TAGS.has(tag)) {
    const alignMatch = inline.match(/(^|;)\s*text-align\s*:\s*([^;]+)/i)
    const raw = alignMatch ? alignMatch[2].trim().toLowerCase() : window.getComputedStyle(el).textAlign
    if (raw === 'center') style.align = 'center'
    else if (raw === 'right' || raw === 'end') style.align = 'right'
    else if (raw === 'left' || raw === 'start') style.align = 'left'
  }
  return style
}

type FOEvent =
  | { type: 'run'; textNode: Text; style: FOSpanStyle }
  | { type: 'break' }

function collectFOEvents(root: HTMLElement): FOEvent[] {
  const events: FOEvent[] = []
  const walk = (node: Node, inherited: FOSpanStyle) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = node as Text
      if (t.data) events.push({ type: 'run', textNode: t, style: inherited })
      return
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return
    const el = node as HTMLElement
    const tag = el.tagName.toLowerCase()
    if (tag === 'br') { events.push({ type: 'break' }); return }
    const style = deriveFOStyle(el, inherited)
    const isBlock = FO_BLOCK_TAGS.has(tag)
    if (isBlock && events.length > 0) events.push({ type: 'break' })
    el.childNodes.forEach(c => walk(c, style))
  }
  walk(root, {})
  return events
}

function buildFOLines(events: FOEvent[]): FOSpan[][] {
  const lines: FOSpan[][] = [[]]
  let lastTop: number | null = null
  const pushSpan = (span: FOSpan) => { if (span.text) lines[lines.length - 1].push(span) }

  for (const ev of events) {
    if (ev.type === 'break') { lines.push([]); lastTop = null; continue }
    const { textNode, style } = ev
    const data = textNode.data
    if (!data) continue
    let pending = ''
    const re = /\S+|\s+/g
    let m: RegExpExecArray | null
    while ((m = re.exec(data)) !== null) {
      const tok = m[0]
      const range = document.createRange()
      range.setStart(textNode, m.index)
      range.setEnd(textNode, m.index + tok.length)
      const rects = range.getClientRects()
      if (rects.length === 0) { pending += tok; continue }
      const top = rects[0].top
      if (lastTop !== null && top > lastTop + 1) {
        pushSpan({ ...style, text: pending.replace(/\s+$/, '') })
        pending = ''
        lines.push([])
      }
      pending += tok
      lastTop = top
    }
    pushSpan({ ...style, text: pending })
  }
  return lines
}

function convertForeignObjectToSvgText(
  foNode: SVGForeignObjectElement,
  divElement: HTMLElement
): SVGTextElement | null {
  const foX = parseFloat(foNode.getAttribute('x') || '0')
  const foY = parseFloat(foNode.getAttribute('y') || '0')
  const foWidth = parseFloat(foNode.getAttribute('width') || '0')

  const divStyle = window.getComputedStyle(divElement)
  const baseFontSize = parseFloat(divStyle.fontSize) || 12
  const lineHeightRaw = parseFloat(divStyle.lineHeight)
  const lineHeight = isNaN(lineHeightRaw) ? baseFontSize * 1.2 : lineHeightRaw
  const padTop = parseFloat(divStyle.paddingTop) || 0
  const padLeft = parseFloat(divStyle.paddingLeft) || 0
  const padRight = parseFloat(divStyle.paddingRight) || 0
  const rootAlignRaw = (divStyle.textAlign || '').toLowerCase()
  const rootAlign: 'left' | 'center' | 'right' =
    rootAlignRaw === 'center' ? 'center'
      : (rootAlignRaw === 'right' || rootAlignRaw === 'end') ? 'right'
        : 'left'

  const anchorForAlign = (a: 'left' | 'center' | 'right') =>
    a === 'center' ? { anchor: 'middle', x: foX + foWidth / 2 }
      : a === 'right' ? { anchor: 'end', x: foX + foWidth - padRight }
        : { anchor: 'start', x: foX + padLeft }

  const events = collectFOEvents(divElement)
  const lines = buildFOLines(events)
  if (lines.length === 0 || (lines.length === 1 && lines[0].length === 0)) return null

  const SVG_NS = 'http://www.w3.org/2000/svg'
  const rootPos = anchorForAlign(rootAlign)
  const textElement = document.createElementNS(SVG_NS, 'text') as SVGTextElement
  textElement.setAttribute('x', rootPos.x.toString())
  textElement.setAttribute('y', (foY + padTop + baseFontSize * 0.8).toString())
  textElement.setAttribute('font-family', divStyle.fontFamily)
  textElement.setAttribute('font-size', divStyle.fontSize)
  textElement.setAttribute('fill', divStyle.color || '#000')
  textElement.setAttribute('text-anchor', rootPos.anchor)

  // Propage le transform du <foreignObject> (typiquement translate+rotate(-90)
  // posé pour vertical_text) sur le <text> de remplacement, sinon l'export PNG
  // perd la rotation et le label apparaît horizontal au mauvais endroit.
  const foTransform = foNode.getAttribute('transform')
  if (foTransform) textElement.setAttribute('transform', foTransform)

  lines.forEach((spans, lineIdx) => {
    const lineAlign = spans[0]?.align || rootAlign
    const pos = anchorForAlign(lineAlign)
    if (spans.length === 0) {
      const tspan = document.createElementNS(SVG_NS, 'tspan')
      tspan.setAttribute('x', pos.x.toString())
      tspan.setAttribute('text-anchor', pos.anchor)
      if (lineIdx > 0) tspan.setAttribute('dy', lineHeight + 'px')
      tspan.textContent = ' '
      textElement.appendChild(tspan)
      return
    }
    spans.forEach((span, spanIdx) => {
      const tspan = document.createElementNS(SVG_NS, 'tspan')
      if (spanIdx === 0) {
        tspan.setAttribute('x', pos.x.toString())
        tspan.setAttribute('text-anchor', pos.anchor)
        if (lineIdx > 0) tspan.setAttribute('dy', lineHeight + 'px')
      }
      if (span.bold) tspan.setAttribute('font-weight', 'bold')
      if (span.italic) tspan.setAttribute('font-style', 'italic')
      if (span.underline) tspan.setAttribute('text-decoration', 'underline')
      if (span.color) tspan.setAttribute('fill', span.color)
      if (span.fontSize) tspan.setAttribute('font-size', span.fontSize)
      if (span.fontFamily) tspan.setAttribute('font-family', span.fontFamily)
      tspan.textContent = span.text
      textElement.appendChild(tspan)
    })
  })

  return textElement
}

/**
 * Remplace EN PLACE, dans `root`, chaque <foreignObject> de label rich-text par son équivalent
 * <text> SVG natif.
 *
 * `root` est typiquement un CLONE DÉTACHÉ du SVG affiché : un clone n'a pas de boîtes de rendu,
 * donc le retour à la ligne est mesuré sur l'original VIVANT, retrouvé par id dans le document.
 * Les <foreignObject> d'édition en ligne (div contenteditable créé par drawLabelInput, masqué
 * tant qu'un label n'est pas double-cliqué) sont IGNORÉS : ils portent la valeur brute non
 * formatée et produiraient un <text> en double par-dessus le vrai label.
 */
export function convertForeignObjectsInPlace(root: Element): void {
  root.querySelectorAll('foreignObject').forEach((node) => {
    const foNode = node as SVGForeignObjectElement
    if (foNode.querySelector('[contenteditable]')) return
    const originalFO = foNode.id
      ? document.getElementById(foNode.id) as unknown as SVGForeignObjectElement | null
      : null
    const measureDiv = (originalFO || foNode).querySelector('div') as HTMLElement | null
    if (!measureDiv) return
    const textElement = convertForeignObjectToSvgText(foNode, measureDiv)
    if (textElement) foNode.parentNode?.replaceChild(textElement, foNode)
  })
}

/** Vrai si `root` contient au moins un label rich-text à convertir (hors édition en ligne). */
export function hasConvertibleForeignObjects(root: Element): boolean {
  return Array.from(root.querySelectorAll('foreignObject'))
    .some((fo) => !fo.querySelector('[contenteditable]'))
}
