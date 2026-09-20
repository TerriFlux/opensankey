// os#1440 — COLLER ENTRE DEUX DOCUMENTS.
//
// Depuis le lot 2, un Ctrl+V venu d un AUTRE document ne collait rien et posait un message : « cela
// demande une serialisation du contenu copie, pas des identifiants ; c est le lot 3 ». Le lot 3 est
// passe — il a rendu un second document editable — et la serialisation n a jamais ete reprise. Le
// message renvoyait donc a une etape TERMINEE, ce qui est la pire forme d attente : elle promet ce
// qui est cense etre deja arrive.
//
// ET LA SERIALISATION N ETAIT PAS NECESSAIRE. La crainte etait de transporter des references qui ne
// designent rien ailleurs ; le code y repondait deja, et c est ce que ce fichier fige :
//  - les ETIQUETTES se resolvent dans le diagramme d ARRIVEE (`addTagsReferencingFrom` lit
//    `this._node.sankey`), et celles qui n y existent pas sont ignorees en silence ;
//  - les STYLES ne suivent PAS : `copyAttrFrom` ne copie que les surcharges PROPRES de l element.
//
// Un noeud colle prend donc l allure de son nouveau document et garde ce que son auteur avait regle
// a la main. C est ce que font Excel et Figma, et c est ce qu on veut : coller un noeud ne doit pas
// importer la charte d un autre fichier.

import { Class_Workspace } from './Workspace'
import type { Class_ApplicationData } from './ApplicationData'
import type { Class_Tag } from './Tag'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

/**
 * Deux documents vivants dans le meme espace de travail : A qu on edite, et B a cote.
 *
 * B nait hors ecran, donc SANS droit d edition (os#1385 lot 3, D4 : un document sans ecran
 * n edite pas). C est la phase B — celle qui lui donne un cadre dans la grande zone — qui le
 * repasse a vrai ; ici on le fait a la main, puisque c est cet etat-la qu on veut eprouver.
 */
const buildTwoDocuments = () => {
  const ws = new Class_Workspace(false)
  const a = ws.createDocument()
  const b = ws.createDocument({ offscreen: true })
  b.edition_allowed = true
  jest.spyOn(a, 'saveInCache').mockImplementation(() => undefined)
  jest.spyOn(b, 'saveInCache').mockImplementation(() => undefined)
  return { ws, a, b }
}

const nodeNames = (doc: Class_ApplicationData): string[] =>
  doc.drawing_area.sankey.nodes_list.map(n => n.name).sort()

/** Une frappe telle que jsdom la fabrique (le modele ne lit que `key` et les modificateurs). */
const keystroke = (key: string) =>
  new KeyboardEvent('keydown', { key, ctrlKey: true, bubbles: true })

describe('os#1440 coller ce qui vient d un autre document', () => {

  it('les noeuds copies dans A arrivent dans B', () => {
    const { ws, a, b } = buildTwoDocuments()
    const chene = a.drawing_area.sankey.addNewNode('n_chene', 'Chene')
    a.drawing_area.addElementToSelection(chene)

    a.handleKeyboardEvent(keystroke('c'))
    expect(ws.clipboard?.source).toBe(a)
    b.handleKeyboardEvent(keystroke('v'))

    expect(nodeNames(b)).toEqual(['Chene'])
    // Et A n a pas bouge : coller modifie la CIBLE, et elle seule.
    expect(nodeNames(a)).toEqual(['Chene'])
  })

  it('les liens INTERNES a la selection suivent, les autres non', () => {
    // Meme regle que la duplication chez soi : un lien dont une extremite n est pas copiee n a
    // pas d ou partir. La difference est qu ici il n y a meme pas d extremite a retrouver.
    const { a, b } = buildTwoDocuments()
    const sankey = a.drawing_area.sankey
    const amont = sankey.addNewNode('n_amont', 'Amont')
    const milieu = sankey.addNewNode('n_milieu', 'Milieu')
    const aval = sankey.addNewNode('n_aval', 'Aval')
    sankey.addNewLink(amont, milieu)
    sankey.addNewLink(milieu, aval)
    a.drawing_area.addElementToSelection(amont)
    a.drawing_area.addElementToSelection(milieu)

    a.handleKeyboardEvent(keystroke('c'))
    b.handleKeyboardEvent(keystroke('v'))

    expect(nodeNames(b)).toEqual(['Amont', 'Milieu'])
    expect(b.drawing_area.sankey.links_list.length).toBe(1)
  })

  it('un document sans droit d edition ne recoit rien', () => {
    // Coller, c est editer. Le droit est celui du DOCUMENT et non de sa place a l ecran.
    const { a, b } = buildTwoDocuments()
    b.edition_allowed = false
    const chene = a.drawing_area.sankey.addNewNode('n_chene', 'Chene')
    a.drawing_area.addElementToSelection(chene)

    a.handleKeyboardEvent(keystroke('c'))
    b.handleKeyboardEvent(keystroke('v'))

    expect(nodeNames(b)).toEqual([])
  })

  it('une etiquette que B ne connait pas ne le suit pas, et rien ne pend', () => {
    // LA CRAINTE D ORIGINE, et la raison pour laquelle le geste avait ete remis a plus tard. La
    // resolution se fait dans le diagramme d ARRIVEE : une etiquette absente est simplement
    // ignoree, aucune reference ne peut pointer vers le groupe d etiquettes de A.
    const { a, b } = buildTwoDocuments()
    const sankey_a = a.drawing_area.sankey
    const tagg = sankey_a.addNodeTagGroup('grp_essence', 'Essence', false)
    const tag = tagg.addTag('Chene', 'tag_chene')
    const chene = sankey_a.addNewNode('n_chene', 'Chene')
    chene.addTag(tag as Class_Tag)
    expect(chene.tags_list.length).toBe(1)
    a.drawing_area.addElementToSelection(chene)

    a.handleKeyboardEvent(keystroke('c'))
    b.handleKeyboardEvent(keystroke('v'))

    const colle = b.drawing_area.sankey.nodes_list.find(n => n.name === 'Chene')
    expect(colle).toBeDefined()
    expect(colle!.tags_list.length).toBe(0)
    // Et B n a pas herite du groupe d etiquettes de A : coller un noeud n importe pas la
    // taxonomie d un autre fichier.
    expect(b.drawing_area.sankey.node_taggs_dict['grp_essence']).toBeUndefined()
  })

  it('une etiquette que B connait DEJA, elle, retrouve la sienne', () => {
    // L autre moitie de la meme regle, et celle qui rend le geste utile : deux feuilles d un
    // meme fichier partagent leurs groupes d etiquettes, donc un noeud colle d une feuille a
    // l autre garde son classement. La resolution est par IDENTIFIANT, pas par reference.
    const { a, b } = buildTwoDocuments()
    const tagg_a = a.drawing_area.sankey.addNodeTagGroup('grp_essence', 'Essence', false)
    const tag_a = tagg_a.addTag('Chene', 'tag_chene')
    const tagg_b = b.drawing_area.sankey.addNodeTagGroup('grp_essence', 'Essence', false)
    tagg_b.addTag('Chene', 'tag_chene')
    const chene = a.drawing_area.sankey.addNewNode('n_chene', 'Chene')
    chene.addTag(tag_a as Class_Tag)
    a.drawing_area.addElementToSelection(chene)

    a.handleKeyboardEvent(keystroke('c'))
    b.handleKeyboardEvent(keystroke('v'))

    const colle = b.drawing_area.sankey.nodes_list.find(n => n.name === 'Chene')!
    expect(colle.tags_list.length).toBe(1)
    // C est l etiquette de B, pas celle de A : aucune reference ne traverse.
    expect(colle.tags_list[0]).toBe(tagg_b.tags_dict['tag_chene'])
    expect(colle.tags_list[0]).not.toBe(tag_a)
  })

  it('un enfant colle SEUL arrive detache, sans planter son parent dans B', () => {
    // La hierarchie se resout comme les etiquettes : par identifiant, dans le diagramme
    // d ARRIVEE, et un parent introuvable laisse l enfant DETACHE plutot que d inventer un
    // noeud (`NodeDimension.fromJSON`, garde `if (parent)`, cf. #193). C est la regle du
    // chargement d un fichier, et elle vaut donc aussi pour un collage.
    const { a, b } = buildTwoDocuments()
    const sankey_a = a.drawing_area.sankey
    const parent = sankey_a.addNewNode('n_foret', 'Foret')
    const enfant = sankey_a.addNewNode('n_chene', 'Chene')
    enfant._nodeDimensionsManager.getOrCreateLowerDimension(parent, enfant, 'essence')
    expect(enfant.dimensions_as_child.length).toBe(1)
    a.drawing_area.addElementToSelection(enfant)

    a.handleKeyboardEvent(keystroke('c'))
    b.handleKeyboardEvent(keystroke('v'))

    // Un seul noeud dans B : le parent n a pas ete fabrique dans son dos.
    expect(nodeNames(b)).toEqual(['Chene'])
    expect(b.drawing_area.sankey.nodes_list[0].dimensions_as_child.length).toBe(0)
  })

  it('un document d origine LIBERE refuse le collage, et le dit', () => {
    // Le seul refus qui reste. Une feuille libere son document a la bascule d onglet ou a la
    // fermeture de sa fenetre : le presse-papiers designe alors un modele mort. Il SURVIT a sa
    // source exprès (cf. `forgetDocument`), justement pour qu on puisse le dire au lieu de ne
    // rien faire en silence.
    const { ws, a, b } = buildTwoDocuments()
    const source = ws.createDocument({ offscreen: true })
    source.edition_allowed = true
    const chene = source.drawing_area.sankey.addNewNode('n_chene', 'Chene')
    source.drawing_area.addElementToSelection(chene)
    jest.spyOn(source, 'saveInCache').mockImplementation(() => undefined)
    const dit = jest.spyOn(b, 'notifyUser').mockImplementation(() => undefined)

    source.handleKeyboardEvent(keystroke('c'))
    expect(ws.clipboard?.source).toBe(source)
    source.dispose()
    // Le presse-papiers est TOUJOURS la, et c est ce qui permet le message.
    expect(ws.clipboard?.source).toBe(source)

    b.handleKeyboardEvent(keystroke('v'))

    expect(nodeNames(b)).toEqual([])
    expect(dit).toHaveBeenCalled()
    expect(dit.mock.calls[0][0]).toBe('clipboard_cross_document')
    expect(nodeNames(a)).toEqual([])
  })

  it('copier, CHANGER D ONGLET, coller', () => {
    // LE GESTE ORDINAIRE, et celui que le lot os#1440 avait manque. Il ne couvrait que deux
    // documents COTE A COTE — deux fenetres, deux modeles vivants. Ici il n y a qu UN document :
    // changer d onglet ne cree pas un second modele, il RECHARGE le meme avec le contenu de
    // l autre feuille. Le presse-papiers pointe donc le bon objet, `from_elsewhere` est faux,
    // et le collage cherche les identifiants copies dans un diagramme ou ils n existent plus.
    const ws = new Class_Workspace(false)
    const main = ws.createDocument()
    const sankey = main.drawing_area.sankey
    const a = sankey.addNewNode('n_a', 'Amont')
    const b = sankey.addNewNode('n_b', 'Aval')
    sankey.addNewLink(a, b)
    main.drawing_area.addElementToSelection(a)
    main.drawing_area.addElementToSelection(b)
    jest.spyOn(main, 'saveInCache').mockImplementation(() => undefined)

    main.handleKeyboardEvent(keystroke('c'))
    // L onglet « + » : la feuille d avant devient un instantane, celle-ci devient courante.
    main.createNewSheet(false)
    expect(nodeNames(main)).toEqual([])

    main.handleKeyboardEvent(keystroke('v'))

    expect(nodeNames(main)).toEqual(['Amont', 'Aval'])
    expect(main.drawing_area.sankey.links_list.length).toBe(1)
  })

  it('copier, BASCULER par la barre donglets, coller', () => {
    // Le meme geste par l autre chemin : les deux feuilles existent deja et on clique l onglet.
    const ws = new Class_Workspace(false)
    const main = ws.createDocument()
    main.createNewSheet(false)
    const sheet_b = main.current_sheet_id
    const sheet_a = main.sheets_order[0]
    main.switchToSheet(sheet_a, false)
    const chene = main.drawing_area.sankey.addNewNode('n_chene', 'Chene')
    main.drawing_area.addElementToSelection(chene)
    jest.spyOn(main, 'saveInCache').mockImplementation(() => undefined)

    main.handleKeyboardEvent(keystroke('c'))
    main.switchToSheet(sheet_b, false)
    expect(nodeNames(main)).toEqual([])

    main.handleKeyboardEvent(keystroke('v'))

    expect(nodeNames(main)).toEqual(['Chene'])
  })

  it('coller chez soi n a pas change : la duplication ordinaire fonctionne toujours', () => {
    // La contre-epreuve. Le chemin d avant est celui de tous les jours ; il ne doit rien devoir
    // au nouveau.
    const { a } = buildTwoDocuments()
    const chene = a.drawing_area.sankey.addNewNode('n_chene', 'Chene')
    a.drawing_area.addElementToSelection(chene)

    a.handleKeyboardEvent(keystroke('c'))
    a.handleKeyboardEvent(keystroke('v'))

    expect(a.drawing_area.sankey.nodes_list.length).toBe(2)
  })
})
