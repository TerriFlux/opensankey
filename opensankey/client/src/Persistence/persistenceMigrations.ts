// Migrations de rétro-compatibilité au chargement (fromJSON), isolées ici pour
// rester testables sans tirer tout le graphe d'imports de SankeyPersistence
// (d3, Elements, DrawingArea…). Les classes ne sont importées QUE comme types
// (`import type`) : elles sont effacées à la compilation, donc ce module n'a
// aucune dépendance runtime lourde.
import type { Class_Sankey } from '../types/Sankey'
import type { Class_ProtoElement } from '../Elements/Element'

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
export function isVersionBelow(version: string | undefined, target: string): boolean {
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
