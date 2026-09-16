// os#1385 lot 3 (D6) — LES FEUILLES SONT DES DOCUMENTS VIVANTS.
//
// Ce que ce fichier verrouille tient en une phrase : tant qu'un document porte une feuille,
// c'est LUI la vérité, et l'instantané ne l'est plus. Il n'est réécrit qu'au moment où le
// document cesse de vivre — bascule d'onglet vers cette feuille, suppression, chargement d'un
// autre fichier, fermeture de sa fenêtre (phase B). D'ici là, `sheetsToJSON` le sérialise en
// l'appelant, et « enregistrer » depuis sa fenêtre enregistre le FICHIER dont il fait partie.
//
// L'autre moitié du lot est ce que `reset()` a cessé de confondre : oublier le FICHIER
// (`resetFile`) n'est pas repartir d'un DIAGRAMME neuf (`resetDocument`). Charger le contenu
// d'une feuille ne fait que le second — d'où la disparition du stash/restore, et d'où la
// provenance sankeythèque qui survit enfin à une bascule d'onglet (inventaire 4 §2).

import { Class_Workspace } from './Workspace'
import type { Class_ApplicationData } from './ApplicationData'
import type { Type_JSON } from './Utils'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

const deepClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T

/** Nom volontairement improbable : on le cherche tel quel dans le fichier sérialisé. */
const NAME_BEFORE = 'NOEUD_AVANT_EDITION_DE_B'
const NAME_AFTER = 'NOEUD_APRES_EDITION_DE_B'

/**
 * Un espace de travail de BASE, un document principal à DEUX feuilles, et un nœud nommé dans
 * la PREMIÈRE — celle qu'on n'édite plus, donc celle qui est devenue un instantané.
 *
 * `createNewSheet(false)` : sans dessin. Elle bascule sur la feuille neuve, la précédente
 * devient donc l'instantané que `sheetApplication` sait charger dans un document à part.
 */
function buildTwoSheetWorkspace() {
  const ws = new Class_Workspace(false)
  const main = ws.createDocument()
  main.drawing_area.sankey.addNewNode('n_1', NAME_BEFORE)
  main.createNewSheet(false)
  const other_sheet = main.sheets_order[0]
  return { ws, main, other_sheet }
}

/** Renomme le premier nœud du document passé (geste de modèle, pas d'interface). */
function renameFirstNode(doc: Class_ApplicationData, name: string): void {
  doc.drawing_area.sankey.nodes_list[0].name = name
}

describe('os#1385 lot 3 — le document dune feuille sedite', () => {

  it('un document de feuille nest pas editable tant quon ne lui en donne pas le droit', () => {
    const { main, other_sheet } = buildTwoSheetWorkspace()
    const sheet_app = main.sheetApplication(other_sheet)!

    // Il naît hors écran : personne ne le regarde, il n'y a rien à autoriser.
    expect(sheet_app.edition_allowed).toBe(false)
    expect(sheet_app.editable).toBe(false)
    // La page, elle, autorise l'édition : ce n'est pas elle qui refuse.
    expect(sheet_app.is_editable).toBe(true)

    // C'est la phase B (le cadre à l'écran) qui donnera ce droit, et le reprendra.
    sheet_app.edition_allowed = true
    expect(sheet_app.editable).toBe(true)

    // Le document principal, lui, est éditable dès sa naissance.
    expect(main.editable).toBe(true)
  })

  it('workspace.document rend le document dune feuille par son identifiant', () => {
    const { ws, main, other_sheet } = buildTwoSheetWorkspace()
    expect(ws.document('sheet:' + other_sheet)).toBeNull()

    const sheet_app = main.sheetApplication(other_sheet)!
    expect(sheet_app.document_id).toBe('sheet:' + other_sheet)
    expect(ws.document('sheet:' + other_sheet)).toBe(sheet_app)
    expect(ws.document('sheet:inconnue')).toBeNull()
  })
})

describe('os#1385 lot 3 — le document vivant est la verite du fichier', () => {

  it('sheetsToJSON serialise le document vivant, pas son instantane perime', () => {
    const { main, other_sheet } = buildTwoSheetWorkspace()
    const sheet_app = main.sheetApplication(other_sheet)!
    sheet_app.edition_allowed = true
    renameFirstNode(sheet_app, NAME_AFTER)

    const file = main.toJSON() as Type_JSON
    const sheets = file['sheets'] as unknown as { entries: { [id: string]: Type_JSON } }
    const entry = JSON.stringify(sheets.entries[other_sheet])
    // L'instantané, lui, date d'avant la modification : le sérialiser aurait jeté le travail.
    expect(entry).toContain(NAME_AFTER)
    expect(entry).not.toContain(NAME_BEFORE)
  })

  it('basculer sur la feuille B retrouve ce quon y a fait, et libere son document', () => {
    const { ws, main, other_sheet } = buildTwoSheetWorkspace()
    const sheet_app = main.sheetApplication(other_sheet)!
    sheet_app.edition_allowed = true
    renameFirstNode(sheet_app, NAME_AFTER)

    main.switchToSheet(other_sheet, false)

    // L'instantané a été réécrit DEPUIS le document vivant avant d'être relu.
    expect(main.current_sheet_id).toBe(other_sheet)
    expect(main.drawing_area.sankey.nodes_list[0].name).toBe(NAME_AFTER)
    // La feuille est redevenue l'état vivant : il n'y a plus de second document à tenir.
    expect(sheet_app.disposed).toBe(true)
    expect(ws.documents).not.toContain(sheet_app)
    expect(ws.document('sheet:' + other_sheet)).toBeNull()
  })

  it('releaseSheetDocument est idempotent et laisse le fichier complet', () => {
    const { ws, main, other_sheet } = buildTwoSheetWorkspace()
    const sheet_app = main.sheetApplication(other_sheet)!
    renameFirstNode(sheet_app, NAME_AFTER)

    main.releaseSheetDocument(other_sheet)
    expect(sheet_app.disposed).toBe(true)
    expect(ws.documents).not.toContain(sheet_app)
    // Rappelé sur une feuille déjà libérée : sans effet, et sans erreur.
    main.releaseSheetDocument(other_sheet)

    // Ce qui avait été fait dans le document est passé dans l'instantané.
    const file = main.toJSON() as Type_JSON
    const sheets = file['sheets'] as unknown as { entries: { [id: string]: Type_JSON } }
    expect(JSON.stringify(sheets.entries[other_sheet])).toContain(NAME_AFTER)
  })

  it('supprimer une feuille dispose son document sans rien reecrire', () => {
    const { ws, main, other_sheet } = buildTwoSheetWorkspace()
    const sheet_app = main.sheetApplication(other_sheet)!

    main.deleteSheet(other_sheet, false)

    expect(sheet_app.disposed).toBe(true)
    expect(ws.documents).not.toContain(sheet_app)
    expect(main.sheets_order).not.toContain(other_sheet)
  })

  it('charger un autre fichier dispose tous les documents de feuille', () => {
    const { ws, main, other_sheet } = buildTwoSheetWorkspace()
    const sheet_app = main.sheetApplication(other_sheet)!
    // Un fichier SANS feuilles : il remplace le document entier (sa#539).
    const other_file = new Class_Workspace(false).createDocument().toJSON() as Type_JSON

    main.fromJSON(deepClone(other_file), {}, false)

    expect(sheet_app.disposed).toBe(true)
    expect(ws.documents).not.toContain(sheet_app)
    expect(main.has_sheets).toBe(false)
  })
})

describe('os#1385 lot 3 — resetFile et resetDocument ne disent plus la meme chose', () => {

  it('la provenance sankeytheque survit a une bascule de feuille', () => {
    const { main, other_sheet } = buildTwoSheetWorkspace()
    main.sankeytheque_origin = { file_path: 'etudes/bois.json', title: 'Bois', source: 'mfadata' }

    main.switchToSheet(other_sheet, false)

    // Elle était effacée par le `reset()` que la bascule traversait, et le stash/restore de
    // `_loadSheetContent` n'avait pas pensé à elle : une étude ouverte depuis la galerie
    // perdait son « réenregistrer en place » au premier clic d'onglet.
    expect(main.sankeytheque_origin).not.toBeNull()
    expect(main.sankeytheque_origin!.file_path).toBe('etudes/bois.json')
  })

  it('charger un autre fichier efface la provenance, comme avant', () => {
    const { main } = buildTwoSheetWorkspace()
    main.sankeytheque_origin = { file_path: 'etudes/bois.json', title: 'Bois', source: 'mfadata' }
    const other_file = new Class_Workspace(false).createDocument().toJSON() as Type_JSON

    main.fromJSON(deepClone(other_file), {}, false)

    expect(main.sankeytheque_origin).toBeNull()
  })

  it('reset only_current_view ne touche ni aux feuilles ni a la provenance', () => {
    const { main, other_sheet } = buildTwoSheetWorkspace()
    main.sankeytheque_origin = { file_path: 'etudes/bois.json', title: 'Bois', source: 'mfadata' }
    const current = main.current_sheet_id

    // Rafraîchissement de la vue courante (réconciliation, « vider la vue ») : le FICHIER
    // n'est pas concerné, donc `resetFile()` est sauté.
    main.reset({ only_current_view: true } as Type_JSON)

    expect(main.sheets_order.length).toBe(2)
    expect(main.sheets_order).toContain(other_sheet)
    expect(main.current_sheet_id).toBe(current)
    expect(main.sankeytheque_origin).not.toBeNull()
  })

  it('reset complet oublie le fichier', () => {
    const { main } = buildTwoSheetWorkspace()
    main.sankeytheque_origin = { file_path: 'etudes/bois.json', title: 'Bois', source: 'mfadata' }

    main.reset({})

    expect(main.has_sheets).toBe(false)
    expect(main.sankeytheque_origin).toBeNull()
  })
})

describe('os#1385 lot 3 — enregistrer depuis une feuille enregistre le fichier', () => {

  it('saveInCache depuis B ecrit la cle du FICHIER, pas celle de B', () => {
    localStorage.clear()
    const { main, other_sheet } = buildTwoSheetWorkspace()
    const sheet_app = main.sheetApplication(other_sheet)!
    expect(sheet_app.file_holder).toBe(main)

    sheet_app.edition_allowed = true
    renameFirstNode(sheet_app, NAME_AFTER)
    // Le porteur est celui qui écrit : c'est SON toast d'attente qu'il faut court-circuiter.
    jest.spyOn(main, 'sendWaitingToast').mockImplementation((f) => { f() })

    sheet_app.saveInCache()

    // Une feuille n'est pas un fichier : enregistrer depuis sa fenêtre écrit le fichier,
    // feuilles comprises — et `sheetsToJSON` y a mis le document VIVANT de B.
    const written = localStorage.getItem('data')
    expect(written).not.toBeNull()
    expect(localStorage.getItem('data:sheet:' + other_sheet)).toBeNull()
  })

  it('saveToJSON depuis B passe au porteur', () => {
    const { main, other_sheet } = buildTwoSheetWorkspace()
    const sheet_app = main.sheetApplication(other_sheet)!
    const holder_save = jest.spyOn(main, 'saveToJSON').mockImplementation(() => undefined)

    sheet_app.saveToJSON({ compression: 'gzip' } as Type_JSON)

    expect(holder_save).toHaveBeenCalledTimes(1)
  })
})
