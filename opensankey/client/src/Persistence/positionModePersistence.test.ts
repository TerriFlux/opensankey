import { positionModeOnLoad } from './persistenceMigrations'
import { Class_ApplicationData } from '../types/ApplicationData'
import type { Type_JSON } from '../types/Utils'

// Regression guard for issue #369 — persistance du MODE D'AFFICHAGE global
// (`styles_dict['default'].shape_position_type` : absolu / proportionnel / échelle adaptée).
//
// Jusqu'ici (#1231) le mode était réputé « vue transitoire » et TOUT fichier se rechargeait en
// `absolute`. Découvert en traitant le #367 (le sélecteur était introuvable dans l'interface) :
// une fois le sélecteur accessible, « échelle adaptée » — seul moyen de garder une taille de
// diagramme constante d'un dataTag à l'autre — devait être re-choisi à chaque ouverture, et un
// diagramme publié partait toujours en absolu pour le lecteur.
//
// Correctif : les modes d'AFFICHAGE sont écrits (ils l'étaient déjà, via le style 'default')
// ET restitués — sélecteur sur le mode enregistré, changement de dataTag qui le suit — SANS que
// le premier rendu change le diagramme enregistré (arbitrage utilisateur du 2026-08-05).
// `parametric` (mode « écart » hérité, hors sélecteur) reste ramené à `absolute`.

function deepClone<T>(o: T): T {
  return JSON.parse(JSON.stringify(o)) as T
}

describe('#369 — positionModeOnLoad (décision pure au chargement)', () => {
  it('restitue les modes d\'affichage tels quels', () => {
    expect(positionModeOnLoad('proportional')).toBe('proportional')
    expect(positionModeOnLoad('scale_adapted')).toBe('scale_adapted')
    expect(positionModeOnLoad('absolute')).toBe('absolute')
  })

  it('ramène le mode hérité `parametric` à `absolute`', () => {
    // Le mode « écart » n'est pas proposé par le sélecteur et décide, au chargement, si u/v
    // font autorité : le restituer rendrait la mise en page illisible sans moyen d'en sortir.
    expect(positionModeOnLoad('parametric')).toBe('absolute')
  })

  it('ouvre en `absolute` un fichier sans l\'attribut (rétro-compatibilité)', () => {
    expect(positionModeOnLoad(undefined)).toBe('absolute')
    expect(positionModeOnLoad('')).toBe('absolute')
    expect(positionModeOnLoad('relative')).toBe('absolute')
    expect(positionModeOnLoad('mode_inconnu')).toBe('absolute')
  })
})

describe('#369 — round-trip du mode d\'affichage global', () => {
  const reload = (json: Type_JSON): Class_ApplicationData => {
    const app = new Class_ApplicationData(false)
    app.fromJSON(deepClone(json) as never, {}, false)
    return app
  }

  it('conserve « échelle adaptée » au save puis au load', () => {
    const app = new Class_ApplicationData(false)
    app.drawing_area.sankey.default_style.shape_position_type = 'scale_adapted'

    const json = app.toJSON() as Type_JSON
    // Le mode vit dans le style 'default' (il diffère du défaut usine `absolute` → sérialisé).
    const default_style_json = (json.style as Type_JSON)['default'] as Type_JSON
    expect(default_style_json['shape_position_type']).toBe('scale_adapted')

    expect(reload(json).drawing_area.sankey.default_style.shape_position_type).toBe('scale_adapted')
  })

  it('conserve le mode proportionnel au save puis au load', () => {
    const app = new Class_ApplicationData(false)
    app.drawing_area.sankey.default_style.shape_position_type = 'proportional'
    const json = app.toJSON() as Type_JSON
    expect((json.style as Type_JSON)['default'] as Type_JSON)
      .toHaveProperty('shape_position_type', 'proportional')
    expect(reload(json).drawing_area.sankey.default_style.shape_position_type).toBe('proportional')
  })

  it('ouvre en absolu un fichier sans l\'attribut', () => {
    const app = new Class_ApplicationData(false)
    const json = app.toJSON() as Type_JSON
    const default_style_json = (json.style as Type_JSON)['default'] as Type_JSON
    // Valeur usine : la clé n'est même pas écrite.
    expect(default_style_json?.['shape_position_type']).toBeUndefined()
    expect(reload(json).drawing_area.sankey.default_style.shape_position_type).toBe('absolute')
  })

  it('ouvre en absolu un fichier resté en mode hérité `parametric`', () => {
    const app = new Class_ApplicationData(false)
    app.drawing_area.sankey.default_style.shape_position_type = 'parametric'
    expect(reload(app.toJSON() as Type_JSON)
      .drawing_area.sankey.default_style.shape_position_type).toBe('absolute')
  })
})

describe('#369 — le mode restitué est ARMÉ, pas appliqué à l\'ouverture', () => {
  // Règle du premier rendu : le diagramme s'ouvre tel qu'il a été enregistré ; le mode ne se
  // fait sentir qu'au premier changement de dataTag. La suspension porte cette règle — sans
  // elle, le mode s'appliquerait dès le chargement, qui enchaîne plusieurs dessins.
  const reload = (json: Type_JSON): Class_ApplicationData => {
    const app = new Class_ApplicationData(false)
    app.fromJSON(deepClone(json) as never, {}, false)
    return app
  }
  const savedWithMode = (mode: string): Type_JSON => {
    const app = new Class_ApplicationData(false)
    app.drawing_area.sankey.default_style.shape_position_type = mode as never
    return app.toJSON() as Type_JSON
  }

  it('suspend le mode au chargement d\'un fichier en échelle adaptée', () => {
    expect(reload(savedWithMode('scale_adapted')).drawing_area.is_position_mode_suspended).toBe(true)
  })

  it('suspend le mode au chargement d\'un fichier en proportionnel', () => {
    expect(reload(savedWithMode('proportional')).drawing_area.is_position_mode_suspended).toBe(true)
  })

  it('ne suspend rien pour un fichier en absolu (rien à armer)', () => {
    const app = new Class_ApplicationData(false)
    expect(reload(app.toJSON() as Type_JSON).drawing_area.is_position_mode_suspended).toBe(false)
    // Idem pour le mode hérité, ramené à absolu.
    expect(reload(savedWithMode('parametric')).drawing_area.is_position_mode_suspended).toBe(false)
  })

  it('lève la suspension dès qu\'un mode est choisi explicitement', () => {
    const app = reload(savedWithMode('scale_adapted'))
    expect(app.drawing_area.is_position_mode_suspended).toBe(true)
    app.drawing_area.setAbsoluteMode()
    expect(app.drawing_area.is_position_mode_suspended).toBe(false)
  })
})

describe('#369 — échelle de référence du mode « échelle adaptée »', () => {
  // `user_scale` est l'échelle DÉJÀ adaptée au datatag courant (base × grandeur_courante /
  // grandeur_réf). Sans persistance du couple capturé, la relecture la prendrait pour échelle de
  // BASE et recomposerait le ratio au dessin suivant → le diagramme changerait de taille juste
  // après l'ouverture.
  it('écrit le couple (échelle de base, grandeur du diagramme) et le relit', () => {
    const app = new Class_ApplicationData(false)
    app.drawing_area.sankey.default_style.shape_position_type = 'scale_adapted'
    app.drawing_area.nodePositioning.restoreScaleReference(1234, 42)

    const json = app.toJSON() as Type_JSON
    expect(json['scale_adapted_ref_scale']).toBe(1234)
    expect(json['scale_adapted_ref_magnitude']).toBe(42)

    const app2 = new Class_ApplicationData(false)
    app2.fromJSON(deepClone(json) as never, {}, false)
    expect(app2.drawing_area.nodePositioning.scaleAdaptedReference)
      .toEqual({ scale: 1234, magnitude: 42 })
  })

  it('n\'écrit pas le couple hors du mode « échelle adaptée »', () => {
    const app = new Class_ApplicationData(false)
    app.drawing_area.nodePositioning.restoreScaleReference(1234, 42)
    const json = app.toJSON() as Type_JSON
    expect(json['scale_adapted_ref_scale']).toBeUndefined()
    expect(json['scale_adapted_ref_magnitude']).toBeUndefined()
  })

  it('laisse la capture paresseuse reprendre la main sur un fichier sans le couple', () => {
    // Fichier écrit avant #369 : le mode est là (il était déjà sérialisé), pas le couple.
    const app = new Class_ApplicationData(false)
    app.drawing_area.sankey.default_style.shape_position_type = 'scale_adapted'
    const json = app.toJSON() as Type_JSON
    expect(json['scale_adapted_ref_scale']).toBeUndefined()

    const app2 = new Class_ApplicationData(false)
    app2.fromJSON(deepClone(json) as never, {}, false)
    expect(app2.drawing_area.sankey.default_style.shape_position_type).toBe('scale_adapted')
    expect(app2.drawing_area.nodePositioning.scaleAdaptedReference).toBeUndefined()
  })

  it('#384 — ignore l\'ancienne clé `scale_adapted_ref_value` (valeur d\'un élément)', () => {
    // Un fichier écrit avant #384 porte une valeur d'ÉLÉMENT là où on attend désormais une
    // grandeur de diagramme. La relire composerait grandeur_courante / valeur_élément → saut
    // d'échelle à l'ouverture. Le renommage de la clé est ce qui l'évite : la capture paresseuse
    // reprend la main, ratio 1, échelle du fichier conservée.
    const app = new Class_ApplicationData(false)
    app.drawing_area.sankey.default_style.shape_position_type = 'scale_adapted'
    const json = app.toJSON() as Type_JSON
    json['scale_adapted_ref_scale'] = 1234
    json['scale_adapted_ref_value'] = 42

    const app2 = new Class_ApplicationData(false)
    app2.fromJSON(deepClone(json) as never, {}, false)
    expect(app2.drawing_area.nodePositioning.scaleAdaptedReference).toBeUndefined()
  })
})
