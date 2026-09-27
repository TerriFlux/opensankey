// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================

// os#1510 — L'ANCRAGE RADIAL : les flux d'un nœud se rangent sur son CONTOUR, à l'angle de leur
// cible, au lieu de s'empiler sur l'un de ses quatre côtés.
//
// Julien, sur la carte SOCLE (os#1364) : « il faudrait un moyen d'utiliser tout le périmètre du
// pays pour faire les départs de flux, et que le départ ne soit pas horizontal mais avec un
// angle : ça permettrait de faire partir beaucoup plus de gros flux ». Un côté n'offre que la
// hauteur du nœud, et tous ses départs sont parallèles ; un contour offre 2πR, dans toutes les
// directions à la fois.
//
// Ce module est PUR — ni instance, ni DOM — et c'est le pendant radial d'`ioOrderGeometry` :
// il ne connaît que des angles et des épaisseurs. Le nœud lui donne l'azimut de chaque cible
// et récupère, pour chaque flux, l'angle où poser son ancre sur le cercle. Le contour est un
// cercle à ce lot ; le polygone d'un territoire viendra par la même porte (une abscisse
// curviligne à la place d'un angle).

/**
 * Un flux à ranger : l'azimut de sa cible (radians, repère écran), son épaisseur en px et,
 * facultatif, le DÉPARTAGE des flux visés au même endroit (`tie`, comparé terme à terme, croissant
 * = angle croissant). Sans lui, deux flux de même azimut gardaient l'ordre du dictionnaire — et se
 * croisaient en route quand leur cible les rangeait autrement (Julien, 27/09/2026, sur les bandes
 * des flux éclatés : « les flux ne se dessinent pas parallèlement »).
 */
export type Type_RadialItem = { id: string, angle: number, thickness: number, tie?: readonly number[] }

/** Comparaison terme à terme de deux départages ; un départage absent vaut zéro. */
const compareTies = (a: readonly number[] | undefined, b: readonly number[] | undefined): number => {
  const n = Math.max(a?.length ?? 0, b?.length ?? 0)
  for (let k = 0; k < n; k++) {
    const d = (a?.[k] ?? 0) - (b?.[k] ?? 0)
    if (d !== 0) return d
  }
  return 0
}

const TWO_PI = 2 * Math.PI

/** Ramène un angle dans [−π, π). */
export const wrapAngle = (a: number): number => {
  let r = (a + Math.PI) % TWO_PI
  if (r < 0) r += TWO_PI
  return r - Math.PI
}

/**
 * LE RAYON DU CONTOUR : assez grand pour que toutes les épaisseurs tiennent bout à bout, avec
 * un peu d'air entre elles (`gap_factor`), et jamais plus petit que ce que le nœud demande.
 *
 * C'est le nœud qui grandit avec ses flux, comme un nœud à côtés grandit en hauteur : la
 * circonférence est sa « hauteur » dans toutes les directions.
 */
export const radialRadius = (
  items: readonly Type_RadialItem[],
  min_radius: number,
  gap_factor: number = 1.15
): number => {
  const total = items.reduce((sum, it) => sum + Math.max(0, it.thickness), 0)
  return Math.max(min_radius, total * gap_factor / TWO_PI)
}

/**
 * RÉGRESSION ISOTONE (non décroissante, poids unitaires) par « pool adjacent violators » :
 * la suite la plus proche de `z` (au sens des moindres carrés) qui ne redescend jamais. O(n).
 */
const isotonicNonDecreasing = (z: readonly number[]): number[] => {
  const blocks: { sum: number, count: number }[] = []
  for (const v of z) {
    blocks.push({ sum: v, count: 1 })
    // Tant que le dernier bloc passe sous le précédent, on les fusionne (leur moyenne commune).
    while (blocks.length >= 2) {
      const a = blocks[blocks.length - 2]
      const b = blocks[blocks.length - 1]
      if (a.sum / a.count <= b.sum / b.count) break
      blocks.pop()
      blocks[blocks.length - 1] = { sum: a.sum + b.sum, count: a.count + b.count }
    }
  }
  const out: number[] = []
  blocks.forEach(b => { for (let k = 0; k < b.count; k++) out.push(b.sum / b.count) })
  return out
}

/**
 * OÙ POSER CHAQUE ANCRE SUR LE CERCLE : au plus près de l'azimut de sa cible, sans que deux arcs
 * voisins se recouvrent.
 *
 * Chaque flux occupe un arc de longueur = son épaisseur, centré sur son angle. L'ORDRE est celui
 * des azimuts (c'est ce qui évite les croisements au départ) ; reste à choisir les angles. Sur
 * une ligne, « au plus près des idéaux, à écart minimal imposé entre voisins » est un problème
 * classique : en retranchant à chaque idéal la somme des écarts requis avant lui, la contrainte
 * devient « suite non décroissante » et la solution exacte est une régression isotone (PAV),
 * en O(n). Les flux visés au même endroit se retrouvent ainsi étalés SYMÉTRIQUEMENT autour de
 * leur cible commune — le résultat qu'on attend, sans relaxation ni nombre de passes à régler.
 *
 * Le cercle se ramène à la ligne en le COUPANT au plus grand trou entre deux azimuts voisins :
 * c'est là qu'il y a le moins de raison que deux flux se disputent la place à travers la
 * coupure. Si malgré tout le dernier mord sur le premier (contour presque plein), on répartit
 * l'air restant à parts égales — un rangement régulier vaut mieux qu'un recouvrement.
 *
 * Si la somme des arcs dépasse la circonférence, on range quand même (les arcs se recouvrent
 * un peu) : c'est au rayon (`radialRadius`) d'éviter ce cas, pas à cette fonction d'inventer
 * de la place.
 */
export const allocateRadialSlots = (
  items: readonly Type_RadialItem[],
  radius: number
): Map<string, number> => {
  const out = new Map<string, number>()
  if (items.length === 0 || radius <= 0) return out
  const sorted = items
    .map(it => ({ id: it.id, ideal: wrapAngle(it.angle), half: Math.max(0, it.thickness) / (2 * radius), tie: it.tie }))
    .sort((a, b) => (a.ideal - b.ideal) || compareTies(a.tie, b.tie))
  const n = sorted.length
  if (n === 1) { out.set(sorted[0].id, sorted[0].ideal); return out }

  // La coupure : après le plus grand trou entre azimuts voisins (tour complet compris).
  let cut = 0
  let widest = -1
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    let gap = sorted[j].ideal - sorted[i].ideal
    if (j === 0) gap += TWO_PI
    if (gap > widest) { widest = gap; cut = j }
  }
  // La ligne : les idéaux déroulés à partir de la coupure, croissants (au-delà de π s'il faut).
  const line = Array.from({ length: n }, (_, k) => sorted[(cut + k) % n])
  const ideals: number[] = []
  line.forEach((it, k) => {
    let a = it.ideal
    if (k > 0 && a < ideals[k - 1]) a += TWO_PI
    ideals.push(a)
  })
  // Écart requis avant chaque flux : la moitié du précédent plus la sienne.
  const before: number[] = [0]
  for (let k = 1; k < n; k++) before.push(before[k - 1] + line[k - 1].half + line[k].half)
  const y = isotonicNonDecreasing(ideals.map((a, k) => a - before[k]))
  let angles = y.map((v, k) => v + before[k])

  // Le tour complet : le dernier ne doit pas mordre sur le premier.
  const total_arc = line.reduce((s, it) => s + 2 * it.half, 0)
  const wrap_gap = angles[0] + TWO_PI - angles[n - 1]
  if (wrap_gap < line[n - 1].half + line[0].half - 1e-9 && total_arc < TWO_PI) {
    const slack = (TWO_PI - total_arc) / n
    const start = angles[0]
    angles = line.map((_, k) => start + before[k] + k * slack)
  }
  line.forEach((it, k) => out.set(it.id, wrapAngle(angles[k])))
  return out
}
