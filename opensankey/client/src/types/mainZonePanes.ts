// 05/10/2026 — QUELLES VIGNETTES D'UNE FENÊTRE ON MONTRE.
//
// Deux sources, une seule règle d'affichage :
//  - l'AUTEUR masque des vignettes (`Type_MainZoneOccupant.panes.hidden`), écrit dans le fichier ;
//  - le LECTEUR d'une page publiée coche les siennes, si la page le lui permet
//    (`publish_options.pane_picker`). Son choix ne touche jamais au fichier : il vit dans
//    l'ADRESSE, paramètre `panes`, pour se partager par lien.
//
// La page publiée nomme son document (cf. la règle « l'adresse ne porte l'état d'affichage que si
// elle nomme le document ») : y écrire `panes` est donc permis, et c'est un geste explicite du
// lecteur qui l'y écrit, jamais un dessin.

/** Le paramètre d'adresse qui porte le choix du lecteur. */
export const PANES_URL_PARAM = 'panes'

// sa#596 — UNE VIGNETTE PAR COORDONNÉE DÉPLOYÉE. Un volet dont l'en-tête a plusieurs années (ou
// unités) cochées montre, pour une nature qui le demande, une vignette par objet ET par valeur
// cochée. Ces vignettes ont chacune leur CLÉ (la sélection, le liséré, le document actif et le
// masquage désignent un dessin précis), mais une seule FIGURE : celle de l'objet, dont elles
// partagent les réglages (`Class_MenuConfig.figureOf` ramène la clé à sa base). Régler la
// Meunerie en 2015 règle la Meunerie, pas une de ses années.

/**
 * Séparateur entre la clé d'objet et ses coordonnées : un caractère de contrôle « séparateur
 * d'enregistrement » écrit en échappement, qu'aucun identifiant d'élément ne contient.
 */
const PANE_COORDINATES_SEPARATOR = '\u001e'

/** La clé de la vignette de `base` aux coordonnées `tag_ids` (une étiquette par groupe déployé). */
export const paneCoordinatesKey = (base: string, tag_ids: string[]): string =>
  tag_ids.length === 0 ? base : [base, ...tag_ids].join(PANE_COORDINATES_SEPARATOR)

/** La clé de l'objet d'une vignette : elle-même, sauf pour une vignette déployée. */
export const basePaneKeyOf = (key: string): string => {
  const i = key.indexOf(PANE_COORDINATES_SEPARATOR)
  return i < 0 ? key : key.slice(0, i)
}

/** Relit `panes` d'une entrée d'occupant ; `undefined` quand rien n'est masqué. */
export const readPanesState = (raw: unknown): { hidden?: string[] } | undefined => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const h = (raw as { hidden?: unknown }).hidden
  if (!Array.isArray(h)) return undefined
  const hidden = [...new Set(h.filter((x): x is string => typeof x === 'string' && x !== ''))]
  return hidden.length > 0 ? { hidden } : undefined
}

/**
 * LES VIGNETTES À MONTRER parmi `keys` (dans leur ordre) : celles que `visible` nomme s'il en nomme
 * au moins une, sinon toutes sauf `hidden`, et jamais aucune — si tout est masqué, toutes reviennent
 * (un réglage qui viderait la fenêtre ne dirait pas ce qu'il cache).
 */
export const visiblePaneKeys = (
  keys: string[], hidden: string[] | undefined, visible?: string[] | null
): string[] => {
  if (visible) {
    const chosen = keys.filter(k => visible.includes(k))
    if (chosen.length > 0) return chosen
  }
  const kept = hidden && hidden.length > 0 ? keys.filter(k => !hidden.includes(k)) : keys
  return kept.length > 0 ? kept : keys
}

/** Lit le paramètre BRUT (non décodé) ; une entrée malformée est ignorée, jamais fatale. */
export const parsePanesParam = (raw: string | null | undefined): { [id: string]: string[] } => {
  const out: { [id: string]: string[] } = {}
  if (!raw) return out
  const dec = (s: string): string => { try { return decodeURIComponent(s) } catch { return '' } }
  raw.split(';').forEach(part => {
    const i = part.indexOf(':')
    if (i <= 0) return
    const id = dec(part.slice(0, i))
    const keys = part.slice(i + 1).split(',').map(dec).filter(k => k !== '')
    if (id !== '' && keys.length > 0) out[id] = keys
  })
  return out
}

/** La valeur brute de `panes` dans une chaîne de requête (`?a=1&panes=…`), sans décodage. */
export const rawPanesParam = (search: string): string | null => {
  const m = new RegExp('(?:^|[?&])' + PANES_URL_PARAM + '=([^&#]*)').exec(search)
  return m ? m[1].replace(/\+/g, ' ') : null
}
