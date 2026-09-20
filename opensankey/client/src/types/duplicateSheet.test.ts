// os#1443 — DUPLIQUER UNE FEUILLE EST UN GESTE DE MODÈLE.
//
// Le corps vivait dans la barre d onglets. L audit du 19/09 le relevait : un composant y
// choisissait la SOURCE DE VERITE d une feuille, decompressait un instantane et nommait la copie
// — trois decisions de modele, invérifiables sans monter du React, et que la prochaine surface
// qui voudrait dupliquer aurait dû reecrire.
//
// Le comportement ne change pas d une virgule ; ce fichier le fige, ce qui n avait jamais pu
// etre fait. Le point qui compte est le TROISIEME cas : quand une feuille est ouverte dans une
// fenetre et qu on y a travaille, la copie doit porter ce travail et non l instantane d avant,
// parce que depuis le lot 3 c est le document VIVANT qui fait foi.

import { Class_Workspace } from './Workspace'
import type { Class_ApplicationData } from './ApplicationData'
import type { Type_JSON } from './Utils'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

const NAME_BEFORE = 'NOEUD_AVANT_EDITION'
const NAME_AFTER = 'NOEUD_APRES_EDITION'

/**
 * Un document a DEUX feuilles, un noeud nomme dans la PREMIERE — celle qu on n edite plus, donc
 * celle qui est devenue un instantane.
 */
const buildTwoSheetWorkspace = () => {
  const ws = new Class_Workspace(false)
  const main = ws.createDocument()
  main.drawing_area.sankey.addNewNode('n_1', NAME_BEFORE)
  main.createNewSheet(false)
  const other_sheet = main.sheets_order[0]
  return { ws, main, other_sheet }
}

/** Le contenu SERIALISE d une feuille, tel que le fichier le porte. */
const sheetContent = (main: Class_ApplicationData, sheet_id: string): string => {
  const file = main.toJSON() as Type_JSON
  const sheets = file['sheets'] as unknown as { entries: { [id: string]: Type_JSON } }
  return JSON.stringify(sheets.entries[sheet_id])
}

describe('os#1443 dupliquer une feuille', () => {

  it('la feuille COURANTE sinsere juste apres sa source et devient courante', () => {
    // Le chemin d avant, inchange : il delegue a `duplicateCurrentSheetAsNewSheet`.
    const { main } = buildTwoSheetWorkspace()
    const current = main.current_sheet_id
    const before = main.sheets_order.length

    const copy = main.duplicateSheet(current)

    expect(copy).not.toBeNull()
    expect(main.sheets_order.length).toBe(before + 1)
    expect(main.sheets_order[main.sheets_order.indexOf(current) + 1]).toBe(copy)
    expect(main.current_sheet_id).toBe(copy)
  })

  it('la chaine VIDE designe la feuille courante, comme partout ailleurs', () => {
    const { main } = buildTwoSheetWorkspace()
    const current = main.current_sheet_id

    const copy = main.duplicateSheet('')

    expect(copy).not.toBeNull()
    expect(main.sheets_order[main.sheets_order.indexOf(current) + 1]).toBe(copy)
  })

  it('une AUTRE feuille sajoute en FIN de barre et ne fait pas basculer', () => {
    const { main, other_sheet } = buildTwoSheetWorkspace()
    const current = main.current_sheet_id

    const copy = main.duplicateSheet(other_sheet)

    expect(copy).not.toBeNull()
    expect(main.sheets_order[main.sheets_order.length - 1]).toBe(copy)
    // On ne bascule PAS : la feuille courante ne change pas, ni la racine du fichier.
    expect(main.current_sheet_id).toBe(current)
  })

  it('la copie porte le prefixe de nom', () => {
    const { main, other_sheet } = buildTwoSheetWorkspace()
    const source_name = main.sheets_dict[other_sheet].name

    const copy = main.duplicateSheet(other_sheet)!

    // `t()` rend null sous jest (aucun catalogue charge) : c est le repli du modele qu on lit,
    // et c est bien lui qu il fallait sortir du composant — il y etait en double.
    expect(main.sheets_dict[copy].name).toBe('Copie de ' + source_name)
    expect(main.sheets_dict[copy].name).not.toContain('sheets.copy_prefix')
  })

  it('la copie dune feuille JAMAIS OUVERTE vient de son instantane', () => {
    const { main, other_sheet } = buildTwoSheetWorkspace()

    const copy = main.duplicateSheet(other_sheet)!

    expect(sheetContent(main, copy)).toContain(NAME_BEFORE)
  })

  it('la copie dune feuille OUVERTE ET MODIFIEE porte le travail, pas linstantane', () => {
    // LE CAS QUI COMPTE. Depuis le lot 3 (D6), tant qu un document porte une feuille c est LUI
    // la verite : l instantane date de son ouverture. Copier l instantane perdrait en silence
    // tout ce qui a ete fait dans la fenetre.
    const { main, other_sheet } = buildTwoSheetWorkspace()
    const sheet_app = main.sheetApplication(other_sheet)!
    expect(sheet_app).not.toBe(main)
    sheet_app.drawing_area.sankey.nodes_list[0].name = NAME_AFTER

    const copy = main.duplicateSheet(other_sheet)!

    const content = sheetContent(main, copy)
    expect(content).toContain(NAME_AFTER)
    expect(content).not.toContain(NAME_BEFORE)
  })

  it('une feuille inconnue ne duplique rien', () => {
    const { main } = buildTwoSheetWorkspace()
    const before = main.sheets_order.length

    expect(main.duplicateSheet('feuille_qui_nexiste_pas')).toBeNull()
    expect(main.sheets_order.length).toBe(before)
  })

  it('un document MONO-FEUILLE na pas didentite de feuille a dupliquer', () => {
    // Le document historique : pas d entree de feuille, donc rien a nommer ni a copier. La
    // barre d onglets l ecartait deja ; le modele le dit desormais lui-meme.
    const ws = new Class_Workspace(false)
    const main = ws.createDocument()
    expect(main.has_sheets).toBe(false)

    expect(main.duplicateSheet('quoi_que_ce_soit')).toBeNull()
  })
})
