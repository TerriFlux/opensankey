// os#1385 lot 2 — LE DOCUMENT ACTIF, et ce qui s'y adresse.
//
// Le critère d'écran du plan (« cliquer un nœud de B rend B actif, Ctrl+Z annule dans B ») ne
// sera vérifiable qu'au lot 3, quand un second document deviendra éditable. Ce fichier verrouille
// le MÉCANISME que le lot 2 livre, et dont tout le reste dépend : qui est l'actif, quand on
// l'annonce, à qui la frappe est adressée, d'où vient le presse-papiers, où va le cache, et qui
// a le droit d'écrire dans la barre d'adresse.

import { Class_Workspace } from './Workspace'
import { Class_ApplicationData } from './ApplicationData'
import { ACTIVE_DOCUMENT_TOPIC, HISTORY_TOPIC } from './EventBus'
import { MAIN_ZONE_CANVAS_ID } from './MenuConfig'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

/**
 * Un espace de travail de BASE, un document principal à DEUX feuilles, et une fenêtre canevas
 * ouverte sur la feuille qu'on n'édite pas — la scène du lot 0, en modèle pur.
 *
 * `createNewSheet(false)` : sans dessin. La feuille d'avant devient un instantané, donc
 * chargeable à part par `sheetApplication`.
 */
function buildTwoSheetWorkspace() {
  const ws = new Class_Workspace(false)
  const main = ws.createDocument()
  main.createNewSheet(false)
  const other_sheet = main.sheets_order[0]
  const mc = main.menu_configuration
  return { ws, main, mc, other_sheet }
}

/** Une frappe telle que jsdom la fabrique (le modèle ne lit que `key` et les modificateurs). */
const keystroke = (key: string, ctrl = true) =>
  new KeyboardEvent('keydown', { key, ctrlKey: ctrl, bubbles: true })

describe('os#1385 lot 2 — qui est le document actif', () => {

  it('lactif est le document principal par defaut', () => {
    const ws = new Class_Workspace(false)
    expect(ws.active).toBeNull()
    const main = ws.createDocument()
    expect(ws.active).toBe(main)
  })

  it('une fenetre canevas sur une autre feuille rend lapplication de cette feuille', () => {
    const { ws, main, mc, other_sheet } = buildTwoSheetWorkspace()
    expect(ws.active).toBe(main)

    const window_id = mc.openMainZoneWindow({ kind: 'diagram', sheet: other_sheet }, MAIN_ZONE_CANVAS_ID)
    mc.main_zone_active_id = window_id

    const sheet_app = main.sheetApplication(other_sheet)
    expect(sheet_app).not.toBeNull()
    expect(sheet_app).not.toBe(main)
    expect(ws.active).toBe(sheet_app)
  })

  it('refermer la fenetre rend lactif au document principal', () => {
    const { ws, main, mc, other_sheet } = buildTwoSheetWorkspace()
    const window_id = mc.openMainZoneWindow({ kind: 'diagram', sheet: other_sheet }, MAIN_ZONE_CANVAS_ID)
    mc.main_zone_active_id = window_id
    expect(ws.active).not.toBe(main)

    mc.hideMainZoneOccupant(window_id)
    expect(ws.active).toBe(main)
  })

  it('ACTIVE_DOCUMENT_TOPIC est notifie une fois par bascule, et pas autrement', () => {
    const { ws, mc, other_sheet } = buildTwoSheetWorkspace()
    let heard = 0
    // Abonnement par la configuration de l'HOTE : le topic est d'espace de travail.
    ws.menu_configuration.subscribe(ACTIVE_DOCUMENT_TOPIC, () => { heard++ })

    const window_id = mc.openMainZoneWindow({ kind: 'diagram', sheet: other_sheet }, MAIN_ZONE_CANVAS_ID)
    mc.main_zone_active_id = window_id
    expect(heard).toBe(1)

    // Un signal de grande zone qui ne change pas l'actif ne doit rien annoncer.
    mc.notifyMainZone()
    expect(heard).toBe(1)

    mc.hideMainZoneOccupant(window_id)
    expect(heard).toBe(2)
  })
})

describe('os#1422 lot 6 — une fenetre declare le document quelle montre', () => {

  /**
   * La scene du lot 6 : une fenetre ouverte, et un document qui n'est PAS une feuille — le
   * document d'une vignette d'etoile, qui ne s'enregistre jamais et que la voie des feuilles ne
   * peut donc pas trouver. Ici un simple document hors ecran : l'annuaire ne sait rien de plus.
   */
  function buildBoundWindow() {
    const { ws, main, mc, other_sheet } = buildTwoSheetWorkspace()
    const window_id = mc.openMainZoneWindow({ kind: 'diagram', sheet: other_sheet }, MAIN_ZONE_CANVAS_ID)
    mc.main_zone_active_id = window_id
    const sheet_app = main.sheetApplication(other_sheet)!
    return { ws, main, mc, sheet_app, window_id }
  }

  it('une fenetre liee rend SON document actif, avant la voie des feuilles', () => {
    const { ws, sheet_app, window_id } = buildBoundWindow()
    expect(ws.active).toBe(sheet_app)

    const star = ws.createDocument({ offscreen: true })
    ws.bindWindowDocument(window_id, 'pane_1', star)
    expect(ws.active).toBe(star)
  })

  it('deliee, la fenetre retombe sur la voie des feuilles', () => {
    const { ws, sheet_app, window_id } = buildBoundWindow()
    const star = ws.createDocument({ offscreen: true })
    ws.bindWindowDocument(window_id, 'pane_1', star)
    expect(ws.active).toBe(star)

    ws.unbindWindowDocument(window_id, 'pane_1')
    expect(ws.active).toBe(sheet_app)
  })

  it('une entree qui pointe sur un document dispose est ignoree', () => {
    const { ws, sheet_app, window_id } = buildBoundWindow()
    const star = ws.createDocument({ offscreen: true })
    ws.bindWindowDocument(window_id, 'pane_1', star)

    // Une vignette en cours de demontage garde sa reference le temps que l'effet se denoue :
    // rendre actif un document mort ferait lire une zone de dessin qui n'existe plus.
    star.dispose()
    expect(ws.active).toBe(sheet_app)
  })

  it('cest la vignette ACTIVE de la fenetre qui designe le document', () => {
    const { ws, sheet_app, mc, window_id } = buildBoundWindow()
    const star_a = ws.createDocument({ offscreen: true })
    const star_b = ws.createDocument({ offscreen: true })
    ws.bindWindowDocument(window_id, 'pane_a', star_a)
    ws.bindWindowDocument(window_id, 'pane_b', star_b)

    // Deux vignettes, aucune touchee : la fenetre ne designe rien, et la voie des feuilles
    // reprend la main plutot que de choisir a la place de l'utilisateur.
    expect(ws.active).toBe(sheet_app)

    mc.setMainZoneActivePane(window_id, 'pane_b')
    expect(ws.active).toBe(star_b)
    mc.setMainZoneActivePane(window_id, 'pane_a')
    expect(ws.active).toBe(star_a)
  })

  it('une fenetre qui na quune vignette na pas besoin quon la touche', () => {
    const { ws, mc, window_id } = buildBoundWindow()
    const star = ws.createDocument({ offscreen: true })
    ws.bindWindowDocument(window_id, 'pane_1', star)
    // Convention de la grande zone : `null` = la premiere vignette de la fenetre.
    expect(mc.main_zone_active_pane_key).toBeNull()
    expect(ws.active).toBe(star)
  })

  it('lannuaire dune AUTRE fenetre ne change rien', () => {
    const { ws, sheet_app, window_id } = buildBoundWindow()
    const star = ws.createDocument({ offscreen: true })
    ws.bindWindowDocument(window_id + '_voisine', 'pane_1', star)
    expect(ws.active).toBe(sheet_app)
  })

  it('lier et delier annoncent la bascule, reposer le meme document nannonce rien', () => {
    const { ws, window_id } = buildBoundWindow()
    const star = ws.createDocument({ offscreen: true })
    let heard = 0
    ws.menu_configuration.subscribe(ACTIVE_DOCUMENT_TOPIC, () => { heard++ })

    ws.bindWindowDocument(window_id, 'pane_1', star)
    expect(heard).toBe(1)
    ws.bindWindowDocument(window_id, 'pane_1', star)
    expect(heard).toBe(1)
    ws.unbindWindowDocument(window_id, 'pane_1')
    expect(heard).toBe(2)
  })
})

describe('os#1385 lot 2 — le clavier est de lespace de travail', () => {

  it('Ctrl+Z frappe lhistorique de lACTIF, pas celui du principal', () => {
    const { ws, main, mc, other_sheet } = buildTwoSheetWorkspace()
    const sheet_app = main.sheetApplication(other_sheet)!

    const undo_main = jest.spyOn(main.history, 'applyUndo')
    const undo_sheet = jest.spyOn(sheet_app.history, 'applyUndo')

    ws.dispatchKeyboardEvent(keystroke('z'))
    expect(undo_main).toHaveBeenCalledTimes(1)
    expect(undo_sheet).not.toHaveBeenCalled()

    const window_id = mc.openMainZoneWindow({ kind: 'diagram', sheet: other_sheet }, MAIN_ZONE_CANVAS_ID)
    mc.main_zone_active_id = window_id

    ws.dispatchKeyboardEvent(keystroke('z'))
    expect(undo_sheet).toHaveBeenCalledTimes(1)
    // Le document principal n'entend plus rien : c'est tout l'objet du lot.
    expect(undo_main).toHaveBeenCalledTimes(1)
  })

  it('installKeyboardListener pose lecouteur de la page et sait le retirer', () => {
    const ws = new Class_Workspace(false)
    const main = ws.createDocument()
    const undo = jest.spyOn(main.history, 'applyUndo')

    const uninstall = ws.installKeyboardListener()
    expect(typeof document.onkeydown).toBe('function')
    const installed = document.onkeydown as unknown as (evt: KeyboardEvent) => void
    installed(keystroke('z'))
    expect(undo).toHaveBeenCalledTimes(1)

    uninstall()
    expect(document.onkeydown).toBeNull()
  })
})

describe('os#1385 lot 2 — lhistorique annonce ses mouvements', () => {

  it('saveUndo notifie HISTORY_TOPIC sur le bus du document', () => {
    const ws = new Class_Workspace(false)
    const doc_a = ws.createDocument()
    const doc_b = ws.createDocument()

    let heard_a = 0
    let heard_b = 0
    doc_a.menu_configuration.subscribe(HISTORY_TOPIC, () => { heard_a++ })
    doc_b.menu_configuration.subscribe(HISTORY_TOPIC, () => { heard_b++ })

    doc_a.history.saveUndo(() => { /* rien a defaire */ })
    expect(heard_a).toBe(1)
    // Topic de DOCUMENT : la pile de A ne regarde pas B.
    expect(heard_b).toBe(0)
  })
})

describe('os#1385 lot 2 — le presse-papiers est de lespace de travail', () => {

  /** Deux nœuds sélectionnés dans le document principal, prêts à être copiés. */
  const selectTwoNodes = (doc: Class_ApplicationData) => {
    const sankey = doc.drawing_area.sankey
    const a = sankey.addNewNode('a', 'A')
    const b = sankey.addNewNode('b', 'B')
    doc.drawing_area.addElementToSelection(a)
    doc.drawing_area.addElementToSelection(b)
  }

  it('Ctrl+C puis Ctrl+V dans le meme document colle', () => {
    const ws = new Class_Workspace(false)
    const main = ws.createDocument()
    selectTwoNodes(main)
    const copyNodes = jest.spyOn(main.drawing_area, 'copyNodes').mockImplementation(() => undefined)
    jest.spyOn(main, 'saveInCache').mockImplementation(() => undefined)

    main.handleKeyboardEvent(keystroke('c'))
    expect(ws.clipboard).not.toBeNull()
    expect(ws.clipboard!.source).toBe(main)
    expect(ws.clipboard!.node_ids.slice().sort()).toEqual(['a', 'b'])
    const copied = ws.clipboard!.node_ids

    main.handleKeyboardEvent(keystroke('v'))
    expect(copyNodes).toHaveBeenCalledWith(copied)
  })

  // os#1440 — CE TEST DISAIT L INVERSE, ET IL AVAIT RAISON A L EPOQUE.
  //
  // Il verrouillait le refus du lot 2 : « les identifiants de A ne designent rien dans B, coller
  // entre documents demande une serialisation, c est le lot 3 ». Le lot 3 est passe, la
  // serialisation s est revelee inutile — on LIT dans le document d origine au lieu de relire ses
  // identifiants dans celui d arrivee — et le geste marche. Le detail de ce qui voyage et de ce
  // qui reste est dans clipboardCrossDocument.test.ts ; ici on ne garde que l aiguillage.
  it('Ctrl+V dans un AUTRE document colle depuis celui dou lon vient', () => {
    const { ws, main, other_sheet } = buildTwoSheetWorkspace()
    selectTwoNodes(main)
    jest.spyOn(main, 'saveInCache').mockImplementation(() => undefined)
    main.handleKeyboardEvent(keystroke('c'))

    const sheet_app = main.sheetApplication(other_sheet)!
    sheet_app.edition_allowed = true
    jest.spyOn(sheet_app, 'saveInCache').mockImplementation(() => undefined)
    const copyNodes = jest.spyOn(sheet_app.drawing_area, 'copyNodes').mockImplementation(() => undefined)
    const copyNodesFrom = jest.spyOn(sheet_app.drawing_area, 'copyNodesFrom').mockImplementation(() => undefined)
    const notify = jest.spyOn(ws, 'notifyUser').mockImplementation(() => undefined)

    sheet_app.handleKeyboardEvent(keystroke('v'))

    // La voie d un AUTRE document, avec la zone de dessin de la SOURCE en premier argument :
    // c est tout ce qui separe ce geste de la duplication chez soi.
    expect(copyNodesFrom).toHaveBeenCalledWith(main.drawing_area, ws.clipboard!.node_ids)
    expect(copyNodes).not.toHaveBeenCalled()
    // Et plus de message : il n y a plus rien a excuser.
    expect(notify).not.toHaveBeenCalled()
  })
})

describe('os#1385 lot 2 — un emplacement de cache par document', () => {

  it('un document secondaire necrase pas la cle data du principal', () => {
    localStorage.clear()
    const { ws, main, other_sheet } = buildTwoSheetWorkspace()
    // L'identite d'un document de feuille est celle de la FEUILLE : son emplacement de cache
    // est stable d'un chargement d'instantane au suivant.
    expect(main.sheetApplication(other_sheet)!.document_id).toBe('sheet:' + other_sheet)
    // Le principal garde la cle historique, celle que lit la reprise de session.
    localStorage.setItem('data', 'TRAVAIL_EN_COURS')

    // os#1385 (lot 3) — un document de FEUILLE enregistre desormais le FICHIER dont il fait
    // partie (cf. `file_holder`, et WorkspaceSheets.test.ts). Ce qui exerce l'emplacement PAR
    // DOCUMENT est donc le document sans porteur : source Excel unitaire, brique extraite.
    const standalone = ws.createDocument({ offscreen: true })
    jest.spyOn(standalone, 'sendWaitingToast').mockImplementation((f) => { f() })
    standalone.saveInCache()

    expect(localStorage.getItem('data')).toBe('TRAVAIL_EN_COURS')
    expect(localStorage.getItem('data:' + standalone.document_id)).not.toBeNull()
  })

  it('reinitialization retire aussi les emplacements des autres documents', () => {
    localStorage.clear()
    const ws = new Class_Workspace(false)
    const main = ws.createDocument()
    localStorage.setItem('data', 'X')
    localStorage.setItem('data:sheet:s_1', 'Y')
    localStorage.setItem('autre_cle', 'Z')

    main.reinitialization(false)

    expect(localStorage.getItem('data')).toBeNull()
    expect(localStorage.getItem('data:sheet:s_1')).toBeNull()
    // Ce qui n'est pas un document reste : « tout effacer » vise les diagrammes.
    expect(localStorage.getItem('autre_cle')).toBe('Z')
  })
})

describe('os#1385 lot 2 — une seule barre dadresse, ecrite par le seul actif', () => {

  it('un document non actif nappelle pas replaceState', () => {
    const { ws, main, other_sheet } = buildTwoSheetWorkspace()
    const sheet_app = main.sheetApplication(other_sheet)!
    ws.enableUrlStateSync()
    const replaceState = jest.spyOn(window.history, 'replaceState').mockImplementation(() => undefined)

    // L'actif est le principal : lui seul decrit l'ecran.
    sheet_app.syncUrlState()
    expect(replaceState).not.toHaveBeenCalled()

    main.syncUrlState()
    expect(replaceState).toHaveBeenCalled()
  })

  it('larmement de la synchronisation est celui de lespace de travail', () => {
    const ws = new Class_Workspace(false)
    const main = ws.createDocument()
    expect(ws.url_sync_enabled).toBe(false)
    main.enableUrlStateSync()
    expect(ws.url_sync_enabled).toBe(true)
  })

  // os#1428 — TANT QUE RIEN N ARME, L ADRESSE NE RECOIT RIEN, MEME DE L ACTIF.
  //
  // C est la propriete sur laquelle repose la garde posee dans App.tsx : l editeur n arme plus
  // la synchronisation quand l adresse ne nomme pas le document (ni page publiee, ni ?url=).
  // Cette garde ne vaut que si le desarmement est un silence COMPLET et non un simple defaut
  // initial que le premier dessin leverait. Le test d a cote montre le cas arme ; celui-ci
  // montre l autre moitie, qui n etait pas couverte.
  it('sans armement ladresse ne recoit rien, meme du document actif', () => {
    const ws = new Class_Workspace(false)
    const main = ws.createDocument()
    expect(ws.active).toBe(main)
    const replaceState = jest.spyOn(window.history, 'replaceState').mockImplementation(() => undefined)

    main.syncUrlState()
    expect(replaceState).not.toHaveBeenCalled()

    // Et le dessin ne change rien a ce silence : c est bien l armement qui commande, pas l etat.
    main.drawing_area.sankey.addNewNode('n_a', 'Chene')
    main.syncUrlState()
    expect(replaceState).not.toHaveBeenCalled()

    ws.enableUrlStateSync()
    main.syncUrlState()
    expect(replaceState).toHaveBeenCalled()
  })

  it('la feuille ouverte voyage dans ladresse, sauf quand cest la premiere', () => {
    const { main } = buildTwoSheetWorkspace()
    // La feuille courante est la SECONDE (createNewSheet bascule dessus).
    expect(main.current_sheet_id).not.toBe(main.sheets_order[0])
    expect(main.getUrlStateParams().get('sheet')).toBe(main.current_sheet_id)

    main.switchToSheet(main.sheets_order[0], false)
    expect(main.getUrlStateParams().get('sheet')).toBeNull()
  })

  it('applyUrlStateParams ouvre la feuille demandee AVANT la vue', () => {
    const { main } = buildTwoSheetWorkspace()
    const first_sheet = main.sheets_order[0]
    // La bascule elle-meme est testee ailleurs (sheets.roundtrip) : ce qui compte ici est
    // qu'elle soit DEMANDEE, avec le dessin, depuis les parametres d'adresse.
    const switchTo = jest.spyOn(main, 'switchToSheet').mockImplementation(() => undefined)

    main.applyUrlStateParams(new URLSearchParams('sheet=' + first_sheet))
    expect(switchTo).toHaveBeenCalledWith(first_sheet, true)
  })

  it('une feuille inconnue est refusee en silence', () => {
    const { main } = buildTwoSheetWorkspace()
    const before = main.current_sheet_id
    // Une adresse ecrite pour un autre fichier ouvre le fichier tel quel : elle ne casse rien.
    main.switchToSheet('feuille_qui_nexiste_pas', false)
    expect(main.current_sheet_id).toBe(before)
  })
})
