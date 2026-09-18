// ==================================================================================================
// os#1385 — UN CANEVAS DESSINÉ DANS UNE AUTRE FENÊTRE DE NAVIGATEUR.
//
// Le tableur, la doc et les figures se détachent déjà dans une vraie fenêtre (PipWindow) ; les
// canevas doivent pouvoir en faire autant, pour que le diagramme d'une feuille aille sur le second
// écran. `container_owner_document` porte cette fenêtre d'accueil depuis le lot 3, mais un modèle
// qui dit « document » ou « fenêtre » tout court s'adresse, lui, à la PAGE : le SVG se construit
// alors au mauvais endroit, les mesures de cadrage rapportent la taille de l'autre écran, et
// l'éditeur en ligne cherche son entrée là où elle n'est pas.
//
// Ce que ce fichier verrouille :
//   1. le conteneur est résolu — et le SVG construit — dans le document d'accueil, pas dans la page ;
//   2. les mesures de cadrage n'interrogent JAMAIS la fenêtre de la page depuis une zone détachée
//      (et l'interrogent toujours depuis celle du conteneur principal : la ceinture ne dérègle rien) ;
//   3. l'édition en ligne trouve son entrée dans le document d'accueil.
//
// La fenêtre d'accueil est ici un <iframe> : jsdom lui donne un vrai `contentDocument`, un vrai
// `contentWindow` et un REALM distinct — c'est-à-dire exactement ce qui différencie une fenêtre
// fille d'un simple div, et donc la bonne maquette. Un faux document aurait suffi aux assertions
// mais pas au reste : il n'aurait pas montré, par exemple, que les prothèses posées sur les
// prototypes de la page ne valent pas dans l'autre fenêtre (cf. `openForeignWindow`).
// ==================================================================================================

import { Class_ApplicationData } from './ApplicationData'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

type FakeBBox = { x: number, y: number, width: number, height: number }
const fakeBBox = (): FakeBBox => ({ x: 0, y: 0, width: 50, height: 10 })

/** Prothèses que jsdom n'offre pas et dont le dessin a besoin (cf. DrawingArea.domIds.test.ts). */
beforeAll(() => {
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    value: () => ({
      font: '',
      measureText: (t: string) => ({ width: 8 * t.length }),
    }),
  })
  ;(SVGElement.prototype as unknown as { getBBox: () => FakeBBox }).getBBox = fakeBBox
})

/** Nombre de lectures de `window.innerWidth`/`innerHeight` DE LA PAGE depuis la dernière remise à zéro. */
let page_window_reads = 0

/** Dimensions de la fenêtre d'accueil, franchement distinctes de celles de la page. */
const FOREIGN_INNER_WIDTH = 640
const FOREIGN_INNER_HEIGHT = 480

type ForeignWindow = { doc: Document, win: Window, host_selector: string }

/**
 * Ouvre une fenêtre d'accueil pour un canevas : un <iframe> attaché à la page, dont le document et
 * la fenêtre tiennent le rôle de ceux d'une fenêtre détachée.
 *
 * Le realm y est DISTINCT : `SVGElement` n'y est pas le même constructeur que dans la page, donc la
 * prothèse `getBBox` posée plus haut n'y vaut rien et doit être reposée. C'est le genre de détail
 * qu'un faux document n'aurait pas révélé, et c'est exactement ce qui piège le code de production
 * qui s'adresserait aux globales de la page.
 */
function openForeignWindow(): ForeignWindow {
  const iframe = document.createElement('iframe')
  document.body.appendChild(iframe)
  const doc = iframe.contentDocument as Document
  const win = iframe.contentWindow as Window
  doc.body.innerHTML = '<div id="hote"></div>'
  ;(win as unknown as { SVGElement: { prototype: { getBBox: () => FakeBBox } } })
    .SVGElement.prototype.getBBox = fakeBBox
  Object.defineProperty(win, 'innerWidth', { configurable: true, get: () => FOREIGN_INNER_WIDTH })
  Object.defineProperty(win, 'innerHeight', { configurable: true, get: () => FOREIGN_INNER_HEIGHT })
  return { doc, win, host_selector: '#hote' }
}

/** Un diagramme minimal, pour que le dessin produise autre chose qu'un SVG vide. */
const fillDiagram = (app: Class_ApplicationData) => {
  const sankey = app.drawing_area.sankey
  const source = sankey.addNewNode('source', 'Source')
  const cible = sankey.addNewNode('cible', 'Cible')
  source.setPosXY(0, 0)
  cible.setPosXY(300, 0)
  sankey.addNewLink(source, cible)
  return { source, cible }
}

/** Un document de l'espace de travail, éditable, dont le canevas vit dans la fenêtre `foreign`. */
const documentInForeignWindow = (app: Class_ApplicationData, foreign: ForeignWindow) => {
  const doc_b = app.workspace.createDocument({ offscreen: true })
  // « Hors écran » veut dire « sans droit d'édition tant qu'on ne le lui donne pas » (lot 3) :
  // ici la fenêtre l'affiche pour de bon, donc elle s'édite.
  doc_b.edition_allowed = true
  const nodes = fillDiagram(doc_b)
  doc_b.drawing_area.container_owner_document = foreign.doc
  doc_b.drawing_area.container_selector = foreign.host_selector
  return { doc_b, nodes }
}

beforeEach(() => {
  // Repart d'une page nette : l'iframe de l'essai précédent s'en va avec.
  document.body.innerHTML = '<div id="sankey_app"></div>'
  page_window_reads = 0
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    get: () => { page_window_reads++; return 2000 },
  })
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    get: () => { page_window_reads++; return 1500 },
  })
})

afterAll(() => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 768 })
})

describe('os#1385 — le SVG se construit dans le document daccueil', () => {

  it('le conteneur est resolu dans lautre fenetre, et rien natterrit dans la page', () => {
    const app = new Class_ApplicationData(false)
    const foreign = openForeignWindow()
    const { doc_b } = documentInForeignWindow(app, foreign)
    const da = doc_b.drawing_area

    da.draw()

    const prefix = da.dom_id_prefix
    expect(prefix).not.toBe('')
    const host = foreign.doc.querySelector('#hote') as HTMLElement
    expect(host.querySelectorAll('[id="' + prefix + 'draw_zoom"]').length).toBe(1)
    expect(host.querySelectorAll('[id="' + prefix + 'g_drawing"]').length).toBe(1)
    // …et pas une trace dans le document de la page.
    expect(document.querySelectorAll('[id="' + prefix + 'draw_zoom"]').length).toBe(0)
    expect(document.querySelector('#sankey_app')?.querySelector('svg')).toBeNull()
  })

  it('les elements du diagramme se dessinent dans lautre fenetre', () => {
    const app = new Class_ApplicationData(false)
    const foreign = openForeignWindow()
    const { doc_b } = documentInForeignWindow(app, foreign)
    const da = doc_b.drawing_area

    da.draw()

    const sankey_group = foreign.doc
      .querySelector('[id="' + da.dom_id_prefix + 'g_elements_sankey"]') as SVGGElement
    expect(sankey_group).not.toBeNull()
    expect(sankey_group.children.length).toBeGreaterThan(0)
  })

  it('un second dessin ne dedouble pas le SVG de lautre fenetre', () => {
    const app = new Class_ApplicationData(false)
    const foreign = openForeignWindow()
    const { doc_b } = documentInForeignWindow(app, foreign)
    const da = doc_b.drawing_area

    da.draw()
    da.draw()

    const id = da.dom_id_prefix + 'draw_zoom'
    expect(foreign.doc.querySelectorAll('[id="' + id + '"]').length).toBe(1)
  })
})

describe('os#1385 — les mesures de cadrage suivent la fenetre daccueil', () => {

  it('une zone detachee ninterroge jamais la fenetre de la page', () => {
    const app = new Class_ApplicationData(false)
    const foreign = openForeignWindow()
    const { doc_b } = documentInForeignWindow(app, foreign)
    const da = doc_b.drawing_area

    // jsdom ne met rien en page : le conteneur hôte mesure 0, donc le repli « fenêtre » des
    // getters de cadrage est RÉELLEMENT emprunté. C'est le cas du tout premier dessin dans une
    // fenêtre fille, celui-là même qui décide du cadrage initial.
    page_window_reads = 0
    const w = da.window_fitting_width
    const h = da.window_fitting_height

    expect(page_window_reads).toBe(0)
    expect(w).toBeGreaterThan(0)
    expect(w).toBeLessThanOrEqual(FOREIGN_INNER_WIDTH)
    expect(h).toBeGreaterThan(0)
    expect(h).toBeLessThanOrEqual(FOREIGN_INNER_HEIGHT)
  })

  it('la zone du conteneur principal mesure toujours la fenetre de la page', () => {
    const app = new Class_ApplicationData(false)

    page_window_reads = 0
    const w = app.drawing_area.window_fitting_width

    expect(page_window_reads).toBeGreaterThan(0)
    expect(w).toBeGreaterThan(FOREIGN_INNER_WIDTH)
  })

  it('les barres de la page ne sont pas cherchees depuis lautre fenetre', () => {
    const app = new Class_ApplicationData(false)
    const foreign = openForeignWindow()
    const { doc_b } = documentInForeignWindow(app, foreign)
    const da = doc_b.drawing_area

    // Autour du conteneur d'une fenêtre fille il n'y a ni barre du haut ni barre du bas : la
    // hauteur à retrancher est nulle, et surtout elle ne se lit pas sur les barres de la page.
    // (jsdom ne met rien en page : on prête aux barres une hauteur, sans quoi l'essai passerait
    // même si le canevas détaché allait bel et bien les mesurer.)
    const withHeight = (cls: string, height: number) => {
      const el = document.createElement('div')
      el.className = cls
      el.getBoundingClientRect = () => ({ height } as unknown as DOMRect)
      document.body.appendChild(el)
    }
    withHeight('TopMenu', 77)
    withHeight('BottomMenu', 33)

    expect(da.getNavBarHeight()).toBe(0)
    expect(da.getBottomBarHeight()).toBe(0)
    // Le canevas de la page, lui, les mesure bien : la ceinture n'a rien débranché.
    expect(app.drawing_area.getNavBarHeight()).toBe(77)
    expect(app.drawing_area.getBottomBarHeight()).toBe(33)
  })
})

describe('os#1385 — ledition en ligne cherche son entree dans le bon document', () => {

  it('lentree contenteditable vit dans lautre fenetre, pas dans la page', () => {
    const app = new Class_ApplicationData(false)
    const foreign = openForeignWindow()
    const { doc_b, nodes } = documentInForeignWindow(app, foreign)
    const da = doc_b.drawing_area
    da.draw()

    expect(da.editable).toBe(true)
    const input_id = da.domId('name_label_input_' + nodes.source.id)
    expect(foreign.doc.getElementById(input_id)).not.toBeNull()
    expect(document.getElementById(input_id)).toBeNull()
  })

  it('la frappe directe ecrit dans lentree de lautre fenetre', () => {
    const app = new Class_ApplicationData(false)
    const foreign = openForeignWindow()
    const { doc_b, nodes } = documentInForeignWindow(app, foreign)
    const da = doc_b.drawing_area
    da.draw()

    // Frappe directe sur un nœud sélectionné (os#1340) : le caractère tapé devient le libellé.
    // Avec une recherche par le document de la PAGE, `setInputLabelVisible` ne trouvait aucune
    // entrée et repartait aussitôt — rien n'était écrit, la frappe était perdue.
    nodes.source.setInputLabelVisible('Z')

    const input = foreign.doc.getElementById(da.domId('name_label_input_' + nodes.source.id))
    expect(input).not.toBeNull()
    expect((input as unknown as { innerText: string }).innerText).toBe('Z')
  })
})
