// ==================================================================================================
// os#1385 (lot 3, D4) — LES IDENTIFIANTS STRUCTURELS DU SVG, ET LE DROIT D'ÉDITER.
//
// Deux documents dessinés dans la même page posaient jusqu'ici deux `#draw_zoom`, deux
// `#g_drawing`, deux `#os_drop_shadow`… : quatorze doublons mesurés au lot 0. Sans effet visible
// tant que chaque zone cherchait les siens dans SA sélection d3 — mais toute résolution
// GLOBALE (`url(#…)`, `getElementById`, `closest('#…')`) prend le PREMIER du document, et c'est
// exactement la panne de libellés du 10/09/2026, en attente de se reproduire.
//
// Ce que ce fichier verrouille :
//   1. la zone du CONTENEUR PRINCIPAL ne change pas d'un octet (écart assumé du contrat : son
//      préfixe reste vide, pour ne toucher ni les exports SVG, ni les empreintes de corpus, ni
//      les sondes, ni les cibles du tour guidé) ;
//   2. toute autre zone préfixe, et son dessin ne vole rien à la principale ;
//   3. `editable` ne se déduit plus de la PLACE à l'écran mais du DOCUMENT — une feuille
//      ouverte dans une fenêtre s'édite dès qu'on le lui permet, un aperçu fabriqué à côté
//      jamais.
// ==================================================================================================

import { Class_ApplicationData } from './ApplicationData'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// Le SVG est réellement construit ici (c'est tout le sujet) : il faut les deux prothèses que
// jsdom n'offre pas, comme dans DrawingArea.releaseOutsidePress.test.ts.
beforeAll(() => {
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    value: () => ({
      font: '',
      measureText: (t: string) => ({ width: 8 * t.length }),
    }),
  })
  ;(SVGElement.prototype as unknown as { getBBox: () => { x: number, y: number, width: number, height: number } })
    .getBBox = () => ({ x: 0, y: 0, width: 50, height: 10 })
})

/** Les identifiants structurels posés par `_initDraw` et par le chrome de viewport. */
const STRUCTURAL_IDS = [
  'draw_zoom', 'g_clip', 'g_drawing', 'g_background', 'g_color_bg', 'g_grid',
  'g_elements', 'g_elements_sankey', 'g_handlers', 'g_select_zone', 'def_gradient',
  'os_drop_shadow', 'viewport_border'
]

/** Compte, dans TOUTE la page, les éléments portant exactement cet identifiant. */
const countById = (id: string) => document.querySelectorAll('[id="' + id + '"]').length

/** Un diagramme minimal, pour que le dessin produise autre chose qu'un SVG vide. */
const fillDiagram = (app: Class_ApplicationData) => {
  const sankey = app.drawing_area.sankey
  const source = sankey.addNewNode('source', 'Source')
  const cible = sankey.addNewNode('cible', 'Cible')
  source.setPosXY(0, 0)
  cible.setPosXY(300, 0)
  sankey.addNewLink(source, cible)
}

describe('os#1385 — identifiants structurels du SVG', () => {

  beforeEach(() => {
    document.body.innerHTML = '<div id="sankey_app"></div><div id="autre"></div>'
  })

  it('la zone du conteneur principal garde ses identifiants nus', () => {
    const app = new Class_ApplicationData(false)
    fillDiagram(app)
    app.drawing_area.draw()

    expect(app.drawing_area.dom_id_prefix).toBe('')
    expect(app.drawing_area.domId('g_drawing')).toBe('g_drawing')
    const main_container = document.querySelector('#sankey_app')!
    STRUCTURAL_IDS.forEach(id => {
      expect(main_container.querySelectorAll('[id="' + id + '"]').length).toBe(1)
    })
  })

  it('une zone hors du conteneur principal prefixe tout, et ne vole rien a la principale', () => {
    const app = new Class_ApplicationData(false)
    fillDiagram(app)
    app.drawing_area.draw()

    // Un document hors écran, repointé sur un AUTRE conteneur de la page : c'est la fenêtre de
    // feuille du lot 0, en modèle.
    const autre_doc = app.workspace.createDocument({ offscreen: true })
    fillDiagram(autre_doc)
    autre_doc.drawing_area.container_selector = '#autre'
    autre_doc.drawing_area.draw()

    const prefix = autre_doc.drawing_area.dom_id_prefix
    expect(prefix).not.toBe('')
    const autre_container = document.querySelector('#autre')!
    STRUCTURAL_IDS.forEach(id => {
      expect(autre_container.querySelectorAll('[id="' + prefix + id + '"]').length).toBe(1)
      // …et surtout : PAS de second identifiant nu dans la page.
      expect(countById(id)).toBe(1)
    })
    // La zone principale est intacte : son SVG n'a pas été emporté par le dessin du voisin.
    expect(document.querySelector('#sankey_app')!.querySelectorAll('[id="draw_zoom"]').length).toBe(1)
  })

  it('les elements se dessinent dans le groupe prefixe de leur zone', () => {
    const app = new Class_ApplicationData(false)
    const autre_doc = app.workspace.createDocument({ offscreen: true })
    fillDiagram(autre_doc)
    autre_doc.drawing_area.container_selector = '#autre'
    autre_doc.drawing_area.draw()

    // Class_BaseElement._initDraw cherche son groupe parent PAR IDENTIFIANT : s'il le cherchait
    // encore en dur, les nœuds ne se dessineraient pas du tout ici.
    const prefix = autre_doc.drawing_area.dom_id_prefix
    const sankey_group = document.querySelector('[id="' + prefix + 'g_elements_sankey"]')!
    expect(sankey_group.children.length).toBeGreaterThan(0)
  })

  it('un second dessin de la meme zone ne dedouble pas son SVG', () => {
    const app = new Class_ApplicationData(false)
    const autre_doc = app.workspace.createDocument({ offscreen: true })
    fillDiagram(autre_doc)
    autre_doc.drawing_area.container_selector = '#autre'
    autre_doc.drawing_area.draw()
    autre_doc.drawing_area.draw()

    const prefix = autre_doc.drawing_area.dom_id_prefix
    expect(countById(prefix + 'draw_zoom')).toBe(1)
    expect(countById(prefix + 'g_elements_sankey')).toBe(1)
  })
})

describe('os#1385 — editable : le droit vient du document, pas de la place a lecran', () => {

  beforeEach(() => {
    document.body.innerHTML = '<div id="sankey_app"></div><div id="autre"></div>'
  })

  it('la zone du document principal est editable', () => {
    const app = new Class_ApplicationData(false)
    expect(app.drawing_area.editable).toBe(true)
  })

  it('une zone fabriquee a cote (board unitaire) ne lest pas, meme dans le conteneur principal', () => {
    const app = new Class_ApplicationData(false)
    const board = app.createNewDrawingArea('unitary_board')
    board.is_unitary = true
    expect(board.is_in_main_container).toBe(true)
    // Elle n'est pas la zone VIVANTE de son document : rien ne s'y édite.
    expect(board.editable).toBe(false)
  })

  it('un document hors ecran nedite pas, et sedite des quon le lui permet', () => {
    const app = new Class_ApplicationData(false)
    const hidden = app.workspace.createDocument({ offscreen: true })
    expect(hidden.drawing_area.editable).toBe(false)

    hidden.edition_allowed = true
    expect(hidden.drawing_area.editable).toBe(true)
    // Et sa place n'y est pour rien : détachée, dans un autre conteneur, elle reste éditable.
    hidden.drawing_area.container_selector = '#autre'
    expect(hidden.drawing_area.is_detached).toBe(true)
    expect(hidden.drawing_area.editable).toBe(true)
  })

  it('la zone dun document de feuille sedite apres edition_allowed', () => {
    const app = new Class_ApplicationData(false)
    // Une seconde feuille : la première devient un instantané, donc chargeable à part.
    app.createNewSheet(false)
    const first_sheet = app.sheets_order[0]
    const sheet_app = app.sheetApplication(first_sheet)!
    expect(sheet_app).not.toBe(app)

    expect(sheet_app.drawing_area.editable).toBe(false)
    sheet_app.edition_allowed = true
    expect(sheet_app.drawing_area.editable).toBe(true)
  })
})
