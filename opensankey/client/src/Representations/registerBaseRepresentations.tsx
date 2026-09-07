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
// Les trois que la grande zone monte déjà (Sankey, Tableur, Doc) plus le Sankey
// unitaire d'OS+ : elles existaient, câblées une par une dans
// `TopBarStateButtons` (MenuTop). Les enregistrer ici ne change RIEN à leur
// rendu — elles gardent leur hôte React — mais les fait exister comme entrées
// de l'axe « représentation », donc comme quelque chose qu'une publication peut
// offrir ou retirer, et qu'un sélecteur peut énumérer sans les connaître.
//
// D'où la forme `toggle` : le registre les allume, il ne les dessine pas. La
// règle « garder au moins un panneau affiché » reste à l'hôte — c'est une
// contrainte de mise en page, pas du modèle.

import React from 'react'
import { FaProjectDiagram, FaTable, FaFileAlt, FaShareAlt } from 'react-icons/fa'

import type { Class_ApplicationData } from '../types/ApplicationData'
import { representation_registry } from './RepresentationRegistry'

export const registerBaseRepresentations = (): void => {
  representation_registry.register({
    id: 'os.repr.sankey',
    scale: 'diagram',
    order: 10,
    label: (a) => a.t('Spreadsheet.zone.diagram'),
    icon: <FaProjectDiagram />,
    toggle: {
      isActive: (a) => a.menu_configuration.main_zone_show_diagram,
      setActive: (a, on) => { a.menu_configuration.main_zone_show_diagram = on }
    }
  })

  representation_registry.register({
    id: 'os.repr.spreadsheet',
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
    toggle: {
      isActive: (a) => a.menu_configuration.main_zone_show_spreadsheet,
      setActive: (a, on) => { a.menu_configuration.main_zone_show_spreadsheet = on }
    }
  })

  representation_registry.register({
    id: 'os.repr.doc',
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
    toggle: {
      isActive: (a) => a.menu_configuration.main_zone_show_doc,
      setActive: (a, on) => { a.menu_configuration.main_zone_show_doc = on }
    }
  })

  representation_registry.register({
    id: 'os.repr.unitary',
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
    toggle: {
      isActive: (a) => a.menu_configuration.main_zone_show_unitary,
      setActive: (a, on) => { a.menu_configuration.main_zone_show_unitary = on }
    }
  })
}
