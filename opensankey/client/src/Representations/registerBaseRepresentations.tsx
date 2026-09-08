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
import { FaProjectDiagram, FaTable, FaFileAlt, FaShareAlt, FaBullseye } from 'react-icons/fa'
import { drawSunburstRepresentation, SunburstRepresentationOptions } from './SunburstRepresentation'

import type { Class_ApplicationData } from '../types/ApplicationData'
import {
  MAIN_ZONE_CANVAS_ID, MAIN_ZONE_SPREADSHEET_ID, MAIN_ZONE_DOC_ID, MAIN_ZONE_UNITARY_ID
} from '../types/MenuConfig'
import { representation_registry } from './RepresentationRegistry'

export const registerBaseRepresentations = (): void => {
  representation_registry.register({
    id: MAIN_ZONE_CANVAS_ID,
    scale: 'diagram',
    order: 10,
    label: (a) => a.t('Spreadsheet.zone.diagram'),
    icon: <FaProjectDiagram />,
    // Le SVG sous tout le reste : la grande zone lui réserve ce que les autres
    // occupants ne prennent pas, et c'est tout ce qu'il lui faut.
    host: 'canvas'
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
    host: 'component'
  })

  representation_registry.register({
    id: MAIN_ZONE_UNITARY_ID,
    scale: 'diagram',
    order: 40,
    label: (a) => a.t('Spreadsheet.zone.unitary'),
    short_label: (a) => a.t('Spreadsheet.zone.unit'),
    icon: <FaShareAlt />,
    publish_option: 'unitary',
    // La brique est portée par OS+, qui lève ce drapeau. Sans OS+, l'entrée
    // existe dans le registre mais n'est jamais proposée : c'est exactement ce
    // que fait déjà le bouton « Unit. » de la barre du haut.
    gate: (a) => a.menu_configuration.unitary_tab_available,
    // Porté vers document.body par OS+ (hors #sankey_app, pour survivre au redraw
    // du diagramme) et positionné sur le cadre que la grande zone lui réserve.
    host: 'external'
  })

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
    renderOptions: (args) => <SunburstRepresentationOptions {...args} />,
    draw: (container, ctx) => drawSunburstRepresentation(container, {
      ...ctx,
      options: { ...ctx.options, root_ids: ctx.element ? [ctx.element.id] : [] }
    })
  })
}
