// #1243 — Libellés de l'INSPECTEUR piloté par la sélection et des onglets du
// panneau de filtres. Fichier dédié (comme traduction_guided_tour), fusionné
// par deep_assign_resources dans traduction.tsx.
//
// `inspector.*`  : fil d'Ariane, cibles, portée/cascade, onglets, indicateurs.
// `filter_panel.*` : onglets Filtrer / Sélectionner / Éditer du tiroir.

export const resources_inspector = {
  //=======================================================
  //EN
  //=======================================================
  en: {
    translation: {
      inspector: {
        view: 'View',
        back_to_selection: 'Back to selection',
        pin: 'Pin the panel (the drawing resizes to its left)',
        unpin: 'Unpin the panel (floats over the drawing)',
        // Cibles : singulier / pluriel (fil d'Ariane).
        target: {
          view: 'View',
          node: 'Node', nodes: 'nodes',
          link: 'Flow', links: 'flows',
          container: 'Area', containers: 'areas',
          legend: 'Legend', legends: 'legends',
          title: 'Title', titles: 'titles',
          mixed: 'Mixed selection', elements: 'elements'
        },
        nothing_here: 'No settings available for: {{target}}.',
        // Portée & cascade de styles
        selection: 'Selection',
        selection_count: 'Selection ({{count}})',
        styles_count: 'Styles ({{count}})',
        cascade: 'Cascade',
        style_name: 'Style name',
        new_style: '+ New style',
        delete_style: 'Delete',
        delete_style_tooltip: 'Delete this style (elements following it fall back on the rest of their cascade)',
        attach_style: 'Attach a style to the selection (end of cascade, wins)',
        detach_style: 'Detach this style from the selection',
        edited_style_hint: 'Editing the highlighted style: every element following it will change. The last one in the cascade wins; a local override always wins.',
        divergent_cascade: 'Cascade of the 1st element — other selected elements follow a different cascade. ',
        selection_hint: 'Dimmed attributes: inherited from styles (cascade). Purple outline: overridden on the selection. Orange outline: multiple values.',
        tab_overloaded: 'Contains overridden attributes',
        provenance: {
          local: 'Overridden here (on the selection)',
          from_style: 'Inherited from style « {{style}} »',
          factory: 'Factory default value'
        },
        // Onglets
        tab: {
          stock: 'Stock',
          tooltip: 'Tooltip',
          tags: 'Tags',
          analysis: 'Analysis',
          title: 'Title',
          mfa: 'MFA',
          styles: 'Styles'
        },
        // #1258 — Onglet MFA (espace AFM unifié).
        mfa: {
          reconciliation: 'Reconciliation',
          open_spreadsheet: 'Open the spreadsheet (constraints)',
          run_reconciliation: 'Reconcile via Excel…',
          value_in_mfa: 'Value type, bounds and uncertainty are edited in the MFA tab.'
        },
        // #1258 — Titres des sections repliables des onglets.
        section: {
          page: 'Page',
          dressing: 'Background & grid',
          scale_sizes: 'Scale & sizes',
          advanced: 'Advanced',
          advanced_geometry: 'Advanced — geometry'
        },
        // #1259 — Section « Groupe » unifiée (ex-« Cadre géométrique » ZDT + nœuds).
        group: {
          title: 'Group',
          tooltip: 'Attaches nodes or text zones to the selected element: the frame positions itself to encompass its members and moves with them'
        },
        visible: 'Visible',
        labels_visible: 'Labels visible',
        stock_enabled: 'Enabled',
        stock_shape: 'Shape',
        stock_shape_tooltip: 'Show the stock shape',
        stock_labels: 'Labels',
        stock_labels_tooltip: 'Show the stock labels',
        stock_shape_visible: 'Stock shape visible',
        stock_select_node: 'Select a node carrying a stock.',
        stock_caption: 'Stock caption',
        stock_delta_caption: 'Δ stock caption',
        advanced_editor: 'Advanced editor…',
        open_editor: 'Open the editor…',
        tags_assign_hint: 'Assignment (groups are edited in Filters)',
        // OS#1278 — section « Analyse » (graphiques couronne / histogramme).
        analysis: {
          decompose_by: 'Decompose by',
          compare_by: 'Compare across',
          none: '— none —',
          inputs: 'Incoming flows',
          outputs: 'Outgoing flows',
          inputs_by: 'Incoming flows by {{group}}',
          outputs_by: 'Outgoing flows by {{group}}',
          node_children: 'Child nodes ({{dim}})',
          flux_children: 'Child flows ({{dim}})',
          repr_auto: 'Auto',
          repr_donut: 'Donut',
          repr_bars: 'Bars',
          show_in_tooltip: 'Show in tooltip',
          show_on_node: 'Show on the node (donut / histogram)',
          select_subject: 'Select a node or a flow.'
        },
        // OS#1285 — visibilité des blocs d'info-bulle.
        tooltip_blocks: {
          title: 'Visible blocks',
          values: 'Values',
          flux: 'Flow',
          tags: 'Tags',
          series_flux: 'Flow series',
          data: 'Data',
          series_data: 'Data series',
          unitary: 'Unitary Sankey',
          analysis: 'Analysis chart'
        },
        // OS#1286 — registre d'unités du diagramme (grandeurs/unités/défauts).
        units: {
          title: 'Diagram units',
          none: '— none —',
          type_default: 'default',
          open_editor: 'Edit…',
          open_editor_tooltip: 'Edit the diagram units (quantities, units, coefficients, defaults)',
          symbol: 'Symbol',
          coefficient: 'Coefficient',
          coefficient_tooltip: 'Value of this unit expressed in the base unit of its quantity (base unit = 1). Values are stored in the base unit.',
          default: 'Default',
          default_tooltip: 'Default display unit of this quantity (inherited by flows without an explicit unit)',
          add_unit: '+ Unit',
          add_unit_type: '+ Quantity',
          new_unit_name: 'unit',
          new_unit_type_name: 'New quantity',
          empty: 'No quantity in the registry — add one.'
        }
      },
      filter_panel: {
        filter: 'Filter',
        select: 'Select',
        select_tooltip: 'Select elements by type and tag (bulk operations)',
        edit: 'Edit',
        edit_group: 'Edit this group',
        show_hidden: 'Show hidden groups ({{count}})',
        hide_hidden: 'Hide hidden groups',
        select_elements: 'Select elements',
        deselect_all: 'Deselect all',
        selection_summary: 'Selection: {{summary}}',
        short: {
          node: 'Nodes',
          link: 'Flows',
          data: 'Data',
          level: 'Levels',
          views: 'Views'
        }
      }
    }
  },
  //=======================================================
  //FR
  //=======================================================
  fr: {
    translation: {
      inspector: {
        view: 'Vue',
        back_to_selection: 'Retour à la sélection',
        pin: 'Épingler le panneau (le dessin se recadre à gauche)',
        unpin: 'Détacher le panneau (survol du dessin)',
        target: {
          view: 'Vue',
          node: 'Nœud', nodes: 'nœuds',
          link: 'Flux', links: 'flux',
          container: 'Zone', containers: 'zones',
          legend: 'Légende', legends: 'légendes',
          title: 'Titre', titles: 'titres',
          mixed: 'Sélection mixte', elements: 'éléments'
        },
        nothing_here: 'Aucun réglage disponible pour : {{target}}.',
        selection: 'Sélection',
        selection_count: 'Sélection ({{count}})',
        styles_count: 'Styles ({{count}})',
        cascade: 'Cascade',
        style_name: 'Nom du style',
        new_style: '+ Nouveau style',
        delete_style: 'Supprimer',
        delete_style_tooltip: 'Supprimer ce style (les éléments qui le suivaient retombent sur le reste de leur cascade)',
        attach_style: 'Attacher un style à la sélection (fin de cascade, prioritaire)',
        detach_style: 'Détacher ce style de la sélection',
        edited_style_hint: 'Édition du style surligné : tous les éléments qui le suivent seront modifiés. Le dernier de la cascade gagne ; une surcharge locale gagne toujours.',
        divergent_cascade: 'Cascade du 1er élément — d’autres éléments sélectionnés suivent une cascade différente. ',
        selection_hint: 'Attributs en retrait : hérités des styles (cascade). Liseré violet : surchargé sur la sélection. Liseré orange : valeurs multiples.',
        tab_overloaded: 'Contient des attributs surchargés',
        provenance: {
          local: 'Surchargé ici (sur la sélection)',
          from_style: 'Hérité du style « {{style}} »',
          factory: 'Valeur d’usine'
        },
        tab: {
          stock: 'Stock',
          tooltip: 'Infobulle',
          tags: 'Tags',
          analysis: 'Analyse',
          title: 'Titre',
          mfa: 'AFM',
          styles: 'Styles'
        },
        mfa: {
          reconciliation: 'Réconciliation',
          open_spreadsheet: 'Ouvrir le tableur (contraintes)',
          run_reconciliation: 'Réconcilier via Excel…',
          value_in_mfa: 'Type de valeur, bornes et incertitude s’éditent dans l’onglet AFM.'
        },
        section: {
          page: 'Page',
          dressing: 'Habillage',
          scale_sizes: 'Échelle & tailles',
          advanced: 'Avancé',
          advanced_geometry: 'Avancé — géométrie'
        },
        group: {
          title: 'Groupe',
          tooltip: 'Associe des nœuds ou des zones de texte à l’élément sélectionné : le cadre se positionne pour englober ses membres et se déplace avec eux'
        },
        visible: 'Visible',
        labels_visible: 'Libellés visibles',
        stock_enabled: 'Activé',
        stock_shape: 'Forme',
        stock_shape_tooltip: 'Afficher la forme de stock',
        stock_labels: 'Libellés',
        stock_labels_tooltip: 'Afficher les libellés du stock',
        stock_shape_visible: 'Forme de stock visible',
        stock_select_node: 'Sélectionnez un nœud portant un stock.',
        stock_caption: 'Libellé stock',
        stock_delta_caption: 'Libellé Δ stock',
        advanced_editor: 'Éditeur avancé…',
        open_editor: 'Ouvrir l’éditeur…',
        tags_assign_hint: 'Assignation (les groupes s’éditent dans Filtres)',
        // OS#1278 — section « Analyse » (graphiques couronne / histogramme).
        analysis: {
          decompose_by: 'Décomposer par',
          compare_by: 'Comparer selon',
          none: '— aucune —',
          inputs: 'Flux entrants',
          outputs: 'Flux sortants',
          inputs_by: 'Flux entrants par {{group}}',
          outputs_by: 'Flux sortants par {{group}}',
          node_children: 'Nœuds enfants ({{dim}})',
          flux_children: 'Flux enfants ({{dim}})',
          repr_auto: 'Auto',
          repr_donut: 'Couronne',
          repr_bars: 'Barres',
          show_in_tooltip: 'Afficher dans l’info-bulle',
          show_on_node: 'Afficher sur le nœud (couronne / histogramme)',
          select_subject: 'Sélectionner un nœud ou un flux.'
        },
        // OS#1285 — visibilité des blocs d'info-bulle.
        tooltip_blocks: {
          title: 'Blocs visibles',
          values: 'Valeurs',
          flux: 'Flux',
          tags: 'Tags',
          series_flux: 'Séries flux',
          data: 'Données',
          series_data: 'Séries données',
          unitary: 'Sankey unitaire',
          analysis: 'Graphique d\'analyse'
        },
        // OS#1286 — registre d'unités du diagramme (grandeurs/unités/défauts).
        units: {
          title: 'Unités du diagramme',
          none: '— aucune —',
          type_default: 'défaut',
          open_editor: 'Éditer…',
          open_editor_tooltip: 'Éditer les unités du diagramme (grandeurs, unités, coefficients, défauts)',
          symbol: 'Symbole',
          coefficient: 'Coefficient',
          coefficient_tooltip: 'Valeur de cette unité exprimée dans l\'unité de base de sa grandeur (unité de base = 1). Les valeurs sont stockées dans l\'unité de base.',
          default: 'Défaut',
          default_tooltip: 'Unité d\'affichage par défaut de cette grandeur (héritée par les flux sans unité explicite)',
          add_unit: '+ Unité',
          add_unit_type: '+ Grandeur',
          new_unit_name: 'unité',
          new_unit_type_name: 'Nouvelle grandeur',
          empty: 'Aucune grandeur dans le registre — ajoutez-en une.'
        }
      },
      filter_panel: {
        filter: 'Filtrer',
        select: 'Sélectionner',
        select_tooltip: 'Sélectionner des éléments par type et par tag (opérations groupées)',
        edit: 'Éditer',
        edit_group: 'Éditer ce groupe',
        show_hidden: 'Afficher les groupes cachés ({{count}})',
        hide_hidden: 'Masquer les groupes cachés',
        select_elements: 'Sélectionner des éléments',
        deselect_all: 'Tout désélectionner',
        selection_summary: 'Sélection : {{summary}}',
        short: {
          node: 'Nœuds',
          link: 'Flux',
          data: 'Données',
          level: 'Niveaux',
          views: 'Vues'
        }
      }
    }
  },
  //=======================================================
  //ES
  //=======================================================
  es: {
    translation: {
      inspector: {
        view: 'Vista',
        back_to_selection: 'Volver a la selección',
        pin: 'Fijar el panel (el dibujo se reajusta a su izquierda)',
        unpin: 'Desacoplar el panel (flota sobre el dibujo)',
        target: {
          view: 'Vista',
          node: 'Nodo', nodes: 'nodos',
          link: 'Flujo', links: 'flujos',
          container: 'Zona', containers: 'zonas',
          legend: 'Leyenda', legends: 'leyendas',
          title: 'Título', titles: 'títulos',
          mixed: 'Selección mixta', elements: 'elementos'
        },
        nothing_here: 'Ningún ajuste disponible para: {{target}}.',
        selection: 'Selección',
        selection_count: 'Selección ({{count}})',
        styles_count: 'Estilos ({{count}})',
        cascade: 'Cascada',
        style_name: 'Nombre del estilo',
        new_style: '+ Nuevo estilo',
        delete_style: 'Eliminar',
        delete_style_tooltip: 'Eliminar este estilo (los elementos que lo seguían vuelven al resto de su cascada)',
        attach_style: 'Adjuntar un estilo a la selección (final de la cascada, prioritario)',
        detach_style: 'Separar este estilo de la selección',
        edited_style_hint: 'Edición del estilo resaltado: todos los elementos que lo siguen se modificarán. El último de la cascada gana; una anulación local siempre gana.',
        divergent_cascade: 'Cascada del 1.er elemento — otros elementos seleccionados siguen una cascada diferente. ',
        selection_hint: 'Atributos atenuados: heredados de los estilos (cascada). Borde morado: anulado en la selección. Borde naranja: valores múltiples.',
        tab_overloaded: 'Contiene atributos anulados',
        provenance: {
          local: 'Anulado aquí (en la selección)',
          from_style: 'Heredado del estilo « {{style}} »',
          factory: 'Valor de fábrica'
        },
        tab: {
          stock: 'Stock',
          tooltip: 'Información',
          tags: 'Etiquetas',
          analysis: 'Análisis',
          title: 'Título',
          mfa: 'AFM',
          styles: 'Estilos'
        },
        mfa: {
          reconciliation: 'Conciliación',
          open_spreadsheet: 'Abrir la hoja de cálculo (restricciones)',
          run_reconciliation: 'Conciliar vía Excel…',
          value_in_mfa: 'El tipo de valor, los límites y la incertidumbre se editan en la pestaña AFM.'
        },
        section: {
          page: 'Página',
          dressing: 'Fondo y cuadrícula',
          scale_sizes: 'Escala y tamaños',
          advanced: 'Avanzado',
          advanced_geometry: 'Avanzado — geometría'
        },
        group: {
          title: 'Grupo',
          tooltip: 'Asocia nodos o zonas de texto al elemento seleccionado: el marco se posiciona para abarcar a sus miembros y se desplaza con ellos'
        },
        visible: 'Visible',
        labels_visible: 'Etiquetas visibles',
        stock_enabled: 'Activado',
        stock_shape: 'Forma',
        stock_shape_tooltip: 'Mostrar la forma de stock',
        stock_labels: 'Etiquetas',
        stock_labels_tooltip: 'Mostrar las etiquetas de stock',
        stock_shape_visible: 'Forma de stock visible',
        stock_select_node: 'Seleccione un nodo que lleve un stock.',
        stock_caption: 'Etiqueta de stock',
        stock_delta_caption: 'Etiqueta Δ stock',
        advanced_editor: 'Editor avanzado…',
        open_editor: 'Abrir el editor…',
        tags_assign_hint: 'Asignación (los grupos se editan en Filtros)',
        // OS#1278 — sección « Análisis » (gráficos anillo / histograma).
        analysis: {
          decompose_by: 'Descomponer por',
          compare_by: 'Comparar según',
          none: '— ninguna —',
          inputs: 'Flujos entrantes',
          outputs: 'Flujos salientes',
          inputs_by: 'Flujos entrantes por {{group}}',
          outputs_by: 'Flujos salientes por {{group}}',
          node_children: 'Nodos hijos ({{dim}})',
          flux_children: 'Flujos hijos ({{dim}})',
          repr_auto: 'Auto',
          repr_donut: 'Anillo',
          repr_bars: 'Barras',
          show_in_tooltip: 'Mostrar en el tooltip',
          show_on_node: 'Mostrar en el nodo (anillo / histograma)',
          select_subject: 'Seleccione un nodo o un flujo.'
        },
        // OS#1285 — visibilidad de los bloques del tooltip.
        tooltip_blocks: {
          title: 'Bloques visibles',
          values: 'Valores',
          flux: 'Flujo',
          tags: 'Etiquetas',
          series_flux: 'Series de flujo',
          data: 'Datos',
          series_data: 'Series de datos',
          unitary: 'Sankey unitario',
          analysis: 'Gráfico de análisis'
        },
        // OS#1286 — registro de unidades del diagrama.
        units: {
          title: 'Unidades del diagrama',
          none: '— ninguna —',
          type_default: 'por defecto',
          open_editor: 'Editar…',
          open_editor_tooltip: 'Editar las unidades del diagrama (magnitudes, unidades, coeficientes, valores por defecto)',
          symbol: 'Símbolo',
          coefficient: 'Coeficiente',
          coefficient_tooltip: 'Valor de esta unidad expresado en la unidad base de su magnitud (unidad base = 1). Los valores se almacenan en la unidad base.',
          default: 'Por defecto',
          default_tooltip: 'Unidad de visualización por defecto de esta magnitud (heredada por los flujos sin unidad explícita)',
          add_unit: '+ Unidad',
          add_unit_type: '+ Magnitud',
          new_unit_name: 'unidad',
          new_unit_type_name: 'Nueva magnitud',
          empty: 'Ninguna magnitud en el registro — añada una.'
        }
      },
      filter_panel: {
        filter: 'Filtrar',
        select: 'Seleccionar',
        select_tooltip: 'Seleccionar elementos por tipo y etiqueta (operaciones en grupo)',
        edit: 'Editar',
        edit_group: 'Editar este grupo',
        show_hidden: 'Mostrar grupos ocultos ({{count}})',
        hide_hidden: 'Ocultar grupos ocultos',
        select_elements: 'Seleccionar elementos',
        deselect_all: 'Deseleccionar todo',
        selection_summary: 'Selección: {{summary}}',
        short: {
          node: 'Nodos',
          link: 'Flujos',
          data: 'Datos',
          level: 'Niveles',
          views: 'Vistas'
        }
      }
    }
  },
  //=======================================================
  //DE
  //=======================================================
  de: {
    translation: {
      inspector: {
        view: 'Ansicht',
        back_to_selection: 'Zurück zur Auswahl',
        pin: 'Panel anheften (die Zeichnung wird links davon neu angepasst)',
        unpin: 'Panel lösen (schwebt über der Zeichnung)',
        target: {
          view: 'Ansicht',
          node: 'Knoten', nodes: 'Knoten',
          link: 'Fluss', links: 'Flüsse',
          container: 'Bereich', containers: 'Bereiche',
          legend: 'Legende', legends: 'Legenden',
          title: 'Titel', titles: 'Titel',
          mixed: 'Gemischte Auswahl', elements: 'Elemente'
        },
        nothing_here: 'Keine Einstellungen verfügbar für: {{target}}.',
        selection: 'Auswahl',
        selection_count: 'Auswahl ({{count}})',
        styles_count: 'Stile ({{count}})',
        cascade: 'Kaskade',
        style_name: 'Name des Stils',
        new_style: '+ Neuer Stil',
        delete_style: 'Löschen',
        delete_style_tooltip: 'Diesen Stil löschen (Elemente, die ihm folgten, fallen auf den Rest ihrer Kaskade zurück)',
        attach_style: 'Einen Stil an die Auswahl anhängen (Ende der Kaskade, hat Vorrang)',
        detach_style: 'Diesen Stil von der Auswahl lösen',
        edited_style_hint: 'Bearbeitung des hervorgehobenen Stils: alle Elemente, die ihm folgen, werden geändert. Der letzte der Kaskade gewinnt; eine lokale Überschreibung gewinnt immer.',
        divergent_cascade: 'Kaskade des 1. Elements — andere ausgewählte Elemente folgen einer anderen Kaskade. ',
        selection_hint: 'Abgeblendete Attribute: von den Stilen geerbt (Kaskade). Violetter Rahmen: in der Auswahl überschrieben. Oranger Rahmen: mehrere Werte.',
        tab_overloaded: 'Enthält überschriebene Attribute',
        provenance: {
          local: 'Hier überschrieben (in der Auswahl)',
          from_style: 'Vom Stil « {{style}} » geerbt',
          factory: 'Werkseinstellung'
        },
        tab: {
          stock: 'Bestand',
          tooltip: 'Tooltip',
          tags: 'Tags',
          analysis: 'Analyse',
          title: 'Titel',
          mfa: 'MFA',
          styles: 'Stile'
        },
        mfa: {
          reconciliation: 'Abgleich',
          open_spreadsheet: 'Tabelle öffnen (Nebenbedingungen)',
          run_reconciliation: 'Abgleich über Excel…',
          value_in_mfa: 'Werttyp, Grenzen und Unsicherheit werden im MFA-Tab bearbeitet.'
        },
        section: {
          page: 'Seite',
          dressing: 'Hintergrund & Raster',
          scale_sizes: 'Maßstab & Größen',
          advanced: 'Erweitert',
          advanced_geometry: 'Erweitert — Geometrie'
        },
        group: {
          title: 'Gruppe',
          tooltip: 'Verknüpft Knoten oder Textzonen mit dem ausgewählten Element: der Rahmen umschließt seine Mitglieder und bewegt sich mit ihnen'
        },
        visible: 'Sichtbar',
        labels_visible: 'Beschriftungen sichtbar',
        stock_enabled: 'Aktiviert',
        stock_shape: 'Form',
        stock_shape_tooltip: 'Die Bestandsform anzeigen',
        stock_labels: 'Beschriftungen',
        stock_labels_tooltip: 'Die Bestandsbeschriftungen anzeigen',
        stock_shape_visible: 'Bestandsform sichtbar',
        stock_select_node: 'Wählen Sie einen Knoten mit Bestand.',
        stock_caption: 'Bestandsbeschriftung',
        stock_delta_caption: 'Δ-Bestandsbeschriftung',
        advanced_editor: 'Erweiterter Editor…',
        open_editor: 'Editor öffnen…',
        tags_assign_hint: 'Zuweisung (Gruppen werden in Filter bearbeitet)',
        // OS#1278 — Abschnitt „Analyse“ (Ring- / Histogramm-Diagramme).
        analysis: {
          decompose_by: 'Zerlegen nach',
          compare_by: 'Vergleichen über',
          none: '— keine —',
          inputs: 'Eingehende Flüsse',
          outputs: 'Ausgehende Flüsse',
          inputs_by: 'Eingehende Flüsse nach {{group}}',
          outputs_by: 'Ausgehende Flüsse nach {{group}}',
          node_children: 'Kindknoten ({{dim}})',
          flux_children: 'Kindflüsse ({{dim}})',
          repr_auto: 'Auto',
          repr_donut: 'Ring',
          repr_bars: 'Balken',
          show_in_tooltip: 'Im Tooltip anzeigen',
          show_on_node: 'Am Knoten anzeigen (Ring / Histogramm)',
          select_subject: 'Wählen Sie einen Knoten oder einen Fluss.'
        },
        // OS#1285 — Sichtbarkeit der Tooltip-Blöcke.
        tooltip_blocks: {
          title: 'Sichtbare Blöcke',
          values: 'Werte',
          flux: 'Fluss',
          tags: 'Tags',
          series_flux: 'Fluss-Serien',
          data: 'Daten',
          series_data: 'Daten-Serien',
          unitary: 'Einheits-Sankey',
          analysis: 'Analysediagramm'
        },
        // OS#1286 — Einheitenregister des Diagramms.
        units: {
          title: 'Einheiten des Diagramms',
          none: '— keine —',
          type_default: 'Standard',
          open_editor: 'Bearbeiten…',
          open_editor_tooltip: 'Einheiten des Diagramms bearbeiten (Größen, Einheiten, Koeffizienten, Standards)',
          symbol: 'Symbol',
          coefficient: 'Koeffizient',
          coefficient_tooltip: 'Wert dieser Einheit in der Basiseinheit ihrer Größe (Basiseinheit = 1). Werte werden in der Basiseinheit gespeichert.',
          default: 'Standard',
          default_tooltip: 'Standard-Anzeigeeinheit dieser Größe (von Flüssen ohne explizite Einheit geerbt)',
          add_unit: '+ Einheit',
          add_unit_type: '+ Größe',
          new_unit_name: 'Einheit',
          new_unit_type_name: 'Neue Größe',
          empty: 'Keine Größe im Register — fügen Sie eine hinzu.'
        }
      },
      filter_panel: {
        filter: 'Filtern',
        select: 'Auswählen',
        select_tooltip: 'Elemente nach Typ und Tag auswählen (Sammelvorgänge)',
        edit: 'Bearbeiten',
        edit_group: 'Diese Gruppe bearbeiten',
        show_hidden: 'Ausgeblendete Gruppen anzeigen ({{count}})',
        hide_hidden: 'Ausgeblendete Gruppen verbergen',
        select_elements: 'Elemente auswählen',
        deselect_all: 'Auswahl aufheben',
        selection_summary: 'Auswahl: {{summary}}',
        short: {
          node: 'Knoten',
          link: 'Flüsse',
          data: 'Daten',
          level: 'Ebenen',
          views: 'Ansichten'
        }
      }
    }
  },
  //=======================================================
  //IT
  //=======================================================
  it: {
    translation: {
      inspector: {
        view: 'Vista',
        back_to_selection: 'Torna alla selezione',
        pin: 'Fissa il pannello (il disegno si ridimensiona alla sua sinistra)',
        unpin: 'Sgancia il pannello (fluttua sopra il disegno)',
        target: {
          view: 'Vista',
          node: 'Nodo', nodes: 'nodi',
          link: 'Flusso', links: 'flussi',
          container: 'Zona', containers: 'zone',
          legend: 'Legenda', legends: 'legende',
          title: 'Titolo', titles: 'titoli',
          mixed: 'Selezione mista', elements: 'elementi'
        },
        nothing_here: 'Nessuna impostazione disponibile per: {{target}}.',
        selection: 'Selezione',
        selection_count: 'Selezione ({{count}})',
        styles_count: 'Stili ({{count}})',
        cascade: 'Cascata',
        style_name: 'Nome dello stile',
        new_style: '+ Nuovo stile',
        delete_style: 'Elimina',
        delete_style_tooltip: 'Eliminare questo stile (gli elementi che lo seguivano ricadono sul resto della loro cascata)',
        attach_style: 'Allegare uno stile alla selezione (fine della cascata, prioritario)',
        detach_style: 'Staccare questo stile dalla selezione',
        edited_style_hint: 'Modifica dello stile evidenziato: tutti gli elementi che lo seguono saranno modificati. L’ultimo della cascata vince; una sovrascrittura locale vince sempre.',
        divergent_cascade: 'Cascata del 1º elemento — altri elementi selezionati seguono una cascata diversa. ',
        selection_hint: 'Attributi attenuati: ereditati dagli stili (cascata). Bordo viola: sovrascritto sulla selezione. Bordo arancione: valori multipli.',
        tab_overloaded: 'Contiene attributi sovrascritti',
        provenance: {
          local: 'Sovrascritto qui (sulla selezione)',
          from_style: 'Ereditato dallo stile « {{style}} »',
          factory: 'Valore di fabbrica'
        },
        tab: {
          stock: 'Stock',
          tooltip: 'Tooltip',
          tags: 'Tag',
          analysis: 'Analisi',
          title: 'Titolo',
          mfa: 'AFM',
          styles: 'Stili'
        },
        mfa: {
          reconciliation: 'Riconciliazione',
          open_spreadsheet: 'Aprire il foglio di calcolo (vincoli)',
          run_reconciliation: 'Riconciliare via Excel…',
          value_in_mfa: 'Tipo di valore, limiti e incertezza si modificano nella scheda AFM.'
        },
        section: {
          page: 'Pagina',
          dressing: 'Sfondo e griglia',
          scale_sizes: 'Scala e dimensioni',
          advanced: 'Avanzate',
          advanced_geometry: 'Avanzate — geometria'
        },
        group: {
          title: 'Gruppo',
          tooltip: 'Associa nodi o zone di testo all’elemento selezionato: la cornice si posiziona per racchiudere i suoi membri e si sposta con essi'
        },
        visible: 'Visibile',
        labels_visible: 'Etichette visibili',
        stock_enabled: 'Attivato',
        stock_shape: 'Forma',
        stock_shape_tooltip: 'Mostrare la forma di stock',
        stock_labels: 'Etichette',
        stock_labels_tooltip: 'Mostrare le etichette di stock',
        stock_shape_visible: 'Forma di stock visibile',
        stock_select_node: 'Selezionare un nodo con uno stock.',
        stock_caption: 'Etichetta stock',
        stock_delta_caption: 'Etichetta Δ stock',
        advanced_editor: 'Editor avanzato…',
        open_editor: 'Aprire l’editor…',
        tags_assign_hint: 'Assegnazione (i gruppi si modificano in Filtri)',
        // OS#1278 — sezione « Analisi » (grafici anello / istogramma).
        analysis: {
          decompose_by: 'Scomporre per',
          compare_by: 'Confrontare per',
          none: '— nessuna —',
          inputs: 'Flussi entranti',
          outputs: 'Flussi uscenti',
          inputs_by: 'Flussi entranti per {{group}}',
          outputs_by: 'Flussi uscenti per {{group}}',
          node_children: 'Nodi figli ({{dim}})',
          flux_children: 'Flussi figli ({{dim}})',
          repr_auto: 'Auto',
          repr_donut: 'Anello',
          repr_bars: 'Barre',
          show_in_tooltip: 'Mostra nel tooltip',
          show_on_node: 'Mostra sul nodo (anello / istogramma)',
          select_subject: 'Seleziona un nodo o un flusso.'
        },
        // OS#1285 — visibilità dei blocchi del tooltip.
        tooltip_blocks: {
          title: 'Blocchi visibili',
          values: 'Valori',
          flux: 'Flusso',
          tags: 'Tag',
          series_flux: 'Serie di flusso',
          data: 'Dati',
          series_data: 'Serie di dati',
          unitary: 'Sankey unitario',
          analysis: 'Grafico di analisi'
        },
        // OS#1286 — registro delle unità del diagramma.
        units: {
          title: 'Unità del diagramma',
          none: '— nessuna —',
          type_default: 'predefinita',
          open_editor: 'Modifica…',
          open_editor_tooltip: 'Modificare le unità del diagramma (grandezze, unità, coefficienti, predefinite)',
          symbol: 'Simbolo',
          coefficient: 'Coefficiente',
          coefficient_tooltip: 'Valore di questa unità espresso nell\'unità base della sua grandezza (unità base = 1). I valori sono memorizzati nell\'unità base.',
          default: 'Predefinita',
          default_tooltip: 'Unità di visualizzazione predefinita di questa grandezza (ereditata dai flussi senza unità esplicita)',
          add_unit: '+ Unità',
          add_unit_type: '+ Grandezza',
          new_unit_name: 'unità',
          new_unit_type_name: 'Nuova grandezza',
          empty: 'Nessuna grandezza nel registro — aggiungine una.'
        }
      },
      filter_panel: {
        filter: 'Filtrare',
        select: 'Selezionare',
        select_tooltip: 'Selezionare elementi per tipo e tag (operazioni di gruppo)',
        edit: 'Modificare',
        edit_group: 'Modificare questo gruppo',
        show_hidden: 'Mostra gruppi nascosti ({{count}})',
        hide_hidden: 'Nascondi gruppi nascosti',
        select_elements: 'Selezionare elementi',
        deselect_all: 'Deselezionare tutto',
        selection_summary: 'Selezione: {{summary}}',
        short: {
          node: 'Nodi',
          link: 'Flussi',
          data: 'Dati',
          level: 'Livelli',
          views: 'Viste'
        }
      }
    }
  }
}
