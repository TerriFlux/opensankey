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

  const open = useCallback(async ({ width = 480, height = 640, title = '' }: Type_PipOptions = {}) => {
    let win: Window | null = null
    const dpip = (window as unknown as { documentPictureInPicture?: { requestWindow: (o: { width: number, height: number }) => Promise<Window> } }).documentPictureInPicture
    if (dpip && dpip.requestWindow) {
      win = await dpip.requestWindow({ width, height })
    } else {
      win = window.open('', '', `popup,width=${width},height=${height}`)
    }
    if (!win) return
    win.document.title = title
    // Réinitialise les marges par défaut du body de la fenêtre fille et lui donne 100% de hauteur.
    win.document.documentElement.style.height = '100%'
    win.document.body.style.margin = '0'
    win.document.body.style.height = '100%'
    const onPageHide = () => {
      if (closingRef.current) return
      setPipWindow(null)
    }
    win.addEventListener('pagehide', onPageHide)
    setPipWindow(win)
  }, [])

  const close = useCallback(() => {
    setPipWindow((win) => {
      if (win) {
        closingRef.current = true
        win.close()
        closingRef.current = false
      }
      return null
    })
  }, [])

  // Ferme la fenêtre si le composant hôte est démonté (changement de diagramme, etc.).
  useEffect(() => () => {
    setPipWindow((win) => { win?.close(); return null })
  }, [])

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
