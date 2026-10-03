// ==================================================================================================
// #588 — MÉMOIRE DES MESURES DE LIBELLÉS.
//
// La césure d'un libellé (d3-textwrap, méthode « tspans ») mesure le texte mot après mot avec
// `getComputedTextLength`, en réécrivant le <tspan> entre deux mesures : chaque mesure force donc
// le navigateur à remettre en page tout le document. Sur un SOCLE réel, c'était le premier poste
// d'un dessin complet — et le même libellé, redessiné à l'identique (changement de vue, d'année,
// bascule de volet, redessin après un geste), refaisait exactement les mêmes mesures.
//
// On mémorise donc le RÉSULTAT de la césure (lignes, attributs posés, largeurs mesurées), et on le
// rejoue tel quel quand le même texte est redemandé dans les mêmes conditions. Pas d'estimation :
// la valeur rejouée est celle que le navigateur a rendue, la clé couvre tout ce dont la mesure
// dépend.
//   - le texte et la largeur de césure ;
//   - les attributs de police du <text> (taille, famille, graisse, style), ses classes et son style
//     en ligne (`text-transform`…) ;
//   - l'échelle d'affichage : le navigateur met le texte SVG en page à sa taille ÉCRAN (zoom de la
//     zone × densité de pixels), et les longueurs en dépendent au centième de pixel près. Une
//     mesure canevas (`measureText`) ne rend d'ailleurs jamais exactement la même chose : écarts
//     de 0,01 à 7 px relevés sur les SOCLE, d'où ce choix de rejouer plutôt que d'estimer ;
//   - la zone de dessin : deux canevas ne partagent rien (fenêtre détachée, aperçu…).
// La mémoire est vidée quand une police finit de se charger (les largeurs changent alors).
// ==================================================================================================

export type Type_WrappedLine = { text: string, dx: string | null, dy: string | null }
export type Type_WrapMeasure = { lines: Type_WrappedLine[], widths: number[] }

// Borne de taille : au-delà, on repart de zéro plutôt que de gérer une éviction.
const MAX_ENTRIES = 20000

let _wraps = new Map<string, Type_WrapMeasure>()
type Type_BBox = { x: number, y: number, width: number, height: number }
let _bboxes = new Map<string, Type_BBox>()
let _fonts = new WeakMap<Document, Map<string, string>>()
const _owner_tokens = new WeakMap<object, number>()
let _next_token = 1
const _hooked_documents = new WeakSet<Document>()

function ownerToken(owner: object): number {
  let token = _owner_tokens.get(owner)
  if (token === undefined) {
    token = _next_token++
    _owner_tokens.set(owner, token)
  }
  return token
}

function hookFontLoading(doc: Document): void {
  if (_hooked_documents.has(doc)) return
  _hooked_documents.add(doc)
  // Absent sous jsdom : rien à surveiller.
  const fonts = (doc as Document & { fonts?: EventTarget }).fonts
  fonts?.addEventListener?.('loadingdone', () => resetLabelMeasureCache())
}

/** Clé de la césure de `text` dans le <text> `text_node`, tel qu'il est stylé à cet instant. */
export function wrapMeasureKey(
  owner: object,
  text_node: SVGTextElement,
  scale: number,
  box_width: number,
  text: string
): string {
  const doc = text_node.ownerDocument
  hookFontLoading(doc)
  const dpr = doc.defaultView?.devicePixelRatio ?? 1
  return [
    ownerToken(owner), scale, dpr, box_width,
    text_node.getAttribute('class'),
    text_node.getAttribute('font-size'),
    text_node.getAttribute('font-family'),
    text_node.getAttribute('font-weight'),
    text_node.getAttribute('font-style'),
    text_node.getAttribute('style'),
    text
  ].join('\u0001')
}

export function getWrapMeasure(key: string): Type_WrapMeasure | undefined {
  return _wraps.get(key)
}

export function setWrapMeasure(key: string, measure: Type_WrapMeasure): void {
  // Une mesure NULLE n'en est pas une : <text> hors du document ou sous un ancêtre masqué (volet
  // caché, document hors écran), sans mise en page. On ne la retient pas — elle serait rejouée une
  // fois le libellé affiché. Les <tspan> vides ayant été retirés, une vraie largeur est > 0.
  if (measure.widths.length === 0 || measure.widths.some(w => !(w > 0))) return
  if (_wraps.size >= MAX_ENTRIES) _wraps = new Map()
  _wraps.set(key, measure)
}

export function resetLabelMeasureCache(): void {
  _wraps = new Map()
  _bboxes = new Map()
  _fonts = new WeakMap()
}

// --------------------------------------------------------------------------------------------------
// Police CALCULÉE d'un <text> de libellé, pour la césure des mots longs (mesure canevas). Lire
// `getComputedStyle` au milieu des écritures du dessin force un recalcul de style du document
// entier : c'était 20 % d'un dessin complet (304 nœuds : 0,34 s). Ce qu'il rend ne dépend que des
// attributs de police que pose `applyTextStyle`, des classes du <text> et de la feuille de style de
// sa fenêtre (aucune règle CSS du dépôt ne vise la police d'un <text>) — d'où la clé, et une mémoire
// par document. Rend un gabarit où `{size}` tient la place de la taille.
// --------------------------------------------------------------------------------------------------

export function labelFontTemplate(text_node: SVGTextElement): string {
  const doc = text_node.ownerDocument
  hookFontLoading(doc)
  let by_key = _fonts.get(doc)
  if (!by_key) {
    by_key = new Map()
    _fonts.set(doc, by_key)
  }
  const font_style = text_node.getAttribute('font-style')
  const font_weight = text_node.getAttribute('font-weight')
  const font_family = text_node.getAttribute('font-family')
  // Un attribut de police absent s'HÉRITE du contexte (la légende pose sa propre famille sur son
  // groupe) : la clé ne le verrait pas. Seule une police entièrement portée par le <text> se retient.
  const own_font = !!font_style && !!font_weight && !!font_family
  const key = [font_style, font_weight, font_family, text_node.getAttribute('class')].join('')
  let font = own_font ? by_key.get(key) : undefined
  if (font === undefined) {
    // os#1385 — style calculé dans la VUE du nœud : un canevas détaché dessine son texte dans une
    // autre fenêtre de navigateur, dont la feuille de style est la sienne. Retombe sur la fenêtre de
    // la page pour tout le reste, qui y vit.
    const computed = (doc.defaultView ?? window).getComputedStyle(text_node)
    font = `${computed.fontStyle || 'normal'} ${computed.fontWeight || 'normal'} {size}px ${computed.fontFamily || 'sans-serif'}`
    // Hors du document, le style calculé est VIDE (d'où les replis ci-dessus) : la police rendue
    // ne vaut que pour cet appel, on ne la retient pas.
    if (own_font && text_node.isConnected && computed.fontFamily) by_key.set(key, font)
  }
  return font
}

// --------------------------------------------------------------------------------------------------
// Boîte englobante d'un <text> de libellé (fond du libellé). Même principe : `getBBox` force une
// mise en page de tout le document au milieu des écritures du dessin. La boîte d'un <text> dans
// son propre repère ne dépend que de ce qu'il porte (attributs, <tspan>, texte — tout est dans son
// `outerHTML`) et de l'échelle d'affichage ; un <textPath> dépendrait en plus du tracé qu'il suit,
// d'où son exclusion.
// --------------------------------------------------------------------------------------------------

/** `getBBox()` du <text>, rejoué si le même <text> a déjà été mesuré à la même échelle. */
export function textBBox(owner: object, text_node: SVGTextElement, scale: number): Type_BBox {
  if (text_node.querySelector('textPath') !== null) return text_node.getBBox()
  const doc = text_node.ownerDocument
  hookFontLoading(doc)
  const dpr = doc.defaultView?.devicePixelRatio ?? 1
  const key = [ownerToken(owner), scale, dpr, text_node.outerHTML].join('\u0001')
  const known = _bboxes.get(key)
  if (known !== undefined) return known
  const b = text_node.getBBox()
  const bbox = { x: b.x, y: b.y, width: b.width, height: b.height }
  // Boîte nulle : <text> sans mise en page (hors document, ancêtre masqué) — pas retenue (cf.
  // setWrapMeasure).
  if (!(bbox.width > 0 && bbox.height > 0)) return bbox
  if (_bboxes.size >= MAX_ENTRIES) _bboxes = new Map()
  _bboxes.set(key, bbox)
  return bbox
}
