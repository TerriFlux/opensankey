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

/** Taille d'une zone posée : de quoi lire une couronne ou des barres et leur légende. */
export const FIGURE_ZONE_DEFAULT_SIZE = { width: 420, height: 300 }

export class Class_FigureZoneElement extends Class_ContainerElement {
  private _figure_id: string
  private _subject: Type_FigureZoneSubject
  private _leader_visible = true
  // La figure montée et l'hôte qui la porte : GARDÉS d'un dessin à l'autre. Le dessin d'un élément
  // vide son groupe (`Element._draw`) ; on y repose le même hôte, et la figure n'est pas refaite.
  private _host: HTMLDivElement | null = null
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

  /** La figure, dans un `foreignObject` à la taille de la zone, PAR-DESSUS son fond. */
  public drawFigure(): void {
    const g = this.d3_selection
    if (g === null) return
    const w = Math.max(80, this.getShapeWidthToUse())
    const h = Math.max(60, this.getShapeHeightToUse())
    g.selectAll('foreignObject.figure_zone_fo').remove()
    const fo = g.append('foreignObject')
      .attr('class', 'figure_zone_fo')
      .attr('x', 0).attr('y', 0).attr('width', w).attr('height', h)
    if (this._host === null) {
      this._host = document.createElement('div')
      this._host.className = 'figure_zone_host'
    }
    this._host.style.width = `${w}px`
    this._host.style.height = `${h}px`
    this._host.style.overflow = 'hidden'
    ;(fo.node() as SVGForeignObjectElement).appendChild(this._host)
    // Monter une fois ; remonter si la figure, le sujet ou la taille changent ; sinon redessiner.
    const key = `${this._figure_id}|${this._subject.kind}:${this._subject.id}|${Math.round(w)}x${Math.round(h)}`
    if (this._mounted !== null && key === this._mounted_key) {
      try { this._mounted.redraw?.() } catch { /* idem */ }
      return
    }
    this._unmount()
    this._host.replaceChildren()
    this._mounted = figure_zone_hooks.mount?.(this, this._host) ?? null
    this._mounted_key = this._mounted !== null ? key : ''
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
      .attr('stroke', this.shape_border_color || '#8a8a8a').attr('stroke-width', 1.2)
      .attr('stroke-dasharray', '4 3')
    leader.append('circle').attr('cx', ax).attr('cy', ay).attr('r', 3)
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
