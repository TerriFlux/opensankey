// OS#1286 — Modèle d'unités première classe.
//
// Un REGISTRE de grandeurs (`Class_UnitType` : Masse, Énergie, Monnaie…) porte
// chacune ses unités (`Class_Unit` : symbole + coefficient vers l'unité de
// base) et son unité d'affichage par défaut. Le registre vit sur Class_Sankey
// (clé JSON `units`, additive : absente des anciens fichiers → catalogue par
// défaut).
//
// Invariant : `data_value` reste TOUJOURS stocké dans l'unité de base de sa
// grandeur (coefficient 1). Le registre ne sert qu'à l'AFFICHAGE (mode
// `unit_type: 'unit_model'` des labels de valeur : valeur divisée par le
// coefficient de l'unité affichée, symbole ajouté) et à l'import (e!Sankey
// convertit déjà vers l'unité de base, cf. esankeyParser).
//
// Distinct du groupe de dataTags `is_unit` (arbre multi-unités par VALEUR, qui
// filtre une unité pour tout le diagramme) : les deux mécanismes coexistent.

import { getNumberFromJSON, getStringFromJSON, Type_JSON } from './Utils'

export type Type_UnitJSON = {
  id: string,
  name: string,
  coefficient: number,
}

export type Type_UnitTypeJSON = {
  id: string,
  name: string,
  default_unit: string,
  units: Type_UnitJSON[],
  display_scale?: number,
}

/** Une unité : symbole affiché + coefficient vers l'unité de base de sa
 * grandeur (base = quantité × coefficient ⇒ coefficient 1 pour la base). */
export class Class_Unit {
  public id: string
  /** Symbole affiché (t, kt, GWh, €…). */
  public name: string
  public coefficient: number

  constructor(id: string, name: string, coefficient: number = 1) {
    this.id = id
    this.name = name
    this.coefficient = coefficient
  }

  public toJSON(): Type_UnitJSON {
    return { id: this.id, name: this.name, coefficient: this.coefficient }
  }

  public static fromJSON(json_object: Type_JSON): Class_Unit {
    return new Class_Unit(
      getStringFromJSON(json_object, 'id', ''),
      getStringFromJSON(json_object, 'name', ''),
      getNumberFromJSON(json_object, 'coefficient', 1)
    )
  }
}

/** Une grandeur (Masse, Énergie…) : ses unités + son unité d'affichage par
 * défaut. L'unité de base est celle de coefficient 1. */
export class Class_UnitType {
  public id: string
  public name: string
  public units: Class_Unit[]
  /** Id de l'unité d'affichage par défaut (les flux sans surcharge l'héritent). */
  public default_unit_id: string
  /** OS#1286 (fusion) — échelle d'affichage PROPRE à la grandeur (façon
   * e!Sankey : chaque unitType a son ratio quantité/pixels) : quantité en unité
   * de BASE affichée sur 100 px pour les bandes « de type unité ». undefined =
   * échelle globale du dessin (drawing_area.scale). Permet d'équilibrer
   * visuellement des grandeurs différentes (kWh vs t vs €) sur un même flux. */
  public display_scale?: number

  constructor(id: string, name: string, units: Class_Unit[] = [], default_unit_id: string = '', display_scale?: number) {
    this.id = id
    this.name = name
    this.units = units
    this.default_unit_id = default_unit_id
    this.display_scale = display_scale
  }

  public get default_unit(): Class_Unit | undefined {
    return this.units.find(u => u.id === this.default_unit_id) ?? this.units[0]
  }

  /** Unité de base (coefficient 1) — celle dans laquelle data_value est stocké. */
  public get base_unit(): Class_Unit | undefined {
    return this.units.find(u => u.coefficient === 1) ?? this.units[0]
  }

  public addUnit(name: string, coefficient: number = 1, id?: string): Class_Unit {
    const unit_id = id ?? this._makeUnitId(name)
    const unit = new Class_Unit(unit_id, name, coefficient)
    this.units.push(unit)
    if (!this.default_unit_id) this.default_unit_id = unit.id
    return unit
  }

  public removeUnit(id: string) {
    this.units = this.units.filter(u => u.id !== id)
    if (this.default_unit_id === id) this.default_unit_id = this.units[0]?.id ?? ''
  }

  private _makeUnitId(name: string): string {
    const base = this.id + '_' + name.replace(/[^0-9a-zA-Z€]+/g, '_')
    let candidate = base
    let n = 0
    while (this.units.some(u => u.id === candidate)) candidate = base + '_' + (++n)
    return candidate
  }

  public toJSON(): Type_UnitTypeJSON {
    const json: Type_UnitTypeJSON = {
      id: this.id,
      name: this.name,
      default_unit: this.default_unit_id,
      units: this.units.map(u => u.toJSON()),
    }
    if (this.display_scale !== undefined) json.display_scale = this.display_scale
    return json
  }

  public static fromJSON(json_object: Type_JSON): Class_UnitType {
    const units_raw = json_object['units']
    const units = Array.isArray(units_raw)
      ? (units_raw as unknown as Type_JSON[]).map(u => Class_Unit.fromJSON(u))
      : []
    return new Class_UnitType(
      getStringFromJSON(json_object, 'id', ''),
      getStringFromJSON(json_object, 'name', ''),
      units,
      getStringFromJSON(json_object, 'default_unit', units[0]?.id ?? ''),
      json_object['display_scale'] !== undefined ? getNumberFromJSON(json_object, 'display_scale', 0) : undefined
    )
  }
}

/** Résolution d'une référence d'unité posée sur un label (`value_label_unit`
 * en mode `unit_model`) : id d'unité, ou id de grandeur (→ son unité par
 * défaut), ou '' (→ unité par défaut de la première grandeur). */
export type Type_ResolvedUnit = { unit: Class_Unit, unit_type: Class_UnitType }

/** Le registre d'unités du diagramme (porté par Class_Sankey). */
export class Class_UnitsRegistry {
  public unit_types: Class_UnitType[] = []

  constructor(unit_types: Class_UnitType[] = []) {
    this.unit_types = unit_types
  }

  public get is_empty(): boolean { return this.unit_types.length === 0 }

  public addUnitType(name: string, id?: string): Class_UnitType {
    const type_id = id ?? this._makeTypeId(name)
    const ut = new Class_UnitType(type_id, name)
    this.unit_types.push(ut)
    return ut
  }

  public removeUnitType(id: string) {
    this.unit_types = this.unit_types.filter(ut => ut.id !== id)
  }

  public getUnitType(id: string): Class_UnitType | undefined {
    return this.unit_types.find(ut => ut.id === id)
  }

  private _makeTypeId(name: string): string {
    const base = 'unit_type_' + name.replace(/[^0-9a-zA-Z]+/g, '_').toLowerCase()
    let candidate = base
    let n = 0
    while (this.unit_types.some(ut => ut.id === candidate)) candidate = base + '_' + (++n)
    return candidate
  }

  /**
   * Résout une référence d'affichage (cf. Type_ResolvedUnit) :
   * - id d'UNITÉ → cette unité ;
   * - id de GRANDEUR → son unité d'affichage par défaut ;
   * - '' / inconnue → undefined (aucune unité : pas de conversion ni de
   *   suffixe — c'est l'état « — aucune — » du sélecteur).
   */
  public resolve(ref: string | undefined | null): Type_ResolvedUnit | undefined {
    if (!ref) return undefined
    for (const ut of this.unit_types) {
      const unit = ut.units.find(u => u.id === ref)
      if (unit) return { unit, unit_type: ut }
    }
    const ut = this.getUnitType(ref)
    if (ut && ut.default_unit) return { unit: ut.default_unit, unit_type: ut }
    return undefined
  }

  /**
   * OS#1286 — migration des anciennes « unités personnalisées » (texte libre).
   * Cherche une unité du registre correspondant au texte : symbole exact
   * d'abord, puis normalisé (casse/accents/pluriel) + table d'alias
   * (« tonne » → t). Le coefficient doit ÉGALER l'ancien `unit_factor` : le
   * mode texte libre divisait la valeur par ce facteur, une correspondance
   * avec un autre coefficient changerait l'affichage.
   */
  public findLegacyUnit(text: string, factor: number = 1): Type_ResolvedUnit | undefined {
    const trimmed = text.trim()
    for (const ut of this.unit_types) {
      const unit = ut.units.find(u => u.name === trimmed && u.coefficient === factor)
      if (unit) return { unit, unit_type: ut }
    }
    const wanted = canonicalUnitSymbol(trimmed)
    for (const ut of this.unit_types) {
      const unit = ut.units.find(u => canonicalUnitSymbol(u.name) === wanted && u.coefficient === factor)
      if (unit) return { unit, unit_type: ut }
    }
    return undefined
  }

  /**
   * OS#1286 — unité de repli pour un texte libre sans correspondance : ajoutée
   * (ou réutilisée) dans la grandeur « Unités du fichier », avec
   * coefficient = ancien unit_factor (affichage strictement identique).
   */
  public getOrCreateLegacyUnit(text: string, factor: number = 1): Type_ResolvedUnit {
    const found = this.findLegacyUnit(text, factor)
    if (found) return found
    let ut = this.getUnitType(FILE_UNITS_TYPE_ID)
    if (!ut) {
      ut = new Class_UnitType(FILE_UNITS_TYPE_ID, FILE_UNITS_TYPE_NAME)
      this.unit_types.push(ut)
    }
    const unit = ut.addUnit(text.trim(), factor)
    return { unit, unit_type: ut }
  }

  public copyFrom(other: Class_UnitsRegistry) {
    this.unit_types = other.unit_types.map(ut => Class_UnitType.fromJSON(ut.toJSON() as unknown as Type_JSON))
  }

  public toJSON(): Type_UnitTypeJSON[] {
    return this.unit_types.map(ut => ut.toJSON())
  }

  public fromJSON(json_list: unknown) {
    if (!Array.isArray(json_list)) return
    this.unit_types = (json_list as Type_JSON[])
      .map(ut => Class_UnitType.fromJSON(ut))
      .filter(ut => ut.id !== '')
  }

  /** Ramène le registre au catalogue par défaut (nouveau diagramme / reset). */
  public resetToDefault() {
    this.fromJSON(defaultUnitsCatalog())
  }

  /** True si le registre est identique au catalogue par défaut — dans ce cas
   * la clé `units` n'est PAS sérialisée (fichiers inchangés, additivité). */
  public equalsDefaultCatalog(): boolean {
    return JSON.stringify(this.toJSON()) === JSON.stringify(defaultUnitsCatalog())
  }
}

/** Grandeur de repli des unités migrées depuis le texte libre des anciens
 * fichiers (« Unité personnalisée ») quand aucune correspondance n'existe.
 * L'utilisateur peut ensuite les reclasser dans l'éditeur. */
export const FILE_UNITS_TYPE_ID = 'unit_type_file'
export const FILE_UNITS_TYPE_NAME = 'Unités du fichier'

/**
 * OS#1286 — normalisation d'un texte d'unité pour la correspondance :
 * minuscules, sans accents, sans pluriel final, espaces réduits ; puis table
 * d'alias des noms longs usuels vers le symbole canonique (« tonne » → t).
 */
export const canonicalUnitSymbol = (text: string): string => {
  let s = text.trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
  if (s.length > 2 && s.endsWith('s')) s = s.slice(0, -1)
  // Exposant volume : m3 → m³ (comparaison sur la forme « 3 » simple)
  s = s.replace(/³/g, '3')
  return UNIT_ALIASES[s] ?? s
}

// Alias nom long → symbole canonique NORMALISÉ (sortie de la normalisation
// ci-dessus, donc minuscules / sans accents / « 3 » simple).
const UNIT_ALIASES: { [alias: string]: string } = {
  'tonne': 't',
  'kilotonne': 'kt',
  'megatonne': 'mt',
  'kilogramme': 'kg',
  'kilo': 'kg',
  'gramme': 'g',
  'kilowattheure': 'kwh',
  'megawattheure': 'mwh',
  'gigawattheure': 'gwh',
  'terajoule': 'tj',
  'gigajoule': 'gj',
  'euro': '€',
  'eur': '€',
  'keuro': 'k€',
  'keur': 'k€',
  'k euro': 'k€',
  'meuro': 'm€',
  'meur': 'm€',
  'million d euro': 'm€',
  'metre cube': 'm3',
  'm³': 'm3',
}

/**
 * Catalogue par défaut d'un nouveau diagramme : grandeurs usuelles, éditables
 * et supprimables. L'unité de base (coefficient 1) est aussi le défaut.
 */
export const defaultUnitsCatalog = (): Type_UnitTypeJSON[] => ([
  {
    id: 'unit_type_mass', name: 'Masse', default_unit: 'mass_t',
    units: [
      { id: 'mass_kg', name: 'kg', coefficient: 0.001 },
      { id: 'mass_t', name: 't', coefficient: 1 },
      { id: 'mass_kt', name: 'kt', coefficient: 1000 },
      { id: 'mass_mt', name: 'Mt', coefficient: 1000000 },
    ],
  },
  {
    id: 'unit_type_energy', name: 'Énergie', default_unit: 'energy_mwh',
    units: [
      { id: 'energy_kwh', name: 'kWh', coefficient: 0.001 },
      { id: 'energy_mwh', name: 'MWh', coefficient: 1 },
      { id: 'energy_gwh', name: 'GWh', coefficient: 1000 },
      { id: 'energy_tj', name: 'TJ', coefficient: 277.777778 },
    ],
  },
  {
    id: 'unit_type_currency', name: 'Monnaie', default_unit: 'currency_eur',
    units: [
      { id: 'currency_eur', name: '€', coefficient: 1 },
      { id: 'currency_keur', name: 'k€', coefficient: 1000 },
      { id: 'currency_meur', name: 'M€', coefficient: 1000000 },
    ],
  },
  {
    id: 'unit_type_volume', name: 'Volume', default_unit: 'volume_m3',
    units: [
      { id: 'volume_m3', name: 'm³', coefficient: 1 },
      { id: 'volume_dam3', name: 'dam³', coefficient: 1000 },
      { id: 'volume_hm3', name: 'hm³', coefficient: 1000000 },
    ],
  },
])
