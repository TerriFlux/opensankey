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

// sa#589 — LA GRANDE ZONE EN MOSAÏQUE LIBRE.
//
// CE QUI A ÉTÉ DEMANDÉ (Alexandre, 03/10, recette locale de sa#587). La grille ne connaissait que
// trois places — la grande case, une colonne à droite, un bandeau en bas — et l'objectif est de
// pouvoir composer « à peu près n'importe quelle disposition en mosaïque » en glissant les en-têtes :
// ajouter une ligne ou une colonne à chaque bord de la grille, autant de fois qu'on veut, et couper
// un volet en deux en lâchant un autre volet sur l'un de ses côtés.
//
// TROIS PLACES NE DÉCRIVENT PAS UNE MOSAÏQUE ; DES DÉCOUPES SUCCESSIVES, SI. C'est la forme des
// volets de VS Code : la grille est un ARBRE dont chaque nœud intérieur coupe son rectangle en
// bandes — côte à côte (`row`) ou empilées (`column`) — avec une proportion par bande, et dont
// chaque feuille est un volet. Toute mosaïque obtenue par des coupes de part en part s'y écrit, et
// chacun de ses traits de séparation est la frontière entre deux bandes voisines d'une découpe :
// c'est ce qui rend chaque coupe redimensionnable par sa poignée.
//
// CE MODULE EST PUR : ni `window`, ni modèle, ni rendu. Il dit la forme, ses gestes (retirer,
// échanger, couper, ajouter au bord, ouvrir « à droite / en bas »), la géométrie qu'elle donne dans
// un rectangle, et sa forme de fichier. `Class_MenuConfig` en garde UN exemplaire (celui de l'hôte)
// et la grande zone de l'éditeur le dessine ; tous deux l'appellent ici, pour ne jamais diverger.
//
// INVARIANTS, rétablis par `gridNormalize` après chaque geste :
//  - une découpe a au moins deux bandes (une seule : elle s'efface au profit de sa bande) ;
//  - une bande n'est jamais une découpe du même sens que sa mère (elle s'y fond, proportions
//    comprises) : sans cela deux arbres différents dessineraient la même mosaïque, et « ajouter une
//    colonne à droite » une deuxième fois créerait une colonne dans une colonne ;
//  - chaque volet n'y figure qu'une fois ; les poids sont finis et positifs.
//
// LE VOLET « PRINCIPAL » est la première feuille de l'arbre. Elle est TOUJOURS dans le coin haut
// gauche (chaque découpe range sa première bande à gauche ou en haut), ce qui garde un sens aux
// deux usages hérités de la grande case : la disposition par RÉSERVES (droite et bas) d'un dessin
// sans bandeau — publication, mode embarqué —, et la place `main` des fichiers d'avant.

/** `row` : bandes côte à côte, de gauche à droite ; `column` : empilées, de haut en bas. */
export type Type_MainZoneSplitDir = 'row' | 'column'

export type Type_MainZoneGridNode =
  | { pane: string }
  | { split: Type_MainZoneSplitDir, children: Type_MainZoneGridNode[], sizes: number[] }

/** Le côté d'un volet ou de la grille où l'on dépose. */
export type Type_MainZoneSide = 'left' | 'right' | 'top' | 'bottom'

/** L'étiquette héritée d'un volet de la grille (cf. `gridPlaceLabels`). */
export type Type_MainZoneGridPlace = 'main' | 'right' | 'bottom'

export type Type_MainZoneGridFrame = { top: number, left: number, width: number, height: number }

/**
 * Une poignée de redimensionnement : la frontière entre les bandes `index` et `index + 1` de la
 * découpe désignée par `path` (indices des bandes depuis la racine). `lengths` : la longueur en px
 * des deux bandes qu'elle sépare, dans le sens de la découpe — ce qu'il faut pour les redistribuer.
 */
export type Type_MainZoneGridDivider = {
  path: number[]
  index: number
  dir: Type_MainZoneSplitDir
  frame: Type_MainZoneGridFrame
  lengths: [number, number]
}

/** Épaisseur (px) des traits de séparation de la grille, et donc de leurs poignées. */
export const MAIN_ZONE_GRID_GAP_PX = 6
/**
 * Part que prend une bande qu'on ajoute AU BORD de la grille : un tiers quand elle coupe la grille
 * en deux (la colonne de droite d'avant prenait un tiers), sa part égale ensuite (1/(n+1)).
 */
export const GRID_EDGE_SHARE = 1 / 3

const isPane = (n: Type_MainZoneGridNode): n is { pane: string } => 'pane' in n
const dirOfSide = (side: Type_MainZoneSide): Type_MainZoneSplitDir =>
  (side === 'left' || side === 'right') ? 'row' : 'column'
const beforeSide = (side: Type_MainZoneSide): boolean => side === 'left' || side === 'top'
const validSize = (s: number): number => (Number.isFinite(s) && s > 0 ? s : 1)
const sum = (xs: number[]): number => xs.reduce((s, x) => s + x, 0)

/** Les volets de la grille, dans l'ordre de l'arbre (le premier est le principal). */
export const gridPaneIds = (node: Type_MainZoneGridNode | null): string[] => {
  if (!node) return []
  if (isPane(node)) return [node.pane]
  return node.children.flatMap(gridPaneIds)
}

/** Le volet principal : la première feuille, toujours dans le coin haut gauche. */
export const gridPrincipal = (node: Type_MainZoneGridNode | null): string | null =>
  gridPaneIds(node)[0] ?? null

export const gridHas = (node: Type_MainZoneGridNode | null, id: string): boolean =>
  gridPaneIds(node).includes(id)

/** Une copie profonde (les gestes rendent des arbres neufs : l'aperçu ne doit rien toucher). */
export const gridClone = (node: Type_MainZoneGridNode | null): Type_MainZoneGridNode | null => {
  if (!node) return null
  if (isPane(node)) return { pane: node.pane }
  return { split: node.split, children: node.children.map(c => gridClone(c)!), sizes: [...node.sizes] }
}

/**
 * Rétablit les invariants (cf. l'en-tête) : découpes d'au moins deux bandes, pas de découpe dans
 * une découpe du même sens, poids valides, volets uniques (le premier rencontré l'emporte).
 */
export const gridNormalize = (node: Type_MainZoneGridNode | null): Type_MainZoneGridNode | null => {
  const seen = new Set<string>()
  const walk = (n: Type_MainZoneGridNode): Type_MainZoneGridNode | null => {
    if (isPane(n)) {
      if (typeof n.pane !== 'string' || n.pane === '' || seen.has(n.pane)) return null
      seen.add(n.pane)
      return { pane: n.pane }
    }
    const children: Type_MainZoneGridNode[] = []
    const sizes: number[] = []
    n.children.forEach((c, i) => {
      const w = walk(c)
      if (!w) return
      const size = validSize(n.sizes[i])
      // Une bande du même sens se fond dans sa mère : ses bandes prennent sa part, au prorata.
      if (!isPane(w) && w.split === n.split) {
        const total = sum(w.sizes)
        w.children.forEach((cc, j) => { children.push(cc); sizes.push(size * w.sizes[j] / total) })
      } else {
        children.push(w)
        sizes.push(size)
      }
    })
    if (children.length === 0) return null
    if (children.length === 1) return children[0]
    return { split: n.split, children, sizes }
  }
  return node ? walk(node) : null
}

/** Ne garde que les volets de `keep` (les autres partent, leurs bandes avec eux). */
export const gridKeep = (
  node: Type_MainZoneGridNode | null, keep: (id: string) => boolean
): Type_MainZoneGridNode | null => {
  const walk = (n: Type_MainZoneGridNode): Type_MainZoneGridNode | null => {
    if (isPane(n)) return keep(n.pane) ? { pane: n.pane } : null
    const children: Type_MainZoneGridNode[] = []
    const sizes: number[] = []
    n.children.forEach((c, i) => {
      const w = walk(c)
      if (w) { children.push(w); sizes.push(n.sizes[i]) }
    })
    return children.length === 0 ? null : { split: n.split, children, sizes }
  }
  return gridNormalize(node ? walk(node) : null)
}

/** Retire un volet : les bandes voisines se partagent sa place, au prorata de leurs poids. */
export const gridRemove = (node: Type_MainZoneGridNode | null, id: string): Type_MainZoneGridNode | null =>
  gridKeep(node, x => x !== id)

/** Renomme un volet (un volet qui change d'identifiant garde sa case). */
export const gridRename = (
  node: Type_MainZoneGridNode | null, from: string, to: string
): Type_MainZoneGridNode | null => {
  const walk = (n: Type_MainZoneGridNode): Type_MainZoneGridNode => isPane(n)
    ? { pane: n.pane === from ? to : n.pane }
    : { split: n.split, children: n.children.map(walk), sizes: [...n.sizes] }
  return gridNormalize(node ? walk(node) : null)
}

/** Deux volets échangent leur case (l'un des deux peut être hors de la grille : il y entre). */
export const gridSwap = (node: Type_MainZoneGridNode | null, a: string, b: string): Type_MainZoneGridNode | null => {
  const walk = (n: Type_MainZoneGridNode): Type_MainZoneGridNode => {
    if (isPane(n)) return { pane: n.pane === a ? b : n.pane === b ? a : n.pane }
    return { split: n.split, children: n.children.map(walk), sizes: [...n.sizes] }
  }
  return gridNormalize(node ? walk(node) : null)
}

/**
 * COUPE le volet `target` en deux : `id` prend la moitié du côté `side`. Quand la mère de `target`
 * coupe déjà dans ce sens, `id` y devient une bande de plus, à côté de `target`, qui lui cède la
 * moitié de sa part — c'est la même mosaïque, écrite sans découpe imbriquée. `id` est d'abord
 * retiré de là où il était. Rend l'arbre inchangé (copie) si `target` n'y est pas.
 */
export const gridSplitPane = (
  node: Type_MainZoneGridNode | null, target: string, id: string, side: Type_MainZoneSide
): Type_MainZoneGridNode | null => {
  if (target === id) return gridClone(node)
  const base = gridRemove(node, id)
  if (!gridHas(base, target)) return gridClone(node)
  const dir = dirOfSide(side)
  const pair = (t: Type_MainZoneGridNode): Type_MainZoneGridNode[] =>
    beforeSide(side) ? [{ pane: id }, t] : [t, { pane: id }]
  const walk = (n: Type_MainZoneGridNode): Type_MainZoneGridNode => {
    if (isPane(n)) {
      return n.pane === target ? { split: dir, children: pair({ pane: target }), sizes: [1, 1] } : { pane: n.pane }
    }
    if (n.split === dir) {
      const at = n.children.findIndex(c => isPane(c) && c.pane === target)
      if (at >= 0) {
        const children = n.children.map(c => gridClone(c)!)
        const sizes = [...n.sizes]
        const half = sizes[at] / 2
        sizes[at] = half
        const ins = beforeSide(side) ? at : at + 1
        children.splice(ins, 0, { pane: id })
        sizes.splice(ins, 0, half)
        return { split: n.split, children, sizes }
      }
    }
    return { split: n.split, children: n.children.map(walk), sizes: [...n.sizes] }
  }
  return gridNormalize(walk(base as Type_MainZoneGridNode))
}

/**
 * AJOUTE une bande AU BORD de la grille : une colonne à gauche ou à droite, une ligne en haut ou
 * en bas, sur toute la hauteur (resp. largeur). Une grille déjà coupée dans ce sens reçoit une bande
 * de plus à ce bout — c'est « glisser en bas une 2ᵉ fois ajoute encore une ligne » ; sinon elle
 * entière devient l'autre bande. La nouvelle prend `GRID_EDGE_SHARE` la première fois, sa part
 * égale ensuite. `id` est d'abord retiré de là où il était.
 */
export const gridAddAtEdge = (
  node: Type_MainZoneGridNode | null, id: string, side: Type_MainZoneSide
): Type_MainZoneGridNode | null => {
  const base = gridRemove(node, id)
  if (!base) return { pane: id }
  const dir = dirOfSide(side)
  const first = beforeSide(side)
  if (!isPane(base) && base.split === dir) {
    const total = sum(base.sizes)
    const share = total / base.children.length
    const children = base.children.map(c => gridClone(c)!)
    const sizes = [...base.sizes]
    if (first) { children.unshift({ pane: id }); sizes.unshift(share) } else { children.push({ pane: id }); sizes.push(share) }
    return gridNormalize({ split: dir, children, sizes })
  }
  const rest = 1 - GRID_EDGE_SHARE
  return gridNormalize({
    split: dir,
    children: first ? [{ pane: id }, base] : [base, { pane: id }],
    sizes: first ? [GRID_EDGE_SHARE, rest] : [rest, GRID_EDGE_SHARE]
  })
}

/**
 * OUVRIR UN VOLET « À DROITE » OU « EN BAS », comme le faisaient les trois places d'avant : c'est le
 * sens que gardent `place: 'right' | 'bottom'` pour qui ouvre un volet (barre du haut, vues, OS+).
 *
 *  - `right` : dans la COLONNE À DROITE DU PRINCIPAL — la bande qui le suit dans la découpe
 *    côte à côte qui le porte, au bout (empilé dessous) ; s'il n'en a pas, une colonne naît à sa
 *    droite, de largeur `right_share` (part du volet principal qu'elle prend) ;
 *  - `bottom` : dans la LIGNE DU BAS de la grille, quand la grille finit par une ligne qui ne porte
 *    pas le principal, au bout (côte à côte) ; sinon une ligne naît en bas, de hauteur `bottom_share`.
 *  - `main` : il devient le principal (le premier volet, en haut à gauche) ; celui qui l'était est
 *    rouvert « à droite ».
 *
 * Sur une grille d'avant (grande case, colonne, bandeau), ce sont exactement les gestes d'avant.
 */
export const gridDock = (
  node: Type_MainZoneGridNode | null, id: string, place: Type_MainZoneGridPlace,
  right_share: number = GRID_EDGE_SHARE, bottom_share: number = GRID_EDGE_SHARE
): Type_MainZoneGridNode | null => {
  const base = gridRemove(node, id)
  if (!base) return { pane: id }
  const principal = gridPrincipal(base) as string
  if (place === 'main') {
    return gridDock(gridSwap(base, principal, id), principal, 'right', right_share, bottom_share)
  }
  const mean = (sizes: number[]): number => sum(sizes) / sizes.length
  /** Ajoute `id` au bout de la bande `n`, empilé (sens `dir`) avec ce qui y est. */
  const appendTo = (n: Type_MainZoneGridNode, dir: Type_MainZoneSplitDir): Type_MainZoneGridNode => {
    if (!isPane(n) && n.split === dir) {
      return { split: dir, children: [...n.children.map(c => gridClone(c)!), { pane: id }], sizes: [...n.sizes, mean(n.sizes)] }
    }
    return { split: dir, children: [gridClone(n)!, { pane: id }], sizes: [1, 1] }
  }
  if (place === 'bottom') {
    // La première bande d'une découpe porte toujours le principal : la dernière ne le porte donc
    // jamais, et c'est elle, la ligne du bas, quand la grille est empilée.
    if (!isPane(base) && base.split === 'column') {
      const children = base.children.map(c => gridClone(c)!)
      children[children.length - 1] = appendTo(children[children.length - 1], 'row')
      return gridNormalize({ split: 'column', children, sizes: [...base.sizes] })
    }
    const share = Math.min(0.9, Math.max(0.1, bottom_share))
    return gridNormalize({ split: 'column', children: [base, { pane: id }], sizes: [1 - share, share] })
  }
  // 'right' : la bande qui suit le principal dans la découpe côte à côte la plus PROCHE de lui (le
  // principal est toujours dans la première bande de chaque découpe qui le porte : on descend par
  // elles). C'est son voisin de droite immédiat, la colonne de droite d'avant.
  const copy = gridClone(base) as Type_MainZoneGridNode
  let row: { split: Type_MainZoneSplitDir, children: Type_MainZoneGridNode[], sizes: number[] } | null = null
  let n: Type_MainZoneGridNode = copy
  while (!isPane(n)) {
    if (n.split === 'row') row = n
    n = n.children[0]
  }
  if (row) {
    row.children[1] = appendTo(row.children[1], 'column')
    return gridNormalize(copy)
  }
  // Personne à sa droite : une colonne naît, qui prend `right_share` de sa case.
  const share = Math.min(0.9, Math.max(0.1, right_share))
  const wrap = (m: Type_MainZoneGridNode): Type_MainZoneGridNode => {
    if (isPane(m)) {
      return m.pane === principal
        ? { split: 'row', children: [{ pane: principal }, { pane: id }], sizes: [1 - share, share] }
        : m
    }
    return { split: m.split, children: m.children.map((c, i) => (i === 0 ? wrap(c) : c)), sizes: m.sizes }
  }
  return gridNormalize(wrap(copy))
}

/**
 * L'ÉTIQUETTE HÉRITÉE de chaque volet : `main` pour le principal ; pour les autres, `bottom` s'ils
 * sont SOUS le principal (la découpe où leurs chemins se séparent est empilée), `right` s'ils sont
 * à sa droite. C'est ce que `place` dit encore d'un volet ancré — à qui ouvre un volet « au même
 * endroit » (le volet d'une vue enregistrée), et aux fichiers relus par une version d'avant.
 */
export const gridPlaceLabels = (node: Type_MainZoneGridNode | null): { [id: string]: Type_MainZoneGridPlace } => {
  const labels: { [id: string]: Type_MainZoneGridPlace } = {}
  if (!node) return labels
  const principal = gridPrincipal(node) as string
  const walk = (n: Type_MainZoneGridNode, inherited: Type_MainZoneGridPlace | null) => {
    if (isPane(n)) { labels[n.pane] = n.pane === principal ? 'main' : (inherited ?? 'right'); return }
    const at = n.children.findIndex(c => gridHas(c, principal))
    n.children.forEach((c, i) => {
      // Dans la bande du principal, rien n'est encore décidé ; dans les autres, la découpe décide.
      walk(c, i === at ? inherited : (inherited ?? (n.split === 'column' ? 'bottom' : 'right')))
    })
  }
  walk(node, null)
  return labels
}

/**
 * LA GÉOMÉTRIE de la grille dans le rectangle `rect` : la case de chaque volet et les poignées
 * entre bandes voisines. Chaque découpe retire `gap` px entre ses bandes (le trait, où se pose la
 * poignée) et partage le reste au prorata des poids.
 */
export const gridFrames = (
  node: Type_MainZoneGridNode | null, rect: Type_MainZoneGridFrame, gap: number = MAIN_ZONE_GRID_GAP_PX
): { frames: { [id: string]: Type_MainZoneGridFrame }, dividers: Type_MainZoneGridDivider[] } => {
  const frames: { [id: string]: Type_MainZoneGridFrame } = {}
  const dividers: Type_MainZoneGridDivider[] = []
  const walk = (n: Type_MainZoneGridNode, r: Type_MainZoneGridFrame, path: number[]) => {
    if (isPane(n)) { frames[n.pane] = r; return }
    const horizontal = n.split === 'row'
    const length = horizontal ? r.width : r.height
    const usable = Math.max(0, length - gap * (n.children.length - 1))
    const total = sum(n.sizes) || n.children.length
    const lengths = n.sizes.map(s => (s / total) * usable)
    let at = horizontal ? r.left : r.top
    n.children.forEach((c, i) => {
      const len = lengths[i]
      const cr = horizontal
        ? { top: r.top, left: at, width: len, height: r.height }
        : { top: at, left: r.left, width: r.width, height: len }
      walk(c, cr, [...path, i])
      at += len
      if (i < n.children.length - 1) {
        dividers.push({
          path, index: i, dir: n.split,
          frame: horizontal
            ? { top: r.top, left: at, width: gap, height: r.height }
            : { top: at, left: r.left, width: r.width, height: gap },
          lengths: [len, lengths[i + 1]]
        })
        at += gap
      }
    })
  }
  if (node) walk(node, rect, [])
  return { frames, dividers }
}

/** La découpe au bout de `path`, ou `null` (chemin périmé). */
const splitAt = (node: Type_MainZoneGridNode | null, path: number[]) => {
  let n = node
  for (const i of path) {
    if (!n || isPane(n)) return null
    n = n.children[i] ?? null
  }
  return n && !isPane(n) ? n : null
}

/**
 * Partage à nouveau, dans la proportion `a` : `b`, la place des bandes `index` et `index + 1` de la
 * découpe `path` — le geste d'une poignée, qui donne leurs longueurs en px. Leur poids TOTAL ne
 * bouge pas : les autres bandes de la découpe gardent exactement leur place. Rend un arbre neuf ;
 * l'arbre donné est rendu tel quel si le chemin est périmé.
 */
export const gridSetPairSizes = (
  node: Type_MainZoneGridNode | null, path: number[], index: number, a: number, b: number
): Type_MainZoneGridNode | null => {
  const copy = gridClone(node)
  const s = splitAt(copy, path)
  if (!s || index < 0 || index + 1 >= s.children.length) return node
  if (!(a > 0) || !(b > 0)) return node
  const total = s.sizes[index] + s.sizes[index + 1]
  s.sizes[index] = total * a / (a + b)
  s.sizes[index + 1] = total * b / (a + b)
  return copy
}

/** Même mosaïque, aux proportions près ? (Un dépôt qui la laisse identique n'est pas offert.) */
export const gridSameShape = (a: Type_MainZoneGridNode | null, b: Type_MainZoneGridNode | null): boolean => {
  if (!a || !b) return a === b
  if (isPane(a) || isPane(b)) return isPane(a) && isPane(b) && a.pane === b.pane
  return a.split === b.split && a.children.length === b.children.length &&
    a.children.every((c, i) => gridSameShape(c, b.children[i]))
}

// --- La forme de fichier ------------------------------------------------------------------------
//
// `Type_JSON` ne porte ni tableau d'objets ni tableau de nombres : une découpe écrit ses bandes
// dans un DICTIONNAIRE indexé par rang ('0', '1'…), chacune avec son poids — même parti que
// `main_zone.occupants`, rangés par `order`. Un volet s'écrit `{ pane: id }`.
//
//   { split: 'row', children: { '0': { pane: 'diagram', size: 2 }, '1': { split: 'column',
//     size: 1, children: { '0': { pane: 'w_1', size: 1 }, '1': { pane: 'w_2', size: 1 } } } } }

type Type_GridJSON = { [_: string]: boolean | number | string | string[] | Type_GridJSON }

export const gridToJSON = (node: Type_MainZoneGridNode): Type_GridJSON => {
  if (isPane(node)) return { pane: node.pane }
  const children: Type_GridJSON = {}
  node.children.forEach((c, i) => { children[String(i)] = { ...gridToJSON(c), size: node.sizes[i] } })
  return { split: node.split, children }
}

/** Relit la forme de fichier ; `null` si elle ne décrit rien d'utilisable. */
export const gridFromJSON = (json: unknown): Type_MainZoneGridNode | null => {
  const walk = (v: unknown, depth: number): Type_MainZoneGridNode | null => {
    if (depth > 32 || !v || typeof v !== 'object' || Array.isArray(v)) return null
    const o = v as { [_: string]: unknown }
    if (typeof o['pane'] === 'string') return { pane: o['pane'] }
    if (o['split'] !== 'row' && o['split'] !== 'column') return null
    const raw = o['children']
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
    const entries = Object.entries(raw as { [_: string]: unknown })
      .filter(([k]) => /^\d+$/.test(k))
      .sort((x, y) => Number(x[0]) - Number(y[0]))
    const children: Type_MainZoneGridNode[] = []
    const sizes: number[] = []
    entries.forEach(([, c]) => {
      const w = walk(c, depth + 1)
      if (!w) return
      children.push(w)
      const s = (c as { [_: string]: unknown })['size']
      sizes.push(typeof s === 'number' ? validSize(s) : 1)
    })
    return children.length === 0 ? null : { split: o['split'], children, sizes }
  }
  return gridNormalize(walk(json, 0))
}
