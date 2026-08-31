// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1376 (jalon 80) — Compteurs de dessin : combien de PASSES de dessin, et combien de fois
// chaque flux est tracé DANS une passe.
//
// Pourquoi ces deux-là et pas un chronomètre : toute la mesure d'os#1372 a montré que la durée
// ment (la médiane de la machine dérive de 30 % entre deux sessions — le même changement y a
// « prouvé » -31 %, +16 % et +36 %), alors que le nombre de dessins, lui, est un entier
// reproductible. C'est le compteur qui a permis de trier cinq optimisations « évidentes »
// mesurées à zéro, et de démasquer trois sondes gagnantes qui gagnaient en RETIRANT du contenu.
//
// Références mesurées au chargement de « [SOCLE] Céréales - 2015 » (380 nœuds, 4 050 flux) :
// 3 passes, 18 230 dessins de flux pour 1 823 flux affichés, soit DIX dessins par flux.
// La cible du jalon 80 est un dessin par flux et par passe (os#1373, os#1374).
//
// Coût quand les compteurs sont éteints — l'état par défaut — : une lecture de booléen par
// dessin de flux, rien d'autre. Aucune allocation, aucune pile d'appel.

/** Ce que rapportent les compteurs, une fois la mesure arrêtée. */
export type Type_DrawCountersReport = {
  /** Passes de dessin de premier niveau (`Class_DrawingArea.drawElements`). */
  passes: number
  /** Dessins de flux, toutes passes confondues (`Class_LinkElement.drawElements`). */
  link_draws: number
  /** Le pire des flux : nombre de fois qu'il a été tracé dans une seule passe. */
  max_draws_per_link: number
  /** Identifiants des flux tracés plus d'une fois dans une même passe, du pire au moins pire. */
  links_drawn_twice: string[]
  /** os#1374 — Éventails de pointes recalculés (`Class_NodeElement.drawLinksArrow`). */
  arrow_fans: number
  /** Le pire des nœuds : nombre de fois que son éventail a été recalculé dans une seule passe. */
  max_fans_per_node: number
}

/**
 * État de la mesure. Un objet littéral et non une instance de classe : ce module est publié
 * dans `@terriflux/opensankey`, et un appel exécutable au premier niveau d'un module ESM fait
 * basculer webpack 5 en `javascript/dynamic` chez les consommateurs externes (cf. l'incident
 * `initializeTooltipSystem` d'open-sankey 1.1.0).
 */
const state = {
  enabled: false,
  passes: 0,
  link_draws: 0,
  max_draws_per_link: 0,
  /** Profondeur de `drawElements` : une passe imbriquée ne compte pas pour une passe de plus. */
  depth: 0,
  /** Dessins par flux dans la passe COURANTE. Vidée à chaque nouvelle passe de premier niveau. */
  per_link: new Map<string, number>(),
  /** Pire compte par flux, toutes passes confondues. Ne retient que les flux tracés 2 fois ou plus. */
  repeated: new Map<string, number>(),
  /** os#1374 — Éventails de pointes recalculés, toutes passes confondues. */
  arrow_fans: 0,
  /** Éventails par nœud dans la passe COURANTE. */
  per_node_fans: new Map<string, number>(),
  max_fans_per_node: 0,
}

/** Démarre (ou redémarre) la mesure en repartant de zéro. */
export function startDrawCounters(): void {
  state.enabled = true
  state.passes = 0
  state.link_draws = 0
  state.max_draws_per_link = 0
  state.depth = 0
  state.per_link.clear()
  state.repeated.clear()
  state.arrow_fans = 0
  state.per_node_fans.clear()
  state.max_fans_per_node = 0
}

/** Arrête la mesure. Le rapport reste lisible après l'arrêt. */
export function stopDrawCounters(): void {
  closeCurrentPass()
  state.enabled = false
  state.depth = 0
}

/** Vrai tant que la mesure tourne. */
export function areDrawCountersEnabled(): boolean {
  return state.enabled
}

/**
 * Range les comptes de la passe qui s'achève dans les maxima, puis vide l'ardoise. Le compte
 * PAR PASSE est ce qui nous intéresse : un flux tracé une fois dans chacune des trois passes
 * est normal (trois passes, c'est le sujet d'os#1375) ; tracé trois fois dans UNE passe, c'est
 * du travail refait (le sujet d'os#1373).
 */
function closeCurrentPass(): void {
  state.per_link.forEach((count, id) => {
    if (count > state.max_draws_per_link) state.max_draws_per_link = count
    if (count < 2) return
    const worst = state.repeated.get(id) ?? 0
    if (count > worst) state.repeated.set(id, count)
  })
  state.per_link.clear()
  state.per_node_fans.forEach(count => {
    if (count > state.max_fans_per_node) state.max_fans_per_node = count
  })
  state.per_node_fans.clear()
}

/**
 * Ouvre une passe de dessin. Appelé par `Class_DrawingArea.drawElements`, qui DOIT appeler
 * `endDrawPass` en regard — un `try/finally`, parce qu'une passe qui jette laisserait la
 * profondeur en l'air et fausserait tout le reste de la mesure.
 */
export function beginDrawPass(): void {
  if (!state.enabled) return
  if (state.depth === 0) {
    closeCurrentPass()
    state.passes++
  }
  state.depth++
}

/** Ferme la passe ouverte par `beginDrawPass`. */
export function endDrawPass(): void {
  if (!state.enabled) return
  state.depth = Math.max(0, state.depth - 1)
  if (state.depth === 0) closeCurrentPass()
}

/** Compte un dessin de flux. Appelé par `Class_LinkElement.drawElements`. */
export function countLinkDraw(link_id: string): void {
  if (!state.enabled) return
  state.link_draws++
  state.per_link.set(link_id, (state.per_link.get(link_id) ?? 0) + 1)
}

/**
 * os#1374 — Compte un recalcul d'éventail de pointes. Appelé par
 * `Class_NodeElement.drawLinksArrow`, qui repose les pointes de TOUS les flux d'un côté : c'est
 * l'unité de travail à ne pas refaire, pas le dessin d'une pointe isolée.
 */
export function countArrowFan(node_id: string): void {
  if (!state.enabled) return
  state.arrow_fans++
  state.per_node_fans.set(node_id, (state.per_node_fans.get(node_id) ?? 0) + 1)
}

/** Photographie des compteurs, passe courante incluse. Ne remet rien à zéro. */
export function drawCountersReport(): Type_DrawCountersReport {
  // La passe en cours (s'il y en a une) doit entrer dans le rapport, sinon lire les compteurs
  // depuis la console au milieu d'un dessin ne montrerait que les passes précédentes.
  let max = state.max_draws_per_link
  const repeated = new Map(state.repeated)
  state.per_link.forEach((count, id) => {
    if (count > max) max = count
    if (count >= 2 && count > (repeated.get(id) ?? 0)) repeated.set(id, count)
  })
  let max_fans = state.max_fans_per_node
  state.per_node_fans.forEach(count => { if (count > max_fans) max_fans = count })
  return {
    passes: state.passes,
    link_draws: state.link_draws,
    max_draws_per_link: max,
    links_drawn_twice: [...repeated.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id),
    arrow_fans: state.arrow_fans,
    max_fans_per_node: max_fans,
  }
}

/**
 * Pose les compteurs sur `window.sankey_draw_counters`, pour mesurer une bascule ou un
 * chargement depuis la console sans reconstruire de bundle instrumenté (ce qu'il a fallu faire
 * pendant tout os#1372) :
 *
 *   sankey_draw_counters.start(); // ... geste à mesurer ...
 *   sankey_draw_counters.report()
 *
 * Appelé depuis le constructeur de `Class_ApplicationData` — jamais au premier niveau du module,
 * cf. le commentaire de `state`. Sans condition de licence : l'objet ne fait rien tant que
 * `start()` n'a pas été appelé, et un outil de mesure qu'il faut une licence pour obtenir est un
 * outil qu'on n'a pas le jour où on en a besoin.
 */
export function exposeDrawCounters(): void {
  if (typeof window === 'undefined') return
  const w = window as unknown as { sankey_draw_counters?: unknown }
  if (w.sankey_draw_counters !== undefined) return
  w.sankey_draw_counters = {
    start: startDrawCounters,
    stop: stopDrawCounters,
    report: drawCountersReport,
  }
}
