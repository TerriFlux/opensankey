import { Class_ApplicationData } from '../types/ApplicationData'
import type { Type_JSON } from '../types/Utils'

// ==================================================================================================
// sa#283 lot 6 — ÉTAT DE TAGS et ORDRE DES FLUX d'un nœud : lisibles, réinscriptibles,
// exactement réversibles — les deux dernières catégories de données qu'une vue contextuelle
// ne savait pas transporter (mesurées par le pilote SOCLE Céréales : `tags` 131 écarts,
// `links_order` 305, tous deux « unhandled » avant ce lot).
//
// LE PIÈGE VÉRIFIÉ ICI est celui du lot 5, une famille plus loin : la visibilité est
// MÉMOÏSÉE. `are_related_node_tags_selected` garde son résultat dans
// `_are_related_node_tags_selected`, et sa seconde garde (`sankey.node_tags_fingerprint`)
// ne bouge PAS quand on change l'appartenance d'UN nœud — cette empreinte décrit la
// SÉLECTION des étiquettes, pas qui les porte. Sans invalidation explicite, l'overlay
// s'applique donc sans le moindre effet visible. Le test « le cache de visibilite est
// invalide » ci-dessous échoue si l'on retire `tagsUpdated()` d'`applyTagsState`.
// ==================================================================================================

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

/**
 * Micro-diagramme : un groupe de tags de NŒUD (`type de noeud`, seul « secteur » est
 * sélectionné) et un groupe de NIVEAU (`dimension 1`). `Rhd` est l'enfant d'agrégation de
 * `Alim` et porte les niveaux 4 et 5 — la forme exacte du cas SOCLE Céréales.
 */
const fixture = (): Type_JSON => JSON.parse(JSON.stringify({
  version: '1.1.4',
  nodeTags: {
    'type de noeud': {
      name: 'Type de noeud',
      banner: 'none',
      tags_order: ['produit', 'secteur'],
      tags: {
        produit: { name: 'produit', selected: false, color: '#000083' },
        secteur: { name: 'secteur', selected: true, color: '#ffff00' },
      },
      use_colors: false,
    },
  },
  levelTags: {
    'dimension 1': {
      name: 'Dimension 1',
      banner: 'none',
      tags_order: ['1', '2', '3', '4', '5'],
      tags: {
        1: { name: '1', selected: true, color: '#000083' },
        2: { name: '2', selected: false, color: '#027dc6' },
        3: { name: '3', selected: false, color: '#05ffff' },
        4: { name: '4', selected: false, color: '#ffff00' },
        5: { name: '5', selected: false, color: '#fc5500' },
      },
      use_colors: false,
      activated: true,
      siblings: [],
    },
  },
  nodes: {
    Alim: {
      name: 'Alimentation humaine', x: 100, y: 100,
      tags: { 'type de noeud': ['secteur'] },
    },
    Rhd: {
      name: 'RHD', x: 300, y: 100,
      dimensions: { 'dimension 1': { parent_name: 'Alim' } },
      tags: { 'dimension 1': ['4', '5'], 'type de noeud': ['secteur'] },
      inputLinksId: ['Ble---Rhd', 'Mais---Rhd', 'Riz---Rhd'],
      links_order: ['Ble---Rhd', 'Mais---Rhd', 'Riz---Rhd'],
    },
    Ble: { name: 'Ble', x: 100, y: 200 },
    Mais: { name: 'Mais', x: 100, y: 300 },
    Riz: { name: 'Riz', x: 100, y: 400 },
  },
  links: {
    'Ble---Rhd': { idSource: 'Ble', idTarget: 'Rhd' },
    'Mais---Rhd': { idSource: 'Mais', idTarget: 'Rhd' },
    'Riz---Rhd': { idSource: 'Riz', idTarget: 'Rhd' },
  },
}))

function loadFixture() {
  const app = new Class_ApplicationData(false)
  app.fromJSON(fixture() as never, {}, false)
  return app.drawing_area.sankey
}

describe('sa#283 lot 6 — etat de tags du noeud (tagsStateToJSON / applyTagsState)', () => {

  it('lit l etat sur la forme exacte du JSON, groupes cites seulement', () => {
    const rhd = loadFixture().nodes_dict['Rhd']
    expect(rhd.tagsStateToJSON()).toEqual({
      'dimension 1': ['4', '5'],
      'type de noeud': ['secteur'],
    })
    // Restriction aux groupes cites ; un groupe sans aucun tag sur ce noeud vaut [].
    expect(rhd.tagsStateToJSON(['dimension 1'])).toEqual({ 'dimension 1': ['4', '5'] })
    const ble = loadFixture().nodes_dict['Ble']
    expect(ble.tagsStateToJSON(['dimension 1', 'type de noeud']))
      .toEqual({ 'dimension 1': [], 'type de noeud': [] })
  })

  it('rejouer son propre etat est un NO-OP', () => {
    const rhd = loadFixture().nodes_dict['Rhd']
    const before = rhd.tagsStateToJSON()
    rhd.applyTagsState(before)
    expect(rhd.tagsStateToJSON()).toEqual(before)
  })

  it('remplace l appartenance des SEULS groupes cites, et le patch inverse la restaure', () => {
    const rhd = loadFixture().nodes_dict['Rhd']
    const origine = rhd.tagsStateToJSON(['dimension 1'])
    expect(origine).toEqual({ 'dimension 1': ['4', '5'] })

    // Le cas SOCLE : la page d'epoque du ble tendre repatche les niveaux de RHD.
    rhd.applyTagsState({ 'dimension 1': ['2', '3', '4', '5'] })
    expect(rhd.tagsStateToJSON()).toEqual({
      'dimension 1': ['2', '3', '4', '5'],
      'type de noeud': ['secteur'], // groupe NON cite : intact
    })

    // Patch inverse : on rejoue l'etat memorise sur les memes cles.
    rhd.applyTagsState(origine)
    expect(rhd.tagsStateToJSON()).toEqual({
      'dimension 1': ['4', '5'],
      'type de noeud': ['secteur'],
    })
  })

  it('un groupe cite avec une liste VIDE detache le noeud de ce groupe, reversiblement', () => {
    const rhd = loadFixture().nodes_dict['Rhd']
    const origine = rhd.tagsStateToJSON(['type de noeud'])
    rhd.applyTagsState({ 'type de noeud': [] })
    expect(rhd.tagsStateToJSON()['type de noeud']).toBeUndefined() // plus aucun tag du groupe
    rhd.applyTagsState(origine)
    expect(rhd.tagsStateToJSON()['type de noeud']).toEqual(['secteur'])
  })

  it('un groupe inconnu et une etiquette inconnue sont IGNORES silencieusement', () => {
    const rhd = loadFixture().nodes_dict['Rhd']
    rhd.applyTagsState({ 'groupe absent du maitre': ['x'] })
    rhd.applyTagsState({ 'dimension 1': ['4', '99'] }) // '99' n'existe pas dans le groupe
    expect(rhd.tagsStateToJSON()).toEqual({
      'dimension 1': ['4'],
      'type de noeud': ['secteur'],
    })
  })

  it('l ANTI-TAG de niveau (0) fait l aller ET le retour', () => {
    const rhd = loadFixture().nodes_dict['Rhd']
    const origine = rhd.tagsStateToJSON(['dimension 1'])
    rhd.applyTagsState({ 'dimension 1': ['0'] })
    expect(rhd.tagsStateToJSON()['dimension 1']).toEqual(['0'])
    rhd.applyTagsState(origine)
    expect(rhd.tagsStateToJSON()['dimension 1']).toEqual(['4', '5'])
  })

  it('le cache des tags de noeud est invalide : l overlay a un EFFET, pas seulement un etat', () => {
    const rhd = loadFixture().nodes_dict['Rhd']
    // 1. On FORCE la memoisation en lisant la porte de visibilite une premiere fois.
    expect(rhd.are_related_node_tags_selected).toBe(true) // porte 'secteur', selectionnee
    // 2. On bascule le noeud sur 'produit', qui n'est PAS selectionne.
    rhd.applyTagsState({ 'type de noeud': ['produit'] })
    // 3. `sankey.node_tags_fingerprint` n'a pas bouge (elle decrit la SELECTION, pas
    //    l'appartenance) : seule l'invalidation du cache fait rendre la nouvelle valeur.
    expect(rhd.are_related_node_tags_selected).toBe(false)
    // 4. Et le retour est visible lui aussi.
    rhd.applyTagsState({ 'type de noeud': ['secteur'] })
    expect(rhd.are_related_node_tags_selected).toBe(true)
  })

  it('le cache des DIMENSIONS est invalide aussi : les tags de niveau gouvernent le repli', () => {
    // C'EST LE CANARI DE CE LOT. `_are_related_dimensions_selected` n'a AUCUNE empreinte
    // de secours (contrairement au cache des tags de noeud, rattrape par
    // `node_tags_fingerprint` a travers la cross-reference tag <-> noeud) : il reste
    // memoise jusqu'a un `dimensionsUpdated()` explicite. Retirer cet appel
    // d'`applyTagsState` fait echouer ce test, et lui seul.
    const rhd = loadFixture().nodes_dict['Rhd']
    // Seul le niveau '1' est selectionne ; RHD porte les niveaux 4 et 5 : il est REPLIE.
    expect(rhd.are_related_dimensions_selected).toBe(false)
    // La page d'epoque le remonte au niveau 1 — exactement le repatchage SOCLE Cereales.
    rhd.applyTagsState({ 'dimension 1': ['1'] })
    expect(rhd.are_related_dimensions_selected).toBe(true)
    // Et l'ANTI-TAG, qui ne passe par aucun addTag/removeTag, le referme.
    rhd.applyTagsState({ 'dimension 1': ['0'] })
    expect(rhd.are_related_dimensions_selected).toBe(false)
  })
})

describe('sa#283 lot 6 — ordre des flux du noeud (linksOrderToJSON / applyLinksOrder)', () => {

  it('lit l ordre sur la forme exacte du JSON', () => {
    const rhd = loadFixture().nodes_dict['Rhd']
    expect(rhd.linksOrderToJSON()).toEqual(['Ble---Rhd', 'Mais---Rhd', 'Riz---Rhd'])
  })

  it('rejouer son propre ordre est un NO-OP, et l ordre memorise le restaure exactement', () => {
    const rhd = loadFixture().nodes_dict['Rhd']
    const origine = rhd.linksOrderToJSON()
    rhd.applyLinksOrder(origine)
    expect(rhd.linksOrderToJSON()).toEqual(origine)

    rhd.applyLinksOrder(['Riz---Rhd', 'Ble---Rhd', 'Mais---Rhd'])
    expect(rhd.linksOrderToJSON()).toEqual(['Riz---Rhd', 'Ble---Rhd', 'Mais---Rhd'])
    rhd.applyLinksOrder(origine)
    expect(rhd.linksOrderToJSON()).toEqual(origine)
  })

  it('liste PARTIELLE : les flux cites en tete, les non cites a la suite, aucun perdu', () => {
    const rhd = loadFixture().nodes_dict['Rhd']
    rhd.applyLinksOrder(['Riz---Rhd'])
    expect(rhd.linksOrderToJSON()).toEqual(['Riz---Rhd', 'Ble---Rhd', 'Mais---Rhd'])
  })

  it('un id de flux absent du maitre est IGNORE silencieusement', () => {
    const rhd = loadFixture().nodes_dict['Rhd']
    rhd.applyLinksOrder(['Sarrasin---Rhd', 'Mais---Rhd'])
    expect(rhd.linksOrderToJSON()).toEqual(['Mais---Rhd', 'Ble---Rhd', 'Riz---Rhd'])
  })
})
