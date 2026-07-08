// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

import { MutableRefObject, useEffect, useReducer } from 'react'

const NOOP = () => undefined

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
export function useModelBinding(
  slot?: MutableRefObject<() => void> | Array<MutableRefObject<() => void>>,
  subscribe?: (rerender: () => void) => (() => void) | void
): () => void {
  const [, forceRerender] = useReducer((x: number) => x + 1, 0)
  useEffect(() => {
    const slots = slot === undefined ? [] : (Array.isArray(slot) ? slot : [slot])
    slots.forEach(s => { s.current = forceRerender })
    const unsubscribe = subscribe?.(forceRerender)
    return () => {
      slots.forEach(s => { s.current = NOOP })
      if (typeof unsubscribe === 'function') unsubscribe()
    }
    // Slots (refs) et forceRerender ont une identité stable : on lie une seule fois au montage.
  }, [])
  return forceRerender
}
