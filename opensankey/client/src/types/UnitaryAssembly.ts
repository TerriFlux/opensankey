// os#1379 (U2) — Le format d'ASSEMBLAGE UNITAIRE : le troisième terme de la bijection.
//
// `Sankey global ⟷ ( briques + assemblage )` (NOTE-SANKEY-UNITAIRES.md §1). Les
// briques sont des fichiers OpenSankey ordinaires portant une section racine
// `process` (os#1378, `types/UnitaryProcess.ts`) ; l'assemblage est ce que la
// projection par procédé OUBLIE, et sans lequel la bijection est perdue : quelle
// sortie nourrit quelle entrée, à quel niveau d'activité chaque brique tourne, et
// tout ce que le global portait SANS appartenir à aucune brique.
//
// ATTENTION AU VOCABULAIRE — « assemblage » désigne AUSSI, dans
// NOTE-BRIQUES-ET-ASSEMBLAGES.md, le fichier de verrouillage (lockfile) d'un
// portfolio : quelles versions de quels diagrammes composent une publication.
// C'est le monde de la PUBLICATION, et il n'a rien à voir avec celui-ci. Ici on
// assemble des briques UNITAIRES : un graphe port-à-port de procédés, du modèle
// de données. D'où le préfixe `UnitaryAssembly` sur tous les symboles de ce
// module — jamais `Assembly` seul.
//
// Forme du fichier :
//
//   {
//     "unitary_assembly": true,
//     "bricks":      { "<process_node_id>": { "activity": 388, "unit_ref": "kt" } },
//     "connections": [ { "product": "<node_id>", "from": "<p1>", "to": "<p2>" } ],
//     "shell":       { ...un JSON OpenSankey... }
//   }
//
// Les deux moitiés n'ont pas le même office, et il faut le dire :
//
//  - `bricks` et `connections` sont l'information de COMPOSITION, celle que U3
//    (côté Python : MFAProblem / SEP) consommera pour recomposer un global en
//    réconciliant aux coutures. `bricks` donne l'échelle de chaque procédé (le
//    vecteur d'activité de l'ACV), `connections` le graphe port-à-port (la
//    matrice technologique). Ni l'un ni l'autre ne suffit à REDESSINER quoi que
//    ce soit : ce sont des grandeurs, pas un diagramme.
//
//  - `shell` est ce qui garantit la RECETTE (« rien n'est perdu ») : le JSON du
//    global amputé de tout ce qui est parti dans une brique — nœuds et flux
//    d'aucune étoile de procédé, et tout le socle du diagramme (tags, unités,
//    niveaux, styles, légende, vues, mise en page…). Recoller les briques sur le
//    shell par identifiant redonne le global, valeurs comprises : c'est le
//    vérificateur de bijection de `Algorithms/UnitaryExtraction.ts`.
//
// `unitary_assembly: true` est le discriminant du TYPE DE FICHIER — sans lui, un
// assemblage et un diagramme seraient indiscernables à l'ouverture (`shell` EST
// un diagramme). Il est requis à la lecture.
//
// Ce module est une FEUILLE du graphe d'imports (aucun import de valeur), comme
// `UnitaryProcess.ts` : la persistance et les algorithmes peuvent y puiser sans
// risque de cycle.

import type { Type_JSON } from './Utils'

/**
 * Une brique dans l'assemblage — pas son contenu (il est dans son propre
 * fichier), seulement son ÉCHELLE. La clé qui la porte dans `bricks` est l'id du
 * nœud-procédé, c'est-à-dire le `central_node_id` de sa section `process`.
 */
export type Type_UnitaryAssemblyBrick = {
  // Requis : le niveau d'activité auquel cette brique tourne dans CET assemblage.
  // Les coefficients de la brique sont exprimés par unité d'activité (convention
  // V1, cf. UnitaryProcess.ts) : sans ce nombre, ils ne s'appliquent à rien.
  activity: number
  // Référence du registre d'unités du diagramme (OS#1286). Absente = unité du
  // diagramme, comme partout ailleurs dans le format.
  unit_ref?: string
}

/**
 * Un raccord port-à-port : le produit `product` sort du procédé `from` et entre
 * dans le procédé `to`. C'est l'arête du graphe de composition — trois
 * identifiants de nœuds du global, rien de plus.
 *
 * Un même produit peut porter PLUSIEURS raccords (deux procédés en amont, trois
 * en aval : autant de lignes), et deux procédés directement reliés (un flux
 * secteur → secteur, sans produit intermédiaire) n'en produisent AUCUN — ce flux
 * appartient aux deux étoiles, la composition le refait en fusionnant par id.
 */
export type Type_UnitaryAssemblyConnection = {
  product: string
  from: string
  to: string
}

/** Le contenu d'un fichier d'assemblage unitaire. */
export type Type_UnitaryAssembly = {
  bricks: { [process_node_id: string]: Type_UnitaryAssemblyBrick }
  connections: Type_UnitaryAssemblyConnection[]
  // Le global amputé des étoiles. Écrit même vide (un global entièrement couvert
  // par ses briques garde un socle : tags, styles, unités…).
  shell: Type_JSON
}

/**
 * Lit un fichier d'assemblage, ou null s'il n'en est pas un (discriminant absent)
 * ou s'il est inutilisable.
 *
 * TOUT-OU-RIEN, comme `unitaryProcessFromJSON` et pour la même raison : un
 * assemblage partiellement lu serait PLAUSIBLE et FAUX — une brique dont
 * l'activité serait tombée, un raccord ignoré, et la composition (U3) fermerait
 * ses bilans sur un graphe amputé sans que rien ne le signale. Mieux vaut « ce
 * fichier n'est pas un assemblage ».
 */
export const unitaryAssemblyFromJSON = (json: unknown): Type_UnitaryAssembly | null => {
  if (json === null || typeof json !== 'object' || Array.isArray(json)) return null
  const raw = json as Record<string, unknown>
  // Le discriminant, strictement : sans lui on lirait un diagramme comme un
  // assemblage vide, ce qui est le pire des verdicts (plausible et faux).
  if (raw.unitary_assembly !== true) return null
  const assembly: Type_UnitaryAssembly = { bricks: {}, connections: [], shell: {} }
  // Les briques. Clé absente = assemblage sans brique (dictionnaire vide), ce qui
  // n'est pas une erreur : un global sans procédé en produit un.
  if (raw.bricks !== undefined) {
    if (raw.bricks === null || typeof raw.bricks !== 'object' || Array.isArray(raw.bricks)) return null
    for (const [process_node_id, entry] of Object.entries(raw.bricks as Record<string, unknown>)) {
      if (process_node_id.length === 0) return null
      if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) return null
      const brick_json = entry as Record<string, unknown>
      // 0 est une activité légitime (procédé déclaré, à l'arrêt cette année-là),
      // d'où le test de type et non de véracité.
      if (typeof brick_json.activity !== 'number' || !Number.isFinite(brick_json.activity)) return null
      const brick: Type_UnitaryAssemblyBrick = { activity: brick_json.activity }
      if (brick_json.unit_ref !== undefined) {
        if (typeof brick_json.unit_ref !== 'string') return null
        brick.unit_ref = brick_json.unit_ref
      }
      assembly.bricks[process_node_id] = brick
    }
  }
  // Les raccords. Les trois identifiants sont requis sur chacun : un raccord
  // amputé d'une extrémité ne raccorde rien.
  if (raw.connections !== undefined) {
    if (!Array.isArray(raw.connections)) return null
    for (const entry of raw.connections as unknown[]) {
      if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) return null
      const connection_json = entry as Record<string, unknown>
      const { product, from, to } = connection_json
      if (typeof product !== 'string' || product.length === 0) return null
      if (typeof from !== 'string' || from.length === 0) return null
      if (typeof to !== 'string' || to.length === 0) return null
      assembly.connections.push({ product, from, to })
    }
  }
  // Le shell : un objet JSON quelconque (c'est un diagramme, on ne le valide pas
  // ici — c'est l'affaire du chargeur de diagramme). Absent = shell vide.
  if (raw.shell !== undefined) {
    if (raw.shell === null || typeof raw.shell !== 'object' || Array.isArray(raw.shell)) return null
    assembly.shell = raw.shell as Type_JSON
  }
  return assembly
}

/**
 * Forme JSON, symétrique de la lecture : le discriminant en tête, puis les trois
 * membres, tous écrits même vides — un assemblage sans brique reste un
 * assemblage, et l'absence de `shell` ne se distinguerait pas d'un global
 * entièrement absorbé.
 */
export const unitaryAssemblyToJSON = (assembly: Type_UnitaryAssembly): Type_JSON => {
  const bricks: Type_JSON = {}
  for (const [process_node_id, brick] of Object.entries(assembly.bricks)) {
    const brick_json: Type_JSON = { activity: brick.activity }
    if (brick.unit_ref !== undefined) brick_json.unit_ref = brick.unit_ref
    bricks[process_node_id] = brick_json
  }
  // Les raccords sont recopiés un à un plutôt que passés par référence : le
  // sérialiseur ne doit pas rendre un objet qui partage ses tableaux avec le
  // modèle. Le cast vers `Type_JSON` est celui que fait déjà `unitaryProcessToJSON`
  // pour ses sous-objets — `Type_JSON` ne décrit pas les tableaux d'objets.
  const connections = assembly.connections.map(
    c => ({ product: c.product, from: c.from, to: c.to })
  ) as unknown as Type_JSON
  return {
    unitary_assembly: true,
    bricks,
    connections,
    shell: assembly.shell
  }
}
