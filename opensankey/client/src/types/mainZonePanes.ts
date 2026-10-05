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

/**
 * Forme compacte : `w_2:exporte,importe;w_5:a` — fenêtre, deux-points, clés VISIBLES séparées par
 * des virgules ; fenêtres séparées par des points-virgules. Chaque nom est encodé
 * (`encodeURIComponent`), les séparateurs restent lisibles dans l'adresse.
 */
export const formatPanesParam = (choice: { [id: string]: string[] }): string =>
  Object.entries(choice)
    .filter(([, keys]) => keys.length > 0)
    .map(([id, keys]) => encodeURIComponent(id) + ':' + keys.map(encodeURIComponent).join(','))
    .join(';')

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

/**
 * Réécrit `panes` dans une chaîne de requête, les autres paramètres intacts. Valeur vide = retiré.
 * Écrit à la main plutôt que par `URLSearchParams`, qui encoderait `:` `,` `;` et rendrait
 * l'adresse illisible.
 */
export const withPanesParam = (search: string, value: string): string => {
  const kept = search.replace(/^\?/, '').split('&')
    .filter(p => p !== '' && p.split('=')[0] !== PANES_URL_PARAM)
  if (value !== '') kept.push(PANES_URL_PARAM + '=' + value)
  return kept.length > 0 ? '?' + kept.join('&') : ''
}
