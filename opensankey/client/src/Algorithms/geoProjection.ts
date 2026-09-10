// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================

// os#1364 (jalon 79, D3) — PROJETER, PUIS CALER. Les deux moitiés du chemin qui mène d'une
// latitude/longitude à un pixel de la zone de dessin, écrites en fonctions PURES : aucune
// instance du modèle, aucun DOM, aucune dépendance.
//
// POURQUOI PAS `d3-geo`. Ce qu'il nous faudrait de lui tient en quinze lignes d'arithmétique
// qu'on peut lire et tester ici même, là où il apporterait un module de plus à installer — et
// les `node_modules` de ce dépôt sont partagés entre l'arbre principal et les worktrees, si bien
// qu'ajouter une dépendance n'est pas un geste local. Le jour où il faudra de vraies géométries
// de territoires (GeoJSON, découpages, `geoPath`), la question se reposera entière et se
// tranchera avec elles ; pour poser des points sur une image, non.
//
// LE PARTAGE DES RÔLES, qui est tout le dessin de ce fichier :
//   - la PROJECTION décide de la forme du monde (ce qui est droit, ce qui est déformé) ;
//   - le CALAGE décide seulement où ce monde tombe dans la case et à quelle taille.
// Changer de projection change la première et laisse la seconde se réajuster ; déplacer le fond
// ne touche que la seconde. Ils ne se mélangent jamais.

/**
 * Les deux projections offertes, choisies pour ce qu'on rencontre réellement comme fond d'image.
 *
 * - `mercator` : la projection des cartes en ligne (Web Mercator / EPSG:3857). C'est celle de
 *   toute capture d'écran d'un fond cartographique du commerce, donc le défaut.
 * - `equirectangular` : la « plate carrée » (EPSG:4326), où la longitude EST l'abscisse et la
 *   latitude l'ordonnée, sans déformation. C'est celle des fonds tracés à partir d'une grille
 *   lat/lon, et le repli le plus sûr quand on ignore d'où vient l'image : sur l'étendue d'un
 *   pays, l'écart entre les deux se compte en fractions de pour cent une fois le calage fait.
 */
export type Type_GeoProjection = 'mercator' | 'equirectangular'

export const GEO_PROJECTIONS: readonly Type_GeoProjection[] = ['mercator', 'equirectangular'] as const

/** Un point du plan projeté — sans unité : seul le calage lui en donnera une. */
export type Type_ProjectedPoint = { x: number, y: number }

/**
 * Un point de calage : une coordonnée terrestre dont on sait OÙ elle tombe dans le dessin.
 * L'utilisateur en pose deux sur son fond de carte, et tout le reste s'en déduit.
 */
export type Type_GeoControlPoint = {
  /** Degrés décimaux, WGS 84. */
  latitude: number
  longitude: number
  /** Pixels de la zone de dessin. */
  x: number
  y: number
}

/** Le calage complet d'un fond : la projection, et les deux points qui l'ancrent. */
export type Type_GeoReference = {
  projection: Type_GeoProjection
  a: Type_GeoControlPoint
  b: Type_GeoControlPoint
}

// Latitude au-delà de laquelle Mercator part à l'infini. La borne de Web Mercator, qui rend le
// monde carré ; au-delà il n'y a de toute façon pas de fond de carte à caler.
const MERCATOR_MAX_LAT = 85.0511287798
const DEG = Math.PI / 180

/**
 * Terre → plan, en unités arbitraires (des radians, en pratique). L'ordonnée est déjà retournée
 * — elle CROÎT VERS LE BAS, comme celle d'un écran —, pour que le calage n'ait plus qu'à
 * multiplier et translater : lui faire porter en plus un changement de sens serait le lieu rêvé
 * d'une erreur de signe qui ne se verrait que sur l'hémisphère sud.
 */
export const projectGeoPoint = (
  latitude: number,
  longitude: number,
  projection: Type_GeoProjection
): Type_ProjectedPoint => {
  const lon = longitude * DEG
  if (projection === 'equirectangular') {
    return { x: lon, y: -latitude * DEG }
  }
  // Mercator : y = ln(tan(π/4 + φ/2)). Bornée, sinon un pôle rend ±Infinity et emporte tout le
  // calage avec lui (une seule coordonnée aberrante suffirait à faire disparaître la carte).
  const lat = Math.max(-MERCATOR_MAX_LAT, Math.min(MERCATOR_MAX_LAT, latitude)) * DEG
  return { x: lon, y: -Math.log(Math.tan(Math.PI / 4 + lat / 2)) }
}

/**
 * La transformation affine qui mène du plan projeté aux pixels : une échelle et une origine.
 *
 * UNE SEULE ÉCHELLE POUR LES DEUX AXES, et c'est délibéré. Deux points donnent quatre nombres,
 * de quoi payer un facteur horizontal et un vertical distincts — mais une carte dont l'abscisse
 * et l'ordonnée n'ont pas la même échelle n'est plus une carte : les distances y mentent selon
 * la direction, et les cercles deviennent des œufs. On prend donc l'échelle qui fait coïncider
 * la DISTANCE entre les deux points, et l'origine qui recentre leur MILIEU. Chacun des deux
 * points tombe alors à mi-chemin de son erreur, plutôt que l'un juste et l'autre faux.
 */
export type Type_GeoFit = { scale: number, origin_x: number, origin_y: number }

export const fitGeoReference = (reference: Type_GeoReference): Type_GeoFit | null => {
  const { a, b, projection } = reference
  const pa = projectGeoPoint(a.latitude, a.longitude, projection)
  const pb = projectGeoPoint(b.latitude, b.longitude, projection)
  const projected_span = Math.hypot(pb.x - pa.x, pb.y - pa.y)
  const drawn_span = Math.hypot(b.x - a.x, b.y - a.y)
  // Deux points confondus — sur la Terre ou dans le dessin — ne disent rien d'une échelle.
  // Aucun calage plutôt qu'un calage arbitraire : le mode le signale, il ne l'invente pas.
  if (!isFinite(projected_span) || !isFinite(drawn_span) ||
    projected_span < 1e-12 || drawn_span < 1e-9) return null
  const scale = drawn_span / projected_span
  // L'origine cale le MILIEU des deux points, pas le premier : l'erreur résiduelle (l'écart
  // d'orientation entre le segment terrestre et le segment dessiné, que la similitude sans
  // rotation ne peut pas absorber) se partage ainsi entre les deux au lieu de s'accumuler sur
  // le second.
  const origin_x = (a.x + b.x) / 2 - scale * (pa.x + pb.x) / 2
  const origin_y = (a.y + b.y) / 2 - scale * (pa.y + pb.y) / 2
  return { scale, origin_x, origin_y }
}

// ==================================================================================================
// Persistance — sur le patron de `originFromJSON` / `unitaryProcessFromJSON` : le type sait se lire
// et s'écrire lui-même, la couche de persistance ne fait que l'appeler.
// ==================================================================================================

const readCoordinate = (raw: unknown, bound: number): number | null => {
  const value = typeof raw === 'number' ? raw : Number(raw)
  return (typeof raw !== 'number' && typeof raw !== 'string') ||
    !isFinite(value) || value < -bound || value > bound ? null : value
}

const readPoint = (raw: unknown): Type_GeoControlPoint | null => {
  if (raw === null || typeof raw !== 'object') return null
  const p = raw as { [key: string]: unknown }
  const latitude = readCoordinate(p['lat'], 90)
  const longitude = readCoordinate(p['lon'], 180)
  const x = typeof p['x'] === 'number' && isFinite(p['x']) ? p['x'] : null
  const y = typeof p['y'] === 'number' && isFinite(p['y']) ? p['y'] : null
  if (latitude === null || longitude === null || x === null || y === null) return null
  return { latitude, longitude, x, y }
}

/**
 * Lit un calage, ou rend `null`. **TOUT OU RIEN**, et c'est la seule politique tenable : un calage
 * amputé d'un point, ou porteur d'une coordonnée absurde, poserait les nœuds n'importe où sans que
 * rien ne l'explique à l'écran, alors que « pas de calage » est un état que le mode géographique
 * sait déjà traiter — il ne déplace alors personne, et le diagramme reste lisible.
 */
export const geoReferenceFromJSON = (raw: unknown): Type_GeoReference | null => {
  if (raw === null || typeof raw !== 'object') return null
  const json = raw as { [key: string]: unknown }
  const a = readPoint(json['a'])
  const b = readPoint(json['b'])
  if (a === null || b === null) return null
  const projection = json['projection']
  return {
    projection: GEO_PROJECTIONS.includes(projection as Type_GeoProjection)
      ? projection as Type_GeoProjection
      : 'mercator',
    a,
    b
  }
}

/**
 * Écrit un calage. Deux clés nommées `a` et `b` plutôt qu'une liste de points : `Type_JSON` refuse
 * les tableaux d'objets, et de toute façon ces deux points ne sont pas deux éléments d'une série —
 * chacun a son rôle dans le calage.
 */
export const geoReferenceToJSON = (reference: Type_GeoReference) => {
  const point = (p: Type_GeoControlPoint) => ({ lat: p.latitude, lon: p.longitude, x: p.x, y: p.y })
  return { projection: reference.projection, a: point(reference.a), b: point(reference.b) }
}

/** Terre → pixels, une fois le calage établi. */
export const placeGeoPoint = (
  latitude: number,
  longitude: number,
  reference: Type_GeoReference,
  fit: Type_GeoFit
): Type_ProjectedPoint => {
  const p = projectGeoPoint(latitude, longitude, reference.projection)
  return { x: fit.origin_x + fit.scale * p.x, y: fit.origin_y + fit.scale * p.y }
}

/**
 * Pixels → Terre : la réciproque exacte de `placeGeoPoint`. Elle sert à la SAISIE — poser un
 * point de calage en cliquant, lire la coordonnée d'un nœud qu'on vient de déplacer à la main —
 * et c'est ce qui rend le mode réversible plutôt que subi.
 */
export const unplaceGeoPoint = (
  x: number,
  y: number,
  reference: Type_GeoReference,
  fit: Type_GeoFit
): { latitude: number, longitude: number } => {
  const px = (x - fit.origin_x) / fit.scale
  const py = (y - fit.origin_y) / fit.scale
  const longitude = px / DEG
  if (reference.projection === 'equirectangular') return { latitude: -py / DEG, longitude }
  return { latitude: (2 * Math.atan(Math.exp(-py)) - Math.PI / 2) / DEG, longitude }
}
