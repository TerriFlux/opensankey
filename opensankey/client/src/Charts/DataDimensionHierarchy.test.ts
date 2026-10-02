import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import type { Class_LinkValue } from '../Elements/LinkValues'
import type { Class_LinkElement } from '../Elements/Link'
import type { Class_NodeElement } from '../Elements/Node'
import {
  buildNestedDimensionTree, dataCutOf, dataDimensionOpenedDownToLevel, memberSectorId, parseMemberSectorId,
  smallMultipleDefaultOpened, smallMultipleMembersOf
} from './DataDimensionHierarchy'
import type { Type_DataDimensionOptions } from './DataDimensionHierarchy'
import type { Type_SunburstNode } from './SunburstHierarchy'

// jest 27 / jsdom n expose pas structuredClone (utilise par Link.copyFrom)
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511 — LA COURONNE SUR UNE DIMENSION DE DONNEES. Un secteur est un MEMBRE, sa valeur celle du
// sujet a cette coordonnee, et le sujet ne bouge pas d un anneau a l autre — c est ce qui distingue
// cette descente des deux autres. Ici, une seule dimension, coupe propre (figure detachee).

type Montage = {
  lien: Class_LinkElement,
  cible: Class_NodeElement,
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

  const source = sankey.addNewNodeWithName('Source')
  const cible = sankey.addNewNodeWithName('Cible')
  const lien = sankey.addNewLink(source, cible)
  poser(lien, ble, 30)
  poser(lien, mais, 12)
  poser(lien, lait, 7)
  return { lien, cible, groupe, produits, cereales, ble, mais, lait }
}

function viser(groupe: Class_DataTagGroup, membre: Class_DataTag) {
  groupe.tags_list.forEach(tag => tag.setUnSelected())
  membre.setSelected()
}

function poser(lien: Class_LinkElement, membre: Class_DataTag, nombre: number) {
  viser(membre.group as Class_DataTagGroup, membre)
  const valeur = lien.value as Class_LinkValue
  valeur.valueData = nombre
}

/** Tout ouvert jusqu aux feuilles. */
const TOUT = ['produits', 'cereales']

/**
 * L arbre d une figure DETACHEE sur la seule dimension `groupe`. `ouverts` absent : coupe jamais
 * ecrite (la figure decoupe sa premiere dimension d un cran).
 */
function arbre(
  m: Montage, ouverts?: string[], options: Type_DataDimensionOptions = {}, sujet: 'lien' | 'noeud' = 'lien'
) {
  const coupe = dataCutOf(
    m.lien.sankey, [m.groupe.id],
    ouverts === undefined ? { linked: false } : { linked: false, opened: { [m.groupe.id]: ouverts } }
  )
  return buildNestedDimensionTree(
    sujet === 'lien' ? { kind: 'link', link: m.lien } : { kind: 'node', node: m.cible },
    coupe, { data_tags: null }, { max_depth: 8, ...options }
  )
}

/** Le secteur d un membre dans un arbre, cherche par son identifiant prefixe. */
function secteur(racine: Type_SunburstNode, groupe: Class_DataTagGroup, membre: Class_DataTag) {
  const cible = memberSectorId(groupe.id, membre.id)
  const chercher = (noeud: Type_SunburstNode): Type_SunburstNode | undefined => {
    if (noeud.id === cible) return noeud
    for (const enfant of noeud.children) {
      const trouve = chercher(enfant)
      if (trouve !== undefined) return trouve
    }
    return undefined
  }
  return chercher(racine)
}

describe('os#1511 — l identifiant d un secteur de membre', () => {
  test('il porte le couple dimension et membre, et se relit', () => {
    const id = memberSectorId('filiere', 'ble')
    expect(parseMemberSectorId(id)).toEqual({ dimension_id: 'filiere', member_id: 'ble' })
  })

  test('un identifiant de noeud ou de flux n en est pas un', () => {
    expect(parseMemberSectorId('n_ble')).toBeNull()
    expect(parseMemberSectorId('lien_1')).toBeNull()
  })

  test('un identifiant de membre qui contient une barre oblique se relit entier', () => {
    // Une nomenclature produit en contient (HS 10/01). La coupure se fait au PREMIER separateur.
    expect(parseMemberSectorId(memberSectorId('produit', '10/01/90'))?.member_id).toBe('10/01/90')
  })
})

describe('os#1511 — une dimension PLATE ne decompose rien', () => {
  test('sans niveaux, l arbre est refuse plutot que faux', () => {
    const m = monter()
    m.groupe.levels = []
    m.groupe.tags_list.forEach(tag => { (tag as Class_DataTag).parent = undefined })
    expect(arbre(m)).toBeNull()
  })

  test('deux millesimes ne font pas un tout', () => {
    const app = new Class_ApplicationData(false)
    const sankey = app.drawing_area.sankey
    const annee = sankey.addDataTagGroup('annee', 'Annee', false) as Class_DataTagGroup
    annee.addTag('2015', '2015')
    annee.addTag('2019', '2019')
    const lien = sankey.addNewLink(
      sankey.addNewNodeWithName('A'), sankey.addNewNodeWithName('B')
    )
    const coupe = dataCutOf(sankey, [annee.id], { linked: false })
    expect(buildNestedDimensionTree({ kind: 'link', link: lien }, coupe, { data_tags: null })).toBeNull()
  })
})

// 02/10/2026 — « ZOOME DEDANS » : la couronne se re-enracine sur la part cliquee. Le centre devient
// cette part (nom et valeur), ses enfants remplissent l anneau, qu elle soit ouverte ou non dans la
// coupe : zoomer n ouvre rien.
describe('os#1511 — le foyer d une couronne de dimension de donnees', () => {
  const foyer = (m: Montage, membre: Class_DataTag) => [{ dimension_id: m.groupe.id, member_id: membre.id }]

  test('zoomer sur Cereales : le centre la nomme et vaut 42, ses enfants font l anneau', () => {
    const m = monter()
    const racine = arbre(m, undefined, { focus: foyer(m, m.cereales) })?.roots[0] as Type_SunburstNode
    expect(racine.label).toBe('Cereales')
    expect(racine.value).toBe(42)
    expect(racine.children.map(c => c.id))
      .toEqual([memberSectorId(m.groupe.id, m.ble.id), memberSectorId(m.groupe.id, m.mais.id)])
    expect(racine.children.map(c => c.depth)).toEqual([1, 1])
  })

  test('le foyer ne demande pas que Cereales soit ouverte dans la coupe', () => {
    const m = monter()
    // Coupe : seule la racine est ouverte, Cereales est fermee.
    const racine = arbre(m, ['produits'], { focus: foyer(m, m.cereales) })?.roots[0] as Type_SunburstNode
    expect(racine.children.map(c => c.label)).toEqual(['Ble', 'Mais'])
  })

  test('un foyer sur une feuille est ignore : la figure revient au sujet', () => {
    const m = monter()
    const racine = arbre(m, undefined, { focus: foyer(m, m.lait) })?.roots[0] as Type_SunburstNode
    expect(racine.id).toBe(m.lien.id)
    expect(racine.value).toBe(49)
  })

  test('un foyer sur un membre disparu est ignore', () => {
    const m = monter()
    const racine = arbre(m, undefined, { focus: [{ dimension_id: m.groupe.id, member_id: 'disparu' }] })
      ?.roots[0] as Type_SunburstNode
    expect(racine.value).toBe(49)
  })
})

describe('os#1511 — la forme de l arbre : le sujet au centre, les membres en anneaux', () => {
  test('la racine est le SUJET ; figure neuve, ses enfants sont ceux de la racine unique', () => {
    const m = monter()
    const resultat = arbre(m)
    expect(resultat?.roots).toHaveLength(1)
    expect(resultat?.roots[0].id).toBe(m.lien.id)
    // La racine unique Produits ne fait pas d anneau : le premier anneau est son niveau 1.
    expect(resultat?.roots[0].children.map(c => c.id))
      .toEqual([memberSectorId(m.groupe.id, m.cereales.id), memberSectorId(m.groupe.id, m.lait.id)])
  })

  test('un secteur PARENT ouvert vaut la somme de ses feuilles', () => {
    const m = monter()
    const resultat = arbre(m, TOUT)
    expect(secteur(resultat?.roots[0] as Type_SunburstNode, m.groupe, m.cereales)?.value).toBe(42)
    expect(resultat?.roots[0].value).toBe(49)
  })

  test('une FEUILLE vaut ce qu elle porte, branche courte comprise', () => {
    const m = monter()
    const racine = arbre(m, TOUT)?.roots[0] as Type_SunburstNode
    expect(secteur(racine, m.groupe, m.ble)?.value).toBe(30)
    expect(secteur(racine, m.groupe, m.lait)?.value).toBe(7)
  })

  test('un secteur FERME vaut ce que le modele porte a sa coordonnee', () => {
    const m = monter()
    const racine = arbre(m)?.roots[0] as Type_SunburstNode
    expect(secteur(racine, m.groupe, m.cereales)?.value).toBe(42)
    expect(secteur(racine, m.groupe, m.cereales)?.children).toEqual([])
  })

  test('le TOTAL de la couronne est celui de la dimension entiere', () => {
    const m = monter()
    expect(arbre(m)?.total).toBe(49)
  })

  test('un membre qui n apporte rien ne fait pas de secteur a zero', () => {
    const m = monter()
    const vide = m.groupe.addTag('Vide', 'vide') as Class_DataTag
    vide.parent = m.produits
    expect(secteur(arbre(m, TOUT)?.roots[0] as Type_SunburstNode, m.groupe, vide)).toBeUndefined()
  })

  test('la couleur du secteur est celle du membre', () => {
    const m = monter()
    m.cereales.color = '#123456'
    expect(secteur(arbre(m)?.roots[0] as Type_SunburstNode, m.groupe, m.cereales)?.color).toBe('#123456')
  })

  test('rien d ouvert, explicitement : un seul secteur, le tout', () => {
    const m = monter()
    const racine = arbre(m, [])?.roots[0] as Type_SunburstNode
    expect(racine.children.map(c => [c.label, c.value])).toEqual([['Produits', 49]])
  })
})

describe('os#1511 — les anneaux nomment les niveaux de la dimension', () => {
  test('un anneau par niveau ouvert, le centre ne portant aucun niveau', () => {
    const m = monter()
    expect(arbre(m, TOUT)?.rings.map(r => r.level_label)).toEqual(['', 'filieres', 'produit'])
  })

  test('l anneau du niveau COURANT est celui que le diagramme montre a cote', () => {
    const m = monter()
    m.groupe.selectAllAtLevel(1)
    const resultat = arbre(m, TOUT)
    expect(resultat?.rings[1].is_selected_level).toBe(true)
    expect(resultat?.rings[2].is_selected_level).toBe(false)
  })
})

describe('os#1511 — quand le parent ne vaut pas la somme de ses enfants', () => {
  test('en regime SOMME, la geometrie reste vraie et l ecart est compte', () => {
    const m = monter()
    // Le fichier connait le total des cereales : 50, alors que ble + mais font 42.
    poser(m.lien, m.cereales, 50)
    const resultat = arbre(m, TOUT)
    expect(secteur(resultat?.roots[0] as Type_SunburstNode, m.groupe, m.cereales)?.value).toBe(42)
    expect(resultat?.mismatch_count).toBe(1)
  })

  test('en regime DECLARE, le parent vaut son total et le reste devient un secteur', () => {
    const m = monter()
    poser(m.lien, m.cereales, 50)
    const resultat = arbre(m, TOUT, { value_mode: 'declared', residual_label: 'Non reparti' })
    const cereales = secteur(resultat?.roots[0] as Type_SunburstNode, m.groupe, m.cereales)
    expect(cereales?.value).toBe(50)
    const reste = cereales?.children.find(c => c.is_residual === true)
    expect(reste?.label).toBe('Non reparti')
    expect(reste?.value).toBe(8)
  })

  test('sans ecart, le regime DECLARE ne fabrique aucun secteur de complement', () => {
    const m = monter()
    const resultat = arbre(m, TOUT, { value_mode: 'declared' })
    const cereales = secteur(resultat?.roots[0] as Type_SunburstNode, m.groupe, m.cereales)
    expect(cereales?.children.some(c => c.is_residual === true)).toBe(false)
    expect(resultat?.mismatch_count).toBe(0)
  })
})

describe('os#1511 — la profondeur se regle, et la coupe est annoncee', () => {
  test('un seul anneau coupe sous le premier niveau', () => {
    const m = monter()
    const resultat = arbre(m, TOUT, { max_depth: 1 })
    expect(resultat?.roots[0].children[0].children).toHaveLength(0)
    expect(resultat?.is_truncated).toBe(true)
  })

  test('assez d anneaux pour tout montrer : rien n est coupe', () => {
    const m = monter()
    expect(arbre(m, TOUT)?.is_truncated).toBe(false)
  })
})

describe('os#1511 — un NOEUD se decompose aussi bien qu un flux', () => {
  test('la valeur d un secteur est celle du noeud a cette coordonnee', () => {
    const m = monter()
    const resultat = arbre(m, undefined, {}, 'noeud')
    expect(resultat?.total).toBe(49)
    expect(secteur(resultat?.roots[0] as Type_SunburstNode, m.groupe, m.cereales)?.value).toBe(42)
  })

  test('le centre porte le nom du noeud', () => {
    const m = monter()
    expect(arbre(m, undefined, {}, 'noeud')?.roots[0].label).toBe('Cible')
  })
})

// os#1511 — LE SELECTEUR DE NIVEAU ECRIT LA COUPE, il ne s y superpose pas. C est ce qui fait que
// le selecteur et le clic cooperent : apres « niveau 3 », shift+clic referme une branche et le
// reste tient. Deux regles auraient rouvert ce que le clic venait de fermer.

describe('os#1511 — le niveau d une dimension decoupee', () => {
  test('le niveau 0 n ouvre rien', () => {
    const m = monter()
    expect(dataDimensionOpenedDownToLevel(m.groupe, 0).size).toBe(0)
  })

  test('voir le niveau 1 demande d ouvrir les membres du niveau 0', () => {
    const m = monter()
    expect([...dataDimensionOpenedDownToLevel(m.groupe, 1)]).toEqual([m.produits.id])
  })

  test('voir le niveau 2 ouvre aussi les membres du niveau 1', () => {
    const m = monter()
    const ouverts = dataDimensionOpenedDownToLevel(m.groupe, 2)
    expect(ouverts.has(m.produits.id)).toBe(true)
    expect(ouverts.has(m.cereales.id)).toBe(true)
    expect(ouverts.has(m.lait.id)).toBe(true)
    // Les feuilles ne s ouvrent pas : elles n ont rien dessous.
    expect(ouverts.has(m.ble.id)).toBe(false)
  })
})

describe('os#1511 — la couronne ne deplace pas la selection du diagramme', () => {
  test('apres construction, le membre choisi dans le diagramme est le meme', () => {
    const m = monter()
    viser(m.groupe, m.ble)
    arbre(m, TOUT)
    expect(m.groupe.selected_tags_list.map(t => t.id)).toEqual(['ble'])
  })
})

// 02/10/2026 — LES PETITS MULTIPLES REVIENNENT A UNE COURONNE. Julien : « quand je suis en mode une
// couronne par pays partenaire, je ne peux pas revenir a une couronne pour le monde ». Un membre
// montre seul etait remplace par ses enfants : le niveau ensemble faisait toujours plusieurs couronnes.

describe('os#1511 — les membres des petits multiples', () => {
  const noms = (membres: Class_DataTag[]) => membres.map(t => t.id)

  test('liee, le diagramme au niveau ensemble : UNE couronne, la racine', () => {
    const m = monter()
    viser(m.groupe, m.produits)
    expect(noms(smallMultipleMembersOf(m.groupe, { linked: true }))).toEqual(['produits'])
  })

  test('liee, le diagramme au niveau 1 : une couronne par membre montre', () => {
    const m = monter()
    m.groupe.selectAllAtLevel(1)
    expect(noms(smallMultipleMembersOf(m.groupe, { linked: true }))).toEqual(['cereales', 'lait'])
  })

  test('detachee, rien d ouvert : UNE couronne, la racine', () => {
    const m = monter()
    expect(noms(smallMultipleMembersOf(m.groupe, { linked: false, opened: { filiere: [] } })))
      .toEqual(['produits'])
  })

  test('detachee, la racine ouverte : une couronne par membre du niveau 1', () => {
    const m = monter()
    expect(noms(smallMultipleMembersOf(m.groupe, { linked: false, opened: { filiere: ['produits'] } })))
      .toEqual(['cereales', 'lait'])
  })

  test('detachee, le niveau 2 : la frontiere, branche courte comprise', () => {
    const m = monter()
    const ouverts = [...dataDimensionOpenedDownToLevel(m.groupe, 2)]
    expect(noms(smallMultipleMembersOf(m.groupe, { linked: false, opened: { filiere: ouverts } })))
      .toEqual(['ble', 'mais', 'lait'])
  })

  test('detachee, coupe jamais ecrite : un cran sous ce que le diagramme montre', () => {
    const m = monter()
    viser(m.groupe, m.produits)
    expect(smallMultipleDefaultOpened(m.groupe)).toEqual(['produits'])
    expect(noms(smallMultipleMembersOf(m.groupe, { linked: false }))).toEqual(['cereales', 'lait'])
  })
})
