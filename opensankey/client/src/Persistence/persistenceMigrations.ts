// Migrations de rétro-compatibilité au chargement (fromJSON), isolées ici pour
// rester testables sans tirer tout le graphe d'imports de SankeyPersistence
// (d3, Elements, DrawingArea…). Les classes ne sont importées QUE comme types
// (`import type`) : elles sont effacées à la compilation, donc ce module n'a
// aucune dépendance runtime lourde.
import type { Class_Sankey } from '../types/Sankey'
import type { Class_ProtoElement } from '../Elements/Element'
import { sankeyRootSchema } from './sankeyFormatSchema'

// ---------------------------------------------------------------------------
// Version de FORMAT (entier), distincte de la version d'app
// ---------------------------------------------------------------------------
// Incrémentée UNIQUEMENT quand la structure du JSON change (cf. FORMAT.md), et non
// à chaque release. Sa présence dans un fichier signale qu'il est déjà au format
// courant : le dispatcher (DrawingAreaPersistence.fromJSON) neutralise alors la
// version pointée pour NE PAS rejouer les migrations legacy à seuil. C'est ce qui
// corrige l'import Excel (SEP écrivait "1.0" → migrations < 1.1.4 appliquées à tort).
// Doit rester alignée avec JSON_FORMAT_VERSION de SEP (io_base.py).
// Historique (cf. FORMAT.md) :
//   1 — introduction de format_version (#22)
//   2 — vues persistées en DELTA vs le maître (#254) : une entrée de `views`
//       porte `__patch` au lieu du snapshot intégral. Incompatible en LECTURE
//       pour une app antérieure (elle prendrait le patch pour une vue).
//   3 — légende = zones de texte générées (OS#1254) : le sous-objet `legend` ne
//       porte plus que les paramètres du générateur (+ `legend_managed`) ; les
//       zones ('legend', 'legend-*') sont des conteneurs ordinaires dans
//       `labels`. Incompatible en LECTURE pour une app antérieure (elle
//       afficherait l'ancienne légende-objet EN PLUS des zones).
export const CURRENT_FORMAT_VERSION = 3

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
// Textes multilingues embarqués dans le diagramme (map { langue -> texte })
// ---------------------------------------------------------------------------
// Mécanisme partagé par la documentation markdown (onglet « Doc », tutoriels
// multilingues) et par les NOMS des nœuds / zones de texte (OS#1299). Le champ
// est stocké en interne comme une map { langue -> texte }. La sérialisation est
// RÉTRO-COMPATIBLE et auto-décrite :
//   - 0 langue        -> champ absent (l'appelant décide du défaut)
//   - 1 seule langue  -> string (format historique, lisible par les versions
//                        antérieures qui attendaient une string)
//   - plusieurs       -> map { fr, en, ... }
// La relecture accepte les deux formes : une string historique est rangée sous
// la langue déclarée du fichier (défaut 'fr', le contenu existant étant
// francophone). Aucun bump de version n'est requis : le type porte l'info.

export type Type_LangMap = { [lang: string]: string }
/** Alias historique (doc markdown) — même structure. */
export type Type_DocMarkdownMap = Type_LangMap

/** Normalise un code langue en 2 lettres minuscules ('en-US' -> 'en'). */
export function normalizeLang(lang: string | undefined): string {
  return (lang || 'fr').substring(0, 2).toLowerCase()
}
/** Alias historique. */
export const normalizeDocLang = normalizeLang

/**
 * Sérialise la map pour le JSON. Renvoie `undefined` si vide (le champ ne
 * doit alors pas être écrit — ou être écrit '' selon le champ), une string si
 * une seule langue (format historique), sinon la map filtrée des entrées vides.
 */
export function serializeLangMap(
  map: Type_LangMap
): string | Type_LangMap | undefined {
  const langs = Object.keys(map).filter((l) => (map[l] ?? '') !== '')
  if (langs.length === 0) return undefined
  if (langs.length === 1) return map[langs[0]]
  const out: Type_LangMap = {}
  langs.forEach((l) => { out[l] = map[l] })
  return out
}
/** Alias historique. */
export const serializeDocMarkdown = serializeLangMap

/**
 * Relit le champ (string historique ou map) vers une map { langue -> texte }.
 * `file_lang` = langue déclarée du diagramme (clé `language`), utilisée pour
 * ranger une string historique.
 */
export function parseLangMap(
  raw: unknown,
  file_lang: string | undefined
): Type_LangMap {
  if (typeof raw === 'string') {
    return raw ? { [normalizeLang(file_lang)]: raw } : {}
  }
  if (raw && typeof raw === 'object') {
    const out: Type_LangMap = {}
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof v === 'string') out[k] = v
    }
    return out
  }
  return {}
}
/** Alias historique. */
export const parseDocMarkdown = parseLangMap

/**
 * Résout la map vers le texte à afficher pour la langue active, avec repli
 * en→fr→première disponible (aligné sur la résolution des titres de
 * tutoriels). Renvoie '' si la map est vide.
 */
export function resolveLangMap(
  map: Type_LangMap,
  lang: string | undefined
): string {
  const l = normalizeLang(lang)
  if (map[l] != null) return map[l]
  for (const fb of ['en', 'fr']) if (map[fb] != null) return map[fb]
  const first = Object.values(map)[0]
  return first ?? ''
}
/** Alias historique. */
export const resolveDocMarkdown = resolveLangMap

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
// #233 / #253 — Validation racine au chargement (pare-chocs léger)
// ---------------------------------------------------------------------------
// `fromJSON` supposait la forme du JSON racine et plantait avec une erreur
// cryptique (ex. `Object.values(undefined)`) sur un fichier ancien ou édité à la
// main dont une clé structurante manque ou a le mauvais type. Cette garde LÉGÈRE
// vérifie la racine et le TYPE des clés structurantes, et renvoie la liste
// lisible des champs problématiques. Le dispatcher lève alors une erreur
// explicite AVANT le crash.
//
// #253 : la validation dérive désormais du schéma zod `sankeyRootSchema`
// (source de vérité unique, dont est aussi généré le JSON Schema publié). Le
// contrat public de cette fonction est inchangé (mêmes messages, même contrat
// « zéro faux positif sur le corpus golden »).
//
// Volontairement permissive : le schéma est en `passthrough` et ne contraint que
// l'enveloppe. Une clé simplement absente d'un fichier légitime (diagramme vide
// sans `nodes`, etc.) n'est PAS une erreur — on ne signale un problème que sur un
// type INCOMPATIBLE d'une clé présente (ou une racine qui n'est pas un objet).

/** Décrit le type d'une valeur pour un message lisible (ni null ni tableau brut). */
function kindOf(v: unknown): string {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'un tableau'
  return typeof v
}

/**
 * Valide la forme du JSON racine d'un diagramme Sankey via `sankeyRootSchema`.
 * Renvoie la liste des champs problématiques (vide = OK). Pure : testable en
 * isolation et réutilisable côté outillage.
 */
export function validateSankeyRootJSON(json: unknown): string[] {
  const result = sankeyRootSchema.safeParse(json)
  if (result.success) return []
  const problems: string[] = []
  for (const issue of result.error.issues) {
    // Racine non-objet (tableau, null, scalaire) : un seul problème, rien
    // d'autre n'est descendable.
    if (issue.path.length === 0) {
      problems.push(`racine : attendu un objet JSON, reçu ${kindOf(json)}`)
      continue
    }
    const key = String(issue.path[0])
    const value = (json as Record<string, unknown>)[key]
    if (key === 'version') {
      problems.push(`version : attendu une chaîne (ou un nombre), reçu ${typeof value}`)
    } else if (key === 'format_version') {
      problems.push(`format_version : attendu un entier, reçu ${typeof value}`)
    } else {
      problems.push(`${key} : attendu un objet, reçu ${kindOf(value)}`)
    }
  }
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

// ---------------------------------------------------------------------------
// Mode d'affichage GLOBAL à l'ouverture (#369)
// ---------------------------------------------------------------------------
/** Modes d'affichage globaux restituables (cf. Type_PositionMode côté PublishOptions). */
export type Type_LoadedPositionMode = 'absolute' | 'proportional' | 'scale_adapted'

/**
 * Issue #369 — Mode d'affichage GLOBAL (`styles_dict['default'].shape_position_type`)
 * effectivement appliqué au chargement, à partir de celui lu dans le fichier.
 *
 * Jusqu'ici (#1231) TOUT fichier se chargeait en `absolute` : le mode était réputé « vue
 * transitoire ». Conséquence relevée au #369 : « échelle adaptée » — seul moyen de garder une
 * taille de diagramme constante d'un datatag à l'autre — devait être re-choisi à chaque
 * ouverture, et un diagramme publié ne pouvait pas être livré dans ce mode. C'est donc ce
 * mode, et lui seul, qui est désormais restitué.
 *
 * Trois cas restent ramenés à `absolute` :
 *  - `proportional` : le mode ne persiste PAS son cadre de référence (médiane, sommes de
 *    hauteurs par colonne). Le restituer le ferait re-capturer sur la géométrie du fichier —
 *    comme un clic sur « Proportionnel » après ouverture — et le plancher anti-chevauchement,
 *    recalculé sur cette géométrie, peut dilater fortement la disposition : le fichier ne se
 *    rouvrirait donc PAS tel qu'il a été enregistré (mesuré : facteur effectif 1,04 à
 *    l'enregistrement, 3,66 à la relecture). Arbitrage utilisateur du 2026-08-05 : mieux vaut
 *    rouvrir en absolu — les positions du fichier sont alors respectées — et laisser
 *    l'utilisateur re-choisir le %. Une restitution fidèle demanderait de persister tout le
 *    cadre de référence.
 *  - `parametric` (mode « écart » hérité) : c'est lui qui décide si u/v font autorité au
 *    chargement (cf. DrawingAreaPersistence.fromJSON) et le sélecteur ne le propose pas — le
 *    restituer rendrait la mise en page du fichier illisible sans moyen d'en sortir. Le
 *    marquage `parametric` PAR NŒUD (« Ecartement »), lui, reste persisté et respecté.
 *  - toute valeur absente ou inconnue (fichier antérieur, `relative` posé par erreur sur le
 *    style global) : rétro-compatibilité, un fichier sans l'attribut s'ouvre en `absolute`.
 *
 * Pur et sans dépendance : testable en isolation.
 */
export function positionModeOnLoad(incoming: string | undefined): Type_LoadedPositionMode {
  return (incoming === 'scale_adapted') ? 'scale_adapted' : 'absolute'
}
