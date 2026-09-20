// os#1445 — UNE PART DE COURONNE EST UN ELEMENT, etape 1 : le proxy et son contenant.
//
// Demande de Julien (20/09) : « figure = graphe, et les trois autres parties devraient etre dans
// forme / libelle / valeur de l element selectionne (la part de la couronne) ; pour editer
// globalement on le fait par les styles ». Ce qui l empechait n etait pas l ecran mais le MODELE :
// une part n existait que comme une ligne de donnees dans le trace, sans rien a selectionner ni a
// styler. Les reglages d aspect avaient donc ete mis sur la FIGURE, faute d un endroit juste.
//
// Ce fichier fige LA FRONTIERE, qui est tout le lot : le SUJET se delegue, la FIGURE ne se delegue
// pas. Renommer une part renomme le noeud du diagramme ; la repeindre ne repeint que la couronne.
//
// Il ne touche PAS au trace (etape 2) ni a la selection (etape 3) : a ce stade la couronne se
// dessine encore comme avant, et rien n a change a l ecran.

import { Class_ApplicationData } from '../../types/ApplicationData'
import { CURRENT_FORMAT_VERSION } from '../../Persistence/persistenceMigrations'
import type { Class_NodeElement } from '../../Elements/Node'
import type { Class_Tag } from '../../types/Tag'
import { buildSunburstTree } from '../../Charts/SunburstHierarchy'
import type { Type_SunburstTree } from '../../Charts/SunburstHierarchy'
import type { Type_JSON } from '../../types/Utils'
import { buildDonutParts } from './buildDonutParts'
import { Class_DonutPart } from './DonutPart'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

/**
 * Le MEME diagramme que `SunburstHierarchy.test.ts`, et c est deliberé : une hierarchie declaree
 * par `dimensions.parent_name`, agregee au niveau 1. On le construit en CHARGEANT un fichier
 * plutot qu en appelant le modele a la main — c est la voie que le diagramme emprunte vraiment,
 * et la seule ou l on soit sur de ne pas fabriquer une hierarchie que le produit ne fait jamais.
 *
 * Racine declare 20 et ses deux enfants somment 14 : l ecart de 6 donne un secteur RESIDUEL en
 * mode `declared`, qu on eprouve plus bas.
 */
const file = (): Type_JSON => ({
  version: '1.3.0',
  format_version: CURRENT_FORMAT_VERSION,
  nodes: {
    Amont: { idNode: 'Amont', name: 'Amont' },
    Racine: { idNode: 'Racine', name: 'Racine', tags: { dim: ['niveau1'] } },
    EnfantA: {
      idNode: 'EnfantA', name: 'EnfantA',
      tags: { dim: ['niveau2'] },
      dimensions: { dim: { parent_name: 'Racine' } }
    },
    EnfantB: {
      idNode: 'EnfantB', name: 'EnfantB',
      tags: { dim: ['niveau2'] },
      dimensions: { dim: { parent_name: 'Racine' } }
    }
  },
  links: {
    amont_racine: { idLink: 'amont_racine', idSource: 'Amont', idTarget: 'Racine', value: { value: 20 } },
    amont_a: { idLink: 'amont_a', idSource: 'Amont', idTarget: 'EnfantA', value: { value: 6 } },
    amont_b: { idLink: 'amont_b', idSource: 'Amont', idTarget: 'EnfantB', value: { value: 8 } }
  },
  levelTags: {
    dim: {
      group_name: 'Dimension', banner: 'one', activated: true, siblings: [],
      tags: {
        niveau1: { name: 'niveau1', selected: true },
        niveau2: { name: 'niveau2', selected: false }
      }
    }
  }
} as unknown as Type_JSON)

const buildSource = () => {
  const doc = new Class_ApplicationData(false)
  // `fromJSON` MUTE son argument : on ne lui donne jamais l objet du test.
  doc.fromJSON(JSON.parse(JSON.stringify(file())) as never, {}, false)
  doc.drawing_area.bypass_redraws = true
  const sankey = doc.drawing_area.sankey
  return {
    doc,
    sankey,
    racine: sankey.nodes_dict['Racine'] as Class_NodeElement,
    ble: sankey.nodes_dict['EnfantA'] as Class_NodeElement,
    mais: sankey.nodes_dict['EnfantB'] as Class_NodeElement
  }
}

const treeOf = (doc: Class_ApplicationData): Type_SunburstTree => {
  const tree = buildSunburstTree(doc.drawing_area.sankey)
  expect(tree).not.toBeNull()
  return tree as Type_SunburstTree
}

describe('os#1445 une part porte le sujet du document', () => {

  it('la couronne a une part par secteur, nommee par son noeud', () => {
    const { doc } = buildSource()
    const parts = buildDonutParts(doc, treeOf(doc))

    // Le fait qui rend ce lot court : un secteur porte DEJA l identifiant du noeud.
    expect(parts.by_id['Racine']).toBeDefined()
    expect(parts.by_id['EnfantA']).toBeDefined()
    expect(parts.by_id['Racine'].name).toBe('Racine')
    expect(parts.by_id['EnfantA'].name).toBe('EnfantA')
  })

  it('le nom vient du SUJET : renommer le noeud renomme la part', () => {
    const { doc, ble } = buildSource()
    const parts = buildDonutParts(doc, treeOf(doc))

    ble.name = 'Froment'

    expect(parts.by_id['EnfantA'].name).toBe('Froment')
  })

  it('renommer la PART renomme le noeud du diagramme', () => {
    // L autre sens, et c est celui qui fait de la part un element utile : l inspecteur ecrit sur
    // elle, et c est le document qui change. Un seul historique.
    const { doc, ble } = buildSource()
    const parts = buildDonutParts(doc, treeOf(doc))

    parts.by_id['EnfantA'].name = 'Froment'

    expect(ble.name).toBe('Froment')
  })

  it('les etiquettes et la hierarchie sont celles du sujet', () => {
    const { doc, sankey, ble, racine } = buildSource()
    const tagg = sankey.addNodeTagGroup('grp', 'Groupe', false)
    // `addTag` rend un `Class_ProtoTag` : le sac commun aux quatre sortes d etiquettes. Celles
    // de NOEUDS portent en plus leurs references, et c est ce qu on lit ici.
    const tag = tagg.addTag('Bio', 'tag_bio') as Class_Tag
    const parts = buildDonutParts(doc, treeOf(doc))

    parts.by_id['EnfantA'].addTag(tag)

    // L etiquette s est posee sur le NOEUD : c est lui qui s enregistre dans les references du
    // tag, jamais la part — rebatir la couronne ne peut donc pas laisser de reference morte.
    expect(ble.hasGivenTag(tag)).toBe(true)
    expect(parts.by_id['EnfantA'].hasGivenTag(tag)).toBe(true)
    expect(tag.references.map((e: { id: string }) => e.id)).toContain('EnfantA')
    // Et la hierarchie se lit a travers : c est elle qui FAIT les anneaux.
    expect(parts.by_id['EnfantA'].is_child).toBe(true)
    expect(parts.by_id['Racine'].is_parent).toBe(true)
    expect(racine.is_parent).toBe(true)
  })
})

describe('os#1445 la figure NE se delegue pas', () => {

  it('repeindre une part ne repeint pas le noeud du diagramme', () => {
    // LA FRONTIERE. L aspect d un secteur (lisere blanc, dix points) n a rien a voir avec celui
    // du noeud sur le Sankey, et l arbitrage du 17/09 pour l etoile vaut ici tel quel.
    const { doc, ble } = buildSource()
    const parts = buildDonutParts(doc, treeOf(doc))
    const avant = ble.shape_color

    parts.by_id['EnfantA'].shape_color = '#123456'

    expect(parts.by_id['EnfantA'].shape_color).toBe('#123456')
    expect(ble.shape_color).toBe(avant)
    expect(ble.shape_color).not.toBe('#123456')
  })

  it('et le noeud ne dicte pas non plus a la part', () => {
    const { doc, ble } = buildSource()
    const parts = buildDonutParts(doc, treeOf(doc))
    const part_avant = parts.by_id['EnfantA'].shape_color

    ble.shape_color = '#abcdef'

    expect(parts.by_id['EnfantA'].shape_color).toBe(part_avant)
  })

  it('une part est un vrai element : la cascade des styles la porte', () => {
    // C est la raison d etre du contenant. Sans zone de dessin ni sankey, `getElementProperty` n
    // aurait pas de style ou remonter, et « editer globalement par les styles » — la seconde
    // moitie de la demande — serait impossible.
    const { doc } = buildSource()
    const parts = buildDonutParts(doc, treeOf(doc))
    const part = parts.by_id['EnfantA']

    expect(part).toBeInstanceOf(Class_DonutPart)
    expect(part.drawing_area).toBe(parts.document.drawing_area)
    expect(parts.document.drawing_area.sankey.styles_list.length).toBeGreaterThan(0)
    // Rien n est surcharge au depart : tout descend du style.
    expect(part.isAttributeOverloaded('shape_color')).toBe(false)
    part.shape_color = '#123456'
    expect(part.isAttributeOverloaded('shape_color')).toBe(true)
  })
})

describe('os#1445 le secteur residuel, et le rebatissage', () => {

  it('un secteur RESIDUEL est une part SANS sujet', () => {
    // Le complement que les enfants ne couvrent pas ne designe aucun noeud. Il se regle comme les
    // autres et ne renomme rien — c est le seul secteur synthetique de la couronne.
    const { doc } = buildSource()
    // En mode `declared`, l arc du parent vaut SA valeur propre (20) et ce que ses enfants ne
    // couvrent pas (20 - 14 = 6) devient un secteur de complement.
    const tree = buildSunburstTree(doc.drawing_area.sankey, { value_mode: 'declared' })
    const parts = buildDonutParts(doc, tree as Type_SunburstTree)

    const residuals = Object.entries(parts.by_id).filter(([id]) => id.endsWith('__residual__'))
    // SANS CETTE LIGNE LE TEST PASSERAIT A VIDE : une boucle sur zero secteur ne verifie rien, et
    // c est exactement comme ca qu on se fabrique un vert menteur.
    expect(residuals.length).toBeGreaterThan(0)
    residuals
      .forEach(([, part]) => {
        expect(part.subject).toBeNull()
        // Et le renommer ne jette pas : il ecrit chez lui, sans sujet a prevenir.
        part.name = 'Reste'
        expect(part.name).toBe('Reste')
      })
  })

  it('rebatir la couronne GARDE les reglages poses a la main', () => {
    // L arbre est refait a chaque geste de navigation. Un reglage d auteur ne doit pas
    // disparaitre parce qu on a deplie un niveau.
    const { doc } = buildSource()
    const premier = buildDonutParts(doc, treeOf(doc))
    premier.by_id['EnfantA'].shape_color = '#123456'

    const second = buildDonutParts(doc, treeOf(doc), premier)

    expect(second.by_id['EnfantA'].shape_color).toBe('#123456')
    expect(second.by_id['EnfantA'].isAttributeOverloaded('shape_color')).toBe(true)
    // Ce qui n avait pas ete touche ne devient pas surcharge au passage.
    expect(second.by_id['EnfantB'].isAttributeOverloaded('shape_color')).toBe(false)
    // Et l ancien document a cesse de vivre : une couronne ne tient pas ses vieux modeles.
    expect(premier.document.disposed).toBe(true)
  })
})
