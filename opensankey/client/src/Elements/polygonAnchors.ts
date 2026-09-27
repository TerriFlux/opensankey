// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================

// os#1510 lot 3 — LE CONTOUR D'UN NŒUD EST UN POLYGONE, et les ancres se rangent dessus.
//
// Le lot 1 accrochait les flux sur un cercle. Sur une carte, le contour naturel d'un pays est sa
// frontière : les exportations partent de la côte ou de la frontière qui regarde leur destination
// (Julien : « utiliser tout le périmètre du pays »). Ce module dit tout ce qu'il faut savoir d'une
// polyligne fermée pour y poser des ancres : sa longueur, le point et la normale sortante à une
// abscisse curviligne donnée, et l'abscisse « en face » d'une direction.
//
// PUR — des points, rien d'autre. Le rangement des ancres sur le contour est celui du cercle
// (`allocateRadialSlots`) : une abscisse `s` sur une courbe de longueur `L` est un angle
// `2π·s/L` sur un cercle de rayon `L/2π`, et la contrainte « les arcs ne se recouvrent pas »
// est la même. C'est ce qui évite un second algorithme de rangement.

export type Type_Point = { x: number, y: number }

/** Une polyligne FERMÉE (le dernier point rejoint le premier), avec ses longueurs cumulées. */
export type Type_Contour = {
  points: Type_Point[]
  /** `cumul[i]` = longueur du contour du point 0 au point i ; `cumul[n]` = longueur totale. */
  cumul: number[]
  length: number
  /** +1 si le contour tourne dans le sens trigonométrique du repère écran (y vers le bas), −1 sinon. */
  orientation: 1 | -1
}

/** Prépare un contour : longueurs cumulées et sens de parcours. Rend `null` sous trois points. */
export const makeContour = (points: readonly Type_Point[]): Type_Contour | null => {
  const pts = points.filter((p, i) => i === 0 || Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y) > 1e-9)
  if (pts.length >= 2 && Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].y - pts[pts.length - 1].y) < 1e-9) pts.pop()
  if (pts.length < 3) return null
  const cumul = [0]
  let area2 = 0
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    cumul.push(cumul[i] + Math.hypot(b.x - a.x, b.y - a.y))
    area2 += a.x * b.y - b.x * a.y
  }
  const length = cumul[pts.length]
  if (!(length > 0)) return null
  return { points: pts, cumul, length, orientation: area2 >= 0 ? 1 : -1 }
}

/** Le point du contour à l'abscisse `s` (modulo la longueur). */
export const pointAt = (c: Type_Contour, s: number): Type_Point => {
  const { i, t } = locate(c, s)
  const a = c.points[i]
  const b = c.points[(i + 1) % c.points.length]
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}

/**
 * La normale SORTANTE (unitaire) du contour à l'abscisse `s` : perpendiculaire au segment,
 * tournée vers l'extérieur d'après le sens de parcours. Un flux ancré là part le long d'elle.
 */
export const outwardNormalAt = (c: Type_Contour, s: number): Type_Point => {
  const { i } = locate(c, s)
  const a = c.points[i]
  const b = c.points[(i + 1) % c.points.length]
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy) || 1
  // Repère écran (y vers le bas) : pour un parcours « trigonométrique » (aire signée positive),
  // l'intérieur est à gauche de la marche, donc l'extérieur à droite = (dy, −dx).
  const sign = c.orientation
  // `+ 0` : pas de −0, qui n'est pas égal à 0 pour qui compare des objets.
  return { x: sign * dy / len + 0, y: -sign * dx / len + 0 }
}

/**
 * L'ABSCISSE EN FACE D'UNE DIRECTION : là où le rayon parti du `centre` vers `direction` sort du
 * contour (la dernière traversée, pour un contour étoilé c'est la seule). Si le rayon ne le
 * traverse pas — centre hors du polygone, contour dégénéré —, on prend le sommet dont la
 * direction depuis le centre est la plus proche : une réponse, jamais une exception.
 */
export const facingAbscissa = (c: Type_Contour, centre: Type_Point, direction: Type_Point): number => {
  const dlen = Math.hypot(direction.x, direction.y)
  if (dlen < 1e-12) return 0
  const dx = direction.x / dlen
  const dy = direction.y / dlen
  let best_t = -1
  let best_s = -1
  const n = c.points.length
  for (let i = 0; i < n; i++) {
    const a = c.points[i]
    const b = c.points[(i + 1) % n]
    const ex = b.x - a.x
    const ey = b.y - a.y
    const denom = dx * ey - dy * ex
    if (Math.abs(denom) < 1e-12) continue
    // centre + t·d = a + u·e
    const ax = a.x - centre.x
    const ay = a.y - centre.y
    const t = (ax * ey - ay * ex) / denom
    const u = (ax * dy - ay * dx) / denom
    if (t >= 0 && u >= 0 && u <= 1 && t > best_t) {
      best_t = t
      best_s = c.cumul[i] + u * (c.cumul[i + 1] - c.cumul[i])
    }
  }
  if (best_s >= 0) return best_s
  let best_dot = -Infinity
  for (let i = 0; i < n; i++) {
    const px = c.points[i].x - centre.x
    const py = c.points[i].y - centre.y
    const plen = Math.hypot(px, py) || 1
    const dot = (px * dx + py * dy) / plen
    if (dot > best_dot) { best_dot = dot; best_s = c.cumul[i] }
  }
  return best_s
}

/** Le segment qui porte l'abscisse `s`, et la fraction parcourue dessus. */
const locate = (c: Type_Contour, s: number): { i: number, t: number } => {
  let u = s % c.length
  if (u < 0) u += c.length
  const n = c.points.length
  // Recherche dichotomique dans les longueurs cumulées (croissantes).
  let lo = 0
  let hi = n - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (c.cumul[mid] <= u) lo = mid
    else hi = mid - 1
  }
  const seg = c.cumul[lo + 1] - c.cumul[lo]
  return { i: lo, t: seg > 0 ? (u - c.cumul[lo]) / seg : 0 }
}
