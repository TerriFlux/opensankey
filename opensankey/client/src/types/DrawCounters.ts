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
// Références mesurées au chargement de « [SOCLE] Céréales - 2015 » (380 nœuds, 4 050 flux dont
// 1 823 tracés), page publiée, avant les lots du jalon 80 : 2 passes, 1 823 dessins de flux, et
// 1 823 éventails de pointes — un par dessin de flux, 72 pour le pire nœud dans une seule passe.
// Après os#1373 et os#1374 : 183 éventails, 1 par nœud et par passe, chargement -42 %.
// Reste 2 passes là où une suffirait : c'est os#1375.
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
  /**
   * os#1375 — Qui a déclenché chaque passe, dans l'ordre. Une pile d'appel compacte par passe.
   *
   * Se compter est une chose, savoir QUI appelle en est une autre : c'est ce qui a permis
   * d'attribuer les dessins de flux à `updateLinksPositions` plutôt qu'au rendu. Le coût
   * (`new Error().stack`) est ici négligeable — deux ou trois passes par geste — alors qu'il
   * fausse tout dès qu'on le paie par dessin de flux : la sonde d'os#1372 le payait 18 230 fois
   * et ses durées ont dû être retirées.
   */
  pass_origins: string[]
  /**
   * os#1375 — Dessins de flux et eventails de chaque passe, dans l ordre. Deux passes ne coutent
   * pas forcement la meme chose : une passe sur un diagramme encore vide est gratuite, et la
   * supprimer ne gagnerait rien. Le total seul ne le dit pas.
   */
  draws_per_pass: number[]
  fans_per_pass: number[]
  /**
   * os#1377 — Dessins de flux qui n'ont lieu DANS AUCUNE passe (`depth === 0`), et par qui.
   *
   * `draws_per_pass` ne les voit pas — ils sont jetés à la fermeture de passe — et
   * `link_draws` les compte sans dire d'où ils viennent : au chargement de CARTOFOB, 230 des
   * 441 dessins de flux étaient dans ce cas, donc hors de portée de la séparation
   * ancres/tracé d'os#1373, qui n'opère qu'à l'intérieur de `drawElements`.
   *
   * La pile est capturée au plus `MAX_OUT_OF_PASS_CAPTURES` fois : c'est le même arbitrage que
   * `pass_origins` — gratuit tant que le cas est rare (l'état sain en compte zéro), borné
   * quand il ne l'est pas. Le COMPTE, lui, reste exact.
   */
  out_of_pass_draws: number
  /** Origines des dessins hors passe, de la plus fréquente à la moins fréquente. */
  out_of_pass_origins: [string, number][]
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
  /** os#1375 — Pile d'appel compacte de chaque passe, dans l'ordre. Plafonnée, cf. MAX_ORIGINS. */
  pass_origins: [] as string[],
  /** os#1375 — Ce qu'a coûté chaque passe fermée, dans l'ordre. */
  draws_per_pass: [] as number[],
  fans_per_pass: [] as number[],
  /** Compteurs de la passe COURANTE. */
  draws_in_pass: 0,
  fans_in_pass: 0,
  /**
   * Vrai entre l ouverture d une passe et sa fermeture. `closeCurrentPass` est appelé aussi bien
   * à l ouverture d une passe (pour replier la précédente) qu à sa fermeture : sans ce drapeau,
   * on enregistrerait une passe vide sur deux.
   */
  pass_open: false,
  /** os#1377 — Dessins de flux hors de toute passe, et par qui (cf. le rapport). */
  out_of_pass_draws: 0,
  out_of_pass_origins: new Map<string, number>(),
  out_of_pass_captures: 0,
}

/**
 * Au-delà, on cesse d'enregistrer les origines : une mesure qui part en boucle ne doit pas
 * remplir la mémoire. Le compteur `passes`, lui, continue de compter.
 */
const MAX_ORIGINS = 50

/**
 * os#1377 — Même arbitrage pour les dessins hors passe, à ceci près qu'ils se comptent par
 * CENTAINES là où les passes se comptent sur les doigts : le plafond borne le nombre de piles
 * capturées, jamais le compte.
 */
const MAX_OUT_OF_PASS_CAPTURES = 200

/**
 * Pile d'appel compacte : les cadres utiles, sans les chemins de fichier.
 *
 * `frames` : combien de cadres retenir. Huit suffisent à nommer l'origine d'une passe ; un
 * dessin hors passe en demande davantage — les siens partent d'un accesseur d'attribut ou
 * d'une boucle de placement, et le nom qui explique le dessin est plus haut (os#1377).
 */
function callSite(frames: number = 8): string {
  // V8 ne CONSERVE que 10 cadres par défaut : en demander davantage sans lever ce plafond
  // laisse la pile tronquée sans le dire — piège vécu, les premières captures d'os#1377
  // s'arrêtaient juste avant le nom qui explique le dessin (`setScaleAdaptedMode`). Levé le
  // temps de la capture, restauré ensuite ; ailleurs qu'en V8, la propriété n'existe pas et
  // la comparaison est fausse, donc rien ne bouge.
  const previous_limit = Error.stackTraceLimit
  try {
    if (frames + 3 > previous_limit) Error.stackTraceLimit = frames + 3
    return (new Error().stack || '')
      .split('\n')
      .slice(3, 3 + frames)
      .map(l => l.trim().replace(/^at /, '').replace(/ \(.*$/, '').replace(/^.*[\\/]/, ''))
      .filter(l => l.length > 0)
      .join(' < ')
  } catch {
    return '(pile indisponible)'
  } finally {
    Error.stackTraceLimit = previous_limit
  }
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
  state.pass_origins = []
  state.draws_per_pass = []
  state.fans_per_pass = []
  state.draws_in_pass = 0
  state.fans_in_pass = 0
  state.pass_open = false
  state.out_of_pass_draws = 0
  state.out_of_pass_origins.clear()
  state.out_of_pass_captures = 0
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
  if (state.pass_open) {
    state.draws_per_pass.push(state.draws_in_pass)
    state.fans_per_pass.push(state.fans_in_pass)
  }
  state.pass_open = false
  state.draws_in_pass = 0
  state.fans_in_pass = 0
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
    if (state.pass_origins.length < MAX_ORIGINS) state.pass_origins.push(callSite())
    state.pass_open = true
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
  state.draws_in_pass++
  state.per_link.set(link_id, (state.per_link.get(link_id) ?? 0) + 1)
  // os#1377 — hors de toute passe : ni `draws_per_pass` ni les lots d'os#1373 ne le voient.
  if (state.depth === 0) {
    state.out_of_pass_draws++
    if (state.out_of_pass_captures < MAX_OUT_OF_PASS_CAPTURES) {
      state.out_of_pass_captures++
      const site = callSite(16)
      state.out_of_pass_origins.set(site, (state.out_of_pass_origins.get(site) ?? 0) + 1)
    }
  }
}

/**
 * os#1374 — Compte un recalcul d'éventail de pointes. Appelé par
 * `Class_NodeElement.drawLinksArrow`, qui repose les pointes de TOUS les flux d'un côté : c'est
 * l'unité de travail à ne pas refaire, pas le dessin d'une pointe isolée.
 */
export function countArrowFan(node_id: string): void {
  if (!state.enabled) return
  state.arrow_fans++
  state.fans_in_pass++
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
    pass_origins: [...state.pass_origins],
    draws_per_pass: state.pass_open
      ? [...state.draws_per_pass, state.draws_in_pass] : [...state.draws_per_pass],
    fans_per_pass: state.pass_open
      ? [...state.fans_per_pass, state.fans_in_pass] : [...state.fans_per_pass],
    out_of_pass_draws: state.out_of_pass_draws,
    out_of_pass_origins: [...state.out_of_pass_origins.entries()].sort((a, b) => b[1] - a[1]),
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
