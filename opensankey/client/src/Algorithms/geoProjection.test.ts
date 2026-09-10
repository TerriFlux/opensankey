// os#1364 — Projeter, caler, replacer. Fonctions PURES : rien à monter, rien à simuler.

import {
  projectGeoPoint,
  fitGeoReference,
  placeGeoPoint,
  unplaceGeoPoint,
  geoReferenceFromJSON,
  geoReferenceToJSON,
  Type_GeoReference
} from './geoProjection'

// Deux points de calage réels, pris aux extrémités de la France métropolitaine : Brest et Nice.
// Des coordonnées vraies plutôt que des nombres ronds, parce que ce qu'on vérifie ici est
// justement que la chaîne tient sur des valeurs quelconques.
const BREST = { latitude: 48.39, longitude: -4.49, x: 100, y: 100 }
const NICE = { latitude: 43.70, longitude: 7.27, x: 900, y: 500 }
const reference: Type_GeoReference = { projection: 'mercator', a: BREST, b: NICE }

describe('projectGeoPoint', () => {
  it('rend une ordonnee qui croit vers le BAS, comme celle d un ecran', () => {
    const nord = projectGeoPoint(60, 0, 'mercator')
    const sud = projectGeoPoint(40, 0, 'mercator')
    expect(nord.y).toBeLessThan(sud.y)
  })

  it('rend une abscisse qui croit vers l EST', () => {
    expect(projectGeoPoint(45, 10, 'mercator').x)
      .toBeGreaterThan(projectGeoPoint(45, -10, 'mercator').x)
  })

  it('place l origine du repere sur le point de latitude et longitude nulles', () => {
    const zero = projectGeoPoint(0, 0, 'mercator')
    expect(zero.x).toBeCloseTo(0, 12)
    expect(zero.y).toBeCloseTo(0, 12)
  })

  it('borne Mercator au pole, la ou le logarithme part a l infini', () => {
    const pole = projectGeoPoint(90, 0, 'mercator')
    expect(isFinite(pole.y)).toBe(true)
    // Et la borne est bien atteinte des 86 degres, sans changer de valeur au-dela.
    expect(projectGeoPoint(86, 0, 'mercator').y).toBeCloseTo(pole.y, 12)
  })

  it('en plate carree, la latitude et la longitude sont les axes eux-memes', () => {
    const p = projectGeoPoint(30, 60, 'equirectangular')
    expect(p.x / p.y).toBeCloseTo(-2, 12)
  })

  it('les deux projections ne different que par l ordonnee', () => {
    const m = projectGeoPoint(45, 12, 'mercator')
    const e = projectGeoPoint(45, 12, 'equirectangular')
    expect(m.x).toBeCloseTo(e.x, 12)
    expect(m.y).not.toBeCloseTo(e.y, 3)
  })
})

describe('fitGeoReference', () => {
  it('respecte la DISTANCE entre les deux points de calage', () => {
    const fit = fitGeoReference(reference)!
    expect(fit).not.toBeNull()
    const a = placeGeoPoint(BREST.latitude, BREST.longitude, reference, fit)
    const b = placeGeoPoint(NICE.latitude, NICE.longitude, reference, fit)
    const voulue = Math.hypot(NICE.x - BREST.x, NICE.y - BREST.y)
    expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeCloseTo(voulue, 6)
  })

  it('cale le MILIEU des deux points, donc partage l erreur entre eux', () => {
    const fit = fitGeoReference(reference)!
    const a = placeGeoPoint(BREST.latitude, BREST.longitude, reference, fit)
    const b = placeGeoPoint(NICE.latitude, NICE.longitude, reference, fit)
    expect((a.x + b.x) / 2).toBeCloseTo((BREST.x + NICE.x) / 2, 6)
    expect((a.y + b.y) / 2).toBeCloseTo((BREST.y + NICE.y) / 2, 6)
    // Aucun des deux n est parfaitement juste, et c est voulu : la similitude sans rotation ne
    // peut pas absorber l ecart d orientation. Mais l erreur est BORNEE et partagee.
    const err_a = Math.hypot(a.x - BREST.x, a.y - BREST.y)
    const err_b = Math.hypot(b.x - NICE.x, b.y - NICE.y)
    expect(err_a).toBeCloseTo(err_b, 6)
  })

  it('garde UNE SEULE echelle pour les deux axes', () => {
    const fit = fitGeoReference(reference)!
    // Un degre de longitude a l equateur et le meme ecart projete en ordonnee doivent donner le
    // meme nombre de pixels : c est la definition d une echelle isotrope.
    const o = placeGeoPoint(0, 0, reference, fit)
    const est = placeGeoPoint(0, 1, reference, fit)
    const nord = projectGeoPoint(0, 0, 'mercator')
    const nord2 = projectGeoPoint(1, 0, 'mercator')
    const dy_projete = Math.abs(nord2.y - nord.y)
    const nord_px = placeGeoPoint(1, 0, reference, fit)
    expect(Math.abs(est.x - o.x) / (Math.PI / 180))
      .toBeCloseTo(Math.abs(nord_px.y - o.y) / dy_projete, 6)
  })

  it('refuse deux points confondus sur la Terre', () => {
    expect(fitGeoReference({ ...reference, b: { ...NICE, latitude: BREST.latitude, longitude: BREST.longitude } }))
      .toBeNull()
  })

  it('refuse deux points confondus dans le dessin', () => {
    expect(fitGeoReference({ ...reference, b: { ...NICE, x: BREST.x, y: BREST.y } })).toBeNull()
  })
})

describe('unplaceGeoPoint', () => {
  it('est la reciproque exacte de placeGeoPoint, dans les deux projections', () => {
    for (const projection of ['mercator', 'equirectangular'] as const) {
      const ref: Type_GeoReference = { ...reference, projection }
      const fit = fitGeoReference(ref)!
      for (const [lat, lon] of [[48.86, 2.35], [-33.87, 151.21], [0, 0], [64.14, -21.94]]) {
        const p = placeGeoPoint(lat, lon, ref, fit)
        const back = unplaceGeoPoint(p.x, p.y, ref, fit)
        expect(back.latitude).toBeCloseTo(lat, 8)
        expect(back.longitude).toBeCloseTo(lon, 8)
      }
    }
  })
})

describe('lecture et ecriture du calage', () => {
  it('fait un aller-retour fidele', () => {
    const relu = geoReferenceFromJSON(geoReferenceToJSON(reference))
    expect(relu).toEqual(reference)
  })

  it('rend null sur tout ce qui n est pas un calage complet', () => {
    expect(geoReferenceFromJSON(undefined)).toBeNull()
    expect(geoReferenceFromJSON(null)).toBeNull()
    expect(geoReferenceFromJSON('mercator')).toBeNull()
    expect(geoReferenceFromJSON({})).toBeNull()
    expect(geoReferenceFromJSON({ projection: 'mercator', a: geoReferenceToJSON(reference).a })).toBeNull()
  })

  it('rend null si une coordonnee est aberrante, plutot qu un demi-calage', () => {
    const json = geoReferenceToJSON(reference) as { [k: string]: unknown }
    expect(geoReferenceFromJSON({ ...json, a: { lat: 900, lon: 0, x: 0, y: 0 } })).toBeNull()
    expect(geoReferenceFromJSON({ ...json, a: { lat: 48, lon: 0, x: 'ici', y: 0 } })).toBeNull()
  })

  it('se replie sur Mercator quand la projection nommee est inconnue', () => {
    const json = geoReferenceToJSON(reference) as { [k: string]: unknown }
    expect(geoReferenceFromJSON({ ...json, projection: 'lambert93' })?.projection).toBe('mercator')
  })
})
