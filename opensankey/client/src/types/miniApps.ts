// ==================================================================================================
// sa#671 — MINI-APPLIS : une porte spécialisée sur le même éditeur.
//
// Une mini-appli n'est pas un autre bundle : c'est l'application entière, servie à une adresse
// propre (`/sankeymatic/`, `/fr/crosstab/`…) qui dit ce que le visiteur vient faire. À cette
// adresse l'éditeur s'ouvre sans accueil, directement sur le dialogue de l'appli, et porte une
// pastille qui la nomme. Tout le reste de l'éditeur reste à portée de main.
//
// Ce module est le SEUL à connaître la liste : la page d'atterrissage (scripts/emit-lang-pages.js
// de sankeyapplication), les routes du serveur (server/views.py) et la mesure (usage_events.py)
// portent la même liste, à tenir ensemble — une adresse sans page, ou une page sans route, et
// la mini-appli n'existe pas.
// ==================================================================================================

export const MINI_APP_IDS = ['sankeymatic', 'crosstab'] as const
export type Type_MiniAppId = typeof MINI_APP_IDS[number]

// `/<appli>/` ou `/<langue>/<appli>/`, avec ou sans barre finale. Le segment de langue est
// celui des pages d'atterrissage (deux lettres) : un créneau versionné (`/v1.3.6/`) ne passe
// pas, et c'est voulu.
const RE_CHEMIN = /^\/(?:[a-z]{2}\/)?(sankeymatic|crosstab)\/?$/

export const miniAppFromPathname = (pathname: string): Type_MiniAppId | null => {
  const trouve = RE_CHEMIN.exec(pathname)
  return trouve ? trouve[1] as Type_MiniAppId : null
}

/** La mini-appli de la page courante, ou null dans l'éditeur ordinaire (et hors navigateur). */
export const currentMiniApp = (): Type_MiniAppId | null =>
  typeof window === 'undefined' ? null : miniAppFromPathname(window.location.pathname)
