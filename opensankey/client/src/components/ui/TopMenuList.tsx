import React from 'react'
import { MenuList, MenuListProps, Portal } from '@chakra-ui/react'

/**
 * os#1387 (10/09/2026) — LE DÉROULANT D'UN MENU DE LA BARRE DU HAUT, PORTÉ DANS `document.body`.
 *
 * Constaté à l'écran : le menu de la fenêtre principale s'ouvrait SOUS la fenêtre Couronne de la
 * colonne droite. Ce n'était pas une valeur de z-index trop basse — le déroulant en portait déjà
 * une très haute — mais un CONTEXTE D'EMPILEMENT : toute la barre du haut vit dans un
 * `position: fixed; zIndex: 1` (cf. le retour de MenuTop), et un z-index ne classe jamais qu'à
 * l'intérieur du contexte qui le contient. Le déroulant, si haut soit-il, restait donc empilé
 * AVEC la barre, à la hauteur 1 — sous les cadres de fenêtres de la grande zone (`zIndex: 20`,
 * cf. MainZoneTabs) et sous leurs poignées (25).
 *
 * Le `Portal` sort le déroulant de ce contexte et le rend directement dans `document.body`, où
 * son z-index se compare enfin à ceux des fenêtres. La valeur retenue est celle que le menu
 * portait déjà : au-dessus des cadres (20), des poignées (25) et de la colonne d'outils (35),
 * et sous les modales de Chakra (1400+), qui doivent continuer à le recouvrir.
 *
 * À utiliser pour TOUT déroulant de la barre du haut : le défaut n'a rien de propre à un menu,
 * il tient au seul endroit où ils sont tous rendus.
 *
 * 14/09/2026 — DESCENDU DANS OS DE BASE, depuis MenuTop (couche éditeur), parce que la barre du
 * haut n'est pas peuplée par la seule couche éditeur : le menu AFM d'OS+ est resté un `MenuList`
 * nu pendant que tous les autres recevaient leur portail, et il passait donc sous le tableur.
 * Une phrase de commentaire ne suffisait visiblement pas à le faire appliquer partout — un
 * composant importable, si. Ne remettez pas de `MenuList` nu dans la barre du haut : le z-index
 * que vous lui donnerez, si grand soit-il, n'y changera rien.
 */
export const TOPBAR_MENU_Z = 1600

export const TopMenuList = ({ children, ...props }: MenuListProps) =>
  <Portal><MenuList zIndex={TOPBAR_MENU_Z} {...props}>{children}</MenuList></Portal>
