// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================

// os#1364 — LA CARTE ÉCLATÉE. Julien (29/09/2026), devant une carte des déplacements de l'Isère où
// chaque territoire est détaché de ses voisins : « il faudrait un mode où chaque pays ou continent
// est pris indépendamment et placé autour de la France, à une certaine distance, mais dans la bonne
// direction, et qui laisse la place pour dessiner les flux ».
//
// Sur une vraie carte, les flux vers les voisins n'ont pas de place (Belgique, Pays-Bas collés à la
// France) et ceux vers le bout du monde en ont trop. Ici chaque territoire garde sa FORME et sa
// DIRECTION vue du centre ; sa DISTANCE est comprimée (logarithme : l'ordre reste, les voisins
// s'écartent, les lointains se rapprochent) et sa TAILLE est bornée (un micro-État reste visible, un
// continent ne mange pas le dessin). Deux territoires qui se chevauchent s'écartent d'abord en
// ANGLE — la direction reste à peu près juste —, puis en distance.
//
// Pur : des points et des rayons en pixels entrent, des points et des facteurs d'échelle sortent.
// `NodePositioningGeographic` choisit qui s'éclate et applique le résultat aux nœuds.

export type Type_ExplodeItem = {
  id: string
  /** Point projeté du territoire (son centre visuel), en pixels. */
  x: number
  y: number
  /** Rayon de son emprise à l'échelle de la carte (contour ou taille du nœud), en pixels. */
  radius: number
  /** Vrai si l'emprise peut être mise à l'échelle (un contour) ; faux pour un nœud sans territoire. */
  scalable: boolean
}

export type Type_ExplodePlacement = { x: number, y: number, scale: number }

export type Type_ExplodeOptions = {
  /** Rayon de l'emprise du centre (le territoire qui reste en place), en pixels. */
  centre_radius: number
  /** Distance d'affichage maximale au centre, en pixels. */
  max_distance: number
}

const TAU = Math.PI * 2

/**
 * Place chaque territoire autour de `centre`.
 *
 * - DISTANCE : `d` (réelle, en pixels de carte) devient `R_min + (R_max − R_min) · ln(1 + d/d0) /
 *   ln(1 + d_max/d0)`, jamais moins que ce qu'il faut pour ne pas toucher le centre.
 * - TAILLE : l'emprise est ramenée dans [r_lo, r_hi], proportions gardées.
 * - CHEVAUCHEMENTS : relaxation — chaque paire trop proche s'écarte en angle, au prorata des tailles,
 *   et la plus petite recule un peu ; jusqu'à ce que plus rien ne se touche.
 */
export const explodeAround = (
  centre: { x: number, y: number },
  items: readonly Type_ExplodeItem[],
  options: Type_ExplodeOptions
): { placements: Map<string, Type_ExplodePlacement>, centre_scale: number } => {
  const out = new Map<string, Type_ExplodePlacement>()
  if (items.length === 0) return { placements: out, centre_scale: 1 }
  const rc0 = Math.max(options.centre_radius, 1)
  const r_max_display = Math.max(options.max_distance, rc0 * 3)
  const r_lo = 0.035 * r_max_display
  const r_hi = 0.09 * r_max_display
  // LE CENTRE À LA MÊME ÉCHELLE QUE LES AUTRES : ses voisins sont agrandis jusqu'à `r_lo`, il l'est
  // jusqu'à `r_hi` — sinon la France paraît plus petite que la Belgique posée à côté.
  const centre_scale = Math.max(1, r_hi / rc0)
  const rc = rc0 * centre_scale
  const gap = Math.max(0.015 * r_max_display, 4)
  const R_min = rc + Math.max(1.2 * rc, 3 * r_hi)
  const R_max = Math.max(r_max_display, R_min * 1.5)

  const dist = items.map(it => Math.hypot(it.x - centre.x, it.y - centre.y))
  const d_max = Math.max(...dist, 1)
  const d0 = Math.max(d_max / 30, 1)
  const norm = Math.log1p(d_max / d0)

  const state = items.map((it, i) => {
    const r = it.scalable ? Math.min(Math.max(it.radius, r_lo), r_hi) : it.radius
    const scale = it.scalable && it.radius > 0 ? r / it.radius : 1
    const t = norm > 0 ? Math.log1p(dist[i] / d0) / norm : 0
    return {
      id: it.id,
      a: Math.atan2(it.y - centre.y, it.x - centre.x),
      R: Math.max(R_min + (R_max - R_min) * t, rc + r + gap),
      r,
      scale
    }
  })

  // Relaxation : en angle d'abord (au prorata des tailles), la plus petite recule un peu.
  for (let iter = 0; iter < 500; iter++) {
    let moved = false
    for (let i = 0; i < state.length; i++) {
      for (let j = i + 1; j < state.length; j++) {
        const p = state[i], q = state[j]
        const dx = p.R * Math.cos(p.a) - q.R * Math.cos(q.a)
        const dy = p.R * Math.sin(p.a) - q.R * Math.sin(q.a)
        const overlap = p.r + q.r + gap - Math.hypot(dx, dy)
        if (overlap <= 0) continue
        moved = true
        let delta = q.a - p.a
        delta = ((delta + Math.PI) % TAU + TAU) % TAU - Math.PI
        const side = delta >= 0 ? 1 : -1
        const da = 0.3 * overlap / Math.max(p.R, q.R)
        const w = p.r + q.r
        p.a -= side * da * q.r / w
        q.a += side * da * p.r / w
        const small = p.r <= q.r ? p : q
        small.R += 0.15 * overlap
      }
    }
    if (!moved) break
  }

  state.forEach(s => out.set(s.id, {
    x: centre.x + s.R * Math.cos(s.a),
    y: centre.y + s.R * Math.sin(s.a),
    scale: s.scale
  }))
  return { placements: out, centre_scale }
}

/** Distance orthodromique en kilomètres entre deux points (lat/lon en degrés). */
export const greatCircleKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const rad = Math.PI / 180
  const dlat = (lat2 - lat1) * rad
  const dlon = (lon2 - lon1) * rad
  const h = Math.sin(dlat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dlon / 2) ** 2
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)))
}

/**
 * QUI S'ÉCLATE. Reste en place ce qui est AU centre (moins de 50 km : le concentrateur posé sur la
 * France) et ce qui, sans territoire, en est proche (moins de 800 km : les produits rangés en
 * anneaux autour de la France). S'éclate tout le reste : chaque territoire, et chaque lieu lointain
 * sans contour (une région, un continent).
 */
export const isExploded = (distance_km: number, has_territory: boolean): boolean =>
  distance_km > 50 && (has_territory || distance_km > 800)
