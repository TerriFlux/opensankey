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

// OS#1361 (D0) — Représentations de BASE, échelle DIAGRAMME.
//
// Les trois que la grande zone montait déjà (Sankey, Tableur, Doc) plus le
// Sankey unitaire d'OS+ : elles existaient, câblées une par une dans
// `TopBarStateButtons` (MenuTop). Les enregistrer ici ne change RIEN à leur
// rendu — elles gardent leur hôte — mais les fait exister comme entrées de
// l'axe « représentation », donc comme quelque chose qu'une publication peut
// offrir ou retirer, et qu'un sélecteur peut énumérer sans les connaître.
//
// os#1355 — D'où la forme `host` : le registre les NOMME, la grande zone les
// cadre comme n'importe quel occupant (cf. `menu_configuration.main_zone_*`).
// La règle « garder au moins un occupant » vit dans le modèle de la grande
// zone, pas ici : c'est une contrainte d'espace, pas de représentation.

import React from 'react'
import { FaProjectDiagram, FaTable, FaFileAlt, FaBullseye, FaCode } from 'react-icons/fa'
import { drawSunburstRepresentation, SunburstRepresentationOptions } from './SunburstRepresentation'
import { SpreadsheetRepresentationOptions } from './SpreadsheetRepresentationOptions'
// os#1418 — une nature DÉCLARE ses réglages (défaut, sorte, libellés des 7 langues), et c'est
// cette déclaration qui lui donne la cascade des styles des nœuds et des flux.
import { figureAttribute } from './figureAttribute'
// La valeur d'usine de la profondeur vient de là où le sunburst la lit (`readSunburstOptions`) :
// une seconde écriture du nombre finirait par diverger de la première.
import { SUNBURST_DEFAULT_MAX_DEPTH } from '../Charts/SunburstHierarchy'
// os#1420 — la clé d'épinglage de l'étiquette de données vient de là où elle est LUE
// (`readFigureDataTagPins`) : deux écritures de la chaîne finiraient par diverger.
import { FIGURE_DATA_TAGS_KEY } from '../Charts/FigureNavigation'
import type { Type_FigureDataTagPins } from '../Charts/FigureNavigation'

import type { Class_ApplicationData } from '../types/ApplicationData'
import {
  MAIN_ZONE_CANVAS_ID, MAIN_ZONE_SPREADSHEET_ID, MAIN_ZONE_DOC_ID, MAIN_ZONE_JSON_ID
} from '../types/MenuConfig'
import { representation_registry } from './RepresentationRegistry'
import { representationOptionsMenu } from './RepresentationContextMenu'
// os#1409 - le zoom est une capacite declaree par la nature (cf. Type_RepresentationZoom).
import { DIAGRAM_ZOOM } from './RepresentationZoom'
import { spreadsheetZoomHandle } from './SpreadsheetZoomBridge'

export const registerBaseRepresentations = (): void => {
  representation_registry.register({
    id: MAIN_ZONE_CANVAS_ID,
    scale: 'diagram',
    order: 10,
    label: (a) => a.t('Spreadsheet.zone.diagram'),
    icon: <FaProjectDiagram />,
    // Le SVG sous tout le reste : la grande zone lui réserve ce que les autres
    // occupants ne prennent pas, et c'est tout ce qu'il lui faut.
    host: 'canvas',
    // os#1409 — la transformation d3 existante, DÉCLARÉE et non plus câblée dans le contrôle.
    // Rien ne change pour le diagramme : c'est le cas de non-régression du lot.
    zoom: DIAGRAM_ZOOM
    // os#1418 — PAS D'`attributes`, et ce n'est pas un oubli : ce que le canevas montre se règle
    // sur le diagramme lui-même (l'inspecteur, les vues, les tags), pas sur la figure qui le
    // cadre. Une figure de canevas n'a donc rien en propre à porter.
  })

  representation_registry.register({
    id: MAIN_ZONE_SPREADSHEET_ID,
    scale: 'diagram',
    order: 20,
    label: (a) => a.t('Spreadsheet.zone.spreadsheet'),
    icon: <FaTable />,
    // os#1356 — PAS DE VERROU EN LECTURE, ET C'EST VOULU (arbitrage Julien).
    // Univer n'a pas de mode lecture seule ici : le visiteur d'une page publiée
    // peut donc éditer des cellules. Ce qu'il change vit dans SON navigateur —
    // ni le bundle servi ni les données n'en savent rien : c'est explorer, pas
    // altérer. Et plomber Univer interdirait du même coup les gestes qui font
    // l'intérêt du tableur pour un lecteur : trier une colonne, copier une
    // plage. Le trou n'est pas un oubli, ne le bouchez pas.
    //
    // os#1405 — le tableur A DÉSORMAIS DES RÉGLAGES : l'affichage des matrices TES/TER, qui
    // occupait une place dans la barre au-dessus de la grille. Conséquence attendue de cet
    // ajout : la nature « tableur » compte maintenant pour `activeRepresentation`, donc le
    // volet de représentation de l'inspecteur s'ouvre sur elle au lieu de rester vide.
    //
    // os#1418 — mais PAS d'`attributes` pour autant : ces réglages-là ne sont pas ceux d'une
    // figure, ils vivent sur le document (cf. `SpreadsheetRepresentationOptions`, qui lit et
    // écrit `app_data` directement). Deux tableurs côte à côte montreraient donc les mêmes
    // matrices, et c'est bien ce qu'on veut : c'est une propriété du classeur, pas une façon de
    // le regarder. Le jour où un réglage PAR FIGURE apparaît ici (une feuille épinglée, par
    // exemple), il se déclare sur cette ligne.
    renderOptions: ({ app_data }) => <SpreadsheetRepresentationOptions app_data={app_data} />,
    // os#1409 — LE ZOOM D'UNIVER, pilote par le controle de la colonne. Son API l'expose
    // vraiment (`FWorksheet.zoom` / `getZoom`, ratio 0,1 a 4) : c'est un zoom du MOTEUR de la
    // grille, qui recalcule ses cellules — et non une transformation posee par-dessus, qui
    // aurait fausse ses mesures. Conséquence assumée et voulue par l'issue : le curseur de zoom
    // du pied de la grille DISPARAIT (`footer.zoomSlider: false`, cf. UniverSpreadSheet) — deux
    // commandes pour un même geste sont exactement ce que ce chantier défait.
    //
    // Le pas n'est PAS celui du diagramme : racine de deux double l'échelle en deux crans, ce
    // qui est brutal sur des cellules dont on veut lire le texte. Un quart de plus par cran.
    zoom: {
      // La grille prête ses deux gestes en se montant (cf. SpreadsheetZoomBridge) ; hors
      // montage il n'y a personne à qui parler, et 1 est ce que montrerait une grille neuve.
      getScale: () => spreadsheetZoomHandle()?.getZoom() ?? 1,
      setScale: (ratio) => spreadsheetZoomHandle()?.setZoom(ratio),
      step: 1.25,
      min: 0.1,
      max: 4,
      neutral: 1,
      // Pas de grille montée = pas de zoom : le contrôle se grise en le disant, plutôt que
      // d'avaler les clics.
      isAvailable: () => spreadsheetZoomHandle() !== null
    },
    host: 'component'
  })

  // La vue JSON du format natif, au MÊME niveau que le tableur (cf. MAIN_ZONE_JSON_ID) : le
  // document entier, rendu comme le fichier qu'on enregistrerait. Elle était un sous-onglet du
  // tableur, ce qui lui coûtait une ligne d'en-tête et interdisait de la voir à côté de la
  // grille. Pas de `publish_option` propre : comme le tableur, elle est offerte au lecteur sauf
  // si la liste blanche `PublishOptions.representations` la retire — c'est exactement ce que
  // valait le sous-onglet, atteignable dès que le tableur l'était.
  // os#1409 — la vue JSON et la documentation NE DÉCLARENT PAS de zoom, et c'est un constat
  // daté, pas une propriété : leur zoom légitime serait la taille du texte, et rien n'existe
  // aujourd'hui pour la régler. Le contrôle de la colonne se grise donc en le disant. Le jour
  // où ce réglage sera écrit, il s'ajoute ici, sur la ligne de sa nature, et nulle part ailleurs.
  representation_registry.register({
    id: MAIN_ZONE_JSON_ID,
    scale: 'diagram',
    order: 25,
    label: (a) => a.t('Spreadsheet.zone.json'),
    icon: <FaCode />,
    // os#1418 — LA CLÉ RACINE REGARDÉE, déclarée ici bien que l'onglet vive dans l'éditeur.
    //
    // Elle est de sorte 'navigation' et pas 'style' : changer de clé racine ne change pas la
    // façon de lire le document, il change CE QU'ON LIT — `nodes` puis `links` ne sont pas deux
    // apparences du même texte. Deux fenêtres JSON côte à côte sur deux clés sont exactement
    // l'usage (cf. `describeContent`), et un style qui les alignerait le détruirait.
    //
    // LA CHAÎNE EST ÉCRITE EN DUR, et c'est la seule entorse du fichier : la constante est
    // `JSON_TAB_OPTION_KEY` de `packages/opensankey-editor/.../spreadsheet/jsonDocumentTabs.ts`,
    // et OS base ne remonte pas vers l'éditeur. Les deux doivent rester d'accord ; le jour où la
    // déclaration descend avec le reste, c'est l'import qui reprend sa place.
    attributes: {
      json_tab: figureAttribute<string | undefined>(undefined, 'navigation', {
        en: 'Root key shown',
        fr: 'Clé racine affichée',
        es: 'Clave raíz mostrada',
        de: 'Angezeigter Wurzelschlüssel',
        it: 'Chiave radice mostrata',
        'zh-CN': '显示的根键',
        ja: '表示するルートキー'
      })
    },
    host: 'component'
  })

  representation_registry.register({
    id: MAIN_ZONE_DOC_ID,
    scale: 'diagram',
    order: 30,
    label: (a) => a.t('Spreadsheet.zone.doc'),
    icon: <FaFileAlt />,
    publish_option: 'doc',
    // Même critère que `hasDocToShow` (publishedDoc, couche éditeur) : la doc
    // embarquée dans le diagramme, ou le document prêté par la page publiée.
    // Recopié plutôt qu'importé — OS base ne remonte pas vers l'éditeur.
    //
    // os#1356 — le critère ne vaut QU'EN LECTURE. En édition, l'onglet est le seul
    // endroit d'où l'on ÉCRIT la documentation : l'exiger déjà écrite le rendrait
    // inatteignable sur tout diagramme qui n'en a pas encore.
    isAvailable: ({ app_data }: { app_data: Class_ApplicationData }) =>
      !app_data.is_static ||
      app_data.documentation_markdown !== '' ||
      app_data.menu_configuration.doc_external !== null,
    // os#1418 — RIEN À DÉCLARER : la documentation montre le document entier, sans réglage. Ce
    // qui s'y règlerait un jour (la taille du texte, cf. la note sur le zoom plus haut) n'existe
    // pas encore ; c'est ici que la ligne s'écrira, et nulle part ailleurs.
    host: 'component'
  })

  // os#1387 — Le panneau unitaire OS+ (`os.repr.unitary`, hôte externe) n'est PLUS offert à
  // l'échelle diagramme : le Sankey unitaire est une représentation d'UN NŒUD, et c'est la
  // fenêtre d'élément « Unit. » (`osp.repr.unit`) qui le porte, avec ses réglages et le choix
  // des nœuds. Deux interfaces pour le même objet, c'était une de trop (arbitrage Julien).
  // Les fichiers qui portent encore `os.repr.unitary` dans leur grande zone se relisent en
  // fenêtre « Unit. » sur la sélection (cf. mainZoneStateFromJSON).

  // os#1363 / os#1387 — Le sunburst est une représentation d'UN NŒUD (arbitrage Julien,
  // 08/09/2026 : pas de statistiques sur le diagramme entier), donc à l'échelle ÉLÉMENT :
  // ses anneaux sont la descendance du nœud sujet. `root_ids` est posé depuis le sujet — le
  // module ne sait pas qu'il vit dans une fenêtre. Un flux n'a pas de descendance : refusé.
  representation_registry.register({
    id: 'os.repr.sunburst',
    scale: 'element',
    order: 40,
    label: (a) => a.t('sunburst.title'),
    icon: <FaBullseye />,
    needs: { hierarchy: true },
    isAvailable: (ctx) => !!ctx.element && Array.isArray((ctx.element as { output_links_list?: unknown }).output_links_list),
    // os#1418 — CE QUE RÈGLE LE SUNBURST, déclaré : six clés, trois sortes.
    //
    // La DIMENSION est l'axe de décomposition des anneaux — la même question que le descripteur
    // d'une couronne, donc la même réponse : 'navigation', par figure et jamais par style.
    // Le MODE DE VALEUR et la PROFONDEUR sont deux façons de regarder la même descendance : ils
    // se transposent, un style a le droit de les porter.
    // La RACINE nomme le sujet, elle ne se transpose à rien — et elle est même posée par le
    // `draw` ci-dessous depuis l'élément de la fenêtre, pas par l'auteur : la déclarer 'identity'
    // est ce qui interdit qu'un style ou une figure voisine vienne l'écraser.
    //
    // os#1420 — CINQUIÈME CLÉ : l'ÉTIQUETTE DE DONNÉES ÉPINGLÉE. Absente (le défaut), la
    // couronne suit le diagramme ; posée, elle lit ses valeurs sous l'étiquette nommée, quoi
    // que le diagramme montre — « cette couronne, en 2019 », à côté d'une autre en 2021. C'est
    // donc de la 'navigation' et jamais du 'style' : un style qui l'alignerait détruirait
    // exactement l'usage. La valeur est un dictionnaire `{ id de groupe: id d'étiquette }`,
    // un groupe absent suivant le diagramme (cf. Type_FigureDataTagPins).
    attributes: {
      dimension_id: figureAttribute<string | undefined>(undefined, 'navigation', {
        en: 'Dimension',
        fr: 'Dimension',
        es: 'Dimensión',
        de: 'Dimension',
        it: 'Dimensione',
        'zh-CN': '维度',
        ja: 'ディメンション'
      }),
      // os#1424 — SIXIÈME CLÉ : ENCHAÎNER LES AXES. Elle ne dit pas QUEL axe on regarde
      // (ça, c'est `dimension_id`) mais JUSQU'OÙ la décomposition continue quand l'axe
      // courant n'a plus d'enfants à donner : même famille que la profondeur, donc 'style'
      // — deux couronnes d'un même style se lisent aussi loin l'une que l'autre.
      chain_axes: figureAttribute<boolean>(true, 'style', {
        en: 'Chain the hierarchies',
        fr: 'Enchaîner les hiérarchies',
        es: 'Encadenar las jerarquías',
        de: 'Hierarchien verketten',
        it: 'Concatenare le gerarchie',
        'zh-CN': '串联各层级',
        ja: '階層を連結する'
      }),
      value_mode: figureAttribute<'sum' | 'declared'>('sum', 'style', {
        en: 'Ring values',
        fr: 'Valeur des anneaux',
        es: 'Valor de los anillos',
        de: 'Wert der Ringe',
        it: 'Valore degli anelli',
        'zh-CN': '环的取值',
        ja: 'リングの値'
      }),
      max_depth: figureAttribute<number>(SUNBURST_DEFAULT_MAX_DEPTH, 'style', {
        en: 'Depth',
        fr: 'Profondeur',
        es: 'Profundidad',
        de: 'Tiefe',
        it: 'Profondità',
        'zh-CN': '层级深度',
        ja: '深さ'
      }),
      root_ids: figureAttribute<string[] | undefined>(undefined, 'identity', {
        en: 'Root',
        fr: 'Racine',
        es: 'Raíz',
        de: 'Wurzel',
        it: 'Radice',
        'zh-CN': '根节点',
        ja: 'ルート'
      }),
      [FIGURE_DATA_TAGS_KEY]: figureAttribute<Type_FigureDataTagPins | undefined>(
        undefined, 'navigation', {
          en: 'Pinned data tag',
          fr: 'Étiquette de données épinglée',
          es: 'Etiqueta de datos fijada',
          de: 'Angeheftete Datenkennzeichnung',
          it: 'Etichetta di dati fissata',
          'zh-CN': '固定的数据标签',
          ja: '固定されたデータタグ'
        })
    },
    renderOptions: (args) => <SunburstRepresentationOptions {...args} />,
    // os#1397 - le clic droit sur le fond ouvre les réglages de la figure. Les SECTEURS, eux,
    // n'ont pas encore de menu : leur clic gauche zoome déjà dans l'anneau, et décider ce que le
    // clic droit y ajoute demande de trancher ce qu'on vise, le nœud du secteur ou la branche
    // entière. À faire quand la question se posera vraiment, pas d'avance.
    contextMenu: ({ target, ctx }) => target.kind === 'background' ? representationOptionsMenu(ctx) : null,
    draw: (container, ctx) => drawSunburstRepresentation(container, {
      ...ctx,
      options: { ...ctx.options, root_ids: ctx.element ? [ctx.element.id] : [] }
    })
  })
}
