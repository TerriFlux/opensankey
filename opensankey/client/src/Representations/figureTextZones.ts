// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction.
// ==================================================================================================
// Author        : TerriFlux
// ==================================================================================================

// os#1449 — LES ZONES DE TEXTE D'UNE FIGURE, POSÉES AUTOUR DE SON DESSIN.
//
// Un seul traceur pour tout ce qu'une figure écrit à côté de son dessin, TITRE COMPRIS : c'est le
// point du lot. `Charts/figureTitle.mountFigureTitle` ne savait poser qu'un bloc, et n'en
// connaissait qu'une sorte — le titre ; une figure qui aurait voulu une mention sous son dessin
// aurait eu droit à un second traceur et à un second vocabulaire, exactement la divergence que
// Julien pointe entre le titre du diagramme et celui d'une figure.
//
// Ici il n'y a plus de titre : il y a des BLOCS DE TEXTE, le premier étant celui que l'auteur
// appelle le titre (cf. `figureTextsOf`, Charts/figureChartStyle). Un bloc prend sa hauteur, le
// dessin prend le reste — en largeur comme en hauteur.
//
// CE QUI NE CHANGE PAS D'UN PIXEL, et c'est le critère du lot : pour une figure qui n'a qu'un
// titre — c'est-à-dire pour toutes celles enregistrées à ce jour —, les classes, les styles et le
// texte posés sont ceux de `mountFigureTitle`. Une seule différence, invisible : les blocs
// « dessous » sont écrits APRÈS le dessin dans un `column` ordinaire, là où l'ancien traceur les
// écrivait avant dans un `column-reverse`. Le rendu est le même, et l'ordre du DOM devient celui
// de la lecture, ce qui compte dès qu'il y a plusieurs blocs.
//
// POURQUOI ICI ET NON DANS `Charts/` À CÔTÉ DE `figureTitle.ts` : ces zones sont un trait de la
// FIGURE (ce qu'elle porte) et non du moteur de tracé (comment il dessine des arcs). Le jour où
// elles deviendront de vrais éléments — la cible : un `Class_ContainerElement` comme le titre du
// diagramme — c'est de ce côté-ci qu'elles iront. `figureTitle.ts` reste en place pour les
// moteurs qui ne l'ont pas encore rejoint (histogrammes, couronne d'OpenSankey+).

import type { Type_FigureText } from '../Charts/figureChartStyle'

/** Le bloc DOM d'une zone de texte. `is_title` ne change que sa classe (cf. en-tête). */
const buildTextBlock = (text: Type_FigureText, is_title: boolean): HTMLElement => {
  const block = document.createElement('div')
  // `figure_text` dit la nature commune ; `figure_title` reste sur la première zone pour que ce
  // qui visait le titre — une feuille de style d'hôte, un export — continue de le trouver.
  block.className = is_title ? 'figure_text figure_title' : 'figure_text'
  block.textContent = text.text
  // L'infobulle native : un titre coupé aux points de suspension reste lisible au survol.
  block.title = text.text
  block.style.flex = '0 0 auto'
  block.style.textAlign = text.align === 'middle' ? 'center' : text.align
  block.style.padding = '0.15rem 0.4rem'
  block.style.fontSize = `${text.font_size}px`
  block.style.fontWeight = text.bold ? '700' : '400'
  block.style.fontStyle = text.italic ? 'italic' : 'normal'
  block.style.lineHeight = '1.25'
  block.style.color = text.color
  block.style.overflow = 'hidden'
  if (text.wrap) {
    // Un texte enveloppé prend autant de lignes qu'il lui en faut ; les retours saisis comptent.
    block.style.whiteSpace = 'pre-wrap'
    block.style.overflowWrap = 'anywhere'
  } else {
    block.style.textOverflow = 'ellipsis'
    block.style.whiteSpace = 'nowrap'
  }
  if (text.font_family !== '') block.style.fontFamily = text.font_family
  return block
}

// ── 02/10/2026 — LE FIL D'ARIANE D'UNE FIGURE ZOOMÉE (os#1511) ──────────────────────────────────
//
// Julien : « il faudrait un fil d'Ariane qui montre tout ce qu'on a cliqué, genre Céréales ›
// Céréales transformées ». Une ligne sous le titre, posée ICI parce que c'est ici que la place des
// textes est prise avant que le dessin ne mesure la sienne : le disque se dimensionne sur ce qui
// reste, il ne peut ni chevaucher le fil ni y loger ses étiquettes détachées.
//
// Le dernier cran est l'endroit où l'on est : en gras, inerte. Chaque cran précédent remonte
// directement à son niveau, quand la figure sait remonter (`go` absent : simple texte).

/** Un cran du fil d'Ariane. */
export interface Type_FigureCrumb {
  label: string
  /** Remonte à ce cran ; absent, le cran se lit sans se cliquer. */
  go?: () => void
  /** L'infobulle du cran cliquable. */
  hint?: string
}

const CRUMB_SEPARATOR = ' › '

/** La ligne du fil d'Ariane. Rien à poser sous deux crans : la figure regarde son sujet. */
const buildBreadcrumb = (crumbs: Type_FigureCrumb[]): HTMLElement => {
  const line = document.createElement('div')
  line.className = 'figure_breadcrumb'
  line.style.flex = '0 0 auto'
  line.style.padding = '0.1rem 0.4rem'
  line.style.fontSize = '12px'
  line.style.lineHeight = '1.3'
  line.style.color = '#4a5568'
  line.style.whiteSpace = 'nowrap'
  line.style.overflow = 'hidden'
  line.style.textOverflow = 'ellipsis'
  line.style.textAlign = 'left'
  line.title = crumbs.map(c => c.label).join(CRUMB_SEPARATOR)
  crumbs.forEach((crumb, i) => {
    if (i > 0) {
      const sep = document.createElement('span')
      sep.textContent = CRUMB_SEPARATOR
      sep.style.color = '#a0aec0'
      line.appendChild(sep)
    }
    const last = i === crumbs.length - 1
    const go = last ? undefined : crumb.go
    const node = document.createElement(go ? 'button' : 'span')
    node.className = last ? 'figure_crumb figure_crumb_current' : 'figure_crumb'
    node.textContent = crumb.label
    if (last) node.style.fontWeight = '700'
    if (go) {
      const b = node as HTMLButtonElement
      b.type = 'button'
      b.title = crumb.hint ?? crumb.label
      b.style.background = 'none'
      b.style.border = 'none'
      b.style.padding = '0'
      b.style.margin = '0'
      b.style.font = 'inherit'
      b.style.color = '#2b6cb0'
      b.style.cursor = 'pointer'
      b.addEventListener('mouseenter', () => { b.style.textDecoration = 'underline' })
      b.addEventListener('mouseleave', () => { b.style.textDecoration = 'none' })
      // Le clic reste au fil : la vignette sous lui le prendrait pour une sélection.
      b.addEventListener('pointerdown', e => e.stopPropagation())
      b.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); go() })
    }
    line.appendChild(node)
  })
  return line
}

/**
 * Pose les zones de texte dans `container` et rend L'ÉLÉMENT OÙ DESSINER — le conteneur lui-même
 * quand il n'y a aucun texte, auquel cas rien n'est ajouté et rien ne change.
 *
 * L'ordre rendu est : les blocs « dessus » dans l'ordre reçu, le dessin, les blocs « dessous »
 * dans l'ordre reçu. Le titre étant le premier de la liste, il reste la première ligne.
 *
 * `crumbs` : le fil d'Ariane d'une figure zoomée, posé juste sous le titre (en tête s'il n'y a pas
 * de titre au-dessus). Moins de deux crans : aucune ligne, aucune place prise.
 */
export const mountFigureTextZones = (
  container: HTMLElement,
  texts: Type_FigureText[],
  crumbs: Type_FigureCrumb[] | HTMLElement = []
): HTMLElement => {
  const written = texts.filter(t => t.text !== '')
  // 03/10/2026 — ou un bloc tout fait, posé à la même place : le tableau de navigation d'une couronne
  // sur dimensions de données (cf. `figureNavigationTable`), qui remplace son fil d'Ariane.
  const trail = crumbs instanceof HTMLElement ? crumbs : crumbs.length >= 2 ? buildBreadcrumb(crumbs) : null
  if (written.length === 0 && trail === null) return container

  const wrap = document.createElement('div')
  wrap.className = 'figure_titled'
  wrap.style.display = 'flex'
  wrap.style.flexDirection = 'column'
  wrap.style.width = '100%'
  wrap.style.height = '100%'
  wrap.style.minHeight = '0'

  const body = document.createElement('div')
  body.className = 'figure_body'
  body.style.flex = '1 1 auto'
  body.style.minHeight = '0'
  body.style.minWidth = '0'
  body.style.width = '100%'
  body.style.position = 'relative'

  const blocks = written.map((t, i) => buildTextBlock(t, i === 0))
  const title_on_top = written.length > 0 && written[0].position !== 'bottom'
  if (trail !== null && !title_on_top) wrap.appendChild(trail)
  blocks.forEach((b, i) => {
    if (written[i].position === 'bottom') return
    wrap.appendChild(b)
    if (i === 0 && trail !== null) wrap.appendChild(trail)
  })
  wrap.appendChild(body)
  blocks.forEach((b, i) => { if (written[i].position === 'bottom') wrap.appendChild(b) })

  container.appendChild(wrap)
  return body
}
