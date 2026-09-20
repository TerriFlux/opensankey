// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1476 — DE QUOI DESSINER UNE FIGURE POUR DE VRAI SOUS JSDOM.
//
// ⚠️ CE FICHIER N'EST PAS DU CODE DE PRODUIT. Son nom (`.test-utils.ts`) le tient hors des suites
// — jest ne ramasse que `*.test.ts` — et hors de tout chemin d'exécution : rien ne l'importe que
// des tests.
//
// ── POURQUOI IL EXISTE ────────────────────────────────────────────────────────────────────────
//
// Deux manques de jsdom empêchaient de dessiner une figure, et tous deux rendaient les tests
// MENTEURS plutôt que rouges — c'est ce qui les rend coûteux :
//
//  1. PAS DE MISE EN PAGE. Un conteneur y mesure zéro par zéro, le tracé ne dessine alors rien du
//     tout, et un test qui cherche quelque chose dans le DOM passe au vert pour la mauvaise raison.
//     C'est arrivé (cf. `figureIconDrawn.test`, premier état).
//  2. PAS DE GÉOMÉTRIE SVG. `SVGSVGElement` y est déclaré mais n'expose ni `viewBox`, ni `width`,
//     ni `height` au sens de l'IDL — trois propriétés que `d3-zoom` lit pour se donner une étendue.
//     Toute figure qui se zoome jetait donc avant d'avoir dessiné un arc, et le SUNBURST — la
//     nature la plus riche des trois — était réputé « non testable ici ». Il l'était par défaut de
//     trois accesseurs.
//
// Ce que ce fichier ne fait PAS, et ne doit pas faire : mettre en page. `getBBox` rend toujours une
// boîte vide, donc un cartouche ne se mesure pas et une étiquette ne se tronque pas pour de bon. Ce
// qui se vérifie ici est ce que le tracé ÉCRIT dans le document ; ce qui dépend d'une mesure réelle
// se vérifie à l'écran.

import type { Type_SunburstTree } from './SunburstHierarchy'

/**
 * Donne à `SVGSVGElement` les trois accesseurs de géométrie que `d3-zoom` attend.
 *
 * Idempotent, et appelable au chargement d'un module de test : il ne remplace jamais un accesseur
 * déjà présent, pour qu'une version de jsdom qui les implémenterait reprenne la main d'elle-même.
 */
export const givePlainSvgGeometry = (): void => {
  const svg = (globalThis as unknown as { SVGSVGElement?: { prototype: object } }).SVGSVGElement
  if (!svg) return
  const proto = svg.prototype
  if (!Object.getOwnPropertyDescriptor(proto, 'viewBox')) {
    Object.defineProperty(proto, 'viewBox', {
      configurable: true,
      get(this: SVGSVGElement) {
        const n = (this.getAttribute('viewBox') ?? '0 0 0 0').split(/[\s,]+/).map(Number)
        return { baseVal: { x: n[0] || 0, y: n[1] || 0, width: n[2] || 0, height: n[3] || 0 } }
      }
    })
  }
  ;(['width', 'height'] as const).forEach(name => {
    if (Object.getOwnPropertyDescriptor(proto, name)) return
    Object.defineProperty(proto, name, {
      configurable: true,
      get(this: SVGSVGElement) {
        return { baseVal: { value: Number(this.getAttribute(name)) || 0 } }
      }
    })
  })
}

/** Le tracé se redessine quand son cadre bouge ; jsdom n'a pas de quoi l'observer. */
export const giveResizeObserver = (): void => {
  if (typeof globalThis.ResizeObserver === 'function') return
  globalThis.ResizeObserver = class {
    observe() { /* rien */ }
    unobserve() { /* rien */ }
    disconnect() { /* rien */ }
  } as unknown as typeof ResizeObserver
}

/** `structuredClone` manque au jsdom de cette version de jest. */
export const giveStructuredClone = (): void => {
  if (typeof globalThis.structuredClone === 'function') return
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

/**
 * L'arbre MINIMAL qu'attend le disque : des racines sur un seul anneau.
 *
 * Il vit ici plutôt que dans chaque test parce qu'il n'est l'objet d'aucun d'eux : c'est le décor,
 * et un décor recopié finit par différer d'un fichier à l'autre sans que personne l'ait voulu.
 */
export const plainSunburstTree = (
  parts: { id: string, label: string, value: number }[]
): Type_SunburstTree => ({
  dimension_id: 'd',
  dimension_label: 'Axe',
  roots: parts.map(p => ({
    id: p.id, label: p.label, value: p.value, declared: p.value,
    color: '#4472C4', depth: 0, dimension_id: 'd', children: []
  })),
  rings: [{ dimension_id: 'd', dimension_label: 'Axe', level_label: '', is_selected_level: true }],
  total: parts.reduce((s, p) => s + p.value, 0),
  mismatch_count: 0,
  is_truncated: false
})

/** La marque d'un conteneur auquel un test a donné une taille (cf. `givePlainLayout`). */
const PLAIN_SIZE = '__plain_size'

/** La taille du plus proche ancêtre qu'un test a dimensionné, ou zéro. */
const inheritedSize = (from: HTMLElement): number => {
  let el: HTMLElement | null = from
  while (el) {
    const own = (el as unknown as { [k: string]: number })[PLAIN_SIZE]
    if (own) return own
    el = el.parentElement
  }
  return 0
}

/**
 * FAIT DESCENDRE LA TAILLE D'UN CONTENEUR JUSQU'À SES ENFANTS.
 *
 * ⚠️ Ce n'est PAS une mise en page, et il ne faut pas le croire : jsdom n'en fait aucune, et tout ce
 * qu'on peut honnêtement obtenir est « le cadre a une taille ». Sans cela, un tracé qui dessine dans
 * un sous-élément — et c'est le cas dès qu'une figure porte un titre : le dessin descend d'un cran,
 * dans `.figure_body` — mesure zéro, ne dessine rien, et le test qui cherche autre chose passe au
 * vert pour la mauvaise raison. C'est le piège n° 1, déjà payé une fois.
 *
 * Un enfant hérite donc de la taille du plus proche ancêtre qu'un test a dimensionné, exactement
 * comme le ferait un bloc en `width: 100%`. Ce qu'on ne modélise pas : la hauteur QUE PREND le titre.
 * Un test qui voudrait vérifier qu'un dessin rétrécit quand le texte grandit ne peut pas se faire
 * ici — ça se regarde à l'écran.
 */
export const givePlainLayout = (): void => {
  const proto = HTMLElement.prototype as unknown as { [k: string]: unknown }
  if (Object.getOwnPropertyDescriptor(proto, PLAIN_SIZE)) return
  // La marque, posée une fois, sert aussi de garde de ré-entrance.
  Object.defineProperty(proto, PLAIN_SIZE, { configurable: true, value: 0, writable: true })
  ;(['clientWidth', 'clientHeight'] as const).forEach(name => {
    Object.defineProperty(HTMLElement.prototype, name, {
      configurable: true,
      get(this: HTMLElement) {
        return inheritedSize(this)
      }
    })
  })
}

/** Les quatre d'un coup : ce qu'un test de tracé pose en tête de fichier. */
export const givePlainDrawingEnvironment = (): void => {
  giveStructuredClone()
  giveResizeObserver()
  givePlainSvgGeometry()
  givePlainLayout()
}

/**
 * Un conteneur QUI A UNE TAILLE — sans quoi le tracé ne dessine rien et le test ment.
 *
 * Il est attaché au document : `insert` pose le cartouche dans le parent du texte, et une sélection
 * d3 sur un nœud détaché se comporte autrement.
 */
export const sizedContainer = (side: number = 400): HTMLElement => {
  const el = document.createElement('div')
  // La taille est posée SUR LE CONTENEUR et descend à ses enfants (cf. `givePlainLayout`) : sans
  // cela, un tracé qui dessine dans `.figure_body` — dès qu'une figure porte un titre — mesurerait
  // zéro et ne dessinerait rien.
  ;(el as unknown as { [k: string]: number })[PLAIN_SIZE] = side
  el.getBoundingClientRect = () => ({
    width: side, height: side, top: 0, left: 0, right: side, bottom: side, x: 0, y: 0,
    toJSON: () => ({})
  }) as DOMRect
  document.body.appendChild(el)
  return el
}
