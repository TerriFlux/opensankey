// JETONS DE L'INTERFACE — les valeurs que le chrome (panneaux, légende, lecteur, frise, figures
// d'analyse) partage, NOMMÉES une fois pour toutes.
//
// POURQUOI. L'audit du 09/10/2026 a compté SEPT langages visuels dans l'interface : le thème Chakra
// (`Theme.tsx`), le DOM pur des figures et du lecteur (`figureNavigationTable.ts`, `NodeStatsCharts.ts`,
// `SunburstChart.ts`…) qui recopie les gris de Chakra en hexadécimal, les panneaux de présentation
// en style inline (viewer MIT, sans thème), la frise de l'éditeur avec ses propres constantes, etc.
// Aucun ne partageait de jeton : le même gris était écrit à la main en minuscules ici, en majuscules
// là, et la moindre retouche de teinte devenait une chasse au littéral. Ce module est l'étape 1 de la
// convergence : il NOMME les valeurs ACTUELLES, sans en changer aucune — rien ne bouge à l'écran.
//
// RÈGLES.
//  - FEUILLE : aucun import. Le viewer MIT, l'éditeur, les figures en DOM pur et le thème Chakra
//    peuvent tous l'importer sans traverser la frontière viewer/éditeur (`architectureBoundary`).
//  - Les valeurs sont celles du code d'avant (les gris de Chakra : gray.800 = #1a202c, gray.700 =
//    #2d3748…). Changer une valeur ici est un choix de design, pas un nettoyage.
//  - Le contenu du diagramme (couleurs choisies par l'auteur : éléments, palettes, thèmes de
//    diagramme, persistance) n'est PAS de l'interface et n'utilise pas ces jetons.
//  - Le cliquet `scripts/check_ui_colors.mjs` interdit d'ajouter un littéral hexadécimal dans les
//    fichiers d'interface : on passe par un jeton.

// --- Encres (texte et traits du chrome) -------------------------------------------------------
/** Encre forte : titres, texte des listes déroulantes (Chakra gray.800). */
export const ui_ink_strong = '#1a2330'
/** Encre courante du texte de l'interface (Chakra gray.700). */
export const ui_ink = '#2d3748'
/** Encre secondaire : libellés de second rang, contours de commandes (Chakra gray.600). */
export const ui_ink_secondary = '#4a5768'
/** Encre atténuée : légendes d'axes, indications, valeurs annexes (Chakra gray.500). */
export const ui_ink_muted = '#718096'
/** Encre désactivée ou décochée (Chakra gray.400). */
export const ui_ink_disabled = '#a0aec0'

// --- Filets (bordures, séparateurs) -------------------------------------------------------------
/** Filet discret : séparateurs de sections (Chakra gray.200). */
export const ui_line = '#dde3ea'
/** Filet fort : contours de commandes, cases décochées (Chakra gray.300). */
export const ui_line_strong = '#cbd5e0'

// --- Fonds ---------------------------------------------------------------------------------------
/** Blanc : fond des panneaux, encre sur fond foncé. */
export const ui_white = '#ffffff'
/** Fond très doux : en-têtes de panneau, survol de légende (Chakra gray.50). */
export const ui_bg_subtle = '#f7fafc'
/** Fond doux : survol de liste, pastilles, pistes (Chakra gray.100). */
export const ui_bg_muted = '#edf2f7'
/** Fond « choisi » ou survolé, dans la teinte de l'accent (Chakra blue.50). */
export const ui_bg_selected = '#e2f1f2'

// --- Accent et états -----------------------------------------------------------------------------
/** L'accent UNIQUE « choisi / actif » du chrome (Chakra blue.700). */
// Charte TerriFlux (sa#655) : accent = bleu-vert du site (terriflux-site/src/styles/global.css).
export const ui_accent = '#127c81'
/** Danger, erreur (Chakra red.700). */
export const ui_danger = '#c53030'

// --- Texte ---------------------------------------------------------------------------------------
/** Petit texte : niveaux, indications sous les commandes. */
export const ui_text_small = '11px'
/** Texte courant des panneaux et du lecteur. */
export const ui_text = '12px'
/** Grand texte : listes déroulantes, titres de panneau. */
export const ui_text_large = '14px'
/** Pile de polices du chrome (celle de `body` dans `css/main.css`). */
export const ui_font_stack = 'system-ui, sans-serif'
/** Police des titres du thème Chakra (`textStyles.h1…h4`). */
export const ui_font_heading = 'system-ui, sans-serif'

// --- Formes ----------------------------------------------------------------------------------------
/** Rayon des petites commandes (boutons au trait du lecteur et de la frise). */
export const ui_radius_small = '3px'
/** Rayon des cadres et boutons du thème. */
export const ui_radius = '6px'
/** Hauteur UNIQUE des commandes du thème (selects, inputs, boutons xs — #1258). */
export const ui_control_height = '1.5rem'
/** Hauteur des commandes compactes (boutons de la frise). */
export const ui_control_height_compact = '1.4rem'

/**
 * Les mêmes jetons en un objet SÉRIALISABLE (JSON pur) : pour les poser en variables CSS ou les
 * embarquer dans une page publiée sans dépendre du code.
 */
export const ui_tokens = {
  color: {
    ink_strong: ui_ink_strong,
    ink: ui_ink,
    ink_secondary: ui_ink_secondary,
    ink_muted: ui_ink_muted,
    ink_disabled: ui_ink_disabled,
    line: ui_line,
    line_strong: ui_line_strong,
    white: ui_white,
    bg_subtle: ui_bg_subtle,
    bg_muted: ui_bg_muted,
    bg_selected: ui_bg_selected,
    accent: ui_accent,
    danger: ui_danger
  },
  text: {
    small: ui_text_small,
    normal: ui_text,
    large: ui_text_large
  },
  font: {
    stack: ui_font_stack,
    heading: ui_font_heading
  },
  radius: {
    small: ui_radius_small,
    normal: ui_radius
  },
  control_height: {
    normal: ui_control_height,
    compact: ui_control_height_compact
  }
} as const

export type Type_UiTokens = typeof ui_tokens
