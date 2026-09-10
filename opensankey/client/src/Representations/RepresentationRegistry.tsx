// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction.
// ==================================================================================================
// Author        : TerriFlux
// ==================================================================================================

// OS#1361 (D0) — REGISTRE DES REPRÉSENTATIONS.
//
// Le modèle (NOTE-ANATOMIE-ETUDE.md) pose la représentation comme un AXE du
// contrôleur : la même sélection de données, rendue autrement. Le code la
// câblait une par une, et confondait deux échelles que le modèle distingue —
// celle du DIAGRAMME entier (Sankey, Tableur, Doc, Sankey unitaire) et celle
// d'UN ÉLÉMENT (couronne, barres, unitaire d'un nœud). D'où ce registre.
//
// ---------------------------------------------------------------------------
// AJOUTER UNE REPRÉSENTATION
// ---------------------------------------------------------------------------
// Deux fichiers, jamais plus : le vôtre (le rendu) et l'appel d'enregistrement.
// Aucun `switch` à compléter ailleurs — c'est la recette de l'issue.
//
//  1. Écrire le rendu. La forme normale est IMPÉRATIVE : `draw(container, ctx)`
//     dessine dans un conteneur DOM (d3, canvas, ce que vous voulez). C'est ce
//     qu'attendent les hôtes (pop-up d'élément, grande zone) et ce dont ont
//     besoin camembert / histogramme / sunburst. À l'échelle DIAGRAMME, une
//     entrée `draw` devient un OCCUPANT de la grande zone comme le tableur :
//     elle reçoit un cadre, une place, et peut être détachée dans sa fenêtre.
//     La variante `host` dit qu'une représentation possède DÉJÀ son rendu et
//     que le registre ne fait que la nommer : 'canvas' pour le SVG du diagramme,
//     'component' pour un panneau React fourni par la couche éditeur (tableur,
//     doc), 'external' pour un contenu porté hors de l'arbre et positionné sur
//     le cadre qu'on lui réserve (Sankey unitaire d'OS+). N'inventez pas une
//     quatrième forme : si ça se dessine dans un conteneur, c'est `draw`.
//
//  1bis. CE QUE `draw` REND — et quand fournir `redraw`.
//     Trois retours sont légaux, du plus simple au plus complet :
//       - `void`             : rien à défaire (rare).
//       - `() => void`       : la fonction de DÉMONTAGE, et c'est tout.
//       - `{ redraw?, cleanup? }` : le démontage ET un redessin sur place.
//
//     Fournissez `redraw` dès que la représentation dépend d'un axe du
//     contrôleur qu'elle ne surveille pas elle-même : dataTag, niveau
//     d'agrégation, couche de données, changement de vue. Ces changements ne
//     touchent NI la taille du conteneur NI l'identité de l'entrée — l'hôte n'a
//     donc aucune raison de vous démonter, et sans `redraw` il ne pourrait
//     rafraîchir vos chiffres qu'en détruisant puis recréant votre dessin (ce
//     qui perd l'état interne : survol, secteur ouvert, animation en cours).
//     Le patron : isolez votre `draw()` interne et rendez-la comme `redraw`.
//
//     Le simple démontage suffit quand la représentation ne lit rien qui puisse
//     changer sans qu'elle soit remontée, ou quand elle surveille déjà elle-même
//     ce dont elle dépend — un ResizeObserver interne, par exemple, n'a pas
//     besoin de `redraw` : le REDIMENSIONNEMENT reste l'affaire de la
//     représentation, `redraw` est l'affaire des DONNÉES.
//
//     Ne pas fournir `redraw` reste parfaitement légal : l'hôte remontera
//     l'entrée, comme il le fait aujourd'hui.
//
//  2. `representation_registry.register({ ... })` depuis une fonction
//     `registerXxxRepresentations()` appelée par la couche (OS, OS+, SA) —
//     JAMAIS au niveau module : un effet de bord d'import se déclenche à
//     l'importation d'un type et casse le hot reload. L'enregistrement est
//     idempotent PAR ID : une couche supérieure peut donc remplacer une entrée
//     de base sans que l'ordre des imports compte.
//
//  3. Déclarer, dans l'entrée :
//     - `scale`   : 'diagram' ou 'element'. Le modèle ne les mélange jamais.
//     - `needs`   : ce que la représentation exige du diagramme pour avoir un
//                   sens (`hierarchy` pour un sunburst, `geography` pour une
//                   carte). Le registre l'évalue via `diagramCapabilities` et
//                   masque l'entrée quand le diagramme ne l'offre pas — plutôt
//                   qu'un bouton qui dessine du vide.
//     - `isAvailable` : le refus FIN, sur CE contexte (« ce flux n'a pas de
//                   descripteur d'analyse »). `needs` parle du diagramme,
//                   `isAvailable` du sujet.
//     - `publish_option` : la clé booléenne de `PublishOptions` qui l'offre —
//                   ou non — au lecteur d'une page publiée.
//     - `renderOptions` : les réglages propres à la représentation, édités par
//                   l'auteur. Le registre ne les lit jamais : il les transporte.
//
//  4. Les ids sont NAMESPACÉS par couche ('os.repr.*', 'osp.repr.*') et stables :
//     `PublishOptions.representations` les cite, donc une page publiée les
//     contient. On ne les renomme pas.

import React from 'react'

import type { Class_ApplicationData } from '../types/ApplicationData'
import type { PublishOptions } from '../types/PublishOptions'
import type { Type_Presentable } from '../components/panels/presentation/openPresentation'
// os#1393 - le clic droit dans une représentation. `attachRepresentationContextMenu` est la
// SEULE valeur importée d'ici ; le module d'en face, lui, ne prend de ce fichier que des TYPES
// (donc effacés à la compilation) : pas de cycle à l'exécution.
import {
  attachRepresentationContextMenu,
  type Type_RepresentationMenu,
  type Type_RepresentationTarget
} from './RepresentationContextMenu'
// os#1399 - la cible partagée par les trois familles de commandes. Import de TYPE seulement :
// `WindowTarget` lit les types d'ici, ce fichier lit les siens, et rien de tout cela ne survit à
// la compilation - aucun cycle à l'exécution.
import type { Type_ElementTargetResolver } from './WindowTarget'
// os#1416 - la portée d'un réglage de figure. Import de TYPE seulement, et dans ce sens-là
// uniquement : `MenuConfig` ne connaît pas le registre, la portée vit auprès de la liste des
// réglages liés au sujet, qui est ce qui la borne.
import type { Type_RepresentationOptionScope } from '../types/MenuConfig'
// os#1418 - ce qu'une nature DÉCLARE de ses réglages (cf. `attributes` plus bas). Import de TYPE
// seulement : `Figure` ne connaît pas le registre, et le registre ne fait que transporter la
// déclaration - il ne l'interprète jamais lui-même.
import type { Type_AttributeSort, Type_FigureAttributesConfig } from './Figure'
// os#1425 — le formulaire générique, rendu depuis la déclaration d'une nature. Import VALEUR :
// c'est le `renderOptions` par défaut de toute entrée qui déclare des attributs sans en écrire un.
import { FigureAttributesForm } from './FigureAttributesForm'

/**
 * Les deux échelles que le code confondait (§3.2 de la note). Une entrée en
 * choisit UNE : rien n'est « les deux à la fois », le sujet n'est pas le même.
 */
export type Type_RepresentationScale = 'diagram' | 'element'

/**
 * Ce qu'une représentation EXIGE du diagramme. Déclaratif : le registre le
 * confronte à `diagramCapabilities` et écarte l'entrée sans que la
 * représentation ait à se défendre elle-même.
 */
export type Type_RepresentationNeeds = {
  /** Une hiérarchie de nœuds (dimensions parent/enfant, ou niveaux). Sunburst. */
  hierarchy?: boolean
  /** Des coordonnées géographiques portées par les nœuds. Carte. */
  geography?: boolean
}

/** Ce que le diagramme courant sait offrir, mesuré une fois par appel de liste. */
export type Type_RepresentationCapabilities = {
  hierarchy: boolean
  geography: boolean
}

/**
 * os#1409 - LE ZOOM, capacite DECLAREE par la nature, au meme titre que `renderOptions` ou
 * `contextMenu`.
 *
 * Le controle de la colonne d'outils etait cable EN DUR sur `app_data.drawing_area` : il ne
 * zoomait que le diagramme, quelle que soit la fenetre regardee, pendant que la grille portait
 * le sien en bas. Une commande unique en apparence, qui ne servait qu'une seule vue, doublee
 * d'une autre dans la vue voisine. La bascule est celle du selecteur de nature (os#1399) : le
 * controle vise la FENETRE ACTIVE, et c'est la nature de celle-ci qui dit comment on y zoome.
 *
 * QUATRE CHOSES A DIRE, et rien de plus : lire l'echelle, la poser, le pas, les bornes.
 *
 * 100 % NE VEUT PAS DIRE LA MEME CHOSE PARTOUT. Pour le diagramme c'est l'echelle d'une page
 * vide (k = 1) ; pour la grille c'est le ratio 1 d'Univer. Chaque nature nomme son echelle
 * NEUTRE (`neutral`) ; le controle affiche un pourcentage rapporte a elle, il n'en impose pas
 * la definition.
 *
 * LE CONTRAT DE L'INDICATEUR : le controle s'abonne a `ZOOM_TOPIC` pour suivre le zoom en
 * direct (molette comprise). Une nature dont l'echelle peut changer SANS passer par `setScale`
 * (une molette sur la grille, une molette sur le dessin) doit donc notifier `ZOOM_TOPIC` sur
 * son propre canal - le diagramme le fait depuis toujours dans `DrawingArea`, la grille le fait
 * depuis l'evenement de zoom d'Univer. Sans cela l'indicateur resterait fige sur la derniere
 * valeur posee par les boutons, en mentant sur ce que montre l'ecran.
 */
export type Type_RepresentationZoom = {
  /** L'echelle courante, dans l'unite de CETTE nature (cf. `neutral`). */
  getScale: (ctx: Type_RepresentationContext) => number
  /** Pose une echelle ABSOLUE. Libre a la nature de la borner elle-meme. */
  setScale: (scale: number, ctx: Type_RepresentationContext) => void
  /**
   * Multiplier l'echelle en UN geste, quand la nature sait le faire mieux que la composition
   * `getScale` x facteur -> `setScale`. Le diagramme le declare : son `zoomByFactor` passe par
   * `zoomListener.scaleBy`, qui lit le transform EN COURS D'ANIMATION la ou `getScale` ne lit
   * que le transform deja pose - deux clics rapides sur « + » n'en perdraient un sinon. Absent,
   * le controle compose, ce qui suffit partout ailleurs.
   */
  scaleBy?: (factor: number, ctx: Type_RepresentationContext) => void
  /** Facteur multiplicatif d'un cran des boutons -/+. Defaut : DEFAULT_ZOOM_STEP. */
  step?: number
  /** Bornes de l'echelle. Le controle s'y tient ; la nature reste libre de re-borner. */
  min?: number
  max?: number
  /** L'echelle NEUTRE, celle que le pourcentage prend pour 100 %. Defaut : 1. */
  neutral?: number
  /**
   * Refus FIN : la nature sait zoomer, mais pas maintenant. La grille ne le peut que pendant
   * que son composant est monte - sinon il n'y a personne a qui parler, et le controle se grise
   * en le disant plutot que d'avaler les clics.
   */
  isAvailable?: (ctx: Type_RepresentationContext) => boolean
}

/** Ce qu'une représentation reçoit en entrée. */
export type Type_RepresentationContext = {
  app_data: Class_ApplicationData
  /** Échelle sous laquelle on la demande — celle de l'entrée. */
  scale: Type_RepresentationScale
  /** Sujet à l'échelle ÉLÉMENT ; `null` à l'échelle diagramme. */
  element: Type_Presentable | null
  /** Réglages composés par l'auteur, opaques au registre. */
  options: { [key: string]: unknown }
  /**
   * os#1393 - LA FENÊTRE de la grande zone qui montre cette représentation, quand c'en est une.
   *
   * Absent partout ailleurs : la pop-up de présentation monte les mêmes entrées sans fenêtre,
   * et une entrée de menu qui agit sur SA fenêtre (« épingler ce nœud comme sujet ») n'a alors
   * rien à viser - elle ne se propose donc pas, plutôt que d'agir sur une fenêtre au hasard.
   * C'est l'identité que l'hôte possède déjà (`Type_MainZoneOccupant.id`) ; on ne fait que la
   * transmettre, les gestes de fenêtre restant ceux de `Class_MenuConfig`.
   */
  window_id?: string
  /**
   * os#1422 (lot 6) - LA VIGNETTE, complément indispensable de `window_id`.
   *
   * Une fenêtre d'élément en porte N — une figure par objet regardé — et tout ce qui désigne une
   * figure MONTÉE le fait par le couple (fenêtre, vignette) : les réglages
   * (`mainZonePaneOptionsOf`), la figure (`figureOf`), et depuis ce lot l'annuaire des documents
   * déclarés (`Class_Workspace.bindWindowDocument`). Une représentation qui monte un DOCUMENT —
   * l'étoile unitaire, seule aujourd'hui — doit pouvoir dire lequel des deux est le sien ; la
   * clé ne se déduit pas de l'élément (une liste épinglée peut porter deux fois le même nœud,
   * cf. `mainZonePaneKeyAt`), elle ne peut donc venir que de l'hôte.
   *
   * Absent partout où `window_id` l'est (pop-up de présentation, sondes de disponibilité) : la
   * représentation ne déclare alors aucun document, exactement comme elle n'offre aucun geste de
   * fenêtre.
   */
  pane_key?: string
}

/** Démontage seul ; `void` quand il n'y a rien à défaire. */
export type Type_RepresentationCleanup = (() => void) | void

/**
 * Poignée d'une représentation qui sait se REDESSINER sur place (os#1361, à la
 * demande de D1). `redraw` sert aux changements de DONNÉES que la représentation
 * ne surveille pas elle-même — dataTag, niveau, couche, vue : le conteneur n'a
 * pas bougé, l'entrée non plus, la remonter perdrait l'état interne du dessin
 * pour rien. Le redimensionnement, lui, reste l'affaire de la représentation.
 */
export type Type_RepresentationHandle = {
  redraw?: () => void
  cleanup?: () => void
}

/**
 * Ce que `draw` a le droit de rendre. Les trois formes sont légales et la plus
 * ancienne reste la plus simple : une représentation qui ne sait pas se
 * redessiner rend sa fonction de démontage, comme avant, et l'hôte la remontera.
 */
export type Type_RepresentationMount = Type_RepresentationHandle | Type_RepresentationCleanup

/** Clés BOOLÉENNES de PublishOptions — les seules qui puissent offrir ou retirer. */
export type Type_PublishToggle = {
  [K in keyof PublishOptions]: PublishOptions[K] extends boolean ? K : never
}[keyof PublishOptions]

type Type_RepresentationCommon = {
  /** Id stable, namespacé par couche. Cité par `PublishOptions.representations`. */
  id: string
  scale: Type_RepresentationScale
  /** Ordre d'apparition dans le sélecteur du contrôleur. */
  order: number
  /** Libellé déjà traduit. */
  label: (app_data: Class_ApplicationData) => string
  /**
   * os#1356 — abrégé traduit pour un sélecteur qui n'a pas la place du libellé
   * entier (les boutons de la barre du haut font 2,7 rem : « Sankey unitaire » y
   * était tronqué là où l'existant écrivait « Unit. »). Absent = le libellé sert
   * des deux côtés ; c'est le cas normal, seuls les noms longs le posent.
   */
  short_label?: (app_data: Class_ApplicationData) => string
  /** Icône du bouton du sélecteur. */
  icon?: React.ReactNode
  /**
   * os#1498 — PLUSIEURS FENÊTRES DE CETTE NATURE PEUVENT COEXISTER SUR LA FEUILLE COURANTE.
   *
   * La règle de la grande zone veut qu'une fenêtre à sujet DIAGRAMME sur la feuille courante soit
   * NOMMÉE PAR SA REPRÉSENTATION (`id === representation`, cf. `Type_MainZoneOccupant`) : il n'y a
   * qu'un tableur, qu'une doc, qu'un JSON, et redemander la nature montre celle qui est déjà là.
   * C'est juste tant que la nature montre LE document entier — deux fenêtres identiques côte à
   * côte n'apprendraient rien.
   *
   * La « Vue par groupe » montre le même document MIS EN FORME PAR UN SEUL GROUPE D'ÉTIQUETTES, et
   * le groupe est un réglage de la FIGURE de la fenêtre : deux groupes côte à côte est précisément
   * l'usage demandé. Un identifiant de registre ne peut pas nommer deux fenêtres ; une nature qui
   * le déclare reçoit donc, à L'OUVERTURE, un identifiant propre `w_N` — le même générateur que
   * les fenêtres d'élément (cf. `Class_MenuConfig.openMainZoneWindow`). La nature n'est interrogée
   * QU'À CE MOMENT-LÀ : l'identifiant est ensuite persisté, et plus rien n'a besoin du registre
   * pour savoir que cette fenêtre a un id propre.
   *
   * CE QUI NE S'APPLIQUE PLUS À UNE TELLE FENÊTRE (sites relus, os#1498) :
   *  - `mainZoneSubjectUsesOwnWindowId` juge sur le SEUL SUJET, et le sujet d'une vue de groupe
   *    est un diagramme sans feuille : il répond donc « non » alors que la fenêtre a bien un id
   *    propre. Là où un OCCUPANT est sous la main, c'est `mainZoneOccupantUsesOwnWindowId` qui
   *    tranche — il lit aussi l'identifiant.
   *  - `showMainZoneOccupant` : jamais atteinte, `openMainZoneWindow` bifurque avant.
   *  - la ré-affirmation `representation = id` de `_normalizeMainZoneOccupants` : appliquée ici,
   *    elle donnerait `w_7` pour nature et la fenêtre n'aurait plus rien à dessiner.
   *  - le remplacement EN PLACE de `setMainZoneWindowRepresentation` : il rebaptiserait la fenêtre
   *    du nom de sa nouvelle nature — même piège que la fenêtre de feuille (os#1385 lot 0).
   *  - les accesseurs de compatibilité (`main_zone_show_diagram`, `…_spreadsheet`, `…_doc`) et la
   *    rangée d'interrupteurs de la barre du haut, qui désignent une fenêtre par son identifiant
   *    de registre : une nature `allow_many` n'y paraît pas, et c'est voulu — elle s'ouvre depuis
   *    la surface qui la nomme (la fiche d'un groupe), pas depuis un interrupteur global.
   *  - le paramètre d'URL `rep` (`ApplicationData.getUrlStateParams`), qui ne sait écrire que des
   *    identifiants de registre. Une telle fenêtre n'a pas sa place dans une adresse ; un `w_N`
   *    qui s'y glisserait est IGNORÉ à la relecture (cf. `setMainZoneOccupantIds`).
   *
   * CE QUI S'APPLIQUE ENCORE, MOT POUR MOT : la persistance (`main_zone` écrit `representation` à
   * part de l'id et réaligne le compteur `w_N`), la figure de clé `''` — `figureOf(id, '')`, ce
   * qui porte le groupe choisi —, et la survie au changement de feuille (un sujet diagramme n'est
   * pas épinglé, cf. `closeWindowsPinnedOnSheet`).
   *
   * ABSENT = le comportement d'aujourd'hui, une fenêtre par représentation.
   */
  allow_many?: boolean
  /** Exigences sur le DIAGRAMME (cf. Type_RepresentationNeeds). */
  needs?: Type_RepresentationNeeds
  /**
   * Clé de `PublishOptions` qui décide si le LECTEUR d'une page publiée y a
   * droit. Absente : l'entrée ne dépend que de `PublishOptions.representations`.
   */
  publish_option?: Type_PublishToggle
  /** Gating de couche (licence, module absent…). */
  gate?: (app_data: Class_ApplicationData) => boolean
  /**
   * os#1393 - LE MENU CONTEXTUEL de la représentation, par NATURE d'élément cliqué.
   *
   * Appelée à chaque clic droit, avec ce que l'étiquetage `data-*` a désigné (cf.
   * `RepresentationContextMenu`) : elle rend la structure à afficher et les fonctions qu'elle
   * appelle, ou `null` - et `null` laisse le menu du NAVIGATEUR s'ouvrir, ce qui est la bonne
   * réponse là où la représentation n'offre rien.
   *
   * Construire la structure ICI, au clic, plutôt que de la déclarer une fois pour toutes : les
   * conditions de visibilité du moteur de menu ne connaissent que `app_data` (elles ont été
   * écrites pour le nœud contextualisé du diagramme), alors que ce qui décide ici, c'est
   * l'objet cliqué. Une entrée absente de la structure est une entrée qui n'existe pas pour
   * CET objet, sans condition à évaluer.
   *
   * RÈGLE DE TRI, valable pour toutes les représentations : une entrée n'est proposée que si
   * elle a un effet VISIBLE dans cette représentation-ci. Le même objet peut donc offrir des
   * gestes différents selon la figure où on le clique, et ce n'est pas une incohérence : c'est
   * la figure qui dit ce qu'on peut y voir changer.
   */
  contextMenu?: (args: {
    target: Type_RepresentationTarget
    ctx: Type_RepresentationContext
  }) => Type_RepresentationMenu | null
  /**
   * os#1399 - LA CIBLE D'UN ÉLÉMENT POINTÉ dans cette représentation : ce que les trois familles
   * de commandes (configurer, naviguer, éditer) visent quand l'auteur clique là.
   *
   * Une FONCTION, et non un champ déclaratif, parce que la réponse dépend du contexte : la part
   * d'une couronne est un flux, un nœud enfant ou un tag SELON L'AXE DE DÉCOMPOSITION, et l'axe
   * se règle. Le Sankey, lui, a des types fixes - c'est ce qui a masqué le besoin jusqu'ici.
   *
   * Reçoit ce que l'étiquetage `data-*` a désigné (cf. `RepresentationContextMenu`) et le contexte
   * de la figure. Rend `null` là où elle n'a rien à dire - le fond, une zone sans homologue dans
   * le modèle -, et une nature qui ne la déclare pas garde le comportement d'aujourd'hui : c'est
   * de la figure entière qu'on parle (cf. `resolveRepresentationElementTarget`).
   */
  resolveElementTarget?: Type_ElementTargetResolver
  /** Refus fin sur CE sujet ; absent = toujours applicable. */
  isAvailable?: (ctx: Type_RepresentationContext) => boolean
  /**
   * os#1409 - COMMENT ON ZOOME DANS CETTE NATURE (cf. Type_RepresentationZoom).
   *
   * ABSENT = cette nature ne zoome pas, et c'est une reponse, pas un oubli : l'etoile, la
   * couronne, les histogrammes et le sunburst se dessinent a la taille de leur conteneur. Le
   * controle de la colonne se grise alors EN DISANT POURQUOI - un garde-fou n'est jamais muet.
   * La documentation et le JSON zoomeraient legitimement (la taille du texte), mais rien
   * n'existe encore pour cela : le jour ou ce sera ecrit, la ligne s'ajoute ici, et nulle part
   * ailleurs.
   */
  zoom?: Type_RepresentationZoom
  /**
   * 15/09/2026 — CE QUE CETTE FENÊTRE MONTRE, en plus de son sujet : un texte COURT, écrit par
   * l'en-tête à côté du fil d'Ariane.
   *
   * La règle qui l'a fait naître (Julien, 15/09) : **pas de barres empilées les unes sous les
   * autres**. Ce qu'une barre portait trouve sa place ailleurs, ou disparaît si ce n'est pas
   * utile. La vue JSON y est passée — sa barre entière est partie —, mais une information
   * qu'elle portait reste utile : la CLÉ RACINE regardée (`nodes`, `links`, « Autres »). Sans
   * elle, deux fenêtres JSON côte à côte seraient indiscernables, et une seule ne dirait pas de
   * quelle partie du document elle montre le texte. Sa place est l'en-tête, là où une fenêtre
   * dit déjà ce qu'elle montre, et non une bande à elle.
   *
   * ABSENT = la fenêtre garde exactement l'en-tête qu'elle a, et c'est le cas de presque toutes.
   * Une nature ne déclare ceci que si elle montre UNE PARTIE de son sujet, choisie, que rien
   * d'autre à l'écran ne nomme. Le canevas montre le diagramme entier ; une figure d'élément a
   * déjà son objet dans le fil d'Ariane ; le tableur affiche ses propres onglets de feuille dans
   * sa grille. Remplir pour remplir ajouterait du bruit à la seule ligne dont dispose une
   * fenêtre pour se nommer.
   *
   * Rendre `''` est légitime et veut dire « rien à ajouter MAINTENANT » (la fenêtre n'a pas
   * encore choisi, le document n'offre rien) : l'en-tête n'écrit alors rien du tout.
   */
  describeContent?: (ctx: Type_RepresentationContext) => string
  /**
   * os#1418 — CE QUE CETTE NATURE RÈGLE, déclaré clé par clé (cf. Representations/Figure).
   *
   * Le patron est celui des nœuds et des flux, `AttributeConfig` d'`ALL_ATTRIBUTES_CONFIG` :
   * valeur d'usine, type, catégorie, libellés et infobulles dans les sept langues — plus la
   * SORTE de la clé, qui est ce que les éléments n'avaient pas besoin de dire (les leurs sont
   * toutes des clés de style). `figureAttribute` écrit tout cela en une ligne.
   *
   * POURQUOI DÉCLARER. La déclaration est ce qui fait exister la CASCADE DES STYLES sur une
   * figure : la nature en tire son style `default` pré-rempli d'usine, `Class_Figure` en tire
   * les clés qu'elle compose dans `attributes` (le sac que `ctx.options` reçoit), et les trois
   * sortes décident de ce qu'un style a le droit de porter — 'style' seulement, jamais
   * 'navigation' (l'axe de décomposition est par figure : Julien a refusé sa propagation,
   * os#1414) ni 'identity' (le flux de référence d'une étoile, la racine d'un sunburst, qui
   * n'ont pas d'homologue sur la figure voisine).
   *
   * ABSENT, OU CLÉ NON DÉCLARÉE : rien ne casse et rien ne se perd. Une clé qu'aucune nature
   * ne déclare reste lisible et persistée telle quelle (elle est rapportée, cf.
   * `Class_FigureMigrationReport`), et sa transposabilité retombe sur la règle d'avant —
   * `isTransposableOption` de MenuConfig, la liste des réglages liés au sujet.
   */
  attributes?: Type_FigureAttributesConfig
  /**
   * Réglages propres à la représentation, ÉDITÉS PAR L'AUTEUR. `setOptions`
   * reçoit l'objet complet : c'est l'appelant qui le persiste.
   */
  renderOptions?: (args: {
    app_data: Class_ApplicationData
    options: { [key: string]: unknown }
    setOptions: (next: { [key: string]: unknown }) => void
    /**
     * os#1425 — LES SORTES que cette surface rend. L'inspecteur demande 'style' (comment ça se
     * dessine), le panneau de navigation 'navigation' (ce qu'on regarde) : la répartition n'est
     * pas un choix d'interface, c'est la sorte déjà déclarée par `attributes`.
     *
     * Absente = toutes, ce que voit une surface qui ne trie pas. Une nature qui écrit encore son
     * interface à la main peut l'ignorer : elle rendra alors la même chose partout, comme avant
     * ce lot.
     */
    sorts?: Type_AttributeSort[]
    /**
     * os#1387 — le contexte de la VIGNETTE que ces réglages commandent : les réglages d'une
     * analyse d'élément (décomposer par…, normaliser sur…) se construisent sur l'objet regardé,
     * et depuis le 10/09/2026 l'hôte appelle `renderOptions` une fois PAR VIGNETTE, avec le
     * contexte et les réglages de celle-là. Absent à l'échelle diagramme (rien à pointer).
     */
    ctx?: Type_RepresentationContext
    /**
     * os#1416 / os#1418 — LA PORTÉE que l'auteur a choisie pour ce qu'il règle. TROIS, depuis
     * que les figures sont des éléments : cette figure, toutes les figures de la fenêtre, ou
     * LE STYLE. Absente = 'pane', ce que voit toute surface qui ne l'offre pas (le menu
     * contextuel d'une figure, une fenêtre à une seule vignette).
     *
     * SOUS 'style', CE N'EST PLUS LA FIGURE QU'ON RÈGLE : le volet montre le sac du style
     * `default` de la nature (cf. `Class_FigureNature.styleBag`) et `setOptions` écrit ce
     * style, donc toutes les figures qui le suivent sans le surcharger. C'est la portée des
     * éléments, à l'identique — régler la sélection ou régler le style qu'elle suit.
     *
     * L'entrée n'a RIEN à faire de la propagation ni de l'écriture — l'hôte s'en charge, et il
     * refuse de lui-même ce qui ne se transpose pas (la sorte déclarée par `attributes`, ou à
     * défaut `isTransposableOption`). Ce qu'elle a à en faire, c'est le DIRE : sous 'all' comme
     * sous 'style', un réglage qui, lui, restera sur sa figure doit s'annoncer tel quel, sinon
     * l'auteur croit l'appliquer partout.
     */
    scope?: Type_RepresentationOptionScope
  }) => React.ReactNode
}

/**
 * os#1425 — LE `renderOptions` D'UNE ENTRÉE, QU'ELLE EN ÉCRIVE UN OU NON.
 *
 * Une nature qui déclare ses attributs n'a plus d'interface à écrire : le formulaire générique
 * les rend depuis leur déclaration (`FigureAttributesForm`). Celle qui en écrit un garde le sien —
 * il reste des réglages qu'aucune déclaration ne dit encore (un sélecteur d'axe d'analyse à deux
 * étages, par exemple), et c'est la seule raison qui vaille d'en écrire un.
 *
 * TOUTES LES SURFACES PASSENT PAR ICI (l'inspecteur, le panneau de navigation, le menu contextuel
 * d'une figure) : c'est ce qui fait qu'aucune ne peut montrer autre chose qu'une autre, et qu'une
 * nature ajoutée demain apparaît partout sans une ligne d'interface.
 *
 * `null` quand il n'y a rien à régler — ni interface écrite, ni attribut déclaré : l'appelant en
 * tire que cette nature ne compte pas comme réglable (cf. `activeRepresentation`, éditeur).
 */
export const representationOptionsRenderer = (
  entry: Type_RepresentationEntry
): NonNullable<Type_RepresentationEntry['renderOptions']> | null =>
  entry.renderOptions ?? figureGenericOptionsRenderer(entry)

/**
 * Le formulaire GÉNÉRIQUE d'une entrée, ou `null` si elle écrit encore son interface à la main.
 *
 * La distinction compte pour les surfaces qui trient par sorte : une interface écrite à la main
 * ne sait pas ce qu'est une sorte et rendrait TOUT ce qu'elle connaît, si bien qu'une nature non
 * encore migrée verrait ses réglages de mise en forme apparaître dans le panneau de navigation.
 * Ces natures-là gardent leurs sections propres, et ce renderer ne les concerne pas.
 */
export const figureGenericOptionsRenderer = (
  entry: Type_RepresentationEntry
): NonNullable<Type_RepresentationEntry['renderOptions']> | null => {
  const config = entry.attributes
  if (!config || Object.keys(config).length === 0) return null
  return (args) => <FigureAttributesForm
    app_data={args.app_data}
    config={config}
    options={args.options}
    setOptions={args.setOptions}
    sorts={args.sorts}
    element={args.ctx?.element}
  />
}

/**
 * Qui possède le rendu d'une représentation qui ne se dessine PAS dans un
 * conteneur qu'on lui donne (os#1355) :
 *  - 'canvas'    : le SVG du diagramme, sous tout le reste — la grande zone ne
 *                  fait que lui réserver l'espace restant ;
 *  - 'component' : un panneau React fourni par la couche éditeur (tableur,
 *                  doc), monté par la grande zone dans le cadre de l'occupant ;
 *  - 'external'  : un contenu porté hors de l'arbre (le Sankey unitaire d'OS+,
 *                  hors #sankey_app pour survivre au redraw) et positionné sur le
 *                  cadre qu'on lui réserve.
 */
export type Type_RepresentationHost = 'canvas' | 'component' | 'external'

/**
 * Une entrée dessine DANS UN CONTENEUR, ou NOMME un rendu qu'elle possède déjà
 * — jamais les deux, jamais aucun. L'union le rend impossible à écrire de
 * travers plutôt qu'à vérifier à l'exécution. La présence dans la grande zone,
 * elle, ne se déclare pas ici : c'est la liste d'occupants de
 * `menu_configuration` qui la porte, pour toutes les entrées de la même façon.
 */
export type Type_RepresentationEntry =
  | (Type_RepresentationCommon & {
    /** Dessine dans le conteneur ; rend son démontage, ou une poignée complète. */
    draw: (container: HTMLElement, ctx: Type_RepresentationContext) => Type_RepresentationMount
    host?: never
  })
  | (Type_RepresentationCommon & {
    draw?: never
    /** Rendu possédé ailleurs — le registre le nomme, la grande zone le cadre. */
    host: Type_RepresentationHost
  })

/**
 * Ce que le diagramme courant offre. Un seul endroit à enrichir quand une
 * nouvelle exigence apparaît (la carte y branchera `geography`) : les
 * représentations, elles, se contentent de la déclarer.
 */
export const diagramCapabilities = (
  app_data: Class_ApplicationData
): Type_RepresentationCapabilities => {
  const sankey = app_data.drawing_area?.sankey
  const hierarchy = !!sankey && (
    sankey.level_taggs_list.length > 0 ||
    sankey.nodes_list.some(n => n.dimensions_as_parent.length > 0)
  )
  // os#1364 — La géographie est offerte quand le diagramme en a LES DEUX MOYENS : un fond calé,
  // et au moins un nœud qui sait où il est. Ni l'un ni l'autre ne suffit — un calage sans
  // coordonnées ne place personne, des coordonnées sans calage ne savent pas où tomber —, et une
  // représentation qui s'ouvrirait sur l'un des deux ne montrerait rien en promettant une carte.
  const geography = app_data.drawing_area?.is_geo_referenced ?? false
  return { hierarchy, geography }
}

const meetsNeeds = (
  needs: Type_RepresentationNeeds | undefined,
  caps: Type_RepresentationCapabilities
): boolean => {
  if (!needs) return true
  if (needs.hierarchy && !caps.hierarchy) return false
  if (needs.geography && !caps.geography) return false
  return true
}

/**
 * L'entrée est-elle offerte au LECTEUR d'une page publiée ?
 *
 * Hors page publiée (édition), tout est offert : c'est l'auteur qui choisit.
 * Sur une page publiée, deux verrous cumulatifs et TOUS DEUX ADDITIFS — une page
 * écrite avant D0 ne porte ni l'un ni l'autre et garde donc exactement son
 * comportement d'avant :
 *   - `PublishOptions.representations`, la liste blanche d'ids (absente = toutes) ;
 *   - la clé booléenne que l'entrée désigne par `publish_option`.
 */
export const isOfferedToReader = (
  entry: Type_RepresentationEntry,
  app_data: Class_ApplicationData
): boolean => {
  if (!app_data.is_static) return true
  const opts = app_data.publish_options
  const allowed = opts.representations
  if (allowed && !allowed.includes(entry.id)) return false
  if (entry.publish_option && !opts[entry.publish_option]) return false
  return true
}

/** Registre plat des représentations. Même patron que `presentation_block_registry`. */
export class Class_RepresentationRegistry {
  private _entries: Map<string, Type_RepresentationEntry> = new Map()

  /** Enregistre (ou remplace, par id) — idempotent, sûr au hot reload. */
  public register(entry: Type_RepresentationEntry): void {
    this._entries.set(entry.id, entry)
  }

  public unregister(id: string): void {
    this._entries.delete(id)
  }

  public clear(): void {
    this._entries.clear()
  }

  public get(id: string): Type_RepresentationEntry | undefined {
    return this._entries.get(id)
  }

  public has(id: string): boolean {
    return this._entries.has(id)
  }

  /**
   * os#1418 — CE QUE LA NATURE `id` DÉCLARE RÉGLER (cf. le champ `attributes`).
   *
   * `{}` pour un id inconnu comme pour une nature qui ne déclare rien, et c'est la MÊME réponse
   * à dessein : une nature sans déclaration se comporte exactement comme avant ce chantier —
   * ses clés restent lisibles et persistées, leur transposabilité retombant sur la règle
   * d'avant. L'appelant n'a donc pas à distinguer les deux cas, ni à se garder d'un `undefined`.
   */
  public attributesOf(id: string): Type_FigureAttributesConfig {
    return this._entries.get(id)?.attributes ?? {}
  }

  public get size(): number {
    return this._entries.size
  }

  /** Toutes les entrées d'une échelle, sans aucun filtre — pour l'auteur qui
   *  compose la liste blanche de publication (il doit voir ce qu'il retire). */
  public all(scale?: Type_RepresentationScale): Type_RepresentationEntry[] {
    return [...this._entries.values()]
      .filter(e => scale === undefined || e.scale === scale)
      .sort((a, b) => a.order - b.order)
  }

  /**
   * Les entrées PROPOSABLES dans ce contexte, triées : c'est de cette liste que
   * se peuple le sélecteur du contrôleur. Un `isAvailable` qui lève est traité
   * comme un refus — une représentation cassée disparaît, elle n'emporte pas le
   * sélecteur avec elle.
   */
  public list(ctx: Type_RepresentationContext): Type_RepresentationEntry[] {
    const caps = diagramCapabilities(ctx.app_data)
    return [...this._entries.values()]
      .filter(e => e.scale === ctx.scale)
      .filter(e => (e.gate ? e.gate(ctx.app_data) : true))
      .filter(e => meetsNeeds(e.needs, caps))
      .filter(e => isOfferedToReader(e, ctx.app_data))
      .filter(e => {
        if (!e.isAvailable) return true
        try { return e.isAvailable(ctx) } catch { return false }
      })
      .sort((a, b) => a.order - b.order)
  }
}

/** Instance unique partagée par toutes les couches. */
export const representation_registry = new Class_RepresentationRegistry()

/**
 * Contexte d'échelle DIAGRAMME (pas de sujet, pas de réglages par défaut). `window_id` : cf.
 * Type_RepresentationContext (os#1393) ; `pane_key`, la vignette de cette fenêtre-là (os#1422) —
 * une fenêtre à sujet diagramme n'en a qu'une, sous la clé vide (`FIGURE_DIAGRAM_PANE_KEY`).
 *
 * os#1498 — UNE NATURE D'ÉCHELLE DIAGRAMME MONTE, ELLE AUSSI, UN DOCUMENT. C'était vrai de la
 * seule échelle élément tant que l'étoile unitaire était la seule à le faire ; la vue par groupe
 * monte un diagramme dérivé dans une fenêtre à sujet diagramme, et sans ce couple elle ne peut pas
 * se déclarer à l'espace de travail (`bindWindowDocument`) — donc ne devient jamais l'active, et
 * n'a ni inspecteur, ni clavier, ni Ctrl+Z. Les deux restent FACULTATIFS, et absents là où ils
 * l'étaient déjà : la pop-up de présentation et les sondes de disponibilité montent les mêmes
 * entrées sans fenêtre.
 */
export const diagramContext = (
  app_data: Class_ApplicationData,
  options: { [key: string]: unknown } = {},
  window_id?: string,
  pane_key?: string
): Type_RepresentationContext => (
  { app_data, scale: 'diagram', element: null, options, window_id, pane_key }
)

/**
 * Contexte d'échelle ÉLÉMENT. `window_id` : cf. Type_RepresentationContext (os#1393) ;
 * `pane_key`, la vignette de cette fenêtre-là (os#1422).
 */
export const elementContext = (
  app_data: Class_ApplicationData,
  element: Type_Presentable,
  options: { [key: string]: unknown } = {},
  window_id?: string,
  pane_key?: string
): Type_RepresentationContext => (
  { app_data, scale: 'element', element, options, window_id, pane_key }
)

/**
 * Une représentation MONTÉE, vue par son hôte. Forme NORMALISÉE : quoi qu'ait
 * rendu `draw`, l'hôte voit toujours ces trois champs — c'est ce qui lui permet
 * de piloter camembert, sunburst ou unitaire sans connaître aucun des trois.
 */
export type Type_MountedRepresentation = {
  /** Id de l'entrée montée. */
  id: string
  /** `null` quand la représentation ne sait pas se redessiner (cf. redrawMounted). */
  redraw: (() => void) | null
  /** Toujours appelable, même quand `draw` n'avait rien rendu à défaire. */
  cleanup: () => void
}

/** Ramène les trois retours légaux de `draw` à la forme que l'hôte manipule. */
const normalizeMount = (
  mount: Type_RepresentationMount
): { redraw: (() => void) | null, cleanup: () => void } => {
  if (typeof mount === 'function') return { redraw: null, cleanup: mount }
  if (mount && typeof mount === 'object') {
    return {
      redraw: typeof mount.redraw === 'function' ? mount.redraw : null,
      cleanup: typeof mount.cleanup === 'function' ? mount.cleanup : () => { /* rien à défaire */ }
    }
  }
  return { redraw: null, cleanup: () => { /* rien à défaire */ } }
}

/**
 * Monte une représentation par son id dans un conteneur.
 *
 * Rend `null` si l'id est INCONNU, si l'entrée n'est pas de la forme `draw`, ou
 * si son gate refuse : même tolérance que les blocs de présentation — une page
 * publiée par une version plus récente cite un id qu'on ne connaît pas, on le
 * saute au lieu de casser l'écran.
 */
export const mountRepresentation = (
  id: string,
  container: HTMLElement,
  ctx: Type_RepresentationContext
): Type_MountedRepresentation | null => {
  const entry = representation_registry.get(id)
  if (!entry?.draw) return null
  if (entry.gate && !entry.gate(ctx.app_data)) return null
  const mount = normalizeMount(entry.draw(container, ctx))
  // os#1393 - LE CLIC DROIT, posé ici et nulle part ailleurs : c'est le seul endroit que
  // traversent toutes les représentations dessinées, et le conteneur survit aux redessins que
  // le moteur, lui, refait de zéro. Une représentation qui ne déclare pas de menu n'écope
  // d'aucun écouteur (cf. attachRepresentationContextMenu).
  const detach = attachRepresentationContextMenu(container, entry, ctx)
  return {
    id,
    redraw: mount.redraw,
    cleanup: () => { detach(); mount.cleanup() }
  }
}

/**
 * Redessine une représentation montée SANS la démonter, sur un changement de
 * données (dataTag, niveau, couche, vue).
 *
 * Rend `false` — sans rien casser — quand la représentation ne sait pas le
 * faire, ou quand son redessin lève : à l'hôte de la remonter, ce qu'il savait
 * déjà faire. C'est cette réponse booléenne qui dispense l'hôte de connaître la
 * forme interne de chaque entrée.
 */
export const redrawMounted = (mounted: Type_MountedRepresentation | null): boolean => {
  if (!mounted?.redraw) return false
  try {
    mounted.redraw()
    return true
  } catch {
    return false
  }
}

/** Libellé d'une représentation, ou '' si l'id est inconnu. */
export const representationLabel = (
  id: string,
  app_data: Class_ApplicationData
): string => representation_registry.get(id)?.label(app_data) ?? ''
