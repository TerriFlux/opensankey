import { nodeLabelPassesThreshold, stockLabelPassesThreshold, hasActivePixelFilter } from './LabelFilters'

// #242 — Logique pure des seuils d'affichage, testée en isolation (extraite de DrawingArea).

describe('#242 nodeLabelPassesThreshold', () => {
  it("mode 'value' : passe si valeur >= seuil, sinon masqué", () => {
    expect(nodeLabelPassesThreshold('value', 0, 10, 5, 999, 1)).toBe(false)
    expect(nodeLabelPassesThreshold('value', 0, 10, 10, 999, 1)).toBe(true)
    expect(nodeLabelPassesThreshold('value', 0, 10, 15, 999, 1)).toBe(true)
  })

  it("mode 'value' : seuil <= 0 => jamais filtré", () => {
    expect(nodeLabelPassesThreshold('value', 0, 0, 0, 0, 1)).toBe(true)
  })

  it("mode 'pixel' : compare hauteur rendue × zoom au seuil px", () => {
    // height_px=20, zoom=2 => 40 px écran ; seuil 50 => masqué, seuil 30 => affiché
    expect(nodeLabelPassesThreshold('pixel', 50, 999, 999, 20, 2)).toBe(false)
    expect(nodeLabelPassesThreshold('pixel', 30, 999, 999, 20, 2)).toBe(true)
  })

  it("mode 'pixel' : seuil px <= 0 => jamais filtré (même si seuil valeur actif)", () => {
    expect(nodeLabelPassesThreshold('pixel', 0, 100, 1, 1, 1)).toBe(true)
  })
})

describe('#242 stockLabelPassesThreshold', () => {
  it('abs_value null => jamais masqué', () => {
    expect(stockLabelPassesThreshold('pixel', 999, 999, null, 0, 1)).toBe(true)
    expect(stockLabelPassesThreshold('value', 999, 999, null, 0, 1)).toBe(true)
  })

  it("mode 'value' : magnitude >= seuil", () => {
    expect(stockLabelPassesThreshold('value', 0, 10, 5, 0, 1)).toBe(false)
    expect(stockLabelPassesThreshold('value', 0, 10, 10, 0, 1)).toBe(true)
  })

  it("mode 'pixel' : hauteur rendue × zoom vs seuil px", () => {
    expect(stockLabelPassesThreshold('pixel', 50, 0, 999, 20, 2)).toBe(false)
    expect(stockLabelPassesThreshold('pixel', 30, 0, 999, 20, 2)).toBe(true)
  })
})

describe('#242 hasActivePixelFilter', () => {
  it("faux hors mode 'pixel'", () => {
    expect(hasActivePixelFilter('value', 5, 5, 5, 5)).toBe(false)
  })

  it("mode 'pixel' : vrai ssi au moins un seuil px > 0", () => {
    expect(hasActivePixelFilter('pixel', 0, 0, 0, 0)).toBe(false)
    expect(hasActivePixelFilter('pixel', 0, 0, 3, 0)).toBe(true)
    expect(hasActivePixelFilter('pixel', 1, 0, 0, 0)).toBe(true)
  })
})
