export class TooltipBehaviorManager {
  private tooltip: HTMLElement
  private escHandler: (e: KeyboardEvent) => void
  private protectTooltip: (e: Event) => void
  private onClose: () => void // ✅ AJOUTÉ : Sauvegarder le callback

  // Drag par l'en-tête
  private dragHeader: HTMLElement | null = null
  private dragMouseDown: ((e: MouseEvent) => void) | null = null
  private dragMouseMove: ((e: MouseEvent) => void) | null = null
  private dragMouseUp: (() => void) | null = null

  constructor(tooltip: HTMLElement, onClose: () => void) {
    this.tooltip = tooltip
    this.escHandler = this.createEscHandler(onClose)
    this.protectTooltip = this.createProtectionHandler()
    this.onClose = onClose // ✅ AJOUTÉ : Sauvegarder le callback
  }

  public initialize() {
    this.setupCloseButton()
    this.setupPinButton()
    this.setupDrag()
    this.setupKeyboardHandlers()
    this.setupProtection()
    this.setupScrollBehavior()
    this.setupFocus()
  }

  /**
   * Bouton épingle : toggle la classe 'pinned' sur le tooltip. Quand épinglé,
   * TooltipEventManager n'arme plus le timer d'auto-fermeture au survol.
   */
  private setupPinButton() {
    const header = this.tooltip.querySelector('.tooltip-header') as HTMLElement
    if (!header || header.querySelector('.tooltip-pin')) return

    const pin = document.createElement('button')
    pin.className = 'tooltip-pin'
    pin.type = 'button'
    pin.title = 'Épingler (garder le tooltip ouvert)'
    pin.setAttribute('aria-label', 'Épingler le tooltip')
    pin.innerHTML = '<svg viewBox="0 0 384 512" width="13" height="13" aria-hidden="true">'
      + '<path fill="currentColor" d="M32 32C32 14.3 46.3 0 64 0L320 0c17.7 0 32 14.3 32 32s-14.3 '
      + '32-32 32l0 6.1c0 14.3 5.7 28 15.8 38.1L391.2 159c10.8 10.8 16.8 25.4 16.8 40.7l0 17.3c0 '
      + '17.7-14.3 32-32 32l-144 0 0 96 0 96c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-96 0-96L24 256C6.3 '
      + '256 0 241.7 0 224l0-17.3c0-15.3 6-29.9 16.8-40.7l55.4-50.8C82.3 104.2 88 90.5 88 76.2L88 '
      + '64C70.3 64 56 49.7 56 32z"/></svg>'
    pin.onclick = (e) => {
      e.preventDefault()
      e.stopPropagation()
      const pinned = this.tooltip.classList.toggle('pinned')
      pin.classList.toggle('active', pinned)
      pin.title = pinned ? 'Désépingler' : 'Épingler (garder le tooltip ouvert)'
    }
    header.appendChild(pin)
  }

  /**
   * Rend le tooltip déplaçable en glissant l'en-tête. Démarrer un drag épingle
   * automatiquement le tooltip (sinon il se fermerait en cours de déplacement).
   */
  private setupDrag() {
    const header = this.tooltip.querySelector('.tooltip-header') as HTMLElement
    if (!header) return
    header.classList.add('tooltip-draggable')

    let dragging = false
    let startX = 0, startY = 0, startLeft = 0, startTop = 0

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging) return
      this.tooltip.style.left = (startLeft + (e.clientX - startX)) + 'px'
      this.tooltip.style.top = (startTop + (e.clientY - startY)) + 'px'
    }
    const onMouseUp = () => {
      dragging = false
      document.removeEventListener('mousemove', onMouseMove, true)
      document.removeEventListener('mouseup', onMouseUp, true)
    }
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Pas de drag depuis les boutons / onglets de l'en-tête
      if (target.closest('.tooltip-close') || target.closest('.tooltip-pin') || target.closest('.tab-button')) return
      dragging = true
      // Épingle automatiquement le tooltip pendant/après le déplacement
      this.tooltip.classList.add('pinned')
      const pin = this.tooltip.querySelector('.tooltip-pin') as HTMLElement | null
      if (pin) { pin.classList.add('active'); pin.title = 'Désépingler' }
      const rect = this.tooltip.getBoundingClientRect()
      startX = e.clientX; startY = e.clientY
      startLeft = rect.left; startTop = rect.top
      e.preventDefault()
      document.addEventListener('mousemove', onMouseMove, true)
      document.addEventListener('mouseup', onMouseUp, true)
    }

    header.addEventListener('mousedown', onMouseDown)
    this.dragHeader = header
    this.dragMouseDown = onMouseDown
    this.dragMouseMove = onMouseMove
    this.dragMouseUp = onMouseUp
  }

  private createEscHandler(onClose: () => void) {
    return (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        this.cleanup()
      }
    }
  }

  private createProtectionHandler() {
    return (e: Event) => {
      const target = e.target as HTMLElement
      if (this.tooltip.contains(target)) {
        return // Laisser l'événement normal dans le tooltip
      }

      const rect = this.tooltip.getBoundingClientRect()
      const safeZone = {
        left: rect.left - 20,
        right: rect.right + 20,
        top: rect.top - 20,
        bottom: rect.bottom + 20
      }

      const mouseEvent = e as MouseEvent
      if (mouseEvent.clientX >= safeZone.left && mouseEvent.clientX <= safeZone.right &&
        mouseEvent.clientY >= safeZone.top && mouseEvent.clientY <= safeZone.bottom) {
        e.stopPropagation()
      }
    }
  }

  private setupCloseButton() {
    const closeBtn = this.tooltip.querySelector('.tooltip-close') as HTMLElement
    if (closeBtn) {
      closeBtn.onclick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        this.onClose()
      }
    }
  }

  private setupKeyboardHandlers() {
    document.addEventListener('keydown', this.escHandler)
  }

  private setupProtection() {
    ['click', 'mousedown', 'mouseup'].forEach(eventType => {
      document.addEventListener(eventType, this.protectTooltip, true)
    })
  }

  private setupScrollBehavior() {
    setTimeout(() => {
      const content = this.tooltip.querySelector('.tooltip-content') as HTMLElement
      if (content) {
        content.style.pointerEvents = 'auto'
        content.style.touchAction = 'auto'

        content.addEventListener('wheel', (e) => {
          if (e.shiftKey || content.scrollWidth > content.clientWidth) {
            e.preventDefault()
            content.scrollLeft += e.deltaY > 0 ? 50 : -50
          }
        })
      }
    }, 100)
  }

  private setupFocus() {
    const forceFocus = () => {
      this.tooltip.focus()
    }

    forceFocus()
    setTimeout(forceFocus, 50)
    setTimeout(forceFocus, 100)
  }

  public cleanup() {
    document.removeEventListener('keydown', this.escHandler);
    ['click', 'mousedown', 'mouseup'].forEach(eventType => {
      document.removeEventListener(eventType, this.protectTooltip, true)
    })
    // Drag listeners
    if (this.dragHeader && this.dragMouseDown) {
      this.dragHeader.removeEventListener('mousedown', this.dragMouseDown)
    }
    if (this.dragMouseMove) document.removeEventListener('mousemove', this.dragMouseMove, true)
    if (this.dragMouseUp) document.removeEventListener('mouseup', this.dragMouseUp, true)
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
    display: flex;
    flex-direction: column;
    width: max-content;
    min-width: 300px;
    max-width: 90vw;
    min-height: 120px;
    max-height: 90vh;
    z-index: 10000;
    /* overflow != visible requis pour que res:both s'applique ; déplaçable par
       l'en-tête + redimensionnable par la poignée du coin bas-droit. */
    overflow: hidden;
    resize: both;
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
    /* flex:1 + min-height:0 => la zone scrollable occupe la place restante et
       suit la hauteur du tooltip quand on le redimensionne. */
    flex: 1 1 auto;
    min-height: 0;
    overflow: auto !important;
    padding: 12px 0;
    position: relative;
  }
  .tooltip-table {
    width: auto; 
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
  /* En-tête déplaçable : curseur move, sauf sur les boutons/onglets */
  .tooltip-header.tooltip-draggable {
    cursor: move;
    user-select: none;
  }
  .tooltip-header.tooltip-draggable .tooltip-close,
  .tooltip-header.tooltip-draggable .tooltip-pin,
  .tooltip-header.tooltip-draggable .tab-button {
    cursor: pointer;
  }
  /* Bouton épingle (à gauche du bouton fermer) */
  .tooltip-pin {
    position: absolute;
    top: 8px;
    right: 44px;
    background: none;
    border: none;
    cursor: pointer;
    color: #999;
    padding: 4px;
    border-radius: 4px;
    z-index: 10001;
    pointer-events: auto;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    transform: rotate(45deg);
  }
  .tooltip-pin:hover {
    background: #f0f0f0;
    color: #333;
  }
  .tooltip-pin.active {
    color: #4a9eff;
    transform: rotate(0deg);
  }
  .tooltip-pin:focus {
    outline: 2px solid #4a9eff;
    outline-offset: 2px;
  }
`