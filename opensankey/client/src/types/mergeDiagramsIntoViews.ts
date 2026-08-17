// Fusion de plusieurs DIAGRAMMES independants en UN document a plusieurs VUES.
//
// Cas d'usage : une etude livree en N fichiers .json.gz qui sont N PRESENTATIONS du meme
// graphe (mise en page, etiquettes, filtres) et non N jeux de donnees. Les reunir en un
// seul document a N vues divise la taille par autant et donne au lecteur un selecteur de
// vues au lieu de N liens.
//
// POURQUOI CE MODULE EXISTE — la lecon de sa#412 (fusion SOCLE Cereales, revertee pour
// presentation corrompue) : le piege est de FABRIQUER LES DELTAS A LA MAIN. Une vue n'est
// PAS un delta dans le modele : c'est un SNAPSHOT INTEGRAL de la racine, exactement ce que
// `ViewsManager.createNewView` stocke (`compressJSONToGzip(DrawingAreaPersistence.toJSON(da))`).
// Le delta (`__patch`, format_version 2) est un pur ENCODAGE DE SERIALISATION applique en
// DERNIER par `encodeViewsAsDelta`, qui porte son propre garde-fou : une vue dont le patch
// ne la reconstitue pas a l'identique reste en snapshot integral. En passant par lui plutot
// qu'en ecrivant des patchs a la main, l'encodage ne peut pas degrader la presentation.
//
// Ce module est donc volontairement mince : il assemble des snapshots deja produits par
// `toJSON` et delegue toute la compression a `encodeViewsAsDelta`. Il ne fabrique aucun
// patch et ne migre aucun format — les snapshots fournis doivent deja etre au format
// courant et homogenes entre eux (voir la note sur la BASE du patch ci-dessous).
//
// BASE DU PATCH — `encodeViewsAsDelta` diffe chaque vue contre « la racine privee de sa
// cle `views` ». Toute cle racine doit donc etre posee AVANT l'encodage, sinon chaque vue
// decodee en herite (piege rencontre trois fois : vignettes OSP#199, labels sa#396,
// feuilles OS#85). C'est l'ordre respecte par `buildMultiViewDocument`.

import { encodeViewsAsDelta } from './viewDelta'
import { MASTER_VIEW_ID } from './ViewsQuery'
import type { Type_JSON } from './Utils'

/** Une vue a fabriquer : son identifiant, son nom affiche, et le diagramme qui la porte. */
export type Type_MergedViewSpec = {
  /** Identifiant de la vue dans le dictionnaire `views`. Unique, non vide, != maitre. */
  id: string
  /** Nom affiche dans le selecteur de vues. */
  name: string
  /**
   * Snapshot INTEGRAL du diagramme, tel que produit par `ApplicationData.toJSON()`.
   * Doit etre au meme format que le maitre (aucune migration n'est faite ici).
   */
  snapshot: Type_JSON
}

export type Type_MergeOptions = {
  /** Vue active a l'ouverture. Defaut : la premiere vue. */
  current_view?: string
  /** Proposer le maitre dans le selecteur. Defaut : false (le maitre n'est qu'un support). */
  show_master_in_views?: boolean
  /** Nom affiche du maitre s'il est propose. Defaut : ''. */
  master_view_name?: string
}

const deepClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T

/**
 * Assemble un maitre et N snapshots en un document a N vues, encode en delta.
 *
 * Le maitre porte le graphe commun ; chaque vue est un snapshot integral dont seuls `id`
 * et `name` sont surcharges — c'est la forme exacte que produit l'application elle-meme
 * (`createNewView`) et celle que relit `ViewsReader.viewsFromJSON`.
 *
 * @returns la racine du document fusionne, vues deja encodees en `__patch` quand c'est
 *          plus petit ET fidele (le garde-fou de `encodeViewsAsDelta` decide vue par vue).
 */
export function buildMultiViewDocument(
  master: Type_JSON,
  views: Type_MergedViewSpec[],
  options: Type_MergeOptions = {}
): Type_JSON {
  if (views.length === 0) throw new Error('buildMultiViewDocument : aucune vue fournie')

  const seen = new Set<string>()
  views.forEach(spec => {
    if (!spec.id) throw new Error('buildMultiViewDocument : identifiant de vue vide')
    if (spec.id === MASTER_VIEW_ID) {
      throw new Error(`buildMultiViewDocument : "${spec.id}" est reserve au maitre`)
    }
    if (seen.has(spec.id)) {
      throw new Error(`buildMultiViewDocument : identifiant de vue duplique "${spec.id}"`)
    }
    seen.add(spec.id)
  })

  // Le maitre est la racine. On repart d'une copie pour ne jamais muter l'entree.
  const root = deepClone(master)
  // Un snapshot de diagramme simple n'a pas de cle `views` ; s'il en avait une (document
  // deja multi-vues passe par erreur), elle serait prise pour la base du patch.
  delete (root as Record<string, unknown>)['views']

  const views_dict: Type_JSON = {}
  views.forEach(spec => {
    const view = deepClone(spec.snapshot) as Record<string, unknown>
    // Une vue ne porte jamais de sous-vues : `views` est une cle strictement racine.
    delete view['views']
    // `createNewView` ne surcharge que ces deux champs — on s'en tient la.
    view['id'] = spec.id
    view['name'] = spec.name
    views_dict[spec.id] = view as Type_JSON
  })

  // --- Toutes les cles RACINE doivent etre posees avant l'encodage delta ---
  root['views'] = views_dict
  root['current_view'] = options.current_view ?? views[0].id
  root['show_master_in_views'] = options.show_master_in_views ?? false
  root['master_view_name'] = options.master_view_name ?? ''

  // --- DERNIERE operation, sans exception ---
  encodeViewsAsDelta(root)

  return root
}
