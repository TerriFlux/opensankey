// Migrations de rétro-compatibilité au chargement (fromJSON), isolées ici pour
// rester testables sans tirer tout le graphe d'imports de SankeyPersistence
// (d3, Elements, DrawingArea…). Les classes ne sont importées QUE comme types
// (`import type`) : elles sont effacées à la compilation, donc ce module n'a
// aucune dépendance runtime lourde.
import type { Class_Sankey } from '../types/Sankey'
import type { Class_ProtoElement } from '../Elements/Element'

// ---------------------------------------------------------------------------
// Version de FORMAT (entier), distincte de la version d'app
// ---------------------------------------------------------------------------
// Incrémentée UNIQUEMENT quand la structure du JSON change (cf. FORMAT.md), et non
// à chaque release. Sa présence dans un fichier signale qu'il est déjà au format
// courant : le dispatcher (DrawingAreaPersistence.fromJSON) neutralise alors la
// version pointée pour NE PAS rejouer les migrations legacy à seuil. C'est ce qui
// corrige l'import Excel (SEP écrivait "1.0" → migrations < 1.1.4 appliquées à tort).
// Doit rester alignée avec JSON_FORMAT_VERSION de SEP (io_base.py).
export const CURRENT_FORMAT_VERSION = 1

/**
 * Version « effective » servant à piloter les migrations au chargement.
 * - Fichier avec `format_version` explicite ⇒ déjà au format courant : on renvoie
 *   `current_version` (toutes les migrations legacy à seuil no-op).
 * - Sinon ⇒ on garde la version pointée du fichier (chaîne de migrations legacy).
 * Pur et sans dépendance : testable en isolation.
 */
export function effectiveLoadVersion(
  raw_version: string | undefined,
  format_version: number | undefined,
  current_version: string | undefined
): string | undefined {
  return (format_version !== undefined) ? current_version : raw_version
}

// ---------------------------------------------------------------------------
// Documentation markdown multilingue (onglet « Doc »)
// ---------------------------------------------------------------------------
// Le champ `documentation_markdown` est stocké en interne comme une map
// { langue -> markdown }. La sérialisation est RÉTRO-COMPATIBLE et auto-décrite :
//   - 0 langue        -> champ absent
//   - 1 seule langue  -> string (format historique, lisible par les versions
//                        antérieures qui attendaient une string)
//   - plusieurs       -> map { fr, en, ... } (les tutoriels traduits)
// La relecture accepte les deux formes : une string historique est rangée sous
// la langue déclarée du fichier (défaut 'fr', le contenu existant étant
// francophone). Aucun bump de version n'est requis : le type porte l'info.

export type Type_DocMarkdownMap = { [lang: string]: string }

/** Normalise un code langue en 2 lettres minuscules ('en-US' -> 'en'). */
export function normalizeDocLang(lang: string | undefined): string {
  return (lang || 'fr').substring(0, 2).toLowerCase()
}

/**
 * Sérialise la map doc pour le JSON. Renvoie `undefined` si vide (le champ ne
 * doit alors pas être écrit), une string si une seule langue (format
 * historique), sinon la map filtrée des entrées vides.
 */
export function serializeDocMarkdown(
  map: Type_DocMarkdownMap
): string | Type_DocMarkdownMap | undefined {
  const langs = Object.keys(map).filter((l) => (map[l] ?? '') !== '')
  if (langs.length === 0) return undefined
  if (langs.length === 1) return map[langs[0]]
  const out: Type_DocMarkdownMap = {}
  langs.forEach((l) => { out[l] = map[l] })
  return out
}

/**
 * Relit le champ doc (string historique ou map) vers une map { langue ->
 * markdown }. `file_lang` = langue déclarée du diagramme (clé `language`),
 * utilisée pour ranger une string historique.
 */
export function parseDocMarkdown(
  raw: unknown,
  file_lang: string | undefined
): Type_DocMarkdownMap {
  if (typeof raw === 'string') {
    return raw ? { [normalizeDocLang(file_lang)]: raw } : {}
  }
  if (raw && typeof raw === 'object') {
    const out: Type_DocMarkdownMap = {}
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof v === 'string') out[k] = v
    }
    return out
  }
  return {}
}

/**
 * Résout la map doc vers le markdown à afficher pour la langue active, avec
 * repli en→fr→première disponible (aligné sur la résolution des titres de
 * tutoriels). Renvoie '' si aucune doc.
 */
export function resolveDocMarkdown(
  map: Type_DocMarkdownMap,
  lang: string | undefined
): string {
  const l = normalizeDocLang(lang)
  if (map[l] != null) return map[l]
  for (const fb of ['en', 'fr']) if (map[fb] != null) return map[fb]
  const first = Object.values(map)[0]
  return first ?? ''
}

/**
 * Compare deux versions « pointées » (ex. '0.92', '1.1', '1.1.4') segment par
 * segment, numériquement (segments manquants traités comme 0). Renvoie vrai si
 * `version` est STRICTEMENT antérieure à `target`.
 *
 * Le schéma de versions du projet mêle des numéros à 2 segments ('0.92', '1.0',
 * '1.1') et à 3 segments ('1.1.1', '1.1.4', '1.1.6'). La comparaison via
 * `Number(version)` utilisée ailleurs pour les seuils < 0.94 ne fonctionne donc
 * PAS au-delà de 1.1 (`Number('1.1.4')` = NaN) : on parse ici proprement chaque
 * segment. Une version absente (`undefined` — fichiers pré-0.9 sans champ
 * `version`) est considérée antérieure à toute cible (le fichier le plus ancien).
 */
export function isVersionBelow(version: string | number | undefined, target: string): boolean {
  if (version === undefined || version === null || String(version).trim() === '') return true
  const va = String(version).split('.').map(s => parseInt(s, 10) || 0)
  const vb = target.split('.').map(s => parseInt(s, 10) || 0)
  const n = Math.max(va.length, vb.length)
  for (let i = 0; i < n; i++) {
    const a = va[i] ?? 0
    const b = vb[i] ?? 0
    if (a < b) return true
    if (a > b) return false
  }
  return false // versions égales
}

// ---------------------------------------------------------------------------
// #233 — Validation racine au chargement (pare-chocs léger)
// ---------------------------------------------------------------------------
// `fromJSON` supposait la forme du JSON racine et plantait avec une erreur
// cryptique (ex. `Object.values(undefined)`) sur un fichier ancien ou édité à la
// main dont une clé structurante manque ou a le mauvais type. Cette garde LÉGÈRE
// (pas un schéma zod exhaustif — cf. item 47 de l'automne) vérifie la racine et le
// TYPE des clés structurantes, et renvoie la liste lisible des champs
// problématiques. Le dispatcher lève alors une erreur explicite AVANT le crash.
//
// Volontairement permissive : elle ne vérifie que la présence/le type de ce dont
// l'absence ou le mauvais type ferait échouer la lecture. Une clé simplement
// absente d'un fichier légitime (diagramme vide sans `nodes`, etc.) n'est PAS une
// erreur — on ne signale un problème que sur un type INCOMPATIBLE d'une clé
// présente (ou une racine qui n'est pas un objet).

/** Vrai pour un objet « dictionnaire » simple (ni null, ni tableau). */
function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Clés structurantes attendues comme dictionnaires si présentes. */
const ROOT_OBJECT_KEYS = [
  'nodes', 'links',
  'dataTags', 'nodeTags', 'levelTags', 'fluxTags', 'viewTags'
] as const

/**
 * Valide la forme du JSON racine d'un diagramme Sankey. Renvoie la liste des
 * champs problématiques (vide = OK). Pure et sans dépendance : testable en
 * isolation et réutilisable côté outillage.
 */
export function validateSankeyRootJSON(json: unknown): string[] {
  const problems: string[] = []
  if (!isPlainObject(json)) {
    const kind = json === null ? 'null'
      : Array.isArray(json) ? 'un tableau'
        : typeof json
    problems.push(`racine : attendu un objet JSON, reçu ${kind}`)
    return problems // rien d'autre n'est vérifiable
  }
  if ('version' in json && !(typeof json.version === 'string' || typeof json.version === 'number')) {
    problems.push(`version : attendu une chaîne (ou un nombre), reçu ${typeof json.version}`)
  }
  if ('format_version' in json && typeof json.format_version !== 'number') {
    problems.push(`format_version : attendu un entier, reçu ${typeof json.format_version}`)
  }
  for (const key of ROOT_OBJECT_KEYS) {
    if (key in json && !isPlainObject(json[key])) {
      const val = json[key]
      const kind = val === null ? 'null' : Array.isArray(val) ? 'un tableau' : typeof val
      problems.push(`${key} : attendu un objet, reçu ${kind}`)
    }
  }
  // NB : `views` (concept OpenSankey+) n'est PAS validé ici. Sa forme varie selon
  // l'époque (objet keyé par id dans les fichiers anciens, tableau plus tard) et la
  // couche base OpenSankey ne le relit pas — le contraindre produirait des faux
  // positifs sur des fichiers légitimes (cf. corpus 0.9→1.1.6).
  return problems
}

/**
 * Issue #191 — rétro-compatibilité de la césure des libellés. L'attribut
 * `wrap_long_words` (césure d'un mot UNIQUE trop long par insertion d'un tiret,
 * via breakLongWords dans DrawLabel) a été introduit avec un défaut `false`
 * (066b1847, v0.93) puis rebasculé à `true` lors du refactor de la config de
 * labels (a9efa282, v1.1.4). Les fichiers antérieurs ne sérialisent pas la clé
 * (absente de `local`) → ils héritent du nouveau défaut `true` et leurs libellés
 * mono-mots se retrouvent coupés (IMPORTATIONS → IMPORTATIO-NS). Le retour à la
 * ligne MULTI-mots (d3-textwrap sur les espaces, piloté par box_width) est
 * antérieur (2021) et inchangé : il n'est PAS concerné.
 *
 * Pour préserver le rendu d'origine, on force wrap_long_words=false sur les
 * fichiers < 1.1.4 UNIQUEMENT quand la clé est absente du nœud/lien/conteneur
 * (on n'écrase jamais un choix explicite). Les fichiers ≥ 1.1.4 gardent le
 * comportement courant ; à la ré-sauvegarde, le `false` est figé explicitement
 * (≠ défaut → sérialisé), donc la migration ne s'applique qu'une fois.
 */
export function applyWrapLongWordsRetrocompat(sankey: Class_Sankey, version: string | undefined): void {
  if (!isVersionBelow(version, '1.1.4')) return
  const wrap_keys = ['name_label_wrap_long_words', 'value_label_wrap_long_words']
  const elements: Class_ProtoElement[] = [
    ...sankey.nodes_list,
    ...sankey.links_list,
    ...sankey.containers_list
  ]
  elements.forEach(el => {
    const store = el.attributes as Record<string, unknown>
    wrap_keys.forEach(k => {
      if (store[k] === undefined) store[k] = false
    })
  })
}
