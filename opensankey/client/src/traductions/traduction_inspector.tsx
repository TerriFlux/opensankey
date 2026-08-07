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
          compare_by_secondary: 'Then across (series)',
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
          scale: 'Scale',
          scale_auto: 'Auto',
          scale_shared: 'Shared',
          scale_per_group: 'Per cluster',
          scale_auto_hint: 'Shared scale, unless a cluster becomes unreadable',
          scale_shared_hint: 'One scale for the whole chart',
          scale_per_group_hint: 'One scale per cluster — a cluster is one label of “Compare across”',
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
          display_name: 'Label',
          display_name_tooltip: 'Text actually written on the diagram for this unit. Empty: the canonical symbol is used. Lets a diagram say “tonnes” while still referring to the catalogue unit t — conversions are unaffected.',
          coefficient: 'Coefficient',
          coefficient_tooltip: 'Value of this unit expressed in the base unit of its quantity (base unit = 1). Values are stored in the base unit.',
          display_scale: 'Scale',
          display_scale_tooltip: 'Display scale specific to this quantity (like e!Sankey): base-unit amount shown over 100 px for unit-type bands. Empty: use the diagram scale. Lets you balance different quantities (kWh vs t vs EUR) on the same flow.',
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
          compare_by_secondary: 'Puis selon (séries)',
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
          scale: 'Échelle',
          scale_auto: 'Auto',
          scale_shared: 'Partagée',
          scale_per_group: 'Par grappe',
          scale_auto_hint: 'Échelle partagée, sauf si une grappe y devient illisible',
          scale_shared_hint: 'Une seule échelle pour tout le graphique',
          scale_per_group_hint: 'Une échelle par grappe — une grappe = une étiquette de « Comparer selon »',
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
          display_name: 'Libellé',
          display_name_tooltip: 'Texte réellement écrit sur le diagramme pour cette unité. Vide : le symbole canonique est utilisé. Permet à un diagramme de dire « tonnes » tout en référençant l’unité t du catalogue — les conversions sont inchangées.',
          coefficient: 'Coefficient',
          coefficient_tooltip: 'Valeur de cette unité exprimée dans l\'unité de base de sa grandeur (unité de base = 1). Les valeurs sont stockées dans l\'unité de base.',
          display_scale: 'Échelle',
          display_scale_tooltip: 'Échelle d\'affichage propre à la grandeur (façon e!Sankey) : quantité en unité de base affichée sur 100 px pour les bandes « de type unité ». Vide : échelle du dessin. Permet d\'équilibrer des grandeurs différentes (kWh vs t vs €) sur un même flux.',
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
          compare_by_secondary: 'Luego según (series)',
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
          scale: 'Escala',
          scale_auto: 'Auto',
          scale_shared: 'Compartida',
          scale_per_group: 'Por grupo',
          scale_auto_hint: 'Escala compartida, salvo si un grupo se vuelve ilegible',
          scale_shared_hint: 'Una sola escala para todo el gráfico',
          scale_per_group_hint: 'Una escala por grupo — un grupo es una etiqueta de «Comparar según»',
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
          display_name: 'Etiqueta',
          display_name_tooltip: 'Texto escrito realmente en el diagrama para esta unidad. Vacío: se usa el símbolo canónico. Permite que un diagrama diga « toneladas » sin dejar de referirse a la unidad t del catálogo; las conversiones no cambian.',
          coefficient: 'Coeficiente',
          coefficient_tooltip: 'Valor de esta unidad expresado en la unidad base de su magnitud (unidad base = 1). Los valores se almacenan en la unidad base.',
          display_scale: 'Escala',
          display_scale_tooltip: 'Escala de visualización propia de la magnitud (como e!Sankey): cantidad en unidad base mostrada sobre 100 px para las bandas de tipo unidad. Vacío: escala del diagrama. Permite equilibrar magnitudes diferentes (kWh vs t vs €) en un mismo flujo.',
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
          compare_by_secondary: 'Dann über (Reihen)',
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
          scale: 'Skala',
          scale_auto: 'Auto',
          scale_shared: 'Gemeinsam',
          scale_per_group: 'Pro Gruppe',
          scale_auto_hint: 'Gemeinsamer Maßstab, außer wenn eine Gruppe unlesbar wird',
          scale_shared_hint: 'Ein einziger Maßstab für das ganze Diagramm',
          scale_per_group_hint: 'Ein Maßstab je Gruppe — eine Gruppe ist ein Label von „Vergleichen über“',
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
          display_name: 'Bezeichnung',
          display_name_tooltip: 'Text, der für diese Einheit tatsächlich im Diagramm steht. Leer: das kanonische Symbol wird verwendet. So kann ein Diagramm „Tonnen“ schreiben und trotzdem die Katalogeinheit t referenzieren — Umrechnungen bleiben unverändert.',
          coefficient: 'Koeffizient',
          coefficient_tooltip: 'Wert dieser Einheit in der Basiseinheit ihrer Größe (Basiseinheit = 1). Werte werden in der Basiseinheit gespeichert.',
          display_scale: 'Skala',
          display_scale_tooltip: 'Anzeigeskala der Größe (wie e!Sankey): Menge in der Basiseinheit auf 100 px für Einheitentyp-Bänder. Leer: Diagrammskala. Erlaubt das Ausbalancieren verschiedener Größen (kWh vs t vs €) auf demselben Fluss.',
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
          compare_by_secondary: 'Poi per (serie)',
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
          scale: 'Scala',
          scale_auto: 'Auto',
          scale_shared: 'Condivisa',
          scale_per_group: 'Per gruppo',
          scale_auto_hint: 'Scala condivisa, salvo se un gruppo diventa illeggibile',
          scale_shared_hint: 'Una sola scala per tutto il grafico',
          scale_per_group_hint: 'Una scala per gruppo — un gruppo è un’etichetta di «Confrontare per»',
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
          display_name: 'Etichetta',
          display_name_tooltip: 'Testo effettivamente scritto sul diagramma per questa unità. Vuoto: si usa il simbolo canonico. Permette a un diagramma di dire « tonnellate » pur riferendosi all’unità t del catalogo: le conversioni non cambiano.',
          coefficient: 'Coefficiente',
          coefficient_tooltip: 'Valore di questa unità espresso nell\'unità base della sua grandezza (unità base = 1). I valori sono memorizzati nell\'unità base.',
          display_scale: 'Scala',
          display_scale_tooltip: 'Scala di visualizzazione propria della grandezza (come e!Sankey): quantità in unità base mostrata su 100 px per le bande di tipo unità. Vuoto: scala del diagramma. Permette di bilanciare grandezze diverse (kWh vs t vs €) sullo stesso flusso.',
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
  },
  'zh-CN': {
    translation: {
      inspector: {
        view: '视图',
        back_to_selection: '返回所选内容',
        pin: '固定面板（绘图区在其左侧重新调整大小）',
        unpin: '取消固定面板（浮于绘图之上）',
        // Cibles : singulier / pluriel (fil d'Ariane).
        target: {
          view: '视图',
          node: '节点', nodes: '节点',
          link: '流量', links: '流量',
          container: '区域', containers: '区域',
          legend: '图例', legends: '图例',
          title: '标题', titles: '标题',
          mixed: '混合选择', elements: '元素'
        },
        nothing_here: '没有可用于以下对象的设置：{{target}}。',
        // Portée & cascade de styles
        selection: '选择',
        selection_count: '选择（{{count}}）',
        styles_count: '样式（{{count}}）',
        cascade: '层叠',
        style_name: '样式名称',
        new_style: '+ 新建样式',
        delete_style: '删除',
        delete_style_tooltip: '删除该样式（沿用它的元素将回退到其层叠中的其余样式）',
        attach_style: '为所选内容附加一个样式（位于层叠末端，优先生效）',
        detach_style: '将该样式从所选内容中分离',
        edited_style_hint: '正在编辑高亮的样式：所有沿用它的元素都会随之改变。层叠中最后一个优先；局部覆盖始终优先。',
        divergent_cascade: '第 1 个元素的层叠——其他被选中的元素遵循不同的层叠。 ',
        selection_hint: '变暗的属性：继承自样式（层叠）。紫色轮廓：在所选内容上被覆盖。橙色轮廓：存在多个值。',
        tab_overloaded: '包含被覆盖的属性',
        provenance: {
          local: '在此处（所选内容上）被覆盖',
          from_style: '继承自样式 « {{style}} »',
          factory: '出厂默认值'
        },
        // Onglets
        tab: {
          stock: '存量',
          tooltip: '提示框',
          tags: '标签',
          analysis: '分析',
          title: '标题',
          mfa: 'MFA',
          styles: '样式'
        },
        // #1258 — Onglet MFA (espace AFM unifié).
        mfa: {
          reconciliation: '数据调和',
          open_spreadsheet: '打开电子表格（约束）',
          run_reconciliation: '通过 Excel 调和……',
          value_in_mfa: '数值类型、界限与不确定性在 MFA 选项卡中编辑。'
        },
        // #1258 — Titres des sections repliables des onglets.
        section: {
          page: '页面',
          dressing: '背景与网格',
          scale_sizes: '比例尺与尺寸',
          advanced: '高级',
          advanced_geometry: '高级 — 几何'
        },
        // #1259 — Section « Groupe » unifiée (ex-« Cadre géométrique » ZDT + nœuds).
        group: {
          title: '组',
          tooltip: '将节点或文本区附加到所选元素：框体会自动定位以包围其成员，并随其移动'
        },
        visible: '可见',
        labels_visible: '标签可见',
        stock_enabled: '已启用',
        stock_shape: '形状',
        stock_shape_tooltip: '显示存量形状',
        stock_labels: '标签',
        stock_labels_tooltip: '显示存量标签',
        stock_shape_visible: '存量形状可见',
        stock_select_node: '请选择一个带有存量的节点。',
        stock_caption: '存量说明',
        stock_delta_caption: 'Δ 存量说明',
        advanced_editor: '高级编辑器……',
        open_editor: '打开编辑器……',
        tags_assign_hint: '指派（标签组在“筛选”中编辑）',
        // OS#1278 — section « Analyse » (graphiques couronne / histogramme).
        analysis: {
          decompose_by: '按此分解',
          compare_by: '按此比较',
          compare_by_secondary: '再按此比较（系列）',
          none: '— 无 —',
          inputs: '进入的流量',
          outputs: '流出的流量',
          inputs_by: '按 {{group}} 划分的进入流量',
          outputs_by: '按 {{group}} 划分的流出流量',
          node_children: '子节点（{{dim}}）',
          flux_children: '子流量（{{dim}}）',
          repr_auto: '自动',
          repr_donut: '环形图',
          repr_bars: '条形图',
          scale: '刻度',
          scale_auto: '自动',
          scale_shared: '共享',
          scale_per_group: '按组',
          scale_auto_hint: '共享刻度，除非某一组变得不可读',
          scale_shared_hint: '整个图表使用同一刻度',
          scale_per_group_hint: '每组一个刻度——一组即“按此比较”的一个标签',
          show_in_tooltip: '在提示框中显示',
          show_on_node: '在节点上显示（环形图 / 直方图）',
          select_subject: '请选择一个节点或一条流量。'
        },
        // OS#1285 — visibilité des blocs d'info-bulle.
        tooltip_blocks: {
          title: '可见区块',
          values: '数值',
          flux: '流量',
          tags: '标签',
          series_flux: '流量序列',
          data: '数据',
          series_data: '数据序列',
          unitary: '单位桑基图',
          analysis: '分析图表'
        },
        // OS#1286 — registre d'unités du diagramme (grandeurs/unités/défauts).
        units: {
          title: '图表单位',
          none: '— 无 —',
          type_default: '默认',
          open_editor: '编辑……',
          open_editor_tooltip: '编辑图表的单位（量纲、单位、系数、默认值）',
          symbol: '符号',
          display_name: '显示名称',
          display_name_tooltip: '图中实际书写的单位文本。留空则使用规范符号。可让图表写作“吨”，同时仍引用目录单位 t，换算不受影响。',
          coefficient: '系数',
          coefficient_tooltip: '该单位以其量纲基准单位表示的数值（基准单位 = 1）。数值以基准单位存储。',
          display_scale: '比例尺',
          display_scale_tooltip: '该量纲专用的显示比例尺（类似 e!Sankey）：单位类型分带每 100 px 所代表的基准单位量。留空：使用图表比例尺。可在同一条流量上平衡不同量纲（kWh、t 与 EUR）。',
          default: '默认',
          default_tooltip: '该量纲的默认显示单位（未显式指定单位的流量将继承它）',
          add_unit: '+ 单位',
          add_unit_type: '+ 量纲',
          new_unit_name: '单位',
          new_unit_type_name: '新建量纲',
          empty: '注册表中没有量纲——请添加一个。'
        }
      },
      filter_panel: {
        filter: '筛选',
        select: '选择',
        select_tooltip: '按类型与标签选择元素（批量操作）',
        edit: '编辑',
        edit_group: '编辑该组',
        show_hidden: '显示隐藏的组（{{count}}）',
        hide_hidden: '隐藏“隐藏的组”',
        select_elements: '选择元素',
        deselect_all: '取消全选',
        selection_summary: '所选：{{summary}}',
        short: {
          node: '节点',
          link: '流量',
          data: '数据',
          level: '层级',
          views: '视图'
        }
      }
    }
  },
  ja: {
    translation: {
      inspector: {
        view: 'ビュー',
        back_to_selection: '選択に戻る',
        pin: 'パネルを固定（描画エリアがその左側でサイズ調整されます）',
        unpin: 'パネルの固定を解除（描画の上に浮かびます）',
        // Cibles : singulier / pluriel (fil d'Ariane).
        target: {
          view: 'ビュー',
          node: 'ノード', nodes: 'ノード',
          link: 'フロー', links: 'フロー',
          container: 'エリア', containers: 'エリア',
          legend: '凡例', legends: '凡例',
          title: 'タイトル', titles: 'タイトル',
          mixed: '複数種類の選択', elements: '要素'
        },
        nothing_here: '{{target}} に利用できる設定はありません。',
        // Portée & cascade de styles
        selection: '選択',
        selection_count: '選択（{{count}}）',
        styles_count: 'スタイル（{{count}}）',
        cascade: 'カスケード',
        style_name: 'スタイル名',
        new_style: '+ 新しいスタイル',
        delete_style: '削除',
        delete_style_tooltip: 'このスタイルを削除します（これに従っている要素は、カスケードの残りのスタイルに戻ります）',
        attach_style: '選択中の要素にスタイルを付与します（カスケードの末尾で、最も優先されます）',
        detach_style: 'このスタイルを選択中の要素から外します',
        edited_style_hint: '強調表示されたスタイルを編集しています：これに従うすべての要素が変わります。カスケードの最後が優先され、個別の上書きは常に優先されます。',
        divergent_cascade: '1 番目の要素のカスケード — 選択中の他の要素は別のカスケードに従っています。 ',
        selection_hint: '薄い属性：スタイル（カスケード）から継承。紫の枠：選択中の要素で上書き。オレンジの枠：値が複数あります。',
        tab_overloaded: '上書きされた属性を含みます',
        provenance: {
          local: 'ここで上書き（選択中の要素で）',
          from_style: 'スタイル «{{style}}» から継承',
          factory: '工場出荷時の既定値'
        },
        // Onglets
        tab: {
          stock: 'ストック',
          tooltip: 'ツールチップ',
          tags: 'タグ',
          analysis: '分析',
          title: 'タイトル',
          mfa: 'MFA',
          styles: 'スタイル'
        },
        // #1258 — Onglet MFA (espace AFM unifié).
        mfa: {
          reconciliation: 'データ調和',
          open_spreadsheet: 'スプレッドシートを開く（制約）',
          run_reconciliation: 'Excel で調和…',
          value_in_mfa: '値の種類、範囲、不確実性は MFA タブで編集します。'
        },
        // #1258 — Titres des sections repliables des onglets.
        section: {
          page: 'ページ',
          dressing: '背景とグリッド',
          scale_sizes: 'スケールとサイズ',
          advanced: '詳細設定',
          advanced_geometry: '詳細 — 配置'
        },
        // #1259 — Section « Groupe » unifiée (ex-« Cadre géométrique » ZDT + nœuds).
        group: {
          title: 'グループ',
          tooltip: '選択中の要素にノードやテキストエリアを紐づけます：枠はメンバーを囲む位置に配置され、メンバーとともに移動します'
        },
        visible: '表示',
        labels_visible: 'ラベルを表示',
        stock_enabled: '有効',
        stock_shape: '形状',
        stock_shape_tooltip: 'ストックの形状を表示します',
        stock_labels: 'ラベル',
        stock_labels_tooltip: 'ストックのラベルを表示します',
        stock_shape_visible: 'ストックの形状を表示',
        stock_select_node: 'ストックを持つノードを選択してください。',
        stock_caption: 'ストックの説明',
        stock_delta_caption: 'Δ ストックの説明',
        advanced_editor: '詳細エディタ…',
        open_editor: 'エディタを開く…',
        tags_assign_hint: '割り当て（グループは「絞り込み」で編集します）',
        // OS#1278 — section « Analyse » (graphiques couronne / histogramme).
        analysis: {
          decompose_by: '分解の軸',
          compare_by: '比較の軸',
          compare_by_secondary: '第2の比較の軸（系列）',
          none: '— なし —',
          inputs: '入ってくるフロー',
          outputs: '出ていくフロー',
          inputs_by: '{{group}} 別の入ってくるフロー',
          outputs_by: '{{group}} 別の出ていくフロー',
          node_children: '子ノード（{{dim}}）',
          flux_children: '子フロー（{{dim}}）',
          repr_auto: '自動',
          repr_donut: 'ドーナツ',
          repr_bars: '棒',
          scale: 'スケール',
          scale_auto: '自動',
          scale_shared: '共通',
          scale_per_group: 'グループごと',
          scale_auto_hint: '共通スケール、ただしグループが読めなくなる場合を除く',
          scale_shared_hint: 'グラフ全体で 1 つのスケール',
          scale_per_group_hint: 'グループごとに 1 スケール — グループは「比較の軸」の 1 ラベル',
          show_in_tooltip: 'ツールチップに表示',
          show_on_node: 'ノード上に表示（ドーナツ／ヒストグラム）',
          select_subject: 'ノードまたはフローを選択してください。'
        },
        // OS#1285 — visibilité des blocs d'info-bulle.
        tooltip_blocks: {
          title: '表示するブロック',
          values: '値',
          flux: 'フロー',
          tags: 'タグ',
          series_flux: 'フローの系列',
          data: 'データ',
          series_data: 'データの系列',
          unitary: '単位サンキー',
          analysis: '分析チャート'
        },
        // OS#1286 — registre d'unités du diagramme (grandeurs/unités/défauts).
        units: {
          title: '図の単位',
          none: '— なし —',
          type_default: '既定',
          open_editor: '編集…',
          open_editor_tooltip: '図の単位を編集します（物理量、単位、係数、既定値）',
          symbol: '記号',
          display_name: '表示名',
          display_name_tooltip: 'この単位について図上に実際に書かれる文字列。空の場合は正規の記号を使います。目録の単位 t を参照したまま「トン」と表示でき、換算は変わりません。',
          coefficient: '係数',
          coefficient_tooltip: 'この単位を、その物理量の基準単位で表した値（基準単位 = 1）。値は基準単位で保存されます。',
          display_scale: 'スケール',
          display_scale_tooltip: 'この物理量専用の表示スケール（e!Sankey と同様）：単位型の帯について、100 px あたりに相当する基準単位の量です。空欄：図のスケールを使います。同じフロー上で異なる物理量（kWh、t、EUR）のバランスをとれます。',
          default: '既定',
          default_tooltip: 'この物理量の既定の表示単位（単位を明示していないフローが継承します）',
          add_unit: '+ 単位',
          add_unit_type: '+ 物理量',
          new_unit_name: '単位',
          new_unit_type_name: '新しい物理量',
          empty: 'レジストリに物理量がありません — 追加してください。'
        }
      },
      filter_panel: {
        filter: '絞り込み',
        select: '選択',
        select_tooltip: '種類とタグで要素を選択します（一括操作）',
        edit: '編集',
        edit_group: 'このグループを編集',
        show_hidden: '非表示のグループを表示（{{count}}）',
        hide_hidden: '非表示のグループを隠す',
        select_elements: '要素を選択',
        deselect_all: '選択をすべて解除',
        selection_summary: '選択：{{summary}}',
        short: {
          node: 'ノード',
          link: 'フロー',
          data: 'データ',
          level: 'レベル',
          views: 'ビュー'
        }
      }
    }
  }
}
