// os#1378 (U0) — Le format de brique : la section racine `process` du JSON.
//
// Une « brique » Sankey unitaire N'EST PAS un nouveau format : c'est un fichier
// OpenSankey normal (un procédé central, ses nœuds d'échange) auquel s'ajoute
// cette section. Tout l'existant — éditeur, vues, publication, Excel — marche
// donc sur une brique gratuitement, et la bijection
// `global ⟷ (briques + assemblage)` se joue dans une seule sérialisation.
// Cf. NOTE-SANKEY-UNITAIRES.md §5 (chantier U0) et l'issue os#1378.
//
// Ce que la section porte, et rien de plus : le nœud qui EST le procédé, la
// nomenclature de ports à laquelle ses échanges se réfèrent, le niveau
// d'activité de référence, la durée de vie (dimension dynamique WooDyn), et un
// port par nœud d'échange.
//
// CONVENTION DE COEFFICIENT (V1) — un coefficient est exprimé PAR UNITÉ
// D'ACTIVITÉ, et la somme des coefficients d'ENTRÉE vaut 1. C'est la
// normalisation que le mode `percent` du board unitaire calcule déjà. Elle
// n'est pas VÉRIFIÉE ici : la persistance restitue ce que le fichier dit, elle
// n'arbitre pas le modèle. La contrainte se vérifiera à la composition (U3),
// là où la réconciliation aux coutures a la matrice pour le faire.
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
 * Un port de la brique — un nœud d'échange du diagramme, vu comme une interface
 * du procédé. La clé qui le porte dans `ports` est l'id de ce nœud ; c'est par
 * elle que l'assemblage (U2/U3) raccorde une sortie à une entrée.
 */
export type Type_UnitaryProcessPort = {
  // Requis : sans le sens, un port ne sait pas de quel côté du bilan il tombe.
  direction: Type_UnitaryProcessPortDirection
  // Identifiant du type de port dans la nomenclature référencée. Absent tant
  // que la brique n'est pas typée — c'est le typage qui rend deux briques
  // raccordables, pas leur existence.
  port_type?: string
  // Coefficient d'échange, par unité d'activité (cf. convention en tête).
  // Absent = « le fichier ne le dit pas », jamais zéro.
  coefficient?: number
  // Unité de CE port, pour le multi-flux (U4 : énergie, eau, azote… à côté de
  // la matière). Référence du registre d'unités du diagramme (OS#1286),
  // résolue par `Class_UnitsRegistry.resolve`. Absente = unité du diagramme.
  unit_ref?: string
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
 * brique SON niveau d'activité, et les coefficients s'y appliquent.
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
  // Un port par nœud d'échange, keyé par id de nœud. Vide par défaut : une
  // brique déclarée mais pas encore typée reste une brique.
  ports: { [node_id: string]: Type_UnitaryProcessPort }
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
 */
export const unitaryProcessFromJSON = (json: unknown): Type_UnitaryProcess | null => {
  if (json === null || typeof json !== 'object' || Array.isArray(json)) return null
  const raw = json as Record<string, unknown>
  // Le nœud central, seul membre requis.
  if (typeof raw.central_node_id !== 'string' || raw.central_node_id.length === 0) return null
  const unitary_process: Type_UnitaryProcess = { central_node_id: raw.central_node_id, ports: {} }
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
  // Les ports, keyés par id de nœud d'échange. Clé absente = brique sans port
  // déclaré (dictionnaire vide), ce qui n'est pas une erreur.
  if (raw.ports !== undefined) {
    if (raw.ports === null || typeof raw.ports !== 'object' || Array.isArray(raw.ports)) return null
    for (const [node_id, entry] of Object.entries(raw.ports as Record<string, unknown>)) {
      if (node_id.length === 0) return null
      if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) return null
      const port_json = entry as Record<string, unknown>
      if (port_json.direction !== 'input' && port_json.direction !== 'output') return null
      const port: Type_UnitaryProcessPort = { direction: port_json.direction }
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
      unitary_process.ports[node_id] = port
    }
  }
  return unitary_process
}

/**
 * Forme JSON, symétrique de la lecture : membres absents omis, `ports` écrit
 * même vide (c'est le dictionnaire d'une brique sans port, pas une absence).
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
  const ports: Type_JSON = {}
  for (const [node_id, port] of Object.entries(unitary_process.ports)) {
    const port_json: Type_JSON = { direction: port.direction }
    if (port.port_type !== undefined) port_json.port_type = port.port_type
    if (port.coefficient !== undefined) port_json.coefficient = port.coefficient
    if (port.unit_ref !== undefined) port_json.unit_ref = port.unit_ref
    ports[node_id] = port_json
  }
  out.ports = ports
  return out
}

/**
 * Copie profonde de la section — pour `Class_Sankey.copyFrom`, où un partage de
 * référence ferait que retyper un port de la copie retyperait l'original.
 * Écrite à la main plutôt qu'avec `structuredClone` : la structure est petite,
 * connue, et le jsdom des tests ne garantit pas cette fonction.
 */
export const unitaryProcessClone = (unitary_process: Type_UnitaryProcess): Type_UnitaryProcess => {
  const copy: Type_UnitaryProcess = { central_node_id: unitary_process.central_node_id, ports: {} }
  if (unitary_process.nomenclature_ref !== undefined)
    copy.nomenclature_ref = { ...unitary_process.nomenclature_ref }
  if (unitary_process.activity_reference !== undefined)
    copy.activity_reference = { ...unitary_process.activity_reference }
  if (unitary_process.lifetime_years !== undefined) copy.lifetime_years = unitary_process.lifetime_years
  for (const [node_id, port] of Object.entries(unitary_process.ports)) copy.ports[node_id] = { ...port }
  return copy
}
