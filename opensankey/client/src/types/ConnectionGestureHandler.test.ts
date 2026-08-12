import { Class_ApplicationData } from './ApplicationData'

// ==================================================================================================
// os#1344 — Création connectée (lot 4 draw.io) : hooks du MODÈLE interrogés par le handler de
// geste (os#1347). Le handler ne porte aucune règle : la validité d'une connexion vient de
// `Class_Sankey.isValidConnection`, la position d'un nœud créé connecté vient de
// `Class_DrawingArea.getConnectedCreationPosition` (espacement + alignement grille). On teste
// aussi l'affichage des flèches directionnelles au survol (chemin public onNodeHover).
// ==================================================================================================

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// jsdom n'implémente pas canvas.getContext ; la mesure de texte des labels en a besoin
// dès que le SVG est construit dans un conteneur RATTACHÉ au document (contrairement aux
// autres suites, ce test attache #sankey_app pour observer le DOM des flèches).
beforeAll(() => {
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    value: () => ({
      font: '',
      measureText: (t: string) => ({ width: 8 * t.length }),
    }),
  })
  // jsdom n'implémente pas non plus getBBox sur les éléments SVG.
  ;(SVGElement.prototype as unknown as { getBBox: () => { x: number, y: number, width: number, height: number } })
    .getBBox = () => ({ x: 0, y: 0, width: 50, height: 10 })
})

function buildDrawnApp() {
  // Le SVG de la DA se construit dans le conteneur hôte #sankey_app (cf.
  // getContainerNode) : sans lui, toutes les sélections d3 restent vides en jsdom.
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
  source.setPosXY(0, 0)
  cible.setPosXY(300, 0)
  sankey.addNewLink(source, cible)
  drawing_area.draw()
  return { app, drawing_area, sankey, source, cible }
}

describe('os#1344 — hooks du modèle pour la création connectée', () => {

  it('isValidConnection : deux nœuds distincts du sankey → valide', () => {
    const { sankey, source, cible } = buildDrawnApp()
    expect(sankey.isValidConnection(source, cible)).toBe(true)
    expect(sankey.isValidConnection(cible, source)).toBe(true)
  })

  it('isValidConnection : auto-bouclage refusé', () => {
    const { sankey, source } = buildDrawnApp()
    expect(sankey.isValidConnection(source, source)).toBe(false)
  })

  it('isValidConnection : un nœud étranger (autre sankey / supprimé) est refusé', () => {
    const { sankey, source } = buildDrawnApp()
    const autre = buildDrawnApp()
    expect(sankey.isValidConnection(source, autre.source)).toBe(false)
    // Nœud supprimé du registre : plus une cible valide.
    const { drawing_area, cible } = autre
    drawing_area.deleteNode(autre.cible)
    expect(autre.sankey.isValidConnection(autre.source, cible)).toBe(false)
  })

  it('getConnectedCreationPosition : espacement à droite/gauche/haut/bas depuis le bord du nœud', () => {
    const { drawing_area, source } = buildDrawnApp()
    drawing_area.magnetic_nodes = false
    const w = source.getShapeWidthToUse()
    const h = source.getShapeHeightToUse()
    const spacing = Math.max(2 * drawing_area.grid_size, 100)

    const right = drawing_area.getConnectedCreationPosition(source, 'right', w, h)
    expect(right).toEqual({ x: source.position_x + w + spacing, y: source.position_y })

    const left = drawing_area.getConnectedCreationPosition(source, 'left', w, h)
    expect(left).toEqual({ x: source.position_x - spacing - w, y: source.position_y })

    const top = drawing_area.getConnectedCreationPosition(source, 'top', w, h)
    expect(top).toEqual({ x: source.position_x, y: source.position_y - spacing - h })

    const bottom = drawing_area.getConnectedCreationPosition(source, 'bottom', w, h)
    expect(bottom).toEqual({ x: source.position_x, y: source.position_y + h + spacing })
  })

  it('getConnectedCreationPosition : aligné sur la grille quand le magnétisme est actif', () => {
    const { drawing_area, source } = buildDrawnApp()
    drawing_area.magnetic_nodes = true
    // Position source volontairement hors grille.
    source.setPosXY(13, 27)
    const pos = drawing_area.getConnectedCreationPosition(source, 'right', 40, 40)
    const step = drawing_area.grid_size / 4
    expect(pos.x % step).toBe(0)
    expect(pos.y % step).toBe(0)
  })
})

describe('os#1344 — flèches directionnelles au survol', () => {

  const hoverEvent = { buttons: 0 } as unknown as React.MouseEvent<HTMLButtonElement, React.MouseEvent>

  it('survol d\'un nœud en mode sélection : les 4 flèches apparaissent ; masquage immédiat OK', () => {
    const { drawing_area, source } = buildDrawnApp()
    drawing_area.setSelectionMode()
    expect(drawing_area.editable).toBe(true)
    expect(drawing_area.isInSelectionMode()).toBe(true)

    drawing_area.connection_gesture.onNodeHover(source, hoverEvent)
    const group = document.getElementById('g_connection_gesture')
    expect(group).not.toBeNull()
    expect(group!.querySelectorAll('.connection_arrow').length).toBe(4)

    drawing_area.connection_gesture.hideArrows()
    expect(document.getElementById('g_connection_gesture')).toBeNull()
  })

  it('pas de flèches pendant un geste (bouton enfoncé) ni hors mode sélection', () => {
    const { drawing_area, source } = buildDrawnApp()
    drawing_area.setSelectionMode()

    const dragging = { buttons: 1 } as unknown as React.MouseEvent<HTMLButtonElement, React.MouseEvent>
    drawing_area.connection_gesture.onNodeHover(source, dragging)
    expect(document.getElementById('g_connection_gesture')).toBeNull()

    drawing_area.setToModeEdition(false)
    if (!drawing_area.isInSelectionMode()) {
      drawing_area.connection_gesture.onNodeHover(source, hoverEvent)
      expect(document.getElementById('g_connection_gesture')).toBeNull()
    }
  })

  // sa#422 — l'interrupteur. Le geste n'avait aucun moyen d'être coupé : les flèches
  // surgissaient à chaque passage de souris, y compris pour qui ne crée rien.
  it('interrupteur coupé : aucune flèche au survol, le geste ne s\'amorce plus', () => {
    const { drawing_area, source } = buildDrawnApp()
    drawing_area.setSelectionMode()
    drawing_area.connection_arrows_off = true

    drawing_area.connection_gesture.onNodeHover(source, hoverEvent)
    expect(document.getElementById('g_connection_gesture')).toBeNull()
  })

  it('bascule de l\'interrupteur pendant que les flèches sont affichées : elles disparaissent aussitôt', () => {
    const { drawing_area, source } = buildDrawnApp()
    drawing_area.setSelectionMode()

    drawing_area.connection_gesture.onNodeHover(source, hoverEvent)
    expect(document.getElementById('g_connection_gesture')).not.toBeNull()

    // Sans ce nettoyage par le setter, la flèche sous le curseur au moment du clic
    // resterait à l'écran jusqu'au prochain mouvement : le bouton paraîtrait inerte.
    drawing_area.connection_arrows_off = true
    expect(document.getElementById('g_connection_gesture')).toBeNull()

    // Retour à l'état par défaut : les flèches réapparaissent au survol suivant.
    drawing_area.connection_arrows_off = false
    drawing_area.connection_gesture.onNodeHover(source, hoverEvent)
    expect(document.getElementById('g_connection_gesture')).not.toBeNull()
  })

  it('pas de flèches sur une zone de texte (seuls les vrais nœuds du modèle en ont)', () => {
    const { drawing_area, sankey } = buildDrawnApp()
    drawing_area.setSelectionMode()
    // Sans dessin (bypass) : le rendu d'une ZDT passe par d3-textwrap, non supporté
    // en jsdom, et le guard testé (vrai nœud du modèle) n'a pas besoin du DOM.
    const zdt = drawing_area.withBypassRedraws(() => sankey.addNewDefaultContainer(), false)
    drawing_area.connection_gesture.onNodeHover(zdt, hoverEvent)
    expect(document.getElementById('g_connection_gesture')).toBeNull()
  })
})
