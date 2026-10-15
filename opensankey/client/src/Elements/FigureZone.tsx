import { Class_DrawingArea } from '../types/DrawingArea'
import { Class_ContainerElement } from './TextZone'
import { figure_zone_hooks, type Type_FigureZoneMount } from './figureZoneHooks'

export { figure_zone_hooks }
export type { Type_FigureZoneMount } from './figureZoneHooks'

// os#1531 (Julien, 15/10 : « réintégrer le diagramme dans le diagramme principal et le rattacher à
// l'élément par un trait d'attache ») — UNE FIGURE POSÉE DANS LE DIAGRAMME.
//
// Une zone du diagramme (elle hérite des zones de texte : déplacer, redimensionner, sélectionner,
// annuler, enregistrer) qui DESSINE une figure du document (`f_N`, cf. le registre de
// `Class_MenuConfig`) sur son sujet, nœud ou flux, et s'y rattache par un TRAIT D'ATTACHE.
//
// Un LIEN et non une copie, comme « Poser sur le nœud » : la zone ne connaît que le NOM de la
// figure ; la rerégler dans sa fenêtre change ce que la zone montre. La légende est celle de la
// figure, dans la zone ; la figure reste cliquable (arbitrage de Julien, 15/10).

/** Le sujet de la figure : l'élément du diagramme qu'elle décompose, et auquel le trait la rattache. */
export type Type_FigureZoneSubject = { kind: 'node' | 'link', id: string }

/** Ce qui se persiste d'une zone figure (clé `figure_zone` d'une entrée de `labels`). */
export type Type_FigureZoneJSON = { figure: string, subject: Type_FigureZoneSubject, leader?: boolean }

/**
 * Les figures du document que citent ces zones : le ménage d'avant l'écriture (cf.
 * `_pruneUnreferencedFiguresBeforeWrite`) les garde, comme celles posées sur un nœud.
 */
export const figureZoneFigureIds = (containers: Iterable<unknown>): string[] => {
  const out: string[] = []
  for (const c of containers) if (c instanceof Class_FigureZoneElement) out.push(c.figure_id)
  return out
}

/**
 * os#1531 (Julien, 15/10 : « comment rendre ça visible ? ») — LA LARGEUR À LAQUELLE LA FIGURE SE
 * DESSINE, avant d'être étirée à la taille de la zone : comme une image. Agrandir la zone agrandit
 * donc le texte avec le dessin, au lieu de laisser des étiquettes minuscules dans un grand cadre.
 */
export const FIGURE_ZONE_NOMINAL_WIDTH = 420

/** La scène hors écran où les figures posées se dessinent avant d'être adoptées par leur zone. */
const FIGURE_ZONE_STAGE_ID = 'figure_zone_stage'

/** Taille d'une zone posée : de quoi lire une couronne ou des barres et leur légende. */
export const FIGURE_ZONE_DEFAULT_SIZE = { width: 420, height: 300 }

export class Class_FigureZoneElement extends Class_ContainerElement {
  private _figure_id: string
  private _subject: Type_FigureZoneSubject
  private _leader_visible = true
  // La figure montée et l'hôte qui la porte : GARDÉS d'un dessin à l'autre. Le dessin d'un élément
  // vide son groupe (`Element._draw`) ; on y repose le même hôte, et la figure n'est pas refaite.
  private _host: HTMLDivElement | null = null
  private _frame: SVGSVGElement | null = null
  private _observer: MutationObserver | null = null
  private _mounted: Type_FigureZoneMount | null = null
  private _mounted_key = ''

  constructor(
    id: string,
    name: string,
    drawing_area: Class_DrawingArea,
    figure_id: string,
    subject: Type_FigureZoneSubject
  ) {
    super(id, name, drawing_area)
    this._figure_id = figure_id
    this._subject = subject
  }

  public get figure_id(): string { return this._figure_id }
  public get subject(): Type_FigureZoneSubject { return this._subject }
  public get leader_visible(): boolean { return this._leader_visible }
  public set leader_visible(_: boolean) {
    this._leader_visible = _
    this.drawLeader()
  }

  public toFigureZoneJSON(): Type_FigureZoneJSON {
    return { figure: this._figure_id, subject: { ...this._subject }, ...(this._leader_visible ? {} : { leader: false }) }
  }

  public loadFigureZoneJSON(json: Type_FigureZoneJSON): void {
    this._figure_id = json.figure
    this._subject = { ...json.subject }
    this._leader_visible = json.leader !== false
  }

  /** L'élément que la figure décompose, ou `undefined` s'il a disparu du diagramme. */
  public get subject_element() {
    const sankey = this.drawing_area.sankey
    return this._subject.kind === 'node' ? sankey.nodes_dict[this._subject.id] : sankey.links_dict[this._subject.id]
  }

  public draw() {
    super.draw()
    this.drawFigure()
    this.drawLeader()
  }

  public applyPosition() {
    super.applyPosition()
    this.drawLeader()
  }

  public unDraw() {
    this._unmount()
    super.unDraw()
  }

  private _unmount() {
    try { this._mounted?.cleanup() } catch { /* une figure qui échoue à se défaire ne bloque pas la zone */ }
    this._mounted = null
    this._mounted_key = ''
  }

  /** La zone quitte le diagramme : la figure, son hôte hors écran et son observateur avec elle. */
  public override delete() {
    this._unmount()
    this._observer?.disconnect()
    this._observer = null
    this._host?.remove()
    this._host = null
    super.delete()
  }

  /**
   * os#1531 (Julien, 15/10 : « il ne faut pas une image, il faut un vrai SVG ») — LA FIGURE EST UN SVG
   * DU DIAGRAMME, pas un bloc HTML posé dessus.
   *
   * Le tracé d'une figure écrit dans un conteneur HTML et y mesure ses textes : il dessine donc dans
   * un hôte HORS ÉCRAN (rendu, mais invisible), et la zone ADOPTE le `<svg>` qu'il produit — déplacé,
   * pas copié : ses écouteurs (clic sur une part, info-bulles) le suivent. À chaque redessin du tracé
   * (geste, redimensionnement), le nouveau `<svg>` remplace l'ancien (`MutationObserver`).
   *
   * Dans la zone, il vit dans un `<svg>` à `viewBox` : dessiné à largeur fixe, à la proportion de la
   * zone, il s'étire à sa taille — texte compris. Et c'est du SVG de bout en bout : l'export le prend.
   */
  public drawFigure(): void {
    const g = this.d3_selection
    if (g === null) return
    const w = Math.max(80, this.getShapeWidthToUse())
    const h = Math.max(60, this.getShapeHeightToUse())
    const nominal_w = FIGURE_ZONE_NOMINAL_WIDTH
    const nominal_h = Math.max(60, Math.round(nominal_w * h / w))
    if (this._frame === null) {
      this._frame = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      this._frame.setAttribute('class', 'figure_zone_svg')
      this._frame.setAttribute('overflow', 'visible')
      this._relayPointerToZone(this._frame)
    }
    this._frame.setAttribute('x', '0')
    this._frame.setAttribute('y', '0')
    this._frame.setAttribute('width', String(w))
    this._frame.setAttribute('height', String(h))
    this._frame.setAttribute('viewBox', `0 0 ${nominal_w} ${nominal_h}`)
    this._frame.setAttribute('preserveAspectRatio', 'xMidYMid meet')
    // Le dessin d'un élément vide son groupe : on y repose le même cadre, la figure dedans.
    ;(g.node() as SVGGElement).appendChild(this._frame)

    const host = this._stagedHost()
    host.style.width = `${nominal_w}px`
    host.style.height = `${nominal_h}px`
    const key = `${this._figure_id}|${this._subject.kind}:${this._subject.id}|${nominal_w}x${nominal_h}`
    if (this._mounted !== null && key === this._mounted_key) {
      try { this._mounted.redraw?.() } catch { /* une figure qui échoue ne bloque pas la zone */ }
      this._adoptChartSvg()
      return
    }
    this._unmount()
    host.replaceChildren()
    this._mounted = figure_zone_hooks.mount?.(this, host) ?? null
    this._mounted_key = this._mounted !== null ? key : ''
    this._adoptChartSvg()
  }

  /** L'hôte hors écran où le tracé dessine (créé une fois, rangé dans la scène commune). */
  private _stagedHost(): HTMLDivElement {
    if (this._host !== null) return this._host
    let stage = document.getElementById(FIGURE_ZONE_STAGE_ID)
    if (stage === null) {
      stage = document.createElement('div')
      stage.id = FIGURE_ZONE_STAGE_ID
      // Rendu (les textes se mesurent) mais hors de vue et sans prise sur la page.
      stage.style.cssText = 'position:fixed;left:-100000px;top:0;visibility:hidden;pointer-events:none'
      document.body.appendChild(stage)
    }
    const host = document.createElement('div')
    host.className = 'figure_zone_host'
    host.style.overflow = 'hidden'
    stage.appendChild(host)
    this._host = host
    this._observer = typeof MutationObserver === 'function'
      ? new MutationObserver(() => this._adoptChartSvg())
      : null
    this._observer?.observe(host, { childList: true, subtree: true })
    return host
  }

  /** Le `<svg>` que le tracé vient de produire passe dans la zone, à la place du précédent. */
  private _adoptChartSvg(): void {
    const host = this._host
    const frame = this._frame
    if (host === null || frame === null) return
    const chart = Array.from(host.querySelectorAll('svg')).find(svg => svg.parentElement?.closest('svg') === null)
    if (chart === undefined) return
    frame.replaceChildren(chart)
  }

  /**
   * os#1531 (Julien, 15/10 : « qu'on puisse draguer l'élément ») — LA FIGURE SE SAISIT COMME LA ZONE.
   *
   * Le dessin de la figure a son propre zoom (glisser = déplacer la vue) qui avalait l'appui : la zone
   * ne bougeait plus. L'appui et la molette sont donc interceptés à l'entrée du cadre et RENVOYÉS au
   * cadre lui-même, d'où ils remontent au groupe de la zone (son glisser) et au diagramme (son zoom).
   * Le CLIC, événement à part, atteint toujours la barre ou le secteur : un appui relâché sans bouger
   * sélectionne la part ; s'il a bougé, le glisser de la zone avale ce clic, comme partout.
   */
  private _relayPointerToZone(frame: Element): void {
    const relay = (event: Event) => {
      if ((event as { __figure_zone_relayed?: boolean }).__figure_zone_relayed) return
      if (event.target === frame) return
      event.stopPropagation()
      const copy = event instanceof WheelEvent
        ? new WheelEvent(event.type, event)
        : new MouseEvent(event.type, event as MouseEvent)
      ;(copy as unknown as { __figure_zone_relayed: boolean }).__figure_zone_relayed = true
      frame.dispatchEvent(copy)
      if (event instanceof WheelEvent) event.preventDefault()
    }
    frame.addEventListener('mousedown', relay, true)
    frame.addEventListener('wheel', relay, { capture: true, passive: false })
    frame.addEventListener('dblclick', relay, true)
  }

  /**
   * LE TRAIT D'ATTACHE : du bord de la zone le plus proche à l'élément — le bord du nœud le plus
   * proche du centre de la zone, ou le milieu du flux. Rien quand ils se recouvrent.
   */
  public drawLeader(): void {
    const g = this.d3_selection
    if (g === null) return
    g.selectAll('.figure_zone_leader').remove()
    if (!this._leader_visible) return
    const anchor = this._anchorPoint()
    if (anchor === null) return
    const w = this.getShapeWidthToUse()
    const h = this.getShapeHeightToUse()
    const ax = anchor.x - this.position_x
    const ay = anchor.y - this.position_y
    const bx = Math.min(Math.max(ax, 0), w)
    const by = Math.min(Math.max(ay, 0), h)
    if (Math.hypot(ax - bx, ay - by) < 4) return
    // Sous la figure (inséré en tête du groupe) : le trait part de la zone, il ne la barre pas.
    const leader = g.insert('g', ':first-child').attr('class', 'figure_zone_leader').attr('pointer-events', 'none')
    leader.append('line')
      .attr('x1', bx).attr('y1', by).attr('x2', ax).attr('y2', ay)
      .attr('stroke', this.shape_border_color || '#6b6b6b').attr('stroke-width', 1.6)
      .attr('stroke-dasharray', '6 3')
    leader.append('circle').attr('cx', ax).attr('cy', ay).attr('r', 3.5)
      .attr('fill', this.shape_border_color || '#8a8a8a')
  }

  /** Où le trait touche l'élément, en coordonnées du diagramme ; `null` s'il n'existe plus. */
  private _anchorPoint(): { x: number, y: number } | null {
    const el = this.subject_element
    if (el === undefined) return null
    const cx = this.position_x + this.getShapeWidthToUse() / 2
    const cy = this.position_y + this.getShapeHeightToUse() / 2
    if (this._subject.kind === 'node') {
      const node = el as unknown as { position_x: number, position_y: number, getShapeWidthToUse(): number, getShapeHeightToUse(): number }
      const x0 = node.position_x
      const y0 = node.position_y
      const x1 = x0 + node.getShapeWidthToUse()
      const y1 = y0 + node.getShapeHeightToUse()
      return { x: Math.min(Math.max(cx, x0), x1), y: Math.min(Math.max(cy, y0), y1) }
    }
    const link = el as unknown as { position_x_start: number, position_y_start: number, position_x_end: number, position_y_end: number }
    return {
      x: (link.position_x_start + link.position_x_end) / 2,
      y: (link.position_y_start + link.position_y_end) / 2
    }
  }
}
