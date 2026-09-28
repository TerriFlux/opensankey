import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import type { Class_LinkValue } from './LinkValues'
import type { Class_LinkElement } from './Link'

// jest 27 / jsdom n'expose pas structuredClone (utilise par Link.copyFrom)
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511 lot 1 — AGREGAT. `Link.value` adresse un POINT du cube : viser un membre PARENT ne
// rendait rien, alors que la donnee existe feuille par feuille. `Link.contributing_values` rend
// la liste des valeurs a additionner — pas leur somme, parce que la couche a lire (donnee saisie
// ou resultat reconcilie) n est decidable que par l appelant.
//
// On passe par la voie PUBLIQUE du flux, celle que le dessin empruntera.

type Montage = {
  lien: Class_LinkElement,
  groupe: Class_DataTagGroup,
  produits: Class_DataTag,
  cereales: Class_DataTag,
  ble: Class_DataTag,
  mais: Class_DataTag,
  lait: Class_DataTag,
}

/**
 *   produits          (racine)
 *     cereales
 *       ble    = 30
 *       mais   = 12
 *     lait     = 7   (feuille courte, directement sous la racine)
 */
function monter(): Montage {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const groupe = sankey.addDataTagGroup('filiere', 'Filiere', false) as Class_DataTagGroup
  const produits = groupe.addTag('Produits', 'produits') as Class_DataTag
  const cereales = groupe.addTag('Cereales', 'cereales') as Class_DataTag
  const ble = groupe.addTag('Ble', 'ble') as Class_DataTag
  const mais = groupe.addTag('Mais', 'mais') as Class_DataTag
  const lait = groupe.addTag('Lait', 'lait') as Class_DataTag
  cereales.parent = produits
  ble.parent = cereales
  mais.parent = cereales
  lait.parent = produits
  groupe.levels = ['produits', 'filieres', 'produit']

  // Le flux est cree APRES la dimension : son arbre de valeurs porte alors un etage par
  // dimension, un enfant par membre.
  const lien = sankey.addNewLink(
    sankey.addNewNodeWithName('Source'),
    sankey.addNewNodeWithName('Cible')
  )
  poser(lien, ble, 30)
  poser(lien, mais, 12)
  poser(lien, lait, 7)
  return { lien, groupe, produits, cereales, ble, mais, lait }
}

/**
 * Selectionne un membre, et lui seul, dans sa dimension.
 *
 * On ne passe PAS par selectTagsFromId : il lit selected_tags_list[0] et suppose donc
 * qu un membre est deja selectionne, ce qui n est pas le cas d un groupe cree sans membre
 * par defaut. On pose la selection directement, ce qui est aussi plus explicite ici.
 */
function viser(groupe: Class_DataTagGroup, membre: Class_DataTag) {
  groupe.tags_list.forEach(tag => tag.setUnSelected())
  membre.setSelected()
}

/** Renseigne la valeur SAISIE d un membre : c est ce qui fait qu une valeur porte quelque chose. */
function poser(lien: Class_LinkElement, membre: Class_DataTag, nombre: number) {
  viser(membre.group as Class_DataTagGroup, membre)
  const valeur = lien.value as Class_LinkValue
  valeur.valueData = nombre
}

/** Somme de la couche SAISIE, comme le ferait un appelant qui lit la donnee collectee. */
function sommeSaisie(valeurs: Class_LinkValue[] | null): number | null {
  if (valeurs === null) return null
  return valeurs.reduce((total, v) => total + (v.valueData ?? 0), 0)
}

/** Ce que le flux contribue quand on vise `membre`. */
function contribue(montage: Montage, membre: Class_DataTag): Class_LinkValue[] | null {
  viser(montage.groupe, membre)
  return montage.lien.contributing_values
}

describe('os#1511 — agregat d un membre parent', () => {
  test('une FEUILLE rend sa propre valeur, comme avant', () => {
    const m = monter()
    expect(sommeSaisie(contribue(m, m.ble))).toBe(30)
  })

  test('un membre PARENT rend la somme de ses feuilles', () => {
    const m = monter()
    const contributions = contribue(m, m.cereales)
    expect(contributions).toHaveLength(2)
    expect(sommeSaisie(contributions)).toBe(42)
  })

  test('la RACINE agrege toute la dimension, branche courte comprise', () => {
    const m = monter()
    // 30 + 12 + 7 : le lait, feuille moins profonde, doit entrer dans le total.
    expect(sommeSaisie(contribue(m, m.produits))).toBe(49)
  })

  test('les TOTAUX ne bougent pas d un niveau a l autre — le critere de recette', () => {
    const m = monter()
    const niveau_0 = sommeSaisie(contribue(m, m.produits)) ?? 0
    const niveau_1 = (sommeSaisie(contribue(m, m.cereales)) ?? 0)
      + (sommeSaisie(contribue(m, m.lait)) ?? 0)
    const niveau_2 = (sommeSaisie(contribue(m, m.ble)) ?? 0)
      + (sommeSaisie(contribue(m, m.mais)) ?? 0)
      + (sommeSaisie(contribue(m, m.lait)) ?? 0)
    expect(niveau_0).toBe(49)
    expect(niveau_1).toBe(niveau_0)
    expect(niveau_2).toBe(niveau_0)
  })
})

describe('os#1511 — la valeur portee au niveau demande FAIT FOI', () => {
  test('un parent qui porte sa propre valeur n est pas recalcule', () => {
    const m = monter()
    // Le fichier connait le total des cereales : 40, et non les 42 de ses produits.
    poser(m.lien, m.cereales, 40)
    const contributions = contribue(m, m.cereales)
    expect(contributions).toHaveLength(1)
    expect(sommeSaisie(contributions)).toBe(40)
  })
})

describe('os#1511 — une feuille ELAGUEE ne vaut pas zero', () => {
  test('elle est sautee dans la somme, elle ne la tire pas vers le bas', () => {
    const m = monter()
    viser(m.groupe, m.mais);
    (m.lien.value as Class_LinkValue).structurally_absent = true
    const contributions = contribue(m, m.cereales)
    // Seul le ble contribue : 30, et non 30 + 0.
    expect(contributions).toHaveLength(1)
    expect(sommeSaisie(contributions)).toBe(30)
  })

  test('TOUTES les feuilles absentes rendent le parent ABSENT, pas nul', () => {
    const m = monter()
    viser(m.groupe, m.ble);
    (m.lien.value as Class_LinkValue).structurally_absent = true
    viser(m.groupe, m.mais);
    (m.lien.value as Class_LinkValue).structurally_absent = true
    // null, et surtout pas 0 : un zero se dessinerait en flux fantome.
    expect(contribue(m, m.cereales)).toBeNull()
  })

  test('un membre SANS valeur ni descendance est absent', () => {
    const m = monter()
    const vide = m.groupe.addTag('Vide', 'vide') as Class_DataTag
    expect(contribue(m, vide)).toBeNull()
  })
})

describe('os#1511 — une dimension PLATE se comporte comme avant', () => {
  test('sans hierarchie, un membre ne rend que ce qu il porte', () => {
    const app = new Class_ApplicationData(false)
    const sankey = app.drawing_area.sankey
    const groupe = sankey.addDataTagGroup('annee', 'Annee', false) as Class_DataTagGroup
    const a2015 = groupe.addTag('2015', '2015') as Class_DataTag
    const a2019 = groupe.addTag('2019', '2019') as Class_DataTag
    const lien = sankey.addNewLink(
      sankey.addNewNodeWithName('A'),
      sankey.addNewNodeWithName('B')
    )
    poser(lien, a2015, 5)
    viser(groupe, a2015)
    expect(sommeSaisie(lien.contributing_values)).toBe(5)
    // 2019 ne porte rien et n a pas de descendance : absent, pas zero.
    viser(groupe, a2019)
    expect(lien.contributing_values).toBeNull()
  })
})

// os#1511 — CE QUE LE DESSIN LIT. L agregat ci-dessus etait calcule mais personne ne l appelait :
// sur le jeu de demonstration, le flux se dessinait SANS VALEUR au niveau des parents (constate
// par Julien, 28/09). `valueCurrent` est le seul chemin par lequel il entre dans le dessin.

describe('os#1511 — l agregat entre dans le DESSIN', () => {
  test('viser un PARENT donne la somme de ses feuilles, pas rien', () => {
    const m = monter()
    viser(m.groupe, m.cereales)
    expect(m.lien.valueCurrent).toBe(42)
    viser(m.groupe, m.produits)
    expect(m.lien.valueCurrent).toBe(49)
  })

  test('une FEUILLE garde sa valeur propre, le repli ne s en mele pas', () => {
    const m = monter()
    viser(m.groupe, m.ble)
    expect(m.lien.valueCurrent).toBe(30)
  })

  test('une valeur SAISIE au niveau du parent prime sur la somme de ses feuilles', () => {
    const m = monter()
    poser(m.lien, m.cereales, 100)
    viser(m.groupe, m.cereales)
    // Un total saisi a la main peut differer de la somme du detail : c est le total qui fait foi.
    expect(m.lien.valueCurrent).toBe(100)
  })

  test('un diagramme SANS hierarchie ne change pas de comportement', () => {
    const m = monter()
    m.groupe.levels = []
    m.groupe.tags_list.forEach(tag => { (tag as Class_DataTag).parent = undefined })
    viser(m.groupe, m.cereales)
    // Plus de hierarchie, donc plus de feuilles a sommer : le flux n a rien a montrer ici, et
    // le repli ne doit pas inventer une valeur.
    expect(m.lien.valueCurrent).toBeNull()
  })
})

// os#1511 — CE QU UNE FIGURE EPINGLEE LIT. `valueCurrent` suit la SELECTION ; toutes les figures,
// elles, lisent par `valueForDataTags` une coordonnee EPINGLEE, sans toucher a la selection
// (os#1231). Cette lecture n adressait qu un POINT du cube : epinglee sur « Cereales », une
// couronne n y trouvait rien et affichait zero, pendant que le meme diagramme montrait le total.
// C est aussi la lecture du mode « echelle adaptee » et de l extraction unitaire.

describe('os#1511 — une figure epinglee sur un parent lit l agregat', () => {
  test('la coordonnee d un PARENT rend la somme de ses feuilles', () => {
    const m = monter()
    expect(m.lien.valueForDataTags([m.cereales])).toBe(42)
    expect(m.lien.valueForDataTags([m.produits])).toBe(49)
  })

  test('une FEUILLE garde sa valeur propre, le repli ne s en mele pas', () => {
    const m = monter()
    expect(m.lien.valueForDataTags([m.ble])).toBe(30)
  })

  test('une valeur SAISIE au niveau du parent prime sur la somme de ses feuilles', () => {
    const m = monter()
    poser(m.lien, m.cereales, 100)
    expect(m.lien.valueForDataTags([m.cereales])).toBe(100)
  })

  test('la lecture epinglee ne depend pas de la selection courante et ne la deplace pas', () => {
    const m = monter()
    viser(m.groupe, m.ble)
    expect(m.lien.valueForDataTags([m.lait])).toBe(7)
    expect(m.ble.is_selected).toBe(true)
  })

  test('un membre sans valeur ni descendance reste ABSENT, pas nul', () => {
    const m = monter()
    const vide = m.groupe.addTag('Vide', 'vide') as Class_DataTag
    expect(m.lien.valueForDataTags([vide])).toBeNull()
  })

  test('un diagramme SANS hierarchie ne change pas de comportement', () => {
    const m = monter()
    m.groupe.levels = []
    m.groupe.tags_list.forEach(tag => { (tag as Class_DataTag).parent = undefined })
    expect(m.lien.valueForDataTags([m.cereales])).toBeNull()
  })
})

// os#1511 — LES BANDES D UN MEMBRE PARENT. Julien a mis « Pays partenaire » en choix multiple,
// coche Europe et Afrique, et le flux a disparu : une bande lit la feuille a sa coordonnee, or
// un parent n en porte pas. Comme l epaisseur du flux vient de ses bandes, le flux entier
// s effacait.

describe('os#1511 — une bande sur un membre parent vaut la somme de ses feuilles', () => {
  test('deux parents coches donnent deux bandes, pas zero', () => {
    const m = monter()
    m.groupe.banner = 'multi'
    m.groupe.tags_list.forEach(t => t.setUnSelected())
    m.cereales.setSelected()
    m.lait.setSelected()
    const bandes = m.lien.tagged_value_bands
    expect(bandes.map(b => b.id).sort()).toEqual(['cereales', 'lait'])
    // Cereales = ble 30 + mais 12 ; Lait porte sa valeur, 7.
    expect(bandes.find(b => b.id === 'cereales')?.value).toBe(42)
    expect(bandes.find(b => b.id === 'lait')?.value).toBe(7)
  })

  test('une FEUILLE garde sa valeur propre, le repli ne s en mele pas', () => {
    const m = monter()
    m.groupe.banner = 'multi'
    m.groupe.tags_list.forEach(t => t.setUnSelected())
    m.ble.setSelected()
    m.mais.setSelected()
    const bandes = m.lien.tagged_value_bands
    expect(bandes.find(b => b.id === 'ble')?.value).toBe(30)
    expect(bandes.find(b => b.id === 'mais')?.value).toBe(12)
  })

  test('un parent SANS aucune feuille renseignee ne fait pas de bande a zero', () => {
    const m = monter()
    m.groupe.banner = 'multi'
    poser(m.lien, m.ble, null as unknown as number)
    poser(m.lien, m.mais, null as unknown as number)
    m.groupe.tags_list.forEach(t => t.setUnSelected())
    m.cereales.setSelected()
    m.lait.setSelected()
    const bandes = m.lien.tagged_value_bands
    // « Ce flux n existe pas ici » n est pas « il vaut 0 » : pas de bande fantome.
    expect(bandes.map(b => b.id)).toEqual(['lait'])
  })
})

// os#1511 — UNE dimension se dessine en NOEUDS, les autres en bandes (decision du 28/09).
// « Sur les noeuds dupliques, le mode multiple fait apparaitre des noeuds au lieu de faire
// apparaitre des bandes. »

describe('os#1511 — une dimension attachee ne fait pas de bandes', () => {
  test('en choix multiple, une dimension ATTACHEE n en produit aucune', () => {
    const m = monter()
    m.groupe.banner = 'multi'
    m.groupe.tags_list.forEach(t => t.setUnSelected())
    m.cereales.setSelected()
    m.lait.setSelected()
    expect(m.lien.tagged_value_bands.length).toBe(2)
    // On attache la cible a cet axe : ses membres deviennent des noeuds, plus des bandes.
    m.lien.target.driving_dimension = m.groupe
    expect(m.lien.tagged_value_bands).toEqual([])
  })
})

// os#1511 — UNE DIMENSION EN BANDES PENDANT QU UNE AUTRE PILOTE DES NOEUDS. Julien a mis
// « Filiere » en choix multiple, coche deux filieres, et le flux a disparu : le noeud engendre
// demandait sa valeur avec DEUX filieres visees, et n obtenait rien.

describe('os#1511 — plusieurs membres vises sur un axe s additionnent', () => {
  test('deux membres vises rendent la somme de leurs contributions', () => {
    const m = monter()
    viser(m.groupe, m.ble)
    m.mais.setSelected()
    expect(sommeSaisie(m.lien.contributing_values)).toBe(42)
  })

  test('deux PARENTS vises passent aussi par leurs feuilles', () => {
    const m = monter()
    viser(m.groupe, m.cereales)
    m.lait.setSelected()
    // Cereales = 30 + 12, Lait = 7.
    expect(sommeSaisie(m.lien.contributing_values)).toBe(49)
  })

  test('deux membres dont aucun n apporte rien restent ABSENTS', () => {
    const m = monter()
    poser(m.lien, m.ble, null as unknown as number)
    poser(m.lien, m.mais, null as unknown as number)
    viser(m.groupe, m.ble)
    m.mais.setSelected()
    expect(m.lien.contributing_values).toBeNull()
  })
})
