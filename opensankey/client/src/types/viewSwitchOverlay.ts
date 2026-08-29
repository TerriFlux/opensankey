/**
 * os#1368 — L'indicateur de changement de vue, en DOM pur.
 *
 * Pourquoi pas un composant React/Chakra : le diagramme lui-même n'est PAS du React (D3 écrit
 * directement dans `#sankey_app`), et le changement de vue est déclenché depuis quatre coquilles
 * différentes — éditeur, viewer OpenSankey, viewer SaaS, page publiée. Un voile posé sur le
 * conteneur du dessin les couvre TOUTES avec une seule implémentation, sans nouveau point de
 * montage à ne pas oublier, et reste testable (aucune suite jest du dépôt ne charge Chakra).
 *
 * Le voile est `pointer-events: none` À DESSEIN : s'il fuyait malgré le `finally` de
 * `Class_ViewSwitchProgress`, il ne laisserait qu'un artefact visuel — jamais une interface morte.
 */

import type { Type_ViewSwitchIndicator } from './viewSwitchProgress'

export const VIEW_SWITCH_OVERLAY_ID = 'os_view_switch_overlay'
const VIEW_SWITCH_OVERLAY_STYLE_ID = 'os_view_switch_overlay_style'
const SPIN_KEYFRAMES = 'os_view_switch_spin'

/** Couleur du sillon animé : `primaire.2` du thème (cf. css/Theme.tsx). */
const SPINNER_COLOR = '#78A7C2'

/** Injecte (une seule fois) les keyframes de rotation : une animation CSS ne coûte rien au thread. */
const ensureStyle = (doc: Document): void => {
  if (doc.getElementById(VIEW_SWITCH_OVERLAY_STYLE_ID)) return
  const style = doc.createElement('style')
  style.id = VIEW_SWITCH_OVERLAY_STYLE_ID
  style.textContent =
    `@keyframes ${SPIN_KEYFRAMES}{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`
  doc.head.appendChild(style)
}

/**
 * Cadre le voile sur le conteneur du dessin. `position: fixed` sur le rectangle mesuré plutôt que
 * `position: absolute` dans le conteneur : cela évite de toucher au `position` de l'hôte (que
 * l'embarqueur maîtrise). Repli plein écran si le conteneur n'a pas encore de géométrie.
 */
const frameOn = (overlay: HTMLElement, container: Element | null): void => {
  const rect = container?.getBoundingClientRect()
  if (rect && rect.width > 0 && rect.height > 0) {
    overlay.style.top = `${rect.top}px`
    overlay.style.left = `${rect.left}px`
    overlay.style.width = `${rect.width}px`
    overlay.style.height = `${rect.height}px`
  } else {
    overlay.style.inset = '0'
  }
}

/**
 * Fabrique un indicateur qui pose un voile + un sillon animé au-dessus du conteneur du dessin.
 *
 * @param resolveContainer relit le conteneur À CHAQUE affichage : la drawing area est REMPLACÉE au
 * cours du switch (cf. `replaceDrawingArea`), un élément capturé une fois serait périmé.
 */
export const createViewSwitchOverlay = (
  resolveContainer: () => Element | null
): Type_ViewSwitchIndicator => ({

  show: () => {
    if (typeof document === 'undefined') return
    const doc = document
    // Idempotent : deux `show` sans `hide` ne laissent jamais deux voiles.
    doc.getElementById(VIEW_SWITCH_OVERLAY_ID)?.remove()
    ensureStyle(doc)

    const overlay = doc.createElement('div')
    overlay.id = VIEW_SWITCH_OVERLAY_ID
    overlay.setAttribute('role', 'status')
    overlay.setAttribute('aria-live', 'polite')
    overlay.setAttribute('aria-busy', 'true')
    overlay.style.cssText = [
      'position:fixed',
      'z-index:2000',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'pointer-events:none',
      'background:rgba(255,255,255,0.55)',
    ].join(';')
    frameOn(overlay, resolveContainer())

    const spinner = doc.createElement('div')
    spinner.style.cssText = [
      'width:52px',
      'height:52px',
      'border-radius:50%',
      'border:5px solid rgba(120,167,194,0.25)',
      `border-top-color:${SPINNER_COLOR}`,
      `animation:${SPIN_KEYFRAMES} 0.8s linear infinite`,
    ].join(';')
    overlay.appendChild(spinner)

    doc.body.appendChild(overlay)
  },

  hide: () => {
    if (typeof document === 'undefined') return
    document.getElementById(VIEW_SWITCH_OVERLAY_ID)?.remove()
  },
})
