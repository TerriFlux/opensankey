// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
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
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// opensankey#1301 — POINTS DE PASSAGE LISSES d'un flux. Géométrie pure, sans DOM ni élément :
// LinkDrawShape (tracé, contour, bandes), LinkControlPoints (poignées, insertion) et DrawLabel
// (étiquette au milieu) partagent ainsi le même calcul.
//
// La courbe paramétrique du flux est conservée — segment d'attache p0→p1, tangentes p2/p4,
// segment d'arrivée p5→p6 — et passe en plus par chaque point de passage. Chaque tronçon entre
// deux nœuds consécutifs (p1, points, p5) est une cubique de Bézier ; la tangente en un point de
// passage est parallèle à l'axe du flux (horizontale pour un flux hh, verticale pour vv) et, pour
// les autres orientations, celle de la corde voisine (Catmull-Rom). La courbe reste C1.

import { Type_LinkPassPoint } from './ElementsAttributesConfig'

export type Type_Pt = [number, number]

/**
 * Repère des points de passage : 'h' = flux horizontal (v vertical), 'v' = flux vertical
 * (v horizontal), 'chord' = repère de la corde source→cible (v perpendiculaire).
 */
export type Type_PassPointFrame = 'h' | 'v' | 'chord'

const EPS = 1e-6

function norm(x: number, y: number): Type_Pt {
  const l = Math.hypot(x, y)
  return l > EPS ? [x / l, y / l] : [0, 0]
}

/** Point de passage relatif → coordonnées MONDE. */
export function passPointToWorld(p: Type_LinkPassPoint, s: Type_Pt, t: Type_Pt, frame: Type_PassPointFrame): Type_Pt {
  const bx = s[0] + p.u * (t[0] - s[0])
  const by = s[1] + p.u * (t[1] - s[1])
  if (frame === 'h') return [bx, by + p.v]
  if (frame === 'v') return [bx + p.v, by]
  const n = norm(-(t[1] - s[1]), t[0] - s[0])
  return [bx + n[0] * p.v, by + n[1] * p.v]
}

/** Coordonnées MONDE → point de passage relatif (inverse de passPointToWorld). */
export function worldToPassPoint(w: Type_Pt, s: Type_Pt, t: Type_Pt, frame: Type_PassPointFrame): Type_LinkPassPoint {
  const dx = t[0] - s[0]
  const dy = t[1] - s[1]
  const len_sq = dx * dx + dy * dy
  // u le long de la corde (repli quand l'axe du repère est dégénéré)
  const u_chord = len_sq > EPS ? ((w[0] - s[0]) * dx + (w[1] - s[1]) * dy) / len_sq : 0.5
  if (frame === 'h') {
    const u = Math.abs(dx) > EPS ? (w[0] - s[0]) / dx : u_chord
    return { u, v: w[1] - (s[1] + u * dy) }
  }
  if (frame === 'v') {
    const u = Math.abs(dy) > EPS ? (w[1] - s[1]) / dy : u_chord
    return { u, v: w[0] - (s[0] + u * dx) }
  }
  const n = norm(-dy, dx)
  return { u: u_chord, v: (w[0] - s[0]) * n[0] + (w[1] - s[1]) * n[1] }
}

export type Type_PassPointCurve = {
  p0: Type_Pt, p1: Type_Pt, p2: Type_Pt, p4: Type_Pt, p5: Type_Pt, p6: Type_Pt,
  pass: Type_Pt[],
  frame: Type_PassPointFrame,
  curved: boolean
}

/** Tangente unitaire au point de passage i (nœuds = p1, pass…, p5). */
function passTangent(nodes: Type_Pt[], i: number, frame: Type_PassPointFrame): Type_Pt {
  const first = nodes[0]
  const last = nodes[nodes.length - 1]
  if (frame === 'h') return [Math.sign(last[0] - first[0]) || 1, 0]
  if (frame === 'v') return [0, Math.sign(last[1] - first[1]) || 1]
  const t = norm(nodes[i + 1][0] - nodes[i - 1][0], nodes[i + 1][1] - nodes[i - 1][1])
  return t[0] === 0 && t[1] === 0 ? norm(last[0] - first[0], last[1] - first[1]) : t
}

/** Longueur de poignée d'un tronçon A→B le long de la tangente t. */
function handleLength(a: Type_Pt, b: Type_Pt, t: Type_Pt): number {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  return Math.max(0.5 * Math.abs(dx * t[0] + dy * t[1]), 0.2 * Math.hypot(dx, dy))
}

/**
 * Médiane échantillonnée (polyligne dense) p0 → p1 → points de passage → p5 → p6.
 * Le premier tronçon prend p2 pour poignée de départ, le dernier p4 pour poignée d'arrivée :
 * les poignées de tangente gardent leur rôle.
 */
export function passPointCenterline(c: Type_PassPointCurve): Type_Pt[] {
  if (!c.curved) return [c.p0, c.p1, ...c.pass, c.p5, c.p6]
  const nodes: Type_Pt[] = [c.p1, ...c.pass, c.p5]
  const K = 24
  const out: Type_Pt[] = [c.p0, c.p1]
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i]
    const b = nodes[i + 1]
    let c1: Type_Pt
    if (i === 0) c1 = c.p2
    else {
      const ta = passTangent(nodes, i, c.frame)
      const h = handleLength(a, b, ta)
      c1 = [a[0] + ta[0] * h, a[1] + ta[1] * h]
    }
    let c2: Type_Pt
    if (i === nodes.length - 2) c2 = c.p4
    else {
      const tb = passTangent(nodes, i + 1, c.frame)
      const h = handleLength(a, b, tb)
      c2 = [b[0] - tb[0] * h, b[1] - tb[1] * h]
    }
    for (let k = 1; k <= K; k++) {
      const t = k / K
      const mt = 1 - t
      out.push([
        mt * mt * mt * a[0] + 3 * mt * mt * t * c1[0] + 3 * mt * t * t * c2[0] + t * t * t * b[0],
        mt * mt * mt * a[1] + 3 * mt * mt * t * c1[1] + 3 * mt * t * t * c2[1] + t * t * t * b[1]
      ])
    }
  }
  out.push(c.p6)
  // Sommets confondus retirés (directions NaN dans les contours)
  const dedup: Type_Pt[] = [out[0]]
  for (let i = 1; i < out.length; i++) {
    const p = dedup[dedup.length - 1]
    if (Math.hypot(out[i][0] - p[0], out[i][1] - p[1]) > EPS) dedup.push(out[i])
  }
  return dedup
}

/** Tracé « trait » le long de la médiane. */
export function polylinePath(pts: Type_Pt[]): string {
  if (pts.length < 2) return ''
  let d = 'M ' + pts[0][0] + ',' + pts[0][1]
  for (let i = 1; i < pts.length; i++) d += ' L ' + pts[i][0] + ',' + pts[i][1]
  return d
}

/**
 * Contour fermé entre deux bords décalés de la médiane : bord a (offset a_src à la source,
 * a_tgt à la cible), bord b de même. Offsets interpolés à l'abscisse curviligne (flux
 * tapered, bandes). Le sens positif de la normale suit `transverse` (celui des bandes
 * paramétriques) : la normale est retournée en bloc si la corde la contredit.
 */
export function offsetBandPath(
  pts: Type_Pt[],
  a_src: number, a_tgt: number,
  b_src: number, b_tgt: number,
  transverse?: Type_Pt
): string {
  const n = pts.length
  if (n < 2) return ''
  const cum: number[] = [0]
  for (let i = 1; i < n; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
  const total = cum[n - 1] || 1
  const seg = (i: number): Type_Pt => norm(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1])
  let flip = 1
  if (transverse) {
    const chord = norm(pts[n - 1][0] - pts[0][0], pts[n - 1][1] - pts[0][1])
    if (-chord[1] * transverse[0] + chord[0] * transverse[1] < 0) flip = -1
  }
  const normals: Type_Pt[] = []
  const scales: number[] = []
  for (let i = 0; i < n; i++) {
    let d: Type_Pt
    if (i === 0) d = seg(0)
    else if (i === n - 1) d = seg(n - 2)
    else { const s0 = seg(i - 1), s1 = seg(i); d = norm(s0[0] + s1[0], s0[1] + s1[1]) }
    normals.push([-d[1] * flip, d[0] * flip])
    // Compensation de miter au sommet, bornée (évite les pics aux coudes serrés)
    let scale = 1
    if (i > 0 && i < n - 1) {
      const s1 = seg(i)
      const dot = Math.abs(-d[1] * -s1[1] + d[0] * s1[0])
      if (dot > 1e-3) scale = Math.min(3, 1 / dot)
    }
    scales.push(scale)
  }
  const edge = (off_src: number, off_tgt: number): Type_Pt[] => pts.map((p, i) => {
    const off = (off_src + (off_tgt - off_src) * (cum[i] / total)) * scales[i]
    return [p[0] + normals[i][0] * off, p[1] + normals[i][1] * off]
  })
  const a = edge(a_src, a_tgt)
  const b = edge(b_src, b_tgt)
  let d = 'M ' + a[0][0] + ',' + a[0][1]
  for (let i = 1; i < n; i++) d += ' L ' + a[i][0] + ',' + a[i][1]
  for (let i = n - 1; i >= 0; i--) d += ' L ' + b[i][0] + ',' + b[i][1]
  return d + ' Z'
}

/** Point au milieu (abscisse curviligne) d'une polyligne. */
export function polylineMidpoint(pts: Type_Pt[]): Type_Pt {
  let total = 0
  for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
  let half = total / 2
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0]
    const dy = pts[i][1] - pts[i - 1][1]
    const l = Math.hypot(dx, dy)
    if (l >= half) {
      const t = l > 0 ? half / l : 0
      return [pts[i - 1][0] + dx * t, pts[i - 1][1] + dy * t]
    }
    half -= l
  }
  return pts[pts.length - 1]
}
