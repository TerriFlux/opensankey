// os#1433 — A QUI APPARTIENT LA DISPOSITION : la grille a l espace de travail, ce qu une fenetre
// REGARDE a la feuille.
//
// C est l etape A de l audit du 19/09/2026 (notes/appli-d-applis/audit-2026-09-19.md), et elle
// tranche une contradiction du plan lui-meme : D1 mettait la disposition dans l espace de travail,
// D8 la laissait « dans le document comme disposition par defaut ». Le code faisait fidelement les
// deux, ce qui donnait TROIS comportements pour une seule notion :
//
//  - par feuille au retour : `toSheetContentJSON` appelle `_toJSON` sur le document PRINCIPAL,
//    donc `is_main` y etait vraie et `main_zone` partait dans l instantane ; basculer le rejouait ;
//  - heritee a la creation : une feuille neuve charge un diagramme vierge, sans `main_zone`, donc
//    rien n etait rejoue et les fenetres de la feuille precedente restaient — y compris celles
//    epinglees sur des noeuds qui n existent pas dans la feuille neuve ;
//  - enregistree dans le document, alors que D1 la declare de l espace de travail.
//
// Julien l a vu par le troisieme bout : « on ouvre une feuille avec le +, ca vient avec les memes
// fenetres que la feuille ou on etait : diagramme, doc et sunburst ».
//
// LA REGLE, en deux moities, et ce fichier les fige separement :
//  1. la GRILLE (cases, tailles, fenetres a sujet diagramme) est de l espace de travail : elle ne
//     s ecrit plus dans un instantane de feuille, ne s y relit plus, et survit aux bascules ;
//  2. ce qu une fenetre REGARDE peut etre de la feuille : un sujet EPINGLE (node, link, elements,
//     tag) sur la feuille qu on quitte s en va avec elle. `diagram` et `selection` survivent.

import { Class_Workspace } from './Workspace'
import { MAIN_ZONE_CANVAS_ID, MAIN_ZONE_JSON_ID } from './MenuConfig'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

/** Un document a deux feuilles, la premiere courante, et de quoi epingler. */
const buildTwoSheets = () => {
  const ws = new Class_Workspace(false)
  const main = ws.createDocument()
  main.drawing_area.sankey.addNewNode('n_a', 'Chene')
  const sheet_b = main.createNewSheet(false)
  main.drawing_area.sankey.addNewNode('n_b', 'Hetre')
  main.switchToSheet(main.sheets_order[0], false)
  return { ws, main, sheet_a: main.sheets_order[0], sheet_b }
}

const windowIds = (main: { menu_configuration: { main_zone_occupants: { id: string }[] } }): string[] =>
  main.menu_configuration.main_zone_occupants.map(o => o.id)

describe('os#1433 la grille est de l espace de travail', () => {

  it('un instantane de feuille ne porte plus la disposition', () => {
    // LE COEUR DU DEFAUT. `toSheetContentJSON` est appelee par le document PRINCIPAL, donc la
    // garde `is_main` seule laissait passer : c est la seconde garde, `without_sheets`, qui
    // manquait — celle que la cle `workspace` porte, quatre lignes plus bas dans le meme fichier.
    const { main } = buildTwoSheets()
    main.menu_configuration.showMainZoneOccupant(MAIN_ZONE_JSON_ID, 'right')

    const sheet_content = main.toSheetContentJSON()
    // `toJSON` et non `saveToJSON` : on veut la serialisation, pas le telechargement.
    const whole_file = main.toJSON()

    expect(sheet_content['main_zone']).toBeUndefined()
    // Et la racine du FICHIER la porte toujours : c est la, et seulement la, qu elle vit.
    expect(whole_file['main_zone']).toBeDefined()
  })

  it('basculer de feuille garde la grille', () => {
    const { main, sheet_b } = buildTwoSheets()
    main.menu_configuration.showMainZoneOccupant(MAIN_ZONE_JSON_ID, 'right')
    const avant = windowIds(main)
    expect(avant).toContain(MAIN_ZONE_JSON_ID)

    main.switchToSheet(sheet_b, false)

    // Personne ne veut refaire sa mise en page a chaque onglet.
    expect(windowIds(main)).toEqual(avant)
  })

  it('une feuille VIERGE n a qu une fenetre, la zone de dessin', () => {
    // Arbitrage de Julien, et c est la limite de la regle du dessus : garder sa mise en page d un
    // onglet a l autre est un service, la garder devant une page BLANCHE n en est pas un. Une
    // feuille vierge n a rien dont un tableur ou une couronne puissent parler.
    const { main } = buildTwoSheets()
    main.menu_configuration.showMainZoneOccupant(MAIN_ZONE_JSON_ID, 'right')

    main.createNewSheet(false)

    expect(windowIds(main)).toEqual([MAIN_ZONE_CANVAS_ID])
  })

  it('« Nouveau diagramme » supprime les fenetres, redessin ou pas', () => {
    // Elles survivaient, et ce n etait pas un oubli mais une consequence : la grande zone est de
    // l HOTE depuis le lot 3, et `reset()` ne remet a zero que le DOCUMENT. On repartait d un
    // diagramme vierge dans la mise en page du precedent.
    const { main } = buildTwoSheets()
    main.menu_configuration.showMainZoneOccupant(MAIN_ZONE_JSON_ID, 'right')

    main.reinitialization(false)

    expect(windowIds(main)).toEqual([MAIN_ZONE_CANVAS_ID])
  })

  it('un fichier ecrit AVANT ce correctif ne rejoue plus la disposition de ses feuilles', () => {
    // La garde de lecture ne sert pas qu au present : le parc des fichiers deja enregistres porte
    // une disposition dans CHAQUE instantane de feuille. Sans elle, ils continueraient de faire
    // changer les fenetres a chaque bascule, indefiniment.
    const { main, sheet_b } = buildTwoSheets()
    const mc = main.menu_configuration

    // Le cas historique, fabrique par le code LUI-MEME et non a la main : on met en place une
    // disposition a deux fenetres, on prend la vraie serialisation que l ancien code aurait mise
    // dans l instantane, puis on revient a une disposition a UNE fenetre. Rejouer la premiere
    // serait donc visible — et c est precisement ce qu on refuse.
    mc.showMainZoneOccupant(MAIN_ZONE_JSON_ID, 'right')
    const disposition_d_avant = main.toJSON()['main_zone']
    expect(disposition_d_avant).toBeDefined()
    mc.hideMainZoneOccupant(MAIN_ZONE_JSON_ID)
    const avant = windowIds(main)
    expect(avant).not.toContain(MAIN_ZONE_JSON_ID)

    const legacy = main.toSheetContentJSON()
    legacy['main_zone'] = disposition_d_avant
    main.fromJSON(legacy as never, { keep_file_state: true } as never, false)

    expect(windowIds(main)).toEqual(avant)
    expect(sheet_b).toBeTruthy()
  })
})

describe('os#1433 une fenetre epinglee appartient a sa feuille', () => {

  it('basculer vers une feuille qui existe ferme la fenetre epinglee sur celle qu on quitte', () => {
    // Le cas de Julien vu par l autre bout : le sunburst sur le noeud « Fruits » suivait sur la
    // feuille d arrivee, ou ce noeud n existe pas. Il s ouvrait vide en continuant d annoncer le
    // nom d avant. La bascule, elle, GARDE la grille : on reprend un travail, on n en commence
    // pas un (cf. la creation, plus haut, qui remet tout au diagramme seul).
    const { main, sheet_b } = buildTwoSheets()
    const pinned = main.menu_configuration.openMainZoneWindow(
      { kind: 'node', id: 'n_a' }, MAIN_ZONE_JSON_ID, 'right'
    )
    expect(windowIds(main)).toContain(pinned)

    main.switchToSheet(sheet_b, false)

    expect(windowIds(main)).not.toContain(pinned)
    expect(windowIds(main)).toContain(MAIN_ZONE_CANVAS_ID)
  })

  it('a la bascule, un sujet diagramme survit, un sujet qui SUIT la selection aussi', () => {
    // Les deux ne nomment aucun identifiant : le premier montre le diagramme quel qu il soit, le
    // second se repointe sur ce qu on touche. Les fermer serait une perte sans raison.
    const { main, sheet_b } = buildTwoSheets()
    const suiveuse = main.menu_configuration.openMainZoneWindow({ kind: 'selection' }, MAIN_ZONE_JSON_ID, 'right')

    main.switchToSheet(sheet_b, false)

    expect(windowIds(main)).toContain(suiveuse)
  })

  it('a la bascule, une fenetre epinglee sur une AUTRE feuille survit', () => {
    // On quitte A vers B ; la fenetre nomme B. Ses objets ne bougent pas, elle garde son sens —
    // et en arrivant sur B elle devient une fenetre sur la feuille courante, ce qu elle disait.
    const { main, sheet_b } = buildTwoSheets()
    const sur_b = main.menu_configuration.openMainZoneWindow(
      { kind: 'node', id: 'n_b', sheet: sheet_b }, MAIN_ZONE_JSON_ID, 'right'
    )

    main.switchToSheet(sheet_b, false)

    expect(windowIds(main)).toContain(sur_b)
  })

  it('fermer la derniere fenetre epinglee est permis, meme s il ne reste rien d autre', () => {
    // `hideMainZoneOccupant` refuse de retirer la derniere fenetre — garde juste pour un GESTE de
    // l utilisateur, fausse ici : une feuille dont aucune fenetre n a de sens doit pouvoir n en
    // garder aucune, le canevas de la feuille d arrivee reprenant la place au rendu suivant.
    const { main } = buildTwoSheets()
    const mc = main.menu_configuration
    const pinned = mc.openMainZoneWindow({ kind: 'node', id: 'n_a' }, MAIN_ZONE_JSON_ID, 'right')
    mc.hideMainZoneOccupant(MAIN_ZONE_CANVAS_ID)
    expect(windowIds(main)).toEqual([pinned])

    expect(mc.closeWindowsPinnedOnSheet(main.current_sheet_id)).toEqual([pinned])
    expect(windowIds(main)).not.toContain(pinned)
  })
})
