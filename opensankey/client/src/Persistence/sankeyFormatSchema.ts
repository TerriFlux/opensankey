// Schéma zod de la RACINE du format de persistance Sankey (issue #253).
//
// Source de vérité UNIQUE du contrat d'enveloppe du fichier JSON :
//   - la validation au chargement (`validateSankeyRootJSON`, non bloquante) ;
//   - le JSON Schema publié (`sankey.schema.json`, généré via
//     `scripts/generate-format-schema.ts`) qui documente le format ;
//   - (à venir) la validation Python `jsonschema` côté chargement.
//
// Périmètre volontairement limité à l'ENVELOPPE (cf. issue #253 : « racine +
// réglages DA typés, bags d'attributs en passthrough d'abord ») : on type les
// clés racines connues et on laisse le contenu détaillé (attributs de nœuds,
// liens, styles, thèmes, contraintes, réglages DA…) passer en `passthrough`
// sans le contraindre. Cela valide la structure de haut niveau sans produire de
// faux positifs sur les innombrables clés optionnelles du format.
import { z } from 'zod'

// Un objet JSON « simple » : ni `null` ni tableau. `z.object({}).passthrough()`
// rejette tableaux et null (le type parsé zod est alors `array` / `null`, pas
// `object`) tout en acceptant n'importe quelles clés supplémentaires.
const jsonObjectBag = z.object({}).passthrough()

/**
 * os#1378 (U0) puis os#1380 (U4) — un port de brique : un nœud d'échange vu
 * comme interface du procédé, POUR UNE GRANDEUR. Contrairement au reste de la
 * racine, la structure est ici CONTRAINTE (et non laissée en passthrough) :
 * c'est un contrat neuf, sans historique de fichiers à ménager, et `direction`
 * est ce qui décide du côté du bilan.
 */
const unitaryProcessPortSchema = z
  .object({
    // Le nœud d'échange. Depuis os#1380 il est porté par le port lui-même, les
    // ports étant une LISTE et non plus un dictionnaire keyé par nœud.
    node_id: z.string(),
    direction: z.enum(['input', 'output']),
    // Grandeur mesurée (masse, énergie, volume…) : id de GRANDEUR du registre
    // d'unités (OS#1286). Absente = grandeur du diagramme, celle qui porte la
    // convention « Σ entrées = 1 ».
    quantity_ref: z.string().optional(),
    port_type: z.string().optional(),
    // Par unité d'activité ; somme des entrées de la grandeur de référence = 1
    // (convention V1, non vérifiée ici — cf. types/UnitaryProcess.ts).
    coefficient: z.number().optional(),
    // Référence du registre d'unités du diagramme (OS#1286).
    unit_ref: z.string().optional(),
    // Nature de l'échange pour la passerelle Brightway (ACV). Absente =
    // technosphère.
    exchange_kind: z.enum(['technosphere', 'biosphere']).optional(),
  })
  .passthrough()

/**
 * os#1378 (U0) — la section racine `process`, qui fait d'un fichier OpenSankey
 * ordinaire une BRIQUE Sankey unitaire. Additive : absente de tout fichier qui
 * n'est pas une brique (cf. FORMAT.md, pas d'incrément de `format_version`).
 */
const unitaryProcessSchema = z
  .object({
    // Seul membre requis : l'id du nœud qui EST le procédé.
    central_node_id: z.string(),
    // Nomenclature de ports partagée entre briques (version non épinglée = courante).
    nomenclature_ref: z
      .object({ name: z.string(), version: z.string().optional() })
      .passthrough()
      .optional(),
    // Niveau d'activité auquel les coefficients ont été établis.
    activity_reference: z
      .object({ value: z.number(), unit_ref: z.string().optional() })
      .passthrough()
      .optional(),
    // Durée de vie en années (dimension dynamique WooDyn).
    lifetime_years: z.number().optional(),
    // Les ports, en LISTE à clé composite `(node_id, direction, quantity_ref)`
    // depuis os#1380 : un même nœud porte plusieurs grandeurs et peut être à la
    // fois entrée et sortie. L'ancienne forme dictionnaire de U0 reste LUE par
    // `unitaryProcessFromJSON` mais n'est pas décrite ici : le schéma publie le
    // contrat COURANT, et le `.catch()` ci-dessous fait que la décrire ou non
    // ne change rien à l'ouverture d'un vieux fichier.
    ports: z.array(unitaryProcessPortSchema).optional(),
  })
  .passthrough()

/**
 * Schéma de la racine du document Sankey. `.passthrough()` : toute clé non listée
 * (theme, ratio_*_constraints, réglages de drawing area, etc.) est acceptée telle
 * quelle — on ne valide que l'enveloppe.
 */
export const sankeyRootSchema = z
  .object({
    // Version d'app émettrice : chaîne pointée ("1.1.9") ou nombre (anciens fichiers).
    version: z.union([z.string(), z.number()]).optional(),
    // Version de FORMAT (entier), distincte de la version d'app (cf. FORMAT.md).
    format_version: z.number().int().optional(),
    // Collections principales : objets keyés par identifiant.
    nodes: jsonObjectBag.optional(),
    links: jsonObjectBag.optional(),
    // Groupes d'étiquettes.
    dataTags: jsonObjectBag.optional(),
    nodeTags: jsonObjectBag.optional(),
    levelTags: jsonObjectBag.optional(),
    fluxTags: jsonObjectBag.optional(),
    viewTags: jsonObjectBag.optional(),
    // `views` (concept OpenSankey+) : forme variable selon l'époque (objet keyé
    // par id OU tableau). Non contraint pour éviter les faux positifs (cf. #233).
    views: z.unknown().optional(),
    // os#1378 — section brique Sankey unitaire, absente des fichiers ordinaires.
    //
    // `.catch()` : ce schéma-ci est un BARRAGE (`DrawingAreaPersistence.fromJSON`
    // LÈVE quand la validation trouve un problème), et une section `process`
    // abîmée ne doit surtout pas rendre un fichier inouvrable — le diagramme
    // reste parfaitement lisible, il n'est simplement pas une brique. Le contrat
    // est donc DÉCRIT ici (et publié dans sankey.schema.json, `required`
    // compris) mais ARBITRÉ par `unitaryProcessFromJSON`, qui écarte la section
    // en entier et rend `null`. La valeur de repli n'est jamais consommée :
    // `validateSankeyRootJSON` ne lit que les erreurs, jamais la donnée parsée.
    process: unitaryProcessSchema.catch({ central_node_id: '' }).optional(),
  })
  .passthrough()

export type SankeyRoot = z.infer<typeof sankeyRootSchema>
