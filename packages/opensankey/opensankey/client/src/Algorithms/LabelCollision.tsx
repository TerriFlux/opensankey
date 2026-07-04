// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// #1248 — Anti-collision des libellés de nœuds. Passe STATIQUE exécutée en fin
// de draw() complet (opt-in via drawing_area.label_collision_enabled) : détecte
// les chevauchements entre labels de nom et les résout par poussées verticales
// itératives, appliquées en offset d'AFFICHAGE (transform sur le <g> du label).
//
// Choix structurants :
// - Display-only : on ne touche JAMAIS aux positions persistées
//   (name_label_position_x/y) — même philosophie que la surbrillance #1245 ;
//   le prochain draw() recrée les labels et la passe se ré-exécute.
// - Les labels positionnés À LA MAIN (name_label_position_x/y définis) sont des
//   obstacles FIXES : ils participent aux collisions mais ne bougent pas.
// - Poussée VERTICALE uniquement (les labels sont larges et bas, c'est l'axe
//   utile), amplitude bornée (force de rappel implicite) : un label ne
//   s'éloigne jamais de plus de MAX_SHIFT_PX de son ancrage.
// - Tout se mesure en pixels ÉCRAN (getBoundingClientRect — indépendant des
//   nesting/transforms SVG) ; l'offset est reconverti en coordonnées locales
//   via le zoom courant au moment de l'application.

import type { Class_DrawingArea } from '../types/DrawingArea'
import type { Class_NodeElement } from '../Elements/Node'

// Séparation minimale entre deux labels (px écran).
const GAP_PX = 2
// Déplacement maximal d'un label par rapport à son ancrage (px écran).
const MAX_SHIFT_PX = 60
// Itérations max de la relaxation (converge bien avant sur les cas réels).
const MAX_ITERATIONS = 30
// Garde-fou perf : au-delà, on ne tente rien (diagramme hors norme).
const MAX_LABELS = 1500

interface LabelBox {
  g: SVGGElement
  // Boîte écran courante (mise à jour au fil des poussées via dy).
  x0: number
  x1: number
  y0: number
  y1: number
  // Poussée verticale cumulée (px écran).
  dy: number
  movable: boolean
}

/**
 * Résout les chevauchements entre les labels de NOM des nœuds visibles.
 * À appeler après que tout est dessiné et le zoom de cadrage appliqué.
 */
export function resolveNodeLabelCollisions(drawing_area: Class_DrawingArea): void {
  if (!drawing_area.label_collision_enabled) return

  // Collecte des boîtes écran des labels de nom.
  const boxes: LabelBox[] = []
  drawing_area.sankey.visible_nodes_list.forEach((node: Class_NodeElement) => {
    const g_node = node.d3_selection?.node()
    if (!g_node) return
    const g_label = g_node.querySelector<SVGGElement>('#g_name_label')
    if (!g_label) return
    const rect = g_label.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    boxes.push({
      g: g_label,
      x0: rect.left, x1: rect.right, y0: rect.top, y1: rect.bottom,
      dy: 0,
      movable: node.name_label_position_x == null && node.name_label_position_y == null
    })
  })
  if (boxes.length < 2 || boxes.length > MAX_LABELS) return

  // Relaxation : poussées verticales par paires en collision. Tri par centre
  // vertical pour pousser de façon stable (celui du haut vers le haut, celui
  // du bas vers le bas) ; le clamp MAX_SHIFT_PX agit comme force de rappel.
  boxes.sort((a, b) => (a.y0 + a.y1) - (b.y0 + b.y1))
  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    let moved = false
    for (let i = 0; i < boxes.length; i++) {
      const a = boxes[i]
      for (let j = i + 1; j < boxes.length; j++) {
        const b = boxes[j]
        const overlap_x = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)
        if (overlap_x <= 0) continue
        const overlap_y = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0)
        if (overlap_y <= 0) continue
        // a est au-dessus (tri initial) : a monte, b descend.
        const push = overlap_y + GAP_PX
        const apply = (box: LabelBox, delta: number) => {
          // Clamp : ne pas dépasser MAX_SHIFT_PX d'écart cumulé à l'ancrage.
          const target = Math.max(-MAX_SHIFT_PX, Math.min(MAX_SHIFT_PX, box.dy + delta))
          const real = target - box.dy
          if (real === 0) return
          box.dy = target
          box.y0 += real
          box.y1 += real
          moved = true
        }
        if (a.movable && b.movable) {
          apply(a, -push / 2)
          apply(b, push / 2)
        } else if (a.movable) {
          apply(a, -push)
        } else if (b.movable) {
          apply(b, push)
        }
        // Deux labels fixes : rien à faire (l'utilisateur a choisi ces positions).
      }
    }
    if (!moved) break
  }

  // Application : offset écran → coordonnées locales via le zoom courant.
  // Le <g> du label n'a pas d'autre transform (le texte se place via x/y).
  const k = drawing_area.getZoomScale() || 1
  boxes.forEach(box => {
    if (Math.abs(box.dy) < 0.5) return
    box.g.setAttribute('transform', `translate(0, ${box.dy / k})`)
  })
}
