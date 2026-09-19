// os#1442 — « MODIFIÉ », PAR DOCUMENT.
//
// Le témoin de la barre du haut ne parle que du document ACTIF. Avec plusieurs feuilles vivantes,
// il fallait aller sur chacune pour savoir laquelle porte du travail non enregistre : l audit
// (D7) notait la finition et personne ne l avait reprise.
//
// Ce qui manquait n etait PAS le champ — il existe depuis toujours dans la configuration de
// menus, et une quarantaine de gestes d interface l ecrivent. C etait que le slot qui le porte
// avait pour defaut `() => null`. Un document sans barre du haut a lui — c est-a-dire TOUT
// document de feuille — se faisait annoncer « modifie » quarante fois et n en gardait rien.
//
// Ce fichier fige les trois proprietes dont la pastille des onglets depend : le defaut
// ENREGISTRE, le changement s ANNONCE sur le bus de l hote, et lire l etat d une feuille ne la
// CHARGE pas.

import { Class_Workspace } from './Workspace'
import { SAVE_STATE_TOPIC } from './EventBus'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

/** Un espace de travail, un document principal a deux feuilles. */
const buildTwoSheetWorkspace = () => {
  const ws = new Class_Workspace(false)
  const main = ws.createDocument()
  main.createNewSheet(false)
  const other_sheet = main.sheets_order[0]
  return { ws, main, other_sheet }
}

/** Ce que font les quarante sites d interface : « ce document est modifie ». */
const markModified = (doc: { menu_configuration: { ref_to_save_in_cache_indicator: { current: (b: boolean) => void } } }) =>
  doc.menu_configuration.ref_to_save_in_cache_indicator.current(false)

const markSaved = (doc: { menu_configuration: { ref_to_save_in_cache_indicator: { current: (b: boolean) => void } } }) =>
  doc.menu_configuration.ref_to_save_in_cache_indicator.current(true)

describe('os#1442 letat enregistre appartient au document', () => {

  it('un document NEUF se dit enregistre', () => {
    const ws = new Class_Workspace(false)
    const main = ws.createDocument()
    expect(main.has_unsaved_changes).toBe(false)
  })

  it('un document SANS barre du haut retient quand meme quon la modifie', () => {
    // LE DEFAUT DU SLOT, et tout le lot tient a lui. C est le cas de tout document de feuille :
    // aucun composant a lui, donc personne pour installer un gestionnaire.
    const ws = new Class_Workspace(false)
    const doc = ws.createDocument({ offscreen: true })
    expect(doc.has_unsaved_changes).toBe(false)

    markModified(doc)

    expect(doc.has_unsaved_changes).toBe(true)
    markSaved(doc)
    expect(doc.has_unsaved_changes).toBe(false)
  })

  it('deux documents ouverts ont deux etats, et ne se les empruntent pas', () => {
    const ws = new Class_Workspace(false)
    const a = ws.createDocument()
    const b = ws.createDocument({ offscreen: true })

    markModified(b)

    expect(b.has_unsaved_changes).toBe(true)
    expect(a.has_unsaved_changes).toBe(false)
  })
})

describe('os#1442 le changement sannonce sur le bus de lhote', () => {

  it('un document de FEUILLE reveille un abonne de lhote', () => {
    // Topic d HOTE, et c est le point : l abonne — la barre d onglets — est unique et montee une
    // fois ; elle doit s eveiller pour un document qui n existait pas quand elle s est abonnee.
    const { ws, main, other_sheet } = buildTwoSheetWorkspace()
    let heard = 0
    ws.menu_configuration.subscribe(SAVE_STATE_TOPIC, () => { heard++ })
    const sheet_app = main.sheetApplication(other_sheet)!
    expect(sheet_app).not.toBe(main)

    markModified(sheet_app)

    expect(heard).toBe(1)
    expect(sheet_app.has_unsaved_changes).toBe(true)
    // Le document principal, lui, n a pas bouge.
    expect(main.has_unsaved_changes).toBe(false)
  })

  it('reposer la MEME valeur nannonce rien', () => {
    // Les quarante sites annoncent « modifie » a chaque frappe. Sans ce garde-fou, la barre
    // d onglets se re-rendrait a chaque caractere tape dans un champ de nom.
    const ws = new Class_Workspace(false)
    const doc = ws.createDocument({ offscreen: true })
    let heard = 0
    ws.menu_configuration.subscribe(SAVE_STATE_TOPIC, () => { heard++ })

    markModified(doc)
    expect(heard).toBe(1)
    markModified(doc)
    markModified(doc)
    expect(heard).toBe(1)

    markSaved(doc)
    expect(heard).toBe(2)
  })
})

describe('os#1442 lire letat dune feuille ne la charge pas', () => {

  it('liveSheetDocument rend null tant que la feuille na pas ete ouverte', () => {
    // `sheetApplication` CHARGERAIT l instantane. La barre d onglets passe sur toutes les
    // feuilles a chaque rendu : l y appeler deserialiserait le fichier entier pour peindre des
    // points. Et « pas de document vivant » est une REPONSE : le contenu de la feuille est son
    // instantane, il n a pas pu bouger.
    const { main, other_sheet } = buildTwoSheetWorkspace()
    const load = jest.spyOn(main, 'sheetApplication')

    expect(main.liveSheetDocument(other_sheet)).toBeNull()
    expect(load).not.toHaveBeenCalled()
  })

  it('une fois la feuille ouverte, cest SON document quon lit', () => {
    const { main, other_sheet } = buildTwoSheetWorkspace()
    const sheet_app = main.sheetApplication(other_sheet)!

    expect(main.liveSheetDocument(other_sheet)).toBe(sheet_app)
    markModified(sheet_app)
    expect(main.liveSheetDocument(other_sheet)!.has_unsaved_changes).toBe(true)
  })

  it('la feuille COURANTE est portee par le document principal', () => {
    const { main } = buildTwoSheetWorkspace()
    expect(main.liveSheetDocument(main.current_sheet_id)).toBe(main)
    // Convention de la grande zone : la chaine vide designe la feuille courante.
    expect(main.liveSheetDocument('')).toBe(main)
  })

  it('une feuille LIBEREE redevient un instantane, et ne se lit plus comme un document', () => {
    const { main, other_sheet } = buildTwoSheetWorkspace()
    const sheet_app = main.sheetApplication(other_sheet)!
    markModified(sheet_app)
    expect(main.liveSheetDocument(other_sheet)).toBe(sheet_app)

    main.releaseSheetDocument(other_sheet)

    expect(main.liveSheetDocument(other_sheet)).toBeNull()
  })
})
