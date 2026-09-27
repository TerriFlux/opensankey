import { facingAbscissa, makeContour, outwardNormalAt, pointAt } from './polygonAnchors'

// Un carré de 100 de côté, parcouru dans le sens horaire À L'ÉCRAN (y vers le bas) : (0,0) → (100,0)
// → (100,100) → (0,100). Son aire signée est positive dans ce repère.
const square = makeContour([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }])!

describe('makeContour', () => {
  it('mesure la longueur et refuse un contour degenere', () => {
    expect(square.length).toBe(400)
    expect(square.cumul).toEqual([0, 100, 200, 300, 400])
    expect(makeContour([{ x: 0, y: 0 }, { x: 1, y: 1 }])).toBeNull()
  })

  it('retire le point de fermeture doublon', () => {
    const c = makeContour([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 10 }, { x: 0, y: 0 }])!
    expect(c.points.length).toBe(3)
  })
})

describe('pointAt / outwardNormalAt', () => {
  it('suit le contour, modulo sa longueur', () => {
    expect(pointAt(square, 50)).toEqual({ x: 50, y: 0 })
    expect(pointAt(square, 150)).toEqual({ x: 100, y: 50 })
    expect(pointAt(square, 450)).toEqual({ x: 50, y: 0 })
    expect(pointAt(square, -50)).toEqual({ x: 0, y: 50 })
  })

  it('rend la normale SORTANTE, quel que soit le sens de parcours', () => {
    // Haut du carre : dehors = vers le haut (y negatif).
    expect(outwardNormalAt(square, 50)).toEqual({ x: 0, y: -1 })
    // Cote droit : dehors = vers la droite.
    expect(outwardNormalAt(square, 150)).toEqual({ x: 1, y: 0 })
    const reversed = makeContour([{ x: 0, y: 0 }, { x: 0, y: 100 }, { x: 100, y: 100 }, { x: 100, y: 0 }])!
    // Meme carre a l envers : la premiere arete est le cote gauche, dehors = vers la gauche.
    expect(outwardNormalAt(reversed, 50)).toEqual({ x: -1, y: 0 })
  })
})

describe('facingAbscissa', () => {
  const centre = { x: 50, y: 50 }
  it('trouve la sortie du rayon vers l est, le sud, l ouest et le nord', () => {
    expect(facingAbscissa(square, centre, { x: 1, y: 0 })).toBeCloseTo(150, 9)
    expect(facingAbscissa(square, centre, { x: 0, y: 1 })).toBeCloseTo(250, 9)
    expect(facingAbscissa(square, centre, { x: -1, y: 0 })).toBeCloseTo(350, 9)
    expect(facingAbscissa(square, centre, { x: 0, y: -1 })).toBeCloseTo(50, 9)
  })

  it('en diagonale, tombe sur le coin', () => {
    expect(facingAbscissa(square, centre, { x: 1, y: 1 })).toBeCloseTo(200, 9)
  })

  it('centre hors du polygone : le sommet le mieux oriente, jamais une exception', () => {
    const s = facingAbscissa(square, { x: 500, y: 50 }, { x: 1, y: 0 })
    expect([100, 200]).toContain(s)
  })
})
