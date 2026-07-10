// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
//
// Catalogue des thèmes proposés à l'utilisateur.
//
// Ce module est séparé de `types/Theme.ts` pour rompre un cycle : le parseur
// SankeyMATIC importe `Theme` (pour construire le thème d'un fichier importé), donc
// `Theme` ne peut pas importer le parseur (pour construire le thème par défaut).
// Le registre, lui, dépend des deux.

import { Class_Theme, themeOpenSankey, themeStan } from './Theme'
import { buildSankeymaticTheme } from '../Persistence/sankeymaticParser'

export interface Type_ThemeChoice {
  id: string
  /** Clé i18next du libellé. */
  label_key: string
  build: () => Class_Theme
}

export const AVAILABLE_THEMES: readonly Type_ThemeChoice[] = [
  {
    id: 'opensankey',
    label_key: 'Menu.theme.opensankey',
    build: themeOpenSankey,
  },
  {
    id: 'sankeymatic',
    label_key: 'Menu.theme.sankeymatic',
    // `outside-in`, le vrai défaut de SankeyMATIC, dépend des étages et n'est donc
    // pas une règle vivante (cf. NOTE-THEMES.md). Un thème appliqué à la volée ne
    // peut pas le calculer : on retient `source`, la variante la plus proche.
    build: () => new Class_Theme(buildSankeymaticTheme(undefined, 'source')),
  },
  {
    id: 'stan',
    label_key: 'Menu.theme.stan',
    // Bascule manuelle seulement : les diagrammes importés depuis un fichier STAN
    // reçoivent ce thème directement du serveur (stan_smfa._stan_theme).
    build: themeStan,
  },
]

export const themeById = (id: string): Class_Theme => {
  const choice = AVAILABLE_THEMES.find(t => t.id === id)
  return choice ? choice.build() : themeOpenSankey()
}
