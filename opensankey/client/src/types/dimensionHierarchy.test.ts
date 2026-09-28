import { Class_ApplicationData } from './ApplicationData'
import type { Class_DataTag } from './Tag'
import type { Class_DataTagGroup } from './TagGroup'
import { applyHierarchyPaletteIfGrey } from '../Algorithms/DimensionPalette'

// jest 27 / jsdom n'expose pas structuredClone (utilise par Link.copyFrom)
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511 lot 1 — une DIMENSION est un axe muni d une hierarchie de NIVEAUX. La parente est
// portee par le MEMBRE (« HS4 1001 est un enfant de Cereales brutes » est une propriete de la
// donnee), et le niveau d un membre se DEDUIT de sa profondeur : il ne se declare pas.

type Arbre = {
  groupe: Class_DataTagGroup,
  produits: Class_DataTag,
  cereales: Class_DataTag,
  brutes: Class_DataTag,
  ble: Class_DataTag,
  mais: Class_DataTag,
  lait: Class_DataTag,
}

/**
 * Hierarchie VOLONTAIREMENT DESEQUILIBREE, parce que c est le cas reel :
 *
 *   produits agricoles          (niveau 0)
 *     cereales                  (niveau 1)
 *       cereales brutes         (niveau 2)
 *         ble, mais             (niveau 3)
 *     lait                      (niveau 1) — FEUILLE, pas de sous-niveau
 */
function makeArbre(): Arbre {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const groupe = sankey.addDataTagGroup('filiere', 'Filiere', false) as Class_DataTagGroup
  const produits = groupe.addTag('Produits agricoles', 'produits') as Class_DataTag
  const cereales = groupe.addTag('Cereales', 'cereales') as Class_DataTag
  const brutes = groupe.addTag('Cereales brutes', 'brutes') as Class_DataTag
  const ble = groupe.addTag('Ble', 'ble') as Class_DataTag
  const mais = groupe.addTag('Mais', 'mais') as Class_DataTag
  const lait = groupe.addTag('Lait', 'lait') as Class_DataTag
  cereales.parent = produits
  brutes.parent = cereales
  ble.parent = brutes
  mais.parent = brutes
  lait.parent = produits
  groupe.levels = ['produits agricoles', 'filieres', 'transformation', 'produits']
  return { groupe, produits, cereales, brutes, ble, mais, lait }
}

describe('os#1511 — hierarchie d une dimension : parente portee par le membre', () => {
  test('la parente se lit dans les deux sens, et les feuilles se calculent', () => {
    const { produits, cereales, brutes, ble, mais, lait } = makeArbre()
    expect(cereales.parent).toBe(produits)
    expect(produits.parent).toBeUndefined()
    expect(produits.children.map((t: Class_DataTag) => t.id).sort()).toEqual(['cereales', 'lait'])
    expect(brutes.leaves.map((t: Class_DataTag) => t.id).sort()).toEqual(['ble', 'mais'])
    // Une feuille est sa propre feuille : c est ce qui rend l agregat uniforme.
    expect(ble.leaves.map((t: Class_DataTag) => t.id)).toEqual(['ble'])
    // Les feuilles de la racine couvrent toute la dimension, branche courte comprise.
    expect(produits.leaves.map((t: Class_DataTag) => t.id).sort()).toEqual(['ble', 'lait', 'mais'])
    expect(mais.hasAncestor(produits)).toBe(true)
    expect(produits.hasAncestor(mais)).toBe(false)
    expect(lait.leaves.map((t: Class_DataTag) => t.id)).toEqual(['lait'])
  })

  test('un CYCLE est refuse, sinon tout parcours de la hierarchie boucle', () => {
    const { produits, cereales, brutes } = makeArbre()
    // Se rendre descendant de son propre descendant : refuse, parente inchangee.
    produits.parent = brutes
    expect(produits.parent).toBeUndefined()
    // Etre son propre parent : refuse de meme.
    cereales.parent = cereales
    expect(cereales.parent).toBe(produits)
  })

  test('la profondeur donne le niveau, elle ne se declare pas', () => {
    const { groupe, produits, cereales, brutes, ble, lait } = makeArbre()
    expect(groupe.depthOf(produits)).toBe(0)
    expect(groupe.depthOf(cereales)).toBe(1)
    expect(groupe.depthOf(brutes)).toBe(2)
    expect(groupe.depthOf(ble)).toBe(3)
    expect(groupe.depthOf(lait)).toBe(1)
    expect(groupe.is_hierarchical).toBe(true)
    expect(groupe.current_level).toBe('produits agricoles')
  })
})

describe('os#1511 — membres montres a un niveau, hierarchie DESEQUILIBREE', () => {
  test('au niveau le plus agrege, seule la racine se montre', () => {
    const { groupe } = makeArbre()
    expect(groupe.membersAtLevel(0).map((t: Class_DataTag) => t.id)).toEqual(['produits'])
  })

  test('une branche COURTE reste visible sous son niveau, sinon sa donnee disparait', () => {
    const { groupe } = makeArbre()
    // Niveau 2 : « cereales brutes » est a cette profondeur, et « lait » — feuille de
    // profondeur 1 — doit rester montre. Sans cette regle, le lait disparaitrait de l ecran
    // en descendant d un niveau et les totaux cesseraient d etre justes.
    expect(groupe.membersAtLevel(2).map((t: Class_DataTag) => t.id).sort()).toEqual(['brutes', 'lait'])
    // Niveau 3, le plus fin : les deux feuilles de cereales, plus le lait toujours la.
    expect(groupe.membersAtLevel(3).map((t: Class_DataTag) => t.id).sort()).toEqual(['ble', 'lait', 'mais'])
  })

  test('un membre PLUS profond que le niveau ne se montre pas, son ancetre le represente', () => {
    const { groupe } = makeArbre()
    const au_niveau_1 = groupe.membersAtLevel(1).map((t: Class_DataTag) => t.id).sort()
    expect(au_niveau_1).toEqual(['cereales', 'lait'])
    expect(au_niveau_1).not.toContain('ble')
    expect(au_niveau_1).not.toContain('brutes')
  })

  test('une dimension PLATE montre tous ses membres, comme avant', () => {
    const { groupe } = makeArbre()
    groupe.levels = []
    expect(groupe.is_hierarchical).toBe(false)
    expect(groupe.current_level).toBeUndefined()
    expect(groupe.membersAtLevel().length).toBe(6)
  })

  test('le niveau courant reste dans les bornes des niveaux declares', () => {
    const { groupe } = makeArbre()
    groupe.current_level_index = 99
    expect(groupe.current_level_index).toBe(3)
    groupe.current_level_index = -5
    expect(groupe.current_level_index).toBe(0)
    // Raccourcir la hierarchie ne doit pas laisser le niveau courant hors des bornes.
    groupe.current_level_index = 3
    groupe.levels = ['a', 'b']
    expect(groupe.current_level_index).toBe(1)
  })
})

describe('os#1511 — changer de niveau garde la LIGNEE', () => {
  const selectionne = (g: ReturnType<typeof makeArbre>['groupe']) =>
    g.selected_tags_list.map((t: Class_DataTag) => t.id)

  test('en REMONTANT, on arrive sur l ancetre, pas sur le premier venu', () => {
    const { groupe, ble } = makeArbre()
    groupe.tags_list.forEach((t: Class_DataTag) => t.setUnSelected())
    ble.setSelected()
    groupe.selectLevel(1)
    // De « Ble » on arrive a « Cereales », son ancetre au niveau 1 — pas a « Lait ».
    expect(selectionne(groupe)).toEqual(['cereales'])
  })

  test('en DESCENDANT, on entre dans un descendant du membre courant', () => {
    const { groupe, cereales } = makeArbre()
    groupe.tags_list.forEach((t: Class_DataTag) => t.setUnSelected())
    cereales.setSelected()
    groupe.selectLevel(3)
    // On reste dans la branche des cereales : ble ou mais, jamais le lait.
    expect(['ble', 'mais']).toContain(selectionne(groupe)[0])
  })

  test('un membre encore montre au nouveau niveau est CONSERVE', () => {
    const { groupe, lait } = makeArbre()
    groupe.tags_list.forEach((t: Class_DataTag) => t.setUnSelected())
    lait.setSelected()
    // Le lait est une feuille courte : il reste montre aux niveaux 2 et 3.
    groupe.selectLevel(3)
    expect(selectionne(groupe)).toEqual(['lait'])
  })

  test('sans lignee, on prend le premier membre montre plutot qu un ecran vide', () => {
    const { groupe } = makeArbre()
    groupe.tags_list.forEach((t: Class_DataTag) => t.setUnSelected())
    groupe.selectLevel(2)
    expect(selectionne(groupe)).toHaveLength(1)
  })

  test('un index NON FINI est refuse, il ne corrompt pas le niveau courant', () => {
    const { groupe, ble } = makeArbre()
    groupe.tags_list.forEach((t: Class_DataTag) => t.setUnSelected())
    ble.setSelected()
    groupe.selectLevel(2)
    groupe.selectLevel(Number('pas un nombre'))
    // Le niveau reste celui d avant : sans cette garde il vaudrait NaN, aucune option ne
    // correspondrait et le selecteur reviendrait au premier niveau sans rien dire.
    expect(groupe.current_level_index).toBe(2)
    expect(selectionne(groupe)).toHaveLength(1)
  })

  test('une dimension PLATE ignore le changement de niveau', () => {
    const { groupe, ble } = makeArbre()
    groupe.levels = []
    groupe.tags_list.forEach((t: Class_DataTag) => t.setUnSelected())
    ble.setSelected()
    groupe.selectLevel(2)
    expect(selectionne(groupe)).toEqual(['ble'])
  })
})

describe('os#1511 — persistance : cles ADDITIVES, fichier plat inchange', () => {
  test('une dimension plate n ecrit ni levels ni current_level', () => {
    const app = new Class_ApplicationData(false)
    const groupe = app.drawing_area.sankey.addDataTagGroup('annee', 'Annee', false) as Class_DataTagGroup
    const json = groupe.toJSON()
    expect(json['levels']).toBeUndefined()
    expect(json['current_level']).toBeUndefined()
  })

  test('un membre SANS parent n ecrit pas la cle parent', () => {
    const { produits } = makeArbre()
    expect(produits.toJSON()['parent']).toBeUndefined()
  })

  test('la hierarchie fait un aller-retour JSON a l identique', () => {
    const { groupe, ble } = makeArbre()
    groupe.current_level_index = 2
    const json_groupe = groupe.toJSON()
    expect(json_groupe['levels']).toEqual(['produits agricoles', 'filieres', 'transformation', 'produits'])
    expect(json_groupe['current_level']).toBe(2)
    expect(ble.toJSON()['parent']).toBe('brutes')

    const app2 = new Class_ApplicationData(false)
    const relu = app2.drawing_area.sankey.addDataTagGroup('filiere', 'Filiere', false) as Class_DataTagGroup
    relu.fromJSON(json_groupe)
    expect(relu.levels).toEqual(['produits agricoles', 'filieres', 'transformation', 'produits'])
    expect(relu.current_level_index).toBe(2)
    const ble_relu = relu.tags_dict['ble'] as Class_DataTag
    expect(ble_relu.parent?.id).toBe('brutes')
    expect(relu.membersAtLevel(3).map((t: Class_DataTag) => t.id).sort()).toEqual(['ble', 'lait', 'mais'])
  })

  test('un parent FANTOME laisse le membre racine, il ne fabrique pas de parent', () => {
    const app = new Class_ApplicationData(false)
    const groupe = app.drawing_area.sankey.addDataTagGroup('filiere', 'Filiere', false) as Class_DataTagGroup
    const orphelin = groupe.addTag('Orphelin', 'orphelin') as Class_DataTag
    orphelin.fromJSON({ parent: 'membre_qui_n_existe_pas' })
    expect(orphelin.parent).toBeUndefined()
    expect(groupe.depthOf(orphelin)).toBe(0)
  })

  test('des niveaux vides ou en DOUBLON sont ecartes a la lecture', () => {
    const app = new Class_ApplicationData(false)
    const groupe = app.drawing_area.sankey.addDataTagGroup('filiere', 'Filiere', false) as Class_DataTagGroup
    // On part d un JSON REEL du groupe : `fromJSON` sert aussi aux mises a jour partielles,
    // mais il lit d autres cles (les membres notamment), donc un objet reduit a `levels` ne
    // traverserait pas le chemin de production.
    const json = groupe.toJSON()
    json['levels'] = ['filiere', '', 'filiere', 'produit']
    json['current_level'] = 1
    groupe.fromJSON(json)
    expect(groupe.levels).toEqual(['filiere', 'produit'])
    expect(groupe.current_level).toBe('produit')
  })
})

// os#1511 — UNE SEULE LISTE EN ARBRE. Julien a regarde le panneau « Coordonnees » : deux listes
// empilees, « Niveau » puis les membres, et au premier niveau la seconde n avait qu une option.
// Le niveau se deduit donc du membre choisi, et la liste unique les range par niveau.

describe('os#1511 — les membres ranges par niveau, pour une liste unique', () => {
  test('chaque membre parait UNE fois, sous le niveau de sa propre profondeur', () => {
    const { groupe } = makeArbre()
    const range = groupe.membersByLevel()
    expect(range.map(n => n.level)).toEqual(['produits agricoles', 'filieres', 'transformation', 'produits'])
    expect(range.map(n => n.members.map((m: Class_DataTag) => m.id))).toEqual([
      ['produits'],
      ['cereales', 'lait'],
      ['brutes'],
      ['ble', 'mais'],
    ])
    // Chaque membre une fois et une seule : membersAtLevel, lui, remontre une branche courte a
    // tous les niveaux plus profonds — ce qui est juste pour lire des valeurs, et illisible
    // dans une liste.
    const tous = range.flatMap(n => n.members.map((m: Class_DataTag) => m.id))
    expect(new Set(tous).size).toBe(tous.length)
    expect(tous).toHaveLength(groupe.tags_list.length)
  })

  test('une dimension plate ne range rien', () => {
    const { groupe } = makeArbre()
    groupe.levels = []
    expect(groupe.membersByLevel()).toEqual([])
  })

  test('choisir un membre pose le niveau ou il vit', () => {
    const { groupe, ble, cereales } = makeArbre()
    expect(groupe.selectMembers([ble.id])).toBe(true)
    expect(groupe.current_level_index).toBe(3)
    expect(groupe.selected_tags_list.map((t: Class_DataTag) => t.id)).toEqual(['ble'])
    expect(groupe.selectMembers([cereales.id])).toBe(true)
    expect(groupe.current_level_index).toBe(1)
  })

  test('une branche COURTE se range a sa profondeur reelle', () => {
    const { groupe, lait } = makeArbre()
    groupe.selectMembers([lait.id])
    // Lait est une feuille au niveau 1 : c est la qu on le choisit, meme si membersAtLevel le
    // remontre aux niveaux 2 et 3 pour que son total ne disparaisse pas.
    expect(groupe.current_level_index).toBe(1)
    expect(groupe.membersAtLevel(3).map((t: Class_DataTag) => t.id)).toContain('lait')
  })

  test('MELANGER deux niveaux est refuse : le second est ecarte', () => {
    const { groupe, ble, cereales } = makeArbre()
    groupe.selectMembers([ble.id, cereales.id])
    // Cereales est l ancetre de Ble : les additionner compterait la meme donnee deux fois, et
    // un noeud d axe ne se decoupe qu a un niveau a la fois.
    expect(groupe.selected_tags_list.map((t: Class_DataTag) => t.id)).toEqual(['ble'])
    expect(groupe.current_level_index).toBe(3)
  })

  test('deux membres du MEME niveau passent tous les deux', () => {
    const { groupe, ble, mais } = makeArbre()
    groupe.selectMembers([ble.id, mais.id])
    expect(groupe.selected_tags_list.map((t: Class_DataTag) => t.id).sort()).toEqual(['ble', 'mais'])
  })

  test('un identifiant INCONNU ne change rien', () => {
    const { groupe, ble } = makeArbre()
    groupe.selectMembers([ble.id])
    expect(groupe.selectMembers(['membre_qui_n_existe_pas'])).toBe(false)
    expect(groupe.selected_tags_list.map((t: Class_DataTag) => t.id)).toEqual(['ble'])
  })
})

// os#1511 — UN NIVEAU SE CHOISIT COMME UN MEMBRE. « Regions continentales » montre toutes les
// regions, « Europe » montre l Europe. Les deux vivent dans la meme liste parce que ce sont deux
// reponses a la meme question : qu est-ce qu on regarde ?

describe('os#1511 — choisir un niveau entier', () => {
  test('choisir un niveau coche tous les membres qu il montre', () => {
    const { groupe, ble, mais, lait } = makeArbre()
    expect(groupe.selectAllAtLevel(3)).toBe(true)
    expect(groupe.current_level_index).toBe(3)
    // La branche COURTE en fait partie : le lait n a pas de sous-niveau, il reste montre.
    expect(groupe.selected_tags_list.map((t: Class_DataTag) => t.id).sort())
      .toEqual([ble.id, lait.id, mais.id].sort())
  })

  test('un niveau entier se RECONNAIT, et un membre seul ne passe pas pour lui', () => {
    const { groupe, cereales } = makeArbre()
    groupe.selectAllAtLevel(1)
    expect(groupe.isWholeLevelSelected(1)).toBe(true)
    expect(groupe.isWholeLevelSelected(2)).toBe(false)
    groupe.selectMembers([cereales.id])
    // Les filieres comptent deux membres : Cereales seul n est pas le niveau.
    expect(groupe.isWholeLevelSelected(1)).toBe(false)
  })

  test('une dimension PLATE n a pas de niveau a choisir', () => {
    const { groupe } = makeArbre()
    groupe.levels = []
    expect(groupe.selectAllAtLevel(0)).toBe(false)
  })

  test('un index NON FINI est refuse, comme pour selectLevel', () => {
    const { groupe } = makeArbre()
    groupe.selectAllAtLevel(1)
    expect(groupe.selectAllAtLevel(Number('pas un nombre'))).toBe(false)
    expect(groupe.current_level_index).toBe(1)
  })
})

// os#1511 — LA PALETTE D UNE DIMENSION HIERARCHISEE. Un tag nait gris, et la palette est une
// commande explicite du menu : tenable tant qu on lit un membre a la fois, illisible des que
// plusieurs se dessinent ensemble — toutes les bandes sortaient de la meme couleur (28/09).

describe('os#1511 — une dimension hierarchisee toute grise recoit une palette', () => {
  test('chaque membre recoit une couleur, et une BRANCHE se reconnait', () => {
    const { groupe, cereales, brutes, ble, lait } = makeArbre()
    expect(applyHierarchyPaletteIfGrey(groupe)).toBeGreaterThan(0)
    groupe.tags_list.forEach((t: Class_DataTag) => expect(t.color).toMatch(/^hsl\(/))
    // La teinte suit la parente : Ble descend de Cereales, Lait est une autre branche.
    const teinte = (t: Class_DataTag) => t.color.slice(4, t.color.indexOf(','))
    expect(teinte(ble)).toBe(teinte(cereales))
    expect(teinte(brutes)).toBe(teinte(cereales))
    expect(teinte(lait)).not.toBe(teinte(cereales))
    // Et l on s eclaircit en descendant : un parent reste plus dense que ses enfants.
    expect(ble.color).not.toBe(cereales.color)
    // Poser des couleurs sans les nommer ne sert a rien : l interrupteur des couleurs est ce
    // qui fait entrer le groupe dans la LEGENDE.
    expect(groupe.use_colors).toBe(true)
  })

  test('un groupe DEJA colorie n est pas touche', () => {
    const { groupe, ble } = makeArbre()
    ble.color = '#123456'
    expect(applyHierarchyPaletteIfGrey(groupe)).toBe(0)
    expect(ble.color).toBe('#123456')
  })

  test('une dimension PLATE ne recoit rien', () => {
    const { groupe } = makeArbre()
    groupe.levels = []
    expect(applyHierarchyPaletteIfGrey(groupe)).toBe(0)
  })
})

// os#1511 — LES BRANCHES COURTES DANS LA SELECTION. Julien a coche Oleagineux avec Cereales
// brutes et Cereales transformees : Oleagineux ne se dessinait pas, ecarte parce qu il n a pas
// la meme profondeur. Il n a pourtant pas d enfant, donc il se montre a ce niveau-la aussi.

describe('os#1511 — une branche courte se coche avec les membres plus profonds', () => {
  test('Oleagineux tient avec les deux niveaux de transformation', () => {
    const { groupe, brutes, lait } = makeArbre()
    // Lait est la branche courte de cet arbre : feuille au niveau 1, montree jusqu au 3.
    groupe.selectMembers([lait.id, brutes.id])
    expect(groupe.selected_tags_list.map((t: Class_DataTag) => t.id).sort())
      .toEqual([brutes.id, lait.id].sort())
    // Le niveau retenu est le PLUS FIN des deux.
    expect(groupe.current_level_index).toBe(2)
  })

  test('l ordre du clic ne change pas le resultat', () => {
    const { groupe, brutes, lait } = makeArbre()
    groupe.selectMembers([brutes.id, lait.id])
    expect(groupe.selected_tags_list.map((t: Class_DataTag) => t.id).sort())
      .toEqual([brutes.id, lait.id].sort())
  })

  test('un vrai melange parent / enfant reste ecarte', () => {
    const { groupe, cereales, ble } = makeArbre()
    groupe.selectMembers([cereales.id, ble.id])
    // Cereales contient Ble : les additionner compterait la meme donnee deux fois.
    expect(groupe.selected_tags_list.map((t: Class_DataTag) => t.id)).toEqual([ble.id])
  })
})
