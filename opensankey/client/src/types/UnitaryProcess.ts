// os#1378 (U0) puis os#1380 (U4) — Le format de brique : la section racine
// `process` du JSON.
//
// Une « brique » Sankey unitaire N'EST PAS un nouveau format : c'est un fichier
// OpenSankey normal (un procédé central, ses nœuds d'échange) auquel s'ajoute
// cette section. Tout l'existant — éditeur, vues, publication, Excel — marche
// donc sur une brique gratuitement, et la bijection
// `global ⟷ (briques + assemblage)` se joue dans une seule sérialisation.
// Cf. NOTE-SANKEY-UNITAIRES.md §5 (chantiers U0 et U4).
//
// Ce que la section porte, et rien de plus : le nœud qui EST le procédé, la
// nomenclature de ports à laquelle ses échanges se réfèrent, le niveau
// d'activité de référence, la durée de vie (dimension dynamique WooDyn), et la
// LISTE de ses ports.
//
// MULTI-FLUX (os#1380) — `ports` est une LISTE, plus un dictionnaire keyé par
// nœud : un même nœud d'échange porte plusieurs flux (la matière, mais aussi
// l'énergie, l'eau, l'azote…), chacun sur sa GRANDEUR (`quantity_ref`, une
// grandeur du registre d'unités OS#1286). L'identité d'un port est donc le
// triplet `(node_id, direction, quantity_ref ?? '')`, et la limite « un port par
// nœud » de la forme U0 tombe : un même nœud peut être à la fois entrée et
// sortie (retour de connexes, boucle de recyclage) et porter autant de
// grandeurs qu'on en mesure.
//
// CONVENTION DE COEFFICIENT (V1) — un coefficient est exprimé PAR UNITÉ
// D'ACTIVITÉ, et la somme des coefficients d'ENTRÉE de la GRANDEUR DE RÉFÉRENCE
// vaut 1 (la matière, ordinairement : la grandeur du diagramme, celle des ports
// sans `quantity_ref`). Les autres grandeurs ne se normalisent pas : elles sont
// rapportées à la MÊME activité, chacune dans son unité — 1 kt de grume, et à
// côté les 340 kWh et les 12 m³ d'eau qu'il a fallu. C'est très exactement ce
// qui fait d'une brique multi-flux un inventaire de cycle de vie (ICV), donc le
// pont AFM ⟷ ACV de WooDyn (lots 3-4, passerelle Brightway).
//
// Cette convention n'est pas VÉRIFIÉE ici : la persistance restitue ce que le
// fichier dit, elle n'arbitre pas le modèle. La contrainte se vérifiera à la
// composition (U3), là où la réconciliation aux coutures a la matrice pour le
// faire.
//
// NOMMAGE — `UnitaryProcess`, jamais `Process` seul : les symboles
// `PersistenceProcessDialog*` de l'éditeur désignent le dialogue d'import de
// fichiers, qui n'a rien à voir avec un procédé.
//
// Ce module est une FEUILLE du graphe d'imports (aucun import de valeur) :
// `types/Sankey` et la persistance peuvent y puiser sans risque de cycle.

import type { Type_JSON } from './Utils'

/** Sens d'un port : ce qui entre dans le procédé, ce qui en sort. */
export type Type_UnitaryProcessPortDirection = 'input' | 'output'

/**
 * Nature de l'échange, au sens de l'ACV : avec une autre activité humaine
 * (technosphère) ou avec l'environnement (biosphère — émissions, prélèvements).
 * C'est la distinction que la passerelle Brightway attend pour ranger un
 * exchange dans la matrice technologique ou dans la matrice d'intervention.
 */
export type Type_UnitaryProcessExchangeKind = 'technosphere' | 'biosphere'

/**
 * Un port de la brique — un nœud d'échange du diagramme, vu comme une interface
 * du procédé, POUR UNE GRANDEUR DONNÉE. C'est par `node_id` que l'assemblage
 * (U2/U3) raccorde une sortie à une entrée.
 */
export type Type_UnitaryProcessPort = {
  // Requis : le nœud d'échange dont ce port est l'interface. Portait la clé du
  // dictionnaire dans la forme U0, membre à part entière depuis os#1380.
  node_id: string
  // Requis : sans le sens, un port ne sait pas de quel côté du bilan il tombe.
  direction: Type_UnitaryProcessPortDirection
  // Grandeur mesurée par ce port (masse, énergie, volume…) : un id de GRANDEUR
  // du registre d'unités du diagramme (OS#1286), résolu par
  // `Class_UnitsRegistry.resolve`. Absente = la grandeur du diagramme, celle qui
  // porte la convention « Σ entrées = 1 ».
  quantity_ref?: string
  // Identifiant du type de port dans la nomenclature référencée. Absent tant
  // que la brique n'est pas typée — c'est le typage qui rend deux briques
  // raccordables, pas leur existence.
  port_type?: string
  // Coefficient d'échange, par unité d'activité (cf. convention en tête).
  // Absent = « le fichier ne le dit pas », jamais zéro.
  coefficient?: number
  // Unité de CE port, dans sa grandeur. Référence du registre d'unités
  // (OS#1286). Absente = unité d'affichage par défaut de la grandeur.
  unit_ref?: string
  // Nature de l'échange pour la passerelle Brightway. Absente = technosphère,
  // le cas ordinaire d'un flux de matière entre procédés.
  exchange_kind?: Type_UnitaryProcessExchangeKind
}

/**
 * Référence à la nomenclature de ports — l'objet PARTAGÉ entre briques, celui
 * qui rend l'assemblage possible. La brique n'en porte que le nom et,
 * éventuellement, la version : la nomenclature elle-même vit ailleurs.
 */
export type Type_UnitaryProcessNomenclatureRef = {
  name: string
  // Absente = « la version courante », comme un semver non épinglé.
  version?: string
}

/**
 * Niveau d'activité de référence : l'échelle à laquelle les coefficients ont
 * été établis. C'est le pivot de la composition — l'assemblage donne à chaque
 * brique SON niveau d'activité, et les coefficients s'y appliquent. Il est
 * UNIQUE pour toutes les grandeurs : c'est ce qui les rapporte les unes aux
 * autres.
 */
export type Type_UnitaryProcessActivityReference = {
  value: number
  // Référence du registre d'unités (OS#1286). Absente = unité du diagramme.
  unit_ref?: string
}

/** La section racine `process` d'un fichier de brique. */
export type Type_UnitaryProcess = {
  // Requis : l'id du nœud qui EST le procédé. Sans lui, on a un diagramme, pas
  // une brique — c'est ce qui distingue les deux.
  central_node_id: string
  nomenclature_ref?: Type_UnitaryProcessNomenclatureRef
  activity_reference?: Type_UnitaryProcessActivityReference
  // Durée de vie en années (dimension dynamique WooDyn : stock, cohortes).
  lifetime_years?: number
  // Les ports, en LISTE (os#1380). Vide par défaut : une brique déclarée mais
  // pas encore typée reste une brique.
  ports: Type_UnitaryProcessPort[]
}

/**
 * Identité d'un port : `(node_id, direction, quantity_ref ?? '')`. Deux ports de
 * même identité dans un fichier sont une contradiction (deux coefficients pour
 * le même échange), pas une redondance — d'où le rejet à la lecture.
 *
 * Exportée parce que l'assemblage et l'éditeur apparient des ports : que la
 * règle d'identité vive à UN seul endroit est ce qui empêche deux appariements
 * divergents.
 */
export const unitaryProcessPortKey = (port: Type_UnitaryProcessPort): string =>
  [port.node_id, port.direction, port.quantity_ref ?? ''].join('\t')

/**
 * Lit UN port. `node_id_from_key` est renseigné pour l'ancienne forme U0, où le
 * nœud était porté par la clé du dictionnaire et non par un membre.
 */
const unitaryProcessPortFromJSON = (
  entry: unknown,
  node_id_from_key?: string
): Type_UnitaryProcessPort | null => {
  if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) return null
  const port_json = entry as Record<string, unknown>
  const node_id = node_id_from_key ?? port_json.node_id
  if (typeof node_id !== 'string' || node_id.length === 0) return null
  if (port_json.direction !== 'input' && port_json.direction !== 'output') return null
  const port: Type_UnitaryProcessPort = { node_id, direction: port_json.direction }
  if (port_json.quantity_ref !== undefined) {
    if (typeof port_json.quantity_ref !== 'string') return null
    port.quantity_ref = port_json.quantity_ref
  }
  if (port_json.port_type !== undefined) {
    if (typeof port_json.port_type !== 'string') return null
    port.port_type = port_json.port_type
  }
  // Coefficient : 0 est légitime (port déclaré, échange nul à ce jour).
  if (port_json.coefficient !== undefined) {
    if (typeof port_json.coefficient !== 'number' || !Number.isFinite(port_json.coefficient)) return null
    port.coefficient = port_json.coefficient
  }
  if (port_json.unit_ref !== undefined) {
    if (typeof port_json.unit_ref !== 'string') return null
    port.unit_ref = port_json.unit_ref
  }
  // Nature d'échange : énumération fermée. Une valeur inconnue serait rangée au
  // hasard dans l'une des deux matrices de l'ACV — mieux vaut refuser.
  if (port_json.exchange_kind !== undefined) {
    if (port_json.exchange_kind !== 'technosphere' && port_json.exchange_kind !== 'biosphere') return null
    port.exchange_kind = port_json.exchange_kind
  }
  return port
}

/**
 * Lit la section `process` depuis le JSON, ou null si le fichier n'en porte pas
 * (cas ordinaire : ce n'est pas une brique) ou si elle est inutilisable.
 *
 * TOUT-OU-RIEN, y compris pour les ports pris un à un — le choix demande à être
 * dit : un port mal formé qu'on ignorerait en silence ferait une brique
 * PLAUSIBLE et FAUSSE, dont les coefficients d'entrée ne sommeraient plus à 1
 * sans que rien ne le signale, et la composition (U3) fermerait ses bilans sur
 * un procédé amputé. Mieux vaut « ce fichier n'est pas une brique » : le
 * diagramme, lui, reste entièrement lisible — la section est additive.
 *
 * LECTURE TOLÉRANTE (os#1380) : `ports` est accepté sous les deux formes — la
 * LISTE (forme courante) et le DICTIONNAIRE keyé par nœud de la forme U0
 * initiale, converti en liste sans `quantity_ref` (ces fichiers-là ne
 * mesuraient qu'une grandeur). L'écriture, elle, ne produit que la liste : un
 * fichier U0 relu puis réenregistré passe à la forme courante.
 */
export const unitaryProcessFromJSON = (json: unknown): Type_UnitaryProcess | null => {
  if (json === null || typeof json !== 'object' || Array.isArray(json)) return null
  const raw = json as Record<string, unknown>
  // Le nœud central, seul membre requis.
  if (typeof raw.central_node_id !== 'string' || raw.central_node_id.length === 0) return null
  const unitary_process: Type_UnitaryProcess = { central_node_id: raw.central_node_id, ports: [] }
  // Nomenclature de ports : le nom est requis dès que la clé est là, la version
  // reste optionnelle (non épinglée = version courante).
  if (raw.nomenclature_ref !== undefined) {
    const ref = raw.nomenclature_ref
    if (ref === null || typeof ref !== 'object' || Array.isArray(ref)) return null
    const nomenclature = ref as Record<string, unknown>
    if (typeof nomenclature.name !== 'string' || nomenclature.name.length === 0) return null
    unitary_process.nomenclature_ref = { name: nomenclature.name }
    if (nomenclature.version !== undefined) {
      if (typeof nomenclature.version !== 'string') return null
      unitary_process.nomenclature_ref.version = nomenclature.version
    }
  }
  // Niveau d'activité de référence : la valeur est requise dès que la clé est
  // là — un niveau sans nombre ne dit rien de l'échelle des coefficients.
  if (raw.activity_reference !== undefined) {
    const activity = raw.activity_reference
    if (activity === null || typeof activity !== 'object' || Array.isArray(activity)) return null
    const reference = activity as Record<string, unknown>
    if (typeof reference.value !== 'number' || !Number.isFinite(reference.value)) return null
    unitary_process.activity_reference = { value: reference.value }
    if (reference.unit_ref !== undefined) {
      if (typeof reference.unit_ref !== 'string') return null
      unitary_process.activity_reference.unit_ref = reference.unit_ref
    }
  }
  // Durée de vie : 0 est une valeur légitime (aucune rémanence), d'où le test
  // sur `undefined` et non sur la véracité.
  if (raw.lifetime_years !== undefined) {
    if (typeof raw.lifetime_years !== 'number' || !Number.isFinite(raw.lifetime_years)) return null
    unitary_process.lifetime_years = raw.lifetime_years
  }
  // Les ports. Clé absente = brique sans port déclaré (liste vide), ce qui
  // n'est pas une erreur.
  if (raw.ports !== undefined) {
    if (raw.ports === null || typeof raw.ports !== 'object') return null
    const entries: [string | undefined, unknown][] = Array.isArray(raw.ports)
      ? raw.ports.map(entry => [undefined, entry])
      : Object.entries(raw.ports as Record<string, unknown>).map(([node_id, entry]) => [node_id, entry])
    const seen = new Set<string>()
    for (const [node_id_from_key, entry] of entries) {
      const port = unitaryProcessPortFromJSON(entry, node_id_from_key)
      if (port === null) return null
      // Doublon d'identité : deux coefficients pour le même échange, sans que
      // rien ne dise lequel fait foi. Tout-ou-rien, comme le reste.
      const key = unitaryProcessPortKey(port)
      if (seen.has(key)) return null
      seen.add(key)
      unitary_process.ports.push(port)
    }
  }
  return unitary_process
}

/**
 * Forme JSON, symétrique de la lecture : membres absents omis, `ports` écrit
 * même vide (c'est la liste d'une brique sans port, pas une absence) et
 * TOUJOURS en liste — l'ancienne forme dictionnaire se lit encore mais ne
 * s'écrit plus.
 */
export const unitaryProcessToJSON = (unitary_process: Type_UnitaryProcess): Type_JSON => {
  const out: Type_JSON = { central_node_id: unitary_process.central_node_id }
  if (unitary_process.nomenclature_ref !== undefined) {
    const nomenclature: Type_JSON = { name: unitary_process.nomenclature_ref.name }
    if (unitary_process.nomenclature_ref.version !== undefined)
      nomenclature.version = unitary_process.nomenclature_ref.version
    out.nomenclature_ref = nomenclature
  }
  if (unitary_process.activity_reference !== undefined) {
    const reference: Type_JSON = { value: unitary_process.activity_reference.value }
    if (unitary_process.activity_reference.unit_ref !== undefined)
      reference.unit_ref = unitary_process.activity_reference.unit_ref
    out.activity_reference = reference
  }
  if (unitary_process.lifetime_years !== undefined) out.lifetime_years = unitary_process.lifetime_years
  // Le cast est celui que fait déjà `unitaryAssemblyToJSON` pour ses raccords :
  // `Type_JSON` ne décrit pas les tableaux d'objets.
  out.ports = unitary_process.ports.map(port => {
    const port_json: Type_JSON = { node_id: port.node_id, direction: port.direction }
    if (port.quantity_ref !== undefined) port_json.quantity_ref = port.quantity_ref
    if (port.port_type !== undefined) port_json.port_type = port.port_type
    if (port.coefficient !== undefined) port_json.coefficient = port.coefficient
    if (port.unit_ref !== undefined) port_json.unit_ref = port.unit_ref
    if (port.exchange_kind !== undefined) port_json.exchange_kind = port.exchange_kind
    return port_json
  }) as unknown as Type_JSON
  return out
}

/**
 * Copie profonde de la section — pour `Class_Sankey.copyFrom`, où un partage de
 * référence ferait que retyper un port de la copie retyperait l'original.
 * Écrite à la main plutôt qu'avec `structuredClone` : la structure est petite,
 * connue, et le jsdom des tests ne garantit pas cette fonction.
 */
export const unitaryProcessClone = (unitary_process: Type_UnitaryProcess): Type_UnitaryProcess => {
  const copy: Type_UnitaryProcess = {
    central_node_id: unitary_process.central_node_id,
    ports: unitary_process.ports.map(port => ({ ...port }))
  }
  if (unitary_process.nomenclature_ref !== undefined)
    copy.nomenclature_ref = { ...unitary_process.nomenclature_ref }
  if (unitary_process.activity_reference !== undefined)
    copy.activity_reference = { ...unitary_process.activity_reference }
  if (unitary_process.lifetime_years !== undefined) copy.lifetime_years = unitary_process.lifetime_years
  return copy
}
