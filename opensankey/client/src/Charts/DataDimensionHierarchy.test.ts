import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import type { Class_LinkValue } from '../Elements/LinkValues'
import type { Class_LinkElement } from '../Elements/Link'
import type { Class_NodeElement } from '../Elements/Node'
import {
  buildDataDimensionTree, dataDimensionExpandedDownToLevel, memberSectorId, parseMemberSectorId
} from './DataDimensionHierarchy'
import type { Type_SunburstNode } from './SunburstHierarchy'

// jest 27 / jsdom n expose pas structuredClone (utilise par Link.copyFrom)
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511 — LA COURONNE SUR UNE DIMENSION DE DONNEES. Julien, 28/09 : « la couronne, notamment un
// mode sunburst, represente exactement cet hypercube, mais dans le cas present ca s applique aux
// flux. » Un secteur est un MEMBRE, sa valeur celle du sujet a cette coordonnee, et le sujet ne
// bouge pas d un anneau a l autre — c est ce qui distingue cette descente des deux autres.

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
    expect(buildDataDimensionTree({ kind: 'link', link: m.lien }, m.groupe)).toBeNull()
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
    expect(buildDataDimensionTree({ kind: 'link', link: lien }, annee)).toBeNull()
  })
})

describe('os#1511 — la forme de l arbre : le sujet au centre, les membres en anneaux', () => {
  test('la racine est le SUJET, ses enfants sont les membres de premier niveau', () => {
    const m = monter()
    const arbre = buildDataDimensionTree({ kind: 'link', link: m.lien }, m.groupe)
    expect(arbre).not.toBeNull()
    expect(arbre?.roots).toHaveLength(1)
    expect(arbre?.roots[0].id).toBe(m.lien.id)
    // Une seule racine dans la dimension : Produits.
    expect(arbre?.roots[0].children.map(c => c.id))
      .toEqual([memberSectorId(m.groupe.id, m.produits.id)])
  })

  test('un secteur PARENT vaut la somme de ses feuilles', () => {
    const m = monter()
    const racine = buildDataDimensionTree({ kind: 'link', link: m.lien }, m.groupe)?.roots[0]
    expect(secteur(racine as Type_SunburstNode, m.groupe, m.cereales)?.value).toBe(42)
    expect(secteur(racine as Type_SunburstNode, m.groupe, m.produits)?.value).toBe(49)
  })

  test('une FEUILLE vaut ce qu elle porte, branche courte comprise', () => {
    const m = monter()
    const racine = buildDataDimensionTree({ kind: 'link', link: m.lien }, m.groupe)?.roots[0]
    expect(secteur(racine as Type_SunburstNode, m.groupe, m.ble)?.value).toBe(30)
    expect(secteur(racine as Type_SunburstNode, m.groupe, m.lait)?.value).toBe(7)
  })

  test('le TOTAL de la couronne est celui de la dimension entiere', () => {
    const m = monter()
    expect(buildDataDimensionTree({ kind: 'link', link: m.lien }, m.groupe)?.total).toBe(49)
  })

  test('un membre qui n apporte rien ne fait pas de secteur a zero', () => {
    const m = monter()
    m.groupe.addTag('Vide', 'vide')
    const racine = buildDataDimensionTree({ kind: 'link', link: m.lien }, m.groupe)?.roots[0]
    expect(secteur(racine as Type_SunburstNode, m.groupe, m.groupe.tags_dict['vide'] as Class_DataTag))
      .toBeUndefined()
  })

  test('la couleur du secteur est celle du membre', () => {
    const m = monter()
    m.cereales.color = '#123456'
    const racine = buildDataDimensionTree({ kind: 'link', link: m.lien }, m.groupe)?.roots[0]
    expect(secteur(racine as Type_SunburstNode, m.groupe, m.cereales)?.color).toBe('#123456')
  })
})

describe('os#1511 — les anneaux nomment les niveaux de la dimension', () => {
  test('un anneau par niveau, le centre ne comptant pas', () => {
    const m = monter()
    const arbre = buildDataDimensionTree({ kind: 'link', link: m.lien }, m.groupe)
    // Centre (le flux), puis les trois niveaux nommes de la dimension.
    expect(arbre?.rings.map(r => r.level_label)).toEqual(['produits', 'produits', 'filieres', 'produit'])
  })

  test('l anneau du niveau COURANT est celui que le diagramme montre a cote', () => {
    const m = monter()
    m.groupe.selectAllAtLevel(1)
    const arbre = buildDataDimensionTree({ kind: 'link', link: m.lien }, m.groupe)
    // rings[2] porte le niveau d index 1 : c est lui qui est en gras.
    expect(arbre?.rings[2].is_selected_level).toBe(true)
    expect(arbre?.rings[3].is_selected_level).toBe(false)
  })
})

describe('os#1511 — descendre dans un membre (le foyer)', () => {
  test('le foyer devient le centre, et ses enfants le premier anneau', () => {
    const m = monter()
    const arbre = buildDataDimensionTree(
      { kind: 'link', link: m.lien }, m.groupe, undefined, { focus_id: 'cereales' }
    )
    expect(arbre?.roots[0].label).toBe('Cereales')
    expect(arbre?.roots[0].children.map(c => c.label).sort()).toEqual(['Ble', 'Mais'])
    // Le total est celui du foyer, pas celui de la dimension.
    expect(arbre?.total).toBe(42)
  })

  test('les anneaux repartent de la profondeur du foyer', () => {
    const m = monter()
    const arbre = buildDataDimensionTree(
      { kind: 'link', link: m.lien }, m.groupe, undefined, { focus_id: 'cereales' }
    )
    // Cereales est au niveau 1 : le centre le porte, et l anneau suivant porte le niveau 2.
    expect(arbre?.rings.map(r => r.level_label)).toEqual(['filieres', 'produit'])
  })

  test('un foyer PERIME revient au sujet plutot que de vider la figure', () => {
    const m = monter()
    const arbre = buildDataDimensionTree(
      { kind: 'link', link: m.lien }, m.groupe, undefined, { focus_id: 'disparu' }
    )
    expect(arbre?.total).toBe(49)
  })
})

describe('os#1511 — quand le parent ne vaut pas la somme de ses enfants', () => {
  test('en regime SOMME, la geometrie reste vraie et l ecart est compte', () => {
    const m = monter()
    // Le fichier connait le total des cereales : 50, alors que ble + mais font 42.
    poser(m.lien, m.cereales, 50)
    const arbre = buildDataDimensionTree({ kind: 'link', link: m.lien }, m.groupe)
    expect(secteur(arbre?.roots[0] as Type_SunburstNode, m.groupe, m.cereales)?.value).toBe(42)
    expect(arbre?.mismatch_count).toBe(1)
  })

  test('en regime DECLARE, le parent vaut son total et le reste devient un secteur', () => {
    const m = monter()
    poser(m.lien, m.cereales, 50)
    const arbre = buildDataDimensionTree(
      { kind: 'link', link: m.lien }, m.groupe, undefined,
      { value_mode: 'declared', residual_label: 'Non reparti' }
    )
    const cereales = secteur(arbre?.roots[0] as Type_SunburstNode, m.groupe, m.cereales)
    expect(cereales?.value).toBe(50)
    const reste = cereales?.children.find(c => c.is_residual === true)
    expect(reste?.label).toBe('Non reparti')
    expect(reste?.value).toBe(8)
  })

  test('sans ecart, le regime DECLARE ne fabrique aucun secteur de complement', () => {
    const m = monter()
    const arbre = buildDataDimensionTree(
      { kind: 'link', link: m.lien }, m.groupe, undefined, { value_mode: 'declared' }
    )
    const cereales = secteur(arbre?.roots[0] as Type_SunburstNode, m.groupe, m.cereales)
    expect(cereales?.children.some(c => c.is_residual === true)).toBe(false)
    expect(arbre?.mismatch_count).toBe(0)
  })
})

describe('os#1511 — la profondeur se regle, et la coupe est annoncee', () => {
  test('un seul anneau coupe sous le premier niveau', () => {
    const m = monter()
    const arbre = buildDataDimensionTree(
      { kind: 'link', link: m.lien }, m.groupe, undefined, { max_depth: 1 }
    )
    expect(arbre?.roots[0].children[0].children).toHaveLength(0)
    expect(arbre?.is_truncated).toBe(true)
  })

  test('assez d anneaux pour tout montrer : rien n est coupe', () => {
    const m = monter()
    const arbre = buildDataDimensionTree({ kind: 'link', link: m.lien }, m.groupe)
    expect(arbre?.is_truncated).toBe(false)
  })
})

describe('os#1511 — un NOEUD se decompose aussi bien qu un flux', () => {
  test('la valeur d un secteur est celle du noeud a cette coordonnee', () => {
    const m = monter()
    const arbre = buildDataDimensionTree({ kind: 'node', node: m.cible }, m.groupe)
    expect(arbre?.total).toBe(49)
    expect(secteur(arbre?.roots[0] as Type_SunburstNode, m.groupe, m.cereales)?.value).toBe(42)
  })

  test('le centre porte le nom du noeud', () => {
    const m = monter()
    const arbre = buildDataDimensionTree({ kind: 'node', node: m.cible }, m.groupe)
    expect(arbre?.roots[0].label).toBe('Cible')
  })
})

// os#1511 — LE SELECTEUR DE NIVEAU ECRIT L ENSEMBLE DES SECTEURS OUVERTS, il ne s y superpose pas.
// C est ce qui fait que le selecteur et le clic cooperent : apres « niveau 3 », shift+clic referme
// une branche et le reste tient. Deux regles auraient rouvert ce que le clic venait de fermer.

describe('os#1511 — le niveau d une dimension decoupee', () => {
  test('le niveau 0 n ouvre rien : le premier anneau est deja la', () => {
    const m = monter()
    expect(dataDimensionExpandedDownToLevel(m.groupe, 0).size).toBe(0)
  })

  test('voir le niveau 1 demande d ouvrir les membres du niveau 0', () => {
    const m = monter()
    expect([...dataDimensionExpandedDownToLevel(m.groupe, 1)])
      .toEqual([memberSectorId(m.groupe.id, m.produits.id)])
  })

  test('voir le niveau 2 ouvre aussi les membres du niveau 1', () => {
    const m = monter()
    const ouverts = dataDimensionExpandedDownToLevel(m.groupe, 2)
    expect(ouverts.has(memberSectorId(m.groupe.id, m.produits.id))).toBe(true)
    expect(ouverts.has(memberSectorId(m.groupe.id, m.cereales.id))).toBe(true)
    expect(ouverts.has(memberSectorId(m.groupe.id, m.lait.id))).toBe(true)
    // Les feuilles ne s ouvrent pas : elles n ont rien dessous.
    expect(ouverts.has(memberSectorId(m.groupe.id, m.ble.id))).toBe(false)
  })
})

describe('os#1511 — la couronne ne deplace pas la selection du diagramme', () => {
  test('apres construction, le membre choisi dans le diagramme est le meme', () => {
    const m = monter()
    viser(m.groupe, m.ble)
    buildDataDimensionTree({ kind: 'link', link: m.lien }, m.groupe)
    expect(m.groupe.selected_tags_list.map(t => t.id)).toEqual(['ble'])
  })
})
