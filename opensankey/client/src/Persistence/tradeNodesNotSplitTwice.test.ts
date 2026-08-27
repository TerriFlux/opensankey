import { Class_ApplicationData } from '../types/ApplicationData'
import { CURRENT_FORMAT_VERSION } from './persistenceMigrations'
import type { Type_JSON } from '../types/Utils'

/**
 * Les nœuds d'echange (import/export) sont stockes AGREGES et re-eclates au
 * chargement par `splitTrade` : un nœud par flux, nomme
 * `<extremite>-<echange>Importations`. La sauvegarde applique le contrat
 * inverse (`SankeyPersistence.toJSON` reecrit un nœud eclate en son agregat).
 *
 * Les fichiers ANCIENS ne respectent pas ce contrat : ils stockent les nœuds
 * DEJA eclates (Bois Savoie 0.8 : 316 de ses 506 nœuds). La garde qui les
 * protegeait etait `!node.sibling` — or la fratrie n'est pas persistee, donc
 * elle est toujours absente juste apres un chargement. Ces fichiers etaient
 * donc eclates une seconde fois, et la generation ainsi fabriquee perdait sa
 * hierarchie de niveaux : `setTradeDimensions` lit la racine de l'echange en
 * `id.split('-')[1]`, qui sur un nom deja eclate designe le produit. Un nœud
 * sans dimension gouvernante etant visible a tous les niveaux, le diagramme
 * agrege affichait tous ses flux d'echange au lieu des seuls agreges.
 */

// L identifiant du groupe est en MINUSCULES : c est sous cette clé que le
// mecanisme d echange le cherche (`node_taggs_dict['type de noeud']`), et c est
// ce que la conversion legacy produit a partir du « Type de noeud » des
// fichiers anciens. L ecrire capitalise ici ferait passer les tests a vide.
const NODE_TAGGS = {
  'type de noeud': {
    group_name: 'Type de noeud',
    banner: 'none',
    activated: true,
    tags: {
      produit: { name: 'produit', selected: true },
      echange: { name: 'echange', selected: true }
    }
  }
}

/** Fichier ou l'echange est stocke DEJA eclate, un nœud par produit. */
function alreadySplitFile(): Type_JSON {
  return {
    // `format_version` present : les migrations legacy a seuil sont neutralisees
    // (cf. effectiveLoadVersion). L eclatement des echanges, lui, tourne pour
    // TOUS les fichiers — c est bien lui qu on teste, pas la conversion.
    version: '1.3.0',
    format_version: CURRENT_FORMAT_VERSION,
    nodes: {
      Connexes: { idNode: 'Connexes', name: 'Connexes', tags: { 'type de noeud': ['produit'] } },
      Sciures: { idNode: 'Sciures', name: 'Sciures', tags: { 'type de noeud': ['produit'] } },
      'Connexes-ImportNettesImportations': {
        idNode: 'Connexes-ImportNettesImportations',
        name: 'Connexes - ImportNettesImportations',
        trade_close: true,
        tags: { 'type de noeud': ['echange'] }
      },
      'Sciures-ImportNettesImportations': {
        idNode: 'Sciures-ImportNettesImportations',
        name: 'Sciures - ImportNettesImportations',
        trade_close: true,
        tags: { 'type de noeud': ['echange'] }
      }
    },
    links: {
      l1: { idLink: 'l1', idSource: 'Connexes-ImportNettesImportations', idTarget: 'Connexes', value: { value: 10 } },
      l2: { idLink: 'l2', idSource: 'Sciures-ImportNettesImportations', idTarget: 'Sciures', value: { value: 5 } }
    },
    nodeTags: NODE_TAGGS
  } as unknown as Type_JSON
}

/** Fichier ou l'echange est stocke AGREGE, avec un SEUL flux (mfa_problem#222). */
function aggregatedMonoFluxFile(): Type_JSON {
  return {
    // `format_version` present : les migrations legacy a seuil sont neutralisees
    // (cf. effectiveLoadVersion). L eclatement des echanges, lui, tourne pour
    // TOUS les fichiers — c est bien lui qu on teste, pas la conversion.
    version: '1.3.0',
    format_version: CURRENT_FORMAT_VERSION,
    nodes: {
      Connexes: { idNode: 'Connexes', name: 'Connexes', tags: { 'type de noeud': ['produit'] } },
      ImportNettes: {
        idNode: 'ImportNettes',
        name: 'ImportNettes',
        trade_close: true,
        tags: { 'type de noeud': ['echange'] }
      }
    },
    links: {
      l1: { idLink: 'l1', idSource: 'ImportNettes', idTarget: 'Connexes', value: { value: 10 } }
    },
    nodeTags: NODE_TAGGS
  } as unknown as Type_JSON
}

/**
 * Fichier MIXTE : un echange encore agrege (donc a eclater) ET un echange deja
 * eclate. C'est le cas qui distingue les deux gardes — le portillon de
 * `afterFromJSON` s'ouvre a cause du premier, et seule la garde par nœud de
 * `splitTrade` empeche alors le second d'etre eclate une seconde fois.
 */
function mixedFile(): Type_JSON {
  return {
    version: '1.3.0',
    format_version: CURRENT_FORMAT_VERSION,
    nodes: {
      Connexes: { idNode: 'Connexes', name: 'Connexes', tags: { 'type de noeud': ['produit'] } },
      Sciures: { idNode: 'Sciures', name: 'Sciures', tags: { 'type de noeud': ['produit'] } },
      Ecorces: { idNode: 'Ecorces', name: 'Ecorces', tags: { 'type de noeud': ['produit'] } },
      // Agrege : deux flux, aucun prefixe d extremite -> a eclater.
      ImportNettes: {
        idNode: 'ImportNettes',
        name: 'ImportNettes',
        trade_close: true,
        tags: { 'type de noeud': ['echange'] }
      },
      // Deja eclate : un seul flux, prefixe par son extremite -> intouchable.
      'Ecorces-ExportNettesExportations': {
        idNode: 'Ecorces-ExportNettesExportations',
        name: 'Ecorces - ExportNettesExportations',
        trade_close: true,
        tags: { 'type de noeud': ['echange'] }
      }
    },
    links: {
      l1: { idLink: 'l1', idSource: 'ImportNettes', idTarget: 'Connexes', value: { value: 10 } },
      l2: { idLink: 'l2', idSource: 'ImportNettes', idTarget: 'Sciures', value: { value: 5 } },
      l3: { idLink: 'l3', idSource: 'Ecorces', idTarget: 'Ecorces-ExportNettesExportations', value: { value: 7 } }
    },
    nodeTags: NODE_TAGGS
  } as unknown as Type_JSON
}

function loadApp(json: Type_JSON) {
  const app = new Class_ApplicationData(false)
  app.fromJSON(JSON.parse(JSON.stringify(json)) as never, {}, false)
  return app
}

function load(json: Type_JSON) {
  return loadApp(json).drawing_area.sankey
}

function nodeIds(sankey: ReturnType<typeof load>) {
  return (sankey.nodes_list as unknown as { id: string }[]).map(n => n.id).sort()
}

it('un noeud d echange deja eclate n est pas eclate une seconde fois', () => {
  const sankey = load(alreadySplitFile())
  const ids = (sankey.nodes_list as unknown as { id: string }[]).map(n => n.id).sort()

  // Aucune seconde generation : l identifiant a double suffixe est la signature
  // du re-eclatement (`<extremite>-<deja eclate>Importations`).
  expect(ids.filter(id => id.includes('ImportationsImportations'))).toEqual([])
  expect(ids).toEqual([
    'Connexes',
    'Connexes-ImportNettesImportations',
    'Sciures',
    'Sciures-ImportNettesImportations'
  ])

  // Et les nœuds du fichier restent VISIBLES : le re-eclatement les masquait au
  // profit de la generation fabriquee.
  const visible = (sankey.nodes_list as unknown as { id: string, is_visible: boolean }[])
    .filter(n => n.is_visible).map(n => n.id).sort()
  expect(visible).toContain('Connexes-ImportNettesImportations')
  expect(visible).toContain('Sciures-ImportNettesImportations')
})

it('un fichier mixte eclate l agrege sans re-eclater le deja eclate', () => {
  const sankey = load(mixedFile())
  const nodes = sankey.nodes_list as unknown as { id: string, is_visible: boolean }[]
  const ids = nodes.map(n => n.id)

  // L agrege est bien eclate, un nœud par flux.
  expect(ids).toContain('Connexes-ImportNettesImportations')
  expect(ids).toContain('Sciures-ImportNettesImportations')

  // Le deja eclate traverse le chargement intact et VISIBLE — c est ici que la
  // garde par nœud de splitTrade travaille, le portillon d afterFromJSON etant
  // ouvert par l agrege ci-dessus.
  expect(ids.filter(id => id.includes('ExportationsExportations'))).toEqual([])
  expect(ids).toContain('Ecorces-ExportNettesExportations')
  expect(nodes.filter(n => n.is_visible).map(n => n.id))
    .toContain('Ecorces-ExportNettesExportations')
})

it('un fichier mixte se retrouve identique apres aller-retour', () => {
  // Le nœud deja eclate n a PAS de fratrie (on ne l a pas eclate), donc
  // `toJSON` l ecrit tel quel au lieu de le remplacer par son agregat. Il faut
  // verifier qu il survit a la sauvegarde : un fichier ancien qui perdrait ses
  // nœuds d echange en etant reenregistre serait un degat pire que le bug.
  const first = loadApp(mixedFile())
  const before = nodeIds(first.drawing_area.sankey)

  const saved = JSON.parse(JSON.stringify(first.toJSON())) as Type_JSON
  const after = nodeIds(load(saved))

  expect(after).toEqual(before)
  expect(after).toContain('Ecorces-ExportNettesExportations')
  expect(after.filter(id => id.includes('ExportationsExportations'))).toEqual([])
})

it('un echange agrege mono-flux reste eclate (mfa_problem#222)', () => {
  const sankey = load(aggregatedMonoFluxFile())
  const ids = (sankey.nodes_list as unknown as { id: string }[]).map(n => n.id)

  // Le nœud agrege ne porte pas l identifiant de son extremite en prefixe : il
  // est donc eclate, comme avant. C est le cas que `!node.sibling` cherchait a
  // couvrir, et qu il ne faut pas reperdre en corrigeant l autre.
  expect(ids).toContain('Connexes-ImportNettesImportations')
})
