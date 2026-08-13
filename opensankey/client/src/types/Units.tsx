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
  display_name?: string,
}

export type Type_UnitTypeJSON = {
  id: string,
  name: string,
  default_unit: string,
  units: Type_UnitJSON[],
  display_scale?: number,
}

/** Une unité : symbole canonique + coefficient vers l'unité de base de sa
 * grandeur (base = quantité × coefficient ⇒ coefficient 1 pour la base). */
export class Class_Unit {
  public id: string
  /** Symbole CANONIQUE (t, kt, GWh, €…). Sert à la correspondance et reste la
   * référence ; ce n'est pas forcément ce qui est écrit sur le diagramme. */
  public name: string
  public coefficient: number
  /** Libellé d'AFFICHAGE, quand le diagramme nomme cette unité autrement que
   * par son symbole canonique — « tonnes » pour `t`, « MWh élec » pour `MWh`.
   * C'est le pendant lisible de la table d'alias : `canonicalUnitSymbol`
   * reconnaît le synonyme à la lecture, `display_name` le restitue à l'écran.
   * Sans lui, migrer un fichier qui disait « tonnes » l'affichait « t », ce qui
   * fait d'un alias une conversion à sens unique.
   * undefined = afficher le symbole canonique. */
  public display_name?: string

  constructor(id: string, name: string, coefficient: number = 1, display_name?: string) {
    this.id = id
    this.name = name
    this.coefficient = coefficient
    this.display_name = display_name
  }

  /** Ce qui est écrit sur le diagramme. TOUJOURS passer par là côté rendu —
   * `name` est la référence, pas l'affichage. */
  public get label(): string {
    const custom = this.display_name?.trim()
    return (custom !== undefined && custom !== '') ? custom : this.name
  }

  public toJSON(): Type_UnitJSON {
    const json: Type_UnitJSON = { id: this.id, name: this.name, coefficient: this.coefficient }
    // Optionnel et omis quand absent : un fichier qui n'y touche pas reste
    // identique au catalogue par défaut (cf. equalsDefaultCatalog).
    if (this.display_name !== undefined && this.display_name.trim() !== '') {
      json.display_name = this.display_name
    }
    return json
  }

  public static fromJSON(json_object: Type_JSON): Class_Unit {
    return new Class_Unit(
      getStringFromJSON(json_object, 'id', ''),
      getStringFromJSON(json_object, 'name', ''),
      getNumberFromJSON(json_object, 'coefficient', 1),
      json_object['display_name'] !== undefined
        ? getStringFromJSON(json_object, 'display_name', '')
        : undefined
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
    if (found) {
      // Correspondance par ALIAS (le fichier écrit « tonnes », le catalogue « t ») :
      // on garde le mot du fichier comme libellé d'affichage. Sans ça, migrer
      // réécrirait le vocabulaire de l'utilisateur — un alias doit reconnaître un
      // synonyme, pas l'imposer. Correspondance exacte : rien à mémoriser.
      // On ne réécrit jamais un display_name déjà posé (premier lu gagne, et un
      // choix explicite de l'utilisateur prime sur une migration ultérieure).
      const trimmed = text.trim()
      if (trimmed !== found.unit.name && found.unit.display_name === undefined) {
        found.unit.display_name = trimmed
      }
      return found
    }
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

  /**
   * OS#1286 — importe d'un autre registre UNIQUEMENT ce qui manque ici : grandeurs absentes
   * (copiées telles quelles) et, dans les grandeurs communes, unités d'identifiant inconnu.
   *
   * Sert au transfert de mise en page (`updateFrom`) : les attributs copiés sur les éléments et
   * les styles portent des RÉFÉRENCES d'unité (`value_label_unit` = identifiant du registre de
   * la SOURCE). Sans les unités correspondantes, ces références ne résolvent plus chez la cible
   * et l'affichage retombe sur l'identifiant brut. Cas typique : une mise en page 1.1.5 dont
   * l'unité en texte libre a été migrée à son chargement dans la grandeur « Unités du fichier ».
   *
   * Strictement ADDITIF : jamais d'écrasement d'une unité existante (coefficient, libellé
   * d'affichage), ni de l'unité par défaut ou de l'échelle d'une grandeur existante — le
   * vocabulaire de la cible fait foi, on ne comble que les trous. Donc idempotent.
   *
   * @returns nombre d'unités ajoutées (grandeurs neuves comprises).
   */
  public mergeMissingFrom(other: Class_UnitsRegistry): number {
    let added = 0
    other.unit_types.forEach(src_type => {
      const own_type = this.unit_types.find(ut => ut.id === src_type.id)
      if (own_type === undefined) {
        this.unit_types.push(Class_UnitType.fromJSON(src_type.toJSON() as unknown as Type_JSON))
        added += src_type.units.length
        return
      }
      src_type.units.forEach(src_unit => {
        if (own_type.units.some(u => u.id === src_unit.id)) return
        own_type.addUnit(src_unit.name, src_unit.coefficient, src_unit.id)
        if (src_unit.display_name !== undefined) {
          own_type.units[own_type.units.length - 1].display_name = src_unit.display_name
        }
        added += 1
      })
    })
    return added
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
