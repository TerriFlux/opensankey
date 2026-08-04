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
// Correctif : « échelle adaptée » est écrite (elle l'était déjà, via le style 'default') ET
// restituée. Les autres modes restent ramenés à `absolute` : `proportional` (arbitrage
// utilisateur du 2026-08-05 — le mode ne persiste pas son cadre de référence, le restituer ne
// rouvrirait donc pas le fichier tel qu'il a été enregistré) et `parametric` (mode « écart »
// hérité, hors sélecteur).

function deepClone<T>(o: T): T {
  return JSON.parse(JSON.stringify(o)) as T
}

describe('#369 — positionModeOnLoad (décision pure au chargement)', () => {
  it('restitue « échelle adaptée »', () => {
    expect(positionModeOnLoad('scale_adapted')).toBe('scale_adapted')
    expect(positionModeOnLoad('absolute')).toBe('absolute')
  })

  it('ramène le mode proportionnel à `absolute`', () => {
    // Le mode % ne persiste pas son cadre de référence : le restituer le ferait re-capturer sur
    // la géométrie du fichier, donc rouvrir le diagramme AUTREMENT qu'enregistré.
    expect(positionModeOnLoad('proportional')).toBe('absolute')
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

  it('ouvre en absolu un fichier enregistré en mode proportionnel', () => {
    // Le mode est bien ÉCRIT (il diffère du défaut usine) — c'est la RELECTURE qui le ramène
    // à l'absolu, faute de cadre de référence persisté.
    const app = new Class_ApplicationData(false)
    app.drawing_area.sankey.default_style.shape_position_type = 'proportional'
    const json = app.toJSON() as Type_JSON
    expect((json.style as Type_JSON)['default'] as Type_JSON)
      .toHaveProperty('shape_position_type', 'proportional')
    expect(reload(json).drawing_area.sankey.default_style.shape_position_type).toBe('absolute')
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

describe('#369 — échelle de référence du mode « échelle adaptée »', () => {
  // `user_scale` est l'échelle DÉJÀ adaptée au datatag courant (base × valeur_courante /
  // valeur_réf). Sans persistance du couple capturé, la relecture la prendrait pour échelle de
  // BASE et recomposerait le ratio au dessin suivant → le diagramme changerait de taille juste
  // après l'ouverture.
  it('écrit le couple (échelle de base, valeur de référence) et le relit', () => {
    const app = new Class_ApplicationData(false)
    app.drawing_area.sankey.default_style.shape_position_type = 'scale_adapted'
    app.drawing_area.nodePositioning.restoreScaleReference(1234, 42)

    const json = app.toJSON() as Type_JSON
    expect(json['scale_adapted_ref_scale']).toBe(1234)
    expect(json['scale_adapted_ref_value']).toBe(42)

    const app2 = new Class_ApplicationData(false)
    app2.fromJSON(deepClone(json) as never, {}, false)
    expect(app2.drawing_area.nodePositioning.scaleAdaptedReference)
      .toEqual({ scale: 1234, value: 42 })
  })

  it('n\'écrit pas le couple hors du mode « échelle adaptée »', () => {
    const app = new Class_ApplicationData(false)
    app.drawing_area.nodePositioning.restoreScaleReference(1234, 42)
    const json = app.toJSON() as Type_JSON
    expect(json['scale_adapted_ref_scale']).toBeUndefined()
    expect(json['scale_adapted_ref_value']).toBeUndefined()
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
})
