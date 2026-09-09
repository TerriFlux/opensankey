// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

/**
 * `OSTooltip` — habillage de l'infobulle Chakra, primitive d'interface PARTAGÉE.
 *
 * Extrait de `components/configmenus/MenuCommon.tsx` pour OS#1331. Motif : ce composant n'a rien de
 * l'atelier d'édition, c'est un habillage générique, et il était pourtant le symbole le plus importé
 * de la zone éditeur — 15 des 53 imports que les autres paquets font vers elle, et le SEUL que
 * `login-component` y prenait. La brique de licences se retrouvait donc à dépendre de l'UI
 * d'édition, ce qui lui aurait fait hériter d'une dépendance AGPL au moment du découpage en deux
 * paquets.
 *
 * `MenuCommon` le réexporte : les imports existants continuent de fonctionner.
 */

import React, { ReactNode } from 'react'
import { Tooltip } from '@chakra-ui/react'
import type { PlacementWithLogical } from '@chakra-ui/react'

/**
 * Désactive le rendu des infobulles dans un sous-arbre. Utilisé pour les panneaux détachés en
 * fenêtre PiP : les `Tooltip` Chakra reposent sur des écouteurs du `document` PRINCIPAL et ne
 * reçoivent jamais le `mouseleave` émis dans la fenêtre fille, d'où des infobulles « collantes »
 * impossibles à fermer. Dans ce contexte, `OSTooltip` rend simplement ses enfants sans habillage.
 */
export const OSTooltipDisabledContext = React.createContext(false)

// PIÈGE : ne JAMAIS mettre un `Switch`/`Checkbox` Chakra en enfant DIRECT d'OSTooltip.
// Chakra transmet la ref de ces composants à leur `<input>` visuellement caché, alors que
// Tooltip pose son écouteur natif `pointerleave` (et ancre le popper) sur cette ref :
// l'infobulle s'ouvre via le handler React posé sur le `<label>` mais ne se referme jamais.
// Toujours interposer un `Box`/`Td` (cf. Toolbar.tsx, SankeyPlusMenuConfigurationTags.tsx).

// sa#513 — plus de mode « toujours ouverte » : il servait à afficher, tant que la modale
// d'accueil était visible, cinq infobulles d'un coup (accueil, roue crantée, colonne
// d'outils, menu Nouveau, aide). À froid, un premier visiteur voyait une page cassée.
// Les descriptions vivent désormais DANS la modale d'accueil (SplashScreen.tsx).
export const OSTooltip = ({ label, disabled = false, delay = 500, placement = 'auto', children }: React.PropsWithChildren<{
  delay?: number,
  label: string,
  disabled?: boolean,
  placement?: PlacementWithLogical
  children: ReactNode
}>) => {
  const tooltips_disabled = React.useContext(OSTooltipDisabledContext)
  if (tooltips_disabled || label === undefined || label === null) {
    return <>{children}</>
  }
  const element_key = label.split(' ').join('_')
  return <Tooltip
    key={element_key}
    openDelay={delay}
    placement={placement}
    label={disabled ? label + '. MFASankey Dataviz required.' : label}
    closeDelay={100}
  >
    {children}
  </Tooltip>
}
