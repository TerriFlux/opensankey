// os#1385 lot 3, dernier geste — LA GRANDE ZONE MONTE DANS L'ESPACE DE TRAVAIL.
//
// Il n'y a qu'UNE grande zone à l'écran, quel que soit le nombre de documents ouverts : la
// disposition, la fenêtre active et la sélection de vignettes décrivent cet écran, pas un fichier.
// Elles rejoignent donc les panneaux du lot 1 sur l'HÔTE. Les FIGURES, elles, restent au document :
// ce sont des objets du fichier, et deux documents ne partagent ni leurs `f_N` ni leurs styles.
//
// Ce que ce fichier verrouille, c'est la frontière entre les deux — et la garde de persistance qui
// l'accompagne, sans quoi ouvrir la feuille B dans une fenêtre réécrirait la grande zone de
// l'utilisateur avec celle enregistrée dans l'entrée de B.

import { Class_Workspace } from './Workspace'
import { MAIN_ZONE_CANVAS_ID, MAIN_ZONE_SPREADSHEET_ID } from './MenuConfig'
import type { Type_JSON } from './Utils'

const deepClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T

describe('os#1385 — la disposition est de lespace de travail', () => {

  it('une fenetre ouverte par le principal est vue par le document secondaire', () => {
    const ws = new Class_Workspace(false)
    const main = ws.createDocument()
    const doc_b = ws.createDocument({ offscreen: true })

    const w = main.menu_configuration.openMainZoneWindow({ kind: 'node', id: 'n1' }, 'osp.repr.unit')
    expect(doc_b.menu_configuration.main_zone_occupants.map(o => o.id)).toContain(w)
    expect(doc_b.menu_configuration.isMainZoneOccupant(w)).toBe(true)
    // Et la configuration de l'hôte dit la même chose : c'est elle qui porte le stockage.
    expect(ws.menu_configuration.isMainZoneOccupant(w)).toBe(true)
  })

  it('fermer une fenetre par le document secondaire la ferme pour tout le monde', () => {
    const ws = new Class_Workspace(false)
    const main = ws.createDocument()
    const doc_b = ws.createDocument({ offscreen: true })

    const w = main.menu_configuration.openMainZoneWindow({ kind: 'node', id: 'n1' }, 'osp.repr.unit')
    expect(doc_b.menu_configuration.hideMainZoneOccupant(w)).toBe(true)
    expect(main.menu_configuration.isMainZoneOccupant(w)).toBe(false)
  })

  it('les places, les poids et les ratios sont partages', () => {
    const ws = new Class_Workspace(false)
    const main = ws.createDocument()
    const doc_b = ws.createDocument({ offscreen: true })

    main.menu_configuration.showMainZoneOccupant(MAIN_ZONE_SPREADSHEET_ID, 'bottom')
    expect(doc_b.menu_configuration.mainZonePlaceOf(MAIN_ZONE_SPREADSHEET_ID)).toBe('bottom')

    doc_b.menu_configuration.main_zone_split_ratio = 0.42
    doc_b.menu_configuration.main_zone_bottom_px = 123
    expect(main.menu_configuration.main_zone_split_ratio).toBe(0.42)
    expect(main.menu_configuration.main_zone_bottom_px).toBe(123)

    doc_b.menu_configuration.setMainZoneDetached(MAIN_ZONE_SPREADSHEET_ID, true)
    expect(main.menu_configuration.isMainZoneDetached(MAIN_ZONE_SPREADSHEET_ID)).toBe(true)
  })

  it('le document externe affiche a la place de la doc est de lespace de travail', () => {
    const ws = new Class_Workspace(false)
    const main = ws.createDocument()
    const doc_b = ws.createDocument({ offscreen: true })
    main.menu_configuration.doc_external = { title: 'README', markdown: '# Etude' }
    expect(doc_b.menu_configuration.doc_external?.title).toBe('README')
  })
})

describe('os#1385 — la fenetre active et la selection de vignettes sont de lespace de travail', () => {

  it('la fenetre active posee par lun est lue par lautre', () => {
    const ws = new Class_Workspace(false)
    const main = ws.createDocument()
    const doc_b = ws.createDocument({ offscreen: true })

    // Sans rien toucher : la fenêtre principale, pour les deux.
    expect(doc_b.menu_configuration.main_zone_active_id).toBe(MAIN_ZONE_CANVAS_ID)

    const w = main.menu_configuration.openMainZoneWindow({ kind: 'node', id: 'n1' }, 'osp.repr.unit')
    expect(doc_b.menu_configuration.main_zone_active_id).toBe(w)

    doc_b.menu_configuration.activateMainZoneCanvas()
    expect(main.menu_configuration.main_zone_active_id).toBe(MAIN_ZONE_CANVAS_ID)
  })

  it('la selection de vignettes et le focus de linspecteur suivent le meme chemin', () => {
    const ws = new Class_Workspace(false)
    const main = ws.createDocument()
    const doc_b = ws.createDocument({ offscreen: true })

    const w = main.menu_configuration.openMainZoneWindow(
      { kind: 'elements', ids: ['n1', 'n2'] }, 'osp.repr.unit'
    )
    main.menu_configuration.setMainZoneActivePane(w, 'n1')
    main.menu_configuration.setMainZoneActivePane(w, 'n2', true)

    expect(doc_b.menu_configuration.main_zone_active_pane_key).toBe('n2')
    expect(doc_b.menu_configuration.main_zone_selected_pane_keys).toEqual(['n1', 'n2'])
    expect(doc_b.menu_configuration.isMainZonePaneSelected(w, 'n1')).toBe(true)
    expect(doc_b.menu_configuration.inspector_focus_is_representation).toBe(true)

    // Et le geste inverse par le secondaire se voit du principal.
    doc_b.menu_configuration.selectAllMainZonePanes(w, ['n1'])
    expect(main.menu_configuration.main_zone_selected_pane_keys).toEqual(['n1'])
  })
})

describe('os#1385 — les figures restent au DOCUMENT', () => {

  it('la figure dune vignette nest pas la meme dun document a lautre', () => {
    const ws = new Class_Workspace(false)
    const main = ws.createDocument()
    const doc_b = ws.createDocument({ offscreen: true })

    const w = main.menu_configuration.openMainZoneWindow({ kind: 'node', id: 'n1' }, 'osp.repr.unit')
    // Même fenêtre (elle est de l'hôte), deux figures (elles sont du document).
    const fig_main = main.menu_configuration.figureOf(w, 'n1')
    const fig_b = doc_b.menu_configuration.figureOf(w, 'n1')
    expect(fig_b).not.toBe(fig_main)
  })

  it('le registre des figures ne traverse pas les documents', () => {
    const ws = new Class_Workspace(false)
    const main = ws.createDocument()
    const doc_b = ws.createDocument({ offscreen: true })

    const w = main.menu_configuration.openMainZoneWindow({ kind: 'node', id: 'n1' }, 'osp.repr.unit')
    const figure_id = main.menu_configuration.figureIdOf(w, 'n1')
    expect(main.menu_configuration.figureById(figure_id)).toBeDefined()
    // Un `f_N` nomme une figure DANS son document : celui de B ne le connaît pas.
    expect(doc_b.menu_configuration.figureById(figure_id)).toBeUndefined()
  })
})

describe('os#1385 — persistance : seul le principal ecrit et relit la grande zone', () => {

  it('le fichier du principal porte la disposition, celui dun secondaire non', () => {
    const ws = new Class_Workspace(false)
    const main = ws.createDocument()
    const doc_b = ws.createDocument({ offscreen: true })
    main.menu_configuration.showMainZoneOccupant(MAIN_ZONE_SPREADSHEET_ID, 'bottom')

    const file = main.toJSON() as Type_JSON
    expect('main_zone' in file).toBe(true)
    const occupants = (file['main_zone'] as Type_JSON)['occupants'] as Type_JSON
    expect(Object.keys(occupants)).toContain(MAIN_ZONE_SPREADSHEET_ID)

    // La feuille B n'écrit pas la disposition de l'écran dans son entrée : elle n'est pas à elle.
    expect('main_zone' in (doc_b.toJSON() as Type_JSON)).toBe(false)
  })

  it('charger un document secondaire ne rejoue pas la disposition de son fichier', () => {
    const ws = new Class_Workspace(false)
    const main = ws.createDocument()
    const doc_b = ws.createDocument({ offscreen: true })

    // Un fichier enregistré avec le tableur en bas.
    main.menu_configuration.showMainZoneOccupant(MAIN_ZONE_SPREADSHEET_ID, 'bottom')
    const file = main.toJSON() as Type_JSON

    // L'utilisateur a refermé le tableur depuis.
    main.menu_configuration.hideMainZoneOccupant(MAIN_ZONE_SPREADSHEET_ID)
    expect(main.menu_configuration.isMainZoneOccupant(MAIN_ZONE_SPREADSHEET_ID)).toBe(false)

    // Ouvrir la feuille B dans une fenêtre ne doit pas la rouvrir.
    doc_b.fromJSON(deepClone(file), {}, false)
    expect(main.menu_configuration.isMainZoneOccupant(MAIN_ZONE_SPREADSHEET_ID)).toBe(false)

    // Le document principal, lui, restaure la disposition comme avant.
    main.fromJSON(deepClone(file), {}, false)
    expect(main.menu_configuration.isMainZoneOccupant(MAIN_ZONE_SPREADSHEET_ID)).toBe(true)
  })

  it('un document de feuille vivante ne reecrit pas la grande zone de lecran', () => {
    const ws = new Class_Workspace(false)
    const doc = ws.createDocument()
    // Une seconde feuille : la première devient un instantané, donc chargeable à part.
    doc.createNewSheet(false)
    const first_sheet = doc.sheets_order[0]

    doc.menu_configuration.showMainZoneOccupant(MAIN_ZONE_SPREADSHEET_ID, 'bottom')
    const before = doc.menu_configuration.main_zone_occupants.map(o => o.id)

    const sheet_app = doc.sheetApplication(first_sheet)
    expect(sheet_app).not.toBeNull()
    // Le document de feuille a lu SON instantané : la grande zone de l'écran n'a pas bougé.
    expect(doc.menu_configuration.main_zone_occupants.map(o => o.id)).toEqual(before)
    // Et il voit la même grande zone que le principal — il n'en a pas une à lui.
    expect(sheet_app!.menu_configuration.main_zone_occupants.map(o => o.id)).toEqual(before)
  })
})
