// ==================================================================================================
// #530 — EMPREINTE DE RENDU : ce que l'utilisateur voit, réduit au strict nécessaire.
//
// Les trois filets « corpus » existants (corpusFirstLoad, corpusRoundTrip, corpusCrossDump)
// regardent tous le DUMP JSON. Une règle de rendu nouvelle — une opacité déduite d'une étiquette,
// une ligne de définition dans la légende, un tireté dérivé du statut de détermination — laisse le
// JSON strictement inchangé et les goldens au vert, tout en changeant le diagramme à l'écran.
// Ce module fournit l'instrument qui manquait : on DESSINE sous jsdom, et on lit le SVG produit.
//
// ⚠️ Empreinte MINIMALE, délibérément. Pas un snapshot SVG complet : il bougerait à chaque ticket
// pour des raisons sans rapport (une géométrie de pointe de flèche, un arrondi de coordonnée) et
// deviendrait vite illisible, donc régénéré sans être lu — un golden qu'on ne lit plus ne mesure
// plus rien. On ne fige donc que :
//   - par nœud et par flux : visibilité, couleur de remplissage, opacité effective ;
//   - par zone de légende : son texte.
// Rien d'autre. Élargir l'empreinte est un geste délibéré, pas une dérive.
//
// « Opacité EFFECTIVE » = ce qui s'applique réellement au pixel : le produit des attributs
// `opacity` portés par la forme et par tous ses ancêtres jusqu'à la racine du dessin, multiplié par
// l'opacité du canal peint (`fill-opacity` si la forme est remplie, `stroke-opacity` si elle est
// tracée). C'est volontairement indépendant de l'ENDROIT où l'opacité est posée : le chantier
// « fiabilité » va justement en déplacer le point d'application, et l'empreinte doit alors rester
// stable tant que le rendu ne change pas.
// ==================================================================================================

import type { Class_ApplicationData } from '../types/ApplicationData'
import type { Type_JSON } from '../types/Utils'
import { canonicalizeForgedIds, deepClone, withSeededRandom } from './corpusHarness'

/** Conteneur DOM hôte attendu par Class_DrawingArea (`container_selector` par défaut). */
export const HOST_ID = 'sankey_app'

/**
 * Rustines jsdom indispensables au DESSIN (jsdom n'implémente ni la mesure de texte SVG ni le
 * canvas). Les valeurs rendues sont arbitraires mais DÉTERMINISTES et proportionnelles au nombre
 * de caractères : la mise en page qui en découle n'a pas de sens visuel, mais elle est
 * reproductible — et l'empreinte ne retient de toute façon aucune géométrie.
 */
export function installJsdomRenderStubs(): void {
  if (typeof globalThis.structuredClone !== 'function') {
    globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
  }
  const char_width = 6
  const svg_proto = SVGElement.prototype as unknown as Record<string, unknown>
  svg_proto.getBBox = function (this: SVGElement) {
    return { x: 0, y: 0, width: (this.textContent ?? '').length * char_width, height: 12 }
  }
  svg_proto.getComputedTextLength = function (this: SVGElement) {
    return (this.textContent ?? '').length * char_width
  }
  svg_proto.getSubStringLength = function (_start: number, length: number) { return length * char_width }
  svg_proto.getNumberOfChars = function (this: SVGElement) { return (this.textContent ?? '').length }
  svg_proto.getTotalLength = function () { return 100 }
  svg_proto.getPointAtLength = function () { return { x: 0, y: 0 } }
  svg_proto.getScreenCTM = function () {
    const identity = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }
    return { ...identity, inverse: () => identity }
  }
  const svg_svg_proto = SVGSVGElement.prototype as unknown as Record<string, unknown>
  svg_svg_proto.createSVGPoint = function () {
    return { x: 0, y: 0, matrixTransform: () => ({ x: 0, y: 0 }) }
  }
  // `breakLongWords` mesure le texte au canvas (DrawLabel) ; jsdom 16 ne l'implémente pas et
  // journalise une erreur « Not implemented » par appel — du bruit qui noierait un vrai échec.
  const canvas_proto = HTMLCanvasElement.prototype as unknown as Record<string, unknown>
  canvas_proto.getContext = function () {
    return {
      measureText: (text: string) => ({ width: String(text).length * char_width }),
      font: ''
    }
  }
}

/** Remet en place un conteneur hôte vierge. Un dessin par fichier, sans résidu du précédent. */
export function resetHost(): HTMLElement {
  document.body.innerHTML = '<div id="' + HOST_ID + '"></div>'
  return document.getElementById(HOST_ID) as HTMLElement
}

export type Type_ShapeAppearance = { fill: string | null, opacity: number }

/** Couleur réellement peinte et opacité effective d'une forme, dans l'ordre où SVG les résout. */
function paintedAppearance(shape: Element, root: Element): Type_ShapeAppearance {
  const fill = shape.getAttribute('fill')
  const stroke = shape.getAttribute('stroke')
  // Une forme « tracée » (fill=none) porte sa couleur sur stroke : c'est le cas du chemin d'un
  // flux en rendu trait. On rend donc la couleur RÉELLEMENT peinte, quel que soit le canal.
  const is_filled = fill !== null && fill !== 'none'
  const color = is_filled ? fill : stroke
  const channel = shape.getAttribute(is_filled ? 'fill-opacity' : 'stroke-opacity')
  let opacity = (channel === null || channel === '') ? 1 : Number(channel)
  // Opacités de groupe : multiplicatives, de la forme jusqu'à la racine du dessin.
  let cursor: Element | null = shape
  while (cursor !== null && cursor !== root) {
    const own = cursor.getAttribute('opacity')
    if (own !== null && own !== '') opacity *= Number(own)
    cursor = cursor.parentElement
  }
  return { fill: color, opacity: Number.isFinite(opacity) ? Number(opacity.toFixed(6)) : 0 }
}

export type Type_ElementPrint =
  | { drawn: false }
  | { drawn: true, fill: string | null, opacity: number }
  | { drawn: true, shapes: Type_ShapeAppearance[] }

/**
 * Empreinte d'un élément : absent du DOM (`drawn: false`), une seule forme peinte (cas courant,
 * aplati pour rester lisible), ou plusieurs (flux à bandes de valeurs étiquetées).
 */
function elementPrint(host: HTMLElement, svg_group: string, shape_selector: string): Type_ElementPrint {
  const g = host.querySelector('#' + svg_group)
  if (g === null) return { drawn: false }
  const shapes = Array.from(g.querySelectorAll(shape_selector)).map(s => paintedAppearance(s, host))
  if (shapes.length === 1) return { drawn: true, ...shapes[0] }
  return { drawn: true, shapes }
}

/**
 * Empreinte de rendu du diagramme DÉJÀ DESSINÉ porté par `app`.
 *
 * Les nœuds et les flux sont parcourus depuis le MODÈLE (et non depuis le DOM) : un élément que le
 * rendu cesse de dessiner doit apparaître comme `drawn: false`, pas disparaître de l'empreinte —
 * sinon une régression de visibilité passerait pour une simple réduction du golden.
 */
export function renderFingerprint(app: Class_ApplicationData, host: HTMLElement): Type_JSON {
  const sankey = app.drawing_area.sankey
  const nodes: Record<string, Type_ElementPrint> = {}
  sankey.nodes_list.forEach(n => { nodes[n.id] = elementPrint(host, n.svg_group, '.node_shape') })
  const links: Record<string, Type_ElementPrint> = {}
  sankey.links_list.forEach(l => { links[l.id] = elementPrint(host, l.svg_group, '.link_path,.link_band') })
  // Zones de légende : depuis le format 3 ce sont des conteneurs ordinaires d'ids 'legend*'
  // (LegendGenerator / legendIds), régénérés tant que la légende est « gérée ».
  const legend: Record<string, string | null> = {}
  Object.keys(sankey.containers_dict).sort().forEach(id => {
    if (!id.startsWith('legend')) return
    const g = host.querySelector('#' + sankey.containers_dict[id].svg_group)
    // Le texte AFFICHÉ, c'est-à-dire le `<text>` du libellé — pas le `textContent` du groupe :
    // celui-ci contient aussi le `<foreignObject>` d'édition en ligne, masqué (`display:none`) mais
    // porteur du même texte, qui apparaîtrait donc en double dans le golden.
    legend[id] = (g === null) ? null : (g.querySelector('.name_label_text')?.textContent ?? '')
  })
  return { nodes, links, legend } as unknown as Type_JSON
}

/**
 * Charge un JSON dans une application neuve, le DESSINE dans un conteneur jsdom vierge, et rend son
 * empreinte de rendu. `installJsdomRenderStubs()` doit avoir été appelé une fois par suite.
 */
export function drawAndFingerprint(json: Type_JSON, build: () => Class_ApplicationData): Type_JSON {
  const host = resetHost()
  const print = withSeededRandom(() => {
    const app = build()
    app.fromJSON(deepClone(json) as never, {}, false)
    app.drawing_area.draw()
    return renderFingerprint(app, host)
  })
  return canonicalizeForgedIds(JSON.parse(JSON.stringify(print)) as Type_JSON)
}
