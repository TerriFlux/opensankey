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
 * - `natural_earth` : la projection des atlas (Šavrič, Jenny, Patterson 2011), pseudo-cylindrique
 *   à méridiens courbes — ni l'aplatissement de la plate carrée ni le gonflement des pôles de
 *   Mercator. Ajoutée le 26/09/2026 pour la carte du MONDE de SOCLE (Julien : « la carte est
 *   étirée à l'horizontal », puis « pas Mercator ») : les deux premières sont faites pour un fond
 *   d'un pays, pas pour la planète. Polynômes de d3-geo (`naturalEarth1Raw`).
 */
export type Type_GeoProjection = 'mercator' | 'equirectangular' | 'natural_earth'

export const GEO_PROJECTIONS: readonly Type_GeoProjection[] = ['mercator', 'equirectangular', 'natural_earth'] as const

/** Natural Earth, φ en radians : le facteur qui multiplie λ pour donner x, et y lui-même. */
const naturalEarthX = (phi: number): number => {
  const phi2 = phi * phi
  const phi4 = phi2 * phi2
  return 0.8707 - 0.131979 * phi2 + phi4 * (-0.013791 + phi4 * (0.003971 * phi2 - 0.001529 * phi4))
}
const naturalEarthY = (phi: number): number => {
  const phi2 = phi * phi
  const phi4 = phi2 * phi2
  return phi * (1.007226 + phi2 * (0.015085 + phi4 * (-0.044475 + 0.028874 * phi2 - 0.005916 * phi4)))
}
/** dy/dφ, pour la réciproque par Newton. */
const naturalEarthDY = (phi: number): number => {
  const phi2 = phi * phi
  const phi4 = phi2 * phi2
  return 1.007226 + phi2 * (0.015085 * 3 + phi4 * (-0.044475 * 7 + 0.028874 * 9 * phi2 - 0.005916 * 11 * phi4))
}

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

/**
 * os#1364 (27/09/2026) — LA BOÎTE DE L'IMAGE, en pixels de la zone de dessin : là où le fond se
 * dessine, quoi que fasse le cadrage à la fenêtre. Sans elle, l'image suivait la taille de la
 * zone (que le cadrage recalcule) et s'étirait de 0,7 % : chaque arrivée tombait 12 px à gauche
 * de son pays sur SOCLE. Les points de calage sont des pixels de zone, l'image doit l'être aussi.
 */
export type Type_GeoImageBox = { x: number, y: number, width: number, height: number }

/**
 * Le calage complet d'un fond : la projection, les deux points qui l'ancrent, et la boîte où
 * l'image se dessine. `image` absente (fichiers du 10-11/09) : l'image suit la zone, comme avant.
 */
export type Type_GeoReference = {
  projection: Type_GeoProjection
  a: Type_GeoControlPoint
  b: Type_GeoControlPoint
  image?: Type_GeoImageBox
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
  if (projection === 'natural_earth') {
    const phi = latitude * DEG
    return { x: lon * naturalEarthX(phi), y: -naturalEarthY(phi) }
  }
  // Mercator : y = ln(tan(π/4 + φ/2)). Bornée, sinon un pôle rend ±Infinity et emporte tout le
  // calage avec lui (une seule coordonnée aberrante suffirait à faire disparaître la carte).
  const lat = Math.max(-MERCATOR_MAX_LAT, Math.min(MERCATOR_MAX_LAT, latitude)) * DEG
  return { x: lon, y: -Math.log(Math.tan(Math.PI / 4 + lat / 2)) }
}

/**
 * La transformation qui mène du plan projeté aux pixels : une SIMILITUDE — échelle, rotation,
 * translation. Écrite comme une multiplication complexe, `q = w·p + t`, parce que c'est ce
 * qu'elle est : `w` porte à la fois le facteur d'échelle (son module) et l'angle (son argument).
 *
 * POURQUOI UNE SIMILITUDE, ET PAS DEUX ÉCHELLES INDÉPENDANTES. Deux points donnent quatre
 * nombres, de quoi payer soit un facteur horizontal et un vertical distincts, soit une échelle
 * et une rotation. Ce ne sont pas des choix équivalents : deux échelles distinctes déforment —
 * les distances mentent selon la direction, les cercles deviennent des œufs, et ce n'est plus
 * une carte. La similitude, elle, ne déforme RIEN : elle envoie les cercles sur des cercles et
 * conserve tous les angles. C'est la transformation la plus riche qui reste une carte.
 *
 * POURQUOI UNE ROTATION, ALORS QU'ON ATTEND UNE CARTE DROITE. Parce qu'elle est GRATUITE et
 * qu'elle rend le calage EXACT sur les deux points. Sans elle, l'écart d'orientation entre le
 * segment terrestre et le segment dessiné n'est absorbé nulle part et se paie sur les deux
 * points à la fois : mesuré sur un calage Brest–Nice de 894 px, douze pixels de résidu chacun.
 * Avec elle, les deux points de calage tombent exactement où l'utilisateur les a mis — ce qui
 * est la moindre des choses, puisque c'est lui qui les a posés — et l'angle obtenu n'est jamais
 * qu'une conséquence de ce qu'il a dessiné : si son fond est légèrement de travers, la rotation
 * est la réponse JUSTE, pas un artefact.
 */
export type Type_GeoFit = { wx: number, wy: number, tx: number, ty: number }

export const fitGeoReference = (reference: Type_GeoReference): Type_GeoFit | null => {
  const { a, b, projection } = reference
  const pa = projectGeoPoint(a.latitude, a.longitude, projection)
  const pb = projectGeoPoint(b.latitude, b.longitude, projection)
  const dpx = pb.x - pa.x
  const dpy = pb.y - pa.y
  const dqx = b.x - a.x
  const dqy = b.y - a.y
  const denominator = dpx * dpx + dpy * dpy
  // Deux points confondus — sur la Terre, ou dans le dessin — ne disent rien d'une échelle.
  // Aucun calage plutôt qu'un calage arbitraire : le mode le signale, il ne l'invente pas.
  if (!isFinite(denominator) || denominator < 1e-24) return null
  if (!isFinite(dqx) || !isFinite(dqy) || Math.hypot(dqx, dqy) < 1e-9) return null
  // w = (q_b − q_a) / (p_b − p_a), en complexes.
  const wx = (dqx * dpx + dqy * dpy) / denominator
  const wy = (dqy * dpx - dqx * dpy) / denominator
  if (!isFinite(wx) || !isFinite(wy) || Math.hypot(wx, wy) < 1e-12) return null
  // t = q_a − w·p_a.
  return {
    wx,
    wy,
    tx: a.x - (wx * pa.x - wy * pa.y),
    ty: a.y - (wy * pa.x + wx * pa.y)
  }
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
  const image = readImageBox(json['image'])
  return {
    projection: GEO_PROJECTIONS.includes(projection as Type_GeoProjection)
      ? projection as Type_GeoProjection
      : 'mercator',
    a,
    b,
    ...(image ? { image } : {})
  }
}

/** La boîte de l'image, ou `null` si absente ou incomplète — une demi-boîte ne place rien. */
const readImageBox = (raw: unknown): Type_GeoImageBox | null => {
  if (raw === null || typeof raw !== 'object') return null
  const b = raw as { [key: string]: unknown }
  const num = (v: unknown) => (typeof v === 'number' && isFinite(v)) ? v : null
  const x = num(b['x']), y = num(b['y']), width = num(b['width']), height = num(b['height'])
  if (x === null || y === null || width === null || height === null || width <= 0 || height <= 0) return null
  return { x, y, width, height }
}

/**
 * Écrit un calage. Deux clés nommées `a` et `b` plutôt qu'une liste de points : `Type_JSON` refuse
 * les tableaux d'objets, et de toute façon ces deux points ne sont pas deux éléments d'une série —
 * chacun a son rôle dans le calage. La boîte de l'image voyage avec, quand elle existe.
 */
export const geoReferenceToJSON = (reference: Type_GeoReference) => {
  const point = (p: Type_GeoControlPoint) => ({ lat: p.latitude, lon: p.longitude, x: p.x, y: p.y })
  return {
    projection: reference.projection,
    a: point(reference.a),
    b: point(reference.b),
    ...(reference.image ? { image: { ...reference.image } } : {})
  }
}

/** Terre → pixels, une fois le calage établi. */
export const placeGeoPoint = (
  latitude: number,
  longitude: number,
  reference: Type_GeoReference,
  fit: Type_GeoFit
): Type_ProjectedPoint => {
  const p = projectGeoPoint(latitude, longitude, reference.projection)
  return {
    x: fit.tx + fit.wx * p.x - fit.wy * p.y,
    y: fit.ty + fit.wy * p.x + fit.wx * p.y
  }
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
  // p = (q − t) / w, en complexes.
  const qx = x - fit.tx
  const qy = y - fit.ty
  const modulus = fit.wx * fit.wx + fit.wy * fit.wy
  const px = (qx * fit.wx + qy * fit.wy) / modulus
  const py = (qy * fit.wx - qx * fit.wy) / modulus
  if (reference.projection === 'natural_earth') {
    // y(φ) n'a pas de réciproque fermée : Newton depuis φ = y, comme d3 (converge en quelques pas,
    // la fonction est monotone et presque linéaire sur ±90°).
    const y = -py
    let phi = y
    for (let i = 0; i < 25; i++) {
      const delta = (naturalEarthY(phi) - y) / naturalEarthDY(phi)
      phi -= delta
      if (Math.abs(delta) < 1e-12) break
    }
    return { latitude: phi / DEG, longitude: px / naturalEarthX(phi) / DEG }
  }
  const longitude = px / DEG
  if (reference.projection === 'equirectangular') return { latitude: -py / DEG, longitude }
  return { latitude: (2 * Math.atan(Math.exp(-py)) - Math.PI / 2) / DEG, longitude }
}
