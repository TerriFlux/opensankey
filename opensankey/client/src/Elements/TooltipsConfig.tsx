import * as d3 from '../d3Modules'
import { Class_LinkElement } from './Link'
import { Class_NodeElement } from './Node'
import { TooltipBehaviorManager } from './TooltipsCSS'

/**
 * Gestionnaire centralisé des tooltips pour tous les éléments
 */
export class TooltipEventManager {
  private static instance: TooltipEventManager | undefined
  private activeTooltip: {
    element: Class_LinkElement | Class_NodeElement | null;
    behaviorManager: TooltipBehaviorManager | null;
  } = { element: null, behaviorManager: null }

  private mousePosition: { x: number; y: number } = { x: 0, y: 0 }
  private isProtected: boolean = false
  private protectionTimer: ReturnType<typeof setTimeout> | null = null

  private autoCloseTimer: ReturnType<typeof setTimeout> | null = null
  private autoCloseDelay: number = 1000

  // Le suivi de la souris n'est armé que tant qu'un tooltip est ouvert
  private isTrackingMouse: boolean = false

  private startAutoCloseTimer() {
    this.clearAutoCloseTimer()
    this.autoCloseTimer = setTimeout(() => {
      this.closeTooltip()
    }, this.autoCloseDelay)
  }

  private clearAutoCloseTimer() {
    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer)
      this.autoCloseTimer = null
    }
  }

  public static getInstance(): TooltipEventManager {
    if (!TooltipEventManager.instance) {
      TooltipEventManager.instance = new TooltipEventManager()
    }
    return TooltipEventManager.instance
  }

  /**
   * Ferme le tooltip courant, retire les écouteurs globaux et oublie le singleton.
   * Un getInstance() ultérieur reconstruit un gestionnaire propre.
   */
  public static disposeInstance() {
    TooltipEventManager.instance?.dispose()
    TooltipEventManager.instance = undefined
  }

  private constructor() {
    document.addEventListener('click', this.onDocumentClick)
    document.addEventListener('keydown', this.onDocumentKeyDown)
  }

  private dispose() {
    this.closeTooltip()
    this.clearProtectionTimer()
    document.removeEventListener('click', this.onDocumentClick)
    document.removeEventListener('keydown', this.onDocumentKeyDown)
  }

  private startTrackingMouse() {
    if (this.isTrackingMouse) return
    document.addEventListener('mousemove', this.onDocumentMouseMove)
    this.isTrackingMouse = true
  }

  private stopTrackingMouse() {
    if (!this.isTrackingMouse) return
    document.removeEventListener('mousemove', this.onDocumentMouseMove)
    this.isTrackingMouse = false
  }

  private clearProtectionTimer() {
    if (this.protectionTimer) {
      clearTimeout(this.protectionTimer)
      this.protectionTimer = null
    }
  }

  // Fermer les tooltips au clic (sauf clic dans le tooltip, ou tooltip épinglé)
  private onDocumentClick = (event: MouseEvent) => {
    if (this.activeTooltip.element && !this.isClickInTooltip(event)) {
      const tooltip = document.querySelector('.sankey-tooltip')
      if (tooltip && tooltip.classList.contains('pinned')) return
      this.closeTooltip()
    }
  }

  // Fermer les tooltips avec ESC
  private onDocumentKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.activeTooltip.element) {
      this.closeTooltip()
    }
  }

  // Armer la fermeture automatique dès que la souris quitte l'élément et le tooltip
  private onDocumentMouseMove = (event: MouseEvent) => {
    if (!this.activeTooltip.element) return

    const isOverElement = this.isMouseOverElement(event)
    const isOverTooltip = this.isMouseOverTooltip(event)

    if (!isOverElement && !isOverTooltip) {
      // La souris n'est ni sur l'élément ni sur le tooltip.
      // Si le tooltip est épinglé, on ne ferme jamais automatiquement.
      const tooltip = document.querySelector('.sankey-tooltip')
      if (tooltip && tooltip.classList.contains('pinned')) {
        this.clearAutoCloseTimer()
      } else {
        this.startAutoCloseTimer()
      }
    } else {
      // La souris est sur l'élément ou le tooltip, annuler la fermeture
      this.clearAutoCloseTimer()
    }
  }

  // Vérifier si la souris est sur l'élément actif
  private isMouseOverElement(event: MouseEvent): boolean {
    if (!this.activeTooltip.element || !this.activeTooltip.element.d3_selection) {
      return false
    }

    const elementNode = this.activeTooltip.element.d3_selection.node()
    if (!elementNode) return false

    // Vérifier si l'événement vient de l'élément ou de ses enfants
    return elementNode.contains(event.target as Node)
  }

  // Vérifier si la souris est sur le tooltip
  private isMouseOverTooltip(event: MouseEvent): boolean {
    const tooltip = document.querySelector('.sankey-tooltip')
    return tooltip ? tooltip.contains(event.target as Node) : false
  }
  /**
   * Ouvre un tooltip pour un élément donné
   */
  public showTooltip(element: Class_LinkElement | Class_NodeElement, mouseX: number, mouseY: number) {
    // Fermer le tooltip actuel s'il y en a un
    if (this.activeTooltip.element && this.activeTooltip.element !== element) {
      this.closeTooltip()
    }

    // Ne pas recréer si c'est le même élément
    if (this.activeTooltip.element === element) {
      return
    }
    this.clearAutoCloseTimer()
    this.mousePosition = { x: mouseX, y: mouseY }

    // Marquer comme sélectionné pour les styles CSS
    element.d3_selection?.classed('tooltip_shown', true)

    if (element instanceof Class_NodeElement) {
      // ✅ CORRECTION : Passer la position de la souris au NodeTooltip
      element._nodeTooltip.mousePosition = { x: mouseX, y: mouseY }
      element.drawTooltip()
      this.activeTooltip = {
        element,
        behaviorManager: element._nodeTooltip.behaviorManager || null
      }
    } else if (element instanceof Class_LinkElement) {
      element._link_tooltip.mousePosition = { x: mouseX, y: mouseY }
      element._link_tooltip.drawTooltip()
      this.activeTooltip = {
        element,
        behaviorManager: element._link_tooltip.behaviorManager || null
      }
    }

    // Un tooltip est ouvert : suivre la souris pour savoir quand le refermer
    this.startTrackingMouse()

    // Marquer comme protégé temporairement
    this.isProtected = true
    this.clearProtectionTimer()
    this.protectionTimer = setTimeout(() => {
      this.isProtected = false
      this.protectionTimer = null
    }, 100)
  }

  /**
   * Ferme le tooltip actuel
   */
  public closeTooltip() {
    this.clearAutoCloseTimer()
    this.stopTrackingMouse()
    if (this.activeTooltip.element) {
      // Nettoyer les classes CSS
      this.activeTooltip.element.d3_selection?.classed('tooltip_shown', false)

      // Nettoyer le behavior manager
      if (this.activeTooltip.behaviorManager) {
        this.activeTooltip.behaviorManager.cleanup()
      }

      // Supprimer les éléments DOM
      d3.selectAll('.sankey-tooltip').remove()

      this.activeTooltip = { element: null, behaviorManager: null }
    }
  }

  // Configurer le délai de fermeture automatique
  public setAutoCloseDelay(delay: number) {
    this.autoCloseDelay = delay
  }
  /**
   * Déplace le tooltip (si nécessaire)
   */
  public moveTooltip() {

    // Les tooltips de nœuds restent fixes
  }

  public getMousePosition() {
    return this.mousePosition
  }

  public hasActiveTooltip(): boolean {
    return this.activeTooltip.element !== null
  }

  public isTooltipProtected(): boolean {
    return this.isProtected
  }

  private isClickInTooltip(event: Event): boolean {
    const tooltip = document.querySelector('.sankey-tooltip')
    return tooltip ? tooltip.contains(event.target as Node) : false
  }
}

/**
 * Mixin pour ajouter la gestion des tooltips aux éléments
 */
export interface TooltipCapable {
  handleTooltipMouseOver(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>): void;
  handleTooltipMouseMove(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>): void;
  handleTooltipMouseOut(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>): void;
}

/**
 * Extension des types pour ajouter les méthodes tooltip
 */
declare module './Node' {
  interface Class_NodeElement {
    handleTooltipMouseOver(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>): void;
    handleTooltipMouseMove(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>): void;
    handleTooltipMouseOut(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>): void;
  }
}

declare module './Link' {
  interface Class_LinkElement {
    handleTooltipMouseOver(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>): void;
    handleTooltipMouseMove(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>): void;
    handleTooltipMouseOut(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>): void;
  }
}

/**
 * Implémentation du mixin pour les nœuds
 */
export function implementTooltipForNode(NodeClass: typeof Class_NodeElement) {
  // Modifier les méthodes d'événements existantes
  const originalMouseOver = NodeClass.prototype.eventMouseOver
  const originalMouseMove = NodeClass.prototype.eventMouseMove
  const originalMouseOut = NodeClass.prototype.eventMouseOut

  NodeClass.prototype.handleTooltipMouseOver = function (
    this: Class_NodeElement,
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    const show_tooltip = event.shiftKey || this.drawing_area.application_data.publish_options.tooltip_on_hover
    if (show_tooltip && (event.target as HTMLElement).tagName !== 'tspan') {
      const tooltipManager = TooltipEventManager.getInstance()
      tooltipManager.showTooltip(this, event.pageX, event.pageY)
    }
  }

  NodeClass.prototype.handleTooltipMouseMove = function (
    this: Class_NodeElement
  ) {
    // Pour les nœuds, on ne bouge pas le tooltip
    // Il reste fixe à sa position initiale
  }

  NodeClass.prototype.handleTooltipMouseOut = function (
    this: Class_NodeElement
  ) {
    // Ne rien faire - le tooltip reste ouvert jusqu'à un clic ou ESC
  }

  // Intégrer dans les événements existants
  NodeClass.prototype.eventMouseOver = function (
    this: Class_NodeElement,
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // Appeler l'événement original
    if (originalMouseOver) {
      originalMouseOver.call(this, event)
    }

    // Gérer les tooltips
    this.handleTooltipMouseOver(event)
  }

  NodeClass.prototype.eventMouseMove = function (
    this: Class_NodeElement,
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // Appeler l'événement original
    if (originalMouseMove) {
      originalMouseMove.call(this, event)
    }

    // Gérer les tooltips
    this.handleTooltipMouseMove(event)
  }

  NodeClass.prototype.eventMouseOut = function (
    this: Class_NodeElement,
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // Appeler l'événement original
    if (originalMouseOut) {
      originalMouseOut.call(this, event)
    }

    // Gérer les tooltips
    this.handleTooltipMouseOut(event)
  }
}

/**
 * Implémentation du mixin pour les liens
 */
export function implementTooltipForLink(LinkClass: typeof Class_LinkElement) {
  const originalMouseOver = LinkClass.prototype.eventMouseOver
  const originalMouseMove = LinkClass.prototype.eventMouseMove
  const originalMouseOut = LinkClass.prototype.eventMouseOut

  LinkClass.prototype.handleTooltipMouseOver = function (
    this: Class_LinkElement,
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    const show_tooltip = event.shiftKey || this.drawing_area.application_data.publish_options.tooltip_on_hover
    if (show_tooltip && (event.target as HTMLElement).tagName !== 'tspan' && (event.target as HTMLElement).tagName !== 'text') {
      const tooltipManager = TooltipEventManager.getInstance()

      // ✅ CHANGEMENT : Passer la position de la souris au LinkTooltip
      this._link_tooltip.mousePosition = { x: event.pageX, y: event.pageY }

      tooltipManager.showTooltip(this, event.pageX, event.pageY)
    }
  }

  LinkClass.prototype.handleTooltipMouseMove = function (
    this: Class_LinkElement
  ) {
  }

  LinkClass.prototype.handleTooltipMouseOut = function (
    this: Class_LinkElement
  ) {
  }

  // Intégrer dans les événements existants
  LinkClass.prototype.eventMouseOver = function (
    this: Class_LinkElement,
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    if (originalMouseOver) {
      originalMouseOver.call(this, event)
    }
    this.handleTooltipMouseOver(event)
  }

  LinkClass.prototype.eventMouseMove = function (
    this: Class_LinkElement,
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    if (originalMouseMove) {
      originalMouseMove.call(this, event)
    }
    this.handleTooltipMouseMove(event)
  }

  LinkClass.prototype.eventMouseOut = function (
    this: Class_LinkElement,
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    if (originalMouseOut) {
      originalMouseOut.call(this, event)
    }
    this.handleTooltipMouseOut(event)
  }
}

// Les mixins réécrivent les prototypes : les réappliquer empilerait les wrappers
// (un tooltip par instance de Class_ApplicationData créée).
let tooltip_system_initialized = false

/**
 * Fonction d'initialisation à appeler au démarrage de l'application.
 * Idempotente : les appels suivants n'ont aucun effet.
 */
export function initializeTooltipSystem() {
  if (tooltip_system_initialized) return
  tooltip_system_initialized = true

  // Appliquer les mixins aux classes
  implementTooltipForNode(Class_NodeElement)
  implementTooltipForLink(Class_LinkElement)

  // Initialiser le gestionnaire
  TooltipEventManager.getInstance()
}

/**
 * Libère le gestionnaire de tooltips (écouteurs globaux, timers).
 * Les mixins posés sur les prototypes restent en place : un
 * initializeTooltipSystem() ultérieur ne les réappliquera pas.
 */
export function disposeTooltipSystem() {
  TooltipEventManager.disposeInstance()
}

