import { Class_ApplicationData } from './ApplicationData'
import type { Class_DataTag } from './Tag'
import type { Class_DataTagGroup } from './TagGroup'

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
