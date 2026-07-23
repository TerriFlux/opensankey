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
  })
  .passthrough()

export type SankeyRoot = z.infer<typeof sankeyRootSchema>
