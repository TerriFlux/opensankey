export class TooltipBehaviorManager {
  private tooltip: HTMLElement;
  private escHandler: (e: KeyboardEvent) => void;
  private protectTooltip: (e: Event) => void;
  private onClose: () => void; // ✅ AJOUTÉ : Sauvegarder le callback

  constructor(tooltip: HTMLElement, onClose: () => void) {
    this.tooltip = tooltip;
    this.escHandler = this.createEscHandler(onClose);
    this.protectTooltip = this.createProtectionHandler();
    this.onClose = onClose; // ✅ AJOUTÉ : Sauvegarder le callback
  }

  public initialize() {
    this.setupCloseButton();
    this.setupKeyboardHandlers();
    this.setupProtection();
    this.setupScrollBehavior();
    this.setupFocus();
  }

  private createEscHandler(onClose: () => void) {
    return (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        this.cleanup();
      }
    };
  }

  private createProtectionHandler() {
    return (e: Event) => {
      const target = e.target as HTMLElement;
      if (this.tooltip.contains(target)) {
        return; // Laisser l'événement normal dans le tooltip
      }

      const rect = this.tooltip.getBoundingClientRect();
      const safeZone = {
        left: rect.left - 20,
        right: rect.right + 20,
        top: rect.top - 20,
        bottom: rect.bottom + 20
      };

      const mouseEvent = e as MouseEvent;
      if (mouseEvent.clientX >= safeZone.left && mouseEvent.clientX <= safeZone.right &&
        mouseEvent.clientY >= safeZone.top && mouseEvent.clientY <= safeZone.bottom) {
        e.stopPropagation();
      }
    };
  }

  private setupCloseButton() {
    const closeBtn = this.tooltip.querySelector('.tooltip-close') as HTMLElement;
    if (closeBtn) {
      closeBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.onClose();
      };
    }
  }

  private setupKeyboardHandlers() {
    document.addEventListener('keydown', this.escHandler);
  }

  private setupProtection() {
    ['click', 'mousedown', 'mouseup'].forEach(eventType => {
      document.addEventListener(eventType, this.protectTooltip, true);
    });
  }

  private setupScrollBehavior() {
    setTimeout(() => {
      const content = this.tooltip.querySelector('.tooltip-content') as HTMLElement;
      if (content) {
        content.style.pointerEvents = 'auto';
        content.style.touchAction = 'auto';

        content.addEventListener('wheel', (e) => {
          if (e.shiftKey || content.scrollWidth > content.clientWidth) {
            e.preventDefault();
            content.scrollLeft += e.deltaY > 0 ? 50 : -50;
          }
        });
      }
    }, 100);
  }

  private setupFocus() {
    const forceFocus = () => {
      this.tooltip.focus();
    };

    forceFocus();
    setTimeout(forceFocus, 50);
    setTimeout(forceFocus, 100);
  }

  public cleanup() {
    document.removeEventListener('keydown', this.escHandler);
    ['click', 'mousedown', 'mouseup'].forEach(eventType => {
      document.removeEventListener(eventType, this.protectTooltip, true);
    });
  }
}


export const TOOLTIP_STYLES = `
  .sankey-tooltip {
    position: fixed !important;
    background: white;
    border: 2px solid #333;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 12px;
    width: 800px;
    max-width: 90vw;
    max-height: 80vh;
    z-index: 10000;
    overflow: visible;
    outline: none;
  }
  .sankey-tooltip:focus {
    outline: 3px solid #4a9eff; 
    outline-offset: 2px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15), inset 0 0 0 2px #4a9eff;
  }
  .tooltip-header {
    padding: 12px 16px 8px 16px;
    border-bottom: 1px solid #eee; 
    background: #fafafa;
    position: sticky; 
    top: 0; 
    z-index: 1;
  }
  .tooltip-title { 
    margin: 0 0 4px 0; 
    font-size: 14px; 
    font-weight: 600; 
    color: #333; 
  }
  .tooltip-subtitle { 
    margin: 0 0 8px 0; 
    color: #666; 
    font-size: 11px; 
  }
  .tooltip-content { 
    max-height: 400px; 
    overflow: auto !important; 
    padding: 12px 0; 
    position: relative; 
  }
  .tooltip-table {
    width: 100%; 
    border-collapse: collapse; 
    font-size: 11px;
    table-layout: fixed; /* un seul tableau => alignement naturel */
  }
  .tooltip-table td.value,
  .tooltip-table td.ratio,
  .tooltip-table th.value,
  .tooltip-table th.ratio {
    text-align: right !important;
  }
  .tooltip-table th {
    background: #f9f9f9; 
    font-weight: 600; 
    padding: 5px 5px !important;
    text-align: center; 
    border-bottom: 2px solid #ddd; 
    border-right: 1px solid #d0d0d0;
    position: sticky; 
    top: var(--sticky-top, 0px); 
    z-index: 1;
    width: 100px; 
    /* ✅ AJOUTÉ : Permettre le retour à la ligne dans les headers */
    white-space: normal;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  .tooltip-table th:first-child {
    position: sticky; 
    left: 0; 
    z-index: 3; 
    background: #f9f9f9;
    box-shadow: 2px 0 4px rgba(0,0,0,0.1); 
    /* ✅ MODIFIÉ : Largeur fixe plus raisonnable */
    width: 140px; 
    max-width: 140px;
  }
  .tooltip-table td {
    padding: 8px 18px; 
    border-bottom: 1px solid #f0f0f0; 
    border-right: 1px solid #e8e8e8; 
    background: white;
    
    /* ✅ AJOUTÉ : Permettre le retour à la ligne dans toutes les cellules */
    white-space: normal;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  .tooltip-table td:first-child {
    position: sticky; 
    left: 0; 
    z-index: 2; 
    background: white;
    box-shadow: 2px 0 4px rgba(0,0,0,0.05); 
    font-weight: 500;
    /* ✅ MODIFIÉ : Largeur fixe identique au header */
    width: 140px; 
    max-width: 140px;
    text-align: left !important;
    /* ✅ AJOUTÉ : Styles spécifiques pour la première colonne */
    white-space: normal !important;
    word-wrap: break-word;
    overflow-wrap: break-word;
    line-height: 1.3;
    vertical-align: top;
  }
  .tooltip-table tr:hover td { 
    background: #fafafa; 
  }
  .tooltip-table tr:hover td:first-child { 
    background: #f5f5f5; 
  }
  .total-row td { 
    font-weight: 600; 
    border-top: 2px solid #ddd; 
    background: #f8f8f8 !important; 
  }
  .total-row td:first-child { 
    background: #f0f0f0 !important; 
  }
  .section-header td {
    padding: 6px 12px; 
    font-weight: 600; 
    color: #333;
    background: linear-gradient(90deg, #f0f8ff 0%, #e6f3ff 100%);
    border-left: 3px solid #4a9eff; 
    border-right: 0; 
    border-top: 0; 
    border-bottom: 1px solid #e0e0e0;
    position: sticky; 
    left: 0; 
    z-index: 2;
    /* ✅ AJOUTÉ : Permettre le retour à la ligne dans les headers de section */
    white-space: normal;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  /* Scrollbar custom */
  .tooltip-content::-webkit-scrollbar { 
    width: 8px; 
    height: 8px; 
  }
  .tooltip-content::-webkit-scrollbar-track { 
    background: #f1f1f1; 
    border-radius: 4px; 
  }
  .tooltip-content::-webkit-scrollbar-thumb { 
    background: #c1c1c1; 
    border-radius: 4px; 
  }
  .tooltip-content::-webkit-scrollbar-thumb:hover { 
    background: #a8a8a8; 
  }
  .tooltip-close {
    position: absolute;
    top: 8px;
    right: 8px;
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: #666;
    padding: 4px;
    border-radius: 4px;
    /* ✅ AJOUT : S'assurer que le bouton est au-dessus de tout */
    z-index: 10001;
    pointer-events: auto;
    /* ✅ AJOUT : Styles pour améliorer la visibilité */
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }
  .tooltip-close:hover {
    background: #f0f0f0;
    color: #333;
  }
  /* ✅ AJOUT : Focus pour l'accessibilité */
  .tooltip-close:focus {
    outline: 2px solid #4a9eff;
    outline-offset: 2px;
  }
`;