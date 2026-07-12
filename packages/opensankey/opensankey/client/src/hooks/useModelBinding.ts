// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

import { MutableRefObject, useEffect, useReducer, useRef } from 'react'

const NOOP = () => undefined

// Les slots du modèle ne sont pas tous typés `() => void` : certains sont nullables, d'autres
// portent une signature plus large (ex. `Dispatch<SetStateAction<boolean>>` que le modèle appelle
// avec un argument, ignoré par un simple re-render). On paramètre donc le type du slot.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => any
type Slot<F extends AnyFn> = MutableRefObject<F> | MutableRefObject<F | null>
type Slots<F extends AnyFn> = Slot<F> | Array<Slot<F>>

/**
 * Lie durablement un handler à un/des slot(s) ref du modèle, pour toute la vie du composant.
 *
 * Le slot reçoit un wrapper d'identité stable qui appelle TOUJOURS la dernière version du handler :
 * on garde donc la sémantique du hack (`slot.current = handler` réassigné à chaque render, closure
 * fraîche sur les props) sans son défaut (slot laissé pendant après le démontage).
 *
 * À utiliser quand le handler fait autre chose que forcer un re-render (ex. re-synchroniser un
 * état local avant de rafraîchir) ; pour un simple re-render, préférer {@link useModelBinding}.
 */
export function useModelSlot<F extends AnyFn = () => void>(slot: Slots<F>, handler: F): void {
  const latest_handler = useRef(handler)
  latest_handler.current = handler
  useEffect(() => {
    const slots = Array.isArray(slot) ? slot : [slot]
    // Le wrapper délègue à la dernière version du handler : identité stable, closure fraîche.
    const bound = ((...args: Parameters<F>) => latest_handler.current(...args)) as F
    slots.forEach(s => { s.current = bound })
    return () => {
      // Ne relâcher que nos propres liaisons : un composant monté après nous a pu reprendre le slot.
      slots.forEach(s => { if (s.current === bound) s.current = NOOP as unknown as F })
    }
    // Slots (refs) ont une identité stable : on lie une seule fois au montage.
  }, [])
}

/**
 * #247 — Lie un composant React au modèle (hors-React) via un ou plusieurs « slots » ref pilotés
 * par lui. Remplace le hack répété ~60× :
 *
 *   const [, setCount] = useState(0)
 *   const refresh = () => setCount(a => a + 1)
 *   model.ref_to_x_updater.current = refresh          // assignation en render-body, sans cleanup
 *   useEffect(() => model.addMainZoneListener(refresh), [])
 *
 * par :
 *
 *   const refresh = useModelBinding(model.ref_to_x_updater,
 *     r => model.addMainZoneListener(r))
 *
 * Ce que le helper garantit et que le hack ne garantissait PAS :
 *  - un re-render forcé d'identité STABLE (useReducer) ;
 *  - le slot est **nettoyé au démontage** (remis à un no-op) : plus de ref périmée qui déclenche
 *    un setState sur un composant démonté (notifications perdues / warning React) ;
 *  - un abonnement optionnel (`subscribe`) désabonné au démontage.
 *
 * @param slot  un slot ref `MutableRefObject<() => void>` (ou un tableau de slots) que le modèle
 *              appelle pour forcer le re-render du composant. `undefined` pour un abonnement seul
 *              (cas `addMainZoneListener` sans slot ref propre).
 * @param subscribe  optionnel : reçoit la fonction de re-render, renvoie éventuellement une
 *              fonction de désabonnement (ex. valeur de retour d'`addMainZoneListener`).
 * @returns la fonction de re-render forcé (stable), utilisable pour un abonnement custom.
 */
export function useModelBinding<F extends AnyFn = () => void>(
  slot?: Slots<F>,
  subscribe?: (rerender: () => void) => (() => void) | void
): () => void {
  const [, forceRerender] = useReducer((x: number) => x + 1, 0)
  useEffect(() => {
    const slots = slot === undefined ? [] : (Array.isArray(slot) ? slot : [slot])
    // Le modèle peut appeler le slot avec des arguments (slots typés `Dispatch<…>`) : le re-render
    // les ignore, d'où le cast.
    const bound = forceRerender as unknown as F
    slots.forEach(s => { s.current = bound })
    const unsubscribe = subscribe?.(forceRerender)
    return () => {
      slots.forEach(s => { if (s.current === bound) s.current = NOOP as unknown as F })
      if (typeof unsubscribe === 'function') unsubscribe()
    }
    // Slots (refs) et forceRerender ont une identité stable : on lie une seule fois au montage.
  }, [])
  return forceRerender
}
