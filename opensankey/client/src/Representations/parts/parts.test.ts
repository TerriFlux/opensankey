// os#1445 — UN NOEUD, UN FLUX, UNE PART SONT DES ELEMENTS. Etape 1 : l element et son contenant.
//
// Deux corrections de Julien (20/09) ont refait ce lot, et ce fichier les fige toutes les deux.
//
// 1. UNE PART N EST PAS TOUJOURS UN NOEUD. « ca peut etre des flux et autres choses si on les
//    regroupe avec une etiquette ». Exact : sous `group_by`, une part est la SOMME des flux
//    portant une etiquette — aucun element unique n est derriere elle.
// 2. L ABSTRACTION EST L ELEMENT. `Class_BaseShape` porte forme, libelle et valeur ; nœud et flux
//    en descendent tous deux, la part est le troisieme frere. La premiere version etendait
//    `Class_NodeElement`, pour une raison d heritage d implementation et non de nature.
//
// Et l arbitrage qui tranche le renommage : il y a LE NOM et SON AFFICHAGE. L alias est le libelle
// de la part. Renommer depuis une part ecrit SON alias, jamais le nom du sujet — un geste de mise
// en forme ne modifie pas les donnees du document.
//
// Ce fichier ne touche PAS au trace (etape 2) ni a la selection (etape 3) : rien n a change a
// l ecran a ce stade.

import { Class_ApplicationData } from '../../types/ApplicationData'
import { buildParts } from './buildParts'
import type { Type_PartInput } from './buildParts'
import { Class_PartElement } from './PartElement'
import { Class_BaseShape } from '../../Elements/Element'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

/** Un document source ordinaire : c est lui qui porte les sujets. */
const buildSource = () => {
  const doc = new Class_ApplicationData(false)
  doc.drawing_area.bypass_redraws = true
  return doc
}

/** Les quatre sortes de sujets, telles que les decompositions les produisent. */
const fourKinds = (): Type_PartInput[] => [
  { id: 'n_ble', label: 'Ble', value: 6, subject: { kind: 'node', node: { id: 'n_ble', name: 'Ble' } } },
  { id: 'l_1', label: 'Amont > Ble', value: 6, subject: { kind: 'flux', link: { id: 'l_1', name: 'Amont > Ble' } } },
  { id: 'tag_bio', label: 'Bio', value: 9, subject: { kind: 'tag', tag: { id: 'tag_bio', name: 'Bio' } } },
  { id: 'n_ble__residual__', label: 'Reste', value: 2 }
]

describe('os#1445 une part est un element, au meme titre quun noeud et quun flux', () => {

  it('une part descend de Class_BaseShape, et NON de Class_NodeElement', () => {
    // LA CORRECTION DE CONCEPTION. Etendre le noeud aurait donne a une part-flux des dimensions,
    // une hierarchie et quatre poignees de redimensionnement sans aucun sens pour elle.
    const source = buildSource()
    const figure = buildParts(source, fourKinds())
    const part = figure.by_id['l_1']

    expect(part).toBeInstanceOf(Class_PartElement)
    expect(part).toBeInstanceOf(Class_BaseShape)
    // Elle a bien les trois familles d attributs — les trois onglets de l inspecteur.
    expect(typeof part.shape_color).toBe('string')
    expect(typeof part.name_label_is_visible).toBe('boolean')
    expect(typeof part.value_label_is_visible).toBe('boolean')
  })

  it('les QUATRE sortes de sujets existent, et la part les porte telles quelles', () => {
    const source = buildSource()
    const figure = buildParts(source, fourKinds())

    expect(figure.by_id['n_ble'].subject.kind).toBe('node')
    expect(figure.by_id['l_1'].subject.kind).toBe('flux')
    // Le cas qui interdit de reduire une part a un element : une somme de flux sous une etiquette.
    expect(figure.by_id['tag_bio'].subject.kind).toBe('tag')
    // Et le complement, qui ne designe rien — une reponse, pas un manque.
    expect(figure.by_id['n_ble__residual__'].subject.kind).toBe('none')
  })

  it('lordre du trace est conserve', () => {
    const source = buildSource()
    const figure = buildParts(source, fourKinds())

    expect(figure.ordered.map(p => p.id)).toEqual(['n_ble', 'l_1', 'tag_bio', 'n_ble__residual__'])
  })
})

describe('os#1445 le nom, et son affichage', () => {

  it('sans alias, la part affiche le nom de son SUJET', () => {
    const source = buildSource()
    const figure = buildParts(source, fourKinds())

    expect(figure.by_id['n_ble'].name).toBe('Ble')
    expect(figure.by_id['n_ble'].name_label_effective).toBe('Ble')
    expect(figure.by_id['tag_bio'].name_label_effective).toBe('Bio')
  })

  it('un ALIAS gagne, et le nom du sujet ne bouge pas', () => {
    // LA REGLE. Le meme noeud nomme « Ble » sur le diagramme et « Toutes cereales » sur la
    // couronne : un geste de mise en forme ne modifie jamais les donnees du document.
    const source = buildSource()
    const sujet = { id: 'n_ble', name: 'Ble' }
    const figure = buildParts(source, [
      { id: 'n_ble', label: 'Ble', value: 6, subject: { kind: 'node', node: sujet } }
    ])
    const part = figure.by_id['n_ble']

    part.alias = 'Toutes cereales'

    expect(part.name_label_effective).toBe('Toutes cereales')
    expect(part.alias).toBe('Toutes cereales')
    // Le sujet est intact : c est tout le propos.
    expect(sujet.name).toBe('Ble')
    expect(part.name).toBe('Ble')
  })

  it('retirer lalias rend la part au nom du sujet, et elle le SUIT de nouveau', () => {
    const source = buildSource()
    const sujet = { id: 'n_ble', name: 'Ble' }
    const figure = buildParts(source, [
      { id: 'n_ble', label: 'Ble', value: 6, subject: { kind: 'node', node: sujet } }
    ])
    const part = figure.by_id['n_ble']
    part.alias = 'Toutes cereales'

    part.alias = ''

    expect(part.name_label_effective).toBe('Ble')
    // Et renommer le noeud ailleurs change bien ce que la part affiche.
    sujet.name = 'Froment'
    expect(part.name_label_effective).toBe('Froment')
  })

  it('une part qui agrege des flux, et une part-flux, se renomment CHEZ ELLES', () => {
    // Les deux cas qui n avaient pas de reponse evidente, et que la regle de l alias tranche d un
    // coup : rien n est renomme en amont, ni l etiquette ni le noeud d en face.
    const source = buildSource()
    const tag = { id: 'tag_bio', name: 'Bio' }
    const link = { id: 'l_1', name: 'Amont > Ble' }
    const figure = buildParts(source, [
      { id: 'tag_bio', label: 'Bio', value: 9, subject: { kind: 'tag', tag } },
      { id: 'l_1', label: 'Amont > Ble', value: 6, subject: { kind: 'flux', link } }
    ])

    figure.by_id['tag_bio'].alias = 'Agriculture biologique'
    figure.by_id['l_1'].alias = 'Livraison'

    expect(figure.by_id['tag_bio'].name_label_effective).toBe('Agriculture biologique')
    expect(figure.by_id['l_1'].name_label_effective).toBe('Livraison')
    expect(tag.name).toBe('Bio')
    expect(link.name).toBe('Amont > Ble')
  })

  it('un secteur de complement se renomme sans rien prevenir', () => {
    const source = buildSource()
    const figure = buildParts(source, fourKinds())
    const residuel = figure.by_id['n_ble__residual__']

    residuel.alias = 'Non affecte'

    expect(residuel.name_label_effective).toBe('Non affecte')
    expect(residuel.subject.kind).toBe('none')
  })
})

describe('os#1445 la figure est propre a la part', () => {

  it('deux parts ont des reglages independants', () => {
    const source = buildSource()
    const figure = buildParts(source, fourKinds())

    figure.by_id['n_ble'].shape_color = '#123456'

    expect(figure.by_id['n_ble'].shape_color).toBe('#123456')
    expect(figure.by_id['l_1'].shape_color).not.toBe('#123456')
  })

  it('la cascade des styles porte la part', () => {
    // C est la raison d etre du contenant : sans zone de dessin ni style, « editer globalement par
    // les styles » — la seconde moitie de la demande — serait impossible.
    const source = buildSource()
    const figure = buildParts(source, fourKinds())
    const part = figure.by_id['n_ble']

    expect(part.drawing_area).toBe(figure.document.drawing_area)
    expect(part.isAttributeOverloaded('shape_color')).toBe(false)
    part.shape_color = '#123456'
    expect(part.isAttributeOverloaded('shape_color')).toBe(true)
  })

  it('redessiner la figure GARDE les reglages poses a la main', () => {
    // Les parts changent a chaque geste de navigation. Un reglage d auteur ne doit pas disparaitre
    // parce qu on a deplie un niveau.
    const source = buildSource()
    const premier = buildParts(source, fourKinds())
    premier.by_id['n_ble'].shape_color = '#123456'
    premier.by_id['n_ble'].alias = 'Toutes cereales'

    const second = buildParts(source, fourKinds(), premier)

    expect(second.by_id['n_ble'].shape_color).toBe('#123456')
    expect(second.by_id['n_ble'].name_label_effective).toBe('Toutes cereales')
    expect(second.by_id['l_1'].isAttributeOverloaded('shape_color')).toBe(false)
  })

  it('os#1453 redessiner rend la MEME part et le MEME document', () => {
    // CE TEST REMPLACE SON CONTRAIRE, et le renversement est le coeur de la correction : la
    // version d avant affirmait que l ancien document avait « cesse de vivre ». C etait vrai, et
    // c etait le defaut — trois choses pointent sur une part (la selection, le document actif,
    // l inspecteur), et les jeter a chaque dessin detruisait l objet qu on etait en train de
    // regler.
    const source = buildSource()
    const premier = buildParts(source, fourKinds())

    const second = buildParts(source, fourKinds(), premier)

    expect(second.document).toBe(premier.document)
    expect(second.by_id['n_ble']).toBe(premier.by_id['n_ble'])
    expect(premier.document.disposed).toBe(false)
  })

  it('os#1453 la SELECTION survit au redessin', () => {
    // LE SYMPTOME, EN UNE ASSERTION. « Je clique sur une part, ca ramene sur Graphe » : le
    // document actif etait remplace par un neuf, dont la selection etait vide, et l inspecteur
    // retombait sur la figure faute de selection.
    const source = buildSource()
    const premier = buildParts(source, fourKinds())
    const area = premier.document.drawing_area
    area.addElementToSelection(premier.by_id['n_ble'])

    const second = buildParts(source, fourKinds(), premier)

    expect(second.document.drawing_area.selected_elements_list)
      .toContain(second.by_id['n_ble'])
  })

  it('os#1453 une part que la decomposition ne cite plus quitte la selection', () => {
    // La contre-epreuve. Garder l objet ne doit pas vouloir dire garder un secteur disparu :
    // l inspecteur proposerait les reglages de quelque chose qui n est plus a l ecran, et
    // l auteur les poserait sur rien.
    const source = buildSource()
    const premier = buildParts(source, fourKinds())
    const area = premier.document.drawing_area
    const partie = premier.by_id['l_1']
    area.addElementToSelection(partie)

    const second = buildParts(source, fourKinds().filter(_ => _.id !== 'l_1'), premier)

    expect(second.by_id['l_1']).toBeUndefined()
    expect(second.document.drawing_area.selected_elements_list).not.toContain(partie)
  })

  it('un identifiant vu deux fois ne donne quUNE part', () => {
    // Un treillis cite le meme objet sur deux branches. Deux elements pour une seule part auraient
    // des reglages divergents, et on ne saurait pas lequel est dessine.
    const source = buildSource()
    const doublon: Type_PartInput[] = [
      { id: 'n_ble', label: 'Ble', value: 6 },
      { id: 'n_ble', label: 'Ble', value: 4 }
    ]

    const figure = buildParts(source, doublon)

    expect(figure.ordered.length).toBe(1)
  })
})
