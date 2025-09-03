import * as d3 from 'd3'
import { ClassTemplate_ProtoElement } from "./Element";
import { Class_LinkElement } from "./Link";
import { Class_NodeElement } from "./Node";
import { TooltipBehaviorManager } from './TooltipsCSS';

/**
 * Gestionnaire centralisé des tooltips pour tous les éléments
 */
export class TooltipEventManager {
  private static instance: TooltipEventManager;
  private activeTooltip: {
    element: ClassTemplate_ProtoElement | null;
    behaviorManager: TooltipBehaviorManager | null;
  } = { element: null, behaviorManager: null };

  private mousePosition: { x: number; y: number } = { x: 0, y: 0 };
  private isProtected: boolean = false;

  public static getInstance(): TooltipEventManager {
    if (!TooltipEventManager.instance) {
      TooltipEventManager.instance = new TooltipEventManager();
    }
    return TooltipEventManager.instance;
  }

  private constructor() {
    this.setupGlobalListeners();
  }

  private setupGlobalListeners() {
    // Écouter les clics pour fermer les tooltips
    document.addEventListener('click', (event) => {
      if (this.activeTooltip.element && !this.isClickInTooltip(event)) {
        this.closeTooltip();
      }
    });

    // Écouter ESC pour fermer
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.activeTooltip.element) {
        this.closeTooltip();
      }
    });
  }

  /**
   * Ouvre un tooltip pour un élément donné
   */
  public showTooltip(element: ClassTemplate_ProtoElement, mouseX: number, mouseY: number) {
    // Fermer le tooltip actuel s'il y en a un
    if (this.activeTooltip.element && this.activeTooltip.element !== element) {
      this.closeTooltip();
    }

    // Ne pas recréer si c'est le même élément
    if (this.activeTooltip.element === element) {
      return;
    }

    this.mousePosition = { x: mouseX, y: mouseY };

    // Marquer comme sélectionné pour les styles CSS
    element.d3_selection?.classed('tooltip_shown', true);

    if (element instanceof Class_NodeElement) {
      // ✅ CORRECTION : Passer la position de la souris au NodeTooltip
      element._nodeTooltip.mousePosition = { x: mouseX, y: mouseY };
      element.drawTooltip();
      this.activeTooltip = {
        element,
        behaviorManager: element._nodeTooltip.behaviorManager || null
      };
    } else if (element instanceof Class_LinkElement) {
      element._link_tooltip.mousePosition = { x: mouseX, y: mouseY };
      element._link_tooltip.drawTooltip();
      this.activeTooltip = {
        element,
        behaviorManager: element._link_tooltip.behaviorManager || null
      };
    }

    // Marquer comme protégé temporairement
    this.isProtected = true;
    setTimeout(() => { this.isProtected = false; }, 100);
  }

  /**
   * Ferme le tooltip actuel
   */
  public closeTooltip() {
    if (this.activeTooltip.element) {
      // Nettoyer les classes CSS
      this.activeTooltip.element.d3_selection?.classed('tooltip_shown', false);

      // Nettoyer le behavior manager
      if (this.activeTooltip.behaviorManager) {
        this.activeTooltip.behaviorManager.cleanup();
      }

      // Supprimer les éléments DOM
      d3.selectAll('.sankey-tooltip').remove();

      this.activeTooltip = { element: null, behaviorManager: null };
    }
  }

  /**
   * Déplace le tooltip (si nécessaire)
   */
  public moveTooltip(mouseX: number, mouseY: number) {

    // Les tooltips de nœuds restent fixes
  }

  public getMousePosition() {
    return this.mousePosition;
  }

  public hasActiveTooltip(): boolean {
    return this.activeTooltip.element !== null;
  }

  public isTooltipProtected(): boolean {
    return this.isProtected;
  }

  private isClickInTooltip(event: Event): boolean {
    const tooltip = document.querySelector('.sankey-tooltip');
    return tooltip ? tooltip.contains(event.target as Node) : false;
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
  const originalMouseOver = NodeClass.prototype.eventMouseOver;
  const originalMouseMove = NodeClass.prototype.eventMouseMove;
  const originalMouseOut = NodeClass.prototype.eventMouseOut;

  NodeClass.prototype.handleTooltipMouseOver = function (
    this: Class_NodeElement,
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    const show_tooltip = this.sankey.drawing_area.application_data.is_static && !event.shiftKey || event.altKey
    if (show_tooltip && (event.target as HTMLElement).tagName !== 'tspan') {
      const tooltipManager = TooltipEventManager.getInstance();
      tooltipManager.showTooltip(this, event.pageX, event.pageY);
    }
  };

  NodeClass.prototype.handleTooltipMouseMove = function (
    this: Class_NodeElement,
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // Pour les nœuds, on ne bouge pas le tooltip
    // Il reste fixe à sa position initiale
  };

  NodeClass.prototype.handleTooltipMouseOut = function (
    this: Class_NodeElement,
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // Ne rien faire - le tooltip reste ouvert jusqu'à un clic ou ESC
  };

  // Intégrer dans les événements existants
  NodeClass.prototype.eventMouseOver = function (
    this: Class_NodeElement,
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // Appeler l'événement original
    if (originalMouseOver) {
      originalMouseOver.call(this, event);
    }

    // Gérer les tooltips
    this.handleTooltipMouseOver(event);
  };

  NodeClass.prototype.eventMouseMove = function (
    this: Class_NodeElement,
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // Appeler l'événement original
    if (originalMouseMove) {
      originalMouseMove.call(this, event);
    }

    // Gérer les tooltips
    this.handleTooltipMouseMove(event);
  };

  NodeClass.prototype.eventMouseOut = function (
    this: Class_NodeElement,
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // Appeler l'événement original
    if (originalMouseOut) {
      originalMouseOut.call(this, event);
    }

    // Gérer les tooltips
    this.handleTooltipMouseOut(event);
  };
}

/**
 * Implémentation du mixin pour les liens
 */
export function implementTooltipForLink(LinkClass: typeof Class_LinkElement) {
  const originalMouseOver = LinkClass.prototype.eventMouseOver;
  const originalMouseMove = LinkClass.prototype.eventMouseMove;
  const originalMouseOut = LinkClass.prototype.eventMouseOut;

  LinkClass.prototype.handleTooltipMouseOver = function (
    this: Class_LinkElement,
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    const show_tooltip = this.sankey.drawing_area.application_data.is_static && !event.shiftKey || event.altKey
    if (show_tooltip) {
      const tooltipManager = TooltipEventManager.getInstance();

      // ✅ CHANGEMENT : Passer la position de la souris au LinkTooltip
      this._link_tooltip.mousePosition = { x: event.pageX, y: event.pageY };

      tooltipManager.showTooltip(this, event.pageX, event.pageY);
    }
  };

  LinkClass.prototype.handleTooltipMouseMove = function (
    this: Class_LinkElement,
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
  };

  LinkClass.prototype.handleTooltipMouseOut = function (
    this: Class_LinkElement,
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
  };

  // Intégrer dans les événements existants
  LinkClass.prototype.eventMouseOver = function (
    this: Class_LinkElement,
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    if (originalMouseOver) {
      originalMouseOver.call(this, event);
    }
    this.handleTooltipMouseOver(event);
  };

  LinkClass.prototype.eventMouseMove = function (
    this: Class_LinkElement,
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    if (originalMouseMove) {
      originalMouseMove.call(this, event);
    }
    this.handleTooltipMouseMove(event);
  };

  LinkClass.prototype.eventMouseOut = function (
    this: Class_LinkElement,
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    if (originalMouseOut) {
      originalMouseOut.call(this, event);
    }
    this.handleTooltipMouseOut(event);
  };
}

/**
 * Fonction d'initialisation à appeler au démarrage de l'application
 */
export function initializeTooltipSystem() {
  // Appliquer les mixins aux classes
  implementTooltipForNode(Class_NodeElement);
  implementTooltipForLink(Class_LinkElement);

  // Initialiser le gestionnaire
  TooltipEventManager.getInstance();

  console.log('Tooltip system initialized');
}

