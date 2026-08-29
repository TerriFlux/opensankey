import {
  shouldShowDimensionPositionMode,
  diagramDeclaresPositionReference,
  positionModeSelectorEnabled,
  positionModeSelectorEnabledFor,
  type Type_PositionModeCandidate,
  type Type_PositionModeHostApp
} from './positionModeHost'

// #370 — Le mode d'affichage est porté par chaque DIMENSION (échelle adaptée pour des
// unités, proportionnel pour des années) : un bouton à côté de chaque dimension, quel que
// soit son hôte. Remplace la règle du #367 (bouton unique en en-tête de section, bannières
// `sequence`/`topbar`/`none` exclues), qui laissait sans sélecteur un diagramme dont toutes
// les dimensions étaient en Séquence. Testé en isolation : aucune dépendance au rendu.

const group = (
  id: string,
  over: Partial<Type_PositionModeCandidate> = {}
): Type_PositionModeCandidate => ({
  id,
  banner: 'multi',
  tags_dict: { t1: {} },
  ...over
})

const dims = new Set<string>()
const isDim = (tagg: Type_PositionModeCandidate) => dims.has(tagg.id)

describe('#370 shouldShowDimensionPositionMode', () => {
  beforeEach(() => dims.clear())

  it('une dimension porte le sélecteur', () => {
    dims.add('annee')
    expect(shouldShowDimensionPositionMode(group('annee'), isDim, true)).toBe(true)
  })

  it('une dimension le porte QUELLE QUE SOIT sa bannière (régression #370)', () => {
    dims.add('sequence'); dims.add('topbar'); dims.add('cache')
    // Séquence : le cas du ticket — filtrée par la timeline, elle n'avait aucun sélecteur.
    expect(shouldShowDimensionPositionMode(group('sequence', { banner: 'sequence' }), isDim, true)).toBe(true)
    expect(shouldShowDimensionPositionMode(group('topbar', { banner: 'topbar' }), isDim, true)).toBe(true)
    expect(shouldShowDimensionPositionMode(group('cache', { banner: 'none' }), isDim, true)).toBe(true)
  })

  it('une étiquette (groupe non-dimension) ne le porte pas', () => {
    expect(shouldShowDimensionPositionMode(group('etiquette_flux'), isDim, true)).toBe(false)
  })

  it('une dimension sans tag ne le porte pas (rien à parcourir)', () => {
    dims.add('vide')
    expect(shouldShowDimensionPositionMode(group('vide', { tags_dict: {} }), isDim, true)).toBe(false)
    expect(shouldShowDimensionPositionMode(group('vide', { tags_dict: null }), isDim, true)).toBe(false)
  })

  it('le gate d’affichage (publish sans option toolbar) masque le sélecteur', () => {
    dims.add('annee')
    expect(shouldShowDimensionPositionMode(group('annee'), isDim, false)).toBe(false)
  })
})

// os#1366 — Le sélecteur de mode d'affichage manquait au VIEWER publié : il ne vivait que dans la
// barre d'outils de l'éditeur, qu'une publication ne charge pas. Ce n'est pas une régression mais
// une absence depuis la scission viewer/éditeur (os#1331). Un diagramme comme CARTOFOB DÉCLARE
// pourtant `scale_reference_by_viewtag` / `prop_reference_datatag` : il est configuré pour ces
// modes, et son lecteur ne pouvait pas y accéder.

describe('os#1366 diagramDeclaresPositionReference', () => {
  it('un datatag de reference declare (prop_reference_datatag) compte comme reference', () => {
    expect(diagramDeclaresPositionReference({ prop_reference_datatag_ids: ['dt_2020'] })).toBe(true)
  })

  it('un flux de reference d echelle par view tag compte comme reference', () => {
    expect(diagramDeclaresPositionReference({
      scale_reference_by_viewtag: { vt_chene: { link_id: 'l1', thickness: 12 } }
    })).toBe(true)
  })

  it('un diagramme sans aucune reference ne declare rien', () => {
    expect(diagramDeclaresPositionReference({})).toBe(false)
    expect(diagramDeclaresPositionReference({
      prop_reference_datatag_ids: [], scale_reference_by_viewtag: {}
    })).toBe(false)
    expect(diagramDeclaresPositionReference({
      prop_reference_datatag_ids: undefined, scale_reference_by_viewtag: null
    })).toBe(false)
  })
})

describe('os#1366 positionModeSelectorEnabled', () => {
  const REF = { prop_reference_datatag_ids: ['dt_2020'] }
  const NO_REF = {}
  const publish = (over: Partial<{ toolbar: boolean, position_mode_selector: boolean }> = {}) =>
    ({ toolbar: false, position_mode_selector: true, ...over })

  it('en edition le selecteur reste toujours propose (comportement inchange)', () => {
    expect(positionModeSelectorEnabled(false, publish(), NO_REF)).toBe(true)
    expect(positionModeSelectorEnabled(false, publish({ position_mode_selector: false }), NO_REF)).toBe(true)
  })

  it('en lecture un diagramme qui declare une reference propose le selecteur', () => {
    expect(positionModeSelectorEnabled(true, publish(), REF)).toBe(true)
  })

  it('en lecture un diagramme sans reference ne le propose pas (un selecteur inerte serait un piege)', () => {
    expect(positionModeSelectorEnabled(true, publish(), NO_REF)).toBe(false)
  })

  it('l auteur peut couper l apparition automatique par position_mode_selector', () => {
    expect(positionModeSelectorEnabled(true, publish({ position_mode_selector: false }), REF)).toBe(false)
  })

  it('l option toolbar reste l opt-in explicite, reference ou non (pages deja publiees)', () => {
    expect(positionModeSelectorEnabled(true, publish({ toolbar: true }), NO_REF)).toBe(true)
    expect(positionModeSelectorEnabled(true,
      publish({ toolbar: true, position_mode_selector: false }), NO_REF)).toBe(true)
  })
})

describe('os#1366 positionModeSelectorEnabledFor — lecture sur l application', () => {
  const app = (over: {
    is_static?: boolean
    toolbar?: boolean
    position_mode_selector?: boolean
    prop_ids?: string[]
    scale_ref?: { [k: string]: unknown }
  } = {}): Type_PositionModeHostApp => ({
    is_static: over.is_static ?? true,
    publish_options: {
      toolbar: over.toolbar ?? false,
      position_mode_selector: over.position_mode_selector ?? true,
    },
    drawing_area: {
      scale_reference_by_viewtag: over.scale_ref ?? {},
      nodePositioning: { proportionalReferenceDatatagIds: over.prop_ids },
    },
  })

  it('lit les deux references la ou elles vivent reellement', () => {
    expect(positionModeSelectorEnabledFor(app({ prop_ids: ['dt'] }))).toBe(true)
    expect(positionModeSelectorEnabledFor(app({ scale_ref: { vt: {} } }))).toBe(true)
    expect(positionModeSelectorEnabledFor(app())).toBe(false)
  })
})
