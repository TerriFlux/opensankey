// OS#1286 — tests du registre d'unités (logique pure, sans DOM).

import { Class_UnitsRegistry, Class_UnitType, defaultUnitsCatalog, canonicalUnitSymbol, FILE_UNITS_TYPE_ID } from './Units'

describe('OS#1286 — Class_UnitsRegistry', () => {

  const makeDefault = () => {
    const reg = new Class_UnitsRegistry()
    reg.resetToDefault()
    return reg
  }

  test('resetToDefault charge le catalogue par défaut', () => {
    const reg = makeDefault()
    expect(reg.unit_types.map(ut => ut.name)).toEqual(['Masse', 'Énergie', 'Monnaie', 'Volume'])
    const mass = reg.getUnitType('unit_type_mass')!
    expect(mass.default_unit?.name).toBe('t')
    expect(mass.base_unit?.name).toBe('t')
    expect(mass.units.find(u => u.name === 'kt')?.coefficient).toBe(1000)
  })

  test('equalsDefaultCatalog : vrai au départ, faux après édition', () => {
    const reg = makeDefault()
    expect(reg.equalsDefaultCatalog()).toBe(true)
    reg.getUnitType('unit_type_mass')!.addUnit('Gt', 1e9)
    expect(reg.equalsDefaultCatalog()).toBe(false)
  })

  test('resolve : id d\'unité, id de grandeur (→ défaut), vide/inconnue → undefined', () => {
    const reg = makeDefault()
    // Id d'unité précis
    expect(reg.resolve('mass_kt')?.unit.name).toBe('kt')
    expect(reg.resolve('mass_kt')?.unit_type.id).toBe('unit_type_mass')
    // Id de grandeur → son unité par défaut
    expect(reg.resolve('unit_type_energy')?.unit.name).toBe('MWh')
    // Référence vide ou inconnue → AUCUNE unité (état « — aucune — »)
    expect(reg.resolve('')).toBeUndefined()
    expect(reg.resolve(undefined)).toBeUndefined()
    expect(reg.resolve('xxx')).toBeUndefined()
    expect(new Class_UnitsRegistry().resolve('')).toBeUndefined()
  })

  test('canonicalUnitSymbol : casse, accents, pluriels, alias', () => {
    expect(canonicalUnitSymbol('Tonnes')).toBe('t')
    expect(canonicalUnitSymbol('mégatonne')).toBe('mt')
    expect(canonicalUnitSymbol('kilogrammes')).toBe('kg')
    expect(canonicalUnitSymbol('Euros')).toBe('€')
    expect(canonicalUnitSymbol('m3')).toBe('m3')
    expect(canonicalUnitSymbol('m³')).toBe('m3')
    expect(canonicalUnitSymbol('GWh')).toBe('gwh')
    // Pas de singularisation des symboles courts (« ts » resterait « ts »… mais « s » seul aussi)
    expect(canonicalUnitSymbol('t')).toBe('t')
  })

  test('findLegacyUnit : symbole/alias + coefficient == unit_factor', () => {
    const reg = makeDefault()
    // Cas courant : « tonne » avec facteur 1 → t du catalogue
    expect(reg.findLegacyUnit('tonnes', 1)?.unit.id).toBe('mass_t')
    expect(reg.findLegacyUnit('T', 1)?.unit.id).toBe('mass_t')
    // « kt » avec facteur 1000 → kt du catalogue (coefficient 1000)
    expect(reg.findLegacyUnit('kt', 1000)?.unit.id).toBe('mass_kt')
    // « kt » avec facteur 1 : le kt du catalogue diviserait par 1000 → PAS de correspondance
    expect(reg.findLegacyUnit('kt', 1)).toBeUndefined()
    // Inconnue
    expect(reg.findLegacyUnit('MJ', 1)).toBeUndefined()
  })

  test('getOrCreateLegacyUnit : repli dans « Unités du fichier », réutilisation', () => {
    const reg = makeDefault()
    const mj = reg.getOrCreateLegacyUnit('MJ', 1)
    expect(mj.unit_type.id).toBe(FILE_UNITS_TYPE_ID)
    expect(mj.unit.coefficient).toBe(1)
    // Réutilisée au 2e appel (pas de doublon)
    expect(reg.getOrCreateLegacyUnit('MJ', 1).unit.id).toBe(mj.unit.id)
    expect(reg.getUnitType(FILE_UNITS_TYPE_ID)!.units.length).toBe(1)
    // Une correspondance catalogue ne crée rien
    expect(reg.getOrCreateLegacyUnit('tonne', 1).unit.id).toBe('mass_t')
    expect(reg.getUnitType(FILE_UNITS_TYPE_ID)!.units.length).toBe(1)
  })

  test('round-trip toJSON/fromJSON', () => {
    const reg = makeDefault()
    reg.addUnitType('Surface').addUnit('ha', 1)
    const json = JSON.parse(JSON.stringify(reg.toJSON()))
    const reg2 = new Class_UnitsRegistry()
    reg2.fromJSON(json)
    expect(reg2.toJSON()).toEqual(reg.toJSON())
    expect(reg2.resolve('unit_type_surface')?.unit.name).toBe('ha')
  })

  test('removeUnit : le défaut se replie sur la première unité restante', () => {
    const ut = new Class_UnitType('ut', 'Test')
    ut.addUnit('a', 1)
    ut.addUnit('b', 10)
    expect(ut.default_unit?.name).toBe('a')
    ut.removeUnit(ut.units[0].id)
    expect(ut.default_unit?.name).toBe('b')
    ut.removeUnit(ut.units[0].id)
    expect(ut.default_unit).toBeUndefined()
    expect(ut.default_unit_id).toBe('')
  })

  test('copyFrom : copie profonde (indépendante de la source)', () => {
    const reg = makeDefault()
    const copy = new Class_UnitsRegistry()
    copy.copyFrom(reg)
    expect(copy.toJSON()).toEqual(reg.toJSON())
    copy.getUnitType('unit_type_mass')!.name = 'Modifié'
    expect(reg.getUnitType('unit_type_mass')!.name).toBe('Masse')
  })

  test('fromJSON tolère les entrées invalides', () => {
    const reg = makeDefault()
    reg.fromJSON('not an array')
    // entrée non-tableau : registre inchangé
    expect(reg.equalsDefaultCatalog()).toBe(true)
    reg.fromJSON([{ name: 'sans id', units: [] }])
    // entrée sans id : filtrée
    expect(reg.unit_types.length).toBe(0)
  })

  test('le catalogue par défaut expose des ids stables', () => {
    // Les ids du catalogue sont persistés dans les fichiers (référence des
    // labels unit_model) : ils ne doivent pas changer.
    const ids = defaultUnitsCatalog().map(ut => ut.id)
    expect(ids).toEqual(['unit_type_mass', 'unit_type_energy', 'unit_type_currency', 'unit_type_volume'])
  })
})
