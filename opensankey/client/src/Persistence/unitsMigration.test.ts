// OS#1286 — migration des « unités personnalisées » (texte libre, mode
// unit_name) vers le registre d'unités au chargement
// (SankeyPersistence.migrate_legacy_unit_names). Harnais : construire un
// diagramme en mémoire avec les attributs legacy, le dumper (= fichier
// ancien), puis vérifier l'état après rechargement.

import { Class_ApplicationData } from '../types/ApplicationData'
import { FILE_UNITS_TYPE_ID } from '../types/Units'
import type { Type_JSON } from '../types/Utils'

function deepClone<T>(o: T): T {
  return JSON.parse(JSON.stringify(o)) as T
}

/** Construit un diagramme A→B avec un flux, applique `patch` sur les attributs
 * du flux, dumpe puis recharge, et renvoie l'app rechargée. */
function buildDumpReload(patch: { [k: string]: unknown }): Class_ApplicationData {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const a = sankey.addNewNode('a', 'A')
  const b = sankey.addNewNode('b', 'B')
  const link = sankey.addNewLink(a, b)
  Object.entries(patch).forEach(([k, v]) => {
    (link.attributes as unknown as { [k: string]: unknown })[k] = v
  })
  const json = app.toJSON() as Type_JSON
  const app2 = new Class_ApplicationData(false)
  app2.fromJSON(deepClone(json) as never, {}, false)
  return app2
}

const linkAttrs = (app: Class_ApplicationData) =>
  app.drawing_area.sankey.links_list[0].attributes as unknown as { [k: string]: unknown }

describe('OS#1286 — migration unit_name → unit_model au chargement', () => {

  test('« tonnes » (facteur 1) → t du catalogue (alias)', () => {
    const app = buildDumpReload({
      value_label_unit_type: 'unit_name',
      value_label_unit: 'tonnes',
    })
    const attrs = linkAttrs(app)
    expect(attrs['value_label_unit_type']).toBe('unit_model')
    expect(attrs['value_label_unit']).toBe('mass_t')
    // Rien créé dans « Unités du fichier »
    expect(app.drawing_area.sankey.units.getUnitType(FILE_UNITS_TYPE_ID)).toBeUndefined()
  })

  test('« kt » avec facteur 1000 → kt du catalogue (coefficient identique)', () => {
    const app = buildDumpReload({
      value_label_unit_type: 'unit_name',
      value_label_unit: 'kt',
      value_label_unit_factor: 1000,
    })
    expect(linkAttrs(app)['value_label_unit']).toBe('mass_kt')
  })

  test('« kt » avec facteur 1 → PAS le kt du catalogue (affichage préservé) : « Unités du fichier »', () => {
    const app = buildDumpReload({
      value_label_unit_type: 'unit_name',
      value_label_unit: 'kt',
    })
    const attrs = linkAttrs(app)
    expect(attrs['value_label_unit_type']).toBe('unit_model')
    const file_units = app.drawing_area.sankey.units.getUnitType(FILE_UNITS_TYPE_ID)
    expect(file_units).toBeDefined()
    const created = file_units!.units.find(u => u.name === 'kt')
    expect(created?.coefficient).toBe(1)
    expect(attrs['value_label_unit']).toBe(created!.id)
  })

  test('texte inconnu « MJ » → ajouté à « Unités du fichier » et référencé', () => {
    const app = buildDumpReload({
      value_label_unit_type: 'unit_name',
      value_label_unit: 'MJ',
      value_label_unit_factor: 2,
    })
    const attrs = linkAttrs(app)
    const file_units = app.drawing_area.sankey.units.getUnitType(FILE_UNITS_TYPE_ID)!
    const created = file_units.units.find(u => u.name === 'MJ')
    expect(created?.coefficient).toBe(2)
    expect(attrs['value_label_unit']).toBe(created!.id)
    // Le registre modifié est persisté au prochain dump
    const json = app.toJSON() as Type_JSON
    expect(Array.isArray(json['units'])).toBe(true)
  })

  test('texte vide : rien à migrer, aucun changement', () => {
    const app = buildDumpReload({
      value_label_unit_type: 'unit_name',
      value_label_unit: '',
    })
    expect(linkAttrs(app)['value_label_unit_type']).toBe('unit_name')
    expect(app.drawing_area.sankey.units.getUnitType(FILE_UNITS_TYPE_ID)).toBeUndefined()
  })

  test('type absent (ancien défaut unit_name) avec texte : migré aussi', () => {
    const app = buildDumpReload({
      value_label_unit: 'MWh',
    })
    const attrs = linkAttrs(app)
    expect(attrs['value_label_unit_type']).toBe('unit_model')
    // MWh = unité de base (coefficient 1) → correspond au facteur 1 implicite
    expect(attrs['value_label_unit']).toBe('energy_mwh')
  })

  test('référence de registre déjà en place (fichier récent) : intouchée', () => {
    const app = buildDumpReload({
      value_label_unit: 'mass_kt',
    })
    const attrs = linkAttrs(app)
    expect(attrs['value_label_unit']).toBe('mass_kt')
    expect(attrs['value_label_unit_type']).toBeUndefined()
    expect(app.drawing_area.sankey.units.getUnitType(FILE_UNITS_TYPE_ID)).toBeUndefined()
  })

  test('styles migrés aussi + idempotence (point fixe du round-trip)', () => {
    const app = new Class_ApplicationData(false)
    const sankey = app.drawing_area.sankey
    const a = sankey.addNewNode('a', 'A')
    const b = sankey.addNewNode('b', 'B')
    sankey.addNewLink(a, b)
    const style = sankey.default_style;
    (style.attributes as unknown as { [k: string]: unknown })['value_label_unit_type'] = 'unit_name';
    (style.attributes as unknown as { [k: string]: unknown })['value_label_unit'] = 'euros'
    const json = app.toJSON() as Type_JSON

    const app2 = new Class_ApplicationData(false)
    app2.fromJSON(deepClone(json) as never, {}, false)
    const style2 = app2.drawing_area.sankey.default_style
    expect((style2.attributes as unknown as { [k: string]: unknown })['value_label_unit']).toBe('currency_eur')
    expect((style2.attributes as unknown as { [k: string]: unknown })['value_label_unit_type']).toBe('unit_model')

    // Idempotence : recharger le dump migré ne change plus rien.
    const j1 = app2.toJSON() as Type_JSON
    const app3 = new Class_ApplicationData(false)
    app3.fromJSON(deepClone(j1) as never, {}, false)
    expect(app3.toJSON()).toEqual(j1)
  })
})
