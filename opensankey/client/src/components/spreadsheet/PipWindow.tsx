// ==================================================================================================
// The MIT License (MIT) - Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Mécanisme générique pour « détacher » un panneau React dans une fenêtre SYSTÈME séparée
// (hors du navigateur, déplaçable sur un second écran), puis le ré-attacher.
//
// - Privilégie la Document Picture-in-Picture API (`window.documentPictureInPicture`, Chromium) qui
//   ouvre une vraie fenêtre OS sans chrome de navigateur ; repli sur `window.open(..., 'popup')`.
// - Le contenu reste un sous-arbre React LIVE : on rend les enfants dans le `document` de la fenêtre
//   fille via `createPortal`. État, contextes (ApplicationData…) et write-back sont donc identiques
//   au panneau ancré — aucune duplication de modèle.
// - Les styles du document principal (Chakra/emotion, KaTeX, CSS globale) sont recopiés dans la
//   fenêtre fille à l'ouverture, et les feuilles AJOUTÉES ensuite (mode dev d'emotion, <link> lazy)
//   sont suivies par un MutationObserver.
//
// Limites connues (premier jet) :
// - Les `<Portal>` Chakra (menus déroulants) visent le `document.body` PRINCIPAL : un menu ouvert
//   depuis la fenêtre détachée s'affiche dans la fenêtre principale. Le rendu de base (éditeur +
//   aperçu) est, lui, entièrement dans la fenêtre fille.
// - En build production, emotion insère ses règles via `insertRule` dans une feuille existante
//   (non observable) ; le snapshot recopié à l'ouverture couvre les styles déjà générés (le panneau
//   ayant été affiché ancré au préalable, l'essentiel existe déjà).
// ==================================================================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

type Type_PipOptions = { width?: number, height?: number, title?: string }

// Le navigateur n'autorise qu'UNE fenêtre Document Picture-in-Picture par document à la fois :
// ouvrir une 2e fenêtre PiP ferme la 1re. Pour que deux panneaux (doc + config) puissent être
// détachés SIMULTANÉMENT, on suit ici l'occupation du « créneau PiP » au niveau module : le premier
// panneau détaché prend le créneau PiP (sans chrome), le second bascule sur window.open (popup).
let dpipSlotTaken = false

// Recopie toutes les feuilles de style du document source vers le document cible. Renvoie une
// fonction de nettoyage qui débranche le MutationObserver installé pour les feuilles ajoutées après.
const syncStyles = (target: Document): (() => void) => {
  const src = document

  // Recopie une feuille de style : on lit ses `cssRules` (capture les styles emotion générés au
  // runtime, même quand le <style> n'a pas de texte) ; en cas de feuille cross-origin illisible, on
  // se rabat sur un <link> vers sa source.
  const copySheet = (sheet: CSSStyleSheet) => {
    try {
      const rules = Array.from(sheet.cssRules).map((r) => r.cssText).join('\n')
      const style = target.createElement('style')
      style.textContent = rules
      const emotionKey = (sheet.ownerNode as HTMLElement | null)?.getAttribute?.('data-emotion')
      if (emotionKey) style.setAttribute('data-emotion', emotionKey)
      target.head.appendChild(style)
    } catch {
      if (sheet.href) {
        const link = target.createElement('link')
        link.rel = 'stylesheet'
        link.href = sheet.href
        target.head.appendChild(link)
      }
    }
  }

  Array.from(src.styleSheets).forEach((s) => copySheet(s as CSSStyleSheet))

  // Suit les feuilles AJOUTÉES après l'ouverture (emotion en dev ajoute un <style> par insertion,
  // KaTeX/autres CSS peuvent arriver via <link>).
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      m.addedNodes.forEach((node) => {
        const el = node as HTMLElement
        if (el.tagName === 'STYLE' && (el as HTMLStyleElement).sheet) {
          copySheet((el as HTMLStyleElement).sheet as CSSStyleSheet)
        } else if (el.tagName === 'LINK' && (el as HTMLLinkElement).rel === 'stylesheet') {
          target.head.appendChild(el.cloneNode(true))
        }
      })
    })
  })
  observer.observe(src.head, { childList: true })

  return () => observer.disconnect()
}

/**
 * Gère le cycle de vie d'une fenêtre détachée. `open()` DOIT être appelée depuis un geste
 * utilisateur (clic) — la Document PiP API exige une activation transitoire. La fermeture par
 * l'utilisateur (croix de la fenêtre) repasse `pipWindow` à `null` (ré-attachement).
 */
export const usePipWindow = () => {
  const [pipWindow, setPipWindow] = useState<Window | null>(null)
  // Évite une fermeture récursive (close() -> pagehide -> setPipWindow -> ...).
  const closingRef = useRef(false)
  // Mémorise si CETTE instance occupe le créneau Document-PiP (vs un simple window.open), pour le
  // libérer à la fermeture et permettre au prochain détachement de réutiliser le PiP.
  const usedDpipRef = useRef(false)

  const releaseDpipSlot = useCallback(() => {
    if (usedDpipRef.current) {
      dpipSlotTaken = false
      usedDpipRef.current = false
    }
  }, [])

  const open = useCallback(async ({ width = 480, height = 640, title = '' }: Type_PipOptions = {}) => {
    let win: Window | null = null
    const dpip = (window as unknown as { documentPictureInPicture?: { requestWindow: (o: { width: number, height: number }) => Promise<Window> } }).documentPictureInPicture
    // PiP seulement si l'API existe ET que le créneau unique n'est pas déjà pris par un autre panneau.
    if (dpip && dpip.requestWindow && !dpipSlotTaken) {
      win = await dpip.requestWindow({ width, height })
      if (win) {
        dpipSlotTaken = true
        usedDpipRef.current = true
      }
    } else {
      // Repli : Document PiP indisponible (ex. contexte non-HTTPS) OU créneau PiP déjà occupé par un
      // autre panneau détaché. `popup` ouvre une fenêtre minimale ; on désactive le reste du chrome
      // pour masquer au maximum la barre d'adresse / barres d'outils (les navigateurs récents ignorent
      // certains de ces drapeaux, mais `popup` suffit généralement à retirer la barre d'adresse sur
      // Chromium). Plusieurs fenêtres window.open peuvent coexister, contrairement au PiP.
      win = window.open('', '', `popup=yes,location=no,toolbar=no,menubar=no,status=no,scrollbars=no,resizable=yes,width=${width},height=${height}`)
      usedDpipRef.current = false
    }
    if (!win) return
    win.document.title = title
    // Réinitialise les marges par défaut du body de la fenêtre fille et lui donne 100% de hauteur.
    win.document.documentElement.style.height = '100%'
    win.document.body.style.margin = '0'
    win.document.body.style.height = '100%'
    const onPageHide = () => {
      if (closingRef.current) return
      releaseDpipSlot()
      setPipWindow(null)
    }
    win.addEventListener('pagehide', onPageHide)
    setPipWindow(win)
  }, [releaseDpipSlot])

  const close = useCallback(() => {
    setPipWindow((win) => {
      if (win) {
        closingRef.current = true
        win.close()
        closingRef.current = false
      }
      releaseDpipSlot()
      return null
    })
  }, [releaseDpipSlot])

  // Ferme la fenêtre si le composant hôte est démonté (changement de diagramme, etc.).
  useEffect(() => () => {
    setPipWindow((win) => { win?.close(); return null })
    releaseDpipSlot()
  }, [releaseDpipSlot])

  return { pipWindow, open, close }
}

/**
 * Rend `children` dans le `document` de la fenêtre détachée. Recopie les styles une fois la fenêtre
 * disponible. À utiliser conjointement avec `usePipWindow`.
 */
export const PipPortal = (
  { pipWindow, children }: { pipWindow: Window, children: ReactNode }
) => {
  const [container, setContainer] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const host = pipWindow.document.createElement('div')
    // Taille en PIXELS explicite (pas height:100%) : dans une fenêtre popup (about:blank, Firefox),
    // la chaîne height:100% ne se résout pas toujours -> conteneur de hauteur 0, donc un tableur
    // Univer mesuré à 0×0 et invisible. On colle le host à la taille de la fenêtre fille et on la
    // met à jour à chaque resize de celle-ci.
    const applySize = () => {
      host.style.width = pipWindow.innerWidth + 'px'
      host.style.height = pipWindow.innerHeight + 'px'
    }
    host.style.overflow = 'hidden'
    applySize()
    pipWindow.document.body.appendChild(host)
    pipWindow.addEventListener('resize', applySize)
    const cleanupStyles = syncStyles(pipWindow.document)
    setContainer(host)
    return () => {
      pipWindow.removeEventListener('resize', applySize)
      cleanupStyles()
      if (host.parentNode) host.parentNode.removeChild(host)
    }
  }, [pipWindow])

  if (!container) return null
  return createPortal(children, container)
}
