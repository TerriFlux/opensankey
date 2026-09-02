import { Class_ApplicationData } from './ApplicationData'

// ==================================================================================================
// #485 — Un relâché de souris DANS la zone de dessin dont l'APPUI a eu lieu ailleurs ne doit pas
// compter comme un clic sur le dessin.
//
// Deux gestes courants finissent leur course au-dessus du dessin sans avoir jamais commencé
// dedans : sélectionner au curseur le texte d'un champ de l'inspecteur en débordant vers la
// gauche, et tirer la poignée du bord gauche du panneau latéral au-delà de sa largeur maximale
// (PanelShell.SidebarResizeHandle écoute `mouseup` sur `window`, mais l'événement traverse aussi
// le SVG). Dans les deux cas la DA recevait un `mouseup`, le prenait pour un clic sur le fond et
// purgeait la sélection — celle-là même que l'auteur était en train de configurer.
//
// ⚠️ Ce qui se mesure ici, c'est bien l'APPARIEMENT appui/relâché, pas « la sélection survit à un
// mouseup » : la contre-épreuve vérifie qu'un vrai clic sur le fond (appui ET relâché dans le
// dessin) purge toujours, sans quoi le correctif aurait simplement débranché la purge.
// ==================================================================================================

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// Le SVG est réellement construit ici (on dispatche de vrais événements dessus) : il faut donc
// les deux prothèses que jsdom n'offre pas, comme dans ConnectionGestureHandler.test.ts.
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

/** Diagramme minimal DÉJÀ DESSINÉ (les écouteurs de la DA sont posés par le draw). */
function buildDrawnApp() {
  // Le SVG de la DA se construit dans le conteneur hôte #sankey_app (cf. getContainerNode) :
  // sans lui, toutes les sélections d3 restent vides en jsdom.
  if (!document.getElementById('sankey_app')) {
    const host = document.createElement('div')
    host.id = 'sankey_app'
    document.body.appendChild(host)
  }
  const app = new Class_ApplicationData(false)
  const drawing_area = app.drawing_area
  const { sankey } = drawing_area
  const source = sankey.addNewNode('source', 'Source')
  const cible = sankey.addNewNode('cible', 'Cible')
  // Loin de l'origine : le rectangle de sélection dégénéré (0×0 au point pressé, jsdom
  // rend un pointeur à (0,0)) ne doit pas re-sélectionner par accident ce que la purge
  // vient d'enlever — sans quoi la contre-épreuve mesurerait le rectangle, pas la purge.
  source.setPosXY(800, 600)
  cible.setPosXY(1100, 600)
  sankey.addNewLink(source, cible)
  drawing_area.draw()
  drawing_area.setSelectionMode()
  return { app, drawing_area, source }
}

/** Le groupe qui porte les écouteurs de la zone de dessin (#g_drawing). */
function drawingNode(drawing_area: ReturnType<typeof buildDrawnApp>['drawing_area']) {
  const node = drawing_area.d3_selection?.node()
  if (!node) throw new Error('zone de dessin non dessinée')
  return node
}

function mouse(node: Element, type: string) {
  const evt = new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, view: window })
  // jsdom laisse `which` à 0, alors qu'un bouton GAUCHE vaut 1. Sans ce redressement, le
  // filtre du zoom d3 (`which === 2 || which === 0`) prend l'appui pour un début de
  // panoramique : d3-zoom pose alors un écouteur de relâché en CAPTURE sur `window` qui
  // avale le premier `mouseup` — le geste testé n'atteindrait jamais la zone de dessin.
  Object.defineProperty(evt, 'which', { value: 1 })
  node.dispatchEvent(evt)
}

describe('#485 — relâché dans le dessin, appui hors du dessin', () => {

  it('conserve la sélection quand seul le relâché tombe dans la zone de dessin', () => {
    const { drawing_area, source } = buildDrawnApp()
    drawing_area.addElementToSelection(source)
    expect(drawing_area.selected_nodes_list).toHaveLength(1)

    // Geste amorcé dans l'inspecteur / sur la poignée du panneau : la DA ne voit que le relâché.
    mouse(drawingNode(drawing_area), 'mouseup')

    expect(drawing_area.selected_nodes_list).toHaveLength(1)
  })

  it('contre-épreuve : un vrai clic sur le fond (appui ET relâché) purge bien la sélection', () => {
    const { drawing_area, source } = buildDrawnApp()
    drawing_area.addElementToSelection(source)
    expect(drawing_area.selected_nodes_list).toHaveLength(1)

    const node = drawingNode(drawing_area)
    mouse(node, 'mousedown')
    mouse(node, 'mouseup')

    expect(drawing_area.selected_nodes_list).toHaveLength(0)
  })

  it('un appui resté sans suite ne « arme » pas le relâché étranger suivant', () => {
    const { drawing_area, source } = buildDrawnApp()
    const node = drawingNode(drawing_area)

    // Appui sur le fond, puis relâché HORS de la zone de dessin (au-dessus du panneau) :
    // le guetteur posé sur le document doit désarmer l'appui.
    mouse(node, 'mousedown')
    mouse(document.body, 'mouseup')

    drawing_area.addElementToSelection(source)
    // Geste suivant, amorcé ailleurs et relâché dans le dessin : toujours pas un clic.
    mouse(node, 'mouseup')

    expect(drawing_area.selected_nodes_list).toHaveLength(1)
  })
})
