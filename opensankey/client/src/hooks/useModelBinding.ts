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
 *
 * @param deps  os#1385 (lot 2) — quand le MODÈLE change d'identité (le document ACTIF bascule),
 *              la liaison doit être refaite : l'ancien slot est relâché, le nouveau pris. Passer
 *              `[app_data]`. Vide (défaut) = comportement d'avant, une liaison au montage.
 */
export function useModelSlot<F extends AnyFn = () => void>(
  slot: Slots<F>,
  handler: F,
  deps: unknown[] = []
): void {
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
    // Les slots (refs) ont une identité stable : sans `deps`, on lie une seule fois au montage.
    // `deps` est une variable et non un littéral : c'est voulu (le tableau vient de l'appelant),
    // et c'est pourquoi la vérification des dépendances ne s'applique pas ici.
  }, deps)
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
 * @param deps  os#1385 (lot 2) — quand le MODÈLE change d'identité (le document ACTIF bascule),
 *              l'effet se rejoue : désabonnement de l'ancien bus et relâchement de l'ancien slot,
 *              puis liaison au nouveau. Passer `[app_data]` dès qu'un composant lit l'actif
 *              (`useActiveDocument`). Vide (défaut) = comportement d'avant, inchangé.
 * @returns la fonction de re-render forcé (stable), utilisable pour un abonnement custom.
 */
export function useModelBinding<F extends AnyFn = () => void>(
  slot?: Slots<F>,
  subscribe?: (rerender: () => void) => (() => void) | void,
  deps: unknown[] = []
): () => void {
  // `subscribe` est recréée à chaque rendu (closure sur les props) : la lire par une ref évite
  // de faire de l'effet un abonné/désabonné à chaque frame, tout en gardant la closure fraîche
  // au moment où l'effet se rejoue vraiment (changement de `deps`).
  const latest_subscribe = useRef(subscribe)
  latest_subscribe.current = subscribe
  const [, forceRerender] = useReducer((x: number) => x + 1, 0)
  useEffect(() => {
    const slots = slot === undefined ? [] : (Array.isArray(slot) ? slot : [slot])
    // Le modèle peut appeler le slot avec des arguments (slots typés `Dispatch<…>`) : le re-render
    // les ignore, d'où le cast.
    const bound = forceRerender as unknown as F
    slots.forEach(s => { s.current = bound })
    const unsubscribe = latest_subscribe.current?.(forceRerender)
    return () => {
      slots.forEach(s => { if (s.current === bound) s.current = NOOP as unknown as F })
      if (typeof unsubscribe === 'function') unsubscribe()
    }
    // Slots (refs) et forceRerender ont une identité stable : sans `deps`, on lie une seule
    // fois au montage. `deps` est une variable et non un littéral (le tableau vient de
    // l'appelant) : la vérification des dépendances ne s'applique pas ici.
  }, deps)
  return forceRerender
}
